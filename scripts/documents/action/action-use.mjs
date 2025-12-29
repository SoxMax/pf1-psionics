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
      // Apply augments from the action
      const augmentCounts = this.shared.rollData.augmentCounts || {};
      if (Object.keys(augmentCounts).length > 0) {
        applyAugmentEffects(this, augmentCounts);
      }
    }
  }, "LISTENER");

  libWrapper.register(MODULE_ID, "pf1.actionUse.ActionUse.prototype.generateChatMetadata", function (wrapped, ...args) {
      const metadata = wrapped(...args);
      if (this.item.type === `${MODULE_ID}.power` && this.shared?.rollData?.augments) {
        metadata.config ??= {};
        metadata.config.augments = this.shared.rollData.augments;
      }
      return metadata;
    },
    "WRAPPER"
  );
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
 * Build augments counts object for rollData
 * @param {Array} augments - Available augments
 * @param {Object} augmentCounts - Map of augment ID to activation count
 * @returns {Object} Map of tag to count
 */
function buildAugmentsCounts(augments, augmentCounts) {
  const counts = {};

  // Include ALL augments, even with 0 count
  for (const augment of augments) {
    const count = augmentCounts[augment._id] || 0;
    const tag = augment.tag || pf1.utils.createTag(augment.name);

    // Sum counts for same tag (allows intentional grouping)
    counts[tag] = (counts[tag] || 0) + count;
  }

  return counts;
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

  // Read augments from the action (not the power)
  const action = actionUse.action;
  const augments = action.augments ? Array.from(action.augments.values()) : [];

  // Build augments rollData - just counts by tag
  rollData.augments = buildAugmentsCounts(augments, augmentCounts);

  // Calculate all augment effect totals
  const totals = calculateAugmentTotals(augments, augmentCounts);

  // DEPRECATED: Keep for backward compatibility
  // ✨ Expose augment data to roll formulas via rollData.augment
  // This allows formulas to reference augment bonuses (e.g., for DC scaling)
  rollData.augment = {
    damageMult: totals.damageMult || 1,
    dcBonus: totals.dcBonus || 0,
    clBonus: totals.clBonus || 0,
    totalCost: totals.chargeCostBonus || 0,
    durationMult: totals.durationMultiplier || 1,
  };

  // Merge notes from activated augments into action
  for (const augment of augments) {
    const count = augmentCounts[augment._id] || 0;
    if (count <= 0) continue;

    // Merge effect notes
    if (augment.effectNotes?.length) {
      shared.effectNotes ??= [];
      shared.effectNotes.push(...augment.effectNotes);
    }

    // Merge footer notes
    if (augment.footerNotes?.length) {
      shared.footerNotes ??= [];
      shared.footerNotes.push(...augment.footerNotes);
    }
  }

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
