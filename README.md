
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

## For Developers: Setting Up a Local Development Environment

If you're comfortable with Git and want to make more extensive changes, you can set up a full development environment by checking out this repository directly into your Foundry modules directory.

### Step 1: Find Your Foundry User Data Directory

First, locate your Foundry VTT user data directory:

- **Windows**: `%localappdata%/FoundryVTT/Data/modules/`
- **macOS**: `~/Library/Application Support/FoundryVTT/Data/modules/`
- **Linux**: `~/.local/share/FoundryVTT/Data/modules/` or `~/FoundryVTT/Data/modules/`

You can also find this in Foundry VTT:
1. Launch Foundry
2. Go to **Configuration** tab
3. Look for **User Data Path**
4. Navigate to the `Data/modules/` subdirectory

### Step 2: Check Out the Repository

Open a terminal in your Foundry modules directory and clone the repository:

```bash
cd /path/to/FoundryVTT/Data/modules/
git clone https://github.com/SoxMax/pf1-psionics.git
cd pf1-psionics
```

If you plan to submit a pull request, fork the repository first and clone your fork:

```bash
cd /path/to/FoundryVTT/Data/modules/
git clone https://github.com/YOUR-USERNAME/pf1-psionics.git
cd pf1-psionics
```

### Step 3: Install Dependencies and Compile

The module stores compendium data as human-readable YAML files in `packs-source/` but Foundry needs them compiled to LevelDB format in `packs/`.

```bash
# Install Node.js dependencies
npm install

# Compile the YAML source files to LevelDB
npm run packs:compile
```

**Important**: The `packs/` folder is gitignored. You must run `npm run packs:compile` after checking out the repository to generate the actual compendium databases that Foundry can read.

### Step 4: Enable the Module in Foundry

1. **Restart Foundry VTT** (or return to setup if already running)
2. Create or open a world
3. Go to **Game Settings → Manage Modules**
4. Find and enable **Psionics for PF1e**
5. Save and launch your world

The module should now be running from your local development checkout!

## Editing Content

You can edit compendium content in two ways:

### Method 1: Edit in Foundry (Recommended)

This is the easiest way to make changes and test them immediately.

1. **Unlock the Compendium for Editing:**
   - In Foundry's sidebar, **right-click** on the compendium you want to edit
   - Select **"Toggle Edit Lock"** (or **"Unlock Compendium"**)
   - The padlock icon should change to indicate it's unlocked

2. **Make Your Edits:**
   - Open the compendium as normal
   - **Edit existing items**: Click on any item to open and edit it
   - **Add new items**: Click **"Create Item"** button at the top
   - **Organize with folders**: Click **"Create Folder"** button at the top
   - Use Foundry's built-in editor to make your changes
   - Changes are automatically saved

3. **Test Your Changes:**
   - Drag items to a test actor to verify they work correctly
   - Test formulas, rolls, and automation features
   - Make sure everything functions as expected

4. **Extract Your Changes:**
   ```bash
   # Extract ALL compendiums to YAML
   npm run packs:extract
   
   # Or extract specific compendiums
   npm run packs:extract powers    # Just powers
   npm run packs:extract feats     # Just feats
   npm run packs:extract classes   # Just classes
   npm run packs:extract races     # Just races
   npm run packs:extract rules     # Just rules
   ```

5. **Review What Changed:**
   ```bash
   git status                 # See which files were modified
   git diff packs-source/     # Review the actual changes
   ```

### Method 2: Edit YAML Files Directly

