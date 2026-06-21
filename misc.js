/**
 * EcoTwin - Extracted Misc & UI Features
 */

App.initEducationalModal = function () {
  const btnOpen = document.getElementById('btn-learn-basics');
  const btnClose = document.getElementById('btn-close-basics');
  const btnCta = document.getElementById('btn-basics-cta');
  const modal = document.getElementById('basics-modal');

  if (btnOpen) {
    btnOpen.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      this.openBasicsModal();
    });
  }
  if (btnClose) {
    btnClose.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      this.closeBasicsModal();
    });
  }
  if (btnCta) {
    btnCta.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      this.closeBasicsModal();
      const quizSection = document.getElementById('scene-diagnostics');
      if (quizSection) {
        quizSection.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => {
          this.openFeatureModal('dashboard');
        }, 800);
      }
    });
  }
  if (modal) {
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        this.closeBasicsModal();
      }
    });
  }
};

App.openBasicsModal = function () {
  const modal = document.getElementById('basics-modal');
  if (modal) {
    modal.classList.add('visible');
  }
};

App.closeBasicsModal = function () {
  const modal = document.getElementById('basics-modal');
  if (modal) {
    modal.classList.remove('visible');
  }
};

App.saveToEcoTwinProfile = function () {
  const inputs = this.user.dashboardInputs;
  if (!inputs || !inputs.quizCompleted) return;

  const commuteDistance = parseFloat(inputs.commuteDistance) || 15;
  const commuteMode = inputs.commuteMode || 'car';
  let modeMultiplier = 0.18;
  if (commuteMode === 'bike') modeMultiplier = 0.08;
  if (commuteMode === 'metro' || commuteMode === 'transit') modeMultiplier = 0.03;
  if (commuteMode === 'walk' || commuteMode === 'remote') modeMultiplier = 0.0;
  const transportEmissions = commuteDistance * 365 * modeMultiplier; // kg/year

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

  const totalEmissionsKg =
    transportEmissions +
    travelEmissions +
    foodEmissions +
    energyEmissions +
    shoppingEmissions +
    heatingEmissions +
    wasteEmissions +
    purchasingEmissions;

  const lvl = this.user.level;
  const rookieUnlocked = true;
  let isGourmetFromQuiz = false;
  const savedDiet =
    typeof Utils !== 'undefined'
      ? Utils.storage.getItem('eco_diet_calculator')
      : JSON.parse(localStorage.getItem('eco_diet_calculator'));
  if (savedDiet) {
    try {
      const parsed = typeof savedDiet === 'string' ? JSON.parse(savedDiet) : savedDiet;
      if (parsed.redMeat === 0 && (parsed.lunch === 0.6 || parsed.lunch === 1.1)) {
        isGourmetFromQuiz = true;
      }
    } catch (e) {
      console.warn('[Gamification] Failed to parse saved diet calculator data:', e);
    }
  }
  const gourmetUnlocked =
    (inputs.quizCompleted && (inputs.quizDiet === 'vegan' || inputs.quizDiet === 'vegetarian')) ||
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
  const guardianUnlocked = lvl >= 3;
  const legendUnlocked = lvl >= 5;

  const badges = [];
  if (rookieUnlocked) badges.push('badge-rookie');
  if (gourmetUnlocked) badges.push('badge-gourmet');
  if (transitUnlocked) badges.push('badge-transit');
  if (sparkUnlocked) badges.push('badge-spark');
  if (guardianUnlocked) badges.push('badge-guardian');
  if (legendUnlocked) badges.push('badge-legend');

  const profileData = {
    quizAnswers: inputs,
    categoryEmissions: {
      food: foodEmissions,
      transport: transportEmissions + travelEmissions,
      energy: energyEmissions + heatingEmissions,
      shopping: shoppingEmissions + wasteEmissions + purchasingEmissions,
    },
    totalFootprint: totalEmissionsKg,
    xp: this.user.xp,
    level: this.user.level,
    unlockedBadges: badges,
  };

  if (typeof Utils !== 'undefined') {
    Utils.storage.setItem('ecotwin_profile', profileData);
  } else {
    localStorage.setItem('ecotwin_profile', JSON.stringify(profileData));
  }
};

App.openFeatureModal = function (featureId) {
  // Hide the main scrolling container
  const appContainer = document.querySelector('.app-container');
  if (appContainer) {
    appContainer.style.display = 'none';
  }

  // Hide any previously active custom pages
  const oldPages = document.querySelectorAll('.feature-dedicated-page');
  oldPages.forEach(p => p.remove());

  // Create a new full screen page container
  const page = document.createElement('div');
  page.className = 'feature-dedicated-page active';
  page.id = `page-${featureId}`;
  page.style.position = 'fixed';
  page.style.inset = '0';
  page.style.zIndex = '1900';
  page.style.overflowY = 'auto';
  page.style.backgroundImage = `linear-gradient(to bottom, rgba(2, 6, 4, 0.88), rgba(0, 0, 0, 0.95)), url('${this.currentBg}')`;
  page.style.backgroundSize = 'cover';
  page.style.backgroundPosition = 'center';
  page.style.backdropFilter = 'blur(35px)';
  page.style.padding = '4rem 2rem 5rem';

  // Get content from the hidden modal DOM element
  const sourceContent = document.getElementById(`modal-content-${featureId}`);
  if (!sourceContent) return;

  // Create Back Button
  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn-secondary back-home-btn';
  backBtn.innerHTML = DOMPurify.sanitize(
    '<i data-lucide="arrow-left" style="width:18px;height:18px;margin-right:8px;vertical-align:middle;"></i> Go Back to Home'
  );
  backBtn.style.marginBottom = '2rem';
  backBtn.style.borderRadius = '30px';
  backBtn.style.padding = '0.6rem 1.5rem';
  backBtn.addEventListener('click', () => {
    page.remove();
    if (appContainer) {
      appContainer.style.display = 'flex';
    }
    // Re-trigger global resize/scrolling
    window.dispatchEvent(new window.Event('resize'));
  });

  // Wrap content in a premium glass panel block
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'glass-panel';
  contentWrapper.style.maxWidth = '1000px';
  contentWrapper.style.margin = '0 auto';
  contentWrapper.style.padding = '3rem';
  contentWrapper.appendChild(sourceContent.cloneNode(true));
  contentWrapper.querySelector('.modal-tab-content').style.display = 'block';

  page.appendChild(backBtn);
  page.appendChild(contentWrapper);
  document.body.appendChild(page);

  if (window.lucide) lucide.createIcons();

  if (featureId === 'pledges') {
    const newCanvas = page.querySelector('#pledge-canvas');
    if (newCanvas && window.EcoPledges) {
      EcoPledges.canvas = newCanvas;
      EcoPledges.ctx = newCanvas.getContext('2d');
      // Re-bind buttons and inputs
      const pledgeInput = page.querySelector('#pledge-input');
      const submitBtn = page.querySelector('#btn-submit-pledge');
      const pledgeCatBtns = page.querySelectorAll('.pledge-cat-btn');

      pledgeCatBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          pledgeCatBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });

      if (submitBtn && pledgeInput) {
        submitBtn.addEventListener('click', () => {
          const text = pledgeInput.value.trim();
          if (!text) return;
          const activeBtn = page.querySelector('.pledge-cat-btn.active');
          const cat = activeBtn ? activeBtn.dataset.cat : 'diet';
          EcoPledges.submitPledge(text, cat);
          pledgeInput.value = '';
        });
      }

      setTimeout(() => EcoPledges.init(), 100);
    }
  }

  if (featureId === 'chat') {
    const msgContainer = page.querySelector('#chat-messages-container');
    const userInput = page.querySelector('#chat-user-input');
    const sendBtn = page.querySelector('#chat-send-btn');

    const appendMsg = (text, sender) => {
      const div = document.createElement('div');
      div.className = `chat-message ${sender}`;
      div.style.padding = '0.85rem 1.25rem';
      div.style.borderRadius = '16px';
      div.style.fontSize = '0.9rem';
      div.style.lineHeight = '1.5';
      div.style.maxWidth = '80%';
      if (sender === 'user') {
        div.style.background = 'rgba(6, 182, 212, 0.07)';
        div.style.border = '1px solid rgba(6, 182, 212, 0.2)';
        div.style.borderTopRightRadius = '2px';
        div.style.alignSelf = 'flex-end';
      } else {
        div.style.background = 'rgba(16, 185, 129, 0.05)';
        div.style.border = '1px solid rgba(16, 185, 129, 0.2)';
        div.style.borderTopLeftRadius = '2px';
        div.style.alignSelf = 'flex-start';
      }
      div.textContent = text;
      msgContainer.appendChild(div);
      msgContainer.scrollTop = msgContainer.scrollHeight;
    };

    const handleSend = () => {
      const query = userInput.value.trim();
      if (!query) return;
      appendMsg(query, 'user');
      userInput.value = '';

      // Tuned expert eco-chatbot mapping logic
      setTimeout(() => {
        let reply;
        const q = query.toLowerCase();

        if (
          q.includes('score') ||
          q.includes('footprint') ||
          q.includes('my emission') ||
          q.includes('twin')
        ) {
          const scoreText = document.getElementById('profile-total-score')?.textContent || '---';
          reply = `📊 Your current digital Carbon Twin profile shows an annual footprint of ${scoreText}. To reduce this, I recommend targetting your highest category, which you can see highlighted in green on your Diagnostics results breakdown chart.`;
        } else if (
          q.includes('diet') ||
          q.includes('food') ||
          q.includes('vegan') ||
          q.includes('meat') ||
          q.includes('eat')
        ) {
          reply =
            '🥩 Climate Science Insight: Food production accounts for ~26% of global greenhouse gases. Transitioning from high-intensity red meat (which emits ~27kg CO₂ per kg of beef) to plant proteins like lentils or tofu (under 1kg CO₂ per kg) can drop your dietary footprint by up to 80% immediately. Try pledging a meatless day on our Star Wall!';
        } else if (
          q.includes('travel') ||
          q.includes('car') ||
          q.includes('flight') ||
          q.includes('ev') ||
          q.includes('commute')
        ) {
          reply =
            '🚗 Transport Diagnostics: Commuting drives ~24% of global energy emissions. Standard gasoline vehicles emit ~180g of CO₂ per km. Transitioning to active commuting (cycling, walking) reduces this to 0g, and electric vehicles (EVs) powered by clean solar reduce it to ~15-20g per km. For long distance travel, rail travel emits 90% less CO₂ per passenger-mile compared to regional short-haul flights.';
        } else if (
          q.includes('solar') ||
          q.includes('energy') ||
          q.includes('electricity') ||
          q.includes('power') ||
          q.includes('utility')
        ) {
          reply =
            '⚡ Energy Transition Guide: Electricity and heat generate the largest share of global emissions. Switching your utility supplier to a certified 100% clean wind/solar mix removes grid carbon dependency, cutting home emissions by up to 95%. Smart additions like smart thermostats or LED bulbs also trim household demand by 15-20%.';
        } else if (q.includes('pledge') || q.includes('star') || q.includes('wall')) {
          reply =
            '🌌 Constellation Wall: Every climate pledge submitted adds a coordinate star to our constellation map. Collectively, each pledge represents an average annual savings of 0.8 tonnes of CO₂ equivalent from our global grid.';
        } else if (
          q.includes('kyoto') ||
          q.includes('paris') ||
          q.includes('cop') ||
          q.includes('target')
        ) {
          reply =
            '🌍 International Climate Framework: The Paris Agreement aims to limit global warming to well below 2°C, preferably to 1.5°C, compared to pre-industrial levels. To meet this target, global greenhouse gas emissions must peak before 2025 and decline by 43% by 2030, reaching net-zero carbon by 2050.';
        } else if (
          q.includes('hello') ||
          q.includes('hi') ||
          q.includes('hey') ||
          q.includes('help')
        ) {
          reply =
            "👋 Hello there! I'm EcoTwin AI, your climate guide. Ask me about your carbon twin score, how you can lower diet/travel emissions, switching to clean energy, or what actions we can take together.";
        } else if (q.includes('who are you') || q.includes('what do you do') || q.includes('eco')) {
          reply =
            '🌱 I am your AI Planetary Advisor. I analyze your carbon footprint inputs (diet, travel, household members, utility bills) and formulate highly tailored optimization suggestions to achieve a sustainable ecosystem twin.';
        } else {
          reply = `🌱 That's an interesting question! Under sustainable diagnostics, reducing global resource consumption is key. Focus on increasing your solar utility share, optimizing shipping cycles, or choosing plant-forward meals. Ask me specifically about 'diet advice', 'clean energy', or 'my footprint' to learn more.`;
        }
        appendMsg(reply, 'system');
      }, 850);
    };

    if (sendBtn && userInput) {
      sendBtn.addEventListener('click', handleSend);
      userInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') handleSend();
      });
    }
  }
  if (featureId === 'food') {
    this.initFoodPills();
  }
  if (featureId === 'transport') {
    this.initTransportPills();
  }
  if (featureId === 'energy') {
    this.initEnergyToggle();
  }
  if (featureId === 'dashboard') {
    this.initDashboardToggles();
    if (this.initDiagnosticsQuiz) this.initDiagnosticsQuiz();
  }
  if (featureId === 'diet') {
    // Initialize the cloned Diet Calculator
    if (window.DietCalculator) {
      window.DietCalculator.init(page);
    }
  }
};

