import { MODULE_ID } from "../../_module.mjs";

async function renderAttackDialogHook(app, html, data) {
  if (data.item.type !== `${MODULE_ID}.power`) return;
  const powerControls = await foundry.applications.handlebars.renderTemplate("modules/pf1-psionics/templates/action/attack-dialog.hbs", data);
  const controls = html.find(".conditionals");
  controls.after(powerControls);

  // Add augment selector
  const augments = data.item.system.augments || [];
  const manifestCL = data.rollData?.cl || 0;

  if (augments.length > 0) {
    const augmentControls = await foundry.applications.handlebars.renderTemplate(
      "modules/pf1-psionics/templates/action/augment-selector.hbs",
      {
        augments: augments,
        manifestCL: manifestCL,
        currentFocus: data.actor?.psionics?.focus?.current ?? 0
      }
    );
    controls.after(augmentControls);

    // Initialize augment tracking
    app.rollData.augmentCounts = app.rollData.augmentCounts || {};

    // Handle augment adjust buttons (both increase and decrease)
    html.find(".augment-adjust").on("click", handleAugmentAdjust.bind(null, app, html, augments));
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
 * Handle augment count adjustment (increase or decrease)
 * @param {Application} app - The dialog application
 * @param {jQuery} html - The dialog HTML
 * @param {Array} availableAugments - Array of available augments
 * @param {Event} event - The click event
 */
function handleAugmentAdjust(app, html, availableAugments, event) {
  event.preventDefault();
  
  const $button = $(event.currentTarget);
  const augmentId = $button.data("augment-id");
  const action = $button.data("action"); // 'increase' or 'decrease'
  const augment = availableAugments.find(a => a._id === augmentId);
  const $input = html.find(`input.augment-count[data-augment-id="${augmentId}"]`);
  const currentCount = parseInt($input.val()) || 0;
  const maxUses = augment.maxUses || Infinity;
  
  // Determine the new count based on action
  let newCount = currentCount;
  if (action === "increase" && currentCount < maxUses) {
    newCount = currentCount + 1;
  } else if (action === "decrease" && currentCount > 0) {
    newCount = currentCount - 1;
  } else {
    // No valid action to take
    return;
  }
  
  // Update the input value
  $input.val(newCount);
  
  // Update tracking
  app.rollData.augmentCounts[augmentId] = newCount;
}

Hooks.on("renderAttackDialog", renderAttackDialogHook);

