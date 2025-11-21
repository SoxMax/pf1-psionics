# Multi-Resource Costs Design

**Date:** 2024-11-21
**Status:** Design Phase

## Problem Statement

Psionic feats and class features need the ability to cost multiple resources simultaneously:
- Their own daily uses (existing `system.uses.value`)
- Power points from the actor's shared pool
- Psionic focus (expended on use)

Example: A feat might be "3/day, costs 2 power points, expends psionic focus" - all three conditions must be satisfied.

The existing PF1 charge system only supports one resource pool per item (either own uses OR linked charges via `links.charges`), not multiple simultaneous costs.

## Design Goals

1. **Multi-resource support** - Items can require multiple resources per use
2. **Generic & extensible** - Not hardcoded to power points; supports future resources (ki, grit, etc.)
3. **PF1 integration** - Power points appear in `actor.system.resources` alongside other pools
4. **Action-level overrides** - Individual actions can override item-level costs
5. **Temporary resources** - Support temporary power points (like temporary HP)

## Architecture Overview

### 1. ActorFlagResource Class

**Purpose:** Extend PF1's `Resource` class to wrap actor flag-based resource pools instead of item charges.

**Location:** `scripts/documents/actor/components/actor-flag-resource.mjs`

**Implementation:**
```javascript
export class ActorFlagResource extends Resource {
  /**
   * @param {ActorPF} actor - The actor owning this resource
   * @param {object} config - Resource configuration
   * @param {string} config.tag - Unique identifier (e.g., "powerPoints")
   * @param {string} config.flagPath - Path to flag data (e.g., "flags.pf1-psionics.powerPoints")
   */
  constructor(actor, config) {
    // Don't call super() - we're not wrapping an item
    this.actor = actor;
    this.config = config;

    Object.defineProperties(this, {
      _id: { value: config.tag, enumerable: true },
      tag: { value: config.tag, enumerable: true },
    });
  }

  get value() {
    const data = foundry.utils.getProperty(this.actor, this.config.flagPath);
    if (!data) return 0;
    return (data.current || 0) + (data.temporary || 0);
  }

  get max() {
    const data = foundry.utils.getProperty(this.actor, this.config.flagPath);
    return data?.maximum || 0;
  }

  async add(amount) {
    const data = foundry.utils.getProperty(this.actor, this.config.flagPath);
    if (!data) return;

    const updateData = {};

    if (amount > 0) {
      // Adding - goes to current only
      const newCurrent = Math.min(data.maximum, (data.current || 0) + amount);
      updateData[`${this.config.flagPath}.current`] = newCurrent;
    } else {
      // Removing - spend temporary first, then current
      let toRemove = Math.abs(amount);
      const temporary = data.temporary || 0;

      if (toRemove <= temporary) {
        updateData[`${this.config.flagPath}.temporary`] = temporary - toRemove;
      } else {
        toRemove -= temporary;
        updateData[`${this.config.flagPath}.temporary`] = 0;
        updateData[`${this.config.flagPath}.current`] = Math.max(0, (data.current || 0) - toRemove);
      }
    }

    return this.actor.update(updateData);
  }
}
```

**Registration in Actor Data Prep:**

In `scripts/documents/actor/actor-pf.mjs` during `pf1PrepareDerivedActorData`:

