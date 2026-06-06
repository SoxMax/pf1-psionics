Create a new data migration for the specified version.

The version should be provided as the argument (e.g., `/add-migration 0.9.0`).

Steps:
1. Read `docs/migration-system.md` for the migration architecture
2. Read `scripts/migrations/registry.mjs` to see the current migration registry
3. Read the most recent migration file in `scripts/migrations/` as a template
4. Create a new migration file at `scripts/migrations/v$ARGUMENTS.mjs` following the established patterns:
   - Export an async function named `migrateToVersionX_Y_Z` (where X_Y_Z matches the version)
   - Include GM-only check: `if (game.users.activeGM !== game.user) return;`
   - Make the migration idempotent (safe to run multiple times)
   - Use batch updates (single `update()` call per document)
   - Log progress with `console.log("pf1-psionics | ...")`
5. Register the migration in `scripts/migrations/registry.mjs`
6. Export it from `scripts/migrations/_module.mjs`
7. Create a test file at `test/migrations/v$ARGUMENTS.test.mjs` following existing test patterns
8. Run `npm test` to verify tests pass
9. Run `npm run lint` to verify code style