# GitHub Actions Release Workflow Design

**Date**: 2025-11-02
**Status**: Design Complete

## Overview

This design establishes a GitHub Actions workflow for automated building and releasing of the pf1-psionics FoundryVTT module. The workflow enables manual release creation with version specification, compendium compilation, linting, and proper FoundryVTT manifest generation for installation and updates.

## Release Trigger

- **Manual trigger** via GitHub Actions UI (workflow_dispatch)
- Developer navigates to Actions tab → Select release workflow → Click "Run workflow"
- **Version input**: User enters semantic version (e.g., "1.2.3") in the UI

## Workflow Stages

### 1. Setup
- Checkout repository code
- Set up Node.js (latest LTS, v20)
- Install npm dependencies (`npm install`)

### 2. Linting
- Install ESLint with JavaScript and TypeScript support
- Create ESLint config supporting:
  - ES modules (.mjs files)
  - Modern JavaScript (ES2022+)
  - Browser + Node environments
  - Future TypeScript conversion support
- Run `eslint scripts/`
- **Fail workflow** if linting errors found
- Warnings shown but don't block release

### 3. Compendium Compilation
- Run `npm run packs:compile`
- Build LevelDB packs from YAML source in packs-source/
- Ensure compiled packs/ directory included in release
- **Fail workflow** if compilation errors occur

### 4. Version Update
- Execute Node.js helper script (.github/scripts/update-manifest.js)
- Update module.json with:
  - `version`: User-provided version number
  - `download`: `https://github.com/OWNER/REPO/releases/download/v{VERSION}/module.zip`
  - `manifest`: `https://github.com/OWNER/REPO/releases/download/v{VERSION}/module.json`
- **Does NOT commit** to repository - only modifies for release assets

### 5. Package Creation
- Create module.zip respecting .gitignore exclusions
- **Include**:
  - scripts/ (all module code)
  - templates/ (Handlebars templates)
  - lang/ (localizations)
  - packs/ (compiled compendiums)
  - module.json (with updated URLs)
  - LICENSE
  - README.md
- **Exclude**:
  - node_modules/
  - .git/
  - packs-source/ (YAML source files)
  - tools/ (scrapers and build tools)
  - .github/

### 6. GitHub Release Creation
- Create release with git tag: `v{VERSION}`
- Attach two assets:
  - `module.zip` - Complete module package
  - `module.json` - Standalone manifest file
- Generate release notes from commits (editable post-creation)

## FoundryVTT Integration

### Installation URL Pattern (Hybrid Approach)

**Initial Installation**:
- Users provide: `https://github.com/OWNER/REPO/releases/latest/download/module.json`
- Always fetches the most recent release

**Update Detection**:
- Installed module.json contains **version-specific URLs**:
  - `manifest`: `.../releases/download/v1.2.3/module.json`
  - `download`: `.../releases/download/v1.2.3/module.zip`
- FoundryVTT compares version numbers to detect updates
- Downloads are stable and version-locked

### Update Flow
1. FoundryVTT checks manifest URL for version number
2. Compares to installed version
3. If newer version available, offers update
4. Downloads version-specific zip file
5. Installs updated module

## Files to Create

### `.github/workflows/release.yml`
- Main GitHub Actions workflow
- Defines workflow_dispatch trigger with version input
- Contains all job steps (setup, lint, compile, package, release)

### `.eslintrc.json`
- ESLint configuration
- Supports ES modules and modern JavaScript
- Prepared for future TypeScript support
- Uses `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin`

### `.github/scripts/update-manifest.js`
- Node.js helper script
- Reads module.json
- Updates version, download, and manifest fields
- Writes modified module.json (for release only, not committed)

### `package.json` Updates
- Add ESLint dependencies:
  - `eslint`
  - `@typescript-eslint/parser`
  - `@typescript-eslint/eslint-plugin`
- Add npm scripts:
  - `"lint": "eslint scripts/"`
  - `"lint:fix": "eslint scripts/ --fix"`

## Error Handling

### Version Validation
- Workflow validates semantic versioning format (x.y.z)
- Checks if tag already exists to prevent overwrites
- Fails early with clear error messages

### Failed Compilation
- If `npm run packs:compile` fails, workflow stops
- Error logs visible in GitHub Actions output
- No release created with broken compendiums

### Linting Failures
- Workflow fails if ESLint finds errors
- Warnings shown but don't block release
- Developer fixes issues and re-runs workflow

### Duplicate Releases
- If release tag exists, workflow fails by default
- Prevents accidental overwrites

### Partial Failures
- If release succeeds but asset upload fails, manual upload possible
- GitHub Actions shows which step failed for debugging

## Repository Configuration

### GitHub Actions Permissions
- Required: Settings → Actions → General → Workflow permissions
- Set to: "Read and write permissions"
- Allows workflow to create releases and upload assets

### Testing Strategy
- First release should be test version (e.g., 0.0.1-test)
- Verify workflow completes successfully
- Test installation in FoundryVTT
- Delete test release after validation
- Create first production release

## Post-Release Usage

### Release Notes
- GitHub auto-generates notes from commits
- Editable after creation to add:
  - Feature highlights
  - Breaking changes
  - Migration instructions
  - Known issues

### Future Enhancements
Workflow is version-controlled and can be extended with:
- Automated changelog generation
- Discord/Slack notifications
- Pre-release/beta channels
- Automated test execution
- Dependency vulnerability scanning

## Repository URLs

**Placeholder**: Workflow requires actual GitHub username/org and repo name.

These will be set in:
- `.github/scripts/update-manifest.js` (hardcoded URLs)
- Initial module.json `manifest` field (for first-time users)

## Success Criteria

- ✅ Developer can trigger release from GitHub UI
- ✅ Version number is validated and applied correctly
- ✅ Compendiums compile successfully
- ✅ Code passes linting checks
- ✅ Release package contains all necessary files
- ✅ FoundryVTT can install module via manifest URL
- ✅ FoundryVTT detects and installs updates correctly
- ✅ URLs point to version-specific, stable assets
