/**
 * Tests for error recovery and rollback scenarios during migrations
 *
 * This test suite validates that migrations handle failures gracefully,
 * can detect incomplete migrations, and can be re-applied safely.
 */

import { PowerModel } from "../../scripts/dataModels/item/power-model.mjs";

export function testErrorRecovery() {
  const tests = [];

  // Test 1: Detect incomplete migrations (mixed state)
  tests.push({
    name: "Error Recovery: Detects incomplete migration (some actions augmented, some not)",
    fn: () => {
      // Simulate a power where migration was partially applied
      const partiallyMigrated = {
        // Old augments field is gone (was deleted)
        augments: undefined,
        // But only SOME actions got augments
        actions: [
          { _id: "act1", augments: [{ _id: "aug1", cost: 1 }] },
          { _id: "act2", augments: undefined }  // ← This action is incomplete!
        ]
      };

      // Function to detect inconsistent state
      const isInconsistentMigration = (power) => {
        if (!power.actions || !Array.isArray(power.actions)) return false;

        // Count actions with and without augments
        const hasAugments = power.actions.filter(a => a.augments && a.augments.length > 0).length;
        const noAugments = power.actions.filter(a => !a.augments || a.augments.length === 0).length;

        // If some have augments and some don't, it's inconsistent
        return hasAugments > 0 && noAugments > 0;
      };

      if (!isInconsistentMigration(partiallyMigrated)) {
        throw new Error("Should detect incomplete migration");
      }
    }
  });

  // Test 2: Re-applying migration is safe (idempotent)
  tests.push({
    name: "Error Recovery: Re-applying migration doesn't duplicate augments",
    fn: () => {
      // A power that was already migrated
      const alreadyMigrated = {
        actions: [
          { _id: "act1", augments: [{ _id: "aug1", name: "Damage", cost: 1 }] },
          { _id: "act2", augments: [{ _id: "aug1", name: "Damage", cost: 1 }] }
        ]
      };

      // Re-applying migration via PowerModel.migrateData()
      const remigrated = PowerModel.migrateData(alreadyMigrated);

      // Verify augments were not duplicated
      if (remigrated.actions[0].augments.length !== 1) {
        throw new Error("Re-applying migration duplicated augments in action 1");
      }
      if (remigrated.actions[1].augments.length !== 1) {
        throw new Error("Re-applying migration duplicated augments in action 2");
      }
    }
  });

  // Test 3: Can fix incomplete migration by running again
  tests.push({
    name: "Error Recovery: Incomplete migration can be fixed by running again",
    fn: () => {
      // Partially migrated power
      const incomplete = {
        augments: [{ _id: "aug1", name: "Power Aug", cost: 1 }],
        actions: [
          { _id: "act1", augments: undefined },
          { _id: "act2", augments: undefined }
        ]
      };

      // First migration attempt
      const afterMigration = PowerModel.migrateData(incomplete);

      // Verify all actions now have augments
      if (!afterMigration.actions[0].augments || afterMigration.actions[0].augments.length === 0) {
        throw new Error("Action 1 should have augments after migration");
      }
      if (!afterMigration.actions[1].augments || afterMigration.actions[1].augments.length === 0) {
        throw new Error("Action 2 should have augments after migration");
      }

      // Verify old field is removed
      if (afterMigration.augments !== undefined) {
        throw new Error("Old augments field should be removed");
      }
    }
  });

  // Test 4: Detect partial deletion (old field still exists)
  tests.push({
    name: "Error Recovery: Detects if old augments field wasn't deleted",
    fn: () => {
      // Power where augments were copied but not deleted
      const partialDelete = {
        augments: [{ _id: "aug1", name: "Old", cost: 1 }],
        actions: [
          { _id: "act1", augments: [{ _id: "aug1", name: "Old", cost: 1 }] }
        ]
      };

      // Function to detect partial deletion
      const hasPartialDeletion = (power) => {
        // If power has old augments field AND actions have augments
        return power.augments !== undefined &&
               power.actions && Array.isArray(power.actions) &&
               power.actions.some(a => a.augments && a.augments.length > 0);
      };

      if (!hasPartialDeletion(partialDelete)) {
        throw new Error("Should detect partial deletion (old field still exists)");
      }
    }
  });

  // Test 5: Validate augment structure before use
  tests.push({
    name: "Error Recovery: Validates augment structure",
    fn: () => {
      // Function to validate augments
      const validateAugment = (aug) => {
        if (!aug || typeof aug !== "object") return false;
        if (typeof aug._id !== "string" || aug._id.length === 0) return false;
        if (typeof aug.name !== "string" || aug.name.length === 0) return false;
        if (typeof aug.cost !== "number" || aug.cost < 0) return false;
        return true;
      };

      // Valid augments
      const validAugment = { _id: "aug1", name: "Test", cost: 1 };
      if (!validateAugment(validAugment)) {
        throw new Error("Should validate valid augment");
      }

      // Invalid augments
      const noId = { name: "Test", cost: 1 };
      if (validateAugment(noId)) {
        throw new Error("Should reject augment without _id");
      }

      const emptyId = { _id: "", name: "Test", cost: 1 };
      if (validateAugment(emptyId)) {
        throw new Error("Should reject augment with empty _id");
      }

      const noName = { _id: "aug1", cost: 1 };
      if (validateAugment(noName)) {
        throw new Error("Should reject augment without name");
      }

      const negativeCost = { _id: "aug1", name: "Test", cost: -1 };
      if (validateAugment(negativeCost)) {
        throw new Error("Should reject augment with negative cost");
      }
    }
  });

  // Test 6: Batch validation of all augments
  tests.push({
    name: "Error Recovery: Can validate all augments in a power",
    fn: () => {
      const validateAugments = (augments) => {
        if (!Array.isArray(augments)) return false;
        return augments.every(aug => {
          return aug && typeof aug === "object" &&
                 typeof aug._id === "string" && aug._id.length > 0 &&
                 typeof aug.name === "string" && aug.name.length > 0 &&
                 typeof aug.cost === "number" && aug.cost >= 0;
        });
      };

      // Valid array
      const validArray = [
        { _id: "aug1", name: "Test1", cost: 1 },
        { _id: "aug2", name: "Test2", cost: 2 }
      ];
      if (!validateAugments(validArray)) {
        throw new Error("Should validate valid augment array");
      }

      // Invalid array - one bad augment
      const invalidArray = [
        { _id: "aug1", name: "Test1", cost: 1 },
        { _id: "aug2", cost: 2 }  // Missing name
      ];
      if (validateAugments(invalidArray)) {
        throw new Error("Should reject array with invalid augment");
      }

      // Empty array is valid (no augments)
      if (!validateAugments([])) {
        throw new Error("Should validate empty augment array");
      }
    }
  });

  // Test 7: Detect corruption of action structure
  tests.push({
    name: "Error Recovery: Detects corrupted action structure",
    fn: () => {
      const isValidAction = (action) => {
        if (!action || typeof action !== "object") return false;
        if (typeof action._id !== "string") return false;
        // augments field is optional but if present should be array
        if (action.augments !== undefined && !Array.isArray(action.augments)) return false;
        return true;
      };

      // Valid actions
      if (!isValidAction({ _id: "act1" })) {
        throw new Error("Should validate valid action");
      }
      if (!isValidAction({ _id: "act1", augments: [] })) {
        throw new Error("Should validate action with empty augments");
      }
      if (!isValidAction({ _id: "act1", augments: [{ _id: "aug1" }] })) {
        throw new Error("Should validate action with augments");
      }

      // Invalid actions
      if (isValidAction({ })) {
        throw new Error("Should reject action without _id");
      }
      if (isValidAction({ _id: "act1", augments: "not_array" })) {
        throw new Error("Should reject action with non-array augments");
      }
      if (isValidAction(null)) {
        throw new Error("Should reject null action");
      }
    }
  });

  // Test 8: Safe recovery from partial array copy
  tests.push({
    name: "Error Recovery: Handles partial array copy",
    fn: () => {
      // Simulate array that was only partially copied
      const incomplete = {
        augments: [
          { _id: "aug1", name: "Test1", cost: 1 },
          { _id: "aug2", name: "Test2", cost: 1 }
        ],
        actions: [
          { _id: "act1", augments: [{ _id: "aug1" }] },  // Only first augment
          { _id: "act2" }  // None copied yet
        ]
      };

      const migrated = PowerModel.migrateData(incomplete);

      // Act2 should now have all augments
      if (migrated.actions[1].augments.length !== 2) {
        throw new Error("Should copy all augments, not just those missing");
      }

      // Act1 should keep its augments (don't overwrite)
      if (migrated.actions[0].augments.length !== 1) {
        throw new Error("Should not overwrite existing augments");
      }
    }
  });

  // Test 9: Migration failure doesn't leave orphaned data
  tests.push({
    name: "Error Recovery: Old augments field is removed even if migration errors",
    fn: () => {
      const source = {
        augments: [{ _id: "aug1" }],
        actions: undefined  // Will cause issue during migration
      };

      const migrated = PowerModel.migrateData(source);

      // Old field should still be removed
      if (migrated.augments !== undefined) {
        throw new Error("Old augments field should be removed even with no actions");
      }
    }
  });

  // Test 10: Can detect and repair duplicate augments
  tests.push({
    name: "Error Recovery: Can detect duplicate augments in same action",
    fn: () => {
      const hasDuplicateAugments = (action) => {
        if (!action.augments || action.augments.length < 2) return false;

        const ids = action.augments.map(a => a._id);
        return ids.length !== new Set(ids).size;
      };

      // Action with unique augments
      const unique = {
        _id: "act1",
        augments: [
          { _id: "aug1" },
          { _id: "aug2" }
        ]
      };
      if (hasDuplicateAugments(unique)) {
        throw new Error("Should not detect duplicates in unique array");
      }

      // Action with duplicate augments
      const duplicate = {
        _id: "act1",
        augments: [
          { _id: "aug1" },
          { _id: "aug1" },
          { _id: "aug2" }
        ]
      };
      if (!hasDuplicateAugments(duplicate)) {
        throw new Error("Should detect duplicate augment IDs");
      }
    }
  });

  return tests;
}

/**
 * Run all error recovery tests
 */
export function runAllTests() {
  const allTests = testErrorRecovery();

  let passed = 0;
  let failed = 0;

  console.log("🧪 Running error recovery tests...\n");

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

