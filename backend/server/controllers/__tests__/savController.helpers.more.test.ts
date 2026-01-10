jest.mock('sav-writer', () => ({
  VariableType: { Numeric: 0, String: 1, Date: 2, DateTime: 3 },
  VariableAlignment: { Left: 0, Centre: 1, Right: 2 },
  VariableMeasure: { Nominal: 0, Ordinal: 1, Continuous: 2 },
  saveToFile: jest.fn()
}));

import { VariableType, VariableAlignment, VariableMeasure } from 'sav-writer';

import type { VariableInput } from '../../types/sav.types';
import { transformVariable } from '../savController';

describe('savController helper branches (more)', () => {
  it('handles centre alignment and ordinal measure', () => {
    const input: VariableInput = {
      name: 'a',
      type: 'NUMERIC',
      width: 8,
      alignment: 'centre',
      measure: 'ordinal'
    };
    const result = transformVariable(input);
    expect(result.alignment).toBe(VariableAlignment.Centre);
    expect(result.measure).toBe(VariableMeasure.Ordinal);
  });

  it('maps invalid numeric valueLabels to 0 and null/undefined label to empty string', () => {
    const input: VariableInput = {
      name: 'n',
      type: 'NUMERIC',
      width: 8,
      valueLabels: [ { value: 'abc', label: null } ]
    };
    const result = transformVariable(input);
    expect(result.type).toBe(VariableType.Numeric);
    expect(result.valueLabels).toEqual([{ value: 0, label: '' }]);
  });

  it('maps DATE and DATETIME types correctly', () => {
    const dateVar = transformVariable({ name: 'd', type: 'DATE', width: 10 } as VariableInput);
    const dtVar = transformVariable({ name: 't', type: 'DATETIME', width: 20 } as VariableInput);
    expect(dateVar.type).toBe(VariableType.Date);
    expect(dtVar.type).toBe(VariableType.DateTime);
  });
});
