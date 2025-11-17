import {MODULE_ID} from "../../_module.mjs";

export function injectItemAction() {
  libWrapper.register(MODULE_ID, "pf1.components.ItemAction.prototype.getDC", function(wrapped, rollData) {
    if (this.item.type === `${MODULE_ID}.power`) {
      rollData ??= this.getRollData();

      // Get conditional save DC bonus
      /** @type {number} */
      const dcBonus = rollData.dcBonus ?? 0;

      /** @type {object} */
      const manifestor = this.item.manifestor;
      if ( manifestor) {
        /** @type {string} */
        let formula =  manifestor.baseDCFormula;

        /** @type {object} - Item action "data" */
        const data = rollData.action;
        if (data.save.dc) formula += ` + ${data.save.dc}`;

        /** @type {number} */
        const dcSchoolBonus = rollData.attributes.spells?.school?.[this.item.system.school]?.dc ?? 0;
        /** @type {number} */
        const universalDCBonus = rollData.attributes?.spells?.school?.all?.dc ?? 0;

        return RollPF.safeRollSync(formula, rollData).total + dcBonus + dcSchoolBonus + universalDCBonus;
      } else {
        // Assume standard base formula for spells with minimum required abilty score
        /** @type {number} */
        const level = this.item.system.level ?? 1;
        const minAbl = Math.floor(level / 2);
        return 10 + level + minAbl + dcBonus;
      }
    }
    return wrapped(rollData);
  }, "MIXED");
}