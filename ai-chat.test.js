/**
 * EcoTwin AI Chat Tests (ai-chat.test.js)
 * Tests for EcoAI.getReply keyword matching and fallback responses
 */

// Load required mocks and modules
global.App = {
  user: {
    name: 'TestUser',
    isLoggedIn: true,
    xp: 50,
    level: 1,
    rank: 'Carbon Rookie',
    dashboardInputs: { home: null, travel: null, diet: null, energy: null },
  },
  saveSession: jest.fn(),
  showToast: jest.fn(),
  addXp: jest.fn(),
};
global.EcoPledges = { init: jest.fn(), submitPledge: jest.fn() };
global.EcoDashboard = { init: jest.fn(), updateAllCharts: jest.fn() };
global.GOOGLE_CLIENT_ID = '';

require('../js/data.js');
require('../js/utils.js');
require('../js/db-sync.js');
require('../js/ai-chat.js');

describe('EcoAI.getReply — keyword matching', () => {
  beforeEach(() => {
    // Set up a minimal DOM element for score lookup
    document.body.innerHTML = '<div id="profile-total-score">---</div>';
  });

  test('diet keywords: "diet" returns food insight', () => {
    const reply = EcoAI.getReply('I want to improve my diet');
    expect(reply).toMatch(/food|diet|meat|plant/i);
  });

  test('diet keywords: "vegan" returns food insight', () => {
    const reply = EcoAI.getReply('Tell me about vegan options');
    expect(reply).toMatch(/food|diet|meat|plant/i);
  });

  test('diet keywords: "meat" returns food insight', () => {
    const reply = EcoAI.getReply('I eat a lot of meat');
    expect(reply).toMatch(/food|diet|meat|plant/i);
  });

  test('diet keywords: "food" returns food insight', () => {
    const reply = EcoAI.getReply('How does food impact my score?');
    expect(reply).toMatch(/food|diet|meat|plant/i);
  });

  test('diet keywords: "beef" returns food insight', () => {
    const reply = EcoAI.getReply('I eat beef daily');
    expect(reply).toMatch(/food|diet|meat|plant/i);
  });

  test('diet keywords: "plant" returns food insight', () => {
    const reply = EcoAI.getReply('plant based lifestyle');
    expect(reply).toMatch(/food|diet|meat|plant/i);
  });

  test('travel keywords: "car" returns transport insight', () => {
    const reply = EcoAI.getReply('I drive my car to work');
    expect(reply).toMatch(/transport|car|km|commute/i);
  });

  test('travel keywords: "flight" returns transport insight', () => {
    const reply = EcoAI.getReply('I take a flight every month');
    expect(reply).toMatch(/transport|car|km|commute/i);
  });

  test('travel keywords: "ev" returns transport insight', () => {
    const reply = EcoAI.getReply('Should I buy an EV?');
    expect(reply).toMatch(/transport|car|km|commute/i);
  });

  test('travel keywords: "commute" returns transport insight', () => {
    const reply = EcoAI.getReply('What is the best commute option?');
    expect(reply).toMatch(/transport|car|km|commute/i);
  });

  test('travel keywords: "train" returns transport insight', () => {
    const reply = EcoAI.getReply('I travel by train');
    expect(reply).toMatch(/transport|car|km|commute|rail/i);
  });

  test('energy keywords: "solar" returns energy insight', () => {
    const reply = EcoAI.getReply('Should I get solar panels?');
    expect(reply).toMatch(/energy|solar|renewable|home/i);
  });

  test('energy keywords: "electricity" returns energy insight', () => {
    const reply = EcoAI.getReply('My electricity bill is high');
    expect(reply).toMatch(/energy|solar|renewable|home/i);
  });

  test('energy keywords: "heating" returns energy insight', () => {
    const reply = EcoAI.getReply('How can I reduce home heating?');
    expect(reply).toMatch(/energy|solar|renewable|home/i);
  });

  test('energy keywords: "led" returns energy insight', () => {
    const reply = EcoAI.getReply('Should I switch to led bulbs?');
    expect(reply).toMatch(/energy|solar|renewable|home/i);
  });

  test('pledge keywords: "pledge" returns star wall message', () => {
    const reply = EcoAI.getReply('How do I make a pledge?');
    expect(reply).toMatch(/pledge|star|constellation/i);
  });

  test('pledge keywords: "star" returns star wall message', () => {
    const reply = EcoAI.getReply('I want to add a star');
    expect(reply).toMatch(/pledge|star|constellation/i);
  });

  test('pledge keywords: "commit" returns star wall message', () => {
    const reply = EcoAI.getReply('I want to commit to change');
    expect(reply).toMatch(/pledge|star|constellation/i);
  });

  test('climate policy: "paris" returns climate targets', () => {
    const reply = EcoAI.getReply('Tell me about the Paris agreement');
    expect(reply).toMatch(/paris|climate|1\.5|target/i);
  });

  test('climate policy: "net zero" returns climate targets', () => {
    const reply = EcoAI.getReply('What is net zero?');
    expect(reply).toMatch(/paris|climate|net.zero|target/i);
  });

  test('climate policy: "2050" returns climate targets', () => {
    const reply = EcoAI.getReply('What happens by 2050?');
    expect(reply).toMatch(/paris|climate|net.zero|target|2050/i);
  });

  test('shopping keywords: "plastic" returns consumption insight', () => {
    const reply = EcoAI.getReply('How do I reduce plastic?');
    expect(reply).toMatch(/shop|fashion|consumption|plastic/i);
  });

  test('shopping keywords: "fashion" returns consumption insight', () => {
    const reply = EcoAI.getReply('Is fast fashion bad?');
    expect(reply).toMatch(/shop|fashion|consumption|plastic/i);
  });

  test('water keywords: "shower" returns water usage insight', () => {
    const reply = EcoAI.getReply('How long should my shower be?');
    expect(reply).toMatch(/water|shower|energy/i);
  });

  test('greeting keywords: "hello" returns greeting', () => {
    const reply = EcoAI.getReply('hello there');
    expect(reply).toMatch(/hi|help|climate|carbon/i);
  });

  test('greeting keywords: "help" returns greeting', () => {
    const reply = EcoAI.getReply('I need help');
    expect(reply).toMatch(/hi|help|climate|carbon/i);
  });

  test('identity keywords: "who are you" returns identity', () => {
    const reply = EcoAI.getReply('who are you?');
    expect(reply).toMatch(/ecotwin|ai|advisor|sustainability/i);
  });

  test('identity keywords: "what are you" returns identity', () => {
    const reply = EcoAI.getReply('what are you exactly?');
    expect(reply).toMatch(/ecotwin|ai|advisor|sustainability/i);
  });

  test('score: with no score set, returns diagnostics suggestion', () => {
    document.body.innerHTML = '<div id="profile-total-score">---</div>';
    const reply = EcoAI.getReply('what is my carbon score?');
    expect(reply).toMatch(/diagnostic|profile|score/i);
  });

  test('score: with score set, returns personalized reply', () => {
    document.body.innerHTML = '<div id="profile-total-score">3.2 tonnes</div>';
    const reply = EcoAI.getReply('what is my footprint?');
    expect(reply).toMatch(/3\.2|score|carbon/i);
  });

  test('fallback: unknown query returns fallback with suggestion', () => {
    const reply = EcoAI.getReply('xyzzy random unknown topic xyz');
    expect(reply).toMatch(/ask|topic|diagnostic|focus/i);
  });

  test('empty string: returns fallback message', () => {
    const reply = EcoAI.getReply('   ');
    expect(typeof reply).toBe('string');
    expect(reply.length).toBeGreaterThan(0);
  });

  test('case insensitive: "DIET" matches diet branch', () => {
    const reply = EcoAI.getReply('DIET plan');
    expect(reply).toMatch(/food|diet|meat|plant/i);
  });

  test('case insensitive: "FLIGHT" matches travel branch', () => {
    const reply = EcoAI.getReply('FLIGHT emissions');
    expect(reply).toMatch(/transport|car|km|commute/i);
  });
});

