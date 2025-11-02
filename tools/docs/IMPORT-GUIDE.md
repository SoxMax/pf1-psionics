# Compendium Data Import Guide

This guide explains how to scrape and import psionic powers and feats from metzo.miraheze.org into the module's compendiums using the YAML workflow.

## Overview

The module uses a **YAML-based workflow** that outputs human-readable files directly to version control, eliminating the need for Foundry macros or JSON intermediate files.

```
metzo.miraheze.org → Scraper → YAML files → Git → Compile → LevelDB
```

## Prerequisites

- ✅ Node.js installed (v18+)
- ✅ Module dependencies installed (`npm install`)
- ✅ Compendiums configured in `module.json`

## Quick Start

### Import All Powers

```bash
cd tools/scrapers
node powers-scraper.mjs --list ../data/power-urls.txt
cd ../..
npm run packs:compile
```

### Import All Feats

```bash
cd tools/scrapers
node feats-scraper.mjs --list ../data/feat-urls.txt
cd ../..
npm run packs:compile
```

That's it! No Foundry macros needed.

## Detailed Workflow

### Step 1: Scrape Data to YAML

The scrapers now output **YAML files directly** to `packs-source/` instead of JSON:

#### Powers

```bash
cd tools/scrapers

# Scrape all powers (takes ~10 minutes for 535 powers)
node powers-scraper.mjs --list ../data/power-urls.txt

# Or scrape a single power
node powers-scraper.mjs "https://metzo.miraheze.org/wiki/Crystal_Shard"
```

**Output:** Creates individual YAML files in `packs-source/powers/`:
- `crystal-shard.5g5ozwSXLRDNZUFi.yaml`
- `energy-ray.nQrXRrV10cQ2s39s.yaml`
- ... (597 files)

#### Feats

```bash
cd tools/scrapers

# Scrape all feats
node feats-scraper.mjs --list ../data/feat-urls.txt

# Or scrape a single feat
node feats-scraper.mjs "https://metzo.miraheze.org/wiki/Empower_Power"
```

**Output:** Creates individual YAML files in `packs-source/feats/`:
- `psionic-talent.abc123xyz.yaml`
- `psionic-meditation.def456uvw.yaml`
- ... (189 files)

### Step 2: Review the YAML Files

Since the output is human-readable YAML, you can review it before committing:

```bash
# Check what changed
git diff packs-source/

# View a specific power
cat packs-source/powers/crystal-shard.5g5ozwSXLRDNZUFi.yaml

# Search for issues
grep -r "null" packs-source/
```

**Benefits:**
- ✅ Catch scraping errors before they enter the compendium
- ✅ Manually fix data issues by editing YAML
- ✅ Meaningful code reviews on pull requests

### Step 3: Commit the YAML Source

```bash
# Stage the new/changed YAML files
git add packs-source/

# Commit with a descriptive message
git commit -m "Import new psionic powers from metzo.miraheze.org"

# Push to repository
git push
```

### Step 4: Compile to LevelDB

After committing the YAML source, compile it to the binary LevelDB format that Foundry uses:

```bash
# From the module root directory
npm run packs:compile
```

**This command:**
- Reads all YAML files from `packs-source/`
- Validates and sanitizes the data
- Compiles to LevelDB format in `packs/`
- Takes only a few seconds

**Output:**
```
Compiling 2 pack(s)...
  Compiling feats...
  Compiling powers...
✓ All packs compiled successfully
```

### Step 5: Test in Foundry

1. Launch Foundry VTT
2. Refresh your browser (F5)
3. Open the "Psionic Powers" or "Psionic Feats" compendium
4. Verify the new/updated items appear correctly

## Advanced Usage

### Legacy JSON Format

If you need the old JSON format (for migration or compatibility):

```bash
node powers-scraper.mjs --format json --list ../data/power-urls.txt
# Creates: tools/data/psionic-powers.json
```

