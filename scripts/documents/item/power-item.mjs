import {MODULE_ID} from "../../_module.mjs";

export class PowerItem extends pf1.documents.item.ItemPF {

  /** @inheritDoc */
  static _adjustNewItem(item, data, override = false) {
    if (!item.actor) return;

    // Assign level if undefined
    if (!Number.isFinite(data?.system?.level) || override) {
      const book = item.system.manifestor;
      const cls = item.actor.flags?.[MODULE_ID]?.manifestors?.[book]?.classId;
      const level = item.system.learnedAt?.class?.[cls];
      if (Number.isFinite(level)) {
        foundry.utils.setProperty(item._source, "system.level", Math.clamp(level, 0, 9));
      }
    }
  }

  getRollData(options) {
    const rollData = super.getRollData(options);
    rollData.sl = this.system.level || 0;
    return rollData;
  }

  /** @inheritDoc */
  getLabels({actionId, rollData, isolated} = {}) {
    const labels = super.getLabels({actionId, rollData, isolated});
    const itemData = this.system;

    // Spell Level, School, and Components
    labels.level = pf1.config.psionics.powerLevels[itemData.level];
    labels.discipline = pf1.config.psionics.disciplines[itemData.discipline];
    labels.displays = this.getDisplays().join(" ");
    labels.chargeCost = RollPF.safeRollSync(this.getDefaultChargeFormula(), rollData, undefined, undefined,
        {minimize: true}).total;

    return labels;
  }

  getDisplays() {
    const displays = [];
    if (this.system.display.auditory) displays.push(game.i18n.localize("PF1-Psionics.Powers.Display.Auditory"));
    if (this.system.display.material) displays.push(game.i18n.localize("PF1-Psionics.Powers.Display.Material"));
    if (this.system.display.mental) displays.push(game.i18n.localize("PF1-Psionics.Powers.Display.Mental"));
    if (this.system.display.olefactory) displays.push(game.i18n.localize("PF1-Psionics.Powers.Display.Olefactory"));
    if (this.system.display.visual) displays.push(game.i18n.localize("PF1-Psionics.Powers.Display.Visual"));
    return displays;
  }

  /**
   * Default charge formula.
   *
   * @returns {string} Charge formula
   */
  getDefaultChargeFormula() {
    return this.system.uses?.autoDeductChargesCost || "max(0, @sl * 2 - 1)";
  }

  /**
   * Effective spell level
   *
   * @remarks
   * - Accounts for offset
   *
   * @type {number}
   */
  get spellLevel() {
    return this.system.level + (this.system.modifiers.sl || 0);
  }

  /**
   * Effective caster level
   *
   * @remarks
   * - Accounts for offset
   * - Returns null if not linked to a valid manifestor.
   *
   * @type {number|null}
   */
  get casterLevel() {
    const manifestor = this.manifestor;
    if (!manifestor) return null;

    return manifestor.cl.total + (this.system.modifiers.cl || 0);
  }

  /**
   * Linked manifestor
   *
   * @type {object|undefined}
   */
  get manifestor() {
    const bookId = this.system.manifestor;
    return this.actor?.flags["pf1-psionics"]?.manifestors[bookId];
  }

  /**
   * @param {object} itemData - A spell item's data.
   * @returns {[number,number]} - A tuple containing the spell level and caster level in order.
   */
  static getMinimumCasterLevelBySpellData(itemData) {
    const learnedAt = Object.entries(itemData.system.learnedAt?.class ?? {})?.
        reduce((cur, [classId, level]) => {
          const classes = classId.split("/");
          for (const cls of classes) cur.push([cls, level]);
          return cur;
        }, []);
    const result = [9, 20];
    for (const [classId, level] of learnedAt) {
      result[0] = Math.min(result[0], level);

      const tc = pf1.config.classCasterType[classId] || "high";
      if (tc === "high") {
        result[1] = Math.min(result[1], 1 + Math.max(0, level - 1) * 2);
      } else if (tc === "med") {
        result[1] = Math.min(result[1], 1 + Math.max(0, level - 1) * 3);
      } else if (tc === "low") {
        result[1] = Math.min(result[1], 1 + Math.max(0, level) * 3);
      }
    }

    return result;
  }

