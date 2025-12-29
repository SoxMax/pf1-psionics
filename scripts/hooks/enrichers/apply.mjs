import { MODULE_ID } from "../../_module.mjs";

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
	} catch (_e) {
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
export function enhanceApplyEnricher() {
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
