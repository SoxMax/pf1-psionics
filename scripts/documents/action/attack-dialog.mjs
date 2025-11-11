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

      // Initialize augment tracking
      app.rollData.augmentCounts = app.rollData.augmentCounts || {};

      // Handle augment increase button
      html.find(".augment-increase").on("click", function(event) {
        event.preventDefault();
        const augmentId = $(this).data("augment-id");
        const augment = availableAugments.find(a => a._id === augmentId);
        const $input = html.find(`input.augment-count[data-augment-id="${augmentId}"]`);
        const currentCount = parseInt($input.val()) || 0;
        const maxUses = augment.maxUses || Infinity;

        if (currentCount < maxUses) {
          const newCount = currentCount + 1;
          $input.val(newCount);

          // Update tracking
          app.rollData.augmentCounts[augmentId] = newCount;

          // Calculate and add PP cost
          const augmentCost = RollPF.safeRollSync(augment.costFormula, app.rollData).total;
          app.rollData.chargeCostBonus = (app.rollData.chargeCostBonus || 0) + augmentCost;

          // Update charge cost display
          updateChargeCostDisplay(html, app);
        }
      });

      // Handle augment decrease button
      html.find(".augment-decrease").on("click", function(event) {
        event.preventDefault();
        const augmentId = $(this).data("augment-id");
        const augment = availableAugments.find(a => a._id === augmentId);
        const $input = html.find(`input.augment-count[data-augment-id="${augmentId}"]`);
        const currentCount = parseInt($input.val()) || 0;

        if (currentCount > 0) {
          const newCount = currentCount - 1;
          $input.val(newCount);

          // Update tracking
          app.rollData.augmentCounts[augmentId] = newCount;

          // Calculate and subtract PP cost
          const augmentCost = RollPF.safeRollSync(augment.costFormula, app.rollData).total;
          app.rollData.chargeCostBonus = (app.rollData.chargeCostBonus || 0) - augmentCost;

          // Update charge cost display
          updateChargeCostDisplay(html, app);
        }
      });
    }
  }

  // Force the application to recalculate its dimensions.
  app.setPosition({height: "auto"});

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

/**
 * Update the charge cost display in the dialog
 * @param {jQuery} html - The dialog HTML
 * @param {Application} app - The dialog application
 */
function updateChargeCostDisplay(html, app) {
  // Find the charge cost display element (if it exists in PF1's attack dialog)
  const $chargeDisplay = html.find(".charge-cost, .power-point-cost");
  if ($chargeDisplay.length) {
    const totalCost = (app.rollData.chargeCost || 0) + (app.rollData.chargeCostBonus || 0);
    $chargeDisplay.text(totalCost);
  }

  // Prepare selectedAugments array for action-use hook
  const augmentCounts = app.rollData.augmentCounts || {};
  app.rollData.selectedAugments = [];

  // Build array of augments with their counts
  for (const [augmentId, count] of Object.entries(augmentCounts)) {
    if (count > 0) {
      const augment = app.item.system.augments.find(a => a._id === augmentId);
      if (augment) {
        // Add the augment multiple times if count > 1
        for (let i = 0; i < count; i++) {
          app.rollData.selectedAugments.push(augment);
        }
      }
    }
  }
}