  /**
   * @internal
   */
  _prepareTraits() {
    super._prepareTraits();
    const map = {
      subdiscipline: pf1.config.psionics.subdisciplines,
    };

    for (const [key, labels] of Object.entries(map)) {
      if (!this.system[key]) continue;
      if (this.system[key]?.base) continue; // Preparation has already run, avoid double transform

      const trait = {
        base: this.system[key],
        custom: new Set(),
        standard: new Set(),
        get total() {
          return this.standard.union(this.custom);
        },
        get names() {
          return [...this.standard.map((t) => labels[t] || t), ...this.custom];
        },
      };

      // Array is used by raw data, Set by datamodel
      if (Array.isArray(trait.base) || trait.base instanceof Set) {
        for (const c of trait.base) {
          if (labels[c]) trait.standard.add(c);
          else trait.custom.add(c);
        }
      }
      this.system[key] = trait;
    }
  }

  /** @inheritDoc */
  _addTypeRollData(result) {
    result.sl = this.spellLevel || 0;

    const manifestor = this.manifestor;
    if (manifestor) {
      const spellAbility = manifestor.ability;
      let ablMod = "";
      if (spellAbility !== "") ablMod = result.abilities?.[spellAbility]?.mod;
      result.ablMod = ablMod;

      result.cl = this.casterLevel || 0;

      // Add @class shortcut to @classes[classTag]
      if (manifestor.class === "_hd")
        result.class = {level: result.attributes.hd?.total ?? result.details?.level?.value ?? 0};
      else result.class = result.classes?.[manifestor.class] ?? {};

      // Add @manifestor shortcut to @psionics[bookId]
      result.manifestor = result.psionics[this.system.manifestor];
    } else {
      const [sl, cl] = this.constructor.getMinimumCasterLevelBySpellData(this);

      result.sl = sl;
      result.cl = cl;
      result.ablMod = Math.floor(sl / 2);
    }
  }

  /** @inheritDoc */
  getConditionalTargets(targets) {
    super.getConditionalTargets(targets);

    // Add Caster Level target
    targets.push({
      id: "cl",
      label: game.i18n.localize("PF1.CasterLevel"),
      simple: true,
      sort: (targets.find((e) => e.id === "dc").sort ?? 5_000) + 100, // Sort after DC
    });

    // Relabel for spellpoints
    // if (this.useSpellPoints()) charges.label = game.i18n.localize("PF1.SpellPointsCost");
    // else charges.disabled = true; // Non-spellpoint spells do not use charges
  }

  /**
   * Add charges to the spell or its relevant resource pool (spell points or spontaneous spells).
   *
   * @override
   * @param {number} value - Number of charges to add
   * @param {object} [data=null] - Additional data to pass to the update
   * @returns {Promise<this | void>} Updated document or undefined if no update is possible or required.
   */
  async addCharges(value, _data = null) {
    if (!this.actor) return;
    if (this.system.atWill) return;
    if (value === 0) return this;

    const powerPoints = this.actor.flags?.[MODULE_ID].powerPoints;

    const updateData = {};
    if (value > 0) {
      updateData[`flags.${MODULE_ID}.powerPoints.current`] = Math.min(powerPoints.maximum, powerPoints.current + value);
    } else {
      let toRemove = Math.abs(value);
      if (toRemove < powerPoints.temporary) {
        updateData[`flags.${MODULE_ID}.powerPoints.temporary`] = powerPoints.temporary - toRemove;
      } else {
        toRemove -= powerPoints.temporary;
        updateData[`flags.${MODULE_ID}.powerPoints.temporary`] = 0;
        updateData[`flags.${MODULE_ID}.powerPoints.current`] = powerPoints.current - toRemove;
      }
    }

    await this.actor.update(updateData);
    return this;
  }

  /**
   * Number of remaining uses, or max.
   *
   * @param {boolean} max - Return max uses.
   * @returns {number} - Uses
   */
  getPowerPoints(max = false) {
    const itemData = this.system;
    if (itemData.atWill) return Number.POSITIVE_INFINITY;

    // const prepared = itemData.preparation?.value ?? 0;
    const prepared = 1;

    if (prepared > 0) {
      const powerPoints = this.actor?.flags["pf1-psionics"]?.powerPoints;
      if (max) return powerPoints?.maximum ?? 0;
      return powerPoints?.current ?? 0 + powerPoints?.temp ?? 0;
    }

    return 0;
  }

