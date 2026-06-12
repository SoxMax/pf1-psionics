import { SpellRanges } from "../../documents/actor/utils/manifester.mjs";
import {
  computeCasterLevel,
  computeConcentration,
  computePowerPoints,
} from "./manifester-calculations.mjs";

/**
 * Schema for a single manifester record.
 *
 * Storage shape lives at `flags.pf1-psionics.manifesters[<classTag>]`. Keys
 * in the parent dict are class tags (e.g. "psion", "wilder", "_hd" for
 * HD-based psi-like) — NOT random hex ids. This makes formulas readable
 * (`@psionics.psion.cl.total`) and stable across class re-imports.
 *
 * Derived fields (cl.total, cl.class, cl.bonus, cl.classLevelTotal,
 * cl.woundPenalty, concentration.total, powerPoints.max, range, tag) are
 * NOT in the schema. They are computed each prep cycle by prepareData /
 * _prepareDependentData / finalizeData and attached to the instance.
 */
export class ManifesterModel extends foundry.abstract.DataModel {
  /** @override */
  static defineSchema() {
    const {
      SchemaField,
      StringField,
      NumberField,
      BooleanField,
    } = foundry.data.fields;
    const FormulaField = pf1.models.fields?.FormulaField ?? StringField;

    return {
      name: new StringField({ required: false, initial: "" }),
      class: new StringField({ required: false, initial: "", blank: true }),
      source: new StringField({ required: false, initial: "manual", choices: ["class", "manual"] }),
      casterType: new StringField({ required: false, initial: "high", choices: ["high", "med", "low"] }),
      ability: new StringField({ required: false, initial: "int" }),
      spellPreparationMode: new StringField({ required: false, initial: "spontaneous" }),
      hasCantrips: new BooleanField({ required: false, initial: true }),
      cl: new SchemaField({
        formula: new FormulaField({ required: false, initial: "" }),
        notes: new StringField({ required: false, initial: "" }),
        base: new NumberField({ required: false, initial: 0, integer: true }),
      }),
      concentration: new SchemaField({
        formula: new FormulaField({ required: false, initial: "" }),
        notes: new StringField({ required: false, initial: "" }),
      }),
      powerPoints: new SchemaField({
        max: new NumberField({ required: false, initial: 0, integer: true, min: 0 }),
        formula: new FormulaField({ required: false, initial: "" }),
      }),
      baseDCFormula: new FormulaField({ required: false, initial: "10 + @sl + @ablMod" }),
      autoLevelPowerPoints: new BooleanField({ required: false, initial: true }),
      autoAttributePowerPoints: new BooleanField({ required: false, initial: true }),
      autoMaxPowerLevel: new BooleanField({ required: false, initial: true }),
      _lastTag: new StringField({ required: false, initial: "" }),
      _pendingClassTag: new StringField({ required: false, initial: "" }),
    };
  }

  /**
   * The dict key under which this record is stored. Populated by the parent
   * ManifesterCollection on hydration so model methods can self-identify.
   * Not in the schema; not persisted.
   * @type {string}
   */
  tag = "";

  /**
   * Owning actor reference. Populated by the parent ManifesterCollection on
   * hydration so model methods can read class items and abilities.
   * @type {Actor | null}
   */
  actor = null;

  /**
   * @returns {string} The user-facing label for this manifester.
   */
  get label() {
    if (this.name) return this.name;
    if (this.tag === "_hd" || !this.tag) {
      return game.i18n.localize("PF1-Psionics.Manifesters.Spelllike");
    }
    const cls = this._classItem;
    if (cls) return cls.name;
    return game.i18n.localize("PF1-Psionics.UnknownClass");
  }

  /**
   * Live class item on the owning actor matching this manifester's tag.
   * @returns {Item | null}
   */
  get _classItem() {
    if (!this.actor || !this.class || this.class === "_hd") return null;
    return this.actor.itemTypes?.class?.find((c) => c.system?.tag === this.class) ?? null;
  }

