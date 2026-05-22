# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a FoundryVTT module that adds Dreamscarred Press' Psionics system to the Pathfinder 1e system. It extends the PF1 system with psionic manifesting, power points, psionic focus, augmentable powers, and psionic powers as a distinct item type.

**Module ID**: `pf1-psionics`
**Current Version**: `0.8.1` (in `module.json`)
**Foundry Compatibility**: v13 (minimum and verified)
**PF1 System Compatibility**: v11+ (verified v11.8)
**Required Dependency**: `lib-wrapper`

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
npm run lint              # Check code style (ESLint 9 flat config)
npm run lint:fix          # Auto-fix linting issues

# Testing
npm test                  # Run unit tests (Vitest)
npm run test:watch        # Run tests in watch mode
npm run test:ui           # Open Vitest UI
npm run test:coverage     # Run tests with V8 coverage report

# Compendium management
npm run packs:compile                    # Compile YAML → LevelDB
npm run packs:extract                    # Extract all packs to YAML
npm run packs:extract:powers             # Extract specific pack
npm run packs:extract:feats
npm run packs:extract:classes
npm run packs:extract:races
npm run packs:extract:rules

# Content scraping
npm run scrape:powers                    # Scrape all powers
npm run scrape:powers:single -- "URL"    # Scrape single power
npm run scrape:feats                     # Scrape all feats
npm run scrape:feats:single -- "URL"     # Scrape single feat
npm run scrape:classes                   # Scrape all classes
npm run scrape:classes:single -- "URL"   # Scrape single class
npm run scrape:races                     # Scrape all races
npm run scrape:races:single -- "URL"     # Scrape single race
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
- `rolls.mjs` - Hook into PF1 roll system
- `compendium-directory.mjs` - Customizes compendium directory display
- `enrichers/` - Text enrichment system for inline content:
  - `apply.mjs` - Apply enrichment tags
  - `browse.mjs` - Browse enrichment tags
  - `condition.mjs` - Condition enrichment tags
  - `common.mjs` - Shared enricher utilities

**2. Document Extensions (`scripts/documents/`)**

The module extends PF1 system documents:

- **Actor Extensions** (`actor/actor-pf.mjs`):
  - Adds psionic spellbooks (called "psibooks") via actor flags
  - Calculates power points based on class level and ability score
  - Calculates manifester level and concentration
  - Handles rest mechanics (recharging power points and psionic focus)
  - Hook functions: `pf1PrepareBaseActorData`, `pf1PrepareDerivedActorData`, `pf1ActorRest`
  - Utility: `actor/utils/manifester.mjs` - Manifester calculation helpers

- **Item Extensions** (`item/power-item.mjs`):
  - `PowerItem` class extends `pf1.documents.item.ItemPF`
  - Powers work similar to spells but use power points instead of spell slots
  - Power point cost calculated via formula (default: `max(0, @sl * 2 - 1)`)
  - Tracks power points at actor level, not per-power
  - `item/item.mjs` - General item extensions

- **Action Extensions** (`action/`):
  - `action.mjs` - Integrates psionic powers with PF1 action system
  - `action-use.mjs` - Handles power point deduction on use
  - `attack-dialog.mjs` - Custom attack dialog for augmented powers
  - Uses lib-wrapper to inject custom behavior into existing PF1 functions

**3. Data Models (`scripts/dataModels/`)**

- `PowerModel` extends `foundry.abstract.TypeDataModel`
- Defines schema for power items including:
  - Discipline/subdiscipline (psionic equivalent of spell school)
  - Display components (auditory, material, mental, olfactory, visual)
  - Manifest time, level, descriptors
  - Actions array (inherited from PF1 item structure)
  - Uses, changes, context notes (inherited from PF1 item structure)

- `AugmentModel` - Defines schema for power augmentation options
  - Augments modify power behavior when extra power points are spent
  - Linked to powers and applied during manifesting

**CRITICAL**: Range, duration, target, and saving throw data are stored in **Action objects** within the `actions` array, NOT as direct properties of the PowerModel. This follows PF1 system architecture where SpellModel and other action items store combat/usage mechanics in separate Action objects. Each Action contains:
- `activation` - cost and type (standard, swift, etc.)
- `range` - value and units (close, medium, long, ft, etc.)
- `duration` - value, units, and flags (dismissible, concentration)
- `target` - what the power affects
- `save` - type (fort/ref/will), DC formula, description
- `actionType` - how the power is used (save, attack, other, etc.)

**4. Components (`scripts/components/`)**

