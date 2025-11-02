# Contributing to pf1-psionics

Thank you for your interest in contributing to the pf1-psionics module! This document provides guidelines for contributing to the project.

## Getting Started

1. **Fork the repository** and clone your fork locally
2. **Install dependencies**: `npm install`
3. **Extract compendiums to YAML**: `npm run packs:extract`

## Development Workflow

### Prerequisites

- Node.js v18 or higher
- FoundryVTT with the Pathfinder 1e system installed
- Basic understanding of JavaScript and YAML

### Module Development

The module is located in your Foundry VTT modules directory and can be edited directly:

```bash
cd /path/to/FoundryVTT/Data/modules/pf1-psionics
```

After making changes to module code:
1. Save your changes
2. Refresh FoundryVTT (F5)
3. Check the browser console (F12) for errors

### Compendium Development

The module uses a **YAML-first workflow** for compendium management.

#### Directory Structure

```
pf1-psionics/
├── packs-source/           # YAML source (commit to git)
│   ├── powers/            # 597 power YAML files
│   └── feats/             # 189 feat YAML files
└── packs/                 # Compiled LevelDB (gitignored)
    ├── powers/
    └── feats/
```

#### Editing Existing Items

**Option 1: Edit YAML directly** (recommended for text changes)

```bash
# Find the file
find packs-source/ -name "*crystal-shard*"

# Edit in your editor
vim packs-source/powers/crystal-shard.5g5ozwSXLRDNZUFi.yaml

# Recompile
npm run packs:compile

# Test in Foundry (F5 refresh)
```

**Option 2: Edit in Foundry, then extract**

```bash
# 1. Make changes in Foundry UI
# 2. Close Foundry
# 3. Extract back to YAML
npm run packs:extract powers

# 4. Review changes
git diff packs-source/

# 5. Commit if satisfied
git add packs-source/
git commit -m "Update power descriptions"
```

#### Adding New Items

**From metzo.miraheze.org** (official source):

```bash
# 1. Add URL to appropriate file
echo "https://metzo.miraheze.org/wiki/New_Power" >> tools/data/power-urls.txt

# 2. Run scraper
cd tools/scrapers
node powers-scraper.mjs --list ../data/power-urls.txt

# 3. Review scraped YAML
cd ../..
git diff packs-source/powers/

# 4. Compile to LevelDB
npm run packs:compile

# 5. Test in Foundry
```

**Manual creation**:

1. Create the item in Foundry UI
2. Extract to YAML: `npm run packs:extract`
3. Review and commit the new YAML file

#### Validation

Before committing compendium changes:

```bash
# Extract latest from Foundry
npm run packs:extract

# Review changes
git diff packs-source/

# Verify YAML syntax
npm install -g js-yaml
js-yaml packs-source/powers/*.yaml

# Verify compilation works
npm run packs:compile

# Test in Foundry
```

## Scraping Content

The module includes scrapers for importing content from metzo.miraheze.org (OGL-licensed Dreamscarred Press content).

### Power Scraper

```bash
cd tools/scrapers

# Scrape all powers from URL list
node powers-scraper.mjs --list ../data/power-urls.txt

# Scrape a single power
node powers-scraper.mjs "https://metzo.miraheze.org/wiki/Crystal_Shard"

# Legacy JSON format (if needed)
node powers-scraper.mjs --format json --list ../data/power-urls.txt
```

### Feat Scraper

```bash
cd tools/scrapers

# Scrape all feats from URL list
node feats-scraper.mjs --list ../data/feat-urls.txt

# Scrape a single feat
node feats-scraper.mjs "https://metzo.miraheze.org/wiki/Empower_Power"
```

See [tools/README.md](tools/README.md) for detailed scraper documentation.

## Pull Request Guidelines

### Before Submitting

1. **Test your changes** in FoundryVTT
2. **Extract compendiums** if you edited items in Foundry: `npm run packs:extract`
3. **Commit YAML source**, not compiled LevelDB files
4. **Review your changes**: `git diff packs-source/`
5. **Check for errors** in the browser console (F12)

### Commit Messages

Use clear, descriptive commit messages:

```
Add 10 new psionic powers from Psionics Expanded

Update Crystal Shard power description for clarity

Fix power point calculation for high-level manifesters
```

### What to Commit

**Do commit:**
- Module code changes (`scripts/`, `templates/`, `lang/`, etc.)
- YAML source files (`packs-source/`)
- Documentation updates
- Tool updates (`tools/`)

**Do NOT commit:**
- Compiled LevelDB files (`packs/`)
- `node_modules/`
- `package-lock.json` (use `npm install` to regenerate)
- IDE-specific files (`.vscode/`, `.idea/`, etc.)

### Pull Request Process

1. **Create a branch** for your changes: `git checkout -b feature/my-feature`
2. **Make your changes** following the guidelines above
3. **Test thoroughly** in FoundryVTT
4. **Extract compendiums** if needed: `npm run packs:extract`
5. **Commit your changes** with clear messages
6. **Push to your fork**: `git push origin feature/my-feature`
7. **Open a pull request** with a clear description of your changes

## Code Style

- Use ES6 modules (`.mjs` extension)
- Follow existing code patterns in the module
- Use `game.i18n.localize()` for all user-facing strings
- Add localization keys to `lang/en.json`
- Document complex functions with JSDoc comments

## Troubleshooting

### Database Locked Error

Close Foundry before running `npm run packs:extract` or `npm run packs:compile`. LevelDB can only be accessed by one process at a time.

### Changes Not Appearing in Foundry

1. Ensure you ran `npm run packs:compile`
2. Hard refresh Foundry (Ctrl+F5 / Cmd+Shift+R)
3. Check LevelDB was updated: `ls -lt packs/powers/`

### YAML Syntax Errors

Validate YAML files:
```bash
npm install -g js-yaml
js-yaml packs-source/powers/*.yaml
```

## Resources

- **Documentation**:
  - [tools/README.md](tools/README.md) - Tools documentation
  - [tools/docs/IMPORT-GUIDE.md](tools/docs/IMPORT-GUIDE.md) - Import workflow guide
  - [COMPENDIUM-WORKFLOW.md](COMPENDIUM-WORKFLOW.md) - Architecture documentation
  - [CLAUDE.md](CLAUDE.md) - AI assistant guidance (technical reference)

- **External Resources**:
  - [PF1 System GitLab](https://gitlab.com/foundryvtt_pathfinder1e/foundryvtt-pathfinder1) - Official PF1 system source
  - [Metzo Wiki](https://metzo.miraheze.org) - Source for psionic content (OGL)
  - [FoundryVTT Documentation](https://foundryvtt.com/api/) - Foundry API docs

## Questions or Issues?

- Open an issue on GitHub for bugs or feature requests
- Check existing issues and documentation before asking
- Include version information and console errors when reporting bugs

## License

This module operates under the Open Game License (OGL) v1.0a. All contributions must comply with OGL requirements. See README.md for legal notes regarding Paizo and Dreamscarred Press content.
