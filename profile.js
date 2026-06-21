/**
 * EcoTwin Carbon Twin Profile Page (profile.js)
 * ============================================
 * Handles rendering the dedicated full-screen profile overlay page.
 * Implements SVG avatar color shifting, Chart.js integrations, dynamic tips
 * linked directly to pledges, vertical timelines, and html2canvas exports.
 */

const ProfilePage = {
  categoryChart: null,
  benchmarkChart: null,
  historyChart: null,

  init() {
    // 1. Bind View Profile Badge Click
    const headerBadge = document.getElementById('header-user-badge');
    if (headerBadge) {
      headerBadge.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        this.open();
      });
      headerBadge.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.open();
        }
      });
    }

    // 2. Bind View My Twin Button
    const btnViewTwin = document.getElementById('btn-view-my-twin');
    if (btnViewTwin) {
      btnViewTwin.addEventListener('click', e => {
        e.preventDefault();
        this.open();
      });
    }

    // 3. Bind Close Button
    const btnCloseProfile = document.getElementById('btn-close-profile');
    if (btnCloseProfile) {
      btnCloseProfile.addEventListener('click', () => {
        this.close();
      });
    }

    // 4. Bind CTA diagnostics button
    const btnCtaDiagnostics = document.getElementById('btn-profile-cta-diagnostics');
    if (btnCtaDiagnostics) {
      btnCtaDiagnostics.addEventListener('click', () => {
        this.close();
        const diagnosticsScene = document.getElementById('scene-diagnostics');
        if (diagnosticsScene) {
          diagnosticsScene.scrollIntoView({ behavior: 'smooth' });
        }
        setTimeout(() => {
          if (window.App && typeof App.openFeatureModal === 'function') {
            App.openFeatureModal('dashboard');
          }
        }, 800);
      });
    }

    // 5. Bind Share Profile Button
    const btnShareProfile = document.getElementById('btn-share-profile');
    if (btnShareProfile) {
      btnShareProfile.addEventListener('click', () => {
        this.shareProfile();
      });
    }
  },

  open() {
    const overlay = document.getElementById('carbon-twin-profile-overlay');
    if (!overlay) return;

    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Lock background scroll

    // Check Diagnostics Quiz state
    const hasInputs = !!(
      window.App &&
      App.user &&
      App.user.dashboardInputs &&
      App.user.dashboardInputs.quizCompleted
    );
    const cta = document.getElementById('profile-incomplete-cta');
    const grid = document.getElementById('profile-complete-grid');

    if (!hasInputs) {
      if (cta) cta.style.display = 'flex';
      if (grid) grid.style.display = 'none';
      if (window.lucide) lucide.createIcons();
      return;
    }

    if (cta) cta.style.display = 'none';
    if (grid) grid.style.display = 'block';

    // Initialize/Render Profile contents
    this.render();
    this.renderCharts();
    this.renderRecommendations();
    this.renderTimeline();

    // Refresh Lucide Icons
    if (window.lucide) {
      lucide.createIcons();
    }
  },

  close() {
    const overlay = document.getElementById('carbon-twin-profile-overlay');
    if (overlay) {
      overlay.style.display = 'none';
      document.body.style.overflow = ''; // Restore scroll
    }
  },

  render() {
    const user = window.App
      ? App.user
      : { name: 'Guest User', rank: 'Carbon Rookie', level: 1, xp: 25 };

    // Render Google Profile Picture inside Profile Overlay
    const pfpContainer = document.getElementById('profile-google-pfp-container');
    if (pfpContainer) {
      pfpContainer.textContent = '';
      if (user.isLoggedIn && user.googleProfile && user.googleProfile.picture) {
        const img = document.createElement('img');
        img.src = user.googleProfile.picture;
        img.alt = user.name || 'User Profile';
        img.loading = 'lazy';
        pfpContainer.appendChild(img);
      } else {
        const initial =
          user.name && user.name.trim().length > 0 ? user.name.trim().charAt(0).toUpperCase() : 'U';
        pfpContainer.textContent = initial;
      }
    }

    // Set text displays
    document.getElementById('profile-twin-user-name').textContent = user.name || 'Guest User';
    document.getElementById('profile-twin-user-rank').textContent = user.rank || 'Carbon Rookie';
    document.getElementById('profile-twin-level-badge').textContent = `LVL ${user.level || 1}`;

    // Set XP progression
    const xp = user.xp !== undefined ? user.xp : 25;
    document.getElementById('profile-xp-current-display').textContent = `${xp} XP`;
    document.getElementById('profile-xp-bar-fill').style.width = `${xp}%`;

    // Compute carbon scores
    const categories = this.calculateTotalEmissions();
    const totalEmissionsKg = Object.values(categories).reduce((sum, v) => sum + v, 0);
    const userDaily = totalEmissionsKg / 365;

    // Stat Pills
    document.getElementById('profile-pill-score').textContent = `${userDaily.toFixed(1)} kg/day`;
    document.getElementById('profile-pill-rank').textContent = this.getGlobalRank(userDaily);

    // Compute badges count (Gourmet, Transit, Spark, Guardian, Legend milestone badges)
    const badgeCount = this.getUnlockedBadgesCount();
    document.getElementById('profile-pill-badges').textContent = `${badgeCount}/5`;

    // Color shift avatar SVG based on daily score (Paris Agreement 2.0 = green, 15.0+ = red)
    const baseColor = this.getAvatarColor(userDaily);
    const startStop = document.getElementById('profile-grad-stop-start');
    const endStop = document.getElementById('profile-grad-stop-end');
    if (startStop && endStop) {
      startStop.setAttribute('stop-color', baseColor);
      // Darker shading variant for 3D look
      const darkerColor = baseColor.replace('rgb', 'rgba').replace(')', ', 0.7)');
      endStop.setAttribute('stop-color', darkerColor);
    }
  },

  calculateTotalEmissions() {
    const inputs = (window.App && App.user && App.user.dashboardInputs) || {};

    // 1. Commute Emissions
    const commuteDistance = parseFloat(inputs.commuteDistance) || 15;
    const commuteMode = inputs.commuteMode || 'car';
    let modeMultiplier = 0.17; // Petrol car factor
    if (commuteMode === 'diesel') modeMultiplier = 0.175;
    if (commuteMode === 'hybrid') modeMultiplier = 0.11;
    if (commuteMode === 'ev') modeMultiplier = 0.045;
    if (commuteMode === 'bike') modeMultiplier = 0.08;
    if (commuteMode === 'metro' || commuteMode === 'transit') modeMultiplier = 0.03;
    if (commuteMode === 'walk' || commuteMode === 'remote') modeMultiplier = 0.0;
    const transportEmissions = commuteDistance * 365 * modeMultiplier; // kg/year

    // 2. Flight Travel Emissions
    const flights = inputs.flights || '0';
    let travelEmissions = 0;
    if (flights === '1-2') travelEmissions = 1100;
    if (flights === '3-5') travelEmissions = 3200;
    if (flights === '6+') travelEmissions = 6500;

    // 3. Food/Diet Emissions
    const diet = inputs.quizDiet || 'vegetarian';
    let foodEmissions = 1390; // vegetarian default
    if (diet === 'vegan') foodEmissions = 1054;
    if (diet === 'vegetarian') foodEmissions = 1390;
    if (diet === 'pescatarian') foodEmissions = 1427;
    if (diet === 'averageMeat') foodEmissions = 2054;
    if (diet === 'heavy-meat' || diet === 'nonveg') foodEmissions = 2650;

    // 4. Household Grid Energy
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

    // 5. Shopping & Online orders
    const onlineOrders = inputs.onlineOrders || '0-1';
    let shoppingEmissions = 120;
    if (onlineOrders === '2-3') shoppingEmissions = 380;
    if (onlineOrders === '4-5') shoppingEmissions = 750;
    if (onlineOrders === '6+') shoppingEmissions = 1300;

    // Home Heating & AC utilities
    const homeHeating = inputs.homeHeating || 'electric';
    let heatingEmissions = 2200;
    if (homeHeating === 'solar') heatingEmissions = 200;
    if (homeHeating === 'gas') heatingEmissions = 1200;

    // 6. Waste & Recycling
    const wasteRecycling = inputs.wasteRecycling || 'standard';
    let wasteEmissions = 400;
    if (wasteRecycling === 'zero-waste') wasteEmissions = 100;
    if (wasteRecycling === 'no-recycle') wasteEmissions = 900;

    // Purchasing/Lifestyle habits
    const purchasingHabits = inputs.purchasingHabits || 'standard';
    let purchasingEmissions = 600;
    if (purchasingHabits === 'minimalist') purchasingEmissions = 150;
    if (purchasingHabits === 'fashion-heavy') purchasingEmissions = 1800;

    return {
      transport: transportEmissions,
      diet: foodEmissions,
      energy: energyEmissions + heatingEmissions,
      shopping: shoppingEmissions + purchasingEmissions,
      flights: travelEmissions,
      waste: wasteEmissions,
    };
  },

  getAvatarColor(score) {
    // 2.0 kg/day or lower is Green, 15.0 or higher is Red
    const t = Math.max(0, Math.min(1, (score - 2.0) / (15.0 - 2.0)));
    const r = Math.round(52 + (239 - 52) * t); // 52 -> 239
    const g = Math.round(211 + (68 - 211) * t); // 211 -> 68
    const b = Math.round(153 + (68 - 153) * t); // 153 -> 68
    return `rgb(${r}, ${g}, ${b})`;
  },

  getGlobalRank(score) {
    // Scales dynamically with their performance
    const rank = Math.round(150 + Math.pow(score, 2.15) * 45);
    return `#${rank.toLocaleString()}`;
  },

  getUnlockedBadgesCount() {
    let count = 0;
    const inputs = (window.App && App.user && App.user.dashboardInputs) || {};
    const lvl = window.App ? App.user.level : 1;

    // Green Gourmet
    let isGourmet =
      inputs.quizDiet === 'vegan' ||
      inputs.quizDiet === 'vegetarian' ||
      inputs.calcMeat === 'never';
    const savedDiet =
      typeof Utils !== 'undefined'
        ? Utils.storage.getItem('eco_diet_calculator')
        : JSON.parse(localStorage.getItem('eco_diet_calculator') || 'null');
    if (savedDiet) {
      try {
        const parsed = JSON.parse(savedDiet);
        if (parsed.redMeat === 0) isGourmet = true;
      } catch (e) {}
    }
    if (isGourmet) count++;

    // Transit Wizard
    const isTransit =
      inputs.commuteMode === 'bike' ||
      inputs.commuteMode === 'walk' ||
      inputs.commuteMode === 'metro' ||
      inputs.commuteMode === 'transit' ||
      inputs.commuteMode === 'remote' ||
      inputs.calcCommute === 'walk' ||
      inputs.calcCommute === 'transit' ||
      inputs.calcCommute === 'remote';
    if (isTransit) count++;

    // Clean Spark
    const isSpark = inputs.homeHeating === 'solar' || inputs.calcEnergyClean === true;
    if (isSpark) count++;

    // Guardian & Legend
    if (lvl >= 3) count++;
    if (lvl >= 5) count++;

    return count;
  },

  renderCharts() {
    // 1. Destroy existing instances
    if (this.categoryChart) this.categoryChart.destroy();
    if (this.benchmarkChart) this.benchmarkChart.destroy();
    if (this.historyChart) this.historyChart.destroy();

    const categories = this.calculateTotalEmissions();
    const totalDaily = Object.values(categories).reduce((sum, v) => sum + v, 0) / 365;

    // Center Display Overlay
    document.getElementById('profile-doughnut-center-val').textContent = totalDaily.toFixed(1);

    // Dynamic categories arrays
    const categoryLabels = ['Transport', 'Diet', 'Energy', 'Shopping', 'Flights', 'Waste'];
    const categoryValues = [
      categories.transport / 365,
      categories.diet / 365,
      categories.energy / 365,
      categories.shopping / 365,
      categories.flights / 365,
      categories.waste / 365,
    ];
    const categoryColors = ['#06b6d4', '#10b981', '#fbbf24', '#a78bfa', '#3b82f6', '#f43f5e'];

    // ── CHART 1: Category Doughnut ──────────────────────────────
    const ctxCategory = document.getElementById('profile-category-chart').getContext('2d');
    updateAccessibleTable('profile-category-chart-table-body', categoryLabels, categoryValues);
    this.categoryChart = new Chart(ctxCategory, {
      type: 'doughnut',
      data: {
        labels: categoryLabels,
        datasets: [
          {
            data: categoryValues,
            backgroundColor: categoryColors,
            borderWidth: 1,
            borderColor: 'rgba(10, 15, 12, 0.9)',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        cutout: '72%',
      },
    });

    // Custom Legend
    const legendContainer = document.getElementById('profile-category-legend');
    legendContainer.innerHTML = '';
    categoryLabels.forEach((label, idx) => {
      const val = categoryValues[idx];
      const percent = totalDaily > 0 ? Math.round((val / totalDaily) * 100) : 0;

      const item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = DOMPurify.sanitize(`
        <div class="legend-label-wrapper">
          <span class="legend-color-dot" style="background: ${categoryColors[idx]}"></span>
          <span>${label}</span>
        </div>
        <span class="legend-val">${val.toFixed(1)} kg (${percent}%)</span>
      `);
      legendContainer.appendChild(item);
    });

    // ── CHART 2: Benchmark Comparison ────────────────────────────
    const ctxBenchmark = document.getElementById('profile-benchmark-chart').getContext('2d');

    // Color code benchmarks: Green <= 2.0 (Paris), Amber <= 4.7 (World), Red > 4.7
    const youColor = totalDaily <= 2.0 ? '#10b981' : totalDaily <= 4.7 ? '#fbbf24' : '#f43f5e';
    const benchmarkColors = [youColor, '#475569', '#475569', '#475569', '#475569', '#10b981'];

    // Paris target plugin
    const parisLinePlugin = {
      id: 'parisLine',
      afterDraw(chart) {
        const {
          ctx,
          chartArea: { top, bottom },
          scales: { x },
        } = chart;
        const xPos = x.getPixelForValue(2.0);
        if (xPos >= chart.chartArea.left && xPos <= chart.chartArea.right) {
          ctx.save();
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(xPos, top);
          ctx.lineTo(xPos, bottom);
          ctx.stroke();

          ctx.fillStyle = '#34d399';
          ctx.font = '10px Inter';
          ctx.fillText('Paris Target (2.0)', xPos + 5, top + 15);
          ctx.restore();
        }
      },
    };

    updateAccessibleTable(
      'profile-benchmark-chart-table-body',
      ['You', 'India avg', 'World avg', 'EU avg', 'US avg', 'Paris Target'],
      [totalDaily, 1.8, 4.7, 8.2, 16.0, 2.0]
    );
    this.benchmarkChart = new Chart(ctxBenchmark, {
      type: 'bar',
      data: {
        labels: ['You', 'India avg', 'World avg', 'EU avg', 'US avg', 'Paris Target'],
        datasets: [
          {
            label: 'Daily Score (kg CO2)',
            data: [totalDaily, 1.9, 4.7, 6.4, 14.5, 2.0],
            backgroundColor: benchmarkColors,
            borderRadius: 6,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#94a3b8' },
          },
          y: {
            grid: { display: false },
            ticks: { color: '#cbd5e1' },
          },
        },
      },
      plugins: [parisLinePlugin],
    });

    // ── CHART 3: Historical Line ─────────────────────────────────
    const ctxHistory = document.getElementById('profile-history-chart').getContext('2d');

    // Fetch History
    let history = [];
    const saved =
      typeof Utils !== 'undefined'
        ? Utils.storage.getItem('eco_diagnostic_history')
        : JSON.parse(localStorage.getItem('eco_diagnostic_history') || '[]');
    if (saved) {
      try {
        history = typeof saved === 'string' ? JSON.parse(saved) : saved;
      } catch (e) {}
    }

    const placeholderMsg = document.getElementById('profile-history-placeholder-msg');
    let labels, dataValues;

    if (history.length < 3) {
      // Use sample data if history has fewer than 3 runs
      placeholderMsg.style.display = 'block';
      labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7'];
      dataValues = [12.5, 11.2, 10.4, 9.8, 8.4, 6.2, totalDaily];
    } else {
      placeholderMsg.style.display = 'none';
      // Map history entries in chronological order
      const reversed = [...history].reverse();
      labels = reversed.map(h => h.timestamp);
      dataValues = reversed.map(h => (parseFloat(h.score) * 1000) / 365);
    }

    // Average line plugin
    const averageLinePlugin = {
      id: 'averageLine',
      afterDraw(chart) {
        const {
          ctx,
          chartArea: { left, right },
          scales: { y },
        } = chart;
        const dataset = chart.data.datasets[0].data;
        const avg = dataset.reduce((sum, v) => sum + v, 0) / dataset.length;
        const yPos = y.getPixelForValue(avg);

        ctx.save();
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(left, yPos);
        ctx.lineTo(right, yPos);
        ctx.stroke();

        ctx.fillStyle = '#34d399';
        ctx.font = '10px Inter';
        ctx.fillText(`Avg: ${avg.toFixed(1)} kg`, left + 10, yPos - 6);
        ctx.restore();
      },
    };

    updateAccessibleTable('profile-history-chart-table-body', labels, dataValues);
    this.historyChart = new Chart(ctxHistory, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Daily Footprint',
            data: dataValues,
            borderColor: '#34d399',
            backgroundColor: 'rgba(52, 211, 153, 0.1)',
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#34d399',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label(context) {
                const score = context.raw;
                const index = context.dataIndex;
                if (index > 0) {
                  const prev = context.dataset.data[index - 1];
                  const delta = score - prev;
                  const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '=';
                  return `Footprint: ${score.toFixed(1)} kg (${arrow} ${Math.abs(delta).toFixed(1)} kg)`;
                }
                return `Footprint: ${score.toFixed(1)} kg`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8' },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#94a3b8' },
          },
        },
      },
      plugins: [averageLinePlugin],
    });
  },

  renderRecommendations() {
    const inputs = (window.App && App.user && App.user.dashboardInputs) || {};
    const grid = document.getElementById('profile-recommendations-grid');
    if (!grid) return;

    const recs = this.getRecommendationsForInputs(inputs);
    grid.innerHTML = '';

    recs.forEach((rec, idx) => {
      const card = document.createElement('div');
      card.className = 'profile-rec-card';

      const isAlreadyPledged = this.hasPledge(rec.pledge);
      const btnText = isAlreadyPledged ? 'Pledge Taken' : 'Take Pledge';
      const btnDisabledAttr = isAlreadyPledged ? 'disabled' : '';

      card.innerHTML = DOMPurify.sanitize(`
        <div class="rec-card-header">
          <i data-lucide="${EcoUtils.escapeHTML(rec.icon)}"></i>
          <span>${EcoUtils.escapeHTML(rec.label)}</span>
        </div>
        <p class="rec-card-habit">${EcoUtils.escapeHTML(rec.habit)}</p>
        <p class="rec-card-impact">${EcoUtils.escapeHTML(rec.impact)}</p>
        <p class="rec-card-tip">${EcoUtils.escapeHTML(rec.tip)}</p>
        <button class="rec-card-btn-pledge" data-idx="${idx}" ${btnDisabledAttr}>
          <i data-lucide="check-square"></i> ${EcoUtils.escapeHTML(btnText)}
        </button>
      `);

      // Bind Pledge Click
      const btn = card.querySelector('.rec-card-btn-pledge');
      btn.addEventListener('click', () => {
        if (window.EcoPledges) {
          window.EcoPledges.addPledge(rec.pledge, rec.category);
          btn.disabled = true;
          btn.innerHTML = DOMPurify.sanitize('<i data-lucide="check-square"></i> Pledge Taken');
          // Grant XP via App.addXp if defined
          if (window.App && typeof App.addXp === 'function') {
            App.addXp(10, `Pledged to: ${rec.pledge.substring(0, 20)}...`);
          }
        }
      });

      grid.appendChild(card);
    });
  },

  getRecommendationsForInputs(inputs) {
    const recs = [];

    // 1. COMMUTE RECOMMENDATION
    const commuteDistance = parseFloat(inputs.commuteDistance) || 0;
    const commuteMode = inputs.commuteMode || 'car';
    const flights = inputs.flights || '0';

    if (commuteDistance > 0 && (commuteMode === 'car' || commuteMode === 'diesel')) {
      const dailyEmissions = commuteDistance * 0.17;
      const potentialSavings = (commuteDistance * (0.17 - 0.03) * 3) / 7;
      recs.push({
        category: 'transport',
        icon: 'car',
        label: 'Transport Habit',
        habit: `You drive ${commuteDistance} km/day by car.`,
        impact: `This produces ${dailyEmissions.toFixed(1)} kg CO2 — which is above target averages.`,
        tip: `Switch to public transit or cycling 3 days/week -> saves ~${potentialSavings.toFixed(1)} kg CO2/day.`,
        pledge: `I pledge to commute by metro or active transit 3 days/week.`,
      });
    } else if (flights !== '0' && flights !== 'none') {
      recs.push({
        category: 'transport',
        icon: 'plane',
        label: 'Aviation Footprint',
        habit: `You travel by air multiple times per year (${flights} flights).`,
        impact: `Aviation contributes the highest carbon multiplier per passenger km.`,
        tip: `Switch short business flights to high-speed rail -> saves up to 250 kg CO2 per single trip.`,
        pledge: `I pledge to substitute business flights with rail travel when available.`,
      });
    } else {
      recs.push({
        category: 'transport',
        icon: 'bike',
        label: 'Transport Mastery',
        habit: `You walk, cycle, or commute via public transit.`,
        impact: `Your transit emissions are highly optimized.`,
        tip: `Keep up the good habits! Join local green transit cycling groups to advocate for bike lanes.`,
        pledge: `I pledge to promote eco-friendly cycling routes in my community.`,
      });
    }

    // 2. DIET RECOMMENDATION
    const diet = inputs.quizDiet || 'vegetarian';
    const calcMeat = inputs.calcMeat;

    if (diet === 'heavy-meat' || diet === 'nonveg' || calcMeat === 'daily') {
      recs.push({
        category: 'diet',
        icon: 'utensils',
        label: 'Dietary Emissions',
        habit: `Your diet choice includes red meat or daily poultry.`,
        impact: `Meat lover diets produce 7.3 kg CO2/day (2.5x a plant-based vegan diet).`,
        tip: `Go meatless 3 days a week by swapping to vegetarian options -> saves ~1.5 kg CO2/day.`,
        pledge: `I pledge to go meatless 3 days a week by swapping to plant-based meals.`,
      });
    } else if (diet === 'vegetarian') {
      recs.push({
        category: 'diet',
        icon: 'leaf',
        label: 'Vegetarian Footprint',
        habit: `You eat a vegetarian diet.`,
        impact: `Dairy products contribute ~3.8 kg CO2/day.`,
        tip: `Try transitioning to a fully plant-based vegan diet -> saves ~0.9 kg CO2/day.`,
        pledge: `I pledge to try vegan alternatives for milk, cheese, and curds.`,
      });
    } else {
      recs.push({
        category: 'diet',
        icon: 'sprout',
        label: 'Vegan Champion',
        habit: `You follow a low-carbon vegan diet.`,
        impact: `Your food emissions are highly optimized (~2.9 kg CO2/day).`,
        tip: `Prioritize local zero-packaging organic farm vegetables to optimize food miles.`,
        pledge: `I pledge to choose packaging-free, organic local farm produce.`,
      });
    }

    // 3. UTILITIES RECOMMENDATION
    const heating = inputs.homeHeating || 'electric';
    const energyClean = inputs.calcEnergyClean;

    if (heating === 'electric' || heating === 'gas') {
      recs.push({
        category: 'energy',
        icon: 'zap',
        label: 'Home Utilities',
        habit: `Your household relies on ${heating} grid power.`,
        impact: `Grid utilities average high CO2 emissions per household unit.`,
        tip: `Subscribe to a clean utility provider or switch to smart LED lighting -> saves ~1.5 kg CO2/day.`,
        pledge: `I pledge to switch to a 100% renewable utility plan or install smart LEDs.`,
      });
    } else {
      recs.push({
        category: 'energy',
        icon: 'sun',
        label: 'Renewable Power',
        habit: `You utilize solar grid mix utility options.`,
        impact: `Your utilities footprint is optimized.`,
        tip: `Install smart home standby power strips to shut down idle phantom draws at night.`,
        pledge: `I pledge to completely power down idle utility standby devices before bed.`,
      });
    }

    return recs;
  },

  hasPledge(text) {
    let pledges = [];
    const saved =
      typeof Utils !== 'undefined'
        ? Utils.storage.getItem('eco_pledges_stars')
        : JSON.parse(localStorage.getItem('eco_pledges_stars') || '[]');
    if (saved) {
      try {
        pledges = typeof saved === 'string' ? JSON.parse(saved) : saved;
      } catch (e) {}
    }
    return pledges.some(p => p.text === text);
  },

  renderTimeline() {
    const inputs = (window.App && App.user && App.user.dashboardInputs) || {};
    const lvl = window.App ? App.user.level : 1;
    const timeline = document.getElementById('profile-badges-timeline');
    if (!timeline) return;

    // Check unlocked status dynamically
    let isGourmet =
      inputs.quizDiet === 'vegan' ||
      inputs.quizDiet === 'vegetarian' ||
      inputs.calcMeat === 'never';
    const savedDiet =
      typeof Utils !== 'undefined'
        ? Utils.storage.getItem('eco_diet_calculator')
        : JSON.parse(localStorage.getItem('eco_diet_calculator') || 'null');
    if (savedDiet) {
      try {
        const parsed = JSON.parse(savedDiet);
        if (parsed.redMeat === 0) isGourmet = true;
      } catch (e) {}
    }

    const isTransit =
      inputs.commuteMode === 'bike' ||
      inputs.commuteMode === 'walk' ||
      inputs.commuteMode === 'metro' ||
      inputs.commuteMode === 'transit' ||
      inputs.commuteMode === 'remote' ||
      inputs.calcCommute === 'walk' ||
      inputs.calcCommute === 'transit' ||
      inputs.calcCommute === 'remote';

    const isSpark = inputs.homeHeating === 'solar' || inputs.calcEnergyClean === true;

    const badges = [
      {
        id: 'badge-gourmet',
        title: '🥗 Green Gourmet',
        unlocked: isGourmet,
        condition: 'Adopt a Vegan or Vegetarian diet in the calculators or quiz.',
        quote: 'Savoring the flavor of sustainability, one plant at a time.',
      },
      {
        id: 'badge-transit',
        title: '🚴 Transit Wizard',
        unlocked: isTransit,
        condition: 'Opt for low-emission transport: Walk, Cycle, or Metro.',
        quote: 'Steering clear of carbon roads. The future travels light.',
      },
      {
        id: 'badge-spark',
        title: '⚡ Clean Spark',
        unlocked: isSpark,
        condition: 'Subscribe to renewable utilities or solar home grid plans.',
        quote: 'Igniting change with pure, everlasting energy.',
      },
      {
        id: 'badge-guardian',
        title: '🛡️ Ecosystem Guardian',
        unlocked: lvl >= 3,
        condition: 'Earn XP and level up to Level 3.',
        quote: 'Standing watch over our delicate biosphere.',
      },
      {
        id: 'badge-legend',
        title: '🌟 Planetary Legend',
        unlocked: lvl >= 5,
        condition: 'Reach Level 5 to unlock global ecological prestige.',
        quote: "A beacon of hope for Earth's sustainable future.",
      },
    ];

    // Load dates
    const savedDates =
      typeof Utils !== 'undefined'
        ? Utils.storage.getItem('eco_badge_unlock_dates')
        : JSON.parse(localStorage.getItem('eco_badge_unlock_dates') || 'null');
    let badgeDates = savedDates
      ? typeof savedDates === 'string'
        ? JSON.parse(savedDates)
        : savedDates
      : {};
    let datesChanged = false;

    timeline.innerHTML = '';
    badges.forEach(b => {
      const node = document.createElement('div');
      node.className = `timeline-node ${b.unlocked ? 'unlocked' : 'locked'}`;

      let dateDisplay = '';
      if (b.unlocked) {
        if (!badgeDates[b.id]) {
          badgeDates[b.id] = new Date().toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
          datesChanged = true;
        }
        dateDisplay = `Unlocked: ${badgeDates[b.id]}`;
      } else {
        dateDisplay = 'Locked';
      }

      node.innerHTML = DOMPurify.sanitize(`
        <span class="timeline-dot"></span>
        <div class="timeline-header">
          <span class="timeline-title">${EcoUtils.escapeHTML(b.title)}</span>
          <span class="timeline-date">${EcoUtils.escapeHTML(dateDisplay)}</span>
        </div>
        <p class="timeline-desc">${EcoUtils.escapeHTML(b.unlocked ? 'Achievement unlocked!' : b.condition)}</p>
        ${b.unlocked ? `<p class="timeline-quote">"${EcoUtils.escapeHTML(b.quote)}"</p>` : ''}
      `);
      timeline.appendChild(node);
    });

    if (datesChanged) {
      if (typeof Utils !== 'undefined') {
        Utils.storage.setItem('eco_badge_unlock_dates', badgeDates);
      } else {
        localStorage.setItem('eco_badge_unlock_dates', JSON.stringify(badgeDates));
      }
    }

    // ── Render XP History list ─────────────────────────────────────
    const user = window.App ? App.user : { xpHistory: [] };
    const xpHistory = user.xpHistory || [];

    // Fallback sample values if empty
    if (xpHistory.length === 0) {
      user.xpHistory = [
        {
          text: '✅ Completed Diagnostics Quiz +15 XP',
          timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
        },
        {
          text: '✅ Completed Weekly Challenge +25 XP',
          timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
        },
        { text: '✅ Created Star Pledge +10 XP', timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000 },
      ];
    }

    const xpList = document.getElementById('profile-xp-history-list');
    if (xpList) {
      xpList.innerHTML = '';
      (user.xpHistory || []).forEach(item => {
        const row = document.createElement('div');
        row.className = 'xp-log-item';

        const daysAgo = Math.round((Date.now() - item.timestamp) / (24 * 60 * 60 * 1000));
        const timeText = daysAgo <= 0 ? 'today' : `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;

        row.innerHTML = DOMPurify.sanitize(`
          <span>${EcoUtils.escapeHTML(item.text)}</span>
          <span class="xp-log-date">${EcoUtils.escapeHTML(timeText)}</span>
        `);
        xpList.appendChild(row);
      });
    }
  },

  shareProfile() {
    const target = document.getElementById('profile-card-capture-target');
    if (!target) return;

    if (typeof html2canvas === 'function') {
      if (window.App && App.showToast) App.showToast('📸 Capturing profile scorecard...');

      html2canvas(target, {
        backgroundColor: '#0a0f0c',
        scale: 2,
        logging: false,
      })
        .then(canvas => {
          const link = document.createElement('a');
          link.download = `ecotwin_profile_${(window.App ? App.user.name : 'Warrior').replace(/\s+/g, '_')}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();

          if (window.App && App.showToast) App.showToast('🌟 Profile downloaded!');
        })
        .catch(err => {
          console.error('Profile capture failed:', err);
          if (window.App && App.showToast) App.showToast('❌ Profile capture failed.');
        });
    } else {
      if (window.App && App.showToast) App.showToast('Screenshot capture helper not loaded.');
    }
  },
};

// Auto-initialize when file is loaded
if (typeof window !== 'undefined') {
  window.ProfilePage = ProfilePage;
  document.addEventListener('DOMContentLoaded', () => {
    ProfilePage.init();
  });
}

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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProfilePage;
}
