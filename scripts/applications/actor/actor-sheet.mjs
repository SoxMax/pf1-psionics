import { MODULE_ID } from "../../_module.mjs";
import { PowerItem } from "../../documents/_module.mjs";
import { getCollection } from "../../documents/actor/manifester-store.mjs";
import { findOrphanedPowers, removeLinkedRecord } from "../../documents/item/item.mjs";

const SKIPPED_SHEET_CLASSES = [
  "pf1alt.AltActorSheetPFCharacter",
  "pf1alt.AltActorSheetPFNPC",
  "pf1.ActorSheetPFNPCLoot",
  "PF1.LootSheetPf1NPC",
];

function shouldSkipInjection(actor) {
  const sheetClass = actor.getFlag("core", "sheetClass");
  if (sheetClass) return SKIPPED_SHEET_CLASSES.includes(sheetClass);
  const sheetsForType = CONFIG.Actor.sheetClasses?.[actor.type] ?? {};
  return SKIPPED_SHEET_CLASSES.some((cls) => sheetsForType[cls]?.default);
}

async function renderActorHook(app, html, data) {
  const actor = data.actor;
  if (shouldSkipInjection(actor)) return;
  // Foundry v13 passes HTMLElement to render hooks; v12 passes jQuery. Normalize to HTMLElement.
  if (html instanceof jQuery) html = html[0];
  // Inject Settings
  injectSettings(app, html, data);
  // Inject Psionics Manifesters Tab
  await injectPsionicsTab(app, html, data);
  adjustActiveTab(app);
  // Inject power points into combat tab
  injectPowerPointsIntoCombatTab(app, html, data);
}

function injectActorSheetPF() {
  libWrapper.register(MODULE_ID, "pf1.applications.actor.ActorSheetPF.prototype._prepareItems", function (wrapped, context) {
    wrapped(context);
    context.psionics = {};
    prepareManifesters(this, context);

    // Use helpers to get power points and focus data for template
    const ppHelper = this.actor.psionics?.powerPoints;
    const focusHelper = this.actor.psionics?.focus;

    context.psionics.powerPoints = ppHelper?.toObject() ?? { current: 0, temporary: 0, maximum: 0, available: 0, inUse: false };
    context.psionics.focus = focusHelper?.toObject() ?? { current: 0, maximum: 0, isFocused: false, inUse: false };
    context.psionics.activeEnergy = this.actor.psionics?.activeEnergy ?? "fire";
    context.psionics.activeEnergyTypes = pf1.config.psionics.activeEnergyTypes;

    // Apply filters to manifester sections (similar to how PF1e handles spellbooks)
    for (const [manifesterId, manifester] of Object.entries(context.manifesterData ?? {})) {
      if (!manifester.sections) continue;

      const categoryKey = `manifester-${manifesterId}`;
      const filterSet = this._filters.sections[categoryKey];

      if (!filterSet) continue;

      // Apply filters to each section
      for (const section of manifester.sections) {
        if (!section) continue;
        this._filterSection({ key: categoryKey }, section, filterSet);
      }
    }

    // Add powers with showInCombat flag to combat tab
    addPowersToCombatTab(this, context);
  }, "WRAPPER");

  // Track the currently active tab
  libWrapper.register(MODULE_ID, "pf1.applications.actor.ActorSheetPF.prototype._onChangeTab", function (event, tabs, active) {
    this._activeTab = active;
  }, "LISTENER");

  // Handle manifester concentration/CL drags
  libWrapper.register(MODULE_ID, "pf1.applications.actor.ActorSheetPF.prototype._onDragMiscStart", function (wrapped, event, type, subType) {
    // Only handle concentration and CL from manifesters
    if (type === "concentration" || type === "cl") {
      const elem = event.currentTarget;
      const manifesterGroup = elem.closest(".tab.manifester-group");

      if (manifesterGroup) {
        // This is from a manifester, not a spellbook
        // Create the result object matching PF1e's format exactly
        const result = {
          type,
          uuid: this.actor.uuid,
          bookId: manifesterGroup.dataset.tab, // Get bookId from manifester-group
        };

        // Set the drag data directly (same as PF1e does at the end)
        event.dataTransfer.setData("text/plain", JSON.stringify(result));
        return; // Don't call wrapped, we've handled it completely
      }
    }

    // For spellbooks and all other cases, use PF1e's default handler
    return wrapped(event, type, subType);
  }, "MIXED");

  // Handle drag and drop for powers. Default the power's manifester to the
  // active manifester tab tag; fall back to the first tag in the collection.
  libWrapper.register(MODULE_ID, "pf1.applications.actor.ActorSheetPF.prototype._alterDropItemData", async function (wrapped, data, source) {
      wrapped(data, source);
      if (data.type === `${MODULE_ID}.power`) {
          const manifesters = this.actor.getFlag(MODULE_ID, "manifesters") ?? {};
          const tags = Object.keys(manifesters);
          if (tags.length === 0) {
              ui.notifications.warn(game.i18n.localize("PF1-Psionics.Manifesters.NoBookForDrop"));
              data.system.manifester = "";
              return;
          }
          const activeTag = this._tabs.find((t) => t.group === "manifesters")?.active;
          data.system.manifester = (activeTag && manifesters[activeTag]) ? activeTag : tags[0];
      }
  }, "WRAPPER");
}

