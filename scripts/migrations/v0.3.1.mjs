import { MODULE_ID } from "../_module.mjs";
import { addFlagIfMissing, addSkillIfMissing, migrateAllActors } from "./helpers.mjs";
import { POWER_POINTS_FLAG, PSIONIC_FOCUS_FLAG } from "../data/powerpoints.mjs";

const LEGACY_MANIFESTER = {
	name: "", inUse: false, showConfig: false, casterType: "high", class: "",
	cl: { formula: "", notes: "" }, concentration: { formula: "", notes: "" },
	ability: "int", autoLevelPowerPoints: true, autoAttributePowerPoints: true,
	autoMaxPowerLevel: true, hasCantrips: true, spellPreparationMode: "spontaneous",
	baseDCFormula: "10 + @sl + @ablMod", powerPoints: { max: 0, formula: "" },
};
const LEGACY_MANIFESTERS = {
	primary: foundry.utils.deepClone(LEGACY_MANIFESTER),
	secondary: foundry.utils.deepClone(LEGACY_MANIFESTER),
	tertiary: foundry.utils.deepClone(LEGACY_MANIFESTER),
	spelllike: Object.assign(foundry.utils.deepClone(LEGACY_MANIFESTER), { class: "_hd", ability: "cha" }),
};

/**
 * Migration for version 0.3.1
 * Ensures all actors have:
 * - Knowledge (Psionics) skill
 * - Autohypnosis skill
 * - manifesters flag
 * - powerPoints flag
 * - focus flag
 */
export async function migrateToVersion0_3_1() {
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

	// Add manifesters flag
	const manifestersAdded = await addFlagIfMissing(actor, "manifesters", LEGACY_MANIFESTERS);

	// Add powerPoints flag
	const powerPointsAdded = await addFlagIfMissing(actor, "powerPoints", POWER_POINTS_FLAG);

	// Add focus flag
	const focusAdded = await addFlagIfMissing(actor, "focus", PSIONIC_FOCUS_FLAG);

	modified = kpsAdded || ahpAdded || manifestersAdded || powerPointsAdded || focusAdded;

	return modified;
}
