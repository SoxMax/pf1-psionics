import { MODULE_ID } from "../../_module.mjs";

/**
 * Normalize resource costs to ensure it's always an array
 * @param {*} costs - Resource costs from item or action
 * @returns {Array} Normalized array of costs
 */
function normalizeResourceCosts(costs) {
  if (Array.isArray(costs)) return costs;
  if (costs && typeof costs === 'object' && Object.keys(costs).length > 0) {
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

  console.log(`${MODULE_ID} | ActionUse injections registered`);
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