App.closeFeatureModal = function () {
  const page = document.querySelector('.feature-dedicated-page');
  if (page) page.remove();
  const appContainer = document.querySelector('.app-container');
  if (appContainer) appContainer.style.display = 'flex';
};

App.initDashboardToggles = function () {
  const root = document.querySelector('.feature-dedicated-page') || document;
  const buttons = root.querySelectorAll('#dashboard-questions .pill-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      const val = btn.dataset.val;

      // Toggle active class
      root
        .querySelectorAll(`#dashboard-questions .pill-btn[data-type="${type}"]`)
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update user state
      this.user.dashboardInputs[type] = val;
      this.saveSession();

      this.calculateDashboardEmissions();
    });
  });

  this.calculateDashboardEmissions();
};

App.calculateDashboardEmissions = function () {
  const root = document.querySelector('.feature-dedicated-page') || document;
  const inputs = this.user.dashboardInputs;

  // 1. Food footprint
  const activeMeatBtn = root.querySelector('.diet-meat-btn.active');
  const activeDairyBtn = root.querySelector('.diet-dairy-btn.active');
  const activeOrganicBtn = root.querySelector('.diet-organic-btn.active');

  const savedDiet =
    typeof Utils !== 'undefined'
      ? Utils.storage.getItem('eco_diet_calculator')
      : JSON.parse(localStorage.getItem('eco_diet_calculator'));
  let hasFoodInteraction = activeMeatBtn || activeDairyBtn || activeOrganicBtn;
  let foodScore = 0;
  let foodText = '---';

  if (savedDiet) {
    try {
      const parsed = typeof savedDiet === 'string' ? JSON.parse(savedDiet) : savedDiet;
      if (
        parsed.breakfast !== null &&
        parsed.lunch !== null &&
        parsed.dinner !== null &&
        parsed.redMeat !== null &&
        parsed.dairy !== null
      ) {
        const b = parsed.breakfast || 0;
        const l = parsed.lunch || 0;
        const d = parsed.dinner || 0;
        const r = parsed.redMeat || 0;
        const dy = parsed.dairy || 0;
        const dailyTotal = b + l + d + r + dy;
        foodScore = (dailyTotal * 365) / 1000;
        hasFoodInteraction = true;
        foodText = foodScore.toFixed(1) + ' Tonnes';
      }
    } catch (e) {
      console.warn('[Gamification] Failed to parse saved diet food data:', e);
    }
  }

  if (!savedDiet && hasFoodInteraction) {
    const meatVal = activeMeatBtn ? activeMeatBtn.dataset.val : 'rarely';
    const dairyVal = activeDairyBtn ? activeDairyBtn.dataset.val : 'rarely';
    const organicVal = activeOrganicBtn ? activeOrganicBtn.dataset.val : 'some';

    let meatScore = 3.5;
    if (meatVal === 'weekly') meatScore = 1.8;
    if (meatVal === 'rarely') meatScore = 0.8;
    if (meatVal === 'never') meatScore = 0.2;

    let dairyScore = 1.8;
    if (dairyVal === 'weekly') dairyScore = 0.9;
    if (dairyVal === 'rarely') dairyScore = 0.4;
    if (dairyVal === 'never') dairyScore = 0.05;

    let organicMultiplier = 1.0;
    if (organicVal === 'all') organicMultiplier = 0.8;
    if (organicVal === 'some') organicMultiplier = 0.9;

    foodScore = ((meatScore + dairyScore) * 365 * organicMultiplier) / 1000;
    foodText = foodScore.toFixed(1) + ' Tonnes';
  }

  const foodFeedbackEl = root.querySelector('#modal-food-feedback');
  if (foodFeedbackEl) {
    if (hasFoodInteraction) {
      if (foodScore > 1.8) {
        foodFeedbackEl.textContent =
          'High dietary carbon footprint. Try incorporating more meatless days or choosing organic local sources.';
      } else {
        foodFeedbackEl.textContent = 'Great job! Your plant-forward diet is highly sustainable.';
      }
    } else {
      foodFeedbackEl.textContent =
        'Please answer the dietary questions to calculate your footprint status.';
    }
  }
  const foodScoreValEl = root.querySelector('#modal-food-score-val');
  if (foodScoreValEl) foodScoreValEl.textContent = foodText;

  // 2. Transport emissions
  const activeCommuteBtn = root.querySelector('.trans-commute-btn.active');
  const carKmInputVal = root.querySelector('#trans-car-km-input')?.value;
  const publicKmInputVal = root.querySelector('#trans-public-km-input')?.value;
  const flightsInputVal = root.querySelector('#trans-flights-input')?.value;

  let hasTransInteraction = false;
  if (activeCommuteBtn) {
    const val = activeCommuteBtn.dataset.val;
    if (val === 'car') {
      hasTransInteraction =
        carKmInputVal !== '' && publicKmInputVal !== '' && flightsInputVal !== '';
    } else {
      hasTransInteraction = publicKmInputVal !== '' && flightsInputVal !== '';
    }
  }

  let travelScore = 0;
  let travelText = '---';
  if (hasTransInteraction) {
    const commuteType = activeCommuteBtn.dataset.val;
    let carKm = 0;
    if (commuteType === 'car') {
      carKm = parseFloat(carKmInputVal) || 0;
    }
    const publicKm = parseFloat(publicKmInputVal) || 0;
    const flightsCount = parseFloat(flightsInputVal) || 0;

    const activeFuelBtn = root.querySelector('.trans-fuel-btn.active');
    const fuelType = activeFuelBtn ? activeFuelBtn.dataset.fuel : 'petrol';
    let fuelFactor = 0.17;
    if (fuelType === 'diesel') fuelFactor = 0.19;
    if (fuelType === 'hybrid') fuelFactor = 0.09;
    if (fuelType === 'ev') fuelFactor = 0.03;

    travelScore = (carKm * fuelFactor + publicKm * 52 * 0.03 + flightsCount * 0.8 * 250) / 1000;
    travelText = travelScore.toFixed(1) + ' Tonnes';

    const transFeedbackEl = root.querySelector('#modal-trans-feedback');
    if (transFeedbackEl) {
      if (travelScore > 2.5) {
        transFeedbackEl.textContent =
          'High travel footprint. Restricting long flights and switching to public transit or an EV makes a massive difference.';
      } else {
        transFeedbackEl.textContent =
          'Your low-commute lifestyle is keeping transport emissions minimal. Excellent!';
      }
    }
  } else {
    const transFeedbackEl = root.querySelector('#modal-trans-feedback');
    if (transFeedbackEl)
      transFeedbackEl.textContent = 'Please enter transit data to calculate your carbon score.';
  }
  const transScoreValEl = root.querySelector('#modal-trans-score-val');
  if (transScoreValEl) transScoreValEl.textContent = travelText;

  // 3. Energy emissions
  const elecInputVal = root.querySelector('#energy-elec-input')?.value;
  const gasInputVal = root.querySelector('#energy-gas-input')?.value;
  const hasEnergyInteraction =
    elecInputVal !== '' &&
    gasInputVal !== '' &&
    elecInputVal !== undefined &&
    gasInputVal !== undefined;

  let energyScore = 0;
  let energyText = '---';
  if (hasEnergyInteraction) {
    const elecKwh = parseFloat(elecInputVal) || 0;
    const gasTherms = parseFloat(gasInputVal) || 0;
    const energyBtn = root.querySelector('#energy-mix-toggle-btn-modal');
    const isCleanEnergy = energyBtn && energyBtn.textContent.includes('Solar');
    const elecCO2 = elecKwh * 0.4 * (isCleanEnergy ? 0.05 : 1.0);
    const gasCO2 = gasTherms * 5.3;
    energyScore = ((elecCO2 + gasCO2) * 12) / 1000;
    energyText = energyScore.toFixed(1) + ' Tonnes';

    const energyFeedbackEl = root.querySelector('#modal-energy-feedback');
    if (energyFeedbackEl) {
      if (energyScore > 2.0) {
        energyFeedbackEl.textContent =
          'High utility footprints. Switching to clean solar utility providers reduces electricity impact by up to 95%.';
      } else {
        energyFeedbackEl.textContent =
          'Your energy outputs are clean and efficient. Keep up the high standard!';
      }
    }
  } else {
    const energyFeedbackEl = root.querySelector('#modal-energy-feedback');
    if (energyFeedbackEl)
      energyFeedbackEl.textContent = 'Please enter energy outputs to calculate utility scores.';
  }
  const energyScoreValEl = root.querySelector('#modal-energy-score-val');
  if (energyScoreValEl) energyScoreValEl.textContent = energyText;

  // 4. Housing mix
  const housingFactors = { apartment: 1.2, house: 3.5, villa: 5.8 };
  const homeScore = housingFactors[inputs.home] || 1.2;

  // Determine total score
  const totalInteracted =
    (hasFoodInteraction ? 1 : 0) + (hasTransInteraction ? 1 : 0) + (hasEnergyInteraction ? 1 : 0);
  let total = 0;
  let totalText = '---';
  if (totalInteracted > 0) {
    total =
      homeScore +
      (hasFoodInteraction ? foodScore : 0) +
      (hasTransInteraction ? travelScore : 0) +
      (hasEnergyInteraction ? energyScore : 0);
    totalText = total.toFixed(1) + ' Tonnes';
  }

  // Update Profile Stats on Home Page
  const isQuizCompleted = !!(this.user.dashboardInputs && this.user.dashboardInputs.quizCompleted);
  if (!isQuizCompleted) {
    const profileTotalScore = document.getElementById('profile-total-score');
    if (profileTotalScore) profileTotalScore.textContent = totalText;
  }

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

  // Dynamic advice mapping
  const adviceCategories = [];

  if (hasEnergyInteraction) {
    let energyAdvice;
    if (energyScore > 2.0) {
      energyAdvice =
        '⚠️ Heavy grid load! Switch to clean solar providers immediately to reduce up to 95% of electricity emissions.';
    } else {
      energyAdvice =
        'Excellent grid efficiency. Keep maintaining standby power limits and clean appliance utilization.';
    }
    adviceCategories.push({ name: 'Home Energy', score: energyScore, advice: energyAdvice });
  } else {
    adviceCategories.push({
      name: 'Home Energy',
      score: 0,
      advice: 'Configure energy metrics to retrieve carbon footprint advice.',
    });
  }

  if (hasTransInteraction) {
    let travelAdvice;
    if (travelScore > 2.5) {
      travelAdvice =
        '⚠️ High commuter footprint! Consider carpooling, minimizing domestic flights, or transitioning to hybrid/EV transportation.';
    } else {
      travelAdvice =
        'Great transit choices. Your active commute habits are keeping travel emissions low.';
    }
    adviceCategories.push({ name: 'Transportation', score: travelScore, advice: travelAdvice });
  } else {
    adviceCategories.push({
      name: 'Transportation',
      score: 0,
      advice: 'Configure transit details to evaluate vehicle carbon advice.',
    });
  }

  if (hasFoodInteraction) {
    let dietAdvice;
    if (foodScore > 1.8) {
      dietAdvice =
        '⚠️ Meat-intensive profile! Reducing red meat consumption to 2 days a week cuts dietary emissions by 50%.';
    } else {
      dietAdvice =
        'Sustainable dietary choices! Your plant-forward consumption has a minimal footprint.';
    }
    adviceCategories.push({ name: 'Dietary', score: foodScore, advice: dietAdvice });
  } else {
    adviceCategories.push({
      name: 'Dietary',
      score: 0,
      advice: 'Configure diet questionnaire responses to obtain meal advice.',
    });
  }

  adviceCategories.push({
    name: 'Household Power',
    score: homeScore,
    advice:
      'Switch housing type metrics or offset utility lines to balance carbon footprint values.',
  });

  adviceCategories.sort((a, b) => b.score - a.score);

  const adviceListEl = document.getElementById('profile-advice-list');
  if (adviceListEl) {
    const rawHTML = adviceCategories
      .map((cat, _i) => {
        let iconHtml = `<i data-lucide="info" style="width:18px;height:18px;"></i>`;
        if (cat.name.includes('Energy'))
          iconHtml = `<i data-lucide="zap" style="width:18px;height:18px;"></i>`;
        if (cat.name.includes('Transit') || cat.name.includes('Transport'))
          iconHtml = `<i data-lucide="car" style="width:18px;height:18px;"></i>`;
        if (cat.name.includes('Diet'))
          iconHtml = `<i data-lucide="utensils" style="width:18px;height:18px;"></i>`;
        if (cat.name.includes('House') || cat.name.includes('Home'))
          iconHtml = `<i data-lucide="home" style="width:18px;height:18px;"></i>`;

        let themeClass = 'advice-item-neutral';
        let statusTag = 'Optimize';
        let cleanAdviceText = cat.advice;

        if (cleanAdviceText.startsWith('⚠️ ')) {
          cleanAdviceText = cleanAdviceText.replace('⚠️ ', '');
        } else if (cleanAdviceText.startsWith('⚠️')) {
          cleanAdviceText = cleanAdviceText.replace('⚠️', '');
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
        const isPending = cat.advice.includes('Configure');

        if (isCritical) {
          themeClass = 'advice-item-critical';
          statusTag = 'Action Needed';
        } else if (isEfficient) {
          themeClass = 'advice-item-efficient';
          statusTag = 'Efficient';
        } else if (isPending) {
          themeClass = 'advice-item-neutral';
          statusTag = 'Pending';
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
      .join('');

    adviceListEl.innerHTML = typeof Utils !== 'undefined' ? Utils.sanitizeHTML(rawHTML) : rawHTML;

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Update visual rings
  const scoreNumEl = root.querySelector('#calculated-score-num-modal');
  if (scoreNumEl) scoreNumEl.textContent = totalInteracted > 0 ? total.toFixed(1) : '---';

  const ring = root.querySelector('#score-ring-progress-modal');
  if (ring) {
    const maxRange = 18.0;
    const pct = totalInteracted > 0 ? Math.min(1.0, total / maxRange) : 0;
    const strokeOffset = 471.2 - 471.2 * pct;
    ring.style.strokeDashoffset = strokeOffset;

    if (totalInteracted === 0) {
      ring.setAttribute('stroke', 'rgba(255,255,255,0.06)');
    } else if (total < 3.0) {
      ring.setAttribute('stroke', '#4ade80');
    } else if (total < 6.5) {
      ring.setAttribute('stroke', '#fbbf24');
    } else {
      ring.setAttribute('stroke', '#f43f5e');
    }
  }

  const pctEl = root.querySelector('#calculated-score-pct-modal');
  if (pctEl) {
    if (totalInteracted === 0) {
      pctEl.textContent =
        'Please interact with the calculators below to evaluate footprint status.';
    } else {
      let pctText = 'You are inside standard green Paris limits.';
      if (total > 6.0) pctText = '⚠️ High emitter! You exceed average footprints by 120%.';
      else if (total > 3.0)
        pctText = 'Moderate emitter. Switch energy supplier to clean solar mix.';
      pctEl.textContent = pctText;
    }
  }
  this.updateAchievements();
  if (typeof this.updateHomeTransportSection === 'function') {
    this.updateHomeTransportSection();
  }
  if (typeof this.updateHomeEnergySection === 'function') {
    this.updateHomeEnergySection();
  }
};

App.initFoodPills = function () {
  const root = document.querySelector('.feature-dedicated-page') || document;
  const meatBtns = root.querySelectorAll('.diet-meat-btn');
  const dairyBtns = root.querySelectorAll('.diet-dairy-btn');
  const organicBtns = root.querySelectorAll('.diet-organic-btn');
  const inputs = this.user.dashboardInputs;

  if (inputs.calcMeat) {
    meatBtns.forEach(btn => {
      if (btn.dataset.val === inputs.calcMeat) btn.classList.add('active');
      else btn.classList.remove('active');
    });
  }
  if (inputs.calcDairy) {
    dairyBtns.forEach(btn => {
      if (btn.dataset.val === inputs.calcDairy) btn.classList.add('active');
      else btn.classList.remove('active');
    });
  }
  if (inputs.calcOrganic) {
    organicBtns.forEach(btn => {
      if (btn.dataset.val === inputs.calcOrganic) btn.classList.add('active');
      else btn.classList.remove('active');
    });
  }

  const setupBtnGroup = (btns, key) => {
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        inputs[key] = btn.dataset.val;
        this.saveSession();
        this.calculateDashboardEmissions();
      });
    });
  };

  setupBtnGroup(meatBtns, 'calcMeat');
  setupBtnGroup(dairyBtns, 'calcDairy');
  setupBtnGroup(organicBtns, 'calcOrganic');
};

App.initTransportPills = function () {
  const root = document.querySelector('.feature-dedicated-page') || document;
  const commuteBtns = root.querySelectorAll('.trans-commute-btn');
  const fuelBtns = root.querySelectorAll('.trans-fuel-btn');
  const textInputIds = ['trans-car-km-input', 'trans-public-km-input', 'trans-flights-input'];
  const carFields = root.querySelector('#modal-trans-car-fields');
  const inputs = this.user.dashboardInputs;

  if (inputs.calcCommute) {
    commuteBtns.forEach(btn => {
      if (btn.dataset.val === inputs.calcCommute) btn.classList.add('active');
      else btn.classList.remove('active');
    });
    if (inputs.calcCommute === 'car') {
      if (carFields) carFields.style.display = 'flex';
    } else {
      if (carFields) carFields.style.display = 'none';
    }
  }
  if (inputs.calcFuel) {
    fuelBtns.forEach(btn => {
      if (btn.dataset.fuel === inputs.calcFuel) btn.classList.add('active');
      else btn.classList.remove('active');
    });
  }
  if (inputs.calcCarKm !== undefined && inputs.calcCarKm !== null) {
    const el = root.querySelector('#trans-car-km-input');
    if (el) el.value = inputs.calcCarKm;
  }
  if (inputs.calcPublicKm !== undefined && inputs.calcPublicKm !== null) {
    const el = root.querySelector('#trans-public-km-input');
    if (el) el.value = inputs.calcPublicKm;
  }
  if (inputs.calcFlights !== undefined && inputs.calcFlights !== null) {
    const el = root.querySelector('#trans-flights-input');
    if (el) el.value = inputs.calcFlights;
  }

  commuteBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      commuteBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      inputs.calcCommute = btn.dataset.val;
      this.saveSession();

      if (btn.dataset.val === 'car') {
        if (carFields) carFields.style.display = 'flex';
      } else {
        if (carFields) carFields.style.display = 'none';
      }

      this.calculateDashboardEmissions();
    });
  });

  fuelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      fuelBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      inputs.calcFuel = btn.dataset.fuel;
      this.saveSession();
      this.calculateDashboardEmissions();
    });
  });

  textInputIds.forEach(id => {
    const el = root.querySelector(`#${id}`);
    if (el) {
      const keyMap = {
        'trans-car-km-input': 'calcCarKm',
        'trans-public-km-input': 'calcPublicKm',
        'trans-flights-input': 'calcFlights',
      };
      el.addEventListener('input', () => {
        inputs[keyMap[id]] = el.value;
        this.saveSession();
        this.calculateDashboardEmissions();
      });
    }
  });
};

