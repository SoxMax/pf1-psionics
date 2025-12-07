import { MODULE_ID } from "../../../_module.mjs";

// Import from PF1 system's compendium browser
const { BOOLEAN_OPERATOR, CheckboxFilter } = pf1.applications.compendiumBrowser.filters;

/**
 * Filter for psionic power levels (1-9, 0 for talents)
 */
export class PsionicPowerLevelFilter extends CheckboxFilter {
  static label = "PF1-Psionics.Powers.Level";
  static indexField = "system.level";
  static type = `${MODULE_ID}.power`;
  static autoSort = false;
  static defaultBooleanOperator = BOOLEAN_OPERATOR.OR;
  static booleanOperator = false;

  prepareChoices() {
    // Create choices for power levels 0-9
    const levels = {};
    levels[0] = game.i18n.localize("PF1-Psionics.Powers.Levels.0"); // Talents
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
export class PsionicDisciplineFilter extends CheckboxFilter {
  static label = "PF1-Psionics.Discipline.Singular";
  static indexField = "system.discipline";
  static type = `${MODULE_ID}.power`;

  prepareChoices() {
    this.choices = this.constructor.getChoicesFromConfig(pf1.config.psionics.disciplines);
  }
}

/**
 * Filter for psionic subdisciplines
 */
export class PsionicSubdisciplineFilter extends CheckboxFilter {
  static label = "PF1.Subdiscipline";
  static indexField = "system.subdiscipline";
  static type = `${MODULE_ID}.power`;

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
export class PsionicDescriptorFilter extends CheckboxFilter {
  static label = "PF1.Descriptor";
  static indexField = "system.descriptors";
  static type = `${MODULE_ID}.power`;
  static defaultBooleanOperator = BOOLEAN_OPERATOR.OR;

  async prepareChoices() {
    await super.prepareChoices();
    // Use spell descriptors from PF1 config
    const configChoices = this.constructor.getChoicesFromConfig(pf1.config.spellDescriptors);
    for (const choice of configChoices) {
      this.choices.set(choice.key, choice);
    }
  }
}

/**
 * Filter for manifesting classes (psion, wilder, psychic warrior, etc.)
 */
export class PsionicManifesterClassFilter extends CheckboxFilter {
  static label = "PF1-Psionics.ManifestingClass";
  static indexField = "system.learnedAt.class";
  static type = `${MODULE_ID}.power`;
  static defaultBooleanOperator = BOOLEAN_OPERATOR.OR;

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

/**
 * Filter for psionic power range (personal, close, medium, long)
 */
export class PsionicRangeFilter extends CheckboxFilter {
  static label = "PF1.Range";
  static indexField = "system.actions.0.range.units";
  static type = `${MODULE_ID}.power`;

  prepareChoices() {
    this.choices = this.constructor.getChoicesFromConfig(pf1.config.measureUnitsShort);
  }
}

/**
 * Filter for psionic power action type (standard, move, swift, etc.)
 */
export class PsionicActionTypeFilter extends CheckboxFilter {
  static label = "PF1.ActionType";
  static indexField = "system.actions.0.activation.type";
  static type = `${MODULE_ID}.power`;

  prepareChoices() {
    this.choices = this.constructor.getChoicesFromConfig(pf1.config.abilityActivationTypes);
  }
}

/**
 * Filter for display types (auditory, visual, mental, etc.)
 */
export class PsionicDisplayFilter extends CheckboxFilter {
  static label = "PF1-Psionics.Powers.Display.Plural";
  static indexField = "system.display";
  static type = `${MODULE_ID}.power`;
  static defaultBooleanOperator = BOOLEAN_OPERATOR.OR;

  prepareChoices() {
    const displays = {
      auditory: game.i18n.localize("PF1-Psionics.Powers.Display.Auditory"),
      material: game.i18n.localize("PF1-Psionics.Powers.Display.Material"),
      mental: game.i18n.localize("PF1-Psionics.Powers.Display.Mental"),
      olfactory: game.i18n.localize("PF1-Psionics.Powers.Display.Olfactory"),
      visual: game.i18n.localize("PF1-Psionics.Powers.Display.Visual"),
    };
    this.choices = this.constructor.getChoicesFromConfig(displays);
  }

  applyFilter(entry) {
    const activeChoices = this.choices.filter((choice) => choice.active);
    if (activeChoices.length === 0) return true;

    const data = foundry.utils.getProperty(entry, this.constructor.indexField);
    if (!data || typeof data !== "object") return false;

    // Check if any of the active display types are true in the entry
    return activeChoices.some((choice) => data[choice.key] === true);
  }
}

