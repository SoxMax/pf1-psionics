import {MODULE_ID} from "../../_module.mjs";
import {registerPsionicApplyEnricher} from "./apply.mjs";
import {registerPsionicBrowseEnricher} from "./browse.mjs";
import {registerPsionicConditionEnricher} from "./condition.mjs";

/**
 * @param {Element} el
 * @param {string} icon
 */
export function setIcon(el, icon) {
  const i = document.createElement("i");
  i.inert = true;
  i.classList.add(...icon.split(" "));
  el.prepend(i, " ");
}

/**
 * Get most relevant roll data
 *
 * @param {ChatMessagePF} message
 * @returns {object} - Roll data
 */
export function getRollData(message) {
  // Get action, item, or actor
  let srcDoc = message.actionSource ?? message.itemSource;
  srcDoc ??= message.speaker ? ChatMessage.getSpeakerActor(message.speaker) : null;
  const rollData = srcDoc?.getRollData();

  // Apply cached values from system.config (cl, sl, critMult)
  const cfg = message.system?.config;
  if (cfg && rollData) {
    if (cfg.cl !== undefined) rollData.cl = cfg.cl;
    if (cfg.sl !== undefined) rollData.sl = cfg.sl;
    if (cfg.critMult !== undefined) rollData.critMult = cfg.critMult;
  }

  // Apply augments from module flags (not system.config - see message-rolldata-persistence.md)
  const augments = message.getFlag(MODULE_ID, "augments");
  if (augments !== undefined && rollData) {
    rollData.augments = augments;
  }

  return rollData;
}

/**
 * Parses duration string into distinct time and unit.
 *
 * @param {string} duration
 */
export function parseDuration(duration) {
  const re = /^(?<time>\d+)(?<unit>[a-z]+)?$/.exec(duration);
  if (!re) return [];
  const { time, unit } = re.groups;

  const unitLabel = (() => {
    switch (unit?.[0]?.toLowerCase()) {
      default:
      case "r":
        return game.i18n.localize("PF1.Time.Period.round.Label");
      case "s":
        return game.i18n.localize("PF1.Time.Period.second.Label");
      case "h":
        return game.i18n.localize("PF1.Time.Period.hour.Label");
      case "m":
        return game.i18n.localize("PF1.Time.Period.minute.Label");
    }
  })();

  return [parseInt(time), unit || "r", unitLabel];
}

/**
 * Get Chat Message
 *
 * @param {HTMLElement} target
 * @returns {ChatMessagePF|undefined}
 */
export function getMessage(target) {
  const messageId = target.closest("[data-message-id]")?.dataset.messageId;
  return game.messages.get(messageId);
}

export function registerPsionicEnrichers() {
  registerPsionicApplyEnricher();
  registerPsionicBrowseEnricher();
  registerPsionicConditionEnricher();
}
