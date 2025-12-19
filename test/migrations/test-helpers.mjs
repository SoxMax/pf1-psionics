/**
 * Mock Foundry utilities for standalone testing
 */

export const mockFoundry = {
  utils: {
    deepClone: (obj) => {
      if (obj === null || typeof obj !== "object") return obj;
      if (obj instanceof Date) return new Date(obj.getTime());
      if (obj instanceof Array) return obj.map(item => mockFoundry.utils.deepClone(item));
      if (obj instanceof Object) {
        const clonedObj = {};
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            clonedObj[key] = mockFoundry.utils.deepClone(obj[key]);
          }
        }
        return clonedObj;
      }
    }
  },
  abstract: {
    TypeDataModel: class TypeDataModel {
      static SCHEMA_VERSION = 0;
      static migrateData(source) {
        return source;
      }
      static defineSchema() {
        return {};
      }
    }
  }
};

/**
 * Setup global mocks for Node.js environment
 * MUST be called before importing any Foundry-dependent modules
 */
export function setupMocks() {
  if (typeof globalThis.foundry === "undefined") {
    globalThis.foundry = mockFoundry;
  }
}

/**
 * Teardown global mocks
 */
export function teardownMocks() {
  if (globalThis.foundry === mockFoundry) {
    delete globalThis.foundry;
  }
}
