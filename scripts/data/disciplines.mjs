/**
 * Mapping of psionic disciplines to their equivalent spell schools
 * for Psionics-Magic Transparency.
 *
 * This enables bidirectional transparency between psionic disciplines and spell schools:
 * - Powers benefit from spell school bonuses
 * - Spells benefit from discipline bonuses
 * - Defensive bonuses against schools apply to equivalent disciplines
 *
 * @type {Object<string, string|null>}
 */
export const DISCIPLINE_TO_SCHOOL = {
  athanatism: "nec",
  clairsentience: "div",
  metacreativity: "con",
  psychokinesis: "evo",
  psychometabolism: "trs",
  psychoportation: null, // No spell school equivalent
  telepathy: "enc"
};
