import { MODULE_ID } from "../_module.mjs";
import { migrateAllActors } from "./helpers.mjs";

/**
 * Skill keys added by this module, mapped to the i18n key holding their name
 * and an English fallback used if localization is unavailable.
 */
const PSIONIC_SKILLS = {
  kps: { i18nKey: "PF1-Psionics.Skills.kps", fallback: "Knowledge (Psionics)" },
  ahp: { i18nKey: "PF1-Psionics.Skills.ahp", fallback: "Autohypnosis" },
};

/**
 * Migration for version 0.9.2
 * Backfills the `name` property on the psionic skills (kps, ahp) added by
 * earlier versions of the v0.3.1 migration, which created them without a name.
 *
 * While this module is enabled the label resolves via `pf1.config.skills`, so
 * the missing name is invisible. When the module is DISABLED that config entry
 * is gone and the skills — which remain in actor data — render as nameless,
 * unidentifiable rows on the character sheet. Storing the name on the actor is
 * the only thing that survives the module being turned off.
 *
 * Any name the user has customized is left untouched.
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

  for (const [skillKey, { i18nKey, fallback }] of Object.entries(PSIONIC_SKILLS)) {
    const skill = skills?.[skillKey];
    if (!skill) continue;
    if (skill.name) continue;

    // localize() returns the key itself when the translation is unavailable
    // (e.g. this module's lang file is not loaded); never store a raw key.
    const localized = game.i18n.localize(i18nKey);
    updates[`system.skills.${skillKey}.name`] = localized === i18nKey ? fallback : localized;
  }

  return updates;
}