describe('EcoAI — module structure', () => {
  test('EcoAI object exists on global', () => {
    expect(typeof EcoAI).toBe('object');
  });

  test('EcoAI.getReply is a function', () => {
    expect(typeof EcoAI.getReply).toBe('function');
  });

  test('EcoAI.isOpen defaults to false', () => {
    expect(EcoAI.isOpen).toBe(false);
  });

  test('EcoAI.history is an array', () => {
    expect(Array.isArray(EcoAI.history)).toBe(true);
  });
});

describe('EcoDb — initialization', () => {
  test('EcoDb object is defined', () => {
    expect(typeof EcoDb).toBe('object');
  });

  test('EcoDb.init with placeholder URL stays in standalone mode', () => {
    EcoDb.firebaseEnabled = false;
    EcoDb.init('YOUR_FIREBASE_DATABASE_URL');
    expect(EcoDb.firebaseEnabled).toBe(false);
  });

  test('EcoDb.syncPledges does nothing when not enabled', async () => {
    EcoDb.firebaseEnabled = false;
    const cb = jest.fn();
    await EcoDb.syncPledges(cb);
    expect(cb).not.toHaveBeenCalled();
  });

  test('EcoDb.uploadPledge does nothing when not enabled', async () => {
    EcoDb.firebaseEnabled = false;
    await expect(EcoDb.uploadPledge({ text: 'test' })).resolves.toBeUndefined();
  });

  test('EcoDb.syncCapsules does nothing when not enabled', async () => {
    EcoDb.firebaseEnabled = false;
    const cb = jest.fn();
    await EcoDb.syncCapsules(cb);
    expect(cb).not.toHaveBeenCalled();
  });

  test('EcoDb.uploadCapsule does nothing when not enabled', async () => {
    EcoDb.firebaseEnabled = false;
    await expect(EcoDb.uploadCapsule('mumbai', {})).resolves.toBeUndefined();
  });

  test('EcoDb.init with empty URL stays in standalone mode', () => {
    EcoDb.firebaseEnabled = false;
    EcoDb.init('');
    expect(EcoDb.firebaseEnabled).toBe(false);
  });

  test('EcoDb.init with null stays in standalone mode', () => {
    EcoDb.firebaseEnabled = false;
    EcoDb.init(null);
    expect(EcoDb.firebaseEnabled).toBe(false);
  });
});

