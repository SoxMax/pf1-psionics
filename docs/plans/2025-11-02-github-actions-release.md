# GitHub Actions Release Workflow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement automated GitHub Actions workflow for building and releasing the pf1-psionics FoundryVTT module with manual trigger, version management, compendium compilation, linting, and FoundryVTT-compatible manifest generation.

**Architecture:** Manual workflow trigger with version input, ESLint validation, compendium compilation, manifest URL updating via helper script, ZIP packaging respecting .gitignore, and GitHub release creation with version-specific and latest-compatible URLs.

**Tech Stack:** GitHub Actions, ESLint (@typescript-eslint for future TS support), Node.js scripts, git

---

## Task 1: ESLint Configuration

**Files:**
- Create: `.worktrees/release-workflow/.eslintrc.json`
- Modify: `.worktrees/release-workflow/package.json`

**Step 1: Create ESLint configuration file**

Create `.worktrees/release-workflow/.eslintrc.json`:

```json
{
  "env": {
    "browser": true,
    "es2022": true,
    "node": true
  },
  "extends": [
    "eslint:recommended"
  ],
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "rules": {
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "no-console": "off",
    "semi": ["error", "always"],
    "quotes": ["error", "double", { "avoidEscape": true }]
  },
  "overrides": [
    {
      "files": ["*.ts", "*.tsx"],
      "parser": "@typescript-eslint/parser",
      "plugins": ["@typescript-eslint"],
      "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended"
      ]
    }
  ]
}
```

**Why:** Configures ESLint for ES modules (.mjs), browser + Node environments, with TypeScript support prepared for future conversion.

**Step 2: Update package.json with ESLint dependencies and scripts**

In `.worktrees/release-workflow/package.json`, add to `devDependencies`:

```json
{
  "devDependencies": {
    "@foundryvtt/foundryvtt-cli": "^1.2.5",
    "eslint": "^8.57.0",
    "@typescript-eslint/parser": "^7.0.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0"
  },
  "scripts": {
    "packs:compile": "fvtt package workon pf1-psionics --type Module packs compile",
    "packs:extract": "fvtt package workon pf1-psionics --type Module packs unpack",
    "lint": "eslint scripts/",
    "lint:fix": "eslint scripts/ --fix"
  }
}
```

**Why:** Adds ESLint and TypeScript parser/plugin for linting. Includes lint scripts for manual use and CI.

**Step 3: Install ESLint dependencies**

Run in worktree:

```bash
cd .worktrees/release-workflow
npm install
```

Expected: Dependencies installed without errors

**Step 4: Test ESLint on existing code**

Run:

```bash
cd .worktrees/release-workflow
npm run lint
```

Expected: May show some linting issues in existing code, that's OK for now. Verify ESLint runs without crashing.

**Step 5: Commit ESLint configuration**

```bash
cd .worktrees/release-workflow
git add .eslintrc.json package.json package-lock.json
git commit -m "feat: add ESLint configuration with TypeScript support"
```

---

## Task 2: Manifest Update Helper Script

**Files:**
- Create: `.worktrees/release-workflow/.github/scripts/update-manifest.js`

**Step 1: Create .github/scripts directory**

```bash
cd .worktrees/release-workflow
mkdir -p .github/scripts
```

**Step 2: Create update-manifest.js script**

Create `.worktrees/release-workflow/.github/scripts/update-manifest.js`:

```javascript
#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Get inputs from environment (set by GitHub Actions)
const version = process.env.VERSION;
const repository = process.env.GITHUB_REPOSITORY; // format: "owner/repo"

if (!version) {
  console.error("ERROR: VERSION environment variable is required");
  process.exit(1);
}

if (!repository) {
  console.error("ERROR: GITHUB_REPOSITORY environment variable is required");
  process.exit(1);
}

// Validate semantic version format
const versionRegex = /^\d+\.\d+\.\d+$/;
if (!versionRegex.test(version)) {
  console.error(`ERROR: Invalid version format: ${version}`);
  console.error("Version must follow semantic versioning (e.g., 1.2.3)");
  process.exit(1);
}

// Read module.json
const manifestPath = path.join(__dirname, "../../module.json");
let manifest;

try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
} catch (error) {
  console.error(`ERROR: Failed to read module.json: ${error.message}`);
  process.exit(1);
}

// Update version and URLs
manifest.version = version;
manifest.manifest = `https://github.com/${repository}/releases/download/v${version}/module.json`;
manifest.download = `https://github.com/${repository}/releases/download/v${version}/module.zip`;

