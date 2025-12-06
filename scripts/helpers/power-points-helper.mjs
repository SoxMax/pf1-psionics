// filepath: /home/cobrien/Applications/Foundry/userdata/Data/modules/pf1-psionics/scripts/helpers/power-points-helper.mjs
import { MODULE_ID } from "../_module.mjs";

/**
 * Helper class for managing an actor's power points.
 * Provides methods to spend, add, and restore power points.
 * Automatically handles the "spend temporary first, then current" logic.
 *
 * @example
 * // Get helper from actor
 * const pp = actor.psionics.powerPoints;
 *
 * // Check available points
 * console.log(pp.available); // current + temporary
 *
 * // Spend points (drains temporary first)
 * await pp.spend(5);
 * 
 * // Restore on rest
 * await pp.restore();
 */
export class PowerPointsHelper {
  /**
   * @param {Actor} actor - The actor this helper manages
   */
  constructor(actor) {
    this.actor = actor;
  }

  /**
   * Current power points (not including temporary)
   * @type {number}
   */
  get current() {
    return this.actor.getFlag(MODULE_ID, "powerPoints.current") ?? 0;
  }

  /**
   * Temporary power points
   * @type {number}
   */
  get temporary() {
    return this.actor.getFlag(MODULE_ID, "powerPoints.temporary") ?? 0;
  }

  /**
   * Maximum power points (derived from manifesters)
   * This is calculated during actor data preparation.
   * @type {number}
   */
  get maximum() {
    return this.actor.getFlag(MODULE_ID, "powerPoints.maximum") ?? 0;
  }

  /**
   * Total available power points (current + temporary)
   * @type {number}
   */
  get available() {
    return this.current + this.temporary;
  }

  /**
   * Check if the actor has enough power points to spend
   * @param {number} amount - Amount to check
   * @returns {boolean}
   */
  canSpend(amount) {
    return this.available >= amount;
  }

  /**
   * Spend power points from the actor's pool.
   * Drains temporary points first, then current points.
   * 
   * @param {number} amount - Amount to spend
   * @returns {Promise<boolean>} True if successful, false if not enough points
   */
  async spend(amount) {
    if (amount <= 0) return true;
    if (!this.canSpend(amount)) return false;

    let remaining = amount;
    let newTemporary = this.temporary;
    let newCurrent = this.current;

    // Drain temporary first
    if (newTemporary > 0) {
      const tempDrain = Math.min(remaining, newTemporary);
      newTemporary -= tempDrain;
      remaining -= tempDrain;
    }

    // Then drain current
    if (remaining > 0) {
      newCurrent = Math.max(0, newCurrent - remaining);
    }

    await this.actor.update({
      [`flags.${MODULE_ID}.powerPoints.current`]: newCurrent,
      [`flags.${MODULE_ID}.powerPoints.temporary`]: newTemporary
    });
    return true;
  }

  /**
   * Add power points to current pool (clamped to maximum)
   * @param {number} amount - Amount to add (can be negative)
   * @returns {Promise<void>}
   */
  async add(amount) {
    const newCurrent = Math.clamp(this.current + amount, 0, this.maximum);
    await this.actor.setFlag(MODULE_ID, "powerPoints.current", newCurrent);
  }

  /**
   * Set current power points to a specific value (clamped to maximum)
   * @param {number} value - New current value
   * @returns {Promise<void>}
   */
  async setCurrent(value) {
    const newCurrent = Math.clamp(value, 0, this.maximum);
    await this.actor.setFlag(MODULE_ID, "powerPoints.current", newCurrent);
  }

  /**
   * Add temporary power points
   * @param {number} amount - Amount to add (can be negative)
   * @returns {Promise<void>}
   */
  async addTemporary(amount) {
    const newTemporary = Math.max(0, this.temporary + amount);
    await this.actor.setFlag(MODULE_ID, "powerPoints.temporary", newTemporary);
  }

  /**
   * Set temporary power points to a specific value
   * @param {number} value - New temporary value
   * @returns {Promise<void>}
   */
  async setTemporary(value) {
    const newTemporary = Math.max(0, value);
    await this.actor.setFlag(MODULE_ID, "powerPoints.temporary", newTemporary);
  }

  /**
   * Restore power points to maximum (clears temporary)
   * Typically called during rest.
   * @returns {Promise<void>}
   */
  async restore() {
    await this.actor.update({
      [`flags.${MODULE_ID}.powerPoints.current`]: this.maximum,
      [`flags.${MODULE_ID}.powerPoints.temporary`]: 0
    });
  }

  /**
   * Check if the actor has any power points (maximum > 0)
   * @type {boolean}
   */
  get inUse() {
    return this.maximum > 0;
  }
}
