import { MODULE_ID } from "../_module.mjs";
import { PowerSheet } from "../applications/_module.mjs";
import { PowerModel } from "../dataModels/_module.mjs";
import { PowerItem } from "../documents/_module.mjs";

/**
 * Mapping of psionic disciplines to their equivalent spell schools
 * for Psionics-Magic Transparency.
 *
 * @type {Object<string, string|null>}
 */
const DISCIPLINE_TO_SCHOOL = {
  athanatism: "nec",
  clairsentience: "div",
  metacreativity: "con",
  psychokinesis: "evo",
  psychometabolism: "trs",
  psychoportation: null, // No spell school equivalent
  telepathy: "enc"
};

export function initHook() {
  registerSettings();
  registerConfig();
  registerItems();
  console.log(`${MODULE_ID} | Initialized`);
}

/**
 * Registers module settings.
 * This includes the schema version used for data migrations.
 *
 * @returns {void}
 */
function registerSettings() {
  // Register schema version setting for migrations
  game.settings.register(MODULE_ID, "schemaVersion", {
    name: "Schema Version",
    hint: "Internal setting used to track data migrations. Do not modify manually.",
    scope: "world",
    config: false,
    type: String,
    default: "0.0.0"
  });
}

/**
 * Registers configuration settings and item types for the module.
 * This includes adding new skills, power types, save types, and feat subtypes.
 * It also sets up the sheet sections for powers and psionic disciplines.
 *
 * @returns {void}
 */
function registerConfig() {

  // Extend pf1 configurations

  // Skills
  pf1.config.skills["ahp"] = "PF1-Psionics.Skills.ahp"; // Autohypnosis
  pf1.config.skillCompendiumEntries["ahp"] = "Compendium.pf1-psionics.rules.JournalEntry.GAyvdoGBfVM0oTpr.JournalEntryPage.UJB7wMetxEFQLbBY";
  pf1.config.skills["kps"] = "PF1-Psionics.Skills.kps"; // Knowledge (Psionics)
  pf1.config.skillCompendiumEntries["kps"] = "Compendium.pf1-psionics.rules.JournalEntry.GAyvdoGBfVM0oTpr.JournalEntryPage.5ZCSm0ReOpkRoSxj";
  // Traits
  pf1.config.traitTypes.psionic = "PF1-Psionics.Trait.Psionic";
  // Creature Traits
  pf1.config.creatureSubtypes.psionic = "PF1-Psionics.CreatureSubTypes.Psionic";

  // Psionic specific configurations

  // Initialize psionics config namespace
  pf1.config.psionics = {};

  // Add Psionic Disciplines to config
  pf1.config.psionics.disciplines = {
    athanatism: "PF1-Psionics.Discipline.Athanatism",
    clairsentience: "PF1-Psionics.Discipline.Clairsentience",
    metacreativity: "PF1-Psionics.Discipline.Metacreativity",
    psychokinesis: "PF1-Psionics.Discipline.Psychokinesis",
    psychometabolism: "PF1-Psionics.Discipline.Psychometabolism",
    psychoportation: "PF1-Psionics.Discipline.Psychoportation",
    telepathy: "PF1-Psionics.Discipline.Telepathy",
  };

  pf1.config.psionics.subdisciplines = {
    charm: "PF1.SpellSubschools.charm",
    compulsion: "PF1.SpellSubschools.compulsion",
    creation: "PF1.SpellSubschools.creation",
    healing: "PF1.SpellSubschools.healing",
    scrying: "PF1.SpellSubschools.scrying",
  };

  pf1.config.psionics.subdisciplineMap = {
    athanatism: [],
    clairsentience: ["scrying"],
    metacreativity: ["creation"],
    psychokinesis: [],
    psychometabolism: ["healing"],
    psychoportation: [],
    telepathy: ["charm", "compulsion"],
    misc: Object.keys(pf1.config.psionics.subdisciplines),
  };

  // Add Levels to config
  pf1.config.psionics.powerLevels = {
    1: "PF1-Psionics.Powers.Levels.1",
    2: "PF1-Psionics.Powers.Levels.2",
    3: "PF1-Psionics.Powers.Levels.3",
    4: "PF1-Psionics.Powers.Levels.4",
    5: "PF1-Psionics.Powers.Levels.5",
    6: "PF1-Psionics.Powers.Levels.6",
    7: "PF1-Psionics.Powers.Levels.7",
    8: "PF1-Psionics.Powers.Levels.8",
    9: "PF1-Psionics.Powers.Levels.9",
  };

  const baseActorFilters = () => ({ actor: { exclude: ["haunt", "vehicle", "trap"] } });

  pf1.config.buffTargetCategories.psionics = {
    label: "PF1-Psionics.TabName",
    filters: { ...baseActorFilters() },
  };

  pf1.config.buffTargets[`${MODULE_ID}.focus`] = {
    label: "PF1-Psionics.Focus.Singular",
    category: "psionics",
    sort: 260000,
    filters: { ...baseActorFilters() },
  };

  pf1.config.buffTargets[`${MODULE_ID}.powerPoints`] = {
    label: "PF1-Psionics.PowerPoints.Singular",
    category: "psionics",
    sort: 261000,
    filters: { ...baseActorFilters() },
  };

  // Discipline DC and CL bonuses for Psionics-Magic Transparency
  for (const disciplineKey of Object.keys(pf1.config.psionics.disciplines)) {
    // Capitalize first letter for localization key
    const disciplineName = disciplineKey.charAt(0).toUpperCase() + disciplineKey.slice(1);

    pf1.config.buffTargets[`${MODULE_ID}.discipline.${disciplineKey}.dc`] = {
      label: `PF1-Psionics.Discipline.DC.${disciplineName}`,
      category: "psionics",
      sort: 262000,
      filters: { ...baseActorFilters() },
    };

    pf1.config.buffTargets[`${MODULE_ID}.discipline.${disciplineKey}.cl`] = {
      label: `PF1-Psionics.Discipline.CL.${disciplineName}`,
      category: "psionics",
      sort: 263000,
      filters: { ...baseActorFilters() },
    };
  }

}

