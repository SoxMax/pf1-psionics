import { migrateToVersion031 } from "./v0.3.1.mjs";
import { migrateToVersion041 } from "./v0.4.1.mjs";

/**
 * Registry of all migration functions mapped to their target version.
 *
 * When adding a new migration:
 * 1. Create a new file: vX.Y.Z.mjs
 * 2. Export a function: migrateToVersionXYZ()
 * 3. Import and add it to this registry
 *
 * Migrations will be executed in version order (sorted by semantic version).
 */
export const MIGRATIONS = {
	"0.3.1": migrateToVersion031,
	"0.4.1": migrateToVersion041,
	// Add new migrations here as needed
	// "1.0.0": migrateToVersion100,
};

/**
 * Get all migration versions in sorted order
 * @returns {string[]} Array of version strings sorted semantically
 */
export function getMigrationVersions() {
	return Object.keys(MIGRATIONS).sort((a, b) => {
		return foundry.utils.isNewerVersion(a, b) ? 1 : -1;
	});
}

/**
 * Get migrations that need to run between two versions
 * @param {string} fromVersion - Starting version (exclusive)
 * @param {string} toVersion - Target version (inclusive)
 * @returns {Array<{version: string, migrate: Function}>} Array of migrations to run
 */
export function getMigrationsToRun(fromVersion, toVersion) {
	const versions = getMigrationVersions();
	const migrations = [];

	for (const version of versions) {
		// Skip if this version is not newer than fromVersion
		if (!foundry.utils.isNewerVersion(version, fromVersion)) {
			continue;
		}

		// Stop if this version is newer than toVersion
		if (foundry.utils.isNewerVersion(version, toVersion)) {
			break;
		}

		migrations.push({
			version,
			migrate: MIGRATIONS[version]
		});
	}

	return migrations;
}
