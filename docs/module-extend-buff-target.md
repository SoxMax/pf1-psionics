# Extending PF1: Add a custom buffTarget and have it applied to actors

This guide shows how a module can add a new buff target to the PF1 system so ItemChange entries targeting that buff will be applied to actors. It covers:

- registering a new buff target in `pf1.config.buffTargets` (and providing sort/simple/deferred flags),
- adding a bonus type (if required) to `pf1.config.bonusTypes` and optionally to `pf1.config.stackingBonusTypes`,
- mapping the new target to concrete actor data paths using the `pf1GetChangeFlat` hook,
- creating a change on an item that targets your new buff target,
- triggering application (and verifying results).

All code examples below are meant to be placed in your module's client-side JS (e.g., in `scripts/module.js` or your module's `init` hook).

## 1) Decide the target name and actor path(s)

Choose a short string identifier for your new buff target, e.g. `myCustomDef`. Decide which actor data path(s) it should modify — e.g.: `system.attributes.myCustom.total` (you must ensure the actor data model has that path, or choose an existing path).

## 2) Register the buffTarget and bonus type in `pf1.config`

Do this during module initialization. `pf1.config.buffTargets` controls how the engine treats the target (sorting, whether it is `simple` or `deferred`, etc). `pf1.config.bonusTypes` defines the modifier type keys that `actor.changeOverrides` will include. If you want a dedicated modifier type for your feature, add it.

Example (in init):

```javascript
Hooks.once("init", () => {
  // Add a buff target entry
  pf1.config.buffTargets.myCustomDef = {
    sort: 999,         // controls ordering relative to other targets
    simple: false,     // whether this target is resolved in the "simple" pass
    deferred: false,   // whether evaluation must wait for roll data (true => deferred)
    // You can add any other metadata your module needs here
  };

  // Add a bonus type, if you want a dedicated modifier family
  pf1.config.bonusTypes.myCustom = "My Custom Bonus";

  // Optional: decide whether this bonus type stacks with itself
  // Stacking modifier types are listed in pf1.config.stackingBonusTypes (array)
  pf1.config.stackingBonusTypes.push("myCustom");
});
```

Notes:
- `sort` determines where in the application ordering this target falls. Use a number greater than existing ranges if you want it late, or smaller to be earlier.
- `simple` indicates `applyChanges(..., { simple: true })` will or won't include it. Use `true` only for targets that don't require roll-data.
- `deferred` is for targets that must evaluate when rolls are available (e.g., conditional effects that use dice).

## 3) Map your target to concrete actor data paths via `pf1GetChangeFlat` hook

`getChangeFlat(actor, target, modifierType, value)` ultimately returns an array of string paths (the actor properties) the change should affect. You can either:

- mutate `pf1.config.buffTargets` to follow naming conventions already handled by `getChangeFlat`, or
- register a hook `pf1GetChangeFlat` and push your paths into the `result` array when your `target` value is requested.

Using the hook is the least-invasive and recommended approach for modules.

Example:

```javascript
Hooks.on("pf1GetChangeFlat", (result, target, modifierType, value, actor) => {
  if (target !== "myCustomDef") return;

  // Map the single logical target to one or more actor paths
  // e.g. apply to system.attributes.myCustom.total and also to a per-thing path
  result.push("system.attributes.myCustom.total");

  // If your target should modify several fields, add more:
  // result.push("system.attributes.myCustom.secondary");
});
```

Important: `result` is the array returned by `getChangeFlat`, so pushing into it causes PF1 to treat each pushed path as a concrete target to modify.

## 4) Create an ItemChange on an item that uses the new target

An `ItemChange` is normally created on an Item (for example via item editing UI or programmatically). The minimal object shape looks like:

