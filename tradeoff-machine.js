/**
 * EcoTwin - Trade-Off Machine Feature
 */

App.initTradeoffMachine = function () {
  const beam = document.getElementById('scale-beam');
  const statusCard = document.getElementById('scale-status-card');
  const resetBtn = document.getElementById('btn-reset-scale');
  const leftWeightEl = document.getElementById('left-pan-weight-display');
  const rightWeightEl = document.getElementById('right-pan-weight-display');
  const leftPanItems = document.getElementById('left-pan-items');
  const rightPanItems = document.getElementById('right-pan-items');

  if (!beam || !statusCard) return;

  let selectedLuxuries = [];
  let selectedOffsets = [];
  let rewarded = false;

  const updateScaleUI = () => {
    leftPanItems.innerHTML = '';
    rightPanItems.innerHTML = '';

    let luxuryWeight = 0;
    let offsetWeight = 0;

    selectedLuxuries.forEach(item => {
      luxuryWeight += item.weight;
      const itemEl = document.createElement('div');
      itemEl.className = 'tradeoff-scale-item luxury-item';

      // Sanitized content injection
      const content = `<span>${item.icon}</span> <span>${item.name} (${item.weight}kg)</span>`;
      itemEl.innerHTML = typeof Utils !== 'undefined' ? Utils.sanitizeHTML(content) : content;

      // Accessibility
      itemEl.setAttribute('role', 'button');
      itemEl.setAttribute('tabindex', '0');
      itemEl.setAttribute('aria-label', `Remove ${item.name} from scale`);
      itemEl.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          itemEl.click();
        }
      });

      itemEl.addEventListener('click', () => {
        selectedLuxuries = selectedLuxuries.filter(x => x.name !== item.name);
        const shelfItem = document.querySelector(`.tradeoff-item[data-name="${item.name}"]`);
        if (shelfItem) shelfItem.classList.remove('selected');
        updateScaleUI();
      });
      leftPanItems.appendChild(itemEl);
    });

    selectedOffsets.forEach(item => {
      offsetWeight += item.weight;
      const itemEl = document.createElement('div');
      itemEl.className = 'tradeoff-scale-item offset-item';

      // Sanitized content injection
      const content = `<span>${item.icon}</span> <span>${item.name.split(' #')[0]} (${item.weight}kg)</span>`;
      itemEl.innerHTML = typeof Utils !== 'undefined' ? Utils.sanitizeHTML(content) : content;

      // Accessibility
      itemEl.setAttribute('role', 'button');
      itemEl.setAttribute('tabindex', '0');
      itemEl.setAttribute('aria-label', `Remove ${item.name.split(' #')[0]} from scale`);
      itemEl.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          itemEl.click();
        }
      });

      itemEl.addEventListener('click', () => {
        selectedOffsets = selectedOffsets.filter(x => x.name !== item.name);
        updateScaleUI();
      });
      rightPanItems.appendChild(itemEl);
    });

    leftWeightEl.textContent = `${luxuryWeight} kg`;
    rightWeightEl.textContent = `${offsetWeight} kg`;

    let tilt = 0;
    if (luxuryWeight > 0 || offsetWeight > 0) {
      const delta = luxuryWeight - offsetWeight;
      tilt = Math.max(-15, Math.min(15, delta / 10));
    }

    beam.style.setProperty('--scale-tilt', `${tilt}deg`);
    const hangers = document.querySelectorAll('.scale-hanger-left, .scale-hanger-right');
    hangers.forEach(h => h.style.setProperty('--scale-tilt', `${tilt}deg`));

    if (luxuryWeight === 0 && offsetWeight === 0) {
      const msg = '⚖️ The scale is currently empty. Click items to weigh them.';
      statusCard.innerHTML = typeof Utils !== 'undefined' ? Utils.sanitizeHTML(msg) : msg;
      statusCard.style.borderColor = 'rgba(255,255,255,0.06)';
      statusCard.style.color = 'var(--text-secondary)';
    } else if (luxuryWeight === offsetWeight) {
      const msg = '✨ Balanced! You have successfully offset your carbon luxury! 🎉';
      statusCard.innerHTML = typeof Utils !== 'undefined' ? Utils.sanitizeHTML(msg) : msg;
      statusCard.style.borderColor = 'var(--color-green-light)';
      statusCard.style.color = 'var(--color-green-light)';
      if (!rewarded) {
        this.addXp(15, 'Balanced Trade-Off Scale');
        rewarded = true;
        this.showToast('Planetary Balance achieved! +15 XP 🌟');
      }
    } else {
      const diff = Math.abs(luxuryWeight - offsetWeight);
      if (luxuryWeight > offsetWeight) {
        const msg = `⚠️ Heavy left! Add ${diff} kg of offsets to balance the luxury.`;
        statusCard.innerHTML = typeof Utils !== 'undefined' ? Utils.sanitizeHTML(msg) : msg;
        statusCard.style.borderColor = 'rgba(244, 63, 94, 0.4)';
        statusCard.style.color = '#fda4af';
      } else {
        const msg = `👍 Net-negative! You have offset the luxuries with ${diff} kg extra savings.`;
        statusCard.innerHTML = typeof Utils !== 'undefined' ? Utils.sanitizeHTML(msg) : msg;
        statusCard.style.borderColor = 'rgba(52, 211, 153, 0.4)';
        statusCard.style.color = '#a7f3d0';
      }
    }
  };

  const shelfItems = document.querySelectorAll('.tradeoff-item');
  shelfItems.forEach(item => {
    // Accessibility
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    const name = item.dataset.name;
    const typeLabel = item.dataset.type === 'luxury' ? 'luxury' : 'impact';
    item.setAttribute('aria-label', `Weigh ${name} (${typeLabel})`);

    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.click();
      }
    });

    item.addEventListener('click', () => {
      const name = item.dataset.name;
      const weight = parseInt(item.dataset.weight);
      const icon = item.dataset.icon;
      const type = item.dataset.type;

      if (type === 'luxury') {
        if (!selectedLuxuries.some(x => x.name === name)) {
          selectedLuxuries.push({ name, weight, icon });
          item.classList.add('selected');
        }
      } else {
        selectedOffsets.push({ name: `${name} #${selectedOffsets.length + 1}`, weight, icon });
      }
      updateScaleUI();
    });
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      selectedLuxuries = [];
      selectedOffsets = [];
      rewarded = false;
      shelfItems.forEach(item => item.classList.remove('selected'));
      updateScaleUI();
    });
  }
};
