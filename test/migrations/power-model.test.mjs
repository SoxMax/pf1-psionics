/**
 * Unit tests for pf1-psionics migrations
 *
 * These tests can run:
 * 1. In Foundry via Quench (if available)
 * 2. Standalone via Node.js for CI/CD
 *
 * Note: v0.7.0 migration tests are now split into specialized test suites:
 * - v0.7.0.test.mjs: Migration implementation and update object construction
 * - data-integrity.test.mjs: Edge cases and malformed data handling
 * - error-recovery.test.mjs: Error scenarios and recovery mechanisms
 */

import { PowerModel } from "../../scripts/dataModels/item/power-model.mjs";

/**
 * Test PowerModel.migrateData() - Core migration functionality
 *
 * These tests verify the core PowerModel.migrateData() method works correctly.
 * Detailed v0.7.0 implementation tests are in v0.7.0.test.mjs.
 * Edge case handling is in data-integrity.test.mjs.
 * Error recovery is in error-recovery.test.mjs.
 */
export function testPowerModelMigrateData() {
  const tests = [];

  // Test 1: Basic migration - augments are copied to actions
  tests.push({
    name: "PowerModel: Basic augment migration to actions",
    fn: () => {
      const source = {
        augments: [
          {
            _id: "test_augment_1",
            name: "Test Augment",
            cost: 2,
            effects: { damageBonus: "2d6" }
          }
        ],
        actions: [
          {
            _id: "action_1",
            name: "Test Action",
            actionType: "rsak"
          },
          {
            _id: "action_2",
            name: "Second Action",
            actionType: "save"
          }
        ]
      };

      const migrated = PowerModel.migrateData(source);

      // Old augments should be removed
      if (migrated.augments !== undefined) {
        throw new Error("Expected augments field to be removed");
      }

      // Each action should have the augments
      if (!migrated.actions[0].augments || migrated.actions[0].augments.length !== 1) {
        throw new Error("Expected action 1 to have augments");
      }
      if (!migrated.actions[1].augments || migrated.actions[1].augments.length !== 1) {
        throw new Error("Expected action 2 to have augments");
      }

      // Augments should be deep cloned, not referenced
      if (migrated.actions[0].augments === migrated.actions[1].augments) {
        throw new Error("Expected augments to be deep cloned, not shared");
      }

      // Augment data should be preserved
      if (migrated.actions[0].augments[0].name !== "Test Augment") {
        throw new Error("Expected augment data to be preserved");
      }
    }
  });

  // Test 2: No augments at power level - nothing to migrate
  tests.push({
    name: "PowerModel: Skip migration if no augments",
    fn: () => {
      const source = {
        actions: [
          {
            _id: "action_1",
            name: "Test Action"
          }
        ]
      };

      const migrated = PowerModel.migrateData(source);

      // Should not add augments if they didn't exist
      if (migrated.actions[0].augments !== undefined) {
        throw new Error("Expected no augments to be added");
      }
    }
  });

  // Test 3: Augments exist but don't overwrite existing action augments
  tests.push({
    name: "PowerModel: Don't overwrite existing action augments",
    fn: () => {
      const source = {
        augments: [
          {
            _id: "power_augment",
            name: "Power Level Augment",
            cost: 2
          }
        ],
        actions: [
          {
            _id: "action_1",
            name: "Test Action",
            augments: [
              {
                _id: "action_augment",
                name: "Action Level Augment",
                cost: 1
              }
            ]
          },
          {
            _id: "action_2",
            name: "Second Action",
            augments: []
          }
        ]
      };

      const migrated = PowerModel.migrateData(source);

      // Action 1 should keep its existing augment
      if (migrated.actions[0].augments.length !== 1) {
        throw new Error("Expected action 1 to keep existing augments");
      }
      if (migrated.actions[0].augments[0]._id !== "action_augment") {
        throw new Error("Expected action 1 to keep its original augment");
      }

      // Action 2 with empty augments should receive the power augments
      if (migrated.actions[1].augments.length !== 1) {
        throw new Error("Expected action 2 to receive power augments");
      }
      if (migrated.actions[1].augments[0]._id !== "power_augment") {
        throw new Error("Expected action 2 to receive power level augment");
      }
    }
  });

  return tests;
}

/**
 * Run all tests
 */
export function runAllTests() {
  const allTests = [
    ...testPowerModelMigrateData()
  ];

  let passed = 0;
  let failed = 0;

  console.log("🧪 Running pf1-psionics migration tests...\n");

  for (const test of allTests) {
    try {
      test.fn();
      console.log(`✅ PASS: ${test.name}`);
      passed++;
    } catch (error) {
      console.error(`❌ FAIL: ${test.name}`);
      console.error(`   ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

  return { passed, failed, total: allTests.length };
}

/**
 * Register tests with Quench (if available in Foundry)
 */
export function registerQuenchTests() {
  if (typeof Hooks === "undefined" || typeof game === "undefined") {
    console.log("⚠️  Quench registration skipped (not in Foundry environment)");
    return;
  }

  Hooks.on("quenchReady", (quench) => {
    quench.registerBatch(
      "pf1-psionics.migrations",
      (context) => {
        const { describe, it, assert } = context;

        describe("PowerModel.migrateData()", function () {
          it("Basic augment migration to actions", function () {
            const source = {
              augments: [{ _id: "aug1", name: "Test", cost: 1 }],
              actions: [{ _id: "act1", name: "Action" }]
            };

            const migrated = PowerModel.migrateData(source);

            assert.isUndefined(migrated.augments, "augments should be removed");
            assert.isDefined(migrated.actions[0].augments, "action should have augments");
            assert.lengthOf(migrated.actions[0].augments, 1, "action should have 1 augment");
          });

          it("Skip migration if no augments", function () {
            const source = {
              actions: [{ _id: "act1", name: "Action" }]
            };

            const migrated = PowerModel.migrateData(source);

            assert.isUndefined(migrated.actions[0].augments, "should not add augments");
          });

          it("Don't overwrite existing action augments", function () {
            const source = {
              augments: [{ _id: "power_aug", name: "Power Aug", cost: 2 }],
              actions: [
                { _id: "act1", name: "Action", augments: [{ _id: "action_aug", name: "Action Aug", cost: 1 }] }
              ]
            };

            const migrated = PowerModel.migrateData(source);

            assert.lengthOf(migrated.actions[0].augments, 1, "should keep existing augments");
            assert.equal(migrated.actions[0].augments[0]._id, "action_aug", "should preserve original augment");
          });
        });
      },
      { displayName: "PF1 Psionics: Migrations" }
    );
  });
}


