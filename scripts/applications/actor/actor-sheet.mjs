import { MODULE_ID } from "../../_module.mjs";
import { PowerItem } from "../../documents/_module.mjs";

async function renderActorHook(app, html, data) {
  const actor = data.actor;
  if (actor.flags?.core?.sheetClass !== "pf1alt.AltActorSheetPFCharacter") {
    // Inject Settings
    injectSettings(app, html, data);
    // Inject Psionics Manifesters Tab
    await injectPsionicsTab(app, html, data);
    adjustActiveTab(app);
  }
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

    // Apply filters to manifester sections (similar to how PF1e handles spellbooks)
    for (const [manifesterId, manifester] of Object.entries(context.manifesterData ?? {})) {
      if (!manifester.inUse || !manifester.sections) continue;

      const categoryKey = `manifester-${manifesterId}`;
      const filterSet = this._filters.sections[categoryKey];

      // Debug logging
      // console.log(`PF1-Psionics | Filtering manifester "${manifesterId}":`, {
      //   categoryKey,
      //   filterSet: filterSet ? Array.from(filterSet) : undefined,
      //   sectionIds: manifester.sections.map(s => s?.id)
      // });

      if (!filterSet) continue;

      // Apply filters to each section
      for (const section of manifester.sections) {
        if (!section) continue;
        this._filterSection({ key: categoryKey }, section, filterSet);
      }
    }
  }, "WRAPPER");

  // Prevent duplicate drops by tracking drop events
  // When drop handlers are bound at multiple levels, the same drop event
  // can be processed twice. We track recent drop events and skip duplicates.
  const processingDrops = new Map(); // key: timestamp window, prevents processing same drop twice

  libWrapper.register(MODULE_ID, "pf1.applications.actor.ActorSheetPF.prototype._onDropItem", async function (wrapped, event, data) {
    // Create a unique identifier for this drop event
    const eventTime = Date.now();

    // For powers, check if we've recently processed a drop
    if (data.type === `${MODULE_ID}.power`) {
      const dropKey = Math.floor(eventTime / 50); // 50ms time window

      if (processingDrops.has(dropKey)) {
        // This looks like a duplicate drop event from double-bound handlers
        console.log(`PF1-Psionics | Prevented duplicate _onDropItem for power`);
        return; // Skip processing
      }

      // Mark this drop as being processed
      processingDrops.set(dropKey, true);

      // Clean up old entries periodically
      if (Math.random() < 0.1) { // 10% of calls
        for (const [key] of processingDrops.entries()) {
          if (eventTime - (key * 50) > 500) { // Older than 500ms
            processingDrops.delete(key);
          }
        }
      }
    }

    // Call the original handler
    return wrapped(event, data);
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

  // Handle drag and drop for powers
  libWrapper.register(MODULE_ID, "pf1.applications.actor.ActorSheetPF.prototype._alterDropItemData", async function (wrapped, data, source) {
      wrapped(data, source);
      // Set manifester to currently viewed one when dropping a power
      if (data.type === `${MODULE_ID}.power`) {
          data.system.manifester = this._tabs.find((t) => t.group === "manifesters")?.active || "primary";
      }
  }, "WRAPPER");
}

function adjustActiveTab(app) {
  // If we saved an active tab name, re-activate it.
  if (app._activeTab === "manifester") {
    app.activateTab(app._activeTab);
  }
}

function injectSettings(app, html, data) {
  injectPsionicsDiv(app, html);
  injectManifesterCheckboxes(app, html, data);
}

function injectPsionicsDiv(app, html) {
  const controls = html.find(".settings")[0];
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

function getManifesterName(bookId, manifester) {
  if (manifester.label) {
    return manifester.label;
  }
  return game.i18n.localize(`PF1-Psionics.Manifesters.${bookId.capitalize()}`);
}

function injectManifesterCheckboxes(app, html, data) {
  const controls = html.find(".pf1-psionics-div .stacked")[0];
  for (const [bookId, manifester] of Object.entries(data.actor.getFlag(MODULE_ID, "manifesters"))) {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = `flags.${MODULE_ID}.manifesters.${bookId}.inUse`;
    checkbox.id = checkbox.name;
    if (manifester.inUse)
      checkbox.checked = true;
    const label = document.createElement("label");
    label.append(checkbox);
    label.append(getManifesterName(bookId, manifester));
    label.classList.add("checkbox");
    controls.append(label);
  }
}

async function injectPsionicsTab(app, html, data) {
  if (Object.values(data.manifesterData).some((manifester) => manifester.inUse)) {
    const tabSelector = html.find("a[data-tab=skills]");
    const psionicsTab = document.createElement("a");
    psionicsTab.classList.add("item");
    psionicsTab.dataset["tab"] = "manifester";
    psionicsTab.dataset["group"] = "primary";
    psionicsTab.innerHTML = game.i18n.localize("PF1-Psionics.TabName");
    tabSelector.after(psionicsTab);

    const psionicsBody = await foundry.applications.handlebars.renderTemplate("modules/pf1-psionics/templates/actor/actor-manifester-front.hbs", data);
    const bodySelector = html.find("div.tab[data-tab=skills]");
    bodySelector.after(psionicsBody);

    var tab = app._tabs.find((element) => element.group == "manifesters");
    if (!tab) {
      tab = new foundry.applications.ux.Tabs({
        navSelector: "nav.tabs[data-group='manifesters']",
        contentSelector: "section.manifesters-body",
        initial: "primary",
        group: "manifesters",
      });
    }
    tab.bind(html[0]);
    app._tabs.push(tab);

    injectEventListeners(app, html, data);
  }
}

function onRollConcentration(event) {
  event.preventDefault();

  const manifesterKey = $(event.currentTarget).closest(".manifester-group").data("tab");
  this.actor.rollConcentration(manifesterKey, { token: this.token, isPsionic: true });
}

function onRollCL(event) {
  event.preventDefault();

  const manifesterKey = $(event.currentTarget).closest(".manifester-group").data("tab");
  this.actor.rollCL(manifesterKey, { token: this.token, isPsionic: true });
}

function onToggleConfig(event) {
  const element = event.currentTarget;
  const dataset = element.dataset;
  const manifesters = this.actor.getFlag(MODULE_ID, "manifesters");
  const currentToggle = manifesters[dataset.manifester].showConfig;
  const configFlag = { [`flags.${MODULE_ID}.manifesters.${dataset.manifester}.showConfig`]: !currentToggle };
  this.actor.update(configFlag);
}

function onItemCreate(event) {
  const type = `${MODULE_ID}.power`;
  const actor = this.actor;
  const element = event.currentTarget;
  // const [categoryId, sectionId] = element.dataset.create?.split(".") ?? [];
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
    filters.psionicLevel = [String(level)];
  }

  // Add class filter if we have a manifester book
  if (bookId && this.actor) {
    const manifesterData = this.actor.getFlag(MODULE_ID, `manifesters.${bookId}`);
    if (manifesterData?.class) {
      filters.psionicClass = [manifesterData.class];
    }
  }

  // Apply filters and open browser
  browser._queueFilters(filters);
  await browser.render(true, { focus: true });
}

function injectEventListeners(app, html, _data) {
  const psionicsTabBody = html.find("div.tab[data-tab=manifester]");
  psionicsTabBody.find("span.text-box.direct").on("click", (event) => {
    app._onSpanTextInput(event, app._adjustActorPropertyBySpan.bind(app));
  });

  const manifestersBodyElement = psionicsTabBody.find(".manifesters-body");

  manifestersBodyElement.find(".spellcasting-concentration.rollable").click(onRollConcentration.bind(app));
  manifestersBodyElement.find(".spellcasting-cl.rollable").click(onRollCL.bind(app));

  // Bind Events
  // manifestersBodyElement.find("a.hide-show").click(app._hideShowElement.bind(app));
  manifestersBodyElement.find("a.toggle-config").click(onToggleConfig.bind(app));

  // Activate Item Filters
  const filterLists = manifestersBodyElement.find(".filter-list");
  filterLists.each(app._initializeFilterItemList.bind(app));
  filterLists.on("click", ".filter-rule", app._onToggleFilter.bind(app));
  // Search boxes
  {
    const sb = manifestersBodyElement.find(".search-input");
    sb.on("change input", app._searchFilterChange.bind(app));
    sb.on("compositionstart compositionend", app._searchFilterCompositioning.bind(app)); // for IME
    app.searchRefresh = true;
    // Filter tabs on followup refreshes
    sb.each(function () {
      if (this.value.length > 0) $(this).change();
    });
  }

  // Create new Power
  manifestersBodyElement.find(".item-create").click(onItemCreate.bind(app));
  // Browse Powers compendium
  manifestersBodyElement.find("a[data-action='browse']").click(onBrowsePowers.bind(app));
  // Expand Power with summary
  manifestersBodyElement.find(".item .item-name").click((event) => app._onItemSummary(event));
  // Post Power to chat
  manifestersBodyElement.find(".item .item-image").click((event) => app._onItemCard(event));
  // Item Action control
  manifestersBodyElement.find(".item-actions a.item-action").click(app._itemActivationControl.bind(app));
  // Power Edit/Duplicate/Delete
  manifestersBodyElement.find(".item-edit").click(app._onItemEdit.bind(app));
  manifestersBodyElement.find(".item-duplicate").click(app._duplicateItem.bind(app));
  manifestersBodyElement.find(".item-delete").click(app._onItemDelete.bind(app));

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
    dragDrop.bind(manifestersBodyElement[0]);
  });
}

