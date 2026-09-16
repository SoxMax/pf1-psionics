import { describe, expect, it, vi } from 'vitest';
import { PowerModel } from '../../scripts/dataModels/item/power-model.mjs';

// Reproduce the relevant Foundry field contracts without requiring a server.
function createModel(populated = true) {
  const arrayField = { toObject: value => value.map(entry => entry) };
  const notesField = { toObject: vi.fn(value => value.map(note => ({ text: note.text }))) };
  const fields = {
    subdiscipline: arrayField,
    descriptors: arrayField,
    level: { toObject: value => value },
    contextNotes: notesField,
  };
  class TestPowerModel extends PowerModel {
    static schema = {
      entries: () => Object.entries(fields),
      toObject: value => Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.toObject(value[key])])),
    };
  }
  const source = {
    subdiscipline: populated ? ['known', 'Custom subdiscipline'] : [],
    descriptors: populated ? ['known', 'Custom descriptor'] : [],
    level: 1,
    contextNotes: [{ text: 'Source note' }],
  };
  const model = Object.assign(new TestPowerModel(), structuredClone(source), { _source: structuredClone(source) });
  return { model, source, notesField };
}

function prepareTraits(model) {
  for (const key of ['subdiscipline', 'descriptors']) {
    model[key] = {
      base: model[key],
      standard: new Set(model[key].filter(value => value === 'known')),
      custom: new Set(model[key].filter(value => value !== 'known')),
      get total() { return new Set([...this.standard, ...this.custom]); },
      get names() { return [...this.standard].map(value => `Label: ${value}`).concat([...this.custom]); },
    };
  }
}

describe('PowerModel.toObject', () => {
  it.each([false, true])('preserves source arrays after trait preparation (populated: %s)', populated => {
    const { model, source } = createModel(populated);
    prepareTraits(model);
    model.level = 5;
    model.descriptors.standard.add('runtimeDescriptor');

    expect(model.toObject()).toEqual(source);
    expect(model.toObject(true)).toEqual(source);
    const copy = model.toObject();
    copy.descriptors.push('Changed copy');
    expect(model._source).toEqual(source);
  });

  it.each([false, true])('serializes prepared trait objects (populated: %s)', populated => {
    const { model, source, notesField } = createModel(populated);
    prepareTraits(model);
    model.level = 5;
    model.contextNotes = [{ text: 'Prepared note', derived: true }];
    model.descriptors.standard.add('runtimeDescriptor');

    // The original schema serializer fails even when the saved arrays are empty.
    expect(() => model.constructor.schema.toObject(model)).toThrow(/map is not a function/);
    const result = model.toObject(false);

    for (const key of ['subdiscipline', 'descriptors']) {
      expect(result[key]).not.toBe(model[key]);
      expect(result[key].base).toEqual(source[key]);
      expect(result[key].base).not.toBe(model[key].base);
      expect(result[key].standard).toEqual(model[key].standard);
      expect(result[key].custom).toEqual(model[key].custom);
      expect(result[key].total).toEqual(model[key].total);
      expect(result[key].names).toEqual(model[key].names);
    }
    expect(result.descriptors.total.has('runtimeDescriptor')).toBe(true);
    expect(result.level).toBe(5);
    expect(result.contextNotes).toEqual([{ text: 'Prepared note' }]);
    expect(notesField.toObject).toHaveBeenCalledWith(model.contextNotes);
    expect(model.toObject()).toEqual(source);
  });

  it.each([false, true])('handles arrays before preparation (populated: %s)', populated => {
    const { model, source } = createModel(populated);
    expect(model.toObject(false)).toEqual(source);
    expect(model.toObject(false).descriptors).not.toBe(model.descriptors);
  });

  it('does not hide malformed values that are not PF1 prepared traits', () => {
    const { model } = createModel();
    model.descriptors = { unexpected: true };
    expect(() => model.toObject(false)).toThrow(/map is not a function/);
  });
});
