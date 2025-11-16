# Tools Directory - CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the tools in this directory.

## Overview

The `tools/` directory contains a comprehensive suite for scraping, importing, and managing psionic content from metzo.miraheze.org using a YAML-based workflow.

## Prerequisites

**IMPORTANT**: Before working with these tools, understand:

1. **PF1 System Architecture** - How the Pathfinder 1e system structures data
   - Action objects within items (range, duration, target, saves)
   - Item data models and schemas
   - See PF1 system source: https://gitlab.com/foundryvtt_pathfinder1e/foundryvtt-pathfinder1

2. **YAML-Based Workflow** - This module uses YAML files as the source of truth
   - YAML files in `packs-source/` are committed to git
   - LevelDB files in `packs/` are gitignored and generated from YAML
   - Edit YAML directly or edit in Foundry and extract back to YAML

3. **Compendium Structure** - How FoundryVTT organizes content
   - Compendium packs are LevelDB databases
   - Each item has a unique ID and document type
   - Folder structure for organizing class abilities

## Directory Structure

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
└── README.md              # User-facing documentation
```

## Key Tools

### 1. `scrapers/common.mjs` - Shared Scraping Utilities

**Core Functions:**
- `fetchHTML(url)` - HTTP fetching with curl (handles redirects reliably)
- `extractInfoboxData(html, fieldName)` - MediaWiki PortableInfobox parsing
- `writeYAMLPack(packName, items, rootDir)` - YAML output to `packs-source/`
- `sluggify(name)` - Convert names to filename-safe slugs
- `delay(ms)` - Rate limiting for web requests (1 second default)

**HTML Processing:**
- `extractTitle(html)` - Extract title from infobox or page heading
- `extractDescription(html)` - Extract and clean description HTML
- `extractCategoryLinks(html)` - Extract links from category pages
- `decodeHTMLEntities(text)` - Decode HTML entities

**Design Patterns:**
- Uses curl for HTTP fetching (more reliable redirect handling than node-fetch)
- Parses MediaWiki's PortableInfobox format for structured data
- Outputs YAML directly to `packs-source/` with format: `{slug}.{id}.yaml`
- Preserves IDs across scraping runs (checks existing files)
- Rate limits requests (1-second delay between fetches)

### 2. `scrapers/powers-scraper.mjs` - Psionic Powers Scraper

**Usage:**
```bash
cd tools/scrapers

# Scrape from URL list (recommended)
node powers-scraper.mjs --list ../data/power-urls.txt

# Scrape single power
node powers-scraper.mjs "https://metzo.miraheze.org/wiki/Mind_Thrust"

# Scrape all from category (slow, 10+ minutes)
node powers-scraper.mjs
```

**What It Extracts:**
- Discipline and subdiscipline
- Manifester levels by class (Psion 1, Wilder 1, etc.)
- Display components (auditory, material, mental, olfactory, visual)
- Manifesting time → PF1 activation type (standard, swift, immediate, full)
- Range → PF1 range units (personal, touch, close, med, long, unlimited, ft)
- Duration → PF1 duration units (inst, conc, round, minute, hour, day, perm, spec)
- Target/Effect/Area → Action target field
- Saving throws → Action save object (type, DC formula, description)
- Power resistance → Boolean flag
- Description with formatting preserved
- Augment text (additional effects when spending more power points)
- Source attribution (book and page number)

**PF1 Integration:**
- Creates Action objects with proper schema structure
- Sets power point cost formula: `max(0, @sl * 2 - 1)` (1 PP at level 1, 3 PP at level 2, etc.)
- Populates `learnedAt.class` array with manifester levels
- Maps wiki infobox fields to PF1 item schema
- Handles multiple action types (attack, save, utility)

**Output Location:** `../../packs-source/powers/` (relative to scrapers directory)

### 3. `scrapers/feats-scraper.mjs` - Psionic Feats Scraper

**Usage:**
```bash
cd tools/scrapers

# Scrape from URL list (recommended)
node feats-scraper.mjs --list ../data/feat-urls.txt

# Scrape single feat
node feats-scraper.mjs "https://metzo.miraheze.org/wiki/Psionic_Meditation"

# Scrape all psionic feats
node feats-scraper.mjs
```

**What It Extracts:**
- Prerequisites (text and structured tags)
- Benefits text
- Special notes
- Feat types (Psionic, Metapsionic, Combat, General, etc.)
- Source attribution (book and page number)

**Filtering:**
- Only scrapes feats from Dreamscarred Press source books:
  - Psionics Unleashed
  - Ultimate Psionics
  - Psionics Augmented series
  - Path of War series
- Skips feats from Paizo or other publishers

**Type Classification:**
- Auto-detects feat types from wiki categories
- Maps to PF1 feat type system
- Handles multiple types (e.g., Psionic + Combat)

**Output Location:** `../../packs-source/feats/`

### 4. `scrapers/classes-scraper.mjs` - Classes and Abilities Scraper

**Usage:**
```bash
cd tools/scrapers

