import {MODULE_ID} from "../../_module.mjs";

function injectActionUse() {
  libWrapper.register(MODULE_ID, "pf1.actionUse.ActionUse.prototype.getMessageData", function() {
    if (this.item.type === `${MODULE_ID}.power`) {
      this.shared.templateData.casterLevelCheck = this.shared.casterLevelCheck;
      this.shared.templateData.concentrationCheck = this.shared.concentrationCheck;
    }
  }, "LISTENER");

  libWrapper.register(MODULE_ID, "pf1.actionUse.ActionUse.prototype.alterRollData", function() {
    if (this.item.type === `${MODULE_ID}.power`) {
      // ✨ CRITICAL: Apply energy effects FIRST (sets @energyBonus, @activeEnergy, etc.)
      // This allows augment formulas to reference these values
      applyEnergyEffects(this);

      // THEN apply augments (formulas can now reference @energyBonus)
      const augmentCounts = this.shared.rollData.augmentCounts || {};
      if (Object.keys(augmentCounts).length > 0) {
        applyAugmentEffects(this, augmentCounts);
      }
    }
  }, "LISTENER");
}

function pf1PreActionUseHook(actionUse) {
  if (actionUse.item.type === `${MODULE_ID}.power`) {
    // Handle power cost too expensive.
    const chargeCost = actionUse.shared.rollData.chargeCost || 0;
    const cl = actionUse.shared.rollData.cl || 0;
    if (chargeCost > cl) {
      ui.notifications.error(game.i18n.localize("PF1-Psionics.Error.PowerCostTooHigh"));
      return false;
    }
    const currentFocus = actionUse.actor.psionics?.focus?.current ?? 0;
    const focusCost = actionUse.shared.rollData?.focusCost || 0;
    if (focusCost > currentFocus) {
      ui.notifications.error(game.i18n.localize("PF1-Psionics.Error.NotEnoughFocus"));
      return false;
    }
  }
}

/**
 * Apply energy effects to the action use based on active energy type
 * This must run BEFORE augments so that augment formulas can reference @activeEnergy.damageBonus
 * @param {ActionUse} actionUse - The action being used
 */
function applyEnergyEffects(actionUse) {
  const item = actionUse.item;
  const actor = item.actor;
  const action = actionUse.shared.action;
  const rollData = actionUse.shared.rollData;
  const shared = actionUse.shared;

  // Only apply to psionic powers
  if (item.type !== `${MODULE_ID}.power`) return;

  // Check if power has energy effects defined
  const energyEffects = item.system.energyEffects;
  if (!energyEffects) {
    // Power doesn't use energy effects, set default values
    rollData.activeEnergy = { damageBonus: 0 };
    return;
  }

  // Get active energy type from actor flags
  const activeEnergyType = actor.flags?.[MODULE_ID]?.activeEnergy || "fire";
  const effects = energyEffects[activeEnergyType];

  // Create activeEnergy object in rollData for formula access
  rollData.activeEnergy = {
    damageBonus: effects?.damage ?? 0,
    type: activeEnergyType,
  };

  // If no effects for this energy type, we're done
  if (!effects) return;

  // Replace "activeEnergyType" placeholder with actual energy type
  if (action?.damage?.parts) {
    for (const part of action.damage.parts) {
      if (part.types.has("activeEnergyType")) {
        // Replace placeholder with actual energy type
        part.types.delete("activeEnergyType");
        part.types.add(activeEnergyType);
      }
    }
  }

  // Apply context notes (e.g., "+3 attack vs metal armor", "Ignores hardness")
  if (effects.notes && Array.isArray(effects.notes) && effects.notes.length > 0) {
    // Initialize action notes array if it doesn't exist
    if (!action.notes) {
      action.notes = [];
    }

    // Add each note as a context note
    for (const note of effects.notes) {
      action.notes.push({
        text: note,
        subTarget: activeEnergyType, // Tag with energy type for filtering
      });
    }
  }
}

/**
 * Calculate the total effects from all augments
 * @param {Array} augments - Available augments on the item
 * @param {Object} augmentCounts - Object mapping augment IDs to their counts
 * @returns {Object} Object containing all calculated totals
 */
