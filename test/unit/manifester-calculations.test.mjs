/**
 * Pure unit tests for manifester calculation helpers.
 * Imports the real implementation — no inline reimplementation. If
 * production logic drifts, tests fail.
 */
import { describe, it, expect } from "vitest";
import {
  computeCasterLevel,
  computeConcentration,
  computePowerPoints,
} from "../../scripts/dataModels/actor/manifester-calculations.mjs";

describe("computeCasterLevel", () => {
  it("returns class level for a character without formula or drain", () => {
    const result = computeCasterLevel({
      classTag: "psion",
      classLevel: 5,
      npcBase: 0,
      actorType: "character",
      formulaBonus: 0,
      energyDrain: 0,
      changeBonus: 0,
    });
    expect(result.total).toBe(5);
    expect(result.classLevelTotal).toBe(5);
  });

  it("adds NPC base for NPCs and includes it in classLevelTotal", () => {
    const result = computeCasterLevel({
      classTag: "psion",
      classLevel: 3,
      npcBase: 2,
      actorType: "npc",
      formulaBonus: 0,
      energyDrain: 0,
      changeBonus: 0,
    });
    expect(result.classLevelTotal).toBe(5);
    expect(result.total).toBe(5);
  });

  it("does NOT add NPC base for characters", () => {
    const result = computeCasterLevel({
      classTag: "psion",
      classLevel: 3,
      npcBase: 99,
      actorType: "character",
      formulaBonus: 0,
      energyDrain: 0,
      changeBonus: 0,
    });
    expect(result.classLevelTotal).toBe(3);
    expect(result.total).toBe(3);
  });

  it("adds formula bonus", () => {
    const result = computeCasterLevel({
      classTag: "wilder",
      classLevel: 4,
      npcBase: 0,
      actorType: "character",
      formulaBonus: 2,
      energyDrain: 0,
      changeBonus: 0,
    });
    expect(result.total).toBe(6);
  });

  it("subtracts energy drain, floors at zero", () => {
    const lower = computeCasterLevel({
      classTag: "psion",
      classLevel: 3,
      npcBase: 0,
      actorType: "character",
      formulaBonus: 0,
      energyDrain: 5,
      changeBonus: 0,
    });
    expect(lower.total).toBe(0);

    const partial = computeCasterLevel({
      classTag: "psion",
      classLevel: 5,
      npcBase: 0,
      actorType: "character",
      formulaBonus: 0,
      energyDrain: 2,
      changeBonus: 0,
    });
    expect(partial.total).toBe(3);
  });

  it("adds change bonus after drain", () => {
    const result = computeCasterLevel({
      classTag: "psion",
      classLevel: 5,
      npcBase: 0,
      actorType: "character",
      formulaBonus: 0,
      energyDrain: 0,
      changeBonus: 4,
    });
    expect(result.total).toBe(9);
  });

  it("handles _hd class tag like any other class for math purposes", () => {
    const result = computeCasterLevel({
      classTag: "_hd",
      classLevel: 8,
      npcBase: 0,
      actorType: "character",
      formulaBonus: 0,
      energyDrain: 0,
      changeBonus: 0,
    });
    expect(result.total).toBe(8);
  });
});

describe("computeConcentration", () => {
  it("sums CL + ability mod + formula bonus", () => {
    expect(computeConcentration({ clTotal: 5, abilityMod: 4, formulaBonus: 2 })).toBe(11);
  });

  it("handles missing args as zero", () => {
    expect(computeConcentration({})).toBe(0);
    expect(computeConcentration({ clTotal: 5 })).toBe(5);
  });
});

describe("computePowerPoints", () => {
  it("returns formula bonus only when autoLevel is false", () => {
    expect(computePowerPoints({
      autoLevel: false,
      casterType: "high",
      classLevel: 5,
      abilityMod: 3,
      formulaBonus: 7,
    })).toBe(7);
  });

  it("returns table points + ability bonus + formula when autoLevel is true", () => {
    // high progression level 5 = 25 base PP
    // ability bonus = floor(5 * 3 * 0.5) = 7
    // formula = 0
    expect(computePowerPoints({
      autoLevel: true,
      casterType: "high",
      classLevel: 5,
      abilityMod: 3,
      formulaBonus: 0,
    })).toBe(25 + 7);
  });

  it("returns table points for level 1 high = 2", () => {
    expect(computePowerPoints({
      autoLevel: true,
      casterType: "high",
      classLevel: 1,
      abilityMod: 0,
      formulaBonus: 0,
    })).toBe(2);
  });

  it("returns 0 when classLevel exceeds table", () => {
    expect(computePowerPoints({
      autoLevel: true,
      casterType: "high",
      classLevel: 99,
      abilityMod: 0,
      formulaBonus: 0,
    })).toBe(0);
  });

  it("clamps negative ability bonus to zero", () => {
    expect(computePowerPoints({
      autoLevel: true,
      casterType: "high",
      classLevel: 5,
      abilityMod: -3,
      formulaBonus: 0,
    })).toBe(25);
  });

  it("returns table points for med progression", () => {
    // med level 10 = 28
    expect(computePowerPoints({
      autoLevel: true,
      casterType: "med",
      classLevel: 10,
      abilityMod: 0,
      formulaBonus: 0,
    })).toBe(28);
  });

  it("returns table points for low progression", () => {
    // low level 20 = 70
    expect(computePowerPoints({
      autoLevel: true,
      casterType: "low",
      classLevel: 20,
      abilityMod: 0,
      formulaBonus: 0,
    })).toBe(70);
  });

  it("handles unknown casterType as zero base", () => {
    expect(computePowerPoints({
      autoLevel: true,
      casterType: "weird",
      classLevel: 5,
      abilityMod: 0,
      formulaBonus: 3,
    })).toBe(3);
  });
});
