# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a FoundryVTT module that adds Dreamscarred Press' Psionics system to the Pathfinder 1e system. It extends the PF1 system with psionic manifesting, power points, psionic focus, and psionic powers as a distinct item type.

**Module ID**: `pf1-psionics`

## Prerequisites

**IMPORTANT**: Before working on this module, establish a solid understanding of:

1. **FoundryVTT Architecture** - Document models, data schemas, hooks, applications, and the overall VTT framework
2. **PF1 System Source Code** - Available at https://gitlab.com/foundryvtt_pathfinder1e/foundryvtt-pathfinder1
   - Study `module/models/item/spell-model.mjs` and `module/models/item/action-item-model.mjs`
   - Understand how SpellModel structures data (discipline, components, etc.)
   - **CRITICAL**: Understand that range, duration, target, and saving throws are stored in Action objects within the `actions` array, NOT as direct properties of item models
   - Review `module/components/action.mjs` to see the Action schema structure

Without this foundational knowledge, you risk making architectural mistakes that don't align with PF1 system patterns. When in doubt, always reference the PF1 system source code before making changes to data models.

## Development Commands

This module is designed to run within FoundryVTT and has no build, test, or lint commands. Development is done by:
1. Editing files in place within the FoundryVTT modules directory
2. Refreshing FoundryVTT (F5) to reload the module
3. Checking the browser console (F12) for errors

The module loads via `scripts/psionics.mjs` as defined in `module.json`.

## Architecture

### Module Structure

The module follows a hierarchical organization pattern:
- Each directory contains a `_module.mjs` that exports all items from that directory
- The main entry point (`scripts/psionics.mjs`) registers Foundry hooks
- Uses ES6 modules (`.mjs` extension)

### Core Systems

**1. Hook System (`scripts/hooks/`)**
- `init.mjs` - Registers configuration (skills, disciplines, item types) and document classes
- `setup.mjs` - Runs before init
- `i18n.mjs` - Handles localization after i18n system loads
- `ready.mjs` - Post-initialization setup (migrations, welcome dialog, etc.)

**2. Document Extensions (`scripts/documents/`)**

The module extends PF1 system documents:

- **Actor Extensions** (`actor/actor-pf.mjs`):
  - Adds psionic spellbooks (called "psibooks") via actor flags
  - Calculates power points based on class level and ability score
  - Calculates manifester level and concentration
  - Handles rest mechanics (recharging power points and psionic focus)
  - Hook functions: `pf1PrepareBaseActorData`, `pf1PrepareDerivedActorData`, `pf1ActorRest`

- **Item Extensions** (`item/power-item.mjs`):
  - `PowerItem` class extends `pf1.documents.item.ItemPF`
  - Powers work similar to spells but use power points instead of spell slots
  - Power point cost calculated via formula (default: `max(0, @sl * 2 - 1)`)
  - Tracks power points at actor level, not per-power

- **Action Extensions** (`action/`):
  - Integrates psionic powers with PF1 action system
  - Handles manifesting dialogs similar to spell casting
  - Uses lib-wrapper to inject custom behavior into existing PF1 functions

**3. Data Models (`scripts/dataModels/`)**

- `PowerModel` extends `foundry.abstract.TypeDataModel`
- Defines schema for power items including:
  - Discipline/subdiscipline (psionic equivalent of spell school)
  - Display components (auditory, material, mental, olfactory, visual)
  - Manifest time, level, descriptors
  - Actions array (inherited from PF1 item structure)
  - Uses, changes, context notes (inherited from PF1 item structure)

**CRITICAL**: Range, duration, target, and saving throw data are stored in **Action objects** within the `actions` array, NOT as direct properties of the PowerModel. This follows PF1 system architecture where SpellModel and other action items store combat/usage mechanics in separate Action objects. Each Action contains:
- `activation` - cost and type (standard, swift, etc.)
- `range` - value and units (close, medium, long, ft, etc.)
- `duration` - value, units, and flags (dismissible, concentration)
- `target` - what the power affects
- `save` - type (fort/ref/will), DC formula, description
- `actionType` - how the power is used (save, attack, other, etc.)

**4. Application/UI Extensions (`scripts/applications/`)**

- `actor/actor-sheet.mjs` - Injects psionic tab into actor sheet using lib-wrapper
- `item/power-sheet.mjs` - Custom sheet for power items (`PowerSheet` class)
- Uses Handlebars templates in `templates/` directory

**5. Configuration Data (`scripts/data/`)**

- `psibooks.mjs` - Default spellbook configurations for psionic manifesters
- `powerpoints.mjs` - Power point progression tables by caster type (low/medium/high)

### Key Concepts

**Psionic Spellbooks ("Psibooks")**
- Stored as actor flags under `flags.pf1-psionics.spellbooks`
- Structure mirrors PF1 spellbooks but adapted for psionics
- Contains: class, caster level, ability score, power point calculations
- Four types: primary, secondary, tertiary, spelllike

**Power Points**
- Stored as actor flags: `flags.pf1-psionics.powerPoints` with `current`, `temporary`, `maximum`
- Calculated from class level, ability modifier, and caster type progression
- Formula: base from table + (classLevel × abilityMod × 0.5)
- Spent when manifesting powers, recharged on rest

