# Multi-Resource Costs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow feats, class features, and powers to cost multiple resources simultaneously (own uses + power points + psionic focus).

**Architecture:** Extend PF1's Resource class to wrap actor flag-based pools (ActorFlagResource), add resourceCosts array to item data models, hook into ActionUse to check/deduct multiple resources per action.

**Tech Stack:** FoundryVTT v11+, PF1 System, lib-wrapper, ES6 modules

---

## Phase 1: Core Infrastructure - ActorFlagResource

### Task 1: Create ActorFlagResource class skeleton

**Files:**
- Create: `scripts/documents/actor/components/actor-flag-resource.mjs`
- Create: `scripts/documents/actor/components/_module.mjs`

**Step 1: Create the components directory and module file**

Create the directory structure:
```bash
mkdir -p scripts/documents/actor/components
```

Create `scripts/documents/actor/components/_module.mjs`:
```javascript
export { ActorFlagResource } from "./actor-flag-resource.mjs";
```

**Step 2: Create ActorFlagResource class skeleton**

Create `scripts/documents/actor/components/actor-flag-resource.mjs`:
```javascript
/**
 * Resource wrapper for actor flag-based resource pools.
 * Extends the PF1 Resource pattern to support pools stored in actor flags
 * rather than item charges.
 */
export class ActorFlagResource {
  /**
   * @param {ActorPF} actor - The actor owning this resource
   * @param {object} config - Resource configuration
   * @param {string} config.tag - Unique identifier (e.g., "powerPoints")
   * @param {string} config.flagPath - Path to flag data (e.g., "flags.pf1-psionics.powerPoints")
   */
  constructor(actor, config) {
    this.actor = actor;
    this.config = config;

    Object.defineProperties(this, {
      _id: { value: config.tag, enumerable: true },
      tag: { value: config.tag, enumerable: true },
    });
  }

  /**
   * Current resource value (current + temporary)
   * @type {number}
   */
  get value() {
    // TODO: Implement
    return 0;
  }

  /**
   * Maximum resource value
   * @type {number}
   */
  get max() {
    // TODO: Implement
    return 0;
  }

  /**
   * Item ID (for compatibility with Resource interface)
   * @type {string}
   */
  get id() {
    return this._id;
  }

  /**
   * Add or subtract from resource pool
   * @param {number} amount - Amount to add (negative to subtract)
   * @returns {Promise<ActorPF>} - Updated actor
   */
  async add(amount) {
    // TODO: Implement
    return this.actor;
  }
}
```

**Step 3: Verify module loads without errors**

Check syntax:
```bash
node -e "console.log('Testing imports...'); import('./scripts/documents/actor/components/_module.mjs').then(() => console.log('Import OK')).catch(e => console.error('Import error:', e))"
```

Expected: "Import OK"

**Step 4: Commit**

```bash
git add scripts/documents/actor/components/
git commit -m "feat: add ActorFlagResource class skeleton

Create base structure for actor flag-based resource pools.
Implements Resource-compatible interface for power points and focus.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: Implement ActorFlagResource.value getter

**Files:**
- Modify: `scripts/documents/actor/components/actor-flag-resource.mjs`

**Step 1: Implement value getter**

In `scripts/documents/actor/components/actor-flag-resource.mjs`, replace the `value` getter:

```javascript
get value() {
  const data = foundry.utils.getProperty(this.actor, this.config.flagPath);
  if (!data) return 0;
  return (data.current || 0) + (data.temporary || 0);
}
```

**Step 2: Test in Foundry console**

Open Foundry, create a test actor, and run:
```javascript
const actor = game.actors.contents[0];
const resource = new ActorFlagResource(actor, {
  tag: "test",
  flagPath: "flags.pf1-psionics.powerPoints"
});
console.log("Value:", resource.value); // Should be 0 if no flags set
```

Expected: Logs current + temporary value or 0

**Step 3: Commit**

```bash
git add scripts/documents/actor/components/actor-flag-resource.mjs
git commit -m "feat: implement ActorFlagResource.value getter

Returns current + temporary from actor flags.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: Implement ActorFlagResource.max getter

**Files:**
- Modify: `scripts/documents/actor/components/actor-flag-resource.mjs`

