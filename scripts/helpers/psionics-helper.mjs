import { MODULE_ID } from "../_module.mjs";
import { PowerPointsHelper } from "./power-points-helper.mjs";
import { PsionicFocusHelper } from "./psionic-focus-helper.mjs";
import { getCollection } from "../documents/actor/manifester-store.mjs";

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
   * Keys are class tags (e.g. "psion", "wilder", "_hd" for psi-like);
   * absent flag returns null. Values are raw record objects — for
   * hydrated ManifesterModel instances, use the collection helper:
   * `import { getCollection } from "scripts/documents/actor/manifester-store.mjs"`.
   * @returns {object|null}
   */
  get manifesters() {
    return this.actor.getFlag(MODULE_ID, "manifesters") ?? null;
  }

  /**
   * Get the hydrated ManifesterCollection for this actor.
   * @returns {import("../dataModels/actor/manifester-collection.mjs").ManifesterCollection}
   */
  get manifesterCollection() {
    return getCollection(this.actor);
  }

  /**
   * Add a manifester record to this actor.
   * @param {string} tag - class tag (e.g. "psion") or "_hd" for psi-like.
   * @param {object} config - record overrides (name, ability, casterType, ...).
   * @returns {Promise<string>} the tag of the new record.
   * @throws {Error} when tag is already in use on this actor.
   */
  async addManifester(tag, config = {}) {
    if (!tag) {
      throw new Error(`${MODULE_ID}: addManifester tag is required.`);
    }
    const collection = this.manifesterCollection;
    return collection.create(tag, config);
  }

  /**
   * Remove a manifester record by tag.
   * @param {string} tag - class tag.
   * @returns {Promise<boolean>} true if removed.
   */
  async removeManifester(tag) {
    const collection = this.manifesterCollection;
    return collection.delete(tag);
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

