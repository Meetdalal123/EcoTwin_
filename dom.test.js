const fs = require('fs');
const path = require('path');

describe('EcoTwin DOM and UI Smoke Tests', () => {
  beforeAll(() => {
    // Read the real index.html
    const htmlPath = path.resolve(__dirname, '../index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // Load into JSDOM body
    document.body.innerHTML = htmlContent;

    // Define mock global variables before requiring scripts
    window.google = {
      accounts: {
        id: {
          initialize: jest.fn(),
          renderButton: jest.fn(),
          prompt: jest.fn(),
          disableAutoSelect: jest.fn(),
        },
      },
    };

    // Load scripts in dependency order
    require('../js/utils.js');
    require('../js/data.js');
    require('../js/pledges.js');
    require('../google-auth.js');
    require('../js/app.js');
    require('../js/db-sync.js');
    require('../js/features.js');
    require('../js/gamification.js');
    require('../js/dashboard.js');
    require('../js/diagnostics.js');
    require('../js/ai-chat.js');
    require('../js/profile.js'); // App is main controller
  });

  test('App object should be defined on window', () => {
    expect(window.App).toBeDefined();
    expect(typeof window.App).toBe('object');
  });

  test('Dashboard scene (#scene-dashboard) element exists', () => {
    const el = document.getElementById('scene-dashboard');
    expect(el).not.toBeNull();
  });

  test('Profile tab link exists', () => {
    const el = document.querySelector('.db-nav-item[data-tab="profile"]');
    expect(el).not.toBeNull();
  });

  test('Profile user display elements exist', () => {
    expect(document.getElementById('profile-user-name')).not.toBeNull();
    expect(document.getElementById('profile-stat-grade')).not.toBeNull();
  });

  test('Twin Avatar container (#twin-orb-container) exists', () => {
    const el = document.getElementById('twin-orb-container');
    expect(el).not.toBeNull();
  });

  test('Gamification rookie badge card exists', () => {
    const el = document.getElementById('card-badge-rookie');
    expect(el).not.toBeNull();
  });

  test('EcoDb syncing engine is loaded and initialized', () => {
    expect(window.EcoDb).toBeDefined();
  });

  test('EcoDashboard is loaded and initialized', () => {
    expect(window.EcoDashboard).toBeDefined();
  });

  test('ProfilePage object is loaded and initialized', () => {
    expect(window.ProfilePage).toBeDefined();
  });

  test('Google Profile Picture container (#profile-google-pfp-container) exists', () => {
    const el = document.getElementById('profile-google-pfp-container');
    expect(el).not.toBeNull();
  });

  test('Carbon Twin Profile Overlay element exists', () => {
    const el = document.getElementById('carbon-twin-profile-overlay');
    expect(el).not.toBeNull();
  });

  test('Twin avatar SVG and profile charts exist in DOM', () => {
    expect(document.getElementById('profile-avatar-svg')).not.toBeNull();
    expect(document.getElementById('profile-category-chart')).not.toBeNull();
    expect(document.getElementById('profile-benchmark-chart')).not.toBeNull();
    expect(document.getElementById('profile-history-chart')).not.toBeNull();
  });
});