- `psionic-action.mjs` - Reusable psionic action component that extends PF1's action system

**5. Application/UI Extensions (`scripts/applications/`)**

- `actor/actor-sheet.mjs` - Injects psionic tab into actor sheet using lib-wrapper
- `item/power-sheet.mjs` - Custom sheet for power items (`PowerSheet` class)
- `item/item-sheet.mjs` - General item sheet extensions
- `item/action-sheet.mjs` - Action sheet customizations for psionic powers
- `item/augment-sheet.mjs` - UI for editing augment options on powers
- `compendium-browser/psionic-browser.mjs` - Custom compendium browser for powers
- `compendium-browser/filters/psionic.mjs` - Filter definitions for psionic browser
- Uses Handlebars templates in `templates/` directory

**6. Configuration Data (`scripts/data/`)**

- `manifesters.mjs` - Default spellbook configurations for psionic manifesters
- `powerpoints.mjs` - Power point progression tables by caster type (low/medium/high)
- `disciplines.mjs` - Discipline and subdiscipline definitions

**7. Public API (`scripts/api/`)**

The module exposes a public API at `game.modules.get("pf1-psionics").api`:
- `power-points-api.mjs` - Static methods for power point operations (spend, add, restore, etc.)
- `psionic-focus-api.mjs` - Static methods for psionic focus operations (expend, gain, etc.)
- Actor-level helpers available at `actor.psionics.powerPoints` and `actor.psionics.focus`
- See `docs/psionics-api-reference.md` for full documentation

**8. Helpers (`scripts/helpers/`)**

- `psionics-helper.mjs` - General psionic utility functions
- `power-points-helper.mjs` - Power point calculation and management
- `psionic-focus-helper.mjs` - Focus state management

**9. Migration System (`scripts/migrations/`)**

- `runner.mjs` - Compares stored schema version to current, runs pending migrations
- `registry.mjs` - Maps version numbers to migration functions
- `helpers.mjs` - Shared migration utilities
- Version-specific files: `v0.3.1.mjs`, `v0.5.0.mjs`, `v0.7.0.mjs`
- Uses `game.settings.get("pf1-psionics", "schemaVersion")` to track state
- See `docs/migration-system.md` for architecture details and how to add new migrations

### Key Concepts

**Psionic Spellbooks ("Psibooks")**
- Stored as actor flags under `flags.pf1-psionics.spellbooks`
- Structure mirrors PF1 spellbooks but adapted for psionics
- Contains: class, caster level, ability score, power point calculations
- Four types: primary, secondary, tertiary, spelllike

**Power Points**
- Stored as actor flags: `flags.pf1-psionics.powerPoints` with `current`, `temporary`, `maximum`
- Calculated from class level, ability modifier, and caster type progression
- Formula: base from table + (classLevel x abilityMod x 0.5)
- Spent when manifesting powers, recharged on rest
- Temporary points are drained before current points

**Psionic Focus**
- Stored as actor flags: `flags.pf1-psionics.focus` with `current`, `maximum`
- Characters with power points have 1 psionic focus
- Recharged on rest

**Augments**
- Powers can be augmented by spending additional power points
- Augment options are defined per-power via `AugmentModel`
- Applied during the manifesting dialog
- Can modify damage, range, duration, save DCs, and other properties

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
3. **Power Use** → Action system deducts power points from actor's pool, applies augments
4. **Rest** → `pf1ActorRest` recharges power points and focus to maximum

## Testing

### Unit Tests (Vitest)

Tests live in `test/` and run outside Foundry using mocked globals (see `test/setup.mjs`):

```bash
npm test                  # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report (70% threshold on lines/functions/branches/statements)
```

**Test structure:**
- `test/setup.mjs` - Mocks Foundry globals (`foundry.utils`, `game.i18n`, etc.)
- `test/unit/` - Unit tests for data models and helpers
- `test/migrations/` - Tests for each migration version, data integrity, and error recovery

### In-Foundry Tests (Quench)

- `test/quench/` - Tests that run inside FoundryVTT via the Quench module
- Excluded from Vitest runs; executed manually in a running Foundry instance
- Useful for testing full integration with live Foundry API

### CI Pipeline

GitHub Actions runs lint and tests on every PR and push to `main`/`release-flow`:
- `.github/workflows/ci.yml` - Runs `npm run lint` and `npm test` on Node 20

## Code Style

