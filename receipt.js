/**
 * EcoTwin - Carbon Receipt Feature
 */

App.initCarbonReceipt = function () {
  const closeReceiptBtn = document.getElementById('btn-close-receipt');
  const closeReceiptBtnBottom = document.getElementById('btn-close-receipt-bottom');
  const downloadReceiptBtn = document.getElementById('btn-download-receipt');
  const receiptModal = document.getElementById('receipt-modal');

  // Global Event Delegation for dynamic buttons inside cloned modal nodes
  document.addEventListener('click', e => {
    const showBtn = e.target.closest('#btn-show-receipt');
    if (showBtn) {
      this.generateReceiptData();
      const modal = document.getElementById('receipt-modal');
      if (modal) modal.style.display = 'flex';
    }

    const dashboardBtn = e.target.closest('#btn-results-view-dashboard');
    if (dashboardBtn) {
      // Remove active feature modal page
      const page = document.querySelector('.feature-dedicated-page.active');
      if (page) page.remove();

      // Restore main layout display
      const appContainer = document.querySelector('.app-container');
      if (appContainer) appContainer.style.display = 'flex';

      // Scroll to dashboard section
      this.scrollToSection('scene-dashboard');

      // Click charts tab navigation
      const chartsTab = document.querySelector('.db-nav-item[data-tab="charts"]');
      if (chartsTab) {
        chartsTab.click();
      } else {
        if (window.EcoDashboard) EcoDashboard.renderAdvancedCharts();
      }

      // Trigger resize for Chart.js redrawing
      window.dispatchEvent(new window.Event('resize'));
    }
  });

  if (closeReceiptBtn) {
    closeReceiptBtn.addEventListener('click', () => {
      if (receiptModal) receiptModal.style.display = 'none';
    });
  }
  if (closeReceiptBtnBottom) {
    closeReceiptBtnBottom.addEventListener('click', () => {
      if (receiptModal) receiptModal.style.display = 'none';
    });
  }

  if (downloadReceiptBtn) {
    downloadReceiptBtn.addEventListener('click', () => {
      this.downloadReceiptPNG();
    });
  }

  const shareReceiptBtn = document.getElementById('btn-share-receipt');
  if (shareReceiptBtn) {
    shareReceiptBtn.addEventListener('click', () => {
      const id = document.getElementById('receipt-user-id')?.textContent || 'GUEST';
      const date = document.getElementById('receipt-date')?.textContent || '';
      const total = document.getElementById('receipt-total-co2')?.textContent || '0';
      const offsets = document.getElementById('receipt-total-offsets')?.textContent || '0';
      const net = document.getElementById('receipt-net-co2')?.textContent || '0';
      const grade = document.getElementById('receipt-grade-msg')?.textContent || '';

      const summaryText =
        `★ ECOTWIN CARBON RECEIPT ★\n` +
        `--------------------------\n` +
        `Custodian ID: #${id}\n` +
        `Date: ${date}\n` +
        `--------------------------\n` +
        `Total Emissions: ${total} kg\n` +
        `Active Offsets: -${offsets} kg\n` +
        `Net Footprint: ${net} kg/mo\n` +
        `--------------------------\n` +
        `${grade}\n` +
        `--------------------------\n` +
        `Thank you for saving the planet!\n` +
        `Powered by EcoTwin AI Core`;

      navigator.clipboard
        .writeText(summaryText)
        .then(() => {
          this.showToast('📋 Carbon Receipt copied to clipboard!');
        })
        .catch(err => {
          console.error('Failed to copy receipt:', err);
          this.showToast('Failed to copy to clipboard.');
        });
    });
  }
};

