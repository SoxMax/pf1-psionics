export const PSIBOOK =  {
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

export const PSIBOOKS = {
    primary: foundry.utils.deepClone(PSIBOOK),
    secondary: foundry.utils.deepClone(PSIBOOK),
    tertiary: foundry.utils.deepClone(PSIBOOK),
    spelllike: Object.assign(foundry.utils.deepClone(PSIBOOK), {
        class: "_hd",
        ability: "cha",
    })
};