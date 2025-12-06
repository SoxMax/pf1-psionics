// filepath: /home/cobrien/Applications/Foundry/userdata/Data/modules/pf1-psionics/scripts/api/psionic-focus-api.mjs
import { PsionicFocusHelper } from "../helpers/_module.mjs";

/**
 * Static API for psionic focus operations.
 * Accessible via `game.modules.get("pf1-psionics").api.psionicFocus`
 * 
 * @example
 * const api = game.modules.get("pf1-psionics").api;
 * 
 * // Check if actor is focused
 * if (api.psionicFocus.isFocused(actor)) {
 *   await api.psionicFocus.expend(actor);
 * }
 * 
 * // Regain focus
 * await api.psionicFocus.gain(actor);
 */
export const PsionicFocusAPI = {
  /**
   * Get the PsionicFocusHelper instance for an actor
   * @param {Actor|string} actorOrId - Actor document or actor ID
   * @returns {PsionicFocusHelper}
   */
  get(actorOrId) {
    const actor = typeof actorOrId === "string"
      ? game.actors.get(actorOrId)
      : actorOrId;
    if (!actor) {
      throw new Error(`pf1-psionics | PsionicFocusAPI.get: Actor not found`);
    }
    return new PsionicFocusHelper(actor);
  },

  /**
   * Check if an actor is currently psionically focused
   * @param {Actor|string} actorOrId - Actor document or ID
   * @returns {boolean}
   */
  isFocused(actorOrId) {
    return this.get(actorOrId).isFocused;
  },

  /**
   * Expend psionic focus
   * @param {Actor|string} actorOrId - Actor document or ID
   * @returns {Promise<boolean>} True if focus was expended
   */
  async expend(actorOrId) {
    return this.get(actorOrId).expend();
  },

  /**
   * Gain psionic focus
   * @param {Actor|string} actorOrId - Actor document or ID
   * @returns {Promise<boolean>} True if focus was gained
   */
  async gain(actorOrId) {
    return this.get(actorOrId).gain();
  },

  /**
   * Restore focus to maximum
   * @param {Actor|string} actorOrId - Actor document or ID
   * @returns {Promise<void>}
   */
  async restore(actorOrId) {
    return this.get(actorOrId).restore();
  },

  /**
   * Get current focus value
   * @param {Actor|string} actorOrId - Actor document or ID
   * @returns {number}
   */
  getCurrent(actorOrId) {
    return this.get(actorOrId).current;
  },

  /**
   * Get maximum focus value
   * @param {Actor|string} actorOrId - Actor document or ID
   * @returns {number}
   */
  getMaximum(actorOrId) {
    return this.get(actorOrId).maximum;
  },

  /**
   * Check if an actor can expend focus
   * @param {Actor|string} actorOrId - Actor document or ID
   * @returns {boolean}
   */
  canExpend(actorOrId) {
    return this.get(actorOrId).canExpend();
  }
};
