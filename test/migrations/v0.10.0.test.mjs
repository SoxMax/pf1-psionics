/**
 * Tests for v0.10.0 migration helpers.
 *
 * Imports the REAL pure helpers from scripts/migrations/v0.10.0.mjs (no
 * inline reimplementation). If production logic drifts, tests fail.
 *
 * The full migrateToVersion0_10_0 entry point requires a live Foundry
 * actor/item/scene runtime; the pure helpers (rebuildManifesters,
 * resolveLegacyClass, buildTagRecord, planClassRelocation) cover the
 * actual reshape logic.
 */
import { describe, it, expect } from "vitest";
import {
  rebuildManifesters,
  resolveLegacyClass,
  buildTagRecord,
  planClassRelocation,
} from "../../scripts/migrations/v0.10.0.mjs";

function legacyBook(overrides = {}) {
  return {
    name: "",
    inUse: false,
    showConfig: false,
    casterType: "high",
    class: "",
    cl: { formula: "", notes: "" },
    concentration: { formula: "", notes: "" },
    ability: "int",
    autoLevelPowerPoints: true,
    autoAttributePowerPoints: true,
    autoMaxPowerLevel: true,
    hasCantrips: true,
    spellPreparationMode: "spontaneous",
    baseDCFormula: "10 + @sl + @ablMod",
    powerPoints: { max: 0, formula: "" },
    ...overrides,
  };
}

function classItem(tag) {
  return { id: `class-${tag}`, type: "class", system: { tag, level: 5 } };
}

describe("resolveLegacyClass", () => {
  it("resolves a class string with a matching class item to that tag", () => {
    const r = resolveLegacyClass({ class: "psion" }, [classItem("psion")]);
    expect(r).toEqual({ tag: "psion", source: "class", lastTag: null });
  });

  it("treats class === '_hd' as _hd manual", () => {
    const r = resolveLegacyClass({ class: "_hd" }, []);
    expect(r).toEqual({ tag: "_hd", source: "manual", lastTag: null });
  });

  it("treats absent class as _hd manual", () => {
    const r = resolveLegacyClass({}, []);
    expect(r).toEqual({ tag: "_hd", source: "manual", lastTag: null });
  });

  it("retains class string as tag when no live class item matches, stashes lastTag", () => {
    const r = resolveLegacyClass({ class: "psion" }, []);
    expect(r).toEqual({ tag: "psion", source: "manual", lastTag: "psion" });
  });
});

describe("buildTagRecord", () => {
  it("copies recognized fields, sets class+source, drops inUse and showConfig", () => {
    const book = legacyBook({
      inUse: true,
      class: "wilder",
      ability: "cha",
      casterType: "high",
      hasCantrips: false,
      name: "Wilder Book",
    });
    const out = buildTagRecord(book, "wilder", "class", null);
    expect(out.class).toBe("wilder");
    expect(out.source).toBe("class");
    expect(out.ability).toBe("cha");
    expect(out.name).toBe("Wilder Book");
    expect(out.hasCantrips).toBe(false);
    expect(out.inUse).toBeUndefined();
    expect(out.showConfig).toBeUndefined();
  });

  it("applies defaults when legacy fields are absent", () => {
    const out = buildTagRecord({}, "_hd", "manual", null);
    expect(out.casterType).toBe("high");
    expect(out.ability).toBe("int");
    expect(out.spellPreparationMode).toBe("spontaneous");
    expect(out.baseDCFormula).toBe("10 + @sl + @ablMod");
    expect(out.autoLevelPowerPoints).toBe(true);
    expect(out.autoAttributePowerPoints).toBe(true);
    expect(out.autoMaxPowerLevel).toBe(true);
    expect(out.hasCantrips).toBe(true);
    expect(out.cl).toEqual({ formula: "", notes: "" });
    expect(out.concentration).toEqual({ formula: "", notes: "" });
    expect(out.powerPoints).toEqual({ max: 0, formula: "" });
  });

  it("preserves nested cl/concentration/powerPoints sub-objects verbatim", () => {
    const book = legacyBook({
      cl: { formula: "@level + 1", notes: "n1" },
      concentration: { formula: "+2", notes: "n2" },
      powerPoints: { max: 25, formula: "5" },
    });
    const out = buildTagRecord(book, "psion", "class", null);
    expect(out.cl).toEqual({ formula: "@level + 1", notes: "n1" });
    expect(out.concentration).toEqual({ formula: "+2", notes: "n2" });
    expect(out.powerPoints).toEqual({ max: 25, formula: "5" });
  });

  it("stashes _lastTag when provided", () => {
    const out = buildTagRecord({}, "psion", "manual", "psion");
    expect(out._lastTag).toBe("psion");
  });

  it("omits _lastTag when null", () => {
    const out = buildTagRecord({}, "psion", "class", null);
    expect(out._lastTag).toBeUndefined();
  });
});

