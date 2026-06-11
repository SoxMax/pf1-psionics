// Inline literal to avoid pulling _module.mjs (and its pf1-global-using
// transitive imports) into vitest. `migrateAllItems` is dynamic-imported
// inside the runner function for the same reason — the pure rebuild
// helpers below stay free of Foundry-runtime dependencies and are
// directly unit-testable.
const MODULE_ID = "pf1-psionics";

/**
 * Migration for version 0.10.0
 *
 * Single-hop conversion of the legacy 4-slot manifester layout
 * (released as part of v0.9.1) to the tag-keyed TypedObjectField shape:
 *
 *   flags.pf1-psionics.manifesters = {
 *     primary:   { inUse, class: "psion", cl, concentration, ... },
 *     secondary: { inUse, ... },
 *     tertiary:  { inUse, ... },
 *     spelllike: { inUse, class: "_hd", ... },
 *   }
 *
 * becomes
 *
 *   flags.pf1-psionics.manifesters = {
 *     psion: { class: "psion", source: "class", cl, concentration, ... },
 *     _hd:   { class: "_hd",   source: "manual", ... },
 *   }
 *
 * Records whose slot was `inUse: false` are dropped — those slots were
 * intentionally disabled by the user. Presence in the dict now means
 * "active"; there's no `inUse` field anymore.
 *
 * Five passes (idMap pattern proven across prior migrations):
 *   A. For each actor: rebuild the dict, stash slot→tag idMap as temp flag.
 *   B. For each power: rebind system.manifester from slot key → tag via idMap.
 *   C. For each actor: drop the temp idMap flag.
 *   D. For each class item (world/owned/module compendia): relocate
 *      system.manifesting → flags.pf1-psionics.manifesting and strip
 *      legacy fields (type, offset). PF1 ClassModel does not declare
 *      manifesting; the data belongs in the module flag namespace.
 *   E. Unlinked scene tokens: apply Pass A to each token.delta.
 *
 * Idempotent: re-running on already-migrated data is a no-op (Pass A
 * sees no legacy slot keys; Pass D sees no system.manifesting; etc.).
 */

const LEGACY_SLOT_KEYS = new Set(["primary", "secondary", "tertiary", "spelllike"]);
const MANIFESTING_FIELDS = ["progression", "ability", "cantrips"];

/**
 * Fields copied verbatim from a legacy slot record to the new
 * tag-keyed record. `class` is set separately (replaced with tag).
 * `inUse` and `showConfig` are dropped (deprecated).
 */
const COPY_FIELDS = [
  "name",
  "casterType",
  "ability",
  "cl",
  "concentration",
  "powerPoints",
  "autoLevelPowerPoints",
  "autoAttributePowerPoints",
  "autoMaxPowerLevel",
  "hasCantrips",
  "spellPreparationMode",
  "baseDCFormula",
];

/**
 * Resolve the new tag for a legacy slot record.
 *
 * @param {object} book - legacy slot record.
 * @param {Array<{id?: string, system?: {tag?: string}, type?: string}>} classItems
 *   - actor's class items. Iterated to match `book.class` against `system.tag`.
 * @returns {{tag: string, source: "class" | "manual", lastTag: string | null}}
 */
export function resolveLegacyClass(book, classItems) {
  const cls = book?.class;
  if (!cls || cls === "_hd") {
    return { tag: "_hd", source: "manual", lastTag: null };
  }
  const matched = (classItems ?? []).find((c) => c?.system?.tag === cls);
  if (matched) {
    return { tag: cls, source: "class", lastTag: null };
  }
  // Class string set but no live class item on the actor — keep the tag
  // as the dict key, stash original for diagnostics, mark manual.
  return { tag: cls, source: "manual", lastTag: cls };
}

/**
 * Build one new tag-keyed record from one legacy slot record.
 *
 * @param {object} book - legacy record.
 * @param {string} classTag - the underlying class tag (or "_hd"). This is
 *   the value stored in `record.class` and used for class item linkage.
 *   Distinct from the dict key, which may be suffixed on tag clash.
 * @param {"class" | "manual"} source
 * @param {string | null} lastTag
 * @returns {object}
 */
