import { MODULE_ID } from "../../_module.mjs";
import { PowerItem } from "../../documents/_module.mjs";

export async function renderActorHook(app, html, data) {
	const actor = data.actor;
	if (actor.flags?.core?.sheetClass !== "pf1alt.AltActorSheetPFCharacter") {
		// Inject Settings
		injectSettings(app, html, data);
		// Inject Psionics Spellbooks Tab
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
}

function adjustActiveTab(app) {
	// If we saved an active tab name, re-activate it.
	if (app._activeTab === "psibook") {
		app.activateTab(app._activeTab);
	}
}

function injectSettings(app, html, data) {
	injectPsionicsDiv(app, html);
	injectSpellbookCheckboxes(app, html, data);
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

function getSpellbookName(bookId, spellbook) {
	if (spellbook.label) {
		return spellbook.label;
	}
	return game.i18n.localize(`PF1-Psionics.Spellbooks.${bookId.capitalize()}`);
}

function injectSpellbookCheckboxes(app, html, data) {
	const controls = html.find(".pf1-psionics-div .stacked")[0];
	for (const [bookId, spellbook] of Object.entries(data.actor.getFlag(MODULE_ID, "spellbooks"))) {
		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.name = `flags.${MODULE_ID}.spellbooks.${bookId}.inUse`;
		checkbox.id = checkbox.name;
		if (spellbook.inUse)
			checkbox.checked = true;
		const label = document.createElement("label");
		label.append(checkbox);
		label.append(getSpellbookName(bookId, spellbook));
		label.classList.add("checkbox");
		controls.append(label);
	}
}

async function injectPsionicsTab(app, html, data) {
	if (Object.values(data.psibookData).some((psibook) => psibook.inUse)) {
		const tabSelector = html.find("a[data-tab=skills]");
		const psionicsTab = document.createElement("a");
		psionicsTab.classList.add("item");
		psionicsTab.dataset["tab"] = "psibook";
		psionicsTab.dataset["group"] = "primary";
		psionicsTab.innerHTML = game.i18n.localize("PF1-Psionics.TabName");
		tabSelector.after(psionicsTab);

		const psionicsBody = await foundry.applications.handlebars.renderTemplate("modules/pf1-psionics/templates/actor/actor-psibook-front.hbs", data);
		const bodySelector = html.find("div.tab[data-tab=skills]");
		bodySelector.after(psionicsBody);

		var tab = app._tabs.find((element) => element.group == "psibooks");
		if (!tab) {
			tab = new foundry.applications.ux.Tabs({
				navSelector: "nav.tabs[data-group='psibooks']",
				contentSelector: "section.psibooks-body",
				initial: "primary",
				group: "psibooks",
			});
		}
		tab.bind(html[0]);
		app._tabs.push(tab);

		injectEventListeners(app, html, data);
	}
}

function onToggleConfig(event) {
	const element = event.currentTarget;
	const dataset = element.dataset;
	const spellbooks = this.actor.getFlag(MODULE_ID, "spellbooks");
	const currentToggle = spellbooks[dataset.spellbook].showConfig;
	const configFlag = { [`flags.${MODULE_ID}.spellbooks.${dataset.spellbook}.showConfig`]: !currentToggle };
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
			spellbook: dataset.book,
		}
	};
	PowerItem.create(powerData, { parent: actor, renderSheet: true });
	this._forceShowPowerTab = true;
}

function injectEventListeners(app, html, _data) {
	const psionicsTabBody = html.find("div.tab[data-tab=psibook]");
	psionicsTabBody.find("span.text-box.direct").on("click", (event) => {
		app._onSpanTextInput(event, app._adjustActorPropertyBySpan.bind(app));
	});

	const psibooksBodyElement = psionicsTabBody.find(".psibooks-body");
	// Bind Events
	// psibooksBodyElement.find("a.hide-show").click(app._hideShowElement.bind(app));
	psibooksBodyElement.find("a.toggle-config").click(onToggleConfig.bind(app));

	psibooksBodyElement.find(".item-create").click(onItemCreate.bind(app));
	psibooksBodyElement.find(".item-edit").click(app._onItemEdit.bind(app));
	psibooksBodyElement.find(".item-delete").click(app._onItemDelete.bind(app));
	// Item Action control
	psibooksBodyElement.find(".item-actions a.item-action").click(app._itemActivationControl.bind(app));
}

function prepareManifestors(sheet, context) {
	const powers = context.items.filter((item) => item.type === `${MODULE_ID}.power`);

	const manifestors = Object.entries(context.actor.getFlag(MODULE_ID, "spellbooks"))
		.map(([manifestorId, manifestor]) => {
			if (!manifestor.inUse) return [manifestorId, manifestor];
			const manifestorPowers = powers.filter((obj) => obj.spellbook === manifestorId);
			manifestor.sections = prepareManifestorPowerLevels(context, manifestorId, manifestor, manifestorPowers);
			manifestor.rollData = context.rollData.psionics[manifestorId];
			manifestor.classId = manifestor.class;
			manifestor.class = context.rollData.classes[manifestor.class];
			return [manifestorId, manifestor];
		});
	const isManifestor = manifestors.some(([_manifestorId, manifestor]) => manifestor.inUse);

	context.psibookData = Object.fromEntries(manifestors);
	context.usesAnyPsibook = isManifestor;

	// Class selection list, only used by spellbooks
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
 * Insert a spell into the spellbook object when rendering the character sheet
 *
 * @internal
 * @param {object} data - The Actor data being prepared
 * @param {Array} powers - The spell data being prepared
 * @param {string} manifestorId - The key of the spellbook being prepared
 * @returns {object} - Spellbook data
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
	const spellbookAbility = data.actor.system.abilities[manifestor.ability];
	const maxLevelByAblScore = (spellbookAbility?.total ?? 0) - 10;
	const maxPowerPoints = manifestor.powerPoints.max ?? 0;

	// Reduce spells to the nested spellbook structure
	const spellbook = [];
	for (let level = 0; level < 10; level++) {
		const lowAbilityScore = level > maxLevelByAblScore;
		const valid = (level * 2) - 1 <= maxPowerPoints;
		const hasIssues = valid && lowAbilityScore;

		spellbook[level] = {
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
		const levelData = spellbook[lvl] ?? invalidLevelData;

		levelData.items.push(power);
	}

	// Mark cantrips as invalid if it shouldn't exist
	if (!manifestor.hasCantrips) spellbook[0].valid = false;

	// Append invalid level if it has anything
	if (invalidLevelData.items.length) spellbook.push(invalidLevelData);

	// Return only levels with something
	return spellbook.filter((levelData) => {
		if (!levelData) return false;
		if (levelData.items.length > 0) return true;
		const { level } = levelData;
		return level <= maxPowerLevel && level >= minPowerLevel;
	});
}
