import {addClassManifester} from "../../documents/item/item.mjs";

export function renderItemHook(app, html, data) {
  if (app.object.type === "class") {
		injectManifesting(app, html, data);
	}

	// Inject resource costs UI for items that can have charges
	const itemTypesWithCosts = ["feat", "classFeat", "trait", "race", "class"];
	if (itemTypesWithCosts.includes(app.object.type)) {
		injectResourceCosts(app, html, data);
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

async function injectResourceCosts(app, html, data) {
	// Render the resource costs template
	const resourceCostsHTML = await foundry.applications.handlebars.renderTemplate(
		"modules/pf1-psionics/templates/item/parts/resource-costs.hbs",
		data
	);

	// Find the charge cost formula section and inject after it
	// Look for the section containing autoDeductChargesCost or maxChargesFormula
	let insertionPoint = html.find('.tab[data-tab="details"] .form-group').filter(function() {
		return $(this).find('input[name="system.uses.autoDeductChargesCost"]').length > 0 ||
		       $(this).find('input[name="system.uses.maxChargesFormula"]').length > 0;
	}).last();

	if (insertionPoint.length === 0) {
		// Fallback: find the uses section
		insertionPoint = html.find('.tab[data-tab="details"] .form-group').filter(function() {
			return $(this).find('input[name="system.uses.value"]').length > 0;
		});
	}

	if (insertionPoint.length > 0) {
		insertionPoint.after(resourceCostsHTML);
	} else {
		// Fallback: insert at the end of the details tab
		html.find('.tab[data-tab="details"]').append(resourceCostsHTML);
	}

	// Add event listeners
	html.find(".resource-cost-add").on("click", (event) => {
		event.preventDefault();
		addResourceCost(app);
	});

	html.find(".resource-cost-delete").on("click", (event) => {
		event.preventDefault();
		const index = parseInt(event.currentTarget.dataset.index);
		deleteResourceCost(app, index);
	});

	html.find(".resource-cost-clone").on("click", (event) => {
		event.preventDefault();
		const index = parseInt(event.currentTarget.dataset.index);
		cloneResourceCost(app, index);
	});
}

/**
 * Add a new resource cost to the item
 * @param {ItemSheet} app - The item sheet application
 */
async function addResourceCost(app) {
	const currentCosts = Array.isArray(app.document.system.resourceCosts)
		? app.document.system.resourceCosts
		: [];
	const newCosts = [...currentCosts, { tag: "", formula: "1" }];
	await app.document.update({ "system.resourceCosts": newCosts });
}

/**
 * Delete a resource cost from the item
 * @param {ItemSheet} app - The item sheet application
 * @param {number} index - Index of the cost to delete
 */
async function deleteResourceCost(app, index) {
	const currentCosts = Array.isArray(app.document.system.resourceCosts)
		? app.document.system.resourceCosts
		: [];
	const newCosts = currentCosts.filter((_, i) => i !== index);
	await app.document.update({ "system.resourceCosts": newCosts });
}

/**
 * Clone a resource cost
 * @param {ItemSheet} app - The item sheet application
 * @param {number} index - Index of the cost to clone
 */
async function cloneResourceCost(app, index) {
	const currentCosts = Array.isArray(app.document.system.resourceCosts)
		? app.document.system.resourceCosts
		: [];
	const costToClone = currentCosts[index];
	if (!costToClone) return;

	// Create a copy of the cost
	const clonedCost = foundry.utils.deepClone(costToClone);
	const newCosts = [...currentCosts, clonedCost];
	await app.document.update({ "system.resourceCosts": newCosts });
}