Configured in `eslint.config.mjs` (ESLint 9 flat config):
- **Quotes**: Double quotes (`"`)
- **Semicolons**: Always required
- **Unused variables**: Prefix with `_` to suppress errors (e.g., `_unusedParam`)
- **Modules**: ES6 modules with `.mjs` extension
- **Globals**: Foundry VTT and PF1 system globals are pre-declared (see `eslint.config.mjs`)
- **Localization**: All user-facing strings use `game.i18n.localize()` with keys in `lang/en.json` (namespace: `PF1-Psionics.*`)

## Compendium Packs

The module includes seven compendium packs with content from Dreamscarred Press' Psionics Unleashed and Ultimate Psionics:

**Powers Compendium** (`pf1-psionics.powers`)
- Contains 597+ psionic powers organized by discipline
- Source: https://metzo.miraheze.org (OGL-licensed content)
- YAML source: `packs-source/powers/` (subdirectories per discipline)

**Feats Compendium** (`pf1-psionics.feats`)
- Contains 189+ psionic feats
- Includes Psionic and Metapsionic feat types
- YAML source: `packs-source/feats/` (flat structure)

**Classes Compendium** (`pf1-psionics.classes`)
- Contains 11 psionic classes (Psion, Wilder, Psychic Warrior, Aegis, Cryptic, Dread, Highlord, Marksman, Soulknife, Tactician, Vitalist, Voyager)
- Includes class abilities in nested folders
- YAML source: `packs-source/classes/` (subdirectories per class)

**Races Compendium** (`pf1-psionics.races`)
- Contains 10 psionic races (Blue, Dromite, Duergar, Elan, Forgeborn, Half-Giant, Maenad, Noral, Ophiduan, Xeph)
- Includes racial traits and alternate racial features
- YAML source: `packs-source/races/` (subdirectories per race)

**Buffs Compendium** (`pf1-psionics.buffs`)
- Contains psionic buff/condition items
- YAML source: `packs-source/buffs/`

**Macros Compendium** (`pf1-psionics.macros`)
- Contains utility macros for psionic operations
- YAML source: `packs-source/macros/`

**Rules Compendium** (`pf1-psionics.rules`)
- Contains journal entries with psionic rules references
- Type: JournalEntry
- YAML source: `packs-source/rules/`

**YAML-Based Workflow:**
- All source data is stored as human-readable YAML files in `packs-source/`
- YAML files are committed to version control (meaningful git diffs)
- LevelDB files in `packs/` are gitignored and generated via `npm run packs:compile`
- Edit YAML directly or edit in Foundry and extract back to YAML via `npm run packs:extract`
- **Close Foundry** before running extract/compile (LevelDB is single-process)

### Content Creation Tools (`tools/`)

The `tools/` directory contains scrapers and utilities for managing compendium content. For detailed information about the tools:

- **`tools/CLAUDE.md`** - Comprehensive guide for Claude Code when working with tools
- **`tools/README.md`** - User-facing documentation with quick reference
- **`tools/docs/IMPORT-GUIDE.md`** - Step-by-step workflow for scraping and importing
- **`tools/docs/AVAILABLE-ICONS.md`** - Foundry icon reference
- **`tools/docs/PF1-Duration-Units-Reference.md`** - Valid duration units in PF1 system

**Quick Workflow:**
1. Scrape to YAML: `cd tools/scrapers && node powers-scraper.mjs --list ../data/power-urls.txt`
2. Review YAML: `git diff packs-source/`
3. Commit source: `git add packs-source/ && git commit -m "Import powers"`
4. Compile to LevelDB: `npm run packs:compile`
5. Refresh Foundry (F5)

## File Organization

