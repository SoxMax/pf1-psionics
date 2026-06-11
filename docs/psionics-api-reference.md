# PF1-Psionics API Reference

This document describes how to use the pf1-psionics module API to interact with power points and psionic focus programmatically.

## Accessing the API

```javascript
const api = game.modules.get("pf1-psionics").api;
```

The API provides:
- `api.powerPoints` - Static API for power point operations
- `api.psionicFocus` - Static API for psionic focus operations
- `api.PowerPointsHelper` - Helper class (for advanced use)
- `api.PsionicFocusHelper` - Helper class (for advanced use)
- `api.PsionicsHelper` - Main helper class (for advanced use)

Additionally, a namespaced helper is attached directly to actors:
- `actor.psionics.powerPoints` - PowerPointsHelper instance for the actor
- `actor.psionics.focus` - PsionicFocusHelper instance for the actor

---

## Power Points API

### Quick Reference

| Method | Description |
|--------|-------------|
| `spend(actor, amount)` | Spend points (drains temporary first) |
| `canSpend(actor, amount)` | Check if enough points available |
| `add(actor, amount)` | Add points (clamped to maximum) |
| `addTemporary(actor, amount)` | Add temporary points |
| `restore(actor)` | Restore to maximum |
| `getAvailable(actor)` | Get current + temporary |
| `getCurrent(actor)` | Get current points only |
| `getTemporary(actor)` | Get temporary points only |
| `getMaximum(actor)` | Get maximum points |
| `setCurrent(actor, value)` | Set current to specific value |
| `setTemporary(actor, value)` | Set temporary to specific value |

### Usage Examples

#### Spending Power Points

Power points are spent with temporary points being drained first, then current points.

```javascript
const api = game.modules.get("pf1-psionics").api;
const actor = canvas.tokens.controlled[0]?.actor;

// Check if the actor can afford the cost
const cost = 5;
if (api.powerPoints.canSpend(actor, cost)) {
  await api.powerPoints.spend(actor, cost);
  ui.notifications.info(`Spent ${cost} power points!`);
} else {
  ui.notifications.warn("Not enough power points!");
}
```

Or using the actor helper directly:

```javascript
const actor = canvas.tokens.controlled[0]?.actor;

if (actor.psionics.powerPoints.canSpend(5)) {
  await actor.psionics.powerPoints.spend(5);
}
```

#### Checking Available Points

```javascript
const api = game.modules.get("pf1-psionics").api;
const actor = game.actors.getName("My Psion");

// Total available (current + temporary)
const available = api.powerPoints.getAvailable(actor);

// Or via actor helper
const available2 = actor.psionics.powerPoints.available;

console.log(`Available power points: ${available}`);
```

#### Adding Temporary Power Points

Temporary power points are spent before current points.

```javascript
const api = game.modules.get("pf1-psionics").api;
const actor = game.actors.getName("My Psion");

// Add 10 temporary power points (e.g., from a buff)
await api.powerPoints.addTemporary(actor, 10);

// Or via actor helper
await actor.psionics.powerPoints.addTemporary(10);
```

#### Restoring Power Points (Rest)

```javascript
const api = game.modules.get("pf1-psionics").api;
const actor = game.actors.getName("My Psion");

// Restore to maximum, clear temporary
await api.powerPoints.restore(actor);

// Or via actor helper
await actor.psionics.powerPoints.restore();
```

#### Getting All Power Point Info

```javascript
const actor = game.actors.getName("My Psion");

console.log({
  current: actor.psionics.powerPoints.current,
  temporary: actor.psionics.powerPoints.temporary,
  maximum: actor.psionics.powerPoints.maximum,
  available: actor.psionics.powerPoints.available,  // current + temporary
  inUse: actor.psionics.powerPoints.inUse           // true if maximum > 0
});
```

---

## Psionic Focus API

### Quick Reference

| Method | Description |
|--------|-------------|
| `expend(actor)` | Expend psionic focus |
| `gain(actor)` | Regain psionic focus |
| `restore(actor)` | Restore focus to maximum |
| `isFocused(actor)` | Check if currently focused |
| `canExpend(actor)` | Check if can expend focus |
| `getCurrent(actor)` | Get current focus value |
| `getMaximum(actor)` | Get maximum focus value |

### Usage Examples

#### Expending Psionic Focus

Many psionic feats require expending psionic focus.

