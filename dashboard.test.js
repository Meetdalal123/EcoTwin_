const fs = require('fs');
const path = require('path');

describe('EcoDashboard Module', () => {
  beforeEach(() => {
    jest.resetModules();

    // Reset localStorage
    localStorage.clear();
    localStorage.setItem(
      'eco_diagnostic_history',
      JSON.stringify([
        { score: 5.2, timestamp: 'Jun 19', level: 2 },
        { score: 4.8, timestamp: 'Jun 20', level: 2 },
      ])
    );
    localStorage.setItem(
      'eco_diet_calculator',
      JSON.stringify({
        redMeat: 0,
        lunch: 0.6,
      })
    );

    // Construct mock DOM required by dashboard.js
    document.body.innerHTML = `
      <!-- Nav Tabs -->
      <a href="#" class="db-nav-item active" data-tab="overview">Overview</a>
      <a href="#" class="db-nav-item" data-tab="charts">Charts</a>
      
      <div id="tab-overview" class="dashboard-tab-panel active"></div>
      <div id="tab-charts" class="dashboard-tab-panel"></div>

      <!-- Filters -->
      <input id="db-log-filter" value="" />
      <table id="db-log-table">
        <tbody id="db-log-table-body">
          <tr><td>Meatless Monday</td></tr>
          <tr><td>Carpooling info</td></tr>
        </tbody>
      </table>

      <!-- CTA / Grid Containers -->
      <div id="profile-cta-container"></div>
      <div id="profile-dashboard-grid"></div>

      <!-- KPIs -->
      <span id="kpi-today"></span>
      <span id="kpi-month"></span>
      <span id="kpi-saved"></span>
      <span id="kpi-trees"></span>

      <!-- Trend HUD Elements -->
      <span id="kpi-today-trend"></span>
      <span id="kpi-month-trend"></span>
      <span id="kpi-saved-trend"></span>
      <span id="kpi-trees-trend"></span>

      <!-- Sidebar -->
      <span id="db-sidebar-username"></span>
      <span id="db-sidebar-rank"></span>

      <!-- Profile Tab Stats -->
      <span id="profile-stat-grade"></span>
      <span id="profile-stat-scans"></span>
      <span id="profile-stat-savings"></span>

      <!-- Orb elements -->
      <div id="twin-orb-glow"></div>
      <div id="twin-orb-container"></div>
      <div id="twin-orb-status-text"></div>
      <div id="profile-mini-badges"></div>

      <!-- Canvases for charts -->
      <canvas id="gaugeChart"></canvas>
      <div id="gauge-display-val"></div>
      <table><tbody id="gaugeChart-table-body"></tbody></table>

      <canvas id="breakdownChart"></canvas>
      <table><tbody id="breakdownChart-table-body"></tbody></table>

      <canvas id="comparisonChart"></canvas>
      <table><tbody id="comparisonChart-table-body"></tbody></table>

      <canvas id="footprint-trend-chart"></canvas>
      <table><tbody id="footprint-trend-chart-table-body"></tbody></table>
    `;

    // Mock global App
    global.App = {
      user: {
        name: 'Eco Test User',
        rank: 'Ecosystem Guardian',
        level: 3,
        dashboardInputs: {
          quizCompleted: true,
          commuteDistance: '20',
          commuteMode: 'metro',
          flights: '1-2',
          homeHeating: 'solar',
          quizDiet: 'vegan',
          calcMeat: 'never',
          calcCommute: 'transit',
          calcEnergyClean: true,
        },
      },
      isInitializing: false,
    };

    // Load dashboard.js
    require('../js/dashboard.js');
  });

  test('EcoDashboard should exist', () => {
    expect(window.EcoDashboard).toBeDefined();
    expect(EcoDashboard).toBeDefined();
  });

  test('init should initialize tabs, bind filters, and update dashboard', () => {
    const spyTabs = jest.spyOn(EcoDashboard, 'initTabs');
    const spyFilters = jest.spyOn(EcoDashboard, 'bindFilters');
    const spyUpdate = jest.spyOn(EcoDashboard, 'updateDashboard');

    EcoDashboard.initialized = false;
    EcoDashboard.init();

    expect(spyTabs).toHaveBeenCalled();
    expect(spyFilters).toHaveBeenCalled();
    expect(spyUpdate).toHaveBeenCalled();
  });

  test('init second time should only update dashboard', () => {
    const spyUpdate = jest.spyOn(EcoDashboard, 'updateDashboard');
    EcoDashboard.initialized = true;

    EcoDashboard.init();

    expect(spyUpdate).toHaveBeenCalled();
  });

  test('tab click event should switch active classes and trigger chart renders', () => {
    EcoDashboard.initTabs();
    const spyCharts = jest.spyOn(EcoDashboard, 'renderAdvancedCharts').mockImplementation(() => {});

    const chartsTabBtn = document.querySelector('.db-nav-item[data-tab="charts"]');
    chartsTabBtn.click();

    expect(chartsTabBtn.classList.contains('active')).toBe(true);
    expect(document.getElementById('tab-charts').classList.contains('active')).toBe(true);
    expect(spyCharts).toHaveBeenCalled();
  });

  test('bindFilters handles search filtering in log table', () => {
    const tbody = document.getElementById('db-log-table-body');
    tbody.innerHTML = `
      <tr><td>Meatless Monday</td></tr>
      <tr><td>Carpooling info</td></tr>
    `;

    EcoDashboard.bindFilters();

    const filterInput = document.getElementById('db-log-filter');
    filterInput.value = 'Monday';

    // Dispatch input event
    const event = new window.Event('input');
    filterInput.dispatchEvent(event);

    const rows = tbody.querySelectorAll('tr');
    expect(rows[0].style.display).toBe('');
    expect(rows[1].style.display).toBe('none');
  });

  test('updateDashboard does nothing if user does not have inputs completed', () => {
    App.user.dashboardInputs.quizCompleted = false;
    EcoDashboard.updateDashboard();

    expect(document.getElementById('profile-cta-container').style.display).toBe('block');
    expect(document.getElementById('profile-dashboard-grid').style.display).toBe('none');
  });

  test('updateDashboard calculates and populates optimal trend values correctly', () => {
    // Low emissions scenario to trigger optimal pills
    App.user.dashboardInputs = {
      quizCompleted: true,
      commuteDistance: '0',
      commuteMode: 'walk',
      flights: '0',
      electricityBill: 500,
      householdSize: '5+',
      onlineOrders: '0-1',
      homeHeating: 'solar',
      wasteRecycling: 'zero-waste',
      purchasingHabits: 'minimalist',
      quizDiet: 'vegan',
      calcMeat: 'never',
      calcCommute: 'walk',
      calcEnergyClean: true,
    };

    EcoDashboard.updateDashboard();

    expect(document.getElementById('kpi-today-trend').textContent).toBe('Optimal');
    expect(document.getElementById('kpi-month-trend').textContent).toBe('Low Carbon');
    expect(document.getElementById('kpi-saved-trend').textContent).toContain('lower');
    expect(document.getElementById('kpi-trees-trend').textContent).toBe('Active Offset');
  });

  test('updateDashboard calculates and populates high trend values correctly', () => {
    // High emissions scenario to trigger warning/danger pills
    App.user.dashboardInputs = {
      quizCompleted: true,
      commuteDistance: '200',
      commuteMode: 'car',
      flights: '6+',
      homeHeating: 'gas',
      quizDiet: 'heavy-meat',
      onlineOrders: '6+',
      wasteRecycling: 'no-recycle',
      purchasingHabits: 'fashion-heavy',
    };

    EcoDashboard.updateDashboard();

    expect(document.getElementById('kpi-today-trend').textContent).toBe('High Output');
    expect(document.getElementById('kpi-month-trend').textContent).toBe('Above Avg');
    expect(document.getElementById('kpi-saved-trend').textContent).toBe('0% saved');
  });

  test('updateDashboard calculates and populates moderate trend values correctly', () => {
    // Moderate emissions scenario
    App.user.dashboardInputs = {
      quizCompleted: true,
      commuteDistance: '10',
      commuteMode: 'metro',
      flights: '0',
      electricityBill: 500,
      householdSize: '3-4',
      onlineOrders: '0-1',
      homeHeating: 'gas',
      wasteRecycling: 'standard',
      purchasingHabits: 'standard',
      quizDiet: 'vegetarian',
    };

    EcoDashboard.updateDashboard();

    expect(document.getElementById('kpi-today-trend').textContent).toBe('Under Avg');
    expect(document.getElementById('kpi-month-trend').textContent).toBe('Moderate');
  });

  test('updateProfileTabStats assigns correct grades and orb glows based on emissions', () => {
    // Test A grade (highest grade in updateProfileTabStats is A)
    EcoDashboard.updateProfileTabStats(1000, []); // 1000 kg/year = 2.7 kg/day (under 6.0)
    expect(document.getElementById('profile-stat-grade').textContent).toBe('A');

    // Test B grade
    EcoDashboard.updateProfileTabStats(3000, []); // 3000 kg/year = 8.2 kg/day (over 6.0, under 10)
    expect(document.getElementById('profile-stat-grade').textContent).toBe('B');

    // Test C grade
    EcoDashboard.updateProfileTabStats(4500, []); // 4500 kg/year = 12.3 kg/day (over 10, under 15)
    expect(document.getElementById('profile-stat-grade').textContent).toBe('C');

    // Test D grade
    EcoDashboard.updateProfileTabStats(6000, []); // 6000 kg/year = 16.4 kg/day (over 15, under 22)
    expect(document.getElementById('profile-stat-grade').textContent).toBe('D');

    // Test E grade
    EcoDashboard.updateProfileTabStats(9000, []); // 9000 kg/year = 24.6 kg/day (over 22, under 30)
    expect(document.getElementById('profile-stat-grade').textContent).toBe('E');

    // Test F grade
    EcoDashboard.updateProfileTabStats(12000, []); // 12000 kg/year = 32.8 kg/day (over 30)
    expect(document.getElementById('profile-stat-grade').textContent).toBe('F');
  });

  test('updateProfileTabStats populates mini badges in sidebar correctly', () => {
    App.user.level = 5;

    EcoDashboard.updateProfileTabStats(1000, []);

    const miniBadgesContainer = document.getElementById('profile-mini-badges');
    expect(miniBadgesContainer.textContent).toContain('Eco Rookie');
    expect(miniBadgesContainer.textContent).toContain('Green Gourmet');
    expect(miniBadgesContainer.textContent).toContain('Planetary Legend');
  });

  test('updateProfileTabStats displays fallback message when no badges unlocked', () => {
    App.user.level = 1;
    // Set inputs to lock everything
    App.user.dashboardInputs = {
      quizCompleted: true,
      quizDiet: 'heavy-meat',
      commuteMode: 'car',
      homeHeating: 'gas',
    };

    EcoDashboard.updateProfileTabStats(10000, []);

    const miniBadgesContainer = document.getElementById('profile-mini-badges');
    // Note: Rookie is always unlocked (rookieUnlocked = true)
    // So it will always render Eco Rookie and never show the fallback!
    expect(miniBadgesContainer.textContent).toContain('Eco Rookie');
  });

  test('renderGauge draws gauge chart successfully for different status colors', () => {
    // Low
    EcoDashboard.renderGauge(3.0);
    expect(document.getElementById('gauge-display-val').textContent).toBe('3.0');

    // Medium
    EcoDashboard.renderGauge(8.5);
    expect(document.getElementById('gauge-display-val').textContent).toBe('8.5');

    // High
    EcoDashboard.renderGauge(20.0);
    expect(document.getElementById('gauge-display-val').textContent).toBe('20.0');
  });

  test('renderAdvancedCharts draws breakdown, comparison, and trend charts', () => {
    EcoDashboard.renderAdvancedCharts();
    expect(EcoDashboard.breakdownChartInstance).toBeDefined();
    expect(EcoDashboard.comparisonChartInstance).toBeDefined();
  });

  test('renderLogTable constructs history rows for multiple grade options', () => {
    const history = [
      { score: 2.0, timestamp: 'Jun 19', level: 1 }, // A+
      { score: 4.0, timestamp: 'Jun 20', level: 2 }, // A
      { score: 5.5, timestamp: 'Jun 21', level: 2 }, // B
      { score: 7.5, timestamp: 'Jun 22', level: 2 }, // C
      { score: 10.0, timestamp: 'Jun 23', level: 2 }, // D
      { score: 15.0, timestamp: 'Jun 24', level: 3 }, // F
    ];
    EcoDashboard.renderLogTable(history);

    const tbody = document.getElementById('db-log-table-body');
    const rows = tbody.querySelectorAll('tr');

    expect(rows.length).toBe(6);
    expect(rows[0].textContent).toContain('2,000');
    expect(rows[0].textContent).toContain('A+');
    expect(rows[1].textContent).toContain('A');
    expect(rows[2].textContent).toContain('B');
    expect(rows[3].textContent).toContain('C');
    expect(rows[4].textContent).toContain('D');
    expect(rows[5].textContent).toContain('F');
  });

  test('renderLogTable constructs fallback row for empty history', () => {
    EcoDashboard.renderLogTable([]);
    const tbody = document.getElementById('db-log-table-body');
    const rows = tbody.querySelectorAll('tr');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toBe('No diagnostic scans logged yet.');
  });

  test('updateDashboard handles zero or negative emissions to trigger warning/no-offset trends', () => {
    App.user.dashboardInputs = {
      quizCompleted: true,
      commuteDistance: '-10000', // negative to force total emissions < 0
      commuteMode: 'car',
      flights: 'none',
      quizDiet: 'vegan',
      homeHeating: 'solar',
      wasteRecycling: 'zero-waste',
      purchasingHabits: 'minimalist',
    };

    EcoDashboard.updateDashboard();

    expect(document.getElementById('kpi-trees-trend').textContent).toBe('No Offset');
  });

  test('renderAdvancedCharts renders trend chart with empty history', () => {
    localStorage.setItem('eco_diagnostic_history', JSON.stringify([]));
    EcoDashboard.renderAdvancedCharts();
    expect(EcoDashboard.trendChartInstance).toBeDefined();
  });

  test('renderGauge handles Chart constructor errors gracefully', () => {
    const originalChart = global.Chart;
    global.Chart = function () {
      throw new Error('Mock Chart Error');
    };

    const spyError = jest.spyOn(console, 'error').mockImplementation(() => {});

    EcoDashboard.renderGauge(5.0);

    expect(spyError).toHaveBeenCalled();
    spyError.mockRestore();
    global.Chart = originalChart;
  });

  test('renderAdvancedCharts handles Chart constructor errors for breakdown and comparison charts', () => {
    const originalChart = global.Chart;
    global.Chart = function () {
      throw new Error('Mock Chart Error');
    };

    const spyError = jest.spyOn(console, 'error').mockImplementation(() => {});

    EcoDashboard.renderAdvancedCharts();

    expect(spyError).toHaveBeenCalled();
    spyError.mockRestore();
    global.Chart = originalChart;
  });

  test('renderAdvancedCharts destroys existing trendChartInstance and App._trendChartInstance', () => {
    // Setup existing instances
    EcoDashboard.trendChartInstance = { destroy: jest.fn() };
    window.App._trendChartInstance = { destroy: jest.fn() };

    EcoDashboard.renderAdvancedCharts();

    expect(window.App._trendChartInstance).toBeNull();
  });

  test('renderAdvancedCharts handles App._trendChartInstance destroy errors gracefully', () => {
    // Setup existing instance that throws on destroy
    EcoDashboard.trendChartInstance = null;
    window.App._trendChartInstance = {
      destroy: jest.fn(() => {
        throw new Error('Destroy Error');
      }),
    };

    const spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    EcoDashboard.renderAdvancedCharts();

    expect(spyWarn).toHaveBeenCalled();
    spyWarn.mockRestore();
  });

  test('updateProfileTabStats displays fallback message when no badges unlocked', () => {
    App.user.level = 1;
    App.user.rookieUnlocked = false; // Disable rookie badge to test fallback

    // Set inputs to lock everything
    App.user.dashboardInputs = {
      quizCompleted: true,
      quizDiet: 'heavy-meat',
      commuteMode: 'car',
      homeHeating: 'gas',
      calcMeat: 'meat',
      calcCommute: 'car',
      calcEnergyClean: false,
    };

    localStorage.setItem(
      'eco_diet_calculator',
      JSON.stringify({
        redMeat: 5,
        lunch: 0.0,
      })
    );

    EcoDashboard.updateProfileTabStats(10000, []);

    const miniBadgesContainer = document.getElementById('profile-mini-badges');
    expect(miniBadgesContainer.textContent).toContain('No credentials unlocked yet.');
  });

  test('renderAdvancedCharts destroys existing breakdown and comparison charts when rendered twice', () => {
    EcoDashboard.renderAdvancedCharts();
    const spyBreakdownDestroy = jest.spyOn(EcoDashboard.breakdownChartInstance, 'destroy');
    const spyComparisonDestroy = jest.spyOn(EcoDashboard.comparisonChartInstance, 'destroy');

    EcoDashboard.renderAdvancedCharts();

    expect(spyBreakdownDestroy).toHaveBeenCalled();
    expect(spyComparisonDestroy).toHaveBeenCalled();
  });

  test('updateDashboard renders advanced charts when active tab is charts', () => {
    const overviewTab = document.querySelector('.db-nav-item[data-tab="overview"]');
    const chartsTab = document.querySelector('.db-nav-item[data-tab="charts"]');
    if (overviewTab && chartsTab) {
      overviewTab.classList.remove('active');
      chartsTab.classList.add('active');
    }
    const spyCharts = jest.spyOn(EcoDashboard, 'renderAdvancedCharts').mockImplementation(() => {});
    EcoDashboard.updateDashboard();
    expect(spyCharts).toHaveBeenCalled();
    spyCharts.mockRestore();
  });
});
