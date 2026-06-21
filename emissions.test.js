// Emission factors (from data.js)
const ECO_FACTORS = {
  transport: {
    petrolCar: 0.17,
    dieselCar: 0.175,
    hybridCar: 0.11,
    electricCar: 0.045,
    bus: 0.08,
    train: 0.035,
    flightShort: 0.245,
  },
  energy: {
    electricityGrid: 0.38,
    naturalGas: 0.185,
  },
  diet: {
    meatLover: 7.26,
    averageMeat: 5.63,
    pescatarian: 3.91,
    vegetarian: 3.81,
    vegan: 2.89,
  },
  lifestyle: {
    clothing: 0.45,
    packagingWasteHigh: 1.2,
    packagingWasteLow: 0.3,
  },
};

// Pure calculation functions (mirrors calculator.js logic, no DOM needed)
function calcEnergyEmissions(electricityKwh, gasKwh, cleanPercent) {
  const elecCO2 = electricityKwh * ECO_FACTORS.energy.electricityGrid * (1 - cleanPercent / 100);
  const gasCO2 = gasKwh * ECO_FACTORS.energy.naturalGas;
  return elecCO2 + gasCO2;
}

function calcTransportEmissions(carKm, fuelType, publicKm, flightHours) {
  const fuelMap = {
    petrol: ECO_FACTORS.transport.petrolCar,
    diesel: ECO_FACTORS.transport.dieselCar,
    hybrid: ECO_FACTORS.transport.hybridCar,
    ev: ECO_FACTORS.transport.electricCar,
  };
  const carFactor = fuelMap[fuelType] ?? ECO_FACTORS.transport.petrolCar;
  const carCO2 = carKm * carFactor;
  const transitCO2 = publicKm * ECO_FACTORS.transport.bus;
  const flightCO2 = flightHours * 2.5 * ECO_FACTORS.transport.flightShort;
  return carCO2 + transitCO2 + flightCO2;
}

function calcDietEmissions(dietType) {
  const dailyFactor = ECO_FACTORS.diet[dietType] ?? ECO_FACTORS.diet.averageMeat;
  return dailyFactor * 365;
}

function calcShoppingEmissions(monthlySpend, packagingLevel) {
  const goodsCO2 = monthlySpend * 12 * ECO_FACTORS.lifestyle.clothing;
  const wasteFactor =
    packagingLevel === 'high'
      ? ECO_FACTORS.lifestyle.packagingWasteHigh
      : ECO_FACTORS.lifestyle.packagingWasteLow;
  return goodsCO2 + wasteFactor * 365;
}

function calcTotalFootprint(energy, transport, food, shopping, offsetTons = 0) {
  const grossTons = (energy + transport + food + shopping) / 1000;
  return Math.max(0, grossTons - offsetTons);
}

