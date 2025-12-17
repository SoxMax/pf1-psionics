import { MODULE_ID } from "../_module.mjs";
import { migrateAllActors, migrateAllItems } from "./helpers.mjs";

/**
 * Migration for version 0.5.0
 * Renames manifestor/manifestors to manifester/manifesters
 * - Renames actor flag from "manifestors" to "manifesters"
 * - Updates power items to use "manifester" instead of "manifestor"
 */
export async function migrateToVersion050() {
  console.log(`${MODULE_ID} | Running migration to 0.5.0`);

  await migrateAllActors(migrateActor, "actors to v0.5.0");
  await migrateAllItems(`${MODULE_ID}.power`, migratePowerItem, "power items to v0.5.0");

  console.log(`${MODULE_ID} | Migration to 0.5.0 complete`);
}

/**
 * Migrates a single actor to v0.5.0 schema
 * Renames the "manifestors" flag to "manifesters"
 * @param {Actor} actor - The actor to migrate
 * @returns {Promise<boolean>} - True if actor was modified
 */
async function migrateActor(actor) {
  const oldManifestors = actor.getFlag(MODULE_ID, "manifestors");

  // Skip if already migrated (no old flag or already has new flag)
  if (!oldManifestors || actor.getFlag(MODULE_ID, "manifesters")) {
    return false;
  }

  console.log(`${MODULE_ID} | Migrating actor "${actor.name}" manifestors -> manifesters`);

  // Copy old flag to new name
  await actor.setFlag(MODULE_ID, "manifesters", oldManifestors);

  return true;
}

/**
 * Migrates a single power item to v0.5.0 schema
 * Renames "manifestor" field to "manifester"
 * @param {Item} item - The item to migrate
 * @returns {Promise<boolean>} - True if item was modified
 */
async function migratePowerItem(item) {
  // Only migrate power items
  if (item.type !== `${MODULE_ID}.power`) {
    return false;
  }

  // Check the raw source data for the old field name
  const oldManifestor = item._source.system?.manifestor;

  // Skip if no old field exists (already migrated or never had the field)
  if (oldManifestor === undefined) {
    return false;
  }

  console.log(`${MODULE_ID} | Migrating power item "${item.name}" manifestor -> manifester (value: ${oldManifestor})`);

  // Update: copy old field to new field name
  await item.update({
    "system.manifester": oldManifestor || "primary",
  });

  return true;
}