App.initEnergyToggle = function () {
  const root = document.querySelector('.feature-dedicated-page') || document;
  const btn = root.querySelector('#energy-mix-toggle-btn-modal');
  const textInputIds = ['energy-elec-input', 'energy-gas-input'];
  const inputs = this.user.dashboardInputs;

  if (!btn) return;

  let isClean = inputs.calcEnergyClean === true;
  if (isClean) {
    btn.textContent = 'Using Solar Utilities';
    btn.style.borderColor = 'var(--color-green-light)';
    btn.style.color = 'var(--color-green-light)';
  } else {
    btn.textContent = 'Use Fossil Fuels';
    btn.style.borderColor = 'rgba(255,255,255,0.15)';
    btn.style.color = '#fff';
  }

  if (inputs.calcElec !== undefined && inputs.calcElec !== null) {
    const el = root.querySelector('#energy-elec-input');
    if (el) el.value = inputs.calcElec;
  }
  if (inputs.calcGas !== undefined && inputs.calcGas !== null) {
    const el = root.querySelector('#energy-gas-input');
    if (el) el.value = inputs.calcGas;
  }

  btn.addEventListener('click', () => {
    isClean = !isClean;
    inputs.calcEnergyClean = isClean;
    this.saveSession();

    if (isClean) {
      btn.textContent = 'Using Solar Utilities';
      btn.style.borderColor = 'var(--color-green-light)';
      btn.style.color = 'var(--color-green-light)';
      this.showToast('💡 Switched home grid to renewable solar mix!');
    } else {
      btn.textContent = 'Use Fossil Fuels';
      btn.style.borderColor = 'rgba(255,255,255,0.15)';
      btn.style.color = '#fff';
    }
    this.calculateDashboardEmissions();
  });

  textInputIds.forEach(id => {
    const el = root.querySelector(`#${id}`);
    if (el) {
      const keyMap = {
        'energy-elec-input': 'calcElec',
        'energy-gas-input': 'calcGas',
      };
      el.addEventListener('input', () => {
        inputs[keyMap[id]] = el.value;
        this.saveSession();
        this.calculateDashboardEmissions();
      });
    }
  });
};

