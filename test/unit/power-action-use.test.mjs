import { afterAll, beforeAll, expect, it, vi } from "vitest";

vi.mock("../../scripts/components/_module.mjs", () => ({}));

const hooks = new Map();
const listeners = new Map();

beforeAll(async () => {
  const registerHook = (name, callback) => hooks.set(name, callback);
  vi.stubGlobal("Hooks", { on: registerHook, once: registerHook });
  vi.stubGlobal("libWrapper", {
    register: (_moduleId, name, callback) => listeners.set(name, callback),
  });
  vi.stubGlobal("jQuery", class {});
  vi.stubGlobal("ui", { notifications: { error: vi.fn() } });
  vi.stubGlobal("foundry", {
    applications: { handlebars: { renderTemplate: async () => "" } },
  });

  await import("../../scripts/documents/action/attack-dialog.mjs");
  await import("../../scripts/documents/action/action-use.mjs");
  hooks.get("libWrapper.Ready")();
});

afterAll(() => vi.unstubAllGlobals());

it.each([
  { edits: ["3", "2"], offset: 2, cost: 6, allowed: true },
  { edits: ["3", ""], offset: null, cost: 4, allowed: true },
  { edits: ["2", "3"], offset: 3, cost: 7, allowed: false },
])("uses only the final power point offset after edits $edits", async ({ edits, offset, cost, allowed }) => {
  const input = Object.assign(new EventTarget(), { name: "pp-offset" });
  const item = { type: "pf1-psionics.power" };
  const rollData = { cl: 6, chargeCostBonus: 0, augmentCounts: { amplify: 3 } };
  const dialog = {
    attributes: {},
    rollData,
    _onChangeAttribute(event) {
      const { name, value } = event.currentTarget;
      this.attributes[name] = value;
    },
    _onToggleFlag() {},
    render() {},
    setPosition() {},
  };
  const html = {
    querySelector: () => ({ insertAdjacentHTML() {} }),
    querySelectorAll: (selector) => selector.includes("pp-offset") ? [input] : [],
  };
  await hooks.get("renderAttackDialog")(dialog, html, { item });

  for (const value of edits) {
    input.value = value;
    input.dispatchEvent(new Event("change"));
  }

  const actionUse = {
    item,
    actor: {},
    action: { augments: [{ _id: "amplify", tag: "amplify", cost: 1, effects: {} }] },
    shared: {
      formData: { "pp-offset": offset },
      rollData,
    },
  };
  listeners.get("pf1.actionUse.ActionUse.prototype.alterRollData").call(actionUse);
  // PF1 adds the action's base cost to the accumulated bonuses before validation.
  rollData.chargeCost = 1 + rollData.chargeCostBonus;

  expect(rollData.chargeCost).toBe(cost);
  expect(hooks.get("pf1PreActionUse")(actionUse)).toBe(allowed ? undefined : false);
});

it("shows the selected Amplify count when the power dialog redraws", async () => {
  const input = { dataset: { augmentId: "amplify" }, value: "0" };
  const app = {
    rollData: { augmentCounts: { amplify: 3 } },
    _onChangeAttribute() {},
    _onToggleFlag() {},
    setPosition() {},
  };
  const html = {
    querySelector: () => ({ insertAdjacentHTML() {} }),
    querySelectorAll: (selector) => selector === "input.augment-count" ? [input] : [],
  };
  await hooks.get("renderAttackDialog")(app, html, {
    item: { type: "pf1-psionics.power" },
    action: { augments: [{ _id: "amplify" }] },
  });

  expect(input.value).toBe("3");
});
