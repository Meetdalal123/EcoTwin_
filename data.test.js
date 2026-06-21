describe('ECO_DATA Module', () => {
  let ECO_DATA;

  beforeEach(() => {
    jest.resetModules();
    ECO_DATA = require('../js/data.js');
  });

  // ── Basic structure ─────────────────────────────────────────────────────────
  test('should load ECO_DATA object successfully', () => {
    expect(ECO_DATA).toBeDefined();
    expect(ECO_DATA.factors).toBeDefined();
    expect(ECO_DATA.tips.length).toBeGreaterThan(0);
    expect(ECO_DATA.earthGPT).toBeDefined();
    expect(ECO_DATA.challenges).toBeDefined();
    expect(ECO_DATA.badgeLore).toBeDefined();
  });

  // ── Transport factors ────────────────────────────────────────────────────────
  describe('Transport emission factors', () => {
    test('petrolCar factor is correct', () => {
      expect(ECO_DATA.factors.transport.petrolCar).toBe(0.17);
    });
    test('dieselCar factor is correct', () => {
      expect(ECO_DATA.factors.transport.dieselCar).toBe(0.175);
    });
    test('hybridCar factor is correct', () => {
      expect(ECO_DATA.factors.transport.hybridCar).toBe(0.11);
    });
    test('electricCar factor is correct', () => {
      expect(ECO_DATA.factors.transport.electricCar).toBe(0.045);
    });
    test('motorcycle factor is correct', () => {
      expect(ECO_DATA.factors.transport.motorcycle).toBe(0.115);
    });
    test('bus factor is correct', () => {
      expect(ECO_DATA.factors.transport.bus).toBe(0.08);
    });
    test('train factor is correct', () => {
      expect(ECO_DATA.factors.transport.train).toBe(0.035);
    });
    test('flightShort factor is correct (domestic)', () => {
      expect(ECO_DATA.factors.transport.flightShort).toBe(0.245);
    });
    test('flightLong factor is correct (international)', () => {
      expect(ECO_DATA.factors.transport.flightLong).toBe(0.15);
    });
    test('electricCar is significantly lower than petrolCar', () => {
      expect(ECO_DATA.factors.transport.electricCar).toBeLessThan(
        ECO_DATA.factors.transport.petrolCar
      );
    });
    test('flightShort emits more than bus per km', () => {
      expect(ECO_DATA.factors.transport.flightShort).toBeGreaterThan(
        ECO_DATA.factors.transport.bus
      );
    });
    test('transport factors lookup for unknown key returns undefined', () => {
      expect(ECO_DATA.factors.transport['hoverboard']).toBeUndefined();
    });
  });

  // ── Energy factors ───────────────────────────────────────────────────────────
  describe('Energy emission factors', () => {
    test('electricityGrid factor is correct', () => {
      expect(ECO_DATA.factors.energy.electricityGrid).toBe(0.38);
    });
    test('naturalGas factor is correct', () => {
      expect(ECO_DATA.factors.energy.naturalGas).toBe(0.185);
    });
    test('heatingOil factor is correct', () => {
      expect(ECO_DATA.factors.energy.heatingOil).toBe(0.27);
    });
    test('electricityGrid > naturalGas in emissions', () => {
      expect(ECO_DATA.factors.energy.electricityGrid).toBeGreaterThan(
        ECO_DATA.factors.energy.naturalGas
      );
    });
    test('energy factors lookup for unknown key returns undefined', () => {
      expect(ECO_DATA.factors.energy['nuclear']).toBeUndefined();
    });
  });

  // ── Diet factors ─────────────────────────────────────────────────────────────
  describe('Diet emission factors (kg CO2/day)', () => {
    test('meatLover is the highest diet factor', () => {
      const d = ECO_DATA.factors.diet;
      expect(d.meatLover).toBeGreaterThan(d.averageMeat);
      expect(d.meatLover).toBeGreaterThan(d.pescatarian);
      expect(d.meatLover).toBeGreaterThan(d.vegetarian);
      expect(d.meatLover).toBeGreaterThan(d.vegan);
    });
    test('vegan is the lowest diet factor', () => {
      const d = ECO_DATA.factors.diet;
      expect(d.vegan).toBeLessThan(d.vegetarian);
      expect(d.vegan).toBeLessThan(d.pescatarian);
      expect(d.vegan).toBeLessThan(d.averageMeat);
    });
    test('meatLover factor value', () => {
      expect(ECO_DATA.factors.diet.meatLover).toBe(7.26);
    });
    test('averageMeat factor value', () => {
      expect(ECO_DATA.factors.diet.averageMeat).toBe(5.63);
    });
    test('pescatarian factor value', () => {
      expect(ECO_DATA.factors.diet.pescatarian).toBe(3.91);
    });
    test('vegetarian factor value', () => {
      expect(ECO_DATA.factors.diet.vegetarian).toBe(3.81);
    });
    test('vegan factor value', () => {
      expect(ECO_DATA.factors.diet.vegan).toBe(2.89);
    });
    test('diet lookup for unknown type returns undefined — caller must use fallback', () => {
      expect(ECO_DATA.factors.diet['carnivore']).toBeUndefined();
    });
    test('null key access on diet returns undefined', () => {
      expect(ECO_DATA.factors.diet[null]).toBeUndefined();
    });
    test('undefined key access on diet returns undefined', () => {
      expect(ECO_DATA.factors.diet[undefined]).toBeUndefined();
    });
  });

  // ── Lifestyle factors ─────────────────────────────────────────────────────────
  describe('Lifestyle/shopping emission factors', () => {
    test('clothing factor is correct', () => {
      expect(ECO_DATA.factors.lifestyle.clothing).toBe(0.45);
    });
    test('electronics factor is correct', () => {
      expect(ECO_DATA.factors.lifestyle.electronics).toBe(0.85);
    });
    test('services factor is correct', () => {
      expect(ECO_DATA.factors.lifestyle.services).toBe(0.12);
    });
    test('packagingWasteHigh factor is correct', () => {
      expect(ECO_DATA.factors.lifestyle.packagingWasteHigh).toBe(1.2);
    });
    test('packagingWasteLow factor is correct', () => {
      expect(ECO_DATA.factors.lifestyle.packagingWasteLow).toBe(0.3);
    });
    test('packagingWasteHigh is 4x packagingWasteLow', () => {
      expect(ECO_DATA.factors.lifestyle.packagingWasteHigh).toBe(
        ECO_DATA.factors.lifestyle.packagingWasteLow * 4
      );
    });
    test('lifestyle lookup for unknown key returns undefined', () => {
      expect(ECO_DATA.factors.lifestyle['luxury']).toBeUndefined();
    });
  });

  // ── Calculated scenarios using factors ───────────────────────────────────────
  describe('Derived calculations using ECO_DATA factors', () => {
    test('annual food CO2 for vegan diet', () => {
      const annualVegan = ECO_DATA.factors.diet.vegan * 365;
      expect(annualVegan).toBeCloseTo(1054.85, 1);
    });
    test('annual food CO2 for meatLover diet', () => {
      const annualMeat = ECO_DATA.factors.diet.meatLover * 365;
      expect(annualMeat).toBeCloseTo(2649.9, 1);
    });
    test('100km petrol car emits more than 100km EV', () => {
      const petrol = 100 * ECO_DATA.factors.transport.petrolCar;
      const ev = 100 * ECO_DATA.factors.transport.electricCar;
      expect(petrol).toBeGreaterThan(ev);
    });
    test('clean energy reduces electricity CO2 correctly', () => {
      const kWh = 300;
      const factor = ECO_DATA.factors.energy.electricityGrid;
      const full = kWh * factor; // no clean energy
      const half = kWh * factor * (1 - 50 / 100); // 50% clean
      expect(half).toBeCloseTo(full / 2);
    });
  });

  // ── Tips ─────────────────────────────────────────────────────────────────────
  describe('Tips array', () => {
    test('has at least 6 tips', () => {
      expect(ECO_DATA.tips.length).toBeGreaterThanOrEqual(6);
    });
    test('each tip is a non-empty string', () => {
      ECO_DATA.tips.forEach(tip => {
        expect(typeof tip).toBe('string');
        expect(tip.length).toBeGreaterThan(0);
      });
    });
  });

  // ── EarthGPT ─────────────────────────────────────────────────────────────────
  describe('EarthGPT responses', () => {
    test('has greetings array', () => {
      expect(Array.isArray(ECO_DATA.earthGPT.greetings)).toBe(true);
      expect(ECO_DATA.earthGPT.greetings.length).toBeGreaterThan(0);
    });
    test('has default response', () => {
      expect(typeof ECO_DATA.earthGPT.default).toBe('string');
    });
    test('has transport topic', () => {
      expect(ECO_DATA.earthGPT.topics.transport).toBeDefined();
    });
    test('has diet topic', () => {
      expect(ECO_DATA.earthGPT.topics.diet).toBeDefined();
    });
    test('has energy topic', () => {
      expect(ECO_DATA.earthGPT.topics.energy).toBeDefined();
    });
    test('has offsetting topic', () => {
      expect(ECO_DATA.earthGPT.topics.offsetting).toBeDefined();
    });
    test('has fashion topic', () => {
      expect(ECO_DATA.earthGPT.topics.fashion).toBeDefined();
    });
    test('unknown topic returns undefined', () => {
      expect(ECO_DATA.earthGPT.topics['cryptocurrency']).toBeUndefined();
    });
  });

  // ── Challenges ───────────────────────────────────────────────────────────────
  describe('Challenges structure', () => {
    test('has daily challenges array', () => {
      expect(Array.isArray(ECO_DATA.challenges.daily)).toBe(true);
      expect(ECO_DATA.challenges.daily.length).toBeGreaterThan(0);
    });
    test('has weekly challenges array', () => {
      expect(Array.isArray(ECO_DATA.challenges.weekly)).toBe(true);
    });
    test('has monthly challenges array', () => {
      expect(Array.isArray(ECO_DATA.challenges.monthly)).toBe(true);
    });
    test('each daily challenge has id, title, desc, xp', () => {
      ECO_DATA.challenges.daily.forEach(c => {
        expect(c.id).toBeDefined();
        expect(c.title).toBeDefined();
        expect(c.desc).toBeDefined();
        expect(typeof c.xp).toBe('number');
      });
    });
  });

  // ── Badge Lore ───────────────────────────────────────────────────────────────
  describe('BadgeLore structure', () => {
    test('calc badge lore exists', () => {
      expect(ECO_DATA.badgeLore.calc).toBeDefined();
      expect(ECO_DATA.badgeLore.calc.title).toBe('Calc Pioneer');
    });
    test('scan badge lore exists', () => {
      expect(ECO_DATA.badgeLore.scan).toBeDefined();
    });
    test('planet badge lore exists', () => {
      expect(ECO_DATA.badgeLore.planet).toBeDefined();
    });
    test('challenge badge lore exists', () => {
      expect(ECO_DATA.badgeLore.challenge).toBeDefined();
    });
    test('each badge lore has checklist array', () => {
      Object.values(ECO_DATA.badgeLore).forEach(lore => {
        expect(Array.isArray(lore.checklist)).toBe(true);
      });
    });
  });

  // ── Receipt & Camera presets ──────────────────────────────────────────────────
  describe('Receipt and camera presets', () => {
    test('receiptPresets exist', () => {
      expect(ECO_DATA.receiptPresets).toBeDefined();
    });
    test('receipt1 has items array', () => {
      expect(Array.isArray(ECO_DATA.receiptPresets.receipt1.items)).toBe(true);
    });
    test('receipt items have isEco and co2 fields', () => {
      ECO_DATA.receiptPresets.receipt1.items.forEach(item => {
        expect(item.co2).toBeDefined();
        expect(typeof item.isEco).toBe('boolean');
      });
    });
    test('cameraPresets exist', () => {
      expect(ECO_DATA.cameraPresets).toBeDefined();
    });
    test('kitchen camera preset has items', () => {
      expect(Array.isArray(ECO_DATA.cameraPresets.kitchen.items)).toBe(true);
    });
  });

  // ── Boundary values ───────────────────────────────────────────────────────────
  describe('Boundary and edge case lookups', () => {
    test('accessing factors.diet with empty string returns undefined', () => {
      expect(ECO_DATA.factors.diet['']).toBeUndefined();
    });
    test('accessing factors.transport with empty string returns undefined', () => {
      expect(ECO_DATA.factors.transport['']).toBeUndefined();
    });
    test('zero distance * factor = 0 emissions', () => {
      expect(0 * ECO_DATA.factors.transport.petrolCar).toBe(0);
    });
    test('negative value * factor = negative (caller should clamp)', () => {
      const result = -100 * ECO_DATA.factors.transport.petrolCar;
      expect(result).toBeLessThan(0);
    });
    test('large value produces large but finite number', () => {
      const large = 1000000 * ECO_DATA.factors.transport.petrolCar;
      expect(isFinite(large)).toBe(true);
    });
  });
});
