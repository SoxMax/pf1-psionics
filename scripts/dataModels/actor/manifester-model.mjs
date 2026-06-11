import { SpellRanges } from "../../documents/actor/utils/manifester.mjs";
import {
  computeCasterLevel,
  computeConcentration,
  computePowerPoints,
} from "./manifester-calculations.mjs";
import { snapshotChangeBonuses } from "./manifester-resolve.mjs";

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
   *
   * NOTE: `cl.bonus` and `concentration.bonus` are NOT reset here. They
   * carry the change-system delta captured by
   * {@link _captureChangeBonuses} ahead of this method and must survive
   * into {@link finalizeData}.
   */
  prepareData() {
    this.cl ??= {};
    this.cl.total = 0;
    this.cl.class = 0;
    this.cl.bonus ??= 0;
    this.cl.classLevelTotal = 0;
    this.cl.woundPenalty = 0;

    this.concentration ??= {};
    this.concentration.total = 0;
    this.concentration.bonus ??= 0;

    this.powerPoints ??= {};
    // powerPoints.max gets overwritten in finalizeData; reset here.
    this.powerPoints.max = 0;
  }

  /**
   * Snapshot change-system writes off the raw flag dict into bonus fields.
   *
   * Must run BEFORE {@link prepareData} on each prep cycle. The PF1 change
   * system writes buff totals directly to
   * `flags.pf1-psionics.manifesters.<tag>.cl.total` / `.concentration.total`
   * (see `pf1GetChangeFlat` in hooks/init.mjs).
   *
   * Because `cl.total` / `concentration.total` are not in the schema, they
   * never round-trip to `actor._source`. Foundry resets `actor.flags` to
   * source at the start of each prep cycle, so by the time `applyChanges`
   * (which runs before our hook) writes the buff onto the raw flag, the
   * pre-existing value is 0 — meaning the raw value at hook entry is
   * exactly the buff delta. Capture it before prepareData zeros things out.
   */
  _captureChangeBonuses() {
    if (!this.actor) return;
    const raw = this.actor.flags?.["pf1-psionics"]?.manifesters?.[this.tag];
    const snap = snapshotChangeBonuses(raw);
    this.cl ??= {};
    this.concentration ??= {};
    this.cl.bonus = snap.cl;
    this.concentration.bonus = snap.concentration;
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
   * @param {object} rollData - Actor roll data. Caller is responsible for
   *   ensuring `rollData.class`, `rollData.cl`, `rollData.ablMod` are set
   *   for this manifester's context.
   */
  finalizeData(rollData) {
    if (!this.actor) return;
    this._calculateCasterLevel(rollData);
    this._calculateConcentration(rollData);
    this._calculatePowerPoints(rollData);
    this.range = new SpellRanges(this.cl.total);
  }

  _calculateCasterLevel(rollData) {
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
      changeBonus: this.cl.bonus,
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

  _calculateConcentration(rollData) {
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
    }) + (this.concentration.bonus || 0);

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
