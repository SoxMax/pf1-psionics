# Active Energy Type Implementation Options

**Date:** 2025-12-13 (Updated: 2025-12-14)
**Context:** Energy Ray and similar powers need to dynamically change behavior based on the manifester's active energy type (cold, electricity, fire, sonic).

**Status:** ✅ **CHOSEN APPROACH** - Formula-Based with Augments Exposed to Roll Data (see section below)

## Current State

### What's Already Implemented

**Active Energy Type Tracking:**
- Stored as actor flag: `flags.pf1-psionics.activeEnergy`
- Default: `"fire"`
- Valid types: `["cold", "electricity", "fire", "sonic"]`
- UI: Dropdown selector in actor sheet's Psionics tab
- API: `actor.psionics.activeEnergy` (getter) and `actor.psionics.setActiveEnergy(value)` (setter)
- Configuration: `pf1.config.psionics.activeEnergyTypes` maps to localized labels

**Implementation Files:**
- `scripts/data/powerpoints.mjs` - Flag constant
- `scripts/helpers/psionics-helper.mjs` - Getter/setter methods
- `scripts/hooks/init.mjs` - Configuration registration
- `templates/actor/actor-manifester-front.hbs` - UI dropdown

### Current Limitations

**Energy Ray Power Example:**
```yaml
# packs-source/powers/psychokinesis.wv2tB7DsEYZGDsBW/energy-ray.nQrXRrV10cQ2s39s.yaml
system:
  actions:
    - actionType: rsak
      damage:
        parts:
          - formula: "1d6"
            # No damage type specified
```

**Problems:**
1. Damage formula is static - doesn't adjust for energy type bonuses
2. No damage type field - can't dynamically apply cold/fire/electricity/sonic
3. Energy-specific effects documented in description but not applied:
   - **Cold:** +1 damage per die
   - **Electricity:** +3 attack bonus if target wearing metal armor
   - **Fire:** +1 damage per die
   - **Sonic:** -1 damage per die, ignores hardness

**Other Affected Powers:**
- Energy Ball (level 4) - Area effect with save
- Energy Touch (level 1) - Melee touch attack, multiple targets
- Several other psychokinesis powers reference active energy type

## PF1e Action Architecture Context

### Action Damage Structure

Actions store damage in `damage.parts` arrays as `DamagePartModel` objects:

```javascript
{
  formula: String,              // "1d6+5", "@ablDamage", etc.
  types: Set<String>            // ["cold", "fire", "magical", custom types]
}
```

**Key Points:**
- Multiple damage arrays: `damage.parts`, `damage.critParts`, `damage.nonCritParts`
- Damage types can be standard (from `pf1.registry.damageTypes`) or custom strings
- Formulas evaluated at roll time via `RollPF.safeRollSync()`

### Psionics Integration Points

**Current Hooks** (in `scripts/documents/action/`):
1. **DC Calculation** (`action.mjs`) - Overrides DC for psionic powers
2. **Power Point Cost** (`action-use.mjs`) - Validates and deducts PP
3. **Augment Application** (`action-use.mjs`) - Applies augment effects to roll data

**Augment Pattern:**
- Modifies `rollData` at action use time
- Properties: `chargeCostBonus`, `damageBonuses`, `damageMult`, `dcBonus`, `clBonus`, etc.
- Applied before roll, affects formulas via roll data substitution

---

## ✅ CHOSEN APPROACH: Simple Formula-Based (Augments Reference @energyBonus)

**Decision Date:** 2025-12-14
**Refined:** 2025-12-14 (simplified based on user insight)

### Overview

After investigating PF1e's action use flow and timing constraints, we've chosen a **simple formula-based approach** that:
1. **Applies energy effects FIRST** - Sets `@energyBonus` in rollData before augments are evaluated
2. **Augments reference energy variables** - Both action formulas and augment formulas use `@energyBonus`
3. **No complex dice parsing needed** - Augments naturally accumulate via `shared.damageBonus` array
4. **Energy effects stored per-power** - Each power defines how different energy types affect it

### Why This Approach?

**Key Insight (User):**
> "Instead of moving augment logic into the action formula, couldn't both the formula for the Energy Ray action be `1d6 + @energyBonus` and then the damage augment for Energy Ray could be `1d6 + @energyBonus` as well?"