**Step 1: Implement max getter**

In `scripts/documents/actor/components/actor-flag-resource.mjs`, replace the `max` getter:

```javascript
get max() {
  const data = foundry.utils.getProperty(this.actor, this.config.flagPath);
  return data?.maximum || 0;
}
```

**Step 2: Test in Foundry console**

```javascript
const actor = game.actors.contents[0];
const resource = new ActorFlagResource(actor, {
  tag: "test",
  flagPath: "flags.pf1-psionics.powerPoints"
});
console.log("Max:", resource.max); // Should be maximum value or 0
```

Expected: Logs maximum value or 0

**Step 3: Commit**

```bash
git add scripts/documents/actor/components/actor-flag-resource.mjs
git commit -m "feat: implement ActorFlagResource.max getter

Returns maximum from actor flags.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: Implement ActorFlagResource.add() for adding resources

**Files:**
- Modify: `scripts/documents/actor/components/actor-flag-resource.mjs`

**Step 1: Implement add() method - positive amounts only**

In `scripts/documents/actor/components/actor-flag-resource.mjs`, replace the `add` method:

```javascript
async add(amount) {
  const data = foundry.utils.getProperty(this.actor, this.config.flagPath);
  if (!data) return this.actor;

  const updateData = {};

  if (amount > 0) {
    // Adding - goes to current only, capped at maximum
    const newCurrent = Math.min(data.maximum || 0, (data.current || 0) + amount);
    updateData[`${this.config.flagPath}.current`] = newCurrent;
  } else if (amount < 0) {
    // TODO: Handle subtraction (next task)
    console.warn("Subtraction not yet implemented");
  }

  if (Object.keys(updateData).length === 0) return this.actor;
  return this.actor.update(updateData);
}
```

**Step 2: Test adding in Foundry console**

```javascript
const actor = game.actors.contents[0];
await actor.setFlag("pf1-psionics", "powerPoints", { current: 5, temporary: 0, maximum: 10 });
const resource = new ActorFlagResource(actor, {
  tag: "powerPoints",
  flagPath: "flags.pf1-psionics.powerPoints"
});
console.log("Before:", resource.value); // 5
await resource.add(3);
console.log("After:", resource.value); // 8
```

Expected: Value increases by 3, capped at maximum

**Step 3: Commit**

```bash
git add scripts/documents/actor/components/actor-flag-resource.mjs
git commit -m "feat: implement ActorFlagResource.add() for positive amounts

Adds to current pool, capped at maximum.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: Implement ActorFlagResource.add() for subtracting resources

**Files:**
- Modify: `scripts/documents/actor/components/actor-flag-resource.mjs`

**Step 1: Implement subtraction with temporary-first logic**

In `scripts/documents/actor/components/actor-flag-resource.mjs`, replace the subtraction TODO in the `add` method:

```javascript
async add(amount) {
  const data = foundry.utils.getProperty(this.actor, this.config.flagPath);
  if (!data) return this.actor;

  const updateData = {};

  if (amount > 0) {
    // Adding - goes to current only, capped at maximum
    const newCurrent = Math.min(data.maximum || 0, (data.current || 0) + amount);
    updateData[`${this.config.flagPath}.current`] = newCurrent;
  } else if (amount < 0) {
    // Removing - spend temporary first, then current
    let toRemove = Math.abs(amount);
    const temporary = data.temporary || 0;
    const current = data.current || 0;

    if (toRemove <= temporary) {
      // Can cover entirely from temporary
      updateData[`${this.config.flagPath}.temporary`] = temporary - toRemove;
    } else {
      // Deplete temporary, then take from current
      toRemove -= temporary;
      updateData[`${this.config.flagPath}.temporary`] = 0;
      updateData[`${this.config.flagPath}.current`] = Math.max(0, current - toRemove);
    }
  }

  if (Object.keys(updateData).length === 0) return this.actor;
  return this.actor.update(updateData);
}
```

**Step 2: Test subtracting from temporary first**

