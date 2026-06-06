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

/**
 * Simulate the actor.update() the migration performs: per-slot delete of
 * legacy keys, then merge of new entries. Models the production write strategy
 * so we can assert that pre-existing non-legacy entries survive.
 */
function applyMigrationUpdate(rawManifesters, newDict) {
  const result = foundry.utils.deepClone(rawManifesters ?? {});
  for (const slot of LEGACY_SLOT_KEYS) delete result[slot];
  Object.assign(result, foundry.utils.deepClone(newDict));
  return result;
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

  it("preserves pre-existing non-legacy entries in mixed-state dict", () => {
    const existingId = "abcdefghijklmnop";
    const existingRecord = {
      id: existingId,
      source: "manual",
      class: { itemId: null },
      name: "Already Migrated",
      casterType: "low",
      ability: "wis",
      powerPoints: { max: 99, formula: "" },
      cl: { formula: "", notes: "" },
      concentration: { formula: "", notes: "" },
    };
    const raw = {
      primary: defaultLegacyBook({ inUse: true, class: "psion" }),
      [existingId]: existingRecord,
    };
    const { newDict } = rebuildManifesters(raw, [psionClass]);
    // Simulate the actual actor.update strategy (per-slot delete + merge).
    const persisted = applyMigrationUpdate(raw, newDict);
    expect(Object.keys(persisted).length).toBe(2);
    expect(persisted[existingId]).toEqual(existingRecord);
    // None of the legacy slot keys should survive.
    for (const slot of LEGACY_SLOT_KEYS) expect(persisted).not.toHaveProperty(slot);
    // The converted legacy entry should also be present under a new id.
    const convertedIds = Object.keys(persisted).filter(k => k !== existingId);
    expect(convertedIds.length).toBe(1);
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

  // ---- edge cases ----

  it("treats empty-string class tag as manual with no _lastTag", () => {
    const raw = {
      primary: defaultLegacyBook({ inUse: true, class: "" }),
      secondary: defaultLegacyBook(),
      tertiary: defaultLegacyBook(),
      spelllike: defaultLegacyBook(),
    };
    const [rec] = Object.values(rebuildManifesters(raw, []).newDict);
    expect(rec.source).toBe("manual");
    expect(rec.class.itemId).toBeNull();
    expect(rec).not.toHaveProperty("_lastTag");
  });

  it("treats null/undefined class tag as manual with no _lastTag", () => {
    const rawNull = {
      primary: defaultLegacyBook({ inUse: true, class: null }),
      secondary: defaultLegacyBook(), tertiary: defaultLegacyBook(), spelllike: defaultLegacyBook(),
    };
    const rawUndef = {
      primary: defaultLegacyBook({ inUse: true, class: undefined }),
      secondary: defaultLegacyBook(), tertiary: defaultLegacyBook(), spelllike: defaultLegacyBook(),
    };
    for (const raw of [rawNull, rawUndef]) {
      const [rec] = Object.values(rebuildManifesters(raw, []).newDict);
      expect(rec.source).toBe("manual");
      expect(rec.class.itemId).toBeNull();
      expect(rec).not.toHaveProperty("_lastTag");
    }
  });

  it("skips null/undefined slot record", () => {
    const raw = {
      primary: null,
      secondary: undefined,
      tertiary: defaultLegacyBook({ inUse: true, class: "_hd" }),
      spelllike: defaultLegacyBook(),
    };
    const result = rebuildManifesters(raw, []);
    expect(Object.keys(result.newDict)).toHaveLength(1);
  });

  it("treats empty record with truthy inUse as a valid manual entry (fills defaults)", () => {
    const raw = {
      primary: { inUse: true },
      secondary: defaultLegacyBook(), tertiary: defaultLegacyBook(), spelllike: defaultLegacyBook(),
    };
    const [rec] = Object.values(rebuildManifesters(raw, []).newDict);
    expect(rec.source).toBe("manual");
    expect(rec.casterType).toBe("high");
    expect(rec.ability).toBe("int");
    expect(rec.cl).toEqual({ formula: "", notes: "" });
    expect(rec.concentration).toEqual({ formula: "", notes: "" });
    expect(rec.powerPoints).toEqual({ max: 0, formula: "" });
    expect(rec.spellPreparationMode).toBe("spontaneous");
    expect(rec.baseDCFormula).toBe("10 + @sl + @ablMod");
    expect(rec.autoLevelPowerPoints).toBe(true);
    expect(rec.autoAttributePowerPoints).toBe(true);
    expect(rec.autoMaxPowerLevel).toBe(true);
    expect(rec.hasCantrips).toBe(true);
  });

  it("preserves unrecognized casterType verbatim (consumer is responsible for validation)", () => {
    const raw = {
      primary: defaultLegacyBook({ inUse: true, class: "_hd", casterType: "ultra-mega" }),
      secondary: defaultLegacyBook(), tertiary: defaultLegacyBook(), spelllike: defaultLegacyBook(),
    };
    const [rec] = Object.values(rebuildManifesters(raw, []).newDict);
    expect(rec.casterType).toBe("ultra-mega");
  });

  it("returns null on non-object raw flag (string / array)", () => {
    // Object.entries on a string yields character entries that won't match
    // LEGACY_SLOT_KEYS, so the function should bail with null.
    expect(rebuildManifesters("garbage", [])).toBeNull();
    expect(rebuildManifesters([], [])).toBeNull();
  });

  it("emits unique ids for all inUse slots and an idMap that round-trips through rebindPower", () => {
    const raw = {
      primary: defaultLegacyBook({ inUse: true, class: "psion" }),
      secondary: defaultLegacyBook({ inUse: true, class: "_hd" }),
      tertiary: defaultLegacyBook({ inUse: true, class: "_hd" }),
      spelllike: defaultLegacyBook({ inUse: true, class: "_hd" }),
    };
    const { idMap, newDict } = rebuildManifesters(raw, [psionClass]);
    const ids = Object.values(idMap);
    expect(new Set(ids).size).toBe(ids.length);    // unique
    expect(ids.every(id => id.length === 16)).toBe(true);
    expect(Object.keys(newDict).sort()).toEqual([...ids].sort());
    for (const slot of ["primary", "secondary", "tertiary", "spelllike"]) {
      expect(rebindPower(slot, idMap)).toBe(idMap[slot]);
    }
  });

  it("rebindPower handles null/undefined gracefully", () => {
    const idMap = { primary: "anId000000000001" };
    expect(rebindPower(null, idMap)).toBeNull();
    expect(rebindPower(undefined, idMap)).toBeNull();
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
