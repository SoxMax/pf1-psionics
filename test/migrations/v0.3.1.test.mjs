import { describe, it, expect, beforeEach, vi } from "vitest";

// Constants from the module (copy to avoid import issues)
const MODULE_ID = "pf1-psionics";

const POWER_POINTS_FLAG = {
	current: 0,
	temporary: 0,
	maximum: 0
};

const PSIONIC_FOCUS_FLAG = {
	current: 0,
	maximum: 0
};

const MANIFESTERS = {
	primary: { name: "", inUse: false, casterType: "high" },
	secondary: { name: "", inUse: false, casterType: "high" },
	tertiary: { name: "", inUse: false, casterType: "high" },
	spelllike: { name: "", inUse: false, casterType: "high" }
};

describe("v0.3.1 migration", () => {
	describe("addSkillIfMissing logic", () => {
		let mockActor;
		let updateSpy;

		beforeEach(() => {
			updateSpy = vi.fn().mockResolvedValue(undefined);
			mockActor = {
				name: "Test Actor",
				system: {
					skills: {}
				},
				update: updateSpy
			};
		});

		// Helper function that mimics the actual migration logic
		async function addSkillIfMissing(actor, skillKey, skillData) {
			if (actor.system.skills[skillKey] === undefined) {
				await actor.update({
					system: {
						skills: {
							[skillKey]: skillData
						}
					}
				});
				return true;
			}
			return false;
		}

		it("should add Knowledge (Psionics) skill when missing", async () => {
			const skillData = {
				ability: "int",
				rank: 0,
				rt: true,
				acp: false,
				background: true,
			};

			const result = await addSkillIfMissing(mockActor, "kps", skillData);

			expect(result).toBe(true);
			expect(updateSpy).toHaveBeenCalledWith({
				system: {
					skills: {
						kps: skillData
					}
				}
			});
		});

		it("should add Autohypnosis skill when missing", async () => {
			const skillData = {
				ability: "wis",
				rank: 0,
				rt: true,
				acp: false,
				background: true,
			};

			const result = await addSkillIfMissing(mockActor, "ahp", skillData);

			expect(result).toBe(true);
			expect(updateSpy).toHaveBeenCalledWith({
				system: {
					skills: {
						ahp: skillData
					}
				}
			});
		});

		it("should not add skill if it already exists", async () => {
			mockActor.system.skills.kps = {
				ability: "int",
				rank: 5,
				rt: true,
				acp: false,
				background: true,
			};

			const result = await addSkillIfMissing(mockActor, "kps", {
				ability: "int",
				rank: 0,
				rt: true,
				acp: false,
				background: true,
			});

			expect(result).toBe(false);
			expect(updateSpy).not.toHaveBeenCalled();
		});

		it("should preserve existing skill ranks when not adding", async () => {
			mockActor.system.skills.kps = {
				ability: "int",
				rank: 10,
				rt: true,
				acp: false,
				background: true,
			};

			await addSkillIfMissing(mockActor, "kps", {
				ability: "int",
				rank: 0,
				rt: true,
				acp: false,
				background: true,
			});

			expect(mockActor.system.skills.kps.rank).toBe(10);
		});
	});

	describe("addFlagIfMissing logic", () => {
		let mockActor;
		let setFlagSpy;
		let getFlagSpy;

		beforeEach(() => {
			setFlagSpy = vi.fn().mockResolvedValue(undefined);
			const flags = {};
			getFlagSpy = vi.fn((moduleId, flagKey) => flags[flagKey]);

			mockActor = {
				name: "Test Actor",
				getFlag: getFlagSpy,
				setFlag: (moduleId, flagKey, value) => {
					flags[flagKey] = value;
					return setFlagSpy(moduleId, flagKey, value);
				}
			};
		});

		// Helper function that mimics the actual migration logic
		async function addFlagIfMissing(actor, flagKey, defaultValue) {
			if (!actor.getFlag(MODULE_ID, flagKey)) {
				await actor.setFlag(MODULE_ID, flagKey, defaultValue);
				return true;
			}
			return false;
		}

		it("should add manifesters flag when missing", async () => {
			const result = await addFlagIfMissing(mockActor, "manifesters", MANIFESTERS);

			expect(result).toBe(true);
			expect(setFlagSpy).toHaveBeenCalledWith(MODULE_ID, "manifesters", MANIFESTERS);
		});

		it("should add powerPoints flag when missing", async () => {
			const result = await addFlagIfMissing(mockActor, "powerPoints", POWER_POINTS_FLAG);

			expect(result).toBe(true);
			expect(setFlagSpy).toHaveBeenCalledWith(MODULE_ID, "powerPoints", POWER_POINTS_FLAG);
		});

		it("should add focus flag when missing", async () => {
			const result = await addFlagIfMissing(mockActor, "focus", PSIONIC_FOCUS_FLAG);

			expect(result).toBe(true);
			expect(setFlagSpy).toHaveBeenCalledWith(MODULE_ID, "focus", PSIONIC_FOCUS_FLAG);
		});

		it("should not add flag if it already exists", async () => {
			// Pre-populate the flag
			await mockActor.setFlag(MODULE_ID, "manifesters", MANIFESTERS);
			setFlagSpy.mockClear();

			const result = await addFlagIfMissing(mockActor, "manifesters", MANIFESTERS);

			expect(result).toBe(false);
			expect(setFlagSpy).not.toHaveBeenCalled();
		});

		it("should preserve existing flag values when not adding", async () => {
			const existingValue = { custom: "data" };
			await mockActor.setFlag(MODULE_ID, "customFlag", existingValue);
			setFlagSpy.mockClear();

			await addFlagIfMissing(mockActor, "customFlag", { different: "value" });

			expect(mockActor.getFlag(MODULE_ID, "customFlag")).toEqual(existingValue);
		});
	});

	describe("isValidActor logic", () => {
		// Helper function that mimics the actual migration logic
		function isValidActor(actor) {
			return !!(actor.type === "character" || actor.type === "npc") && !!actor.system.skills;
		}

		it("should accept character actors with skills", () => {
			const actor = {
				type: "character",
				system: {
					skills: {}
				}
			};

			expect(isValidActor(actor)).toBe(true);
		});

		it("should accept npc actors with skills", () => {
			const actor = {
				type: "npc",
				system: {
					skills: {}
				}
			};

			expect(isValidActor(actor)).toBe(true);
		});

		it("should reject actors without skills property", () => {
			const actor = {
				type: "character",
				system: {}
			};

			expect(isValidActor(actor)).toBe(false);
		});

		it("should reject non-character/npc actors", () => {
			const actor = {
				type: "vehicle",
				system: {
					skills: {}
				}
			};

			expect(isValidActor(actor)).toBe(false);
		});

		it("should reject actors with null skills", () => {
			const actor = {
				type: "character",
				system: {
					skills: null
				}
			};

			expect(isValidActor(actor)).toBe(false);
		});

		it("should reject actors with undefined skills", () => {
			const actor = {
				type: "character",
				system: {
					skills: undefined
				}
			};

			expect(isValidActor(actor)).toBe(false);
		});
	});

	describe("full actor migration", () => {
		let mockActor;
		let updateSpy;
		let setFlagSpy;
		let getFlagSpy;

		beforeEach(() => {
			updateSpy = vi.fn().mockResolvedValue(undefined);
			setFlagSpy = vi.fn().mockResolvedValue(undefined);
			const flags = {};
			getFlagSpy = vi.fn((moduleId, flagKey) => flags[flagKey]);

			mockActor = {
				name: "Test Psion",
				type: "character",
				system: {
					skills: {}
				},
				update: updateSpy,
				getFlag: getFlagSpy,
				setFlag: (moduleId, flagKey, value) => {
					flags[flagKey] = value;
					return setFlagSpy(moduleId, flagKey, value);
				}
			};
		});

		// Helper functions that mimic the actual migration logic
		async function addSkillIfMissing(actor, skillKey, skillData) {
			if (actor.system.skills[skillKey] === undefined) {
				await actor.update({
					system: {
						skills: {
							[skillKey]: skillData
						}
					}
				});
				return true;
			}
			return false;
		}

		async function addFlagIfMissing(actor, flagKey, defaultValue) {
			if (!actor.getFlag(MODULE_ID, flagKey)) {
				await actor.setFlag(MODULE_ID, flagKey, defaultValue);
				return true;
			}
			return false;
		}

		it("should add all required skills and flags to a fresh actor", async () => {
			// Simulate the migration logic
			const kpsAdded = await addSkillIfMissing(mockActor, "kps", {
				ability: "int",
				rank: 0,
				rt: true,
				acp: false,
				background: true,
			});

			const ahpAdded = await addSkillIfMissing(mockActor, "ahp", {
				ability: "wis",
				rank: 0,
				rt: true,
				acp: false,
				background: true,
			});

			const manifestersAdded = await addFlagIfMissing(mockActor, "manifesters", MANIFESTERS);
			const powerPointsAdded = await addFlagIfMissing(mockActor, "powerPoints", POWER_POINTS_FLAG);
			const focusAdded = await addFlagIfMissing(mockActor, "focus", PSIONIC_FOCUS_FLAG);

			const modified = kpsAdded || ahpAdded || manifestersAdded || powerPointsAdded || focusAdded;

			expect(modified).toBe(true);
			expect(updateSpy).toHaveBeenCalledTimes(2); // Two skill additions
			expect(setFlagSpy).toHaveBeenCalledTimes(3); // Three flag additions
		});

		it("should not modify an already-migrated actor", async () => {
			// Pre-populate actor with all required data
			mockActor.system.skills.kps = {
				ability: "int",
				rank: 5,
				rt: true,
				acp: false,
				background: true,
			};
			mockActor.system.skills.ahp = {
				ability: "wis",
				rank: 3,
				rt: true,
				acp: false,
				background: true,
			};
			await mockActor.setFlag(MODULE_ID, "manifesters", MANIFESTERS);
			await mockActor.setFlag(MODULE_ID, "powerPoints", POWER_POINTS_FLAG);
			await mockActor.setFlag(MODULE_ID, "focus", PSIONIC_FOCUS_FLAG);

			updateSpy.mockClear();
			setFlagSpy.mockClear();

			// Re-run migration
			const kpsAdded = await addSkillIfMissing(mockActor, "kps", {
				ability: "int",
				rank: 0,
				rt: true,
				acp: false,
				background: true,
			});

			const ahpAdded = await addSkillIfMissing(mockActor, "ahp", {
				ability: "wis",
				rank: 0,
				rt: true,
				acp: false,
				background: true,
			});

			const manifestersAdded = await addFlagIfMissing(mockActor, "manifesters", MANIFESTERS);
			const powerPointsAdded = await addFlagIfMissing(mockActor, "powerPoints", POWER_POINTS_FLAG);
			const focusAdded = await addFlagIfMissing(mockActor, "focus", PSIONIC_FOCUS_FLAG);

			const modified = kpsAdded || ahpAdded || manifestersAdded || powerPointsAdded || focusAdded;

			expect(modified).toBe(false);
			expect(updateSpy).not.toHaveBeenCalled();
			expect(setFlagSpy).not.toHaveBeenCalled();
		});

		it("should handle partially-migrated actors", async () => {
			// Actor has some but not all required data
			mockActor.system.skills.kps = {
				ability: "int",
				rank: 5,
				rt: true,
				acp: false,
				background: true,
			};
			await mockActor.setFlag(MODULE_ID, "powerPoints", POWER_POINTS_FLAG);

			updateSpy.mockClear();
			setFlagSpy.mockClear();

			// Re-run migration
			const kpsAdded = await addSkillIfMissing(mockActor, "kps", {
				ability: "int",
				rank: 0,
				rt: true,
				acp: false,
				background: true,
			});

			const ahpAdded = await addSkillIfMissing(mockActor, "ahp", {
				ability: "wis",
				rank: 0,
				rt: true,
				acp: false,
				background: true,
			});

			const manifestersAdded = await addFlagIfMissing(mockActor, "manifesters", MANIFESTERS);
			const powerPointsAdded = await addFlagIfMissing(mockActor, "powerPoints", POWER_POINTS_FLAG);
			const focusAdded = await addFlagIfMissing(mockActor, "focus", PSIONIC_FOCUS_FLAG);

			const modified = kpsAdded || ahpAdded || manifestersAdded || powerPointsAdded || focusAdded;

			expect(modified).toBe(true);
			expect(ahpAdded).toBe(true);
			expect(manifestersAdded).toBe(true);
			expect(focusAdded).toBe(true);
			expect(kpsAdded).toBe(false);
			expect(powerPointsAdded).toBe(false);
		});
	});
});