function adjustActiveTab(app) {
  // If we saved an active tab name, re-activate it.
  if (app._activeTab === "manifester") {
    app.activateTab(app._activeTab);
  }
}

/**
 * Inject power points display into combat tab header and update power item displays
 *
 * This function modifies the rendered HTML because:
 * 1. The PF1e combat template doesn't support custom header content natively
 * 2. We need to replace the generic item-controls area with our power points display
 * 3. We need to replace the generic charges display with PP cost per item
 *
 * Shows "Available / Maximum" where available = current + temporary power points.
 * This is a read-only display since available is a calculated property.
 *
 * @param {ActorSheetPF} app - The actor sheet app
 * @param {HTMLElement} html - The rendered HTML
 * @param {object} data - The template context
 */
function injectPowerPointsIntoCombatTab(app, html, data) {
  // Find the power section header in the combat tab
  const powerHeader = html.querySelector(".attacks-power");
  if (!powerHeader) return;

  // Get power points data
  const powerPoints = data.psionics?.powerPoints;
  if (!powerPoints || !powerPoints.inUse) return;

  // Create power points display element for the header
  const ppDisplay = document.createElement("div");
  ppDisplay.classList.add("power-points-display");
  ppDisplay.textContent = `${powerPoints.available} / ${powerPoints.maximum}`;

  // Replace the item-controls area with power points display
  // (The + button was already suppressed by setting interface.create = false in addPowersToCombatTab)
  const itemControls = powerHeader.querySelector(".item-controls");
  if (itemControls) {
    itemControls.replaceChildren(ppDisplay);
  }

  // Note: Available PP is read-only (calculated from current + temporary)
  // Users edit current/temporary PP in the Psionics tab

  // Update each power item in combat tab to show base PP cost instead of charges
  // This uses the data prepared in addPowersToCombatTab
  const combatTab = html.querySelector(".tab[data-tab='combat']");
  if (!combatTab) return;
  for (const itemEl of combatTab.querySelectorAll(".item-list[data-list='power'] .item[data-item-id]")) {
    const itemId = itemEl.dataset.itemId;
    // Get the prepared item from context.items which has basePPCost calculated
    const item = data.items.find(i => i.id === itemId);
    if (!item || !item.showPPCost) continue;

    // Update the charges display to show base cost
    const usesDiv = itemEl.querySelector(".item-detail.item-uses");
    if (usesDiv) {
      usesDiv.replaceChildren();
      const costSpan = document.createElement("span");
      costSpan.classList.add("base-cost");
      costSpan.textContent = `${item.basePPCost} PP`;
      usesDiv.append(costSpan);
    }
  }
}

function injectSettings(app, html, data) {
  injectPsionicsDiv(app, html);
  injectManifesterCheckboxes(app, html, data);
}

