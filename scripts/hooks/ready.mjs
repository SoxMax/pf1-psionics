import { MODULE_ID } from "../_module.mjs";
import { runMigrations } from "../migrations/_module.mjs";
import { PowerPointsAPI, PsionicFocusAPI } from "../api/_module.mjs";
import { PowerPointsHelper, PsionicFocusHelper, PsionicsHelper } from "../helpers/_module.mjs";

export async function readyHook() {
	console.log(`${MODULE_ID} | Ready`);

	// Register module API for macros and other modules
	registerModuleApi();

	// Attach psionics helper to ActorPF prototype
	attachActorHelpers();

	await runMigrations();
}

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
		powerPoints: PowerPointsAPI,
		psionicFocus: PsionicFocusAPI,

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

	Object.defineProperty(ActorPF.prototype, "psionics", {
		get() {
			// Create new helper each time to ensure fresh data
			return new PsionicsHelper(this);
		},
		configurable: true
	});

	console.log(`${MODULE_ID} | Actor helper attached (actor.psionics)`);
}
