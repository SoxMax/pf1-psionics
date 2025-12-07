import { MODULE_ID } from "../../../_module.mjs";

// Define BOOLEAN_OPERATOR locally to avoid import issues
const BOOLEAN_OPERATOR = {
	AND: "AND",
	OR: "OR",
	NONE: false,
};

/**
 * Filter for psionic power levels (1-9, 0 for talents)
 */
export class PsionicPowerLevelFilter extends pf1.applications.compendiumBrowser.filters.CheckboxFilter {
	static label = "PF1-Psionics.Powers.Level";
	static indexField = "system.level";
	static type = `${MODULE_ID}.power`;
	static autoSort = false;
	static defaultBooleanOperator = BOOLEAN_OPERATOR.OR;
	static booleanOperator = false;

	/** @override */
	prepareChoices() {
		const levels = {};
		levels[0] = game.i18n.localize("PF1-Psionics.Powers.Levels.0");
		for (let i = 1; i <= 9; i++) {
			levels[i] = game.i18n.localize(`PF1-Psionics.Powers.Levels.${i}`);
		}
		const choices = this.constructor.getChoicesFromConfig(levels);
		for (const choice of choices) {
			choice.key = Number(choice.key);
		}
		this.choices = choices;
	}
}

/**
 * Filter for psionic disciplines (psychokinesis, telepathy, etc.)
 */
export class PsionicDisciplineFilter extends pf1.applications.compendiumBrowser.filters.CheckboxFilter {
	static label = "PF1-Psionics.Discipline.Singular";
	static indexField = "system.discipline";
	static type = `${MODULE_ID}.power`;

	/** @override */
	prepareChoices() {
		this.choices = this.constructor.getChoicesFromConfig(pf1.config.psionics.disciplines);
	}
}

/**
 * Filter for psionic subdisciplines
 */
export class PsionicSubdisciplineFilter extends pf1.applications.compendiumBrowser.filters.CheckboxFilter {
	static label = "PF1-Psionics.Subdiscipline.Singular";
	static indexField = "system.subdiscipline";
	static type = `${MODULE_ID}.power`;

	/** @override */
	async prepareChoices() {
		await super.prepareChoices();
		const configChoices = this.constructor.getChoicesFromConfig(pf1.config.psionics.subdisciplines);
		for (const choice of configChoices) {
			this.choices.set(choice.key, choice);
		}
	}
}

/**
 * Filter for psionic descriptors (mind-affecting, etc.)
 */
export class PsionicDescriptorFilter extends pf1.applications.compendiumBrowser.filters.CheckboxFilter {
	static label = "PF1.Descriptor";
	static indexField = "system.descriptors";
	static type = `${MODULE_ID}.power`;
	static defaultBooleanOperator = BOOLEAN_OPERATOR.OR;

	/** @override */
	async prepareChoices() {
		await super.prepareChoices();
		const configChoices = this.constructor.getChoicesFromConfig(pf1.config.spellDescriptors);
		for (const choice of configChoices) {
			this.choices.set(choice.key, choice);
		}
	}
}

/**
 * Filter for manifesting classes (psion, wilder, psychic warrior, etc.)
 */
export class PsionicManifesterClassFilter extends pf1.applications.compendiumBrowser.filters.CheckboxFilter {
	static label = "PF1-Psionics.ManifestingClass";
	static indexField = "system.learnedAt.class";
	static type = `${MODULE_ID}.power`;
	static defaultBooleanOperator = BOOLEAN_OPERATOR.OR;

	/** @override */
	async prepareChoices() {
		await super.prepareChoices();
		const classNames = await pf1.utils.packs.getClassIDMap();
		const configChoices = this.constructor.getChoicesFromConfig(classNames);
		for (const choice of configChoices) {
			if (this.choices.has(choice.key)) {
				this.choices.set(choice.key, choice);
			}
		}
	}
}


