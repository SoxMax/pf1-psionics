import {MODULE_ID} from "../../_module.mjs";

async function onCreateItemHook(item, _options, _userId) {
  if (item.type === "class") {
    await addClassManifester(item);
  }
}

export async function addClassManifester(item) {
  try {
    const manifesting = item.system?.manifesting;
    if (!manifesting?.progression) return; // Not a psionic manifesting class
    const actor = item.parent;
    if (!actor) return;

    const tag = item.system?.tag;
    if (!tag) return;

    const manifesters = foundry.utils.deepClone(actor.getFlag(MODULE_ID, "manifesters") || {});
    if (!manifesters || Object.keys(manifesters).length === 0) return;

    let targetKey = Object.keys(manifesters).find(k => manifesters[k].class === tag);
    if (!targetKey) {
      const order = ["primary", "secondary", "tertiary"];
      targetKey = order.find(k => manifesters[k] && !manifesters[k].inUse);
    }
    if (!targetKey) return;

    const manifester = manifesters[targetKey];
    const isNewLink = !manifester.class;

    manifester.class = tag;
    // Always assign progression & ability on initial link or if still defaults
    if (isNewLink || manifester.casterType === "high" || manifester.casterType === "") {
      manifester.casterType = manifesting.progression;
    }
    if (isNewLink || ["int", "wis", "cha"].includes(manifester.ability)) { // override default ability when linking
      manifester.ability = manifesting.ability || manifester.ability || "int";
    }
    if (manifester.hasCantrips === undefined) manifester.hasCantrips = !!manifesting.cantrips;
    manifester.inUse = true;

    manifester.cl ||= { formula: manifester.cl?.formula || "", notes: manifester.cl?.notes || "" };
    manifester.concentration ||= { formula: manifester.concentration?.formula || "", notes: manifester.concentration?.notes || "" };
    manifester.powerPoints ||= { max: manifester.powerPoints?.max || 0, formula: manifester.powerPoints?.formula || "" };

    const updateData = {};
    updateData[`flags.${MODULE_ID}.manifesters.${targetKey}`] = manifester;
    await actor.update(updateData);
    console.log(`${MODULE_ID} | Auto-linked psionic class '${tag}' to manifester '${targetKey}' for actor '${actor.name}'.`);
  } catch (err) {
    console.error(`${MODULE_ID} | Failed auto-linking psionic class:`, err);
  }
}

Hooks.on("createItem", onCreateItemHook);
