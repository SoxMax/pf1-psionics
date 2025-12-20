# Test Suite

This directory contains tests for the pf1-psionics module using Vitest for unit/migration tests and Quench for in-Foundry integration tests.

**Status:** ✅ 45 Vitest tests passing  
**Frameworks:** Vitest (unit/migrations) + Quench (integration)

## Running Tests

```bash
npm test              # Run all Vitest suites
npm run test:watch    # Watch mode
npm run test:ui       # Vitest UI
npm run test:coverage # Coverage report
```

Quench integration tests run inside Foundry; they are excluded from Vitest and load via `scripts/psionics.mjs` when Quench is enabled.

## Test Structure

```
test/
├── unit/                     # Vitest unit tests
│   └── power-model.test.mjs
├── migrations/               # Vitest migration-focused tests
│   ├── power-model.test.mjs
│   ├── v0.7.0.test.mjs
│   ├── data-integrity.test.mjs
│   └── error-recovery.test.mjs
├── quench/                   # Foundry/Quench integration tests (run in Foundry only)
│   ├── index.mjs
│   └── power-model.test.mjs
├── setup.mjs                 # Vitest global mocks
└── vitest.config.js          # Vitest config
```

## Notes
- Legacy custom runners and helpers (`test/runner.mjs`, `test/migrations/test-runner.mjs`, `test/migrations/test-helpers.mjs`) have been removed in favor of Vitest + `test/setup.mjs`.
- Quench tests remain available for in-Foundry execution and are excluded from Vitest runs.
