import { MODULE_ID } from "../_module.mjs";
import { PowerSheet } from "../applications/_module.mjs";
import { PowerModel } from "../dataModels/_module.mjs";
import { PowerItem } from "../documents/_module.mjs";
import { DISCIPLINE_TO_SCHOOL } from "../data/disciplines.mjs";

function initHook() {
  registerSettings();
  registerConfig();
  registerItems();

  // Enhance @Browse enricher (after all setup hooks have completed)
  enhanceBrowseEnricher();
  console.log(`${MODULE_ID} | Initialized`);
}

Hooks.once("init", initHook);

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
    default: "0.0.0",
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
    teleportation: "PF1.SpellSubschools.teleportation",
  };

  pf1.config.psionics.subdisciplineMap = {
    athanatism: [],
    clairsentience: ["scrying"],
    metacreativity: ["creation"],
    psychokinesis: [],
    psychometabolism: ["healing"],
    psychoportation: ["teleportation"],
    telepathy: ["charm", "compulsion"],
    misc: Object.keys(pf1.config.psionics.subdisciplines),
  };

  // Energy types for active energy type selection
  pf1.config.psionics.activeEnergyTypes = {
    cold: "PF1.DamageTypes.cold.Label",
    electricity: "PF1.DamageTypes.electricity.Label",
    fire: "PF1.DamageTypes.fire.Label",
    sonic: "PF1.DamageTypes.sonic.Label",
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

  // Psionic Resistance in Defense category (transparent with Spell Resistance)
  pf1.config.buffTargets[`${MODULE_ID}.psionicResistance`] = {
    label: "PF1-Psionics.PsionicResistance",
    category: "defense",
    sort: 0,
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

  // General psionic bonuses
  pf1.config.buffTargets[`${MODULE_ID}.concentration`] = {
    label: "PF1.Concentration",
    category: "psionics",
    sort: 261100,
    filters: { ...baseActorFilters() },
  };

  pf1.config.buffTargets[`${MODULE_ID}.manifesterLevel`] = {
    label: "PF1-Psionics.ManifesterLevel",
    category: "psionics",
    sort: 261200,
    filters: { ...baseActorFilters() },
  };

  pf1.config.buffTargets[`${MODULE_ID}.psionicDC`] = {
    label: "PF1-Psionics.PsionicDC",
    category: "psionics",
    sort: 261300,
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

  // Sheet sections configuration for compendium browser integration
  pf1.config.sheetSections.psionicPowers = {
    [`${MODULE_ID}.power`]: {
      browse: {
        category: "psionicPowers",
        level: true,
      },
    },
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

/**
 * Registers script call support for power items.
 * Powers should have the same script call categories as spells (use, postUse).
 * This hooks into the PF1 registry system to add the power item type to these categories.
 *
 * @returns {void}
 */
Hooks.on("pf1RegisterScriptCalls", (registry) => {
  // Add power item type to "use" category
  const useCategory = registry.get("use");
  if (useCategory && !useCategory.itemTypes.includes(`${MODULE_ID}.power`)) {
    useCategory.itemTypes.push(`${MODULE_ID}.power`);
  }

  // Add power item type to "postUse" category
  const postUseCategory = registry.get("postUse");
  if (postUseCategory && !postUseCategory.itemTypes.includes(`${MODULE_ID}.power`)) {
    postUseCategory.itemTypes.push(`${MODULE_ID}.power`);
  }
});

// Map custom psionics buff targets to concrete actor data paths
// These paths point to the maximum values; using maximum avoids refilling current values each refresh.
Hooks.on("pf1GetChangeFlat", (result, target, _modifierType, _value, _actor) => {
  switch (target) {
    case `${MODULE_ID}.powerPoints`:
      result.push(`flags.${MODULE_ID}.powerPoints.maximum`);
      break;
    case `${MODULE_ID}.focus`:
      result.push(`flags.${MODULE_ID}.focus.maximum`);
      break;
    case `${MODULE_ID}.concentration`:
      // Apply to both manifesters AND spellbooks for Psionics-Magic Transparency
      result.push(
        `flags.${MODULE_ID}.manifesters.primary.concentration.total`,
        `flags.${MODULE_ID}.manifesters.secondary.concentration.total`,
        `flags.${MODULE_ID}.manifesters.tertiary.concentration.total`,
        `flags.${MODULE_ID}.manifesters.spelllike.concentration.total`,
        "system.attributes.spells.spellbooks.primary.concentration.total",
        "system.attributes.spells.spellbooks.secondary.concentration.total",
        "system.attributes.spells.spellbooks.tertiary.concentration.total",
        "system.attributes.spells.spellbooks.spelllike.concentration.total"
      );
      break;
    case `${MODULE_ID}.manifesterLevel`:
      // Apply to both manifesters AND spellbooks for Psionics-Magic Transparency
      result.push(
        `flags.${MODULE_ID}.manifesters.primary.cl.total`,
        `flags.${MODULE_ID}.manifesters.secondary.cl.total`,
        `flags.${MODULE_ID}.manifesters.tertiary.cl.total`,
        `flags.${MODULE_ID}.manifesters.spelllike.cl.total`,
        "system.attributes.spells.spellbooks.primary.cl.total",
        "system.attributes.spells.spellbooks.secondary.cl.total",
        "system.attributes.spells.spellbooks.tertiary.cl.total",
        "system.attributes.spells.spellbooks.spelllike.cl.total"
      );
      break;
    case `${MODULE_ID}.psionicDC`:
      // Universal DC bonus affects all powers and spells
      result.push("system.attributes.spells.school.all.dc");
      break;
    case `${MODULE_ID}.psionicResistance`:
      // Psionic Resistance maps to same location as Spell Resistance for transparency
      result.push("system.attributes.sr.total");
      break;
  // Bidirectional transparency: spell bonuses also apply to manifesters
    case "concentration":
      // Spell concentration also applies to manifesters
      result.push(
        `flags.${MODULE_ID}.manifesters.primary.concentration.total`,
        `flags.${MODULE_ID}.manifesters.secondary.concentration.total`,
        `flags.${MODULE_ID}.manifesters.tertiary.concentration.total`,
        `flags.${MODULE_ID}.manifesters.spelllike.concentration.total`
      );
      break;
    case "cl":
      // Spell CL also applies to manifesters
      result.push(
        `flags.${MODULE_ID}.manifesters.primary.cl.total`,
        `flags.${MODULE_ID}.manifesters.secondary.cl.total`,
        `flags.${MODULE_ID}.manifesters.tertiary.cl.total`,
        `flags.${MODULE_ID}.manifesters.spelllike.cl.total`
      );
      break;
    // Note: "dc" already applies to all via system.attributes.spells.school.all.dc
    default: {
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
      break;
    }
  }
});