App.initTimelineToggle = function () {
  const actBtn = document.getElementById('btn-timeline-action');
  const bauBtn = document.getElementById('btn-timeline-bau');

  if (!actBtn || !bauBtn) return;

  const data = {
    action: [
      {
        year: '2025',
        title: 'Renewables Cross 50%',
        desc: 'Solar and wind capacities eclipse fossil utility arrays internationally.',
      },
      {
        year: '2030',
        title: 'Emissions Halved',
        desc: 'Global carbon output cut by 50% to maintain safe temperature limits.',
      },
      {
        year: '2050',
        title: '🌿 Net-Zero Earth',
        desc: 'Atmospheric warming successfully stabilized safely below 1.5°C threshold limits.',
      },
    ],
    bau: [
      {
        year: '2025',
        title: 'Record Heat Waves',
        desc: 'Carbon output triggers consecutive year-on-year temperature anomaly records.',
      },
      {
        year: '2030',
        title: 'Sea Level Shifts',
        desc: 'Mass meltwater accelerates coastal shifts, displacement patterns emerge.',
      },
      {
        year: '2050',
        title: '💀 Ecosystem Crisis',
        desc: 'Severe desertification and extreme feedback loops trigger irreversible collapses.',
      },
    ],
  };

  const updateTimeline = type => {
    const list = data[type];

    const track = document.getElementById('timeline-track');
    if (track) {
      if (type === 'action') {
        track.style.background =
          'linear-gradient(180deg, var(--color-green-glow) 0%, rgba(16, 185, 129, 0.05) 100%)';
      } else {
        track.style.background =
          'linear-gradient(180deg, var(--color-red) 0%, rgba(239, 68, 68, 0.05) 100%)';
      }
    }

    list.forEach(item => {
      const titleEl = document.getElementById(`timeline-title-${item.year}`);
      const descEl = document.getElementById(`timeline-desc-${item.year}`);
      if (titleEl) titleEl.textContent = item.title;
      if (descEl) descEl.textContent = item.desc;
    });

    const nodes = document.querySelectorAll('.timeline-node');
    nodes.forEach(node => {
      const num = node.querySelector('.timeline-node-number');
      const content = node.querySelector('.timeline-node-content');
      if (type === 'action') {
        node.classList.remove('future-bau');
        node.classList.add('future-green');
        if (num) {
          num.style.borderColor = 'var(--color-green-light)';
          num.style.color = 'var(--color-green-light)';
          num.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.3)';
        }
        if (content) {
          content.style.borderColor = 'rgba(16, 185, 129, 0.25)';
          content.style.background = 'rgba(16, 185, 129, 0.03)';
          content.style.boxShadow =
            '0 8px 20px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255,255,255,0.02)';
        }
      } else {
        node.classList.remove('future-green');
        node.classList.add('future-bau');
        if (num) {
          num.style.borderColor = 'var(--color-red-light)';
          num.style.color = 'var(--color-red-light)';
          num.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.3)';
        }
        if (content) {
          content.style.borderColor = 'rgba(239, 68, 68, 0.25)';
          content.style.background = 'rgba(239, 68, 68, 0.03)';
          content.style.boxShadow =
            '0 8px 20px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255,255,255,0.02)';
        }
      }
    });
  };

  actBtn.addEventListener('click', () => {
    actBtn.classList.add('active');
    actBtn.style.background =
      'linear-gradient(135deg, var(--color-green-light), var(--color-emerald))';
    bauBtn.classList.remove('active');
    bauBtn.style.background = 'transparent';
    updateTimeline('action');
  });

  bauBtn.addEventListener('click', () => {
    bauBtn.classList.add('active');
    bauBtn.style.background = 'linear-gradient(135deg, var(--color-red), var(--color-red-light))';
    actBtn.classList.remove('active');
    actBtn.style.background = 'transparent';
    updateTimeline('bau');
  });

  updateTimeline('action');
};

