import {MODULE_ID} from "../../_module.mjs";
import {RollPF} from "../../../ruleset/pf1e/module/dice/roll.mjs";

/**
 * @param {Element} el
 * @param {string} icon
 */
function setIcon(el, icon) {
  const i = document.createElement("i");
  i.inert = true;
  i.classList.add(...icon.split(" "));
  el.prepend(i, " ");
}

/**
 * Get most relevant roll data
 *
 * @param {ChatMessagePF} message
 * @returns {object} - Roll data
 */
function getRollData(message) {
  // Get action, item, or actor
  let srcDoc = message.actionSource ?? message.itemSource;
  srcDoc ??= message.speaker ? ChatMessage.getSpeakerActor(message.speaker) : null;
  const rollData = srcDoc?.getRollData();

  // Apply cached values from system.config (cl, sl, critMult)
  const cfg = message.system?.config;
  if (cfg && rollData) {
    if (cfg.cl !== undefined) rollData.cl = cfg.cl;
    if (cfg.sl !== undefined) rollData.sl = cfg.sl;
    if (cfg.critMult !== undefined) rollData.critMult = cfg.critMult;
  }

  // Apply augments from module flags (not system.config - see message-rolldata-persistence.md)
  const augments = message.getFlag(MODULE_ID, "augments");
  if (augments !== undefined && rollData) {
    rollData.augments = augments;
  }

  return rollData;
}

/**
 * Get Chat Message
 *
 * @param {HTMLElement} target
 * @returns {ChatMessagePF|undefined}
 */
function getMessage(target) {
  const messageId = target.closest("[data-message-id]")?.dataset.messageId;
  return game.messages.get(messageId);
}

/**
 * Click handler for @PsionicApply enricher.
 *
 * Applies a buff with support for dictionary flags and level formulas.
 *
 * @param {Event} event - Click event
 * @param {HTMLElement} target - Clicked element
 */
async function onPsionicApply(event, target) {
  // Extract dFlags from dataset
  const dFlags = {};
  for (const [key, val] of Object.entries(target.dataset)) {
    const match = key.match(/^dflags\.(.+)$/i);
    if (match) dFlags[match[1]] = val;
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
      await Item.implementation.create(itemData, {parent: actor});
    }
  }

  console.debug(`${MODULE_ID} | @PsionicApply | Applied buff "${item.name}" with dFlags:`, dFlags);
}

/**
 * Register the @PsionicApply enricher as an independent enricher.
 *
 * This enricher provides buff application with support for dictionary flags,
 * allowing dynamic buff configuration via formula evaluation at click time.
 *
 * Syntax: @PsionicApply[BuffName;level=@cl;dFlags.flagName=value]{Label}
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

