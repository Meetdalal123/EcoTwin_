const fs = require('fs');
const path = require('path');

describe('EcoCalculator Module', () => {
  beforeEach(() => {
    jest.resetModules();

    // Construct a minimal DOM required by calculator.js with inputs inside step panels
    document.body.innerHTML = `
      <form id="calc-form">
        <div class="wizard-panel" data-step="1">
          <input id="energy-elec" value="300" />
          <input id="energy-gas" value="120" />
          <input id="energy-clean" value="0" />
        </div>
        <div class="wizard-panel" data-step="2">
          <input id="trans-car-km" value="8000" />
          <select id="trans-car-fuel">
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="hybrid">Hybrid</option>
            <option value="ev">EV</option>
          </select>
          <input id="trans-public-km" value="1000" />
          <input id="trans-flights" value="5" />
        </div>
        <div class="wizard-panel" data-step="3">
          <select id="diet-type">
            <option value="vegan">Vegan</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="averageMeat">Average Meat</option>
            <option value="meatLover">Meat Lover</option>
          </select>
        </div>
        <div class="wizard-panel" data-step="4">
          <input id="shop-spend" value="150" />
          <select id="shop-waste">
            <option value="low">Low</option>
            <option value="high">High</option>
          </select>
        </div>
      </form>
      
      <!-- Wizard Indicators UI -->
      <div class="wizard-step-indicator" data-step="1"></div>
      <div class="wizard-step-indicator" data-step="2"></div>
      <div class="wizard-step-indicator" data-step="3"></div>
      <div class="wizard-step-indicator" data-step="4"></div>
      
      <button class="wizard-prev">Prev</button>
      <button class="wizard-next">Next</button>
      
      <!-- Simulator UI -->
      <input id="sim-ev" class="slider-input" data-unit="%" value="0" />
      <input id="sim-solar" class="slider-input" data-unit="%" value="0" />
      <input id="sim-diet" class="slider-input" value="0" />
      <input id="sim-heat" class="slider-input" value="0" />
      
      <span id="sim-ev-val"></span>
      <span id="sim-solar-val"></span>
      <span id="sim-diet-val"></span>
      <span id="sim-heat-val"></span>
      
      <span id="sim-saved-co2"></span>
      <span id="sim-future-co2"></span>
      <span id="sim-saved-cash"></span>
      <div id="sim-savings-progress"></div>
      
      <span id="realtime-score-val"></span>
    `;

    // Define dependencies
    global.ECO_DATA = require('../js/data.js');
    global.EcoUtils = require('../js/utils.js');

    // Set up global App object
    global.App = {
      user: {
        inputs: {
          energyElec: 300,
          energyGas: 120,
          energyClean: 50,
          transCarKm: 8000,
          transCarFuel: 'petrol',
          transPublicKm: 1000,
          transFlights: 5,
          dietType: 'vegan',
          shopSpend: 150,
          shopWaste: 'low',
        },
        offsets: {
          forest: 1,
          ocean: 1,
          wind: 1,
          scannedSwaps: 1,
        },
      },
      saveSession: jest.fn(),
      updateUserProfileUI: jest.fn(),
      showToast: jest.fn(),
    };

    global.EcoDashboard = {
      updateDashboard: jest.fn(),
    };

    // Load calculator.js
    require('../js/calculator.js');
  });

  test('EcoCalculator should exist on window', () => {
    expect(window.EcoCalculator).toBeDefined();
    expect(EcoCalculator).toBeDefined();
  });

  test('init should load inputs, bind events, and run recalculate', () => {
    const spyLoad = jest.spyOn(EcoCalculator, 'loadInputsIntoDOM');
    const spyBind = jest.spyOn(EcoCalculator, 'bindEvents');
    const spyRecalc = jest.spyOn(EcoCalculator, 'recalculateRealTime');

    EcoCalculator.init();

    expect(spyLoad).toHaveBeenCalled();
    expect(spyBind).toHaveBeenCalled();
    expect(spyRecalc).toHaveBeenCalled();
  });

  test('loadInputsIntoDOM should fill in form values from App.user.inputs', () => {
    EcoCalculator.loadInputsIntoDOM();
    expect(document.getElementById('energy-elec').value).toBe('300');
    expect(document.getElementById('energy-gas').value).toBe('120');
    expect(document.getElementById('diet-type').value).toBe('vegan');
  });

  test('loadInputsIntoDOM handles null or missing App.user', () => {
    global.App = null;
    EcoCalculator.loadInputsIntoDOM();
    // Should not crash
    expect(document.getElementById('energy-elec').value).toBe('300'); // remains default
  });

  test('loadInputsIntoDOM handles undefined inputs or missing elements', () => {
    // Set an input to undefined
    App.user.inputs.energyElec = undefined;

    // Remove element
    const el = document.getElementById('energy-gas');
    el.parentNode.removeChild(el);

    expect(() => EcoCalculator.loadInputsIntoDOM()).not.toThrow();
  });

  test('syncDOMInputsToApp should update App.user.inputs from form values', () => {
    EcoCalculator.loadInputsIntoDOM();
    document.getElementById('energy-elec').value = '400';
    document.getElementById('trans-car-fuel').value = 'diesel';

    EcoCalculator.syncDOMInputsToApp();

    expect(App.user.inputs.energyElec).toBe(400);
    expect(App.user.inputs.transCarFuel).toBe('diesel');
    expect(App.saveSession).toHaveBeenCalled();
  });

  test('syncDOMInputsToApp handles null App', () => {
    global.App = null;
    expect(() => EcoCalculator.syncDOMInputsToApp()).not.toThrow();
  });

  test('syncDOMInputsToApp handles missing form elements', () => {
    // Remove all form inputs
    const form = document.getElementById('calc-form');
    form.parentNode.removeChild(form);

    expect(() => EcoCalculator.syncDOMInputsToApp()).not.toThrow();
  });

  test('changeStep should switch active step panels and indicators', () => {
    EcoCalculator.activeStep = 1;
    document.querySelector('.wizard-panel[data-step="1"]').classList.add('active');

    EcoCalculator.changeStep(1);
    expect(EcoCalculator.activeStep).toBe(2);

    const step1Panel = document.querySelector('.wizard-panel[data-step="1"]');
    const step2Panel = document.querySelector('.wizard-panel[data-step="2"]');
    expect(step1Panel.classList.contains('active')).toBe(false);
    expect(step2Panel.classList.contains('active')).toBe(true);

    const indicators = document.querySelectorAll('.wizard-step-indicator');
    expect(indicators[0].classList.contains('completed')).toBe(true);
    expect(indicators[1].classList.contains('active')).toBe(true);
  });

  test('changeStep bounds checks', () => {
    EcoCalculator.activeStep = 1;
    EcoCalculator.changeStep(-1);
    expect(EcoCalculator.activeStep).toBe(1);

    EcoCalculator.activeStep = 4;
    EcoCalculator.changeStep(1);
    expect(EcoCalculator.activeStep).toBe(4);
  });

  test('validateCurrentStep returns false and highlights empty required fields', () => {
    EcoCalculator.activeStep = 1;
    const el = document.getElementById('energy-elec');
    el.setAttribute('required', 'true');
    el.value = '';

    const isValid = EcoCalculator.validateCurrentStep();
    expect(isValid).toBe(false);
    expect(el.classList.contains('error-border')).toBe(true);
  });

  test('validateCurrentStep returns true if required fields have values', () => {
    EcoCalculator.activeStep = 1;
    const el = document.getElementById('energy-elec');
    el.setAttribute('required', 'true');
    el.value = '300';

    const isValid = EcoCalculator.validateCurrentStep();
    expect(isValid).toBe(true);
  });

  test('calculateEmissions computes carbon footprint categories accurately for different inputs', () => {
    document.getElementById('energy-elec').value = '300';
    document.getElementById('energy-gas').value = '120';
    document.getElementById('energy-clean').value = '50';

    document.getElementById('trans-car-km').value = '8000';
    document.getElementById('trans-car-fuel').value = 'petrol';
    document.getElementById('trans-public-km').value = '1000';
    document.getElementById('trans-flights').value = '5';

    document.getElementById('diet-type').value = 'vegan';

    document.getElementById('shop-spend').value = '150';
    document.getElementById('shop-waste').value = 'low';

    let results = EcoCalculator.calculateEmissions();

    expect(results.categories.energy).toBeCloseTo(0.0792);

    const transitCO2 = 1000 * 0.08;
    const flightCO2 = 5 * 2.5 * 0.245;
    const carCO2 = 8000 * 0.17;
    expect(results.categories.transport).toBeCloseTo((carCO2 + transitCO2 + flightCO2) / 1000);
    expect(results.categories.food).toBeCloseTo(1.05485);
    expect(results.categories.shopping).toBeCloseTo(0.9195);

    // Test different car fuels: diesel, hybrid, ev
    document.getElementById('trans-car-fuel').value = 'diesel';
    results = EcoCalculator.calculateEmissions();
    expect(results.categories.transport).toBeCloseTo(
      (8000 * 0.175 + transitCO2 + flightCO2) / 1000
    );

    document.getElementById('trans-car-fuel').value = 'hybrid';
    results = EcoCalculator.calculateEmissions();
    expect(results.categories.transport).toBeCloseTo((8000 * 0.11 + transitCO2 + flightCO2) / 1000);

    document.getElementById('trans-car-fuel').value = 'ev';
    results = EcoCalculator.calculateEmissions();
    expect(results.categories.transport).toBeCloseTo(
      (8000 * 0.045 + transitCO2 + flightCO2) / 1000
    );

    // Test high waste packaging
    document.getElementById('shop-waste').value = 'high';
    results = EcoCalculator.calculateEmissions();
    expect(results.categories.shopping).toBeCloseTo((810 + 1.2 * 365) / 1000);
  });

  test('calculateEmissions should calculate offset and net totals correctly', () => {
    App.user.offsets = {
      forest: 2,
      ocean: 3,
      wind: 1,
      scannedSwaps: 0.5,
    };

    const results = EcoCalculator.calculateEmissions();
    expect(results.offsetTotal).toBeCloseTo(7.3);
    expect(results.total).toBe(Math.max(0, results.grossTotal - 7.3));
  });

  test('calculateEmissions handles empty or undefined offsets cleanly', () => {
    App.user.offsets = null;
    let results = EcoCalculator.calculateEmissions();
    expect(results.offsetTotal).toBe(0);

    App.user.offsets = {};
    results = EcoCalculator.calculateEmissions();
    expect(results.offsetTotal).toBe(0);
  });

  test('calculateEmissions handles missing inputs by falling back to 0', () => {
    // Empty inputs
    document.getElementById('energy-elec').value = '';
    document.getElementById('energy-gas').value = '';
    document.getElementById('energy-clean').value = '';
    document.getElementById('trans-car-km').value = '';
    document.getElementById('trans-public-km').value = '';
    document.getElementById('trans-flights').value = '';
    document.getElementById('shop-spend').value = '';

    // Unknown option inputs
    document.getElementById('trans-car-fuel').value = 'unknown';
    document.getElementById('diet-type').value = 'unknown';
    document.getElementById('shop-waste').value = 'unknown';

    const results = EcoCalculator.calculateEmissions();

    expect(results.categories.energy).toBe(0);
    expect(results.categories.transport).toBe(0);
    // Food defaults to averageMeat
    expect(results.categories.food).toBeCloseTo((5.63 * 365) / 1000);
    // Shopping defaults to low waste packaging
    expect(results.categories.shopping).toBeCloseTo((0.3 * 365) / 1000);
  });

  test('recalculateRealTime updates DOM score span and updates dashboard', () => {
    const el = document.getElementById('realtime-score-val');
    EcoCalculator.recalculateRealTime();
    expect(el.textContent).not.toBe('');
    expect(EcoDashboard.updateDashboard).toHaveBeenCalled();

    // Remove element and check no crash
    el.parentNode.removeChild(el);
    expect(() => EcoCalculator.recalculateRealTime()).not.toThrow();
  });

  test('runWhatIfSimulation calculates reduction potentials and updates DOM', () => {
    document.getElementById('sim-ev').value = '50';
    document.getElementById('sim-solar').value = '100';
    document.getElementById('sim-diet').value = '1';
    document.getElementById('sim-heat').value = '2';

    EcoCalculator.runWhatIfSimulation();

    expect(document.getElementById('sim-saved-co2').textContent).not.toBe('');
    expect(document.getElementById('sim-future-co2').textContent).not.toBe('');
    expect(document.getElementById('sim-saved-cash').textContent).not.toBe('');
    expect(document.getElementById('sim-savings-progress').style.width).not.toBe('');

    // Remove sim-savings-progress and run without crash
    const progress = document.getElementById('sim-savings-progress');
    progress.parentNode.removeChild(progress);
    expect(() => EcoCalculator.runWhatIfSimulation()).not.toThrow();
  });

  test('Event listeners bind and trigger recalculations/simulations', () => {
    EcoCalculator.bindEvents();

    // Trigger input event on a form control
    const inputEl = document.getElementById('energy-elec');
    inputEl.value = '500';
    const inputEvent = new window.Event('input');
    inputEl.dispatchEvent(inputEvent);

    expect(App.user.inputs.energyElec).toBe(500);
    expect(EcoDashboard.updateDashboard).toHaveBeenCalled();

    // Trigger input event on a slider control
    const sliderEl = document.getElementById('sim-ev');
    sliderEl.value = '80';
    const sliderEvent = new window.Event('input');
    sliderEl.dispatchEvent(sliderEvent);

    expect(document.getElementById('sim-ev-val').textContent).toBe('80%');

    // Trigger slider with missing value label
    const sliderSolar = document.getElementById('sim-solar');
    const solarVal = document.getElementById('sim-solar-val');
    solarVal.parentNode.removeChild(solarVal);

    expect(() => sliderSolar.dispatchEvent(sliderEvent)).not.toThrow();

    // Trigger slider without data-unit to test the fallback branch
    const sliderDiet = document.getElementById('sim-diet');
    sliderDiet.value = '0.5';
    sliderDiet.dispatchEvent(sliderEvent);
    expect(document.getElementById('sim-diet-val').textContent).toBe('0.5');
  });

  test('Wizard buttons trigger validation and step transitions', () => {
    EcoCalculator.bindEvents();

    // Set invalid state
    EcoCalculator.activeStep = 1;
    const el = document.getElementById('energy-elec');
    el.setAttribute('required', 'true');
    el.value = '';

    const nextBtn = document.querySelector('.wizard-next');
    nextBtn.click();

    // Active step remains 1
    expect(EcoCalculator.activeStep).toBe(1);

    // Make valid
    el.value = '300';
    nextBtn.click();

    // Active step advances to 2
    expect(EcoCalculator.activeStep).toBe(2);

    const prevBtn = document.querySelector('.wizard-prev');
    prevBtn.click();

    // Active step returns to 1
    expect(EcoCalculator.activeStep).toBe(1);
  });

  test('recalculateRealTime handles missing window.EcoDashboard', () => {
    const originalDashboard = window.EcoDashboard;
    delete window.EcoDashboard;

    expect(() => EcoCalculator.recalculateRealTime()).not.toThrow();

    window.EcoDashboard = originalDashboard;
  });

  test('runWhatIfSimulation handles zero total emissions footprint cleanly', () => {
    // Set all emission inputs to zero/empty
    document.getElementById('energy-elec').value = '0';
    document.getElementById('energy-gas').value = '0';
    document.getElementById('trans-car-km').value = '0';
    document.getElementById('trans-public-km').value = '0';
    document.getElementById('trans-flights').value = '0';
    document.getElementById('shop-spend').value = '0';
    document.getElementById('diet-type').value = 'vegan'; // low factor

    EcoCalculator.runWhatIfSimulation();

    expect(document.getElementById('sim-saved-co2').textContent).toBe('0.00 Tons');
  });
});
