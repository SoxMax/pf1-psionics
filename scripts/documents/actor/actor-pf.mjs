import {MODULE_ID} from "../../_module.mjs";
import {POINTS_PER_LEVEL, POWER_POINTS_FLAG, PSIONIC_FOCUS_FLAG} from "../../data/powerpoints.mjs";
import {MANIFESTORS} from "../../data/manifestors.mjs";
import {SpellRanges} from "./utils/manifestor.mjs";

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

  const psionicsFlags = {
    [`flags.${MODULE_ID}`]: {
      manifestors: MANIFESTORS,
      powerPoints: POWER_POINTS_FLAG,
      focus: PSIONIC_FOCUS_FLAG,
    },
  };
  // Can't use setFlag here
  document.updateSource(psionicsFlags);
}

export function pf1PrepareBaseActorData(_actor) {
}

export function pf1PrepareDerivedActorData(actor) {
  if (actor.getFlag(MODULE_ID, "manifestors")) {
    deriveManifestorsInfo(actor);
    deriveTotalPowerPoints(actor);
    deriveTotalFocus(actor);
  }
}

export function pf1ActorRest(actor, _options, _updateData, _itemUpdates) {
  rechargePowerPoints(actor);
  rechargeFocus(actor);
}

function deriveManifestorsInfo(actor) {
  const rollData = actor.getRollData({refresh: true});
  const manifestors = actor.getFlag(MODULE_ID, "manifestors");
  for (const [bookId, manifestor] of Object.entries(manifestors)) {
    deriveManifestorInfo(actor, rollData, bookId, manifestor);
    delete rollData.class;
    delete rollData.classLevel;
    delete rollData.cl;
    delete rollData.sl;
    delete rollData.ablMod;
  }
}

function deriveManifestorInfo(actor, rollData, bookId, book) {
  book.label = getBookLabel(actor, bookId, book);
  // Stop calculating data for unused books
  if (!book.inUse) return;

  // Ensure class info is available
  if (book.class === "_hd") rollData.class = {level: rollData.attributes.hd?.total};
  else rollData.class = rollData.classes?.[book.class];
  rollData.cl = book.cl?.total ?? 0;

  calculateCasterLevel(actor, rollData, bookId, book);
  calculateConcentration(actor, rollData, bookId, book);
  calculatePowerPoints(actor, rollData, bookId, book);

  // Set manifestor ranges
  book.range = new SpellRanges(book.cl.total);
}

function getBookLabel(actor, bookId, book) {
  // If the player has defined a a name, use that
  if (book.name) {
    return book.name;
  }
  // If the book has a class associated use that
  if (book.class) {
    if (book.class === "_hd") {
      return game.i18n.localize("PF1-Psionics.Manifestors.Spelllike");
    } else {
      const bookClassId = actor.classes[book.class]?._id;
      const bookClass = actor.items.get(bookClassId);
      if (bookClass) {
        return bookClass.name;
      }
    }
  }

  // Fall back to using the book id as the label
  return game.i18n.localize(`PF1.SpellBook${bookId.capitalize()}`);
}

