# Migration System

This document describes the version-tracked migration system used by the pf1-psionics module to handle data structure changes between module versions.

## Overview

The migration system ensures that user data (actors, items, flags, settings) is automatically updated when the module version changes. This prevents breaking changes and maintains compatibility with existing worlds when upgrading the module.

## Architecture

### Core Components

1. **Schema Version Tracking** (`game.settings`)
   - Stores the last successfully applied migration version
   - Key: `pf1-psionics.schemaVersion`
   - Persists across sessions in the world database

2. **Migration Registry** (`scripts/migrations/registry.mjs`)
   - Central registry of all migration functions
   - Maps version numbers to migration functions
   - Executes migrations in version order

3. **Migration Runner** (`scripts/migrations/runner.mjs`)
   - Compares stored version vs. current module version
   - Determines which migrations need to run
   - Executes migrations sequentially
   - Updates stored version on success

4. **Individual Migration Files** (`scripts/migrations/`)
   - Each major version change gets its own migration file
   - Contains specific data transformations
   - Can target actors, items, settings, or other data

## How It Works

### On Module Load (Ready Hook)

```
1. Check stored schemaVersion (e.g., "0.2.0")
2. Compare to current module version (e.g., "0.3.1")
3. If newer:
   a. Find all migrations between 0.2.0 and 0.3.1
   b. Run each migration in order (0.2.1, 0.3.0, 0.3.1)
   c. Update schemaVersion to "0.3.1"
4. If same or older: skip migrations
```

### Migration Function Structure

Each migration function follows this pattern:

```javascript
/**
 * Migration for version X.Y.Z
 * Description of what this migration does
 */
export async function migrateToVersionXYZ() {
    console.log("pf1-psionics | Running migration to X.Y.Z");

    // Migrate actors
    for (const actor of game.actors.contents) {
        if (!isValidActor(actor)) continue;
        await migrateActor(actor);
    }

    // Migrate items in compendia
    for (const pack of game.packs) {
        if (pack.metadata.packageName !== "pf1-psionics") continue;
        await migratePack(pack);
    }

    // Migrate settings if needed
    // ...

    console.log("pf1-psionics | Migration to X.Y.Z complete");
}

async function migrateActor(actor) {
    const updates = {};

    // Example: Add new flag
    if (!actor.getFlag("pf1-psionics", "newFeature")) {
        updates["flags.pf1-psionics.newFeature"] = defaultValue;
    }

    // Example: Rename flag
    const oldValue = actor.getFlag("pf1-psionics", "oldName");
    if (oldValue !== undefined) {
        updates["flags.pf1-psionics.newName"] = oldValue;
        updates["flags.pf1-psionics.-=oldName"] = null;
    }

    if (Object.keys(updates).length > 0) {
        await actor.update(updates);
    }
}
```

## Version Comparison

The system uses Foundry's built-in `foundry.utils.isNewerVersion()` to compare semantic versions:

- `"0.3.1"` is newer than `"0.3.0"`
- `"1.0.0"` is newer than `"0.9.9"`
- `"0.3.0-beta"` is older than `"0.3.0"`

## Migration Best Practices

### 1. Idempotency
Migrations should be idempotent (safe to run multiple times):

```javascript
// BAD: Assumes flag doesn't exist
await actor.setFlag("pf1-psionics", "powerPoints", { current: 0 });

// GOOD: Check first
if (!actor.getFlag("pf1-psionics", "powerPoints")) {
    await actor.setFlag("pf1-psionics", "powerPoints", { current: 0 });
}
```

### 2. Batch Updates
Use a single `update()` call per document to minimize database writes:

```javascript
// BAD: Multiple database writes
await actor.setFlag("pf1-psionics", "flag1", value1);
await actor.setFlag("pf1-psionics", "flag2", value2);

// GOOD: Single update
await actor.update({
    "flags.pf1-psionics.flag1": value1,
    "flags.pf1-psionics.flag2": value2
});
```

### 3. GM-Only Execution
Only the active GM should run migrations to prevent conflicts:

```javascript
if (game.users.activeGM !== game.user) return;
```

### 4. Error Handling
Migrations should catch and log errors without stopping the entire process:

```javascript
try {
    await migrateActor(actor);
} catch (error) {
    console.error(`Failed to migrate actor ${actor.name}:`, error);
    // Continue with next actor
}
```

### 5. Progress Reporting
For large migrations, report progress to the user:

```javascript
ui.notifications.info("Migrating psionic actors...");
// ... run migrations ...
ui.notifications.info("Migration complete!");
```

