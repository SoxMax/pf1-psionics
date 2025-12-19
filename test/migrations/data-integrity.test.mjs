/**
 * Tests for data integrity and edge cases during migrations
 *
 * This test suite validates that migrations handle malformed, corrupted,
 * or unusual data gracefully without losing information or failing silently.
 */

import { describe, it, expect } from "vitest";
import { PowerModel } from "../../scripts/dataModels/item/power-model.mjs";

describe("PowerModel.migrateData (data integrity)", () => {
  it("Handles non-array augments gracefully", () => {
    const source = { augments: "not_an_array", actions: [{ _id: "act1", name: "Test Action" }] };
    const migrated = PowerModel.migrateData(source);
    expect(migrated.augments).toBeUndefined();
    expect(migrated.actions?.length).toBe(1);
  });

  it("Handles null augments", () => {
    const source = { augments: null, actions: [{ _id: "act1" }] };
    const migrated = PowerModel.migrateData(source);
    expect(migrated.augments).toBeUndefined();
  });

  it("Handles undefined augments", () => {
    const source = { augments: undefined, actions: [{ _id: "act1" }] };
    const migrated = PowerModel.migrateData(source);
    expect(migrated.augments).toBeUndefined();
  });

  it("Preserves augment _id fields exactly", () => {
    const source = {
      augments: [
        { _id: "aug_original_id_123", name: "Damage", cost: 1 },
        { _id: "aA_bB_cC123XyZ", name: "Healing", cost: 2 }
      ],
      actions: [{ _id: "act1" }]
    };

    const migrated = PowerModel.migrateData(source);
    expect(migrated.actions[0].augments[0]._id).toBe("aug_original_id_123");
    expect(migrated.actions[0].augments[1]._id).toBe("aA_bB_cC123XyZ");
  });

  it("Deep clones augments (not references)", () => {
    const originalAugments = [
      { _id: "aug1", name: "Test", effects: { damage: "1d6", scaling: { base: 5 } } }
    ];
    const source = { augments: originalAugments, actions: [{ _id: "act1" }, { _id: "act2" }] };

    const migrated = PowerModel.migrateData(source);
    migrated.actions[0].augments[0].effects.damage = "2d6";
    migrated.actions[0].augments[0].effects.scaling.base = 10;

    expect(migrated.actions[1].augments[0].effects.damage).toBe("1d6");
    expect(migrated.actions[1].augments[0].effects.scaling.base).toBe(5);
    expect(originalAugments[0].effects.damage).toBe("1d6");
  });

  it("Handles augments with missing critical fields", () => {
    const source = {
      augments: [
        { name: "Damage", cost: 1 },
        { _id: "aug2", cost: 2 },
        { _id: "aug3", name: "Test" }
      ],
      actions: [{ _id: "act1" }]
    };

    const migrated = PowerModel.migrateData(source);
    expect(migrated.actions[0].augments?.length).toBe(3);
    expect(migrated.actions[0].augments[0].name).toBe("Damage");
    expect(migrated.actions[0].augments[1].cost).toBe(2);
  });

  it("Handles augments with extra/unknown fields", () => {
    const source = {
      augments: [
        {
          _id: "aug1",
          name: "Complex",
          cost: 1,
          effects: { damageBonus: "1d6" },
          metadata: { source: "book", page: 42 },
          customField: "should be preserved",
          nested: { deep: { structure: "with many levels" } }
        }
      ],
      actions: [{ _id: "act1" }]
    };

    const migrated = PowerModel.migrateData(source);
    const aug = migrated.actions[0].augments[0];
    expect(aug._id).toBe("aug1");
    expect(aug.name).toBe("Complex");
    expect(aug.cost).toBe(1);
    expect(aug.metadata.source).toBe("book");
    expect(aug.metadata.page).toBe(42);
    expect(aug.customField).toBe("should be preserved");
    expect(aug.nested.deep.structure).toBe("with many levels");
  });

  it("Handles actions array with null/undefined entries", () => {
    const source = {
      augments: [{ _id: "aug1", name: "Test", cost: 1 }],
      actions: [{ _id: "act1" }, null, { _id: "act2" }, undefined]
    };

    expect(() => PowerModel.migrateData(source)).toThrow();
  });

  it("Handles empty augments array", () => {
    const source = {
      augments: [],
      actions: [{ _id: "act1" }, { _id: "act2" }]
    };

    const migrated = PowerModel.migrateData(source);
    expect(migrated.actions[0].augments).toBeUndefined();
    expect(migrated.actions[1].augments).toBeUndefined();
    expect(migrated.augments).toBeUndefined();
  });

  it("Handles power with no actions", () => {
    const source = {
      augments: [{ _id: "aug1", name: "Test", cost: 1 }],
      actions: undefined
    };

    const migrated = PowerModel.migrateData(source);
    expect(migrated.augments).toBeUndefined();
    expect(migrated).toBeDefined();
  });

  it("Handles empty actions array", () => {
    const source = {
      augments: [{ _id: "aug1", name: "Test", cost: 1 }],
      actions: []
    };

    const migrated = PowerModel.migrateData(source);
    expect(migrated.augments).toBeUndefined();
    expect(Array.isArray(migrated.actions)).toBe(true);
    expect(migrated.actions.length).toBe(0);
  });

  it("Preserves special characters in augment names", () => {
    const source = {
      augments: [
        { _id: "aug1", name: 'Test "with quotes" and \'apostrophes\'', cost: 1 },
        { _id: "aug2", name: "Test with \n newlines \t and tabs", cost: 1 },
        { _id: "aug3", name: "Test with unicode: 日本語 🎮 ©®™", cost: 1 }
      ],
      actions: [{ _id: "act1" }]
    };

    const migrated = PowerModel.migrateData(source);
    expect(migrated.actions[0].augments[0].name).toBe('Test "with quotes" and \'apostrophes\'');
    expect(migrated.actions[0].augments[1].name).toBe("Test with \n newlines \t and tabs");
    expect(migrated.actions[0].augments[2].name).toBe("Test with unicode: 日本語 🎮 ©®™");
  });

  it("Preserves numeric/boolean/object cost values", () => {
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
    expect(migrated.actions[0].augments[0].cost).toBe(1);
    expect(migrated.actions[0].augments[1].cost).toBe(1.5);
    expect(migrated.actions[0].augments[2].cost).toBe(0);
    expect(migrated.actions[0].augments[3].cost).toBe(-1);
  });
});
