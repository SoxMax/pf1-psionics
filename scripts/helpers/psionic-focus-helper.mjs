// filepath: /home/cobrien/Applications/Foundry/userdata/Data/modules/pf1-psionics/scripts/helpers/psionic-focus-helper.mjs
import { MODULE_ID } from "../_module.mjs";

/**
 * Helper class for managing an actor's psionic focus.
 * Provides methods to gain, expend, and restore psionic focus.
 * 
 * @example
 * // Get helper from actor
 * const focus = actor.psionics.focus;
 *
 * // Check if focused
 * if (focus.isFocused) {
 *   await focus.expend(); // Use focus
 * }
 * 
 * // Regain focus
 * await focus.gain();
 */
export class PsionicFocusHelper {
  /**
   * @param {Actor} actor - The actor this helper manages
   */
  constructor(actor) {
    this.actor = actor;
  }

  /**
   * Current focus points (typically 0 or 1)
   * @type {number}
   */
  get current() {
    return this.actor.getFlag(MODULE_ID, "focus.current") ?? 0;
  }

  /**
   * Maximum focus points (typically 1 if actor has power points, 0 otherwise)
   * This is calculated during actor data preparation.
   * @type {number}
   */
  get maximum() {
    return this.actor.getFlag(MODULE_ID, "focus.maximum") ?? 0;
  }

  /**
   * Check if the actor is currently psionically focused
   * @type {boolean}
   */
  get isFocused() {
    return this.current > 0;
  }

  /**
   * Check if the actor can use psionic focus (has maximum > 0)
   * @type {boolean}
   */
  get inUse() {
    return this.maximum > 0;
  }

  /**
   * Expend psionic focus
   * @returns {Promise<boolean>} True if focus was expended, false if not focused
   */
  async expend() {
    if (!this.isFocused) return false;
    await this.actor.setFlag(MODULE_ID, "focus.current", Math.max(0, this.current - 1));
    return true;
  }

  /**
   * Gain psionic focus (up to maximum)
   * Requires a full-round action and concentration check in game terms.
   * @returns {Promise<boolean>} True if focus was gained
   */
  async gain() {
    if (this.current >= this.maximum) return false;
    await this.actor.setFlag(MODULE_ID, "focus.current", Math.min(this.maximum, this.current + 1));
    return true;
  }

  /**
   * Set focus to a specific value (clamped to maximum)
   * @param {number} value - New focus value
   * @returns {Promise<void>}
   */
  async setCurrent(value) {
    const newCurrent = Math.clamp(value, 0, this.maximum);
    await this.actor.setFlag(MODULE_ID, "focus.current", newCurrent);
  }

  /**
   * Restore focus to maximum
   * Typically called during rest.
   * @returns {Promise<void>}
   */
  async restore() {
    await this.actor.setFlag(MODULE_ID, "focus.current", this.maximum);
  }

  /**
   * Check if the actor can expend focus
   * @returns {boolean}
   */
  canExpend() {
    return this.isFocused;
  }

  /**
   * Returns a plain object with all focus values.
   * Useful for passing to templates or serialization.
   * @returns {{current: number, maximum: number, isFocused: boolean, inUse: boolean}}
   */
  toObject() {
    return {
      current: this.current,
      maximum: this.maximum,
      isFocused: this.isFocused,
      inUse: this.inUse
    };
  }
}
