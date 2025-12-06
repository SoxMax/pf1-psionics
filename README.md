
pf1-psionics
============

This module aims to incorporate Dreamscarred Press' Psionics system into the Pathfinder 1e system for FoundryVTT.

Features
========

### Core Mechanics

* **Psionic Manifesting Tab** - Multiple classes per character, auto-calculated manifester level/concentration/power points, focus tracking, browse compendium
* **Power Points** - Auto-calculated from class and ability, temporary points/offsets/bonuses, auto-recharge on rest, custom buff targets
* **Psionic Focus** - Track current/max, feat/power integration, automatic management, custom buff targets

### Powers & Augmentation

* **Psionic Powers** - 7 disciplines (Athanatism, Clairsentience, Metacreativity, Psychokinesis, Psychometabolism, Psychoportation, Telepathy), subdisciplines, power levels 0-9, displays/descriptors/SR
* **Augmentation System** - Visual editor with multiple augments per power, damage/DC/CL bonuses, duration multipliers, focus requirements, in-dialog selection

### System Integration

* **New Skills** - Autohypnosis (Wis), Knowledge (Psionics) (Int)
* **PF1 Compatibility** - Psionic trait/subtype, buff system, concentration/CL checks

### Content Packs

* **597 Powers** with full mechanics
* **309 Feats**
* **12 Classes**: Aegis, Cryptic, Dread, Highlord, Marksman, Psion, Psychic Warrior, Soulknife, Tactician, Vitalist, Voyager, Wilder
* **10 Races** with racial traits
* **Rules** documentation

Installing in FoundryVTT
===========

Users can install this module using:
```
https://github.com/SoxMax/pf1-psionics/releases/latest/download/module.json
```

This URL always points to the most recent release.

Contributing to the Module
==========================

We welcome contributions! Whether you're fixing typos, adding missing powers, or improving existing content, your help is appreciated.

## For Non-Technical Contributors: Upload via GitHub (No Git Required!)

**The easiest way to contribute if you've edited compendiums in Foundry!**

You can share your edited compendiums without cloning the repo or using Git. Just attach your pack files to a GitHub issue and our automation will handle the rest.

### How It Works

1. **Edit in Foundry VTT:**
   - Install the pf1-psionics module in your Foundry
   - Open the compendium you want to edit
   - Right-click and select "Toggle Edit Lock" to unlock it
   - Make your changes (add items, fix typos, update mechanics, etc.)
   - Close Foundry completely when done

2. **Prepare Your Upload:**
   - Navigate to your Foundry VTT data folder: `Data/modules/pf1-psionics/packs/`
   - Find the pack you edited (e.g., `powers/`, `feats/`, `classes/`)
   - **Zip the entire pack directory**:
     - **Windows**: Right-click folder → "Send to" → "Compressed (zipped) folder"
     - **macOS**: Right-click folder → "Compress"
     - **Linux**: Right-click folder → "Compress..." or `zip -r powers.zip powers/`
   - Rename the zip to indicate the pack (e.g., `powers.zip`, `feats.zip`)

3. **Upload to GitHub:**
   - Open a new Issue using the ["Compendium Upload" template](../../issues/new/choose)
   - Drag and drop your .zip file(s) into the issue description box
   - Add a note about what you changed (e.g., "Fixed typos in 5 powers" or "Added missing Telepath class features")
   - Submit the issue

4. **Wait for Automation:**
   - Our GitHub Action will automatically:
     - Extract your pack files
     - Convert them to human-readable YAML
     - Create a new branch
     - Open a Pull Request for review
   - You'll get a comment on your issue with a link to the PR
   - A maintainer will review and merge your changes

### Important Notes

- **Upload the entire pack directory**, not just individual `.ldb` files
  - LevelDB needs `MANIFEST-*`, `CURRENT`, `LOG`, and `.ldb` files to work
- If uploading multiple packs, zip each directory separately
- Make sure Foundry is fully closed before zipping to avoid lock issues

### Need Help?

**Troubleshooting:** See the [Compendium Upload Troubleshooting Guide](docs/compendium-upload-troubleshooting.md) for solutions to common issues.

---

## For Developers: Local Development Setup

**Prerequisites:** Git, Node.js 18+, Foundry VTT

### Quick Start

Fork and clone into your Foundry modules directory (`Data/modules/`):

```bash
cd /path/to/FoundryVTT/Data/modules/
git clone https://github.com/YOUR-USERNAME/pf1-psionics.git
cd pf1-psionics
npm install
npm run packs:compile
```

**Note:** The `packs/` directory is gitignored. Run `npm run packs:compile` after checkout to generate LevelDB databases from YAML source in `packs-source/`.

Enable the module in Foundry (**Game Settings → Manage Modules → Psionics for PF1e**).

### Editing Compendiums

**Option 1: Edit in Foundry (Recommended)**

1. Unlock compendium (right-click → Toggle Edit Lock)
2. Make changes in Foundry UI
3. Extract to YAML: `npm run packs:extract [pack-name]`
4. Review changes: `git diff packs-source/`

**Option 2: Edit YAML Directly**

1. Edit files in `packs-source/`
2. Compile to LevelDB: `npm run packs:compile`
3. Test in Foundry (F5 to refresh)

### Submitting Changes

Standard GitHub workflow:

```bash
git checkout -b my-feature-branch
git add packs-source/
git commit -m "Description of changes"
git push origin my-feature-branch
```

Open a PR on GitHub with a description of your changes.

### Common Workflows

**Adding/Editing Content:**
- Unlock compendium → Edit in Foundry → `npm run packs:extract [pack]` → Commit
- May need to quit Foundry to avoid lock issues

**Bulk YAML Edits:**
- Edit files in `packs-source/` → `npm run packs:compile` → Test → Commit
- Restart Foundry to ensure changes load

### Architecture

YAML source (`packs-source/`) is committed to git. LevelDB (`packs/`) is gitignored and generated at build time.

### Advanced: Scraping Content

For bulk imports from online sources:

```bash
cd tools/scrapers
node powers-scraper.mjs --list ../data/power-urls.txt
node feats-scraper.mjs --list ../data/feat-urls.txt
cd ../..
npm run packs:compile
```

### Documentation

- [tools/README.md](tools/README.md) - Tools and scrapers documentation
- [tools/docs/IMPORT-GUIDE.md](tools/docs/IMPORT-GUIDE.md) - Complete import workflow

## Release Process

This module uses GitHub Actions for automated releases. Anytime the module version is updated in `module.json` and pushed to the `main` branch, a new release is created.

### Legal Note:

"This module uses trademarks and/or copyrights owned by Paizo Inc., used under Paizo's Community Use Policy (paizo.com/communityuse). We are expressly prohibited from charging you to use or access this content. This module is not published, endorsed, or specifically approved by Paizo. For more information about Paizo Inc. and Paizo products, visit paizo.com."

"This module references Psionics, a product of Dreamscarred Press, which is used under the Open Game License v1.0a. To the best of our knowledge, 'Psionics' is not a registered trademark."

"This module is not published, endorsed or specifically approved by Dreamscarred Press. For more information about Dreamscarred Press, visit dreamscarred.com. To the best of our knowledge, this module operates within Dreamscarred Press' OGL Product Identity statement, and all efforts were made to attemt to reach Dreamscarred Press for interpretation, although said efforts were met with unresponsiveness. If a Dreamscarred Press representative is reading this note and believes that the content should be removed from this module, please contact us using the contact information from this module's [module.json](https://github.com/SoxMax/pf1-psionics/blob/main/module.json) file."