If you prefer to edit the source files directly (useful for bulk changes or if you're comfortable with YAML):

1. **Edit YAML Files:**
   - Navigate to `packs-source/` directory
   - Find the compendium folder you want to edit
   - Edit the `.yaml` files directly in your text editor
   - YAML structure follows Foundry's document format

2. **Compile Your Changes:**
   ```bash
   npm run packs:compile
   ```

3. **Test in Foundry:**
   - Refresh Foundry (F5) or restart it
   - Open the compendium and verify your changes
   - Test functionality

4. **Repeat as Needed:**
   - Edit YAML → Compile → Test → Repeat

**Note**: When editing YAML directly, be careful with:
- Indentation (use spaces, not tabs)
- YAML syntax (colons, dashes, quotes)
- Required fields for each document type

## Submitting Your Changes

Once you've made and tested your changes:

1. **Create a branch for your changes:**
   ```bash
   git checkout -b my-feature-branch
   ```

2. **Commit your changes:**
   ```bash
   git add packs-source/
   git commit -m "Description of your changes"
   ```

3. **Push to your fork:**
   ```bash
   git push origin my-feature-branch
   ```

4. **Create a Pull Request:**
   - Go to GitHub and create a PR from your branch
   - Describe what you changed and why
   - Wait for review and feedback

## Common Workflows

### Adding a New Power

1. Unlock the **Psionic Powers** compendium
2. Click **"Create Item"** at the top
3. Fill in the power details:
   - Name, level, discipline
   - Description and mechanics  
   - Augmentations (if any)
   - Actions and formulas
4. Test the power on an actor
5. Extract: `npm run packs:extract powers`
6. Commit and submit

### Fixing a Typo or Error

1. Unlock the relevant compendium
2. Find and open the item
3. Make your correction
4. Extract: `npm run packs:extract [compendium-name]`
5. Review: `git diff packs-source/`
6. Commit and submit

### Adding Missing Class Features

1. Unlock the **Psionic Classes** compendium
2. Find and open the class item
3. Add the missing features/abilities
4. Test by adding the class to an actor
5. Extract: `npm run packs:extract classes`
6. Commit and submit

### Bulk Editing (Advanced)

1. Extract current data: `npm run packs:extract`
2. Edit multiple YAML files in `packs-source/`
3. Compile: `npm run packs:compile`
4. Test in Foundry (F5 to refresh)
5. If issues found, edit YAML and recompile
6. When satisfied, commit the YAML changes

## For Developers

### Technical Setup

This module uses a YAML-based workflow for compendium management, matching the approach used by the official PF1 system.

```bash
# Install dependencies
npm install

# Extract compendiums from LevelDB to YAML
npm run packs:extract

# Compile YAML source to LevelDB
npm run packs:compile
```

### Workflow Details

The module stores human-readable YAML source files in `packs-source/` and compiles them to LevelDB format in `packs/`.

- **Source files** (`packs-source/`) are committed to git
- **Compiled files** (`packs/`) are gitignored and generated at build time

**Editing in Foundry:**
1. Make changes in Foundry's UI
2. Run `npm run packs:extract [compendium-name]`
3. Commit the YAML files in `packs-source/`

**Editing YAML directly:**
1. Edit files in `packs-source/`
2. Run `npm run packs:compile`
3. Restart Foundry to test

### Advanced: Scraping Content

For bulk imports from online sources:

```bash
cd tools/scrapers

# Scrape powers from metzo.miraheze.org
node powers-scraper.mjs --list ../data/power-urls.txt

# Scrape feats
node feats-scraper.mjs --list ../data/feat-urls.txt

# Return to root and compile
cd ../..
npm run packs:compile
```

### Documentation

For more technical details:
- [tools/README.md](tools/README.md) - Tools documentation
- [tools/docs/IMPORT-GUIDE.md](tools/docs/IMPORT-GUIDE.md) - Complete import workflow
- [docs/manifester-items.md](docs/manifester-items.md) - New Manifester Item system
- [docs/manifester-quick-start.md](docs/manifester-quick-start.md) - Quick reference for Manifester Items

## Release Process

This module uses GitHub Actions for automated releases. Anytime the module version is updated in `module.json` and pushed to the `main` branch, a new release is created.

### Legal Note:

"This module uses trademarks and/or copyrights owned by Paizo Inc., used under Paizo's Community Use Policy (paizo.com/communityuse). We are expressly prohibited from charging you to use or access this content. This module is not published, endorsed, or specifically approved by Paizo. For more information about Paizo Inc. and Paizo products, visit paizo.com."

"This module references Psionics, a product of Dreamscarred Press, which is used under the Open Game License v1.0a. To the best of our knowledge, 'Psionics' is not a registered trademark."

"This module is not published, endorsed or specifically approved by Dreamscarred Press. For more information about Dreamscarred Press, visit dreamscarred.com. To the best of our knowledge, this module operates within Dreamscarred Press' OGL Product Identity statement, and all efforts were made to attemt to reach Dreamscarred Press for interpretation, although said efforts were met with unresponsiveness. If a Dreamscarred Press representative is reading this note and believes that the content should be removed from this module, please contact us using the contact information from this module's [module.json](https://github.com/SoxMax/pf1-psionics/blob/main/module.json) file."
