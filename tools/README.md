# Pf1-Psionics Tools

This directory contains tools for scraping, importing, and managing psionic content from metzo.miraheze.org using a YAML-based workflow.

## Directory Structure

```
tools/
├── scrapers/          # Web scrapers (output YAML)
│   ├── powers-scraper.mjs
│   ├── feats-scraper.mjs
│   ├── classes-scraper.mjs
│   └── common.mjs
├── packs.mjs          # Extract/compile tool for YAML ↔ LevelDB
├── data/              # URL lists and reference data
├── docs/              # Documentation and guides
└── README.md          # This file
```

## Quick Reference

### Import New Powers
```bash
cd tools/scrapers
node powers-scraper.mjs --list ../data/power-urls.txt
cd ../..
npm run packs:compile
```

### Import New Feats
```bash
cd tools/scrapers
node feats-scraper.mjs --list ../data/feat-urls.txt
cd ../..
npm run packs:compile
```

### Import Classes
```bash
cd tools/scrapers
node classes-scraper.mjs
cd ../..
npm run packs:compile
```

### Extract from Foundry
```bash
npm run packs:extract:powers              # Extract powers only
npm run packs:extract:feats               # Extract feats only
npm run packs:extract:classes             # Extract classes only
npm run packs:extract:class-abilities     # Extract class abilities only
npm run packs:extract:races               # Extract races only
npm run packs:extract:rules               # Extract rules/skills only
npm run packs:extract                     # Extract all packs
```

### Compile to LevelDB
```bash
npm run packs:compile
```

## Core Tools

### `packs.mjs` - Compendium Management

The primary tool for converting between YAML source and LevelDB compendiums. Adapted from the official PF1 system.

**Extract** - LevelDB → YAML
```bash
npm run packs:extract                     # Extract all compendiums
npm run packs:extract:powers              # Extract just powers
npm run packs:extract:feats               # Extract just feats
npm run packs:extract:classes             # Extract just classes
npm run packs:extract:class-abilities     # Extract just class abilities
```

**Compile** - YAML → LevelDB
```bash
npm run packs:compile           # Compile all compendiums
```

**Features:**
- Data sanitization (removes defaults, cleans HTML)
- Validates against schemas
- Preserves IDs across extract/compile cycles
- Sorts keys for consistent diffs
- **NEW:** Supports classes and class abilities with folder structure
- **NEW:** Handles `classAssociations` links in class items
- **NEW:** Preserves folder hierarchy for class abilities

**When to use:**
- After scraping new content → compile to LevelDB
- After editing in Foundry → extract to YAML
- Before committing changes → extract to get latest
- After pulling changes → compile to update Foundry

## Scrapers

All scrapers now output **YAML files directly** to `packs-source/` instead of JSON.

### `scrapers/common.mjs`

Shared utilities library:

**Core Functions:**
- `fetchHTML(url)` - Fetch HTML using curl with redirect support
- `extractInfoboxData(html, fieldName)` - Extract data from MediaWiki infoboxes
- `writeJSONOutput(path, data)` - Legacy JSON output
- `writeYAMLPack(packName, items, rootDir)` - **NEW:** Write items as YAML files
- `sluggify(name)` - Convert names to filename-safe slugs
- `delay(ms)` - Rate limiting for web requests

**HTML Processing:**
- `extractTitle(html)` - Extract title from infobox or page heading
- `extractDescription(html)` - Extract cleaned description HTML
- `extractCategoryLinks(html)` - Extract links from category pages
- `decodeHTMLEntities(text)` - Decode HTML entities

### `scrapers/powers-scraper.mjs`

Scrapes psionic powers from metzo.miraheze.org and outputs YAML files.

**Usage:**
```bash
cd tools/scrapers

# Scrape all powers from category (takes ~10 min)
node powers-scraper.mjs

# Scrape from URL list
node powers-scraper.mjs --list ../data/power-urls.txt

# Scrape single power
node powers-scraper.mjs "https://metzo.miraheze.org/wiki/Crystal_Shard"

# Legacy JSON format
node powers-scraper.mjs --format json ../data/powers.json
```

**Output:** Creates individual YAML files in `../../packs-source/powers/`:
- `crystal-shard.5g5ozwSXLRDNZUFi.yaml`
- `energy-ray.nQrXRrV10cQ2s39s.yaml`
- ... (one file per power)

**Features:**
- Complete description extraction with formatting
- AI-powered action inference (attack types, damage, areas)
- Class availability tracking (`learnedAt.class`)
- Source attribution with page numbers
- PF1-compatible output structure

