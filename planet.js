/* e:\PromptWar\Challenge-3\js\planet.js */

const EcoPlanet = {
  updatePlanet() {
    const results = EcoCalculator.calculateEmissions();
    const footprint = results.total;

    // Health is inversely proportional to footprint.
    // Standard footprint threshold of 15T is treated as 0% health, <= 2.5T is 100% health.
    let health = 100;
    if (footprint > 2.5) {
      health = Math.max(5, 100 - (footprint - 2.5) * 8);
    }

    health = Math.round(health);

    // Update text
    const pctSpan = document.getElementById('planet-health-pct');
    const statusText = document.getElementById('planet-status-text');
    if (pctSpan) pctSpan.textContent = health + '%';

    // Choose status label
    let status = 'Toxic Atmosphere';
    let statusColor = 'var(--color-red)';
    if (health > 40) {
      status = 'Unbalanced Biosphere';
      statusColor = 'var(--color-amber)';
    }
    if (health > 60) {
      status = 'Recovering Ecosystem';
      statusColor = 'var(--color-green-light)';
    }
    if (health > 85) {
      status = 'Pristine Virtual Eden';
      statusColor = 'var(--color-teal)';
    }

    if (statusText) {
      statusText.innerHTML = DOMPurify.sanitize(
        `Ecosystem Level: <span style="color: ${statusColor}; font-weight: 700;">${status}</span>`
      );
    }

    if (health >= 80 && window.App) {
      App.unlockBadge('planet', 'Eden Restorer', 'Restored planet health above 80%.');
    }

    // Update offset quantities badges in real-time
    let forestOffsetCount = 0;
    let oceanOffsetCount = 0;
    let windOffsetCount = 0;
    if (window.App && App.user && App.user.offsets) {
      forestOffsetCount = App.user.offsets.forest || 0;
      oceanOffsetCount = App.user.offsets.ocean || 0;
      windOffsetCount = App.user.offsets.wind || 0;
    }

    const qForest = document.getElementById('offset-qty-forest');
    const qOcean = document.getElementById('offset-qty-ocean');
    const qWind = document.getElementById('offset-qty-wind');
    if (qForest) qForest.textContent = `(${forestOffsetCount})`;
    if (qOcean) qOcean.textContent = `(${oceanOffsetCount})`;
    if (qWind) qWind.textContent = `(${windOffsetCount})`;

    // Render the SVG Planet dynamically
    this.renderPlanetSVG(health);
  },

  renderPlanetSVG(health) {
    const wrapper = document.getElementById('planet-svg-container');
    const calcWrapper = document.getElementById('calculator-planet-svg-container');
    if (!wrapper && !calcWrapper) return;

    // Define colors based on health
    let sphereColor1 = '#78350f'; // Dry dirt brown
    let sphereColor2 = '#b45309';
    let waterColor = '#475569'; // Turbid grey-water
    let landColor = '#854d0e'; // Scorched land

    if (health > 40) {
      sphereColor1 = '#064e3b'; // Olive green
      sphereColor2 = '#15803d';
      waterColor = '#0891b2'; // Muddy teal
      landColor = '#16a34a';
    }

    if (health > 70) {
      sphereColor1 = '#064e3b'; // Rich emerald
      sphereColor2 = '#059669';
      waterColor = '#06b6d4'; // Sparkling cyan
      landColor = '#10b981';
    }

    let forestOffsetCount = 0;
    let oceanOffsetCount = 0;
    let windOffsetCount = 0;
    if (window.App && App.user && App.user.offsets) {
      forestOffsetCount = App.user.offsets.forest || 0;
      oceanOffsetCount = App.user.offsets.ocean || 0;
      windOffsetCount = App.user.offsets.wind || 0;
    }

    if (oceanOffsetCount > 0) {
      waterColor = '#0284c7'; // Clear blue
    }
    if (oceanOffsetCount > 2) {
      waterColor = '#0ea5e9'; // Pristine sky blue
    }

    // Determine how many trees to draw
    let treeCount = 1;
    if (health > 30) treeCount = 3;
    if (health > 55) treeCount = 6;
    if (health > 80) treeCount = 9;

    treeCount += forestOffsetCount * 2;
    treeCount = Math.min(18, treeCount);

    // Draw tree SVG fragments
    let treesSVG = '';
    const treePositions = [
      { x: 75, y: 70, scale: 0.8 },
      { x: 175, y: 75, scale: 0.95 },
      { x: 120, y: 55, scale: 1.1 },
      { x: 60, y: 120, scale: 0.75 },
      { x: 190, y: 130, scale: 0.9 },
      { x: 100, y: 180, scale: 1.0 },
      { x: 150, y: 190, scale: 0.85 },
      { x: 80, y: 140, scale: 1.05 },
      { x: 160, y: 100, scale: 0.8 },
      // Extra positions for purchased offsets (marked as golden trees)
      { x: 95, y: 95, scale: 0.9, type: 'golden' },
      { x: 145, y: 125, scale: 1.05, type: 'golden' },
      { x: 110, y: 110, scale: 0.85, type: 'golden' },
      { x: 130, y: 155, scale: 1.1, type: 'golden' },
      { x: 70, y: 165, scale: 0.8, type: 'golden' },
      { x: 170, y: 160, scale: 0.95, type: 'golden' },
      { x: 135, y: 80, scale: 1.0, type: 'golden' },
      { x: 85, y: 115, scale: 0.85, type: 'golden' },
      { x: 155, y: 145, scale: 0.9, type: 'golden' },
    ];

    for (let i = 0; i < treeCount; i++) {
      const pos = treePositions[i];
      const leafColor1 = pos.type === 'golden' ? '#d97706' : '#047857';
      const leafColor2 = pos.type === 'golden' ? '#fbbf24' : '#10b981';
      treesSVG += `
        <g transform="translate(${pos.x}, ${pos.y}) scale(${pos.scale})" class="planet-tree">
          <rect x="-3" y="10" width="6" height="12" fill="#78350f" rx="1" />
          <polygon points="0,-12 -12,4 12,4" fill="${leafColor1}" />
          <polygon points="0,-22 -9,-6 9,-6" fill="${leafColor2}" />
        </g>
      `;
    }

    // Dynamic clouds or birds based on ecosystem health
    let atmosphereSVG = '';
    if (health > 60 || windOffsetCount > 0) {
      // Draw flying bird paths
      atmosphereSVG += `
        <path d="M 40,65 Q 45,60 50,65 Q 55,60 60,65" fill="none" stroke="#f0fdf4" stroke-width="1.5" class="animate-float" />
        <path d="M 200,90 Q 205,85 210,90 Q 215,85 220,90" fill="none" stroke="#f0fdf4" stroke-width="1.5" class="animate-float" style="animation-delay: 1s;" />
      `;
    }

    if (health < 40 && windOffsetCount === 0) {
      // Draw smog rings
      atmosphereSVG += `
        <ellipse cx="125" cy="125" rx="110" ry="25" fill="none" stroke="rgba(239, 68, 68, 0.2)" stroke-width="6" stroke-dasharray="10, 5" />
        <ellipse cx="125" cy="125" rx="120" ry="35" fill="none" stroke="rgba(100, 116, 139, 0.3)" stroke-width="3" />
      `;
    } else {
      // Draw clean atmosphere rings
      atmosphereSVG += `
        <ellipse cx="125" cy="125" rx="115" ry="30" fill="none" stroke="rgba(6, 182, 212, 0.15)" stroke-width="2" class="animate-spin-slow" />
      `;
    }

    // Construct final SVG
    const svgHtml = `
      <svg viewBox="0 0 250 250" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="planetGrad" cx="50%" cy="30%" r="50%">
            <stop offset="0%" stop-color="${sphereColor2}" />
            <stop offset="100%" stop-color="${sphereColor1}" />
          </radialGradient>
          <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${waterColor}" stop-opacity="0.8" />
            <stop offset="100%" stop-color="${sphereColor1}" stop-opacity="0.9" />
          </linearGradient>
        </defs>

        <!-- Glow Ring -->
        <circle cx="125" cy="125" r="100" fill="none" stroke="${health > 50 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.1)'}" stroke-width="8" />

        <!-- Main Sphere Body -->
        <circle cx="125" cy="125" r="95" fill="url(#planetGrad)" />

        <!-- Land Layout shapes -->
        <path d="M 50,90 Q 75,70 110,85 T 180,70 Q 210,100 190,140 T 110,165 Q 60,160 50,90 Z" fill="${landColor}" opacity="0.9" />
        <path d="M 70,160 Q 95,145 130,170 T 170,180 Q 150,210 110,210 Q 75,200 70,160 Z" fill="${landColor}" opacity="0.8" />

        <!-- Water waves overlapping -->
        <path d="M 40,125 C 80,110 100,140 145,125 C 190,110 200,125 210,125 C 205,160 170,205 125,220 C 75,215 45,170 40,125 Z" fill="url(#waterGrad)" />

        <!-- Atmospheric overlays -->
        ${atmosphereSVG}

        <!-- Spawning Trees -->
        <g id="planet-trees-group">
          ${treesSVG}
        </g>
      </svg>
    `;

    if (wrapper) wrapper.innerHTML = DOMPurify.sanitize(svgHtml);
    if (calcWrapper) calcWrapper.innerHTML = DOMPurify.sanitize(svgHtml);
  },

  purchaseSimulatedOffset(type, cost, offsetValue) {
    if (!window.App) return;

    // Sanitize wallet balance before transaction to prevent NaN or undefined bugs
    let walletVal = Number(App.user.wallet);
    if (isNaN(walletVal)) {
      walletVal = 250;
      App.user.wallet = walletVal;
      App.saveSession();
    }

    if (walletVal < cost) {
      App.showToast('Insufficient simulated funds in your wallet!');
      return;
    }

    const prevWallet = walletVal;
    App.user.wallet = walletVal - cost;
    if (!App.user.offsets) {
      App.user.offsets = { forest: 0, ocean: 0, wind: 0, scannedSwaps: 0 };
    }
    App.user.offsets[type] = (App.user.offsets[type] || 0) + 1;

    App.addXp(25, `Simulated Offset: ${type.toUpperCase()} Fund`);
    App.saveSession();

    // Re-draw and sync calculation updates
    EcoCalculator.recalculateRealTime();
    this.updatePlanet();

    // Refresh user wallet elements with smooth counting animation
    if (App.animateWallet) {
      App.animateWallet(prevWallet, App.user.wallet);
    } else {
      App.updateUserProfileUI();
    }

    // Trigger leaf particles on the clicked button
    const clickedBtn = window.event ? window.event.target : null;
    if (clickedBtn && App.emitParticles) {
      App.emitParticles(clickedBtn, 'leaf');
    }

    // Trigger visual pulse on planet wrappers
    const wrappers = [
      document.getElementById('planet-svg-container'),
      document.getElementById('calculator-planet-svg-container'),
    ];
    wrappers.forEach(w => {
      if (w) {
        w.style.transition =
          'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275), filter 0.15s ease';
        w.style.transform = 'scale(1.12)';
        w.style.filter = 'drop-shadow(0 0 35px rgba(16, 185, 129, 0.6)) saturate(1.4)';

        setTimeout(() => {
          w.style.transform = 'scale(1)';
          w.style.filter = 'drop-shadow(0 0 25px rgba(16, 185, 129, 0.15))';
        }, 250);
      }
    });

    App.showToast(`Offset simulated successfully! -${offsetValue} Tons CO₂`);
  },
};

window.EcoPlanet = EcoPlanet;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EcoPlanet;
  global.EcoPlanet = EcoPlanet;
  global.App = App;
}