function injectPsionicsDiv(app, html) {
  const controls = html.querySelector(".settings");
  if (!controls) return;
  const div = document.createElement("div");
  div.classList.add("pf1-psionics-div");
  const h2 = document.createElement("h2");
  h2.innerText = game.i18n.localize("PF1-Psionics.TabName");
  div.append(h2);
  if (controls.children.length > 1) {
    controls.insertBefore(div, controls.children[controls.children.length - 1]);
  } else {
    controls.append(div);
  }
  const formGroup = document.createElement("div");
  formGroup.classList.add("form-group", "stacked");
  div.append(formGroup);
}

function getManifesterName(actor, tag, manifester) {
  if (manifester.name) return manifester.name;
  if (tag === "_hd" || !tag) return game.i18n.localize("PF1-Psionics.Manifesters.Spelllike");
  const cls = actor.itemTypes.class?.find((c) => c.system?.tag === tag);
  if (cls) return cls.name;
  if (manifester._lastTag) return manifester._lastTag;
  return tag || game.i18n.localize("PF1-Psionics.UnknownClass");
}

function injectManifesterCheckboxes(app, html, data) {
  const controls = html.querySelector(".pf1-psionics-div .stacked");
  if (!controls) return;
  const actor = data.actor;
  const manifesters = actor.getFlag(MODULE_ID, "manifesters") ?? {};

  const list = document.createElement("div");
  list.classList.add("pf1-psionics-manifester-list");

  for (const [tag, manifester] of Object.entries(manifesters)) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.classList.add("pf1-psionics-remove-manifester");
    btn.title = game.i18n.localize("PF1-Psionics.Manifesters.RemoveManifester");
    const label = document.createElement("span");
    label.classList.add("label");
    label.textContent = getManifesterName(actor, tag, manifester);
    const icon = document.createElement("i");
    icon.classList.add("fas", "fa-trash");
    btn.append(label, icon);
    btn.addEventListener("click", () => onRemoveManifester(actor, tag, manifester));
    list.append(btn);
  }

  if (list.children.length) controls.append(list);

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.classList.add("pf1-psionics-add-manifester");
  addBtn.innerHTML = `<i class="fas fa-plus"></i> ${game.i18n.localize("PF1-Psionics.Manifesters.AddManifester")}`;
  addBtn.addEventListener("click", () => onAddManifester(actor));
  controls.append(addBtn);
}

async function onRemoveManifester(actor, tag, manifester) {
  const name = getManifesterName(actor, tag, manifester);
  const powerCount = findOrphanedPowers(actor, tag).length;
  const powerMsg = powerCount > 0
    ? `<p>${game.i18n.format("PF1-Psionics.Manifesters.DeleteWarning", {count: powerCount})}</p>`
    : "";
  const className = (tag === "_hd" || !tag)
    ? game.i18n.localize("PF1-Psionics.Manifesters.HitDice")
    : (actor.itemTypes.class?.find((c) => c.system?.tag === tag)?.name ?? tag);
  const confirmed = await foundry.applications.api.DialogV2.confirm({
    window: {title: game.i18n.localize("PF1-Psionics.Manifesters.RemoveManifester")},
    content: `<p>${game.i18n.format("PF1-Psionics.Manifesters.ConfirmRemovalBody", {class: className, manifester: name})}</p>${powerMsg}`,
    rejectClose: false,
  });
  if (!confirmed) return;
  await removeLinkedRecord(actor, tag);
}

