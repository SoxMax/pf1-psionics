import { MODULE_ID } from "../../_module.mjs";
import { AugmentEditor } from "./augment-sheet.mjs";

export class PowerSheet extends pf1.applications.item.ItemSheetPF {

  static get defaultOptions() {
    const options = super.defaultOptions;
    return {
      ...options,
      classes: [...options.classes, "powerItem"]
    };
  }

  // Specify the Handlebars template
  get template() {
    return `modules/${MODULE_ID}/templates/item/power.hbs`;
  }

  async getData() {
    const context = await super.getData();
    const item = this.item;

    // Get the current language for locale-aware sorting
    const lang = game.settings.get("core", "language");

    context.isSpell = true;
    context.canUseAmmo = false;
    context.manifestors = item.actor?.getFlag(MODULE_ID, "manifestors") ?? {};
    context.manifestorChoices = Object.fromEntries(
      Object.entries(context.manifestors)
        .filter(([_, { inUse }]) => inUse)
        .map(([key, { label }]) => [key, label])
        .sort(([_0, n0], [_1, n1]) => n0.localeCompare(n1, lang))
    );

    // Material for spells to emulate
    context.materialCategories = this._prepareMaterialsAndAddons(item);
    context.alignmentTypes = this._prepareAlignments(item.system.alignments);

    const traitsMap = {
      subdiscipline: pf1.config.psionics.subdisciplines,
    };

    for (const [traitKey, labels] of Object.entries(traitsMap)) {
      if (!item.system[traitKey]) continue;

      const trait = pf1.utils.deepClone(item.system[traitKey]);

      context[traitKey] = trait;

      // TODO: Alphasort
      trait.selected = {};
      for (const id of trait.standard) {
        trait.selected[id] = labels[id] || id;
      }

      // Add custom entry
      let i = 1;
      for (const id of trait.custom) {
        trait.selected[`custom${i++}`] = id;
      }

      trait.active = !foundry.utils.isEmpty(trait.selected);
    }

    // Prepare augments data - convert DataModels to plain objects
    context.augments = (item.system.augments || []).map(aug => {
      // Convert DataModel to plain object if needed
      const augObj = aug.toObject ? aug.toObject() : aug;
      return {
        ...augObj,
        hasEffects: Object.values(augObj.effects || {}).some(v => v && v !== 0 && v !== 1 && v !== ""),
        hasConditions: (augObj.conditions?.minLevel > 0) ||
                       (augObj.conditions?.maxLevel !== null) ||
                       (augObj.conditions?.requiresCondition !== "")
      };
    });

    return context;
  }

  // async _updateObject(event, formData) {
  //   return ItemSheet.prototype._updateObject.call(this, event, formData);
  // }

  _onDeleteChange(event) {
    event.preventDefault();
    const el = event.target;
    const changeId = el.dataset.changeId;

    game.tooltip.dismissLockedTooltip(el.closest(".locked-tooltip"));
    this.item.changes.get(changeId)?.delete();
  }

  /**
   * Handle adding a new augment
   * @param {Event} event
   * @private
   */
  async _onAddAugment(event) {
    event.preventDefault();

    // Convert DataModel instances to plain objects
    const augments = (this.item.system.augments || []).map(a => a.toObject ? a.toObject() : a);
    augments.push({
      _id: foundry.utils.randomID(),
      name: "New Augment",
      description: "",
      cost: 2,
      maxUses: null,
      requiresFocus: false,
      effects: {
        damageBonus: "",
        damageMult: 1,
        durationMultiplier: 1,
        durationBonus: "",
        dcBonus: 0,
        clBonus: 0,
        special: ""
      }
    });

    await this.item.update({"system.augments": augments});
  }