**This is brilliant because:**
- ✅ **No parsing needed** - Don't count dice, just let PF1's existing augment system work
- ✅ **Augments stay simple** - They're just additive bonuses (existing behavior)
- ✅ **Cleaner formulas** - `1d6 + @energyBonus` instead of `(1 + @augment.damageDice)d6 + (@energyBonus * (1 + @augment.damageDice))`
- ✅ **More maintainable** - Less code complexity
- ✅ **Naturally handles all cases** - Including sonic penalty (`1d6 - 1`)

**Timing Investigation Results:**
- PF1e's `generateChatAttacks()` runs at line 1671 of `action-use.mjs`
- Script calls execute at line 1684 - **AFTER damage rolls are complete**
- Script calls in "use" category **cannot modify damage** because it's already rolled
- The only way to influence damage is to modify `rollData` **before** `generateChatAttacks()` executes

**Critical Flow (Updated):**
```
1. alterRollData() [line 1621]:
   a. Apply energy effects FIRST → Sets @energyBonus, @activeEnergy
   b. THEN apply augments → Augment formulas can reference @energyBonus
2. generateChatAttacks() [line 1671] → Damage rolled using rollData
3. executeScriptCalls("use") [line 1684] → Scripts run (TOO LATE!)
```

### Example: Energy Ray

**Action Formula:**
```yaml
damage:
  parts:
    - formula: 1d6 + @energyBonus
      types: ["@activeEnergy"]
```

**Augment Formula:**
```yaml
augments:
  - cost: 1
    effects:
      damageBonus: 1d6 + @energyBonus
```

**How It Works:**
1. **Base manifestation (no augments), cold active:**
   - Action: `1d6 + @energyBonus` where `@energyBonus = 1`
   - Result: `1d6 + 1` cold damage ✅

2. **Augmented +1 PP, fire active:**
   - Action: `1d6 + @energyBonus` where `@energyBonus = 1`
   - Augment: `1d6 + @energyBonus` (pushed to `shared.damageBonus`)
   - Result: `1d6 + 1` + `1d6 + 1` = `2d6 + 2` fire damage ✅

3. **Augmented +2 PP, sonic active:**
   - Action: `1d6 + @energyBonus` where `@energyBonus = -1`
   - Augment 1: `1d6 + @energyBonus`
   - Augment 2: `1d6 + @energyBonus`
   - Result: `1d6 - 1` + `1d6 - 1` + `1d6 - 1` = `3d6 - 3` sonic damage ✅

4. **Augmented +1 PP, electricity active:**
   - Action: `1d6 + @energyBonus` where `@energyBonus = 0`
   - Augment: `1d6 + @energyBonus`
   - Result: `1d6` + `1d6` = `2d6` electricity damage
   - Plus: `attackBonus = +3` vs metal armor (applied separately) ✅

---

## Implementation Plan (Simplified)

### Phase 1: Apply Energy Effects BEFORE Augments

**Goal:** Set `@energyBonus` and other energy variables in `rollData` BEFORE augments are evaluated, so augment formulas can reference these values.

#### 1.1 Create `applyEnergyEffects()` Function

**File:** `scripts/documents/action/action-use.mjs`

**Status:** ✅ **COMPLETE** (lines 39-111)

**What It Does:**
```javascript
function applyEnergyEffects(actionUse) {
  // Get active energy type from actor flags
  const activeEnergy = actor.flags?.["pf1-psionics"]?.activeEnergy || "fire";
  const energyEffects = item.system.energyEffects?.[activeEnergy];

  // Set in rollData (BEFORE augments are evaluated)
  rollData.energyBonus = energyEffects?.damagePerDie ?? 0;
  rollData.activeEnergy = activeEnergy;

  // Apply attack bonuses, save type overrides, PR bonuses, etc.
  if (energyEffects?.attackBonus) {
    shared.attackBonus.push(`${energyEffects.attackBonus}[${energyEffects.attackNote || activeEnergy}]`);
  }

  if (energyEffects?.saveType) {
    rollData.energySaveType = energyEffects.saveType;
    action.save.type = energyEffects.saveType; // Direct override
  }
}
```

**Key Points:**
- ✅ Runs FIRST (before augments)
- ✅ Sets `@energyBonus`, `@activeEnergy` in rollData
- ✅ Powers without `energyEffects` get `@energyBonus = 0` (safe default)
- ✅ Augment formulas can now reference `@energyBonus`