App.initFlipCards = function () {
  const cards = document.querySelectorAll('.flip-card-container');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('flipped');
    });
  });
};

App.startGlobalCounter = function () {
  const counterEl = document.getElementById('global-co2-counter');
  if (!counterEl) return;

  if (App.globalCounterInterval) {
    clearInterval(App.globalCounterInterval);
  }

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const millisecondsPassed = now - startOfYear;
  const yearMilliseconds = 365 * 24 * 60 * 60 * 1000;
  const yearElapsedFraction = millisecondsPassed / yearMilliseconds;

  const totalAnnualEmissions = 40000000000;
  let currentVal = Math.floor(totalAnnualEmissions * yearElapsedFraction);

  App.globalCounterInterval = setInterval(() => {
    currentVal += Math.floor(80 + Math.random() * 40);
    counterEl.textContent = currentVal.toLocaleString();
  }, 80);
};

App.startPageCounter = function () {
  const pageCounterEl = document.getElementById('page-co2-counter');
  if (!pageCounterEl) return;

  if (App.pageCounterInterval) {
    clearInterval(App.pageCounterInterval);
  }

  const startTime = Date.now();
  const ratePerSecond = 0.00035;

  App.pageCounterInterval = setInterval(() => {
    const elapsedSeconds = (Date.now() - startTime) / 1000;
    const totalAccumulated = elapsedSeconds * ratePerSecond;
    pageCounterEl.textContent = totalAccumulated.toFixed(6);
  }, 50);
};

App.setupMouseParallax = function () {
  if (!this.bgState) {
    this.bgState = { scrollVal: 0, mouseX: 0, mouseY: 0 };
  }

  const debounce = (fn, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  };

  const handleParallax = debounce(e => {
    this.bgState.mouseX = (e.clientX - window.innerWidth / 2) / 60;
    this.bgState.mouseY = (e.clientY - window.innerHeight / 2) / 60;
    this.updateBackgroundTransform();
  }, 16);

  document.addEventListener('mousemove', handleParallax);
};

App.updateBackgroundTransform = function () {
  const layer1 = document.getElementById('bg-layer-1');
  const layer2 = document.getElementById('bg-layer-2');
  if (!layer1 && !layer2) return;

  const scrollVal = this.bgState ? this.bgState.scrollVal : 0;
  const mouseX = this.bgState ? this.bgState.mouseX : 0;
  const mouseY = this.bgState ? this.bgState.mouseY : 0;

  const transformStr = `translate(${mouseX}px, ${mouseY + scrollVal}px) scale(1.05)`;
  if (layer1) layer1.style.transform = transformStr;
  if (layer2) layer2.style.transform = transformStr;
};

App.startNewsTicker = function () {
  const tickerContainer = document.getElementById('news-ticker-content');
  if (!tickerContainer) return;

  const newsTicker = [
    '2024 was recorded as the hottest year in historically charted cycles.',
    'Arctic sea ice melts by 13% per decade, raising thermal absorption ratios.',
    'The top 100 companies are responsible for 71% of global emissions since 1988.',
    'Sea levels have risen 20cm since 1900 and are actively accelerating.',
    'Every minute, 40 football fields of logging forests are destroyed.',
    'Average domestic aviation emissions produce 255g CO₂/km per traveler.',
    'Plant-based diets reduce dinner footprint outputs by up to 90%.',
    'Clean storage batteries hold record Gigawatt capacities displacers.',
    'Commuting by bicycle saves up to 1.5t of annual carbon emissions.',
    'Standard standby household phantom draws consume 10% of utility budgets.',
    'Plastic bottle decay cycles span 450 years in ocean water streams.',
    'The fast fashion industry emits more carbon than aviation & shipping combined.',
    'Switching traditional properties to LED bulbs saves 100kg CO₂/yr.',
    'Denmark wind turbines generated 115% of national utility grids last night.',
    'Global solar power capabilities grew by 34% this quarter.',
    'Amazon rainforest tree projects successfully offset 5,000,000 tons.',
    'Packaging waste represents 30% of average grocery shopping footprints.',
    'Eating local produce offsets transport footprint columns by 80%.',
  ];

  let html = '';
  const items = [...newsTicker, ...newsTicker];
  items.forEach(text => {
    html += `
        <div class="ticker-item">
          <i data-lucide="sparkles"></i>
          <span>${text}</span>
        </div>
      `;
  });
  tickerContainer.innerHTML = typeof Utils !== 'undefined' ? Utils.sanitizeHTML(html) : html;
  if (window.lucide) lucide.createIcons();
};