function calculateAugmentTotals(augments, augmentCounts) {
  // Initialize totals
  const totals = {
    chargeCostBonus: 0,
    focusCostBonus: 0,
    damageBonuses: [],
    damageMult: 1,
    dcBonus: 0,
    clBonus: 0,
    durationMultiplier: 1,
  };

  // Sum all augment effects
  for (const [augmentId, count] of Object.entries(augmentCounts)) {
    if (count <= 0) continue;

    const augment = augments.find(a => a._id === augmentId);
    if (!augment) continue;

    const effects = augment.effects;

    // Sum effects based on count
    for (let i = 0; i < count; i++) {
      // Sum PP cost for this augment
      if (augment.cost) {
        totals.chargeCostBonus += augment.cost;
      }

      // Collect damage bonuses
      if (effects.damageBonus) {
        totals.damageBonuses.push(effects.damageBonus);
      }

      // Multiply damage multipliers
      if (effects.damageMult && effects.damageMult !== 1) {
        totals.damageMult *= effects.damageMult;
      }

      // Sum DC bonus
      if (effects.dcBonus) {
        totals.dcBonus += effects.dcBonus;
      }

      // Sum CL bonus
      if (effects.clBonus) {
        totals.clBonus += effects.clBonus;
      }

      // Multiply duration multipliers
      if (effects.durationMultiplier && effects.durationMultiplier !== 1) {
        totals.durationMultiplier *= effects.durationMultiplier;
      }
    }
    if (augment.requiresFocus) {
      totals.focusCostBonus += 1;
    }
  }

  // Round bonuses appropriately
  totals.clBonus = Math.floor(totals.clBonus);
  totals.dcBonus = Math.floor(totals.dcBonus);
  totals.chargeCostBonus = Math.ceil(totals.chargeCostBonus);
  totals.focusCostBonus = Math.ceil(totals.focusCostBonus);

  return totals;
}

/**
 * Apply augment effects to the action use
 * @param {ActionUse} actionUse - The action being used
 * @param {Object} augmentCounts - Object mapping augment IDs to their counts
 */
function applyAugmentEffects(actionUse, augmentCounts) {
  const shared = actionUse.shared;
  const rollData = shared.rollData;
  const augments = actionUse.item.system.augments || [];

  // Calculate all augment effect totals
  const totals = calculateAugmentTotals(augments, augmentCounts);

  // ✨ Expose augment data to roll formulas via rollData.augment
  // This allows formulas to reference augment bonuses (e.g., for DC scaling)
  rollData.augment = {
    damageMult: totals.damageMult || 1,
    dcBonus: totals.dcBonus || 0,
    clBonus: totals.clBonus || 0,
    totalCost: totals.chargeCostBonus || 0,
    durationMult: totals.durationMultiplier || 1,
  };

  // Apply all totals at once
  if (totals.chargeCostBonus > 0) {
    rollData.chargeCostBonus = (rollData.chargeCostBonus || 0) + totals.chargeCostBonus;
  }

  for (const damageBonus of totals.damageBonuses) {
    shared.damageBonus.push(damageBonus);
  }

  if (totals.damageMult !== 1) {
    rollData.damageMult = (rollData.damageMult || 1) * totals.damageMult;
  }

  if (totals.dcBonus !== 0) {
    rollData.dcBonus = (rollData.dcBonus || 0) + totals.dcBonus;
  }

  if (totals.clBonus !== 0) {
    rollData.cl = (rollData.cl || 0) + totals.clBonus;
  }

  // Apply duration modifications
  const action = actionUse.action;
  if (action?.duration?.value && totals.durationMultiplier !== 1) {
    action.duration.value = `floor((${action.duration.value}) * ${totals.durationMultiplier})`;
  }

  // Handle psionic focus requirement
  if (totals.focusCostBonus !== 0) {
      rollData.focusCost = (rollData.focusCost || 0) + totals.focusCostBonus;
  }
}

// Register hooks
Hooks.on("pf1PreActionUse", pf1PreActionUseHook);

Hooks.once("libWrapper.Ready", injectActionUse);

