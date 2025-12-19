/**
 * Vitest unit tests for PowerModel migrations
 * These tests run in Node.js without Foundry
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PowerModel } from '../../scripts/dataModels/item/power-model.mjs';

describe('PowerModel.migrateData', () => {
  describe('Basic augment migration', () => {
    it('should migrate power-level augments to actions', () => {
      const source = {
        augments: [
          {
            _id: 'test_augment_1',
            name: 'Test Augment',
            cost: 2,
            effects: { damageBonus: '2d6' }
          }
        ],
        actions: [
          {
            _id: 'action_1',
            name: 'Test Action',
            actionType: 'rsak'
          },
          {
            _id: 'action_2',
            name: 'Second Action',
            actionType: 'save'
          }
        ]
      };

      const result = PowerModel.migrateData(source);

      expect(result.augments).toBeUndefined();
      expect(result.actions[0].augments).toHaveLength(1);
      expect(result.actions[1].augments).toHaveLength(1);
      expect(result.actions[0].augments[0].name).toBe('Test Augment');
    });

    it('should deep clone augments to each action', () => {
      const source = {
        augments: [{ _id: 'aug1', name: 'Augment' }],
        actions: [
          { _id: 'act1', name: 'Action 1' },
          { _id: 'act2', name: 'Action 2' }
        ]
      };

      const result = PowerModel.migrateData(source);

      // Augments should be different objects
      expect(result.actions[0].augments).not.toBe(result.actions[1].augments);
      expect(result.actions[0].augments[0]).not.toBe(result.actions[1].augments[0]);
    });
  });

  describe('Edge cases', () => {
    it('should handle missing augments field', () => {
      const source = {
        actions: [{ _id: 'action_1', name: 'Test Action' }]
      };

      const result = PowerModel.migrateData(source);

      expect(result.actions[0].augments).toBeUndefined();
    });

    it('should handle empty augments array', () => {
      const source = {
        augments: [],
        actions: [{ _id: 'action_1', name: 'Test Action' }]
      };

      const result = PowerModel.migrateData(source);

      expect(result.augments).toBeUndefined();
      expect(result.actions[0].augments).toBeUndefined();
    });

    it('should not overwrite existing action augments', () => {
      const source = {
        augments: [{ _id: 'power_aug', name: 'Power Augment' }],
        actions: [
          {
            _id: 'action_1',
            name: 'Test Action',
            augments: [{ _id: 'action_aug', name: 'Action Augment' }]
          }
        ]
      };

      const result = PowerModel.migrateData(source);

      expect(result.actions[0].augments).toHaveLength(1);
      expect(result.actions[0].augments[0]._id).toBe('action_aug');
      expect(result.actions[0].augments[0].name).toBe('Action Augment');
    });

    it('should migrate to actions with empty augments array', () => {
      const source = {
        augments: [{ _id: 'power_aug', name: 'Power Augment' }],
        actions: [
          { _id: 'action_1', name: 'Has augments', augments: [{ _id: 'existing' }] },
          { _id: 'action_2', name: 'Empty augments', augments: [] }
        ]
      };

      const result = PowerModel.migrateData(source);

      expect(result.actions[0].augments).toHaveLength(1);
      expect(result.actions[0].augments[0]._id).toBe('existing');

      expect(result.actions[1].augments).toHaveLength(1);
      expect(result.actions[1].augments[0]._id).toBe('power_aug');
    });
  });

  describe('Data integrity', () => {
    it('should preserve augment data structure', () => {
      const augment = {
        _id: 'aug1',
        name: 'Complex Augment',
        cost: 3,
        effects: {
          damageBonus: '3d6',
          range: { value: 50, units: 'ft' }
        },
        metadata: { category: 'offensive' }
      };

      const source = {
        augments: [augment],
        actions: [{ _id: 'act1', name: 'Action' }]
      };

      const result = PowerModel.migrateData(source);
      const migratedAugment = result.actions[0].augments[0];

      expect(migratedAugment._id).toBe(augment._id);
      expect(migratedAugment.name).toBe(augment.name);
      expect(migratedAugment.cost).toBe(augment.cost);
      expect(migratedAugment.effects.damageBonus).toBe(augment.effects.damageBonus);
      expect(migratedAugment.effects.range.value).toBe(augment.effects.range.value);
      expect(migratedAugment.metadata.category).toBe(augment.metadata.category);
    });

    it('should handle multiple augments', () => {
      const source = {
        augments: [
          { _id: 'aug1', name: 'First', cost: 1 },
          { _id: 'aug2', name: 'Second', cost: 2 },
          { _id: 'aug3', name: 'Third', cost: 3 }
        ],
        actions: [{ _id: 'act1', name: 'Action' }]
      };

      const result = PowerModel.migrateData(source);

      expect(result.actions[0].augments).toHaveLength(3);
      expect(result.actions[0].augments[0].name).toBe('First');
      expect(result.actions[0].augments[1].name).toBe('Second');
      expect(result.actions[0].augments[2].name).toBe('Third');
    });
  });

  describe('Malformed data handling', () => {
    it('should handle null augments', () => {
      const source = {
        augments: null,
        actions: [{ _id: 'act1', name: 'Action' }]
      };

      const result = PowerModel.migrateData(source);

      expect(result.augments).toBeUndefined();
      expect(result.actions[0].augments).toBeUndefined();
    });

    it('should handle undefined actions', () => {
      const source = {
        augments: [{ _id: 'aug1', name: 'Augment' }]
      };

      const result = PowerModel.migrateData(source);

      // Should not throw error
      expect(result).toBeDefined();
    });

    it('should handle empty actions array', () => {
      const source = {
        augments: [{ _id: 'aug1', name: 'Augment' }],
        actions: []
      };

      const result = PowerModel.migrateData(source);

      expect(result.augments).toBeUndefined();
      expect(result.actions).toHaveLength(0);
    });
  });
});

