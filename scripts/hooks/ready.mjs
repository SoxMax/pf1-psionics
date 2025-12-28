import { MODULE_ID } from "../_module.mjs";
import { runMigrations } from "../migrations/_module.mjs";
import { PowerPointsApi, PsionicFocusApi } from "../api/_module.mjs";
import { PowerPointsHelper, PsionicFocusHelper, PsionicsHelper } from "../helpers/_module.mjs";
import { PsionicPowerBrowser } from "../applications/_module.mjs";

async function readyHook() {
	console.log(`${MODULE_ID} | Ready`);

	// Register module API for macros and other modules
	registerModuleApi();

	// Attach psionics helper to ActorPF prototype
	attachActorHelpers();

	// Register compendium browser
	registerCompendiumBrowser();

	// Enhance @Browse enricher (after all setup hooks have completed)
	enhanceBrowseEnricher();

	// Enhance @Apply enricher to support dictionary flags
	enhanceApplyEnricher();

	await runMigrations();
}

Hooks.once("ready", readyHook);

/**
 * Register the module's public API on game.modules.get("pf1-psionics").api
 * This allows macros and other modules to access psionics functionality.
 *
 * @example
 * const api = game.modules.get("pf1-psionics").api;
 * await api.powerPoints.spend(actor, 5);
 * await api.psionicFocus.expend(actor);
 */
function registerModuleApi() {
	const module = game.modules.get(MODULE_ID);
	module.api = {
		// Static APIs for macro use
		powerPoints: PowerPointsApi,
		psionicFocus: PsionicFocusApi,

		// Export helper classes for advanced use
		PowerPointsHelper,
		PsionicFocusHelper,
		PsionicsHelper,
	};

	console.log(`${MODULE_ID} | API registered at game.modules.get("${MODULE_ID}").api`);
}

/**
 * Attach psionics helper to ActorPF prototype.
 * This allows convenient access via actor.psionics.powerPoints and actor.psionics.focus.
 *
 * Using a namespaced property (psionics) reduces the risk of collisions with
 * system properties or other modules.
 *
 * @example
 * const actor = game.actors.getName("My Psion");
 * await actor.psionics.powerPoints.spend(5);
 * if (actor.psionics.focus.isFocused) { ... }
 */
function attachActorHelpers() {
	const ActorPF = pf1.documents.actor.ActorPF;

	// Check for collision before attaching
	if ("psionics" in ActorPF.prototype) {
		console.warn(`${MODULE_ID} | Property 'psionics' already exists on ActorPF - skipping attachment. Use game.modules.get("${MODULE_ID}").api instead.`);
		return;
	}

	// Use a WeakMap to cache helpers per actor instance
	// This avoids creating a new helper on every property access
	// while ensuring helpers are garbage collected with their actors
	const helperCache = new WeakMap();

	Object.defineProperty(ActorPF.prototype, "psionics", {
		get() {
			let helper = helperCache.get(this);
			if (!helper) {
				helper = new PsionicsHelper(this);
				helperCache.set(this, helper);
			}
			return helper;
		},
		configurable: true
	});

	console.log(`${MODULE_ID} | Actor helper attached (actor.psionics)`);
}

/**
 * Register the Psionic Power Compendium Browser with PF1 system.
 *
 * Registers the browser in multiple locations:
 * - pf1.applications.compendiums.psionicPowers - Browser instance for opening
 * - pf1.applications.compendiumBrowser.psionicPowers - Browser class reference
 * - CompendiumBrowser.BROWSERS.psionicPowers - For @Browse enricher validation
 */
function registerCompendiumBrowser() {
	pf1.applications.compendiums.psionicPowers = new PsionicPowerBrowser();
	pf1.applications.compendiumBrowser.psionicPowers = PsionicPowerBrowser;
	pf1.applications.compendiumBrowser.CompendiumBrowser.BROWSERS.psionicPowers = PsionicPowerBrowser;
}

/**
 * Enhanced click handler for @Browse enricher.
 *
 * Extracts all filter parameters from the element's dataset and passes them
 * to the browser's _queueFilters method, then opens the browser.
 *
 * @param {Function} originalClick - Original click handler to fall back to
 * @param {Event} event - Click event
 * @param {HTMLElement} target - Clicked element
 */
function enhancedBrowseClick(originalClick, event, target) {
	const { category } = target.dataset;
	const browser = pf1.applications.compendiums[category];

	if (!browser) {
		// Fall back to original if browser doesn't exist
		return originalClick.call(this, event, target);
	}

	// Extract all filter parameters from dataset
	const filters = {};

	// Non-filter attributes to skip
	const skipKeys = new Set([
		"category", "handler", "tooltipClass", "tooltip",
		"name", "label", "icon", "options"
	]);

	// Map dataset keys to filter values
	for (const [key, value] of Object.entries(target.dataset)) {
		if (skipKeys.has(key)) continue;

		// Parse semicolon-separated values
		const values = value.split(";").map(v => v.trim()).filter(v => v);
		if (values.length > 0) {
			filters[key] = values;
		}
	}

	// Apply filters if any were found
	if (Object.keys(filters).length > 0) {
		browser._queueFilters(filters);
	}

	// Open the browser
	browser.render(true, { focus: true });
}

