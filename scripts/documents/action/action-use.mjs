import { MODULE_ID } from "../../_module.mjs";

/**
 * Normalize resource costs to ensure it's always an array
 * @param {*} costs - Resource costs from item or action
 * @returns {Array} Normalized array of costs
 */
function normalizeResourceCosts(costs) {
  if (Array.isArray(costs)) return costs;
  if (costs && typeof costs === "object" && Object.keys(costs).length > 0) {
    // Convert object to array (e.g., {0: {tag: "powerPoints", formula: "1"}})
    return Object.values(costs);
  }
  return [];
}

/**
 * Inject resource cost checking into PF1's action use system
 */
export function injectActionUse() {
  // Wrap ItemPF.use to check and deduct resource costs
  libWrapper.register(
    MODULE_ID,
    "pf1.documents.item.ItemPF.prototype.use",
    async function (wrapped, options = {}) {
      // Check resource costs before using the item
      if (!options.skipCharges) {
        const checkResult = checkResourceCosts.call(this, options);
        if (checkResult !== 0) {
          // Resource check failed, prevent use
          return null;
        }
      }

      // Call original use method
      const result = await wrapped(options);

      // If use was successful, deduct resource costs
      if (result && !options.skipCharges) {
        await deductResourceCosts.call(this, options);
      }

      return result;
    },
    "WRAPPER"
  );

  // Register augment processing for powers
  libWrapper.register(MODULE_ID, "pf1.actionUse.ActionUse.prototype.getMessageData", function() {
    if (this.item.type === `${MODULE_ID}.power`) {
      this.shared.templateData.casterLevelCheck = this.shared.casterLevelCheck;
      this.shared.templateData.concentrationCheck = this.shared.concentrationCheck;
    }
  }, "LISTENER");

  libWrapper.register(MODULE_ID, "pf1.actionUse.ActionUse.prototype.alterRollData", function() {
    if (this.item.type === `${MODULE_ID}.power`) {
      const augmentCounts = this.shared.rollData.augmentCounts || {};
      if (Object.keys(augmentCounts).length > 0) {
        applyAugmentEffects(this, augmentCounts);
      }
    }
  }, "LISTENER");

  console.log(`${MODULE_ID} | ActionUse injections registered`);
}

/**
 * Pre-action use hook for power-specific validation
 * @param {ActionUse} actionUse - The action being used
 * @returns {boolean} False to cancel the action
 */
export function pf1PreActionUseHook(actionUse) {
  if (actionUse.item.type === `${MODULE_ID}.power`) {
    // Handle power cost too expensive.
    const chargeCost = actionUse.shared.rollData.chargeCost || 0;
    const cl = actionUse.shared.rollData.cl || 0;
    if (chargeCost > cl) {
      ui.notifications.error(game.i18n.localize("PF1-Psionics.Error.PowerCostTooHigh"));
      return false;
    }
    const currentFocus = actionUse.actor.flags?.[MODULE_ID]?.focus?.current || 0;
    const focusCost =  actionUse.shared.rollData?.focusCost || 0;
    if (focusCost > currentFocus) {
      ui.notifications.error(game.i18n.localize("PF1-Psionics.Error.NotEnoughFocus"));
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

/**
 * Check if actor has sufficient resources for action
 * @this {pf1.documents.item.ItemPF}
 * @param {object} options - Use options
 * @returns {number} 0 if sufficient, error code otherwise
 */
function checkResourceCosts(options) {
  if (!this.actor) return 0;

  // Get costs from action (priority) or item
  const action = this.actions?.get(options.actionId);
  const rawCosts = action?.uses?.resourceCosts || this.system?.resourceCosts;
  const resourceCosts = normalizeResourceCosts(rawCosts);

  // Ensure resourceCosts has entries
  if (resourceCosts.length === 0) return 0;

  const rollData = this.getRollData();
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

/**
 * Deduct resource costs after successful action use
 * @this {pf1.documents.item.ItemPF}
 * @param {object} options - Use options
 */
async function deductResourceCosts(options) {
  const action = this.actions?.get(options.actionId);
  const rawCosts = action?.uses?.resourceCosts || this.system?.resourceCosts;
  const resourceCosts = normalizeResourceCosts(rawCosts);

  // Ensure resourceCosts has entries
  if (resourceCosts.length === 0) return;

  const rollData = this.getRollData();

  for (const cost of resourceCosts) {
    const resource = this.actor.system.resources?.[cost.tag];
    if (resource) {
      const amount = RollPF.safeRollSync(cost.formula, rollData).total;
      await resource.add(-amount);
    } else {
      console.warn(`${MODULE_ID} | Resource ${cost.tag} not found during deduction`);
    }
  }
}
