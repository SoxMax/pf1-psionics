import { MODULE_ID } from "../../_module.mjs";
import { PowerItem } from "../../documents/_module.mjs";

export async function renderActorHook(app, html, data) {
  const actor = data.actor;
  if (actor.flags?.core?.sheetClass !== "pf1alt.AltActorSheetPFCharacter") {
    // Inject Settings
    injectSettings(app, html, data);
    // Inject Psionics Manifestors Tab
    await injectPsionicsTab(app, html, data);
    adjustActiveTab(app);
  }
}

export function injectActorSheetPF() {
  libWrapper.register(MODULE_ID, "pf1.applications.actor.ActorSheetPF.prototype._prepareItems", function (wrapped, context) {
    wrapped(context);
    context.psionics = {};
    prepareManifestors(this, context);
    context.psionics.powerPoints = this.actor.getFlag(MODULE_ID, "powerPoints");
    context.psionics.focus = this.actor.getFlag(MODULE_ID, "focus");
  }, "WRAPPER");

  // Track the currently active tab
  libWrapper.register(MODULE_ID, "pf1.applications.actor.ActorSheetPF.prototype._onChangeTab", function (event, tabs, active) {
    this._activeTab = active;
  }, "LISTENER");

  // Handle drag and drop for powers
  libWrapper.register(MODULE_ID, "pf1.applications.actor.ActorSheetPF.prototype._alterDropItemData", async function (wrapped, data, source) {
      wrapped(data, source);
      // Set manifestor to currently viewed one
      if (data.type === `${MODULE_ID}.power`) {
          data.system.manifestor = this._tabs.find((t) => t.group === "manifestors")?.active || "primary";
      }
  }, "WRAPPER");
}

function adjustActiveTab(app) {
  // If we saved an active tab name, re-activate it.
  if (app._activeTab === "manifestor") {
    app.activateTab(app._activeTab);
  }
}

function injectSettings(app, html, data) {
  injectPsionicsDiv(app, html);
  injectManifestorCheckboxes(app, html, data);
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

function getManifestorName(bookId, manifestor) {
  if (manifestor.label) {
    return manifestor.label;
  }
  return game.i18n.localize(`PF1-Psionics.Manifestors.${bookId.capitalize()}`);
}

function injectManifestorCheckboxes(app, html, data) {
  const controls = html.find(".pf1-psionics-div .stacked")[0];
  for (const [bookId, manifestor] of Object.entries(data.actor.getFlag(MODULE_ID, "manifestors"))) {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = `flags.${MODULE_ID}.manifestors.${bookId}.inUse`;
    checkbox.id = checkbox.name;
    if (manifestor.inUse)
      checkbox.checked = true;
    const label = document.createElement("label");
    label.append(checkbox);
    label.append(getManifestorName(bookId, manifestor));
    label.classList.add("checkbox");
    controls.append(label);
  }
}

async function injectPsionicsTab(app, html, data) {
  if (Object.values(data.manifestorData).some((manifestor) => manifestor.inUse)) {
    const tabSelector = html.find("a[data-tab=skills]");
    const psionicsTab = document.createElement("a");
    psionicsTab.classList.add("item");
    psionicsTab.dataset["tab"] = "manifestor";
    psionicsTab.dataset["group"] = "primary";
    psionicsTab.innerHTML = game.i18n.localize("PF1-Psionics.TabName");
    tabSelector.after(psionicsTab);

    const psionicsBody = await foundry.applications.handlebars.renderTemplate("modules/pf1-psionics/templates/actor/actor-manifestor-front.hbs", data);
    const bodySelector = html.find("div.tab[data-tab=skills]");
    bodySelector.after(psionicsBody);

    var tab = app._tabs.find((element) => element.group == "manifestors");
    if (!tab) {
      tab = new foundry.applications.ux.Tabs({
        navSelector: "nav.tabs[data-group='manifestors']",
        contentSelector: "section.manifestors-body",
        initial: "primary",
        group: "manifestors",
      });
    }
    tab.bind(html[0]);
    app._tabs.push(tab);

    injectEventListeners(app, html, data);
  }
}

function onRollConcentration(event) {
  event.preventDefault();

  const manifestorKey = $(event.currentTarget).closest(".manifestor-group").data("tab");
  this.actor.rollConcentration(manifestorKey, { token: this.token, isPsionic: true });
}

function onRollCL(event) {
  event.preventDefault();

  const manifestorKey = $(event.currentTarget).closest(".manifestor-group").data("tab");
  this.actor.rollCL(manifestorKey, { token: this.token, isPsionic: true });
}

function onToggleConfig(event) {
  const element = event.currentTarget;
  const dataset = element.dataset;
  const manifestors = this.actor.getFlag(MODULE_ID, "manifestors");
  const currentToggle = manifestors[dataset.manifestor].showConfig;
  const configFlag = { [`flags.${MODULE_ID}.manifestors.${dataset.manifestor}.showConfig`]: !currentToggle };
  this.actor.update(configFlag);
  this._forceShowPowerTab = true;
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
      manifestor: dataset.book,
    }
  };
  PowerItem.create(powerData, { parent: actor, renderSheet: true });
  this._forceShowPowerTab = true;
}

async function onBrowsePowers(event) {
  event.preventDefault();

  // Open the compendium for psionic powers
  const pack = game.packs.get("pf1-psionics.powers");
  if (!pack) {
    ui.notifications.warn(game.i18n.localize("PF1-Psionics.Error.CompendiumNotFound"));
    return;
  }

  // Open the compendium - users can drag powers from here to their character sheet
  pack.render(true);
}

