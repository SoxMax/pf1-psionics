import { MODULE_ID } from "../_module.mjs";
import { migrateAllActors, migrateAllItems } from "./helpers.mjs";

/**
 * Migration for version 0.8.2
 * Normalizes legacy "medium" casterType / progression values to "med" so they
 * match the rest of the codebase (UI dropdown, lookup table, level-cap logic).
 *
 * Background: the POINTS_PER_LEVEL lookup table previously used the key
 * "medium" while every other consumer used "med". The table was renamed to
 * "med" in 0.8.2; this migration rewrites any stored "medium" values so that
 * existing worlds continue to resolve to the same row of the table.
 */
export async function migrateToVersion082() {
  console.log(`${MODULE_ID} | Running migration to 0.8.2`);

  await migrateAllActors(migrateActorManifesters, "actor manifesters to v0.8.2");
  await migrateAllItems("class", migrateClassProgression, "class items to v0.8.2");

  console.log(`${MODULE_ID} | Migration to 0.8.2 complete`);
}

/**
 * Rewrite any manifester slot's casterType from "medium" to "med".
 * @param {Actor} actor
 * @returns {Promise<boolean>} - True if the actor was modified
 */
async function migrateActorManifesters(actor) {
  const manifesters = actor._source.flags?.[MODULE_ID]?.manifesters;
  if (!manifesters) return false;

  const updates = {};
  for (const [bookId, book] of Object.entries(manifesters)) {
    if (book?.casterType === "medium") {
      updates[`flags.${MODULE_ID}.manifesters.${bookId}.casterType`] = "med";
    }
  }

  if (Object.keys(updates).length === 0) return false;

  console.log(`${MODULE_ID} | Normalizing casterType "medium" → "med" on actor "${actor.name}"`);
  await actor.update(updates);
  return true;
}

/**
 * Rewrite a class item's system.manifesting.progression from "medium" to "med".
 * @param {Item} item
 * @returns {Promise<boolean>} - True if the item was modified
 */
async function migrateClassProgression(item) {
  if (item._source.system?.manifesting?.progression !== "medium") return false;

  console.log(`${MODULE_ID} | Normalizing progression "medium" → "med" on class "${item.name}"`);
  await item.update({ "system.manifesting.progression": "med" });
  return true;
}
