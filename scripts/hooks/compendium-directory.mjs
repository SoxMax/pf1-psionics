import { MODULE_ID } from "../_module.mjs";

/**
 * Add Browse Powers button to the Compendium Directory.
 *
 * This hook adds a "Browse Powers" button to the compendium browser buttons,
 * allowing users to quickly open the Psionic Power Browser from the
 * Compendium Directory sidebar.
 *
 * @param {CompendiumDirectory} app
 * @param {HTMLElement|JQuery} html
 */
function renderCompendiumDirectory(app, html) {
  if (html instanceof jQuery) html = html[0]; // v12/v13 cross compatibility

  // Find the existing button section created by PF1
  const buttonSection = html.querySelector("section.pf1.action-buttons");
  if (!buttonSection) return; // PF1 buttons not yet rendered, skip

  // Check if we've already added our button to avoid duplicates
  if (buttonSection.querySelector("button[data-category='psionicPowers']")) return;

  // Create the Browse Powers button
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.category = "psionicPowers";
  button.classList.add("compendium", "psionicPowers");
  button.innerText = game.i18n.localize("PF1-Psionics.Browse");
  button.addEventListener("click", compendiumButtonClick);

  // Insert the button after the Browse Spells button for logical grouping
  const spellsButton = buttonSection.querySelector("button[data-category='spells']");
  if (spellsButton) {
    spellsButton.after(button);
  } else {
    // If no spells button, just append it
    buttonSection.append(button);
  }
}

/**
 * Handle clicks on the Browse Powers button.
 *
 * @param {Event} event - Click event
 */
function compendiumButtonClick(event) {
  event.preventDefault();

  // Get the psionic powers browser instance
  const browser = pf1.applications.compendiums?.psionicPowers;

  if (!browser) {
    console.warn(`${MODULE_ID} | Psionic Powers browser not found`);
    return;
  }

  // Open the browser
  browser.render(true, { focus: true });
}

// Register the hook to render after PF1's buttons are rendered
// Using the priority mechanism to ensure this runs after PF1's renderCompendiumDirectory
Hooks.on("renderCompendiumDirectory", renderCompendiumDirectory);

console.log(`${MODULE_ID} | Compendium Directory hook registered`);

