import { describe, it, expect } from "vitest";

const MODULE_ID = "pf1-psionics";

/**
 * Mirror the pure-data assertion style used by test/migrations/v0.7.0.test.mjs.
 * The migration itself iterates documents via Foundry-only helpers, so the
 * unit test exercises the per-document update-object construction logic.
 */
describe("v0.8.2 migration — casterType normalization", () => {
  describe("actor manifesters update construction", () => {
    function buildActorUpdate(manifesters) {
      const updates = {};
      for (const [bookId, book] of Object.entries(manifesters ?? {})) {
        if (book?.casterType === "medium") {
          updates[`flags.${MODULE_ID}.manifesters.${bookId}.casterType`] = "med";
        }
      }
      return updates;
    }

    it("rewrites only the slots with casterType 'medium'", () => {
      const manifesters = {
        primary:   { casterType: "high",   inUse: true },
        secondary: { casterType: "medium", inUse: true },
        tertiary:  { casterType: "low",    inUse: false },
        spelllike: { casterType: "medium", inUse: false },
      };

      const updates = buildActorUpdate(manifesters);

      expect(updates).toEqual({
        "flags.pf1-psionics.manifesters.secondary.casterType": "med",
        "flags.pf1-psionics.manifesters.spelllike.casterType": "med",
      });
    });

    it("produces an empty update when nothing is 'medium'", () => {
      const manifesters = {
        primary:   { casterType: "high" },
        secondary: { casterType: "med" },
        tertiary:  { casterType: "low" },
      };

      expect(buildActorUpdate(manifesters)).toEqual({});
    });

    it("handles missing or malformed manifester data", () => {
      expect(buildActorUpdate(undefined)).toEqual({});
      expect(buildActorUpdate(null)).toEqual({});
      expect(buildActorUpdate({})).toEqual({});
      expect(buildActorUpdate({ primary: null, secondary: {} })).toEqual({});
    });
  });

  describe("class item update construction", () => {
    function buildClassUpdate(source) {
      if (source?.system?.manifesting?.progression !== "medium") return null;
      return { "system.manifesting.progression": "med" };
    }

    it("rewrites 'medium' progression to 'med'", () => {
      const source = { system: { manifesting: { progression: "medium" } } };
      expect(buildClassUpdate(source)).toEqual({ "system.manifesting.progression": "med" });
    });

    it("skips classes that are already 'med'", () => {
      expect(buildClassUpdate({ system: { manifesting: { progression: "med" } } })).toBeNull();
    });

    it("skips classes with other progression values", () => {
      expect(buildClassUpdate({ system: { manifesting: { progression: "high" } } })).toBeNull();
      expect(buildClassUpdate({ system: { manifesting: { progression: "low" } } })).toBeNull();
    });

    it("skips non-manifesting classes", () => {
      expect(buildClassUpdate({ system: { manifesting: {} } })).toBeNull();
      expect(buildClassUpdate({ system: {} })).toBeNull();
      expect(buildClassUpdate({})).toBeNull();
    });
  });
});