// Write updated module.json
try {
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`✓ Updated module.json to version ${version}`);
  console.log(`  manifest: ${manifest.manifest}`);
  console.log(`  download: ${manifest.download}`);
} catch (error) {
  console.error(`ERROR: Failed to write module.json: ${error.message}`);
  process.exit(1);
}
```

**Why:** This script updates module.json with version-specific URLs for FoundryVTT. Takes version from environment variable set by GitHub Actions.

**Step 3: Make script executable**

```bash
cd .worktrees/release-workflow
chmod +x .github/scripts/update-manifest.js
```

**Step 4: Test the update script locally**

```bash
cd .worktrees/release-workflow
VERSION=0.0.1-test GITHUB_REPOSITORY=SoxMax/pf1-psionics node .github/scripts/update-manifest.js
```

Expected: Output shows updated version and URLs. Check that `module.json` was modified.

**Step 5: Reset module.json after test**

```bash
cd .worktrees/release-workflow
git checkout module.json
```

Expected: module.json restored to original state

**Step 6: Commit update script**

```bash
cd .worktrees/release-workflow
git add .github/scripts/update-manifest.js
git commit -m "feat: add manifest update helper script"
```

---

## Task 3: GitHub Actions Workflow

**Files:**
- Create: `.worktrees/release-workflow/.github/workflows/release.yml`

**Step 1: Create .github/workflows directory**

```bash
cd .worktrees/release-workflow
mkdir -p .github/workflows
```

**Step 2: Create release workflow file**

Create `.worktrees/release-workflow/.github/workflows/release.yml`:

```yaml
name: Create Release

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Release version (e.g., 1.0.0)'
        required: true
        type: string

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Validate version format
        run: |
          if ! echo "${{ inputs.version }}" | grep -qE '^\d+\.\d+\.\d+$'; then
            echo "Error: Version must follow semantic versioning (e.g., 1.2.3)"
            exit 1
          fi
          echo "✓ Version format valid: ${{ inputs.version }}"

      - name: Check if tag exists
        run: |
          if git rev-parse "v${{ inputs.version }}" >/dev/null 2>&1; then
            echo "Error: Tag v${{ inputs.version }} already exists"
            exit 1
          fi
          echo "✓ Tag v${{ inputs.version }} does not exist"

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Compile compendiums
        run: npm run packs:compile

      - name: Update manifest
        env:
          VERSION: ${{ inputs.version }}
          GITHUB_REPOSITORY: ${{ github.repository }}
        run: node .github/scripts/update-manifest.js

      - name: Create module package
        run: |
          # Create clean module directory
          mkdir -p release-temp/pf1-psionics

          # Copy files respecting .gitignore
          rsync -av \
            --exclude='.git' \
            --exclude='node_modules' \
            --exclude='packs-source' \
            --exclude='tools' \
            --exclude='.github' \
            --exclude='.worktrees' \
            --exclude='.idea' \
            --exclude='.vscode' \
            --exclude='*.log' \
            --exclude='.env' \
            --exclude='.eslintcache' \
            --exclude='docs/plans' \
            ./ release-temp/pf1-psionics/

          # Create zip
          cd release-temp
          zip -r ../module.zip pf1-psionics/
          cd ..

          echo "✓ Created module.zip ($(du -h module.zip | cut -f1))"

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          tag_name: v${{ inputs.version }}
          name: Release v${{ inputs.version }}
          draft: false
          prerelease: false
          generate_release_notes: true
          files: |
            module.zip
            module.json
```

**Why:** Defines the complete release workflow with all validation, build, and release steps. Uses workflow_dispatch for manual triggering with version input.

**Step 3: Commit workflow file**

```bash
cd .worktrees/release-workflow
git add .github/workflows/release.yml
git commit -m "feat: add GitHub Actions release workflow"
```

---

## Task 4: Documentation Updates

**Files:**
- Modify: `.worktrees/release-workflow/README.md`

**Step 1: Add release workflow section to README**

Add this section after the "Compendium Workflow" section in `.worktrees/release-workflow/README.md`:

```markdown
## Release Process

This module uses GitHub Actions for automated releases.

### Creating a Release