# Scrape all classes from Psionic (system) page
node classes-scraper.mjs

# Scrape single class
node classes-scraper.mjs "https://metzo.miraheze.org/wiki/Psion"

# Run tests
node classes-scraper.mjs --test
```

**What It Extracts:**

**For Classes:**
- HD (hit die)
- BAB (base attack bonus progression)
- Saves (good/poor progression)
- Skills per level
- Class features list with levels
- Powers per day / known tables
- Class description
- Source attribution

**For Class Abilities:**
- Ability name and description
- Level acquired
- Type (Ex, Su, Sp)
- Links to parent class via `classAssociations`
- Progressive abilities (single item with multiple levels)

**Special Features:**
- Unified scraper outputs both classes and abilities
- Automatic UUID linking between classes and abilities
- Filters for Ultimate Psionics and Psionics Augmented sources
- Handles collective abilities with proper class associations
- Organizes abilities into folders by class

**Output Locations:**
- Classes: `../../packs-source/classes/` (flat structure)
- Abilities: `../../packs-source/class-abilities/` (organized in folders)

### 5. `packs.mjs` - Compendium Management Tool

Adapted from the official PF1 system tools.

**Extract** - LevelDB → YAML:
```bash
npm run packs:extract                     # All packs
npm run packs:extract:powers              # Specific pack
npm run packs:extract:feats
npm run packs:extract:classes
npm run packs:extract:class-abilities
```

**Compile** - YAML → LevelDB:
```bash
npm run packs:compile                     # All packs
```

**Features:**
- Data sanitization (removes defaults, cleans HTML)
- Schema validation
- ID preservation across extract/compile cycles
- Sorted keys for consistent git diffs
- Folder structure support for class abilities
- Handles `classAssociations` UUID links

**When to Use:**
- After scraping → compile to LevelDB
- After editing in Foundry → extract to YAML
- Before committing → extract to get latest changes
- After pulling changes → compile to update Foundry

**Important Notes:**
- Close Foundry before running (LevelDB database locking)
- YAML files in `packs-source/` are the source of truth
- LevelDB files in `packs/` are gitignored (generated from YAML)

## Scraper Architecture

All scrapers share a common architecture:

### 1. HTML Fetching
- Uses curl subprocess for reliable redirect handling
- Adds `?action=raw` param for wiki pages (gets clean HTML)
- Handles HTTP → HTTPS upgrades automatically

### 2. Infobox Parsing
- Extracts structured data from MediaWiki PortableInfobox format
- Uses JSDOM to parse HTML and query DOM
- Handles multiple data formats (lists, templates, text)

### 3. PF1 Schema Mapping
- Converts wiki infobox fields to PF1 item schema
- Creates proper Action objects with:
  - `activation` - Parsed from manifesting time
  - `range` - Converted to PF1 units
  - `duration` - Converted to PF1 units
  - `target` - What the power/ability affects
  - `save` - Type, DC formula, description
  - `actionType` - Determines behavior (save, attack, other)

### 4. Action Object Creation

**CRITICAL**: Powers and abilities include Action objects that store combat/usage mechanics:

```javascript
{
  activation: {
    cost: 1,
    type: "standard"  // standard, swift, immediate, full, move, free
  },
  range: {
    value: null,
    units: "close"    // personal, touch, close, med, long, unlimited, ft, mi
  },
  duration: {
    value: null,
    units: "inst"     // inst, conc, round, minute, hour, day, perm, spec
  },
  target: {
    value: "One creature"
  },
  save: {
    type: "Will",     // Fort, Ref, Will
    dc: "0",          // Formula for DC calculation
    description: "Negates"
  },
  actionType: "save"  // save, attack, other, utility
}
```

See `tools/docs/PF1-Duration-Units-Reference.md` for valid unit values.

### 5. YAML Output
- Direct output to `packs-source/` directory
- Filename format: `{slug}.{id}.yaml`
- IDs preserved if file already exists
- Sorted keys for consistent git diffs

### 6. Rate Limiting
- 1-second delay between requests (respectful scraping)
- Prevents overwhelming the source wiki

### 7. Source Attribution
- Tracks source book and page numbers
- Filters content by publisher/license

## Standard Workflow

### Scraping New Content

```bash
# 1. Navigate to scrapers directory
cd tools/scrapers

# 2. Run appropriate scraper
node powers-scraper.mjs --list ../data/power-urls.txt
# or
node feats-scraper.mjs --list ../data/feat-urls.txt
# or
node classes-scraper.mjs

# 3. Return to root
cd ../..

# 4. Review changes
git diff packs-source/

