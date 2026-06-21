/**
 * EcoTwin Features Module Delegator (features.js)
 * ===============================================
 * For browser environment, the split modules are loaded via script tags.
 * For Node.js context (tests), this file acts as a delegator to require the sub-modules.
 */

if (typeof module !== 'undefined' && module.exports) {
  require('./features/tradeoff-machine.js');
  require('./features/street-2080.js');
  require('./features/time-capsule.js');
  require('./features/receipt.js');
  require('./features/misc.js');
  require('./features/diet.js');

  module.exports = {};
}