```javascript
import { ActorFlagResource } from "../components/actor-flag-resource.mjs";

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

### 2. Resource Costs Data Structure

**Schema Definition:**

Generic resource cost structure that can be added to any item type's data model:

```javascript
resourceCosts: new foundry.data.fields.ArrayField(
  new foundry.data.fields.SchemaField({
    tag: new foundry.data.fields.StringField({
      required: true,
      label: "PF1-Psionics.ResourceCosts.Tag"
    }),
    formula: new foundry.data.fields.StringField({
      required: true,
      label: "PF1-Psionics.ResourceCosts.Formula"
    }),
  }),
  { label: "PF1-Psionics.ResourceCosts.Label" }
)
```

**Item-Level Costs:**

In `scripts/dataModels/power-model.mjs`, add to schema:

```javascript
static defineSchema() {
  return {
    // ... existing fields (level, discipline, display, etc.) ...

    resourceCosts: new foundry.data.fields.ArrayField(
      new foundry.data.fields.SchemaField({
        tag: new foundry.data.fields.StringField({ required: true }),
        formula: new foundry.data.fields.StringField({ required: true }),
      })
    ),
  };
}
```

**Default for Powers:**

Powers automatically cost power points based on level:

```javascript
// In PowerModel or during power creation
resourceCosts: [
  { tag: "powerPoints", formula: "max(0, @sl * 2 - 1)" }
]
```

**Action-Level Overrides:**

Actions can override costs in their `uses` configuration:

```javascript
// Example: Action in power's actions array
{
  _id: "manifestAction",
  name: "Manifest Power",
  actionType: "save",
  activation: { type: "standard" },
  uses: {
    // Override item-level costs
    resourceCosts: [
      { tag: "powerPoints", formula: "5" },        // Fixed cost instead of formula
      { tag: "psionicFocus", formula: "1" }        // Also expend focus
    ]
  },
  // ... other action properties ...
}
```

**Override Behavior:** Action-level `resourceCosts` completely replaces item-level costs (not merged).

### 3. ActionUse Integration

Hook into PF1's action use system to check and deduct resource costs.

**Location:** Inject into `module/action-use/action-use.mjs` via lib-wrapper in `scripts/documents/action/action-use.mjs`

**Check Requirements Phase:**

```javascript
export function injectActionUse() {
  libWrapper.register(MODULE_ID, "pf1.ActionUse.prototype.checkRequirements",
    function(wrapped) {
      // Call original checks first
      const result = wrapped();
      if (result !== 0) return result;

      // Check resource costs
      const resourceCosts = this.action.uses?.resourceCosts || this.item.system.resourceCosts;
      if (!resourceCosts?.length) return 0;

      const rollData = this.item.getRollData();

      for (const cost of resourceCosts) {
        const resource = this.actor.system.resources[cost.tag];
        if (!resource) {
          console.warn(`Resource ${cost.tag} not found on actor ${this.actor.name}`);
          ui.notifications.warn(
            game.i18n.format("PF1-Psionics.Error.ResourceNotFound", { tag: cost.tag })
          );
          return ERR_REQUIREMENT.INSUFFICIENT_CHARGES;
        }

        const requiredAmount = RollPF.safeRollSync(cost.formula, rollData).total;

        if (resource.value < requiredAmount) {
          ui.notifications.warn(
            game.i18n.format("PF1-Psionics.Error.InsufficientResource", {
              resource: game.i18n.localize(`PF1-Psionics.Resources.${cost.tag}`),
              required: requiredAmount,
              available: resource.value
            })
          );
          return ERR_REQUIREMENT.INSUFFICIENT_CHARGES;
        }
      }

      return 0;
    }, "WRAPPER");
}
```

**Deduct Costs Phase:**

Inject into the action execution to deduct costs after success:

```javascript
libWrapper.register(MODULE_ID, "pf1.documents.item.ItemPF.prototype.use",
  async function(wrapped, options = {}) {
    const result = await wrapped(options);

    // If use was successful, deduct resource costs
    if (result && !options.skipCharges) {
      const action = this.actions?.get(options.actionId);
      const resourceCosts = action?.uses?.resourceCosts || this.system.resourceCosts;

      if (resourceCosts?.length) {
        const rollData = this.getRollData();

        for (const cost of resourceCosts) {
          const resource = this.actor.system.resources[cost.tag];
          if (resource) {
            const amount = RollPF.safeRollSync(cost.formula, rollData).total;
            await resource.add(-amount);
          }
        }
      }
    }

    return result;
  }, "WRAPPER");
```

### 4. PowerItem Refactoring

**Remove custom addCharges() override** (lines 216-239 in `scripts/documents/item/power-item.mjs`)

Powers no longer need special charge handling—they use the standard resource system.

**Simplify charge getters:**

```javascript
get charges() {
  return this.getPowerPoints();
}

get maxCharges() {
  return this.getPowerPoints(true);
}

getPowerPoints(max = false) {
  const itemData = this.system;
  if (itemData.atWill) return Number.POSITIVE_INFINITY;

  const resource = this.actor?.system.resources["powerPoints"];
  if (!resource) return 0;

  return max ? resource.max : resource.value;
}
```

**Keep existing methods:**
- `getDefaultChargeFormula()` - Still used to calculate cost for display
- `getLabels()` - Still shows charge cost in power description

## Implementation Plan

### Phase 1: Core Infrastructure
1. Create `ActorFlagResource` class
2. Register power points and focus as resources during actor data prep
3. Test that resources appear in `actor.system.resources` and have correct values

### Phase 2: Data Model
1. Add `resourceCosts` field to PowerModel schema
2. Set default power point cost for powers
3. Update power sheet to display/edit resource costs (if needed)

### Phase 3: Action Integration
1. Inject into ActionUse.checkRequirements to validate resource costs
2. Inject into ItemPF.use to deduct resource costs
3. Add localization strings for error messages

### Phase 4: PowerItem Refactoring
1. Remove custom addCharges() override
2. Update charge getters to use resource system
3. Test that powers still work correctly

### Phase 5: Testing & Polish
1. Test powers with multiple cost configurations
2. Test action-level overrides
3. Test temporary power points
4. Add UI indicators for resource costs
5. Update documentation

## Open Questions

1. **UI Display:** How should resource costs be displayed in item sheets and action cards?
2. **Localization:** What user-facing names should resources have? ("Power Points" vs "PP")
3. **Migration:** Do existing powers need data migration to add resourceCosts?
4. **Extensibility:** Should we expose an API for other modules to register actor flag resources?

## Future Extensions

1. **Psionic Feats:** Add `resourceCosts` to FeatModel for feats that cost power points/focus
2. **Class Features:** Similar support for class abilities
3. **Other Resource Types:** Ki pools, grit, panache, etc. could use the same system
4. **Cost Modifiers:** Feats/buffs that reduce resource costs (e.g., "Psionic costs reduced by 1")
5. **Alternate Costs:** "Use 3 daily charges OR 5 power points" (either/or instead of both)

## References

- PF1 Resource Class: `/home/cobrien/Code/foundryvtt-pathfinder1/module/documents/actor/components/resource.mjs`
- PF1 ActionUse: `/home/cobrien/Code/foundryvtt-pathfinder1/module/action-use/action-use.mjs`
- Current PowerItem: `scripts/documents/item/power-item.mjs`
- Current Actor Extensions: `scripts/documents/actor/actor-pf.mjs`