```
pf1-psionics/
├── scripts/                    # Module source code
│   ├── psionics.mjs               # Main entry point (hook registration)
│   ├── _module.mjs                # Re-exports all modules
│   ├── api/                       # Public API (power points, focus)
│   ├── applications/              # UI extensions
│   │   ├── actor/                    # Actor sheet injection
│   │   ├── item/                     # Power/augment/action sheets
│   │   └── compendium-browser/       # Custom psionic compendium browser
│   ├── components/                # Reusable components (psionic-action)
│   ├── data/                      # Configuration (manifesters, disciplines, power points)
│   ├── dataModels/                # PowerModel, AugmentModel schemas
│   ├── documents/                 # Actor/Item/Action extensions
│   │   ├── action/                   # Action system integration
│   │   ├── actor/                    # Actor extensions + utils
│   │   └── item/                     # Power item class
│   ├── helpers/                   # Utility functions
│   ├── hooks/                     # Foundry hook handlers
│   │   └── enrichers/                # Text enrichment system
│   └── migrations/                # Version migration system
├── templates/                  # Handlebars templates
│   ├── action/                    # Attack dialog, augment selector
│   ├── actor/                     # Manifester tab templates
│   ├── app/                       # Augment editor
│   ├── apps/                      # Psionic action augments
│   └── item/                      # Power sheet + partials
├── styles/                     # CSS stylesheets
├── test/                       # Test suites
│   ├── setup.mjs                  # Foundry global mocks
│   ├── unit/                      # Unit tests
│   ├── migrations/                # Migration tests
│   └── quench/                    # In-Foundry integration tests
├── lang/                       # Localization files (en.json)
├── packs-source/               # YAML source (commit to git)
│   ├── powers/                    # ~600 power YAMLs (by discipline subdirs)
│   ├── feats/                     # ~190 feat YAMLs (flat)
│   ├── classes/                   # Class YAMLs (by class subdirs)
│   ├── races/                     # Race YAMLs (by race subdirs)
│   ├── buffs/                     # Buff/condition YAMLs
│   ├── macros/                    # Macro YAMLs
│   └── rules/                     # Rules journal YAMLs
├── packs/                      # Compiled LevelDB (gitignored)
├── tools/                      # Content creation tools
│   ├── scrapers/                  # Web scrapers (powers, feats, classes, races)
│   ├── packs.mjs                  # Extract/compile tool
│   ├── data/                      # URL lists (power-urls.txt, feat-urls.txt)
│   ├── docs/                      # Tools documentation
│   ├── macros/                    # Utility macros
│   ├── CLAUDE.md                  # Claude Code guide for tools
│   └── README.md                  # User-facing tools docs
├── docs/                       # Project documentation
│   ├── psionics-api-reference.md     # Public API reference
│   ├── migration-system.md           # Migration architecture guide
│   ├── module-api-pattern.md         # Module extension patterns
│   ├── module-extend-buff-target.md  # Buff target extension guide
│   ├── apply-changes-walkthrough.md  # Changes system walkthrough
│   ├── Psionics-Magic-Transparency.md # Psionics/magic transparency rules
│   ├── active-energy-type-implementation-plan.md  # Energy type plan
│   └── compendium-upload-troubleshooting.md       # Upload debugging
├── .github/                    # GitHub configuration
│   ├── workflows/                 # CI, release, compendium-upload
│   ├── scripts/                   # Release helper scripts
│   └── ISSUE_TEMPLATE/            # Issue templates
├── types/                      # Type declarations
│   └── pf1-globals.d.ts           # PF1 system + module type stubs
├── .claude/                    # Claude Code configuration
│   ├── mcp.json                   # MCP server for PF1 system source
│   └── commands/                  # Custom slash commands
├── module.json                 # Module manifest
├── package.json                # npm scripts and dependencies
├── jsconfig.json               # JSDoc type checking config (checkJs: true)
├── eslint.config.mjs           # ESLint 9 flat config
├── vitest.config.js            # Vitest test configuration
├── CONTRIBUTING.md             # Contribution guidelines
└── CLAUDE.md                   # This file
```

## Documentation Reference

**Project Documentation:**
- `CLAUDE.md` - This file: project overview, architecture, development guide
- `README.md` - User-facing module documentation
- `CONTRIBUTING.md` - Contribution guidelines and PR process

**Architecture Documentation (`docs/`):**
- `docs/psionics-api-reference.md` - Full API reference with macro examples
- `docs/migration-system.md` - Migration system architecture and how to add migrations
- `docs/module-api-pattern.md` - Patterns for extending PF1 via module API
- `docs/module-extend-buff-target.md` - How buff targets are extended
- `docs/apply-changes-walkthrough.md` - PF1 changes/buff system walkthrough
- `docs/Psionics-Magic-Transparency.md` - Psionics-magic transparency implementation
- `docs/active-energy-type-implementation-plan.md` - Active energy type feature plan
- `docs/compendium-upload-troubleshooting.md` - Compendium upload debugging

**Tools Documentation:**
- `tools/CLAUDE.md` - Guide for Claude Code when working with tools directory
- `tools/README.md` - Comprehensive guide to scraping and compendium tools
- `tools/docs/IMPORT-GUIDE.md` - Step-by-step workflow for importing content
- `tools/docs/AVAILABLE-ICONS.md` - Reference of all Foundry VTT icons for scrapers
- `tools/docs/PF1-Duration-Units-Reference.md` - Valid duration units in PF1 system

