# FoundryVTT Module API Pattern

This document describes how to expose a public API from a FoundryVTT module, making functionality accessible to macros, other modules, and the browser console.

## Overview

Foundry modules can expose an API by setting a property on their module object. This is accessed via:

```javascript
const api = game.modules.get("your-module-id").api;
```

This pattern is useful when you want to:
- Provide functions for macros to call
- Allow other modules to integrate with yours
- Expose utility functions for debugging or advanced users
- Create a clean interface for complex operations

## Basic Implementation

### 1. Create Your API Object

Create a file to define your API (e.g., `scripts/api/my-api.mjs`):

```javascript
// scripts/api/my-api.mjs
export const MyAPI = {
  /**
   * Example function exposed via API
   * @param {string} message - Message to display
   */
  sayHello(message) {
    ui.notifications.info(`Hello: ${message}`);
  },

  /**
   * Async operations work too
   * @param {Actor} actor - The actor to modify
   * @returns {Promise<void>}
   */
  async doSomethingAsync(actor) {
    await actor.update({ "system.some.path": 42 });
  }
};
```

### 2. Register the API During Module Ready

In your module's ready hook (e.g., `scripts/hooks/ready.mjs`):

```javascript
import { MODULE_ID } from "../_module.mjs";
import { MyAPI } from "../api/my-api.mjs";

Hooks.once("ready", () => {
  // Get the module object
  const module = game.modules.get(MODULE_ID);
  
  // Attach the API
  module.api = {
    myFeature: MyAPI,
    // You can add multiple APIs here
    anotherFeature: AnotherAPI,
  };
  
  console.log(`${MODULE_ID} | API registered`);
});
```

### 3. Using the API

From macros or the console:

```javascript
// Get the API
const api = game.modules.get("your-module-id").api;

// Call functions
api.myFeature.sayHello("World");

// Async operations
await api.myFeature.doSomethingAsync(actor);
```

## Advanced Patterns

### Helper Classes with Actor Getters

A common pattern is to create helper classes that wrap actor data, then attach them as getters on the Actor prototype:

```javascript
// scripts/helpers/resource-helper.mjs
export class ResourceHelper {
  constructor(actor) {
    this.actor = actor;
  }

  get current() {
    return this.actor.getFlag("my-module", "resource.current") ?? 0;
  }

  async spend(amount) {
    const newValue = Math.max(0, this.current - amount);
    await this.actor.setFlag("my-module", "resource.current", newValue);
  }
}

// In ready hook:
Object.defineProperty(pf1.documents.actor.ActorPF.prototype, "myResource", {
  get() {
    return new ResourceHelper(this);
  },
  configurable: true
});
```

Now you can use it naturally:

```javascript
// Direct actor access
await actor.myResource.spend(5);
console.log(actor.myResource.current);
```

#### ⚠️ Risks of Modifying Prototypes

Adding properties to system prototypes carries risks:

1. **Name Collisions** - The system may add a property with the same name in a future update
2. **Module Conflicts** - Another module might use the same property name
3. **Upgrade Breakage** - System refactoring could change the class hierarchy

**Mitigation strategies:**

1. **Use a namespaced property name** - Prefix with your module ID:
   ```javascript
   // Instead of "powerPoints", use "pf1PsionicsPowerPoints" or access via namespace
   Object.defineProperty(ActorPF.prototype, "pf1Psionics", {
     get() {
       return {
         powerPoints: new PowerPointsHelper(this),
         focus: new PsionicFocusHelper(this)
       };
     },
     configurable: true
   });
   
   // Usage: actor.pf1Psionics.powerPoints.spend(5)
   ```

2. **Check for existing properties before defining:**
   ```javascript
   if (!("myResource" in ActorPF.prototype)) {
     Object.defineProperty(ActorPF.prototype, "myResource", { ... });
   } else {
     console.warn("my-module | Property 'myResource' already exists on ActorPF");
   }
   ```

3. **Prefer the static API for critical functionality** - The API pattern (`game.modules.get("my-module").api`) is always safe since you control the namespace entirely.

4. **Document the property name in your module** so users and other developers know it's in use.

For pf1-psionics, we use `actor.psionics` as a namespace object containing `powerPoints` and `focus` helpers. This reduces collision risk while keeping a clean API. The static API (`game.modules.get("pf1-psionics").api`) is the guaranteed-stable interface.

### Static API + Helper Pattern

Combine both patterns for maximum flexibility:

```javascript
// Static API for macros (works with actor ID or document)
export const ResourceAPI = {
  get(actorOrId) {
    const actor = typeof actorOrId === "string" 
      ? game.actors.get(actorOrId) 
      : actorOrId;
    return new ResourceHelper(actor);
  },

  async spend(actorOrId, amount) {
    return this.get(actorOrId).spend(amount);
  }
};

// Register both
module.api = {
  resource: ResourceAPI,
  ResourceHelper, // Export class for advanced use
};
```

Usage:

```javascript
// Via API (good for macros)
const api = game.modules.get("my-module").api;
await api.resource.spend(actor, 5);
await api.resource.spend("actorId123", 5); // Works with ID too

// Via actor (good for code)
await actor.myResource.spend(5);

// Create custom helper instance
const helper = new api.ResourceHelper(actor);
```

## Best Practices

### 1. Validate Inputs

Always validate that required parameters exist:

```javascript
get(actorOrId) {
  const actor = typeof actorOrId === "string"
    ? game.actors.get(actorOrId)
    : actorOrId;
  if (!actor) {
    throw new Error(`my-module | API.get: Actor not found`);
  }
  return new ResourceHelper(actor);
}
```

### 2. Document Your API

Use JSDoc comments so users get autocomplete hints:

```javascript
/**
 * Spend resource points from an actor
 * @param {Actor|string} actorOrId - Actor document or actor ID
 * @param {number} amount - Amount to spend
 * @returns {Promise<boolean>} True if successful, false if insufficient
 */
async spend(actorOrId, amount) {
  // ...
}
```

### 3. Return Meaningful Values

Return useful information so callers can react:

```javascript
async spend(amount) {
  if (!this.canSpend(amount)) {
    return false; // Caller can show error message
  }
  await this._deductPoints(amount);
  return true;
}
```

### 4. Keep API Stable

Once published, avoid breaking changes to your API. Add new methods rather than changing existing signatures.

### 5. Use Namespacing

Group related functions:

```javascript
module.api = {
  powerPoints: PowerPointsAPI,
  focus: FocusAPI,
  utils: UtilsAPI,
};
```

## Checking if a Module API Exists

When depending on another module's API:

```javascript
const otherModule = game.modules.get("other-module");
if (otherModule?.active && otherModule.api) {
  // Safe to use
  otherModule.api.doSomething();
} else {
  console.warn("other-module API not available");
}
```

## Debugging

You can explore any module's API in the browser console:

```javascript
// See what's available
console.log(game.modules.get("pf1-psionics").api);

// Test functions
const api = game.modules.get("pf1-psionics").api;
api.powerPoints.getAvailable(game.actors.getName("My Character"));
```

## File Structure Example

```
scripts/
├── api/
│   ├── _module.mjs          # Exports all APIs
│   ├── power-points-api.mjs # Static API object
│   └── focus-api.mjs        # Another static API
├── helpers/
│   ├── _module.mjs          # Exports all helpers
│   ├── power-points-helper.mjs # Helper class
│   └── focus-helper.mjs     # Another helper
└── hooks/
    └── ready.mjs            # Registers API on module
```

