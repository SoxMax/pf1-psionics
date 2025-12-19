# Test Suite

This directory contains unit tests for the pf1-psionics module.

## Running Tests

### All Tests

Run all test suites:

```bash
npm test
```

### Specific Test Suite

Run only migration tests:

```bash
npm run test:migrations
```

This is useful for:
- CI/CD pipelines
- Pre-commit hooks
- Quick feedback during development

### In Foundry (Quench)

1. Install the [Quench](https://github.com/schultzcole/FVTT-Quench) module
2. Enable Quench in Foundry
3. Tests will automatically register under "PF1 Psionics: Migrations"
4. Run tests through the Quench UI

## Test Structure

```
test/
├── runner.mjs                # Top-level test runner
├── README.md                 # This file
└── migrations/
    ├── migrations.test.mjs   # Migration test definitions
    ├── test-helpers.mjs      # Foundry mocks for Node.js
    └── test-runner.mjs       # Migration-specific runner
```

## Adding New Test Suites

1. Create a new directory under `test/` (e.g., `test/helpers/`)
2. Create test files following the pattern:
   - `*.test.mjs` - Test definitions
   - `test-runner.mjs` - Suite-specific runner (optional)
3. Register the suite in `test/runner.mjs`:

```javascript
const TEST_SUITES = [
  {
    name: "Migrations",
    runTests: migrationTests.runAllTests
  },
  {
    name: "Helpers",  // Your new suite
    runTests: helperTests.runAllTests
  },
];
```

## Writing New Tests

Add new test functions to `migrations.test.mjs`:

```javascript
export function testMyFeature() {
  const tests = [];

  tests.push({
    name: "My test description",
    fn: () => {
      // Test logic
      if (someCondition) {
        throw new Error("Test failed");
      }
    }
  });

  return tests;
}
```

Then add to `runAllTests()`:

```javascript
export function runAllTests() {
  const allTests = [
    ...testPowerModelMigrateData(),
    ...testV070EagerMigration(),
    ...testMyFeature(), // Add your tests here
  ];
  // ...
}
```

## Mocking Foundry APIs

The `test-helpers.mjs` file provides mocks for Foundry APIs when running in Node.js:

- `foundry.utils.deepClone`
- `foundry.abstract.TypeDataModel`

Add more mocks as needed for new tests.
