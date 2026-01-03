import {MODULE_ID} from "../../_module.mjs";
import {RollPF} from "../../../ruleset/pf1e/module/dice/roll.mjs";
import { setIcon, getRollData, getMessage } from "./common.mjs";

/**
 * Click handler for @PsionicApply enricher.
 *
 * Applies a buff with support for dictionary and boolean flags plus level formulas.
 *
 * @param {Event} event - Click event
 * @param {HTMLElement} target - Clicked element
 */
async function onPsionicApply(event, target) {
  // Extract dFlags/bFlags from dataset
  const dFlags = {};
  const bFlags = new Set();
  for (const [key, val] of Object.entries(target.dataset)) {
    const dMatch = key.match(/^dflags\.(.+)$/i);
    if (dMatch) dFlags[dMatch[1]] = val;
    const bMatch = key.match(/^bflags\.(.+)$/i);
    if (bMatch) bFlags.add(bMatch[1]);
  }

  const {uuid, level, vars} = target.dataset;

  // Resolve actors using PF1 helper
  let actors;
  try {
    actors = pf1.chat.enrichers.getRelevantActors(target, false);
  } catch (_e) {
    console.error(`${MODULE_ID} | @PsionicApply | Could not find relevant actors`);
    return void ui.notifications.error(
        game.i18n.localize("PF1.EnrichedText.Errors.NoneSelected"),
    );
  }
  if (actors.size === 0) {
    ui.notifications.error(game.i18n.localize("PF1.EnrichedText.Errors.NoneSelected"));
    return;
  }

  // Load item
  const item = await fromUuid(uuid);
  if (!item) {
    const warn = game.i18n.localize("PF1.EnrichedText.Errors.ItemNotFound");
    ui.notifications.warn(warn, {console: false});
    return void console.error(`${MODULE_ID} | @PsionicApply |`, warn, uuid);
  }
  if (item.type !== "buff") {
    return void ui.notifications.error(
        game.i18n.format("PF1.EnrichedText.Errors.UnsupportedItemType", {type: item.type}),
    );
  }

  const results = {};
  async function generateResults(rollData) {
    if (level?.length) {
      const roll = await RollPF.safeRoll(level, rollData);
      results.level = roll.total;
    }
    for (const [flagName, formula] of Object.entries(dFlags)) {
      if (formula?.length) {
        results.dFlags ??= {};
        const roll = await RollPF.safeRoll(formula, rollData);
        results.dFlags[flagName] = roll.total;
      }
    }
    if (bFlags.size) {
      results.bFlags = Array.from(bFlags);
    }
  }

  const useTargetRollData = vars === "target";
  if (!useTargetRollData) {
    const message = getMessage(target);
    const rollData = getRollData(message);
    await generateResults(rollData);
  }

  // Apply to each actor
  for (const actor of actors) {
    // Evaluate results per-actor if using target roll data
    if (useTargetRollData) {
      const rollData = actor.getRollData();
      await generateResults(rollData);
    }

    // Activate existing item with same source
    const old = actor.itemTypes[item.type].find((i) => i._stats?.compendiumSource === uuid);
    if (old) {
      const activationData = {system: {active: true}};
      if (results.level !== undefined) activationData.system.level = results.level;
      // Merge dFlags into existing item via dotted-path updates
      if (results.dFlags) {
        for (const [flagName, value] of Object.entries(results.dFlags)) {
          activationData[`system.flags.dictionary.${flagName}`] = value;
        }
      }
      if (results.bFlags?.length) {
        for (const flagName of results.bFlags) {
          activationData[`system.flags.boolean.${flagName}`] = true;
        }
      }
      await old.update(activationData);
    } else {
      // Add new item with results baked in
      const itemData = game.items.fromCompendium(item, {clearFolder: true});
      itemData.system.active = true;
      if (results.level !== undefined) itemData.system.level = results.level;
      // Merge dFlags into new itemData
      if (results.dFlags) {
        itemData.system.flags ??= {};
        itemData.system.flags.dictionary ??= {};
        Object.assign(itemData.system.flags.dictionary, results.dFlags);
      }
      if (results.bFlags?.length) {
        itemData.system.flags ??= {};
        itemData.system.flags.boolean ??= {};
        for (const flagName of results.bFlags) {
          itemData.system.flags.boolean[flagName] = true;
        }
      }
      await Item.implementation.create(itemData, {parent: actor});
    }
  }
}

/**
 * Register the @PsionicApply enricher as an independent enricher.
 *
 * This enricher provides buff application with support for dictionary flags,
 * allowing dynamic buff configuration via formula evaluation at click time.
 *
 * Syntax: @PsionicApply[BuffName;level=@cl;dFlags.flagName=value;bFlags.flagName]{Label}
 *
 * The enricher is registered in the ready hook after all setup hooks complete.
 */
export function registerPsionicApplyEnricher() {
  const enricher = new pf1.chat.enrichers.PF1TextEnricher(
      "psionicApply",
      /@PsionicApply\[(?<ident>.*?)(?:;(?<options>.*?))?\](?:\{(?<label>.*?)})?/g,
      async (match, _options) => {
        const { ident, options, label } = match.groups;

        const item = fromUuidSync(ident) ?? fromUuidSync(await pf1.chat.enrichers.findItem(ident, { type: "buff" }));
        if (!item) console.warn("PF1 | @PsionicApply | Could not find item", ident);

        const broken = !item;

        // Ensure the handler matches the PF1TextEnricher id so clicks route correctly
        const a = pf1.chat.enrichers.createElement({ label, click: true, handler: "psionicApply", options, broken });

        if (item) {
          a.dataset.name = `${game.i18n.localize("DOCUMENT.Item")}: ${item.name}`;
          a.dataset.uuid = item.uuid;
          a.append(item.name);

          pf1.chat.enrichers.generateTooltip(a);
        } else {
          a.replaceChildren(ident);
        }

        setIcon(a, "fa-solid fa-angles-right");

        return a;
      },
      {
        click: onPsionicApply,
      }
  );

  pf1.chat.enrichers.enrichers.push(enricher);
}
