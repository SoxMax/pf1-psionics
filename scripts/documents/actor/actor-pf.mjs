import {MODULE_ID} from "../../_module.mjs";
import {ACTIVE_ENERGY_FLAG, POINTS_PER_LEVEL, POWER_POINTS_FLAG, PSIONIC_FOCUS_FLAG} from "../../data/powerpoints.mjs";
import {SpellRanges} from "./utils/manifester.mjs";

export function onPreCreateActor(document, _data, _options, _userId) {
  if (!["character", "npc"].includes(document.type)) return;
  // Knowledge (Psionics)
  document.updateSource({
    system: {
      skills: {
        kps: {
          ability: "int",
          rank: 0,
          rt: true,
          acp: false,
          background: true,
        },
      },
    },
  });
  // Autohypnosis
  document.updateSource({
    system: {
      skills: {
        ahp: {
          ability: "wis",
          rt: false,
          rank: 0,
          acp: false,
          background: true,
        },
      },
    },
  });

  // Seed actor-global psionic pools. Manifester records are NOT seeded;
  // they are created on demand when a manifesting class is added or when
  // the user explicitly adds one via the sheet UI.
  document.updateSource({
    [`flags.${MODULE_ID}`]: {
      powerPoints: POWER_POINTS_FLAG,
      focus: PSIONIC_FOCUS_FLAG,
      activeEnergy: ACTIVE_ENERGY_FLAG,
    },
  });
}

function pf1PrepareBaseActorData(_actor) {
}

function pf1PrepareDerivedActorData(actor) {
  const manifesters = actor.getFlag(MODULE_ID, "manifesters");
  if (!manifesters || Object.keys(manifesters).length === 0) return;
  // Skip derivation if any record still has legacy schema (class stored as
  // string tag rather than {itemId} object). The v0.10.0 migration runs in
  // the ready hook; until then the consumer below would throw trying to set
  // book.class.name on a string. Failing silently keeps world load clean.
  for (const book of Object.values(manifesters)) {
    if (book?.class != null && typeof book.class !== "object") return;
  }
  deriveManifestersInfo(actor);
  deriveTotalPowerPoints(actor);
  deriveTotalFocus(actor);
}

function pf1ActorRest(actor, _options, _updateData, _itemUpdates) {
  rechargePowerPoints(actor);
  rechargeFocus(actor);
}

function deriveManifestersInfo(actor) {
  const rollData = actor.getRollData({refresh: true});
  const manifesters = actor.getFlag(MODULE_ID, "manifesters") ?? {};
  for (const [bookId, manifester] of Object.entries(manifesters)) {
    deriveManifesterInfo(actor, rollData, bookId, manifester);
    delete rollData.class;
    delete rollData.classLevel;
    delete rollData.cl;
    delete rollData.sl;
    delete rollData.ablMod;
  }
}

function deriveManifesterInfo(actor, rollData, bookId, book) {
  resolveClassFields(actor, book);

  rollData.class = book.class.itemId
    ? (book.class.tag ? rollData.classes?.[book.class.tag] : undefined)
    : {level: book.class.level};
  rollData.cl = book.cl?.total ?? 0;

  calculateCasterLevel(actor, rollData, bookId, book);
  calculateConcentration(actor, rollData, bookId, book);
  calculatePowerPoints(actor, rollData, bookId, book);

  book.range = new SpellRanges(book.cl.total);
}

function resolveClassFields(actor, book) {
  // Populate derived fields on book.class: name, tag, level. Stored field
  // (book.class.itemId) is NOT mutated. itemId null → HD-based (psi-like).
  if (!book.class.itemId) {
    book.class.name = game.i18n.localize("PF1-Psionics.Manifesters.Spelllike");
    book.class.tag = "_hd";
    book.class.level = actor.system.attributes.hd?.total ?? 0;
    return;
  }
  const cls = actor.items.get(book.class.itemId);
  if (cls) {
    book.class.name = cls.name;
    book.class.tag = cls.system.tag;
    book.class.level = cls.system.level ?? 0;
  } else {
    book.class.name = book.name || game.i18n.localize("PF1-Psionics.UnknownClass");
    book.class.tag = book._lastTag ?? null;
    book.class.level = 0;
  }
}