App.updateHomeDietSection = function () {
  const container = document.getElementById('home-diet-calculator-container');
  if (!container) return;

  const saved =
    typeof Utils !== 'undefined'
      ? Utils.storage.getItem('eco_diet_calculator')
      : JSON.parse(localStorage.getItem('eco_diet_calculator'));
  if (saved) {
    try {
      const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
      if (
        parsed.breakfast !== null &&
        parsed.lunch !== null &&
        parsed.dinner !== null &&
        parsed.redMeat !== null &&
        parsed.dairy !== null
      ) {
        const b = parsed.breakfast || 0;
        const l = parsed.lunch || 0;
        const d = parsed.dinner || 0;
        const r = parsed.redMeat || 0;
        const dy = parsed.dairy || 0;

        const dailyTotal = b + l + d + r + dy;
        const monthly = dailyTotal * 30;
        const annual = dailyTotal * 365;

        const driving = monthly * 8.3;
        const trees = Math.ceil(annual / 20);
        const flights = (monthly / 140) * 100;

        let feedbackText = '🌿 Your plate is healing the planet.';
        let feedbackClass = 'green-score';
        if (monthly > 130) {
          feedbackText = '🔴 Your food choices have a significant impact.';
          feedbackClass = 'red-score';
        } else if (monthly > 80) {
          feedbackText = '🟠 Your diet is above the sustainable range.';
          feedbackClass = 'amber-score';
        } else if (monthly > 40) {
          feedbackText = '🟡 Room to improve — small swaps go far.';
          feedbackClass = 'amber-score';
        }

        const rawHTML = `
            <div class="glass-panel diet-info-card animate-entrance" style="max-width: 800px; margin: 0 auto; padding: 3rem 2rem; border-radius: 24px; text-align: center; background: rgba(10, 20, 15, 0.45); backdrop-filter: blur(25px) saturate(1.8); border: 1px solid rgba(52, 211, 153, 0.25); box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
              <span style="font-size:0.85rem; text-transform:uppercase; color:var(--color-green-light); font-weight:800; letter-spacing:2px; display:block; margin-bottom:0.75rem;">Your Diet Carbon Footprint</span>
              <h2 class="display-lg" style="font-family: 'Playfair Display', serif; margin-bottom: 0.5rem; color: #fff; font-size: 3.2rem; font-weight: 900;">${Math.round(monthly)} <span style="font-size: 1.2rem; font-weight: 500; color: var(--text-secondary);">kg CO₂ / mo</span></h2>
              <p style="font-size: 1.05rem; font-weight: 600; margin-bottom: 2rem;" class="${feedbackClass}">${feedbackText}</p>

              <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 2rem 0;">

              <div class="diet-equivalents-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2.5rem;">
                <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1.25rem 0.75rem; border-radius: 16px;">
                  <span style="font-size: 1.5rem; display: block; margin-bottom: 0.5rem;">🚗</span>
                  <span style="font-size: 1.2rem; font-weight: 800; color: #fff; display: block; margin-bottom: 0.25rem;">${Math.round(driving).toLocaleString()} km</span>
                  <span style="font-size: 0.75rem; color: var(--text-secondary);">driving/mo</span>
                </div>
                <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1.25rem 0.75rem; border-radius: 16px;">
                  <span style="font-size: 1.5rem; display: block; margin-bottom: 0.5rem;">🌳</span>
                  <span style="font-size: 1.2rem; font-weight: 800; color: #fff; display: block; margin-bottom: 0.25rem;">${trees}</span>
                  <span style="font-size: 0.75rem; color: var(--text-secondary);">trees to offset/yr</span>
                </div>
                <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1.25rem 0.75rem; border-radius: 16px;">
                  <span style="font-size: 1.5rem; display: block; margin-bottom: 0.5rem;">✈️</span>
                  <span style="font-size: 1.2rem; font-weight: 800; color: #fff; display: block; margin-bottom: 0.25rem;">${Math.round(flights)}%</span>
                  <span style="font-size: 0.75rem; color: var(--text-secondary);">Mumbai→Delhi flight</span>
                </div>
              </div>

              <p style="font-size: 0.78rem; color: var(--text-secondary); opacity: 0.8; margin-top: -1.5rem; margin-bottom: 2rem; line-height: 1.4;">
                * Equivalents represent everyday benchmarks: 🚗 = 120g CO₂/km driving, 🌳 = 20kg CO₂/yr absorption per tree, ✈️ = 140kg CO₂ per passenger for a Mumbai→Delhi flight.
              </p>

              <div style="display: flex; gap: 1rem; justify-content: center;">
                <button class="btn glow-btn" onclick="App.openFeatureModal('diet')" style="padding: 0.8rem 2rem; font-size: 0.95rem; border-radius: 30px; font-weight: 700;">
                  <i data-lucide="rotate-ccw" style="width: 16px; height: 16px; margin-right: 8px; vertical-align: middle;"></i> Retake Calculator
                </button>
                <button class="btn btn-secondary" onclick="window.location.href='#scene-dashboard'" style="padding: 0.8rem 2rem; font-size: 0.95rem; border-radius: 30px; font-weight: 700; border: 1px solid rgba(255,255,255,0.15);">
                  <i data-lucide="layout-dashboard" style="width: 16px; height: 16px; margin-right: 8px; vertical-align: middle;"></i> View Dashboard
                </button>
              </div>
            </div>
          `;
        container.innerHTML = typeof Utils !== 'undefined' ? Utils.sanitizeHTML(rawHTML) : rawHTML;
        if (window.lucide) lucide.createIcons();
        return;
      }
    } catch (e) {
      console.warn('[Gamification] Failed to render dynamic advice card:', e);
    }
  }

  const rawHTML = `
      <div class="glass-panel diet-info-card animate-entrance" style="max-width: 800px; margin: 0 auto; padding: 3rem 2rem; border-radius: 24px; text-align: center; background: rgba(10, 20, 15, 0.45); backdrop-filter: blur(25px) saturate(1.8); border: 1px solid rgba(52, 211, 153, 0.15); box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 80px; height: 80px; border-radius: 50%; background: rgba(52, 211, 153, 0.1); border: 1px solid rgba(52, 211, 153, 0.3); margin-bottom: 2rem; color: var(--color-green-light); filter: drop-shadow(0 0 15px rgba(52,211,153,0.4));">
          <i data-lucide="utensils" style="width: 38px; height: 38px;"></i>
        </div>
        <h2 class="display-lg" style="font-family: 'Playfair Display', serif; margin-bottom: 1rem; color: #fff; font-size: 2.6rem;">Dietary Footprint Analyzer</h2>
        <p style="color: var(--text-secondary); max-width: 600px; margin: 0 auto 2.5rem; font-size: 1.15rem; line-height: 1.7;">
          What you eat has a direct, profound impact on the planet. Analyze your daily meals, red meat habits, and dairy consumption through our premium, cinematic 5-step calculator.
        </p>
        
        <div class="diet-features-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.5rem; margin-bottom: 3rem; text-align: left;">
          <div style="padding: 1.25rem; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid rgba(255,255,255,0.04);">
            <span style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block;">🍳</span>
            <h4 style="color: #fff; margin-bottom: 0.25rem; font-size: 0.95rem;">Morning & Meals</h4>
            <p style="font-size: 0.78rem; color: var(--text-secondary);">Breakfast, lunch, and dinner carbon weights.</p>
          </div>
          <div style="padding: 1.25rem; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid rgba(255,255,255,0.04);">
            <span style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block;">🥩</span>
            <h4 style="color: #fff; margin-bottom: 0.25rem; font-size: 0.95rem;">Meat & Dairy</h4>
            <p style="font-size: 0.78rem; color: var(--text-secondary);">Track impact of red meats and curds/cheeses.</p>
          </div>
          <div style="padding: 1.25rem; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid rgba(255,255,255,0.04);">
            <span style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block;">🌳</span>
            <h4 style="color: #fff; margin-bottom: 0.25rem; font-size: 0.95rem;">Smart Offsets</h4>
            <p style="font-size: 0.78rem; color: var(--text-secondary);">Offsets and daily green habit trackers.</p>
          </div>
        </div>

        <button class="btn glow-btn" onclick="App.openFeatureModal('diet')" style="padding: 1.1rem 3rem; font-size: 1.1rem; border-radius: 50px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 30px rgba(52,211,153,0.3);">
          Launch Analyzer
        </button>
      </div>
    `;
  container.innerHTML = typeof Utils !== 'undefined' ? Utils.sanitizeHTML(rawHTML) : rawHTML;
  if (window.lucide) lucide.createIcons();
};

App.initShareScorecard = function () {
  const btnShare = document.getElementById('btn-share-score');
  if (!btnShare) return;

  btnShare.addEventListener('click', () => {
    const scoreText = document.getElementById('profile-total-score')?.textContent || '5.2 Tons';
    const rank = document.getElementById('profile-user-rank')?.textContent || 'Carbon Rookie';

    const valFood = document.getElementById('modal-ring-val-food')?.textContent || '0 kg';
    const valTransport = document.getElementById('modal-ring-val-transport')?.textContent || '0 kg';
    const valEnergy = document.getElementById('modal-ring-val-energy')?.textContent || '0 kg';
    const valShopping = document.getElementById('modal-ring-val-shopping')?.textContent || '0 kg';

    document.getElementById('share-card-score').textContent = scoreText;
    document.getElementById('share-card-rank').textContent = rank;
    document.getElementById('share-card-food').textContent = valFood;
    document.getElementById('share-card-transport').textContent = valTransport;
    document.getElementById('share-card-energy').textContent = valEnergy;
    document.getElementById('share-card-shopping').textContent = valShopping;

    this.showToast('Generating scorecard image...');

    const template = document.getElementById('share-card-template');
    if (typeof html2canvas !== 'undefined') {
      html2canvas(template, {
        allowTaint: true,
        useCORS: true,
        scale: 2,
      })
        .then(canvas => {
          canvas.toBlob(blob => {
            if (
              navigator.share &&
              navigator.canShare &&
              navigator.canShare({
                files: [new File([blob], 'ecotwin_scorecard.png', { type: 'image/png' })],
              })
            ) {
              const file = new File([blob], 'ecotwin_scorecard.png', { type: 'image/png' });
              navigator
                .share({
                  files: [file],
                  title: 'My EcoTwin Carbon Scorecard',
                  text: `I just calculated my Carbon Twin score: ${scoreText}! Check out my breakdown and track yours at EcoTwin.`,
                })
                .then(() => {
                  this.showToast('Scorecard shared successfully!');
                })
                .catch(err => {
                  console.error('Share failed', err);
                  this.downloadCanvas(canvas);
                });
            } else {
              this.downloadCanvas(canvas);
            }
          });
        })
        .catch(err => {
          console.error('html2canvas generation failed', err);
          this.showToast('Failed to generate scorecard image.');
        });
    } else {
      this.showToast('Export error: html2canvas CDN not loaded yet.');
    }
  });
};

