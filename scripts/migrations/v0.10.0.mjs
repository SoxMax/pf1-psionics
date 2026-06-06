import { MODULE_ID } from "../_module.mjs";
import { migrateAllActors, migrateAllItems } from "./helpers.mjs";

/**
 * Migration for version 0.10.0
 *
 * Converts the legacy fixed 4-slot manifester layout
 * (flags.pf1-psionics.manifesters = {primary, secondary, tertiary, spelllike})
 * into a dynamic dict keyed by random 16-char ids, dropping records whose
 * `inUse` was false. Powers' `system.manifester` is rewritten from the slot
 * key to the new id via an actor-scoped idMap stashed temporarily on each
 * actor during the migration window.
 *
 * Steps:
 * 1. For each actor: build idMap from old slot keys -> new ids, write a
 *    fresh manifesters dict, stash idMap at flags.pf1-psionics._v0_10_0_idMap.
 * 2. For each power on each actor: rewrite system.manifester via the idMap;
 *    if no mapping (slot was inUse:false), set to "".
 * 3. For each actor again: delete the temporary idMap flag.
 * 4. For each class item (world, actor-owned, module compendia): relocate
 *    system.manifesting -> flags.pf1-psionics.manifesting, then delete the
 *    system field. PF1 ClassModel does not declare manifesting; module-owned
 *    data belongs in the module flag namespace.
 *
 * Compendium-only power items are left alone (no actor context, value is
 * reset on drop). Class items in module compendia are relocated by step 4.
 * Idempotent: a second run finds no slot-keyed values or system.manifesting
 * blocks to convert.
 */
const LEGACY_SLOT_KEYS = new Set(["primary", "secondary", "tertiary", "spelllike"]);
const MANIFESTING_FIELDS = ["progression", "ability", "cantrips"];

export async function migrateToVersion0_10_0() {
  console.log(`${MODULE_ID} | Running migration to 0.10.0`);

  await migrateAllActors(rebuildManifesters, "actors to v0.10.0 (manifesters)");
  await migrateAllItems(`${MODULE_ID}.power`, rebindPower, "power items to v0.10.0 (manifester id)");
  await migrateAllActors(clearIdMap, "actors to v0.10.0 (cleanup)");
  await migrateAllItems("class", relocateClassManifesting, "class items to v0.10.0 (manifesting flag relocation)");

  console.log(`${MODULE_ID} | Migration to 0.10.0 complete`);
}

async function rebuildManifesters(actor) {
  const raw = actor._source?.flags?.[MODULE_ID]?.manifesters;
  if (!raw) return false;

  const oldEntries = Object.entries(raw).filter(([k]) => LEGACY_SLOT_KEYS.has(k));
  if (oldEntries.length === 0) return false; // already migrated

  const idMap = {};
  const newDict = {};

  for (const [oldKey, oldBook] of oldEntries) {
    if (!oldBook?.inUse) continue;
    const id = foundry.utils.randomID(16);

    let classItemId = null;
    let source = "manual";
    let _lastTag = null;
    const tag = oldBook.class;

    if (tag && tag !== "_hd") {
      const classItem = actor.items.find(
        (i) => i.type === "class" && i.system?.tag === tag,
      );
      if (classItem) {
        classItemId = classItem.id;
        source = "class";
      } else {
        _lastTag = tag;
      }
    }

    const record = {
      id,
      source,
      class: {itemId: classItemId},
      name: oldBook.name ?? "",
      casterType: oldBook.casterType ?? "high",
      cl: foundry.utils.deepClone(oldBook.cl ?? {formula: "", notes: ""}),
      concentration: foundry.utils.deepClone(oldBook.concentration ?? {formula: "", notes: ""}),
      ability: oldBook.ability ?? "int",
      autoLevelPowerPoints: oldBook.autoLevelPowerPoints ?? true,
      autoAttributePowerPoints: oldBook.autoAttributePowerPoints ?? true,
      autoMaxPowerLevel: oldBook.autoMaxPowerLevel ?? true,
      hasCantrips: oldBook.hasCantrips ?? true,
      spellPreparationMode: oldBook.spellPreparationMode ?? "spontaneous",
      baseDCFormula: oldBook.baseDCFormula ?? "10 + @sl + @ablMod",
      powerPoints: foundry.utils.deepClone(oldBook.powerPoints ?? {max: 0, formula: ""}),
    };
    if (_lastTag) record._lastTag = _lastTag;

    idMap[oldKey] = id;
    newDict[id] = record;
  }

  // Per-slot deletion + merge of new entries in a single update. Avoids
  // `-=manifesters` (which wipes the whole dict in the same update before the
  // merge applies, destroying any pre-existing non-legacy entries from
  // manual adds or partial prior migrations).
  const update = {
    [`flags.${MODULE_ID}.manifesters`]: newDict,
    [`flags.${MODULE_ID}._v0_10_0_idMap`]: idMap,
  };
  for (const slot of LEGACY_SLOT_KEYS) {
    update[`flags.${MODULE_ID}.manifesters.-=${slot}`] = null;
  }
  await actor.update(update);
  console.log(`${MODULE_ID} | Rebuilt manifesters for ${actor.name}: ${Object.keys(idMap).length} record(s)`);
  return true;
}

async function rebindPower(item) {
  const actor = item.parent;
  if (!actor) return false; // unowned/compendium items: leave value, gets reset on drop
  if (item.type !== `${MODULE_ID}.power`) return false;
  const oldValue = item._source?.system?.manifester;
  if (!oldValue || !LEGACY_SLOT_KEYS.has(oldValue)) return false;

  const idMap = actor.getFlag(MODULE_ID, "_v0_10_0_idMap") ?? {};
  const newId = idMap[oldValue] ?? "";
  await item.update({"system.manifester": newId});
  return true;
}

async function clearIdMap(actor) {
  if (actor.getFlag(MODULE_ID, "_v0_10_0_idMap") == null) return false;
  await actor.update({[`flags.${MODULE_ID}.-=_v0_10_0_idMap`]: null});
  return true;
}

/**
 * Copy a class item's system.manifesting block into flags.pf1-psionics.manifesting
 * and delete the system field. Only known fields (progression, ability, cantrips)
 * are forwarded; legacy unused fields (type, offset) are dropped.
 *
 * @param {Item} item
 * @returns {Promise<boolean>} true if the item was modified
 */
export async function relocateClassManifesting(item) {
  const legacy = item._source?.system?.manifesting;
  if (!legacy || typeof legacy !== "object") return false;

  const flagPayload = {};
  for (const key of MANIFESTING_FIELDS) {
    if (legacy[key] !== undefined) flagPayload[key] = legacy[key];
  }
  if (Object.keys(flagPayload).length === 0) {
    // Empty block: just strip it.
    await item.update({"system.-=manifesting": null});
    return true;
  }

  await item.update({
    [`flags.${MODULE_ID}.manifesting`]: flagPayload,
    "system.-=manifesting": null,
  });
  console.log(`${MODULE_ID} | Relocated manifesting flag on class "${item.name}"`);
  return true;
}