**After scraping:**
```bash
cd ../..
git add packs-source/powers/
git commit -m "Import new powers"
npm run packs:compile
```

### `scrapers/feats-scraper.mjs`

Scrapes psionic feats from metzo.miraheze.org and outputs YAML files.

**Usage:**
```bash
cd tools/scrapers

# Scrape all psionic feats from category
node feats-scraper.mjs

# Scrape from URL list
node feats-scraper.mjs --list ../data/feat-urls.txt

# Scrape single feat
node feats-scraper.mjs "https://metzo.miraheze.org/wiki/Empower_Power"

# Legacy JSON format
node feats-scraper.mjs --format json ../data/feats.json
```

**Output:** Creates individual YAML files in `../../packs-source/feats/`:
- `psionic-talent.abc123xyz.yaml`
- `psionic-meditation.def456uvw.yaml`
- ... (one file per feat)

**Features:**
- Filters by source book (Dreamscarred Press only)
- Extracts prerequisites, benefits, special text
- Detects feat types (Psionic, Metapsionic, Combat, etc.)
- Automatic feat type classification

**After scraping:**
```bash
cd ../..
git add packs-source/feats/
git commit -m "Import new feats"
npm run packs:compile
```

### `scrapers/classes-scraper.mjs`

Scrapes psionic classes and class abilities from metzo.miraheze.org and outputs YAML files.

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

**Output:** Creates YAML files in:
- `../../packs-source/classes/` - Class items (flat structure)
- `../../packs-source/class-abilities/` - Class ability items (organized in folders by class)

**Features:**
- Unified scraper outputs both classes and abilities
- Automatic UUID linking via `classAssociations`
- Progressive ability handling (single item, multiple levels)
- Filters for Ultimate Psionics and Psionics Augmented sources
- Parses class stats from infobox (HD, BAB, saves, skills)
- Extracts class features from class table

**After scraping:**
```bash
cd ../..
git add packs-source/classes/ packs-source/class-abilities/
git commit -m "Import new classes"
npm run packs:compile
```

See `tools/scrapers/README-CLASSES.md` for detailed documentation.

### `scrapers/races-scraper.mjs`

Scrapes psionic races from metzo.miraheze.org and outputs YAML files.

**Usage:**
```bash
cd tools/scrapers

# Scrape all races from Ultimate Psionics category
node races-scraper.mjs

# Scrape from URL list
node races-scraper.mjs --list ../data/race-urls.txt

# Scrape single race
node races-scraper.mjs "https://metzo.miraheze.org/wiki/Blue"

# Use custom category URL
node races-scraper.mjs --category "https://metzo.miraheze.org/wiki/Category:Ultimate_Psionics_races"
```

**Output:** Creates YAML files in `../../packs-source/races/`:
- `blue.Ceuzln2eEWcBwJGH.yaml` - Race base item
- `blue.aBovcvxgTFmexzSs/` - Folder for race traits
  - `_Folder.yaml` - Folder metadata
  - `darkvision.9HqXWHEgToDC4doZ.yaml` - Individual race trait
  - `naturally-psionic.uZdof4YzFpxkH5HL.yaml` - Individual race trait
  - ... (one file per trait)

**Features:**
- Extracts ability score modifiers (+2 Int, -2 Str, etc.)
- Parses size, creature types, and subtypes
- Extracts languages
- Identifies race traits from description
- Race trait folders must be created manually after scraping
- Automatic icon selection based on race characteristics

**After scraping:**
```bash
cd ../..
git add packs-source/races/
git commit -m "Import new races"

# Manually create race trait YAML files in subfolders
# Then link them in the race's links.supplements array

npm run packs:compile
```

**Important Notes:**
- The scraper creates the race base item only
- Race traits must be manually created as separate feat items in a subfolder
- Reference the Blue race structure as an example:
  - Main race file: `blue.Ceuzln2eEWcBwJGH.yaml`
  - Trait folder: `blue.aBovcvxgTFmexzSs/`
  - Traits are linked via `system.links.supplements` with UUIDs
- Race traits use `type: feat` and `system.subType: racial`

See `tools/scrapers/README-RACES.md` for detailed documentation.

## Data Files

Located in `data/` directory:

- `power-urls.txt` - List of 535+ power URLs from metzo.miraheze.org
- `feat-urls.txt` - List of psionic feat URLs
- `race-urls.txt` - List of psionic race URLs from Ultimate Psionics
- *(JSON files are legacy and no longer generated by default)*

## Documentation

Located in `docs/` directory:

