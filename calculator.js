/* e:\PromptWar\Challenge-3\js\calculator.js */

const EcoCalculator = {
  activeStep: 1,
  totalSteps: 4,

  init() {
    this.loadInputsIntoDOM();
    this.bindEvents();
    this.recalculateRealTime();
  },

  loadInputsIntoDOM() {
    if (!window.App || !App.user || !App.user.inputs) return;
    const inputs = App.user.inputs;

    const elements = {
      'energy-elec': inputs.energyElec,
      'energy-gas': inputs.energyGas,
      'energy-clean': inputs.energyClean,
      'trans-car-km': inputs.transCarKm,
      'trans-car-fuel': inputs.transCarFuel,
      'trans-public-km': inputs.transPublicKm,
      'trans-flights': inputs.transFlights,
      'diet-type': inputs.dietType,
      'shop-spend': inputs.shopSpend,
      'shop-waste': inputs.shopWaste,
    };

    for (const [id, val] of Object.entries(elements)) {
      const el = document.getElementById(id);
      if (el && val !== undefined) {
        el.value = val;
      }
    }
  },

  syncDOMInputsToApp() {
    if (!window.App || !App.user || !App.user.inputs) return;
    const inputs = App.user.inputs;

    const elElec = document.getElementById('energy-elec');
    const elGas = document.getElementById('energy-gas');
    const elClean = document.getElementById('energy-clean');
    const elCarKm = document.getElementById('trans-car-km');
    const elCarFuel = document.getElementById('trans-car-fuel');
    const elPublic = document.getElementById('trans-public-km');
    const elFlights = document.getElementById('trans-flights');
    const elDiet = document.getElementById('diet-type');
    const elSpend = document.getElementById('shop-spend');
    const elWaste = document.getElementById('shop-waste');

    if (elElec) inputs.energyElec = EcoUtils.sanitizeNumeric(elElec.value, 0, 100000, 300);
    if (elGas) inputs.energyGas = EcoUtils.sanitizeNumeric(elGas.value, 0, 100000, 120);
    if (elClean) inputs.energyClean = EcoUtils.sanitizeNumeric(elClean.value, 0, 100, 0);
    if (elCarKm) inputs.transCarKm = EcoUtils.sanitizeNumeric(elCarKm.value, 0, 1000000, 8000);
    if (elCarFuel) inputs.transCarFuel = EcoUtils.escapeHTML(elCarFuel.value);
    if (elPublic) inputs.transPublicKm = EcoUtils.sanitizeNumeric(elPublic.value, 0, 100000, 20);
    if (elFlights) inputs.transFlights = EcoUtils.sanitizeNumeric(elFlights.value, 0, 5000, 5);
    if (elDiet) inputs.dietType = EcoUtils.escapeHTML(elDiet.value);
    if (elSpend) inputs.shopSpend = EcoUtils.sanitizeNumeric(elSpend.value, 0, 1000000, 150);
    if (elWaste) inputs.shopWaste = EcoUtils.escapeHTML(elWaste.value);

    App.saveSession();
  },

  bindEvents() {
    // Nav buttons in wizard
    const prevBtns = document.querySelectorAll('.wizard-prev');
    const nextBtns = document.querySelectorAll('.wizard-next');

    prevBtns.forEach(btn => {
      btn.addEventListener('click', () => this.changeStep(-1));
    });

    nextBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.validateCurrentStep()) {
          this.changeStep(1);
        }
      });
    });

    // Recalculate carbon values in real-time as users modify input controls
    const inputs = document.querySelectorAll('#calc-form input, #calc-form select');
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        this.syncDOMInputsToApp();
        this.recalculateRealTime();
      });
    });

    // What-If Sliders events
    const sliders = document.querySelectorAll('.slider-input');
    sliders.forEach(slider => {
      slider.addEventListener('input', e => {
        const valSpan = document.getElementById(`${e.target.id}-val`);
        if (valSpan) {
          valSpan.textContent = e.target.value + (e.target.dataset.unit || '');
        }
        this.runWhatIfSimulation();
      });
    });
  },

  changeStep(dir) {
    const nextStep = this.activeStep + dir;
    if (nextStep < 1 || nextStep > this.totalSteps) return;

    // Hide active step panel
    document
      .querySelector(`.wizard-panel[data-step="${this.activeStep}"]`)
      .classList.remove('active');
    // Show new step panel
    document.querySelector(`.wizard-panel[data-step="${nextStep}"]`).classList.add('active');

    // Update indicators
    const indicators = document.querySelectorAll('.wizard-step-indicator');
    indicators.forEach((ind, index) => {
      const idx = index + 1;
      ind.classList.remove('active');
      if (idx === nextStep) {
        ind.classList.add('active');
      } else if (idx < nextStep) {
        ind.classList.add('completed');
      } else {
        ind.classList.remove('completed');
      }
    });

    this.activeStep = nextStep;
  },

  validateCurrentStep() {
    // Real simple validator. In vanilla SPA, standard validation is checked on fields.
    const activePanel = document.querySelector(`.wizard-panel[data-step="${this.activeStep}"]`);
    const inputs = activePanel.querySelectorAll('input[required]');
    let isValid = true;

    inputs.forEach(input => {
      if (!input.value) {
        isValid = false;
        input.classList.add('error-border');
      } else {
        input.classList.remove('error-border');
      }
    });

    return isValid;
  },

  // Compute total carbon footprint based on forms
  calculateEmissions() {
    const f = ECO_DATA.factors;

    // Step 1: Home Energy (Annualized)
    const electricity = parseFloat(document.getElementById('energy-elec').value) || 0;
    const gas = parseFloat(document.getElementById('energy-gas').value) || 0;
    const cleanEnergyPercent = parseFloat(document.getElementById('energy-clean').value) || 0;

    const elecCO2 = electricity * f.energy.electricityGrid * (1 - cleanEnergyPercent / 100);
    const gasCO2 = gas * f.energy.naturalGas;
    const energyTotal = elecCO2 + gasCO2;

    // Step 2: Transport (Annualized)
    const carDistance = parseFloat(document.getElementById('trans-car-km').value) || 0;
    const carFuel = document.getElementById('trans-car-fuel').value;
    const publicTransit = parseFloat(document.getElementById('trans-public-km').value) || 0;
    const flightHours = parseFloat(document.getElementById('trans-flights').value) || 0;

    let carFactor = f.transport.petrolCar;
    if (carFuel === 'diesel') carFactor = f.transport.dieselCar;
    if (carFuel === 'hybrid') carFactor = f.transport.hybridCar;
    if (carFuel === 'ev') carFactor = f.transport.electricCar;

    const carCO2 = carDistance * carFactor;
    const transitCO2 = publicTransit * f.transport.bus; // average transit
    const flightCO2 = flightHours * 2.5 * f.transport.flightShort; // approx 2.5 hours * factor
    const transportTotal = carCO2 + transitCO2 + flightCO2;

    // Step 3: Diet & Food
    const dietType = document.getElementById('diet-type').value;
    const dietFactor = f.diet[dietType] || f.diet.averageMeat;
    const foodTotal = dietFactor * 365; // annualize daily food CO2

    // Step 4: Shopping & Waste
    const shoppingMonthly = parseFloat(document.getElementById('shop-spend').value) || 0;
    const packagingLevel = document.getElementById('shop-waste').value;

    const goodsCO2 = shoppingMonthly * 12 * f.lifestyle.clothing; // approx clothing + misc goods
    const wasteFactor =
      packagingLevel === 'high' ? f.lifestyle.packagingWasteHigh : f.lifestyle.packagingWasteLow;
    const wasteCO2 = wasteFactor * 365;
    const shoppingTotal = goodsCO2 + wasteCO2;

    // Grand totals
    const grandTotalKg = energyTotal + transportTotal + foodTotal + shoppingTotal;
    const grandTotalTons = grandTotalKg / 1000;

    // Deduct active simulated offsets
    let offsetTons = 0;
    if (window.App && App.user && App.user.offsets) {
      offsetTons += (App.user.offsets.forest || 0) * 1.2;
      offsetTons += (App.user.offsets.ocean || 0) * 0.8;
      offsetTons += (App.user.offsets.wind || 0) * 2.0;
      offsetTons += App.user.offsets.scannedSwaps || 0;
    }

    const netTotalTons = Math.max(0.0, grandTotalTons - offsetTons);

    return {
      total: netTotalTons,
      grossTotal: grandTotalTons,
      offsetTotal: offsetTons,
      categories: {
        energy: energyTotal / 1000,
        transport: transportTotal / 1000,
        food: foodTotal / 1000,
        shopping: shoppingTotal / 1000,
      },
    };
  },

  recalculateRealTime() {
    const results = this.calculateEmissions();
    const rtSpan = document.getElementById('realtime-score-val');
    if (rtSpan) {
      rtSpan.textContent = results.total.toFixed(2);
    }
    // Instantly propagate inputs to Dashboard, Planet, Twin, and Time Machine metrics
    if (window.EcoDashboard) {
      EcoDashboard.updateDashboard();
    }
  },

  // Run user interactions against What-If simulator
  runWhatIfSimulation() {
    const baseResults = this.calculateEmissions();

    // Sliders coefficients
    const sliderEV = parseFloat(document.getElementById('sim-ev').value) / 100; // % replacement of car
    const sliderSolar = parseFloat(document.getElementById('sim-solar').value) / 100; // % renewable power
    const sliderDiet = parseFloat(document.getElementById('sim-diet').value); // 0 (original) to 1 (fully vegan)
    const sliderHeat = parseFloat(document.getElementById('sim-heat').value); // 0 to 4 degrees lower thermostat

    // Calculate reduction potentials
    const originalCarCO2 = baseResults.categories.transport * 0.6; // assume car is 60% of transport
    const evSavings =
      originalCarCO2 *
      sliderEV *
      (1 - ECO_DATA.factors.transport.electricCar / ECO_DATA.factors.transport.petrolCar);

    const originalElecCO2 = baseResults.categories.energy * 0.65; // assume elec is 65% of energy
    const solarSavings = originalElecCO2 * sliderSolar;

    // Diet slider: transition food footprint toward Vegan
    const currentFoodCO2 = baseResults.categories.food;
    const dietType = document.getElementById('diet-type').value;
    const baseDailyFactor = ECO_DATA.factors.diet[dietType] || ECO_DATA.factors.diet.averageMeat;
    const veganDailyFactor = ECO_DATA.factors.diet.vegan;
    const dietSavings = (((baseDailyFactor - veganDailyFactor) * 365) / 1000) * sliderDiet;

    // Heat slider: 10% gas savings per 1 degree
    const originalGasCO2 = baseResults.categories.energy * 0.35; // gas is 35% of energy
    const heatSavings = originalGasCO2 * (sliderHeat * 0.08);

    const totalSavedTons = evSavings + solarSavings + dietSavings + heatSavings;
    const simulatedFootprint = Math.max(0.5, baseResults.total - totalSavedTons);

    // Update Simulator Outputs
    document.getElementById('sim-saved-co2').textContent = totalSavedTons.toFixed(2) + ' Tons';
    document.getElementById('sim-future-co2').textContent = simulatedFootprint.toFixed(2) + ' Tons';

    // Calculate money saved: approx $150 per ton saved (fuel + solar credits + grocery difference)
    const cashSaved = totalSavedTons * 180;
    document.getElementById('sim-saved-cash').textContent = '$' + Math.round(cashSaved);

    // Update Sim graphic progress bar
    const reductionPercent = baseResults.total > 0 ? (totalSavedTons / baseResults.total) * 100 : 0;
    const simProgress = document.getElementById('sim-savings-progress');
    if (simProgress) {
      simProgress.style.width = `${Math.min(100, reductionPercent)}%`;
    }
  },
};

window.EcoCalculator = EcoCalculator;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EcoCalculator;
  global.EcoCalculator = EcoCalculator;
}
