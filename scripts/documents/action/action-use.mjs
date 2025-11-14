import { MODULE_ID } from "../../_module.mjs";

export function injectActionUse() {
  libWrapper.register(MODULE_ID, "pf1.actionUse.ActionUse.prototype.getMessageData", function () {
    if (this.item.type === `${MODULE_ID}.power`) {
      this.shared.templateData.casterLevelCheck = this.shared.casterLevelCheck;
      this.shared.templateData.concentrationCheck = this.shared.concentrationCheck;
    }
  }, "LISTENER");

  libWrapper.register(MODULE_ID, "pf1.actionUse.ActionUse.prototype.alterRollData", function () {
    if (this.item.type === `${MODULE_ID}.power`) {
      const augmentCounts = this.shared.rollData.augmentCounts || {};
      if (Object.keys(augmentCounts).length > 0) {
        applyAugmentEffects(this, augmentCounts);
      }
    }
  }, "LISTENER");
}

export function pf1PreActionUseHook(actionUse) {
  if (actionUse.item.type === `${MODULE_ID}.power`) {
    // Handle power cost too expensive.
    const chargeCost = actionUse.shared.rollData.chargeCost || 0;
    const cl = actionUse.shared.rollData.cl || 0;
    if( chargeCost > cl ) {
      ui.notifications.error(game.i18n.localize("PF1-Psionics.Error.PowerCostTooHigh"));
      return false;
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
    damageBonuses: [],
    damageMult: 1,
    dcBonus: 0,
    clBonus: 0,
    durationMultiplier: 1,
    requiresFocus: false
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

    // Check for psionic focus requirement (only once per augment, not per count)
    if (augment.requiresFocus) {
      totals.requiresFocus = true;
    }
  }

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
  if (totals.requiresFocus) {
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