**Psionic Focus**
- Stored as actor flags: `flags.pf1-psionics.focus` with `current`, `maximum`
- Characters with power points have 1 psionic focus
- Recharged on rest

**Skills**
- Adds `kps` (Knowledge Psionics) - Int-based, trained only
- Adds `ahp` (Autohypnosis) - Wis-based, trained only
- Registered in `pf1.config.skills` during init

**Disciplines**
- Psionic equivalent of spell schools
- Seven disciplines: Athanatism, Clairsentience, Metacreativity, Psychokinesis, Psychometabolism, Psychoportation, Telepathy
- Subdisciplines map to existing PF1 subschools where applicable
- All disciplines are namespaced under `pf1.config.psionics.disciplines`
- Subdiscipline mappings under `pf1.config.psionics.subdisciplines` and `pf1.config.psionics.subdisciplineMap`

**Feat Types**
- Adds psionic feat type: `pf1.config.featTypes.psionic`
- Adds metapsionic feat type: `pf1.config.featTypes.metapsionic`
- Both registered with singular and plural forms in `pf1.config.featTypesPlurals`

**Creature Traits**
- Adds psionic trait type: `pf1.config.traitTypes.psionic`
- Adds psionic creature subtype: `pf1.config.creatureSubtypes.psionic`

### Integration with PF1 System

The module heavily uses lib-wrapper (required dependency) to inject behavior into PF1 system functions without overwriting them. Key injection points:

- `injectActorSheetPF()` - Adds psionics tab to character sheet
- `injectItemAction()` - Modifies action behavior for powers
- `injectActionUse()` - Handles power point deduction on use

### Data Flow

1. **Actor Creation** → `onPreCreateActor` adds default skills and psibooks to actor
2. **Data Preparation** → `pf1PrepareBaseActorData` and `pf1PrepareDerivedActorData` calculate manifester stats
3. **Power Use** → Action system deducts power points from actor's pool
4. **Rest** → `pf1ActorRest` recharges power points and focus to maximum

## Compendium Packs

The module includes a compendium pack for psionic powers:

**Powers Compendium** (`pf1-psionics.powers`)
- Contains 535 psionic powers from Dreamscarred Press' Psionics Unleashed
- Source data scraped from https://metzo.miraheze.org (OGL-licensed content)
- Located in `packs/powers/` directory
- Can be unlocked for editing by setting `"flags": { "locked": false }` in module.json

### Content Creation Tools (`tools/`)

**scraper.mjs** - Node.js web scraper for metzo.miraheze.org
- Fetches power data from MediaWiki pages using curl
- Parses PortableInfobox HTML format (handles both `<div>` and `<td>` variants)
- Converts to PF1-compatible JSON structure with Action objects
- Usage: `node scraper.mjs <url> [output.json]` or `node scraper.mjs --list urls.txt output.json`
- Extracts: discipline, subdiscipline, level, display components, manifesting time, power resistance, range, duration, target, save, description, augment text

**import-powers-macro.js** - Foundry VTT macro for importing scraped JSON
- Reads JSON file created by scraper
- Imports power items into compendium pack
- Configurable: file path, target compendium, overwrite behavior
- Run as a macro inside Foundry after scraping is complete

**power-urls.txt** - List of 535 power URLs from metzo.miraheze.org
- Generated from https://metzo.miraheze.org/wiki/Power/List
- Used with `scraper.mjs --list` to batch scrape all powers

**IMPORT-GUIDE.md** - Complete documentation for the scraping and import workflow

### Scraper Architecture

The scraper creates PF1-compatible power data by:
1. Fetching HTML via curl (more reliable than Node http/https for redirects)
2. Extracting title from infobox header or page title
3. Parsing discipline and subdiscipline from infobox fields
4. Extracting display components (auditory, material, mental, olfactory, visual)
5. Parsing manifesting time and mapping to PF1 action types (standard, swift, immediate, full, etc.)
6. **Creating Action objects** with:
   - Range (parsed and mapped to PF1 units: personal, touch, close, med, long, unlimited, ft)
   - Duration (parsed and mapped to PF1 units: inst, conc, rounds, minutes, hours, days, perm, spec)
   - Target/Effect/Area (prioritizes target, falls back to effect or area)
   - Saving throw (type, DC formula, harmless flag, description)
   - Action type determination (save, attack, other)
7. Setting power point cost formula: `max(0, @sl * 2 - 1)` (1 PP at level 1, 3 at level 2, etc.)
8. Extracting description and augment text from page content

## Localization

All user-facing strings use `game.i18n.localize()` with keys defined in `lang/en.json`. Namespace is `PF1-Psionics.*`.

## Important Notes

- The module extends Foundry's `CONFIG.Item.documentClasses` and `CONFIG.Item.dataModels` to register the power item type
- Item type is namespaced: `pf1-psionics.power`
- All calculations use PF1's `RollPF.safeRollSync()` for formula evaluation with roll data
- Source info tracking uses PF1's `pf1.documents.actor.changes.setSourceInfoByName` for UI transparency
- **When modifying PowerModel**: Always check the PF1 system source (https://gitlab.com/foundryvtt_pathfinder1e/foundryvtt-pathfinder1) to understand architecture patterns, especially how SpellModel and ActionItemModel structure their data