  /**
   * Reset derived fields before each prep cycle. Mirrors
   * SpellbookModel.prepareData in PF1 v12.
   */
  prepareData() {
    this.cl ??= {};
    this.cl.total = 0;
    this.cl.class = 0;
    this.cl.classLevelTotal = 0;
    this.cl.woundPenalty = 0;

    this.concentration ??= {};
    this.concentration.total = 0;

    this.powerPoints ??= {};
    // powerPoints.max gets overwritten in finalizeData; reset here.
    this.powerPoints.max = 0;
  }

  /**
   * Read this prep cycle's change-system delta straight off the raw flag.
   *
   * The PF1 change system writes buff totals to
   * `flags.pf1-psionics.manifesters.<tag>.cl.total` /
   * `…concentration.total` (see `pf1GetChangeFlat` in hooks/init.mjs).
   * `cl.total` and `concentration.total` are not in the schema, so they
   * never round-trip to `actor._source` — Foundry resets `actor.flags` to
   * source at the start of each prep cycle, applyChanges runs before our
   * hook, and the raw value at hook entry is exactly the buff delta.
   *
   * @returns {{cl: number, concentration: number}}
   * @private
   */
  _readChangeBonuses() {
    const raw = this.actor?.flags?.["pf1-psionics"]?.manifesters?.[this.tag];
    const cl = Number(raw?.cl?.total ?? 0);
    const concentration = Number(raw?.concentration?.total ?? 0);
    return {
      cl: Number.isFinite(cl) ? cl : 0,
      concentration: Number.isFinite(concentration) ? concentration : 0,
    };
  }

  /**
   * Mirror derived fields back onto the raw flag dict so downstream readers
   * (e.g. PowerItem.manifester, formulas like `@psionics.psion.cl.total`)
   * see them. The raw flag mutation is in-memory only — these fields are
   * not in the schema, so they never persist to `actor._source`.
   *
   * @private
   */
  _mirrorToRawFlag() {
    const raw = this.actor?.flags?.["pf1-psionics"]?.manifesters?.[this.tag];
    if (!raw) return;
    raw.cl ??= {};
    raw.cl.total = this.cl.total;
    raw.cl.class = this.cl.class;
    raw.cl.classLevelTotal = this.cl.classLevelTotal;
    raw.cl.woundPenalty = this.cl.woundPenalty;
    raw.concentration ??= {};
    raw.concentration.total = this.concentration.total;
    raw.powerPoints ??= {};
    raw.powerPoints.max = this.powerPoints.max;
    raw.range = this.range;
  }

  /**
   * Compute class-derived fields (class level, base CL contribution). Runs
   * after actor items are prepared. Mirrors SpellbookModel._prepareDependentData.
   */
  _prepareDependentData() {
    if (!this.actor) return;

    let classLevel = 0;
    if (this.class === "_hd" || !this.class) {
      classLevel = this.actor.system?.attributes?.hd?.total ?? 0;
    } else {
      const cls = this._classItem;
      classLevel = cls?.system?.unlevel ?? cls?.system?.level ?? 0;
    }
    this.cl.classLevelTotal = classLevel;
    this.cl.class = classLevel;
  }

  /**
   * Finalize: compute CL/concentration/PP totals from formulas and roll data.
   * Mirrors SpellbookModel.finalizeData in PF1 v12.
   *
   * Reads PF1 change-system writes off the raw flag (they were already
   * applied before our prep hook ran), computes totals, and mirrors the
   * derived state back to the raw flag dict for downstream consumers.
   *
   * @param {object} rollData - Actor roll data. Caller is responsible for
   *   ensuring `rollData.class`, `rollData.cl`, `rollData.ablMod` are set
   *   for this manifester's context.
   */
  finalizeData(rollData) {
    if (!this.actor) return;
    const changeBonuses = this._readChangeBonuses();
    this._calculateCasterLevel(rollData, changeBonuses.cl);
    this._calculateConcentration(rollData, changeBonuses.concentration);
    this._calculatePowerPoints(rollData);
    this.range = new SpellRanges(this.cl.total);
    this._mirrorToRawFlag();
  }

