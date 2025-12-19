/**
 * Quench test registration for pf1-psionics module
 *
 * This file registers all Quench test batches when Foundry loads.
 * Tests will appear in the Quench UI under "PF1 Psionics" category.
 */

import { registerPowerModelTests } from './power-model.test.mjs';

/**
 * Register all Quench test batches
 */
Hooks.on('quenchReady', () => {
  console.log('pf1-psionics | Registering Quench tests...');

  // Register test suites
  registerPowerModelTests();

  // Add more test suites here as they're created:
  // registerBuffSystemTests();
  // registerPsionicFocusTests();
  // registerAPITests();

  console.log('pf1-psionics | Quench tests registered');
});