App.generateReceiptData = function () {
  const inputs = this.user.dashboardInputs;

  const commuteDistance = parseFloat(inputs.commuteDistance) || 15;
  const commuteMode = inputs.commuteMode || 'car';
  let modeMultiplier = 0.18;
  if (commuteMode === 'bike') modeMultiplier = 0.08;
  if (commuteMode === 'metro' || commuteMode === 'transit') modeMultiplier = 0.03;
  if (commuteMode === 'walk' || commuteMode === 'remote') modeMultiplier = 0.0;
  const transportEmissions = commuteDistance * 365 * modeMultiplier;

  const flights = inputs.flights || '0';
  let travelEmissions = 0;
  if (flights === '1-2') travelEmissions = 1100;
  if (flights === '3-5') travelEmissions = 3200;
  if (flights === '6+') travelEmissions = 6500;

  const diet = inputs.quizDiet || 'vegetarian';
  let foodEmissions = 1100;
  if (diet === 'vegan') foodEmissions = 600;
  if (diet === 'nonveg') foodEmissions = 2200;
  if (diet === 'heavy-meat') foodEmissions = 3800;

  const electricityBill = parseFloat(inputs.electricityBill) || 1000;
  let energyBase = electricityBill * 1.5;
  if (electricityBill >= 3000) {
    energyBase = electricityBill * 1.6;
  }
  const householdSize = inputs.householdSize || '1';
  let hhMultiplier = 1.0;
  if (householdSize === '2' || householdSize === 2) hhMultiplier = 1.6;
  else if (householdSize === '3-4' || householdSize === 3 || householdSize === 4)
    hhMultiplier = 2.5;
  else if (
    householdSize === '5+' ||
    (typeof householdSize === 'number' && householdSize >= 5) ||
    parseInt(householdSize) >= 5
  )
    hhMultiplier = 3.8;
  const energyEmissions = energyBase / hhMultiplier;

  const onlineOrders = inputs.onlineOrders || '0-1';
  let shoppingEmissions = 120;
  if (onlineOrders === '2-3') shoppingEmissions = 380;
  if (onlineOrders === '4-5') shoppingEmissions = 750;
  if (onlineOrders === '6+') shoppingEmissions = 1300;

  const homeHeating = inputs.homeHeating || 'electric';
  let heatingEmissions = 2200;
  if (homeHeating === 'solar') heatingEmissions = 200;
  if (homeHeating === 'gas') heatingEmissions = 1200;

  const wasteRecycling = inputs.wasteRecycling || 'standard';
  let wasteEmissions = 400;
  if (wasteRecycling === 'zero-waste') wasteEmissions = 100;
  if (wasteRecycling === 'no-recycle') wasteEmissions = 900;

  const purchasingHabits = inputs.purchasingHabits || 'standard';
  let purchasingEmissions = 600;
  if (purchasingHabits === 'minimalist') purchasingEmissions = 150;
  if (purchasingHabits === 'fashion-heavy') purchasingEmissions = 1800;

  const transportMonthly = Math.round((transportEmissions + travelEmissions) / 12);
  const foodMonthly = Math.round(foodEmissions / 12);
  const energyMonthly = Math.round((energyEmissions + heatingEmissions) / 12);
  const shoppingMonthly = Math.round(
    (shoppingEmissions + wasteEmissions + purchasingEmissions) / 12
  );

  const subtotal = transportMonthly + foodMonthly + energyMonthly + shoppingMonthly;

  let offsetVal = 0;
  const savedPledges =
    typeof Utils !== 'undefined'
      ? Utils.storage.getItem('eco_user_pledges')
      : JSON.parse(localStorage.getItem('eco_user_pledges'));
  if (savedPledges) {
    try {
      const parsedPledges =
        typeof savedPledges === 'string' ? JSON.parse(savedPledges) : savedPledges;
      offsetVal = parsedPledges.length * 20;
    } catch (e) {
      console.warn('[Receipt] Failed to parse saved pledges:', e);
    }
  }
  if (offsetVal === 0) {
    offsetVal = 15;
  }

  const netFootprint = Math.max(0, subtotal - offsetVal);

  const totalEmissionsKg =
    transportEmissions +
    travelEmissions +
    foodEmissions +
    energyEmissions +
    shoppingEmissions +
    heatingEmissions +
    wasteEmissions +
    purchasingEmissions;
  const score = Math.max(10, Math.min(100, Math.round(100 - totalEmissionsKg / 220)));
  let grade = 'D';
  let feedback = 'Needs immediate action';
  if (score >= 85) {
    grade = 'A';
    feedback = 'EXCELLENT PLANETARY GUARDIAN';
  } else if (score >= 70) {
    grade = 'B';
    feedback = 'GOOD SUSTAINABLE STEP';
  } else if (score >= 50) {
    grade = 'C';
    feedback = 'AVERAGE PLANETARY IMPACT';
  }

  const userHash = Math.abs(
    this.user.name.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0)
  )
    .toString(16)
    .toUpperCase()
    .substring(0, 6);
  document.getElementById('receipt-user-id').textContent = userHash || 'GUEST';

  const now = new Date();
  document.getElementById('receipt-date').textContent = now
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');

  const itemsList = document.getElementById('receipt-items-list');
  itemsList.innerHTML = '';

  const items = [
    {
      desc: 'TRANS COMMUTE PROFILE',
      qty: `${commuteMode.toUpperCase()}`,
      co2: `${(commuteDistance * modeMultiplier * 365) / 12} kg`,
      cite: 'DEFRA conversion database',
    },
    {
      desc: 'LONG RANGE AIR TRAVEL',
      qty: `${flights} FLIGHTS/YR`,
      co2: `${Math.round(travelEmissions / 12)} kg`,
      cite: 'ICAO passenger flight emissions standard',
    },
    {
      desc: 'DIETARY SELECTIONS',
      qty: `${diet.toUpperCase()}`,
      co2: `${foodMonthly} kg`,
      cite: 'Our World in Data food lifecycle analysis (2018)',
    },
    {
      desc: 'HOUSEHOLD GRID UTILITIES',
      qty: `${electricityBill} BILL`,
      co2: `${Math.round(energyEmissions / 12)} kg`,
      cite: 'IEA grid fuel mix carbon coefficients',
    },
    {
      desc: 'HEATING & COOLING SYS',
      qty: `${homeHeating.toUpperCase()}`,
      co2: `${Math.round(heatingEmissions / 12)} kg`,
      cite: 'EIA residential climate fuel consumption models',
    },
    {
      desc: 'SHIPPING & PACKAGING',
      qty: `${onlineOrders} ORDER/WK`,
      co2: `${Math.round(shoppingEmissions / 12)} kg`,
      cite: 'WEF e-commerce parcel shipping emissions report',
    },
    {
      desc: 'CONSUMPTION & APPAREL',
      qty: `${purchasingHabits.toUpperCase()}`,
      co2: `${Math.round(purchasingEmissions / 12)} kg`,
      cite: 'Carbon Trust consumer product lifecycle models',
    },
    {
      desc: 'MUNICIPAL SOLID WASTE',
      qty: `${wasteRecycling.toUpperCase()}`,
      co2: `${Math.round(wasteEmissions / 12)} kg`,
      cite: 'EPA WARM landfill methane emission equations',
    },
  ];

  // Adjust transport commute profile co2 label to match standard monthly transport value
  items[0].co2 = `${transportMonthly} kg`;

  items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'receipt-item-row';
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.fontSize = '0.78rem';

    // Sanitized using Utils.sanitizeHTML
    const rawHTML = `
      <div style="text-align: left; max-width: 65%;">
        <div style="font-weight: 700; color: #1c1917; display: flex; align-items: center; gap: 4px;">
          ${EcoUtils.escapeHTML(item.desc)}
          <span class="info-citation" data-tooltip="${EcoUtils.escapeHTML(item.cite)}" style="color: var(--color-green-light); font-size: 0.65rem;">ⓘ</span>
        </div>
        <div style="font-size: 0.65rem; color: #666; font-weight: bold;">QTY: ${EcoUtils.escapeHTML(item.qty)}</div>
      </div>
      <div style="align-self: flex-end; font-weight: 900; color: #1c1917;">${EcoUtils.escapeHTML(item.co2)}</div>
    `;
    row.innerHTML = typeof Utils !== 'undefined' ? Utils.sanitizeHTML(rawHTML) : rawHTML;
    itemsList.appendChild(row);
  });

  document.getElementById('receipt-total-co2').textContent = subtotal;
  document.getElementById('receipt-total-offsets').textContent = offsetVal;
  document.getElementById('receipt-net-co2').textContent = netFootprint;
  document.getElementById('receipt-grade-msg').textContent =
    `DIAGNOSTICS PROFILE GRADE: ${grade} (${feedback})`;

  const qrContainer = document.getElementById('receipt-qrcode');
  qrContainer.innerHTML = '';

  const seed = score + userHash.charCodeAt(0);
  const getPseudorandom = index => {
    const x = Math.sin(seed + index) * 10000;
    return x - Math.floor(x) > 0.5;
  };

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const isFinderPattern = (r < 3 && c < 3) || (r < 3 && c > 6) || (r > 6 && c < 3);
      const cell = document.createElement('div');
      cell.style.width = '100%';
      cell.style.height = '100%';

      let isBlack;
      if (isFinderPattern) {
        const isCenter = (r === 1 && c === 1) || (r === 1 && c === 8) || (r === 8 && c === 1);
        isBlack = !isCenter;
      } else {
        isBlack = getPseudorandom(r * 10 + c);
      }

      cell.style.background = isBlack ? '#1c1917' : '#fff';
      qrContainer.appendChild(cell);
    }
  }
};

