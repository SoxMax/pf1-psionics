/* global Collection */
import {AugmentModel} from "../dataModels/item/augment-model.mjs";

/**
 * Psionic-specific action that supports augments
 * Extends PF1's ItemAction with augment handling
 */
export class PsionicAction extends pf1.components.ItemAction {

  /** @override */
  _configure(options) {
    super._configure(options);

    // Add augments collection (like how ItemPF adds actions collection)
    Object.defineProperty(this, "augments", {
      value: new Collection(),
      writable: true,
      enumerable: false,
    });
  }

  /**
   * Prepare augments from raw data into AugmentModel instances
   * Similar to how ItemPF._prepareActions() works
   * @internal
   */
  _prepareAugments() {
    const augmentData = this._source.augments || [];
    const prior = this.augments;
    const collection = new Collection();

    for (const data of augmentData) {
      let augment = null;
      if (prior && prior.has(data._id)) {
        // Reuse existing augment if it exists
        augment = prior.get(data._id);
        // Update source if it changed (for reactive updates)
        if (augment.replaceSource) augment.replaceSource(data);
      } else {
        // Create new AugmentModel instance
        augment = new AugmentModel(data, {parent: this});
      }
      collection.set(augment._id, augment);
    }

    this.augments = collection;

    // Close any augment editor apps for removed augments
    for (const augment of prior ?? []) {
      if (this.augments.get(augment._id) !== augment) {
        for (const app of Object.values(augment.apps)) {
          app.close({submit: false, force: true});
        }
      }
    }
  }

  /** @override */
  prepareData() {
    super.prepareData();
    this._prepareAugments();
  }

  /**
   * Get parent power item
   * @type {PowerItem}
   */
  get power() {
    return this.parent;
  }
}
