import { MODULE_ID } from "../_module.mjs";
import { migrateAllItems } from "./helpers.mjs";

/**
 * Migration for version 0.4.2
 * Fixes the broken 0.4.1 item migration
 * - Properly migrates power items from "manifestor" to "manifester"
 */
export async function migrateToVersion042() {
	console.log(`${MODULE_ID} | Running migration to 0.4.2 (fixing power items)`);

	await migrateAllItems(migratePowerItem, "power items to v0.4.2");

	console.log(`${MODULE_ID} | Migration to 0.4.2 complete`);
}

/**
 * Migrates a single power item to v0.4.2 schema
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

	// Skip if no old field exists (already migrated)
	if (oldManifestor === undefined) {
		return false;
	}

	console.log(`${MODULE_ID} | Migrating power item "${item.name}" manifestor -> manifester (value: "${oldManifestor}")`);

	// Update: copy old field to new field name and remove old field
	await item.update({
		"system.manifester": oldManifestor,
		"system.-=manifestor": null // Remove old field
	});

	return true;
}
