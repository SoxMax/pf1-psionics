import {MODULE_ID} from "../../_module.mjs";

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

export async function onCreatePsionicClassItem(item, _options, _userId) {
  try {
    if (item.type !== "class") return; // removed stray 'f'
    const manifesting = item.system?.manifesting;
    if (!manifesting?.progression) return; // Not a psionic manifesting class
    const actor = item.parent;
    if (!actor) return;

    const tag = item.system?.tag;
    if (!tag) return;

    const manifestors = foundry.utils.deepClone(actor.getFlag(MODULE_ID, "manifestors") || {});
    if (!manifestors || Object.keys(manifestors).length === 0) return;

    let targetKey = Object.keys(manifestors).find(k => manifestors[k].class === tag);
    if (!targetKey) {
      const order = ["primary", "secondary", "tertiary"];
      targetKey = order.find(k => manifestors[k] && !manifestors[k].inUse);
    }
    if (!targetKey) return;

    const manifestor = manifestors[targetKey];
    const isNewLink = !manifestor.class;

    manifestor.class = tag;
    // Always assign progression & ability on initial link or if still defaults
    if (isNewLink || manifestor.casterType === "high" || manifestor.casterType === "") {
      manifestor.casterType = manifesting.progression;
    }
    if (isNewLink || ["int", "wis", "cha"].includes(manifestor.ability)) { // override default ability when linking
      manifestor.ability = manifesting.ability || manifestor.ability || "int";
    }
    if (manifestor.hasCantrips === undefined) manifestor.hasCantrips = !!manifesting.cantrips;
    manifestor.inUse = true;

    manifestor.cl ||= { formula: manifestor.cl?.formula || "", notes: manifestor.cl?.notes || "" };
    manifestor.concentration ||= { formula: manifestor.concentration?.formula || "", notes: manifestor.concentration?.notes || "" };
    manifestor.powerPoints ||= { max: manifestor.powerPoints?.max || 0, formula: manifestor.powerPoints?.formula || "" };

    const updateData = {};
    updateData[`flags.${MODULE_ID}.manifestors.${targetKey}`] = manifestor;
    await actor.update(updateData);
    console.log(`${MODULE_ID} | Auto-linked psionic class '${tag}' to manifestor '${targetKey}' for actor '${actor.name}'.`);
  } catch (err) {
    console.error(`${MODULE_ID} | Failed auto-linking psionic class:`, err);
  }
}
