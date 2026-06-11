import { POINTS_PER_LEVEL } from "../../data/powerpoints.mjs";

/**
 * Pure calculation helpers for ManifesterModel. Split out so they can be
 * unit-tested without spinning up the Foundry DataModel runtime.
 *
 * None of these mutate inputs; they return new values. The model wires
 * them to its derived fields in finalizeData.
 */

/**
 * Compute caster level total contribution from class/HD + formula + base + drain.
 *
 * @param {object} args
 * @param {string} args._classTag - "" or "_hd" for HD-based; otherwise a class tag. Reserved for future per-tag logic; currently unused.
 * @param {number} args.classLevel - HD count or class level depending on _classTag.
 * @param {number} args.npcBase - cl.base value, only applied if actorType === "npc".
 * @param {string} args.actorType - actor.type ("character", "npc", ...).
 * @param {number} args.formulaBonus - already-rolled formula bonus.
 * @param {number} args.energyDrain - actor's energy drain stat.
 * @param {number} args.changeBonus - cl.bonus accumulated from change system.
 * @returns {{total: number, classLevelTotal: number}}
 */
export function computeCasterLevel({
  classTag: _classTag,
  classLevel,
  npcBase,
  actorType,
  formulaBonus,
  energyDrain,
  changeBonus,
}) {
  let classLevelTotal = classLevel || 0;
  if (actorType === "npc") classLevelTotal += npcBase || 0;

  let total = classLevelTotal + (formulaBonus || 0);
  if (energyDrain) total = Math.max(0, total - energyDrain);
  total += changeBonus || 0;

  return { total, classLevelTotal };
}

/**
 * Compute concentration total = CL + ability mod + formula bonus.
 *
 * @param {object} args
 * @param {number} args.clTotal
 * @param {number} args.abilityMod
 * @param {number} args.formulaBonus
 * @returns {number}
 */
export function computeConcentration({ clTotal, abilityMod, formulaBonus }) {
  return (clTotal || 0) + (abilityMod || 0) + (formulaBonus || 0);
}

/**
 * Compute power point maximum.
 *
 * @param {object} args
 * @param {boolean} args.autoLevel - if true, use POINTS_PER_LEVEL + ability bonus.
 * @param {string} args.casterType - "high" | "med" | "low".
 * @param {number} args.classLevel
 * @param {number} args.abilityMod
 * @param {number} args.formulaBonus - already-rolled formula bonus.
 * @returns {number}
 */
export function computePowerPoints({
  autoLevel,
  casterType,
  classLevel,
  abilityMod,
  formulaBonus,
}) {
  const bonus = formulaBonus || 0;
  if (!autoLevel) return bonus;
  const levelPoints = POINTS_PER_LEVEL[casterType]?.[classLevel] || 0;
  const abilityPoints = Math.max(0, Math.floor((classLevel || 0) * (abilityMod || 0) * 0.5));
  return bonus + levelPoints + abilityPoints;
}