async function onAddManifester(actor) {
  const collection = getCollection(actor);
  const existingTags = new Set(Object.keys(collection.manifesters));

  // Offer class tags not yet in use, plus "_hd" if not present.
  const classOptions = (actor.itemTypes.class ?? [])
    .filter((c) => c.system?.tag && !existingTags.has(c.system.tag))
    .map((c) => `<option value="${c.system.tag}">${c.name}</option>`);
  if (!existingTags.has("_hd")) {
    classOptions.unshift(`<option value="_hd">${game.i18n.localize("PF1-Psionics.Manifesters.HitDice")}</option>`);
  }
  if (classOptions.length === 0) {
    ui.notifications.warn(game.i18n.localize("PF1-Psionics.Manifesters.NoEligibleClass"));
    return;
  }
  const abilityOptions = ["str", "dex", "con", "int", "wis", "cha"]
    .map((a) => `<option value="${a}">${game.i18n.localize(`PF1.AbilityShort${a.charAt(0).toUpperCase() + a.slice(1)}`)}</option>`).join("");
  const progressionOptions = ["high", "med", "low"]
    .map((p) => `<option value="${p}">${game.i18n.localize(`PF1-Psionics.Progression.${p}`)}</option>`).join("");

  const labelClass = game.i18n.localize("PF1-Psionics.ManifestingClass");
  const labelAbility = game.i18n.localize("PF1-Psionics.ManifestingAbility");
  const labelProgression = game.i18n.localize("PF1-Psionics.Manifesters.Progression");
  const labelCantrips = game.i18n.localize("PF1-Psionics.Manifesters.HasCantrips");
  const labelName = game.i18n.localize("PF1-Psionics.Manifesters.NameOptional");

  const result = await foundry.applications.api.DialogV2.wait({
    window: {title: game.i18n.localize("PF1-Psionics.Manifesters.AddManifester")},
    content: `
      <div class="form-group"><label>${labelClass}</label><select name="tag">${classOptions.join("")}</select></div>
      <div class="form-group"><label>${labelAbility}</label><select name="ability">${abilityOptions}</select></div>
      <div class="form-group"><label>${labelProgression}</label><select name="casterType">${progressionOptions}</select></div>
      <div class="form-group"><label>${labelCantrips}</label><input type="checkbox" name="hasCantrips" checked/></div>
      <div class="form-group"><label>${labelName}</label><input type="text" name="name"/></div>
    `,
    buttons: [
      {action: "ok", label: game.i18n.localize("PF1-Psionics.Manifesters.AddManifester"), default: true,
        callback: (_event, button) => {
          const form = button.form;
          return {
            tag: form.elements.tag?.value ?? "",
            ability: form.elements.ability?.value ?? "int",
            casterType: form.elements.casterType?.value ?? "high",
            hasCantrips: form.elements.hasCantrips?.checked ?? false,
            name: form.elements.name?.value ?? "",
          };
        }},
      {action: "cancel", label: game.i18n.localize("Cancel")},
    ],
    rejectClose: false,
  });
  if (!result || result === "cancel" || !result.tag) return;

  await collection.create(result.tag, {
    source: "manual",
    ability: result.ability ?? "int",
    casterType: result.casterType ?? "high",
    hasCantrips: !!result.hasCantrips,
    name: result.name ?? "",
  });
}

async function injectPsionicsTab(app, html, data) {
  const manifesters = data.actor.getFlag(MODULE_ID, "manifesters") ?? {};
  if (Object.keys(manifesters).length > 0) {
    const tabSelector = html.querySelector("a[data-tab=skills]");
    const psionicsTab = document.createElement("a");
    psionicsTab.classList.add("item");
    psionicsTab.dataset["tab"] = "manifester";
    psionicsTab.dataset["group"] = "primary";
    psionicsTab.innerHTML = game.i18n.localize("PF1-Psionics.TabName");
    tabSelector?.after(psionicsTab);

    const psionicsBody = await foundry.applications.handlebars.renderTemplate("modules/pf1-psionics/templates/actor/actor-manifester-front.hbs", data);
    const bodySelector = html.querySelector("div.tab[data-tab=skills]");
    bodySelector?.insertAdjacentHTML("afterend", psionicsBody);

    var tab = app._tabs.find((element) => element.group == "manifesters");
    if (!tab) {
      tab = new foundry.applications.ux.Tabs({
        navSelector: "nav.tabs[data-group='manifesters']",
        contentSelector: "section.manifesters-body",
        initial: "primary",
        group: "manifesters",
      });
    }
    tab.bind(html);
    app._tabs.push(tab);

    injectEventListeners(app, html, data);
  }
}

function onRollConcentration(event) {
  event.preventDefault();

  const manifesterKey = event.currentTarget.closest(".manifester-group").dataset.tab;
  this.actor.rollConcentration(manifesterKey, { token: this.token, isPsionic: true });
}

