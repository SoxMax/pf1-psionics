import { MODULE_ID } from "../../_module.mjs";

export async function renderAttackDialogHook(app, html, data) {
  if (data.item.type !== `${MODULE_ID}.power`) return;
  const powerControls = await foundry.applications.handlebars.renderTemplate("modules/pf1-psionics/templates/action/attack-dialog.hbs", data);
  const controls = html.find(".conditionals");
  controls.after(powerControls);

  // Add augment selector
  const power = data.item;
  const augments = power.system.augments || [];
  const manifestCL = data.rollData?.cl || 0;

  if (augments.length > 0) {
    // Filter augments by manifester level
    const availableAugments = augments.filter(aug => {
      const minLevel = aug.conditions?.minLevel || 0;
      const maxLevel = aug.conditions?.maxLevel || Infinity;
      return manifestCL >= minLevel && manifestCL <= maxLevel;
    });

    if (availableAugments.length > 0) {
      const augmentControls = await foundry.applications.handlebars.renderTemplate(
        "modules/pf1-psionics/templates/action/augment-selector.hbs",
        {
          augments: availableAugments,
          manifestCL: manifestCL,
          currentFocus: data.actor?.flags?.[MODULE_ID]?.focus?.current || 0
        }
      );
      controls.after(augmentControls);

      // Handle augment selection
      html.find('input[name="augment"]').on("change", function() {
        const augmentId = $(this).val();
        const checked = $(this).is(":checked");

        // Initialize selected augments array if needed
        app.rollData.selectedAugments = app.rollData.selectedAugments || [];

        if (checked) {
          // Add augment
          const augment = availableAugments.find(a => a._id === augmentId);
          app.rollData.selectedAugments.push(augment);

          // Calculate additional PP cost
          const augmentCost = RollPF.safeRollSync(
            augment.costFormula,
            app.rollData
          ).total;

          app.rollData.chargeCostBonus = (app.rollData.chargeCostBonus || 0) + augmentCost;
        } else {
          // Remove augment
          const idx = app.rollData.selectedAugments.findIndex(a => a._id === augmentId);
          if (idx >= 0) {
            const augment = app.rollData.selectedAugments[idx];
            const augmentCost = RollPF.safeRollSync(
              augment.costFormula,
              app.rollData
            ).total;

            app.rollData.chargeCostBonus = (app.rollData.chargeCostBonus || 0) - augmentCost;
            app.rollData.selectedAugments.splice(idx, 1);
          }
        }

        // Re-render to update displayed cost
        app.render();
      });
    }
  }

  // Force the application to recalculate its dimensions.
  app.setPosition({
    height: "auto"
  });

  html.find('input.attribute[name="sl-offset"]').on("change", app._onChangeAttribute.bind(app));
  html.find('input.attribute[name="cl-offset"]').on("change", app._onChangeAttribute.bind(app));
  html.find('input.attribute[name="pp-offset"]').on("change", onChangeAttribute.bind(app));
  html.find('input[type="checkbox"][name="concentration"]').on("change", app._onToggleFlag.bind(app));
  html.find('input[type="checkbox"][name="cl-check"]').on("change", app._onToggleFlag.bind(app));
}

function onChangeAttribute(event) {
  event.preventDefault();

  const elem = event.currentTarget;
  this.attributes[elem.name] = elem.value;

  switch (elem.name) {
    case "pp-offset":
      this.rollData.chargeCostBonus = (this.rollData?.chargeCostBonus ?? 0) + parseInt(elem.value);
      break;
  }

  this.render();
}