```javascript
const actor = game.actors.contents[0];
await actor.setFlag("pf1-psionics", "powerPoints", { current: 10, temporary: 3, maximum: 15 });
const resource = new ActorFlagResource(actor, {
  tag: "powerPoints",
  flagPath: "flags.pf1-psionics.powerPoints"
});
console.log("Before:", resource.value); // 13 (10 + 3)
await resource.add(-2);
console.log("After:", resource.value); // 11 (10 + 1)
await resource.add(-5);
console.log("After more:", resource.value); // 6 (6 + 0)
```

Expected: Temporary depleted first, then current

**Step 3: Commit**

```bash
git add scripts/documents/actor/components/actor-flag-resource.mjs
git commit -m "feat: implement ActorFlagResource.add() for negative amounts

Subtracts from temporary pool first, then current.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: Register ActorFlagResource in actor data prep

**Files:**
- Modify: `scripts/documents/actor/actor-pf.mjs`

**Step 1: Import ActorFlagResource**

At the top of `scripts/documents/actor/actor-pf.mjs`, add:

```javascript
import { ActorFlagResource } from "./components/_module.mjs";
```

**Step 2: Register resources in pf1PrepareDerivedActorData**

In the `pf1PrepareDerivedActorData` function (around line 51), after the `deriveTotalFocus(actor);` call, add:

```javascript
export function pf1PrepareDerivedActorData(actor) {
  if (actor.getFlag(MODULE_ID, "manifestors")) {
    deriveManifestorsInfo(actor);
    deriveTotalPowerPoints(actor);
    deriveTotalFocus(actor);

    // Register power points resource
    actor.system.resources["powerPoints"] = new ActorFlagResource(actor, {
      tag: "powerPoints",
      flagPath: `flags.${MODULE_ID}.powerPoints`
    });

    // Register psionic focus resource
    actor.system.resources["psionicFocus"] = new ActorFlagResource(actor, {
      tag: "psionicFocus",
      flagPath: `flags.${MODULE_ID}.focus`
    });
  }
}
```

**Step 3: Test resource registration in Foundry**

Refresh Foundry (F5), then in console:
```javascript
const actor = game.actors.getName("Test Character"); // Use actual character name
console.log("Resources:", Object.keys(actor.system.resources));
console.log("Power Points:", actor.system.resources.powerPoints);
console.log("Value:", actor.system.resources.powerPoints?.value);
console.log("Max:", actor.system.resources.powerPoints?.max);
```

Expected: powerPoints and psionicFocus in resources, showing correct values

**Step 4: Commit**

```bash
git add scripts/documents/actor/actor-pf.mjs
git commit -m "feat: register ActorFlagResource in actor data prep

Power points and psionic focus now available in actor.system.resources.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 2: Data Model - Resource Costs Schema

### Task 7: Add resourceCosts field to PowerModel

**Files:**
- Modify: `scripts/dataModels/power-model.mjs`

**Step 1: Add resourceCosts to schema**

In `scripts/dataModels/power-model.mjs`, find the `static defineSchema()` method and add the resourceCosts field after the existing fields (around line 150+):

```javascript
static defineSchema() {
  const fields = foundry.data.fields;
  return {
    // ... existing fields (level, discipline, display, etc.) ...

    resourceCosts: new fields.ArrayField(
      new fields.SchemaField({
        tag: new fields.StringField({
          required: true,
          blank: false,
          label: "PF1-Psionics.ResourceCosts.Tag"
        }),
        formula: new fields.StringField({
          required: true,
          blank: false,
          label: "PF1-Psionics.ResourceCosts.Formula"
        }),
      }),
      {
        label: "PF1-Psionics.ResourceCosts.Label"
      }
    ),

    // ... rest of existing fields ...
  };
}
```

**Step 2: Add localization strings**

In `lang/en.json`, add:

```json
{
  "PF1-Psionics": {
    "ResourceCosts": {
      "Label": "Resource Costs",
      "Tag": "Resource Tag",
      "Formula": "Cost Formula"
    }
  }
}
```

**Step 3: Test schema loads without errors**

Refresh Foundry (F5), check console for errors. Create a new power item and inspect its data:

```javascript
const power = await Item.create({
  name: "Test Power",
  type: "pf1-psionics.power",
  system: {
    level: 1,
    resourceCosts: [
      { tag: "powerPoints", formula: "1" }
    ]
  }
}, { temporary: true });
console.log("Resource costs:", power.system.resourceCosts);
```

