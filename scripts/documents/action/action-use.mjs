import { MODULE_ID } from "../../_module.mjs";

export function injectActionUse() {
  libWrapper.register(MODULE_ID, "pf1.actionUse.ActionUse.prototype.getMessageData", function () {
    if (this.item.type === `${MODULE_ID}.power`) {
      this.shared.templateData.casterLevelCheck = this.shared.casterLevelCheck;
      this.shared.templateData.concentrationCheck = this.shared.concentrationCheck;
    }
  }, "LISTENER");
}

export function pf1PreActionUseHook(actionUse) {
  if (actionUse.item.type === `${MODULE_ID}.power`) {
    // Handle power cost too expensive.
    const chargeCost = actionUse.shared.rollData.chargeCost || 0;
    const cl = actionUse.shared.rollData.cl || 0;
    if( chargeCost > cl ) {
      ui.notifications.error(game.i18n.localize("PF1-Psionics.Error.PowerCostTooHigh"));
      return false;
    }
  }
}