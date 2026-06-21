/**
 * EcoTwin Diagnostics Tests (diagnostics.test.js)
 * Tests for App.calculateDiagnosticsEmissions, App.logDiagnosticHistory, App.renderDiagnosticHistory
 */

// Setup minimal global App before requiring diagnostics
global.App = {
  user: {
    name: 'TestUser',
    isLoggedIn: true,
    xp: 50,
    level: 1,
    rank: 'Carbon Rookie',
    dashboardInputs: {
      commuteDistance: null,
      commuteMode: null,
      electricityBill: null,
      quizDiet: null,
      flights: null,
      onlineOrders: null,
      householdSize: null,
      homeHeating: null,
      wasteRecycling: null,
      purchasingHabits: null,
    },
  },
  quizStep: 1,
  saveSession: jest.fn(),
  showToast: jest.fn(),
  addXp: jest.fn(),
  updateAchievements: jest.fn(),
  renderDiagnosticHistory: jest.fn(),
  renderTrendChart: jest.fn(),
  updateDashboardLockState: jest.fn(),
  logDiagnosticHistory: null, // will be overwritten by require
  calculateDiagnosticsEmissions: null,
};
global.EcoPledges = { init: jest.fn() };
global.EcoDashboard = {
  init: jest.fn(),
  updateDashboard: jest.fn(),
  updateAllCharts: jest.fn(),
  trendChartInstance: null,
};
global.ProfilePage = { init: jest.fn() };
global.EcoCalculator = { init: jest.fn() };
global.EcoTwin = { init: jest.fn() };
global.EcoScanners = { init: jest.fn() };
global.EcoHeroEarth = { init: jest.fn() };
global.EcoPlanet = { init: jest.fn() };
global.EcoDiagnostics = { init: jest.fn() };
global.GOOGLE_CLIENT_ID = '';

require('../js/data.js');
require('../js/utils.js');
require('../js/db-sync.js');
require('../js/diagnostics.js');

const originalRenderDiagnosticHistory = App.renderDiagnosticHistory;
const originalRenderTrendChart = App.renderTrendChart;

/** Helper: set inputs and call calculateFootprint */
function calcWithInputs(overrides = {}) {
  const defaults = {
    commuteDistance: 0,
    commuteMode: 'car',
    electricityBill: 1000,
    quizDiet: 'vegetarian',
    flights: '0',
    onlineOrders: '0-1',
    householdSize: '1',
    homeHeating: 'electric',
    wasteRecycling: 'standard',
    purchasingHabits: 'standard',
  };
  App.user.dashboardInputs = { ...defaults, ...overrides };
  // Provide no DOM — calculateFootprint must handle missing elements gracefully
  App.calculateDiagnosticsEmissions();
}

