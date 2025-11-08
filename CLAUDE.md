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

The module loads via `scripts/psionics.mjs` as defined in `module.json`. Development workflow:

1. Edit files in place within the FoundryVTT modules directory
2. Refresh FoundryVTT (F5) to reload the module
3. Check the browser console (F12) for errors

**Available npm scripts:**

```bash
# Linting
npm run lint              # Check code style
npm run lint:fix          # Auto-fix linting issues

# Compendium management
npm run packs:compile                    # Compile YAML → LevelDB
npm run packs:extract                    # Extract all packs to YAML
npm run packs:extract:powers             # Extract specific pack
npm run packs:extract:feats
npm run packs:extract:classes
npm run packs:extract:class-abilities

# Content scraping
npm run scrape:powers                    # Scrape all powers
npm run scrape:powers:single -- "URL"    # Scrape single power
npm run scrape:feats                     # Scrape all feats
npm run scrape:feats:single -- "URL"     # Scrape single feat
npm run scrape:classes                   # Scrape all classes
npm run scrape:classes:single -- "URL"   # Scrape single class
```

See `tools/README.md` for detailed information on content creation tools.

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

The module includes four compendium packs with content from Dreamscarred Press' Psionics Unleashed and Ultimate Psionics:

**Powers Compendium** (`pf1-psionics.powers`)
- Contains 597 psionic powers
- Source: https://metzo.miraheze.org (OGL-licensed content)
- YAML source: `packs-source/powers/` (597 files, organized by discipline)
- Compiled LevelDB: `packs/powers/` (gitignored)

**Feats Compendium** (`pf1-psionics.feats`)
- Contains 189 psionic feats
- Includes Psionic and Metapsionic feat types
- YAML source: `packs-source/feats/` (189 files)
- Compiled LevelDB: `packs/feats/` (gitignored)

**Classes Compendium** (`pf1-psionics.classes`)
- Contains psionic classes (Psion, Wilder, Psychic Warrior, etc.)
- YAML source: `packs-source/classes/` (flat structure)
- Compiled LevelDB: `packs/classes/` (gitignored)

**Class Abilities Compendium** (`pf1-psionics.class-abilities`)
- Contains class features and abilities
- YAML source: `packs-source/class-abilities/` (organized by class folders)
- Compiled LevelDB: `packs/class-abilities/` (gitignored)

**YAML-Based Workflow:**
- All source data is stored as human-readable YAML files in `packs-source/`
- YAML files are committed to version control (meaningful git diffs)
- LevelDB files in `packs/` are gitignored and generated via `npm run packs:compile`
- Edit YAML directly or edit in Foundry and extract back to YAML via `npm run packs:extract`

See `tools/README.md` and `tools/docs/IMPORT-GUIDE.md` for complete workflow documentation.

### Content Creation Tools (`tools/`)

The `tools/` directory contains a comprehensive suite for scraping, importing, and managing psionic content:

```
tools/
├── scrapers/              # Web scrapers (output YAML)
│   ├── powers-scraper.mjs    # Scrape psionic powers
│   ├── feats-scraper.mjs     # Scrape psionic feats
│   ├── classes-scraper.mjs   # Scrape classes and abilities
│   └── common.mjs            # Shared utilities
├── packs.mjs              # Extract/compile tool for YAML ↔ LevelDB
├── data/                  # URL lists and reference data
│   ├── power-urls.txt        # 535+ power URLs
│   └── feat-urls.txt         # Psionic feat URLs
├── docs/                  # Documentation
│   ├── IMPORT-GUIDE.md       # Complete workflow guide
│   ├── AVAILABLE-ICONS.md    # Foundry icon reference
│   └── PF1-Duration-Units-Reference.md
└── README.md              # Tools documentation
```

**Key Tools:**

1. **`scrapers/common.mjs`** - Shared scraping utilities
   - `fetchHTML(url)` - HTTP fetching with curl
   - `extractInfoboxData(html, fieldName)` - MediaWiki infobox parsing
   - `writeYAMLPack(packName, items, rootDir)` - YAML output
   - HTML processing, entity decoding, slugification

2. **`scrapers/powers-scraper.mjs`** - Psionic powers scraper
   - Scrapes from metzo.miraheze.org (OGL-licensed)
   - Outputs YAML directly to `packs-source/powers/`
   - Usage: `node powers-scraper.mjs [URL]` or `node powers-scraper.mjs --list ../data/power-urls.txt`
   - Extracts: discipline, subdiscipline, level, display components, manifesting time, range, duration, target, saves, power resistance, description, augment text
   - Creates PF1-compatible Action objects with proper unit mappings
   - Sets power point cost formula: `max(0, @sl * 2 - 1)`

3. **`scrapers/feats-scraper.mjs`** - Psionic feats scraper
   - Filters by Dreamscarred Press source books
   - Outputs YAML to `packs-source/feats/`
   - Usage: `node feats-scraper.mjs [URL]` or `node feats-scraper.mjs --list ../data/feat-urls.txt`
   - Extracts: prerequisites, benefits, special text, feat types
   - Auto-classifies feat types (Psionic, Metapsionic, Combat, etc.)

4. **`scrapers/classes-scraper.mjs`** - Classes and abilities scraper
   - Unified scraper for both classes and class features
   - Outputs to `packs-source/classes/` and `packs-source/class-abilities/`
   - Usage: `node classes-scraper.mjs [URL]` or `node classes-scraper.mjs` (scrapes all)
   - Filters for Ultimate Psionics and Psionics Augmented sources
   - Links abilities to classes via `classAssociations` UUIDs
   - Handles progressive abilities (single item with multiple levels)

