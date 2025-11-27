/**
 * Manifester details.
 */
export class Manifester {
  /**
   * Book key.
   */
  key;

  /**
   * Owning actor.
   */
  actor;

  /**
   * Raw manifester data.
   */
  data;

  /**
   * All spells.
   */
  spells = [];

  level = {};

  /**
   * @param {string} bookKey Book key.
   * @param {ActorPF} actor Owning actor.
   */
  constructor(bookKey, actor) {
    this.key = bookKey;
    this.actor = actor;
    // Note: actor.system.attributes.spells.spellbooks is from PF1 core system
    this.data = actor.system.attributes.spells.spellbooks[bookKey];
  }

  /**
   * Add spell to the manifester and to its appropriate level.
   *
   * @param {ItemSpellPF} spell
   */
  addSpell(spell) {
    this.spells.push(spell);

    // Basic sanity check
    const level = spell.system.level;
    if (Math.clamp(level, 0, 9) !== level) {
      console.error("Spell with impossible spell level:", spell);
      return;
    }

    // Ensure appropriate spell level exists
    this.level[level] ??= new ManifesterLevel(this);

    // Add spell to the spell level also
    this.level[level].spells.push(spell);
  }
}

/**
 * Manifester leveled details.
 */
export class ManifesterLevel {
  /**
   * Owning book.
   */

  book;
  /**
   * Spells for level.
   */
  spells = [];

  constructor(book) {
    this.book = book;
  }
}

export class ManifesterSlots {
  level = 0;
  max = 0;
  value = 0;
  domain = 0;
  domainMax = 0;
  domainUnused = 0;
  used = 0;
  total = 0;

  /**
   * @param {object} options - Options
   * @param {number} options.max - Maximum normal spells
   * @param {number} options.domain - Maximum domain spells
   * @param {number} options.level - Spell level
   */
  constructor({ max = 0, domain = 0, level = 0 } = {}) {
    this.level = level;

    // Enforce lack of domain slots for level 0
    if (level === 0) domain = 0;

    this.value = max + domain;
    this.max = max;

    this.domain = domain;
    this.domainMax = domain;
    this.domainUnused = domain;

    this.total = max + domain;
  }
}

export class SpellRanges {
  close;
  medium;
  long;

  cl;

  constructor(cl) {
    this.cl = cl;
    this.close = pf1.utils.calculateRange(null, "close", { cl })[0];
    this.medium = pf1.utils.calculateRange(null, "medium", { cl })[0];
    this.long = pf1.utils.calculateRange(null, "long", { cl })[0];
  }
}

export class ManifesterMode {
  raw;

  #spontaneous = false;
  #prepared = false;

  get isSpontaneous() {
    return this.#spontaneous || false;
  }

  get isPrepared() {
    return this.#prepared || false;
  }

  get usesSpellpoints() {
    return this.book.spellPoints?.useSystem === true;
  }

  get isSemiSpontaneous() {
    return this.isSpontaneous || this.usesSpellpoints || false;
  }

  constructor(book) {
    this.book = book;

    let mode = book.spellPreparationMode;
    // Shunt invalid mode
    mode ||= book.spellPreparationMode = "spontaneous";

    this.raw = mode;

    const preparation = pf1.config.caster.type[this.raw];
    this.#spontaneous = preparation.spontaneous;
    this.#prepared = preparation.prepared;
  }
}