App.downloadCanvas = function (canvas) {
  const link = document.createElement('a');
  link.download = 'ecotwin_scorecard.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
  this.showToast('Scorecard image downloaded!');
};

App.updateHomeTransportSection = function () {
  const container = document.getElementById('home-transport-container');
  if (!container) return;

  const inputs = this.user.dashboardInputs || {};
  let answered = false;
  if (inputs.calcCommute) {
    const val = inputs.calcCommute;
    const flightsCount = parseFloat(inputs.calcFlights);
    const publicKm = parseFloat(inputs.calcPublicKm);
    
    if (!isNaN(flightsCount) && !isNaN(publicKm)) {
      if (val === 'car') {
        const carKm = parseFloat(inputs.calcCarKm);
        if (!isNaN(carKm)) {
          answered = true;
        }
      } else {
        answered = true;
      }
    }
  }

  if (answered) {
    const commuteType = inputs.calcCommute;
    let carKm = 0;
    if (commuteType === 'car') {
      carKm = parseFloat(inputs.calcCarKm) || 0;
    }
    const publicKm = parseFloat(inputs.calcPublicKm) || 0;
    const flightsCount = parseFloat(inputs.calcFlights) || 0;

    const activeFuelBtn = document.querySelector('.trans-fuel-btn.active');
    let fuelType = inputs.calcFuel || (activeFuelBtn ? activeFuelBtn.dataset.fuel : 'petrol');
    let fuelFactor = 0.17;
    if (fuelType === 'diesel') fuelFactor = 0.19;
    if (fuelType === 'hybrid') fuelFactor = 0.09;
    if (fuelType === 'ev') fuelFactor = 0.03;

    const travelScore = (carKm * fuelFactor + publicKm * 52 * 0.03 + flightsCount * 0.8 * 250) / 1000;
    const monthly = (travelScore * 1000) / 12;
    const annual = travelScore * 1000;
    const trees = Math.ceil(annual / 20);
    const flightsPct = (monthly / 140) * 100;

    let feedbackText = '🌿 Your transport footprint is highly sustainable.';
    let feedbackClass = 'green-score';
    if (travelScore > 2.5) {
      feedbackText = '🔴 High travel footprint. Switch to EV or public transit.';
      feedbackClass = 'red-score';
    } else if (travelScore > 1.2) {
      feedbackText = '🟠 Moderate travel footprint. Consider active transit options.';
      feedbackClass = 'amber-score';
    }

    const rawHTML = `
      <div class="glass-panel diet-info-card animate-entrance" style="max-width: 800px; margin: 0 auto; padding: 3rem 2rem; border-radius: 24px; text-align: center; background: rgba(10, 20, 15, 0.45); backdrop-filter: blur(25px) saturate(1.8); border: 1px solid rgba(52, 211, 153, 0.25); box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
        <span style="font-size:0.85rem; text-transform:uppercase; color:var(--color-green-light); font-weight:800; letter-spacing:2px; display:block; margin-bottom:0.75rem;">Your Travel Carbon Footprint</span>
        <h2 class="display-lg" style="font-family: 'Playfair Display', serif; margin-bottom: 0.5rem; color: #fff; font-size: 3.2rem; font-weight: 900;">${Math.round(monthly)} <span style="font-size: 1.2rem; font-weight: 500; color: var(--text-secondary);">kg CO₂ / mo</span></h2>
        <p style="font-size: 1.05rem; font-weight: 600; margin-bottom: 2rem;" class="${feedbackClass}">${feedbackText}</p>

        <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 2rem 0;">

        <div class="diet-equivalents-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2.5rem;">
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1.25rem 0.75rem; border-radius: 16px;">
            <span style="font-size: 1.5rem; display: block; margin-bottom: 0.5rem;">🚗</span>
            <span style="font-size: 1.2rem; font-weight: 800; color: #fff; display: block; margin-bottom: 0.25rem;">${Math.round(carKm / 12).toLocaleString()} km</span>
            <span style="font-size: 0.75rem; color: var(--text-secondary);">driving/mo</span>
          </div>
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1.25rem 0.75rem; border-radius: 16px;">
            <span style="font-size: 1.5rem; display: block; margin-bottom: 0.5rem;">🌳</span>
            <span style="font-size: 1.2rem; font-weight: 800; color: #fff; display: block; margin-bottom: 0.25rem;">${trees}</span>
            <span style="font-size: 0.75rem; color: var(--text-secondary);">trees to offset/yr</span>
          </div>
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1.25rem 0.75rem; border-radius: 16px;">
            <span style="font-size: 1.5rem; display: block; margin-bottom: 0.5rem;">✈️</span>
            <span style="font-size: 1.2rem; font-weight: 800; color: #fff; display: block; margin-bottom: 0.25rem;">${Math.round(flightsPct)}%</span>
            <span style="font-size: 0.75rem; color: var(--text-secondary);">Mumbai→Delhi flight</span>
          </div>
        </div>

        <p style="font-size: 0.78rem; color: var(--text-secondary); opacity: 0.8; margin-top: -1.5rem; margin-bottom: 2rem; line-height: 1.4;">
          * Equivalents represent everyday benchmarks: 🚗 = 120g CO₂/km driving, 🌳 = 20kg CO₂/yr absorption per tree, ✈️ = 140kg CO₂ per passenger for a Mumbai→Delhi flight.
        </p>

        <div style="display: flex; gap: 1rem; justify-content: center;">
          <button class="btn glow-btn" onclick="App.openFeatureModal('transport')" style="padding: 0.8rem 2rem; font-size: 0.95rem; border-radius: 30px; font-weight: 700;">
            <i data-lucide="rotate-ccw" style="width: 16px; height: 16px; margin-right: 8px; vertical-align: middle;"></i> Retake Simulator
          </button>
          <button class="btn btn-secondary" onclick="window.location.href='#scene-dashboard'" style="padding: 0.8rem 2rem; font-size: 0.95rem; border-radius: 30px; font-weight: 700; border: 1px solid rgba(255,255,255,0.15);">
            <i data-lucide="layout-dashboard" style="width: 16px; height: 16px; margin-right: 8px; vertical-align: middle;"></i> View Dashboard
          </button>
        </div>
      </div>
    `;
    container.innerHTML = typeof Utils !== 'undefined' ? Utils.sanitizeHTML(rawHTML) : rawHTML;
    if (window.lucide) lucide.createIcons();
    return;
  }

  const rawHTML = `
    <div class="glass-panel diet-info-card animate-entrance" style="max-width: 800px; margin: 0 auto; padding: 3rem 2rem; border-radius: 24px; text-align: center; background: rgba(10, 20, 15, 0.45); backdrop-filter: blur(25px) saturate(1.8); border: 1px solid rgba(52, 211, 153, 0.15); box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
      <div style="display: inline-flex; align-items: center; justify-content: center; width: 80px; height: 80px; border-radius: 50%; background: rgba(52, 211, 153, 0.1); border: 1px solid rgba(52, 211, 153, 0.3); margin-bottom: 2rem; color: var(--color-green-light); filter: drop-shadow(0 0 15px rgba(52,211,153,0.4));">
        <i data-lucide="navigation" style="width: 38px; height: 38px;"></i>
      </div>
      <h2 class="display-lg" style="font-family: 'Playfair Display', serif; margin-bottom: 1rem; color: #fff; font-size: 2.6rem;">Transportation Impacts</h2>
      <p style="color: var(--text-secondary); max-width: 600px; margin: 0 auto 2.5rem; font-size: 1.15rem; line-height: 1.7;">
        Compare flight hours, vehicle distances, train routes, and cycling parameters to configure your travel offsets.
      </p>
      
      <div class="diet-features-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.5rem; margin-bottom: 3rem; text-align: left;">
        <div style="padding: 1.25rem; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid rgba(255,255,255,0.04);">
          <span style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block;">🚗</span>
          <h4 style="color: #fff; margin-bottom: 0.25rem; font-size: 0.95rem;">Vehicles & Fuel</h4>
          <p style="font-size: 0.78rem; color: var(--text-secondary);">Analyze commute modes, fuels (EV vs. Petrol), and distances.</p>
        </div>
        <div style="padding: 1.25rem; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid rgba(255,255,255,0.04);">
          <span style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block;">🚆</span>
          <h4 style="color: #fff; margin-bottom: 0.25rem; font-size: 0.95rem;">Transit & Trains</h4>
          <p style="font-size: 0.78rem; color: var(--text-secondary);">Track public transit routes, trains, buses, and active transport.</p>
        </div>
        <div style="padding: 1.25rem; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid rgba(255,255,255,0.04);">
          <span style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block;">✈️</span>
          <h4 style="color: #fff; margin-bottom: 0.25rem; font-size: 0.95rem;">Air Travel & Offsets</h4>
          <p style="font-size: 0.78rem; color: var(--text-secondary);">Calculate carbon weights for short and long-haul flights.</p>
        </div>
      </div>

      <button class="btn glow-btn" onclick="App.openFeatureModal('transport')" style="padding: 1.1rem 3rem; font-size: 1.1rem; border-radius: 50px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 30px rgba(52,211,153,0.3);">
        Configure Travel Habits
      </button>
    </div>
  `;
  container.innerHTML = typeof Utils !== 'undefined' ? Utils.sanitizeHTML(rawHTML) : rawHTML;
  if (window.lucide) lucide.createIcons();
};

