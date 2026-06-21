/* e:\PromptWar\Challenge-3\js\twin.js */

const EcoTwin = {
  renderTwin() {
    const results = EcoCalculator.calculateEmissions();
    const currentFootprint = results.total;
    const targetFootprint = Math.min(2.5, currentFootprint * 0.4); // Target optimized is 60% lower or caps at 2.5T

    // Calculate details
    const tonsSaved = currentFootprint - targetFootprint;
    const treesRequired = Math.round(tonsSaved * 45); // 45 trees absorb approx 1 ton of CO2/year
    const cashSavings = Math.round(tonsSaved * 210); // fuel + utilities

    // Update original twin stats
    document.getElementById('twin-orig-co2').textContent = currentFootprint.toFixed(2) + ' Tons';
    document.getElementById('twin-orig-health').textContent = 'Moderate (High smog exposure)';
    document.getElementById('twin-orig-cost').textContent = '$3,800/yr (Est. energy/fuel)';

    // Update optimized twin stats
    document.getElementById('twin-opt-co2').textContent = targetFootprint.toFixed(2) + ' Tons';
    document.getElementById('twin-opt-health').textContent = 'Excellent (+2 hrs walking/cycle)';
    document.getElementById('twin-opt-cost').textContent =
      '$' + (3800 - cashSavings).toLocaleString() + '/yr';

    // Update comparative card highlights
    document.getElementById('twin-potential-saved').textContent =
      tonsSaved.toFixed(2) + ' Tons CO2';
    document.getElementById('twin-cash-saved').textContent = '$' + cashSavings.toLocaleString();
    document.getElementById('twin-health-benefits').textContent =
      `Fewer car fumes, $+${Math.round(cashSavings / 12)} monthly pocket balance`;
    document.getElementById('twin-trees-equiv').textContent =
      `${treesRequired} mature trees planting equivalent`;
  },

  runTimeMachine() {
    const results = EcoCalculator.calculateEmissions();
    const annualFootprint = results.total;

    // Future predictions: Business as Usual vs Green Twin Lifestyle
    // We assume 1.5% annual inflation of footprints in Business as Usual (more gadgets/flights)
    // We assume 5% annual improvement in Green Twin Lifestyle (grid getting greener + habits hardening)

    const years = [1, 5, 10];

    years.forEach(yr => {
      let bauAccumulated = 0;
      let greenAccumulated = 0;

      let currentBauLevel = annualFootprint;
      let currentGreenLevel = Math.min(2.5, annualFootprint * 0.4);

      for (let i = 0; i < yr; i++) {
        bauAccumulated += currentBauLevel;
        currentBauLevel *= 1.015;

        greenAccumulated += currentGreenLevel;
        currentGreenLevel *= 0.95;
      }

      // Update DOM
      const bauEl = document.getElementById(`tm-bau-${yr}yr`);
      const greenEl = document.getElementById(`tm-green-${yr}yr`);
      const savedEl = document.getElementById(`tm-saved-${yr}yr`);

      const savedVal = bauAccumulated - greenAccumulated;
      if (bauEl) bauEl.textContent = bauAccumulated.toFixed(1) + ' Tons';
      if (greenEl) greenEl.textContent = greenAccumulated.toFixed(1) + ' Tons';
      if (savedEl) savedEl.textContent = 'Saved: ' + savedVal.toFixed(1) + ' Tons';

      // Update progress visualization bars
      const bauBar = document.getElementById(`tm-bar-bau-${yr}yr`);
      const greenBar = document.getElementById(`tm-bar-green-${yr}yr`);

      if (bauBar && greenBar) {
        // Set heights proportionally
        const maxAccumulated = annualFootprint * 12; // cap scale
        const bauHeightPercent = Math.min(100, (bauAccumulated / maxAccumulated) * 100);
        const greenHeightPercent = Math.min(100, (greenAccumulated / maxAccumulated) * 100);

        bauBar.style.height = `${Math.max(15, bauHeightPercent)}%`;
        greenBar.style.height = `${Math.max(10, greenHeightPercent)}%`;
      }
    });

    // Update simulation narrative text
    const narrativeText = document.getElementById('tm-narrative');
    if (narrativeText) {
      if (annualFootprint > 12) {
        narrativeText.innerHTML = DOMPurify.sanitize(
          `<i class='lucide-alert-triangle' style='color: var(--color-red)'></i> Warning: Your current trajectory accumulates over <strong>${(annualFootprint * 10).toFixed(0)} tons</strong> of greenhouse gases in 10 years. This requires planting over 450 trees just to break even. Adopt your Digital Twin's habits to cut this footprint by up to 60%!`
        );
      } else {
        narrativeText.innerHTML = DOMPurify.sanitize(
          `<i class='lucide-leaf' style='color: var(--color-green-glow)'></i> Trajectory Status: Good. In 10 years, implementing minor changes will prevent <strong>${((annualFootprint - Math.min(2.5, annualFootprint * 0.4)) * 10).toFixed(1)} tons</strong> of CO2 from enters the atmosphere. Keep maintaining healthy habits to protect the ecosystem!`
        );
      }
    }
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EcoTwin;
  global.EcoTwin = EcoTwin;
}