describe("rebuildManifesters", () => {
  it("returns null for empty/missing input", () => {
    expect(rebuildManifesters(null, [])).toBeNull();
    expect(rebuildManifesters(undefined, [])).toBeNull();
    expect(rebuildManifesters({}, [])).toBeNull();
  });

  it("returns null when no legacy slot keys present (idempotency)", () => {
    const raw = {
      psion: { class: "psion", casterType: "high" },
      _hd:   { class: "_hd",   casterType: "high" },
    };
    expect(rebuildManifesters(raw, [classItem("psion")])).toBeNull();
  });

  it("converts inUse primary slot with matching class to a source:class tag record", () => {
    const raw = {
      primary:   legacyBook({ inUse: true, class: "psion", ability: "int" }),
      secondary: legacyBook(),
      tertiary:  legacyBook(),
      spelllike: legacyBook(),
    };
    const result = rebuildManifesters(raw, [classItem("psion")]);
    expect(result).not.toBeNull();
    expect(Object.keys(result.newDict)).toEqual(["psion"]);
    expect(result.newDict.psion.class).toBe("psion");
    expect(result.newDict.psion.source).toBe("class");
    expect(result.newDict.psion.ability).toBe("int");
    expect(result.idMap).toEqual({ primary: "psion" });
  });

  it("drops slots whose inUse is false", () => {
    const raw = {
      primary:   legacyBook({ inUse: false, class: "psion" }),
      secondary: legacyBook({ inUse: false }),
      tertiary:  legacyBook(),
      spelllike: legacyBook(),
    };
    const result = rebuildManifesters(raw, [classItem("psion")]);
    expect(result).not.toBeNull();
    expect(result.newDict).toEqual({});
    expect(result.idMap).toEqual({});
  });

  it("converts inUse spelllike slot (class: '_hd') to _hd manual record", () => {
    const raw = {
      primary:   legacyBook(),
      secondary: legacyBook(),
      tertiary:  legacyBook(),
      spelllike: legacyBook({ inUse: true, class: "_hd", ability: "cha", casterType: "high" }),
    };
    const result = rebuildManifesters(raw, []);
    expect(Object.keys(result.newDict)).toEqual(["_hd"]);
    expect(result.newDict._hd.class).toBe("_hd");
    expect(result.newDict._hd.source).toBe("manual");
    expect(result.newDict._hd.ability).toBe("cha");
    expect(result.idMap).toEqual({ spelllike: "_hd" });
  });

  it("converts a string class with no live class item; tag = string, source = manual, _lastTag set", () => {
    const raw = {
      primary:   legacyBook({ inUse: true, class: "homebrew" }),
      secondary: legacyBook(),
      tertiary:  legacyBook(),
      spelllike: legacyBook(),
    };
    const result = rebuildManifesters(raw, []);
    expect(Object.keys(result.newDict)).toEqual(["homebrew"]);
    expect(result.newDict.homebrew.class).toBe("homebrew");
    expect(result.newDict.homebrew.source).toBe("manual");
    expect(result.newDict.homebrew._lastTag).toBe("homebrew");
  });

  it("handles multiple inUse slots producing distinct tag keys", () => {
    const raw = {
      primary:   legacyBook({ inUse: true, class: "psion" }),
      secondary: legacyBook({ inUse: true, class: "wilder" }),
      tertiary:  legacyBook(),
      spelllike: legacyBook({ inUse: true, class: "_hd" }),
    };
    const result = rebuildManifesters(raw, [classItem("psion"), classItem("wilder")]);
    expect(Object.keys(result.newDict).sort()).toEqual(["_hd", "psion", "wilder"]);
    expect(result.idMap).toEqual({ primary: "psion", secondary: "wilder", spelllike: "_hd" });
  });

  it("suffixes tag clash on dict key; record.class keeps the real tag for class linkage", () => {
    const raw = {
      primary:   legacyBook({ inUse: true, class: "psion", name: "First" }),
      secondary: legacyBook({ inUse: true, class: "psion", name: "Second" }),
      tertiary:  legacyBook(),
      spelllike: legacyBook(),
    };
    const result = rebuildManifesters(raw, [classItem("psion")]);
    expect(result.newDict).toHaveProperty("psion");
    expect(result.newDict).toHaveProperty("psion-2");
    expect(result.newDict.psion.name).toBe("First");
    expect(result.newDict["psion-2"].name).toBe("Second");
    // Critical: both records' `class` field stays the real class tag.
    // Suffixing only happens on the dict key so reverse lookups via
    // `actor.itemTypes.class.find(c => c.system.tag === record.class)`
    // still match the live class item for the suffixed record too.
    expect(result.newDict.psion.class).toBe("psion");
    expect(result.newDict["psion-2"].class).toBe("psion");
    expect(result.idMap.primary).toBe("psion");
    expect(result.idMap.secondary).toBe("psion-2");
  });

  it("ignores non-legacy keys present alongside legacy slots", () => {
    // A pre-existing tag-keyed entry shouldn't be dropped by rebuild; the
    // production write strategy uses per-slot -=key deletes so non-legacy
    // entries survive.
    const raw = {
      psion:     { class: "psion", casterType: "high" }, // pre-existing, ignored here
      primary:   legacyBook({ inUse: true, class: "wilder" }),
      secondary: legacyBook(),
      tertiary:  legacyBook(),
      spelllike: legacyBook(),
    };
    const result = rebuildManifesters(raw, [classItem("wilder")]);
    expect(result.newDict).toEqual({
      wilder: expect.objectContaining({ class: "wilder", source: "class" }),
    });
  });

  it("skips malformed (non-object) slot values without throwing", () => {
    const raw = {
      primary:   "not-an-object",
      secondary: legacyBook({ inUse: true, class: "psion" }),
      tertiary:  null,
      spelllike: legacyBook(),
    };
    const result = rebuildManifesters(raw, [classItem("psion")]);
    expect(Object.keys(result.newDict)).toEqual(["psion"]);
  });
});