function injectEventListeners(app, html, _data) {
  const psionicsTabBody = html.find("div.tab[data-tab=manifestor]");
  psionicsTabBody.find("span.text-box.direct").on("click", (event) => {
    app._onSpanTextInput(event, app._adjustActorPropertyBySpan.bind(app));
  });

  const manifestorsBodyElement = psionicsTabBody.find(".manifestors-body");

  manifestorsBodyElement.find(".spellcasting-concentration.rollable").click(onRollConcentration.bind(app));
  manifestorsBodyElement.find(".spellcasting-cl.rollable").click(onRollCL.bind(app));

  // Bind Events
  // manifestorsBodyElement.find("a.hide-show").click(app._hideShowElement.bind(app));
  manifestorsBodyElement.find("a.toggle-config").click(onToggleConfig.bind(app));

  manifestorsBodyElement.find(".item-create").click(onItemCreate.bind(app));
  manifestorsBodyElement.find(".item-edit").click(app._onItemEdit.bind(app));
  manifestorsBodyElement.find(".item-duplicate").click(app._duplicateItem.bind(app));
  manifestorsBodyElement.find(".item-delete").click(app._onItemDelete.bind(app));
  // Item Action control
  manifestorsBodyElement.find(".item-actions a.item-action").click(app._itemActivationControl.bind(app));
  // Browse powers compendium
  manifestorsBodyElement.find("a[data-action='browse']").click(onBrowsePowers.bind(app));
}

function prepareManifestors(sheet, context) {
  const powers = context.items.filter((item) => item.type === `${MODULE_ID}.power`);

  const manifestors = Object.entries(context.actor.getFlag(MODULE_ID, "manifestors"))
    .map(([manifestorId, manifestorData]) => {
      // Create a shallow copy to avoid mutating the original flag data
      const manifestor = { ...manifestorData };
      if (!manifestor.inUse) return [manifestorId, manifestor];
      const manifestorPowers = powers.filter((obj) => obj.manifestor === manifestorId);
      manifestor.sections = prepareManifestorPowerLevels(context, manifestorId, manifestor, manifestorPowers);
      manifestor.rollData = context.rollData.psionics[manifestorId];
      manifestor.classId = manifestor.class;
      manifestor.class = context.rollData.classes[manifestor.class];
      return [manifestorId, manifestor];
    });
  const isManifestor = manifestors.some(([_manifestorId, manifestor]) => manifestor.inUse);

  context.manifestorData = Object.fromEntries(manifestors);
  context.usesAnyManifestor = isManifestor;

  // Class selection list, only used by manifestors
  if (isManifestor) {
    const lang = game.settings.get("core", "language");
    const allClasses = sheet.actor.itemTypes.class
      .map((cls) => [cls.system.tag, cls.name])
      .sort(([_0, a], [_1, b]) => a.localeCompare(b, lang));
    allClasses.unshift(["_hd", game.i18n.localize("PF1.HitDie")]);
    context.classList = Object.fromEntries(allClasses);
  }
  if (isManifestor) {
    context.choices.casterProgression = Object.fromEntries(
      Object.entries(pf1.config.caster.progression).map(([key, data]) => [key, data.label])
    );
    context.choices.casterPreparation = Object.fromEntries(
      Object.entries(pf1.config.caster.type).map(([key, data]) => [key, data.label])
    );
  }
}

/**
 * Insert a power into the manifestor object when rendering the character sheet
 *
 * @internal
 * @param {object} data - The Actor data being prepared
 * @param {string} manifestorId - The key of the manifestor being prepared
 * @param {object} manifestor - The manifestor data being prepared
 * @param {Array} powers - The power data being prepared
 * @returns {object} - Manifestor data
 */
function prepareManifestorPowerLevels(data, manifestorId, manifestor, powers) {
  if (!manifestor) return;

  const minPowerLevel = manifestor.hasCantrips ? 0 : 1;
  const maxPowerLevel = (() => {
    let casterTypeMax = 9;
    if (manifestor.casterType === "med") casterTypeMax = 6;
    else if (manifestor.casterType === "low") casterTypeMax = 4;
    if (manifestor.autoMaxPowerLevel) {
      const cl = manifestor.cl?.classLevelTotal ?? 0;
      let divisor = 2;
      if (manifestor.casterType === "med") divisor = 3;
      else if (manifestor.casterType === "low") divisor = 4;
      return Math.clamp(1 + Math.floor((cl - 1) / divisor), minPowerLevel, casterTypeMax);
    }
    return casterTypeMax;
  })();

  /** @type {AbilityScoreData} */
  const manifestorAbility = data.actor.system.abilities[manifestor.ability];
  const maxLevelByAblScore = (manifestorAbility?.total ?? 0) - 10;
  const maxPowerPoints = manifestor.powerPoints.max ?? 0;

  // Reduce spells to the nested manifestor structure
  const manifestorLevels = [];
  for (let level = 0; level < 10; level++) {
    const lowAbilityScore = level > maxLevelByAblScore;
    const valid = (level * 2) - 1 <= maxPowerPoints;
    const hasIssues = valid && lowAbilityScore;

    manifestorLevels[level] = {
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
    const levelData = manifestorLevels[lvl] ?? invalidLevelData;

    levelData.items.push(power);
  }

  // Mark cantrips as invalid if it shouldn't exist
  if (!manifestor.hasCantrips) manifestorLevels[0].valid = false;

  // Append invalid level if it has anything
  if (invalidLevelData.items.length) manifestorLevels.push(invalidLevelData);

  // Return only levels with something
  return manifestorLevels.filter((levelData) => {
    if (!levelData) return false;
    if (levelData.items.length > 0) return true;
    const { level } = levelData;
    return level <= maxPowerLevel && level >= minPowerLevel;
  });
}
