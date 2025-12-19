#!/usr/bin/env node

/**
 * Top-level test runner for pf1-psionics
 * Discovers and runs all test suites in subdirectories
 */

import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// IMPORTANT: Setup mocks BEFORE any imports that depend on Foundry
const { setupMocks, teardownMocks } = await import(resolve(__dirname, "./migrations/test-helpers.mjs"));
setupMocks();

// Import all test suites
const powerModelTests = await import(resolve(__dirname, "./migrations/power-model.test.mjs"));
const v070Tests = await import(resolve(__dirname, "./migrations/v0.7.0.test.mjs"));
const dataIntegrityTests = await import(resolve(__dirname, "./migrations/data-integrity.test.mjs"));
const errorRecoveryTests = await import(resolve(__dirname, "./migrations/error-recovery.test.mjs"));

// Registry of all test suites
const TEST_SUITES = [
  {
    name: "PowerModel Core",
    runTests: powerModelTests.runAllTests
  },
  {
    name: "v0.7.0 Migration Implementation",
    runTests: v070Tests.runAllTests
  },
  {
    name: "Data Integrity & Edge Cases",
    runTests: dataIntegrityTests.runAllTests
  },
  {
    name: "Error Recovery & Rollback",
    runTests: errorRecoveryTests.runAllTests
  },
  // Add more test suites here as they're created:
  // {
  //   name: "Helpers",
  //   runTests: helperTests.runAllTests
  // },
];

/**
 * Run all test suites and aggregate results
 */
function runAllTestSuites() {
  console.log("🧪 Running pf1-psionics test suites...\n");

  const suiteResults = [];
  let totalPassed = 0;
  let totalFailed = 0;
  let totalTests = 0;

  for (const suite of TEST_SUITES) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📦 Test Suite: ${suite.name}`);
    console.log("=".repeat(60));

    try {
      const results = suite.runTests();

      suiteResults.push({
        name: suite.name,
        passed: results.passed,
        failed: results.failed,
        total: results.total,
        success: results.failed === 0
      });

      totalPassed += results.passed;
      totalFailed += results.failed;
      totalTests += results.total;
    } catch (error) {
      console.error(`❌ Suite "${suite.name}" crashed:`, error);
      suiteResults.push({
        name: suite.name,
        passed: 0,
        failed: 1,
        total: 1,
        success: false,
        error: error.message
      });
      totalFailed++;
      totalTests++;
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 OVERALL RESULTS");
  console.log("=".repeat(60));

  for (const result of suiteResults) {
    const icon = result.success ? "✅" : "❌";
    console.log(`${icon} ${result.name}: ${result.passed}/${result.total} passed`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }

  console.log("\n" + "-".repeat(60));
  console.log(`Total: ${totalPassed} passed, ${totalFailed} failed (${totalTests} tests)`);
  console.log("-".repeat(60));

  if (totalFailed === 0) {
    console.log("\n🎉 All tests passed!");
  } else {
    console.log(`\n⚠️  ${totalFailed} test(s) failed`);
  }

  return {
    passed: totalPassed,
    failed: totalFailed,
    total: totalTests,
    suites: suiteResults
  };
}

// Run all test suites
try {
  const results = runAllTestSuites();

  // Exit with error code if any tests failed
  process.exit(results.failed > 0 ? 1 : 0);
} finally {
  teardownMocks();
}
