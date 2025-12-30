import {MODULE_ID} from "../../_module.mjs";
import {RollPF} from "../../../ruleset/pf1e/module/dice/roll.mjs";
import { setIcon, getRollData, parseDuration, getMessage } from "./common.mjs";

/**
 * Click handler for @PsionicCondition enricher.
 *
 * Applies, toggles, or removes conditions with support for duration formulas
 * using roll data from the chat message (including augments).
 *
 * @param {Event} event - Click event
 * @param {HTMLElement} target - Clicked element
 */
async function onPsionicCondition(event, target) {
  const { condition, toggle, remove, duration, options, vars, info } = target.dataset;

  const cond = pf1.registry.conditions.getAliased(condition);
  if (!cond) throw new Error(`Condition "${condition}" not found!`); // TODO: Error notification

  let enableConfig = !remove;

  let seconds = duration;
  // Determine duration
  if (duration && !info) {
    const [time, unit] = parseDuration(duration);
    if (time) {
      const units = {
        s: 1,
        r: CONFIG.time.roundTime,
        m: 60,
        h: 60 * 60,
      };
      seconds = time * (units[unit?.[0]] ?? CONFIG.time.roundTime);
    }
  }

  if (info) {
    /** @type {JournalEntry} */
    const journal = cond?.journal;
    if (!journal) throw new Error(`Journal entry not found for condition "${condition}"`);
    return void pf1.utils.openJournal(journal);
  }

  const targetRollData = vars === "target";
  let rollData;

  if (seconds && !Number.isFinite(seconds) && !targetRollData) {
    rollData = getRollData(getMessage(target));
    seconds = (await RollPF.safeRoll(seconds, rollData)).total * CONFIG.time.roundTime;
  }

  const actors = pf1.chat.enrichers.getRelevantActors(target);

  for (const actor of actors) {
    if (!remove && seconds) {
      // Flat number
      if (Number.isFinite(seconds)) {
        enableConfig = { duration: { seconds } };
      }
      // Roll
      else {
        if (targetRollData) rollData = actor.getRollData();
        else
          rollData ??= enableConfig = {
            duration: { seconds: (await RollPF.safeRoll(seconds, rollData)).total * CONFIG.time.roundTime },
          };
      }
    }

    if (toggle) {
      actor.toggleCondition(condition, enableConfig);
    } else {
      actor.setCondition(condition, enableConfig);
    }
  }
}

/**
 * Register the @PsionicCondition enricher as an independent enricher.
 *
 * This enricher applies conditions with support for duration formulas that can
 * access augments and other roll data from chat messages.
 *
 * Syntax: @PsionicCondition[conditionName;duration=@cl;toggle]{Label}
 *
 * The enricher is registered in the ready hook after all setup hooks complete.
 */
export function registerPsionicConditionEnricher() {
  const enricher = new pf1.chat.enrichers.PF1TextEnricher(
      "psionicCondition",
      /@PsionicCondition\[(?<condition>\w+)(?:;(?<options>.*?))?](?:\{(?<label>.*?)})?/g,
      (match) => {
        const { condition, options, label } = match.groups;

        let cond = pf1.registry.conditions.getAliased(condition);
        if (!cond) {
          // No direct match, find closest matching conditions and take the one with longest ID
          const condId = [
            ...pf1.registry.conditions.keys(),
            ...[...pf1.registry.conditions.values()].map((e) => [...e.aliases]).flat(),
          ]
          .filter((c) => c.startsWith(condition))
          .sort((a, b) => b.length - a.length)[0];
          cond = pf1.registry.conditions.getAliased(condId);
        }
        let text = label || cond?.name || condition;

        const broken = !cond;

        const a = pf1.chat.enrichers.createElement({ click: true, handler: "condition", options, broken });
        if (!cond) a.classList.add("broken");

        a.dataset.condition = cond?.id || condition;

        if (a.dataset.disable) a.dataset.remove = true;

        if (a.dataset.info) {
          setIcon(a, "fa-solid fa-book");
          if (!cond?.journal) a.classList.add("broken");
        } else if (a.dataset.remove) {
          setIcon(a, "fa-solid fa-minus");
          a.dataset.tooltip = game.i18n.format("PF1.EnrichedText.Remove", { value: text });
        } else if (a.dataset.toggle) {
          setIcon(a, "fa-solid fa-plus-minus");
          a.dataset.tooltip = game.i18n.format("PF1.EnrichedText.Toggle", { value: text });
        } else {
          setIcon(a, "fa-solid fa-plus");
          a.dataset.tooltip = game.i18n.format("PF1.EnrichedText.Add", { value: text });
        }

        if (a.dataset.duration) {
          let [period, _, unit] = parseDuration(a.dataset.duration);
          if (!period) {
            // On parse failing, treat it as complex formula
            period = a.dataset.duration;
            unit = game.i18n.localize("PF1.Time.Period.round.Label");
          }
          a.dataset.tooltip += "<br>" + game.i18n.format("PF1.EnrichedText.Condition.Duration", { unit, period });
          text = game.i18n.format("PF1.ForDuration", {
            subject: text,
            duration: game.i18n.format("PF1.Time.Format", { value: period, unit }),
          });
        }

        a.append(text);

        return a;
      },
      {
        click: onPsionicCondition,
      }
  );

  pf1.chat.enrichers.enrichers.push(enricher);

  console.log(`${MODULE_ID} | @PsionicCondition enricher registered`);
}

