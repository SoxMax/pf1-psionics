import { describe, it, expect } from "vitest";

const PSIONIC_SKILLS = {
  kps: { i18nKey: "PF1-Psionics.Skills.kps", fallback: "Knowledge (Psionics)" },
  ahp: { i18nKey: "PF1-Psionics.Skills.ahp", fallback: "Autohypnosis" },
};

const NAMES = {
  "PF1-Psionics.Skills.kps": "Knowledge (Psionics)",
  "PF1-Psionics.Skills.ahp": "Autohypnosis",
};

/** Emulates game.i18n.localize when the lang file is not loaded. */
const localizeMissing = (key) => key;

/**
 * Mirror the pure-data assertion style used by test/migrations/v0.8.2.test.mjs.
 * The migration itself iterates documents via Foundry-only helpers, so the
 * unit test exercises the per-actor update-object construction logic.
 */
describe("v0.9.2 migration — psionic skill name backfill", () => {
  function buildSkillNameUpdates(skills, localize = (key) => NAMES[key] ?? key) {
    const updates = {};
    for (const [skillKey, { i18nKey, fallback }] of Object.entries(PSIONIC_SKILLS)) {
      const skill = skills?.[skillKey];
      if (!skill) continue;
      if (skill.name) continue;
      const localized = localize(i18nKey);
      updates[`system.skills.${skillKey}.name`] = localized === i18nKey ? fallback : localized;
    }
    return updates;
  }

  it("adds names to psionic skills that have none", () => {
    const skills = {
      kps: { ability: "int", rank: 0, rt: true },
      ahp: { ability: "wis", rank: 0, rt: true },
    };

    expect(buildSkillNameUpdates(skills)).toEqual({
      "system.skills.kps.name": "Knowledge (Psionics)",
      "system.skills.ahp.name": "Autohypnosis",
    });
  });

  it("only updates the skill that is missing a name", () => {
    const skills = {
      kps: { ability: "int", name: "Knowledge (Psionics)" },
      ahp: { ability: "wis" },
    };

    expect(buildSkillNameUpdates(skills)).toEqual({
      "system.skills.ahp.name": "Autohypnosis",
    });
  });

  it("skips skills that already have a name", () => {
    const skills = {
      kps: { name: "Knowledge (Psionics)" },
      ahp: { name: "Autohypnosis" },
    };

    expect(buildSkillNameUpdates(skills)).toEqual({});
  });

  it("preserves a custom name the user set", () => {
    const skills = { kps: { name: "Psi Lore" }, ahp: { name: "Autohypnosis" } };
    expect(buildSkillNameUpdates(skills)).toEqual({});
  });

  it("skips skills that do not exist on the actor", () => {
    expect(buildSkillNameUpdates({ ahp: { ability: "wis" } })).toEqual({
      "system.skills.ahp.name": "Autohypnosis",
    });
    expect(buildSkillNameUpdates({ kna: { name: "Knowledge (Arcana)" } })).toEqual({});
  });

  it("ignores non-psionic skills entirely", () => {
    const skills = { kna: {}, per: {}, blf: { name: "Bluff" } };
    expect(buildSkillNameUpdates(skills)).toEqual({});
  });

  it("handles missing or malformed skill data", () => {
    expect(buildSkillNameUpdates(undefined)).toEqual({});
    expect(buildSkillNameUpdates(null)).toEqual({});
    expect(buildSkillNameUpdates({})).toEqual({});
    expect(buildSkillNameUpdates({ kps: null, ahp: undefined })).toEqual({});
  });

  it("falls back to English when localization is unavailable", () => {
    const skills = { kps: { ability: "int" }, ahp: { ability: "wis" } };

    expect(buildSkillNameUpdates(skills, localizeMissing)).toEqual({
      "system.skills.kps.name": "Knowledge (Psionics)",
      "system.skills.ahp.name": "Autohypnosis",
    });
  });

  it("never stores a raw i18n key as the skill name", () => {
    const updates = buildSkillNameUpdates({ kps: {}, ahp: {} }, localizeMissing);

    for (const value of Object.values(updates)) {
      expect(value.startsWith("PF1-Psionics.")).toBe(false);
    }
  });

  it("treats an empty-string name as missing", () => {
    expect(buildSkillNameUpdates({ kps: { name: "" } })).toEqual({
      "system.skills.kps.name": "Knowledge (Psionics)",
    });
  });
});
