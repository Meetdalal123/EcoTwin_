/* e:\PromptWar\Challenge-3\js\data.js */

const ECO_DATA = {
  // Emission Factors in kg CO2 equivalent
  factors: {
    // Transport (per km)
    transport: {
      petrolCar: 0.17,
      dieselCar: 0.175,
      hybridCar: 0.11,
      electricCar: 0.045,
      motorcycle: 0.115,
      bus: 0.08,
      train: 0.035,
      flightShort: 0.245, // domestic
      flightLong: 0.15, // international
    },
    // Home Energy (annualized per kWh/unit)
    energy: {
      electricityGrid: 0.38, // kg CO2 per kWh
      naturalGas: 0.185, // kg CO2 per kWh
      heatingOil: 0.27, // kg CO2 per kWh
    },
    // Diet (kg CO2 per day based on diet type)
    diet: {
      meatLover: 7.26,
      averageMeat: 5.63,
      pescatarian: 3.91,
      vegetarian: 3.81,
      vegan: 2.89,
    },
    // Shopping & Lifestyle (kg CO2 per dollar spent)
    lifestyle: {
      clothing: 0.45,
      electronics: 0.85,
      services: 0.12,
      packagingWasteHigh: 1.2,
      packagingWasteLow: 0.3,
    },
  },

  // Tips of the day
  tips: [
    "Switching to cold water for washing clothes saves up to 75% of the machine's energy.",
    'Replacing just one beef meal per week with lentils saves 330kg of CO2 per year.',
    "Unplugging electronics when not in use stops 'phantom load' which accounts for 10% of household electricity usage.",
    'Inflating your car tires to the correct pressure improves fuel mileage by up to 3%.',
    'Line-drying your clothes for 6 months saves over 320kg of CO2.',
    'E-waste is the fastest growing waste stream. Repairing devices instead of buying new reduces huge environmental impacts.',
  ],

  // EarthGPT AI Pre-loaded responses
  earthGPT: {
    greetings: [
      'Hello! I am EarthGPT, your AI sustainability coach. Ask me anything about carbon reduction, ecological habits, or green tech!',
    ],
    default:
      'That is a great question! Reducing carbon footprints in this area requires a mixture of lifestyle tweaks and structural shifts. Focus on lowering meat consumption, switching to electric or public transport, insulating your home, and buying fewer, high-quality durable goods. Do you have a specific category (like transportation or energy) you want to dive into?',
    topics: {
      transport:
        "To reduce transportation emissions:\n1. Choose train or bus over domestic flights (saves ~80% CO2).\n2. Drive smoothly, check tire pressure, or switch to an electric vehicle.\n3. Cycle or walk for trips under 3km. It's free and zero-emission!",
      diet: "Food accounts for 26% of global emissions. Moving from a heavy-meat diet to a plant-forward diet is the single most powerful individual action. Replacing red meat with plant proteins reduces your meal's carbon footprint by up to 90%.",
      energy:
        'Home heating and electricity are major contributors. To optimize:\n1. Switch to a 100% renewable energy provider.\n2. Install a smart thermostat and lower the temperature by 1°C (saves 10% gas).\n3. Insulate windows and doors to prevent thermal leakages.',
      offsetting:
        "Carbon offsetting is planting trees or funding clean energy to balance out your emissions. However, *reduction* is always better than offsetting. Think of offsets as the final polish once you've reduced your footprint as much as possible.",
      fashion:
        'The fashion industry generates 10% of global emissions. To combat this: buy secondhand clothes, repair existing garments, choose natural fibers (like cotton or wool) over synthetics (polyester), and support circular fashion brands.',
    },
  },

  // Mock preset receipts for parsing
  receiptPresets: {
    receipt1: {
      title: 'Green Grocery - Organic Store',
      date: '2026-06-08',
      items: [
        { name: 'Organic Oat Milk (1L)', co2: 0.3, isEco: true, swap: '' },
        { name: 'Organic Spinach (250g)', co2: 0.1, isEco: true, swap: '' },
        {
          name: 'Imported Beef Steak (500g)',
          co2: 15.5,
          isEco: false,
          swap: 'Replace with Plant-based Meat burger or Local Chicken (saves 12.8 kg CO2)',
        },
        {
          name: 'Plums in Plastic Tub',
          co2: 1.2,
          isEco: false,
          swap: 'Buy loose local plums without plastic casing (saves 0.9 kg CO2)',
        },
      ],
    },
    receipt2: {
      title: 'MegaSuperMart - Weekly Haul',
      date: '2026-06-07',
      items: [
        { name: 'Local Apple Pack', co2: 0.2, isEco: true, swap: '' },
        { name: 'Fresh Salmon Fillet', co2: 2.1, isEco: true, swap: '' },
        {
          name: 'Single-Use Plastic Bottles (x6)',
          co2: 3.5,
          isEco: false,
          swap: 'Get a reusable stainless steel bottle + tap filter (saves 3.5 kg CO2)',
        },
        {
          name: 'Frozen Processed Ready Meals (x3)',
          co2: 6.8,
          isEco: false,
          swap: 'Prep fresh batch meals to store in reusable containers (saves 4.5 kg CO2)',
        },
      ],
    },
  },

  // Mock camera recognition items
  cameraPresets: {
    kitchen: {
      image: 'kitchen_mock',
      title: 'Kitchen Audit Scan',
      items: [
        {
          x: 150,
          y: 120,
          width: 80,
          height: 100,
          label: 'Plastic Cling Wrap',
          co2: '1.4kg CO2 / roll',
          isEco: false,
          swap: 'Beeswax wraps or reusable silicone lids',
        },
        {
          x: 300,
          y: 80,
          width: 70,
          height: 140,
          label: 'Glass Jar Compote',
          co2: '0.2kg CO2',
          isEco: true,
          swap: '',
        },
        {
          x: 450,
          y: 220,
          width: 120,
          height: 110,
          label: 'Non-stick Teflon Pan',
          co2: 'Expensive lifecycle footprint',
          isEco: false,
          swap: 'Cast iron or stainless steel skillet',
        },
        {
          x: 100,
          y: 280,
          width: 60,
          height: 80,
          label: 'Reusable Compost Bin',
          co2: '-15kg CO2 / year diverted',
          isEco: true,
          swap: '',
        },
      ],
    },
    office: {
      image: 'office_mock',
      title: 'Home Office Scan',
      items: [
        {
          x: 220,
          y: 90,
          width: 150,
          height: 100,
          label: 'Dual Screen (LED)',
          co2: '150kg CO2 / year on',
          isEco: false,
          swap: 'Use single screen or eco-brightness settings',
        },
        {
          x: 110,
          y: 150,
          width: 50,
          height: 80,
          label: 'Incandescent Desk Lamp',
          co2: '60W high draw',
          isEco: false,
          swap: 'Swap for a 6W LED bulb (saves 90% energy)',
        },
        {
          x: 400,
          y: 180,
          width: 100,
          height: 120,
          label: 'Spathiphyllum Indoor Plant',
          co2: 'Actively purifies air & traps carbon',
          isEco: true,
          swap: '',
        },
      ],
    },
  },

  // Challenges list
  challenges: {
    daily: [
      {
        id: 'd1',
        title: 'Meatless Day',
        desc: 'Go vegetarian or vegan for all meals today.',
        xp: 30,
        completed: false,
      },
      {
        id: 'd2',
        title: 'Digital Blackout',
        desc: 'Unplug from streaming or digital gaming for 2 hours.',
        xp: 15,
        completed: false,
      },
      {
        id: 'd3',
        title: 'Walk or Pedal',
        desc: 'For any trip under 2 kilometers, walk or cycle instead of driving.',
        xp: 25,
        completed: false,
      },
    ],
    weekly: [
      {
        id: 'w1',
        title: 'Local Feast',
        desc: 'Cook three meals using exclusively local ingredients (within 100km).',
        xp: 100,
        completed: false,
      },
      {
        id: 'w2',
        title: 'Line Dryer',
        desc: 'Air-dry all your laundry washes this week (no tumble dryer).',
        xp: 75,
        completed: false,
      },
    ],
    monthly: [
      {
        id: 'm1',
        title: 'Flight-Free Month',
        desc: 'Commit to no domestic flights and travel by rail or bus.',
        xp: 250,
        completed: false,
      },
      {
        id: 'm2',
        title: 'Zero Plastic Challenge',
        desc: 'Avoid purchasing single-use packaging for grocery items.',
        xp: 200,
        completed: false,
      },
    ],
  },

  // Live sustainability energy news feed
  newsTicker: [
    'Global solar capacity grew by a record 34% this quarter, displacing fossil fuels.',
    'New battery storage project in California stores 400MW of grid-stabilizing solar power.',
    'Denmark reports wind energy generated 115% of its domestic electricity demand last night.',
    'Carbon offset program in the Amazon basin plants 5,000,000 native tree saplings.',
    'EcoTwin AI user base has collectively simulated and offset 284,000 tons of carbon emissions!',
    'Electric Vehicles (EV) reached a record 88% market share in Norway last month.',
    'Ocean cleanup drones retrieve 45,000 kg of floating microplastics in the Pacific.',
    'Costa Rica finishes its 300th consecutive day powered by 100% renewable energy.',
  ],

  // Detailed lore for achievements badges
  badgeLore: {
    calc: {
      title: 'Calc Pioneer',
      desc: 'Completed your first comprehensive carbon footprint audit. This unlocks your basic carbon avatar twin and allows you to simulate changes in the Carbon Time Machine.',
      checklist: [
        'Fill out electricity and utility monthly figures.',
        'Input annual car transport mileage and flight frequency.',
        'Select your dietary profile and click Save.',
      ],
      reward: 'Unlocks Carbon Twin avatar and grants +40 XP.',
    },
    scan: {
      title: 'Scan Master',
      desc: 'Snapped a photo or uploaded receipt scans to discover hidden carbon points. Vision auditing reveals that 80% of packaging waste is preventable.',
      checklist: [
        'Upload or preset-run a Grocery Receipt.',
        'Submit a Kitchen or Office Room photo scan.',
        'Review alternative eco-friendly swap suggestions.',
      ],
      reward: 'Unlocks the Circular Economy filter and grants +40 XP.',
    },
    planet: {
      title: 'Eden Restorer',
      desc: 'Achieved the prestigious status of restoring your Virtual Eco Planet health level past 80%. Lush pine trees and clean water streams now dominate your globe.',
      checklist: [
        'Reduce your gross emissions below 4.5 Tons.',
        'Simulate/purchase carbon offsets in the Offset Shop.',
        'Cultivate a sustainable lifestyle streak for 3 days.',
      ],
      reward: 'Unlocks Golden Oaks tree types and grants +60 XP.',
    },
    challenge: {
      title: 'Habit Breaker',
      desc: 'Diverted routine emission points by successfully checking off a pending daily environmental task. Small habit adjustments generate massive multi-year compounds.',
      checklist: [
        'Review daily/weekly green challenges menu.',
        'Click Complete on your first meatless or transport task.',
        'Level up your green streak counter in the dashboard.',
      ],
      reward: 'Unlocks custom badge medals and grants +30 XP.',
    },
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ECO_DATA;
  global.ECO_DATA = ECO_DATA;
}
