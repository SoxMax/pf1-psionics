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

  constructor(item, augment, options = {}) {
    super(augment, options);
    this.item = item;
    this.augment = augment;
  }

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
          initial: "basic",
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
    return `augment-editor-${this.item.id}-${this.augment._id}`;
  }

  get title() {
    return `${this.item.name}: ${this.augment.name || game.i18n.localize("PF1-Psionics.Augments.New")}`;
  }

  render(...args) {
    this.#controllers.frame ??= new AbortController();

    super.render(...args);

    return this;
  }

  getData() {
    const data = super.getData();
    const augment = foundry.utils.deepClone(this.augment);
    const editable = this.isEditable;

    data.config = pf1.config;
    data.augment = augment;
    data.data = augment; // For form field compatibility
    data.source = augment;
    data.isNew = !augment.name || augment.name === game.i18n.localize("PF1-Psionics.Augments.New");
    data.editable = editable;
    data.cssClass = editable ? "editable" : "locked";
    data.item = this.item;
    data.user = game.user;

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

    // Get the current augments array
    const augments = foundry.utils.deepClone(this.item.system.augments || []);

    // Find the augment to update
    const index = augments.findIndex(a => a._id === this.augment._id);

    if (index >= 0) {
      // Update existing augment - merge with existing data
      augments[index] = foundry.utils.mergeObject(augments[index], formData);
    } else {
      // Add new augment
      augments.push(foundry.utils.mergeObject(this.augment, formData));
    }

    // Update the item (this will trigger a re-render via hooks)
    await this.item.update({"system.augments": augments});
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
    idLink.dataset.tooltip = `SHEETS.CopyUuid`;
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

