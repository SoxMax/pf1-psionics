/** Regression for SkillEditor serializing an actor containing prepared powers. */
export function registerPowerSkillTests() {
  if (typeof quench === 'undefined') return;

  quench.registerBatch('pf1-psionics.power-skills', (context) => {
    const { describe, it, expect } = context;

    describe('Skill editing with psionic powers', function () {
      for (const skillId of ['crf', 'pro']) {
        it(`prepares the ${skillId} editor with an embedded power`, async function () {
          const subSkillId = `${skillId}Test`;
          const actor = new CONFIG.Actor.documentClass({
            name: 'Psionic skill serialization test',
            type: 'character',
            system: {
              skills: {
                [skillId]: {
                  subSkills: {
                    [subSkillId]: { name: 'Test skill', ability: 'int', rank: 0 },
                  },
                },
              },
            },
            items: [{
              _id: foundry.utils.randomID(),
              name: 'Test Power',
              type: 'pf1-psionics.power',
              system: { subdiscipline: ['Custom subdiscipline'], descriptors: ['mindAffecting'] },
            }],
          });

          const power = actor.items.contents[0];
          expect(power.system.subdiscipline.base).to.deep.equal(['Custom subdiscipline']);
          expect(power.system.descriptors.base).to.deep.equal(['mindAffecting']);
          const serialized = actor.toObject(false).items[0].system;
          expect(serialized.subdiscipline.base).to.deep.equal(['Custom subdiscipline']);
          expect(serialized.subdiscipline.custom.has('Custom subdiscipline')).to.equal(true);
          expect(serialized.descriptors.base).to.deep.equal(['mindAffecting']);
          expect(serialized.descriptors.standard.has('mindAffecting')).to.equal(true);

          const editor = new pf1.applications.SkillEditor(actor, skillId, subSkillId);
          const data = await editor.getData();
          expect(data.skill.name).to.equal('Test skill');
          expect(power.system.subdiscipline.custom).to.be.instanceOf(Set);
          expect(power.toObject().system.subdiscipline).to.deep.equal(['Custom subdiscipline']);
          expect(power.toObject().system.descriptors).to.deep.equal(['mindAffecting']);

          const selector = new pf1.applications.ActorTraitSelector({
            document: power,
            name: 'system.descriptors',
            subject: 'spellDescriptors',
            choices: pf1.config.spellDescriptors,
          });
          expect(selector.attributes.standard.has('mindAffecting')).to.equal(true);

          const sheetData = await power.sheet.getData();
          expect(sheetData.descriptors.selected.mindAffecting).to.equal(pf1.config.spellDescriptors.mindAffecting);
          expect(sheetData.subdiscipline.selected.custom1).to.equal('Custom subdiscipline');
        });
      }
    });
  }, { displayName: 'PF1 Psionics: Power skill editing', preSelected: true });
}
