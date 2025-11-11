# Feasibility Analysis: ItemAction Subclass for Psionic Augments

**Date**: November 10, 2025  
**Module**: pf1-psionics  
**Topic**: Creating a subclass of PF1e's ItemAction to capture psionic augments

---

## Executive Summary

Creating a subclass of PF1e's `ItemAction` for psionic augments is **technically feasible but architecturally problematic**. The PF1e system doesn't expose `ItemAction` as an extensible class hierarchy, and augments are fundamentally different from actions in purpose and lifecycle.

**Recommendation**: Instead of subclassing `ItemAction`, implement augments as a **parallel system** that integrates with the existing action infrastructure through hooks and the attack dialog.

---

## Current Architecture Analysis

### How PF1e's ItemAction Works

The `ItemAction` class in PF1e (`pf1.components.ItemAction`) represents individual **actions** that an item can perform:
- Stored in the `actions` array on items
- Contains properties like `activation`, `range`, `duration`, `target`, `save`, `actionType`
- Used for both spells and powers - your module already uses this
- Currently, you hook into `ItemAction.prototype.getDC` to calculate power DCs

**Current Implementation** (from `scripts/documents/action/action.mjs`):
```javascript
export function injectItemAction() {
  libWrapper.register(MODULE_ID, "pf1.components.ItemAction.prototype.getDC", 
    function (wrapped, rollData) {
      if (this.item.type === `${MODULE_ID}.power`) {
        // Custom DC calculation for powers
        // Uses psibook.baseDCFormula
        // Accounts for spell level, ability modifier, bonuses
      }
      return wrapped(rollData);
    }, "MIXED");
}
```

### How Your Module Currently Works

From the code review:
1. **Powers as Items**: You extend `ItemPF` with `PowerItem` class
2. **Action Integration**: You use lib-wrapper to inject into `ItemAction.prototype.getDC`
3. **Power Points**: Tracked at actor level via flags (`flags.pf1-psionics.powerPoints`)
4. **Augment Text**: Currently stored in `system.description.augment` (see `tools/packs.mjs:136`)
5. **Attack Dialog**: Custom template added via `renderAttackDialogHook` in `attack-dialog.mjs`
6. **Power Point Cost**: Calculated via formula (default: `max(0, @sl * 2 - 1)`)

---

## The Augment Problem

### What Augments Are

Psionic augments are **variable power configurations**:
- Increase power point cost to enhance effects
- **Example**: Mind Thrust costs 1 PP base, +1 PP per additional die of damage
- **Multiple options**: Some powers have several different augment choices
- **Limited by manifester level**: Maximum PP spent = manifester level
- **Optional**: Manifester chooses augments each time they use the power

### Why This Doesn't Map to ItemAction

#### 1. Lifecycle Mismatch
- **ItemActions are static** - Defined when the item is created
- **Augments are dynamic** - Chosen at manifestation time
- **Augments modify the base action** - They don't replace it

#### 2. Data Model Mismatch
- **ItemActions** represent "what the power does"
- **Augments** represent "optional enhancements to what it does"
- **One power = ONE action + MULTIPLE augment options**
- Creating separate ItemAction instances for each augment would pollute the UI

#### 3. UI/UX Mismatch
- **ItemActions** appear in the item's action list as separate, independent actions
- **Augments** should appear in the manifestation dialog as mutually exclusive or stackable choices
- **User expectation**: Select augments each time they manifest, not pick from a list of "versions"

---

## Feasibility of Subclassing ItemAction

### Technical Feasibility: 🟡 MEDIUM

**Pros:**
- PF1e uses `CONFIG.Item.actionClasses` registration (you could theoretically add a custom class)
- lib-wrapper lets you hook into action methods to modify behavior
- JavaScript allows class extension even if not officially supported by the API

