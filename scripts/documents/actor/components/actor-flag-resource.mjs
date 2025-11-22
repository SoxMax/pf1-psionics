/**
 * Resource wrapper for actor flag-based resource pools.
 * Extends the PF1 Resource pattern to support pools stored in actor flags
 * rather than item charges.
 */
export class ActorFlagResource {
  /**
   * @param {ActorPF} actor - The actor owning this resource
   * @param {object} config - Resource configuration
   * @param {string} config.tag - Unique identifier (e.g., "powerPoints")
   * @param {string} config.flagPath - Path to flag data (e.g., "flags.pf1-psionics.powerPoints")
   */
  constructor(actor, config) {
    this.actor = actor;
    this.config = config;

    Object.defineProperties(this, {
      _id: { value: config.tag, enumerable: true },
      tag: { value: config.tag, enumerable: true },
    });
  }

  /**
   * Current resource value (current + temporary)
   * @type {number}
   */
  get value() {
    const data = foundry.utils.getProperty(this.actor, this.config.flagPath);
    if (!data) return 0;
    return (data.current || 0) + (data.temporary || 0);
  }

  /**
   * Maximum resource value
   * @type {number}
   */
  get max() {
    const data = foundry.utils.getProperty(this.actor, this.config.flagPath);
    return data?.maximum || 0;
  }

  /**
   * Item ID (for compatibility with Resource interface)
   * @type {string}
   */
  get id() {
    return this._id;
  }

  /**
   * Item reference (for compatibility with Resource interface)
   * Returns self since this resource isn't backed by an item
   * @type {ActorFlagResource}
   */
  get item() {
    return this;
  }

  /**
   * Add or subtract from resource pool
   * @param {number} amount - Amount to add (negative to subtract)
   * @returns {Promise<ActorPF>} - Updated actor
   */
  async add(amount) {
    const data = foundry.utils.getProperty(this.actor, this.config.flagPath);
    if (!data) return this.actor;

    const updateData = {};

    if (amount > 0) {
      // Adding - goes to current only, capped at maximum
      const newCurrent = Math.min(data.maximum || 0, (data.current || 0) + amount);
      updateData[`${this.config.flagPath}.current`] = newCurrent;
    } else if (amount < 0) {
      // Removing - spend temporary first, then current
      let toRemove = Math.abs(amount);
      const temporary = data.temporary || 0;
      const current = data.current || 0;

      if (toRemove <= temporary) {
        // Can cover entirely from temporary
        updateData[`${this.config.flagPath}.temporary`] = temporary - toRemove;
      } else {
        // Deplete temporary, then take from current
        toRemove -= temporary;
        updateData[`${this.config.flagPath}.temporary`] = 0;
        updateData[`${this.config.flagPath}.current`] = Math.max(0, current - toRemove);
      }
    }

    if (Object.keys(updateData).length === 0) return this.actor;
    return this.actor.update(updateData);
  }

  /**
   * Get labels for display (compatibility with PF1 Resource interface)
   * @returns {object} Labels object
   */
  getLabels() {
    return {
      uses: `${this.value}/${this.max}`
    };
  }

  /**
   * Get name for display (compatibility with PF1 Resource interface)
   * @type {string}
   */
  get name() {
    const labelKey = `PF1-Psionics.Resources.${this.config.tag}`;
    return game.i18n.localize(labelKey);
  }

  /**
   * Get type (compatibility with PF1 Resource interface)
   * @type {string}
   */
  get type() {
    return "resource";
  }
}