1. Go to the [Actions tab](https://github.com/SoxMax/pf1-psionics/actions)
2. Select "Create Release" workflow
3. Click "Run workflow"
4. Enter the version number (e.g., `1.0.0`)
5. Click "Run workflow" button

The workflow will:
- Validate version format
- Run ESLint checks
- Compile compendiums
- Update module.json with version-specific URLs
- Create GitHub release with module.zip and module.json

### Installing in FoundryVTT

Users can install this module using:
```
https://github.com/SoxMax/pf1-psionics/releases/latest/download/module.json
```

This URL always points to the most recent release.
```

**Step 2: Commit README updates**

```bash
cd .worktrees/release-workflow
git add README.md
git commit -m "docs: add release process documentation"
```

---

## Task 5: Fix Any Linting Errors

**Files:**
- Potentially modify: Multiple files in `.worktrees/release-workflow/scripts/`

**Step 1: Run lint and identify issues**

```bash
cd .worktrees/release-workflow
npm run lint
```

**Step 2: Fix linting errors automatically where possible**

```bash
cd .worktrees/release-workflow
npm run lint:fix
```

**Step 3: Review and manually fix remaining issues**

Review any remaining linting errors and fix them. Common issues:
- Unused variables (add `_` prefix if intentionally unused)
- Missing semicolons
- Quote style inconsistencies

**Step 4: Verify all linting issues resolved**

```bash
cd .worktrees/release-workflow
npm run lint
```

Expected: No errors (warnings are OK)

**Step 5: Commit linting fixes**

```bash
cd .worktrees/release-workflow
git add scripts/
git commit -m "fix: resolve ESLint errors"
```

**Note:** If no linting errors exist, skip steps 2-5.

---

## Task 6: Verification and Testing

**Files:**
- None (testing phase)

**Step 1: Verify all commits are present**

```bash
cd .worktrees/release-workflow
git log --oneline
```

Expected: See commits for ESLint config, update script, workflow, and docs

**Step 2: Push branch to GitHub**

```bash
cd .worktrees/release-workflow
git push -u origin feature/github-actions-release
```

Expected: Branch pushed successfully

**Step 3: Create Pull Request**

Go to GitHub and create a Pull Request from `feature/github-actions-release` to `main`.

**Step 4: Review PR and merge**

Review the PR, ensure all files are correct, then merge to main.

**Step 5: Test workflow with test release**

After merging to main:
1. Go to Actions tab on GitHub
2. Run "Create Release" workflow
3. Use version: `0.0.1-test`
4. Verify workflow completes successfully
5. Check that GitHub release was created with assets
6. Test installing in FoundryVTT using the manifest URL

**Step 6: Clean up test release**

After successful test:
1. Delete the test release on GitHub
2. Delete the test tag: `git push origin :refs/tags/v0.0.1-test`

---

## Validation Checklist

Before marking complete, verify:

- [ ] ESLint runs without errors on codebase
- [ ] Update manifest script updates module.json correctly
- [ ] GitHub Actions workflow file is valid YAML
- [ ] Workflow has correct permissions (`contents: write`)
- [ ] Version validation regex works correctly
- [ ] Tag existence check prevents overwrites
- [ ] Compendium compilation runs in workflow
- [ ] Module.zip excludes correct files (.gitignore patterns)
- [ ] Release creates with both module.zip and module.json assets
- [ ] README documents release process
- [ ] Test release can be installed in FoundryVTT
- [ ] Manifest and download URLs follow correct pattern

## Success Criteria

1. Developer can trigger release from GitHub UI
2. Version input is validated (semantic versioning)
3. ESLint passes without errors
4. Compendiums compile successfully
5. Module.json updated with correct URLs
6. GitHub release created with tag
7. Release includes module.zip and module.json assets
8. FoundryVTT can install module via manifest URL
9. FoundryVTT detects updates correctly

## Notes for Implementer

- **Repository**: SoxMax/pf1-psionics
- **Current version in module.json**: 0.1.0
- **Work in**: `.worktrees/release-workflow` directory
- **No existing tests**: Skip test running, this module has no test suite
- **Compendium structure**: YAML source in `packs-source/`, compiled to `packs/`
- **YAGNI**: Don't add features not in this plan (pre-release channels, notifications, etc.)
- **Ask before committing**: User requested to confirm before commits

## Reference Skills

- @superpowers:verification-before-completion - MUST verify workflow before claiming done
- @superpowers:finishing-a-development-branch - Use after completion for cleanup
