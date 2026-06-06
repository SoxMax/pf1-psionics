/**
 * Vitest unit tests for v0.10.0 migration.
 * Manifesters: fixed 4-slot dict -> dynamic id-keyed dict.
 *
 * These tests reimplement the migration logic inline (mirroring the pattern
 * used by v0.5.0.test.mjs) so they can run in Node without Foundry. The
 * authoritative implementation lives in scripts/migrations/v0.10.0.mjs.
 */

import { describe, it, expect, beforeEach } from "vitest";

const MODULE_ID = "pf1-psionics";
const LEGACY_SLOT_KEYS = new Set(["primary", "secondary", "tertiary", "spelllike"]);

function defaultLegacyBook(overrides = {}) {
  return {
    name: "", inUse: false, showConfig: false, casterType: "high", class: "",
    cl: { formula: "", notes: "" }, concentration: { formula: "", notes: "" },
    ability: "int", autoLevelPowerPoints: true, autoAttributePowerPoints: true,
    autoMaxPowerLevel: true, hasCantrips: true, spellPreparationMode: "spontaneous",
    baseDCFormula: "10 + @sl + @ablMod", powerPoints: { max: 0, formula: "" },
    ...overrides,
  };
}

function rebuildManifesters(rawManifesters, classItems) {
  const oldEntries = Object.entries(rawManifesters ?? {})
    .filter(([k]) => LEGACY_SLOT_KEYS.has(k));
  if (oldEntries.length === 0) return null;

  const idMap = {};
  const newDict = {};

  for (const [oldKey, oldBook] of oldEntries) {
    if (!oldBook?.inUse) continue;
    const id = foundry.utils.randomID(16);

    let classItemId = null;
    let source = "manual";
    let _lastTag = null;
    const tag = oldBook.class;

    if (tag && tag !== "_hd") {
      const classItem = classItems.find((i) => i.system?.tag === tag);
      if (classItem) {
        classItemId = classItem.id;
        source = "class";
      } else {
        _lastTag = tag;
      }
    }

    const record = {
      id, source,
      class: {itemId: classItemId},
      name: oldBook.name ?? "",
      casterType: oldBook.casterType ?? "high",
      cl: foundry.utils.deepClone(oldBook.cl ?? { formula: "", notes: "" }),
      concentration: foundry.utils.deepClone(oldBook.concentration ?? { formula: "", notes: "" }),
      ability: oldBook.ability ?? "int",
      autoLevelPowerPoints: oldBook.autoLevelPowerPoints ?? true,
      autoAttributePowerPoints: oldBook.autoAttributePowerPoints ?? true,
      autoMaxPowerLevel: oldBook.autoMaxPowerLevel ?? true,
      hasCantrips: oldBook.hasCantrips ?? true,
      spellPreparationMode: oldBook.spellPreparationMode ?? "spontaneous",
      baseDCFormula: oldBook.baseDCFormula ?? "10 + @sl + @ablMod",
      powerPoints: foundry.utils.deepClone(oldBook.powerPoints ?? { max: 0, formula: "" }),
    };
    if (_lastTag) record._lastTag = _lastTag;

    idMap[oldKey] = id;
    newDict[id] = record;
  }

  return { idMap, newDict };
}

function rebindPower(systemManifester, idMap) {
  if (!systemManifester || !LEGACY_SLOT_KEYS.has(systemManifester)) return null; // no rebind
  return idMap[systemManifester] ?? "";
}

