import { MODULE_ID } from "../_module.mjs";
import { MANIFESTORS } from "../data/manifestors.mjs";
import { addSkillIfMissing, addFlagIfMissing, migrateAllActors } from "./helpers.mjs";

/**
 * Migration for version 0.3.1
 * Ensures all actors have:
 * - Knowledge (Psionics) skill
 * - Autohypnosis skill
 * - manifestors flag
 * - powerPoints flag
 * - focus flag
 */
export async function migrateToVersion031() {
	console.log(`${MODULE_ID} | Running migration to 0.3.1`);

	await migrateAllActors(migrateActor, "actors to v0.3.1");

	console.log(`${MODULE_ID} | Migration to 0.3.1 complete`);
}

/**
 * Migrates a single actor to v0.3.1 schema
 * @param {Actor} actor - The actor to migrate
 * @returns {Promise<boolean>} - True if actor was modified
 */
async function migrateActor(actor) {
	let modified = false;

	// Add Knowledge (Psionics) skill
	const kpsAdded = await addSkillIfMissing(actor, "kps", {
		ability: "int",
		rank: 0,
		rt: true,
		acp: false,
		background: true,
	});

	// Add Autohypnosis skill
	const ahpAdded = await addSkillIfMissing(actor, "ahp", {
		ability: "wis",
		rank: 0,
		rt: true,
		acp: false,
		background: true,
	});

	// Add manifestors flag
	const manifestorsAdded = await addFlagIfMissing(actor, "manifestors", MANIFESTORS);

	// Add powerPoints flag
	const powerPointsAdded = await addFlagIfMissing(actor, "powerPoints", {
		current: 0,
		temporary: 0,
    maximum: 0
	});

	// Add focus flag
	const focusAdded = await addFlagIfMissing(actor, "focus", {
		current: 0,
    maximum: 0
	});

	modified = kpsAdded || ahpAdded || manifestorsAdded || powerPointsAdded || focusAdded;

	return modified;
}