# 5. Commit source files
git add packs-source/
git commit -m "Import new powers"

# 6. Compile to LevelDB
npm run packs:compile

# 7. Test in Foundry (F5 refresh)
```

### Editing Existing Content

**Option 1: Edit YAML Directly (Recommended)**
```bash
# Find the file
find packs-source/ -name "*crystal-shard*"

# Edit in your editor
vim packs-source/powers/crystal-shard.5g5ozwSXLRDNZUFi.yaml

# Compile
npm run packs:compile

# Test in Foundry (F5)
```

**Option 2: Edit in Foundry, Then Extract**
```bash
# 1. Make changes in Foundry UI
# 2. Extract back to YAML
npm run packs:extract:powers

# 3. Review changes
git diff packs-source/

# 4. Commit if satisfied
git add packs-source/
git commit -m "Update power descriptions"
```

## Data Files

Located in `data/` directory:

- **`power-urls.txt`** - 535+ power URLs from metzo.miraheze.org
  - Format: one URL per line
  - Source: https://metzo.miraheze.org/wiki/Category:Powers

- **`feat-urls.txt`** - Psionic feat URLs
  - Format: one URL per line
  - Source: https://metzo.miraheze.org/wiki/Category:Psionic_Feats

## Documentation

Located in `docs/` directory:

- **`IMPORT-GUIDE.md`** - Step-by-step workflow for scraping and importing content
- **`AVAILABLE-ICONS.md`** - Reference of all Foundry VTT icons (prevents broken images)
- **`PF1-Duration-Units-Reference.md`** - Valid duration units in PF1 system

## Troubleshooting

### Scraper Issues

**"Database locked" error:**
- Close Foundry before running extract/compile
- LevelDB can only be accessed by one process at a time

**Scraped data looks wrong:**
- Edit the YAML file directly to fix it
- Or delete the file and re-scrape just that item
- Run `npm run packs:compile` after fixing

**Scraper fails partway through:**
- Already-scraped YAML files are preserved
- Remove completed items from URL list
- Re-run scraper to continue where it left off

**Network/timeout errors:**
- Scrapers use 1-second delay between requests
- Some pages may take longer to load
- Re-run scraper (it skips existing files)

### Compilation Issues

**Compile fails with YAML syntax error:**
- Check YAML syntax: `npm install -g js-yaml; js-yaml packs-source/powers/*.yaml`
- Look for console error messages
- Fix the specific YAML file mentioned in error
- Common issues: unescaped quotes, incorrect indentation

**Changes not appearing in Foundry:**
- Ensure you ran `npm run packs:compile`
- Hard refresh Foundry (Ctrl+F5 / Cmd+Shift+R)
- Check LevelDB was updated: `ls -lt packs/powers/`
- Check console for errors (F12)

**ID conflicts / duplicate items:**
- IDs are preserved across scraping runs
- Delete old YAML file before re-scraping
- Or manually edit the ID in YAML file

## Development Notes

### Code Style
- All scrapers use ES6 modules (`.mjs` extension)
- Async/await for asynchronous operations
- JSDOM for HTML parsing
- js-yaml for YAML output
- Shared utilities in `common.mjs`

### Content Filtering
- All content is OGL-licensed from metzo.miraheze.org
- Feats filtered by source book (Dreamscarred Press only)
- Classes filtered by source book (Ultimate Psionics, Psionics Augmented)
- Powers include all from wiki (comprehensive coverage)

### YAML Format
- Uses sorted keys for consistent diffs
- Human-readable indentation (2 spaces)
- IDs preserved across extract/compile cycles
- Filename format: `{slug}.{id}.yaml`
- Folders supported for class abilities

### Integration with PF1 System
- Action objects follow PF1 schema exactly
- Duration units match PF1 system units
- Range units match PF1 system units
- Activation types match PF1 action types
- Formula syntax uses PF1 roll data variables (`@sl`, `@cl`, etc.)

## External References

- **PF1 System Source**: https://gitlab.com/foundryvtt_pathfinder1e/foundryvtt-pathfinder1
  - Study `module/models/item/spell-model.mjs` for spell structure
  - Study `module/components/action.mjs` for Action schema
- **Content Source**: https://metzo.miraheze.org (OGL-licensed psionic content)
- **FoundryVTT API**: https://foundryvtt.com/api/

## Important Reminders

- **YAML is source of truth** - LevelDB files are generated, not edited
- **Close Foundry before extract/compile** - Database locking issues
- **Always review changes** - Use `git diff` before committing
- **Test in Foundry** - After compiling, verify items work correctly
- **Preserve IDs** - Don't change IDs in YAML files (breaks links)
- **Follow PF1 schema** - Action objects must match PF1 structure exactly
- **Rate limit scraping** - 1-second delay is built in, don't remove it