/**
 * Registers new item types and their corresponding sheets for the module.
 * This includes adding the Power item type and its associated sheet.
 *
 * @returns {void}
 */
function registerItems() {
  // Register new item type
  Object.assign(CONFIG.Item.documentClasses, {
    [`${MODULE_ID}.power`]: PowerItem,
  });

  Object.assign(pf1.documents.item, {
    [`${MODULE_ID}.power`]: PowerItem,
  });

  Object.assign(CONFIG.Item.dataModels, {
    [`${MODULE_ID}.power`]: PowerModel,
  });

  DocumentSheetConfig.registerSheet(Item, MODULE_ID, PowerSheet, {
    types: [`${MODULE_ID}.power`],
    makeDefault: true,
  });
}

// Map custom psionics buff targets to concrete actor data paths
// These paths point to the maximum values; using maximum avoids refilling current values each refresh.
Hooks.on("pf1GetChangeFlat", (result, target, _modifierType, _value, _actor) => {
  switch (target){
    case `${MODULE_ID}.powerPoints`:
      result.push(`flags.${MODULE_ID}.powerPoints.maximum`);
      break;
    case `${MODULE_ID}.focus`:
      result.push(`flags.${MODULE_ID}.focus.maximum`);
      break;
  }

  // Map discipline buff targets to spell school paths for Psionics-Magic Transparency
  const disciplineMatch = target.match(/^pf1-psionics\.discipline\.(\w+)\.(dc|cl)$/);
  if (disciplineMatch) {
    const [, discipline, stat] = disciplineMatch;
    const schoolKey = DISCIPLINE_TO_SCHOOL[discipline];

    // Psychoportation has no school equivalent
    if (!schoolKey) return;

    // Map to the equivalent school path
    result.push(`system.attributes.spells.school.${schoolKey}.${stat}`);
  }
});
