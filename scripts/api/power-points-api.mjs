import { PowerPointsHelper } from "../helpers/_module.mjs";

/**
 * Static API for power points operations.
 * Accessible via `game.modules.get("pf1-psionics").api.powerPoints`
 *
 * @example
 * const api = game.modules.get("pf1-psionics").api;
 *
 * // Spend power points from an actor
 * await api.powerPoints.spend(actor, 5);
 *
 * // Get available points
 * const available = api.powerPoints.getAvailable(actor);
 */
export const PowerPointsApi = {
  /**
   * Get the PowerPointsHelper instance for an actor
   * @param {Actor|string} actorOrId - Actor document or actor ID
   * @returns {PowerPointsHelper}
   */
  get(actorOrId) {
    const actor = typeof actorOrId === "string"
      ? game.actors.get(actorOrId)
      : actorOrId;
    if (!actor) {
      throw new Error("pf1-psionics | PowerPointsAPI.get: Actor not found");
    }
    return new PowerPointsHelper(actor);
  },

  /**
   * Spend power points from an actor
   * Drains temporary points first, then current points.
   *
   * @param {Actor|string} actorOrId - Actor document or ID
   * @param {number} amount - Amount to spend
   * @returns {Promise<boolean>} True if successful, false if not enough points
   */
  async spend(actorOrId, amount) {
    return this.get(actorOrId).spend(amount);
  },

  /**
   * Check if an actor can spend a given amount
   * @param {Actor|string} actorOrId - Actor document or ID
   * @param {number} amount - Amount to check
   * @returns {boolean}
   */
  canSpend(actorOrId, amount) {
    return this.get(actorOrId).canSpend(amount);
  },

  /**
   * Get total available power points (current + temporary)
   * @param {Actor|string} actorOrId - Actor document or ID
   * @returns {number}
   */
  getAvailable(actorOrId) {
    return this.get(actorOrId).available;
  },

  /**
   * Get current power points (not including temporary)
   * @param {Actor|string} actorOrId - Actor document or ID
   * @returns {number}
   */
  getCurrent(actorOrId) {
    return this.get(actorOrId).current;
  },

  /**
   * Get temporary power points
   * @param {Actor|string} actorOrId - Actor document or ID
   * @returns {number}
   */
  getTemporary(actorOrId) {
    return this.get(actorOrId).temporary;
  },

  /**
   * Get maximum power points
   * @param {Actor|string} actorOrId - Actor document or ID
   * @returns {number}
   */
  getMaximum(actorOrId) {
    return this.get(actorOrId).maximum;
  },

  /**
   * Add power points to current pool (clamped to maximum)
   * @param {Actor|string} actorOrId - Actor document or ID
   * @param {number} amount - Amount to add (can be negative)
   * @returns {Promise<void>}
   */
  async add(actorOrId, amount) {
    return this.get(actorOrId).add(amount);
  },

  /**
   * Add temporary power points
   * @param {Actor|string} actorOrId - Actor document or ID
   * @param {number} amount - Amount to add
   * @returns {Promise<void>}
   */
  async addTemporary(actorOrId, amount) {
    return this.get(actorOrId).addTemporary(amount);
  },

  /**
   * Restore power points to maximum (clears temporary)
   * @param {Actor|string} actorOrId - Actor document or ID
   * @returns {Promise<void>}
   */
  async restore(actorOrId) {
    return this.get(actorOrId).restore();
  },

  /**
   * Set current power points to a specific value
   * @param {Actor|string} actorOrId - Actor document or ID
   * @param {number} value - New current value
   * @returns {Promise<void>}
   */
  async setCurrent(actorOrId, value) {
    return this.get(actorOrId).setCurrent(value);
  },

  /**
   * Set temporary power points to a specific value
   * @param {Actor|string} actorOrId - Actor document or ID
   * @param {number} value - New temporary value
   * @returns {Promise<void>}
   */
  async setTemporary(actorOrId, value) {
    return this.get(actorOrId).setTemporary(value);
  }
};
