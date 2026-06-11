import {MODULE_ID} from "../../_module.mjs";
import {getCollection} from "../actor/manifester-store.mjs";

/**
 * On class item create on an actor, ensure a manifester record exists for
 * the class tag. Predicate for "is a manifesting class":
 * flags.pf1-psionics.manifesting.progression is set and not "none".
 * Soulknife sets "none" to opt out.
 */
async function onCreateItemHook(item, _options, _userId) {
  if (item.type === "class") {
    await addClassManifester(item);
  }
}

export async function addClassManifester(item) {
  try {
    const manifesting = item.getFlag(MODULE_ID, "manifesting");
    if (!manifesting?.progression || manifesting.progression === "none") return;
    const actor = item.parent;
    if (!actor) return;
    const tag = item.system?.tag;
    if (!tag) {
      console.warn(`${MODULE_ID} | Class item '${item.name}' has no tag; cannot create manifester record.`);
      return;
    }

    const collection = getCollection(actor);
    if (collection.manifesters[tag]) {
      // Already linked — idempotent return.
      return;
    }

    await collection.create(tag, {
      source: "class",
      casterType: manifesting.progression,
      ability: manifesting.ability || "int",
      hasCantrips: !!manifesting.cantrips,
    });
    console.log(`${MODULE_ID} | Created manifester '${tag}' on actor '${actor.name}'.`);
  } catch (err) {
    console.error(`${MODULE_ID} | Failed creating manifester for class:`, err);
  }
}

/**
 * Find powers on `actor` whose `system.manifester` points at `manifesterTag`.
 * @param {Actor} actor
 * @param {string} manifesterTag
 * @returns {Item[]}
 */
export function findOrphanedPowers(actor, manifesterTag) {
  return actor.itemTypes[`${MODULE_ID}.power`]?.filter(
    (p) => p.system.manifester === manifesterTag,
  ) ?? [];
}

/**
 * Delete every power referencing `manifesterTag`. Returns count deleted.
 * @param {Actor} actor
 * @param {string} manifesterTag
 * @returns {Promise<number>}
 */
export async function deleteManifesterPowers(actor, manifesterTag) {
  const powers = findOrphanedPowers(actor, manifesterTag);
  if (powers.length === 0) return 0;
  await actor.deleteEmbeddedDocuments("Item", powers.map((p) => p.id));
  return powers.length;
}

/**
 * Pending cleanup actions to perform AFTER a class item finishes deletion.
 * Keyed by item uuid. Populated by the (sync) preDeleteItem hook (which
 * shows the dialog and records the user's choice), drained by the
 * deleteItem post-hook (which performs the async work — power deletion,
 * flag update — once Foundry has actually removed the class item).
 *
 * Foundry's preDeleteItem allows synchronous veto (return false) but does
 * NOT await async hook bodies. Splitting pre/post like this keeps the
 * destructive work outside the veto window and ensures bulk-delete via
 * actor.deleteEmbeddedDocuments still triggers cleanup per-document.
 *
 * @type {Map<string, "remove" | "keep">}
 */
const pendingClassActions = new Map();

/**
 * preDeleteItem handler. Synchronous. Prompts user via a fire-and-forget
 * dialog; the dialog choice is stashed for the post-delete hook. Returns
 * `false` to veto only when the user explicitly cancels.
 *
 * Note: because Foundry doesn't await this hook, the dialog runs in
 * parallel with the actual delete. We veto immediately for "cancel", but
 * "remove" / "keep" choices are applied after the delete completes via
 * the deleteItem hook. The user sees the dialog before the visual change
 * propagates in practice.
 *
 * For a fully synchronous gate we would have to libWrapper Item.delete —
 * which is what this design deliberately moves AWAY from.
 */
function onPreDeleteItem(item, _options, _userId) {
  if (item.type !== "class" || !item.parent) return;
  const linked = findLinkedRecord(item);
  if (!linked) return;
  // Fire-and-forget dialog. Stash the choice for the post-delete hook.
  // Default to "keep" — the previous design defaulted to a destructive
  // action which destroyed power data on a stray Enter keypress.
  promptClassManifesterRemoval(item, linked).then((choice) => {
    if (choice === "remove" || choice === "keep") {
      pendingClassActions.set(item.uuid, { choice, tag: linked.tag });
    }
  }).catch((err) => console.error(`${MODULE_ID} | Manifester removal prompt failed:`, err));
}

/**
 * deleteItem handler. Runs after Foundry removes the class item. Drains
 * the pending action recorded by preDeleteItem and performs the async
 * cleanup.
 */
async function onDeleteItem(item, _options, _userId) {
  if (item.type !== "class" || !item.parent) return;
  const pending = pendingClassActions.get(item.uuid);
  pendingClassActions.delete(item.uuid);
  if (!pending) return;
  const {choice, tag} = pending;
  const actor = item.parent;
  if (!actor) return;
  if (choice === "remove") {
    await removeLinkedRecord(actor, tag);
  } else if (choice === "keep") {
    await demoteLinkedRecordToManual(actor, tag, item.system?.tag);
  }
}

function findLinkedRecord(item) {
  const actor = item.parent;
  if (!actor) return null;
  const tag = item.system?.tag;
  if (!tag) return null;
  const collection = getCollection(actor);
  const record = collection.manifesters[tag];
  return record ? {tag, record} : null;
}

async function promptClassManifesterRemoval(item, linked) {
  const powerCount = findOrphanedPowers(item.parent, linked.tag).length;
  const className = item.name;
  const recordName = linked.record.name || className;
  const powerMsg = powerCount > 0
    ? game.i18n.format("PF1-Psionics.Manifesters.DeleteWarning", {count: powerCount})
    : "";

  const choice = await foundry.applications.api.DialogV2.wait({
    window: {title: game.i18n.localize("PF1-Psionics.Manifesters.ConfirmRemovalTitle")},
    content: `<p>${game.i18n.format("PF1-Psionics.Manifesters.ConfirmRemovalBody", {class: className, manifester: recordName})}</p>${powerMsg ? `<p>${powerMsg}</p>` : ""}`,
    buttons: [
      {action: "keep", label: game.i18n.localize("PF1-Psionics.Manifesters.KeepRecord"), default: true},
      {action: "remove", label: game.i18n.localize("PF1-Psionics.Manifesters.RemoveRecord")},
    ],
    rejectClose: false,
  });

  return choice ?? "keep";
}

/**
 * Remove a manifester record AND delete every power that references it.
 * Used by the class-delete cleanup path and the actor-sheet trash button.
 */
export async function removeLinkedRecord(actor, tag) {
  if (!actor || !tag) return;
  const collection = getCollection(actor);
  if (!collection.manifesters[tag]) return;
  const deleted = await deleteManifesterPowers(actor, tag);
  await collection.delete(tag);
  if (deleted > 0) {
    ui.notifications.info(
      game.i18n.format("PF1-Psionics.Manifesters.DeletedNotice", {count: deleted}),
    );
  }
}

/**
 * Keep the manifester record after its class item is removed, switching
 * source to manual and stashing the last-known class tag for label
 * fallback.
 */
async function demoteLinkedRecordToManual(actor, tag, lastTag) {
  if (!actor || !tag) return;
  const path = `flags.${MODULE_ID}.manifesters.${tag}`;
  await actor.update({
    [`${path}.source`]: "manual",
    [`${path}._lastTag`]: lastTag ?? tag,
  });
}

Hooks.on("createItem", onCreateItemHook);
Hooks.on("preDeleteItem", onPreDeleteItem);
Hooks.on("deleteItem", onDeleteItem);