```js
const change = {
  _id: foundry.utils.randomID(8),
  formula: "2",           // or a formula string that can use rollData
  operator: "add",       // "add" or "set"
  target: "myCustomDef", // your new target
  type: "myCustom",      // modifier type (should exist in pf1.config.bonusTypes)
  priority: 0,
  flavor: "My Module",
};

// Add the change to an item (example: `item` is an ItemPF instance)
const existing = item.toObject().system.changes ?? [];
await item.update({ "system.changes": [...existing, change] });
```

Alternately you can use `ItemChange.create()` to create change objects programmatically:

```js
await pf1.components.change.ItemChange.create(change, { parent: item });
```

(Your item must be parented to an actor for the change to be considered by `applyChanges`.)

## 5) Trigger application / refresh

Call `actor.refreshDerivedData()` to force PF1 to recompute derived data and apply changes. Many workflows call `applyChanges()` internally; calling `refreshDerivedData()` is the usual, public trigger.

```js
await actor.refreshDerivedData();

// Or explicitly call the function if you import it
import { applyChanges } from "@actor/utils/apply-changes.mjs";
applyChanges(actor);
```

## 6) Verify results (developer console)

Open the browser console (F12) and inspect these objects on the actor:

- `actor.system.attributes.myCustom.total` — the final computed numeric value
- `actor.changeOverrides` — per-path override bookkeeping, each path present has `.add` and `.set` objects keyed by `pf1.config.bonusTypes`.
    - For example: `actor.changeOverrides["system.attributes.myCustom.total"].add.myCustom` should show the numeric contribution from your changes.
- `actor.sourceInfo` — an object mapping paths to `positive` and `negative` arrays containing readable source entries added by `applySourceInfo`.

Example checks:
```js
console.log(actor.system.attributes.myCustom?.total);
console.log(actor.changeOverrides["system.attributes.myCustom.total"]);
console.log(actor.sourceInfo["system.attributes.myCustom.total"]);
```

## 7) Notes about stacking, highest-only types, and `applySourceInfo`

- The effective behavior when multiple changes of the same `type` are present depends on `pf1.config.stackingBonusTypes`.
    - If your `type` is included, values stack.
    - Otherwise only the highest value for that (type, target) will apply (the system keeps track of the highest in `actor.changeOverrides` and adds only the delta when applying).
- `applySourceInfo` records human-readable entries in `actor.sourceInfo[path]`. `applyChanges` defers adding sourceInfo until after numeric application to make sure the final recorded entries reflect the final applied values.

## 8) Advanced: deferred evaluation and rollData

If your new target needs evaluation that depends on roll-time data (formulas that reference actor roll-data or dice), mark it `deferred: true` in `pf1.config.buffTargets`. Deferred changes are evaluated in the `applyChange` flow with `RollPF.*` helpers and may need `actor.getRollData()` or `item.getRollData()` available.

Example:
```js
pf1.config.buffTargets.myCustomDef.deferred = true;
```

## 9) Example module snippet (full)

```javascript
Hooks.once("init", () => {
  pf1.config.buffTargets.myCustomDef = { sort: 999, simple: false, deferred: false };
  pf1.config.bonusTypes.myCustom = "My Custom Bonus";
  pf1.config.stackingBonusTypes.push("myCustom");

  Hooks.on("pf1GetChangeFlat", (result, target, modifierType, value, actor) => {
    if (target !== "myCustomDef") return;
    result.push("system.attributes.myCustom.total");
  });
});
```

After installing the module and creating an item-level change targeting `myCustomDef` and type `myCustom`, a refresh of the actor (`actor.refreshDerivedData()`) should apply the new bonus to the actor path(s) you provided.

## 10) Troubleshooting

- Nothing changed? Ensure:
    - Your hook registration ran early (init/hook timing) and `pf1.config` was updated before calls to `applyChanges`.
    - The actor path you push to `result` exists on the actor data model (or is safe to create) — otherwise `applyChange` may skip writing to it.
    - The change’s `type` exists in `pf1.config.bonusTypes` and `actor.changeOverrides[path]` will include that key after the first apply.
- If the target should affect several actor fields, push multiple paths into `result`.
