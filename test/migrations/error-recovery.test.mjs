/**
 * Tests for error recovery and rollback scenarios during migrations
 *
 * This test suite validates that migrations handle failures gracefully,
 * can detect incomplete migrations, and can be re-applied safely.
 */

import { describe, it, expect } from "vitest";
import { PowerModel } from "../../scripts/dataModels/item/power-model.mjs";

describe("PowerModel.migrateData (error recovery)", () => {
  it("Detects incomplete migration (some actions augmented, some not)", () => {
    const partiallyMigrated = {
      augments: undefined,
      actions: [
        { _id: "act1", augments: [{ _id: "aug1", cost: 1 }] },
        { _id: "act2", augments: undefined }
      ]
    };

    const isInconsistentMigration = (power) => {
      if (!power.actions || !Array.isArray(power.actions)) return false;
      const hasAugments = power.actions.filter(a => a?.augments && a.augments.length > 0).length;
      const noAugments = power.actions.filter(a => !a?.augments || a.augments.length === 0).length;
      return hasAugments > 0 && noAugments > 0;
    };

    expect(isInconsistentMigration(partiallyMigrated)).toBe(true);
  });

  it("Re-applying migration doesn't duplicate augments", () => {
    const alreadyMigrated = {
      actions: [
        { _id: "act1", augments: [{ _id: "aug1", name: "Damage", cost: 1 }] },
        { _id: "act2", augments: [{ _id: "aug1", name: "Damage", cost: 1 }] }
      ]
    };

    const remigrated = PowerModel.migrateData(alreadyMigrated);
    expect(remigrated.actions[0].augments.length).toBe(1);
    expect(remigrated.actions[1].augments.length).toBe(1);
  });

  it("Incomplete migration can be fixed by running again", () => {
    const incomplete = {
      augments: [{ _id: "aug1", name: "Power Aug", cost: 1 }],
      actions: [
        { _id: "act1", augments: undefined },
        { _id: "act2", augments: undefined }
      ]
    };

    const afterMigration = PowerModel.migrateData(incomplete);
    expect(afterMigration.actions[0].augments?.length).toBeGreaterThan(0);
    expect(afterMigration.actions[1].augments?.length).toBeGreaterThan(0);
    expect(afterMigration.augments).toBeUndefined();
  });

  it("Detects if old augments field wasn't deleted", () => {
    const partialDelete = {
      augments: [{ _id: "aug1", name: "Old", cost: 1 }],
      actions: [{ _id: "act1", augments: [{ _id: "aug1", name: "Old", cost: 1 }] }]
    };

    const hasPartialDeletion = (power) => {
      return power.augments !== undefined &&
        power.actions && Array.isArray(power.actions) &&
        power.actions.some(a => a?.augments && a.augments.length > 0);
    };

    expect(hasPartialDeletion(partialDelete)).toBe(true);
  });

  it("Validates augment structure", () => {
    const validateAugment = (aug) => {
      if (!aug || typeof aug !== "object") return false;
      if (typeof aug._id !== "string" || aug._id.length === 0) return false;
      if (typeof aug.name !== "string" || aug.name.length === 0) return false;
      if (typeof aug.cost !== "number" || aug.cost < 0) return false;
      return true;
    };

    expect(validateAugment({ _id: "aug1", name: "Test", cost: 1 })).toBe(true);
    expect(validateAugment({ name: "Test", cost: 1 })).toBe(false);
    expect(validateAugment({ _id: "", name: "Test", cost: 1 })).toBe(false);
    expect(validateAugment({ _id: "aug1", cost: 1 })).toBe(false);
    expect(validateAugment({ _id: "aug1", name: "Test", cost: -1 })).toBe(false);
  });

  it("Can validate all augments in a power", () => {
    const validateAugments = (augments) => {
      if (!Array.isArray(augments)) return false;
      return augments.every(aug => aug && typeof aug === "object" &&
        typeof aug._id === "string" && aug._id.length > 0 &&
        typeof aug.name === "string" && aug.name.length > 0 &&
        typeof aug.cost === "number" && aug.cost >= 0);
    };

    expect(validateAugments([
      { _id: "aug1", name: "Test1", cost: 1 },
      { _id: "aug2", name: "Test2", cost: 2 }
    ])).toBe(true);

    expect(validateAugments([
      { _id: "aug1", name: "Test1", cost: 1 },
      { _id: "aug2", cost: 2 }
    ])).toBe(false);

    expect(validateAugments([])).toBe(true);
  });

  it("Detects corrupted action structure", () => {
    const isValidAction = (action) => {
      if (!action || typeof action !== "object") return false;
      if (typeof action._id !== "string") return false;
      if (action.augments !== undefined && !Array.isArray(action.augments)) return false;
      return true;
    };

    expect(isValidAction({ _id: "act1" })).toBe(true);
    expect(isValidAction({ _id: "act1", augments: [] })).toBe(true);
    expect(isValidAction({ _id: "act1", augments: [{ _id: "aug1" }] })).toBe(true);
    expect(isValidAction({})).toBe(false);
    expect(isValidAction({ _id: "act1", augments: "not_array" })).toBe(false);
    expect(isValidAction(null)).toBe(false);
  });

  it("Handles partial array copy", () => {
    const incomplete = {
      augments: [
        { _id: "aug1", name: "Test1", cost: 1 },
        { _id: "aug2", name: "Test2", cost: 1 }
      ],
      actions: [
        { _id: "act1", augments: [{ _id: "aug1" }] },
        { _id: "act2" }
      ]
    };

    const migrated = PowerModel.migrateData(incomplete);
    expect(migrated.actions[1].augments.length).toBe(2);
    expect(migrated.actions[0].augments.length).toBe(1);
  });

  it("Old augments field is removed even if migration errors", () => {
    const source = { augments: [{ _id: "aug1" }], actions: undefined };
    const migrated = PowerModel.migrateData(source);
    expect(migrated.augments).toBeUndefined();
  });

  it("Can detect duplicate augments in same action", () => {
    const hasDuplicateAugments = (action) => {
      if (!action.augments || action.augments.length < 2) return false;
      const ids = action.augments.map(a => a._id);
      return ids.length !== new Set(ids).size;
    };

    expect(hasDuplicateAugments({ _id: "act1", augments: [{ _id: "aug1" }, { _id: "aug2" }] })).toBe(false);
    expect(hasDuplicateAugments({ _id: "act1", augments: [{ _id: "aug1" }, { _id: "aug1" }, { _id: "aug2" }] })).toBe(true);
  });
});
