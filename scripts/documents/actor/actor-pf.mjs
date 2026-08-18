import {MODULE_ID} from "../../_module.mjs";
import {ACTIVE_ENERGY_FLAG, POWER_POINTS_FLAG, PSIONIC_FOCUS_FLAG} from "../../data/powerpoints.mjs";
import {getCollection, invalidateCollection, onUpdateActor} from "./manifester-store.mjs";

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
  const raw = actor.getFlag(MODULE_ID, "manifesters");
  if (!raw || Object.keys(raw).length === 0) return;
  // Skip derivation if any record still has legacy schema (class stored as
  // {itemId} object rather than a tag string). The v0.10.0 migration runs
  // in the ready hook; failing silently keeps world load clean until then.
  for (const manifester of Object.values(raw)) {
    if (manifester?.class && typeof manifester.class !== "string") return;
  }

  // Rebuild the collection fresh from current _source each prep cycle.
  // The `updateActor` hook (which invalidates the cache) fires AFTER
  // `pf1PrepareDerivedActorData`, so a cache hit here would hand back
  // model instances hydrated from the PREVIOUS source — deriving stale
  // CL/PP/concentration on the cycle triggered by the change itself.
  // Invalidate first so prep always sees the just-committed values; the
  // cache then only serves cheap between-prep reads (sheet render, API).
  invalidateCollection(actor);
  const collection = getCollection(actor);
  const rollData = actor.getRollData({refresh: true});
  for (const [tag, manifester] of Object.entries(collection.manifesters)) {
    manifester.prepareData();
    manifester._prepareDependentData();

    // Seed per-manifester context fields the model relies on.
    rollData.class = (tag === "_hd" || !tag)
      ? {level: manifester.cl.classLevelTotal}
      : rollData.classes?.[tag];
    rollData.cl = manifester.cl.classLevelTotal;
    rollData.ablMod = actor.system.abilities?.[manifester.ability]?.mod ?? 0;

    manifester.finalizeData(rollData);

    delete rollData.class;
    delete rollData.cl;
    delete rollData.ablMod;
  }

  deriveTotalPowerPoints(actor, collection);
  deriveTotalFocus(actor);
}

function pf1ActorRest(actor, _options, _updateData, _itemUpdates) {
  rechargePowerPoints(actor);
  rechargeFocus(actor);
}

function deriveTotalPowerPoints(actor, collection) {
  const powerPoints = actor.getFlag(MODULE_ID, "powerPoints") ?? POWER_POINTS_FLAG;
  const baseMax = Object.values(collection.manifesters).reduce(
    (sum, m) => sum + (m.powerPoints?.max ?? 0), 0);
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
      async function(wrapped, manifesterId, options = {}) {
        if (await _isPsionicRoll(options)) {
          return rollPsionicConcentration.call(this, manifesterId, options);
        }
        return wrapped(manifesterId, options);
      }, "MIXED");

  libWrapper.register(MODULE_ID, "pf1.documents.actor.ActorPF.prototype.rollCL",
      async function(wrapped, manifesterId, options = {}) {
        if (await _isPsionicRoll(options)) {
          return rollPsionicCL.call(this, manifesterId, options);
        }
        return wrapped(manifesterId, options);
      }, "MIXED");
}

async function rollPsionicConcentration(manifesterTag, options = {}) {
  const collection = getCollection(this);
  const manifester = collection.manifesters[manifesterTag];
  if (!manifester) return;
  const rollData = options.rollData ?? this.getRollData();
  rollData.cl = manifester.cl.total;
  rollData.mod = this.system.abilities[manifester.ability]?.mod ?? 0;

  if (
      Hooks.call("actorRoll", "pf1PreActorRollConcentration", undefined, this, "concentration", manifesterTag, options) ===
      false
  )
    return;

  const parts = [];
  const describePart = (value, label) => parts.push(`${value}[${label}]`);
  const srcDetails = (s) => s?.reverse().forEach((d) => describePart(d.value, d.name, -10));
  srcDetails(this.getSourceDetails(`flags.${MODULE_ID}.manifesters.${manifesterTag}.concentration.total`));

  const notes = await this.getContextNotesParsed(`spell.concentration.${manifesterTag}`, { rollData });

  const wT = this.getWoundThresholdData();
  if (wT.valid) notes.push({ text: game.i18n.localize(pf1.config.woundThresholdConditions[wT.level]) });

  const props = [];
  if (notes.length > 0) props.push({ header: game.i18n.localize("PF1.Notes"), value: notes });

  const token = options.token ?? this.token;

  const rollOptions = {
    ...options,
    parts,
    rollData,
    subject: { core: "concentration", spellbook: manifesterTag },
    flavor: game.i18n.localize("PF1.ConcentrationCheck"),
    chatTemplateData: { properties: props },
    speaker: ChatMessage.implementation.getSpeaker({ actor: this, token }),
  };
  if (Hooks.call("pf1PreActorRollConcentration", this, rollOptions, manifesterTag) === false) return;
  const result = await pf1.dice.d20Roll(rollOptions);
  Hooks.callAll("pf1ActorRollConcentration", this, result, manifesterTag);
  return result;
}

async function rollPsionicCL(manifesterTag, options = {}) {
  const collection = getCollection(this);
  const manifester = collection.manifesters[manifesterTag];
  if (!manifester) return;
  const rollData = options.rollData ?? this.getRollData();
  rollData.cl = manifester.cl.total;

  const parts = [];

  const sources = this.getSourceDetails(`flags.${MODULE_ID}.manifesters.${manifesterTag}.cl.total`);
  for (const src of sources.reverse()) {
    if (src.id === "woundThreshold") {
      const wt = manifester.cl.woundPenalty || 0;
      if (wt) parts.push(`${wt}[${src.name}]`);
      continue;
    }
    parts.push(`${src.value}[${src.name}]`);
  }

  const notes = await this.getContextNotesParsed(`spell.cl.${manifesterTag}`, { rollData });

  const wT = this.getWoundThresholdData();
  if (wT.valid) notes.push({ text: pf1.config.woundThresholdConditions[wT.level] });

  const props = [];
  if (notes.length) props.push({ header: game.i18n.localize("PF1.Notes"), value: notes });

  const token = options.token ?? this.token;

  const rollOptions = {
    ...options,
    parts,
    rollData,
    subject: { core: "cl", spellbook: manifesterTag },
    flavor: game.i18n.localize("PF1.CasterLevelCheck"),
    chatTemplateData: { properties: props },
    speaker: ChatMessage.implementation.getSpeaker({ actor: this, token }),
  };
  if (Hooks.call("pf1PreActorRollCl", this, rollOptions, manifesterTag) === false) return;
  const result = await pf1.dice.d20Roll(rollOptions);
  Hooks.callAll("pf1ActorRollCl", this, result, manifesterTag);
  return result;
}

Hooks.on("preCreateActor", onPreCreateActor);
Hooks.on("pf1PrepareBaseActorData", pf1PrepareBaseActorData);
Hooks.on("pf1PrepareDerivedActorData", pf1PrepareDerivedActorData);
Hooks.on("pf1ActorRest", pf1ActorRest);
Hooks.on("updateActor", onUpdateActor);

Hooks.once("libWrapper.Ready", injectActorPF);