  /**
   * Handle duplicating an augment
   * @param {Event} event
   * @private
   */
  async _onDuplicateAugment(event) {
    event.preventDefault();

    const augmentId = event.currentTarget.closest(".augment-item").dataset.augmentId;
    // Convert DataModel instances to plain objects
    const augments = (this.item.system.augments || []).map(a => a.toObject ? a.toObject() : a);
    const index = augments.findIndex(a => a._id === augmentId);

    if (index >= 0) {
      // Clone the augment and assign a new ID
      const clone = foundry.utils.deepClone(augments[index]);
      clone._id = foundry.utils.randomID();
      // Insert the clone right after the original
      augments.splice(index + 1, 0, clone);
      await this.item.update({"system.augments": augments});
    }
  }

  /**
   * Handle deleting an augment
   * @param {Event} event
   * @private
   */
  async _onDeleteAugment(event) {
    event.preventDefault();

    const augmentId = event.currentTarget.closest(".augment-item").dataset.augmentId;
    // Convert DataModel instances to plain objects
    const augments = (this.item.system.augments || []).map(a => a.toObject ? a.toObject() : a);
    const index = augments.findIndex(a => a._id === augmentId);

    if (index >= 0) {
      augments.splice(index, 1);
      await this.item.update({"system.augments": augments});
    }
  }

  /**
   * Handle editing an augment
   * @param {Event} event
   * @private
   */
  async _onEditAugment(event) {
    event.preventDefault();

    const augmentId = event.currentTarget.closest(".augment-item").dataset.augmentId;
    const augment = (this.item.system.augments || []).find(a => a._id === augmentId);

    if (!augment) return;

    new AugmentEditor(this.item, augment).render(true);
  }

  activateListeners(html) {
    super.activateListeners(html);

    if (!this.isEditable) return;

    // Augment controls
    html.find(".add-augment").click(this._onAddAugment.bind(this));
    html.find(".duplicate-augment").click(this._onDuplicateAugment.bind(this));
    html.find(".delete-augment").click(this._onDeleteAugment.bind(this));
    html.find(".edit-augment").click(this._onEditAugment.bind(this));
  }

  /**
   * Handle spawning the ActorTraitSelector application which allows a checkbox of multiple trait options
   *
   * @param {Event} event   The click event which originated the selection
   * @private
   */
  _onTraitSelector(event, _target) {
    event.preventDefault();

    if (!this.isEditable) return;

    const a = event.currentTarget;
    const options = {
      name: a.dataset.for,
      title: game.i18n.localize(a.dataset.title),
      subject: a.dataset.options,
      hasCustom: a.dataset.hasCustom !== "false",
    };

    const collator = new Intl.Collator(game.i18n.lang, { numeric: true, ignorePunctuation: false });
    const sortTuple = (arr) => arr.sort(([_0, a], [_1, b]) => collator.compare(a, b));

    let choices;
    if (a.dataset.options in pf1.registry) {
      let entries = pf1.registry[a.dataset.options];
      if (a.dataset.resist) entries = entries.filter((e) => e.resist);
      choices = entries.map((e) => [e.id, e.name]);
      sortTuple(choices);
      options.choices = Object.fromEntries(choices);
    } else if (a.dataset.options in pf1.config) {
      options.choices = pf1.config[a.dataset.options];
    } else if (a.dataset.options === "subdiscipline") {
      const school = a.dataset.school;
      const subdisciplineKeys = pf1.config.psionics.subdisciplineMap[school] || [];
      const choices = Object.fromEntries(
        subdisciplineKeys.map(key => [key, pf1.config.psionics.subdisciplines[key]])
      );
      options.choices = choices;
    } else if (a.dataset.options === "classSkills") {
      if (this.item.actor) {
        options.choices = Object.fromEntries(
          this.item.actor.allSkills
            .map((skill) => [skill, this.item.actor.getSkillInfo(skill).name])
            .sort(([_0, a], [_1, b]) => collator.compare(a, b))
        );
      } else {
        options.choices = pf1.config.skills;
      }
    }

    let app = Object.values(this.item.apps).find(
      (o) => o instanceof pf1.applications.ActorTraitSelector && o.options.name === options.name
    );
    app ??= new pf1.applications.ActorTraitSelector({ ...options, document: this.item });
    app.render({ force: true, focus: true });
  }
}