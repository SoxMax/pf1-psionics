#!/usr/bin/env node

/**
 * Standalone test runner for pf1-psionics migrations
 * Runs outside of Foundry for CI/CD pipelines
 */

// IMPORTANT: Setup mocks BEFORE any imports that depend on Foundry
import { setupMocks, teardownMocks } from "./test-helpers.mjs";
setupMocks();

// Now import tests (which will import PowerModel)
const { runAllTests } = await import("./migrations.test.mjs");

try {
  const results = runAllTests();

  // Exit with error code if any tests failed
  process.exit(results.failed > 0 ? 1 : 0);
} finally {
  teardownMocks();
}
