import { migrateToVersion0_3_1 } from "./v0.3.1.mjs";
import { migrateToVersion0_5_0 } from "./v0.5.0.mjs";
import { migrateToVersion0_7_0 } from "./v0.7.0.mjs";
import { migrateToVersion0_8_2 } from "./v0.8.2.mjs";
import { migrateToVersion0_10_0 } from "./v0.10.0.mjs";

/**
 * Registry of all migration functions mapped to their target version.
 *
 * When adding a new migration:
 * 1. Create a new file: vX.Y.Z.mjs
 * 2. Export a function: migrateToVersionX_Y_Z()
 * 3. Import and add it to this registry
 *
 * Migrations will be executed in version order (sorted by semantic version).
 *
 * Note: Some migrations have both eager (here) and lazy (DataModel.migrateData) variants
 * for belt-and-suspenders data safety. Example: v0.7.0 augments migration.
 */
export const MIGRATIONS = {
	"0.3.1": migrateToVersion0_3_1,
	"0.5.0": migrateToVersion0_5_0,
	"0.7.0": migrateToVersion0_7_0,
	"0.8.2": migrateToVersion0_8_2,
	"0.10.0": migrateToVersion0_10_0,
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
