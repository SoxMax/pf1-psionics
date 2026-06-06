import {addClassManifester} from "../../documents/item/item.mjs";

function renderItemHook(app, html, data) {
  if (app.object.type === "class") {
    // Foundry v13 passes HTMLElement to render hooks; v12 passes jQuery. Normalize to HTMLElement.
    if (html instanceof jQuery) html = html[0];
    injectManifesting(app, html, data);
  }
}

async function injectManifesting(app, html, data) {
  if (app.document?.actor) {
    const actor = app.document.actor;
    const manifesters = actor.getFlag("pf1-psionics", "manifesters") ?? {};
    data.hasManifester = Object.values(manifesters).some(
        (m) => m.class?.kind === "class" && m.class?.itemId === app.document.id
    );
  } else {
    data.hasManifester = true; // Not true, but avoids unwanted behaviour.
  }
  data.manifesting = {
    progression: {
      low: "PF1.Low",
      med: "PF1.Medium",
      high: "PF1.High",
    }
  };
  const manifestingConfig = await foundry.applications.handlebars.renderTemplate("modules/pf1-psionics/templates/item/class-manifesting.hbs", data);
  const previousSelect = html.querySelector("select[name='system.savingThrows.will.value']");
  previousSelect?.parentElement?.insertAdjacentHTML("afterend", manifestingConfig);

  // Add event listener for create-manifester button
  const createButton = html.querySelector("button[name='create-manifester']");
  createButton?.addEventListener("click", async (event) => {
    event.preventDefault();
    await addClassManifester(app.document);
  });
}

Hooks.on("renderItemSheet", renderItemHook);

