export function setupHook() {
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
}