describe("v0.10.0 migration", () => {
  let psionClass;

  beforeEach(() => {
    psionClass = { id: "classItemPsion0001", system: { tag: "psion", level: 5 } };
  });

  it("converts inUse manifester with matching class item to a source:class record", () => {
    const raw = {
      primary: defaultLegacyBook({ inUse: true, class: "psion", casterType: "high", ability: "int" }),
      secondary: defaultLegacyBook(),
      tertiary: defaultLegacyBook(),
      spelllike: defaultLegacyBook({ class: "_hd", ability: "cha" }),
    };
    const result = rebuildManifesters(raw, [psionClass]);
    expect(result).not.toBeNull();

    const records = Object.values(result.newDict);
    expect(records).toHaveLength(1);
    const [rec] = records;
    expect(rec.source).toBe("class");
    expect(rec.class.itemId).toBe("classItemPsion0001");
    expect(rec.casterType).toBe("high");
    expect(rec.ability).toBe("int");
    expect(rec).not.toHaveProperty("inUse");
    expect(rec).not.toHaveProperty("showConfig");
    expect(rec).not.toHaveProperty("classItemId");
    expect(rec).not.toHaveProperty("classKind");
  });

  it("converts spelllike inUse record to itemId=null, source=manual (psi-like)", () => {
    const raw = {
      primary: defaultLegacyBook(),
      secondary: defaultLegacyBook(),
      tertiary: defaultLegacyBook(),
      spelllike: defaultLegacyBook({ inUse: true, class: "_hd", ability: "cha", casterType: "med" }),
    };
    const result = rebuildManifesters(raw, []);
    expect(Object.values(result.newDict)).toHaveLength(1);
    const [rec] = Object.values(result.newDict);
    expect(rec.class.itemId).toBeNull();
    expect(rec.source).toBe("manual");
    expect(rec.ability).toBe("cha");
    expect(rec.casterType).toBe("med");
  });

  it("marks orphan record (class tag without matching item) as manual with _lastTag", () => {
    const raw = {
      primary: defaultLegacyBook({ inUse: true, class: "vanished-class" }),
      secondary: defaultLegacyBook(),
      tertiary: defaultLegacyBook(),
      spelllike: defaultLegacyBook(),
    };
    const result = rebuildManifesters(raw, []);
    const [rec] = Object.values(result.newDict);
    expect(rec.source).toBe("manual");
    expect(rec.class.itemId).toBeNull();
    expect(rec._lastTag).toBe("vanished-class");
  });

  it("skips every slot when none are inUse", () => {
    const raw = {
      primary: defaultLegacyBook(),
      secondary: defaultLegacyBook(),
      tertiary: defaultLegacyBook(),
      spelllike: defaultLegacyBook(),
    };
    const result = rebuildManifesters(raw, []);
    expect(Object.keys(result.newDict)).toHaveLength(0);
    expect(Object.keys(result.idMap)).toHaveLength(0);
  });

  it("returns null when flag is already migrated (no legacy keys present)", () => {
    const raw = {
      "abc123": { id: "abc123", class: {itemId: psionClass.id}, source: "class" },
    };
    expect(rebuildManifesters(raw, [psionClass])).toBeNull();
  });

  it("idempotent re-run on freshly-migrated data does not re-emit slot keys", () => {
    const raw = {
      primary: defaultLegacyBook({ inUse: true, class: "psion" }),
      secondary: defaultLegacyBook(),
      tertiary: defaultLegacyBook(),
      spelllike: defaultLegacyBook(),
    };
    const first = rebuildManifesters(raw, [psionClass]);
    expect(first).not.toBeNull();
    // Simulate post-migration flag state.
    const migrated = first.newDict;
    // Re-run: no legacy keys present, returns null (no-op).
    expect(rebuildManifesters(migrated, [psionClass])).toBeNull();
    // None of the new ids overlap with legacy slot keys.
    for (const id of Object.keys(migrated)) {
      expect(LEGACY_SLOT_KEYS.has(id)).toBe(false);
    }
  });

  it("rebinds power's system.manifester via idMap", () => {
    const raw = {
      primary: defaultLegacyBook({ inUse: true, class: "psion" }),
      secondary: defaultLegacyBook(),
      tertiary: defaultLegacyBook(),
      spelllike: defaultLegacyBook(),
    };
    const { idMap } = rebuildManifesters(raw, [psionClass]);
    const newId = rebindPower("primary", idMap);
    expect(newId).toBe(idMap["primary"]);
    expect(newId).toHaveLength(16);
  });

  it("rebinds orphan power (slot not in idMap) to empty string", () => {
    const idMap = { primary: "anId000000000001" };
    expect(rebindPower("secondary", idMap)).toBe("");
  });

  it("does not rebind a power whose manifester is already a record id", () => {
    const idMap = { primary: "anId000000000001" };
    expect(rebindPower("Qm3K9xZ2pLwV4tNb", idMap)).toBeNull();
    expect(rebindPower("", idMap)).toBeNull();
  });
});

/**
 * Inline reimplementation of relocateClassManifesting.
 * Returns null when nothing to do, or an update payload otherwise.
 */
const MANIFESTING_FIELDS = ["progression", "ability", "cantrips"];
function planClassRelocation(sourceSystem) {
  const legacy = sourceSystem?.manifesting;
  if (!legacy || typeof legacy !== "object") return null;
  const flagPayload = {};
  for (const key of MANIFESTING_FIELDS) {
    if (legacy[key] !== undefined) flagPayload[key] = legacy[key];
  }
  if (Object.keys(flagPayload).length === 0) {
    return { "system.-=manifesting": null };
  }
  return {
    [`flags.${MODULE_ID}.manifesting`]: flagPayload,
    "system.-=manifesting": null,
  };
}

describe("v0.10.0 class manifesting flag relocation", () => {
  it("relocates a full manifesting block to flags and strips the system field", () => {
    const update = planClassRelocation({
      manifesting: { ability: "int", cantrips: true, progression: "high" },
    });
    expect(update).toEqual({
      [`flags.${MODULE_ID}.manifesting`]: { ability: "int", cantrips: true, progression: "high" },
      "system.-=manifesting": null,
    });
  });

  it("preserves Soulknife-style progression:none opt-out", () => {
    const update = planClassRelocation({ manifesting: { progression: "none" } });
    expect(update).toEqual({
      [`flags.${MODULE_ID}.manifesting`]: { progression: "none" },
      "system.-=manifesting": null,
    });
  });

  it("returns null when system.manifesting is absent (idempotent on already-migrated item)", () => {
    expect(planClassRelocation({})).toBeNull();
    expect(planClassRelocation(undefined)).toBeNull();
    expect(planClassRelocation({ manifesting: null })).toBeNull();
  });

  it("strips an empty manifesting block without writing flags", () => {
    expect(planClassRelocation({ manifesting: {} })).toEqual({
      "system.-=manifesting": null,
    });
  });

  it("ignores unknown legacy fields (type, offset)", () => {
    const update = planClassRelocation({
      manifesting: { ability: "wis", progression: "med", cantrips: false, type: "spontaneous", offset: -1 },
    });
    expect(update[`flags.${MODULE_ID}.manifesting`]).toEqual({
      ability: "wis", cantrips: false, progression: "med",
    });
    expect(update["system.-=manifesting"]).toBeNull();
  });

  it("only forwards defined fields (partial block)", () => {
    const update = planClassRelocation({ manifesting: { progression: "low" } });
    expect(update[`flags.${MODULE_ID}.manifesting`]).toEqual({ progression: "low" });
  });
});