/**
 * Enhance the @Browse enricher to pass all filter parameters.
 *
 * Runs in ready hook (after all setup hooks complete) to ensure PF1's enrichers
 * are registered. Replaces the browse enricher's click handler to pass ALL filter
 * parameters (level, discipline, subdiscipline, etc.) instead of just tags.
 *
 * This is a universal fix that benefits all browsers, not just psionic powers.
 */
function enhanceBrowseEnricher() {
	// Find the browse enricher (registered by PF1 in setup)
	const browseEnricher = CONFIG.TextEditor.enrichers.find(e => e.id === "browse");

	if (!browseEnricher) {
		console.warn(`${MODULE_ID} | Could not find browse enricher to enhance`);
		return;
	}

	// Store original click handler
	const originalClick = browseEnricher.click;

	// Replace with enhanced version
	browseEnricher.click = function(event, target) {
		return enhancedBrowseClick.call(this, originalClick, event, target);
	};

	console.log(`${MODULE_ID} | @Browse enricher enhanced`);
}

/**
 * Enhanced click handler for @Apply enricher.
 *
 * Supports setting dictionary flags on buffs via syntax:
 * @Apply[BuffName;level=@cl;dFlags.flagName=value]{Label}
 *
 * The enricher's dataset can contain:
 * - uuid: UUID of the buff item
 * - level: Formula for buff level (caster level)
 * - dFlags.X: Dictionary flag values (can be formulas)
 * - vars: 'target' to use target actor's roll data instead of speaker's
 *
 * @param {Function} originalClick - Original click handler to fall back to
 * @param {Event} event - Click event
 * @param {HTMLElement} target - Clicked element
 */
async function enhancedApplyClick(originalClick, event, target) {
	// Extract dFlags from dataset
	const dFlags = {};
	for (const [key, val] of Object.entries(target.dataset)) {
		const match = key.match(/^dflags\.(.+)$/i);
		if (match) {
			dFlags[match[1]] = val;
		}
	}

	// If no dFlags, use original handler
	if (Object.keys(dFlags).length === 0) {
		return originalClick.call(this, event, target);
	}

	// Custom implementation with dFlags support
	const { uuid, level } = target.dataset;
	let actors;
	try {
		actors = pf1.chat.enrichers.getRelevantActors(target, false);
	} catch (e) {
		// If we can't find actors, try the original handler as fallback
		console.warn(`${MODULE_ID} | @Apply | Could not find relevant actors, falling back to original handler`);
		return originalClick.call(this, event, target);
	}

	if (actors.size === 0) {
		// No actors found, fall back to original handler
		return originalClick.call(this, event, target);
	}

	const item = await fromUuid(uuid);
	if (!item) {
		const warn = game.i18n.localize("PF1.EnrichedText.Errors.ItemNotFound");
		ui.notifications.warn(warn, { console: false });
		return void console.error(`${MODULE_ID} | @Apply |`, warn, uuid);
	}

	// Support only buffs
	if (item.type !== "buff") {
		return void ui.notifications.error(
			game.i18n.format("PF1.EnrichedText.Errors.UnsupportedItemType", { type: item.type })
		);
	}

	// Prepare item
	const itemData = game.items.fromCompendium(item, { clearFolder: true });
	itemData.system.active = true;

	// Apply to actors
	for (const actor of actors) {
		// Get actor roll data for formula evaluation
		const actorRollData = actor.getRollData();

		// Evaluate level formula
		if (level?.length) {
			const roll = await pf1.dice.RollPF.safeRoll(level, actorRollData);
			itemData.system.level = roll.total;
		}

		// Evaluate and set dictionary flags
		itemData.system.flags ??= {};
		itemData.system.flags.dictionary ??= {};
		for (const [flagName, formula] of Object.entries(dFlags)) {
			const flagRoll = await pf1.dice.RollPF.safeRoll(formula, actorRollData);
			itemData.system.flags.dictionary[flagName] = flagRoll.total;
		}

		// Activate existing item with same source
		const existing = actor.itemTypes.buff.find(i => i._stats?.compendiumSource === uuid);
		if (existing) {
			const updateData = {
				"system.active": true,
				"system.level": itemData.system.level,
			};
			for (const [flagName, value] of Object.entries(itemData.system.flags.dictionary)) {
				updateData[`system.flags.dictionary.${flagName}`] = value;
			}
			await existing.update(updateData);
		}
		// Add new
		else {
			await Item.implementation.create(itemData, { parent: actor });
		}
	}

	console.debug(`${MODULE_ID} | @Apply | Applied buff "${item.name}" with dFlags:`, dFlags);
}

/**
 * Enhance the @Apply enricher to support dictionary flags.
 *
 * Patches the click handler to recognize and process dFlags.* options,
 * allowing dynamic buff configuration via formula evaluation at click time.
 *
 * Runs in ready hook after all setup hooks complete to ensure PF1's enrichers
 * are registered and available.
 */
function enhanceApplyEnricher() {
	// Find the apply enricher (registered by PF1 in setup)
	const applyEnricher = CONFIG.TextEditor.enrichers.find(e => e.id === "apply");

	if (!applyEnricher) {
		console.warn(`${MODULE_ID} | Could not find @Apply enricher to enhance`);
		return;
	}

	// Store original click handler
	const originalClick = applyEnricher.click;

	// Replace with enhanced version
	applyEnricher.click = function(event, target) {
		return enhancedApplyClick.call(this, originalClick, event, target);
	};

	console.log(`${MODULE_ID} | @Apply enricher enhanced with dFlags support`);
}