function onRollCL(event) {
  event.preventDefault();

  const manifesterKey = event.currentTarget.closest(".manifester-group").dataset.tab;
  this.actor.rollCL(manifesterKey, { token: this.token, isPsionic: true });
}

function onToggleManifesterConfig(event) {
  event.preventDefault();
  const bookId = event.currentTarget.dataset.bookId;
  const details = event.currentTarget.closest(".spellbook-configuration")?.querySelector(`details.manifester-config-collapse[data-book-id="${bookId}"]`);
  if (details) details.open = !details.open;
}

function onItemCreate(event) {
  const type = `${MODULE_ID}.power`;
  const actor = this.actor;
  const element = event.currentTarget;
  const dataset = element.dataset;
  const baseName = game.i18n.localize("PF1-Psionics.Powers.NewPower");
  const n = actor.items.filter(i => i.type === type && i.name.startsWith(baseName)).length;
  const name = n ? `${baseName} (${n})` : baseName;
  const powerData = {
    name: name,
    type: type,
    system: {
      level: parseInt(dataset.level),
      manifester: dataset.book,
    }
  };
  PowerItem.create(powerData, { parent: actor, renderSheet: true });
}

async function onBrowsePowers(event) {
  event.preventDefault();

  // Get the browser instance
  const browser = pf1.applications.compendiums.psionicPowers;
  if (!browser) {
    ui.notifications.warn("Psionic Power Browser not available.");
    return;
  }

  // Get filter data from the element
  const element = event.currentTarget;
  const level = element.dataset.level;
  const bookId = element.dataset.book;

  // Build filter object
  const filters = {};

  // Add level filter if available
  if (level !== undefined && level !== null) {
    filters.level = [String(level)];
  }

  // Add class filter if we have a manifester book
  if (bookId && this.actor) {
    const manifesterData = this.actor.getFlag(MODULE_ID, `manifesters.${bookId}`);
    const cls = manifesterData?.class?.itemId ? this.actor.items.get(manifesterData.class.itemId) : null;
    const tag = cls?.system?.tag ?? manifesterData?._lastTag;
    if (tag) {
      filters.class = [tag];
    }
  }

  // Apply filters and open browser
  browser._queueFilters(filters);
  await browser.render(true, { focus: true });
}

