import { MODULE_ID } from "../_module.mjs";
import { PowerPointsHelper } from "./power-points-helper.mjs";
import { PsionicFocusHelper } from "./psionic-focus-helper.mjs";
import { createManifesterRecord } from "../data/manifesters.mjs";

/**
 * Main helper class providing access to all psionic functionality for an actor.
 * This is attached to actors as `actor.psionics` to provide a namespaced API.
 *
 * @example
 * // Access power points
 * await actor.psionics.powerPoints.spend(5);
 * console.log(actor.psionics.powerPoints.available);
 *
 * // Access psionic focus
 * if (actor.psionics.focus.isFocused) {
 *   await actor.psionics.focus.expend();
 * }
 */
export class PsionicsHelper {
  /**
   * @param {Actor} actor - The actor this helper manages
   */
  constructor(actor) {
    this.actor = actor;
    this._powerPoints = null;
    this._focus = null;
  }

  /**
   * Power points helper for this actor
   * @type {PowerPointsHelper}
   */
  get powerPoints() {
    if (!this._powerPoints) {
      this._powerPoints = new PowerPointsHelper(this.actor);
    }
    return this._powerPoints;
  }

  /**
   * Psionic focus helper for this actor
   * @type {PsionicFocusHelper}
   */
  get focus() {
    if (!this._focus) {
      this._focus = new PsionicFocusHelper(this.actor);
    }
    return this._focus;
  }

  /**
   * Check if this actor has any psionic capabilities
   * @type {boolean}
   */
  get hasPsionics() {
    return this.powerPoints.inUse || this.focus.inUse;
  }

  /**
   * Get the manifesters dict for this actor.
   * Keys are 16-char record ids; absent flag returns null.
   * @returns {object|null}
   */
  get manifesters() {
    return this.actor.getFlag(MODULE_ID, "manifesters") ?? null;
  }

  /**
   * Add a manifester record to this actor.
   * Returns the new record id.
   * @param {object} config - record overrides; passed to createManifesterRecord
   * @returns {Promise<string>} new record id
   * @throws {Error} when config.class.itemId is set but does not resolve to a
   *   class item on this actor.
   */
  async addManifester(config = {}) {
    const itemId = config.class?.itemId;
    if (itemId) {
      const item = this.actor.items.get(itemId);
      if (item?.type !== "class") {
        throw new Error(
          `${MODULE_ID}: addManifester class.itemId '${itemId}' does not resolve to a class item on actor '${this.actor.name}'.`,
        );
      }
    }
    const record = createManifesterRecord(config);
    await this.actor.update({[`flags.${MODULE_ID}.manifesters.${record.id}`]: record});
    return record.id;
  }

  /**
   * Remove a manifester record by id.
   * @param {string} id - record id
   * @returns {Promise<boolean>} true if removed
   */
  async removeManifester(id) {
    const ms = this.manifesters ?? {};
    if (!ms[id]) return false;
    await this.actor.update({[`flags.${MODULE_ID}.manifesters.-=${id}`]: null});
    return true;
  }

  /**
   * Get the current active energy type for this actor
   * @type {string}
   */
  get activeEnergy() {
    return this.actor.getFlag(MODULE_ID, "activeEnergy") ?? "fire";
  }

  /**
   * Set the active energy type for this actor
   * @param {string} value - The energy type (cold, electricity, fire, sonic)
   * @returns {Promise<Actor>}
   */
  async setActiveEnergy(value) {
    const validTypes = ["cold", "electricity", "fire", "sonic"];
    if (!validTypes.includes(value)) {
      throw new Error(`Invalid energy type: ${value}. Must be one of: ${validTypes.join(", ")}`);
    }
    return this.actor.setFlag(MODULE_ID, "activeEnergy", value);
  }
}

