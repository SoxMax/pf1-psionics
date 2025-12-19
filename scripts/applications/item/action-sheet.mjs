import {MODULE_ID} from "../../_module.mjs";
import {AugmentEditor} from "./augment-sheet.mjs";

/**
 * Register render hook to inject augments UI
 */
Hooks.on("renderItemActionSheet", async (app, html, _data) => {
  // Only inject for PsionicActions (powers)
  if (!app.action.augments) return;

  // Prepare augments data for template
  const augments = Array.from(app.action.augments.values()).map(augObj => {
    const augmentData = augObj.toObject ? augObj.toObject() : augObj;
    return {
      ...augmentData,
      hasEffects: Object.values(augmentData.effects || {}).some(v => v && v !== 0 && v !== 1 && v !== "")
    };
  });

  console.log("PF1-Psionics | Rendering augments:", {
    actionName: app.action.name,
    augmentsCollection: app.action.augments,
    augmentsArray: augments,
    augmentsLength: augments.length,
    editable: app.isEditable
  });

  // Render augments template
  const augmentsHtml = await renderTemplate(
    "modules/pf1-psionics/templates/apps/psionic-action-augments.hbs",
    { augments, editable: app.isEditable }
  );

  console.log("PF1-Psionics | Augments HTML length:", augmentsHtml.length);

  // Inject at the top of the conditionals tab
  const conditionalsTab = html.find('.tab[data-tab="conditionals"]');
  if (conditionalsTab.length === 0) {
    console.warn("PF1-Psionics | Conditionals tab not found!");
    return;
  }
  conditionalsTab.prepend(augmentsHtml);
});

/**
 * Register libWrapper injections for augment event handlers
 */
export function injectActionSheet() {
  // Inject augment event listeners
  libWrapper.register(MODULE_ID, "pf1.applications.component.ItemActionSheet.prototype.activateListeners", function(wrapped, html) {
    wrapped(html);

    if (!this.isEditable) return;
    if (!this.action.augments) return; // Not a PsionicAction

    // Augment controls
    html.find(".add-augment").click(this._onAddAugment.bind(this));
    html.find(".duplicate-augment").click(this._onDuplicateAugment.bind(this));
    html.find(".delete-augment").click(this._onDeleteAugment.bind(this));
    html.find(".edit-augment").click(this._onEditAugment.bind(this));
  }, "WRAPPER");

  // Add augment methods to ItemActionSheet prototype
  pf1.applications.component.ItemActionSheet.prototype._onAddAugment = async function(event) {
    event.preventDefault();

    const action = this.action;
    const actionData = action.toObject();

    if (!actionData.augments) {
      actionData.augments = [];
    }

    const newAugment = {
      _id: foundry.utils.randomID(),
      name: game.i18n.localize("PF1-Psionics.Augments.New"),
      cost: 1,
      effects: {},
      requiresFocus: false,
    };

    actionData.augments.push(newAugment);

    await this._updateActionData(actionData);
  };

  pf1.applications.component.ItemActionSheet.prototype._onDuplicateAugment = async function(event) {
    event.preventDefault();
    const augmentId = event.currentTarget.closest(".augment-item").dataset.augmentId;

    const action = this.action;
    const actionData = action.toObject();

    const augment = actionData.augments.find(a => a._id === augmentId);
    if (!augment) return;

    const duplicate = foundry.utils.deepClone(augment);
    duplicate._id = foundry.utils.randomID();
    duplicate.name = `${augment.name} (Copy)`;

    actionData.augments.push(duplicate);

    await this._updateActionData(actionData);
  };

  pf1.applications.component.ItemActionSheet.prototype._onDeleteAugment = async function(event) {
    event.preventDefault();
    const augmentId = event.currentTarget.closest(".augment-item").dataset.augmentId;

    const action = this.action;
    const actionData = action.toObject();

    actionData.augments = actionData.augments.filter(a => a._id !== augmentId);

    await this._updateActionData(actionData);
  };

  pf1.applications.component.ItemActionSheet.prototype._onEditAugment = async function(event) {
    event.preventDefault();
    const augmentId = event.currentTarget.closest(".augment-item").dataset.augmentId;

    const augment = this.action.augments.get(augmentId);
    if (!augment) return;

    new AugmentEditor(this.item, augment).render(true);
  };

  pf1.applications.component.ItemActionSheet.prototype._updateActionData = async function(actionData) {
    const item = this.item;
    const itemData = item.toObject();

    const actionIndex = itemData.system.actions.findIndex(a => a._id === actionData._id);
    if (actionIndex !== -1) {
      itemData.system.actions[actionIndex] = actionData;
      await item.update({"system.actions": itemData.system.actions});
    }
  };
}

// Register libWrapper injections
Hooks.once("libWrapper.Ready", injectActionSheet);