App.updateHomeEnergySection = function () {
  const container = document.getElementById('home-energy-container');
  if (!container) return;

  const inputs = this.user.dashboardInputs || {};
  const answered = inputs.calcElec !== undefined && inputs.calcElec !== null && inputs.calcElec !== '' &&
                   inputs.calcGas !== undefined && inputs.calcGas !== null && inputs.calcGas !== '';

  if (answered) {
    const elecKwh = parseFloat(inputs.calcElec) || 0;
    const gasTherms = parseFloat(inputs.calcGas) || 0;
    const isCleanEnergy = inputs.calcEnergyClean === true;
    const elecCO2 = elecKwh * 0.4 * (isCleanEnergy ? 0.05 : 1.0);
    const gasCO2 = gasTherms * 5.3;
    const energyScore = ((elecCO2 + gasCO2) * 12) / 1000;

    const monthly = (energyScore * 1000) / 12;
    const annual = energyScore * 1000;
    const trees = Math.ceil(annual / 20);
    const driving = monthly * 8.3;
    const flightsPct = (monthly / 140) * 100;

    let feedbackText = '🌿 Your energy outputs are clean and efficient. Keep up the high standard!';
    let feedbackClass = 'green-score';
    if (energyScore > 2.0) {
      feedbackText = '🔴 High utility footprints. Switch utility lines to renewable solar mix.';
      feedbackClass = 'red-score';
    } else if (energyScore > 0.8) {
      feedbackText = '🟠 Moderate utility footprint. Try optimizing thermal/appliance standby loads.';
      feedbackClass = 'amber-score';
    }

    const rawHTML = `
      <div class="glass-panel diet-info-card animate-entrance" style="max-width: 800px; margin: 0 auto; padding: 3rem 2rem; border-radius: 24px; text-align: center; background: rgba(10, 20, 15, 0.45); backdrop-filter: blur(25px) saturate(1.8); border: 1px solid rgba(52, 211, 153, 0.25); box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
        <span style="font-size:0.85rem; text-transform:uppercase; color:var(--color-green-light); font-weight:800; letter-spacing:2px; display:block; margin-bottom:0.75rem;">Your Utility Carbon Footprint</span>
        <h2 class="display-lg" style="font-family: 'Playfair Display', serif; margin-bottom: 0.5rem; color: #fff; font-size: 3.2rem; font-weight: 900;">${Math.round(monthly)} <span style="font-size: 1.2rem; font-weight: 500; color: var(--text-secondary);">kg CO₂ / mo</span></h2>
        <p style="font-size: 1.05rem; font-weight: 600; margin-bottom: 2rem;" class="${feedbackClass}">${feedbackText}</p>

        <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 2rem 0;">

        <div class="diet-equivalents-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2.5rem;">
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1.25rem 0.75rem; border-radius: 16px;">
            <span style="font-size: 1.5rem; display: block; margin-bottom: 0.5rem;">🚗</span>
            <span style="font-size: 1.2rem; font-weight: 800; color: #fff; display: block; margin-bottom: 0.25rem;">${Math.round(driving).toLocaleString()} km</span>
            <span style="font-size: 0.75rem; color: var(--text-secondary);">driving/mo</span>
          </div>
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1.25rem 0.75rem; border-radius: 16px;">
            <span style="font-size: 1.5rem; display: block; margin-bottom: 0.5rem;">🌳</span>
            <span style="font-size: 1.2rem; font-weight: 800; color: #fff; display: block; margin-bottom: 0.25rem;">${trees}</span>
            <span style="font-size: 0.75rem; color: var(--text-secondary);">trees to offset/yr</span>
          </div>
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1.25rem 0.75rem; border-radius: 16px;">
            <span style="font-size: 1.5rem; display: block; margin-bottom: 0.5rem;">✈️</span>
            <span style="font-size: 1.2rem; font-weight: 800; color: #fff; display: block; margin-bottom: 0.25rem;">${Math.round(flightsPct)}%</span>
            <span style="font-size: 0.75rem; color: var(--text-secondary);">Mumbai→Delhi flight</span>
          </div>
        </div>

        <p style="font-size: 0.78rem; color: var(--text-secondary); opacity: 0.8; margin-top: -1.5rem; margin-bottom: 2rem; line-height: 1.4;">
          * Equivalents represent everyday benchmarks: 🚗 = 120g CO₂/km driving, 🌳 = 20kg CO₂/yr absorption per tree, ✈️ = 140kg CO₂ per passenger for a Mumbai→Delhi flight.
        </p>

        <div style="display: flex; gap: 1rem; justify-content: center;">
          <button class="btn glow-btn" onclick="App.openFeatureModal('energy')" style="padding: 0.8rem 2rem; font-size: 0.95rem; border-radius: 30px; font-weight: 700;">
            <i data-lucide="rotate-ccw" style="width: 16px; height: 16px; margin-right: 8px; vertical-align: middle;"></i> Retake Simulator
          </button>
          <button class="btn btn-secondary" onclick="window.location.href='#scene-dashboard'" style="padding: 0.8rem 2rem; font-size: 0.95rem; border-radius: 30px; font-weight: 700; border: 1px solid rgba(255,255,255,0.15);">
            <i data-lucide="layout-dashboard" style="width: 16px; height: 16px; margin-right: 8px; vertical-align: middle;"></i> View Dashboard
          </button>
        </div>
      </div>
    `;
    container.innerHTML = typeof Utils !== 'undefined' ? Utils.sanitizeHTML(rawHTML) : rawHTML;
    if (window.lucide) lucide.createIcons();
    return;
  }

  const rawHTML = `
    <div class="glass-panel diet-info-card animate-entrance" style="max-width: 800px; margin: 0 auto; padding: 3rem 2rem; border-radius: 24px; text-align: center; background: rgba(10, 20, 15, 0.45); backdrop-filter: blur(25px) saturate(1.8); border: 1px solid rgba(52, 211, 153, 0.15); box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
      <div style="display: inline-flex; align-items: center; justify-content: center; width: 80px; height: 80px; border-radius: 50%; background: rgba(52, 211, 153, 0.1); border: 1px solid rgba(52, 211, 153, 0.3); margin-bottom: 2rem; color: var(--color-green-light); filter: drop-shadow(0 0 15px rgba(52,211,153,0.4));">
        <i data-lucide="zap" style="width: 38px; height: 38px;"></i>
      </div>
      <h2 class="display-lg" style="font-family: 'Playfair Display', serif; margin-bottom: 1rem; color: #fff; font-size: 2.6rem;">Clean Power Transition</h2>
      <p style="color: var(--text-secondary); max-width: 600px; margin: 0 auto 2.5rem; font-size: 1.15rem; line-height: 1.7;">
        Switch utility lines from fossil-intensive electricity grids to clean solar options, and analyze the direct impact.
      </p>
      
      <div class="diet-features-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.5rem; margin-bottom: 3rem; text-align: left;">
        <div style="padding: 1.25rem; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid rgba(255,255,255,0.04);">
          <span style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block;">⚡</span>
          <h4 style="color: #fff; margin-bottom: 0.25rem; font-size: 0.95rem;">Grid Electricity</h4>
          <p style="font-size: 0.78rem; color: var(--text-secondary);">Analyze electricity consumption and local carbon grid mix.</p>
        </div>
        <div style="padding: 1.25rem; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid rgba(255,255,255,0.04);">
          <span style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block;">🔥</span>
          <h4 style="color: #fff; margin-bottom: 0.25rem; font-size: 0.95rem;">Gas & Heating</h4>
          <p style="font-size: 0.78rem; color: var(--text-secondary);">Calculate direct emissions from gas, heating, and fuels.</p>
        </div>
        <div style="padding: 1.25rem; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid rgba(255,255,255,0.04);">
          <span style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block;">☀️</span>
          <h4 style="color: #fff; margin-bottom: 0.25rem; font-size: 0.95rem;">Solar Transition</h4>
          <p style="font-size: 0.78rem; color: var(--text-secondary);">Simulate switching utility lines to 100% clean solar energy.</p>
        </div>
      </div>

      <button class="btn glow-btn" onclick="App.openFeatureModal('energy')" style="padding: 1.1rem 3rem; font-size: 1.1rem; border-radius: 50px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 30px rgba(52,211,153,0.3);">
        Configure Household Energy
      </button>
    </div>
  `;
  container.innerHTML = typeof Utils !== 'undefined' ? Utils.sanitizeHTML(rawHTML) : rawHTML;
  if (window.lucide) lucide.createIcons();
};