function injectEventListeners(app, html, _data) {
  const psionicsTabBody = html.querySelector("div.tab[data-tab=manifester]");
  if (!psionicsTabBody) return;

  for (const el of psionicsTabBody.querySelectorAll("span.text-box.direct")) {
    el.addEventListener("click", (event) => {
      app._onSpanTextInput(event, app._adjustActorPropertyBySpan.bind(app));
    });
  }

  const manifestersBodyElement = psionicsTabBody.querySelector(".manifesters-body");
  if (!manifestersBodyElement) return;

  const bindClick = (selector, handler) => {
    for (const el of manifestersBodyElement.querySelectorAll(selector)) {
      el.addEventListener("click", handler);
    }
  };

  bindClick(".spellcasting-concentration.rollable", onRollConcentration.bind(app));
  bindClick(".spellcasting-cl.rollable", onRollCL.bind(app));
  bindClick("a.toggle-manifester-config", onToggleManifesterConfig);

  // Activate Item Filters
  const filterLists = manifestersBodyElement.querySelectorAll(".filter-list");
  filterLists.forEach((el, i) => app._initializeFilterItemList(i, el));
  for (const list of filterLists) {
    list.addEventListener("click", (event) => {
      if (event.target.closest(".filter-rule")) app._onToggleFilter(event);
    });
  }

  // Search boxes
  for (const sb of manifestersBodyElement.querySelectorAll(".search-input")) {
    const onChange = app._searchFilterChange.bind(app);
    sb.addEventListener("change", onChange);
    sb.addEventListener("input", onChange);
    const onComposition = app._searchFilterCompositioning.bind(app);
    sb.addEventListener("compositionstart", onComposition);
    sb.addEventListener("compositionend", onComposition);
    app.searchRefresh = true;
    // Filter tabs on followup refreshes
    if (sb.value.length > 0) onChange({ currentTarget: sb, target: sb });
  }

  // Create new Power
  bindClick(".item-create", onItemCreate.bind(app));
  // Browse Powers compendium
  bindClick("a[data-action='browse']", onBrowsePowers.bind(app));
  // Expand Power with summary
  bindClick(".item .item-name", (event) => app._onItemSummary(event));
  // Post Power to chat
  bindClick(".item .item-image", (event) => app._onItemCard(event));
  // Item Action control
  bindClick(".item-actions a.item-action", app._itemActivationControl.bind(app));
  // Power Edit/Duplicate/Delete
  bindClick(".item-edit", app._onItemEdit.bind(app));
  bindClick(".item-duplicate", app._duplicateItem.bind(app));
  bindClick(".item-delete", app._onItemDelete.bind(app));

  // Create surgical drag-only handlers for manifester elements
  // We create minimal DragDrop instances bound only to specific selectors
  // This prevents drop handler duplication while maintaining drag functionality
  const manifesterDragDropConfig = [
    { dragSelector: ".item[data-item-id]" },
    { dragSelector: ".spellcasting-concentration[data-drag]" },
    { dragSelector: ".spellcasting-cl" }
  ];

  manifesterDragDropConfig.forEach(config => {
    const dragDrop = new DragDrop({
      dragSelector: config.dragSelector,
      dropSelector: null,  // No drop handling at this level
      permissions: {
        dragstart: () => true,
        drop: () => false  // Prevent drop handling
      },
      callbacks: {
        dragstart: app._onDragStart.bind(app)
      }
    });
    dragDrop.bind(manifestersBodyElement);
  });
}

/**
 * Add powers marked with showInCombat to the combat tab
 * @param {ActorSheetPF} sheet - The actor sheet
 * @param {object} context - The template context
 */
function addPowersToCombatTab(sheet, context) {
  // Get the attacks array (combat sections)
  const attacks = context.attacks;
  if (!attacks) return;

  // Find or create the power section
  let powerSection = attacks.find(s => s.id === "power");

  if (!powerSection) {
    // Create the power section
    powerSection = {
      id: "power",
      label: game.i18n.localize("PF1-Psionics.Powers.Plural"),
      hideEmpty: true,
      sort: 8500, // Place after spells (8000) but before equipment (10500)
      items: [],
      // Add power points info for the header
      powerPoints: context.psionics?.powerPoints,
      // Mark this section as needing special interface handling
      interface: {
        create: false // No + button for powers in combat tab
      }
    };
    attacks.push(powerSection);
    // Re-sort the sections
    attacks.sort((a, b) => a.sort - b.sort);
  } else {
    // Update power points info if section already exists
    powerSection.powerPoints = context.psionics?.powerPoints;
  }

  // Filter powers with showInCombat flag
  const powers = context.items.filter(i =>
    i.type === `${MODULE_ID}.power` && i.document.system.showInCombat
  );

  // Modify power items to show base PP cost instead of charges
  powers.forEach(power => {
    // Store the base PP cost for display
    power.basePPCost = power.labels?.chargeCost ?? 0;
    // Mark that this item should show PP cost instead of charges
    power.showPPCost = true;
  });

  // Add powers to the section
  powerSection.items = powers;
}

