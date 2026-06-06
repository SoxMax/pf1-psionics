import { MODULE_ID } from "../_module.mjs";

/**
 * @param {ActorPF | ItemPF | ItemAction} doc
 * @param {RollData} rollData
 */
function onGetRollData(doc, rollData) {
	try {
		if (doc instanceof pf1.documents.actor.ActorPF) {
			const actor = doc;

			// Add manifester info. Records are id-keyed; alias by class tag
			// (book.class.tag populated by deriveManifestersInfo) so formulas
			// can write @psionics.psion.cl.total etc. First-wins on tag collision
			// (??= preserves the earliest record in iteration order).
			const flagManifesters = actor.getFlag(MODULE_ID, "manifesters") ?? {};
			rollData.psionics = {};
			for (const [id, src] of Object.entries(flagManifesters)) {
				const book = foundry.utils.deepClone(src);
				book.abilityMod = rollData.abilities[book.ability]?.mod ?? 0;
				rollData.psionics[id] = book;
				const tag = book.class?.tag;
				if (tag && tag !== "_hd") {
					rollData.psionics[tag] ??= book;
				}
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
