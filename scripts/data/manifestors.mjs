export const MANIFESTOR =  {
        name: "",
        inUse: false,
        showConfig: false,
        casterType: "high",
        class: "",
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

export const MANIFESTORS = {
    primary: foundry.utils.deepClone(MANIFESTOR),
    secondary: foundry.utils.deepClone(MANIFESTOR),
    tertiary: foundry.utils.deepClone(MANIFESTOR),
    spelllike: Object.assign(foundry.utils.deepClone(MANIFESTOR), {
        class: "_hd",
        ability: "cha",
    })
};