function prepareManifesters(sheet, context) {
  const powers = context.items.filter((item) => item.type === `${MODULE_ID}.power`);
  const collection = getCollection(sheet.actor);

  const manifesters = Object.entries(collection.manifesters).map(([tag, model]) => {
    // Snapshot derived + source data into a plain template-friendly object.
    const manifester = {
      ...model.toObject(),
      cl: { ...(model.cl ?? {}) },
      concentration: { ...(model.concentration ?? {}) },
      powerPoints: { ...(model.powerPoints ?? {}) },
      range: model.range,
    };
    const manifesterPowers = powers.filter((obj) => obj.manifester === tag);
    manifester.sections = prepareManifesterPowerLevels(context, tag, manifester, manifesterPowers);
    manifester.rollData = context.rollData.psionics?.[tag];
    manifester.label = getManifesterName(sheet.actor, tag, manifester);
    manifester.classLabel = (tag === "_hd" || !tag)
      ? null
      : (sheet.actor.itemTypes.class?.find((c) => c.system?.tag === tag)?.name ?? manifester._lastTag ?? tag);
    return [tag, manifester];
  });
  const isManifester = manifesters.length > 0;

  context.manifesterData = Object.fromEntries(manifesters);
  context.usesAnyManifester = isManifester;

  if (isManifester) {
    context.choices ??= {};
    context.choices.casterProgression = Object.fromEntries(
      Object.entries(pf1.config.caster.progression).map(([key, data]) => [key, data.label])
    );
    context.choices.casterPreparation = Object.fromEntries(
      Object.entries(pf1.config.caster.type).map(([key, data]) => [key, data.label])
    );
  }
}

/**
 * Insert a power into the manifester object when rendering the character sheet
 *
 * @internal
 * @param {object} data - The Actor data being prepared
 * @param {string} manifesterId - The key of the manifester being prepared
 * @param {object} manifester - The manifester data being prepared
 * @param {Array} powers - The power data being prepared
 * @returns {object} - Manifester data
 */
function prepareManifesterPowerLevels(data, manifesterId, manifester, powers) {
  if (!manifester) return;

  const minPowerLevel = manifester.hasCantrips ? 0 : 1;
  const maxPowerLevel = (() => {
    let casterTypeMax = 9;
    if (manifester.casterType === "med") casterTypeMax = 6;
    else if (manifester.casterType === "low") casterTypeMax = 4;
    if (manifester.autoMaxPowerLevel) {
      const cl = manifester.cl?.classLevelTotal ?? 0;
      let divisor = 2;
      if (manifester.casterType === "med") divisor = 3;
      else if (manifester.casterType === "low") divisor = 4;
      return Math.clamp(1 + Math.floor((cl - 1) / divisor), minPowerLevel, casterTypeMax);
    }
    return casterTypeMax;
  })();

  /** @type {AbilityScoreData} */
  const manifesterAbility = data.actor.system.abilities[manifester.ability];
  const maxLevelByAblScore = (manifesterAbility?.total ?? 0) - 10;
  const maxPowerPoints = manifester.powerPoints.max ?? 0;

  // Reduce spells to the nested manifester structure
  const manifesterLevels = [];
  for (let level = 0; level < 10; level++) {
    const lowAbilityScore = level > maxLevelByAblScore;
    const valid = (level * 2) - 1 <= maxPowerPoints;
    const hasIssues = valid && lowAbilityScore;

    manifesterLevels[level] = {
      id: `level-${level}`,
      level,
      label: game.i18n.localize(`PF1-Psionics.Powers.Levels.${level}`),
      valid,
      items: [],
      canPrepare: data.actor.type === "character",
      hasIssues,
      lowAbilityScore,
    };
  }

  // Add arbitrary level for collecting invalid spells
  const invalidLevelData = {
    id: "level-invalid",
    level: 99,
    label: game.i18n.localize("PF1.Unknown"),
    valid: false,
    items: [],
  };

  // Sort spells into their respective levels
  for (const power of powers) {
    const lvl = power.level ?? minPowerLevel;
    const levelData = manifesterLevels[lvl] ?? invalidLevelData;

    levelData.items.push(power);
  }

  // Mark cantrips as invalid if it shouldn't exist
  if (!manifester.hasCantrips) manifesterLevels[0].valid = false;

  // Append invalid level if it has anything
  if (invalidLevelData.items.length) manifesterLevels.push(invalidLevelData);

  // Return only levels with something
  return manifesterLevels.filter((levelData) => {
    if (!levelData) return false;
    if (levelData.items.length > 0) return true;
    const { level } = levelData;
    return level <= maxPowerLevel && level >= minPowerLevel;
  });
}

// Register hooks
Hooks.on("renderActorSheetPF", renderActorHook);

Hooks.once("libWrapper.Ready", injectActorSheetPF);