  _calculateCasterLevel(rollData, changeBonus) {
    const actor = this.actor;
    const setSourceInfoByName = pf1.documents.actor.changes.setSourceInfoByName;
    const key = `flags.pf1-psionics.manifesters.${this.tag}.cl.total`;

    const formula = this.cl.formula || "0";
    const formulaBonus = RollPF.safeRollSync(formula, rollData).total;
    const energyDrain = rollData.attributes?.energyDrain ?? 0;

    const { total, classLevelTotal } = computeCasterLevel({
      classTag: this.class,
      classLevel: this.cl.classLevelTotal,
      npcBase: this.cl.base,
      actorType: actor.type,
      formulaBonus,
      energyDrain,
      changeBonus,
    });
    this.cl.classLevelTotal = classLevelTotal;
    this.cl.total = total;

    // Source-info logging for sheet transparency.
    if (actor.type === "npc") {
      setSourceInfoByName(actor.sourceInfo, key, game.i18n.localize("PF1.Base"), this.cl.base || 0);
    }
    if (this.class === "_hd" || !this.class) {
      setSourceInfoByName(actor.sourceInfo, key, game.i18n.localize("PF1.HitDie"), this.cl.classLevelTotal);
    } else {
      const cls = this._classItem;
      setSourceInfoByName(
        actor.sourceInfo,
        key,
        cls?.name ?? this._lastTag ?? this.class,
        this.cl.classLevelTotal,
        true,
        "class",
      );
    }
    if (formulaBonus !== 0) {
      setSourceInfoByName(
        actor.sourceInfo,
        key,
        game.i18n.localize("PF1.CasterLevelBonusFormula"),
        formulaBonus,
        formulaBonus >= 0,
      );
    }
    if (energyDrain) {
      setSourceInfoByName(
        actor.sourceInfo,
        key,
        game.i18n.localize("PF1.NegativeLevels"),
        -Math.abs(energyDrain),
        false,
      );
    }
  }

  _calculateConcentration(rollData, changeBonus) {
    const actor = this.actor;
    const concFormula = this.concentration.formula || "";
    const formulaRoll = concFormula.length
      ? RollPF.safeRollSync(concFormula, rollData, undefined, undefined, { minimize: true })
      : { total: 0, isDeterministic: true, formula: "" };
    const formulaBonus = formulaRoll.isDeterministic ? formulaRoll.total : 0;
    const abilityMod = actor.system.abilities?.[this.ability]?.mod ?? 0;

    this.concentration.total = computeConcentration({
      clTotal: this.cl.total,
      abilityMod,
      formulaBonus,
    }) + (changeBonus || 0);

    const setSourceInfoByName = pf1.documents.actor.changes.setSourceInfoByName;
    const key = `flags.pf1-psionics.manifesters.${this.tag}.concentration.total`;
    setSourceInfoByName(actor.sourceInfo, key, game.i18n.localize("PF1.CasterLevel"), this.cl.total, false);
    setSourceInfoByName(actor.sourceInfo, key, game.i18n.localize("PF1.SpellcastingAbility"), abilityMod, false);
    setSourceInfoByName(
      actor.sourceInfo,
      key,
      game.i18n.localize("PF1.ByBonus"),
      formulaRoll.isDeterministic ? formulaRoll.total : formulaRoll.formula,
      false,
    );
  }

  _calculatePowerPoints(rollData) {
    const actor = this.actor;
    const formula = this.powerPoints.formula || "";
    const formulaRoll = formula.length
      ? RollPF.safeRollSync(formula, rollData, undefined, undefined, { minimize: true })
      : { total: 0, isDeterministic: true };
    const formulaBonus = formulaRoll.isDeterministic ? formulaRoll.total : 0;
    const abilityMod = actor.system.abilities?.[this.ability]?.mod ?? 0;

    this.powerPoints.max = computePowerPoints({
      autoLevel: this.autoLevelPowerPoints,
      casterType: this.casterType,
      classLevel: this.cl.classLevelTotal ?? 0,
      abilityMod,
      formulaBonus,
    });
  }
}
