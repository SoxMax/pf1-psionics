import { AugmentModel } from "../dataModels/item/augment-model.mjs";

/**
 * Psionic-specific action that supports augments
 * Extends PF1's ItemAction with augment handling
 */
export class PsionicAction extends pf1.components.ItemAction {

  /** @override */
  static defineSchema() {
    const parentSchema = super.defineSchema();
    const fields = foundry.data.fields;

    return {
      ...parentSchema,
      // Add augments field to schema so it's preserved in toObject()
      // IMPORTANT: Use a function for initial to avoid shared reference bug -
      // a literal [] would be shared across ALL PsionicAction instances
      augments: new fields.ArrayField(new fields.EmbeddedDataField(AugmentModel), {
        required: false,
        nullable: false,
        initial: () => [],
      }),
    };
  }

  /** @override */
  prepareData() {
    super.prepareData();

    // Schema automatically creates AugmentModel instances in this.augments array
    // Inherit images and prepare each augment
    for (const augment of this.augments || []) {
      augment.prepareData?.();
    }
  }

  /**
   * Get parent power item
   * @type {PowerItem}
   */
  get power() {
    return this.parent;
  }
}
