/**
 * EcoTwin Diagnostics Module (diagnostics.js)
 * ============================================
 * Handles the 10-step carbon emissions diagnostics quiz,
 * footprint calculation logic, recommendation card generation,
 * and diagnostic history tracking.
 */

App.initDiagnosticsQuiz = function () {
  const root = document.querySelector('.feature-dedicated-page') || document;

  // Quiz state tracking
  this.quizStep = 1;

  // Check if quiz inputs exist in session, else set defaults
  const inputs = this.user.dashboardInputs;
  if (inputs.commuteDistance === undefined) inputs.commuteDistance = null;
  if (inputs.commuteMode === undefined) inputs.commuteMode = null;
  if (inputs.electricityBill === undefined) inputs.electricityBill = null;
  if (inputs.quizDiet === undefined) inputs.quizDiet = null;
  if (inputs.flights === undefined) inputs.flights = null;
  if (inputs.onlineOrders === undefined) inputs.onlineOrders = null;
  if (inputs.householdSize === undefined) inputs.householdSize = null;
  if (inputs.homeHeating === undefined) inputs.homeHeating = null;
  if (inputs.wasteRecycling === undefined) inputs.wasteRecycling = null;
  if (inputs.purchasingHabits === undefined) inputs.purchasingHabits = null;

  // UI elements
  const quizFlow = root.querySelector('#diagnostics-quiz-flow');
  const resultsPanel = root.querySelector('#diagnostics-results-panel');
  const stepTag = root.querySelector('#current-quiz-step');
  const progressBar = root.querySelector('#quiz-progress-bar');
  const backBtn = root.querySelector('#quiz-back-btn');

  const showStep = stepNum => {
    this.quizStep = stepNum;

    // Update step tag
    if (stepTag) stepTag.textContent = stepNum;

    // Update progress bar width
    if (progressBar) progressBar.style.width = `${(stepNum / 10) * 100}%`;

    // Hide back link on step 1, show otherwise
    if (backBtn) {
      backBtn.style.opacity = stepNum === 1 ? '0.3' : '1';
      backBtn.style.pointerEvents = stepNum === 1 ? 'none' : 'auto';
    }

    // Translate the slider track for horizontal movement
    const track = root.querySelector('#quiz-cards-slider-track');
    if (track) {
      track.style.transform = `translateX(-${(stepNum - 1) * 10}%)`;
    }

    // Show only active step card
    root.querySelectorAll('.quiz-card').forEach(card => {
      const cardStep = parseInt(card.dataset.step);
      if (cardStep === stepNum) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  };

  // Initialize Question 1 Commute Distance Slider & Continue Button
  const distanceSlider = root.querySelector('#commute-distance-slider');
  const distanceInput = root.querySelector('#commute-distance-input');
  const distanceVal = root.querySelector('#commute-distance-val');

  if (distanceInput) {
    distanceInput.value = inputs.commuteDistance !== null ? inputs.commuteDistance : '';
    distanceInput.addEventListener('input', e => {
      const val = parseFloat(e.target.value) || 0;
      inputs.commuteDistance = val;
      if (distanceSlider) distanceSlider.value = val;
      if (distanceVal) distanceVal.textContent = val;
      this.saveSession();
    });
  }

  if (distanceSlider) {
    // Load from session if present
    distanceSlider.value = inputs.commuteDistance !== null ? inputs.commuteDistance : 0;
    if (distanceVal) distanceVal.textContent = distanceSlider.value;
    inputs.commuteDistance = parseFloat(distanceSlider.value);

    distanceSlider.addEventListener('input', e => {
      const val = parseFloat(e.target.value) || 0;
      if (distanceVal) distanceVal.textContent = val;
      if (distanceInput) distanceInput.value = val;
      inputs.commuteDistance = val;
      this.saveSession();
    });
  }

  const continueQ1Btn = root.querySelector('#btn-q1-continue');
  if (continueQ1Btn) {
    continueQ1Btn.addEventListener('click', () => {
      showStep(2);
    });
  }

  // Initialize Question 3 Electricity Bill Input & Continue Button
  const electricityInput = root.querySelector('#electricity-bill-input');
  if (electricityInput) {
    electricityInput.value = inputs.electricityBill !== null ? inputs.electricityBill : '';
    electricityInput.addEventListener('input', e => {
      inputs.electricityBill = parseFloat(e.target.value) || 0;
      this.saveSession();
    });
  }

  const continueQ3Btn = root.querySelector('#btn-q3-continue');
  if (continueQ3Btn) {
    continueQ3Btn.addEventListener('click', () => {
      showStep(4);
    });
  }

  // Initialize Question 7 Household Size Input & Continue Button
  const householdInput = root.querySelector('#household-size-input');
  if (householdInput) {
    householdInput.value = inputs.householdSize !== null ? inputs.householdSize : '';
    householdInput.addEventListener('input', e => {
      inputs.householdSize = parseInt(e.target.value) || 1;
      this.saveSession();
    });
  }

  const continueQ7Btn = root.querySelector('#btn-q7-continue');
  if (continueQ7Btn) {
    continueQ7Btn.addEventListener('click', () => {
      showStep(8);
    });
  }

  // Set active state for pre-selected options in the DOM & bind click handlers
  const optionGridSync = (stepNum, valKey, inputsVal) => {
    const cards = root.querySelectorAll(`.quiz-card[data-step="${stepNum}"] .quiz-option-card`);
    cards.forEach(card => {
      const cardVal = card.dataset.val;
      if (inputsVal !== null && cardVal === String(inputsVal)) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }

      // Accessibility attributes
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      const cardTitle = card.querySelector('h4')?.textContent || 'Option';
      card.setAttribute('aria-label', `Select ${cardTitle}`);

      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });

      card.addEventListener('click', () => {
        // Select option
        cards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        inputs[valKey] = cardVal;
        this.saveSession();

        // Advance to next step after a tiny delay
        setTimeout(() => {
          if (stepNum < 10) {
            showStep(stepNum + 1);
          } else {
            this.finishDiagnosticsQuiz();
          }
        }, 300);
      });
    });
  };

  // Bind Auto-advance handlers for option grid questions
  optionGridSync(2, 'commuteMode', inputs.commuteMode);
  optionGridSync(3, 'electricityBill', inputs.electricityBill);
  optionGridSync(4, 'quizDiet', inputs.quizDiet);
  optionGridSync(5, 'flights', inputs.flights);
  optionGridSync(6, 'onlineOrders', inputs.onlineOrders);
  optionGridSync(7, 'householdSize', inputs.householdSize);
  optionGridSync(8, 'homeHeating', inputs.homeHeating);
  optionGridSync(9, 'wasteRecycling', inputs.wasteRecycling);
  optionGridSync(10, 'purchasingHabits', inputs.purchasingHabits);

  // Bind back navigation button
  if (backBtn) {
    backBtn.replaceWith(backBtn.cloneNode(true)); // remove previous listeners
    const newBackBtn = root.querySelector('#quiz-back-btn');
    newBackBtn.addEventListener('click', e => {
      e.preventDefault();
      if (this.quizStep > 1) {
        showStep(this.quizStep - 1);
      }
    });
  }

  // Bind retake/restart results button
  const restartBtn = root.querySelector('#btn-retake-quiz');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      inputs.quizCompleted = false;
      inputs.commuteDistance = null;
      inputs.commuteMode = null;
      inputs.electricityBill = null;
      inputs.quizDiet = null;
      inputs.flights = null;
      inputs.onlineOrders = null;
      inputs.householdSize = null;
      inputs.homeHeating = null;
      inputs.wasteRecycling = null;
      inputs.purchasingHabits = null;
      this.saveSession();

      // Reset input fields in the UI
      if (distanceInput) distanceInput.value = '';
      if (electricityInput) electricityInput.value = '';
      if (householdInput) householdInput.value = '';
      if (distanceSlider) {
        distanceSlider.value = 0;
        if (distanceVal) distanceVal.textContent = '0';
      }
      root.querySelectorAll('.quiz-option-card').forEach(c => c.classList.remove('active'));

      if (quizFlow) quizFlow.style.display = 'flex';
      if (resultsPanel) resultsPanel.style.display = 'none';

      showStep(1);
    });
  }

  // Check if quiz was already completed, show results directly
  if (inputs.quizCompleted) {
    if (quizFlow) quizFlow.style.display = 'none';
    if (resultsPanel) resultsPanel.style.display = 'block';
    this.calculateDiagnosticsEmissions();
  } else {
    if (quizFlow) quizFlow.style.display = 'flex';
    if (resultsPanel) resultsPanel.style.display = 'none';
    showStep(1);
  }
};