## File Structure

```
scripts/
└── migrations/
    ├── _module.mjs           # Exports all migration components
    ├── runner.mjs            # Main migration runner
    ├── registry.mjs          # Version -> function mapping
    ├── v0.2.0.mjs           # Migration for v0.2.0
    ├── v0.3.0.mjs           # Migration for v0.3.0
    └── helpers.mjs          # Shared migration utilities
```

## Adding a New Migration

When you need to add a migration for a new version:

1. **Create migration file**: `scripts/migrations/vX.Y.Z.mjs`

```javascript
export async function migrateToVersionXYZ() {
    // Migration logic here
}
```

2. **Register in registry**: Add to `scripts/migrations/registry.mjs`

```javascript
export const MIGRATIONS = {
    "0.2.0": migrateToVersion020,
    "0.3.0": migrateToVersion030,
    "X.Y.Z": migrateToVersionXYZ,  // Add this line
};
```

3. **Update module version**: In `module.json`, update `"version": "X.Y.Z"`

4. **Test migration**:
   - Create test world with old version
   - Upgrade to new version
   - Verify migration runs and data is correct

## Example Migrations

### Adding a New Flag (v0.3.0)

This migration added the `manifesters` flag to all actors:

```javascript
export async function migrateToVersion030() {
    for (const actor of game.actors.contents) {
        if (!isValidActor(actor)) continue;

        if (!actor.getFlag("pf1-psionics", "manifesters")) {
            await actor.setFlag("pf1-psionics", "manifesters", MANIFESTERS);
        }
    }
}
```

### Restructuring Data (v0.4.0 - hypothetical)

Example of migrating from a simple flag to a nested structure:

```javascript
export async function migrateToVersion040() {
    for (const actor of game.actors.contents) {
        const oldPP = actor.getFlag("pf1-psionics", "powerPoints");

        // Old format: { current: 10, temporary: 0 }
        // New format: { current: 10, temporary: 0, maximum: 15, base: 15 }

        if (oldPP && oldPP.maximum === undefined) {
            const updates = {
                "flags.pf1-psionics.powerPoints.maximum": oldPP.current,
                "flags.pf1-psionics.powerPoints.base": oldPP.current
            };
            await actor.update(updates);
        }
    }
}
```

### Migrating Item Data Models

For changes to PowerModel schema:

```javascript
export async function migrateToVersion050() {
    // Migrate world items
    for (const item of game.items.contents) {
        if (item.type !== "pf1-psionics.power") continue;
        await migratePowerItem(item);
    }

    // Migrate actor-owned items
    for (const actor of game.actors.contents) {
        for (const item of actor.items.contents) {
            if (item.type !== "pf1-psionics.power") continue;
            await migratePowerItem(item);
        }
    }

    // Migrate compendium items
    for (const pack of game.packs) {
        if (pack.metadata.type !== "Item") continue;
        if (pack.metadata.packageName !== "pf1-psionics") continue;

        const documents = await pack.getDocuments();
        for (const item of documents) {
            if (item.type !== "pf1-psionics.power") continue;
            await migratePowerItem(item);
        }
    }
}

async function migratePowerItem(item) {
    const updates = {};

    // Example: Rename property
    if (item.system.oldProperty !== undefined) {
        updates["system.newProperty"] = item.system.oldProperty;
        updates["system.-=oldProperty"] = null;
    }

    if (Object.keys(updates).length > 0) {
        await item.update(updates);
    }
}
```

## Troubleshooting

### Migration Not Running

1. Check console for "pf1-psionics | Running migrations from X to Y"
2. Verify you're the active GM
3. Check `game.settings.get("pf1-psionics", "schemaVersion")`
4. Manually reset: `game.settings.set("pf1-psionics", "schemaVersion", "0.0.0")`

### Migration Failed Partway

1. Check console for error messages
2. Identify which actors/items failed
3. Fix manually or patch migration function
4. Re-run by resetting schemaVersion

### Testing Migrations

1. Create backup of test world
2. Install old version of module
3. Create test data (actors with old structure)
4. Upgrade to new version
5. Verify data transformed correctly
6. Check for console errors

## References

- Foundry VTT API: https://foundryvtt.com/api/classes/foundry.abstract.DataModel.html
- PF1 System Migrations: https://gitlab.com/foundryvtt_pathfinder1e/foundryvtt-pathfinder1/-/tree/master/module/migration
- Semantic Versioning: https://semver.org/
