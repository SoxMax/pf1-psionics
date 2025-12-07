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
 * Follows the pattern used by Path of War's ManeuverBrowser.
 *
 * @example
 * // Open browser
 * pf1.applications.compendiums.psionicPowers.render(true);
 *
 * @example
 * // Open with filters
 * const browser = pf1.applications.compendiums.psionicPowers;
 * browser._queueFilters({ psionLevel: "1", psionDiscipline: "telepathy" });
 * browser.render(true);
 */
function registerCompendiumBrowser() {
	pf1.applications.compendiums.psionicPowers = new PsionicPowerBrowser();
	pf1.applications.compendiumBrowser.psionicPowers = PsionicPowerBrowser;

	console.log(`${MODULE_ID} | Registered Psionic Power Compendium Browser`);
}

/**
 * Hook to add custom filter ID mappings for psionic power filters
 * This allows the _onOpenCompendiumBrowser function to properly activate filters
 */
Hooks.on("pf1.registerCompendiumBrowserFilters", (filterIdMappings) => {
  // Add mappings for psionic power filter IDs to filter class names
  Object.assign(filterIdMappings, {
    psionLevel: "PsionicPowerLevelFilter",
    psionClass: "PsionicManifesterClassFilter",
    psionDiscipline: "PsionicDisciplineFilter",
    psionSubdiscipline: "PsionicSubdisciplineFilter",
    psionDescriptor: "PsionicDescriptorFilter",
    psionRange: "PsionicRangeFilter",
    psionActionType: "PsionicActionTypeFilter",
    psionDisplay: "PsionicDisplayFilter",
  });
});

