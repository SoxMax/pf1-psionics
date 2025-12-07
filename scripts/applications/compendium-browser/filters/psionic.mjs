import { MODULE_ID } from "../../../_module.mjs";

// Define BOOLEAN_OPERATOR locally to avoid import issues
const BOOLEAN_OPERATOR = {
	AND: "AND",
	OR: "OR",
	NONE: false,
};

/**
 * Filter for psionic power levels (1-9, 0 for talents)
 *
 * This filter is context-aware: when the Manifesting Class filter is active,
 * it filters by the level at which the selected classes learn the power.
 * When no class filter is active, it filters by the base power level.
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

	/**
	 * Check if an entry matches the active power level filter
	 * When the Manifesting Class filter is active, check class-specific learned levels
	 * Otherwise, check the base power level
	 *
	 * @override
	 */
	checkEntry(entry) {
		// If no levels are selected, pass all entries
		if (this.isDefault) return true;

		// Find the active class filter to determine if we should use class-specific levels
		const browser = this.filter?.browser;
		const classFilter = browser?.filters?.find(
			(f) => f.constructor.name === "PsionicManifesterClassFilter"
		);

		// Check if the class filter has any active choices
		const hasActiveClassFilter =
			classFilter?.choices?.some((choice) => choice.active);

		if (hasActiveClassFilter && entry._classLearnedAtLevels) {
			// When class filter is active, check if any selected class learns this power at the active level
			const activeClasses = Array.from(classFilter.choices)
				.filter((choice) => choice.active)
				.map((choice) => choice.key);

			for (const className of activeClasses) {
				const classLearnLevel = entry._classLearnedAtLevels[className];
				if (
					typeof classLearnLevel === "number" &&
					this.choices.some(
						(choice) => choice.active && choice.key === classLearnLevel
					)
				) {
					return true;
				}
			}
			return false;
		} else {
			// No class filter: use base power level
			const level = entry.system?.level;
			if (typeof level === "number") {
				return this.choices.some((choice) => choice.active && choice.key === level);
			}
			// Handle array case for compatibility
			if (Array.isArray(level)) {
				return level.some((l) =>
					this.choices.some((choice) => choice.active && choice.key === l)
				);
			}
		}

		return false;
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


