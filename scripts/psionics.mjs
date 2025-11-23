import {readyHook} from "./hooks/ready.mjs";
import {i18nHook} from "./hooks/i18n.mjs";
import {initHook} from "./hooks/init.mjs";
import {setupHook} from "./hooks/setup.mjs";
import {
  injectActorPF,
  onPreCreateActor,
  pf1ActorRest,
  pf1PrepareBaseActorData,
  pf1PrepareDerivedActorData,
} from "./documents/actor/actor-pf.mjs";
import {injectActorSheetPF, renderActorHook} from "./applications/actor/actor-sheet.mjs";
import {renderItemHook} from "./applications/item/item-sheet.mjs";
import {injectItemAction} from "./documents/action/action.mjs";
import {injectActionUse, pf1PreActionUseHook} from "./documents/action/action-use.mjs";
import {renderAttackDialogHook} from "./documents/action/attack-dialog.mjs";
import {onCreateItemHook} from "./documents/item/item.mjs";
import {onGetRollData} from "./utils.mjs";
import {renderItemActionSheetHook} from "./applications/item/action-sheet.mjs";

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

Hooks.on("renderActorSheetPF", renderActorHook);

Hooks.on("renderItemActionSheet", renderItemActionSheetHook);

Hooks.on("renderAttackDialog", renderAttackDialogHook);

Hooks.on("createItem", onCreateItemHook);

Hooks.on("renderItemSheet", renderItemHook);

Hooks.on("pf1GetRollData", onGetRollData);

Hooks.on("pf1PreActionUse", pf1PreActionUseHook);

Hooks.on("preCreateActor", onPreCreateActor);

Hooks.once("libWrapper.Ready", () => {
  injectActorPF();
  injectActorSheetPF();
  injectItemAction();
  injectActionUse();
});
