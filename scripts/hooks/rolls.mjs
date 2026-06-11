import { MODULE_ID } from "../_module.mjs";
import { getCollection } from "../documents/actor/manifester-store.mjs";

/**
 * @param {ActorPF | ItemPF | ItemAction} doc
 * @param {RollData} rollData
 */
function onGetRollData(doc, rollData) {
	try {
		if (doc instanceof pf1.documents.actor.ActorPF) {
			const actor = doc;

			// Manifester records are tag-keyed. Expose under @psionics.<tag>
			// so formulas can write e.g. @psionics.psion.cl.total.
			rollData.psionics = {};
			const collection = getCollection(actor);
			for (const [tag, manifester] of Object.entries(collection.manifesters)) {
				const book = manifester.toObject();
				// Carry derived fields the formula needs (model writes these
				// in finalizeData onto the live instance, not the source).
				book.cl = { ...(book.cl ?? {}), ...(manifester.cl ?? {}) };
				book.concentration = { ...(book.concentration ?? {}), ...(manifester.concentration ?? {}) };
				book.powerPoints = { ...(book.powerPoints ?? {}), ...(manifester.powerPoints ?? {}) };
				book.abilityMod = rollData.abilities[manifester.ability]?.mod ?? 0;
				rollData.psionics[tag] = book;
			}

			// Add power points and focus to rollData for formula access
			const ppHelper = actor.psionics?.powerPoints;
			const focusHelper = actor.psionics?.focus;
			if (ppHelper) {
				rollData.psionics.powerPoints = ppHelper.toObject();
			}
			if (focusHelper) {
				rollData.psionics.focus = focusHelper.toObject();
			}
		} else if (doc instanceof pf1.components.ItemAction) {
			const action = doc;
			const item = action.item;

			// Add school CL bonus for powers (Psionics-Magic Transparency).
			// PF1 only adds this for spells, so mirror it for powers.
			if (item?.type === `${MODULE_ID}.power` && item.system.school) {
				rollData.cl += rollData.attributes?.spells?.school?.[item.system.school]?.cl ?? 0;
			}
		}
	} catch (_error) {
		return;
	}
}

Hooks.on("pf1GetRollData", onGetRollData);