- **`IMPORT-GUIDE.md`** - Complete workflow guide for scraping and importing
- **`../COMPENDIUM-WORKFLOW.md`** - Architecture and design documentation
- **`../YAML-CONVERSION-COMPLETE.md`** - Migration summary

## Workflow Comparison

### New YAML Workflow (Current)

```
metzo.miraheze.org
    ↓ (scraper → YAML)
packs-source/powers/*.yaml (commit to git)
    ↓ (npm run packs:compile)
packs/powers/ (LevelDB, gitignored)
    ↓ (Foundry loads)
Compendium in game
```

**Commands:**
```bash
# 1. Scrape to YAML
cd tools/scrapers
node powers-scraper.mjs --list ../data/power-urls.txt

# 2. Review and commit
cd ../..
git diff packs-source/
git add packs-source/
git commit -m "Import powers"

# 3. Compile for Foundry
npm run packs:compile

# 4. Refresh Foundry (F5)
```

**Benefits:**
- ✅ Human-readable YAML in version control
- ✅ Meaningful git diffs
- ✅ No Foundry required for import
- ✅ Edit data in text editor
- ✅ Standard git workflow

### Old JSON/Macro Workflow (Deprecated)

```
metzo.miraheze.org
    ↓ (scraper → JSON)
data/psionic-powers.json
    ↓ (manual: launch Foundry)
    ↓ (import macro)
packs/powers/ (LevelDB, committed to git)
```

**Issues:**
- ❌ Binary files in git history
- ❌ Required Foundry running
- ❌ Manual macro step
- ❌ No data review before committing

## Editing Existing Content

### Option 1: Edit YAML Directly (Recommended)

```bash
# Find the file
find packs-source/ -name "*crystal-shard*"

# Edit in your editor
vim packs-source/powers/crystal-shard.5g5ozwSXLRDNZUFi.yaml

# Recompile
npm run packs:compile

# Test in Foundry (F5 refresh)
```

### Option 2: Edit in Foundry, Then Extract

```bash
# 1. Make changes in Foundry UI
# 2. Extract back to YAML
npm run packs:extract powers

# 3. Review changes
git diff packs-source/

# 4. Commit if satisfied
git add packs-source/
git commit -m "Update power descriptions"
```

## File Organization

```
pf1-psionics/
├── packs-source/           # YAML source (commit to git)
│   ├── powers/            # 597 YAML files (organized by discipline)
│   ├── feats/             # 189 YAML files
│   ├── classes/           # Class YAML files (flat)
│   └── class-abilities/   # Class ability YAML files (with folder structure)
├── packs/                 # Compiled LevelDB (gitignored)
│   ├── powers/
│   ├── feats/
│   ├── classes/
│   └── class-abilities/
├── tools/
│   ├── scrapers/
│   │   ├── powers-scraper.mjs
│   │   ├── feats-scraper.mjs
│   │   ├── classes-scraper.mjs
│   │   └── common.mjs
│   ├── packs.mjs          # Extract/compile tool
│   ├── data/
│   │   ├── power-urls.txt
│   │   └── feat-urls.txt
│   ├── docs/
│   │   └── IMPORT-GUIDE.md
├── package.json           # npm scripts
└── .gitignore            # Excludes packs/, includes packs-source/
```

## Troubleshooting

### Scraper Issues

**"Database locked" error:**
- Close Foundry before running extract/compile
- LevelDB can only be accessed by one process at a time

**Scraped data looks wrong:**
- Edit the YAML file directly to fix it
- Or delete and re-scrape just that item
- Run `npm run packs:compile` after fixing

**Scraper fails partway:**
- Already-scraped YAML files are preserved
- Remove completed items from URL list
- Re-run scraper to continue

### Compilation Issues

**Compile fails with YAML error:**
- Check YAML syntax: `npm install -g js-yaml; js-yaml packs-source/powers/*.yaml`
- Look for console error messages
- Fix the specific YAML file mentioned

**Changes not in Foundry:**
- Ensure you ran `npm run packs:compile`
- Hard refresh Foundry (Ctrl+F5 / Cmd+Shift+R)
- Check LevelDB was updated: `ls -lt packs/powers/`

## Development Notes

- All scrapers include 1-second delay between requests
- Content filtered to OGL-licensed material only
- Feats filtered by source book (Dreamscarred Press)
- YAML files use sorted keys for consistent diffs
- IDs are preserved across extract/compile cycles
- Filename format: `{slug}.{id}.yaml`

## See Also

- `docs/IMPORT-GUIDE.md` - Detailed workflow guide
- `../COMPENDIUM-WORKFLOW.md` - Architecture documentation
- `../YAML-CONVERSION-COMPLETE.md` - Migration summary