  /** @inheritDoc */
  get isCharged() {
    if (this.system.atWill) return false;
    return true;
  }

  /** @inheritdoc */
  get hasFiniteCharges() {
    if (this.system.atWill) return false;
    return this.getDefaultChargeCost() > 0;
  }

  /** @inheritDoc */
  get charges() {
    return this.getPowerPoints();
  }

  /** @inheritDoc */
  get maxCharges() {
    return this.getPowerPoints(true);
  }

  /**
   * @remarks
   * Checks for at-will and preparation status.
   * @inheritDoc
   */
  get canUse() {
    if (this.system.atWill) return true;

    // return (this.system.preparation?.value ?? 0) > 0;
    return true;
  }

  /**
   * Concentration DC
   *
   * @param {string} type - Type of concentration check
   * @param {object} [options] - Additional options
   * @throws {Error} - If type is invalid
   * @returns {number} - DC
   */
  getConcentrationDC(type = "defensive", options = {}) {
    const level = this.system.level || 0;
    switch (type) {
        // Defensive Casting
      case "defensive": {
        return 15 + level * 2;
      }
        // Maintain spell on damage taken
      case "damage": {
        const damage = options.damage ?? 0;
        return 15 + level + damage;
      }
        // Default nonsense value
      default: {
        throw new Error(`Unrecgnized concentration check type: "${type}"`);
      }
    }
  }

  /** @inheritDoc */
  async getDescription({chatcard = false, data = {}, rollData, header = true, body = true, isolated = false} = {}) {
    const renderCachedTemplate = pf1.utils.handlebars.renderCachedTemplate;
    const headerContent = header
        ? renderCachedTemplate(
            "modules/pf1-psionics/templates/item/parts/power-header.hbs", {
              ...data,
              ...(await this.getDescriptionData({rollData, isolated})),
              chatcard: chatcard === true,
            })
        : "";

    let bodyContent = "";
    if (body) {
      const noDesc = "<p class='placeholder'>" + game.i18n.localize("PF1.NoDescription") + "</p>";
      bodyContent = '<div class="description-body">' + (this.system.description.value || noDesc) + "</div>";
    }

    let separator = "";
    if (header && body) separator = `<h3 class="description-header">${game.i18n.localize("PF1.Description")}</h3>`;

    return headerContent + separator + bodyContent;
  }

  /** @inheritDoc */
  async getDescriptionData({rollData, isolated = false} = {}) {
    const result = await super.getDescriptionData({rollData, isolated});

    const system = this.system;
    result.system = system;

    const defaultAction = this.defaultAction;
    const action = defaultAction ?? {};

    rollData ??= defaultAction?.getRollData() ?? this.getRollData();

    const labels = this.getLabels({rollData, isolated});
    result.labels = labels;

    labels.discipline = pf1.config.psionics.disciplines[system.discipline];
    labels.subdiscipline = pf1.utils.i18n.join([...(system.subdiscipline.names ?? [])]);
    labels.descriptors = pf1.utils.i18n.join([...(system.descriptors.names ?? [])], "conjunction", false);

    // Set information about when the spell is learned
    result.learnedAt = {};
    if (system.learnedAt) {
      const classNames = await pf1.utils.packs.getClassIDMap();
      for (const category of ["class", "domain", "subDomain", "elementalSchool", "bloodline"]) {
        result.learnedAt[category] = pf1.utils.i18n.join(
            Object.entries(system.learnedAt[category]).map(
                ([classId, level]) => `${classNames[classId] || classId} ${level}`,
            ),
        );
      }
    }

    // Set components label
    labels.displays = pf1.utils.i18n.join(this.getDisplays());

    // Set effect label
    const effect = action.effect;
    if (effect) labels.effect = effect;

    // Set DC and SR
    {
      const savingThrowDescription = action.save?.description;
      labels.savingThrow = savingThrowDescription || game.i18n.localize("PF1.None");

      const sr = system.sr;
      labels.sr = (sr === true ? game.i18n.localize("PF1.Yes") : game.i18n.localize("PF1.No")).toLowerCase();

      if (action.range?.units !== "personal") result.useDCandSR = true;
    }

    const harmless = action.save?.harmless ?? false;
    if (harmless) labels.harmless = game.i18n.localize("PF1.Yes").toLowerCase();

    return result;
  }
}