export function buildTagRecord(book, classTag, source, lastTag) {
  const out = { class: classTag, source };
  for (const key of COPY_FIELDS) {
    if (book[key] !== undefined) out[key] = book[key];
  }
  // Sensible defaults for fields not present on the legacy record.
  out.casterType ??= "high";
  out.ability ??= "int";
  out.spellPreparationMode ??= "spontaneous";
  out.baseDCFormula ??= "10 + @sl + @ablMod";
  out.autoLevelPowerPoints ??= true;
  out.autoAttributePowerPoints ??= true;
  out.autoMaxPowerLevel ??= true;
  out.hasCantrips ??= true;
  out.cl ??= { formula: "", notes: "" };
  out.concentration ??= { formula: "", notes: "" };
  out.powerPoints ??= { max: 0, formula: "" };
  if (lastTag) out._lastTag = lastTag;
  return out;
}

/**
 * Rebuild one actor/token-delta's manifesters dict from slot-keyed to
 * tag-keyed. Returns null if nothing to convert (idempotent).
 *
 * @param {object} raw - legacy `flags.pf1-psionics.manifesters` dict.
 * @param {Array<{id?: string, system?: {tag?: string}, type?: string}>} classItems
 *   - actor's class items for tag resolution.
 * @returns {{newDict: object, idMap: object} | null}
 */
export function rebuildManifesters(raw, classItems) {
  if (!raw || typeof raw !== "object") return null;
  const legacyEntries = Object.entries(raw).filter(([k]) => LEGACY_SLOT_KEYS.has(k));
  if (legacyEntries.length === 0) return null;

  const newDict = {};
  const idMap = {};
  for (const [slotKey, book] of legacyEntries) {
    if (!book || typeof book !== "object") continue;
    if (!book.inUse) continue;

    const { tag: classTag, source, lastTag } = resolveLegacyClass(book, classItems);

    // Tag clash (two legacy slots resolving to the same class tag). The
    // dict key gets a suffix, but `record.class` keeps the real class tag
    // so reverse-lookups against actor class items still resolve.
    let dictKey = classTag;
    if (newDict[dictKey]) {
      let suffix = 2;
      while (newDict[`${classTag}-${suffix}`]) suffix++;
      dictKey = `${classTag}-${suffix}`;
      console.warn(
        `${MODULE_ID} | v0.10.0 tag clash on '${classTag}' (slot '${slotKey}'); stored under dict key '${dictKey}' (record.class stays '${classTag}').`,
      );
    }

    newDict[dictKey] = buildTagRecord(book, classTag, source, lastTag);
    idMap[slotKey] = dictKey;
  }
  return { newDict, idMap };
}

/**
 * Strip legacy `system.manifesting` from a class item and move
 * recognized fields under `flags.pf1-psionics.manifesting`. PF1
 * ClassModel does not declare a `manifesting` field; module data
 * belongs in the module flag namespace.
 *
 * @param {object} source - item._source.
 * @returns {{flagPayload: object, dropLegacy: boolean} | null}
 *   null = no legacy block present (idempotent).
 */
export function planClassRelocation(source) {
  const legacy = source?.system?.manifesting;
  if (!legacy || typeof legacy !== "object") return null;
  const flagPayload = {};
  for (const key of MANIFESTING_FIELDS) {
    if (legacy[key] !== undefined) flagPayload[key] = legacy[key];
  }
  return { flagPayload, dropLegacy: true };
}

export async function migrateToVersion0_10_0() {
  console.log(`${MODULE_ID} | Running migration to 0.10.0`);

  // Dynamic import — keeps the pure helpers above test-importable
  // without dragging in pf1-global-dependent transitive imports.
  const { migrateAllItems } = await import("./helpers.mjs");

  // Pass A: rebuild each world actor's manifesters dict.
  await _migrateActors();

  // Pass B: rebind powers' system.manifester via per-actor idMap.
  await migrateAllItems(`${MODULE_ID}.power`, _rebindPower, "power items to v0.10.0 (manifester tag)");

  // Pass C: clean up the temp idMap flag.
  for (const actor of game.actors.contents) {
    if (actor.getFlag(MODULE_ID, "_v0_10_0_idMap") != null) {
      await actor.update({ [`flags.${MODULE_ID}.-=_v0_10_0_idMap`]: null });
    }
  }

  // Pass D: relocate class items' system.manifesting → flag namespace.
  await migrateAllItems("class", _relocateClassManifesting, "class items to v0.10.0 (manifesting flag relocation)");

  // Pass E: unlinked scene tokens.
  await _migrateUnlinkedTokens();

  console.log(`${MODULE_ID} | Migration to 0.10.0 complete`);
}

