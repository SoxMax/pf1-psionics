import { ManifesterCollection } from "../../dataModels/actor/manifester-collection.mjs";

/**
 * Per-actor weak cache of hydrated ManifesterCollection. Invalidated by
 * onUpdateActor when the manifesters flag changes.
 */
const cache = new WeakMap();

/**
 * Get the actor's hydrated ManifesterCollection. Reads from cache; rebuilds
 * on miss.
 *
 * @param {Actor} actor
 * @returns {ManifesterCollection}
 */
export function getCollection(actor) {
  let collection = cache.get(actor);
  if (!collection) {
    collection = ManifesterCollection.fromActor(actor);
    cache.set(actor, collection);
  }
  return collection;
}

/**
 * Invalidate the cache for an actor. Call when the manifesters flag is
 * known to have changed.
 *
 * @param {Actor} actor
 */
export function invalidateCollection(actor) {
  cache.delete(actor);
}

/**
 * Hook handler — invalidate cache whenever the manifesters flag changes.
 * Wire in scripts/documents/actor/actor-pf.mjs.
 */
export function onUpdateActor(actor, changed, _options, _userId) {
  if (foundry.utils.hasProperty(changed, "flags.pf1-psionics.manifesters")) {
    invalidateCollection(actor);
  }
}
