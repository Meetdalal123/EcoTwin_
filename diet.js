/**
 * EcoTwin - Diet Calculator Feature (Integrated)
 */

const DietCalculator = {
  dietStep: 1,
  root: null,
  dietSelections: {
    breakfast: null,
    breakfastLabel: '',
    breakfastDesc: '',
    lunch: null,
    lunchLabel: '',
    lunchDesc: '',
    dinner: null,
    dinnerLabel: '',
    dinnerDesc: '',
    redMeat: null,
    redMeatLabel: '',
    redMeatDesc: '',
    dairy: null,
    dairyLabel: '',
    dairyDesc: '',
  },

  el(selector) {
    return this.root ? this.root.querySelector(selector) : document.querySelector(selector);
  },

  els(selector) {
    return this.root ? this.root.querySelectorAll(selector) : document.querySelectorAll(selector);
  },

  init(rootNode = null) {
    this.root = rootNode;

    // Load saved state
    const saved =
      typeof Utils !== 'undefined'
        ? Utils.storage.getItem('eco_diet_calculator')
        : JSON.parse(localStorage.getItem('eco_diet_calculator'));
    if (saved) {
      try {
        this.dietSelections = typeof saved === 'string' ? JSON.parse(saved) : saved;
      } catch (e) {
        console.warn('[DietCalculator] Failed to parse saved diet selections:', e);
      }
    }

    // Add accessibility attributes dynamically
    this.els('.quiz-option-card').forEach(card => {
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      const label =
        card.dataset.label ||
        (card.querySelector('h4') ? card.querySelector('h4').textContent : '');
      card.setAttribute('aria-label', `Select: ${label}`);
    });

    this.els('.diet-dot').forEach(dot => {
      dot.setAttribute('tabindex', '0');
      dot.setAttribute('role', 'button');
      const step = dot.dataset.step || '';
      dot.setAttribute('aria-label', `Go to step ${step}`);
    });

    this.restoreSelections();
    this.bindEvents();
    this.determineStep();
  },

  restoreSelections() {
    const categories = ['breakfast', 'lunch', 'dinner', 'redMeat', 'dairy'];
    categories.forEach(cat => {
      const val = this.dietSelections[cat];
      if (val !== null && val !== undefined) {
        this.els(`[data-category="${cat}"]`).forEach(card => {
          if (parseFloat(card.dataset.val) === val) {
            card.classList.add('active');
          } else {
            card.classList.remove('active');
          }
        });
      }
    });
  },

  bindEvents() {
    // Keydown handlers for options
    this.els('.quiz-option-card').forEach(card => {
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });
    });

    // Keydown handlers for navigation dots
    this.els('.diet-dot').forEach(dot => {
      dot.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          dot.click();
        }
      });
    });

    // Cards and pills selection clicks
    this.els('.quiz-option-card').forEach(card => {
      card.addEventListener('click', () => {
        const cat = card.dataset.category;
        const val = parseFloat(card.dataset.val);
        const label = card.dataset.label || '';
        const desc = card.dataset.desc || '';

        // Update DOM active classes
        this.els(`[data-category="${cat}"]`).forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        // Save state
        this.dietSelections[cat] = val;
        this.dietSelections[cat + 'Label'] = label;
        this.dietSelections[cat + 'Desc'] = desc;

        if (typeof Utils !== 'undefined') {
          Utils.storage.setItem('eco_diet_calculator', this.dietSelections);
        } else {
          localStorage.setItem('eco_diet_calculator', JSON.stringify(this.dietSelections));
        }

        // Move to next step after a tiny delay
        setTimeout(() => {
          if (this.dietStep < 5) {
            this.showStep(this.dietStep + 1);
          } else {
            this.showStep(6);
          }
        }, 400);
      });
    });

    // Retake quiz button
    const retakeBtn = this.el('#btn-retake-diet');
    if (retakeBtn) {
      retakeBtn.addEventListener('click', () => {
        this.dietSelections = {
          breakfast: null,
          breakfastLabel: '',
          breakfastDesc: '',
          lunch: null,
          lunchLabel: '',
          lunchDesc: '',
          dinner: null,
          dinnerLabel: '',
          dinnerDesc: '',
          redMeat: null,
          redMeatLabel: '',
          redMeatDesc: '',
          dairy: null,
          dairyLabel: '',
          dairyDesc: '',
        };
        if (typeof Utils !== 'undefined') {
          Utils.storage.removeItem('eco_diet_calculator');
        } else {
          localStorage.removeItem('eco_diet_calculator');
        }
        this.els('.quiz-option-card').forEach(c => c.classList.remove('active'));
        this.showStep(1);
      });
    }

    // See full dashboard button
    const dashBtn = this.el('#btn-goto-dashboard');
    if (dashBtn) {
      dashBtn.addEventListener('click', () => {
        if (window.App && App.closeFeatureModal) {
          App.closeFeatureModal();
          App.scrollToSection('scene-dashboard');
        }
      });
    }

    // Top dot triggers
    this.els('.diet-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        const step = parseInt(dot.dataset.step);
        if (step <= 5) {
          this.showStep(step);
        }
      });
    });
  },

  determineStep() {
    const isCompleted =
      this.dietSelections.breakfast !== null &&
      this.dietSelections.lunch !== null &&
      this.dietSelections.dinner !== null &&
      this.dietSelections.redMeat !== null &&
      this.dietSelections.dairy !== null;

    if (isCompleted) {
      this.showStep(6);
    } else {
      let firstIncomplete = 1;
      if (this.dietSelections.breakfast !== null) firstIncomplete = 2;
      if (this.dietSelections.breakfast !== null && this.dietSelections.lunch !== null)
        firstIncomplete = 3;
      if (
        this.dietSelections.breakfast !== null &&
        this.dietSelections.lunch !== null &&
        this.dietSelections.dinner !== null
      )
        firstIncomplete = 4;
      if (
        this.dietSelections.breakfast !== null &&
        this.dietSelections.lunch !== null &&
        this.dietSelections.dinner !== null &&
        this.dietSelections.redMeat !== null
      )
        firstIncomplete = 5;
      this.showStep(firstIncomplete);
    }
  },

  showStep(stepNum) {
    this.dietStep = stepNum;

    // Progress bar
    const fill = this.el('#diet-progress-fill');
    if (fill) {
      fill.style.width = stepNum === 6 ? '100%' : `${stepNum * 20}%`;
    }

    // Dot highlight
    this.els('.diet-dot').forEach((dot, idx) => {
      if (idx + 1 === stepNum) dot.classList.add('active');
      else dot.classList.remove('active');
    });

    // Hide dots header on results
    const header = this.el('.diet-header');
    if (header) {
      if (stepNum === 6) {
        header.style.opacity = '0';
        header.style.pointerEvents = 'none';
      } else {
        header.style.opacity = '1';
        header.style.pointerEvents = 'auto';
      }
    }

    // Slide transform
    const track = this.el('#diet-questions-track');
    if (track) {
      track.style.transform = `translateX(-${(stepNum - 1) * 16.66666}%)`;
    }

    // Fade pane opacities
    this.els('.diet-calculator-wrapper .quiz-card').forEach(pane => {
      const s = parseInt(pane.dataset.step);
      if (s === stepNum) {
        pane.classList.add('active-step-pane');
        pane.style.opacity = '1';
        pane.style.pointerEvents = 'auto';
      } else {
        pane.classList.remove('active-step-pane');
        pane.style.opacity = '0';
        pane.style.pointerEvents = 'none';
      }
    });

    if (stepNum === 6) {
      this.calculateResults();
    }
  },

  calculateResults() {
    const breakfast = this.dietSelections.breakfast || 0;
    const lunch = this.dietSelections.lunch || 0;
    const dinner = this.dietSelections.dinner || 0;
    const redMeat = this.dietSelections.redMeat || 0;
    const dairy = this.dietSelections.dairy || 0;

    const dailyTotal = breakfast + lunch + dinner + redMeat + dairy;
    const monthly = dailyTotal * 30;
    const annual = dailyTotal * 365;

    // Save outputs back to App session to sync dashboard
    if (window.App) {
      if (!App.user.dashboardInputs) App.user.dashboardInputs = {};
      App.user.dashboardInputs.diet = monthly; // Set monthly value
      App.saveSession();
      App.calculateDashboardEmissions();
      App.updateHomeDietSection();
    }

    // Count up score animation
    const scoreEl = this.el('#diet-result-monthly-score');
    if (scoreEl) {
      const start = 0;
      const target = Math.round(monthly);
      const duration = 1200;
      const startTime = performance.now();

      const update = timestamp => {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.round(start + (target - start) * progress * (2 - progress));
        scoreEl.textContent = current;
        if (progress < 1) requestAnimationFrame(update);
      };
      requestAnimationFrame(update);
    }

    // Context line
    const ctxEl = this.el('#diet-result-context-text');
    if (ctxEl) {
      ctxEl.className = 'diet-result-context';
      if (monthly < 40) {
        ctxEl.textContent = '🌿 Your plate is healing the planet.';
        ctxEl.classList.add('green-score');
      } else if (monthly <= 80) {
        ctxEl.textContent = '🟡 Room to improve — small swaps go far.';
        ctxEl.classList.add('amber-score');
      } else if (monthly <= 130) {
        ctxEl.textContent = '🟠 Your diet is above the sustainable range.';
        ctxEl.classList.add('amber-score');
      } else {
        ctxEl.textContent = '🔴 Your food choices have a significant impact.';
        ctxEl.classList.add('red-score');
      }
    }

    // Update bars
    const updateBar = (id, valDaily) => {
      const bar = this.el(`#diet-bar-${id}`);
      const label = this.el(`#diet-val-${id}`);
      const monthlyCatVal = valDaily * 30;

      if (label) label.textContent = `${monthlyCatVal.toFixed(1)} kg/mo`;
      if (bar) {
        bar.className = 'diet-breakdown-bar';
        if (valDaily < 0.8) bar.classList.add('low-impact');
        else if (valDaily < 2.0) bar.classList.add('med-impact');
        else bar.classList.add('high-impact');

        bar.style.width = '0%';
        setTimeout(() => {
          const maxScale = 100;
          const pct = Math.min(100, (monthlyCatVal / maxScale) * 100);
          bar.style.width = `${pct}%`;
        }, 100);
      }
    };

    updateBar('breakfast', breakfast);
    updateBar('lunch', lunch);
    updateBar('dinner', dinner);
    updateBar('redmeat', redMeat);
    updateBar('dairy', dairy);

    // Equivalents
    const driving = monthly * 8.3;
    const trees = Math.ceil(annual / 20);
    const flights = (monthly / 140) * 100;

    const drEl = this.el('#diet-eq-driving');
    if (drEl) drEl.textContent = `${Math.round(driving).toLocaleString()} km`;
    const trEl = this.el('#diet-eq-trees');
    if (trEl) trEl.textContent = `${trees}`;
    const flEl = this.el('#diet-eq-flights');
    if (flEl) flEl.textContent = `${Math.round(flights)}%`;

    // Best Swap recommendation
    const cats = [
      {
        key: 'breakfast',
        name: 'Breakfast',
        score: breakfast,
        label: this.dietSelections.breakfastLabel,
      },
      { key: 'lunch', name: 'Lunch', score: lunch, label: this.dietSelections.lunchLabel },
      { key: 'dinner', name: 'Dinner', score: dinner, label: this.dietSelections.dinnerLabel },
      { key: 'redMeat', name: 'Red Meat', score: redMeat, label: this.dietSelections.redMeatLabel },
      { key: 'dairy', name: 'Dairy', score: dairy, label: this.dietSelections.dairyLabel },
    ];

    cats.sort((a, b) => b.score - a.score);
    const highest = cats[0];

    let better;
    let savedDaily;

    if (highest.key === 'breakfast') {
      better = 'Poha / Upma / Idli / Dosa';
      savedDaily = Math.max(0.2, highest.score - 0.5);
    } else if (highest.key === 'lunch') {
      better = 'Dal, sabzi, roti or rice';
      savedDaily = Math.max(0.5, highest.score - 0.6);
    } else if (highest.key === 'dinner') {
      better = 'Home-cooked vegetarian meal';
      savedDaily = Math.max(0.4, highest.score - 0.8);
    } else if (highest.key === 'redMeat') {
      better = 'Never / Occasional red meat';
      savedDaily = Math.max(0.5, highest.score);
    } else {
      better = 'Plant milk or black tea';
      savedDaily = Math.max(0.3, highest.score - 0.1);
    }

    const savedMonthly = savedDaily * 30;
    const savedTrees = Math.ceil((savedDaily * 365) / 20);

    const swTxEl = this.el('#diet-swap-text');
    if (swTxEl)
      swTxEl.textContent = `Replace high-impact ${highest.name.toLowerCase()} choices with ${better}.`;
    const swSvEl = this.el('#diet-swap-saved');
    if (swSvEl) swSvEl.textContent = `saves ${savedMonthly.toFixed(1)} kg CO₂/month`;
    const swTrEl = this.el('#diet-swap-trees-saved');
    if (swTrEl) swTrEl.textContent = `equivalent to planting ${savedTrees} trees/year`;
  },
};

window.DietCalculator = DietCalculator;
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DietCalculator;
  global.DietCalculator = DietCalculator;
}
