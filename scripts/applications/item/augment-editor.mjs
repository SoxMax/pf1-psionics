import { MODULE_ID } from "../../_module.mjs";

/**
 * Dialog for editing individual augments
 */
export class AugmentEditor extends globalThis.FormApplication {
  constructor(item, augment, options = {}) {
    super(augment, options);
    this.item = item;
    this.augment = augment;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["pf1", "augment-editor"],
      template: `modules/${MODULE_ID}/templates/item/augment-editor.hbs`,
      width: 600,
      height: "auto",
      closeOnSubmit: true,
      submitOnChange: false,
      submitOnClose: false,
      title: "Edit Augment"
    });
  }

  get title() {
    return `${this.augment.name || "New Augment"}`;
  }

  getData() {
    const data = super.getData();
    data.augment = foundry.utils.deepClone(this.augment);
    data.isNew = !this.augment.name || this.augment.name === "New Augment";
    return data;
  }

  async _updateObject(event, formData) {
    // Get the current augments array
    const augments = foundry.utils.deepClone(this.item.system.augments || []);

    // Find the augment to update
    const index = augments.findIndex(a => a._id === this.augment._id);

    if (index >= 0) {
      // Update existing augment
      augments[index] = foundry.utils.mergeObject(augments[index], formData);
    } else {
      // This shouldn't happen, but handle it anyway
      augments.push(foundry.utils.mergeObject(this.augment, formData));
    }

    // Update the item
    await this.item.update({"system.augments": augments});
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Toggle sections
    html.find(".section-toggle").click(this._onToggleSection.bind(this));
  }

  _onToggleSection(event) {
    event.preventDefault();
    const section = $(event.currentTarget).closest(".form-section");
    section.toggleClass("collapsed");
  }
}

