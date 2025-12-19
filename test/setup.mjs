/**
 * Vitest setup file
 * Mocks Foundry globals for unit testing
 */

import { vi } from 'vitest';

// Mock foundry.utils
global.foundry = {
  utils: {
    deepClone: (obj) => {
      if (obj === null || typeof obj !== "object") return obj;
      if (obj instanceof Date) return new Date(obj.getTime());
      if (obj instanceof Array) return obj.map(item => foundry.utils.deepClone(item));
      if (obj instanceof Object) {
        const clonedObj = {};
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            clonedObj[key] = foundry.utils.deepClone(obj[key]);
          }
        }
        return clonedObj;
      }
    },

    mergeObject: (original, other = {}, {
      insertKeys = true,
      insertValues = true,
      overwrite = true,
      recursive = true,
      inplace = true,
      enforceTypes = false
    } = {}) => {
      other = other || {};
      if (!(original instanceof Object) || !(other instanceof Object)) {
        throw new Error("One of original or other are not Objects!");
      }
      const options = {
        insertKeys,
        insertValues,
        overwrite,
        recursive,
        inplace,
        enforceTypes
      };

      const depth = options.recursive ? null : 0;
      return _mergeObject(original, other, options, depth);
    },

    expandObject: (obj, _d = 0) => {
      if (_d > 10) throw new Error("Maximum depth exceeded");
      const expanded = {};
      for (let [k, v] of Object.entries(obj)) {
        if (v instanceof Object && !Array.isArray(v)) {
          v = foundry.utils.expandObject(v, _d + 1);
        }
        foundry.utils.setProperty(expanded, k, v);
      }
      return expanded;
    },

    flattenObject: (obj, _d = 0) => {
      const flat = {};
      if (_d > 10) throw new Error("Maximum depth exceeded");
      for (let [k, v] of Object.entries(obj)) {
        if (v instanceof Object && !Array.isArray(v)) {
          let inner = foundry.utils.flattenObject(v, _d + 1);
          for (let [ik, iv] of Object.entries(inner)) {
            flat[`${k}.${ik}`] = iv;
          }
        } else {
          flat[k] = v;
        }
      }
      return flat;
    },

    getProperty: (object, key) => {
      if (!key) return undefined;
      let target = object;
      for (let p of key.split('.')) {
        if (target == null) return undefined;
        if (p in target) target = target[p];
        else return undefined;
      }
      return target;
    },

    setProperty: (object, key, value) => {
      if (!key) return false;
      const parts = key.split('.');
      const last = parts.pop();
      let target = object;
      for (let p of parts) {
        if (!(p in target)) target[p] = {};
        target = target[p];
      }
      target[last] = value;
      return true;
    },

    randomID: (length = 16) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }
  },

  abstract: {
    TypeDataModel: class TypeDataModel {
      static SCHEMA_VERSION = 0;

      static defineSchema() {
        return {};
      }

      static migrateData(source) {
        return source;
      }

      static cleanData(source, options) {
        return source;
      }

      static validateJoint(data) {
        // No-op for testing
      }
    }
  }
};

// Helper for mergeObject recursion
function _mergeObject(original, other, options, depth) {
  const result = options.inplace ? original : { ...original };

  for (let key of Object.keys(other)) {
    const val = other[key];

    if (!(key in result) && !options.insertKeys) continue;

    if (depth === 0 || !(val instanceof Object)) {
      if (options.overwrite) {
        result[key] = val;
      }
    } else {
      if (result[key] instanceof Object && val instanceof Object) {
        result[key] = _mergeObject(result[key], val, options, depth === null ? null : depth - 1);
      } else if (options.overwrite) {
        result[key] = val;
      }
    }
  }

  return result;
}

// Mock game global
global.game = {
  i18n: {
    localize: vi.fn((key) => key),
    format: vi.fn((key, data) => key)
  },
  settings: {
    get: vi.fn(),
    set: vi.fn()
  }
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn()
};