describe("planClassRelocation", () => {
  it("returns null when system.manifesting is absent", () => {
    expect(planClassRelocation({ system: {} })).toBeNull();
    expect(planClassRelocation({})).toBeNull();
  });

  it("copies progression/ability/cantrips into flagPayload", () => {
    const plan = planClassRelocation({
      system: { manifesting: { progression: "high", ability: "int", cantrips: true } },
    });
    expect(plan).toEqual({
      flagPayload: { progression: "high", ability: "int", cantrips: true },
      dropLegacy: true,
    });
  });

  it("drops unknown legacy fields (type, offset, etc.)", () => {
    const plan = planClassRelocation({
      system: {
        manifesting: {
          progression: "med",
          ability: "wis",
          cantrips: false,
          type: "garbage",
          offset: 3,
          weird: "junk",
        },
      },
    });
    expect(plan.flagPayload).toEqual({ progression: "med", ability: "wis", cantrips: false });
  });

  it("handles partial blocks (only progression set)", () => {
    const plan = planClassRelocation({ system: { manifesting: { progression: "low" } } });
    expect(plan.flagPayload).toEqual({ progression: "low" });
  });

  it("returns empty flagPayload when block exists but contains no recognized fields", () => {
    const plan = planClassRelocation({ system: { manifesting: { type: "x", offset: 1 } } });
    expect(plan.flagPayload).toEqual({});
    expect(plan.dropLegacy).toBe(true);
  });
});
