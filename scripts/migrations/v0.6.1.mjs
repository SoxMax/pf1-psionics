import { MODULE_ID } from "../_module.mjs";
import { migrateAllItems } from "./helpers.mjs";

/**
 * Migration for version 0.6.1
 * Moves augments from power item level to action level
 * - Finds all powers with system.augments
 * - Copies those augments to each action in the power
 * - Removes the old system.augments field
 */
export async function migrateToVersion061() {
  console.log(`${MODULE_ID} | Running migration to 0.6.1`);

  await migrateAllItems(`${MODULE_ID}.power`, migratePowerItem, "power items to v0.6.1");

  console.log(`${MODULE_ID} | Migration to 0.6.1 complete`);
}

/**
 * Migrates a single power item to v0.6.1 schema
 * Moves augments from system.augments to system.actions[].augments
 * @param {Item} item - The item to migrate
 * @returns {Promise<boolean>} - True if item was modified
 */
async function migratePowerItem(item) {
  // Only migrate power items
  if (item.type !== `${MODULE_ID}.power`) {
    return false;
  }

  // Check if item has old augments field at power level
  const oldAugments = item._source.system?.augments;

  // Skip if no old augments exist or if it's already empty
  if (!oldAugments || !Array.isArray(oldAugments) || oldAugments.length === 0) {
    return false;
  }

  console.log(`${MODULE_ID} | Migrating power item "${item.name}" - moving ${oldAugments.length} augment(s) to actions`);

  // Get current actions
  const actions = item._source.system?.actions || [];

  if (actions.length === 0) {
    console.warn(`${MODULE_ID} | Power "${item.name}" has augments but no actions - skipping`);
    return false;
  }

  // Build update object
  const updates = {};

  // Copy augments to each action
  actions.forEach((action, index) => {
    // Only add augments if the action doesn't already have them
    if (!action.augments || action.augments.length === 0) {
      updates[`system.actions.${index}.augments`] = oldAugments;
    }
  });

  // Remove old augments field using "-=" syntax
  updates["system.-=augments"] = null;

  // Apply update
  await item.update(updates);

  return true;
}
