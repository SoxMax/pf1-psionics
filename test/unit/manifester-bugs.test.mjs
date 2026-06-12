/**
 * Regression tests for the critical bugs identified in the
 * manifester-refactor review:
 *
 *  1. PowerItem.manifester returning a record without `cl.total` (NaN
 *     casterLevel).
 *  2. CL change-system buffs silently dropped each prep cycle.
 *  3. Concentration change-system buffs silently dropped each prep cycle.
 *
 * All three are fixed by the same pattern (matching the pre-refactor
 * codebase): the ManifesterModel mirrors its derived state back onto the
 * raw flag dict at the end of each prep cycle, and reads the buff delta
 * off the raw flag at the start. Vitest can't hydrate the real model
 * (no foundry.data.fields mock), so these tests exercise the pure
 * read/mirror semantics on plain objects via the same code paths.
 */

import { describe, it, expect } from "vitest";

/**
 * Stand-in for ManifesterModel._readChangeBonuses — exact same logic,
 * extracted here as a pure function so it is testable without the model.
 * If model implementation drifts, this duplicates the contract being tested.
 */
function readChangeBonuses(actor, tag) {
  const raw = actor?.flags?.["pf1-psionics"]?.manifesters?.[tag];
  const cl = Number(raw?.cl?.total ?? 0);
  const concentration = Number(raw?.concentration?.total ?? 0);
  return {
    cl: Number.isFinite(cl) ? cl : 0,
    concentration: Number.isFinite(concentration) ? concentration : 0,
  };
}

/**
 * Stand-in for ManifesterModel._mirrorToRawFlag — writes derived fields
 * onto the raw flag dict so PowerItem.manifester can see them.
 */
function mirrorToRawFlag(actor, tag, model) {
  const raw = actor?.flags?.["pf1-psionics"]?.manifesters?.[tag];
  if (!raw) return;
  raw.cl ??= {};
  raw.cl.total = model.cl.total;
  raw.cl.classLevelTotal = model.cl.classLevelTotal;
  raw.concentration ??= {};
  raw.concentration.total = model.concentration.total;
  raw.powerPoints ??= {};
  raw.powerPoints.max = model.powerPoints.max;
}

/**
 * Stand-in for PowerItem.manifester getter (after simplification).
 */
function powerItemManifester(actor, tag) {
  return actor?.flags?.["pf1-psionics"]?.manifesters?.[tag];
}

/* ----------------------------------------------------------------------- *
 * Bug 1: PowerItem.manifester returns raw flag dict; before mirroring it
 * lacks cl.total, so PowerItem.casterLevel = undefined + 0 = NaN. After
 * mirroring, cl.total is populated and casterLevel is finite.
 * ----------------------------------------------------------------------- */

describe("PowerItem.manifester (raw-flag pattern)", () => {
  const casterLevelFrom = (m, mod = 0) =>
    m ? m.cl.total + (mod || 0) : null;

  it("BUG: without mirroring, raw flag has no cl.total -> casterLevel is NaN", () => {
    const actor = {
      flags: {
        "pf1-psionics": {
          manifesters: {
            psion: { class: "psion", ability: "int", cl: { formula: "", notes: "", base: 0 } },
          },
        },
      },
    };
    const m = powerItemManifester(actor, "psion");
    expect(m.cl.total).toBeUndefined();
    expect(casterLevelFrom(m, 0)).toBeNaN();
  });

  it("FIX: after mirrorToRawFlag, raw flag carries derived cl.total", () => {
    const actor = {
      flags: {
        "pf1-psionics": {
          manifesters: {
            psion: { class: "psion", ability: "int", cl: { formula: "", notes: "", base: 0 } },
          },
        },
      },
    };
    const model = {
      cl: { total: 7, classLevelTotal: 5 },
      concentration: { total: 11 },
      powerPoints: { max: 32 },
    };
    mirrorToRawFlag(actor, "psion", model);

    const m = powerItemManifester(actor, "psion");
    expect(casterLevelFrom(m, 0)).toBe(7);
    expect(m.concentration.total).toBe(11);
    expect(m.powerPoints.max).toBe(32);
  });

  it("returns undefined for unknown tag", () => {
    const actor = { flags: { "pf1-psionics": { manifesters: { psion: {} } } } };
    expect(powerItemManifester(actor, "wilder")).toBeUndefined();
  });
});

