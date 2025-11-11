import {MODULE_ID} from "../_module.mjs";
import {PowerSheet} from "../applications/_module.mjs";
import {PowerModel} from "../dataModels/_module.mjs";
import {PowerItem} from "../documents/_module.mjs";

export function initHook() {
  registerConfig();
  registerItems();
  console.log(`${MODULE_ID} | Initialized`);
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
  pf1.config.skills["kps"] = "PF1-Psionics.Skills.kps"; // Knowledge (Psionics)
  pf1.config.skills["ahp"] = "PF1-Psionics.Skills.ahp"; // Autohypnosis
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
