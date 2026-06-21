/* e:\PromptWar\Challenge-3\js\dashboard.js */

const EcoDashboard = {
  gaugeChartInstance: null,
  breakdownChartInstance: null,
  comparisonChartInstance: null,

  initialized: false,

  init() {
    if (this.initialized) {
      this.updateDashboard();
      return;
    }
    this.initialized = true;
    this.initTabs();
    this.bindFilters();
    this.updateDashboard();
  },

  initTabs() {
    document.querySelectorAll('.db-nav-item').forEach(item => {
      item.addEventListener('click', function (e) {
        e.preventDefault();
        const tabId = this.dataset.tab;

        // Update nav items
        document.querySelectorAll('.db-nav-item').forEach(n => n.classList.remove('active'));
        this.classList.add('active');

        // Update tab panels
        document
          .querySelectorAll('.dashboard-tab-panel')
          .forEach(panel => panel.classList.remove('active'));
        const activePanel = document.getElementById(`tab-${tabId}`);
        if (activePanel) {
          activePanel.classList.add('active');
        }

        // Redraw charts if needed (some charts rendering issues when hidden during load)
        if (tabId === 'charts') {
          EcoDashboard.renderAdvancedCharts();
        }
      });
    });
  },

  bindFilters() {
    const filterInput = document.getElementById('db-log-filter');
    if (filterInput) {
      filterInput.addEventListener('input', function () {
        const query = this.value.toLowerCase();
        const rows = document.querySelectorAll('#db-log-table-body tr');
        rows.forEach(row => {
          const text = row.textContent.toLowerCase();
          row.style.display = text.includes(query) ? '' : 'none';
        });
      });
    }
  },

  updateDashboard() {
    // 1. Load data
    let history = [];
    let savedHistory;
    try {
      savedHistory =
        typeof Utils !== 'undefined'
          ? Utils.storage.getItem('eco_diagnostic_history')
          : JSON.parse(localStorage.getItem('eco_diagnostic_history'));
    } catch (e) {}
    if (savedHistory) {
      try {
        history = typeof savedHistory === 'string' ? JSON.parse(savedHistory) : savedHistory;
      } catch (e) {}
    }

    const hasInputs = !!(
      App.user &&
      App.user.dashboardInputs &&
      App.user.dashboardInputs.quizCompleted
    );
    const ctaContainer = document.getElementById('profile-cta-container');
    const gridContainer = document.getElementById('profile-dashboard-grid');

    if (!hasInputs) {
      if (ctaContainer) ctaContainer.style.display = 'block';
      if (gridContainer) gridContainer.style.display = 'none';
      return;
    }

    if (ctaContainer) ctaContainer.style.display = 'none';
    if (gridContainer) gridContainer.style.display = 'grid';

    // 2. Fetch calculations
    // We will recalculate using the same logic to display real values
    const inputs = App.user.dashboardInputs || {};

    // Transport emissions
    const commuteDistance = parseFloat(inputs.commuteDistance) || 15;
    const commuteMode = inputs.commuteMode || 'car';
    let modeMultiplier = 0.18; // car
    if (commuteMode === 'bike') modeMultiplier = 0.08;
    if (commuteMode === 'metro' || commuteMode === 'transit') modeMultiplier = 0.03;
    if (commuteMode === 'walk' || commuteMode === 'remote') modeMultiplier = 0.0;
    const transportEmissions = commuteDistance * 365 * modeMultiplier; // kg/year

    // Travel emissions (flights)
    const flights = inputs.flights || '0';
    let travelEmissions = 0;
    if (flights === '1-2') travelEmissions = 1100;
    if (flights === '3-5') travelEmissions = 3200;
    if (flights === '6+') travelEmissions = 6500;

    // Food emissions (diet)
    const diet = inputs.quizDiet || 'vegetarian';
    let foodEmissions = 1100; // vegetarian
    if (diet === 'vegan') foodEmissions = 600;
    if (diet === 'nonveg') foodEmissions = 2200;
    if (diet === 'heavy-meat') foodEmissions = 3800;

    // Energy emissions (electricity bill divided by household size)
    const electricityBill = parseFloat(inputs.electricityBill) || 1000;
    let energyBase = electricityBill * 1.5;
    if (electricityBill >= 3000) {
      energyBase = electricityBill * 1.6;
    }

    const householdSize = inputs.householdSize || '1';
    let hhMultiplier = 1.0;
    if (householdSize === '2' || householdSize === 2) hhMultiplier = 1.6;
    else if (householdSize === '3-4' || householdSize === 3 || householdSize === 4)
      hhMultiplier = 2.5;
    else if (
      householdSize === '5+' ||
      (typeof householdSize === 'number' && householdSize >= 5) ||
      parseInt(householdSize) >= 5
    )
      hhMultiplier = 3.8;
    const energyEmissions = energyBase / hhMultiplier;

    // Shopping emissions (online orders)
    const onlineOrders = inputs.onlineOrders || '0-1';
    let shoppingEmissions = 120;
    if (onlineOrders === '2-3') shoppingEmissions = 380;
    if (onlineOrders === '4-5') shoppingEmissions = 750;
    if (onlineOrders === '6+') shoppingEmissions = 1300;

    // Home Heating & AC
    const homeHeating = inputs.homeHeating || 'electric';
    let heatingEmissions = 2200;
    if (homeHeating === 'solar') heatingEmissions = 200;
    if (homeHeating === 'gas') heatingEmissions = 1200;

    // Waste & Recycling
    const wasteRecycling = inputs.wasteRecycling || 'standard';
    let wasteEmissions = 400;
    if (wasteRecycling === 'zero-waste') wasteEmissions = 100;
    if (wasteRecycling === 'no-recycle') wasteEmissions = 900;

    // Purchasing Habits
    const purchasingHabits = inputs.purchasingHabits || 'standard';
    let purchasingEmissions = 600;
    if (purchasingHabits === 'minimalist') purchasingEmissions = 150;
    if (purchasingHabits === 'fashion-heavy') purchasingEmissions = 1800;

    const totalEmissionsKg =
      transportEmissions +
      travelEmissions +
      foodEmissions +
      energyEmissions +
      shoppingEmissions +
      heatingEmissions +
      wasteEmissions +
      purchasingEmissions;
    const userDaily = totalEmissionsKg / 365;

    // 3. Render KPI Cards
    const kpiToday = document.getElementById('kpi-today');
    const kpiMonth = document.getElementById('kpi-month');
    const kpiSaved = document.getElementById('kpi-saved');
    const kpiTrees = document.getElementById('kpi-trees');

    if (kpiToday) kpiToday.textContent = `${userDaily.toFixed(1)} kg`;
    if (kpiMonth) kpiMonth.textContent = `${Math.round(totalEmissionsKg / 12)} kg`;

    const globalAvgDaily = 15.0; // kg CO2/day
    const savedDaily = Math.max(0, globalAvgDaily - userDaily);
    if (kpiSaved) kpiSaved.textContent = `${savedDaily.toFixed(1)} kg`;

    const treesNeeded = Math.round((totalEmissionsKg / 1000) * 45);
    if (kpiTrees) kpiTrees.textContent = `${treesNeeded}`;

    // Populate Trend Pills
    const todayTrend = document.getElementById('kpi-today-trend');
    if (todayTrend) {
      todayTrend.style.display = 'inline-flex';
      if (userDaily <= 4.0) {
        todayTrend.textContent = 'Optimal';
        todayTrend.className = 'kpi-trend-pill optimal';
      } else if (userDaily <= 15.0) {
        todayTrend.textContent = 'Under Avg';
        todayTrend.className = 'kpi-trend-pill warning';
      } else {
        todayTrend.textContent = 'High Output';
        todayTrend.className = 'kpi-trend-pill danger';
      }
    }

    const monthTrend = document.getElementById('kpi-month-trend');
    if (monthTrend) {
      monthTrend.style.display = 'inline-flex';
      const userMonthly = totalEmissionsKg / 12;
      const avgMonthly = 15.0 * 30; // 450 kg
      if (userMonthly <= 4.0 * 30) {
        monthTrend.textContent = 'Low Carbon';
        monthTrend.className = 'kpi-trend-pill optimal';
      } else if (userMonthly <= avgMonthly) {
        monthTrend.textContent = 'Moderate';
        monthTrend.className = 'kpi-trend-pill warning';
      } else {
        monthTrend.textContent = 'Above Avg';
        monthTrend.className = 'kpi-trend-pill danger';
      }
    }

    const savedTrend = document.getElementById('kpi-saved-trend');
    if (savedTrend) {
      savedTrend.style.display = 'inline-flex';
      if (savedDaily > 0) {
        const pctSaved = Math.round((savedDaily / globalAvgDaily) * 100);
        savedTrend.textContent = `${pctSaved}% lower`;
        savedTrend.className = 'kpi-trend-pill optimal';
      } else {
        savedTrend.textContent = '0% saved';
        savedTrend.className = 'kpi-trend-pill danger';
      }
    }

    const treesTrend = document.getElementById('kpi-trees-trend');
    if (treesTrend) {
      treesTrend.style.display = 'inline-flex';
      if (treesNeeded > 0) {
        treesTrend.textContent = 'Active Offset';
        treesTrend.className = 'kpi-trend-pill info';
      } else {
        treesTrend.textContent = 'No Offset';
        treesTrend.className = 'kpi-trend-pill warning';
      }
    }

    // 4. Update Profile Sidebar info
    const dbSidebarUsername = document.getElementById('db-sidebar-username');
    const dbSidebarRank = document.getElementById('db-sidebar-rank');
    if (dbSidebarUsername) dbSidebarUsername.textContent = App.user.name || 'Guest User';
    if (dbSidebarRank) dbSidebarRank.textContent = App.user.rank || 'Carbon Rookie';

    // 5. Render Gauge Chart
    this.renderGauge(userDaily);

    // 6. Render Log Table
    this.renderLogTable(history);

    // 7. Update Profile Tab Stats & Hologram projection
    this.updateProfileTabStats(totalEmissionsKg, history);

    // 8. Render Charts if Tab is active
    const activeTab = document.querySelector('.db-nav-item.active');
    if (activeTab && activeTab.dataset.tab === 'charts') {
      this.renderAdvancedCharts();
    }
  },

  updateProfileTabStats(totalEmissionsKg, history) {
    const dailyEmissions = totalEmissionsKg / 365;

    // 1. Calculate Grade
    let grade = 'A';
    let gradeClass = 'grade-a';
    let twinStatusText = 'Excellent Trajectory! Your choices keep your Carbon Twin green.';
    let orbColor = '#10b981'; // Green
    let orbGradient = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    let orbSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="1.5" style="width: 40px; height: 40px; animation: spinOrb 20s linear infinite;"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>`;

    if (dailyEmissions > 6.0) {
      grade = 'B';
      gradeClass = 'grade-b';
      twinStatusText =
        'Good Trajectory. Your Twin is clean, but you have room to optimize transit.';
      orbColor = '#34d399';
    }
    if (dailyEmissions > 10.0) {
      grade = 'C';
      gradeClass = 'grade-c';
      twinStatusText =
        'Moderate Trajectory. Some smog shading. Offset travel or utility emissions.';
      orbColor = '#fbbf24'; // Amber
      orbGradient = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      orbSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="1.5" style="width: 40px; height: 40px; animation: spinOrb 20s linear infinite;"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path><path d="M2 12h20"></path></svg>`;
    }
    if (dailyEmissions > 15.0) {
      grade = 'D';
      gradeClass = 'grade-d';
      twinStatusText = 'High Footprint! Twin carbon smog detected. Swap to renewables or cut meat.';
      orbColor = '#fd923c'; // Orange
      orbGradient = 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)';
    }
    if (dailyEmissions > 22.0) {
      grade = 'E';
      gradeClass = 'grade-e';
      twinStatusText =
        'Warning! Severe carbon strain. Twin is covered in ash. Immediate changes needed.';
      orbColor = '#f43f5e'; // Light Red
      orbGradient = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      orbSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="1.5" style="width: 40px; height: 40px; animation: spinOrb 20s linear infinite;"><circle cx="12" cy="12" r="10" stroke-dasharray="4,4"></circle><path d="M12 2a16 16 0 0 0-4 10 16 16 0 0 0 4 10"></path><path d="M2 12h20"></path></svg>`;
    }
    if (dailyEmissions > 30.0) {
      grade = 'F';
      gradeClass = 'grade-f';
      twinStatusText =
        'Critical Footprint! Extreme carbon burden. Complete lifestyle audit advised.';
      orbColor = '#dc2626'; // Red
    }

    const gradeEl = document.getElementById('profile-stat-grade');
    if (gradeEl) {
      gradeEl.textContent = grade;
      gradeEl.className = `stat-value carbon-grade-badge ${gradeClass}`;
    }

    // 2. Set Scans count
    const scansEl = document.getElementById('profile-stat-scans');
    if (scansEl) {
      scansEl.textContent = history.length;
    }

    // 3. Set Offsets/Savings
    const savingsEl = document.getElementById('profile-stat-savings');
    if (savingsEl) {
      const globalAvgDaily = 15.0;
      const savedDaily = Math.max(0, globalAvgDaily - dailyEmissions);
      const totalSavedKg = Math.round(savedDaily * (history.length || 1));
      savingsEl.textContent = `${totalSavedKg} kg`;
    }

    // 4. Update Twin Visualizer Orb color & status
    const orbGlow = document.getElementById('twin-orb-glow');
    if (orbGlow) {
      orbGlow.style.background = `radial-gradient(circle, ${orbColor} 0%, transparent 70%)`;
    }

    const orbContainer = document.getElementById('twin-orb-container');
    if (orbContainer) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(orbSvg, 'image/svg+xml');
      const svgNode = doc.documentElement;
      orbContainer.textContent = '';
      orbContainer.appendChild(svgNode);
      orbContainer.style.background = orbGradient;
      orbContainer.style.boxShadow = `0 0 20px ${orbColor}50, inset 0 2px 2px rgba(255,255,255,0.2)`;
    }

    const orbStatusText = document.getElementById('twin-orb-status-text');
    if (orbStatusText) {
      orbStatusText.textContent = twinStatusText;
    }

    // 5. Render mini active credentials badges in profile
    const miniBadgesContainer = document.getElementById('profile-mini-badges');
    if (miniBadgesContainer) {
      miniBadgesContainer.textContent = '';

      const inputs = App.user.dashboardInputs || {};

      // Badge unlock logic matching gamification.js
      const rookieUnlocked =
        typeof App !== 'undefined' && App.user && App.user.rookieUnlocked !== false;
      let isGourmetFromQuiz = false;
      let savedDiet;
      try {
        savedDiet =
          typeof Utils !== 'undefined'
            ? Utils.storage.getItem('eco_diet_calculator')
            : JSON.parse(localStorage.getItem('eco_diet_calculator'));
      } catch (e) {}
      if (savedDiet) {
        try {
          const parsed = typeof savedDiet === 'string' ? JSON.parse(savedDiet) : savedDiet;
          if (parsed.redMeat === 0 && (parsed.lunch === 0.6 || parsed.lunch === 1.1)) {
            isGourmetFromQuiz = true;
          }
        } catch (e) {}
      }
      const gourmetUnlocked =
        (inputs.quizCompleted &&
          (inputs.quizDiet === 'vegan' || inputs.quizDiet === 'vegetarian')) ||
        inputs.calcMeat === 'never' ||
        isGourmetFromQuiz;

      const transitUnlocked =
        (inputs.quizCompleted &&
          (inputs.commuteMode === 'bike' ||
            inputs.commuteMode === 'walk' ||
            inputs.commuteMode === 'metro' ||
            inputs.commuteMode === 'transit' ||
            inputs.commuteMode === 'remote')) ||
        inputs.calcCommute === 'walk' ||
        inputs.calcCommute === 'transit' ||
        inputs.calcCommute === 'remote';

      const sparkUnlocked =
        (inputs.quizCompleted && inputs.homeHeating === 'solar') || inputs.calcEnergyClean === true;

      const guardianUnlocked = App.user.level >= 3;
      const legendUnlocked = App.user.level >= 5;

      const badgeIcons = {
        Rookie: { icon: 'award', unlocked: rookieUnlocked, name: 'Eco Rookie' },
        Gourmet: { icon: 'utensils', unlocked: gourmetUnlocked, name: 'Green Gourmet' },
        Transit: { icon: 'bike', unlocked: transitUnlocked, name: 'Transit Wizard' },
        Spark: { icon: 'zap', unlocked: sparkUnlocked, name: 'Clean Spark' },
        Guardian: { icon: 'shield', unlocked: guardianUnlocked, name: 'Eco Guardian' },
        Legend: { icon: 'trophy', unlocked: legendUnlocked, name: 'Planetary Legend' },
      };

      let addedAny = false;
      for (const badgeKey in badgeIcons) {
        const badge = badgeIcons[badgeKey];
        if (badge.unlocked) {
          const badgePill = document.createElement('div');
          badgePill.className = 'mini-badge-pill';
          const iconEl = document.createElement('i');
          iconEl.setAttribute('data-lucide', badge.icon);
          badgePill.appendChild(iconEl);
          badgePill.appendChild(document.createTextNode(' ' + badge.name));
          miniBadgesContainer.appendChild(badgePill);
          addedAny = true;
        }
      }

      if (!addedAny) {
        const span = document.createElement('span');
        span.style.color = 'var(--text-muted)';
        span.style.fontSize = '0.75rem';
        span.style.fontStyle = 'italic';
        span.textContent = 'No credentials unlocked yet.';
        miniBadgesContainer.appendChild(span);
      } else {
        if (window.lucide) lucide.createIcons();
      }
    }
  },

  renderGauge(userDaily) {
    const canvas = document.getElementById('gaugeChart');
    if (!canvas) return;

    if (typeof Chart === 'undefined') return;

    // Determine status color
    let statusColor = '#10b981'; // Green
    if (userDaily > 6.0) statusColor = '#fbbf24'; // Amber
    if (userDaily > 15.0) statusColor = '#f43f5e'; // Red

    const displayValEl = document.getElementById('gauge-display-val');
    if (displayValEl) {
      displayValEl.textContent = userDaily.toFixed(1);
      displayValEl.style.color = statusColor;
    }

    try {
      if (this.gaugeChartInstance) {
        this.gaugeChartInstance.destroy();
      }

      updateAccessibleTable(
        'gaugeChart-table-body',
        ['Carbon Level', 'Remaining'],
        [userDaily, Math.max(0.1, 30 - userDaily)]
      );
      this.gaugeChartInstance = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: ['Carbon Level', 'Remaining'],
          datasets: [
            // User value pointer
            {
              data: [userDaily, Math.max(0.1, 30 - userDaily)],
              backgroundColor: [statusColor, 'rgba(255, 255, 255, 0.03)'],
              borderColor: [statusColor, 'rgba(255, 255, 255, 0.05)'],
              borderWidth: 1.5,
              cutout: '80%',
              rotation: 270,
              circumference: 180,
            },
            // Zones background
            {
              data: [6, 9, 15],
              backgroundColor: [
                'rgba(16, 185, 129, 0.12)',
                'rgba(251, 191, 36, 0.12)',
                'rgba(244, 63, 94, 0.12)',
              ],
              borderColor: ['#10b981', '#fbbf24', '#f43f5e'],
              borderWidth: 1.5,
              cutout: '72%',
              rotation: 270,
              circumference: 180,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
          },
        },
      });
    } catch (e) {
      console.error('Gauge error', e);
    }
  },

  renderAdvancedCharts() {
    if (typeof Chart === 'undefined') return;

    let history = [];
    let savedHistory;
    try {
      savedHistory =
        typeof Utils !== 'undefined'
          ? Utils.storage.getItem('eco_diagnostic_history')
          : JSON.parse(localStorage.getItem('eco_diagnostic_history'));
    } catch (e) {}
    if (savedHistory) {
      try {
        history = typeof savedHistory === 'string' ? JSON.parse(savedHistory) : savedHistory;
      } catch (e) {}
    }

    const inputs = App.user.dashboardInputs || {};

    // Redo categories sum
    const commuteDistance = parseFloat(inputs.commuteDistance) || 15;
    const commuteMode = inputs.commuteMode || 'car';
    let modeMultiplier = 0.18;
    if (commuteMode === 'bike') modeMultiplier = 0.08;
    if (commuteMode === 'metro' || commuteMode === 'transit') modeMultiplier = 0.03;
    if (commuteMode === 'walk' || commuteMode === 'remote') modeMultiplier = 0.0;
    const transportEmissions = commuteDistance * 365 * modeMultiplier;

    const flights = inputs.flights || '0';
    let travelEmissions = 0;
    if (flights === '1-2') travelEmissions = 1100;
    if (flights === '3-5') travelEmissions = 3200;
    if (flights === '6+') travelEmissions = 6500;

    const diet = inputs.quizDiet || 'vegetarian';
    let foodEmissions = 1100;
    if (diet === 'vegan') foodEmissions = 600;
    if (diet === 'nonveg') foodEmissions = 2200;
    if (diet === 'heavy-meat') foodEmissions = 3800;

    const electricityBill = parseFloat(inputs.electricityBill) || 1000;
    let energyBase = electricityBill * 1.5;
    if (electricityBill >= 3000) {
      energyBase = electricityBill * 1.6;
    }

    const householdSize = inputs.householdSize || '1';
    let hhMultiplier = 1.0;
    if (householdSize === '2' || householdSize === 2) hhMultiplier = 1.6;
    else if (householdSize === '3-4' || householdSize === 3 || householdSize === 4)
      hhMultiplier = 2.5;
    else if (
      householdSize === '5+' ||
      (typeof householdSize === 'number' && householdSize >= 5) ||
      parseInt(householdSize) >= 5
    )
      hhMultiplier = 3.8;
    const energyEmissions = energyBase / hhMultiplier;

    const onlineOrders = inputs.onlineOrders || '0-1';
    let shoppingEmissions = 120;
    if (onlineOrders === '2-3') shoppingEmissions = 380;
    if (onlineOrders === '4-5') shoppingEmissions = 750;
    if (onlineOrders === '6+') shoppingEmissions = 1300;

    const homeHeating = inputs.homeHeating || 'electric';
    let heatingEmissions = 2200;
    if (homeHeating === 'solar') heatingEmissions = 200;
    if (homeHeating === 'gas') heatingEmissions = 1200;

    const wasteRecycling = inputs.wasteRecycling || 'standard';
    let wasteEmissions = 400;
    if (wasteRecycling === 'zero-waste') wasteEmissions = 100;
    if (wasteRecycling === 'no-recycle') wasteEmissions = 900;

    const purchasingHabits = inputs.purchasingHabits || 'standard';
    let purchasingEmissions = 600;
    if (purchasingHabits === 'minimalist') purchasingEmissions = 150;
    if (purchasingHabits === 'fashion-heavy') purchasingEmissions = 1800;

    const catFood = Math.round(foodEmissions);
    const catTravel = Math.round(transportEmissions + travelEmissions);
    const catUtility = Math.round(energyEmissions + heatingEmissions);
    const catShopping = Math.round(shoppingEmissions + wasteEmissions + purchasingEmissions);
    const totalEmissionsKg = catFood + catTravel + catUtility + catShopping;

    // Category Breakdown Doughnut Chart
    const bdCanvas = document.getElementById('breakdownChart');
    if (bdCanvas) {
      try {
        if (this.breakdownChartInstance) {
          this.breakdownChartInstance.destroy();
        }
        updateAccessibleTable(
          'breakdownChart-table-body',
          ['Diet & Food', 'Transport & Travel', 'Utility & Energy', 'Shopping & Lifestyle'],
          [catFood, catTravel, catUtility, catShopping]
        );
        this.breakdownChartInstance = new Chart(bdCanvas, {
          type: 'doughnut',
          data: {
            labels: [
              'Diet & Food',
              'Transport & Travel',
              'Utility & Energy',
              'Shopping & Lifestyle',
            ],
            datasets: [
              {
                data: [catFood, catTravel, catUtility, catShopping],
                backgroundColor: [
                  '#10b981', // Green
                  '#06b6d4', // Cyan
                  '#fbbf24', // Amber
                  '#8b5cf6', // Purple
                ],
                borderColor: 'rgba(10, 20, 15, 0.8)',
                borderWidth: 2,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  color: '#cbd5e1',
                  font: { family: 'Inter', size: 11 },
                },
              },
            },
          },
        });
      } catch (e) {
        console.error(e);
      }
    }

    // Comparison Bar Chart
    const compCanvas = document.getElementById('comparisonChart');
    if (compCanvas) {
      const userDaily = totalEmissionsKg / 365;

      try {
        if (this.comparisonChartInstance) {
          this.comparisonChartInstance.destroy();
        }
        updateAccessibleTable(
          'comparisonChart-table-body',
          ['Your Footprint', 'Target Limit', 'Global Average', 'Developed Avg'],
          [userDaily, 4.0, 15.0, 45.0]
        );
        this.comparisonChartInstance = new Chart(compCanvas, {
          type: 'bar',
          data: {
            labels: ['Your Footprint', 'Target Limit', 'Global Average', 'Developed Avg'],
            datasets: [
              {
                label: 'Daily Footprint (kg CO₂)',
                data: [userDaily.toFixed(1), 4.0, 15.0, 45.0],
                backgroundColor: [
                  userDaily <= 6.0 ? '#10b981' : userDaily <= 15.0 ? '#fbbf24' : '#f43f5e',
                  '#059669',
                  '#d97706',
                  '#dc2626',
                ],
                borderRadius: 6,
                borderWidth: 0,
              },
            ],
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#94a3b8' },
              },
              y: {
                grid: { display: false },
                ticks: { color: '#94a3b8' },
              },
            },
            plugins: {
              legend: { display: false },
            },
          },
        });
      } catch (e) {
        console.error(e);
      }
    }

    // 3. Historical Emissions Trend Line Chart
    const trendCanvas = document.getElementById('footprint-trend-chart');
    if (trendCanvas) {
      try {
        if (this.trendChartInstance) {
          this.trendChartInstance.destroy();
          this.trendChartInstance = null;
        }

        // Bidirectional destroy of App._trendChartInstance to prevent canvas clashes
        if (window.App && window.App._trendChartInstance) {
          try {
            window.App._trendChartInstance.destroy();
            window.App._trendChartInstance = null;
          } catch (e) {
            console.warn('Failed to destroy App._trendChartInstance', e);
          }
        }

        // Reverse history to show chronological order
        const chronoHistory = [...history].reverse();

        // If history is empty, show mock baseline data for representation
        const labels =
          chronoHistory.length > 0
            ? chronoHistory.map(item => item.timestamp.split(' ')[0])
            : ['Scenarios Base', 'Scanned Trajectory', 'Current Profile'];

        const dataPoints =
          chronoHistory.length > 0
            ? chronoHistory.map(item => (parseFloat(item.score) * 1000).toFixed(0))
            : [8200, 6800, totalEmissionsKg.toFixed(0)];

        updateAccessibleTable('footprint-trend-chart-table-body', labels, dataPoints);
        this.trendChartInstance = new Chart(trendCanvas, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Annual Footprint (kg CO₂)',
                data: dataPoints,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.04)',
                fill: true,
                tension: 0.3,
                borderWidth: 2,
                pointBackgroundColor: '#10b981',
                pointRadius: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#94a3b8' },
              },
              y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#94a3b8' },
              },
            },
            plugins: {
              legend: { display: false },
            },
          },
        });
      } catch (e) {
        console.error('Trend chart render error', e);
      }
    }
  },

  renderLogTable(history) {
    const tbody = document.getElementById('db-log-table-body');
    if (!tbody) return;

    tbody.textContent = '';

    if (history.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 5;
      td.style.textAlign = 'center';
      td.style.color = 'var(--text-muted)';
      td.style.fontStyle = 'italic';
      td.textContent = 'No diagnostic scans logged yet.';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    history.forEach(item => {
      const scoreNum = parseFloat(item.score); // in Tons
      const annualKg = scoreNum * 1000;
      const monthlyKg = Math.round(annualKg / 12);

      // Determine grade
      let grade = 'F';
      let gradeBg = 'rgba(244, 63, 94, 0.15)';
      let gradeColor = '#fda4af';
      if (scoreNum < 3.0) {
        grade = 'A+';
        gradeBg = 'rgba(6, 182, 212, 0.15)';
        gradeColor = '#a5f3fc';
      } else if (scoreNum < 4.5) {
        grade = 'A';
        gradeBg = 'rgba(16, 185, 129, 0.15)';
        gradeColor = '#a7f3d0';
      } else if (scoreNum < 6.0) {
        grade = 'B';
        gradeBg = 'rgba(52, 211, 153, 0.1)';
        gradeColor = '#6ee7b7';
      } else if (scoreNum < 8.5) {
        grade = 'C';
        gradeBg = 'rgba(251, 191, 36, 0.15)';
        gradeColor = '#fde68a';
      } else if (scoreNum < 12.0) {
        grade = 'D';
        gradeBg = 'rgba(249, 115, 22, 0.15)';
        gradeColor = '#ffedd5';
      }

      const tr = document.createElement('tr');

      const tdTime = document.createElement('td');
      tdTime.style.fontWeight = '500';
      tdTime.style.color = 'var(--text-primary)';
      tdTime.textContent = String(item.timestamp);

      const tdLevel = document.createElement('td');
      tdLevel.textContent = `Level ${item.level}`;

      const tdAnnual = document.createElement('td');
      tdAnnual.textContent = `${annualKg.toLocaleString()} kg`;

      const tdMonthly = document.createElement('td');
      tdMonthly.textContent = `${monthlyKg.toLocaleString()} kg`;

      const tdGrade = document.createElement('td');
      const spanGrade = document.createElement('span');
      spanGrade.className = 'grade-badge';
      spanGrade.style.background = gradeBg;
      spanGrade.style.color = gradeColor;
      spanGrade.textContent = grade;
      tdGrade.appendChild(spanGrade);

      tr.appendChild(tdTime);
      tr.appendChild(tdLevel);
      tr.appendChild(tdAnnual);
      tr.appendChild(tdMonthly);
      tr.appendChild(tdGrade);

      tbody.appendChild(tr);
    });
  },
};

function updateAccessibleTable(tableBodyId, labels, values) {
  if (typeof document === 'undefined') return;
  const tbody = document.getElementById(tableBodyId);
  if (!tbody) return;
  tbody.textContent = '';
  labels.forEach((label, i) => {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.textContent = label;
    const td = document.createElement('td');
    td.textContent = typeof values[i] === 'number' ? values[i].toFixed(1) : String(values[i]);
    tr.appendChild(th);
    tr.appendChild(td);
    tbody.appendChild(tr);
  });
}

// Auto-initialize EcoDashboard on load
if (typeof App !== 'undefined') {
  EcoDashboard.init();
  window.EcoDashboard = EcoDashboard;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EcoDashboard;
  global.EcoDashboard = EcoDashboard;
}