function calculateCasterLevel(actor, rollData, bookId, book) {
  let clTotal = 0;
  const key = `flags.${MODULE_ID}.manifestors.${bookId}.cl.total`;
  const formula = book.cl.formula || "0";
  let classLevelTotal = 0;

  // Set source info function
  const setSourceInfoByName = pf1.documents.actor.changes.setSourceInfoByName;
  // Add NPC base
  if (actor.type === "npc") {
    const value = book.cl.base || 0;
    classLevelTotal += value;
    clTotal += value;
    setSourceInfoByName(actor.sourceInfo, key, game.i18n.localize("PF1.Base"), value);
  }
  // Add HD
  if (book.class === "_hd") {
    const value = actor.system.attributes.hd.total;
    classLevelTotal += value;
    clTotal += value;
    setSourceInfoByName(actor.sourceInfo, key, game.i18n.localize("PF1.HitDie"), value);
  }
  // Add class levels
  else if (book.class && rollData.class) {
    const value = rollData.class?.unlevel || 0;
    classLevelTotal += value;
    clTotal += value;

    setSourceInfoByName(actor.sourceInfo, key, actor.classes[book.class]?.name, value, true, "class");
  }
  book.cl.classLevelTotal = classLevelTotal;

  // Add from bonus formula
  const clBonus = RollPF.safeRollSync(formula, rollData).total;
  clTotal += clBonus;
  if (clBonus > 0) {
    setSourceInfoByName(actor.sourceInfo, key, game.i18n.localize("PF1.CasterLevelBonusFormula"), clBonus);
  } else if (clBonus < 0) {
    setSourceInfoByName(actor.sourceInfo, key, game.i18n.localize("PF1.CasterLevelBonusFormula"), clBonus, false);
  }

  // Apply negative levels
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
  // Bonus formula
  const concFormula = book.concentration.formula;
  const formulaRoll = concFormula.length
      ? RollPF.safeRollSync(concFormula, rollData, undefined, undefined, {minimize: true})
      : {total: 0, isDeterministic: true};
  const rollBonus = formulaRoll.isDeterministic ? formulaRoll.total : 0;

  // Add it all up
  const clTotal = book.cl.total;
  const classAbilityMod = actor.system.abilities[book.ability]?.mod ?? 0;
  const concentration = clTotal + classAbilityMod + rollBonus;
  book.concentration.total ||= 0; // Init

  // Set source info function
  const setSourceInfoByName = pf1.documents.actor.changes.setSourceInfoByName;
  const key = `flags.${MODULE_ID}.manifestors.${bookId}.concentration.total`;
  setSourceInfoByName(
      actor.sourceInfo,
      key,
      game.i18n.localize("PF1.CasterLevel"),
      clTotal,
      false,
  );
  setSourceInfoByName(
      actor.sourceInfo,
      key,
      game.i18n.localize("PF1.SpellcastingAbility"),
      classAbilityMod,
      false,
  );
  setSourceInfoByName(
      actor.sourceInfo,
      key,
      game.i18n.localize("PF1.ByBonus"),
      formulaRoll.isDeterministic ? formulaRoll.total : formulaRoll.formula,
      false,
  );

  // Apply value
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
  const manifestors = actor.getFlag(MODULE_ID, "manifestors") ?? {};
  // Preserve any bonus already applied to maximum via buffs; recompute base then add existing bonus difference
  const baseMax = Object.values(manifestors).
      filter((manifestor) => manifestor.inUse).
      reduce((sum, manifestor) => sum + (manifestor.powerPoints?.max ?? 0), 0);
  // If buffs have modified maximum, keep the modified value by not overwriting when existingMax > baseMax
  powerPoints.maximum = (powerPoints.maximum || 0) + baseMax;
}

function deriveTotalFocus(actor) {
  const focus = actor.getFlag(MODULE_ID, "focus") ?? PSIONIC_FOCUS_FLAG;
  const maxPowerPoints = actor.getFlag(MODULE_ID, "powerPoints")?.maximum ?? 0;
  const baseFocus = maxPowerPoints > 0 ? 1 : 0;
  focus.maximum = (focus.maximum || 0) + baseFocus;
}

async function rechargePowerPoints(actor) {
  const powerPoints = actor.getFlag(MODULE_ID, "powerPoints");
  await actor.update({
    [`flags.${MODULE_ID}.powerPoints.current`]: powerPoints.maximum,
    [`flags.${MODULE_ID}.powerPoints.temporary`]: 0,
  });
}

async function rechargeFocus(actor) {
  const focus = actor.getFlag(MODULE_ID, "focus");
  await actor.update({
    [`flags.${MODULE_ID}.focus.current`]: focus.maximum,
  });
}

async function _isPsionicRoll(options) {
      // 1. Checking options flag
  return options.isPsionic
      // 2. If we have an item, check its type
      || options.item?.type === `${MODULE_ID}.power`
      // 3. If no item but we have a message reference (from chat button), retrieve the item
      || await fromUuid(options.reference)?.itemSource?.type === `${MODULE_ID}.power`;
}

