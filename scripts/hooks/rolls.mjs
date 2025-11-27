import { MODULE_ID } from "../_module.mjs";

/**
 * @param {ActorPF | ItemPF | ItemAction} doc
 * @param {RollData} rollData
 */
export function onGetRollData(doc, rollData) {
	try {
		if (doc instanceof pf1.documents.actor.ActorPF) {
			const actor = doc;

			// Add manifester info
			rollData.psionics = foundry.utils.deepClone(actor.getFlag(MODULE_ID, "manifesters") || {});
			for (const book of Object.values(rollData.psionics)) {
				book.abilityMod = rollData.abilities[book.ability]?.mod ?? 0;
				// Add alias
				if (book.class && book.class !== "_hd") rollData.psionics[book.class] ??= book;
			}
		} else if (doc instanceof pf1.components.ItemAction) {
			const action = doc;
			const item = action.item;

			// Add school CL bonus for powers (Psionics-Magic Transparency)
			// The PF1 system only adds this for spells, so we need to add it for powers
			if (item?.type === `${MODULE_ID}.power` && item.system.school) {
				// Add per school CL bonus (same as PF1 does for spells)
				rollData.cl += rollData.attributes?.spells?.school?.[item.system.school]?.cl ?? 0;
			}
		}
	} catch (_error) {
		return;
	}
}
