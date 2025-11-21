import { MODULE_ID } from "../_module.mjs";

/**
 * Checks if an actor is valid for migration.
 * A valid actor must be of type `character` or `npc` and have a `skills` property in its system data.
 *
 * @param {Object} actor - The actor to validate.
 * @returns {boolean} - Returns `true` if the actor is valid, otherwise `false`.
 */
export function isValidActor(actor) {
	return (actor.type === "character" || actor.type === "npc") && actor.system.skills;
}

/**
 * Adds a skill to an actor's skill list if it is missing.
 *
 * @param {Object} actor - The actor to update.
 * @param {string} skillKey - The key for the skill (e.g., `"kps"` or `"ahp"`).
 * @param {Object} skillData - The data for the skill, including:
 *   - `ability`: Associated ability score (e.g., `"int"`, `"wis"`).
 *   - `rank`: Initial rank (default is `0`).
 *   - `rt`: Whether the skill requires training (boolean).
 *   - `acp`: Whether the skill is affected by armor check penalties (boolean).
 *   - `background`: Whether the skill is a background skill (boolean).
 * @returns {Promise<boolean>} - Returns true if skill was added, false if it already existed.
 */
export async function addSkillIfMissing(actor, skillKey, skillData) {
	if (actor.system.skills[skillKey] === undefined) {
		await actor.update({
			system: {
				skills: {
					[skillKey]: skillData
				}
			}
		});
		console.log(`${MODULE_ID} | Added skill ${skillKey} to ${actor.name}`);
		return true;
	}
	return false;
}

/**
 * Safely adds a flag to an actor if it doesn't already exist.
 *
 * @param {Object} actor - The actor to update.
 * @param {string} flagKey - The flag key under pf1-psionics namespace.
 * @param {*} defaultValue - The default value to set if flag doesn't exist.
 * @returns {Promise<boolean>} - Returns true if flag was added, false if it already existed.
 */
export async function addFlagIfMissing(actor, flagKey, defaultValue) {
	if (!actor.getFlag(MODULE_ID, flagKey)) {
		await actor.setFlag(MODULE_ID, flagKey, defaultValue);
		console.log(`${MODULE_ID} | Added flag ${flagKey} to ${actor.name}`);
		return true;
	}
	return false;
}

/**
 * Migrates all actors in the world.
 *
 * @param {Function} migrateFn - The migration function to apply to each actor.
 * @param {string} description - Description of what's being migrated (for logging).
 */
export async function migrateAllActors(migrateFn, description = "actors") {
	console.log(`${MODULE_ID} | Migrating ${description}...`);

	let count = 0;
	let errors = 0;

	for (const actor of game.actors.contents) {
		if (!isValidActor(actor)) continue;

		try {
			const changed = await migrateFn(actor);
			if (changed) count++;
		} catch (error) {
			console.error(`${MODULE_ID} | Failed to migrate actor ${actor.name}:`, error);
			errors++;
		}
	}

	console.log(`${MODULE_ID} | Migrated ${count} ${description} (${errors} errors)`);
}

/**
 * Migrates all items of a specific type in the world, actor inventories, and compendia.
 *
 * @param {string} itemType - The item type to migrate (e.g., "pf1-psionics.power").
 * @param {Function} migrateFn - The migration function to apply to each item.
 * @param {string} description - Description of what's being migrated (for logging).
 */
export async function migrateAllItems(itemType, migrateFn, description = "items") {
	console.log(`${MODULE_ID} | Migrating ${description}...`);

	let count = 0;
	let errors = 0;

	// Migrate world items
	for (const item of game.items.contents) {
		if (item.type !== itemType) continue;

		try {
			const changed = await migrateFn(item);
			if (changed) count++;
		} catch (error) {
			console.error(`${MODULE_ID} | Failed to migrate item ${item.name}:`, error);
			errors++;
		}
	}

	// Migrate actor-owned items
	for (const actor of game.actors.contents) {
		for (const item of actor.items.contents) {
			if (item.type !== itemType) continue;

			try {
				const changed = await migrateFn(item);
				if (changed) count++;
			} catch (error) {
				console.error(`${MODULE_ID} | Failed to migrate actor item ${item.name}:`, error);
				errors++;
			}
		}
	}

	// Migrate compendium items
	for (const pack of game.packs) {
		if (pack.metadata.type !== "Item") continue;
		if (pack.metadata.packageName !== MODULE_ID) continue;

		try {
			const documents = await pack.getDocuments();
			for (const item of documents) {
				if (item.type !== itemType) continue;

				try {
					const changed = await migrateFn(item);
					if (changed) count++;
				} catch (error) {
					console.error(`${MODULE_ID} | Failed to migrate compendium item ${item.name}:`, error);
					errors++;
				}
			}
		} catch (error) {
			console.error(`${MODULE_ID} | Failed to migrate compendium ${pack.metadata.name}:`, error);
			errors++;
		}
	}

	console.log(`${MODULE_ID} | Migrated ${count} ${description} (${errors} errors)`);
}