```javascript
const api = game.modules.get("pf1-psionics").api;
const actor = canvas.tokens.controlled[0]?.actor;

if (api.psionicFocus.isFocused(actor)) {
  await api.psionicFocus.expend(actor);
  ui.notifications.info("Expended psionic focus!");
} else {
  ui.notifications.warn("Not psionically focused!");
}
```

Or using the actor helper:

```javascript
const actor = canvas.tokens.controlled[0]?.actor;

if (actor.psionics.focus.isFocused) {
  await actor.psionics.focus.expend();
}
```

#### Regaining Psionic Focus

Regaining focus normally requires a full-round action and concentration check.

```javascript
const api = game.modules.get("pf1-psionics").api;
const actor = game.actors.getName("My Psion");

// Attempt to regain focus
const success = await api.psionicFocus.gain(actor);
if (success) {
  ui.notifications.info("Regained psionic focus!");
} else {
  ui.notifications.warn("Already focused!");
}
```

#### Checking Focus Status

```javascript
const actor = game.actors.getName("My Psion");

console.log({
  current: actor.psionics.focus.current,      // Current focus (0 or 1 typically)
  maximum: actor.psionics.focus.maximum,      // Maximum focus
  isFocused: actor.psionics.focus.isFocused,  // true if current > 0
  inUse: actor.psionics.focus.inUse           // true if maximum > 0 (has PP)
});
```

---

## Macro Examples

### Manifest Power with Cost

```javascript
// Macro: Manifest a power with a specific cost
const actor = canvas.tokens.controlled[0]?.actor;
if (!actor) {
  ui.notifications.error("Select a token first!");
  return;
}

const powerCost = 7; // Base cost + augments

if (!actor.psionics.powerPoints.canSpend(powerCost)) {
  ui.notifications.error(`Not enough power points! Need ${powerCost}, have ${actor.psionics.powerPoints.available}`);
  return;
}

await actor.psionics.powerPoints.spend(powerCost);
ui.notifications.info(`Manifested power for ${powerCost} PP. Remaining: ${actor.psionics.powerPoints.available}`);
```

### Toggle Psionic Focus

```javascript
// Macro: Toggle psionic focus (expend if focused, gain if not)
const actor = canvas.tokens.controlled[0]?.actor;
if (!actor) {
  ui.notifications.error("Select a token first!");
  return;
}

if (!actor.psionics.focus.inUse) {
  ui.notifications.warn("This character cannot use psionic focus.");
  return;
}

if (actor.psionics.focus.isFocused) {
  await actor.psionics.focus.expend();
  ui.notifications.info("Expended psionic focus.");
} else {
  await actor.psionics.focus.gain();
  ui.notifications.info("Regained psionic focus.");
}
```

### Show Psionic Resources

```javascript
// Macro: Display current psionic resources
const actor = canvas.tokens.controlled[0]?.actor;
if (!actor) {
  ui.notifications.error("Select a token first!");
  return;
}

const pp = actor.psionics.powerPoints;
const focus = actor.psionics.focus;

const content = `
  <h2>Psionic Resources: ${actor.name}</h2>
  <h3>Power Points</h3>
  <ul>
    <li><b>Current:</b> ${pp.current} / ${pp.maximum}</li>
    <li><b>Temporary:</b> ${pp.temporary}</li>
    <li><b>Available:</b> ${pp.available}</li>
  </ul>
  <h3>Psionic Focus</h3>
  <ul>
    <li><b>Status:</b> ${focus.isFocused ? "Focused ✓" : "Not Focused ✗"}</li>
    <li><b>Maximum:</b> ${focus.maximum}</li>
  </ul>
`;

ChatMessage.create({
  user: game.user.id,
  speaker: ChatMessage.getSpeaker({ actor }),
  content
});
```

---

## Data Storage

Power points and focus are stored in actor flags:

```javascript
// Power Points
actor.flags["pf1-psionics"].powerPoints = {
  current: 25,      // Current PP (editable)
  temporary: 0,     // Temporary PP (editable)
  maximum: 50       // Derived from manifesters (read-only)
};

// Psionic Focus
actor.flags["pf1-psionics"].focus = {
  current: 1,       // Current focus (0 or 1)
  maximum: 1        // Derived (1 if has PP, 0 otherwise)
};
```

The `maximum` values are calculated during actor data preparation from the manifester configurations.

---

## Manifesters API