5. **`packs.mjs`** - Compendium management tool (adapted from PF1 system)
   - **Extract**: LevelDB → YAML (`npm run packs:extract`)
   - **Compile**: YAML → LevelDB (`npm run packs:compile`)
   - Features: data sanitization, schema validation, ID preservation, sorted keys for diffs
   - Supports folder structure for class abilities

**Workflow:**
1. Scrape to YAML: `cd tools/scrapers && node powers-scraper.mjs --list ../data/power-urls.txt`
2. Review YAML: `git diff packs-source/`
3. Commit source: `git add packs-source/ && git commit -m "Import powers"`
4. Compile to LevelDB: `npm run packs:compile`
5. Refresh Foundry (F5)

**Documentation:**
- `tools/README.md` - Comprehensive tools guide with examples
- `tools/docs/IMPORT-GUIDE.md` - Step-by-step scraping and import workflow
- `tools/docs/AVAILABLE-ICONS.md` - Reference for Foundry VTT icons (prevents broken images)
- `tools/docs/PF1-Duration-Units-Reference.md` - Valid duration units in PF1 system

### Scraper Architecture

All scrapers share a common architecture via `common.mjs`:

1. **HTML Fetching** - Uses curl for reliable redirect handling
2. **Infobox Parsing** - Extracts structured data from MediaWiki PortableInfobox format
3. **PF1 Mapping** - Converts wiki data to PF1 system schema
4. **Action Object Creation** - Powers and abilities include Action objects with:
   - `activation` - Parsed manifesting time → PF1 action types (standard, swift, immediate, full)
   - `range` - Units: personal, touch, close, med, long, unlimited, ft
   - `duration` - Units: inst, conc, round, minute, hour, day, perm, spec
   - `target` - What the power affects (prioritizes target, falls back to effect/area)
   - `save` - Type (Fort/Ref/Will), DC formula, description, harmless flag
   - `actionType` - Determines behavior (save, attack, other)
5. **YAML Output** - Direct to `packs-source/` with format: `{slug}.{id}.yaml`
6. **Rate Limiting** - 1-second delay between requests
7. **Source Attribution** - Tracks source book and page numbers

## File Organization

```
pf1-psionics/
├── scripts/                    # Module source code
│   ├── psionics.mjs               # Main entry point
│   ├── hooks/                     # Foundry hook handlers
│   ├── documents/                 # Actor/Item extensions
│   ├── dataModels/                # PowerModel and schemas
│   ├── applications/              # UI extensions (sheets)
│   └── data/                      # Configuration data
├── templates/                  # Handlebars templates
├── lang/                       # Localization files (en.json)
├── packs-source/               # YAML source (commit to git)
│   ├── powers/                    # 597 power YAML files (by discipline)
│   ├── feats/                     # 189 feat YAML files
│   ├── classes/                   # Class YAML files (flat)
│   └── class-abilities/           # Ability YAML files (by class folders)
├── packs/                      # Compiled LevelDB (gitignored)
│   ├── powers/
│   ├── feats/
│   ├── classes/
│   └── class-abilities/
├── tools/                      # Content creation tools
│   ├── scrapers/                  # Web scrapers
│   ├── packs.mjs                  # Extract/compile tool
│   ├── data/                      # URL lists
│   ├── docs/                      # Tools documentation
│   └── README.md
├── docs/                       # Project documentation
│   └── plans/                     # Implementation plans
├── module.json                 # Module manifest
├── package.json                # npm scripts and dependencies
└── CLAUDE.md                   # This file
```

## Documentation Reference

**Project Documentation:**
- `CLAUDE.md` - This file: project overview, architecture, development guide
- `README.md` - User-facing module documentation

**Tools Documentation:**
- `tools/README.md` - Comprehensive guide to scraping and compendium tools
- `tools/docs/IMPORT-GUIDE.md` - Step-by-step workflow for importing content
- `tools/docs/AVAILABLE-ICONS.md` - Reference of all Foundry VTT icons for scrapers
- `tools/docs/PF1-Duration-Units-Reference.md` - Valid duration units in PF1 system

**External References:**
- PF1 System Source: https://gitlab.com/foundryvtt_pathfinder1e/foundryvtt-pathfinder1
- Content Source: https://metzo.miraheze.org (OGL-licensed psionic content)
- FoundryVTT Documentation: https://foundryvtt.com/api/

## Important Notes

- The module extends Foundry's `CONFIG.Item.documentClasses` and `CONFIG.Item.dataModels` to register the power item type
- Item type is namespaced: `pf1-psionics.power`
- All calculations use PF1's `RollPF.safeRollSync()` for formula evaluation with roll data
- Source info tracking uses PF1's `pf1.documents.actor.changes.setSourceInfoByName` for UI transparency
- **When modifying PowerModel**: Always check the PF1 system source to understand architecture patterns, especially how SpellModel and ActionItemModel structure their data
- **Localization**: All user-facing strings use `game.i18n.localize()` with keys in `lang/en.json` (namespace: `PF1-Psionics.*`)
- **YAML Workflow**: The module uses a YAML-based content workflow (not JSON) - see `tools/README.md` for details
- **Compendium Editing**: LevelDB files in `packs/` are gitignored; edit YAML in `packs-source/` instead