import {addClassManifester} from "../../documents/item/item.mjs";

function renderItemHook(app, html, data) {
  if (app.object.type === "class") {
    // Foundry v13 passes HTMLElement to render hooks; v12 passes jQuery. Normalize to HTMLElement.
    if (html instanceof jQuery) html = html[0];
    injectManifesting(app, html, data);
  }
}

async function injectManifesting(app, html, data) {
  if (app.document?.actor)
    data.hasManifester = Object.values(data.rollData.psionics ?? {}).some(
        (manifester) => !!manifester.class && manifester.class === app.document.system.tag && manifester.inUse
    );
  else {
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