**⚠ Breaking change in 0.10.0.** Manifester records are now keyed by **class tag** (e.g. `"psion"`, `"wilder"`, `"_hd"` for psi-like) instead of the legacy fixed slots (`primary`/`secondary`/`tertiary`/`spelllike`). Each record's `class` field is a tag string (not an `inUse` boolean — presence in the dict means active).

### Storage shape

```javascript
actor.flags["pf1-psionics"].manifesters = {
  psion: {
    class: "psion",
    source: "class",                 // "class" or "manual"
    casterType: "high",              // "high" | "med" | "low"
    ability: "int",
    spellPreparationMode: "spontaneous",
    hasCantrips: true,
    cl:            { formula: "", notes: "", base: 0 },
    concentration: { formula: "", notes: "" },
    powerPoints:   { max: 0, formula: "" },
    baseDCFormula: "10 + @sl + @ablMod",
    autoLevelPowerPoints: true,
    autoAttributePowerPoints: true,
    autoMaxPowerLevel: true,
    // _lastTag, _pendingClassTag: internal orphan/promotion tracking
  },
  _hd: { /* same shape, class: "_hd" for HD-based psi-like */ }
};
```

### Quick reference

| Method | Returns | Description |
|---|---|---|
| `actor.psionics.manifesters` | `object \| null` | Raw flag dict (read-only snapshot). |
| `actor.psionics.manifesterCollection` | `ManifesterCollection` | Hydrated, validated collection. |
| `actor.psionics.addManifester(tag, config)` | `Promise<string>` | Create a record. Throws on tag clash. |
| `actor.psionics.removeManifester(tag)` | `Promise<boolean>` | Delete a record by tag. |

### Reading a manifester

```javascript
// Raw flag access (fastest, no validation).
const psion = actor.flags["pf1-psionics"]?.manifesters?.psion;

// Hydrated model — has prep lifecycle, derived cl.total etc.
const collection = actor.psionics.manifesterCollection;
const wilder = collection.manifesters.wilder;
console.log(wilder.cl.total, wilder.concentration.total, wilder.powerPoints.max);
```

### Adding a manifester programmatically

```javascript
// HD-based psi-like
await actor.psionics.addManifester("_hd", {
  casterType: "high",
  ability: "cha",
});

// Linked to a class tag
await actor.psionics.addManifester("vitalist", {
  source: "class",
  casterType: "high",
  ability: "wis",
  hasCantrips: true,
});
```

### Removing a manifester

```javascript
const removed = await actor.psionics.removeManifester("wilder");
if (removed) console.log("Wilder manifester removed.");
```

### Formula access

Manifester data is exposed under `@psionics.<tag>` for roll formulas:

```
@psionics.psion.cl.total          // Caster level of the Psion manifester
@psionics.psion.concentration.total
@psionics.psion.powerPoints.max
@psionics.psion.abilityMod        // Currently-bound ability mod
@psionics._hd.cl.total            // Psi-like HD-based CL
```

### Migration from prior versions

A world upgraded from 0.9.1 (or earlier) runs migration v0.10.0 on first load. The migration:

1. For each actor: reads `flags.pf1-psionics.manifesters` (slot-keyed: `primary`/`secondary`/`tertiary`/`spelllike`). For each slot with `inUse: true`, resolves a class tag — `book.class` matching an actor class item's `system.tag` → that tag; `book.class === "_hd"` or absent → `_hd`; class string with no live class item → use the string verbatim and stash original as `_lastTag`. Slots with `inUse: false` are dropped (intentionally disabled by the user).
2. Tag clashes (two slot records resolving to the same tag) keep the first and suffix the rest (`psion-2`).
3. For each power on each actor: rewrites `system.manifester` from the slot key to the resolved tag via a temporary actor-flag idMap.
4. Cleans up the temp idMap flag.
5. For each class item (world / actor-owned / module compendia): relocates `system.manifesting` → `flags.pf1-psionics.manifesting`, copying `progression` / `ability` / `cantrips` and dropping legacy `type` / `offset`.
6. Applies the same actor-side rebuild against unlinked scene tokens' deltas.

Non-module compendium actors are out of scope; re-import after upgrade if needed.

### Migration impact for downstream code

Anything that read `actor.flags["pf1-psionics"].manifesters.primary` (or other slot keys) no longer works — read by tag instead. Anything that checked `book.inUse` no longer works — presence in the dict means active. Roll formulas written against the legacy slot-name path need updating to `@psionics.<tag>.cl.total`.

