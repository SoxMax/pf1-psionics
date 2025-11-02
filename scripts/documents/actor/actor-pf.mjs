import { MODULE_ID } from "../../_module.mjs";
import { POINTS_PER_LEVEL } from "../../data/powerpoints.mjs";
import { PSIBOOKS } from "../../data/psibooks.mjs";
import { Spellbook, SpellbookMode, SpellbookSlots, SpellRanges } from "./utils/spellbook.mjs";

export function onPreCreateActor(document, data, options, userId) {
    if (!["character", "npc"].includes(document.type)) return;
    // Knowledge (Psionics)
    document.updateSource({
        system: {
            skills: {
                kps: {
                    name: game.i18n.localize("PF1-Psionics.Skills.kps"),
                    ability: "int",
                    rank: 0,
                    rt: true,
                    acp: false,
                    background: true,
                }
            }
        }
    });
    // Autohypnosis
    document.updateSource({
        system: {
            skills: {
                ahp: {
                    name: game.i18n.localize("PF1-Psionics.Skills.ahp"),
                    ability: "wis",
                    rt: false,
                    rank: 0,
                    acp: false,
                    background: true,
                }
            }
        }
    });

    const psionicsFlags = {
        [`flags.${MODULE_ID}`]: {
            spellbooks: PSIBOOKS,
            powerPoints: { current: 0, temporary: 0 },
            focus: { current: 0 }
        }
    };
    // Can't use setFlag here
    document.updateSource(psionicsFlags);
}

export function pf1PrepareBaseActorData(actor) {
}

export function pf1PrepareDerivedActorData(actor) {
    if (actor.getFlag(MODULE_ID, "spellbooks")) {
        deriveManifestorsInfo(actor);
        deriveTotalPowerPoints(actor);
        deriveTotalFocus(actor);
    }
}

export function pf1ActorRest(actor, options, updateData, itemUpdates) {
    rechargePowerPoints(actor);
    rechargeFocus(actor);
}

function deriveManifestorsInfo(actor) {
    const rollData = actor.getRollData({ refresh: true });
    const spellbooks = actor.getFlag(MODULE_ID, "spellbooks");
    for (const [bookId, spellbook] of Object.entries(spellbooks)) {
        deriveManifestorInfo(actor, rollData, bookId, spellbook);
        delete rollData.class;
        delete rollData.classLevel;
        delete rollData.cl;
        delete rollData.sl;
        delete rollData.ablMod;
    }
}

function deriveManifestorInfo(actor, rollData, bookId, book) {
    book.label = getBookLabel(actor, bookId, book);
    // Stop calculating data for unused books
    if (!book.inUse) return;

    // Ensure class info is available
    if (book.class === "_hd") rollData.class = { level: rollData.attributes.hd?.total };
    else rollData.class = rollData.classes?.[book.class];
    rollData.cl = book.cl?.total ?? 0;

    calculateCasterLevel(actor, rollData, bookId, book);
    calculateConcentration(actor, rollData, bookId, book);
    calculatePowerPoints(actor, rollData, bookId, book);

    // Set spellbook ranges
    book.range = new SpellRanges(book.cl.total);
}

function getBookLabel(actor, bookId, book) {
    // If the player has defined a a name, use that
    if (book.name) {
        return book.name;
    }
    // If the book has a class associated use that
    if (book.class) {
        if (book.class === "_hd") {
            return game.i18n.localize("PF1-Psionics.Spellbooks.Spelllike");
        } else {
            const bookClassId = actor.classes[book.class]?._id;
            const bookClass = actor.items.get(bookClassId);
            if (bookClass) {
                return bookClass.name;
            }
        }
    }

    // Fall back to using the book id as the label
    return game.i18n.localize(`PF1.SpellBook${bookId.capitalize()}`);
}

function calculateCasterLevel(actor, rollData, bookId, book) {
    let clTotal = 0;
    const key = `flags.${MODULE_ID}.spellbooks.${bookId}.cl.total`;
    const formula = book.cl.formula || "0";
    let classLevelTotal = 0;

    // Set source info function
    const setSourceInfoByName = pf1.documents.actor.changes.setSourceInfoByName;
    // Add NPC base
    if (actor.type === "npc") {
        const value = book.cl.base || 0;
        classLevelTotal += value;
        clTotal += value;
        setSourceInfoByName(actor.sourceInfo, key, game.i18n.localize("PF1.Base"), value);
    }
    // Add HD
    if (book.class === "_hd") {
        const value = actor.system.attributes.hd.total;
        classLevelTotal += value;
        clTotal += value;
        setSourceInfoByName(actor.sourceInfo, key, game.i18n.localize("PF1.HitDie"), value);
    }
    // Add class levels
    else if (book.class && rollData.class) {
        const value = rollData.class?.unlevel || 0;
        classLevelTotal += value;
        clTotal += value;

        setSourceInfoByName(actor.sourceInfo, key, actor.classes[book.class]?.name, value, true, "class");
    }
    book.cl.classLevelTotal = classLevelTotal;

    // Add from bonus formula
    const clBonus = RollPF.safeRollSync(formula, rollData).total;
    clTotal += clBonus;
    if (clBonus > 0) {
        setSourceInfoByName(actor.sourceInfo, key, game.i18n.localize("PF1.CasterLevelBonusFormula"), clBonus);
    } else if (clBonus < 0) {
        setSourceInfoByName(actor.sourceInfo, key, game.i18n.localize("PF1.CasterLevelBonusFormula"), clBonus, false);
    }

    // Apply negative levels
    if (rollData.attributes.energyDrain) {
        clTotal = Math.max(0, clTotal - rollData.attributes.energyDrain);
        setSourceInfoByName(
            actor.sourceInfo,
            key,
            game.i18n.localize("PF1.NegativeLevels"),
            -Math.abs(rollData.attributes.energyDrain),
            false
        );
    }

    clTotal += book.cl.total ?? 0;
    clTotal += book.cl.bonus ?? 0;
    book.cl.total = clTotal;
}