#### 1.2 Update `alterRollData` Wrapper to Apply Energy Effects First

**File:** `scripts/documents/action/action-use.mjs`

**Status:** ✅ **COMPLETE** (lines 11-23)

**Changes:**
```javascript
libWrapper.register(MODULE_ID, "pf1.actionUse.ActionUse.prototype.alterRollData", function() {
  if (this.item.type === `${MODULE_ID}.power`) {
    // ✨ CRITICAL: Apply energy effects FIRST (sets @energyBonus, @activeEnergy, etc.)
    applyEnergyEffects(this);

    // THEN apply augments (formulas can now reference @energyBonus)
    const augmentCounts = this.shared.rollData.augmentCounts || {};
    if (Object.keys(augmentCounts).length > 0) {
      applyAugmentEffects(this, augmentCounts);
    }
  }
}, "LISTENER");
```

**Key Points:**
- ✅ Order matters: Energy → Augments
- ✅ Augment formulas (`1d6 + @energyBonus`) are evaluated after `@energyBonus` is set
- ✅ No parsing needed

#### 1.3 Optional: Expose Augment Metadata for Complex Formulas

**File:** `scripts/documents/action/action-use.mjs`

**Status:** ✅ **COMPLETE** (lines 125-133)

**What It Does:**
```javascript
// In applyAugmentEffects()
rollData.augment = {
  damageMult: totals.damageMult || 1,
  dcBonus: totals.dcBonus || 0,
  clBonus: totals.clBonus || 0,
  totalCost: totals.chargeCostBonus || 0,
  durationMult: totals.durationMultiplier || 1,
};
```

**Key Points:**
- ✅ NOT needed for damage (augments use `@energyBonus` directly)
- ✅ Useful for DC formulas like `10 + @sl + @augment.dcBonus`
- ✅ Useful for duration formulas like `@cl * @augment.durationMult`

---

### Phase 2: Energy Effects Data Structure

**Status:** 🔄 **IN PROGRESS** (YAML updated, PowerModel schema pending)

**Goal:** Define how different energy types affect each power.

#### 2.1 Add `energyEffects` Field to PowerModel

**File:** `scripts/dataModels/item/power-model.mjs`

**Location:** After line 95 (before `augments` field)

**Changes Required:**
```javascript
export class PowerModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      // ... existing fields ...

      // ✨ NEW: Energy-specific effects
      energyEffects: new fields.SchemaField({
        cold: new fields.SchemaField({
          damagePerDie: new fields.NumberField({ required: false, nullable: true, initial: null }),
          attackBonus: new fields.NumberField({ required: false, nullable: true, initial: null }),
          attackNote: new fields.StringField({ required: false, blank: true }),
          saveType: new fields.StringField({ required: false, blank: true }), // Override save type
          saveDC: new fields.StringField({ required: false, blank: true }), // DC formula
          powerResistanceBonus: new fields.NumberField({ required: false, nullable: true, initial: null }),
          special: new fields.StringField({ required: false, blank: true }), // Special notes
        }, { required: false }),

        electricity: new fields.SchemaField({
          damagePerDie: new fields.NumberField({ required: false, nullable: true, initial: null }),
          attackBonus: new fields.NumberField({ required: false, nullable: true, initial: null }),
          attackNote: new fields.StringField({ required: false, blank: true }),
          saveType: new fields.StringField({ required: false, blank: true }),
          saveDC: new fields.StringField({ required: false, blank: true }),
          powerResistanceBonus: new fields.NumberField({ required: false, nullable: true, initial: null }),
          special: new fields.StringField({ required: false, blank: true }),
        }, { required: false }),

        fire: new fields.SchemaField({
          damagePerDie: new fields.NumberField({ required: false, nullable: true, initial: null }),
          attackBonus: new fields.NumberField({ required: false, nullable: true, initial: null }),
          attackNote: new fields.StringField({ required: false, blank: true }),
          saveType: new fields.StringField({ required: false, blank: true }),
          saveDC: new fields.StringField({ required: false, blank: true }),
          powerResistanceBonus: new fields.NumberField({ required: false, nullable: true, initial: null }),
          special: new fields.StringField({ required: false, blank: true }),
        }, { required: false }),

        sonic: new fields.SchemaField({
          damagePerDie: new fields.NumberField({ required: false, nullable: true, initial: null }),
          attackBonus: new fields.NumberField({ required: false, nullable: true, initial: null }),
          attackNote: new fields.StringField({ required: false, blank: true }),
          saveType: new fields.StringField({ required: false, blank: true }),
          saveDC: new fields.StringField({ required: false, blank: true }),
          powerResistanceBonus: new fields.NumberField({ required: false, nullable: true, initial: null }),
          special: new fields.StringField({ required: false, blank: true }),
        }, { required: false }),
      }, { required: false }),

      // ... rest of existing fields (augments, etc.) ...
    };
  }
}
```

