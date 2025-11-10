
pf1-psionics
============

This module aims to incorporate Dreamscarred Press' Psionics system into the Pathfinder 1e system for FoundryVTT.

Features
========

* Adds a new tab to the character sheet for managing Psionic Manifesting.
	* This tab can be enabled similarly to enabling spellcasting in the PF1 ruleset.
	* The tab also functions similarly to the spells tab of the PF1 ruleset.
* Adds new skills to characters
	* Added Autohypnosis (Wis, Trained only) to Skills tab.
	* Added Knowledge (Psionics) (Int, Trained only) to Skills tab.
* Adds support for Psionic Powers as a distinct Item.
* Includes compendium packs with 597 psionic powers and 189 psionic feats from Dreamscarred Press'.

### Installing in FoundryVTT

Users can install this module using:
```
https://github.com/SoxMax/pf1-psionics/releases/latest/download/module.json
```

This URL always points to the most recent release.

Development
===========

This module uses a YAML-based workflow for compendium management, matching the approach used by the official PF1 system.

## Quick Start

```bash
# Install dependencies
npm install

# Extract compendiums from LevelDB to YAML
npm run packs:extract

# Compile YAML source to LevelDB
npm run packs:compile
```

## Compendium Workflow

The module stores human-readable YAML source files in `packs-source/` and compiles them to LevelDB format in `packs/`.

**Source files** (`packs-source/`) are committed to git.
**Compiled files** (`packs/`) are gitignored and generated at build time.

### After editing in Foundry:

```bash
npm run packs:extract powers
npm run packs:extract feats
git add packs-source/
git commit -m "Update powers"
```

### After editing YAML files:

```bash
npm run packs:compile
# Refresh Foundry (F5)
```

### Adding new content:

```bash
# Scrape powers from metzo.miraheze.org
cd tools/scrapers
node powers-scraper.mjs --list ../data/power-urls.txt

# Scrape feats
node feats-scraper.mjs --list ../data/feat-urls.txt

# Compile to LevelDB
cd ../..
npm run packs:compile
```

For detailed documentation, see:
- [tools/README.md](tools/README.md) - Tools documentation
- [tools/docs/IMPORT-GUIDE.md](tools/docs/IMPORT-GUIDE.md) - Complete import workflow
- [COMPENDIUM-WORKFLOW.md](COMPENDIUM-WORKFLOW.md) - Architecture documentation

## Release Process

This module uses GitHub Actions for automated releases. Anytime the module version is updated in `module.json` and pushed to the `main` branch, a new release is created.

### Legal Note:

"This module uses trademarks and/or copyrights owned by Paizo Inc., used under Paizo's Community Use Policy (paizo.com/communityuse). We are expressly prohibited from charging you to use or access this content. This module is not published, endorsed, or specifically approved by Paizo. For more information about Paizo Inc. and Paizo products, visit paizo.com."

"This module references Psionics, a product of Dreamscarred Press, which is used under the Open Game License v1.0a. To the best of our knowledge, 'Psionics' is not a registered trademark."

"This module is not published, endorsed or specifically approved by Dreamscarred Press. For more information about Dreamscarred Press, visit dreamscarred.com. To the best of our knowledge, this module operates within Dreamscarred Press' OGL Product Identity statement, and all efforts were made to attemt to reach Dreamscarred Press for interpretation, although said efforts were met with unresponsiveness. If a Dreamscarred Press representative is reading this note and believes that the content should be removed from this module, please contact us using the contact information from this module's [module.json](https://github.com/SoxMax/pf1-psionics/blob/main/module.json) file."
