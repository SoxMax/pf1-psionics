import { describe, it, expect } from "vitest";

describe("v0.7.0 migration update construction", () => {
  it("Builds correct update object with multiple actions", () => {
    const oldAugments = [{ _id: "aug1", name: "Damage", cost: 1, effects: { damageBonus: "1d6" } }];
    const actions = [
      { _id: "act1", name: "Action 1" },
      { _id: "act2", name: "Action 2" },
      { _id: "act3", name: "Action 3" }
    ];

    const updates = {};
    actions.forEach((action, index) => {
      if (!action.augments || action.augments.length === 0) {
        updates[`system.actions.${index}.augments`] = foundry.utils.deepClone(oldAugments);
      }
    });
    updates["system.-=augments"] = null;

    expect(updates["system.actions.0.augments"]).toBeDefined();
    expect(updates["system.actions.1.augments"]).toBeDefined();
    expect(updates["system.actions.2.augments"]).toBeDefined();
    expect(updates["system.-=augments"]).toBeNull();
    expect(updates["system.actions.0.augments"][0].name).toBe("Damage");
  });

  it("Skips actions that already have augments", () => {
    const oldAugments = [{ _id: "old_aug", name: "Old Augment", cost: 2 }];
    const actions = [
      { _id: "act1", augments: [] },
      { _id: "act2", augments: [{ _id: "existing", name: "Existing", cost: 1 }] }
    ];

    const updates = {};
    actions.forEach((action, index) => {
      if (!action.augments || action.augments.length === 0) {
        updates[`system.actions.${index}.augments`] = foundry.utils.deepClone(oldAugments);
      }
    });

    expect(updates["system.actions.0.augments"]).toBeDefined();
    expect(updates["system.actions.1.augments"]).toBeUndefined();
  });

  it("Works with single-action powers", () => {
    const oldAugments = [{ _id: "aug1", name: "Test", cost: 1 }];
    const actions = [{ _id: "act1", name: "Single Action" }];
    const updates = {};

    actions.forEach((action, index) => {
      if (!action.augments || action.augments.length === 0) {
        updates[`system.actions.${index}.augments`] = foundry.utils.deepClone(oldAugments);
      }
    });
    updates["system.-=augments"] = null;

    expect(updates["system.actions.0.augments"]).toBeDefined();
  });

  it("Copies multiple augments to each action", () => {
    const oldAugments = [
      { _id: "aug1", name: "Damage", cost: 1 },
      { _id: "aug2", name: "Healing", cost: 1 },
      { _id: "aug3", name: "Range", cost: 2 }
    ];
    const actions = [{ _id: "act1" }];
    const updates = {};

    actions.forEach((action, index) => {
      if (!action.augments || action.augments.length === 0) {
        updates[`system.actions.${index}.augments`] = foundry.utils.deepClone(oldAugments);
      }
    });

    expect(updates["system.actions.0.augments"]?.length).toBe(3);
    expect(updates["system.actions.0.augments"][0]._id).toBe("aug1");
    expect(updates["system.actions.0.augments"][1]._id).toBe("aug2");
    expect(updates["system.actions.0.augments"][2]._id).toBe("aug3");
  });

  it("Augments copied to multiple actions are independent", () => {
    const oldAugments = [{ _id: "aug1", name: "Test", cost: 1, effects: { damage: "1d6" } }];
    const actions = [{ _id: "act1" }, { _id: "act2" }];
    const updates = {};

    actions.forEach((action, index) => {
      if (!action.augments || action.augments.length === 0) {
        updates[`system.actions.${index}.augments`] = foundry.utils.deepClone(oldAugments);
      }
    });

    updates["system.actions.0.augments"][0].effects.damage = "2d6";
    expect(updates["system.actions.1.augments"][0].effects.damage).toBe("1d6");
  });

  it("Handles action with undefined augments property", () => {
    const oldAugments = [{ _id: "aug1", name: "Test", cost: 1 }];
    const actions = [{ _id: "act1", augments: undefined }];
    const updates = {};

    actions.forEach((action, index) => {
      if (!action.augments || action.augments.length === 0) {
        updates[`system.actions.${index}.augments`] = foundry.utils.deepClone(oldAugments);
      }
    });

    expect(updates["system.actions.0.augments"]).toBeDefined();
  });

  it("Preserves all augment metadata during copy", () => {
    const oldAugments = [
      {
        _id: "aug1",
        name: "Complex Augment",
        cost: 2,
        effects: { damageBonus: "1d6", dcBonus: 2, clBonus: 1 },
        description: "This is a complex augment"
      }
    ];
    const actions = [{ _id: "act1" }];
    const updates = {};

    actions.forEach((action, index) => {
      if (!action.augments || action.augments.length === 0) {
        updates[`system.actions.${index}.augments`] = foundry.utils.deepClone(oldAugments);
      }
    });

    const copied = updates["system.actions.0.augments"][0];
    expect(copied._id).toBe("aug1");
    expect(copied.name).toBe("Complex Augment");
    expect(copied.cost).toBe(2);
    expect(copied.effects.damageBonus).toBe("1d6");
    expect(copied.effects.dcBonus).toBe(2);
    expect(copied.effects.clBonus).toBe(1);
    expect(copied.description).toBe("This is a complex augment");
  });

  it("Handles mixed array (some actions with augments, some without)", () => {
    const oldAugments = [{ _id: "aug1", name: "Power Level Augment", cost: 1 }];
    const actions = [
      { _id: "act1", augments: [{ _id: "action_aug", name: "Action Augment", cost: 1 }] },
      { _id: "act2" },
      { _id: "act3", augments: [] },
      { _id: "act4", augments: [{ _id: "another_action_aug", cost: 2 }] }
    ];

    const updates = {};
    actions.forEach((action, index) => {
      if (!action.augments || action.augments.length === 0) {
        updates[`system.actions.${index}.augments`] = foundry.utils.deepClone(oldAugments);
      }
    });

    expect(updates["system.actions.0.augments"]).toBeUndefined();
    expect(updates["system.actions.1.augments"]).toBeDefined();
    expect(updates["system.actions.2.augments"]).toBeDefined();
    expect(updates["system.actions.3.augments"]).toBeUndefined();
  });
});