**Cons:**
- ❌ PF1e doesn't document `ItemAction` as an extensible API
- ❌ You'd be fighting the system's assumptions (one action per usage)
- ❌ Breaking changes in PF1e updates could break your subclass
- ❌ Complex to maintain and debug
- ❌ Would require significant UI changes to prevent confusion
- ❌ Power point cost calculation becomes complex (which action's cost applies?)

### Code Example (If You Did This - NOT RECOMMENDED)

```javascript
// This would be TECHNICALLY possible but NOT recommended
export class AugmentAction extends pf1.components.ItemAction {
  constructor(data, item) {
    super(data, item);
    this.augmentCost = data.augmentCost || 0;
    this.augmentDescription = data.augmentDescription || "";
    this.baseActionId = data.baseActionId || null;
  }
  
  // Override methods to account for augment effects
  getDC(rollData) {
    const baseDC = super.getDC(rollData);
    // Example: DC increases with augment cost
    return baseDC + Math.floor(this.augmentCost / 2);
  }
  
  // Override damage, range, etc.
  getDamage(rollData) {
    const baseDamage = super.getDamage(rollData);
    // Modify damage based on augment
    return baseDamage; // ...modified
  }
}

// Register it
CONFIG.Item.actionClasses['augment'] = AugmentAction;

// In PowerItem, create multiple actions:
// - Base action (no augment)
// - Augment option 1 (e.g., +1d10 damage for +2 PP)
// - Augment option 2 (e.g., +10 ft range for +1 PP)
// - etc.
```

**Critical Problems with this approach:**

1. ❌ **Action List Clutter**: Every power would show 3-5+ actions in the UI
2. ❌ **Confusing UX**: Which action should I use? What's the difference?
3. ❌ **Power Point Complexity**: Each action needs its own cost formula
4. ❌ **No Combination Support**: Can't easily combine multiple augments
5. ❌ **Maintenance Nightmare**: Every augment is a separate action object to manage
6. ❌ **Dialog Integration**: Attack dialog would need major rework to handle multiple actions
7. ❌ **Chat Card Confusion**: Which action shows in the chat output?

---

## Recommended Alternative Architecture

### Approach: Augments as Metadata + Dialog Integration

Store augments as structured data on the power, then present them in the attack dialog as selectable options.

### Architecture Overview

```
PowerModel (data)
  └─ actions: [ItemAction]  <-- Existing, unchanged
  └─ augments: [Augment]    <-- NEW structured augment data

Attack Dialog (UI)
  └─ Augment Selector       <-- NEW UI component
       └─ Selected augments modify rollData

Action Use (execution)
  └─ Apply augment effects  <-- NEW hook integration
       └─ Modify damage, DC, PP cost, etc.
```

---

### Implementation Details

#### 1. Data Model Extension

**File**: `scripts/dataModels/item/power-model.mjs`

```javascript
export class PowerModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const {
      SchemaField,
      StringField,
      NumberField,
      BooleanField,
      ArrayField,
      ObjectField,
    } = foundry.data.fields;

    return {
      // ...existing fields (description, tags, actions, etc.)...
      
      // NEW: Augment options
      augments: new ArrayField(new SchemaField({
        _id: new StringField({required: true, initial: () => foundry.utils.randomID()}),
        name: new StringField({required: true, initial: ""}),
        description: new StringField({required: true, initial: ""}),
        
        // Cost and limits
        costFormula: new StringField({
          required: true, 
          initial: "1",
          hint: "Formula for additional PP cost (e.g., '2', '@sl', '1d4')"
        }),
        maxUses: new NumberField({
          required: false,
          initial: null,
          hint: "Maximum times this augment can be applied (null = unlimited)"
        }),
        requiresFocus: new BooleanField({
          initial: false,
          hint: "Does this augment require expending psionic focus?"
        }),
        
        // What this augment modifies
        effects: new SchemaField({
          // Damage modifications
          damageBonus: new StringField({
            initial: "",
            hint: "Bonus damage formula (e.g., '1d10', '@sl d6')"
          }),
          damageMult: new NumberField({
            initial: 1,
            hint: "Damage multiplier (e.g., 1.5 for 50% increase)"
          }),
          
          // Duration modifications
          durationMultiplier: new NumberField({
            initial: 1,
            hint: "Duration multiplier (e.g., 2 for double duration)"
          }),
          durationBonus: new StringField({
            initial: "",
            hint: "Added duration (e.g., '1 round', '1 minute')"
          }),
          
          // Range modifications
          rangeMultiplier: new NumberField({
            initial: 1,
            hint: "Range multiplier (e.g., 2 for double range)"
          }),
          rangeBonus: new StringField({
            initial: "",
            hint: "Added range in feet (e.g., '10', '5 * @cl')"
          }),
          
          // Target modifications
          targetBonus: new StringField({
            initial: "",
            hint: "Additional targets (e.g., '+1', '@cl')"
          }),
          
          // DC modifications
          dcBonus: new NumberField({
            initial: 0,
            hint: "Bonus to save DC"
          }),
          
          // CL modifications
          clBonus: new NumberField({
            initial: 0,
            hint: "Effective manifester level increase"
          }),
          
          // Special effects (free-form)
          special: new StringField({
            initial: "",
            hint: "Special effects not covered by other fields"
          })
        }),
        
        // Conditions
        conditions: new SchemaField({
          minLevel: new NumberField({
            initial: 0,
            hint: "Minimum manifester level required"
          }),
          maxLevel: new NumberField({
            required: false,
            initial: null,
            hint: "Maximum manifester level (null = no limit)"
          }),
          requiresCondition: new StringField({
            initial: "",
            hint: "Special condition text (e.g., 'if target is undead')"
          })
        })
      }), {initial: []})
    };
  }
}
```

#### 2. Attack Dialog Integration

**File**: `scripts/documents/action/attack-dialog.mjs`

```javascript
import { MODULE_ID } from "../../_module.mjs";

export async function renderAttackDialogHook(app, html, data) {
  if (data.item.type !== `${MODULE_ID}.power`) return;
  
  // Existing power controls...
  const powerControls = await foundry.applications.handlebars.renderTemplate(
    "modules/pf1-psionics/templates/action/attack-dialog.hbs", 
    data
  );
  const controls = html.find(".conditionals");
  controls.after(powerControls);
  
  // NEW: Add augment selector
  const power = data.item;
  const augments = power.system.augments || [];
  const manifestCL = data.rollData?.cl || 0;
  
  if (augments.length > 0) {
    // Filter augments by manifester level
    const availableAugments = augments.filter(aug => {
      const minLevel = aug.conditions?.minLevel || 0;
      const maxLevel = aug.conditions?.maxLevel || Infinity;
      return manifestCL >= minLevel && manifestCL <= maxLevel;
    });
    
    if (availableAugments.length > 0) {
      const augmentControls = await foundry.applications.handlebars.renderTemplate(
        "modules/pf1-psionics/templates/action/augment-selector.hbs",
        { 
          augments: availableAugments,
          manifestCL: manifestCL,
          currentFocus: data.actor.flags?.[MODULE_ID]?.focus?.current || 0
        }
      );
      html.find(".conditionals").after(augmentControls);
      
      // Handle augment selection
      html.find('input[name="augment"]').on("change", function() {
        const augmentId = $(this).val();
        const checked = $(this).is(':checked');
        
        // Initialize selected augments array if needed
        app.rollData.selectedAugments = app.rollData.selectedAugments || [];
        
        if (checked) {
          // Add augment
          const augment = availableAugments.find(a => a._id === augmentId);
          app.rollData.selectedAugments.push(augment);
          
          // Calculate additional PP cost
          const augmentCost = RollPF.safeRollSync(
            augment.costFormula, 
            app.rollData
          ).total;
          
          app.rollData.chargeCostBonus = (app.rollData.chargeCostBonus || 0) + augmentCost;
        } else {
          // Remove augment
          const idx = app.rollData.selectedAugments.findIndex(a => a._id === augmentId);
          if (idx >= 0) {
            const augment = app.rollData.selectedAugments[idx];
            const augmentCost = RollPF.safeRollSync(
              augment.costFormula, 
              app.rollData
            ).total;
            
            app.rollData.chargeCostBonus = (app.rollData.chargeCostBonus || 0) - augmentCost;
            app.rollData.selectedAugments.splice(idx, 1);
          }
        }
        
        // Re-render to update displayed cost
        app.render();
      });
    }
  }
  
  // Force the application to recalculate its dimensions
  app.setPosition({ height: "auto" });

  // Existing event handlers...
  html.find('input.attribute[name="sl-offset"]').on("change", app._onChangeAttribute.bind(app));
  html.find('input.attribute[name="cl-offset"]').on("change", app._onChangeAttribute.bind(app));
  html.find('input.attribute[name="pp-offset"]').on("change", onChangeAttribute.bind(app));
  html.find('input[type="checkbox"][name="concentration"]').on("change", app._onToggleFlag.bind(app));
  html.find('input[type="checkbox"][name="cl-check"]').on("change", app._onToggleFlag.bind(app));
}

function onChangeAttribute(event) {
  event.preventDefault();
  const elem = event.currentTarget;
  this.attributes[elem.name] = elem.value;

  switch (elem.name) {
    case "pp-offset":
      this.rollData.chargeCostBonus = (this.rollData?.chargeCostBonus ?? 0) + parseInt(elem.value);
      break;
  }

  this.render();
}
```

**New Template**: `templates/action/augment-selector.hbs`

```handlebars
<section class="augments">
  <header>
    <h3>{{localize "PF1-Psionics.Augments"}}</h3>
  </header>
  
  <div class="augment-list">
    {{#each augments}}
      <div class="augment-option">
        <label>
          <input type="checkbox" 
                 name="augment" 
                 value="{{this._id}}"
                 {{#if this.requiresFocus}}data-requires-focus="true"{{/if}}
                 {{#if this.maxUses}}data-max-uses="{{this.maxUses}}"{{/if}}>
          
          <span class="augment-name">{{this.name}}</span>
          <span class="augment-cost">(+{{this.costFormula}} PP)</span>
        </label>
        
        <div class="augment-description">
          {{this.description}}
        </div>
        
        {{#if this.conditions.requiresCondition}}
          <div class="augment-condition">
            <em>{{this.conditions.requiresCondition}}</em>
          </div>
        {{/if}}
        
        {{#if this.effects.special}}
          <div class="augment-special">
            {{this.effects.special}}
          </div>
        {{/if}}
      </div>
    {{/each}}
  </div>
</section>
```

#### 3. Effect Application

**File**: `scripts/documents/action/action-use.mjs`

```javascript
import { MODULE_ID } from "../../_module.mjs";

export function injectActionUse() {
  libWrapper.register(MODULE_ID, "pf1.actionUse.ActionUse.prototype.getMessageData", 
    function () {
      if (this.item.type === `${MODULE_ID}.power`) {
        this.shared.templateData.casterLevelCheck = this.shared.casterLevelCheck;
        this.shared.templateData.concentrationCheck = this.shared.concentrationCheck;
        
        // NEW: Add augment information to chat card
        this.shared.templateData.augments = this.shared.rollData.selectedAugments || [];
      }
    }, "LISTENER");
}

export function pf1PreActionUseHook(actionUse) {
  if (actionUse.item.type === `${MODULE_ID}.power`) {
    // Handle power cost too expensive
    const chargeCost = actionUse.shared.rollData.chargeCost || 0;
    const cl = actionUse.shared.rollData.cl || 0;
    if (chargeCost > cl) {
      ui.notifications.error(game.i18n.localize("PF1-Psionics.Error.PowerCostTooHigh"));
      return false;
    }
    
    // NEW: Apply augment effects
    const selectedAugments = actionUse.shared.rollData.selectedAugments || [];
    if (selectedAugments.length > 0) {
      applyAugmentEffects(actionUse, selectedAugments);
    }
  }
}

/**
 * Apply augment effects to the action use
 * @param {ActionUse} actionUse - The action being used
 * @param {Array} augments - Selected augments
 */
function applyAugmentEffects(actionUse, augments) {
  const rollData = actionUse.shared.rollData;
  
  for (const augment of augments) {
    const effects = augment.effects;
    
    // Apply damage bonus
    if (effects.damageBonus) {
      // Add to damage formula
      // This would integrate with PF1's damage system
      rollData.damageBonus = (rollData.damageBonus || "") + " + " + effects.damageBonus;
    }
    
    // Apply damage multiplier
    if (effects.damageMult && effects.damageMult !== 1) {
      rollData.damageMult = (rollData.damageMult || 1) * effects.damageMult;
    }
    
    // Apply DC bonus
    if (effects.dcBonus) {
      rollData.dcBonus = (rollData.dcBonus || 0) + effects.dcBonus;
    }
    
    // Apply CL bonus
    if (effects.clBonus) {
      rollData.cl = (rollData.cl || 0) + effects.clBonus;
    }
    
    // Apply range multiplier
    if (effects.rangeMultiplier && effects.rangeMultiplier !== 1) {
      // Modify range in action data
      const action = actionUse.action;
      if (action?.range?.value) {
        action.range.value = Math.floor(action.range.value * effects.rangeMultiplier);
      }
    }
    
    // Apply duration multiplier
    if (effects.durationMultiplier && effects.durationMultiplier !== 1) {
      const action = actionUse.action;
      if (action?.duration?.value) {
        action.duration.value = Math.floor(action.duration.value * effects.durationMultiplier);
      }
    }
    
    // Check for psionic focus requirement
    if (augment.requiresFocus) {
      const currentFocus = actionUse.actor.flags?.[MODULE_ID]?.focus?.current || 0;
      if (currentFocus < 1) {
        ui.notifications.warn(
          game.i18n.localize("PF1-Psionics.Warning.AugmentRequiresFocus")
        );
        // Could optionally prevent the power use
      } else {
        // Expend focus
        rollData.expendFocus = true;
      }
    }
  }
}
```

#### 4. Localization

**File**: `lang/en.json`

```json
{
  "PF1-Psionics.Augments": "Augments",
  "PF1-Psionics.AugmentCost": "Augment Cost",
  "PF1-Psionics.NoAugments": "No augments available at your manifester level",
  "PF1-Psionics.Warning.AugmentRequiresFocus": "This augment requires psionic focus, which you do not have.",
  "PF1-Psionics.Error.PowerCostTooHigh": "Power point cost exceeds your manifester level"
}
```

---

## Benefits of This Approach

### ✅ Architectural Benefits
1. **Cleaner Data Model** - Augments are clearly separate from actions
2. **System Compatibility** - Doesn't fight PF1e architecture
3. **Maintainable** - Follows established patterns in your module
4. **Forward Compatible** - Less likely to break with PF1e updates

### ✅ User Experience Benefits
1. **Better UX** - Manifester sees augment options clearly in dialog
2. **Intuitive** - Checkbox/radio selection matches player expectations
3. **Clear Costs** - PP cost updates dynamically as augments are selected
4. **Manifester Level Awareness** - Only shows available augments

### ✅ Development Benefits
1. **Extensible** - Easy to add new augment types
2. **Reusable** - Effect system can be expanded
3. **Testable** - Each component can be tested independently
4. **Power Point Integration** - Works with existing cost calculation

### ✅ Content Benefits
1. **Structured Data** - Augments are machine-readable
2. **Searchable** - Can query powers by augment types
3. **Migratable** - Can parse existing augment text into structured data
4. **Flexible** - Supports various augment patterns from the books

---

## Implementation Roadmap

### Phase 1: Data Model (1-2 hours)
- [ ] Add `augments` array field to `PowerModel` in `power-model.mjs`
- [ ] Define augment schema with effects and conditions
- [ ] Test schema with a sample power
- [ ] Verify data persists correctly in compendium

**Deliverable**: Powers can store augment data

---

### Phase 2: UI Integration (2-3 hours)
- [ ] Create `augment-selector.hbs` template
- [ ] Extend `renderAttackDialogHook` in `attack-dialog.mjs`
- [ ] Add checkbox event handlers for augment selection
- [ ] Update power point cost display dynamically
- [ ] Add CSS styling for augment selector
- [ ] Test with multiple augments on a single power

**Deliverable**: Augments appear in attack dialog and update PP cost

---

### Phase 3: Effect Application (2-4 hours)
- [ ] Create `applyAugmentEffects()` function in `action-use.mjs`
- [ ] Hook into `pf1PreActionUseHook` to apply effects
- [ ] Implement damage formula modifications
- [ ] Implement DC bonus application
- [ ] Implement range/duration modifications
- [ ] Implement CL bonus application
- [ ] Add manifester level limit validation
- [ ] Handle psionic focus expenditure
- [ ] Add augment info to chat cards

**Deliverable**: Selected augments modify power effects

---

### Phase 4: Testing & Refinement (1-2 hours)
- [ ] Test with common augment patterns (damage scaling, target increase, etc.)
- [ ] Test edge cases (multiple augments, conflicting effects, etc.)
- [ ] Test with different manifester levels
- [ ] Test PP cost validation
- [ ] Verify chat card output
- [ ] Performance testing with many augments

**Deliverable**: System is stable and handles edge cases

---

### Phase 5: Content Migration (variable time)
- [ ] Identify powers with augments in compendium
- [ ] Parse augment text from `system.description.augment`
- [ ] Convert to structured augment data
- [ ] Update YAML files in `packs-source/powers/`
- [ ] Recompile compendium packs
- [ ] Verify in-game display

**Deliverable**: Powers have structured augment data

**Note**: This phase can be done incrementally, power by power or discipline by discipline.

---

### Phase 6: Polish & Documentation (1-2 hours)
- [ ] Add tooltips to augment selector
- [ ] Add help text explaining augments
- [ ] Document augment schema in CLAUDE.md
- [ ] Add examples to tools documentation
- [ ] Create scraper support for augments (if applicable)

**Deliverable**: Feature is documented and user-friendly

---

## Total Estimated Time

**Core Implementation (Phases 1-3)**: 5-9 hours  
**Testing & Polish (Phases 4-6)**: 2-4 hours  
**Content Migration (Phase 5)**: Variable (10-40 hours depending on scope)

**Minimum Viable Implementation**: ~7-11 hours  
**Complete Implementation**: ~17-53 hours (including content migration)

---

## Example: Mind Thrust with Augments

### Current State (Text Only)

```yaml
# mind-thrust.Pc1iDmsJfiFlWZM0.yaml
system:
  description:
    value: "<p>You instantly deliver a massive assault on the thought pathways...</p>"
    augment: "<p>For every additional power point you spend, this power's damage increases by 1d10.</p>"
```

### Proposed State (Structured)

```yaml
# mind-thrust.Pc1iDmsJfiFlWZM0.yaml
system:
  description:
    value: "<p>You instantly deliver a massive assault on the thought pathways...</p>"
    augment: "<p>For every additional power point you spend, this power's damage increases by 1d10.</p>"
  
  augments:
    - _id: "augment001"
      name: "Increased Damage"
      description: "Increase the power's damage"
      costFormula: "1"  # Cost per use
      maxUses: null     # Can be applied multiple times
      effects:
        damageBonus: "1d10"  # +1d10 per application
      conditions:
        minLevel: 1
```

### In-Game Experience

1. **Player clicks to manifest Mind Thrust**
2. **Attack dialog opens with augment options:**
   ```
   ☐ Increased Damage (+1 PP)
     +1d10 damage
   ```
3. **Player checks box 3 times** (if CL allows)
4. **PP cost updates**: Base 1 PP → 4 PP total
5. **Damage formula updates**: 1d10 → 4d10
6. **Player confirms and manifests power**

---

## Conclusion

**Don't subclass ItemAction.** Instead:

1. ✅ **Add structured augment data** to `PowerModel`
2. ✅ **Integrate with attack dialog** to present choices
3. ✅ **Apply effects** through existing hooks in action-use

This approach:
- Works **with** PF1e's architecture instead of against it
- Provides **better UX** for manifesters
- Is more **maintainable** and extensible
- Leverages your **existing infrastructure** (power points, dialogs, hooks)
- Allows **incremental content migration**

The recommended architecture provides a clean separation of concerns:
- **Data Layer**: PowerModel stores augment options
- **UI Layer**: Attack dialog presents choices
- **Logic Layer**: ActionUse applies effects

This matches how PF1e handles similar features (metamagic, spell variants) and will be easier to maintain long-term.

---

## Future Enhancements

Once the basic system is in place, consider:

1. **Augment Presets**: Save common augment combinations
2. **Augment Automation**: Auto-apply augments based on actor flags
3. **Augment Scaling**: Augments that scale with manifester level
4. **Conditional Augments**: Augments that only apply in certain situations
5. **Augment Feats**: Feats that modify or enhance augments
6. **Power Browser Integration**: Filter/search by augment capabilities

---

## References

- **PF1 System Source**: https://gitlab.com/foundryvtt_pathfinder1e/foundryvtt-pathfinder1
- **Current Module Docs**: `/home/cobrien/.../pf1-psionics/CLAUDE.md`
- **Attack Dialog Hook**: `scripts/documents/action/attack-dialog.mjs`
- **Action Use Hook**: `scripts/documents/action/action-use.mjs`
- **Power Model**: `scripts/dataModels/item/power-model.mjs`

