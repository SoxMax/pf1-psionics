export const MANIFESTER = {
    id: "",
    source: "manual",
    class: {
        itemId: null,    // Item._id of class on the actor; null = HD/psi-like or orphan
    },
    name: "",
    casterType: "high",
    cl: {
        formula: "",
        notes: "",
    },
    concentration: {
        formula: "",
        notes: "",
    },
    ability: "int",
    autoLevelPowerPoints: true,
    autoAttributePowerPoints: true,
    autoMaxPowerLevel: true,
    hasCantrips: true,
    spellPreparationMode: "spontaneous",
    baseDCFormula: "10 + @sl + @ablMod",
    powerPoints: {
        max: 0,
        formula: "",
    },
};

export function createManifesterRecord(overrides = {}) {
    const id = overrides.id || foundry.utils.randomID(16);
    const record = foundry.utils.mergeObject(
        foundry.utils.deepClone(MANIFESTER),
        overrides,
        { inplace: false }
    );
    record.id = id;
    return record;
}