Expected: resourceCosts array exists and is valid

**Step 4: Commit**

```bash
git add scripts/dataModels/power-model.mjs lang/en.json
git commit -m "feat: add resourceCosts field to PowerModel schema

Powers can now define additional resource costs beyond own uses.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 8: Set default power point cost for powers

**Files:**
- Modify: `scripts/dataModels/power-model.mjs`

**Step 1: Add prepareDerivedData method to set defaults**

In `scripts/dataModels/power-model.mjs`, after the schema definition, add:

```javascript
/** @override */
prepareDerivedData() {
  super.prepareDerivedData();

  // Set default power point cost if not specified
  if (!this.resourceCosts || this.resourceCosts.length === 0) {
    this.resourceCosts = [
      { tag: "powerPoints", formula: "max(0, @sl * 2 - 1)" }
    ];
  }
}
```

**Step 2: Test default cost is applied**

Refresh Foundry (F5), create a power without resourceCosts:

```javascript
const power = await Item.create({
  name: "Test Power",
  type: "pf1-psionics.power",
  system: {
    level: 3
  }
}, { temporary: true });

// Trigger data preparation
power.prepareData();

console.log("Resource costs:", power.system.resourceCosts);
```

Expected: Default power point cost formula is present

**Step 3: Commit**

```bash
git add scripts/dataModels/power-model.mjs
git commit -m "feat: set default power point cost for powers

Powers without explicit resourceCosts get default formula: max(0, @sl * 2 - 1)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 3: Action Integration

### Task 9: Create action use injection module

**Files:**
- Create: `scripts/documents/action/action-use.mjs`
- Create: `scripts/documents/action/_module.mjs`
- Modify: `scripts/hooks/init.mjs`

**Step 1: Create action module structure**

Create directory and module file:
```bash
mkdir -p scripts/documents/action
```

Create `scripts/documents/action/_module.mjs`:
```javascript
export { injectActionUse } from "./action-use.mjs";
```

**Step 2: Create action-use injection skeleton**

Create `scripts/documents/action/action-use.mjs`:
```javascript
import { MODULE_ID } from "../../_module.mjs";

/**
 * Inject resource cost checking into PF1's action use system
 */
export function injectActionUse() {
  // TODO: Inject checkRequirements
  // TODO: Inject use/deduction
  console.log(`${MODULE_ID} | ActionUse injections registered`);
}
```

**Step 3: Register injection in init hook**

In `scripts/hooks/init.mjs`, add import and call:

```javascript
import { injectActionUse } from "../documents/action/_module.mjs";

export function onInit() {
  // ... existing registrations ...

  // Inject action use logic
  injectActionUse();
}
```

**Step 4: Test injection runs without errors**

Refresh Foundry (F5), check console for:
"pf1-psionics | ActionUse injections registered"

Expected: Message appears, no errors

**Step 5: Commit**

```bash
git add scripts/documents/action/ scripts/hooks/init.mjs
git commit -m "feat: create action use injection module skeleton

Prepares for hooking resource cost checking into ActionUse.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 10: Inject resource cost checking into ActionUse

**Files:**
- Modify: `scripts/documents/action/action-use.mjs`

**Step 1: Add checkRequirements wrapper**

In `scripts/documents/action/action-use.mjs`, replace the TODO:

```javascript
import { MODULE_ID } from "../../_module.mjs";

/**
 * Inject resource cost checking into PF1's action use system
 */
export function injectActionUse() {
  // Wrap checkRequirements to validate resource costs
  libWrapper.register(
    MODULE_ID,
    "pf1.ActionUse.prototype.checkRequirements",
    function (wrapped) {
      // Call original checks first
      const result = wrapped();
      if (result !== 0) return result;

      // Check resource costs
      return checkResourceCosts.call(this);
    },
    "WRAPPER"
  );

  console.log(`${MODULE_ID} | ActionUse injections registered`);
}

/**
 * Check if actor has sufficient resources for action
 * @this {pf1.ActionUse}
 * @returns {number} 0 if sufficient, error code otherwise
 */