function calculateCasterLevel(actor, rollData, bookId, book) {
  let clTotal = 0;
  const key = `flags.${MODULE_ID}.manifesters.${bookId}.cl.total`;
  const formula = book.cl.formula || "0";
  let classLevelTotal = 0;

  const setSourceInfoByName = pf1.documents.actor.changes.setSourceInfoByName;
  // NPC base
  if (actor.type === "npc") {
    const value = book.cl.base || 0;
    classLevelTotal += value;
    clTotal += value;
    setSourceInfoByName(actor.sourceInfo, key, game.i18n.localize("PF1.Base"), value);
  }
  // Class/HD level contribution (collapsed branches)
  if (book.class.itemId) {
    const value = rollData.class?.unlevel ?? book.class.level ?? 0;
    classLevelTotal += value;
    clTotal += value;
    setSourceInfoByName(actor.sourceInfo, key, book.class.name, value, true, "class");
  } else {
    const value = book.class.level;
    classLevelTotal += value;
    clTotal += value;
    setSourceInfoByName(actor.sourceInfo, key, game.i18n.localize("PF1.HitDie"), value);
  }
  book.cl.classLevelTotal = classLevelTotal;

  const clBonus = RollPF.safeRollSync(formula, rollData).total;
  clTotal += clBonus;
  if (clBonus > 0) {
    setSourceInfoByName(actor.sourceInfo, key, game.i18n.localize("PF1.CasterLevelBonusFormula"), clBonus);
  } else if (clBonus < 0) {
    setSourceInfoByName(actor.sourceInfo, key, game.i18n.localize("PF1.CasterLevelBonusFormula"), clBonus, false);
  }

  if (rollData.attributes.energyDrain) {
    clTotal = Math.max(0, clTotal - rollData.attributes.energyDrain);
    setSourceInfoByName(
        actor.sourceInfo,
        key,
        game.i18n.localize("PF1.NegativeLevels"),
        -Math.abs(rollData.attributes.energyDrain),
        false,
    );
  }

  clTotal += book.cl.total ?? 0;
  clTotal += book.cl.bonus ?? 0;
  book.cl.total = clTotal;
}

function calculateConcentration(actor, rollData, bookId, book) {
  const concFormula = book.concentration.formula;
  const formulaRoll = concFormula.length
      ? RollPF.safeRollSync(concFormula, rollData, undefined, undefined, {minimize: true})
      : {total: 0, isDeterministic: true};
  const rollBonus = formulaRoll.isDeterministic ? formulaRoll.total : 0;

  const clTotal = book.cl.total;
  const classAbilityMod = actor.system.abilities[book.ability]?.mod ?? 0;
  const concentration = clTotal + classAbilityMod + rollBonus;
  book.concentration.total ||= 0;

  const setSourceInfoByName = pf1.documents.actor.changes.setSourceInfoByName;
  const key = `flags.${MODULE_ID}.manifesters.${bookId}.concentration.total`;
  setSourceInfoByName(actor.sourceInfo, key, game.i18n.localize("PF1.CasterLevel"), clTotal, false);
  setSourceInfoByName(actor.sourceInfo, key, game.i18n.localize("PF1.SpellcastingAbility"), classAbilityMod, false);
  setSourceInfoByName(actor.sourceInfo, key, game.i18n.localize("PF1.ByBonus"),
      formulaRoll.isDeterministic ? formulaRoll.total : formulaRoll.formula, false);

  book.concentration.total += concentration;
}

function calculatePowerPoints(actor, rollData, bookId, book) {
  const formula = book.powerPoints.formula;
  const formulaRoll = formula.length
      ? RollPF.safeRollSync(formula, rollData, undefined, undefined, {minimize: true})
      : {total: 0, isDeterministic: true};
  const formulaBonus = formulaRoll.isDeterministic ? formulaRoll.total : 0;

  if (book.autoLevelPowerPoints) {
    const classAbilityMod = actor.system.abilities[book.ability]?.mod ?? 0;
    const classLevel = book.cl.classLevelTotal ?? 0;
    const levelPoints = POINTS_PER_LEVEL[book.casterType][classLevel] || 0;
    const abilityPoints = Math.max(0, Math.floor(classLevel * classAbilityMod * 0.5));
    book.powerPoints.max = formulaBonus + levelPoints + abilityPoints;
  } else {
    book.powerPoints.max = formulaBonus;
  }
}

function deriveTotalPowerPoints(actor) {
  const powerPoints = actor.getFlag(MODULE_ID, "powerPoints") ?? POWER_POINTS_FLAG;
  const manifesters = actor.getFlag(MODULE_ID, "manifesters") ?? {};
  const baseMax = Object.values(manifesters).reduce(
      (sum, manifester) => sum + (manifester.powerPoints?.max ?? 0), 0);
  powerPoints.maximum = (powerPoints.maximum || 0) + baseMax;
}

function deriveTotalFocus(actor) {
  const focus = actor.getFlag(MODULE_ID, "focus") ?? PSIONIC_FOCUS_FLAG;
  const maxPowerPoints = actor.getFlag(MODULE_ID, "powerPoints")?.maximum ?? 0;
  const baseFocus = maxPowerPoints > 0 ? 1 : 0;
  focus.maximum = (focus.maximum || 0) + baseFocus;
}

async function rechargePowerPoints(actor) {
  await actor.psionics?.powerPoints?.restore();
}

async function rechargeFocus(actor) {
  await actor.psionics?.focus?.restore();
}

