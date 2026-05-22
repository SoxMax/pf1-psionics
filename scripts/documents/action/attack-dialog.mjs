import { MODULE_ID } from "../../_module.mjs";

async function renderAttackDialogHook(app, html, data) {
  if (data.item.type !== `${MODULE_ID}.power`) return;
  // Foundry v13 passes HTMLElement to render hooks; v12 passes jQuery. Normalize to HTMLElement.
  if (html instanceof jQuery) html = html[0];

  const powerControls = await foundry.applications.handlebars.renderTemplate("modules/pf1-psionics/templates/action/attack-dialog.hbs", data);
  const controls = html.querySelector(".conditionals");
  if (controls) controls.insertAdjacentHTML("afterend", powerControls);

  // Add augment selector - get augments from the action, not the item
  const augments = data.action?.augments || [];
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
    if (controls) controls.insertAdjacentHTML("afterend", augmentControls);

    // Initialize augment tracking
    app.rollData.augmentCounts = app.rollData.augmentCounts || {};

    // Handle augment adjust buttons (both increase and decrease)
    for (const button of html.querySelectorAll(".augment-adjust")) {
      button.addEventListener("click", (event) => handleAugmentAdjust(app, html, augments, event));
    }
  }

  // Force the application to recalculate its dimensions.
  app.setPosition({height: "auto"});

  const bindChange = (selector, handler) => {
    for (const el of html.querySelectorAll(selector)) {
      el.addEventListener("change", handler);
    }
  };

  bindChange('input.attribute[name="sl-offset"]', app._onChangeAttribute.bind(app));
  bindChange('input.attribute[name="cl-offset"]', app._onChangeAttribute.bind(app));
  bindChange('input.attribute[name="pp-offset"]', onChangeAttribute.bind(app));
  bindChange('input[type="checkbox"][name="concentration"]', app._onToggleFlag.bind(app));
  bindChange('input[type="checkbox"][name="cl-check"]', app._onToggleFlag.bind(app));
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
 * @param {HTMLElement} html - The dialog html element
 * @param {Array} availableAugments - Array of available augments
 * @param {Event} event - The click event
 */
function handleAugmentAdjust(app, html, availableAugments, event) {
  event.preventDefault();

  const button = event.currentTarget;
  const augmentId = button.dataset.augmentId;
  const action = button.dataset.action; // 'increase' or 'decrease'
  const augment = availableAugments.find(a => a._id === augmentId);
  const input = html.querySelector(`input.augment-count[data-augment-id="${augmentId}"]`);
  const currentCount = parseInt(input?.value) || 0;
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
  if (input) input.value = newCount;

  // Update tracking
  app.rollData.augmentCounts[augmentId] = newCount;
}

Hooks.on("renderAttackDialog", renderAttackDialogHook);