function checkResourceCosts() {
  // Get costs from action (priority) or item
  const resourceCosts = this.action?.uses?.resourceCosts || this.item?.system?.resourceCosts;
  if (!resourceCosts || resourceCosts.length === 0) return 0;

  const rollData = this.item.getRollData();
  const ERR_REQUIREMENT = {
    INSUFFICIENT_CHARGES: 4,
  };

  for (const cost of resourceCosts) {
    const resource = this.actor.system.resources?.[cost.tag];
    if (!resource) {
      console.warn(`${MODULE_ID} | Resource ${cost.tag} not found on actor ${this.actor.name}`);
      ui.notifications.warn(
        game.i18n.format("PF1-Psionics.Error.ResourceNotFound", { tag: cost.tag })
      );
      return ERR_REQUIREMENT.INSUFFICIENT_CHARGES;
    }

    const requiredAmount = RollPF.safeRollSync(cost.formula, rollData).total;

    if (resource.value < requiredAmount) {
      const resourceLabel = game.i18n.localize(`PF1-Psionics.Resources.${cost.tag}`) || cost.tag;
      ui.notifications.warn(
        game.i18n.format("PF1-Psionics.Error.InsufficientResource", {
          resource: resourceLabel,
          required: requiredAmount,
          available: resource.value
        })
      );
      return ERR_REQUIREMENT.INSUFFICIENT_CHARGES;
    }
  }

  return 0;
}
```

**Step 2: Add localization strings**

In `lang/en.json`, add:

```json
{
  "PF1-Psionics": {
    "Error": {
      "ResourceNotFound": "Resource '{tag}' not found",
      "InsufficientResource": "Insufficient {resource}: requires {required}, have {available}"
    },
    "Resources": {
      "powerPoints": "Power Points",
      "psionicFocus": "Psionic Focus"
    }
  }
}
```

**Step 3: Test resource checking blocks actions**

Refresh Foundry (F5), create a power and try to use it with insufficient power points:

```javascript
const actor = game.actors.getName("Test Character");
await actor.setFlag("pf1-psionics", "powerPoints", { current: 0, temporary: 0, maximum: 10 });
const power = actor.items.find(i => i.type === "pf1-psionics.power");
await power.use(); // Should show "Insufficient Power Points" warning
```

Expected: Warning notification, action blocked

**Step 4: Commit**

```bash
git add scripts/documents/action/action-use.mjs lang/en.json
git commit -m "feat: inject resource cost checking into ActionUse

Actions are now blocked if insufficient resources available.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 11: Inject resource deduction into action use

**Files:**
- Modify: `scripts/documents/action/action-use.mjs`

**Step 1: Add deduction wrapper for ItemPF.use**

In `scripts/documents/action/action-use.mjs`, add after the checkRequirements wrapper:

```javascript
export function injectActionUse() {
  // ... existing checkRequirements wrapper ...

  // Wrap ItemPF.use to deduct resource costs
  libWrapper.register(
    MODULE_ID,
    "pf1.documents.item.ItemPF.prototype.use",
    async function (wrapped, options = {}) {
      const result = await wrapped(options);

      // If use was successful, deduct resource costs
      if (result && !options.skipCharges) {
        await deductResourceCosts.call(this, options);
      }

      return result;
    },
    "WRAPPER"
  );

  console.log(`${MODULE_ID} | ActionUse injections registered`);
}

/**
 * Deduct resource costs after successful action use
 * @this {pf1.documents.item.ItemPF}
 * @param {object} options - Use options
 */
async function deductResourceCosts(options) {
  const action = this.actions?.get(options.actionId);
  const resourceCosts = action?.uses?.resourceCosts || this.system?.resourceCosts;

  if (!resourceCosts || resourceCosts.length === 0) return;

  const rollData = this.getRollData();

  for (const cost of resourceCosts) {
    const resource = this.actor.system.resources?.[cost.tag];
    if (resource) {
      const amount = RollPF.safeRollSync(cost.formula, rollData).total;
      await resource.add(-amount);
    }
  }
}
```

**Step 2: Test resource deduction**

Refresh Foundry (F5), test that using a power deducts power points:

```javascript
const actor = game.actors.getName("Test Character");
await actor.setFlag("pf1-psionics", "powerPoints", { current: 10, temporary: 0, maximum: 10 });
const power = actor.items.find(i => i.type === "pf1-psionics.power" && i.system.level === 1);
console.log("Before:", actor.system.resources.powerPoints.value); // 10
await power.use();
console.log("After:", actor.system.resources.powerPoints.value); // Should be 9 (10 - 1)
```

