/**
 * PF1 Psionics Module Entry Point
 *
 * This file serves as the entry point for the module, loaded by module.json.
 * Each imported module registers its own hooks when loaded.
 *
 * @module psionics
 */

// Core lifecycle hooks
import "./hooks/setup.mjs";
import "./hooks/init.mjs";
import "./hooks/i18n.mjs";
import "./hooks/ready.mjs";
import "./hooks/rolls.mjs";
import "./hooks/compendium-directory.mjs";

// Document hooks & libWrapper injections
import "./documents/actor/actor-pf.mjs";
import "./documents/item/item.mjs";
import "./documents/action/action.mjs";
import "./documents/action/action-use.mjs";
import "./documents/action/attack-dialog.mjs";

// Application render hooks & libWrapper injections
import "./applications/actor/actor-sheet.mjs";
import "./applications/item/item-sheet.mjs";
import "./applications/item/action-sheet.mjs";

// Quench test registration (if available)
// Quench test registration (optional)
if (game?.modules?.get("fvtt-quench")?.active) {
  import("../test/quench/index.mjs").catch((err) => {
    console.warn("pf1-psionics | Quench tests not loaded:", err);
  });
}
