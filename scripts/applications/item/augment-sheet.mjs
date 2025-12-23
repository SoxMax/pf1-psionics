import { MODULE_ID } from "../../_module.mjs";

/**
 * Sheet for editing individual augments
 * Follows PF1 action sheet pattern with real-time updates
 */
export class AugmentEditor extends globalThis.FormApplication {
  static _warnedAppV1 = true; // TODO: We know

  /** @type {Record<string, AbortController>} */
  #controllers = {
    content: null,
    frame: null,
  };

  get abortSignal() {
    return this.#controllers.content?.signal;
  }

  constructor(item, augment, action, options = {}) {
    super(augment, options);
    this.item = item;
    this.augment = augment;
    this.action = action;
  }

  /**
   * @internal
   * @type {Record<string,string>}
   */
  _activeEdits = {};

  /**
   * Which fields to track edits for
   *
   * @internal
   */
  static EDIT_TRACKING = ["description"];

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["pf1", "sheet", "augment-editor", "augment"],
      template: `modules/${MODULE_ID}/templates/app/item-augment.hbs`,
      width: 580,
      height: 600,
      closeOnSubmit: false,
      submitOnChange: true,
      submitOnClose: true,
      resizable: true,
      scrollY: [".tab"],
      tabs: [
        {
          navSelector: "nav.tabs[data-group='primary']",
          contentSelector: "section.primary-body",
          initial: "description",
          group: "primary",
        },
      ],
      title: "Edit Augment"
    });
  }

  // TODO: Remove after AppV2 conversion
  ACTIONS = { ...this.constructor.ACTIONS };

  static ACTIONS = {
    // Add action handlers here as needed
  };

  get id() {
    return `augment-editor-${this.item.id}-${this.action.id}-${this.augment._id}`;
  }

  get title() {
    return `${this.item.name}: ${this.augment.name || game.i18n.localize("PF1-Psionics.Augments.New")}`;
  }

  render(...args) {
    this.#controllers.frame ??= new AbortController();

    super.render(...args);

    return this;
  }

  async getData() {
    const data = super.getData();
    const augment = this.augment;
    const editable = this.isEditable;

    // Convert to plain object if this is a DataModel
    const source = augment.toObject ? augment.toObject(true, false) : augment;

    data.config = pf1.config;
    data.augment = augment; // Derived data (DataModel instance or plain object)
    data.data = source; // Source data for form fields
    data.source = source;

    // Add schema fields if available
    if (augment.schema?.fields) {
      data.fields = augment.schema.fields;
    }

    data.isNew = !augment.name || augment.name === game.i18n.localize("PF1-Psionics.Augments.New");
    data.editable = editable;
    data.cssClass = editable ? "editable" : "locked";
    data.item = this.item;
    data.user = game.user;

    // Use augment's img property (which inherits from parent or uses fallback)
    data.img = augment.img || augment.constructor?.FALLBACK_IMAGE || "icons/svg/upgrade.svg";

    // Prepare description HTML for editor
    // Always set descriptionHTML so the editor renders even for empty descriptions
    const noDesc = "<p>" + game.i18n.localize("PF1.NoDescription") + "</p>";
    const description = augment.description;
    data.descriptionHTML = description
      ? await TextEditor.enrichHTML(description, {
        secrets: editable,
        async: true,
      })
      : noDesc;

    if (this.constructor.EDIT_TRACKING?.length)
      data._editorState = pf1.applications.utils.restoreEditState(this, data.data);

    return data;
  }

  /**
   * Check if sheet is editable
   */
  get isEditable() {
    const parentItem = this.item;
    let editable = this.options.editable && parentItem.isOwner;
    if (parentItem.pack) {
      const pack = game.packs.get(parentItem.pack);
      if (pack.locked) editable = false;
    }
    return editable;
  }

  /**
   * @override
   * @param {JQuery<HTMLElement>} jq
   */
  activateListeners(jq) {
    super.activateListeners(jq);

    this.#controllers.content?.abort();
    this.#controllers.content = new AbortController();

    const html = jq[0];

    // Generic click listener
    html.addEventListener("click", this.#onClick.bind(this), { signal: this.abortSignal });
  }

  /**
   * Click handler
   *
   * @param {PointerEvent} event
   */
  #onClick(event) {
    const target = event.target.closest("[data-action]");

    if (this.element[0].contains(target)) {
      this._onClickAction(event, target);
    } else {
      this._onClick(event, event.target);
    }
  }

  /**
   * Handle action button clicks
   *
   * @protected
   * @param {PointerEvent} event - Triggering event
   * @param {HTMLElement} target - Action element
   * @returns {boolean} - true if handler was found, false otherwise.
   */
  _onClickAction(event, target) {
    const fn = this.ACTIONS[target.dataset.action];
    if (!fn) return false;

    fn.call(this, event, target);
    return true;
  }

  /**
   * Non-action button clicks
   *
   * @protected
   * @param {PointerEvent} event - Triggering event
   * @param {HTMLElement} target - Click target
   * @returns {boolean} - True if this click was handled, false otherwise
   */
  _onClick(event, target) {
    // <input> handle
    if (target instanceof HTMLInputElement) {
      // Select the whole text on click
      if (target.classList.contains("select-on-click")) {
        target.select();
        return true;
      }
    }

    return false;
  }

  async _updateObject(event, formData) {
    // Expand formData to handle nested properties
    formData = foundry.utils.expandObject(formData);

    // Clean up empty values - remove them entirely so we only store what's actually being modified
    // HTML forms send empty strings for empty inputs, so we need to clean those up
    const removeIfEmpty = (obj, path) => {
      const value = foundry.utils.getProperty(obj, path);
      if (value === "" || value === null || value === undefined) {
        const parts = path.split(".");
        const key = parts.pop();
        const parent = parts.length ? foundry.utils.getProperty(obj, parts.join(".")) : obj;
        if (parent) {
          delete parent[key];
        }
      }
    };

    // Clean up empty HTML (ProseMirror sends <p></p> or <p><br></p> for empty editors)
    const isEmptyHTML = (html) => {
      if (!html) return true;
      const stripped = html.replace(/<p>\s*<\/p>/gi, "").replace(/<p><br><\/p>/gi, "").trim();
      return stripped === "";
    };

    // Remove empty description HTML
    if (formData.description && isEmptyHTML(formData.description)) {
      delete formData.description;
    }

    // Clean up effects fields - only keep non-empty values
    if (formData.effects) {
      removeIfEmpty(formData, "effects.damageBonus");
      removeIfEmpty(formData, "effects.damageMult");
      removeIfEmpty(formData, "effects.durationMultiplier");
      removeIfEmpty(formData, "effects.dcBonus");
      removeIfEmpty(formData, "effects.clBonus");
      removeIfEmpty(formData, "effects.special");

      // Remove effects object if empty
      if (Object.keys(formData.effects).length === 0) {
        delete formData.effects;
      }
    }

    // Clean up other optional fields
    removeIfEmpty(formData, "tag");
    removeIfEmpty(formData, "maxUses");

    // Get the current augments array from the action's source data (not derived DataModels)
    // Use deepClone to prevent mutation of source data
    const augments = foundry.utils.deepClone(this.action._source.augments || []);

    // Find the augment to update
    const index = augments.findIndex(a => a._id === this.augment._id);

    if (index >= 0) {
      // Replace the augment entirely with form data (preserving _id)
      // This ensures deleted fields are actually removed, not merged over
      augments[index] = {
        _id: this.augment._id,
        ...formData
      };
    } else {
      // Add new augment with a new ID
      augments.push({
        _id: this.augment._id || foundry.utils.randomID(),
        ...formData
      });
    }

    // Update the action (this will trigger a re-render via hooks)
    await this.action.update({ augments });

    // Update this.augment to point to the new DataModel instance
    // The action update creates new DataModel instances, so we need to get the fresh reference
    const augmentId = this.augment._id;
    this.augment = this.action.augments.find(a => a._id === augmentId);
  }

  async close(options = {}) {
    this.#controllers.content?.abort();
    this.#controllers.content = null;
    this.#controllers.frame?.abort();
    this.#controllers.frame = null;

    if (options.force && this._state <= Application.RENDER_STATES.NONE) return; // HACK: already closed, would error without

    return super.close(options);
  }

  /**
   * Copy of DocumentSheet._createDocumentIdLink
   *
   * @internal
   * @param {jQuery<HTMLElement>} jq
   */
  _createDocumentIdLink(jq) {
    if (!this.item.id) return;

    /** @type {HTMLElement} */
    const html = jq[0];

    const title = html.querySelector(".window-title");
    const label = "Augment";
    const idLink = document.createElement("a");
    idLink.classList.add("document-id-link");
    idLink.ariaLabel = game.i18n.localize("SHEETS.CopyUuid");
    idLink.dataset.tooltip = "SHEETS.CopyUuid";
    idLink.dataset.tooltipDirection = "UP";
    idLink.innerHTML = '<i class="fa-solid fa-passport"></i>';

    idLink.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        const augmentId = this.augment._id;
        const uuid = `${this.item.uuid}.Augment.${augmentId}`;
        game.clipboard.copyPlainText(uuid);
        ui.notifications.info(
          game.i18n.format("DOCUMENT.IdCopiedClipboard", { label, type: "uuid", id: uuid })
        );
      },
      { signal: this.#controllers.frame.signal }
    );

    idLink.addEventListener(
      "contextmenu",
      (event) => {
        event.preventDefault();
        game.clipboard.copyPlainText(this.augment._id);
        ui.notifications.info(
          game.i18n.format("DOCUMENT.IdCopiedClipboard", { label, type: "id", id: this.augment._id })
        );
      },
      { signal: this.#controllers.frame.signal }
    );

    title.append(idLink);
  }

  /**
   * Used to call {@link _createDocumentIdLink}
   *
   * @override
   */
  async _renderOuter() {
    const html = await super._renderOuter();

    this._createDocumentIdLink(html);

    return html;
  }
}