async function _migrateActors() {
  let count = 0;
  for (const actor of game.actors.contents) {
    try {
      const changed = await _rebuildActorManifesters(actor);
      if (changed) count++;
    } catch (err) {
      console.error(`${MODULE_ID} | v0.10.0 actor rebuild failed for ${actor.name}:`, err);
    }
  }
  console.log(`${MODULE_ID} | v0.10.0 rebuilt manifesters on ${count} actor(s)`);
}

async function _rebuildActorManifesters(actor) {
  const raw = actor._source?.flags?.[MODULE_ID]?.manifesters;
  const classItems = actor.items.contents.filter((i) => i.type === "class");
  const rebuild = rebuildManifesters(raw, classItems);
  if (!rebuild) return false;

  // Per-slot deletion + merge in a single update. Avoids
  // `-=manifesters` (which would wipe the whole dict in the same update
  // before the merge applies, destroying any pre-existing non-legacy
  // entries).
  const update = {
    [`flags.${MODULE_ID}.manifesters`]: rebuild.newDict,
    [`flags.${MODULE_ID}._v0_10_0_idMap`]: rebuild.idMap,
  };
  for (const slot of LEGACY_SLOT_KEYS) {
    update[`flags.${MODULE_ID}.manifesters.-=${slot}`] = null;
  }
  await actor.update(update);
  console.log(
    `${MODULE_ID} | v0.10.0 rebuilt manifesters on ${actor.name}: ${Object.keys(rebuild.newDict).length} record(s)`,
  );
  return true;
}

async function _rebindPower(item) {
  const actor = item.parent;
  if (!actor) return false;
  if (item.type !== `${MODULE_ID}.power`) return false;
  const oldValue = item._source?.system?.manifester;
  if (!oldValue || !LEGACY_SLOT_KEYS.has(oldValue)) return false;
  const idMap = actor.getFlag(MODULE_ID, "_v0_10_0_idMap") ?? {};
  const newValue = idMap[oldValue] ?? "";
  await item.update({ "system.manifester": newValue });
  return true;
}

async function _relocateClassManifesting(item) {
  const plan = planClassRelocation(item._source);
  if (!plan) return false;
  const update = { "system.-=manifesting": null };
  if (Object.keys(plan.flagPayload).length > 0) {
    update[`flags.${MODULE_ID}.manifesting`] = plan.flagPayload;
  }
  await item.update(update);
  console.log(`${MODULE_ID} | v0.10.0 relocated manifesting flag on class "${item.name}"`);
  return true;
}

async function _migrateUnlinkedTokens() {
  let count = 0;
  for (const scene of game.scenes ?? []) {
    for (const token of scene.tokens ?? []) {
      if (token.actorLink) continue;
      try {
        const delta = token.delta;
        const raw = delta?._source?.flags?.[MODULE_ID]?.manifesters;
        if (!raw) continue;
        const tokenActor = token.actor;
        const classItems = tokenActor
          ? tokenActor.items.contents.filter((i) => i.type === "class")
          : [];
        const rebuild = rebuildManifesters(raw, classItems);
        if (!rebuild) continue;
        const update = { [`flags.${MODULE_ID}.manifesters`]: rebuild.newDict };
        for (const slot of LEGACY_SLOT_KEYS) {
          update[`flags.${MODULE_ID}.manifesters.-=${slot}`] = null;
        }
        await delta.update(update);
        count++;
      } catch (err) {
        console.error(
          `${MODULE_ID} | v0.10.0 token rebuild failed on scene "${scene?.name}" token "${token?.name}":`,
          err,
        );
      }
    }
  }
  if (count > 0) {
    console.log(`${MODULE_ID} | v0.10.0 rebuilt manifesters on ${count} unlinked token(s)`);
  }
}
