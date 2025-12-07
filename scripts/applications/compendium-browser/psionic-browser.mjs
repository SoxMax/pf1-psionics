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


