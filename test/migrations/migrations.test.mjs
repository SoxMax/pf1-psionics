/**
 * Unit tests for pf1-psionics migrations
 *
 * These tests can run:
 * 1. In Foundry via Quench (if available)
 * 2. Standalone via Node.js for CI/CD
 */

import { PowerModel } from "../../scripts/dataModels/item/power-model.mjs";

/**
 * Test PowerModel.migrateData() - v0.7.0 augments migration
 */
export function testPowerModelMigrateData() {
  const tests = [];

  // Test 1: Migrate augments from power level to action level
  tests.push({
    name: "v0.7.0: Move augments from system.augments to system.actions[].augments",
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

  // Test 2: Skip migration if no augments
  tests.push({
    name: "v0.7.0: Skip migration if no augments field",
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

  // Test 3: Skip migration if augments is empty
  tests.push({
    name: "v0.7.0: Skip migration if augments array is empty",
    fn: () => {
      const source = {
        augments: [],
        actions: [
          {
            _id: "action_1",
            name: "Test Action"
          }
        ]
      };

      const migrated = PowerModel.migrateData(source);

      // Empty augments should be removed
      if (migrated.augments !== undefined) {
        throw new Error("Expected empty augments to be removed");
      }

      // Should not add empty augments to actions
      if (migrated.actions[0].augments !== undefined) {
        throw new Error("Expected no augments to be added to action");
      }
    }
  });

  // Test 4: Don't overwrite existing action augments
  tests.push({
    name: "v0.7.0: Don't overwrite existing action augments",
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

  // Test 5: Handle power with no actions
  tests.push({
    name: "v0.7.0: Handle power with no actions gracefully",
    fn: () => {
      const source = {
        augments: [
          {
            _id: "test_augment",
            name: "Test Augment",
            cost: 2
          }
        ]
      };

      const migrated = PowerModel.migrateData(source);

      // Augments should still be removed even if no actions exist
      if (migrated.augments !== undefined) {
        throw new Error("Expected augments to be removed even without actions");
      }
    }
  });

  return tests;
}

/**
 * Test v0.7.0 eager migration helper function
 * Note: This tests the migration logic, not the actual item.update() calls
 */
export function testV070EagerMigration() {
  const tests = [];

  tests.push({
    name: "v0.7.0 Eager: Detect items needing migration",
    fn: () => {
      // Mock item with old-style augments
      const mockItem = {
        type: "pf1-psionics.power",
        name: "Test Power",
        _source: {
          system: {
            augments: [
              { _id: "aug1", name: "Augment 1", cost: 1 }
            ],
            actions: [
              { _id: "act1", name: "Action 1" }
            ]
          }
        }
      };

      // Check if item needs migration
      const needsMigration =
        mockItem._source.system?.augments &&
        Array.isArray(mockItem._source.system.augments) &&
        mockItem._source.system.augments.length > 0;

      if (!needsMigration) {
        throw new Error("Expected item to need migration");
      }
    }
  });

  tests.push({
    name: "v0.7.0 Eager: Skip items without augments",
    fn: () => {
      // Mock item without augments
      const mockItem = {
        type: "pf1-psionics.power",
        name: "Test Power",
        _source: {
          system: {
            actions: [
              { _id: "act1", name: "Action 1" }
            ]
          }
        }
      };

      // Check if item needs migration
      const needsMigration =
        mockItem._source.system?.augments &&
        Array.isArray(mockItem._source.system.augments) &&
        mockItem._source.system.augments.length > 0;

      if (needsMigration) {
        throw new Error("Expected item to not need migration");
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
    ...testPowerModelMigrateData(),
    ...testV070EagerMigration()
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
          it("v0.7.0: Move augments from power to actions", function () {
            const source = {
              augments: [{ _id: "aug1", name: "Test", cost: 1 }],
              actions: [{ _id: "act1", name: "Action" }]
            };

            const migrated = PowerModel.migrateData(source);

            assert.isUndefined(migrated.augments, "augments should be removed");
            assert.isDefined(migrated.actions[0].augments, "action should have augments");
            assert.lengthOf(migrated.actions[0].augments, 1, "action should have 1 augment");
          });

          it("v0.7.0: Skip if no augments", function () {
            const source = {
              actions: [{ _id: "act1", name: "Action" }]
            };

            const migrated = PowerModel.migrateData(source);

            assert.isUndefined(migrated.actions[0].augments, "should not add augments");
          });

          it("v0.7.0: Don't overwrite existing action augments", function () {
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