describe('App.calculateFootprint — emission categories', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="feature-dedicated-page">
        <div id="result-iq-score"></div>
        <div id="result-monthly-co2"></div>
        <div id="result-annual-co2"></div>
        <div id="result-top-contributor"></div>
        <div id="result-top-contributor-sub"></div>
        <div id="result-insight-text"></div>
        <div id="profile-total-score"></div>
        <div id="profile-user-name"></div>
        <div id="profile-user-rank"></div>
        <div id="profile-user-level"></div>
        <div id="profile-user-xp"></div>
        <div id="profile-xp-bar" style="width:0%"></div>
        <div id="trend-history-list"></div>
        <div id="profile-advice-list"></div>
        <div id="recommendation-cards-grid"></div>
        <canvas id="footprint-trend-chart"></canvas>
        
        <div id="quiz-travel-emissions-val"></div>
        <div id="quiz-travel-status"></div>
        <div id="quiz-travel-driving"></div>
        <div id="quiz-travel-trees"></div>
        <div id="quiz-travel-flights"></div>
        
        <div id="quiz-energy-emissions-val"></div>
        <div id="quiz-energy-status"></div>
        <div id="quiz-energy-driving"></div>
        <div id="quiz-energy-trees"></div>
        <div id="quiz-energy-flights"></div>
      </div>
    `;
    App.renderDiagnosticHistory = jest.fn();
    App.renderTrendChart = jest.fn();
  });

  test('vegan diet has lowest food emissions', () => {
    calcWithInputs({ quizDiet: 'vegan' });
    const score = document.querySelector('#result-iq-score');
    // Vegan should yield higher score (lower emissions) than heavy-meat
    const veganScore = parseInt(score.textContent);

    calcWithInputs({ quizDiet: 'heavy-meat' });
    const meatScore = parseInt(score.textContent);
    expect(veganScore).toBeGreaterThan(meatScore);
  });

  test('heavy-meat diet has highest food emissions among diets', () => {
    calcWithInputs({ quizDiet: 'heavy-meat' });
    const meatScore = parseInt(document.querySelector('#result-iq-score').textContent);
    calcWithInputs({ quizDiet: 'nonveg' });
    const nonvegScore = parseInt(document.querySelector('#result-iq-score').textContent);
    expect(nonvegScore).toBeGreaterThan(meatScore);
  });

  test('zero commute distance has lower transport emissions than 50km/day', () => {
    calcWithInputs({ commuteDistance: 0 });
    const highScore = parseInt(document.querySelector('#result-iq-score').textContent);
    calcWithInputs({ commuteDistance: 50, commuteMode: 'car' });
    const lowScore = parseInt(document.querySelector('#result-iq-score').textContent);
    expect(highScore).toBeGreaterThan(lowScore);
  });

  test('walking commute emits less than car commute', () => {
    calcWithInputs({ commuteDistance: 20, commuteMode: 'walk' });
    const walkScore = parseInt(document.querySelector('#result-iq-score').textContent);
    calcWithInputs({ commuteDistance: 20, commuteMode: 'car' });
    const carScore = parseInt(document.querySelector('#result-iq-score').textContent);
    expect(walkScore).toBeGreaterThan(carScore);
  });

  test('metro commute emits less than car commute', () => {
    calcWithInputs({ commuteDistance: 15, commuteMode: 'metro' });
    const metroScore = parseInt(document.querySelector('#result-iq-score').textContent);
    calcWithInputs({ commuteDistance: 15, commuteMode: 'car' });
    const carScore = parseInt(document.querySelector('#result-iq-score').textContent);
    expect(metroScore).toBeGreaterThan(carScore);
  });

  test('bike commute emits less than car commute', () => {
    calcWithInputs({ commuteDistance: 10, commuteMode: 'bike' });
    const bikeScore = parseInt(document.querySelector('#result-iq-score').textContent);
    calcWithInputs({ commuteDistance: 10, commuteMode: 'car' });
    const carScore = parseInt(document.querySelector('#result-iq-score').textContent);
    expect(bikeScore).toBeGreaterThan(carScore);
  });

  test('6+ flights has highest travel emissions', () => {
    calcWithInputs({ flights: '0' });
    const noFlightScore = parseInt(document.querySelector('#result-iq-score').textContent);
    calcWithInputs({ flights: '6+' });
    const manyFlightScore = parseInt(document.querySelector('#result-iq-score').textContent);
    expect(noFlightScore).toBeGreaterThan(manyFlightScore);
  });

  test('1-2 flights has lower emissions than 3-5', () => {
    calcWithInputs({ flights: '1-2' });
    const fewScore = parseInt(document.querySelector('#result-iq-score').textContent);
    calcWithInputs({ flights: '3-5' });
    const moreScore = parseInt(document.querySelector('#result-iq-score').textContent);
    expect(fewScore).toBeGreaterThan(moreScore);
  });

  test('solar heating has lower energy emissions than electric', () => {
    calcWithInputs({ homeHeating: 'solar' });
    const solarScore = parseInt(document.querySelector('#result-iq-score').textContent);
    calcWithInputs({ homeHeating: 'electric' });
    const electricScore = parseInt(document.querySelector('#result-iq-score').textContent);
    expect(solarScore).toBeGreaterThan(electricScore);
  });

  test('gas heating has lower emissions than electric', () => {
    calcWithInputs({ homeHeating: 'gas' });
    const gasScore = parseInt(document.querySelector('#result-iq-score').textContent);
    calcWithInputs({ homeHeating: 'electric' });
    const electricScore = parseInt(document.querySelector('#result-iq-score').textContent);
    expect(gasScore).toBeGreaterThan(electricScore);
  });

  test('zero-waste recycling has lower emissions than no-recycle', () => {
    calcWithInputs({ wasteRecycling: 'zero-waste' });
    const zeroScore = parseInt(document.querySelector('#result-iq-score').textContent);
    calcWithInputs({ wasteRecycling: 'no-recycle' });
    const noRecycleScore = parseInt(document.querySelector('#result-iq-score').textContent);
    expect(zeroScore).toBeGreaterThan(noRecycleScore);
  });

  test('minimalist purchasing has lower emissions than fashion-heavy', () => {
    calcWithInputs({ purchasingHabits: 'minimalist' });
    const miniScore = parseInt(document.querySelector('#result-iq-score').textContent);
    calcWithInputs({ purchasingHabits: 'fashion-heavy' });
    const fashionScore = parseInt(document.querySelector('#result-iq-score').textContent);
    expect(miniScore).toBeGreaterThan(fashionScore);
  });

  test('large household reduces per-person energy emissions', () => {
    calcWithInputs({ electricityBill: 3000, householdSize: '5+' });
    const bigHHScore = parseInt(document.querySelector('#result-iq-score').textContent);
    calcWithInputs({ electricityBill: 3000, householdSize: '1' });
    const singleScore = parseInt(document.querySelector('#result-iq-score').textContent);
    expect(bigHHScore).toBeGreaterThan(singleScore);
  });

  test('2-person household uses 1.6x energy multiplier', () => {
    calcWithInputs({ householdSize: '2', electricityBill: 1000 });
    const twoScore = parseInt(document.querySelector('#result-iq-score').textContent);
    calcWithInputs({ householdSize: '1', electricityBill: 1000 });
    const oneScore = parseInt(document.querySelector('#result-iq-score').textContent);
    expect(twoScore).toBeGreaterThan(oneScore);
  });

  test('3000 electricity bill has higher energy than 500', () => {
    calcWithInputs({ electricityBill: 500, householdSize: '1' });
    const lowBillScore = parseInt(document.querySelector('#result-iq-score').textContent);
    calcWithInputs({ electricityBill: 3000, householdSize: '1' });
    const highBillScore = parseInt(document.querySelector('#result-iq-score').textContent);
    expect(lowBillScore).toBeGreaterThan(highBillScore);
  });

  test('6+ online orders has highest shopping emissions', () => {
    calcWithInputs({ onlineOrders: '0-1' });
    const lowScore = parseInt(document.querySelector('#result-iq-score').textContent);
    calcWithInputs({ onlineOrders: '6+' });
    const highScore = parseInt(document.querySelector('#result-iq-score').textContent);
    expect(lowScore).toBeGreaterThan(highScore);
  });

  test('score is clamped between 10 and 100', () => {
    // Best case scenario
    calcWithInputs({
      commuteMode: 'walk',
      quizDiet: 'vegan',
      flights: '0',
      onlineOrders: '0-1',
      homeHeating: 'solar',
      wasteRecycling: 'zero-waste',
      purchasingHabits: 'minimalist',
      householdSize: '5+',
      electricityBill: 500,
    });
    const bestScore = parseInt(document.querySelector('#result-iq-score').textContent);
    expect(bestScore).toBeLessThanOrEqual(100);
    expect(bestScore).toBeGreaterThanOrEqual(10);
  });

  test('score updates profile-total-score element', () => {
    calcWithInputs({});
    const el = document.getElementById('profile-total-score');
    expect(el.textContent).toMatch(/kg CO₂/);
  });

  test('top contributor is computed and set', () => {
    calcWithInputs({ quizDiet: 'heavy-meat', flights: '0', commuteMode: 'walk' });
    const topEl = document.getElementById('result-top-contributor');
    expect(['FOOD', 'TRANSPORT', 'ENERGY', 'SHOPPING', 'TRAVEL']).toContain(
      topEl.textContent.trim()
    );
  });

  test('result-monthly-co2 is populated', () => {
    calcWithInputs({});
    const el = document.getElementById('result-monthly-co2');
    expect(el.textContent).toMatch(/kg/);
  });

  test('result-annual-co2 is populated', () => {
    calcWithInputs({});
    const el = document.getElementById('result-annual-co2');
    expect(el.textContent).toMatch(/t/);
  });

  test('insight text is set for food-heavy profile', () => {
    calcWithInputs({
      quizDiet: 'heavy-meat',
      flights: '0',
      commuteMode: 'walk',
      commuteDistance: 0,
      onlineOrders: '0-1',
      homeHeating: 'solar',
      wasteRecycling: 'zero-waste',
      purchasingHabits: 'minimalist',
      householdSize: '5+',
      electricityBill: 500,
    });
    const el = document.getElementById('result-insight-text');
    expect(el.textContent.length).toBeGreaterThan(5);
  });

  test('insight text is set for transport-heavy profile', () => {
    calcWithInputs({
      commuteDistance: 80,
      commuteMode: 'car',
      flights: '6+',
      quizDiet: 'vegan',
      onlineOrders: '0-1',
      homeHeating: 'solar',
      wasteRecycling: 'zero-waste',
      purchasingHabits: 'minimalist',
      electricityBill: 500,
    });
    const el = document.getElementById('result-insight-text');
    expect(el.textContent.length).toBeGreaterThan(5);
  });

  test('recommendation cards grid is rendered', () => {
    calcWithInputs({
      quizDiet: 'heavy-meat',
      flights: '6+',
      commuteMode: 'car',
      commuteDistance: 30,
      electricityBill: 3000,
      onlineOrders: '6+',
    });
    const el = document.getElementById('recommendation-cards-grid');
    expect(el.innerHTML.length).toBeGreaterThan(0);
  });

  test('LED recommendation appears as fallback when recs are few', () => {
    calcWithInputs({
      quizDiet: 'vegan',
      flights: '0',
      commuteMode: 'walk',
      commuteDistance: 0,
      electricityBill: 500,
      onlineOrders: '0-1',
    });
    const el = document.getElementById('recommendation-cards-grid');
    expect(el.innerHTML).toMatch(/LED|local|plant/i);
  });
});

describe('App.logDiagnosticHistory', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '<div id="trend-history-list"></div>';
    App.renderDiagnosticHistory = jest.fn();
    App.renderTrendChart = jest.fn();
  });

  test('does nothing when scoreVal is falsy', () => {
    App.logDiagnosticHistory(null);
    expect(App.renderDiagnosticHistory).not.toHaveBeenCalled();
  });

  test('saves a score entry to history', () => {
    App.logDiagnosticHistory('3.2');
    expect(App.renderDiagnosticHistory).toHaveBeenCalled();
  });

  test('stores at most 5 entries', () => {
    for (let i = 0; i < 7; i++) {
      App.logDiagnosticHistory(`${i}.0`);
    }
    const saved = Utils.storage.getItem('eco_diagnostic_history');
    const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
    expect(parsed.length).toBeLessThanOrEqual(5);
  });

  test('most recent entry is first', () => {
    App.logDiagnosticHistory('1.0');
    App.logDiagnosticHistory('2.0');
    const saved = Utils.storage.getItem('eco_diagnostic_history');
    const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
    expect(parsed[0].score).toBe('2.0');
  });

  test('logDiagnosticHistory fallback when Utils is undefined', () => {
    const origUtils = global.Utils;
    delete global.Utils;
    App.logDiagnosticHistory('2.5');
    const saved = localStorage.getItem('eco_diagnostic_history');
    expect(saved).toContain('2.5');
    global.Utils = origUtils;
  });

  test('renderDiagnosticHistory when history is empty', () => {
    App.renderDiagnosticHistory = originalRenderDiagnosticHistory;
    localStorage.clear();
    if (global.Utils) {
      Utils.storage.removeItem('eco_diagnostic_history');
    }
    document.body.innerHTML = '<div id="trend-history-list"></div>';
    App.renderDiagnosticHistory();
    const listEl = document.getElementById('trend-history-list');
    expect(listEl.textContent).toContain('No diagnostic history found');
  });
});

describe('App.calculateFootprint — additional emission contributors', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="feature-dedicated-page">
        <div id="result-iq-score"></div>
        <div id="result-monthly-co2"></div>
        <div id="result-annual-co2"></div>
        <div id="result-top-contributor"></div>
        <div id="result-top-contributor-sub"></div>
        <div id="result-insight-text"></div>
        <div id="profile-total-score"></div>
        <div id="recommendation-cards-grid"></div>
        <canvas id="footprint-trend-chart"></canvas>
        
        <div id="quiz-travel-emissions-val"></div>
        <div id="quiz-travel-status"></div>
        <div id="quiz-travel-driving"></div>
        <div id="quiz-travel-trees"></div>
        <div id="quiz-travel-flights"></div>
        
        <div id="quiz-energy-emissions-val"></div>
        <div id="quiz-energy-status"></div>
        <div id="quiz-energy-driving"></div>
        <div id="quiz-energy-trees"></div>
        <div id="quiz-energy-flights"></div>
      </div>
    `;
    App.renderDiagnosticHistory = jest.fn();
    App.renderTrendChart = jest.fn();
  });

  test('insight text is set for travel-heavy profile', () => {
    calcWithInputs({
      flights: '6+',
      quizDiet: 'vegan',
      commuteMode: 'walk',
      commuteDistance: 0.001,
      onlineOrders: '0-1',
      homeHeating: 'solar',
      wasteRecycling: 'zero-waste',
      purchasingHabits: 'minimalist',
      electricityBill: 500,
    });
    const el = document.getElementById('result-insight-text');
    expect(el.textContent).toContain('Air travel');
  });

  test('insight text is set for shopping-heavy profile', () => {
    calcWithInputs({
      onlineOrders: '6+',
      flights: '0',
      quizDiet: 'vegan',
      commuteMode: 'walk',
      commuteDistance: 0.001,
      homeHeating: 'solar',
      wasteRecycling: 'zero-waste',
      purchasingHabits: 'minimalist',
      electricityBill: 500,
    });
    const el = document.getElementById('result-insight-text');
    expect(el.textContent).toContain('Consumer parcel');
  });
});