Expected: Power points decrease by cost amount

**Step 3: Commit**

```bash
git add scripts/documents/action/action-use.mjs
git commit -m "feat: inject resource deduction into action use

Resources are automatically deducted after successful action use.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 4: PowerItem Refactoring

### Task 12: Remove custom addCharges override from PowerItem

**Files:**
- Modify: `scripts/documents/item/power-item.mjs`

**Step 1: Remove addCharges method**

In `scripts/documents/item/power-item.mjs`, delete the entire `addCharges` method (lines 216-239):

```javascript
// DELETE THIS METHOD:
// async addCharges(value, _data = null) { ... }
```

**Step 2: Update getPowerPoints to use resource system**

Replace the `getPowerPoints` method (lines 247-261):

```javascript
getPowerPoints(max = false) {
  const itemData = this.system;
  if (itemData.atWill) return Number.POSITIVE_INFINITY;

  const resource = this.actor?.system.resources?.["powerPoints"];
  if (!resource) return 0;

  return max ? resource.max : resource.value;
}
```

**Step 3: Test powers still work**

Refresh Foundry (F5), test that powers can still be used:

```javascript
const actor = game.actors.getName("Test Character");
const power = actor.items.find(i => i.type === "pf1-psionics.power");
console.log("Charges:", power.charges);
console.log("Max:", power.maxCharges);
await power.use(); // Should work and deduct power points
```

Expected: Powers work normally, power points deducted correctly

**Step 4: Commit**

```bash
git add scripts/documents/item/power-item.mjs
git commit -m "refactor: remove custom addCharges from PowerItem

Powers now use ActorFlagResource system instead of custom logic.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 5: Testing & Polish

### Task 13: Test multi-resource costs

**Files:**
- No code changes, testing only

**Step 1: Create a test feat with multiple resource costs**

In Foundry, create a feat item:
```javascript
const actor = game.actors.getName("Test Character");
const feat = await actor.createEmbeddedDocuments("Item", [{
  name: "Psionic Burst",
  type: "feat",
  system: {
    uses: {
      value: 3,
      max: 3,
      per: "day"
    },
    actions: [{
      name: "Use Psionic Burst",
      actionType: "other",
      uses: {
        resourceCosts: [
          { tag: "powerPoints", formula: "2" },
          { tag: "psionicFocus", formula: "1" }
        ]
      }
    }]
  }
}]);
```

**Step 2: Test with insufficient focus**

```javascript
await actor.setFlag("pf1-psionics", "powerPoints", { current: 10, temporary: 0, maximum: 10 });
await actor.setFlag("pf1-psionics", "focus", { current: 0, maximum: 1 });
const feat = actor.items.getName("Psionic Burst");
await feat.use(); // Should fail with "Insufficient Psionic Focus"
```

Expected: Action blocked, warning shown

**Step 3: Test with sufficient resources**

```javascript
await actor.setFlag("pf1-psionics", "focus", { current: 1, maximum: 1 });
console.log("PP before:", actor.system.resources.powerPoints.value); // 10
console.log("Focus before:", actor.system.resources.psionicFocus.value); // 1
console.log("Uses before:", feat.system.uses.value); // 3
await feat.use();
console.log("PP after:", actor.system.resources.powerPoints.value); // 8
console.log("Focus after:", actor.system.resources.psionicFocus.value); // 0
console.log("Uses after:", feat.system.uses.value); // 2
```

Expected: All three resources deducted correctly

**Step 4: Document test results**

Create test report in console or notes documenting:
- Multi-resource costs work
- Insufficient resource checks work
- All resources deducted correctly

---

### Task 14: Test action-level cost overrides

**Files:**
- No code changes, testing only

**Step 1: Create power with action-level override**

```javascript
const actor = game.actors.getName("Test Character");
const power = actor.items.find(i => i.type === "pf1-psionics.power");

// Add action with overridden cost
await power.update({
  "system.actions": [{
    name: "Augmented Manifest",
    actionType: "other",
    uses: {
      resourceCosts: [
        { tag: "powerPoints", formula: "5" }  // Override default cost
      ]
    }
  }]
});
```

