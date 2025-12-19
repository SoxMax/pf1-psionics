/**
 * Tests for data integrity and edge cases during migrations
 *
 * This test suite validates that migrations handle malformed, corrupted,
 * or unusual data gracefully without losing information or failing silently.
 */

import { PowerModel } from "../../scripts/dataModels/item/power-model.mjs";

export function testDataIntegrity() {
  const tests = [];

  tests.push({
    name: "Data Integrity: Handles non-array augments gracefully",
    fn: () => {
      const source = {
        augments: "not_an_array",  // Malformed - should be array
        actions: [{ _id: "act1", name: "Test Action" }]
      };

      const migrated = PowerModel.migrateData(source);

      // Should handle gracefully (delete malformed field)
      if (migrated.augments !== undefined) {
        throw new Error("Should remove malformed augments field");
      }

      // Actions should not have been modified
      if (!migrated.actions || migrated.actions.length !== 1) {
        throw new Error("Actions should be unchanged when augments are malformed");
      }
    }
  });

  tests.push({
    name: "Data Integrity: Handles null augments",
    fn: () => {
      const source = {
        augments: null,
        actions: [{ _id: "act1" }]
      };

      const migrated = PowerModel.migrateData(source);

      if (migrated.augments !== undefined) {
        throw new Error("Should remove null augments field");
      }
    }
  });

  tests.push({
    name: "Data Integrity: Handles undefined augments",
    fn: () => {
      const source = {
        augments: undefined,
        actions: [{ _id: "act1" }]
      };

      const migrated = PowerModel.migrateData(source);

      // Should not throw, should be unchanged
      if (migrated.augments !== undefined) {
        throw new Error("Should leave undefined augments as undefined");
      }
    }
  });

  tests.push({
    name: "Data Integrity: Preserves augment _id fields exactly",
    fn: () => {
      const source = {
        augments: [
          { _id: "aug_original_id_123", name: "Damage", cost: 1 },
          { _id: "aA_bB_cC123XyZ", name: "Healing", cost: 2 }
        ],
        actions: [{ _id: "act1" }]
      };

      const migrated = PowerModel.migrateData(source);

      if (migrated.actions[0].augments[0]._id !== "aug_original_id_123") {
        throw new Error("First augment ID was changed");
      }
      if (migrated.actions[0].augments[1]._id !== "aA_bB_cC123XyZ") {
        throw new Error("Second augment ID was changed");
      }
    }
  });

  tests.push({
    name: "Data Integrity: Deep clones augments (not references)",
    fn: () => {
      const originalAugments = [
        { _id: "aug1", name: "Test", effects: { damage: "1d6", scaling: { base: 5 } } }
      ];

      const source = {
        augments: originalAugments,
        actions: [{ _id: "act1" }, { _id: "act2" }]
      };

      const migrated = PowerModel.migrateData(source);

      // Modify one action's augment deeply
      migrated.actions[0].augments[0].effects.damage = "2d6";
      migrated.actions[0].augments[0].effects.scaling.base = 10;

      // Verify other action's augment is not affected
      if (migrated.actions[1].augments[0].effects.damage !== "1d6") {
        throw new Error("Deep clone failed - damage was modified in reference");
      }
      if (migrated.actions[1].augments[0].effects.scaling.base !== 5) {
        throw new Error("Deep clone failed - nested scaling was modified in reference");
      }

      // Verify original is also not affected
      if (originalAugments[0].effects.damage !== "1d6") {
        throw new Error("Deep clone failed - original was modified");
      }
    }
  });

  tests.push({
    name: "Data Integrity: Handles augments with missing critical fields",
    fn: () => {
      const source = {
        augments: [
          { name: "Damage", cost: 1 },  // Missing _id
          { _id: "aug2", cost: 2 },  // Missing name
          { _id: "aug3", name: "Test" }  // Missing cost
        ],
        actions: [{ _id: "act1" }]
      };

      const migrated = PowerModel.migrateData(source);

      // Should still migrate (PF1 will handle validation)
      if (!migrated.actions[0].augments || migrated.actions[0].augments.length !== 3) {
        throw new Error("Should migrate all augments even with missing fields");
      }

      // Verify each augment is there even if incomplete
      if (migrated.actions[0].augments[0].name !== "Damage") {
        throw new Error("Augment without _id should still be migrated");
      }
      if (migrated.actions[0].augments[1].cost !== 2) {
        throw new Error("Augment without name should still be migrated");
      }
    }
  });

  tests.push({
    name: "Data Integrity: Handles augments with extra/unknown fields",
    fn: () => {
      const source = {
        augments: [
          {
            _id: "aug1",
            name: "Complex",
            cost: 1,
            effects: { damageBonus: "1d6" },
            metadata: { source: "book", page: 42 },
            customField: "should be preserved",
            nested: {
              deep: {
                structure: "with many levels"
              }
            }
          }
        ],
        actions: [{ _id: "act1" }]
      };

      const migrated = PowerModel.migrateData(source);

      const aug = migrated.actions[0].augments[0];

      // Verify standard fields
      if (aug._id !== "aug1") throw new Error("Standard field _id not preserved");
      if (aug.name !== "Complex") throw new Error("Standard field name not preserved");
      if (aug.cost !== 1) throw new Error("Standard field cost not preserved");

      // Verify custom fields are preserved
      if (aug.metadata.source !== "book") throw new Error("Custom metadata.source not preserved");
      if (aug.metadata.page !== 42) throw new Error("Custom metadata.page not preserved");
      if (aug.customField !== "should be preserved") throw new Error("Custom customField not preserved");
      if (aug.nested.deep.structure !== "with many levels") throw new Error("Nested structure not preserved");
    }
  });

  tests.push({
    name: "Data Integrity: Handles actions array with null/undefined entries",
    fn: () => {
      const source = {
        augments: [{ _id: "aug1", name: "Test", cost: 1 }],
        actions: [
          { _id: "act1" },
          null,  // Null entry
          { _id: "act2" },
          undefined  // Undefined entry (would be in array)
        ]
      };

      // Should handle gracefully - either skip nulls or process them
      // The important thing is it doesn't throw
      try {
        const migrated = PowerModel.migrateData(source);
        // If it completes, test passes
      } catch (error) {
        // If migration throws on malformed actions, that's acceptable
        // but it should be a clear error message
        if (!error.message.includes("action") && !error.message.includes("null")) {
          throw new Error(`Unexpected error: ${error.message}`);
        }
      }
    }
  });

  tests.push({
    name: "Data Integrity: Handles empty augments array",
    fn: () => {
      const source = {
        augments: [],
        actions: [
          { _id: "act1" },
          { _id: "act2" }
        ]
      };

      const migrated = PowerModel.migrateData(source);

      // Empty augments should not be added to actions
      if (migrated.actions[0].augments !== undefined) {
        throw new Error("Empty augments array should not be copied to actions");
      }
      if (migrated.actions[1].augments !== undefined) {
        throw new Error("Empty augments array should not be copied to actions");
      }

      // Old augments field should be removed
      if (migrated.augments !== undefined) {
        throw new Error("Empty augments field should be removed");
      }
    }
  });

  tests.push({
    name: "Data Integrity: Handles power with no actions",
    fn: () => {
      const source = {
        augments: [{ _id: "aug1", name: "Test", cost: 1 }],
        actions: undefined  // No actions
      };

      const migrated = PowerModel.migrateData(source);

      // Augments should still be removed
      if (migrated.augments !== undefined) {
        throw new Error("Augments should be removed even without actions");
      }

      // Should not throw, power remains intact otherwise
      if (migrated === null || migrated === undefined) {
        throw new Error("Migration should return valid source object");
      }
    }
  });

  tests.push({
    name: "Data Integrity: Handles empty actions array",
    fn: () => {
      const source = {
        augments: [{ _id: "aug1", name: "Test", cost: 1 }],
        actions: []  // Empty actions
      };

      const migrated = PowerModel.migrateData(source);

      // Augments should still be removed
      if (migrated.augments !== undefined) {
        throw new Error("Augments should be removed even with empty actions");
      }

      // Actions array should remain empty
      if (!Array.isArray(migrated.actions) || migrated.actions.length !== 0) {
        throw new Error("Empty actions array should remain empty");
      }
    }
  });

  tests.push({
    name: "Data Integrity: Augments with special characters in names",
    fn: () => {
      const source = {
        augments: [
          { _id: "aug1", name: 'Test "with quotes" and \'apostrophes\'', cost: 1 },
          { _id: "aug2", name: "Test with \n newlines \t and tabs", cost: 1 },
          { _id: "aug3", name: "Test with unicode: 日本語 🎮 ©®™", cost: 1 }
        ],
        actions: [{ _id: "act1" }]
      };

      const migrated = PowerModel.migrateData(source);

      if (migrated.actions[0].augments[0].name !== 'Test "with quotes" and \'apostrophes\'') {
        throw new Error("Quotes and apostrophes not preserved");
      }
      if (migrated.actions[0].augments[1].name !== "Test with \n newlines \t and tabs") {
        throw new Error("Newlines and tabs not preserved");
      }
      if (migrated.actions[0].augments[2].name !== "Test with unicode: 日本語 🎮 ©®™") {
        throw new Error("Unicode not preserved");
      }
    }
  });

  tests.push({
    name: "Data Integrity: Augments with numeric/boolean/object cost values",
    fn: () => {
      const source = {
        augments: [
          { _id: "aug1", name: "Int Cost", cost: 1 },
          { _id: "aug2", name: "Float Cost", cost: 1.5 },
          { _id: "aug3", name: "Zero Cost", cost: 0 },
          { _id: "aug4", name: "Negative Cost", cost: -1 }
        ],
        actions: [{ _id: "act1" }]
      };

      const migrated = PowerModel.migrateData(source);

      if (migrated.actions[0].augments[0].cost !== 1) throw new Error("Int cost not preserved");
      if (migrated.actions[0].augments[1].cost !== 1.5) throw new Error("Float cost not preserved");
      if (migrated.actions[0].augments[2].cost !== 0) throw new Error("Zero cost not preserved");
      if (migrated.actions[0].augments[3].cost !== -1) throw new Error("Negative cost not preserved");
    }
  });

  return tests;
}

/**
 * Run all data integrity tests
 */
export function runAllTests() {
  const allTests = testDataIntegrity();

  let passed = 0;
  let failed = 0;

  console.log("🧪 Running data integrity tests...\n");

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

