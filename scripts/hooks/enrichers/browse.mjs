import { MODULE_ID } from "../../_module.mjs";

/**
 * Enhanced click handler for @Browse enricher.
 *
 * Extracts all filter parameters from the element's dataset and passes them
 * to the browser's _queueFilters method, then opens the browser.
 *
 * @param {Function} originalClick - Original click handler to fall back to
 * @param {Event} event - Click event
 * @param {HTMLElement} target - Clicked element
 */
function enhancedBrowseClick(originalClick, event, target) {
	const { category } = target.dataset;
	const browser = pf1.applications.compendiums[category];

	if (!browser) {
		// Fall back to original if browser doesn't exist
		return originalClick.call(this, event, target);
	}

	// Extract all filter parameters from dataset
	const filters = {};

	// Non-filter attributes to skip
	const skipKeys = new Set([
		"category", "handler", "tooltipClass", "tooltip",
		"name", "label", "icon", "options"
	]);

	// Map dataset keys to filter values
	for (const [key, value] of Object.entries(target.dataset)) {
		if (skipKeys.has(key)) continue;

		// Parse semicolon-separated values
		const values = value.split(";").map(v => v.trim()).filter(v => v);
		if (values.length > 0) {
			filters[key] = values;
		}
	}

	// Apply filters if any were found
	if (Object.keys(filters).length > 0) {
		browser._queueFilters(filters);
	}

	// Open the browser
	browser.render(true, { focus: true });
}

/**
 * Enhance the @Browse enricher to pass all filter parameters.
 *
 * Runs in ready hook (after all setup hooks complete) to ensure PF1's enrichers
 * are registered. Replaces the browse enricher's click handler to pass ALL filter
 * parameters (level, discipline, subdiscipline, etc.) instead of just tags.
 */
export function enhanceBrowseEnricher() {
	// Find the browse enricher (registered by PF1 in setup)
	const browseEnricher = CONFIG.TextEditor.enrichers.find(e => e.id === "browse");

	if (!browseEnricher) {
		console.warn(`${MODULE_ID} | Could not find browse enricher to enhance`);
		return;
	}

	// Store original click handler
	const originalClick = browseEnricher.click;

	// Replace with enhanced version
	browseEnricher.click = function(event, target) {
		return enhancedBrowseClick.call(this, originalClick, event, target);
	};

	console.log(`${MODULE_ID} | @Browse enricher enhanced`);
}