describe('EcoTwin Emissions Engine Unit Tests', () => {
  describe('Suite 1: Energy Emissions', () => {
    test('Zero electricity and gas = zero energy emissions', () => {
      expect(calcEnergyEmissions(0, 0, 0)).toBe(0);
    });
    test('300 kWh electricity, 0% clean = 114 kg CO2', () => {
      expect(calcEnergyEmissions(300, 0, 0)).toBeCloseTo(114.0);
    });
    test('100% clean energy makes electricity contribution zero', () => {
      expect(calcEnergyEmissions(300, 0, 100)).toBe(0);
    });
    test('50% clean energy halves electricity CO2', () => {
      expect(calcEnergyEmissions(300, 0, 50)).toBeCloseTo(57.0);
    });
    test('Natural gas 120 kWh = 22.2 kg CO2', () => {
      expect(calcEnergyEmissions(0, 120, 0)).toBeCloseTo(22.2);
    });
    test('Clean energy % never makes total negative', () => {
      expect(calcEnergyEmissions(300, 120, 100)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Suite 2: Transport Emissions', () => {
    test('Zero driving = zero transport emissions', () => {
      expect(calcTransportEmissions(0, 'petrol', 0, 0)).toBe(0);
    });
    test('Petrol car 8000 km = 1360 kg CO2', () => {
      expect(calcTransportEmissions(8000, 'petrol', 0, 0)).toBeCloseTo(1360.0);
    });
    test('EV emits less than petrol for same distance', () => {
      const ev = calcTransportEmissions(8000, 'ev', 0, 0);
      const petrol = calcTransportEmissions(8000, 'petrol', 0, 0);
      expect(ev).toBeLessThan(petrol);
    });
    test('EV 8000 km = 360 kg CO2', () => {
      expect(calcTransportEmissions(8000, 'ev', 0, 0)).toBeCloseTo(360.0);
    });
    test('Bus emits less than petrol car per km', () => {
      const bus = calcTransportEmissions(0, 'petrol', 1000, 0);
      const car = calcTransportEmissions(1000, 'petrol', 0, 0);
      expect(bus).toBeLessThan(car);
    });
    test('Unknown fuel type defaults to petrol factor', () => {
      const unknown = calcTransportEmissions(1000, 'jetpack', 0, 0);
      const petrol = calcTransportEmissions(1000, 'petrol', 0, 0);
      expect(unknown).toBe(petrol);
    });
    test('Hybrid emits between EV and petrol', () => {
      const ev = calcTransportEmissions(1000, 'ev', 0, 0);
      const hybrid = calcTransportEmissions(1000, 'hybrid', 0, 0);
      const petrol = calcTransportEmissions(1000, 'petrol', 0, 0);
      expect(hybrid).toBeGreaterThan(ev);
      expect(hybrid).toBeLessThan(petrol);
    });
  });

  describe('Suite 3: Diet Emissions', () => {
    test('Vegan diet emits less than meat lover', () => {
      expect(calcDietEmissions('vegan')).toBeLessThan(calcDietEmissions('meatLover'));
    });
    test('Vegan annual = 1054.85 kg CO2', () => {
      expect(calcDietEmissions('vegan')).toBeCloseTo(1054.85);
    });
    test('Average meat annual = 2054.95 kg CO2', () => {
      expect(calcDietEmissions('averageMeat')).toBeCloseTo(2054.95);
    });
    test('Diet hierarchy: meatLover > averageMeat > pescatarian > vegetarian > vegan', () => {
      expect(calcDietEmissions('meatLover')).toBeGreaterThan(calcDietEmissions('averageMeat'));
      expect(calcDietEmissions('averageMeat')).toBeGreaterThan(calcDietEmissions('pescatarian'));
      expect(calcDietEmissions('pescatarian')).toBeGreaterThan(calcDietEmissions('vegetarian'));
      expect(calcDietEmissions('vegetarian')).toBeGreaterThan(calcDietEmissions('vegan'));
    });
    test('Unknown diet defaults to averageMeat', () => {
      expect(calcDietEmissions('alien_food')).toBe(calcDietEmissions('averageMeat'));
    });
  });

  describe('Suite 4: Shopping Emissions', () => {
    test('Zero spend, low packaging = 109.5 kg CO2', () => {
      expect(calcShoppingEmissions(0, 'low')).toBeCloseTo(109.5);
    });
    test('High packaging emits more than low packaging', () => {
      expect(calcShoppingEmissions(100, 'high')).toBeGreaterThan(calcShoppingEmissions(100, 'low'));
    });
    test('150/month spend, low packaging = 919.5 kg CO2', () => {
      expect(calcShoppingEmissions(150, 'low')).toBeCloseTo(919.5);
    });
  });

  describe('Suite 5: Total Footprint & Offsets', () => {
    test('4000 kg total = 4.0 tonnes', () => {
      expect(calcTotalFootprint(1000, 1000, 1000, 1000)).toBeCloseTo(4.0);
    });
    test('Offsets reduce total footprint correctly', () => {
      expect(calcTotalFootprint(1000, 1000, 1000, 1000, 1.0)).toBeCloseTo(3.0);
    });
    test('Footprint never goes negative with large offsets', () => {
      expect(calcTotalFootprint(500, 500, 500, 500, 9999)).toBeGreaterThanOrEqual(0);
    });
    test('Realistic average user footprint is between 3 and 10 tonnes', () => {
      const energy = calcEnergyEmissions(300, 120, 0);
      const transport = calcTransportEmissions(8000, 'petrol', 1040, 5);
      const food = calcDietEmissions('averageMeat');
      const shopping = calcShoppingEmissions(150, 'low');
      const total = calcTotalFootprint(energy, transport, food, shopping);
      expect(total).toBeGreaterThan(3);
      expect(total).toBeLessThan(10);
    });
    test('EV user has lower total footprint than petrol user', () => {
      const shared = { energy: 1000, food: 2000, shopping: 500 };
      const evTotal = calcTotalFootprint(
        shared.energy,
        calcTransportEmissions(8000, 'ev', 0, 0),
        shared.food,
        shared.shopping
      );
      const petrolTotal = calcTotalFootprint(
        shared.energy,
        calcTransportEmissions(8000, 'petrol', 0, 0),
        shared.food,
        shared.shopping
      );
      expect(evTotal).toBeLessThan(petrolTotal);
    });
  });

  describe('Suite 6: Profile Recommendation Engine', () => {
    let ProfilePage;
    beforeAll(() => {
      ProfilePage = require('../js/profile.js');
    });

    test('Recommendation engine returns exactly 3 recommendations', () => {
      const recs = ProfilePage.getRecommendationsForInputs({});
      expect(recs.length).toBe(3);
    });

    test('Car commute input generates correct transport tip', () => {
      const recs = ProfilePage.getRecommendationsForInputs({
        commuteMode: 'car',
        commuteDistance: 30,
      });
      const transportRec = recs.find(r => r.category === 'transport');
      expect(transportRec.icon).toBe('car');
      expect(transportRec.pledge.includes('commute by metro or active transit')).toBe(true);
    });

    test('Heavy meat diet input generates meat reduction tip', () => {
      const recs = ProfilePage.getRecommendationsForInputs({
        quizDiet: 'heavy-meat',
      });
      const dietRec = recs.find(r => r.category === 'diet');
      expect(dietRec.icon).toBe('utensils');
      expect(dietRec.pledge.includes('swapping to plant-based meals')).toBe(true);
    });

    test('Frequent flight input generates flight substitution tip', () => {
      const recs = ProfilePage.getRecommendationsForInputs({
        flights: '3-5',
      });
      const transportRec = recs.find(r => r.category === 'transport');
      expect(transportRec.icon).toBe('plane');
      expect(transportRec.pledge.includes('substitute business flights with rail')).toBe(true);
    });

    test('Electric utility heating input generates utility upgrade tip', () => {
      const recs = ProfilePage.getRecommendationsForInputs({
        homeHeating: 'electric',
      });
      const energyRec = recs.find(r => r.category === 'energy');
      expect(energyRec.icon).toBe('zap');
      expect(energyRec.pledge.includes('utility plan or install smart LEDs')).toBe(true);
    });
  });
});
