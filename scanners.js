/* e:\PromptWar\Challenge-3\js\scanners.js */

const EcoScanners = {
  activeReceiptPreset: 'receipt1',
  activeCameraPreset: 'kitchen',

  init() {
    this.bindEvents();
  },

  bindEvents() {
    // Presets buttons for receipt
    const rBtns = document.querySelectorAll('.receipt-preset-btn');
    rBtns.forEach(btn => {
      btn.addEventListener('click', e => {
        const key = e.target.closest('.receipt-preset-btn').dataset.preset;
        this.activeReceiptPreset = key;
        this.runReceiptScan();
      });
    });

    // Presets buttons for camera
    const cBtns = document.querySelectorAll('.camera-preset-btn');
    cBtns.forEach(btn => {
      btn.addEventListener('click', e => {
        const key = e.target.closest('.camera-preset-btn').dataset.preset;
        this.activeCameraPreset = key;
        this.runCameraScan();
      });
    });

    // Drag and drop events for dropzones
    const dropzones = document.querySelectorAll('.scanner-dropzone');
    dropzones.forEach(zone => {
      // Prevent browser defaults
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        zone.addEventListener(eventName, e => e.preventDefault());
      });

      zone.addEventListener('dragover', () => {
        zone.style.borderColor = 'var(--color-green-glow)';
        zone.style.background = 'rgba(16, 185, 129, 0.05)';
      });

      ['dragleave', 'drop'].forEach(eventName => {
        zone.addEventListener(eventName, () => {
          zone.style.borderColor = 'rgba(255, 255, 255, 0.15)';
          zone.style.background = 'rgba(255, 255, 255, 0.01)';
        });
      });

      zone.addEventListener('drop', e => {
        const fileInput = zone.querySelector('input[type="file"]');
        if (fileInput) {
          const inputId = fileInput.id;
          if (inputId.includes('receipt')) {
            this.runReceiptScan();
          } else {
            this.runCameraScan();
          }
        }
      });
    });
  },

  // Mock Receipt Scanner with OCR spinner
  runReceiptScan() {
    const preset = ECO_DATA.receiptPresets[this.activeReceiptPreset];
    if (!preset) return;

    const resultsContainer = document.getElementById('receipt-results');
    const canvasBox = document.getElementById('receipt-canvas-box');
    const canvas = document.getElementById('receipt-canvas');
    if (!canvasBox || !canvas || !resultsContainer) return;

    // Show mock OCR spinner
    canvasBox.style.display = 'none';
    resultsContainer.innerHTML = DOMPurify.sanitize(`
      <div class="scanner-loading-box" style="display: flex; flex-direction: column; align-items: center; gap: 0.85rem; padding: 3rem 1rem; color: var(--color-green-light); text-align: center;">
        <div style="width: 40px; height: 40px; border: 3px solid rgba(16, 185, 129, 0.1); border-top-color: var(--color-green-light); border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <p style="font-size: 0.95rem; font-weight: 600; margin-top:0.5rem;" id="receipt-scan-status">Initializing AI Receipt Auditor...</p>
      </div>
    `);

    // Timeline updates
    setTimeout(() => {
      const statusText = document.getElementById('receipt-scan-status');
      if (statusText) statusText.textContent = 'Scanning purchase print matrices & date markers...';
    }, 500);

    setTimeout(() => {
      const statusText = document.getElementById('receipt-scan-status');
      if (statusText) statusText.textContent = 'Running carbon indices OCR lookup...';
    }, 1000);

    setTimeout(() => {
      // Proceed with actual render
      canvasBox.style.display = 'flex';
      const ctx = canvas.getContext('2d');
      canvas.width = 400;
      canvas.height = 420;

      // Draw receipt aesthetics
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Receipt border serrated edge look
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
      ctx.setLineDash([]);

      // Font layout
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.font = '800 18px Courier New';
      ctx.fillText(preset.title.toUpperCase(), canvas.width / 2, 40);

      ctx.font = '400 12px Courier New';
      ctx.fillText(`DATE: ${preset.date}  TXN: #0928371`, canvas.width / 2, 65);
      ctx.fillText('-------------------------------------', canvas.width / 2, 85);

      // Items list
      ctx.textAlign = 'left';
      let startY = 110;
      let totalFootprint = 0;

      preset.items.forEach(item => {
        ctx.font = '700 12px Courier New';
        ctx.fillText(item.name.substring(0, 25), 30, startY);

        ctx.textAlign = 'right';
        ctx.font = '400 12px Courier New';
        const co2Str = `${item.co2.toFixed(1)}kg CO2`;
        ctx.fillText(co2Str, canvas.width - 30, startY);
        ctx.textAlign = 'left';

        totalFootprint += item.co2;
        startY += 30;
      });

      ctx.textAlign = 'center';
      ctx.font = '400 12px Courier New';
      ctx.fillText('-------------------------------------', canvas.width / 2, startY);

      startY += 25;
      ctx.font = '800 14px Courier New';
      ctx.fillText(`TOTAL EST. CO2: ${totalFootprint.toFixed(1)} KG`, canvas.width / 2, startY);

      // Draw simple simulated barcode
      startY += 30;
      ctx.fillStyle = '#1e293b';
      const barcodeX = canvas.width / 2 - 80;
      for (let i = 0; i < 40; i++) {
        const w = Math.random() > 0.4 ? 4 : 2;
        ctx.fillRect(barcodeX + i * 4, startY, w, 35);
      }

      // Display parsed tabular lists in UI
      let html = `<h4 style="margin-bottom: 0.75rem; color: var(--color-green-light)">Scan Results: ${preset.title}</h4>`;
      html += `<ul class="scanner-results-list">`;
      preset.items.forEach(item => {
        const itemClass = item.isEco ? 'eco-positive' : 'eco-negative';
        const labelText = item.isEco ? 'Eco Friendly' : 'High Impact';
        const labelColor = item.isEco ? 'var(--color-green-light)' : 'var(--color-red)';

        let savingsKg = 0;
        if (item.name.includes('Beef')) savingsKg = 12.8;
        else if (item.name.includes('Plums')) savingsKg = 0.9;
        else if (item.name.includes('Bottles')) savingsKg = 3.5;
        else if (item.name.includes('Meals')) savingsKg = 4.5;

        html += `
          <li class="scan-item ${itemClass}">
            <div style="flex-grow:1; padding-right:1rem;">
              <span style="font-weight: 600;">${item.name}</span>
              <span class="${itemClass}" style="display: block; font-size: 0.78rem; color: ${labelColor}">${labelText}</span>
              ${
                item.swap
                  ? `
                <span class="swap-suggestion" style="display:block; margin: 0.25rem 0; font-size: 0.8rem; color:var(--text-secondary);"><i data-lucide="refresh-cw" style="width:11px; height:11px; display:inline-block; vertical-align:middle; margin-right:3px;"></i> Swap: ${item.swap}</span>
                <button class="btn btn-secondary btn-sm btn-swap-item" style="padding: 0.25rem 0.6rem; font-size: 0.72rem; border-radius: 15px; margin-top:0.35rem;" data-name="${EcoUtils.escapeHTML(item.name)}" data-swap="${EcoUtils.escapeHTML(item.swap)}" data-savings="${savingsKg}">Swap & Save (-${savingsKg} kg)</button>
              `
                  : ''
              }
            </div>
            <div style="font-weight: 700; text-align: right; flex-shrink:0;">+${item.co2} kg</div>
          </li>
        `;
      });
      html += `</ul>`;

      // Award XP
      html += `<button class="btn btn-claim-xp" style="margin-top:1rem; width:100%">Claim Receipt Scan XP (+35 XP)</button>`;
      resultsContainer.innerHTML = DOMPurify.sanitize(html);
      resultsContainer.querySelectorAll('.btn-swap-item').forEach(btn => {
        btn.addEventListener('click', () => {
          EcoScanners.swapItem(
            btn,
            btn.dataset.name,
            btn.dataset.swap,
            parseFloat(btn.dataset.savings)
          );
        });
      });
      const claimBtn = resultsContainer.querySelector('.btn-claim-xp');
      if (claimBtn) {
        claimBtn.addEventListener('click', () => {
          if (window.App && typeof App.addXp === 'function') {
            App.addXp(35, 'Receipt Scanned');
          }
        });
      }
      if (window.lucide) lucide.createIcons();
    }, 1500);
  },

  // Mock Camera room analyzer
  runCameraScan() {
    const preset = ECO_DATA.cameraPresets[this.activeCameraPreset];
    if (!preset) return;

    const resultsContainer = document.getElementById('camera-results');
    const canvasBox = document.getElementById('camera-canvas-box');
    const canvas = document.getElementById('camera-canvas');
    if (!canvasBox || !canvas || !resultsContainer) return;

    // Show mock OCR spinner
    canvasBox.style.display = 'none';
    resultsContainer.innerHTML = DOMPurify.sanitize(`
      <div class="scanner-loading-box" style="display: flex; flex-direction: column; align-items: center; gap: 0.85rem; padding: 3rem 1rem; color: var(--color-green-light); text-align: center;">
        <div style="width: 40px; height: 40px; border: 3px solid rgba(16, 185, 129, 0.1); border-top-color: var(--color-green-light); border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <p style="font-size: 0.95rem; font-weight: 600; margin-top:0.5rem;" id="camera-scan-status">Accessing Room Auditor CV Engine...</p>
      </div>
    `);

    setTimeout(() => {
      const statusText = document.getElementById('camera-scan-status');
      if (statusText) statusText.textContent = 'Analyzing appliance energy profile metadata...';
    }, 500);

    setTimeout(() => {
      const statusText = document.getElementById('camera-scan-status');
      if (statusText) statusText.textContent = 'Isolating high-impact waste sources...';
    }, 1000);

    setTimeout(() => {
      // Proceed with actual canvas render
      canvasBox.style.display = 'flex';
      resultsContainer.innerHTML = ''; // clear loading spinner

      const ctx = canvas.getContext('2d');
      canvas.width = 600;
      canvas.height = 400;

      // Draw background placeholder image in Canvas representing room/office
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw vector layout representing room
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(50, 150, 500, 200); // Main Desk/Counter

      // Draw visual outlines
      ctx.strokeStyle = '#475569';
      ctx.strokeRect(100, 50, 400, 300);

      // Context details
      ctx.fillStyle = '#475569';
      ctx.font = '14px Outfit';
      ctx.fillText(`${preset.title.toUpperCase()} (AI ANALYSIS IN PROGRESS)`, 20, 30);

      // Simulated scan lines overlay (draw animation)
      let scanLine = 0;
      const interval = setInterval(() => {
        // Clear previous frames
        ctx.fillStyle = '#090f0c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Room outlines
        ctx.fillStyle = '#111a14';
        ctx.fillRect(40, 60, canvas.width - 80, canvas.height - 120);

        // Drawing basic shapes for room items
        preset.items.forEach(item => {
          ctx.fillStyle = item.isEco ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
          ctx.fillRect(item.x, item.y, item.width, item.height);

          ctx.strokeStyle = item.isEco ? '#10b981' : '#ef4444';
          ctx.lineWidth = 2;
          ctx.strokeRect(item.x, item.y, item.width, item.height);

          // Tags
          ctx.fillStyle = item.isEco ? '#10b981' : '#ef4444';
          ctx.font = 'bold 10px Inter';
          ctx.fillText(item.label, item.x + 5, item.y + 15);
        });

        // Moving green scan line
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, scanLine);
        ctx.lineTo(canvas.width, scanLine);
        ctx.stroke();

        scanLine += 20;
        if (scanLine > canvas.height) {
          clearInterval(interval);

          // Final Static Frame (no scan line)
          ctx.fillStyle = '#090f0c';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#111a14';
          ctx.fillRect(40, 60, canvas.width - 80, canvas.height - 120);

          preset.items.forEach(item => {
            ctx.strokeStyle = item.isEco ? '#10b981' : '#ef4444';
            ctx.lineWidth = 2;
            ctx.strokeRect(item.x, item.y, item.width, item.height);

            ctx.fillStyle = item.isEco ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';
            ctx.fillRect(item.x, item.y, item.width, item.height);

            // Details text
            ctx.fillStyle = '#ffffff';
            ctx.font = '11px Inter';
            ctx.fillText(item.label, item.x + 4, item.y - 6);
          });

          // Trigger text render
          this.renderCameraTextResults(preset);
        }
      }, 50);
    }, 1500);
  },

  renderCameraTextResults(preset) {
    const resultsContainer = document.getElementById('camera-results');
    if (!resultsContainer) return;

    let html = `<h4 style="margin-bottom: 0.75rem; color: var(--color-green-light)">Room Scan Audit: ${preset.title}</h4>`;
    html += `<ul class="scanner-results-list">`;
    preset.items.forEach(item => {
      const itemClass = item.isEco ? 'eco-positive' : 'eco-negative';
      const labelText = item.isEco ? 'Eco Friendly' : 'Carbon Waste Source';
      const labelColor = item.isEco ? 'var(--color-green-light)' : 'var(--color-red)';

      let savingsKg = 0;
      if (item.label.includes('Wrap')) savingsKg = 1.4;
      else if (item.label.includes('Teflon')) savingsKg = 3.0;
      else if (item.label.includes('Screen')) savingsKg = 15.0;
      else if (item.label.includes('Lamp')) savingsKg = 8.0;

      html += `
        <li class="scan-item ${itemClass}">
          <div style="flex-grow:1; padding-right:1rem;">
            <span style="font-weight: 600;">${item.label}</span>
            <span style="display: block; font-size: 0.78rem; color: ${labelColor}">${labelText} (${item.co2})</span>
            ${
              item.swap
                ? `
              <span class="swap-suggestion" style="display:block; margin: 0.25rem 0; font-size:0.8rem; color:var(--text-secondary);"><i data-lucide="refresh-cw" style="width:11px; height:11px; display:inline-block; vertical-align:middle; margin-right:3px;"></i> Recommendation: ${item.swap}</span>
              <button class="btn btn-secondary btn-sm btn-swap-item" style="padding: 0.25rem 0.6rem; font-size: 0.72rem; border-radius: 15px; margin-top:0.35rem;" data-name="${EcoUtils.escapeHTML(item.label)}" data-swap="${EcoUtils.escapeHTML(item.swap)}" data-savings="${savingsKg}">Swap & Save (-${savingsKg} kg)</button>
            `
                : ''
            }
          </div>
        </li>
      `;
    });
    html += `</ul>`;
    html += `<button class="btn btn-claim-xp-camera" style="margin-top:1rem; width:100%">Claim Camera Analysis XP (+50 XP)</button>`;

    resultsContainer.innerHTML = DOMPurify.sanitize(html);
    resultsContainer.querySelectorAll('.btn-swap-item').forEach(btn => {
      btn.addEventListener('click', () => {
        EcoScanners.swapItem(
          btn,
          btn.dataset.name,
          btn.dataset.swap,
          parseFloat(btn.dataset.savings)
        );
      });
    });
    const claimBtn = resultsContainer.querySelector('.btn-claim-xp-camera');
    if (claimBtn) {
      claimBtn.addEventListener('click', () => {
        if (window.App && typeof App.addXp === 'function') {
          App.addXp(50, 'Room Carbon Scan');
        }
      });
    }
    if (window.lucide) lucide.createIcons();
  },

  // Active Interactive Swap & Save Method
  swapItem(btnEl, itemName, swapDesc, savingsKg) {
    if (!window.App || !window.EcoCalculator) return;

    // Calculate saving in Tons
    const savingsTons = savingsKg / 1000;

    // Add to offsets scannedSwaps
    if (!App.user.offsets) {
      App.user.offsets = { forest: 0, ocean: 0, wind: 0, scannedSwaps: 0 };
    }
    App.user.offsets.scannedSwaps = (App.user.offsets.scannedSwaps || 0) + savingsTons;

    // Add XP
    App.addXp(20, `Eco-Swap: ${itemName}`);

    // Play particle explosion on the button clicked
    if (App.emitParticles) {
      App.emitParticles(btnEl, 'leaf');
    }

    // Save session
    App.saveSession();

    // Recalculate carbon values
    EcoCalculator.recalculateRealTime();
    if (window.EcoPlanet) {
      EcoPlanet.updatePlanet();
    }

    // Highlight that this item has been swapped in the UI
    const container = btnEl.closest('.scan-item');
    if (container) {
      container.style.transition = 'all 0.5s ease';
      container.style.background = 'rgba(16, 185, 129, 0.1)';
      container.style.borderColor = 'rgba(16, 185, 129, 0.3)';

      const badge = container.querySelector('.eco-negative');
      if (badge) {
        badge.textContent = 'Swapped & Offset';
        badge.style.color = 'var(--color-green-light)';
      }
    }

    btnEl.disabled = true;
    btnEl.innerHTML = DOMPurify.sanitize(
      `<i data-lucide="check" style="width:10px; height:10px; display:inline-block; vertical-align:middle; margin-right:3px;"></i> Swapped`
    );
    if (window.lucide) lucide.createIcons();

    App.showToast(`Swapped to green alternative! Saved -${savingsKg} kg CO₂`);
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EcoScanners;
  global.EcoScanners = EcoScanners;
}
