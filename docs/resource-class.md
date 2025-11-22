# The `Resource` Class in Pathfinder 1e System

## Overview

The `Resource` class is a utility for managing resource pools (such as ki, arcane pool, grit, etc.) on actor items in the Pathfinder 1e Foundry VTT system. It provides a standardized interface to access, modify, and track resource values associated with items (feats, class features, etc.) that have expendable uses.

## Location

`module/documents/actor/components/resource.mjs`

## Key Features

- **Encapsulates an item** that represents a resource pool.
- **Provides accessors** for current value (`value`), maximum value (`max`), and the resource's tag (`tag`).
- **Allows modification** of the resource value via the `add(value)` method.
- **Links back to the item** for advanced operations.

## API

### Constructor

```js
const resource = new Resource(item);
```
- `item`: The item document representing the resource pool (must have `charges` and `maxCharges`).

### Properties

- `resource.value`: Current number of charges/uses.
- `resource.max`: Maximum number of charges/uses.
- `resource.tag`: The unique tag for this resource (from the item).
- `resource.item`: The underlying item document.
- `resource.id`: The item ID.

### Methods

- `async resource.add(amount)`
    - Adds (or subtracts, if negative) charges to the resource. Returns a promise resolving to the updated item.

## Usage Example

```js
// Get a resource from an actor by tag
const resource = actor.system.resources["kiPool"];

// Check current value
console.log(resource.value, "/", resource.max);

// Spend a point
await resource.add(-1);

// Refill the pool
await resource.add(resource.max - resource.value);
```

## Integration

- Resources are automatically created for items with charges via `ActorPF#updateItemResources`.
- The system tracks all resources in `actor.system.resources` by their tag.
- Use the `Resource` class to interact with any expendable pool, including custom ones added by modules.

## Integration with the Spells System

The `Resource` class is a core part of how the Pathfinder 1e system manages expendable spellcasting resources, including spell slots, spell points, and custom pools used by various classes and features.

### Spell Slots and Spellcasting

- **Spell slots** for prepared and spontaneous casters are tracked as part of the actor's spellbook data, but the underlying expendable resource logic is similar to other pools.
- When a spell is cast, the system checks the relevant spell slot resource (by level and domain, if applicable) and decrements it. This is handled in the spellbook logic within `ActorPF`, but the same resource management principles apply.
- For classes or features that use expendable points (such as the Magus's arcane pool or a custom spell point system), these are implemented as items with charges, and are managed using the `Resource` class.

#### Example: Spell Slot Usage

When a spell is cast, the system:
1. Determines the required slot or pool (e.g., 2nd-level spell slot, domain slot, or spell points).
2. Checks if the actor has enough available in the relevant resource.
3. Deducts the cost by updating the resource (slot or pool) value.
4. Prevents casting if the resource is insufficient.

```js
// Example: Spend a spell slot or custom pool to cast a spell
const spellLevel = 2;
const spellbook = actor.system.attributes.spells.spellbooks["wizard"];
if (spellbook.levels[spellLevel].remaining > 0) {
  spellbook.levels[spellLevel].remaining -= 1;
  // Proceed with spell casting
}
```

### Spell Points and Custom Resource Pools

- Some classes (or modules) use a spell point system or other expendable pools (e.g., arcane pool, ki pool) to cast spells or activate abilities.
- These pools are represented as items with charges, and are managed using the `Resource` class.
- When a spell or ability requires spending points from such a pool, the system accesses the relevant `Resource` (e.g., `actor.system.resources["arcanePool"]`) and calls `add(-cost)` to deduct the required amount.

#### Example: Spending Spell Points

```js
// Spend 1 spell point to cast a spell
const spellPoints = actor.system.resources["spellPoints"];
if (spellPoints.value > 0) {
  await spellPoints.add(-1);
  // Proceed with spell casting
}
```

### Automatic Resource Management

- The system automatically creates and updates resources for spellcasting items via `ActorPF#updateItemResources`.
- When a spell is prepared, cast, or a feature is used, the appropriate resource is checked and updated, ensuring actors cannot exceed their available uses.
- The `Resource` class provides a unified interface for all expendable pools, so modules and macros can interact with spell slots, spell points, and custom resources in the same way.

### Advanced Integration and Customization

- **Custom spellcasting mechanics** (such as alternate magic systems or new resource types) can be implemented by creating new items with charges and registering them as resources.
- Modules can add new resource pools to actors, and use the `Resource` class to check, spend, and refill these pools.
- The system supports linking resources to specific items, so features or spells can consume from the correct pool (e.g., a feat that costs both a spell slot and a custom resource).
- The resource logic is extensible, allowing for additional checks (such as minimum ability scores, special conditions, or multi-resource costs) to be implemented in modules.

#### Example: Multi-Resource Cost

```js
// Spend both a spell slot and a custom pool to cast a special spell
const spellLevel = 3;
const spellbook = actor.system.attributes.spells.spellbooks["wizard"];
const customPool = actor.system.resources["myCustomPool"];
if (spellbook.levels[spellLevel].remaining > 0 && customPool.value >= 2) {
  spellbook.levels[spellLevel].remaining -= 1;
  await customPool.add(-2);
  // Proceed with spell casting
}
```

### Summary

The `Resource` class is the foundation for all expendable resource management in the system, including spell slots, spell points, and custom pools. It ensures consistent, extensible, and robust handling of resource costs for spells, abilities, and features, and provides a simple API for modules to build on.

## Extending

Modules can leverage the `Resource` class to:
- Add new resource pools to actors.
- Check and spend points from custom pools.
- Integrate new costs into item/feat/class feature usage.

## See Also
- `ActorPF#updateItemResources`
- Item data model for `charges`, `maxCharges`, and `tag`