### Extracting from Foundry Back to YAML

If you make edits in Foundry's compendium UI and want to sync them back to YAML:

```bash
npm run packs:extract powers
# or
npm run packs:extract feats
# or extract all
npm run packs:extract
```

This is useful for:
- Syncing manual edits made in Foundry
- Recovering from YAML file corruption
- Bulk editing via Foundry's UI

### Updating Existing Items

To update an existing power or feat:

1. **Find the YAML file:**
   ```bash
   find packs-source/ -name "*crystal-shard*"
   ```

2. **Edit the YAML file** in your text editor

3. **Recompile:**
   ```bash
   npm run packs:compile
   ```

4. **Test in Foundry** (refresh browser)

## Troubleshooting

### Scraper Issues

**Problem:** Scraper fails partway through

**Solution:**
- Check your internet connection
- The scraper includes rate limiting (1 second between requests)
- Already-scraped items are saved as YAML files
- Remove completed items from the URL list and re-run

**Problem:** Scraped data looks incorrect

**Solution:**
- Edit the YAML file directly to fix it
- Or delete the file and re-scrape just that item
- Run `npm run packs:compile` after fixing

### Compilation Issues

**Problem:** `npm run packs:compile` fails

**Solution:**
- Check for YAML syntax errors: `npm install -g js-yaml; js-yaml packs-source/powers/*.yaml`
- Look for invalid IDs or missing required fields
- Check console output for specific error messages

**Problem:** Changes not appearing in Foundry

**Solution:**
- Make sure you ran `npm run packs:compile`
- Hard refresh Foundry (Ctrl+F5 or Cmd+Shift+R)
- Check that LevelDB files were updated: `ls -lt packs/powers/`

### Database Locked Error

**Problem:** "Database locked by another process"

**Solution:**
- Close Foundry before running extract or compile
- The LevelDB database can only be accessed by one process at a time

## File Organization

```
pf1-psionics/
├── packs-source/           # YAML source (commit to git)
│   ├── powers/            # 597 power YAML files
│   └── feats/             # 189 feat YAML files
├── packs/                 # Compiled LevelDB (gitignored)
│   ├── powers/
│   └── feats/
├── tools/
│   ├── scrapers/
│   │   ├── powers-scraper.mjs
│   │   ├── feats-scraper.mjs
│   │   └── common.mjs
│   ├── packs.mjs          # Extract/compile tool
│   └── data/
│       ├── power-urls.txt
│       └── feat-urls.txt
└── package.json           # npm scripts
```

## Comparison: Old vs New Workflow

### Old Workflow (Deprecated)
```
1. Scrape to JSON                 → node scraper.mjs --list urls.txt output.json
2. Launch Foundry                 → (manual step)
3. Create/run import macro        → (manual Foundry macro)
4. Verify in compendium           → (check Foundry UI)
5. Commit binary LevelDB files    → git add packs/
```

**Issues:**
- ❌ Binary files in git (huge diffs)
- ❌ Requires Foundry running
- ❌ Multi-step process with manual steps
- ❌ Can't review data before committing

### New Workflow (Current)
```
1. Scrape to YAML                 → node powers-scraper.mjs --list urls.txt
2. Review YAML (optional)         → git diff packs-source/
3. Commit YAML source             → git add packs-source/ && git commit
4. Compile to LevelDB             → npm run packs:compile
5. Test in Foundry                → F5 refresh
```

**Benefits:**
- ✅ Human-readable YAML in git
- ✅ No Foundry required for import
- ✅ Automated, scriptable process
- ✅ Can review/edit data before committing
- ✅ Matches PF1 system conventions

## See Also

- `COMPENDIUM-WORKFLOW.md` - Detailed architecture documentation
- `YAML-CONVERSION-COMPLETE.md` - Migration summary and benefits
- `tools/README.md` - Tools directory documentation
- `tools/archive/legacy-macros/README.md` - Old import macros (archived)
