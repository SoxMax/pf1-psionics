import {MODULE_ID} from "../../_module.mjs";
import { setIcon, getRollData, getMessage } from "./common.mjs";

/**
 * Parse `dflags.*` / `bflags.*` keys from a dataset.
 *
 * @param {DOMStringMap} dataset
 * @returns {{dFlags: Record<string, string>, bFlags: Set<string>}}
 */
function parseFlagDataset(dataset) {
  const dFlags = {};
  const bFlags = new Set();
  for (const [key, val] of Object.entries(dataset)) {
    const m = key.match(/^([db])flags\.(.+)$/i);
    if (!m) continue;
    if (m[1].toLowerCase() === "d") dFlags[m[2]] = val;
    else bFlags.add(m[2]);
  }
  return { dFlags, bFlags };
}

/**
 * Evaluate level + dFlags formulas against the given roll data.
 *
 * @param {{level?: string, dFlags: Record<string, string>, bFlags: Set<string>}} spec
 * @param {object} rollData
 * @returns {Promise<{level?: number, dFlags?: Record<string, number>, bFlags?: string[]}>}
 */
async function evaluateResults({ level, dFlags, bFlags }, rollData) {
  const results = {};
  if (level?.length) {
    results.level = (await RollPF.safeRoll(level, rollData)).total;
  }
  for (const [name, formula] of Object.entries(dFlags)) {
    if (!formula?.length) continue;
    (results.dFlags ??= {})[name] = (await RollPF.safeRoll(formula, rollData)).total;
  }
  if (bFlags.size) results.bFlags = Array.from(bFlags);
  return results;
}

/**
 * Build a dotted-path update object describing a successful buff apply.
 *
 * Works for both `Item#update` (paths expanded server-side) and
 * `mergeObject(itemData, updates)` (paths expanded into nested objects).
 *
 * @param {{level?: number, dFlags?: Record<string, number>, bFlags?: string[]}} results
 * @returns {Record<string, unknown>}
 */
function buildBuffUpdates(results) {
  const updates = { "system.active": true };
  if (results.level !== undefined) updates["system.level"] = results.level;
  for (const [name, value] of Object.entries(results.dFlags ?? {})) {
    updates[`system.flags.dictionary.${name}`] = value;
  }
  for (const name of results.bFlags ?? []) {
    updates[`system.flags.boolean.${name}`] = true;
  }
  return updates;
}

/**
 * Resolve actors relevant to the click target. Notifies and returns null on failure.
 *
 * @param {HTMLElement} target
 * @returns {Set<ActorPF>|null}
 */
function resolveActors(target) {
  let actors;
  try {
    actors = pf1.chat.enrichers.getRelevantActors(target, false);
  } catch (_e) {
    console.error(`${MODULE_ID} | @PsionicApply | Could not find relevant actors`);
    actors = null;
  }
  if (!actors || actors.size === 0) {
    ui.notifications.error(game.i18n.localize("PF1.EnrichedText.Errors.NoneSelected"));
    return null;
  }
  return actors;
}

/**
 * Resolve the buff item referenced by uuid. Notifies and returns null on failure.
 *
 * @param {string} uuid
 * @returns {Promise<ItemPF|null>}
 */
async function resolveBuffItem(uuid) {
  const item = await fromUuid(uuid);
  if (!item) {
    const warn = game.i18n.localize("PF1.EnrichedText.Errors.ItemNotFound");
    ui.notifications.warn(warn, { console: false });
    console.error(`${MODULE_ID} | @PsionicApply |`, warn, uuid);
    return null;
  }
  if (item.type !== "buff") {
    ui.notifications.error(
        game.i18n.format("PF1.EnrichedText.Errors.UnsupportedItemType", { type: item.type }),
    );
    return null;
  }
  return item;
}

/**
 * Click handler for @PsionicApply enricher.
 *
 * Applies a buff with support for dictionary and boolean flags plus level formulas.
 *
 * @param {Event} event - Click event
 * @param {HTMLElement} target - Clicked element
 */
async function onPsionicApply(event, target) {
  const { uuid, level, vars } = target.dataset;
  const { dFlags, bFlags } = parseFlagDataset(target.dataset);

  const actors = resolveActors(target);
  if (!actors) return;
  const item = await resolveBuffItem(uuid);
  if (!item) return;

  const useTargetRollData = vars === "target";
  const messageRollData = getRollData(getMessage(target));

  for (const actor of actors) {
    const rollData = useTargetRollData ? actor.getRollData() : messageRollData;
    const results = await evaluateResults({ level, dFlags, bFlags }, rollData);
    const updates = buildBuffUpdates(results);

    const existing = actor.itemTypes[item.type].find((i) => i._stats?.compendiumSource === uuid);
    if (existing) {
      await existing.update(updates);
    } else {
      const itemData = game.items.fromCompendium(item, { clearFolder: true });
      foundry.utils.mergeObject(itemData, updates);
      await Item.implementation.create(itemData, { parent: actor });
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
