import {MODULE_ID} from "../../_module.mjs";
import {setIcon} from "./common.mjs";

/**
 * Click handler for @PsionicBrowse enricher.
 *
 * Extracts all filter parameters from the element's dataset and passes them
 * to the browser's _queueFilters method, then opens the browser.
 *
 * @param {Event} event - Click event
 * @param {HTMLElement} target - Clicked element
 */
async function onPsionicBrowse(event, target) {
  const {category} = target.dataset;
  const browser = pf1.applications.compendiums[category];

  if (!browser) {
    console.warn(`${MODULE_ID} | @PsionicBrowse | Could not find compendium browser for category`, category);
    return;
  }

  // Extract all filter parameters from dataset
  const filters = {};

  // Non-filter attributes to skip
  const skipKeys = new Set([
    "category", "handler", "tooltipClass", "tooltip",
    "name", "label", "icon", "options", "uuid",
  ]);

  // Map dataset keys to filter values
  for (const [key, value] of Object.entries(target.dataset)) {
    if (skipKeys.has(key)) continue;

    // Parse semicolon-separated values
    const values = String(value).split(";").map(v => v.trim()).filter(v => v);
    if (values.length > 0) {
      filters[key] = values;
    }
  }
}

/**
 * Register the @PsionicBrowse enricher as an independent enricher.
 *
 * This enricher opens the compendium browser with support for passing
 * filter parameters via dataset attributes (level, discipline, etc.).
 *
 * Syntax: @PsionicBrowse[psionicPowers;subdiscipline=healing]
 *
 * The enricher is registered in the ready hook after all setup hooks complete.
 */
export function registerPsionicBrowseEnricher() {
  const enricher = new pf1.chat.enrichers.PF1TextEnricher(
      "psionicBrowse",
      /@PsionicBrowse\[(?<category>\w+)(?:;(?<options>.*?))?](?:\{(?<label>.*?)})?/g,
      (match) => {
        const {category, label, options} = match.groups;
        const a = pf1.chat.enrichers.createElement({click: true, handler: "psionicBrowse", options});

        a.dataset.category = category;

        let mainlabel;
        const browser = pf1.applications.compendiumBrowser.CompendiumBrowser.BROWSERS[category];
        if (!browser) {
          setIcon(a, "fa-solid fa-link-slash");
          a.classList.add("invalid");
          mainlabel = category;
        } else {
          setIcon(a, "fa-solid fa-book");
          mainlabel = game.i18n.localize(browser.typeName);
        }

        mainlabel = game.i18n.format("PF1.EnrichedText.Browse", {value: mainlabel});

        if (label) a.append(label);
        else a.append(mainlabel);

        pf1.chat.enrichers.generateTooltip(a);

        if (label) a.dataset.tooltip = mainlabel;
        if (!browser) {
          if (label) a.dataset.tooltip += "<br>";
          a.dataset.tooltip +=
              game.i18n.localize("PF1.EnrichedText.Error") +
              ": " +
              game.i18n.localize("PF1.EnrichedText.Errors.NoCategory");
        }

        return a;
      },
      {
        click: onPsionicBrowse,
      },
  );

  pf1.chat.enrichers.enrichers.push(enricher);

  console.log(`${MODULE_ID} | @PsionicBrowse enricher registered`);
}