export function injectActorPF() {
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

async function rollPsionicConcentration(manifestorId, options = {}) {
  const manifestor = this.getFlag(MODULE_ID, "manifestors")?.[manifestorId];
  const rollData = options.rollData ?? this.getRollData();
  rollData.cl = manifestor.cl.total;
  rollData.mod = this.system.abilities[manifestor.ability]?.mod ?? 0;

  if (
      Hooks.call("actorRoll", "pf1PreActorRollConcentration", undefined, this, "concentration", manifestorId, options) ===
      false
  )
    return;

  // Set up roll parts
  const parts = [];

  const describePart = (value, label) => parts.push(`${value}[${label}]`);
  const srcDetails = (s) => s?.reverse().forEach((d) => describePart(d.value, d.name, -10));
  srcDetails(this.getSourceDetails(`flags.${MODULE_ID}.manifestors.${manifestorId}.concentration.total`));

  // Add contextual concentration string
  const notes = await this.getContextNotesParsed(`spell.concentration.${manifestorId}`, { rollData });

  // Wound Threshold penalty
  const wT = this.getWoundThresholdData();
  if (wT.valid) notes.push({ text: game.i18n.localize(pf1.config.woundThresholdConditions[wT.level]) });
  // TODO: Make the penalty show separate of the CL.total.

  const props = [];
  if (notes.length > 0) props.push({ header: game.i18n.localize("PF1.Notes"), value: notes });

  const token = options.token ?? this.token;

  const rollOptions = {
    ...options,
    parts,
    rollData,
    subject: { core: "concentration", spellbook: manifestorId },
    flavor: game.i18n.localize("PF1.ConcentrationCheck"),
    chatTemplateData: { properties: props },
    speaker: ChatMessage.implementation.getSpeaker({ actor: this, token }),
  };
  if (Hooks.call("pf1PreActorRollConcentration", this, rollOptions, manifestorId) === false) return;
  const result = await pf1.dice.d20Roll(rollOptions);
  Hooks.callAll("pf1ActorRollConcentration", this, result, manifestorId);
  return result;
}

async function rollPsionicCL(manifestorId, options = {}) {
  const manifestor = this.getFlag(MODULE_ID, "manifestors")?.[manifestorId];
  const rollData = options.rollData ?? this.getRollData();
  rollData.cl = manifestor.cl.total;

  // Set up roll parts
  const parts = [];

  const sources = this.getSourceDetails(`flags.${MODULE_ID}.manifestors.${manifestorId}.cl.total`);
  for (const src of sources.reverse()) {
    if (src.id === "woundThreshold") {
      // Adjust WT part to how much WT actually adjusted CL, to account for minimum CL
      const wt = manifestor.cl.woundPenalty || 0;
      if (wt) parts.push(`${wt}[${src.name}]`);
      continue;
    }
    parts.push(`${src.value}[${src.name}]`);
  }

  // Add contextual caster level string
  const notes = await this.getContextNotesParsed(`spell.cl.${manifestorId}`, { rollData });

  // Wound Threshold penalty
  const wT = this.getWoundThresholdData();
  if (wT.valid) notes.push({ text: pf1.config.woundThresholdConditions[wT.level] });

  const props = [];
  if (notes.length) props.push({ header: game.i18n.localize("PF1.Notes"), value: notes });

  const token = options.token ?? this.token;

  const rollOptions = {
    ...options,
    parts,
    rollData,
    subject: { core: "cl", spellbook: manifestorId },
    flavor: game.i18n.localize("PF1.CasterLevelCheck"),
    chatTemplateData: { properties: props },
    speaker: ChatMessage.implementation.getSpeaker({ actor: this, token }),
  };
  if (Hooks.call("pf1PreActorRollCl", this, rollOptions, manifestorId) === false) return;
  const result = await pf1.dice.d20Roll(rollOptions);
  Hooks.callAll("pf1ActorRollCl", this, result, manifestorId);
  return result;
}