function calculateConcentration(actor, rollData, bookId, book) {
    // Bonus formula
    const concFormula = book.concentration.formula;
    const formulaRoll = concFormula.length
        ? RollPF.safeRollSync(concFormula, rollData, undefined, undefined, { minimize: true })
        : { total: 0, isDeterministic: true };
    const rollBonus = formulaRoll.isDeterministic ? formulaRoll.total : 0;

    // Add it all up
    const clTotal = book.cl.total;
    const classAbilityMod = actor.system.abilities[book.ability]?.mod ?? 0;
    const concentration = clTotal + classAbilityMod + rollBonus;
    book.concentration.total ||= 0; // Init

    // Set source info function
    const setSourceInfoByName = pf1.documents.actor.changes.setSourceInfoByName;
    const key = `flags.${MODULE_ID}.spellbooks.${bookId}.concentration.total`;
    setSourceInfoByName(
        actor.sourceInfo,
        key,
        game.i18n.localize("PF1.CasterLevel"),
        clTotal,
        false
    );
    setSourceInfoByName(
        actor.sourceInfo,
        key,
        game.i18n.localize("PF1.SpellcastingAbility"),
        classAbilityMod,
        false
    );
    setSourceInfoByName(
        actor.sourceInfo,
        key,
        game.i18n.localize("PF1.ByBonus"),
        formulaRoll.isDeterministic ? formulaRoll.total : formulaRoll.formula,
        false
    );

    // Apply value
    book.concentration.total += concentration;
}

function calculatePowerPoints(actor, rollData, bookId, book) {
    const formula = book.powerPoints.formula;
    const formulaRoll = formula.length
        ? RollPF.safeRollSync(formula, rollData, undefined, undefined, { minimize: true })
        : { total: 0, isDeterministic: true };
    const formulaBonus = formulaRoll.isDeterministic ? formulaRoll.total : 0;

    if (book.autoLevelPowerPoints) {
        const classAbilityMod = actor.system.abilities[book.ability]?.mod ?? 0;
        const classLevel = book.cl.classLevelTotal ?? 0;
        const levelPoints = POINTS_PER_LEVEL[book.casterType][classLevel] || 0;
        const abilityPoints = Math.max(0, Math.floor(classLevel * classAbilityMod * 0.5));
        book.powerPoints.max = formulaBonus + levelPoints + abilityPoints;
    } else {
        book.powerPoints.max = formulaBonus;
    }
    // Set source info function
    const setSourceInfoByName = pf1.documents.actor.changes.setSourceInfoByName;
}

function deriveTotalPowerPoints(actor) {
    const powerPoints = actor.getFlag(MODULE_ID, "powerPoints") ?? { current: 0, temporary: 0 };
    const manifestors = actor.getFlag(MODULE_ID, "spellbooks") ?? {};
    powerPoints.maximum = Object.values(manifestors)
        .filter((psibook) => psibook.inUse)
        .reduce((sum, psibook) => sum + (psibook.powerPoints?.max ?? 0), 0);
}

function deriveTotalFocus(actor) {
    const focus = actor.getFlag(MODULE_ID, "focus") ?? { current: 0 };
    const maxPowerPoints = actor.getFlag(MODULE_ID, "powerPoints")?.maximum ?? 0;
    const baseFocus = maxPowerPoints > 0 ? 1 : 0;
    focus.maximum = baseFocus;
}

async function rechargePowerPoints(actor) {
    const powerPoints = actor.getFlag(MODULE_ID, "powerPoints");
    await actor.update({
        [`flags.${MODULE_ID}.powerPoints.current`]: powerPoints.maximum,
        [`flags.${MODULE_ID}.powerPoints.temporary`]: 0,
    });
}

async function rechargeFocus(actor) {
    const focus = actor.getFlag(MODULE_ID, "focus");
    await actor.update({
        [`flags.${MODULE_ID}.focus.current`]: focus.maximum,
    });
}
