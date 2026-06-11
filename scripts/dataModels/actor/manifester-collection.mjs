import { ManifesterModel } from "./manifester-model.mjs";

/**
 * Typed container for an actor's manifester records.
 *
 * Hydrate via `ManifesterCollection.fromActor(actor)`; the collection holds
 * a TypedObjectField of EmbeddedDataField(ManifesterModel) keyed by class
 * tag. Provides CRUD helpers that write back to the flag namespace via
 * the owning actor's `.update()`.
 */
export class ManifesterCollection extends foundry.abstract.DataModel {
  /** @override */
  static defineSchema() {
    const { TypedObjectField, EmbeddedDataField } = foundry.data.fields;
    return {
      manifesters: new TypedObjectField(new EmbeddedDataField(ManifesterModel), {
        required: false,
        initial: () => ({}),
      }),
    };
  }

  /**
   * Owning actor; set by `fromActor`.
   * @type {Actor | null}
   */
  actor = null;

  /**
   * Hydrate from an actor's flag dict. Schema validation discards bad
   * records (logs to console) rather than throwing — keeps world load
   * resilient against corrupted data.
   *
   * @param {Actor} actor
   * @returns {ManifesterCollection}
   */
  static fromActor(actor) {
    const raw = actor.getFlag("pf1-psionics", "manifesters") ?? {};
    let collection;
    try {
      collection = new ManifesterCollection({ manifesters: raw }, { parent: actor });
    } catch (err) {
      console.error("pf1-psionics | Manifester data failed validation, falling back to empty collection.", err);
      collection = new ManifesterCollection({ manifesters: {} }, { parent: actor });
    }
    collection.actor = actor;
    // Stamp tag + actor back-refs onto each record so model methods can self-identify.
    for (const [tag, record] of Object.entries(collection.manifesters)) {
      record.tag = tag;
      record.actor = actor;
    }
    return collection;
  }

  /**
   * Persist the collection back to the actor flag namespace, replacing
   * the entire manifesters dict. Use {@link create}/{@link delete} for
   * targeted writes when possible.
   *
   * @returns {Promise<Actor>}
   */
  async commit() {
    if (!this.actor) throw new Error("pf1-psionics | ManifesterCollection.commit: no actor");
    const payload = {};
    for (const [tag, record] of Object.entries(this.manifesters)) {
      payload[tag] = record.toObject();
    }
    return this.actor.update({ "flags.pf1-psionics.manifesters": payload });
  }

  /**
   * Create a new manifester record. Tag becomes the dict key. Throws on
   * tag clash; caller is responsible for picking a unique tag.
   *
   * @param {string} tag - class tag, or "_hd" for psi-like.
   * @param {object} config - field overrides for the new record.
   * @returns {Promise<string>} the tag.
   */
  async create(tag, config = {}) {
    if (!tag) throw new Error("pf1-psionics | ManifesterCollection.create: tag is required");
    if (this.manifesters[tag]) {
      throw new Error(`pf1-psionics | Manifester '${tag}' already exists on actor '${this.actor?.name}'.`);
    }
    const data = { ...config, class: config.class ?? tag };
    await this.actor.update({ [`flags.pf1-psionics.manifesters.${tag}`]: data });
    return tag;
  }

  /**
   * Delete a manifester record.
   *
   * @param {string} tag
   * @returns {Promise<boolean>} true if a record was removed.
   */
  async delete(tag) {
    if (!this.manifesters[tag]) return false;
    await this.actor.update({ [`flags.pf1-psionics.manifesters.-=${tag}`]: null });
    return true;
  }

  /**
   * Rename a manifester record's key.
   *
   * @param {string} oldTag
   * @param {string} newTag
   * @returns {Promise<boolean>}
   */
  async rename(oldTag, newTag) {
    if (!this.manifesters[oldTag]) return false;
    if (this.manifesters[newTag]) {
      throw new Error(`pf1-psionics | Manifester '${newTag}' already exists; cannot rename.`);
    }
    const data = this.manifesters[oldTag].toObject();
    data.class = newTag;
    await this.actor.update({
      [`flags.pf1-psionics.manifesters.-=${oldTag}`]: null,
      [`flags.pf1-psionics.manifesters.${newTag}`]: data,
    });
    return true;
  }
}
