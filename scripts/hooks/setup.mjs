import { MODULE_ID } from "../_module.mjs";
import { PsionicPowerBrowser } from "../applications/_module.mjs";

function setupHook() {
  foundry.applications.handlebars.loadTemplates([
    "modules/pf1-psionics/templates/action/attack-dialog.hbs", // Attack dialog additions
    "modules/pf1-psionics/templates/action/augment-selector.hbs", // Augment selector in attack dialog
    "modules/pf1-psionics/templates/actor/actor-manifester-front.hbs", // Psionics tab template
    "modules/pf1-psionics/templates/actor/actor-manifester.hbs", // Psionics tab template
    "modules/pf1-psionics/templates/item/class-manifesting.hbs", // Psionics class config
    "modules/pf1-psionics/templates/app/item-augment.hbs", // Augment editor dialog
    "modules/pf1-psionics/templates/item/parts/power-actions.hbs", // Power actions template
    "modules/pf1-psionics/templates/item/parts/power-augments.hbs", // Power augments template
    "modules/pf1-psionics/templates/item/parts/power-descriptors.hbs", // Power descriptors template
    "modules/pf1-psionics/templates/item/parts/power-header.hbs", // Power item header
    "modules/pf1-psionics/templates/item/parts/power-subschool.hbs", // Power uses template
    "modules/pf1-psionics/templates/item/power.hbs", // Power item template
  ]);
  // Register the browser type in PF1's compendium browser system
  pf1.applications.compendiumBrowser.CompendiumBrowser.BROWSERS.psionicPowers = PsionicPowerBrowser;

  // Create and store the browser instance
  pf1.applications.compendiums.psionicPowers = new PsionicPowerBrowser();

  console.log(`${MODULE_ID} | Registered Psionic Power Compendium Browser`);
}

Hooks.once("setup", setupHook);

/**
 * Hook to add custom filter ID mappings for psionic power filters
 * This allows the _onOpenCompendiumBrowser function to properly activate filters
 */
Hooks.on("pf1.registerCompendiumBrowserFilters", (filterIdMappings) => {
  // Add mappings for psionic power filter IDs to filter class names
  Object.assign(filterIdMappings, {
    psionLevel: "PsionicPowerLevelFilter",
    psionClass: "PsionicManifesterClassFilter",
    psionDiscipline: "PsionicDisciplineFilter",
    psionSubdiscipline: "PsionicSubdisciplineFilter",
    psionDescriptor: "PsionicDescriptorFilter",
    psionRange: "PsionicRangeFilter",
    psionActionType: "PsionicActionTypeFilter",
    psionDisplay: "PsionicDisplayFilter",
  });
});

