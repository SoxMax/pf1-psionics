/**
 * Vitest unit tests for the manifester template and record factory.
 */

import { describe, it, expect, vi } from "vitest";
import { MANIFESTER, createManifesterRecord } from "../../scripts/data/manifesters.mjs";

/**
 * Inline reimplementation of PsionicsHelper.addManifester validation.
 * Authoritative impl lives at scripts/helpers/psionics-helper.mjs; replicated
 * here because the real class transitively imports pf1 globals through
 * scripts/_module.mjs.
 */
const MODULE_ID = "pf1-psionics";
async function addManifester(actor, config = {}) {
  const itemId = config.class?.itemId;
  if (itemId) {
    const item = actor.items.get(itemId);
    if (item?.type !== "class") {
      throw new Error(
        `${MODULE_ID}: addManifester class.itemId '${itemId}' does not resolve to a class item on actor '${actor.name}'.`,
      );
    }
  }
  const record = createManifesterRecord(config);
  await actor.update({[`flags.${MODULE_ID}.manifesters.${record.id}`]: record});
  return record.id;
}

describe("MANIFESTER template", () => {
  it("exposes the canonical record shape with no legacy fields", () => {
    expect(MANIFESTER).not.toHaveProperty("inUse");
    expect(MANIFESTER).not.toHaveProperty("showConfig");
    expect(MANIFESTER).not.toHaveProperty("classItemId");
    expect(MANIFESTER).not.toHaveProperty("classKind");
    expect(MANIFESTER).toHaveProperty("class");
    expect(MANIFESTER.class).not.toHaveProperty("kind");
    expect(MANIFESTER.class).toHaveProperty("itemId");
    expect(MANIFESTER).toHaveProperty("source");
    expect(MANIFESTER).toHaveProperty("id");
  });

  it("defines sensible defaults", () => {
    expect(MANIFESTER.casterType).toBe("high");
    expect(MANIFESTER.ability).toBe("int");
    expect(MANIFESTER.source).toBe("manual");
    expect(MANIFESTER.class.itemId).toBeNull();
  });
});

describe("createManifesterRecord", () => {
  it("generates a 16-char id when none supplied", () => {
    const rec = createManifesterRecord();
    expect(rec.id).toHaveLength(16);
  });

  it("respects supplied overrides", () => {
    const rec = createManifesterRecord({
      source: "class",
      class: {itemId: "psionClassId001"},
      casterType: "med",
      ability: "wis",
      hasCantrips: false,
      name: "Custom",
    });
    expect(rec.source).toBe("class");
    expect(rec.class.itemId).toBe("psionClassId001");
    expect(rec.casterType).toBe("med");
    expect(rec.ability).toBe("wis");
    expect(rec.hasCantrips).toBe(false);
    expect(rec.name).toBe("Custom");
  });

  it("two records have distinct ids", () => {
    const a = createManifesterRecord();
    const b = createManifesterRecord();
    expect(a.id).not.toBe(b.id);
  });

  it("preserves nested defaults (cl/concentration/powerPoints)", () => {
    const rec = createManifesterRecord();
    expect(rec.cl).toEqual({ formula: "", notes: "" });
    expect(rec.concentration).toEqual({ formula: "", notes: "" });
    expect(rec.powerPoints).toEqual({ max: 0, formula: "" });
  });
});

describe("PsionicsHelper.addManifester validation", () => {
  function mockActor({ items = [], name = "Test Actor" } = {}) {
    const itemMap = new Map(items.map((it) => [it.id, it]));
    return {
      name,
      items: { get: (id) => itemMap.get(id) },
      update: vi.fn(async () => true),
    };
  }

  it("accepts a manual record with no class.itemId", async () => {
    const actor = mockActor();
    const id = await addManifester(actor,{ class: { itemId: null } });
    expect(id).toHaveLength(16);
    expect(actor.update).toHaveBeenCalledOnce();
  });

  it("accepts a class record whose itemId resolves to a class item", async () => {
    const classItem = { id: "psionClassId001", type: "class" };
    const actor = mockActor({ items: [classItem] });
    const id = await addManifester(actor,{
      class: { itemId: "psionClassId001" },
    });
    expect(id).toHaveLength(16);
  });

  it("throws when itemId is set but does not resolve", async () => {
    const actor = mockActor();
    await expect(addManifester(actor,{
      class: { itemId: "bogus000000000000" },
    })).rejects.toThrow(/does not resolve to a class item/);
    expect(actor.update).not.toHaveBeenCalled();
  });

  it("throws when itemId resolves to a non-class item", async () => {
    const featItem = { id: "featItemId000001", type: "feat" };
    const actor = mockActor({ items: [featItem] });
    await expect(addManifester(actor,{
      class: { itemId: "featItemId000001" },
    })).rejects.toThrow(/does not resolve to a class item/);
  });

  it("does not validate when itemId is null (psi-like / HD)", async () => {
    const actor = mockActor();
    const id = await addManifester(actor,{
      class: { itemId: null },
    });
    expect(id).toHaveLength(16);
  });
});
