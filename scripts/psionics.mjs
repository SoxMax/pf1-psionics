import { readyHook} from "./hooks/ready.mjs";
import { i18nHook } from "./hooks/i18n.mjs";
import { initHook } from "./hooks/init.mjs";
import { setupHook } from "./hooks/setup.mjs";
import {
  injectActorPF,
  onPreCreateActor,
  pf1ActorRest,
  pf1PrepareBaseActorData,
  pf1PrepareDerivedActorData,
} from "./documents/actor/actor-pf.mjs";
import { injectActorSheetPF, renderActorHook } from "./applications/actor/actor-sheet.mjs";
import { renderItemHook, onCreatePsionicClassItem } from "./applications/item/item-sheet.mjs";
import { injectItemAction } from "./documents/action/action.mjs";
import { injectActionUse, pf1PreActionUseHook } from "./documents/action/action-use.mjs";
import { renderAttackDialogHook } from "./documents/action/attack-dialog.mjs";
import { onGetRollData } from "./utils.mjs";

/**
 * Module hooks for initialization, localization, and rendering.
 */

Hooks.once("setup", setupHook);

/**
 * Executes when the module is initialized.
 * It registers the configuration settings and item types for the module.
 */
Hooks.once("init", initHook);

/**
 * Executes when the i18n localization system is initialized.
 * It localizes the labels for power types, save types, and save effects.
 */
Hooks.once("i18nInit", i18nHook);

/**
 * Executes when all data is ready and the module is fully loaded.
 * It registers the Power Browser and performs migration tasks for old actors.
 * Additionally, it shows a welcome dialog to users who have installed the module for the first time.
 */
Hooks.once("ready", readyHook);

Hooks.on("pf1PrepareBaseActorData", pf1PrepareBaseActorData);

Hooks.on("pf1PrepareDerivedActorData", pf1PrepareDerivedActorData);

Hooks.on("pf1ActorRest", pf1ActorRest);

/**
 * Executes when the Actor sheet is rendered.
 * It adds a custom "Browse" button for powers to the Actor sheet UI.
 * This button allows users to quickly access the Power Browser from the Actor sheet.
 * The button is styled and configured to trigger the `powerBrowser` function when clicked.
 */
Hooks.on("renderActorSheetPF", renderActorHook);

Hooks.on("renderAttackDialog", renderAttackDialogHook);

/**
 * Executes when the Item sheet is rendered.
 * It modifies the visibility of certain fields based on the type of power being edited.
 * Specifically, it hides or shows the save information and charges information based on the power type and save type.
 * It also adjusts the display of headers for save effects and charges.
 */
Hooks.on("renderItemSheet", renderItemHook);

/**
 * Executes when RollData is requested.
 * It adds the manifestation modifier to the roll data for actors using the Psionics system.
 * This allows for accurate calculations during combat and power rolls.
 *
 */
Hooks.on("pf1GetRollData", onGetRollData);

Hooks.on("pf1PreActionUse", pf1PreActionUseHook);

Hooks.on("preCreateActor", onPreCreateActor);

Hooks.on("createItem", onCreatePsionicClassItem);

Hooks.once("libWrapper.Ready", () => {
  injectActorPF();
	injectActorSheetPF();
	injectItemAction();
	injectActionUse();
});

// Hooks.on("createItem", (item, options, userId) => {
// 	registerConditions();
// });

