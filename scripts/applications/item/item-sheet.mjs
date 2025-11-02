export function renderItemHook(app, html, data) {
	let item = app.object;

	if (item.type === "class") {
		injectManifesting(app, html, data);
	}
}

async function injectManifesting(app, html, data) {
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
}
