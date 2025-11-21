# apply-changes Walkthrough

This document explains, step-by-step, how "changes" (item-defined modifiers) assigned via buff targets are resolved and applied by the PF1 system. It traces the flow from an `ItemChange` on an item, through `getChangeFlat()`, override bookkeeping, formula evaluation, stacking behavior, and `sourceInfo` recording.

Files referenced
- `module/documents/actor/utils/apply-changes.mjs` — orchestrator (`applyChanges`), `getChangeFlat`, `createOverride`, helper helpers
- `module/components/change.mjs` — `ItemChange` class, `applyChange`, `_safeApplyChange`, `applySourceInfo`
- `pf1.config` entries used: `pf1.config.buffTargets`, `pf1.config.bonusTypes`, `pf1.config.stackingBonusTypes`

High-level flow
1. Items define changes in `item.system.changes` (read at runtime as `ItemChange` objects).
2. `applyChanges(actor, { simple = false })` gathers and filters changes, sorts them, creates per-path override slots, and calls `change._safeApplyChange(actor, targets, { applySourceInfo: false })` to numerically apply each change.
3. During application each change:
    - resolves abstract `target` → concrete actor data paths via `getChangeFlat(actor, target, type, value)`;
    - evaluates the `formula` (using `RollPF.*` helpers and `rollData` from item or actor) to a numeric `value`;
    - writes the value to each concrete path according to `operator` (`add` or `set`) and stacking rules;
    - updates `actor.changeOverrides[path]` with per-type contribution (keys from `pf1.config.bonusTypes`).
4. After all numeric application, `applyChanges` calls `change.applySourceInfo(actor)` for each change to populate `actor.sourceInfo` with human-readable contributor entries.

Detailed steps and important code paths

1) Where changes originate
- Items store changes in `system.changes` which become `ItemChange` instances (see `module/components/change.mjs`).
- These changes carry: `formula`, `operator` ("add"/"set"), `target` (buff target), `type` (modifier type), `priority`, `continuous`, etc.

2) Orchestration: `applyChanges`
- Location: `module/documents/actor/utils/apply-changes.mjs`.
- Responsibilities:
    - Initialize `actor.changeOverrides = {}`.
    - Collect and optionally filter `actor.changes` for `simple` vs full processing (simple depends on `pf1.config.buffTargets[target].simple`).
    - Sort changes by `priority`, target sort order (from `getSortChangePriority`), and `pf1.config.bonusTypes` order.
    - For each change: ensure override slots exist (`createOverride()`), call `_safeApplyChange()` (to numerically apply), apply continuous changes, run `actor.refreshDerivedData()` between steps.
    - After looping all changes, call `change.applySourceInfo(actor)` for every change.

3) Target resolution: `getChangeFlat(actor, target, modifierType, value)`
- This function maps a high-level buff target (e.g. "ac", "cl", "skills", or `skill.<id>`) into an array of concrete actor data paths such as `system.attributes.ac.normal.total` or `system.skills.per.mod`.
- Implementation details:
    - Big `switch` on `target` returns arrays of strings.
    - Special regex paths supported:
        - `^dc\.school\.(?<schoolId>\w+)` → `system.attributes.spells.school.<schoolId>.dc`
        - `^cl\.book\.(?<bookId>\w+)` → `system.attributes.spells.spellbooks.<bookId>.cl.bonus`
        - `^skill\.` prefixed targets expand to skill + subskills
    - `getChangeFlat` calls `Hooks.callAll("pf1GetChangeFlat", ...)` so modules can extend mappings.

4) Override bookkeeping: `createOverride()` and `actor.changeOverrides`
- `createOverride()` creates an object `{ add: { <bonusType>: null, ... }, set: { <bonusType>: null, ... } }` with keys from `pf1.config.bonusTypes`.
- `actor.changeOverrides[path]` tracks how much each modifier type contributed for that exact path and operator. This is used to implement "highest-only" vs "stacking" rules.

5) Applying a change: `ItemChange._safeApplyChange` → `applyChange`
- `_safeApplyChange` wraps `applyChange` with try/catch and UI notifications for owners.
- `applyChange` steps:
    - Get `targets` (defaults to `getTargets(actor)` which calls `getChangeFlat`).
    - Obtain `rollData` (from `this.parent.getRollData()` if change belongs to an item, else `actor.getRollData()`), used for evaluating formulas.
    - Compute `value`:
        - If `formula` is a numeric string, parse it.
        - If `this.isDeferred` and formula contains non-deterministic parts, use `RollPF.replaceFormulaData`.
        - Else `RollPF.safeRollSync(...)` evaluates the formula to a numeric total.
    - For each path `t`:
        - Skip if no override present (some application contexts omit expected override structures).
        - If `operator === "add"`:
            - Read `base = foundry.utils.getProperty(actor, t)`.
            - If `type` is in `pf1.config.stackingBonusTypes` (e.g. dodge), then `actor[t] = base + value` and override `add[type]` += value.
            - Else highest-only: determine diff relative to `override.add[type]` (prior) and add only the delta, update `override.add[type] = max(prior, value)`.
        - If `operator === "set"`, simply `setProperty(actor, t, value)` and `override.set[type] = value`.
        - Recompute ability modifiers if target affects ability totals (`system.abilities.<x>.mod`).

6) Continuous changes
- `applyChanges` computes `continuousChanges` (changes with `continuous === true`) and applies them together with each change iteration so continuous modifiers are always considered.
- This approach interacts with ordering and `refreshDerivedData()` calls to keep derived fields consistent.

7) Source info: `applySourceInfo(actor)`
- After numeric application, `applyChanges` calls `change.applySourceInfo(actor)` for every change.
- `applySourceInfo` records in `actor.sourceInfo[path].positive|negative` an info object `{ value, operator, name, modifier, type, change }`.
- For non-stacking types only the best (highest) entry is kept; stacking types get all entries.
- `applySourceInfo` also contains merge logic for `base` + `enh` interactions and cleans up lower-valued entries for the same modifier type.

8) Final refresh & extensibility
- `actor.refreshDerivedData()` is called several times during `applyChanges` so dependent totals stay correct.
- `getChangeFlat` fires the `pf1GetChangeFlat` hook so modules can add or change target mappings.

Concrete example (brief)
- Item change: `{ target: "ac", operator: "add", type: "dodge", formula: "2" }`
    1. `getChangeFlat(actor, "ac", "dodge")` → `["system.attributes.ac.normal.total", "system.attributes.ac.touch.total", "system.attributes.cmd.total"]`.
    2. `createOverride()` ensures `actor.changeOverrides` entries for those 3 paths.
    3. `applyChange` evaluates formula → `value = 2`.
    4. For each path: since `dodge` is stacking, `actor[path] = base + 2` and `override.add.dodge` updated accordingly.
    5. Later `applySourceInfo` records the source entry for UI.

Gotchas and rules to keep in mind
- Stacking vs highest-only types are controlled by `pf1.config.stackingBonusTypes`.
- `isDeferred` changes may defer evaluation and can be non-deterministic.
- Some targets map to multiple actor paths and some modifier types affect extra paths (e.g., dodge affecting CMD).
- `actor.changeOverrides` is the authoritative bookkeeping for which item contributed what — useful for debugging and UI.

Next steps / optional additions
- I can add a concrete trace: pick a sample actor JSON and an item change and run through exact before/after values.
- Or add instructions for reading `actor.changeOverrides` and `actor.sourceInfo` in the console for debugging.
