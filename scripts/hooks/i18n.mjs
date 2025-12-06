import { MODULE_ID } from "../_module.mjs";

function i18nHook() {
	console.log(`${MODULE_ID} | Localizing`);
	for (let key of Object.keys(pf1.config.psionics.disciplines)) {
		pf1.config.psionics.disciplines[key] = game.i18n.localize(pf1.config.psionics.disciplines[key]);
	}
	for (let key of Object.keys(pf1.config.psionics.subdisciplines)) {
		pf1.config.psionics.subdisciplines[key] = game.i18n.localize(pf1.config.psionics.subdisciplines[key]);
	}
	for (let key of Object.keys(pf1.config.psionics.powerLevels)) {
		pf1.config.psionics.powerLevels[key] = game.i18n.localize(pf1.config.psionics.powerLevels[key]);
	}
}

Hooks.once("i18nInit", i18nHook);

