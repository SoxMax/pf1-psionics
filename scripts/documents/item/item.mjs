import {MODULE_ID} from "../../_module.mjs";
import {createManifesterRecord} from "../../data/manifesters.mjs";

async function onCreateItemHook(item, _options, _userId) {
  if (item.type === "class") {
    await addClassManifester(item);
  }
}

/**
 * Intercept class item deletion to prompt the user about its manifester record.
 * `preDeleteItem` is sync-veto-only in Foundry v13, so we libWrapper Item.delete
 * to keep the dialog flow async-friendly.
 */
function injectItemDeleteWrap() {
  libWrapper.register(MODULE_ID, "CONFIG.Item.documentClass.prototype.delete",
    async function(wrapped, ...args) {
      if (this.type === "class" && this.parent) {
        const choice = await promptClassManifesterRemoval(this);
        if (choice === "cancel") return;
        if (choice === "remove") await removeLinkedRecord(this);
        else if (choice === "keep") await demoteLinkedRecordToManual(this);
      }
      return wrapped(...args);
    }, "MIXED");
}

/**
 * If a manifesting class is added to an actor, create a manifester record
 * (or adopt a pending manual record) for it.
 *
 * Predicate for "is a manifesting class": flags.pf1-psionics.manifesting.progression
 * is set and not "none". Soulknife sets "none" to opt out.
 */
export async function addClassManifester(item) {
  try {
    const manifesting = item.getFlag(MODULE_ID, "manifesting");
    if (!manifesting?.progression || manifesting.progression === "none") return;
    const actor = item.parent;
    if (!actor) return;

    const manifesters = foundry.utils.deepClone(actor.getFlag(MODULE_ID, "manifesters") || {});

    // Idempotent: a record already references this exact class item.
    if (Object.values(manifesters).some(r => r.class?.itemId === item.id)) return;

    // Promotion: manual record opted-in via _pendingClassTag matching this class.
    const tag = item.system?.tag;
    const pendingMatches = Object.entries(manifesters).filter(
      ([, r]) => r.source === "manual"
        && r.class?.itemId == null
        && tag
        && r._pendingClassTag === tag,
    );
    if (pendingMatches.length > 1) {
      console.warn(
        `${MODULE_ID} | Multiple manual manifester records have _pendingClassTag='${tag}' on actor '${actor.name}'. Promoting the first; others remain orphaned.`,
      );
    }
    const pendingEntry = pendingMatches[0];
    if (pendingEntry) {
      const [id, rec] = pendingEntry;
      const promoted = foundry.utils.mergeObject(rec, {
        source: "class",
        class: {itemId: item.id},
        casterType: rec.casterType || manifesting.progression,
        ability: rec.ability || manifesting.ability || "int",
        hasCantrips: rec.hasCantrips ?? !!manifesting.cantrips,
      }, {inplace: false});
      delete promoted._pendingClassTag;
      delete promoted._lastTag;
      const path = `flags.${MODULE_ID}.manifesters.${id}`;
      await actor.update({
        [path]: promoted,
        [`${path}.-=_pendingClassTag`]: null,
        [`${path}.-=_lastTag`]: null,
      });
      console.log(`${MODULE_ID} | Promoted manual manifester to class for '${tag}' on actor '${actor.name}'.`);
      return;
    }

    // Fresh create.
    const record = createManifesterRecord({
      source: "class",
      class: {itemId: item.id},
      casterType: manifesting.progression,
      ability: manifesting.ability || "int",
      hasCantrips: !!manifesting.cantrips,
    });
    await actor.update({[`flags.${MODULE_ID}.manifesters.${record.id}`]: record});
    console.log(`${MODULE_ID} | Created manifester '${record.id}' for class '${tag}' on actor '${actor.name}'.`);
  } catch (err) {
    console.error(`${MODULE_ID} | Failed creating manifester for class:`, err);
  }
}

function findLinkedRecord(item) {
  const actor = item.parent;
  if (!actor) return null;
  const manifesters = actor.getFlag(MODULE_ID, "manifesters") || {};
  const entry = Object.entries(manifesters).find(
    ([, r]) => r.source === "class" && r.class?.itemId === item.id,
  );
  return entry ? {id: entry[0], record: entry[1]} : null;
}

/**
 * Find powers on `actor` whose `system.manifester` points at `manifesterId`.
 * @param {Actor} actor
 * @param {string} manifesterId
 * @returns {Item[]}
 */
export function findOrphanedPowers(actor, manifesterId) {
  return actor.itemTypes[`${MODULE_ID}.power`]?.filter(
    (p) => p.system.manifester === manifesterId,
  ) ?? [];
}

/**
 * Clear `system.manifester` on every power referencing `manifesterId`.
 * Batched via updateEmbeddedDocuments. Returns count cleared.
 * @param {Actor} actor
 * @param {string} manifesterId
 * @returns {Promise<number>}
 */
export async function clearPowerManifesterRefs(actor, manifesterId) {
  const orphans = findOrphanedPowers(actor, manifesterId);
  if (orphans.length === 0) return 0;
  await actor.updateEmbeddedDocuments(
    "Item",
    orphans.map((p) => ({_id: p.id, "system.manifester": ""})),
  );
  return orphans.length;
}

async function promptClassManifesterRemoval(item) {
  const linked = findLinkedRecord(item);
  if (!linked) return "noop";

  const orphanCount = findOrphanedPowers(item.parent, linked.id).length;

  const className = item.name;
  const recordName = linked.record.name || className;
  const orphanMsg = orphanCount > 0
    ? game.i18n.format("PF1-Psionics.Manifesters.OrphanWarning", {count: orphanCount})
    : "";

  const choice = await foundry.applications.api.DialogV2.wait({
    window: {title: game.i18n.localize("PF1-Psionics.Manifesters.ConfirmRemovalTitle")},
    content: `<p>${game.i18n.format("PF1-Psionics.Manifesters.ConfirmRemovalBody", {class: className, manifester: recordName})}</p>${orphanMsg ? `<p>${orphanMsg}</p>` : ""}`,
    buttons: [
      {action: "remove", label: game.i18n.localize("PF1-Psionics.Manifesters.RemoveRecord"), default: true},
      {action: "keep", label: game.i18n.localize("PF1-Psionics.Manifesters.KeepRecord")},
      {action: "cancel", label: game.i18n.localize("Cancel")},
    ],
    rejectClose: false,
  });

  return choice ?? "cancel";
}

async function removeLinkedRecord(item) {
  const linked = findLinkedRecord(item);
  if (!linked) return;
  const cleared = await clearPowerManifesterRefs(item.parent, linked.id);
  await item.parent.update({[`flags.${MODULE_ID}.manifesters.-=${linked.id}`]: null});
  if (cleared > 0) {
    ui.notifications.info(
      game.i18n.format("PF1-Psionics.Manifesters.OrphanedNotice", {count: cleared}),
    );
  }
}

async function demoteLinkedRecordToManual(item) {
  const linked = findLinkedRecord(item);
  if (!linked) return;
  const path = `flags.${MODULE_ID}.manifesters.${linked.id}`;
  await item.parent.update({
    [`${path}.source`]: "manual",
    [`${path}.class.itemId`]: null,
    [`${path}._lastTag`]: item.system.tag ?? linked.record._lastTag ?? null,
  });
}

Hooks.on("createItem", onCreateItemHook);
Hooks.once("libWrapper.Ready", injectItemDeleteWrap);