**Field Definitions:**
- `damagePerDie`: Bonus or penalty per die (e.g., +1 for cold/fire, -1 for sonic)
- `attackBonus`: Flat attack bonus (e.g., +3 for electricity vs metal)
- `attackNote`: Display text for attack bonus (e.g., "vs metal armor")
- `saveType`: Override the save type (e.g., "fort" instead of "ref")
- `saveDC`: Override DC formula if needed
- `powerResistanceBonus`: Bonus to overcome PR (e.g., +2 for electricity)
- `special`: Freeform text for special effects (e.g., "ignores hardness")

#### 2.2 Example YAML Structure

**Energy Ray with Energy Effects:**
```yaml
# packs-source/powers/psychokinesis.wv2tB7DsEYZGDsBW/energy-ray.nQrXRrV10cQ2s39s.yaml
system:
  actions:
    - actionType: rsak
      damage:
        parts:
          - formula: 1d6 + @energyBonus
            types: ["@activeEnergy"]
      range:
        units: close
      activation:
        cost: 1
        type: standard

  augments:
    - cost: 1
      effects:
        damageBonus: 1d6 + @energyBonus
      name: Damage

  energyEffects:
    cold:
      damagePerDie: 1
    electricity:
      attackBonus: 3
      attackNote: "vs metal armor"
      powerResistanceBonus: 2
    fire:
      damagePerDie: 1
    sonic:
      damagePerDie: -1
      special: "Ignores hardness"
```

**Energy Cone with Save Type Override:**
```yaml
system:
  actions:
    - actionType: save
      save:
        type: "@energySaveType"  # Dynamic save type
        description: "half"
      damage:
        parts:
          - formula: 5d6 + @energyBonus * 5
            types: ["@activeEnergy"]

  augments:
    - cost: 2
      effects:
        damageBonus: 1d6 + @energyBonus
      name: Damage

  energyEffects:
    cold:
      damagePerDie: 1
      saveType: "fort"  # Cold → Fortitude save
    electricity:
      damagePerDie: 0
      saveType: "ref"   # Electricity → Reflex save
    fire:
      damagePerDie: 1
      saveType: "ref"   # Fire → Reflex save
    sonic:
      damagePerDie: -1
      saveType: "fort"  # Sonic → Fortitude save
      special: "Ignores hardness"
```

---

### Phase 3: Apply Energy Effects to Roll Data

**Goal:** Read energy effects from the power and inject them into `rollData` before damage is rolled.

#### 3.1 Create New Hook Handler

**File:** `scripts/documents/action/action-use.mjs`

**Location:** Add to the wrapper hook at line 11-18

