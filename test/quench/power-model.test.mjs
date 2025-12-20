/**
 * Quench integration tests for PowerModel
 * These tests run inside Foundry with full API access
 */

export function registerPowerModelTests() {
  if (typeof quench === 'undefined') return;

  quench.registerBatch(
    'pf1-psionics.power-model',
    (context) => {
      const { describe, it, expect, assert, before, after } = context;

      describe('PowerModel Migrations (Integration)', function () {
        let testActor;

        before(async function () {
          // Create a temporary test actor
          testActor = await Actor.create({
            name: 'Test Psion',
            type: 'character',
            system: {
              abilities: {
                int: { total: 18, value: 18 }
              }
            }
          }, { temporary: true });
        });

        after(async function () {
          // Cleanup is automatic for temporary documents
        });

        describe('Item Creation with Migration', function () {
          it('should migrate power augments when creating item', async function () {
            const power = await Item.create({
              name: 'Energy Ray',
              type: 'power',
              system: {
                augments: [
                  {
                    _id: foundry.utils.randomID(),
                    name: 'Increase Damage',
                    cost: 2,
                    effects: { damageBonus: '2d6' }
                  }
                ],
                actions: [
                  {
                    _id: foundry.utils.randomID(),
                    name: 'Ray Attack',
                    actionType: 'rsak'
                  }
                ]
              }
            }, { temporary: true });

            // After creation, augments should be migrated
            expect(power.system.augments).to.be.undefined;
            expect(power.system.actions[0].augments).to.have.lengthOf(1);
            expect(power.system.actions[0].augments[0].name).to.equal('Increase Damage');
          });

          it('should preserve existing action augments', async function () {
            const power = await Item.create({
              name: 'Mind Thrust',
              type: 'power',
              system: {
                augments: [
                  { _id: foundry.utils.randomID(), name: 'Power Augment', cost: 2 }
                ],
                actions: [
                  {
                    _id: foundry.utils.randomID(),
                    name: 'Mental Attack',
                    actionType: 'save',
                    augments: [
                      { _id: foundry.utils.randomID(), name: 'Action Augment', cost: 1 }
                    ]
                  }
                ]
              }
            }, { temporary: true });

            expect(power.system.actions[0].augments).to.have.lengthOf(1);
            expect(power.system.actions[0].augments[0].name).to.equal('Action Augment');
          });
        });

        describe('Item Updates', function () {
          it('should allow updating migrated items', async function () {
            const power = await Item.create({
              name: 'Test Power',
              type: 'power',
              system: {
                augments: [
                  { _id: foundry.utils.randomID(), name: 'Test Augment', cost: 1 }
                ],
                actions: [
                  { _id: foundry.utils.randomID(), name: 'Test Action' }
                ]
              }
            }, { temporary: true });

            // Update the action's augment
            const actionId = power.system.actions[0]._id;
            await power.update({
              'system.actions': [{
                ...power.system.actions[0],
                augments: [
                  { _id: foundry.utils.randomID(), name: 'Updated Augment', cost: 2 }
                ]
              }]
            });

            const updated = await Item.get(power.id);
            expect(updated.system.actions[0].augments[0].name).to.equal('Updated Augment');
            expect(updated.system.actions[0].augments[0].cost).to.equal(2);
          });
        });

        describe('Actor Item Integration', function () {
          it('should work with items owned by actors', async function () {
            const power = await testActor.createEmbeddedDocuments('Item', [{
              name: 'Ego Whip',
              type: 'power',
              system: {
                augments: [
                  { _id: foundry.utils.randomID(), name: 'Increase DC', cost: 2 }
                ],
                actions: [
                  { _id: foundry.utils.randomID(), name: 'Mental Attack', actionType: 'save' }
                ]
              }
            }], { temporary: true });

            const createdPower = power[0];
            expect(createdPower.system.augments).to.be.undefined;
            expect(createdPower.system.actions[0].augments).to.have.lengthOf(1);
          });

          it('should preserve augments when updating actor items', async function () {
            const powers = await testActor.createEmbeddedDocuments('Item', [{
              name: 'Test Power',
              type: 'power',
              system: {
                actions: [
                  {
                    _id: foundry.utils.randomID(),
                    name: 'Test Action',
                    augments: [
                      { _id: foundry.utils.randomID(), name: 'Original Augment', cost: 1 }
                    ]
                  }
                ]
              }
            }], { temporary: true });

            const power = powers[0];
            const originalAugmentName = power.system.actions[0].augments[0].name;

            // Update something else
            await power.update({ name: 'Updated Power' });

            // Augment should still be there
            const updated = testActor.items.get(power.id);
            expect(updated.system.actions[0].augments[0].name).to.equal(originalAugmentName);
          });
        });

        describe('Multiple Actions', function () {
          it('should migrate augments to all actions', async function () {
            const power = await Item.create({
              name: 'Complex Power',
              type: 'power',
              system: {
                augments: [
                  { _id: foundry.utils.randomID(), name: 'Universal Augment', cost: 1 }
                ],
                actions: [
                  { _id: foundry.utils.randomID(), name: 'Action 1', actionType: 'rsak' },
                  { _id: foundry.utils.randomID(), name: 'Action 2', actionType: 'msak' },
                  { _id: foundry.utils.randomID(), name: 'Action 3', actionType: 'save' }
                ]
              }
            }, { temporary: true });

            expect(power.system.actions).to.have.lengthOf(3);
            power.system.actions.forEach((action, idx) => {
              expect(action.augments, `Action ${idx + 1} should have augments`).to.have.lengthOf(1);
              expect(action.augments[0].name).to.equal('Universal Augment');
            });
          });

          it('should handle mixed action augments', async function () {
            const power = await Item.create({
              name: 'Mixed Power',
              type: 'power',
              system: {
                augments: [
                  { _id: foundry.utils.randomID(), name: 'Default Augment', cost: 1 }
                ],
                actions: [
                  {
                    _id: foundry.utils.randomID(),
                    name: 'Action 1',
                    augments: [
                      { _id: foundry.utils.randomID(), name: 'Custom Augment 1', cost: 2 }
                    ]
                  },
                  {
                    _id: foundry.utils.randomID(),
                    name: 'Action 2'
                    // No augments - should get default
                  },
                  {
                    _id: foundry.utils.randomID(),
                    name: 'Action 3',
                    augments: []
                    // Empty augments - should get default
                  }
                ]
              }
            }, { temporary: true });

            expect(power.system.actions[0].augments[0].name).to.equal('Custom Augment 1');
            expect(power.system.actions[1].augments[0].name).to.equal('Default Augment');
            expect(power.system.actions[2].augments[0].name).to.equal('Default Augment');
          });
        });
      });
    },
    {
      displayName: 'PF1 Psionics: Power Model',
      preSelected: true
    }
  );
}

