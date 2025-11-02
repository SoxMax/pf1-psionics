import { MODULE_ID } from "./_module.mjs";

/**
 * @param {ActorPF | ItemPF | ItemAction} doc
 * @param {RollData} rollData
 */
export function onGetRollData(doc, rollData) {
	try {
		if (doc instanceof pf1.documents.actor.ActorPF) {
			const actor = doc;

			// Add spellbook info
			rollData.psionics = foundry.utils.deepClone(actor.getFlag(MODULE_ID, "spellbooks") || {});
			for (const book of Object.values(rollData.psionics)) {
				book.abilityMod = rollData.abilities[book.ability]?.mod ?? 0;
				// Add alias
				if (book.class && book.class !== "_hd") rollData.psionics[book.class] ??= book;
			}
		}
	} catch (error) {
		return;
	}
}