**Changes Required:**
```javascript
// Wrap alterRollData to apply augment effects
libWrapper.register(
  MODULE_ID,
  "pf1.actionUse.ActionUse.prototype.alterRollData",
  function (wrapped, ...args) {
    const result = wrapped.call(this, ...args);

    // Apply augment effects (existing code)
    const augmentCounts = this.shared.rollData?.augmentCounts;
    if (augmentCounts) {
      applyAugmentEffects(this, augmentCounts);
    }

    // ✨ NEW: Apply energy effects
    applyEnergyEffects(this);

    return result;
  },
  "WRAPPER"
);

// ✨ NEW: Energy effects application function
function applyEnergyEffects(actionUse) {
  const item = actionUse.item;
  const actor = item.actor;
  const action = actionUse.shared.action;
  const rollData = actionUse.shared.rollData;
  const shared = actionUse.shared;

  // Only apply to powers with energy effects
  if (item.type !== "pf1-psionics.power") return;
  const energyEffects = item.system.energyEffects;
  if (!energyEffects) return;

  // Get active energy type
  const activeEnergy = actor.flags?.["pf1-psionics"]?.activeEnergy || "fire";
  const effects = energyEffects[activeEnergy];
  if (!effects) return;

  // Set active energy type in rollData (for @activeEnergy in formulas)
  rollData.activeEnergy = activeEnergy;

  // Apply damage per die bonus
  rollData.energyBonus = effects.damagePerDie ?? 0;

  // Apply attack bonus
  if (effects.attackBonus) {
    const bonusString = effects.attackNote
      ? `${effects.attackBonus}[${effects.attackNote}]`
      : `${effects.attackBonus}[${activeEnergy}]`;
    shared.attackBonus = shared.attackBonus || [];
    shared.attackBonus.push(bonusString);
  }

  // Apply save type override
  if (effects.saveType && action.save) {
    rollData.energySaveType = effects.saveType;
    // Also directly modify action if using literal save type
    if (!action.save.type.includes("@")) {
      action.save.type = effects.saveType;
    }
  } else if (action.save) {
    rollData.energySaveType = action.save.type;
  }

  // Apply save DC override
  if (effects.saveDC && action.save) {
    action.save.dc = effects.saveDC;
  }

  // Apply power resistance bonus
  if (effects.powerResistanceBonus) {
    rollData.energyPRBonus = effects.powerResistanceBonus;
    // This would need additional handling in SR check code
  }

  // Store special text for display (could be used in chat cards)
  if (effects.special) {
    rollData.energySpecial = effects.special;
  }

  console.log(`[Energy Effects] Applied ${activeEnergy} effects:`, {
    energyBonus: rollData.energyBonus,
    attackBonus: effects.attackBonus,
    saveType: rollData.energySaveType,
    special: rollData.energySpecial,
  });
}
```

**Key Points:**
- Runs after augments are applied (augments → energy effects → damage rolls)
- Reads `energyEffects` from power data
- Looks up effects for active energy type
- Injects values into `rollData` for use in formulas
- Modifies `shared.attackBonus` for attack bonuses
- Handles save type overrides (both formula-based and direct modification)
- Logs applied effects for debugging

---

### Phase 4: Update Power Formulas

**Goal:** Update all energy-based powers to use the new formula pattern.

#### 4.1 Energy Ray

**File:** `packs-source/powers/psychokinesis.wv2tB7DsEYZGDsBW/energy-ray.nQrXRrV10cQ2s39s.yaml`

**Changes:**
```yaml
system:
  actions:
    - actionType: rsak
      damage:
        parts:
          # OLD: - formula: "1d6"
          # NEW:
          - formula: "(1 + @augment.damageDice)d6 + (@energyBonus * (1 + @augment.damageDice))"
            types: ["@activeEnergy"]
      range:
        units: close
      activation:
        cost: 1
        type: standard

  # NEW: Energy effects definition
  energyEffects:
    cold:
      damagePerDie: 1
    electricity:
      attackBonus: 3
      attackNote: "vs metal armor"
      powerResistanceBonus: 2
    fire:
      damagePerDie: 1
    sonic:
      damagePerDie: -1
      special: "Ignores hardness"

  augments:
    - _id: extraDamage
      cost: 1
      effects:
        damageBonus: "1d6"
```

#### 4.2 Energy Ball (Area Effect with Save)

**File:** `packs-source/powers/psychokinesis.wv2tB7DsEYZGDsBW/energy-ball.{id}.yaml`

**Pattern:**
```yaml
system:
  actions:
    - actionType: save
      save:
        type: "@energySaveType"  # Dynamically determined
        description: "half"
      damage:
        parts:
          - formula: "(4 + @augment.damageDice)d6 + (@energyBonus * (4 + @augment.damageDice))"
            types: ["@activeEnergy"]
      range:
        units: "long"
      area:
        units: "ft"
        value: 20
        shape: "sphere"

  energyEffects:
    cold:
      damagePerDie: 1
      saveType: "fort"
    electricity:
      damagePerDie: 0
      saveType: "ref"
      powerResistanceBonus: 2
    fire:
      damagePerDie: 1
      saveType: "ref"
    sonic:
      damagePerDie: -1
      saveType: "fort"
      special: "Ignores hardness"
```

#### 4.3 Energy Touch (Multiple Targets)

**File:** `packs-source/powers/psychokinesis.wv2tB7DsEYZGDsBW/energy-touch.{id}.yaml`

