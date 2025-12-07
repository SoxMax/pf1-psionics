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
  static typeName = "PF1-Psionics.Powers.Plural";
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
    this.#filterQueueProcessed = false;
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
    const filtersReady = this.filters.contents.every((f) => f.choices);
    if (!filtersReady) return;

    this.#filterQueueProcessed = true;

    // Map filter IDs to filter class names for psionic powers
    const idToFilter = {
      psionicLevel: "PsionicPowerLevelFilter",
      psionicClass: "PsionicManifesterClassFilter",
      psionicDiscipline: "PsionicDisciplineFilter",
      psionicSubdiscipline: "PsionicSubdisciplineFilter",
      psionicDescriptor: "PsionicDescriptorFilter",
      pack: "PackFilter",
      source: "SourceFilter",
      tags: "TagFilter",
    };

    // Clear all existing active filters before applying new ones
    for (const filter of this.filters.contents) {
      for (const choice of filter.choices) {
        choice.active = false;
      }
    }

    for (const [filterId, choices] of Object.entries(this.#filterQueue)) {
      const filterName = idToFilter[filterId];
      const filter = this.filters.find((f) => f.constructor.name === filterName);
      if (!filter?.choices) continue;

      // Normalize choices to array and activate matching filter options
      const choicesArray = Array.isArray(choices) ? choices : [choices];
      for (const [key, choice] of filter.choices.entries()) {
        if (choicesArray.includes(key)) {
          choice.active = true;
          this.expandedFilters.add(filter.id);
        }
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
   * Map entry to support both base power level and class-specific learned level filtering
   *
   * When the Manifesting Class filter is active, powers are indexed by the level
   * at which each class learns them (via learnedAt.class).
   * When the Manifesting Class filter is not active, powers are indexed by their
   * base level (system.level).
   *
   * We achieve this by storing class-specific levels separately in a custom field
   * so they can be accessed independently by the class filter.
   *
   * @override
   */
  static _mapEntry(entry, pack) {
    const result = super._mapEntry(entry, pack);

    // Store the base power level separately for the power level filter
    // This ensures that powers are always filterable by their fundamental power level
    if (typeof entry.system.level === "number") {
      result.system.level = entry.system.level;
    }

    // Separately store class-specific learned levels for use with the class filter
    // This allows users to filter for "powers that psions learn at level 2"
    // even if the power itself is a 1st-level power
    const classLearnedLevels = entry.system.learnedAt?.class ?? {};
    if (Object.keys(classLearnedLevels).length > 0) {
      result._classLearnedAtLevels = classLearnedLevels;
    }

    return result;
  }
}