App.downloadReceiptPNG = function () {
  const canvas = document.createElement('canvas');
  canvas.width = 450;
  canvas.height = 700;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#fdfdfc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#1c1917';
  ctx.textAlign = 'center';

  ctx.font = '900 24px Courier New';
  ctx.fillText('ECOTWIN STORES', canvas.width / 2, 50);

  ctx.font = '14px Courier New';
  const custodianId = document.getElementById('receipt-user-id').textContent;
  ctx.fillText(`Earth Custodian ID: #${custodianId}`, canvas.width / 2, 75);

  const dateStr = document.getElementById('receipt-date').textContent;
  ctx.fillText(dateStr, canvas.width / 2, 95);

  const ctx_font = 'bold 14px Courier New';
  ctx.font = ctx_font;
  ctx.fillText('------------------------------------------', canvas.width / 2, 120);

  ctx.textAlign = 'left';
  ctx.fillText('ITEM DESCRIPTION', 40, 140);
  ctx.textAlign = 'right';
  ctx.fillText('QTY / CO2', canvas.width - 40, 140);

  ctx.textAlign = 'center';
  ctx.fillText('------------------------------------------', canvas.width / 2, 155);

  let currentY = 180;
  ctx.font = '13px Courier New';

  const itemsList = document.getElementById('receipt-items-list');
  const rows = itemsList.children;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const descText = row.children[0].children[0].textContent;
    const qtyText = row.children[0].children[1].textContent;
    const co2Text = row.children[1].textContent;

    ctx.textAlign = 'left';
    ctx.font = 'bold 13px Courier New';
    ctx.fillText(descText, 40, currentY);

    ctx.font = '12px Courier New';
    ctx.fillText(qtyText, 40, currentY + 15);

    ctx.textAlign = 'right';
    ctx.font = 'bold 13px Courier New';
    ctx.fillText(co2Text, canvas.width - 40, currentY + 10);

    currentY += 40;
  }

  ctx.textAlign = 'center';
  ctx.fillText('------------------------------------------', canvas.width / 2, currentY);
  currentY += 20;

  const totalCo2 = document.getElementById('receipt-total-co2').textContent;
  ctx.textAlign = 'left';
  ctx.font = 'bold 15px Courier New';
  ctx.fillText('TOTAL EMISSIONS', 40, currentY);
  ctx.textAlign = 'right';
  ctx.fillText(`${totalCo2} kg`, canvas.width - 40, currentY);
  currentY += 20;

  const offsetCo2 = document.getElementById('receipt-total-offsets').textContent;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#15803d';
  ctx.fillText('ACTIVE OFFSETS', 40, currentY);
  ctx.textAlign = 'right';
  ctx.fillText(`-${offsetCo2} kg`, canvas.width - 40, currentY);
  currentY += 20;

  const netCo2 = document.getElementById('receipt-net-co2').textContent;
  ctx.fillStyle = '#1c1917';
  ctx.textAlign = 'center';
  ctx.fillText('==========================================', canvas.width / 2, currentY);
  currentY += 20;

  ctx.textAlign = 'left';
  ctx.font = 'bold 17px Courier New';
  ctx.fillText('NET FOOTPRINT', 40, currentY);
  ctx.textAlign = 'right';
  ctx.fillText(`${netCo2} kg/mo`, canvas.width - 40, currentY);
  currentY += 25;

  ctx.textAlign = 'center';
  ctx.font = 'bold 14px Courier New';
  ctx.fillText('==========================================', canvas.width / 2, currentY);
  currentY += 25;

  const gradeMsg = document.getElementById('receipt-grade-msg').textContent;
  ctx.font = 'bold 12px Courier New';
  ctx.fillText(gradeMsg, canvas.width / 2, currentY);
  currentY += 25;

  const qrSize = 80;
  const qrX = (canvas.width - qrSize) / 2;
  const qrY = currentY;

  ctx.fillStyle = '#fff';
  ctx.fillRect(qrX, qrY, qrSize, qrSize);
  ctx.strokeStyle = '#1c1917';
  ctx.lineWidth = 2;
  ctx.strokeRect(qrX, qrY, qrSize, qrSize);

  const qrDivs = document.getElementById('receipt-qrcode').children;
  const cellSize = qrSize / 10;
  for (let i = 0; i < 100; i++) {
    const r = Math.floor(i / 10);
    const c = i % 10;
    const div = qrDivs[i];
    if (
      div &&
      (div.style.background.includes('1c1917') || div.style.background.includes('rgb(28, 25, 23)'))
    ) {
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(qrX + c * cellSize, qrY + r * cellSize, cellSize, cellSize);
    }
  }
  currentY += qrSize + 25;

  ctx.font = 'italic 12px Courier New';
  ctx.fillStyle = '#1c1917';
  ctx.fillText('Thank you for saving the planet!', canvas.width / 2, currentY);

  ctx.font = '10px Courier New';
  ctx.fillText('Powered by EcoTwin AI Core', canvas.width / 2, currentY + 15);

  ctx.font = '900 10px Courier New';
  ctx.fillStyle = 'rgba(28, 25, 23, 0.35)';
  ctx.fillText('★ ECOTWIN ORIGINAL ★', canvas.width / 2, currentY + 32);

  const link = document.createElement('a');
  link.download = `ecotwin_carbon_receipt_${custodianId}.png`;
  link.href = canvas.toDataURL();
  link.click();
};
