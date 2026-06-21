const EcoPledges = {
  canvas: null,
  ctx: null,
  stars: [],
  pledgesList: [
    {
      text: 'I pledge to eat plant-based meals on weekdays.',
      category: 'diet',
      x: 100,
      y: 120,
      vx: 0.08,
      vy: -0.04,
      size: 4,
    },
    {
      text: "I'll commute by public transit instead of driving.",
      category: 'transport',
      x: 250,
      y: 220,
      vx: -0.06,
      vy: 0.06,
      size: 5,
    },
    {
      text: 'I pledge to switch to a 100% clean solar energy mix.',
      category: 'energy',
      x: 400,
      y: 80,
      vx: 0.04,
      vy: -0.03,
      size: 6,
    },
    {
      text: 'I will buy only second-hand apparel this season.',
      category: 'shopping',
      x: 550,
      y: 180,
      vx: -0.07,
      vy: -0.06,
      size: 4,
    },
    {
      text: 'Replace single-use grocery bags with cloth sacks.',
      category: 'shopping',
      x: 680,
      y: 90,
      vx: 0.05,
      vy: 0.05,
      size: 4.5,
    },
    {
      text: 'Limit showers to 5 minutes to save water heating energy.',
      category: 'energy',
      x: 150,
      y: 280,
      vx: -0.04,
      vy: -0.04,
      size: 5,
    },
    {
      text: 'Switch 100% of my lightbulbs to smart LEDs.',
      category: 'energy',
      x: 320,
      y: 140,
      vx: 0.05,
      vy: -0.05,
      size: 4,
    },
    {
      text: 'I pledge to cycle to work at least twice a week.',
      category: 'transport',
      x: 480,
      y: 260,
      vx: -0.03,
      vy: 0.06,
      size: 5.5,
    },
    {
      text: 'Try a vegan diet for a full 30-day challenge.',
      category: 'diet',
      x: 600,
      y: 50,
      vx: 0.06,
      vy: -0.05,
      size: 6,
    },
    {
      text: 'Offset 100% of my business flights this year.',
      category: 'transport',
      x: 80,
      y: 60,
      vx: -0.05,
      vy: 0.03,
      size: 4.5,
    },
    {
      text: 'Establish a backyard composting bin for organic scraps.',
      category: 'diet',
      x: 720,
      y: 240,
      vx: 0.04,
      vy: -0.04,
      size: 5,
    },
    {
      text: 'Cancel fast fashion deliveries and buy local crafts.',
      category: 'shopping',
      x: 200,
      y: 160,
      vx: -0.05,
      vy: 0.06,
      size: 4,
    },
    {
      text: 'Turn off high-power electronics during solar grid peak.',
      category: 'energy',
      x: 380,
      y: 290,
      vx: 0.03,
      vy: -0.05,
      size: 5.5,
    },
    {
      text: 'Eat locally grown organic farm foods first.',
      category: 'diet',
      x: 500,
      y: 110,
      vx: -0.04,
      vy: 0.04,
      size: 4.8,
    },
    {
      text: 'Opt for group shipments instead of express single orders.',
      category: 'shopping',
      x: 640,
      y: 270,
      vx: 0.05,
      vy: -0.03,
      size: 5.2,
    },
  ],
  categoryColors: {
    diet: '#4ade80', // green
    transport: '#60a5fa', // blue
    energy: '#fbbf24', // amber
    shopping: '#f472b6', // pink
  },
  hoveredStar: null,
  animationFrameId: null,

  init() {
    this.canvas = document.getElementById('pledge-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.resizeCanvas();
    this.loadPledges();
    this.setupEvents();
    this.animate();
  },

  resizeCanvas() {
    const parent = this.canvas.parentElement;
    this.canvas.width = parent.clientWidth || 800;
    this.canvas.height = 320;
  },

  loadPledges() {
    let saved;
    try {
      saved =
        typeof Utils !== 'undefined'
          ? Utils.storage.getItem('eco_pledges_stars')
          : JSON.parse(localStorage.getItem('eco_pledges_stars') || '[]');
    } catch (e) {
      console.error('Error loading pledges:', e);
    }
    let loadedPledges = [];
    if (saved) {
      loadedPledges = typeof saved === 'string' ? JSON.parse(saved) : saved;
    }

    // Seed with community pledges from global early adopters if no local data yet.
    if (!loadedPledges || loadedPledges.length === 0) {
      loadedPledges = [
        // India
        {
          text: 'Aarav M. (Mumbai): Switch to public transport 3x/week. Est: -1.2t CO₂/yr',
          category: 'transport',
          isEarly: true,
          x: 120,
          y: 150,
          vx: 0.04,
          vy: -0.05,
          size: 5.5,
        },
        {
          text: 'Priya S. (Bengaluru): Go vegetarian on weekdays. Est: -0.8t CO₂/yr',
          category: 'diet',
          isEarly: true,
          x: 280,
          y: 80,
          vx: -0.05,
          vy: 0.04,
          size: 5.0,
        },
        {
          text: 'Rohan K. (Delhi): Install rooftop solar panels. Est: -2.1t CO₂/yr',
          category: 'energy',
          isEarly: true,
          x: 420,
          y: 220,
          vx: 0.03,
          vy: -0.06,
          size: 6.0,
        },
        {
          text: 'Sneha P. (Pune): Eliminate single-use plastics entirely. Est: -0.5t CO₂/yr',
          category: 'shopping',
          isEarly: true,
          x: 560,
          y: 110,
          vx: -0.04,
          vy: -0.03,
          size: 4.5,
        },
        {
          text: 'Vikram T. (Chennai): Carpool to office every day. Est: -1.7t CO₂/yr',
          category: 'transport',
          isEarly: true,
          x: 180,
          y: 260,
          vx: -0.06,
          vy: 0.03,
          size: 5.8,
        },
        {
          text: 'Ananya R. (Ahmedabad): Replace all bulbs with smart LEDs. Est: -0.9t CO₂/yr',
          category: 'energy',
          isEarly: true,
          x: 680,
          y: 200,
          vx: 0.05,
          vy: 0.05,
          size: 5.2,
        },
        {
          text: 'Kiran J. (Hyderabad): Compost all organic kitchen waste. Est: -0.4t CO₂/yr',
          category: 'diet',
          isEarly: true,
          x: 340,
          y: 170,
          vx: -0.03,
          vy: -0.05,
          size: 4.8,
        },
        {
          text: 'Meera L. (Kolkata): Buy only secondhand clothing for 1 year. Est: -0.6t CO₂/yr',
          category: 'shopping',
          isEarly: true,
          x: 490,
          y: 290,
          vx: 0.05,
          vy: 0.03,
          size: 5.1,
        },
        // Europe
        {
          text: 'Oliver G. (London): Zero single-use plastic at home. Est: -0.7t CO₂/yr',
          category: 'shopping',
          isEarly: true,
          x: 620,
          y: 140,
          vx: 0.04,
          vy: -0.04,
          size: 5.3,
        },
        {
          text: 'Sofia M. (Barcelona): Cycle to work instead of driving. Est: -1.4t CO₂/yr',
          category: 'transport',
          isEarly: true,
          x: 130,
          y: 240,
          vx: -0.04,
          vy: 0.04,
          size: 5.6,
        },
        {
          text: 'Lars K. (Stockholm): Heat home with geothermal only. Est: -2.8t CO₂/yr',
          category: 'energy',
          isEarly: true,
          x: 720,
          y: 70,
          vx: 0.03,
          vy: -0.05,
          size: 6.2,
        },
        {
          text: 'Emma W. (Berlin): Adopt a fully plant-based diet. Est: -1.5t CO₂/yr',
          category: 'diet',
          isEarly: true,
          x: 200,
          y: 310,
          vx: -0.05,
          vy: 0.04,
          size: 5.4,
        },
        {
          text: 'Pierre D. (Paris): Take train instead of flying for European travel. Est: -1.9t CO₂/yr',
          category: 'transport',
          isEarly: true,
          x: 380,
          y: 60,
          vx: 0.04,
          vy: 0.04,
          size: 5.7,
        },
        {
          text: 'Anna V. (Amsterdam): Install heat pump, remove gas boiler. Est: -2.3t CO₂/yr',
          category: 'energy',
          isEarly: true,
          x: 540,
          y: 240,
          vx: -0.06,
          vy: -0.03,
          size: 5.9,
        },
        // Americas
        {
          text: 'Sarah B. (New York): EV + renewable electricity plan. Est: -3.1t CO₂/yr',
          category: 'transport',
          isEarly: true,
          x: 160,
          y: 180,
          vx: -0.04,
          vy: -0.04,
          size: 6.1,
        },
        {
          text: 'Carlos R. (São Paulo): Plant 100 trees in urban corridors. Est: -1.0t CO₂/yr',
          category: 'diet',
          isEarly: true,
          x: 460,
          y: 150,
          vx: 0.05,
          vy: 0.05,
          size: 5.0,
        },
        {
          text: 'Maya T. (Toronto): Switch to 100% green energy utility. Est: -2.5t CO₂/yr',
          category: 'energy',
          isEarly: true,
          x: 650,
          y: 290,
          vx: -0.03,
          vy: -0.05,
          size: 5.8,
        },
        {
          text: 'Diego F. (Mexico City): Meatless 5 days a week. Est: -1.1t CO₂/yr',
          category: 'diet',
          isEarly: true,
          x: 300,
          y: 130,
          vx: 0.06,
          vy: -0.04,
          size: 5.2,
        },
        {
          text: 'Isabella S. (Rio): Restore native Atlantic Forest corridor. Est: -2.0t CO₂/yr',
          category: 'diet',
          isEarly: true,
          x: 100,
          y: 290,
          vx: -0.05,
          vy: 0.03,
          size: 5.5,
        },
        // Asia-Pacific
        {
          text: 'Yuki T. (Tokyo): Subway-only commute + solar home. Est: -2.2t CO₂/yr',
          category: 'transport',
          isEarly: true,
          x: 580,
          y: 80,
          vx: 0.04,
          vy: -0.06,
          size: 5.7,
        },
        {
          text: 'Liam W. (Sydney): 100% local organic produce diet. Est: -0.9t CO₂/yr',
          category: 'diet',
          isEarly: true,
          x: 710,
          y: 250,
          vx: -0.04,
          vy: 0.05,
          size: 5.0,
        },
        {
          text: 'Chen L. (Shanghai): Install smart thermostat + insulation. Est: -1.6t CO₂/yr',
          category: 'energy',
          isEarly: true,
          x: 250,
          y: 200,
          vx: 0.03,
          vy: -0.03,
          size: 5.4,
        },
        {
          text: 'Fatima A. (Dubai): Solar panels cover 80% of home power. Est: -3.4t CO₂/yr',
          category: 'energy',
          isEarly: true,
          x: 430,
          y: 310,
          vx: -0.05,
          vy: -0.04,
          size: 6.3,
        },
        {
          text: 'Jin-ho K. (Seoul): Repair electronics instead of replacing. Est: -0.8t CO₂/yr',
          category: 'shopping',
          isEarly: true,
          x: 680,
          y: 160,
          vx: 0.05,
          vy: 0.03,
          size: 4.9,
        },
        // Africa & Middle East
        {
          text: 'Amara D. (Nairobi): Community solar microgrid project. Est: -4.1t CO₂/yr',
          category: 'energy',
          isEarly: true,
          x: 350,
          y: 250,
          vx: -0.04,
          vy: 0.04,
          size: 6.5,
        },
        {
          text: 'Kofi B. (Accra): Promote local food systems, cut imports. Est: -0.7t CO₂/yr',
          category: 'diet',
          isEarly: true,
          x: 500,
          y: 50,
          vx: 0.04,
          vy: -0.04,
          size: 4.7,
        },
        {
          text: 'Leila H. (Cairo): Thrift-store only clothing challenge. Est: -0.5t CO₂/yr',
          category: 'shopping',
          isEarly: true,
          x: 160,
          y: 100,
          vx: -0.06,
          vy: 0.05,
          size: 4.6,
        },
        {
          text: 'Zara N. (Lagos): Cycle delivery network over petrol motos. Est: -1.3t CO₂/yr',
          category: 'transport',
          isEarly: true,
          x: 760,
          y: 130,
          vx: 0.03,
          vy: -0.05,
          size: 5.3,
        },
      ];
      if (typeof Utils !== 'undefined') {
        Utils.storage.setItem('eco_pledges_stars', loadedPledges);
      } else {
        localStorage.setItem('eco_pledges_stars', JSON.stringify(loadedPledges));
      }
    }

    this.pledgesList = loadedPledges;

    // Convert text lists into active particle coordinates
    this.stars = this.pledgesList.map(p => ({
      text: p.text,
      category: p.category,
      isEarly: !!p.isEarly,
      x: p.x || Math.random() * this.canvas.width,
      y: p.y || Math.random() * this.canvas.height,
      vx: p.vx || (Math.random() - 0.5) * 0.25,
      vy: p.vy || (Math.random() - 0.5) * 0.25,
      size: p.size || 3 + Math.random() * 4,
    }));

    this.updateHUD();

    // Hook into live Firebase syncing
    if (window.EcoDb && window.EcoDb.firebaseEnabled) {
      window.EcoDb.syncPledges(firebasePledges => {
        const updatedStars = [];
        firebasePledges.forEach(p => {
          const existing = this.stars.find(s => s.text === p.text && s.category === p.category);
          if (existing) {
            updatedStars.push(existing);
          } else {
            updatedStars.push({
              text: p.text,
              category: p.category,
              isEarly: !!p.isEarly,
              x: p.x || Math.random() * this.canvas.width,
              y: p.y || Math.random() * this.canvas.height,
              vx: p.vx || (Math.random() - 0.5) * 0.25,
              vy: p.vy || (Math.random() - 0.5) * 0.25,
              size: p.size || 3 + Math.random() * 4,
            });
          }
        });

        // Retain local unsynced pledges if any
        this.stars.forEach(s => {
          if (!updatedStars.some(us => us.text === s.text && us.category === s.category)) {
            updatedStars.push(s);
          }
        });

        this.stars = updatedStars;
        this.updateHUD();
      });
    }
  },

  savePledges() {
    if (typeof Utils !== 'undefined') {
      Utils.storage.setItem('eco_pledges_stars', this.stars);
    } else {
      localStorage.setItem('eco_pledges_stars', JSON.stringify(this.stars));
    }
    this.updateHUD();
  },

  setupEvents() {
    // Canvas Hover
    this.canvas.addEventListener('mousemove', e => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      this.hoveredStar = null;

      for (const star of this.stars) {
        const dist = Math.hypot(star.x - mx, star.y - my);
        if (dist < star.size + 8) {
          this.hoveredStar = star;
          break;
        }
      }
    });

    // Form submit
    const submitBtn = document.getElementById('btn-submit-pledge');
    const inputEl = document.getElementById('pledge-input');

    if (submitBtn && inputEl) {
      submitBtn.addEventListener('click', () => {
        const text = inputEl.value.trim();
        if (!text) return;

        const activeCategoryBtn = document.querySelector('.pledge-cat-btn.active');
        const category = activeCategoryBtn ? activeCategoryBtn.dataset.cat : 'diet';

        this.addPledge(text, category);
        inputEl.value = '';
      });
    }

    // Category pills toggling
    const catButtons = document.querySelectorAll('.pledge-cat-btn');
    catButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        catButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  },

  addPledge(text, category) {
    const star = {
      text: text,
      category: category,
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      size: 4 + Math.random() * 4,
    };

    this.stars.push(star);
    this.savePledges();

    // Sync to Firebase if enabled
    if (window.EcoDb && window.EcoDb.firebaseEnabled) {
      window.EcoDb.uploadPledge({
        text: star.text,
        category: star.category,
        isEarly: false,
      });
    }

    // Sparkle effect
    if (window.App && App.showToast) {
      App.showToast('🌟 Pledge planted as a star in the constellation!');
      if (App.fireConfetti) App.fireConfetti();
    }
  },

  updateHUD() {
    const counterEl = document.getElementById('pledges-counter-val');
    const co2El = document.getElementById('pledges-co2-val');

    if (counterEl) counterEl.textContent = this.stars.length.toLocaleString();
    if (co2El) {
      const co2Committed = this.stars.length * 0.8; // average offset per pledge is 0.8 tons
      co2El.textContent = co2Committed.toFixed(1) + 't';
    }
  },

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update and Draw Constellation Lines (connecting close stars)
    this.ctx.lineWidth = 0.5;
    for (let i = 0; i < this.stars.length; i++) {
      for (let j = i + 1; j < this.stars.length; j++) {
        const s1 = this.stars[i];
        const s2 = this.stars[j];
        const dist = Math.hypot(s1.x - s2.x, s1.y - s2.y);

        if (dist < 100) {
          const alpha = (1 - dist / 100) * 0.15;
          this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
          this.ctx.beginPath();
          this.ctx.moveTo(s1.x, s1.y);
          this.ctx.lineTo(s2.x, s2.y);
          this.ctx.stroke();
        }
      }
    }

    // Update and Draw Stars
    this.stars.forEach(star => {
      // Movement
      star.x += star.vx;
      star.y += star.vy;

      // Wrap screen boundaries
      if (star.x < 0) star.x = this.canvas.width;
      if (star.x > this.canvas.width) star.x = 0;
      if (star.y < 0) star.y = this.canvas.height;
      if (star.y > this.canvas.height) star.y = 0;

      // Glow glow ring
      const color = this.categoryColors[star.category] || '#fff';

      const grad = this.ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 3);
      grad.addColorStop(0, color);
      grad.addColorStop(0.3, color + '66');
      grad.addColorStop(1, 'transparent');

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
      this.ctx.fill();

      // Sharp Core Star
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size / 2, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // Draw active hover tooltip inside canvas
    if (this.hoveredStar) {
      const star = this.hoveredStar;

      this.ctx.fillStyle = 'rgba(10, 20, 15, 0.9)';
      this.ctx.strokeStyle = this.categoryColors[star.category];
      this.ctx.lineWidth = 1.5;

      const tooltipW = 220;
      const tooltipH = 75;
      let tx = star.x + 10;
      let ty = star.y - tooltipH - 10;

      // Keep tooltip inside canvas boundaries
      if (tx + tooltipW > this.canvas.width) tx = star.x - tooltipW - 10;
      if (ty < 0) ty = star.y + 10;

      this.ctx.beginPath();
      this.ctx.roundRect(tx, ty, tooltipW, tooltipH, 8);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.fillStyle = star.isEarly ? '#fbbf24' : '#ffffff';
      this.ctx.font = 'bold 10px Inter';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(
        star.isEarly ? 'EARLY PLEDGER' : star.category.toUpperCase() + ' PLEDGE',
        tx + 12,
        ty + 20
      );

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      this.ctx.font = '11px Inter';

      // Simple multi-line text wrapper
      const words = star.text.split(' ');
      let line = '';
      let lineCount = 0;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = this.ctx.measureText(testLine);
        if (metrics.width > tooltipW - 24 && n > 0) {
          this.ctx.fillText(line, tx + 12, ty + 38 + lineCount * 14);
          line = words[n] + ' ';
          lineCount++;
        } else {
          line = testLine;
        }
      }
      this.ctx.fillText(line, tx + 12, ty + 38 + lineCount * 14);
    }

    this.animationFrameId = requestAnimationFrame(() => this.animate());
  },
};

window.EcoPledges = EcoPledges;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EcoPledges;
  global.EcoPledges = EcoPledges;
}
