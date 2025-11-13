import { MODULE_ID } from "../../_module.mjs";

export function injectActionUse() {
  libWrapper.register(MODULE_ID, "pf1.actionUse.ActionUse.prototype.getMessageData", function () {
    if (this.item.type === `${MODULE_ID}.power`) {
      this.shared.templateData.casterLevelCheck = this.shared.casterLevelCheck;
      this.shared.templateData.concentrationCheck = this.shared.concentrationCheck;

      // Add augment information to chat card
      this.shared.templateData.augments = this.shared.rollData.selectedAugments || [];
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
 * Apply augment effects to the action use
 * @param {ActionUse} actionUse - The action being used
 * @param {Object} augmentCounts - Object mapping augment IDs to their counts
 */
function applyAugmentEffects(actionUse, augmentCounts) {
  const shared = actionUse.shared;
  const rollData = shared.rollData;
  const augments = actionUse.item.system.augments || [];

  // Build selectedAugments array for chat card display
  rollData.selectedAugments = [];

  for (const [augmentId, count] of Object.entries(augmentCounts)) {
    if (count <= 0) continue;

    const augment = augments.find(a => a._id === augmentId);
    if (!augment) continue;

    const effects = augment.effects;

    // Add to selectedAugments for chat card (once per augment, with count)
    rollData.selectedAugments.push({ ...augment, count });

    // Apply effects based on count
    for (let i = 0; i < count; i++) {
      // Calculate and apply PP cost for this augment
      if (augment.costFormula) {
        const augmentCost = RollPF.safeRollSync(augment.costFormula, rollData).total;
        rollData.chargeCostBonus = (rollData.chargeCostBonus || 0) + augmentCost;
      }

      // Apply damage bonus
      if (effects.damageBonus) {
        // Add to damage formula
        shared.damageBonus.push(effects.damageBonus);
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
    }

    // Check for psionic focus requirement (only once per augment, not per count)
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