async function _isPsionicRoll(options) {
  return options.isPsionic
      || options.item?.type === `${MODULE_ID}.power`
      || await fromUuid(options.reference)?.itemSource?.type === `${MODULE_ID}.power`;
}

function injectActorPF() {
  libWrapper.register(MODULE_ID, "pf1.documents.actor.ActorPF.prototype.rollConcentration",
      async function(wrapped, bookId, options = {}) {
        if (await _isPsionicRoll(options)) {
          return rollPsionicConcentration.call(this, bookId, options);
        }
        return wrapped(bookId, options);
      }, "MIXED");

  libWrapper.register(MODULE_ID, "pf1.documents.actor.ActorPF.prototype.rollCL",
      async function(wrapped, bookId, options = {}) {
        if (await _isPsionicRoll(options)) {
          return rollPsionicCL.call(this, bookId, options);
        }
        return wrapped(bookId, options);
      }, "MIXED");
}

async function rollPsionicConcentration(manifesterId, options = {}) {
  const manifester = this.getFlag(MODULE_ID, "manifesters")?.[manifesterId];
  const rollData = options.rollData ?? this.getRollData();
  rollData.cl = manifester.cl.total;
  rollData.mod = this.system.abilities[manifester.ability]?.mod ?? 0;

  if (
      Hooks.call("actorRoll", "pf1PreActorRollConcentration", undefined, this, "concentration", manifesterId, options) ===
      false
  )
    return;

  const parts = [];
  const describePart = (value, label) => parts.push(`${value}[${label}]`);
  const srcDetails = (s) => s?.reverse().forEach((d) => describePart(d.value, d.name, -10));
  srcDetails(this.getSourceDetails(`flags.${MODULE_ID}.manifesters.${manifesterId}.concentration.total`));

  const notes = await this.getContextNotesParsed(`spell.concentration.${manifesterId}`, { rollData });

  const wT = this.getWoundThresholdData();
  if (wT.valid) notes.push({ text: game.i18n.localize(pf1.config.woundThresholdConditions[wT.level]) });

  const props = [];
  if (notes.length > 0) props.push({ header: game.i18n.localize("PF1.Notes"), value: notes });

  const token = options.token ?? this.token;

  const rollOptions = {
    ...options,
    parts,
    rollData,
    subject: { core: "concentration", spellbook: manifesterId },
    flavor: game.i18n.localize("PF1.ConcentrationCheck"),
    chatTemplateData: { properties: props },
    speaker: ChatMessage.implementation.getSpeaker({ actor: this, token }),
  };
  if (Hooks.call("pf1PreActorRollConcentration", this, rollOptions, manifesterId) === false) return;
  const result = await pf1.dice.d20Roll(rollOptions);
  Hooks.callAll("pf1ActorRollConcentration", this, result, manifesterId);
  return result;
}

async function rollPsionicCL(manifesterId, options = {}) {
  const manifester = this.getFlag(MODULE_ID, "manifesters")?.[manifesterId];
  const rollData = options.rollData ?? this.getRollData();
  rollData.cl = manifester.cl.total;

  const parts = [];

  const sources = this.getSourceDetails(`flags.${MODULE_ID}.manifesters.${manifesterId}.cl.total`);
  for (const src of sources.reverse()) {
    if (src.id === "woundThreshold") {
      const wt = manifester.cl.woundPenalty || 0;
      if (wt) parts.push(`${wt}[${src.name}]`);
      continue;
    }
    parts.push(`${src.value}[${src.name}]`);
  }

  const notes = await this.getContextNotesParsed(`spell.cl.${manifesterId}`, { rollData });

  const wT = this.getWoundThresholdData();
  if (wT.valid) notes.push({ text: pf1.config.woundThresholdConditions[wT.level] });

  const props = [];
  if (notes.length) props.push({ header: game.i18n.localize("PF1.Notes"), value: notes });

  const token = options.token ?? this.token;

  const rollOptions = {
    ...options,
    parts,
    rollData,
    subject: { core: "cl", spellbook: manifesterId },
    flavor: game.i18n.localize("PF1.CasterLevelCheck"),
    chatTemplateData: { properties: props },
    speaker: ChatMessage.implementation.getSpeaker({ actor: this, token }),
  };
  if (Hooks.call("pf1PreActorRollCl", this, rollOptions, manifesterId) === false) return;
  const result = await pf1.dice.d20Roll(rollOptions);
  Hooks.callAll("pf1ActorRollCl", this, result, manifesterId);
  return result;
}

Hooks.on("preCreateActor", onPreCreateActor);
Hooks.on("pf1PrepareBaseActorData", pf1PrepareBaseActorData);
Hooks.on("pf1PrepareDerivedActorData", pf1PrepareDerivedActorData);
Hooks.on("pf1ActorRest", pf1ActorRest);

Hooks.once("libWrapper.Ready", injectActorPF);