**Pattern:**
```yaml
system:
  actions:
    - actionType: mattack
      damage:
        parts:
          - formula: "(1 + @augment.damageDice)d6 + (@energyBonus * (1 + @augment.damageDice))"
            types: ["@activeEnergy"]
      range:
        units: touch
      target:
        value: "One creature or up to @sl creatures (no two of which can be more than 15 ft. apart)"

  energyEffects:
    cold:
      damagePerDie: 1
    electricity:
      attackBonus: 2
      attackNote: "vs metal armor"
    fire:
      damagePerDie: 1
    sonic:
      damagePerDie: -1
      special: "Ignores hardness"
```

#### 4.4 Batch Update Script

Create a helper script to update all energy-based powers:

**File:** `tools/update-energy-powers.mjs`

```javascript
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { glob } from "glob";

const ENERGY_POWERS = [
  "energy-ray",
  "energy-ball",
  "energy-touch",
  "energy-cone",
  "energy-bolt",
  "energy-burst",
  // ... add others as identified
];

const DEFAULT_ENERGY_EFFECTS = {
  cold: { damagePerDie: 1 },
  electricity: { attackBonus: 3, attackNote: "vs metal armor", powerResistanceBonus: 2 },
  fire: { damagePerDie: 1 },
  sonic: { damagePerDie: -1, special: "Ignores hardness" },
};

async function updateEnergyPowers() {
  const powerFiles = await glob("packs-source/powers/**/*.yaml");

  for (const filePath of powerFiles) {
    const fileName = path.basename(filePath, ".yaml");
    const powerSlug = fileName.split(".")[0];

    // Check if this is an energy power
    if (!ENERGY_POWERS.includes(powerSlug)) continue;

    console.log(`Updating ${powerSlug}...`);

    // Read YAML
    const yamlContent = fs.readFileSync(filePath, "utf8");
    const data = yaml.load(yamlContent);

    // Add energy effects if not present
    if (!data.system.energyEffects) {
      data.system.energyEffects = DEFAULT_ENERGY_EFFECTS;
    }

    // Update formula in first action
    if (data.system.actions && data.system.actions[0]) {
      const action = data.system.actions[0];
      if (action.damage?.parts?.[0]) {
        const oldFormula = action.damage.parts[0].formula;
        const diceMatch = oldFormula.match(/(\d+)d(\d+)/);

        if (diceMatch) {
          const baseDice = diceMatch[1];
          const dieSize = diceMatch[2];

          // New formula with augments and energy bonus
          const newFormula = `(${baseDice} + @augment.damageDice)d${dieSize} + (@energyBonus * (${baseDice} + @augment.damageDice))`;
          action.damage.parts[0].formula = newFormula;

          // Set dynamic energy type
          action.damage.parts[0].types = ["@activeEnergy"];

          console.log(`  Updated formula: ${oldFormula} → ${newFormula}`);
        }
      }
    }

    // Write back
    const newYaml = yaml.dump(data, { lineWidth: -1, noRefs: true, sortKeys: false });
    fs.writeFileSync(filePath, newYaml, "utf8");
  }

  console.log("✅ Energy powers updated!");
}

updateEnergyPowers().catch(console.error);
```

---

### Phase 5: Handle Non-Damage Effects

**Goal:** Apply special effects beyond damage bonuses.

#### 5.1 Power Resistance Bonus

**Challenge:** PF1e's SR check happens in a separate flow.

**Solution:** Hook into `pf1PreSRCheck`:

**File:** `scripts/hooks/ready.mjs` (or new file `scripts/documents/action/power-resistance.mjs`)

```javascript
Hooks.on("pf1PreSRCheck", (item, rollData) => {
  if (item.type !== "pf1-psionics.power") return;

  const energyPRBonus = rollData.energyPRBonus;
  if (energyPRBonus) {
    rollData.cl = (rollData.cl || 0) + energyPRBonus;
    console.log(`[Energy Effects] Applied +${energyPRBonus} to overcome PR`);
  }
});
```

#### 5.2 Special Effects Display

**Challenge:** Effects like "ignores hardness" are notes, not mechanics.

**Solution:** Display in chat cards:

**File:** `scripts/hooks/ready.mjs` (or extend chat card template)

```javascript
Hooks.on("pf1GetActorContextNotes", (item, type, notes, rollData) => {
  if (item.type !== "pf1-psionics.power") return;
  if (type !== "attacks") return;

  const energySpecial = rollData.energySpecial;
  if (energySpecial) {
    notes.push({
      text: energySpecial,
      subTarget: "attack",
    });
  }
});
```

