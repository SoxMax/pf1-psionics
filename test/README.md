# Test Suite

This directory contains unit tests for the pf1-psionics module.

**Status:** ✅ 38 tests, all passing  
**Coverage:** PowerModel migrations, v0.7.0 implementation, data integrity, error recovery

## Running Tests

### All Tests

Run all test suites:

```bash
npm test
```

Output shows results for each suite with pass/fail counts:
```
✅ PowerModel Migrations: 7/7 passed
✅ v0.7.0 Migration Implementation: 8/8 passed
✅ Data Integrity & Edge Cases: 13/13 passed
✅ Error Recovery & Rollback: 10/10 passed

Total: 38 passed, 0 failed (38 tests)
```

### Run Specific Test Suite

Run tests for a specific suite:

```bash
# PowerModel core tests
node migrations/power-model.test.mjs

# v0.7.0 migration tests
node migrations/v0.7.0.test.mjs

# Data integrity tests
node migrations/data-integrity.test.mjs

# Error recovery tests
node migrations/error-recovery.test.mjs
```

This is useful for:
- CI/CD pipelines
- Pre-commit hooks
- Quick feedback during development
- Debugging specific test failures

### In Foundry (Quench)

1. Install the [Quench](https://github.com/schultzcole/FVTT-Quench) module
2. Enable Quench in Foundry
3. Tests will automatically register under "PF1 Psionics: Migrations"
4. Run tests through the Quench UI

## Test Structure

```
test/
├── runner.mjs                      # Top-level test runner (runs all suites)
├── README.md                       # This file
└── migrations/
    ├── power-model.test.mjs        # PowerModel core functionality tests (3 tests)
    ├── v0.7.0.test.mjs            # v0.7.0 implementation tests (8 tests)
    ├── data-integrity.test.mjs     # Data integrity tests (13 tests)
    ├── error-recovery.test.mjs     # Error recovery tests (10 tests)
    ├── test-helpers.mjs            # Foundry mocks for Node.js
    └── test-runner.mjs             # Legacy migration-specific runner
```

## Test Suites Overview

### 1. PowerModel Core (3 tests)
Tests the `PowerModel.migrateData()` method:
- Basic augment migration logic
- Handling missing/empty augments
- Preserving existing action augments

**File:** `migrations/power-model.test.mjs`

### 2. v0.7.0 Migration Implementation (8 tests)
Tests the actual v0.7.0 migration logic:
- Update object construction
- Multiple augment handling
- Deep cloning verification
- Mixed action arrays
- Metadata preservation

**File:** `migrations/v0.7.0.test.mjs`

### 3. Data Integrity & Edge Cases (13 tests)
Tests handling of malformed/unusual data:
- Non-array augments
- Null/undefined values
- Missing critical fields
- Extra/unknown fields
- Special characters and unicode
- Various numeric types
- Empty arrays and structures

**File:** `migrations/data-integrity.test.mjs`

### 4. Error Recovery & Rollback (10 tests)
Tests failure scenarios and recovery:
- Incomplete migration detection
- Migration idempotency (safe to re-run)
- Partial failure recovery
- Duplicate detection
- Validation logic
- Orphaned data cleanup

**File:** `migrations/error-recovery.test.mjs`

## Adding New Test Suites

### Quick Start

1. Create a new directory under `test/` (e.g., `test/helpers/`)
2. Create test file: `helpers.test.mjs`
3. Create test functions following the pattern:

```javascript
export function testMyFeature() {
  const tests = [];

  tests.push({
    name: "Feature X works correctly",
    fn: () => {
      // Your test logic
      if (!expectedCondition) {
        throw new Error("Descriptive error message");
      }
    }
  });

  return tests;
}

export function runAllTests() {
  const allTests = [
    ...testMyFeature()
  ];

  let passed = 0, failed = 0;
  
  for (const test of allTests) {
    try {
      test.fn();
      console.log(`✅ PASS: ${test.name}`);
      passed++;
    } catch (error) {
      console.error(`❌ FAIL: ${test.name}`);
      console.error(`   ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  return { passed, failed, total: allTests.length };
}
```

4. Register in `test/runner.mjs`:

```javascript
const newTests = await import(resolve(__dirname, "./helpers/helpers.test.mjs"));

const TEST_SUITES = [
  // ... existing suites ...
  {
    name: "Helpers",
    runTests: newTests.runAllTests
  },
];
```

5. Run tests:

```bash
npm test
```

## Writing New Tests

### Test Structure

Every test should follow this pattern:

```javascript
tests.push({
  name: "Clear description of what is tested",
  fn: () => {
    // Setup
    const input = { /* test data */ };
    
    // Execute
    const result = PowerModel.migrateData(input);
    
    // Verify
    if (result.actions.length !== expectedLength) {
      throw new Error("Expected X but got Y");
    }
  }
});
```

### Good Test Names

✅ Descriptive: `"Handles non-array augments gracefully"`  
✅ Specific: `"Deep clones augments (not references)"`  
✅ Tests one thing: `"Preserves augment _id fields exactly"`

❌ Vague: `"Test augments"`  
❌ Too long: `"Tests that when you have augments and you call migrateData it should..."`  
❌ Multiple things: `"Migrates augments and removes old field"`

### Error Messages

Make error messages actionable:

✅ `"Expected augments to be deep cloned, not referenced"`  
✅ `"Action 1 should have augments after migration"`  
✅ `"Should detect incomplete migration"`

❌ `"Test failed"`  
❌ `"Expected X"`  
❌ `"Assertion error"`

## Mocking Foundry APIs

The `test-helpers.mjs` file provides mocks for running tests in Node.js:

**Available Mocks:**
- `foundry.utils.deepClone()` - Deep clones objects
- `foundry.abstract.TypeDataModel` - Base class for data models

**Using Mocks:**

```javascript
// Automatically setup when test runner starts
const { setupMocks, teardownMocks } = await import("./test-helpers.mjs");
setupMocks();

// Now foundry APIs are available
const cloned = foundry.utils.deepClone(obj);
```

To add new mocks, edit `test-helpers.mjs`:

```javascript
export const mockFoundry = {
  utils: {
    deepClone: (obj) => { /* ... */ },
    // Add new mocks here
  }
};
```

## Documentation

For detailed information about tests, see documentation:
- **COMPLETE-TEST-REFERENCE.md** - Catalog of all 38 tests
- **TEST-IMPROVEMENTS-SUMMARY.md** - What was improved and why
- **TEST-REVIEW-AND-IMPROVEMENTS.md** - Detailed analysis and recommendations