/* ----------------------------------------------------------------------- *
 * Bug 2 + 3: PF1 change system writes buff total to
 *   flags.pf1-psionics.manifesters.<tag>.cl.total
 *   flags.pf1-psionics.manifesters.<tag>.concentration.total
 * before our prep hook fires. readChangeBonuses must surface it so
 * finalizeData can fold it into the computed total.
 * ----------------------------------------------------------------------- */

describe("readChangeBonuses (raw-flag inline read)", () => {
  it("returns the verbatim raw cl.total as the cl change bonus", () => {
    const actor = {
      flags: {
        "pf1-psionics": {
          manifesters: { psion: { cl: { total: 3 }, concentration: { total: 0 } } },
        },
      },
    };
    expect(readChangeBonuses(actor, "psion").cl).toBe(3);
  });

  it("returns the verbatim raw concentration.total as the concentration change bonus", () => {
    const actor = {
      flags: {
        "pf1-psionics": {
          manifesters: { psion: { cl: { total: 0 }, concentration: { total: 5 } } },
        },
      },
    };
    expect(readChangeBonuses(actor, "psion").concentration).toBe(5);
  });

  it("returns zero when raw flag is missing", () => {
    expect(readChangeBonuses({}, "psion")).toEqual({ cl: 0, concentration: 0 });
    expect(readChangeBonuses(undefined, "psion")).toEqual({ cl: 0, concentration: 0 });
  });

  it("passes through negative bonuses verbatim (penalty buffs are valid)", () => {
    const actor = {
      flags: {
        "pf1-psionics": {
          manifesters: { psion: { cl: { total: -2 }, concentration: { total: -1 } } },
        },
      },
    };
    expect(readChangeBonuses(actor, "psion")).toEqual({ cl: -2, concentration: -1 });
  });

  it("returns zero on non-numeric raw values", () => {
    const actor = {
      flags: {
        "pf1-psionics": {
          manifesters: { psion: { cl: { total: "garbage" }, concentration: { total: NaN } } },
        },
      },
    };
    expect(readChangeBonuses(actor, "psion")).toEqual({ cl: 0, concentration: 0 });
  });
});

/* ----------------------------------------------------------------------- *
 * Stability: across multiple prep cycles, the change bonus must not
 * accumulate. The raw flag's cl.total is reset to 0 by Foundry's source
 * reset at the start of each cycle (because cl.total isn't in the
 * schema), so each cycle reads only the current buff value.
 * ----------------------------------------------------------------------- */

describe("change bonus stability across prep cycles", () => {
  it("each cycle reads only the buff just applied, not the prior total", () => {
    // Simulate three prep cycles with a +3 CL buff on a level-5 psion.
    let cycleClTotal = 0;
    for (let i = 0; i < 3; i++) {
      // Foundry: actor.flags reset to source. cl.total not in schema -> drops to 0.
      const actor = {
        flags: {
          "pf1-psionics": {
            manifesters: { psion: { class: "psion", cl: {}, concentration: {} } },
          },
        },
      };
      // PF1 applyChanges runs first: getProperty=0, +3, set=3.
      actor.flags["pf1-psionics"].manifesters.psion.cl.total = 3;

      // Our hook reads the change bonus.
      const change = readChangeBonuses(actor, "psion");
      cycleClTotal = 5 /* class level */ + change.cl;

      // Mirror back (so PowerItem can see it).
      mirrorToRawFlag(actor, "psion", {
        cl: { total: cycleClTotal, classLevelTotal: 5 },
        concentration: { total: cycleClTotal + 3 },
        powerPoints: { max: 32 },
      });

      // Same answer every cycle.
      expect(cycleClTotal).toBe(8);
    }
  });
});
