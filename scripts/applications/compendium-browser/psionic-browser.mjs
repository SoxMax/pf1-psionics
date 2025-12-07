import {
  PsionicPowerLevelFilter,
  PsionicDisciplineFilter,
  PsionicSubdisciplineFilter,
  PsionicDescriptorFilter,
  PsionicManifesterClassFilter,
} from "./filters/_module.mjs";

const commonFilters = pf1.applications.compendiumBrowser.filters.common;

/**
 * Compendium browser for psionic powers
 */
export class PsionicPowerBrowser extends pf1.applications.compendiumBrowser.CompendiumBrowser {
  static typeName = "PF1-Psionics.PsionicPowers";
  static filterClasses = [
    commonFilters.PackFilter,
    PsionicDisciplineFilter,
    PsionicSubdisciplineFilter,
    PsionicDescriptorFilter,
    PsionicManifesterClassFilter,
    PsionicPowerLevelFilter,
    commonFilters.SourceFilter,
    commonFilters.TagFilter,
  ];

  // Make filters available as static properties for PF1's filter system
  static PsionicPowerLevelFilter = PsionicPowerLevelFilter;
  static PsionicDisciplineFilter = PsionicDisciplineFilter;
  static PsionicSubdisciplineFilter = PsionicSubdisciplineFilter;
  static PsionicDescriptorFilter = PsionicDescriptorFilter;
  static PsionicManifesterClassFilter = PsionicManifesterClassFilter;

  #filterQueue = null;
  #filterQueueProcessed = false;

  /**
   * Queue filters to be processed by {@link _activateFilterQueue}
   *
   * Only one filter bundle is ever queued.
   *
   * @internal
   * @param {object} filters
   * @experimental
   */
  _queueFilters(filters) {
    this.#filterQueue = filters;
  }

  /**
   * Activate queued filters by mapping filter IDs to filter class names
   * This allows pre-filtering when opening the browser from a power sheet
   *
   * @internal
   */
  _activateFilterQueue() {
    // Only process once and only if we have a queue
    if (this.#filterQueueProcessed || !this.#filterQueue) return;

    // Only process if filters have been set up
    // If not, they'll be activated after setup completes
    // this.filters is a Collection, so check its contents
    const filtersReady = this.filters.contents.every((f) => f.choices);
    if (!filtersReady) {
      console.log("PF1-Psionics | Filters not yet initialized, deferring queue activation");
      return;
    }

    this.#filterQueueProcessed = true;

    // Map filter IDs to filter class names for psionic powers
    const idToFilter = {
      psionLevel: "PsionicPowerLevelFilter",
      psionClass: "PsionicManifesterClassFilter",
      psionDiscipline: "PsionicDisciplineFilter",
      psionSubdiscipline: "PsionicSubdisciplineFilter",
      psionDescriptor: "PsionicDescriptorFilter",
      pack: "PackFilter",
      source: "SourceFilter",
      tags: "TagFilter",
    };

    for (const [filterId, choices] of Object.entries(this.#filterQueue)) {
      const filterName = idToFilter[filterId];
      const filter = this.filters.find((f) => f.constructor.name === filterName);
      if (!filter || !filter.choices) {
        console.warn(`Filter "${filterId}" not found or not initialized.`);
        continue;
      }

      // Normalize choices to array
      const choicesArray = Array.isArray(choices) ? choices : [choices];

      for (const [key, choice] of filter.choices.entries()) {
        choice.active = choicesArray.includes(key);
        if (choice.active) this.expandedFilters.add(filter.id);
      }
    }

    this.#filterQueue = null;
  }

  /** @override */
  async getData() {
    const context = await super.getData();

    this._activateFilterQueue();

    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // After setup is complete, try to activate the filter queue again
    // in case it was deferred during getData()
    const wasProcessed = this.#filterQueueProcessed;
    this._activateFilterQueue();

    // If we just activated the queue after deferral, re-render to show filtered results
    if (!wasProcessed && this.#filterQueueProcessed) {
      this.render();
    }
  }

  /**
   * Map entry to include multiple manifestation levels across classes
   * Similar to how SpellBrowser handles learnedAt levels
   * @override
   */
  static _mapEntry(entry, pack) {
    const result = super._mapEntry(entry, pack);

    // Collect all levels this power can be manifested at
    const manifestedAtLevels = Object.values(entry.system.learnedAt?.class ?? {})
      .filter((level) => typeof level === "number");

    if (typeof entry.system.level === "number") {
      manifestedAtLevels.push(entry.system.level);
    }

    result.system.level = [...new Set(manifestedAtLevels)];

    return result;
  }
}


