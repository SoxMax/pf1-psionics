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
      const selectedAugments = this.shared.rollData.selectedAugments || [];
      if (selectedAugments.length > 0) {
        applyAugmentEffects(this, selectedAugments);
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
 * @param {Array} augments - Selected augments
 */
function applyAugmentEffects(actionUse, augments) {
  const shared = actionUse.shared;
  const rollData = shared.rollData;

  for (const augment of augments) {
    const effects = augment.effects;

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