**Type Definitions:**
- `jsconfig.json` - Enables JSDoc type checking on `.mjs` files with `checkJs: true`
- `types/pf1-globals.d.ts` - PF1 system and module-specific type declarations (`pf1`, `libWrapper`, `RollPF`)
- `fvtt-types` (dev dependency) - Foundry VTT v13 API type definitions from League of Foundry Developers

**Claude Code Integration (`.claude/`):**
- `.claude/mcp.json` - MCP server providing filesystem access to the PF1 system source at `/home/cobrien/Code/foundryvtt-pathfinder1/`
- `.claude/commands/scrape-power.md` - `/scrape-power <url>` - Scrape and import a single power
- `.claude/commands/add-migration.md` - `/add-migration <version>` - Scaffold a new migration with test
- `.claude/commands/validate-packs.md` - `/validate-packs` - Compile and spot-check pack YAML files
- `.claude/commands/review-power-yaml.md` - `/review-power-yaml <name>` - Verify a power YAML for correctness
- `.claude/commands/check-pf1-source.md` - `/check-pf1-source <question>` - Look up PF1 system architecture via MCP

**Live Foundry Testing (Playwright MCP):**
- A FoundryVTT instance is running at `http://localhost:30000` with this module loaded.
- Use the Playwright MCP tools (`mcp__playwright__browser_*`) to navigate the Foundry UI for live testing — opening actor/item sheets, exercising the manifesting dialog, verifying augment UI, checking the compendium browser, etc.
- Prefer `browser_snapshot` (accessibility tree) over screenshots for inspecting UI state and finding element references for clicks/typing.
- Reload the page (or restart Foundry) after editing module code or recompiling packs so changes take effect.
- **Changes are not complete until verified in Foundry.** Lint and unit tests confirm code correctness, not feature correctness. Before reporting a task done, exercise the affected UI/behavior in the live Foundry instance via Playwright MCP. If live testing isn't possible for a given change, say so explicitly rather than claiming success.

**External References:**
- PF1 System Source: https://gitlab.com/foundryvtt_pathfinder1e/foundryvtt-pathfinder1
- PF1 System Local Checkout: `/home/cobrien/Code/foundryvtt-pathfinder1/` (accessible via MCP server)
- Content Source: https://metzo.miraheze.org (OGL-licensed psionic content)
- FoundryVTT Documentation: https://foundryvtt.com/api/

## Common Gotchas

- **LevelDB locking**: Close Foundry before running `packs:extract` or `packs:compile`. LevelDB only allows single-process access.
- **Action vs. Item properties**: Never put range/duration/target/save on the PowerModel directly. They belong in Action objects within the `actions` array.
- **lib-wrapper ordering**: Wrapper registration order matters. The module uses `WRAPPER` type (not `OVERRIDE`) to chain with other modules.
- **Flag deletion syntax**: Use `"flags.pf1-psionics.-=flagName": null` to delete a flag in an `update()` call.
- **PF1 config timing**: Register config values in `init` hook, not `setup` or `ready`. The PF1 system reads config during init.
- **Module item type namespace**: The power item type is `pf1-psionics.power` (namespaced), not just `power`.
- **YAML filenames**: Pack YAML files include the Foundry document ID in the filename (e.g., `crystal-shard.5g5ozwSXLRDNZUFi.yaml`). Do not change these IDs.
- **Version mismatch**: `module.json` version (0.8.1) is the authoritative module version. `package.json` version (1.0.0) is for npm only.
- **Formula evaluation**: Always use `RollPF.safeRollSync()` for evaluating formulas with roll data, never `eval()`.

## Important Notes

- The module extends Foundry's `CONFIG.Item.documentClasses` and `CONFIG.Item.dataModels` to register the power item type
- Item type is namespaced: `pf1-psionics.power`
- All calculations use PF1's `RollPF.safeRollSync()` for formula evaluation with roll data
- Source info tracking uses PF1's `pf1.documents.actor.changes.setSourceInfoByName` for UI transparency
- **When modifying PowerModel**: Always check the PF1 system source to understand architecture patterns, especially how SpellModel and ActionItemModel structure their data
- **Localization**: All user-facing strings use `game.i18n.localize()` with keys in `lang/en.json` (namespace: `PF1-Psionics.*`)
- **YAML Workflow**: The module uses a YAML-based content workflow (not JSON) - see `tools/README.md` for details
- **Compendium Editing**: LevelDB files in `packs/` are gitignored; edit YAML in `packs-source/` instead