describe('EcoAI — Drawer UI and Interactive flow', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="ai-drawer"></div>
      <div id="ai-drawer-overlay"></div>
      <button id="floating-ai-btn"></button>
      <div id="fab-unread-dot"></div>
      <textarea id="ai-drawer-input"></textarea>
      <div id="ai-drawer-messages"></div>
      <div id="ai-suggestions" style="display: flex;"></div>
      <div id="ai-typing-indicator" style="display: none;"></div>
      <div id="ai-context-banner"></div>
      <div id="ai-context-text"></div>
      <div id="profile-total-score">1.2 tonnes</div>
      
      <div id="main-chat-messages-container"></div>
      <input id="main-chat-user-input" />
      <button id="main-chat-send-btn"></button>
      <div id="db-sidebar-avatar"><img src="avatar.png" /></div>
    `;
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('EcoAI.init welcome message injection', () => {
    EcoAI.init();
    jest.advanceTimersByTime(200);
    const messages = document.getElementById('ai-drawer-messages');
    expect(messages.innerHTML).toContain('EcoTwin AI');
  });

  test('toggleDrawer opens and closes drawer', () => {
    EcoAI.isOpen = false;
    EcoAI.toggleDrawer();
    expect(EcoAI.isOpen).toBe(true);
    expect(document.getElementById('ai-drawer').classList.contains('open')).toBe(true);

    EcoAI.toggleDrawer();
    expect(EcoAI.isOpen).toBe(false);
    expect(document.getElementById('ai-drawer').classList.contains('open')).toBe(false);
  });

  test('clearChat empties messages and history', () => {
    EcoAI.history = [{ sender: 'user', text: 'hello' }];
    document.getElementById('ai-drawer-messages').innerHTML = '<div>some messages</div>';
    EcoAI.clearChat();
    expect(EcoAI.history.length).toBe(0);
    // Should inject welcome message again
    jest.advanceTimersByTime(200);
    expect(document.getElementById('ai-drawer-messages').innerHTML).toContain('EcoTwin AI');
  });

  test('send handles user input and triggers typing/reply', () => {
    const input = document.getElementById('ai-drawer-input');
    input.value = 'How to reduce diet footprint?';
    EcoAI.send();

    // User message should be appended immediately
    const messages = document.getElementById('ai-drawer-messages');
    expect(messages.innerHTML).toContain('How to reduce diet footprint?');
    expect(document.getElementById('ai-typing-indicator').style.display).toBe('block');
    expect(document.getElementById('ai-suggestions').style.display).toBe('none');

    // Fast forward to trigger typing delay and reply
    jest.advanceTimersByTime(1500);
    expect(document.getElementById('ai-typing-indicator').style.display).toBe('none');
    expect(messages.innerHTML).toContain('Food production');
  });

  test('handleKey triggers send on Enter key without shift', () => {
    const input = document.getElementById('ai-drawer-input');
    input.value = 'test key';
    const mockSend = jest.spyOn(EcoAI, 'send').mockImplementation(() => {});

    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: false });
    input.dispatchEvent(enterEvent);
    EcoAI.handleKey(enterEvent);

    expect(mockSend).toHaveBeenCalled();
    mockSend.mockRestore();
  });

  test('handleKey does not trigger send on Enter key with shift', () => {
    const mockSend = jest.spyOn(EcoAI, 'send').mockImplementation(() => {});
    const shiftEnterEvent = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true });
    EcoAI.handleKey(shiftEnterEvent);
    expect(mockSend).not.toHaveBeenCalled();
    mockSend.mockRestore();
  });

  test('sendSuggestion copies text and sends', () => {
    const mockSend = jest.spyOn(EcoAI, 'send').mockImplementation(() => {});
    const btn = document.createElement('button');
    btn.textContent = ' 🌱 solar energy ';
    EcoAI.sendSuggestion(btn);
    expect(document.getElementById('ai-drawer-input').value).toBe('solar energy');
    expect(mockSend).toHaveBeenCalled();
    mockSend.mockRestore();
  });

  test('App.initMainChat binds events and appends user/system messages', () => {
    App.initMainChat();
    const input = document.getElementById('main-chat-user-input');
    const btn = document.getElementById('main-chat-send-btn');
    input.value = 'hello';

    btn.click();
    const messages = document.getElementById('main-chat-messages-container');
    expect(messages.innerHTML).toContain('hello');

    // Fast forward to system response
    jest.advanceTimersByTime(1000);
    expect(messages.innerHTML).toContain('EcoTwin AI');
  });
});

describe('EcoDb — Firebase enabled operations', () => {
  beforeEach(() => {
    // Reset Firebase state
    EcoDb.firebaseEnabled = false;
    EcoDb.db = null;
    if (window.firebase && window.firebase.database) {
      const defaultRef = {
        on: jest.fn((evt, cb) =>
          cb({ val: () => ({ testKey: { text: 'Mock Pledge', category: 'diet' } }) })
        ),
        push: jest.fn().mockResolvedValue(),
      };
      window.firebase.database = jest.fn().mockReturnValue({
        ref: jest.fn().mockReturnValue(defaultRef),
      });
    }
  });

  test('EcoDb.init initializes Firebase database and sets firebaseEnabled = true', () => {
    EcoDb.init('https://ecotwin-test.firebaseio.com');
    expect(EcoDb.firebaseEnabled).toBe(true);
    expect(EcoDb.db).toBeDefined();
  });

  test('EcoDb.init handles initialization errors gracefully', () => {
    const origInit = firebase.initializeApp;
    firebase.initializeApp = jest.fn().mockImplementation(() => {
      throw new Error('Firebase init failed');
    });

    EcoDb.init('https://ecotwin-test.firebaseio.com');
    expect(EcoDb.firebaseEnabled).toBe(false);

    firebase.initializeApp = origInit;
  });

  test('EcoDb.syncPledges calls callback when data is present', async () => {
    EcoDb.init('https://ecotwin-test.firebaseio.com');
    const callback = jest.fn();
    await EcoDb.syncPledges(callback);
    expect(callback).toHaveBeenCalledWith([{ text: 'Mock Pledge', category: 'diet' }]);
  });

  test('EcoDb.uploadPledge calls firebase ref push', async () => {
    EcoDb.init('https://ecotwin-test.firebaseio.com');
    const pushMock = jest.fn().mockResolvedValue();
    EcoDb.db.ref = jest.fn().mockReturnValue({
      push: pushMock,
      on: jest.fn(),
    });

    const pledge = { text: 'Pledge test', category: 'energy' };
    await EcoDb.uploadPledge(pledge);
    expect(pushMock).toHaveBeenCalledWith(pledge);
  });

  test('EcoDb.uploadPledge handles push error gracefully', async () => {
    EcoDb.init('https://ecotwin-test.firebaseio.com');
    EcoDb.db.ref = jest.fn().mockReturnValue({
      push: jest.fn().mockRejectedValue(new Error('Firebase push error')),
      on: jest.fn(),
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await EcoDb.uploadPledge({ text: 'fail' });
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  test('EcoDb.syncCapsules calls callback when data is present', async () => {
    EcoDb.init('https://ecotwin-test.firebaseio.com');
    const callback = jest.fn();
    await EcoDb.syncCapsules(callback);
    expect(callback).toHaveBeenCalled();
  });

  test('EcoDb.syncCapsules handles error gracefully', async () => {
    EcoDb.init('https://ecotwin-test.firebaseio.com');
    EcoDb.db.ref = jest.fn().mockReturnValue({
      on: jest.fn().mockImplementation(() => {
        throw new Error('on error');
      }),
      push: jest.fn(),
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await EcoDb.syncCapsules(jest.fn());
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  test('EcoDb.uploadCapsule pushes capsule data', async () => {
    EcoDb.init('https://ecotwin-test.firebaseio.com');
    const pushMock = jest.fn().mockResolvedValue();
    EcoDb.db.ref = jest.fn().mockReturnValue({
      push: pushMock,
      on: jest.fn(),
    });

    const capsule = { msg: 'Hello from Mumbai' };
    await EcoDb.uploadCapsule('mumbai', capsule);
    expect(pushMock).toHaveBeenCalledWith(capsule);
  });

  test('EcoDb.uploadCapsule handles push error gracefully', async () => {
    EcoDb.init('https://ecotwin-test.firebaseio.com');
    EcoDb.db.ref = jest.fn().mockReturnValue({
      push: jest.fn().mockRejectedValue(new Error('Push failed')),
      on: jest.fn(),
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await EcoDb.uploadCapsule('mumbai', {});
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
