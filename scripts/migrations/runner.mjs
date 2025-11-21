import { MODULE_ID } from "../_module.mjs";
import { getMigrationsToRun } from "./registry.mjs";

/**
 * Key used to store the schema version in game settings
 */
export const SCHEMA_VERSION_KEY = "schemaVersion";

/**
 * Gets the current module version from the manifest
 * @returns {string} The current module version
 */
export function getCurrentModuleVersion() {
	return game.modules.get(MODULE_ID).version;
}

/**
 * Gets the stored schema version from settings
 * @returns {string} The last successfully applied migration version, or "0.0.0" if none
 */
export function getStoredSchemaVersion() {
	return game.settings.get(MODULE_ID, SCHEMA_VERSION_KEY) || "0.0.0";
}

/**
 * Sets the stored schema version in settings
 * @param {string} version - The version to store
 */
export async function setStoredSchemaVersion(version) {
	await game.settings.set(MODULE_ID, SCHEMA_VERSION_KEY, version);
	console.log(`${MODULE_ID} | Schema version updated to ${version}`);
}

/**
 * Main migration runner
 * Compares the stored schema version to the current module version
 * and runs any migrations in between.
 *
 * Only runs if the current user is the active GM.
 *
 * @returns {Promise<boolean>} True if migrations were run, false if skipped
 */
export async function runMigrations() {
	// Only the active GM should run migrations
	if (game.users.activeGM !== game.user) {
		console.log(`${MODULE_ID} | Skipping migrations (not active GM)`);
		return false;
	}

	const storedVersion = getStoredSchemaVersion();
	const currentVersion = getCurrentModuleVersion();

	console.log(`${MODULE_ID} | Checking migrations: stored=${storedVersion}, current=${currentVersion}`);

	// Check if we need to run any migrations
	if (!foundry.utils.isNewerVersion(currentVersion, storedVersion)) {
		console.log(`${MODULE_ID} | No migrations needed`);
		return false;
	}

	// Get migrations to run
	const migrations = getMigrationsToRun(storedVersion, currentVersion);

	if (migrations.length === 0) {
		console.log(`${MODULE_ID} | No migrations found between ${storedVersion} and ${currentVersion}`);
		// Update version anyway to prevent future checks
		await setStoredSchemaVersion(currentVersion);
		return false;
	}

	// Notify user
	ui.notifications.info(`${MODULE_ID} | Running ${migrations.length} migration(s)...`);
	console.log(`${MODULE_ID} | Running ${migrations.length} migration(s) from ${storedVersion} to ${currentVersion}`);

	// Run each migration
	let lastSuccessfulVersion = storedVersion;
	let failedMigrations = 0;

	for (const { version, migrate } of migrations) {
		console.log(`${MODULE_ID} | Running migration to ${version}...`);

		try {
			await migrate();
			lastSuccessfulVersion = version;
			console.log(`${MODULE_ID} | Migration to ${version} completed successfully`);
		} catch (error) {
			console.error(`${MODULE_ID} | Migration to ${version} failed:`, error);
			ui.notifications.error(`${MODULE_ID} | Migration to ${version} failed. Check console for details.`);
			failedMigrations++;

			// Stop running migrations on first failure
			break;
		}
	}

	// Update stored version to the last successful migration
	if (lastSuccessfulVersion !== storedVersion) {
		await setStoredSchemaVersion(lastSuccessfulVersion);
	}

	// Final notification
	if (failedMigrations === 0) {
		ui.notifications.info(`${MODULE_ID} | Migrations complete!`);
		console.log(`${MODULE_ID} | All migrations completed successfully`);
		return true;
	} else {
		ui.notifications.warn(`${MODULE_ID} | Some migrations failed. Check console for details.`);
		console.warn(`${MODULE_ID} | ${failedMigrations} migration(s) failed`);
		return false;
	}
}
