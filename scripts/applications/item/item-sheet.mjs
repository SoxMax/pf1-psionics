import {addClassManifester} from "../../documents/item/item.mjs";

export function renderItemHook(app, html, data) {
	let item = app.object;

	if (item.type === "class") {
		injectManifesting(app, html, data);
	}
}

async function injectManifesting(app, html, data) {
  if (app.document?.actor)
    data.hasManifestor = Object.values(data.rollData.psionics ?? {}).some(
        (manifestor) => !!manifestor.class && manifestor.class === app.document.system.tag && manifestor.inUse
    );
  else {
    data.hasManifestor = true; // Not true, but avoids unwanted behaviour.
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

	// Add event listener for create-manifestor button
	html.find("button[name='create-manifestor']").on("click", async (event) => {
		event.preventDefault();
		await addClassManifester(app.document);
	});
}
