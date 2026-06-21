const fs = require('fs');
const path = require('path');

describe('EcoPledges Module', () => {
  beforeEach(() => {
    jest.resetModules();

    // Reset localstorage mock values
    localStorage.clear();
    localStorage.setItem(
      'eco_pledges_stars',
      JSON.stringify([
        {
          text: 'Local storage pledge',
          category: 'energy',
          x: 50,
          y: 50,
          vx: 0.1,
          vy: 0.1,
          size: 5,
        },
      ])
    );

    // Construct DOM structure expected by pledges.js
    document.body.innerHTML = `
      <div id="pledges-section">
        <div>
          <canvas id="pledge-canvas"></canvas>
        </div>
        <input id="pledge-input" value="Clean energy today!" />
        <button id="btn-submit-pledge">Submit</button>
        
        <button class="pledge-cat-btn active" data-cat="energy">Energy</button>
        <button class="pledge-cat-btn" data-cat="diet">Diet</button>

        <span id="pledges-counter-val"></span>
        <span id="pledges-co2-val"></span>
      </div>
    `;

    // Mock App
    global.App = {
      showToast: jest.fn(),
      fireConfetti: jest.fn(),
    };

    // Mock EcoDb
    global.EcoDb = {
      firebaseEnabled: true,
      syncPledges: jest.fn(cb => {
        // Trigger callback immediately with a list of mock pledges
        cb([
          { text: 'Firebase pledge 1', category: 'diet', x: 100, y: 100 },
          { text: 'Local storage pledge', category: 'energy', x: 50, y: 50 }, // Matches existing
        ]);
      }),
      uploadPledge: jest.fn(),
    };

    // Load pledges.js
    require('../js/pledges.js');
  });

  test('EcoPledges should exist', () => {
    expect(window.EcoPledges).toBeDefined();
    expect(EcoPledges).toBeDefined();
  });

  test('init should initialize canvas and load pledges', () => {
    const spyResize = jest.spyOn(EcoPledges, 'resizeCanvas');
    const spyLoad = jest.spyOn(EcoPledges, 'loadPledges');
    const spyEvents = jest.spyOn(EcoPledges, 'setupEvents');
    const spyAnimate = jest.spyOn(EcoPledges, 'animate');

    EcoPledges.init();

    expect(spyResize).toHaveBeenCalled();
    expect(spyLoad).toHaveBeenCalled();
    expect(spyEvents).toHaveBeenCalled();
    expect(spyAnimate).toHaveBeenCalled();
  });

  test('addPledge adds star and triggers save & visual feedback', () => {
    EcoPledges.init();
    const initialStars = EcoPledges.stars.length;

    EcoPledges.addPledge('Eat less beef', 'diet');

    expect(EcoPledges.stars.length).toBe(initialStars + 1);
    expect(EcoPledges.stars[EcoPledges.stars.length - 1].text).toBe('Eat less beef');
    expect(EcoPledges.stars[EcoPledges.stars.length - 1].category).toBe('diet');
    expect(App.showToast).toHaveBeenCalled();
    expect(App.fireConfetti).toHaveBeenCalled();
    expect(EcoDb.uploadPledge).toHaveBeenCalled();
  });

  test('setupEvents handles submit button click', () => {
    EcoPledges.init();
    const initialStars = EcoPledges.stars.length;

    document.getElementById('pledge-input').value = 'Walk to work';
    document.getElementById('btn-submit-pledge').click();

    expect(EcoPledges.stars.length).toBe(initialStars + 1);
    expect(EcoPledges.stars[EcoPledges.stars.length - 1].text).toBe('Walk to work');
    expect(EcoPledges.stars[EcoPledges.stars.length - 1].category).toBe('energy'); // category-btn active is energy
    expect(document.getElementById('pledge-input').value).toBe('');
  });

  test('setupEvents handles category pill toggles', () => {
    EcoPledges.init();
    const btns = document.querySelectorAll('.pledge-cat-btn');

    // Click Diet button
    btns[1].click();
    expect(btns[0].classList.contains('active')).toBe(false);
    expect(btns[1].classList.contains('active')).toBe(true);
  });

  test('Canvas mousemove selects hovered star', () => {
    EcoPledges.init();
    EcoPledges.stars = [
      {
        text: 'Hover test',
        category: 'diet',
        x: 100,
        y: 100,
        size: 5,
        vx: 0,
        vy: 0,
      },
    ];

    EcoPledges.canvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 800,
      height: 320,
    });

    const event = new window.MouseEvent('mousemove', {
      clientX: 100,
      clientY: 100,
    });
    EcoPledges.canvas.dispatchEvent(event);

    expect(EcoPledges.hoveredStar).not.toBeNull();
    expect(EcoPledges.hoveredStar.text).toBe('Hover test');
  });

  test('loadPledges handles JSON parsing syntax error gracefully', () => {
    localStorage.setItem('eco_pledges_stars', 'invalid-json{');
    const spyError = jest.spyOn(console, 'error').mockImplementation(() => {});

    EcoPledges.loadPledges();

    expect(spyError).toHaveBeenCalled();
    spyError.mockRestore();
  });

  test('loadPledges seeds early adopters if local storage is empty', () => {
    localStorage.clear();
    // Disable firebase sync temporarily so it doesn't override seed stars
    global.EcoDb.firebaseEnabled = false;

    EcoPledges.loadPledges();

    // Default early adopters has 25+ entries
    expect(EcoPledges.stars.length).toBeGreaterThan(10);
    expect(EcoPledges.stars[0].isEarly).toBe(true);

    // Restore
    global.EcoDb.firebaseEnabled = true;
  });

  test('loadPledges retains local unsynced pledges when firebase sync runs', () => {
    // Put unsynced pledge in localStorage so loadPledges loads it
    localStorage.setItem(
      'eco_pledges_stars',
      JSON.stringify([{ text: 'Unsynced local star', category: 'energy', x: 10, y: 10 }])
    );

    EcoPledges.loadPledges();

    const texts = EcoPledges.stars.map(s => s.text);
    expect(texts).toContain('Unsynced local star');
    expect(texts).toContain('Firebase pledge 1');
  });

  test('savePledges checks for global.Utils', () => {
    global.Utils = {
      storage: {
        setItem: jest.fn(),
      },
    };

    EcoPledges.savePledges();
    expect(global.Utils.storage.setItem).toHaveBeenCalledWith(
      'eco_pledges_stars',
      EcoPledges.stars
    );

    delete global.Utils;
  });

  test('animate wraps canvas boundaries and wraps x and y', () => {
    EcoPledges.init();
    // Position stars to wrap
    EcoPledges.stars = [
      { text: 'Left border wrap', category: 'diet', x: -1, y: 10, vx: -0.1, vy: 0, size: 4 },
      { text: 'Right border wrap', category: 'energy', x: 801, y: 20, vx: 0.1, vy: 0, size: 5 },
      { text: 'Top border wrap', category: 'diet', x: 50, y: -1, vx: 0, vy: -0.1, size: 4 },
      { text: 'Bottom border wrap', category: 'energy', x: 60, y: 321, vx: 0, vy: 0.1, size: 5 },
    ];

    EcoPledges.animate();

    expect(EcoPledges.stars[0].x).toBe(EcoPledges.canvas.width);
    expect(EcoPledges.stars[1].x).toBe(0);
    expect(EcoPledges.stars[2].y).toBe(EcoPledges.canvas.height);
    expect(EcoPledges.stars[3].y).toBe(0);
  });

  test('animate draws tooltip with long text wrapping logic', () => {
    EcoPledges.init();

    EcoPledges.stars = [
      {
        text: 'This is a very long text star which is early pledger and contains enough words to trigger wrapping metrics and width checks in canvas context rendering',
        category: 'diet',
        x: 100,
        y: 100,
        vx: 0,
        vy: 0,
        size: 4,
        isEarly: true,
      },
    ];

    // Mock measureText to return a width > 196 (so tooltipW - 24 branch is covered)
    EcoPledges.ctx.measureText = jest.fn(() => ({ width: 300 }));

    EcoPledges.hoveredStar = EcoPledges.stars[0];
    EcoPledges.animate();

    expect(EcoPledges.ctx.fillText).toHaveBeenCalled();
  });

  test('loadPledges handles global.Utils defined when saving seeds', () => {
    global.Utils = {
      storage: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
      },
    };
    localStorage.clear();
    global.EcoDb.firebaseEnabled = false;

    EcoPledges.loadPledges();

    expect(global.Utils.storage.setItem).toHaveBeenCalled();

    delete global.Utils;
    global.EcoDb.firebaseEnabled = true;
  });
});