App.finishDiagnosticsQuiz = function () {
  const root = document.querySelector('.feature-dedicated-page') || document;
  const inputs = this.user.dashboardInputs;
  inputs.quizCompleted = true;
  this.addXp(15, 'Completed Diagnostics Scan');

  const quizFlow = root.querySelector('#diagnostics-quiz-flow');
  const resultsPanel = root.querySelector('#diagnostics-results-panel');

  if (quizFlow) quizFlow.style.display = 'none';
  if (resultsPanel) {
    resultsPanel.style.display = 'block';
    resultsPanel.style.opacity = 0;
    setTimeout(() => {
      resultsPanel.style.transition = 'opacity 0.6s ease';
      resultsPanel.style.opacity = 1;
    }, 50);
  }

  this.calculateDiagnosticsEmissions();
};

App.calculateDiagnosticsEmissions = function () {
  this.updateDashboardLockState();
  const root = document.querySelector('.feature-dedicated-page') || document;
  const inputs = this.user.dashboardInputs;

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

  // New Question 8: Home Heating & AC
  const homeHeating = inputs.homeHeating || 'electric';
  let heatingEmissions = 2200;
  if (homeHeating === 'solar') heatingEmissions = 200;
  if (homeHeating === 'gas') heatingEmissions = 1200;

  // New Question 9: Waste & Recycling
  const wasteRecycling = inputs.wasteRecycling || 'standard';
  let wasteEmissions = 400;
  if (wasteRecycling === 'zero-waste') wasteEmissions = 100;
  if (wasteRecycling === 'no-recycle') wasteEmissions = 900;

  // New Question 10: Purchasing Habits
  const purchasingHabits = inputs.purchasingHabits || 'standard';
  let purchasingEmissions = 600;
  if (purchasingHabits === 'minimalist') purchasingEmissions = 150;
  if (purchasingHabits === 'fashion-heavy') purchasingEmissions = 1800;

  // Total annual emissions in kg (incorporating new parameters)
  const totalEmissionsKg =
    transportEmissions +
    travelEmissions +
    foodEmissions +
    energyEmissions +
    shoppingEmissions +
    heatingEmissions +
    wasteEmissions +
    purchasingEmissions;
  const monthlyEmissionsKg = Math.round(totalEmissionsKg / 12);
  const annualFootprintT = parseFloat((totalEmissionsKg / 1000).toFixed(2));

  // Diagnostics Score (scaled by 220 for 10-question coverage)
  const score = Math.max(10, Math.min(100, Math.round(100 - totalEmissionsKg / 220)));

  // Top Contributor
  const categories = [
    { name: 'TRANSPORT', val: transportEmissions, label: 'Transport' },
    { name: 'TRAVEL', val: travelEmissions, label: 'Travel' },
    { name: 'FOOD', val: foodEmissions, label: 'Food' },
    { name: 'ENERGY', val: energyEmissions + heatingEmissions, label: 'Energy' },
    {
      name: 'SHOPPING',
      val: shoppingEmissions + wasteEmissions + purchasingEmissions,
      label: 'Shopping',
    },
  ];
  categories.sort((a, b) => b.val - a.val);
  const topContributor = categories[0];
  const topContributorPercent = Math.round((topContributor.val / totalEmissionsKg) * 100);
  const topContributorMonthly = Math.round(topContributor.val / 12);

  // Update Results Panel DOM if open
  const scoreVal = root.querySelector('#result-iq-score');
  if (scoreVal) scoreVal.textContent = `${score}/100`;

  const monthlyVal = root.querySelector('#result-monthly-co2');
  if (monthlyVal) monthlyVal.textContent = `${monthlyEmissionsKg} kg`;

  const annualVal = root.querySelector('#result-annual-co2');
  if (annualVal) annualVal.textContent = `${annualFootprintT.toFixed(2)} t`;

  const topVal = root.querySelector('#result-top-contributor');
  if (topVal) topVal.textContent = topContributor.name;

  const topSubVal = root.querySelector('#result-top-contributor-sub');
  if (topSubVal)
    topSubVal.textContent = `${topContributorMonthly} kg CO₂ / mo (${topContributorPercent}%)`;

  // Update SVG Circular progress rings (circumference = 213 for home, 201 for modal)
  const updateRing = (type, valKg, totalKg) => {
    const pct = totalKg > 0 ? Math.round((valKg / totalKg) * 100) : 0;

    // Update Home Page Rings (if they exist)
    const homeProgressEl = document.getElementById(`home-ring-progress-${type}`);
    const homePercentEl = document.getElementById(`home-ring-percent-${type}`);
    const homeValEl = document.getElementById(`home-ring-val-${type}`);

    if (homeProgressEl) {
      const offset = 213 - (213 * pct) / 100;
      homeProgressEl.style.strokeDashoffset = offset;
    }
    if (homePercentEl) homePercentEl.textContent = `${pct}%`;
    if (homeValEl) homeValEl.textContent = `${Math.round(valKg / 12)} kg`;

    // Update Modal/Dedicated Page Rings (if they exist)
    const modalProgressEl =
      root.querySelector(`#modal-ring-progress-${type}`) ||
      document.getElementById(`modal-ring-progress-${type}`);
    const modalPercentEl =
      root.querySelector(`#modal-ring-percent-${type}`) ||
      document.getElementById(`modal-ring-percent-${type}`);
    const modalValEl =
      root.querySelector(`#modal-ring-val-${type}`) ||
      document.getElementById(`modal-ring-val-${type}`);

    if (modalProgressEl) {
      const offset = 201 - (201 * pct) / 100;
      modalProgressEl.style.strokeDashoffset = offset;
    }
    if (modalPercentEl) modalPercentEl.textContent = `${pct}%`;
    if (modalValEl) modalValEl.textContent = `${Math.round(valKg / 12)} kg`;
  };

  updateRing('food', foodEmissions, totalEmissionsKg);
  updateRing('transport', transportEmissions + travelEmissions, totalEmissionsKg);
  updateRing('energy', energyEmissions + heatingEmissions, totalEmissionsKg);
  updateRing(
    'shopping',
    shoppingEmissions + wasteEmissions + purchasingEmissions,
    totalEmissionsKg
  );

  const profileTotalScore = document.getElementById('profile-total-score');
  if (profileTotalScore) {
    profileTotalScore.textContent = `${Math.round(totalEmissionsKg)} kg CO₂/yr`;
  }
  const tons = (Math.round(totalEmissionsKg / 100) / 10).toFixed(1);
  this.logDiagnosticHistory(tons);

  // Call achievements update
  this.updateAchievements();

  // Benchmarks
  const indianBadge = root.querySelector('#benchmark-indian-badge');
  const urbanBadge = root.querySelector('#benchmark-urban-badge');

  if (indianBadge) {
    const diff = Math.round(((monthlyEmissionsKg - 190) / 190) * 100);
    if (diff <= 0) {
      indianBadge.textContent = `${Math.abs(diff)}% below average`;
      indianBadge.className = 'benchmark-badge positive';
    } else {
      indianBadge.textContent = `${diff}% above average`;
      indianBadge.className = 'benchmark-badge';
    }
  }

  if (urbanBadge) {
    const diff = Math.round(((monthlyEmissionsKg - 220) / 220) * 100);
    if (diff <= 0) {
      urbanBadge.textContent = `${Math.abs(diff)}% below average`;
      urbanBadge.className = 'benchmark-badge positive';
    } else {
      urbanBadge.textContent = `${diff}% above average`;
      urbanBadge.className = 'benchmark-badge';
    }
  }

  // Insight Text
  const insightTextEl = root.querySelector('#result-insight-text');
  if (insightTextEl) {
    let insightText;
    const topMonthlyKg = Math.round(topContributor.val / 12);
    if (topContributor.name === 'FOOD') {
      insightText = `Dietary choices contribute most to your carbon output (${topMonthlyKg} kg/mo). Incorporating more plant-based meals and opting for local, seasonal ingredients can drop your emissions by up to 45%.`;
    } else if (topContributor.name === 'TRANSPORT') {
      insightText = `Vehicle commuting is your largest emissions driver (${topMonthlyKg} kg/mo). Shifting 2 trips/week to public transit or choosing active transport modes (walking, cycling) will yield major savings.`;
    } else if (topContributor.name === 'TRAVEL') {
      insightText = `Air travel footprints represent your top contributor (${topMonthlyKg} kg/mo). Restricting long-haul flights or funding Gold Standard certified offsets offers immediate atmospheric balance.`;
    } else if (topContributor.name === 'ENERGY') {
      insightText = `Home electricity usage drives your carbon footprint (${topMonthlyKg} kg/mo). Transitioning to LED lighting, upgrading to energy star appliances, or switching to solar grids is highly recommended.`;
    } else {
      insightText = `Consumer parcel deliveries are your main emissions contributor (${topMonthlyKg} kg/mo). Consolidating e-commerce orders and opting for minimal packaging routes will help drop final-mile logistics impact.`;
    }
    insightTextEl.textContent = insightText;
  }

  // Render dynamic recommendations grid
  const recGrid = root.querySelector('#recommendation-cards-grid');
  if (recGrid) {
    const recs = [];
    if (diet === 'heavy-meat' || diet === 'nonveg') {
      recs.push({
        title: 'Plant-forward transition',
        desc: 'Replace 3 non-vegetarian dinners/week with plant proteins.',
        diffClass: 'easy',
        diffText: 'EASY',
        savings: '-320 kg CO₂/yr',
        icon: 'leaf',
      });
    }
    if (diet === 'nonveg' || diet === 'vegetarian') {
      recs.push({
        title: 'Adopt Vegan Lunches',
        desc: 'Switch to 100% plant-based lunches during the work week.',
        diffClass: 'medium',
        diffText: 'MEDIUM',
        savings: '-210 kg CO₂/yr',
        icon: 'utensils',
      });
    }
    if (commuteMode === 'car' && commuteDistance > 10) {
      recs.push({
        title: 'Hybrid Transit Coupling',
        desc: 'Commit to public transit or metro cycling 2 days/week.',
        diffClass: 'easy',
        diffText: 'EASY',
        savings: '-450 kg CO₂/yr',
        icon: 'bike',
      });
    }
    if (commuteMode === 'car') {
      recs.push({
        title: 'EV / Active Commuting',
        desc: 'Transition your primary transport modes to EV or cycling.',
        diffClass: 'medium',
        diffText: 'MEDIUM',
        savings: '-850 kg CO₂/yr',
        icon: 'car',
      });
    }
    if (electricityBill >= 2000) {
      recs.push({
        title: 'Rooftop Solar Array',
        desc: 'Install micro-solar panels or subscribe to clean local grid mix.',
        diffClass: 'medium',
        diffText: 'MEDIUM',
        savings: '-1200 kg CO₂/yr',
        icon: 'zap',
      });
    } else if (electricityBill >= 1000) {
      recs.push({
        title: 'Smart Appliance Scheduling',
        desc: 'Optimize cooling systems and run heavy loads during solar peak.',
        diffClass: 'easy',
        diffText: 'EASY',
        savings: '-180 kg CO₂/yr',
        icon: 'zap',
      });
    }
    if (flights === '3-5' || flights === '6+') {
      recs.push({
        title: 'Flight Offset Purchases',
        desc: 'Pledge to offset air miles or shift short business trips to rail.',
        diffClass: 'medium',
        diffText: 'MEDIUM',
        savings: '-950 kg CO₂/yr',
        icon: 'plane',
      });
    }
    if (onlineOrders === '4-5' || onlineOrders === '6+') {
      recs.push({
        title: 'Bulk Delivery Packaging',
        desc: 'Consolidate multiple orders to single weekly dispatch cycles.',
        diffClass: 'easy',
        diffText: 'EASY',
        savings: '-110 kg CO₂/yr',
        icon: 'shopping-bag',
      });
    }

    // Fallbacks if we need more recommendations to make a total of 3
    if (recs.length < 3) {
      recs.push({
        title: 'LED Upgrade & Standby Control',
        desc: 'Replace standard lighting and cut standby power vampires.',
        diffClass: 'easy',
        diffText: 'EASY',
        savings: '-90 kg CO₂/yr',
        icon: 'lightbulb',
      });
    }
    if (recs.length < 3) {
      recs.push({
        title: 'Local Organic Sourcing',
        desc: 'Purchase seasonal produce from within 100km radius.',
        diffClass: 'easy',
        diffText: 'EASY',
        savings: '-120 kg CO₂/yr',
        icon: 'shopping-cart',
      });
    }

    recGrid.innerHTML = DOMPurify.sanitize(
      recs
        .slice(0, 3)
        .map(
          r => `
      <div class="recommendation-card glass-panel">
        <div class="recommendation-card-header">
          <span class="difficulty-tag ${r.diffClass}">${r.diffText}</span>
          <span class="projected-savings">${r.savings}</span>
        </div>
        <div style="display: flex; gap: 1rem; align-items: flex-start; margin-top: 0.5rem;">
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 0.5rem; border-radius: 8px; color: var(--color-green-light); display:flex; align-items:center; justify-content:center;">
            <i data-lucide="${r.icon}" style="width: 18px; height: 18px;"></i>
          </div>
          <div>
            <h4 class="recommendation-title">${r.title}</h4>
            <p class="recommendation-desc">${r.desc}</p>
          </div>
        </div>
      </div>
    `
        )
        .join('')
    );

    if (window.lucide) lucide.createIcons();
  }

  // Update Home Page Profile Section Elements
  const profileUserName = document.getElementById('profile-user-name');
  if (profileUserName) profileUserName.textContent = this.user.name;

  const profileUserRank = document.getElementById('profile-user-rank');
  if (profileUserRank) profileUserRank.textContent = this.user.rank;

  const profileUserLevel = document.getElementById('profile-user-level');
  if (profileUserLevel) profileUserLevel.textContent = this.user.level;

  const profileUserXp = document.getElementById('profile-user-xp');
  if (profileUserXp) profileUserXp.textContent = this.user.xp;

  const profileXpBar = document.getElementById('profile-xp-bar');
  if (profileXpBar) profileXpBar.style.width = this.user.xp + '%';

  // Populating the personalized advice list on the home page dashboard
  const adviceListEl = document.getElementById('profile-advice-list');
  if (adviceListEl) {
    const adviceCategories = [
      {
        name: 'Home Energy',
        val: energyEmissions,
        advice:
          energyEmissions > 1500
            ? '⚠️ Switch to clean solar providers immediately to reduce up to 95% of electricity emissions.'
            : 'Excellent grid efficiency. Keep maintaining standby power limits and solar mix.',
      },
      {
        name: 'Transportation',
        val: transportEmissions + travelEmissions,
        advice:
          transportEmissions + travelEmissions > 2000
            ? '⚠️ High travel footprint! Consider public transit, carpooling, or EV transition.'
            : 'Great transit choices. Your active commute habits are keeping travel emissions low.',
      },
      {
        name: 'Dietary',
        val: foodEmissions,
        advice:
          foodEmissions > 1500
            ? '⚠️ Meat-intensive profile! Reducing red meat consumption cuts dietary emissions by 50%.'
            : 'Sustainable dietary choices! Your plant-forward consumption has a minimal footprint.',
      },
    ];

    // Sort to show highest emissions first
    adviceCategories.sort((a, b) => b.val - a.val);

    adviceListEl.innerHTML = DOMPurify.sanitize(
      adviceCategories
        .map((cat, i) => {
          // Map category icons
          let iconHtml = `<i data-lucide="info" style="width:18px;height:18px;"></i>`;
          if (cat.name.includes('Energy'))
            iconHtml = `<i data-lucide="zap" style="width:18px;height:18px;"></i>`;
          if (cat.name.includes('Transit') || cat.name.includes('Transport'))
            iconHtml = `<i data-lucide="car" style="width:18px;height:18px;"></i>`;
          if (cat.name.includes('Diet'))
            iconHtml = `<i data-lucide="utensils" style="width:18px;height:18px;"></i>`;
          if (cat.name.includes('House') || cat.name.includes('Home'))
            iconHtml = `<i data-lucide="home" style="width:18px;height:18px;"></i>`;

          // Parse status theme
          let themeClass = 'advice-item-neutral';
          let statusTag = 'Optimize';
          let cleanAdviceText = cat.advice;

          // Strip warning emoji from text since we render a custom visual badge
          if (cleanAdviceText.includes('⚠️')) {
            cleanAdviceText = cleanAdviceText.replace('⚠️', '').trim();
          }

          const isCritical =
            cat.advice.includes('⚠️') ||
            cat.advice.includes('Heavy') ||
            cat.advice.includes('intensive') ||
            cat.advice.includes('High') ||
            cat.advice.includes('Meat-intensive') ||
            cat.advice.includes('load!');
          const isEfficient =
            cat.advice.includes('Excellent') ||
            cat.advice.includes('Great') ||
            cat.advice.includes('Sustainable') ||
            cat.advice.includes('healing') ||
            cat.advice.includes('efficiency');

          if (isCritical) {
            themeClass = 'advice-item-critical';
            statusTag = 'Action Needed';
          } else if (isEfficient) {
            themeClass = 'advice-item-efficient';
            statusTag = 'Efficient';
          }

          return `
        <li class="dashboard-advice-item ${themeClass}">
          <div class="advice-icon-wrapper">
            ${iconHtml}
          </div>
          <div class="advice-content">
            <div class="advice-meta-row">
              <span class="advice-category-name">${cat.name}</span>
              <span class="advice-status-tag">${statusTag}</span>
            </div>
            <span class="advice-text">${cleanAdviceText}</span>
          </div>
        </li>
      `;
        })
        .join('')
    );

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Equivalents for Travel and Clean Power Transition
  const travelTotalAnnual = transportEmissions + travelEmissions;
  const travelTotalMonthly = Math.round(travelTotalAnnual / 12);
  const travelDriving = travelTotalMonthly * 8.3;
  const travelTrees = Math.ceil(travelTotalAnnual / 20);
  const travelFlights = (travelTotalMonthly / 140) * 100;

  const energyTotalAnnual = energyEmissions + heatingEmissions;
  const energyTotalMonthly = Math.round(energyTotalAnnual / 12);
  const energyDriving = energyTotalMonthly * 8.3;
  const energyTrees = Math.ceil(energyTotalAnnual / 20);
  const energyFlights = (energyTotalMonthly / 140) * 100;

  const travelMonthlyVal = root.querySelector('#quiz-travel-emissions-val');
  if (travelMonthlyVal) travelMonthlyVal.textContent = travelTotalMonthly;

  const travelStatus = root.querySelector('#quiz-travel-status');
  if (travelStatus) {
    if (travelTotalMonthly <= 150) {
      travelStatus.textContent = '🟢 Your travel is in the sustainable range.';
      travelStatus.style.color = 'var(--color-green-light)';
    } else {
      travelStatus.textContent = '🟠 Your travel is above the sustainable range.';
      travelStatus.style.color = 'var(--color-amber)';
    }
  }

  const travelDrivingEl = root.querySelector('#quiz-travel-driving');
  if (travelDrivingEl)
    travelDrivingEl.textContent = `${Math.round(travelDriving).toLocaleString()} km`;

  const travelTreesEl = root.querySelector('#quiz-travel-trees');
  if (travelTreesEl) travelTreesEl.textContent = travelTrees;

  const travelFlightsEl = root.querySelector('#quiz-travel-flights');
  if (travelFlightsEl) travelFlightsEl.textContent = `${Math.round(travelFlights)}%`;

  const energyMonthlyVal = root.querySelector('#quiz-energy-emissions-val');
  if (energyMonthlyVal) energyMonthlyVal.textContent = energyTotalMonthly;

  const energyStatus = root.querySelector('#quiz-energy-status');
  if (energyStatus) {
    if (energyTotalMonthly <= 100) {
      energyStatus.textContent = '🟢 Your clean power footprint is in the sustainable range.';
      energyStatus.style.color = 'var(--color-green-light)';
    } else {
      energyStatus.textContent = '🟠 Your clean power footprint is above the sustainable range.';
      energyStatus.style.color = 'var(--color-amber)';
    }
  }

  const energyDrivingEl = root.querySelector('#quiz-energy-driving');
  if (energyDrivingEl)
    energyDrivingEl.textContent = `${Math.round(energyDriving).toLocaleString()} km`;

  const energyTreesEl = root.querySelector('#quiz-energy-trees');
  if (energyTreesEl) energyTreesEl.textContent = energyTrees;

  const energyFlightsEl = root.querySelector('#quiz-energy-flights');
  if (energyFlightsEl) energyFlightsEl.textContent = `${Math.round(energyFlights)}%`;
};

App.logDiagnosticHistory = function (scoreVal) {
  if (!scoreVal) return;
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

  // Add new entry
  const entry = {
    score: scoreVal,
    timestamp: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    level: this.user.level,
  };

  history.unshift(entry);
  // Keep last 5 entries
  history = history.slice(0, 5);

  if (typeof Utils !== 'undefined') {
    Utils.storage.setItem('eco_diagnostic_history', history);
  } else {
    localStorage.setItem('eco_diagnostic_history', JSON.stringify(history));
  }
  this.renderDiagnosticHistory();
};

App.renderDiagnosticHistory = function () {
  const listEl = document.getElementById('trend-history-list');

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

  if (listEl) {
    if (history.length === 0) {
      listEl.innerHTML = DOMPurify.sanitize(
        `<div style="color: var(--text-muted); font-size: 0.85rem; font-style: italic; text-align: center; padding: 1rem;">No diagnostic history found. Run a diagnostics scan to start tracking.</div>`
      );
    } else {
      listEl.innerHTML = DOMPurify.sanitize(
        history
          .map(
            item => `
        <div class="trend-history-item">
          <span class="trend-history-date">${item.timestamp} (Lvl ${item.level})</span>
          <span class="trend-history-score">${item.score} Tons</span>
        </div>
      `
          )
          .join('')
      );
    }
  }

  this.renderTrendChart(history);

  if (window.EcoDashboard) {
    EcoDashboard.updateDashboard();
  }
};

App.renderTrendChart = function (history) {
  const canvas = document.getElementById('footprint-trend-chart');
  if (!canvas) return;

  // Graceful fallback: if Chart.js failed to load (e.g. fully offline first
  // visit before the CDN script cached), hide the canvas instead of erroring.
  if (typeof Chart === 'undefined') {
    canvas.style.display = 'none';
    return;
  }
  canvas.style.display = 'block';

  // Bidirectional destroy to prevent canvas reuse clashes
  if (window.EcoDashboard && window.EcoDashboard.trendChartInstance) {
    try {
      window.EcoDashboard.trendChartInstance.destroy();
      window.EcoDashboard.trendChartInstance = null;
    } catch (e) {
      console.warn('Failed to destroy EcoDashboard.trendChartInstance', e);
    }
  }

  // Oldest -> newest, left to right
  const chronological = [...history].reverse();
  const labels = chronological.map(h => h.timestamp);
  const scores = chronological.map(h => parseFloat(h.score));

  try {
    if (this._trendChartInstance) {
      this._trendChartInstance.data.labels = labels;
      this._trendChartInstance.data.datasets[0].data = scores;
      this._trendChartInstance.update();
      return;
    }

    this._trendChartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Footprint (Tons CO₂/yr)',
            data: scores,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            borderWidth: 2,
            pointBackgroundColor: '#10b981',
            pointRadius: 4,
            tension: 0.35,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
          y: {
            grid: { color: 'rgba(255,255,255,0.06)' },
            ticks: { color: '#94a3b8', font: { size: 11 } },
            beginAtZero: false,
          },
        },
      },
    });
  } catch (e) {
    // Never let a charting failure break the rest of the dashboard
    canvas.style.display = 'none';
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = App;
  global.App = App;
}
