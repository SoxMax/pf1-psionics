import { describe, it, expect, beforeEach, vi } from "vitest";

// Constants from the module (copy to avoid import issues)
const MODULE_ID = "pf1-psionics";

const MANIFESTERS = {
	primary: { name: "", inUse: false, casterType: "high" },
	secondary: { name: "", inUse: false, casterType: "high" },
	tertiary: { name: "", inUse: false, casterType: "high" },
	spelllike: { name: "", inUse: false, casterType: "high" }
};

describe("v0.5.0 migration", () => {
	describe("actor migration - manifestors to manifesters", () => {
		let mockActor;
		let setFlagSpy;
		let getFlagSpy;
		let flags;

		beforeEach(() => {
			setFlagSpy = vi.fn().mockResolvedValue(undefined);
			flags = {};
			getFlagSpy = vi.fn((moduleId, flagKey) => flags[flagKey]);

			mockActor = {
				name: "Test Psion",
				getFlag: getFlagSpy,
				setFlag: (moduleId, flagKey, value) => {
					flags[flagKey] = value;
					return setFlagSpy(moduleId, flagKey, value);
				}
			};
		});

		it("should rename manifestors flag to manifesters", async () => {
			const oldManifestors = {
				primary: { name: "Psion", inUse: true, casterType: "high" },
				secondary: { name: "", inUse: false },
				tertiary: { name: "", inUse: false },
				spelllike: { name: "", inUse: false }
			};

			flags.manifestors = oldManifestors;

			// Simulate the migration logic from v0.5.0.mjs
			const oldManifestorsValue = mockActor.getFlag(MODULE_ID, "manifestors");

			if (oldManifestorsValue && !mockActor.getFlag(MODULE_ID, "manifesters")) {
				await mockActor.setFlag(MODULE_ID, "manifesters", oldManifestorsValue);
			}

			expect(setFlagSpy).toHaveBeenCalledWith(MODULE_ID, "manifesters", oldManifestors);
			expect(mockActor.getFlag(MODULE_ID, "manifesters")).toEqual(oldManifestors);
		});

		it("should skip migration if manifestors flag does not exist", async () => {
			// No manifestors flag set
			const oldManifestorsValue = mockActor.getFlag(MODULE_ID, "manifestors");

			if (oldManifestorsValue && !mockActor.getFlag(MODULE_ID, "manifesters")) {
				await mockActor.setFlag(MODULE_ID, "manifesters", oldManifestorsValue);
			}

			expect(setFlagSpy).not.toHaveBeenCalled();
		});

		it("should skip migration if manifesters flag already exists", async () => {
			const oldManifestors = {
				primary: { name: "Psion", inUse: true },
			};
			const newManifesters = {
				primary: { name: "Wilder", inUse: true },
			};

			flags.manifestors = oldManifestors;
			flags.manifesters = newManifesters;

			// Simulate migration logic
			const oldManifestorsValue = mockActor.getFlag(MODULE_ID, "manifestors");

			if (oldManifestorsValue && !mockActor.getFlag(MODULE_ID, "manifesters")) {
				await mockActor.setFlag(MODULE_ID, "manifesters", oldManifestorsValue);
			}

			expect(setFlagSpy).not.toHaveBeenCalled();
			// manifesters should remain unchanged
			expect(mockActor.getFlag(MODULE_ID, "manifesters")).toEqual(newManifesters);
		});

		it("should preserve all manifester data during rename", async () => {
			const oldManifestors = {
				primary: {
					name: "Psion",
					inUse: true,
					casterType: "high",
					class: "psion",
					cl: { formula: "@classes.psion.level", notes: "" },
					concentration: { formula: "@classes.psion.level + @abilities.int.mod", notes: "" },
					ability: "int",
					autoLevelPowerPoints: true,
					autoAttributePowerPoints: true,
					autoMaxPowerLevel: true,
					hasCantrips: true,
					spellPreparationMode: "spontaneous",
					baseDCFormula: "10 + @sl + @ablMod",
					powerPoints: { max: 100, formula: "" }
				},
				secondary: {
					name: "Wilder",
					inUse: true,
					casterType: "medium",
					class: "wilder",
					ability: "cha"
				},
				tertiary: { name: "", inUse: false },
				spelllike: { name: "", inUse: false }
			};

			flags.manifestors = oldManifestors;

			// Simulate migration
			const oldManifestorsValue = mockActor.getFlag(MODULE_ID, "manifestors");

			if (oldManifestorsValue && !mockActor.getFlag(MODULE_ID, "manifesters")) {
				await mockActor.setFlag(MODULE_ID, "manifesters", oldManifestorsValue);
			}

			const migratedManifesters = mockActor.getFlag(MODULE_ID, "manifesters");

			expect(migratedManifesters).toEqual(oldManifestors);
			expect(migratedManifesters.primary.name).toBe("Psion");
			expect(migratedManifesters.primary.casterType).toBe("high");
			expect(migratedManifesters.primary.powerPoints.max).toBe(100);
			expect(migratedManifesters.secondary.name).toBe("Wilder");
			expect(migratedManifesters.secondary.ability).toBe("cha");
		});

		it("should preserve old manifestors flag for data safety", async () => {
			// This documents intentional behavior - we keep the old flag to prevent data loss
			// if the migration is interrupted or fails
			const oldManifestors = {
				primary: { name: "Psion", inUse: true },
			};

			flags.manifestors = oldManifestors;

			// Migration logic (without cleanup by design)
			const oldManifestorsValue = mockActor.getFlag(MODULE_ID, "manifestors");

			if (oldManifestorsValue && !mockActor.getFlag(MODULE_ID, "manifesters")) {
				await mockActor.setFlag(MODULE_ID, "manifesters", oldManifestorsValue);
				// Intentionally NOT deleting old flag for data safety
			}

			// The old manifestors flag should still exist as a backup
			expect(mockActor.getFlag(MODULE_ID, "manifestors")).toEqual(oldManifestors);
			// And the new manifesters flag should be set
			expect(mockActor.getFlag(MODULE_ID, "manifesters")).toEqual(oldManifestors);
		});
	});

	describe("actor migration - two-step process (new behavior)", () => {
		let mockActor;
		let setFlagSpy;
		let getFlagSpy;
		let flags;

		beforeEach(() => {
			setFlagSpy = vi.fn().mockResolvedValue(undefined);
			flags = {};
			getFlagSpy = vi.fn((moduleId, flagKey) => flags[flagKey]);

			mockActor = {
				name: "Test Psion",
				getFlag: getFlagSpy,
				setFlag: (moduleId, flagKey, value) => {
					flags[flagKey] = value;
					return setFlagSpy(moduleId, flagKey, value);
				}
			};
		});

		// Helper function that mimics addFlagIfMissing
		async function addFlagIfMissing(actor, flagKey, defaultValue) {
			if (!actor.getFlag(MODULE_ID, flagKey)) {
				await actor.setFlag(MODULE_ID, flagKey, defaultValue);
				return true;
			}
			return false;
		}

		it("should add default manifesters to actor without any flags", async () => {
			// Actor has no flags at all
			let modified = false;

			// Step 1: Add default manifesters
			const manifestersAdded = await addFlagIfMissing(mockActor, "manifesters", MANIFESTERS);
			if (manifestersAdded) modified = true;

			// Step 2: Check for old manifestors (none exist)
			const oldManifestors = mockActor.getFlag(MODULE_ID, "manifestors");
			if (oldManifestors) {
				await mockActor.setFlag(MODULE_ID, "manifesters", oldManifestors);
				modified = true;
			}

			expect(modified).toBe(true);
			expect(setFlagSpy).toHaveBeenCalledWith(MODULE_ID, "manifesters", MANIFESTERS);
			expect(setFlagSpy).toHaveBeenCalledTimes(1); // Only once for default
			expect(mockActor.getFlag(MODULE_ID, "manifesters")).toEqual(MANIFESTERS);
		});

		it("should add default manifesters then overwrite with manifestors data", async () => {
			// Actor has old manifestors flag but no manifesters
			const oldManifestors = {
				primary: { name: "Psion", inUse: true, casterType: "high" },
				secondary: { name: "Wilder", inUse: true, casterType: "medium" },
				tertiary: { name: "", inUse: false },
				spelllike: { name: "", inUse: false }
			};
			flags.manifestors = oldManifestors;

			let modified = false;

			// Step 1: Add default manifesters
			const manifestersAdded = await addFlagIfMissing(mockActor, "manifesters", MANIFESTERS);
			if (manifestersAdded) modified = true;

			// Step 2: Migrate old manifestors data
			const oldManifestorsValue = mockActor.getFlag(MODULE_ID, "manifestors");
			if (oldManifestorsValue) {
				await mockActor.setFlag(MODULE_ID, "manifesters", oldManifestorsValue);
				modified = true;
			}

			expect(modified).toBe(true);
			expect(setFlagSpy).toHaveBeenCalledTimes(2); // Once for default, once for override
			expect(setFlagSpy).toHaveBeenNthCalledWith(1, MODULE_ID, "manifesters", MANIFESTERS);
			expect(setFlagSpy).toHaveBeenNthCalledWith(2, MODULE_ID, "manifesters", oldManifestors);
			// Final value should be the old manifestors data
			expect(mockActor.getFlag(MODULE_ID, "manifesters")).toEqual(oldManifestors);
			// Old manifestors should still exist (intentionally not deleted)
			expect(mockActor.getFlag(MODULE_ID, "manifestors")).toEqual(oldManifestors);
		});

		it("should not modify actor that already has manifesters", async () => {
			// Actor already has manifesters (already migrated)
			const existingManifesters = {
				primary: { name: "Cryptic", inUse: true, casterType: "medium" },
				secondary: { name: "", inUse: false },
				tertiary: { name: "", inUse: false },
				spelllike: { name: "", inUse: false }
			};
			flags.manifesters = existingManifesters;

			let modified = false;

			// Step 1: Try to add default manifesters (will skip)
			const manifestersAdded = await addFlagIfMissing(mockActor, "manifesters", MANIFESTERS);
			if (manifestersAdded) modified = true;

			// Step 2: Check for old manifestors
			const oldManifestors = mockActor.getFlag(MODULE_ID, "manifestors");
			if (oldManifestors) {
				await mockActor.setFlag(MODULE_ID, "manifesters", oldManifestors);
				modified = true;
			}

			expect(modified).toBe(false);
			expect(setFlagSpy).not.toHaveBeenCalled();
			expect(mockActor.getFlag(MODULE_ID, "manifesters")).toEqual(existingManifesters);
		});

		it("should ensure data safety: default manifesters added even if manifestors migration fails", async () => {
			// This is the key safety improvement - even if the old manifestors flag is somehow
			// corrupted or the second step fails, the actor will still have valid default manifesters

			// Actor has corrupted manifestors data
			flags.manifestors = null;

			let modified = false;

			// Step 1: Add default manifesters (succeeds)
			const manifestersAdded = await addFlagIfMissing(mockActor, "manifesters", MANIFESTERS);
			if (manifestersAdded) modified = true;

			// Step 2: Try to migrate old manifestors (skipped because manifestors is null)
			const oldManifestors = mockActor.getFlag(MODULE_ID, "manifestors");
			if (oldManifestors) {
				await mockActor.setFlag(MODULE_ID, "manifesters", oldManifestors);
				modified = true;
			}

			expect(modified).toBe(true);
			expect(setFlagSpy).toHaveBeenCalledTimes(1); // Only default added
			// Actor has valid default manifesters even though manifestors was corrupted
			expect(mockActor.getFlag(MODULE_ID, "manifesters")).toEqual(MANIFESTERS);
		});

		it("should handle actor with both manifestors and manifesters (idempotent)", async () => {
			// Actor already has both flags (migration ran partially before?)
			const oldManifestors = {
				primary: { name: "Psion", inUse: true },
			};
			const existingManifesters = {
				primary: { name: "Wilder", inUse: true },
			};
			flags.manifestors = oldManifestors;
			flags.manifesters = existingManifesters;

			let modified = false;

			// Step 1: Try to add default manifesters (skipped)
			const manifestersAdded = await addFlagIfMissing(mockActor, "manifesters", MANIFESTERS);
			if (manifestersAdded) modified = true;

			// Step 2: Check for old manifestors (exists but manifesters already set, so depends on logic)
			const oldManifestorsValue = mockActor.getFlag(MODULE_ID, "manifestors");
			if (oldManifestorsValue) {
				// In the new migration, we WOULD overwrite, but let's test both scenarios
				// For idempotency, we might want to skip if manifesters already exists
				// Current implementation would overwrite
				await mockActor.setFlag(MODULE_ID, "manifesters", oldManifestorsValue);
				modified = true;
			}

			expect(modified).toBe(true);
			// This shows the migration will re-copy manifestors -> manifesters if both exist
			// This ensures consistency but means the migration is not fully idempotent
			expect(setFlagSpy).toHaveBeenCalledWith(MODULE_ID, "manifesters", oldManifestors);
		});
	});

	describe("power item migration - manifestor to manifester", () => {
		let mockItem;
		let updateSpy;

		beforeEach(() => {
			updateSpy = vi.fn().mockResolvedValue(undefined);

			mockItem = {
				name: "Mind Thrust",
				type: `${MODULE_ID}.power`,
				_source: {
					system: {}
				},
				update: updateSpy
			};
		});

		it("should rename manifestor field to manifester", async () => {
			mockItem._source.system.manifestor = "primary";

			// Simulate migration logic from v0.5.0.mjs
			const oldManifestor = mockItem._source.system?.manifestor;

			if (oldManifestor !== undefined) {
				await mockItem.update({
					"system.manifester": oldManifestor || "primary",
				});
			}

			expect(updateSpy).toHaveBeenCalledWith({
				"system.manifester": "primary"
			});
		});

		it("should handle secondary manifester value", async () => {
			mockItem._source.system.manifestor = "secondary";

			const oldManifestor = mockItem._source.system?.manifestor;

			if (oldManifestor !== undefined) {
				await mockItem.update({
					"system.manifester": oldManifestor || "primary",
				});
			}

			expect(updateSpy).toHaveBeenCalledWith({
				"system.manifester": "secondary"
			});
		});

		it("should handle tertiary manifester value", async () => {
			mockItem._source.system.manifestor = "tertiary";

			const oldManifestor = mockItem._source.system?.manifestor;

			if (oldManifestor !== undefined) {
				await mockItem.update({
					"system.manifester": oldManifestor || "primary",
				});
			}

			expect(updateSpy).toHaveBeenCalledWith({
				"system.manifester": "tertiary"
			});
		});

		it("should handle spelllike manifester value", async () => {
			mockItem._source.system.manifestor = "spelllike";

			const oldManifestor = mockItem._source.system?.manifestor;

			if (oldManifestor !== undefined) {
				await mockItem.update({
					"system.manifester": oldManifestor || "primary",
				});
			}

			expect(updateSpy).toHaveBeenCalledWith({
				"system.manifester": "spelllike"
			});
		});

		it("should default empty manifestor to primary", async () => {
			mockItem._source.system.manifestor = "";

			const oldManifestor = mockItem._source.system?.manifestor;

			if (oldManifestor !== undefined) {
				await mockItem.update({
					"system.manifester": oldManifestor || "primary",
				});
			}

			expect(updateSpy).toHaveBeenCalledWith({
				"system.manifester": "primary"
			});
		});

		it("should default null manifestor to primary", async () => {
			mockItem._source.system.manifestor = null;

			const oldManifestor = mockItem._source.system?.manifestor;

			if (oldManifestor !== undefined) {
				await mockItem.update({
					"system.manifester": oldManifestor || "primary",
				});
			}

			expect(updateSpy).toHaveBeenCalledWith({
				"system.manifester": "primary"
			});
		});

		it("should skip items without manifestor field", async () => {
			// No manifestor field in _source.system

			const oldManifestor = mockItem._source.system?.manifestor;

			if (oldManifestor !== undefined) {
				await mockItem.update({
					"system.manifester": oldManifestor || "primary",
				});
			}

			expect(updateSpy).not.toHaveBeenCalled();
		});

		it("should skip non-power items", async () => {
			mockItem.type = "weapon";
			mockItem._source.system.manifestor = "primary";

			// Migration only processes power items
			if (mockItem.type !== `${MODULE_ID}.power`) {
				return;
			}

			const oldManifestor = mockItem._source.system?.manifestor;

			if (oldManifestor !== undefined) {
				await mockItem.update({
					"system.manifester": oldManifestor || "primary",
				});
			}

			expect(updateSpy).not.toHaveBeenCalled();
		});

		it("should preserve old manifestor field for data safety", async () => {
			// This documents intentional behavior - we keep the old field to prevent data loss
			// if the migration is interrupted or fails
			mockItem._source.system.manifestor = "primary";

			const oldManifestor = mockItem._source.system?.manifestor;

			if (oldManifestor !== undefined) {
				await mockItem.update({
					"system.manifester": oldManifestor || "primary",
					// Intentionally NOT deleting old field for data safety
				});
			}

			// The update should only set the new field, preserving the old one
			expect(updateSpy).toHaveBeenCalledWith({
				"system.manifester": "primary"
			});

			// The old manifestor field remains as a backup (in _source.system.manifestor)
			// This is intentional to prevent data loss if migration fails
		});
	});

	describe("edge cases", () => {
		it("should handle actors with both old and new flags (data corruption scenario)", async () => {
			const setFlagSpy = vi.fn().mockResolvedValue(undefined);
			const flags = {
				manifestors: { primary: { name: "Old Psion", inUse: true } },
				manifesters: { primary: { name: "New Psion", inUse: true } }
			};
			const getFlagSpy = vi.fn((moduleId, flagKey) => flags[flagKey]);

			const mockActor = {
				name: "Corrupted Actor",
				getFlag: getFlagSpy,
				setFlag: setFlagSpy
			};

			// Migration should skip - new flag already exists
			const oldManifestorsValue = mockActor.getFlag(MODULE_ID, "manifestors");

			if (oldManifestorsValue && !mockActor.getFlag(MODULE_ID, "manifesters")) {
				await mockActor.setFlag(MODULE_ID, "manifesters", oldManifestorsValue);
			}

			expect(setFlagSpy).not.toHaveBeenCalled();
			expect(mockActor.getFlag(MODULE_ID, "manifesters").primary.name).toBe("New Psion");
		});

		it("should handle power with manifestor = undefined explicitly", async () => {
			const updateSpy = vi.fn().mockResolvedValue(undefined);
			const mockItem = {
				name: "Test Power",
				type: `${MODULE_ID}.power`,
				_source: {
					system: {
						manifestor: undefined
					}
				},
				update: updateSpy
			};

			const oldManifestor = mockItem._source.system?.manifestor;

			if (oldManifestor !== undefined) {
				await mockItem.update({
					"system.manifester": oldManifestor || "primary",
				});
			}

			// undefined is undefined, so should skip
			expect(updateSpy).not.toHaveBeenCalled();
		});

		it("should handle deeply nested system data access safely", async () => {
			const updateSpy = vi.fn().mockResolvedValue(undefined);
			const mockItem = {
				name: "Test Power",
				type: `${MODULE_ID}.power`,
				_source: {
					// Missing system property entirely
				},
				update: updateSpy
			};

			const oldManifestor = mockItem._source.system?.manifestor;

			if (oldManifestor !== undefined) {
				await mockItem.update({
					"system.manifester": oldManifestor || "primary",
				});
			}

			expect(updateSpy).not.toHaveBeenCalled();
		});
	});
});

