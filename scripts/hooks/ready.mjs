import { MODULE_ID } from "../_module.mjs";
import { MANIFESTORS } from "../data/manifestors.mjs";


export function readyHook() {
	console.log(`${MODULE_ID} | Ready`);
	if (game.users.activeGM === game.user)
		migrateOldActors();
}

/**
 * Migrates existing actors by adding missing skills (`kps` and `ahp`) to their skill list.
 * This ensures all actors have the required skills for the "Psionics" system.
 */

async function migrateOldActors() {
	console.log(`${MODULE_ID} | Migrating old actors`);
	game.actors.contents.forEach(async actor => {
		if (!isValidActor(actor)) return;
		addSkillIfMissing(actor, "kps", {
			ability: "int",
			rank: 0,
			rt: true,
			acp: false,
			background: true,
		});
		addSkillIfMissing(actor, "ahp", {
			ability: "wis",
			rank: 0,
			rt: true,
			acp: false,
			background: true,
		});

		if(!actor.getFlag(MODULE_ID, "manifestors")) {
			actor.setFlag(MODULE_ID, "manifestors", MANIFESTORS);
		}

		if(!actor.getFlag(MODULE_ID, "powerPoints")) {
			actor.setFlag(MODULE_ID, "powerPoints", { current: 0, temporary: 0 });
		}

		if(!actor.getFlag(MODULE_ID, "focus")) {
			actor.setFlag(MODULE_ID, "focus", { current: 0 });
		}
	});
}

/**
 * Checks if an actor is valid for migration.
 * A valid actor must be of type `character` or `npc` and have a `skills` property in its system data.
 *
 * @param {Object} actor - The actor to validate.
 * @returns {boolean} - Returns `true` if the actor is valid, otherwise `false`.
 */
function isValidActor(actor) {
	return (actor.type === "character" || actor.type === "npc") && actor.system.skills;
}

/**
 * Adds a skill to an actor's skill list if it is missing.
 *
 * @param {Object} actor - The actor to update.
 * @param {string} skillKey - The key for the skill (e.g., `"kps"` or `"ahp"`).
 * @param {Object} skillData - The data for the skill, including:
 *   - `name`: Localized name of the skill.
 *   - `ability`: Associated ability score (e.g., `"int"`, `"wis"`).
 *   - `rank`: Initial rank (default is `0`).
 *   - `rt`: Whether the skill is a class skill (boolean).
 *   - `acp`: Whether the skill is affected by armor check penalties (boolean).
 *   - `background`: Whether the skill is a background skill (boolean).
 */
function addSkillIfMissing(actor, skillKey, skillData) {
	if (actor.system.skills[skillKey] === undefined) {
		actor.update({
			system: {
				skills: {
					[skillKey]: skillData
				}
			}
		});
		console.log(`${MODULE_ID} | Added ${skillData.name} to ${actor.name}`);
	}
}