function prepareManifesters(sheet, context) {
  const powers = context.items.filter((item) => item.type === `${MODULE_ID}.power`);

  const manifesters = Object.entries(context.actor.getFlag(MODULE_ID, "manifesters"))
    .map(([manifesterId, manifesterData]) => {
      // Create a shallow copy to avoid mutating the original flag data
      const manifester = { ...manifesterData };
      if (!manifester.inUse) return [manifesterId, manifester];
      const manifesterPowers = powers.filter((obj) => obj.manifester === manifesterId);
      manifester.sections = prepareManifesterPowerLevels(context, manifesterId, manifester, manifesterPowers);
      manifester.rollData = context.rollData.psionics[manifesterId];
      manifester.classId = manifester.class;
      manifester.class = context.rollData.classes[manifester.class];
      return [manifesterId, manifester];
    });
  const isManifester = manifesters.some(([_manifesterId, manifester]) => manifester.inUse);

  context.manifesterData = Object.fromEntries(manifesters);
  context.usesAnyManifester = isManifester;

  // Class selection list, only used by manifesters
  if (isManifester) {
    const lang = game.settings.get("core", "language");
    const allClasses = sheet.actor.itemTypes.class
      .map((cls) => [cls.system.tag, cls.name])
      .sort(([_0, a], [_1, b]) => a.localeCompare(b, lang));
    allClasses.unshift(["_hd", game.i18n.localize("PF1.HitDie")]);
    context.classList = Object.fromEntries(allClasses);
  }
  if (isManifester) {
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

