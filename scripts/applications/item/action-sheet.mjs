import {AugmentEditor} from "./augment-sheet.mjs";

/**
 * Register render hook to inject augments UI
 */
Hooks.on("renderItemActionSheet", async (app, html, _data) => {
  // Only inject for PsionicActions (powers)
  if (!app.action.augments) return;
  if (!app.isEditable) return; // Skip if not editable

  // Prepare augments data for template
  const augments = (app.action.augments || []).map(augObj => {
    const augmentData = augObj.toObject ? augObj.toObject() : augObj;
    return {
      ...augmentData,
      hasEffects: Object.values(augmentData.effects || {}).some(v => v && v !== 0 && v !== 1 && v !== "")
    };
  });

  // Render augments template
  const augmentsHtml = await foundry.applications.handlebars.renderTemplate(
    "modules/pf1-psionics/templates/apps/psionic-action-augments.hbs",
    { augments, editable: app.isEditable }
  );

  // Inject at the top of the conditionals tab
  const conditionalsTab = html.find('.tab[data-tab="conditionals"]');
  if (conditionalsTab.length === 0) {
    console.warn("PF1-Psionics | Conditionals tab not found!");
    return;
  }
  conditionalsTab.prepend(augmentsHtml);

  // Attach event listeners to the injected HTML
  conditionalsTab.find(".add-augment").click(_onAddAugment.bind(app));
  conditionalsTab.find(".duplicate-augment").click(_onDuplicateAugment.bind(app));
  conditionalsTab.find(".delete-augment").click(_onDeleteAugment.bind(app));
  conditionalsTab.find(".edit-augment").click(_onEditAugment.bind(app));
});

/**
 * Event handler for adding a new augment
 */
async function _onAddAugment(event) {
  event.preventDefault();

  console.log("PF1-Psionics | _onAddAugment called");
  const action = this.action;
  console.log("  action:", action.name, action.id);
  console.log("  action._source.augments:", action._source.augments);

  // Clone the array to avoid mutating the source directly (like duplicate handler does)
  const augments = foundry.utils.deepClone(action._source.augments || []);
  console.log("  cloned augments length:", augments.length);

  const newAugment = {
    _id: foundry.utils.randomID(),
    name: game.i18n.localize("PF1-Psionics.Augments.New"),
    cost: 1,
    effects: {},
    requiresFocus: false,
  };

  augments.push(newAugment);
  console.log("  augments after push:", augments.length);
  console.log("  new augment:", newAugment);

  // Use action.update() like PF1 does for damage formulas
  console.log("  Calling action.update({ augments })");
  try {
    const result = await action.update({ augments });
    console.log("  Update succeeded, result:", result);
  } catch (error) {
    console.error("  Update failed:", error);
  }
}

/**
 * Event handler for duplicating an augment
 */
async function _onDuplicateAugment(event) {
  event.preventDefault();
  const augmentId = event.currentTarget.closest(".augment-item").dataset.augmentId;

  const action = this.action;
  const augments = foundry.utils.deepClone(action._source.augments || []);

  const augment = augments.find(a => a._id === augmentId);
  if (!augment) return;

  const duplicate = foundry.utils.deepClone(augment);
  duplicate._id = foundry.utils.randomID();
  duplicate.name = `${augment.name} (Copy)`;

  augments.push(duplicate);

  // Use action.update() like PF1 does for damage formulas
  await action.update({ augments });
}

/**
 * Event handler for deleting an augment
 */
async function _onDeleteAugment(event) {
  event.preventDefault();
  const augmentId = event.currentTarget.closest(".augment-item").dataset.augmentId;

  const action = this.action;
  // Clone and filter to avoid mutating source directly
  const augments = foundry.utils.deepClone(action._source.augments || []).filter(a => a._id !== augmentId);

  // Use action.update() like PF1 does for damage formulas
  await action.update({ augments });
}

/**
 * Event handler for editing an augment
 */
async function _onEditAugment(event) {
  event.preventDefault();
  const augmentId = event.currentTarget.closest(".augment-item").dataset.augmentId;

  const augment = this.action.augments?.find(a => a._id === augmentId);
  if (!augment) return;

  new AugmentEditor(this.item, augment, this.action).render(true);
}

