import {MODULE_ID} from "../../_module.mjs";
import {MANIFESTORS} from "../../data/manifestors.mjs";

export function renderItemHook(app, html, data) {
	let item = app.object;

	if (item.type === "class") {
		injectManifesting(app, html, data);
	}
}

async function injectManifesting(app, html, data) {
	data.manifesting = {
		progression: {
			low: "PF1.Low",
			med: "PF1.Medium",
			high: "PF1.High",
		}
	};
	const manifestingConfig = await foundry.applications.handlebars.renderTemplate("modules/pf1-psionics/templates/item/class-manifesting.hbs", data);
	let previousSelect = html.find("select[name='system.savingThrows.will.value']");
	previousSelect.parent().after(manifestingConfig);
}

/**
 * When a class item with psionic manifesting data is added to an actor, automatically
 * configure and link a manifestor slot (primary/secondary/tertiary) to that class.
 *
 * Rules:
 * - Only runs for class items with system.manifesting.progression set (high/med/low).
 * - If a manifestor already uses this class tag, update missing fields but do not overwrite customizations.
 * - Else choose the first unused manifestor slot (in order primary, secondary, tertiary).
 * - Sets: class, casterType, ability, hasCantrips, inUse=true.
 * - Leaves existing formulas and names intact; initializes if blank.
 */
export function onCreatePsionicClassItem(item) {
  try {
    if (item.type !== "class") return;
    const manifesting = item.system?.manifesting;
    if (!manifesting?.progression) return; // Not a psionic manifesting class
    const actor = item.parent;
    if (!actor) return;

    const tag = item.system?.tag;
    if (!tag) return;

    const manifestors = foundry.utils.deepClone(actor.getFlag(MODULE_ID, "manifestors") || {});
    if (!manifestors || Object.keys(manifestors).length === 0) return;

    // Find existing manifestor using this class
    let targetKey = Object.keys(manifestors).find(k => manifestors[k].class === tag);
    // Else find first unused slot
    if (!targetKey) {
      const order = ["primary", "secondary", "tertiary"];
      targetKey = order.find(k => manifestors[k] && !manifestors[k].inUse);
    }
    if (!targetKey) return; // No available slot

    const manifestor = manifestors[targetKey];

    // Apply or preserve values
    manifestor.class ||= tag;
    manifestor.casterType ||= manifesting.progression; // high/med/low
    manifestor.ability ||= manifesting.ability || "int";
    // Preserve user-set cantrips if explicitly false; otherwise set based on manifesting.cantrips
    if (manifestor.hasCantrips === undefined) manifestor.hasCantrips = !!manifesting.cantrips;
    manifestor.inUse = true; // Activate

    // Initialize formula containers if missing
    manifestor.cl ||= manifestor.cl || { formula: "", notes: "" };
    manifestor.concentration ||= manifestor.concentration || { formula: "", notes: "" };
    manifestor.powerPoints ||= manifestor.powerPoints || { max: 0, formula: "" };

    // Commit update
    const updateData = {};
    updateData[`flags.${MODULE_ID}.manifestors.${targetKey}`] = manifestor;
    actor.update(updateData);
    console.log(`${MODULE_ID} | Auto-linked psionic class '${tag}' to manifestor '${targetKey}' for actor '${actor.name}'.`);
  } catch (err) {
    console.error(`${MODULE_ID} | Failed auto-linking psionic class:`, err);
  }
}