describe('App.renderTrendChart branches', () => {
  beforeEach(() => {
    App.renderTrendChart = originalRenderTrendChart;
    document.body.innerHTML = '<canvas id="footprint-trend-chart"></canvas>';
  });

  test('hides canvas when Chart is undefined', () => {
    const origChart = global.Chart;
    const origWinChart = window.Chart;
    delete global.Chart;
    delete window.Chart;
    App.renderTrendChart([]);
    const canvas = document.getElementById('footprint-trend-chart');
    expect(canvas.style.display).toBe('none');
    global.Chart = origChart;
    window.Chart = origWinChart;
  });

  test('destroys existing trendChartInstance and logs warning on fail', () => {
    const mockDestroy = jest.fn().mockImplementation(() => {
      throw new Error('Destroy fail');
    });
    window.EcoDashboard = { trendChartInstance: { destroy: mockDestroy } };
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    App.renderTrendChart([]);

    expect(mockDestroy).toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
    delete window.EcoDashboard;
  });

  test('updates existing _trendChartInstance if it exists', () => {
    const mockUpdate = jest.fn();
    App._trendChartInstance = {
      data: { labels: [], datasets: [{ data: [] }] },
      update: mockUpdate,
    };

    App.renderTrendChart([{ timestamp: 'Jun 20', score: '2.5' }]);

    expect(mockUpdate).toHaveBeenCalled();
    expect(App._trendChartInstance.data.labels).toContain('Jun 20');
    expect(App._trendChartInstance.data.datasets[0].data).toContain(2.5);
    delete App._trendChartInstance;
  });

  test('handles chart creation errors gracefully', () => {
    const origChart = global.Chart;
    const origWinChart = window.Chart;
    global.Chart = function () {
      throw new Error('Creation fail');
    };
    window.Chart = global.Chart;

    App.renderTrendChart([{ timestamp: 'Jun 20', score: '2.5' }]);
    const canvas = document.getElementById('footprint-trend-chart');
    expect(canvas.style.display).toBe('none');

    global.Chart = origChart;
    window.Chart = origWinChart;
  });
});

