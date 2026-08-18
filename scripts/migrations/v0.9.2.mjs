import { MODULE_ID } from "../_module.mjs";
import { migrateAllActors } from "./helpers.mjs";

/**
 * Skill keys added by this module, mapped to the i18n key holding their name.
 */
const PSIONIC_SKILLS = {
  kps: "PF1-Psionics.Skills.kps",
  ahp: "PF1-Psionics.Skills.ahp",
};

/**
 * Migration for version 0.9.2
 * Backfills the `name` property on the psionic skills (kps, ahp) added by
 * earlier versions of the v0.3.1 migration, which created them without a name.
 * Without a name the PF1 sheet renders the skill row with a blank label.
 */
export async function migrateToVersion092() {
  console.log(`${MODULE_ID} | Running migration to 0.9.2`);

  await migrateAllActors(migrateActorSkillNames, "actor skill names to v0.9.2");

  console.log(`${MODULE_ID} | Migration to 0.9.2 complete`);
}

/**
 * Sets the localized name on any psionic skill that is missing one.
 * @param {Actor} actor - The actor to migrate
 * @returns {Promise<boolean>} - True if the actor was modified
 */
async function migrateActorSkillNames(actor) {
  const skills = actor._source.system?.skills ?? {};
  const updates = buildSkillNameUpdates(skills);

  if (Object.keys(updates).length === 0) return false;

  console.log(`${MODULE_ID} | Backfilling psionic skill names on actor "${actor.name}"`);
  await actor.update(updates);
  return true;
}

/**
 * Builds the update object for psionic skills that exist but have no name.
 *
 * @param {Object} skills - The actor's source `system.skills` object.
 * @returns {Object} - Flattened update object (may be empty).
 */
function buildSkillNameUpdates(skills) {
  const updates = {};

  for (const [skillKey, i18nKey] of Object.entries(PSIONIC_SKILLS)) {
    const skill = skills?.[skillKey];
    if (!skill) continue;
    if (skill.name) continue;

    updates[`system.skills.${skillKey}.name`] = game.i18n.localize(i18nKey);
  }

  return updates;
}
