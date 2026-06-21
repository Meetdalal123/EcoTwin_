const fs = require('fs');
const path = require('path');

describe('EcoTwin Features UI Snapshot and Interaction Tests', () => {
  beforeEach(() => {
    jest.resetModules();

    // Construct mock DOM containing templates/containers for all sub-features
    document.body.innerHTML = `
      <!-- Trade-Off Machine UI -->
      <div id="scale-beam"></div>
      <div id="scale-status-card"></div>
      <button id="btn-reset-scale"></button>
      <div id="left-pan-weight-display"></div>
      <div id="right-pan-weight-display"></div>
      <div id="left-pan-items"></div>
      <div id="right-pan-items"></div>
      <div id="tradeoff-items-shelf">
        <button class="tradeoff-item" data-name="Luxury Flight" data-weight="2500" data-icon="✈️">Luxury Flight</button>
        <button class="tradeoff-item" data-name="Beef Dinner" data-weight="15" data-icon="🥩">Beef Dinner</button>
      </div>

      <!-- Street 2080 UI -->
      <div id="street-slider-container"></div>
      <img id="street-img-today" src="" />
      <img id="street-img-2080" src="" />
      <span id="street-badge-2080"></span>
      <div id="city-selector-group">
        <button class="btn active-city-btn" data-city="mumbai">Mumbai</button>
        <button class="btn" data-city="london">London</button>
      </div>
      <div id="projection-selector-group">
        <button class="btn active-proj-btn" data-proj="damage">Damage</button>
        <button class="btn" data-proj="thriving">Thriving</button>
      </div>

      <!-- Carbon Receipt UI -->
      <div id="receipt-modal" style="display: none;"></div>
      <span id="receipt-user-id"></span>
      <span id="receipt-date"></span>
      <div id="receipt-items-list"></div>
      <span id="receipt-total-co2"></span>
      <span id="receipt-total-offsets"></span>
      <span id="receipt-net-co2"></span>
      <span id="receipt-grade-msg"></span>
      <div id="receipt-qrcode"></div>
      <button id="btn-close-receipt"></button>
      <button id="btn-close-receipt-bottom"></button>
      <button id="btn-download-receipt"></button>
      <button id="btn-share-receipt"></button>

      <!-- Diet Calculator UI -->
      <div id="diet-wizard-container">
        <div class="quiz-option-card" data-category="breakfast" data-val="0.1" data-label="Oatmeal"></div>
        <div class="quiz-option-card" data-category="breakfast" data-val="0.8" data-label="Bacon & Eggs"></div>
        <div class="diet-dot" data-step="1"></div>
        <div class="diet-dot" data-step="2"></div>
      </div>

      <!-- Dynamic Home Containers -->
      <div id="home-diet-calculator-container"></div>
      <div id="home-transport-container"></div>
      <div id="home-energy-container"></div>
    `;

    // Define dependencies
    global.EcoUtils = require('../js/utils.js');
    global.Utils = {
      sanitizeHTML: jest.fn(val => val),
      storage: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
      },
    };

    // Set up global App
    global.App = {
      user: {
        name: 'Test User',
        dashboardInputs: {
          commuteDistance: 25,
          commuteMode: 'car',
          flights: '1-2',
          quizDiet: 'vegetarian',
          electricityBill: 1000,
          householdSize: '2',
          onlineOrders: '2-3',
          homeHeating: 'gas',
          wasteRecycling: 'standard',
          purchasingHabits: 'standard',
        },
      },
      addXp: jest.fn(),
      showToast: jest.fn(),
      fireConfetti: jest.fn(),
      scrollToSection: jest.fn(),
    };

    // Load features sub-modules
    require('../js/features.js');
  });

  test('Trade-Off Machine initial render and interaction snapshots', () => {
    App.initTradeoffMachine();

    // Snapshot the initial scale empty state
    expect(document.getElementById('scale-status-card').innerHTML).toMatchSnapshot();

    // Trigger selection of luxury item
    const luxuryItem = document.querySelector('.tradeoff-item[data-name="Beef Dinner"]');
    luxuryItem.setAttribute('data-type', 'luxury');
    luxuryItem.click();

    // Snapshot with 1 luxury item on scale
    expect(document.getElementById('left-pan-items').innerHTML).toMatchSnapshot();
    expect(document.getElementById('scale-status-card').innerHTML).toMatchSnapshot();

    // Trigger selection of offset item
    const offsetItem = document.querySelector('.tradeoff-item[data-name="Luxury Flight"]');
    offsetItem.setAttribute('data-type', 'offset');
    offsetItem.setAttribute('data-weight', '15');
    offsetItem.click();

    // Snapshot balanced state
    expect(document.getElementById('scale-status-card').innerHTML).toMatchSnapshot();
    expect(App.addXp).toHaveBeenCalledWith(15, 'Balanced Trade-Off Scale');

    // Trigger reset button click
    document.getElementById('btn-reset-scale').click();
    expect(document.getElementById('left-pan-items').innerHTML).toBe('');
    expect(document.getElementById('right-pan-items').innerHTML).toBe('');
  });

  test('Street 2080 slider and select interactions snapshot', () => {
    App.initStreet2080Slider();

    // Trigger city change click
    const londonBtn = document.querySelector('#city-selector-group button[data-city="london"]');
    londonBtn.click();
    expect(document.getElementById('street-img-today').src).toContain('london_today.webp');

    // Trigger projection change click to thriving
    const thrivingBtn = document.querySelector(
      '#projection-selector-group button[data-proj="thriving"]'
    );
    thrivingBtn.click();
    expect(document.getElementById('street-badge-2080').textContent).toBe('2080 (RESTORATIVE)');
    expect(document.getElementById('street-badge-2080').style.background).toContain(
      'rgba(16, 185, 129'
    );

    // Trigger projection change back to damage
    const damageBtn = document.querySelector(
      '#projection-selector-group button[data-proj="damage"]'
    );
    damageBtn.click();
    expect(document.getElementById('street-badge-2080').textContent).toBe('2080 (INUNDATED)');
    expect(document.getElementById('street-badge-2080').style.background).toContain(
      'rgba(244, 63, 94'
    );
  });

  test('Carbon Receipt generation snapshot', () => {
    App.initCarbonReceipt();

    // Trigger show receipt click via event delegation
    const showBtn = document.createElement('button');
    showBtn.id = 'btn-show-receipt';
    document.body.appendChild(showBtn);
    showBtn.click();

    // Check modal displays
    expect(document.getElementById('receipt-modal').style.display).toBe('flex');

    // Snapshot the receipt data outputs
    expect(document.getElementById('receipt-items-list').innerHTML).toMatchSnapshot();
    expect(document.getElementById('receipt-total-co2').textContent).not.toBe('');
    expect(document.getElementById('receipt-net-co2').textContent).not.toBe('');

    // Trigger close buttons
    document.getElementById('btn-close-receipt').click();
    expect(document.getElementById('receipt-modal').style.display).toBe('none');

    // Trigger copy receipt click
    const originalClipboard = global.navigator.clipboard;
    global.navigator.clipboard = {
      writeText: jest.fn().mockResolvedValue(),
    };

    document.getElementById('btn-share-receipt').click();
    expect(global.navigator.clipboard.writeText).toHaveBeenCalled();

    global.navigator.clipboard = originalClipboard;
  });

  test('DietCalculator initialization and interaction', () => {
    // DietCalculator is attached to window or globally
    const DietCalculator = global.DietCalculator || window.DietCalculator;
    expect(DietCalculator).toBeDefined();

    const root = document.getElementById('diet-wizard-container');
    DietCalculator.init(root);

    // Verify option cards initialized accessibility
    const oatCard = root.querySelector('.quiz-option-card[data-val="0.1"]');
    expect(oatCard.getAttribute('role')).toBe('button');
    expect(oatCard.getAttribute('aria-label')).toBe('Select: Oatmeal');
  });

  test('Dynamic Home Sections render and update correctly', () => {
    // Diet
    // 1. Unanswered state
    Utils.storage.getItem.mockReturnValue(null);
    App.updateHomeDietSection();
    expect(document.getElementById('home-diet-calculator-container').innerHTML).toContain('Dietary Footprint Analyzer');

    // 2. Answered state
    const mockDietData = {
      breakfast: 0.2,
      lunch: 0.5,
      dinner: 0.6,
      redMeat: 1.2,
      dairy: 0.4
    };
    Utils.storage.getItem.mockReturnValue(JSON.stringify(mockDietData));
    App.updateHomeDietSection();
    expect(document.getElementById('home-diet-calculator-container').innerHTML).toContain('Your Diet Carbon Footprint');

    // Transport
    // 1. Unanswered state
    App.user.dashboardInputs = {};
    App.updateHomeTransportSection();
    expect(document.getElementById('home-transport-container').innerHTML).toContain('Transportation Impacts');

    // 2. Answered state
    App.user.dashboardInputs = {
      calcCommute: 'car',
      calcCarKm: '500',
      calcPublicKm: '100',
      calcFlights: '2',
      calcFuel: 'ev'
    };
    App.updateHomeTransportSection();
    expect(document.getElementById('home-transport-container').innerHTML).toContain('Your Travel Carbon Footprint');

    // Energy
    // 1. Unanswered state
    App.user.dashboardInputs = {};
    App.updateHomeEnergySection();
    expect(document.getElementById('home-energy-container').innerHTML).toContain('Clean Power Transition');

    // 2. Answered state
    App.user.dashboardInputs = {
      calcElec: '250',
      calcGas: '50',
      calcEnergyClean: true
    };
    App.updateHomeEnergySection();
    expect(document.getElementById('home-energy-container').innerHTML).toContain('Your Utility Carbon Footprint');
  });
});