**Step 2: Test override is used**

```javascript
await actor.setFlag("pf1-psionics", "powerPoints", { current: 10, temporary: 0, maximum: 10 });
const action = power.actions.contents[0];
console.log("PP before:", actor.system.resources.powerPoints.value); // 10
await power.use({ actionId: action.id });
console.log("PP after:", actor.system.resources.powerPoints.value); // 5 (not default cost)
```

Expected: Action's cost (5) used instead of item's default

**Step 3: Document override behavior**

Note that action-level costs completely replace item-level costs (not merge).

---

### Task 15: Test temporary power points

**Files:**
- No code changes, testing only

**Step 1: Set up actor with temporary power points**

```javascript
const actor = game.actors.getName("Test Character");
await actor.setFlag("pf1-psionics", "powerPoints", {
  current: 10,
  temporary: 5,
  maximum: 10
});
console.log("Total:", actor.system.resources.powerPoints.value); // 15
```

**Step 2: Test temporary spent first**

```javascript
const power = actor.items.find(i => i.type === "pf1-psionics.power");
await power.use(); // Cost 1 PP
console.log("After 1:", actor.flags["pf1-psionics"].powerPoints); // current: 10, temporary: 4
await power.use();
await power.use();
await power.use();
console.log("After 4:", actor.flags["pf1-psionics"].powerPoints); // current: 10, temporary: 1
await power.use();
await power.use();
console.log("After 6:", actor.flags["pf1-psionics"].powerPoints); // current: 9, temporary: 0
```

Expected: Temporary depleted before current is touched

**Step 3: Document temporary behavior**

Confirm temporary power points work like temporary HP.

---

### Task 16: Update documentation

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/plans/2024-11-21-multi-resource-costs-design.md`

**Step 1: Update CLAUDE.md with resource costs info**

In `CLAUDE.md`, add section under "Key Concepts":

```markdown
**Resource Costs**
- Items can define `system.resourceCosts` array for additional costs beyond own uses
- Format: `[{ tag: "powerPoints", formula: "@sl * 2 - 1" }]`
- Actions can override item-level costs via `action.uses.resourceCosts`
- ActorFlagResource wraps actor flag pools to work with PF1's resource system
- Power points and psionic focus available in `actor.system.resources`
```

**Step 2: Update design doc with implementation status**

In `docs/plans/2024-11-21-multi-resource-costs-design.md`, add at top:

```markdown
**Status:** Implemented ✅

**Implementation Date:** 2025-01-21
```

**Step 3: Commit documentation**

```bash
git add CLAUDE.md docs/plans/2024-11-21-multi-resource-costs-design.md
git commit -m "docs: update documentation for multi-resource costs

Document ActorFlagResource system and resourceCosts usage.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Verification Checklist

Before considering implementation complete:

- [ ] ActorFlagResource registered in `actor.system.resources`
- [ ] Power points show correct value (current + temporary)
- [ ] Adding/subtracting works correctly with temporary-first logic
- [ ] PowerModel has resourceCosts field
- [ ] Powers have default power point cost
- [ ] ActionUse blocks actions with insufficient resources
- [ ] ActionUse deducts resources after successful use
- [ ] PowerItem no longer has custom addCharges
- [ ] Multi-resource costs work (power points + focus + own uses)
- [ ] Action-level cost overrides work
- [ ] Temporary power points spent before current
- [ ] Documentation updated
- [ ] All changes committed to git

---

## Notes for Implementation

**Testing Strategy:**
- Test each getter/method individually in Foundry console
- Test integration with real actor/items after each phase
- Manually verify UI shows correct values (though UI changes not in scope)

**Common Issues:**
- If resources don't appear, check actor has psionic manifestor flags set
- If costs not deducted, check lib-wrapper is loaded and registered
- If formula errors, check @sl and other roll data variables are available

**Module Dependencies:**
- lib-wrapper (required, already in dependencies)
- PF1 System v11+ (already required)

**Rollback Strategy:**
- Each task is a commit, can revert individual tasks if needed
- Phase 1 can be reverted without affecting rest of system
- Phase 4 depends on phases 1-3 being complete