#### 5.3 Attack Note Display

**Handled automatically** by pushing to `shared.attackBonus` with note text:
```javascript
shared.attackBonus.push("3[vs metal armor]");
```

PF1e's chat card rendering will display this as "+3 vs metal armor" in the attack roll.

---

## Testing Plan

### Test Case 1: Energy Ray - Basic Damage

**Setup:**
- Actor with 1 power point available
- Active energy: cold
- Energy Ray power (level 1)

**Expected:**
1. Manifest Energy Ray (no augment):
   - Cost: 1 PP
   - Damage roll: `1d6 + 1` (cold)
   - Damage type: cold

2. Manifest Energy Ray (augmented +1 PP):
   - Cost: 2 PP
   - Damage roll: `2d6 + 2` (cold)
   - Damage type: cold

### Test Case 2: Energy Ray - Electricity Bonuses

**Setup:**
- Actor with active energy: electricity
- Target wearing metal armor

**Expected:**
1. Manifest Energy Ray:
   - Attack roll shows: `+3 [vs metal armor]`
   - Damage roll: `1d6` (electricity, no per-die bonus)
   - SR check: +2 bonus to overcome

### Test Case 3: Energy Ray - Sonic Penalty

**Setup:**
- Active energy: sonic

**Expected:**
1. Manifest Energy Ray (no augment):
   - Damage roll: `1d6 - 1` (sonic)
   - Chat card shows: "Ignores hardness"

2. Manifest Energy Ray (augmented +2 PP):
   - Damage roll: `3d6 - 3` (sonic)

### Test Case 4: Energy Ball - Save Type

**Setup:**
- Active energy: cold (Fortitude save)
- Energy Ball power (level 4)

**Expected:**
1. Manifest Energy Ball:
   - Save type: Fortitude (not Reflex)
   - Damage: `4d6 + 4` (cold)

2. Change to electricity:
   - Save type: Reflex
   - Damage: `4d6` (electricity)

---

## Migration Path

### For Existing Powers

**Option A: Gradual Migration**
1. Phase 1: Implement infrastructure (augments, energy effects)
2. Phase 2: Update Energy Ray as proof of concept
3. Phase 3: Update remaining ~10 energy-based powers
4. Phase 4: Test and validate all powers

**Option B: Batch Migration**
1. Implement infrastructure
2. Run batch update script on all energy powers
3. Manual review and testing
4. Single commit with all changes

**Recommended:** Option A (gradual) for better testing and validation.

### For Future Powers

**When scraping new powers:**
1. Scraper detects energy-based powers (check description for "active energy type")
2. Auto-generates `energyEffects` structure with defaults
3. Human review adjusts specific values

---

## Alternative Designs Considered

### Alternative 1: Separate Energy Actions

**Concept:** Each power has 4 actions (cold, electricity, fire, sonic).

**Why Not Chosen:**
- Requires 4x YAML for each power
- Harder to maintain consistency
- Augments would need to apply to all 4 actions
- Clutters UI

### Alternative 2: Script Calls

**Concept:** Use script calls in "use" category to modify damage.

**Why Not Chosen:**
- Script calls execute **after** damage is rolled (line 1684)
- Cannot modify damage that's already calculated
- Would require new "preAugment" script call category
- Less maintainable than formulas

### Alternative 3: Damage Type Resolution

**Concept:** Special `"activeEnergy"` damage type that resolves at roll time.

**Why Not Chosen:**
- Doesn't handle damage bonuses (only type)
- Would need custom damage type system
- Doesn't address attack bonuses, save types, etc.
- Formula approach is more flexible

---

## Implementation Checklist

### Code Changes

- [ ] **Phase 1: Augments to Roll Data**
  - [ ] Modify `calculateAugmentTotals()` to properly accumulate dice
  - [ ] Modify `applyAugmentEffects()` to parse and expose augment data
  - [ ] Add `rollData.augment` object with all augment values
  - [ ] Test: Verify `@augment.damageDice` works in formulas

- [ ] **Phase 2: Energy Effects Schema**
  - [ ] Add `energyEffects` field to `PowerModel`
  - [ ] Update power sheet template to display energy effects (optional)
  - [ ] Test: Verify YAML with `energyEffects` compiles correctly

