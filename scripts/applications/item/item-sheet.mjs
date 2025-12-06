import {addClassManifester} from "../../documents/item/item.mjs";

function renderItemHook(app, html, data) {
  if (app.object.type === "class") {
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
	let previousSelect = html.find("select[name='system.savingThrows.will.value']");
	previousSelect.parent().after(manifestingConfig);

	// Add event listener for create-manifester button
	html.find("button[name='create-manifester']").on("click", async (event) => {
		event.preventDefault();
		await addClassManifester(app.document);
	});
}

Hooks.on("renderItemSheet", renderItemHook);

