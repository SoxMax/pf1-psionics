/**
 * Augment pseudo-document
 * Similar to ItemAction, augments are embedded DataModel instances that can modify power behavior
 */
export class AugmentModel extends pf1.models.abstract.DocumentLikeModel {
  /**
   * Default image for augments
   *
   * @readonly
   */
  static FALLBACK_IMAGE = /** @type {const} */ ("icons/svg/upgrade.svg");

  /** @type {string} */
  get documentName() {
    return this.constructor.documentName;
  }

  static get documentName() {
    return this.metadata.name;
  }

  /**
   * Metadata mimicking Foundry documents
   *
   * Required by AugmentEditor#_createDocumentIdLink
   *
   * @internal
   * @readonly
   */
  static metadata = Object.freeze({
    name: "Augment",
    label: "PF1-Psionics.Augments.Singular",
  });

  /** @override */
  _configure(options) {
    super._configure(options);

    // Following prevent these definitions being lost on model reset()
    Object.defineProperties(this, {
      // Apps
      apps: {
        value: Object.create(null),
        writable: false,
        enumerable: false,
      },
    });
  }

  /** @override */
  static defineSchema() {
    const { fields } = foundry.data;
    const optional = { required: false, initial: undefined };

    return {
      ...super.defineSchema({ name: () => game.i18n.localize("PF1-Psionics.Augments.New") }),
      img: new fields.FilePathField({ categories: ["IMAGE"], ...optional }),
      description: new fields.HTMLField({ ...optional }),
      tag: new fields.StringField({ blank: false, nullable: true, ...optional }),
      cost: new fields.NumberField({ required: true, initial: 1, integer: true }),
      maxUses: new fields.NumberField({ required: false, initial: null, integer: true, min: 1, nullable: true }),
      requiresFocus: new fields.BooleanField({ initial: false }),
      effects: new fields.SchemaField({
        damageBonus: new fields.StringField({ required: false }),
        damageMult: new fields.NumberField({ required: false }),
        durationMultiplier: new fields.NumberField({ required: false }),
        dcBonus: new fields.NumberField({ required: false }),
        clBonus: new fields.NumberField({ required: false }),
        special: new fields.StringField({ required: false }),
      }),
    };
  }

  /**
   * Prepare augment data
   * Inherits image from parent power if not set
   *
   * @override
   */
  prepareData() {
    const item = this.item;
    if (!item?.system) return; // Item has not been prepared yet

    // Inherit image from parent power if not set
    this.img ||= item?.img || this.constructor.FALLBACK_IMAGE;

    this.tag ||= pf1.utils.createTag(this.name);
  }

  /**
   * Get the parent action this augment belongs to
   *
   * @type {PsionicAction}
   */
  get action() {
    return this.parent;
  }

  /**
   * Get the parent power item this augment belongs to
   *
   * @type {PowerItem}
   */
  get power() {
    return this.parent?.parent;
  }

  /**
   * Get the parent item (alias for power)
   *
   * @type {PowerItem}
   */
  get item() {
    return this.power;
  }

  /**
   * Check if this augment can be used
   *
   * @param {ActorPF} actor - The actor using the power
   * @returns {boolean}
   */
  canUse(actor) {
    if (!actor) return true;

    // Check power point cost using helper
    const ppAvailable = actor.psionics?.powerPoints?.available ?? 0;
    if (ppAvailable < this.cost) return false;

    // Check psionic focus requirement using helper
    if (this.requiresFocus && this.maxUses === 1) {
      const isFocused = actor.psionics?.focus?.isFocused ?? false;
      if (!isFocused) return false;
    }

    return true;
  }

  /**
   * Get remaining uses for this augment
   * Returns null for unlimited uses
   *
   * @param {ItemPF} item - The parent item
   * @returns {number|null}
   */
  getRemainingUses(item) {
    if (this.maxUses === null || this.maxUses === undefined) return null;

    const usesKey = `flags.pf1-psionics.augmentUses.${this._id}`;
    const uses = foundry.utils.getProperty(item, usesKey) ?? this.maxUses;
    return uses;
  }

  /**
   * Prune empty data from source
   *
   * @param {object} source - Source data to prune
   */
  static pruneData(source) {
    // Remove default values
    if (source.cost === 1) delete source.cost;
    if (source.maxUses === null) delete source.maxUses;
    if (source.requiresFocus === false) delete source.requiresFocus;

    // Remove empty optional fields
    if (!source.description) delete source.description;
    if (!source.tag) delete source.tag;
    if (!source.img) delete source.img;

    // Prune effects
    if (source.effects) {
      if (!source.effects.damageBonus) delete source.effects.damageBonus;
      if (source.effects.damageMult === 1) delete source.effects.damageMult;
      if (source.effects.durationMultiplier === 1) delete source.effects.durationMultiplier;
      if (source.effects.dcBonus === 0) delete source.effects.dcBonus;
      if (source.effects.clBonus === 0) delete source.effects.clBonus;
      if (!source.effects.special) delete source.effects.special;

      // Remove effects object if empty
      if (Object.keys(source.effects).length === 0) delete source.effects;
    }
  }
}