- [ ] **Phase 3: Apply Energy Effects**
  - [ ] Create `applyEnergyEffects()` function
  - [ ] Hook into `alterRollData` wrapper
  - [ ] Inject `@energyBonus`, `@activeEnergy`, `@energySaveType` into `rollData`
  - [ ] Handle attack bonuses via `shared.attackBonus`
  - [ ] Test: Verify energy bonuses apply correctly

- [ ] **Phase 4: Update Powers**
  - [ ] Update Energy Ray YAML
  - [ ] Compile and test Energy Ray
  - [ ] Update Energy Ball, Energy Touch, Energy Cone
  - [ ] Create batch update script for remaining powers
  - [ ] Test: All energy powers work with augments

- [ ] **Phase 5: Special Effects**
  - [ ] Add `pf1PreSRCheck` hook for PR bonuses
  - [ ] Add chat card notes for special effects
  - [ ] Test: SR bonuses and special notes display correctly

### Documentation

- [ ] Update `CLAUDE.md` with energy effects pattern
- [ ] Update `tools/README.md` with scraper support for energy effects
- [ ] Create migration guide for existing powers
- [ ] Document testing procedures

### Testing

- [ ] Unit tests for `calculateAugmentTotals()`
- [ ] Integration test: Energy Ray with all energy types
- [ ] Integration test: Energy Ray with augments (1-5 dice)
- [ ] Integration test: Energy Ball save type override
- [ ] Integration test: Electricity attack/PR bonuses
- [ ] Regression test: Non-energy powers still work

---

## Estimated Effort

| Phase | Estimated Time | Complexity |
|-------|---------------|------------|
| Phase 1: Augments to Roll Data | 3-4 hours | Medium |
| Phase 2: Energy Effects Schema | 1-2 hours | Low |
| Phase 3: Apply Energy Effects | 2-3 hours | Medium |
| Phase 4: Update Powers | 2-3 hours | Low |
| Phase 5: Special Effects | 2-3 hours | Medium |
| Testing | 3-4 hours | Medium |
| Documentation | 2 hours | Low |
| **Total** | **15-21 hours** | **Medium** |

---

## Future Enhancements

### 1. UI for Energy Effects

Add UI to power sheet for editing energy effects (similar to augments).

### 2. Energy Type Selection Dialog

For kineticists (who can choose energy type at manifest time), add dialog to select energy.

### 3. Conditional Energy Effects

Support conditionals that apply based on target conditions (e.g., "if target in water, electricity deals +2d6").

### 4. Energy Substitution

Allow feats/abilities to change energy type (e.g., "fire powers deal cold damage instead").

---

## Next Steps

1. **Review options** and decide which aligns best with your vision
2. **Answer decision factors** above to narrow choices
3. **Create implementation plan** with detailed steps
4. **Prototype** chosen solution with Energy Ray power
5. **Test thoroughly** with all four energy types
6. **Document** for future power additions
7. **Apply to remaining powers** (Energy Ball, Energy Touch, etc.)

---

## Questions to Consider

1. Are there powers with energy effects beyond the ones I've seen (Energy Ray, Energy Ball, Energy Touch)?
2. Should the energy type be displayed in the action name (e.g., "Energy Ray (Fire)")?
3. Are there conditional effects based on target properties (like electricity vs metal armor)?
4. Do any energy powers have scaling effects (different bonuses at higher levels)?
5. Should players be able to choose energy type per-use (overriding active energy)?
6. Are there other "active" choices similar to energy type that might need this pattern?

---

## References

**Code Locations:**
- Active energy type: `scripts/data/powerpoints.mjs`, `scripts/helpers/psionics-helper.mjs`
- Action hooks: `scripts/documents/action/action-use.mjs`
- PF1 Action schema: `ruleset/pf1e/module/components/action.mjs`
- Damage model: `ruleset/pf1e/module/models/action/damage-part-model.mjs`

**Power Files:**
- Energy Ray: `packs-source/powers/psychokinesis.wv2tB7DsEYZGDsBW/energy-ray.nQrXRrV10cQ2s39s.yaml`
- Energy Ball: `packs-source/powers/psychokinesis.wv2tB7DsEYZGDsBW/energy-ball.2Toc7Io5tQUNWtSG.yaml`
- Energy Touch: `packs-source/powers/psychokinesis.wv2tB7DsEYZGDsBW/energy-touch.P3nUqxJXXhLx2BT8.yaml`
