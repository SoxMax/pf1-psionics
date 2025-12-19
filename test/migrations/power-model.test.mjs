import { describe, it, expect } from "vitest";
import { PowerModel } from "../../scripts/dataModels/item/power-model.mjs";

describe("PowerModel.migrateData (migration core)", () => {
  it("Basic augment migration to actions", () => {
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
        { _id: "action_1", name: "Test Action", actionType: "rsak" },
        { _id: "action_2", name: "Second Action", actionType: "save" }
      ]
    };

    const migrated = PowerModel.migrateData(source);

    expect(migrated.augments).toBeUndefined();
    expect(migrated.actions[0].augments?.length).toBe(1);
    expect(migrated.actions[1].augments?.length).toBe(1);
    expect(migrated.actions[0].augments).not.toBe(migrated.actions[1].augments);
    expect(migrated.actions[0].augments?.[0].name).toBe("Test Augment");
  });

  it("Skip migration if no augments", () => {
    const source = { actions: [{ _id: "action_1", name: "Test Action" }] };
    const migrated = PowerModel.migrateData(source);
    expect(migrated.actions[0].augments).toBeUndefined();
  });

  it("Don't overwrite existing action augments", () => {
    const source = {
      augments: [{ _id: "power_augment", name: "Power Level Augment", cost: 2 }],
      actions: [
        {
          _id: "action_1",
          name: "Test Action",
          augments: [{ _id: "action_augment", name: "Action Level Augment", cost: 1 }]
        },
        { _id: "action_2", name: "Second Action", augments: [] }
      ]
    };

    const migrated = PowerModel.migrateData(source);

    expect(migrated.actions[0].augments?.length).toBe(1);
    expect(migrated.actions[0].augments?.[0]._id).toBe("action_augment");
    expect(migrated.actions[1].augments?.length).toBe(1);
    expect(migrated.actions[1].augments?.[0]._id).toBe("power_augment");
  });
});

// Quench registration remains available for Foundry runs
export function registerQuenchTests() {
  if (typeof Hooks === "undefined" || typeof game === "undefined") return;

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
            const source = { actions: [{ _id: "act1", name: "Action" }] };
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