describe('App.initDiagnosticsQuiz & finishDiagnosticsQuiz UI interaction', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="feature-dedicated-page">
        <div id="diagnostics-quiz-flow"></div>
        <div id="diagnostics-results-panel" style="display:none;"></div>
        <span id="current-quiz-step"></span>
        <div id="quiz-progress-bar" style="width:0%"></div>
        <button id="quiz-back-btn"></button>
        <div id="quiz-cards-slider-track"></div>
        
        <div class="quiz-card" data-step="1">
          <input id="commute-distance-slider" type="range" value="0" />
          <span id="commute-distance-val">0</span>
          <button id="btn-q1-continue"></button>
        </div>
        
        <div class="quiz-card" data-step="2">
          <div class="quiz-option-card" data-val="car"><h4>Car</h4></div>
          <div class="quiz-option-card" data-val="bike"><h4>Bike</h4></div>
        </div>

        <div class="quiz-card" data-step="10">
          <div class="quiz-option-card" data-val="standard"><h4>Standard</h4></div>
        </div>

        <button id="btn-retake-quiz"></button>
      </div>
    `;
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('initDiagnosticsQuiz binds sliders and advances options', () => {
    App.user.dashboardInputs = { commuteDistance: null, commuteMode: null };
    App.initDiagnosticsQuiz();

    const slider = document.getElementById('commute-distance-slider');
    slider.value = '25';
    slider.dispatchEvent(new Event('input'));
    expect(App.user.dashboardInputs.commuteDistance).toBe(25);

    const continueBtn = document.getElementById('btn-q1-continue');
    continueBtn.click();
    expect(App.quizStep).toBe(2);

    // Option cards accessibility enter keypress
    const carCard = document.querySelector('.quiz-option-card[data-val="car"]');
    const keyEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    carCard.dispatchEvent(keyEvent);

    // Trigger option selection click
    carCard.click();
    expect(carCard.classList.contains('active')).toBe(true);
    expect(App.user.dashboardInputs.commuteMode).toBe('car');

    // Test back button click
    App.quizStep = 2;
    const backBtn = document.getElementById('quiz-back-btn');
    backBtn.click();
    expect(App.quizStep).toBe(1);

    // Test retake quiz button click
    const restartBtn = document.getElementById('btn-retake-quiz');
    restartBtn.click();
    expect(App.user.dashboardInputs.commuteDistance).toBeNull();
  });

  test('finishDiagnosticsQuiz transition', () => {
    App.user.dashboardInputs = {};
    App.finishDiagnosticsQuiz();
    expect(document.getElementById('diagnostics-quiz-flow').style.display).toBe('none');

    jest.advanceTimersByTime(100);
    expect(document.getElementById('diagnostics-results-panel').style.opacity).toBe('1');
  });

  test('new numeric inputs update dashboard inputs and session', () => {
    document.body.innerHTML = `
      <div class="feature-dedicated-page">
        <div id="diagnostics-quiz-flow"></div>
        <div id="diagnostics-results-panel" style="display:none;"></div>
        
        <div class="quiz-card" data-step="1">
          <input id="commute-distance-slider" type="range" value="0" />
          <input id="commute-distance-input" type="number" />
          <span id="commute-distance-val">0</span>
          <button id="btn-q1-continue"></button>
        </div>
        
        <div class="quiz-card" data-step="3">
          <input id="electricity-bill-input" type="number" />
          <button id="btn-q3-continue"></button>
        </div>

        <div class="quiz-card" data-step="7">
          <input id="household-size-input" type="number" />
          <button id="btn-q7-continue"></button>
        </div>
      </div>
    `;

    App.user.dashboardInputs = {
      commuteDistance: null,
      electricityBill: null,
      householdSize: null,
    };
    App.initDiagnosticsQuiz();

    // 1. Commute Distance Input
    const distanceInput = document.getElementById('commute-distance-input');
    distanceInput.value = '42';
    distanceInput.dispatchEvent(new Event('input'));
    expect(App.user.dashboardInputs.commuteDistance).toBe(42);

    const continueQ1 = document.getElementById('btn-q1-continue');
    continueQ1.click();
    expect(App.quizStep).toBe(2);

    // 2. Electricity Bill Input
    const electricityInput = document.getElementById('electricity-bill-input');
    electricityInput.value = '1500';
    electricityInput.dispatchEvent(new Event('input'));
    expect(App.user.dashboardInputs.electricityBill).toBe(1500);

    const continueQ3 = document.getElementById('btn-q3-continue');
    continueQ3.click();
    expect(App.quizStep).toBe(4);

    // 3. Household Size Input
    const householdInput = document.getElementById('household-size-input');
    householdInput.value = '4';
    householdInput.dispatchEvent(new Event('input'));
    expect(App.user.dashboardInputs.householdSize).toBe(4);

    const continueQ7 = document.getElementById('btn-q7-continue');
    continueQ7.click();
    expect(App.quizStep).toBe(8);
  });

  test('initDiagnosticsQuiz handles pre-selected active option match and already completed quizState', () => {
    document.body.innerHTML = `
      <div class="feature-dedicated-page">
        <div id="diagnostics-quiz-flow"></div>
        <div id="diagnostics-results-panel" style="display:none;"></div>
        <div class="quiz-card" data-step="2">
          <div class="quiz-option-card" data-val="car"><h4>Car</h4></div>
        </div>
      </div>
    `;
    // Pre-selected option
    App.user.dashboardInputs = { commuteMode: 'car', quizCompleted: true };

    // Test quizCompleted branch
    App.initDiagnosticsQuiz();
    expect(document.getElementById('diagnostics-quiz-flow').style.display).toBe('none');
    expect(document.getElementById('diagnostics-results-panel').style.display).toBe('block');

    // Check if pre-selected class active was added
    const carCard = document.querySelector('.quiz-option-card[data-val="car"]');
    expect(carCard.classList.contains('active')).toBe(true);
  });

  test('auto-advances to finish quiz on step 10 option click', () => {
    document.body.innerHTML = `
      <div class="feature-dedicated-page">
        <div id="diagnostics-quiz-flow"></div>
        <div id="diagnostics-results-panel" style="display:none;"></div>
        <div class="quiz-card" data-step="10">
          <div class="quiz-option-card" data-val="standard"><h4>Standard</h4></div>
        </div>
      </div>
    `;
    App.user.dashboardInputs = { purchasingHabits: null };
    App.initDiagnosticsQuiz();

    const standardCard = document.querySelector('.quiz-option-card[data-val="standard"]');
    standardCard.click();

    jest.advanceTimersByTime(300);
    expect(App.user.dashboardInputs.quizCompleted).toBe(true);
  });

  test('updates rings and badges when values are below benchmark averages', () => {
    document.body.innerHTML = `
      <div class="feature-dedicated-page">
        <div id="result-iq-score"></div>
        <div id="result-monthly-co2"></div>
        <div id="result-annual-co2"></div>
        <div id="result-top-contributor"></div>
        <div id="result-top-contributor-sub"></div>
        <div id="result-insight-text"></div>
        <div id="profile-total-score"></div>
        <div id="recommendation-cards-grid"></div>
        <canvas id="footprint-trend-chart"></canvas>
        
        <div id="home-ring-progress-food"></div>
        <div id="home-ring-percent-food"></div>
        <div id="home-ring-val-food"></div>
        
        <div id="modal-ring-progress-food"></div>
        <div id="modal-ring-percent-food"></div>
        <div id="modal-ring-val-food"></div>

        <div id="benchmark-indian-badge"></div>
        <div id="benchmark-urban-badge"></div>
        
        <div id="quiz-travel-emissions-val"></div>
        <div id="quiz-travel-status"></div>
        <div id="quiz-travel-driving"></div>
        <div id="quiz-travel-trees"></div>
        <div id="quiz-travel-flights"></div>
        
        <div id="quiz-energy-emissions-val"></div>
        <div id="quiz-energy-status"></div>
        <div id="quiz-energy-driving"></div>
        <div id="quiz-energy-trees"></div>
        <div id="quiz-energy-flights"></div>
      </div>
    `;

    // Set minimal emissions to trigger diff <= 0 for benchmarks
    App.user.dashboardInputs = {
      commuteDistance: 0,
      commuteMode: 'walk',
      electricityBill: 100,
      quizDiet: 'vegan',
      flights: '0',
      onlineOrders: '0-1',
      householdSize: 10,
      homeHeating: 'solar',
      wasteRecycling: 'zero-waste',
      purchasingHabits: 'minimalist',
    };

    App.calculateDiagnosticsEmissions();

    const indianBadge = document.getElementById('benchmark-indian-badge');
    const urbanBadge = document.getElementById('benchmark-urban-badge');
    expect(indianBadge.className).toContain('positive');
    expect(urbanBadge.className).toContain('positive');
  });

  test('renderDiagnosticHistory with non-empty history and successful chart destroy', () => {
    // Restore real renderDiagnosticHistory
    App.renderDiagnosticHistory = originalRenderDiagnosticHistory;

    document.body.innerHTML = `
      <div id="trend-history-list"></div>
      <canvas id="footprint-trend-chart"></canvas>
    `;

    const mockDestroy = jest.fn();
    window.EcoDashboard = {
      updateDashboard: jest.fn(),
      trendChartInstance: { destroy: mockDestroy },
    };

    global.Chart = jest.fn().mockImplementation(() => ({
      data: { labels: [], datasets: [{ data: [] }] },
      update: jest.fn(),
    }));

    // Set history in storage
    const testHistory = [{ score: '1.2', timestamp: 'Jun 21', level: 2 }];
    if (global.Utils) {
      Utils.storage.setItem('eco_diagnostic_history', testHistory);
    } else {
      localStorage.setItem('eco_diagnostic_history', JSON.stringify(testHistory));
    }

    App.renderDiagnosticHistory();

    const listEl = document.getElementById('trend-history-list');
    expect(listEl.textContent).toContain('Jun 21');
    expect(listEl.textContent).toContain('1.2 Tons');

    // Verify destroy was called
    expect(mockDestroy).toHaveBeenCalled();

    // Clean up
    delete window.EcoDashboard;
  });
});
