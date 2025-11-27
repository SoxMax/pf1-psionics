import { MODULE_ID } from "../_module.mjs";
import { migrateAllActors, migrateAllItems } from "./helpers.mjs";

/**
 * Migration for version 0.4.1
 * Renames manifestor/manifestors to manifester/manifesters
 * - Renames actor flag from "manifestors" to "manifesters"
 * - Updates power items to use "manifester" instead of "manifestor"
 */
export async function migrateToVersion041() {
	console.log(`${MODULE_ID} | Running migration to 0.4.1`);

	await migrateAllActors(migrateActor, "actors to v0.4.1");
	await migrateAllItems(migratePowerItem, "power items to v0.4.1");

	console.log(`${MODULE_ID} | Migration to 0.4.1 complete`);
}

/**
 * Migrates a single actor to v0.4.1 schema
 * Renames the "manifestors" flag to "manifesters"
 * @param {Actor} actor - The actor to migrate
 * @returns {Promise<boolean>} - True if actor was modified
 */
async function migrateActor(actor) {
	const oldManifestors = actor.getFlag(MODULE_ID, "manifestors");

	// Skip if already migrated (has manifesters flag) or no old flag
	if (!oldManifestors || actor.getFlag(MODULE_ID, "manifesters")) {
		return false;
	}

	console.log(`${MODULE_ID} | Migrating actor "${actor.name}" manifestors -> manifesters`);

	// Copy old flag to new name
	await actor.setFlag(MODULE_ID, "manifesters", oldManifestors);

	// Remove old flag
	await actor.unsetFlag(MODULE_ID, "manifestors");

	return true;
}

/**
 * Migrates a single power item to v0.4.1 schema
 * Renames "manifestor" field to "manifester"
 * @param {Item} item - The item to migrate
 * @returns {Promise<boolean>} - True if item was modified
 */
async function migratePowerItem(item) {
	// Only migrate power items
	if (item.type !== `${MODULE_ID}.power`) {
		return false;
	}

	const oldManifestor = item.system.manifestor;

	// Skip if already migrated or no old field
	if (oldManifestor === undefined || item.system.manifester !== undefined) {
		return false;
	}

	console.log(`${MODULE_ID} | Migrating power item "${item.name}" manifestor -> manifester`);

	// Update the field name
	await item.update({
		"system.manifester": oldManifestor,
		"system.-=manifestor": null // Remove old field
	});

	return true;
}
