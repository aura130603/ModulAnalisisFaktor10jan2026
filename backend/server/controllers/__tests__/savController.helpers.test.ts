/**
 * Mock the external `sav-writer` package so that helper functions can be tested
 * without relying on the real binary implementation.
 */
jest.mock('sav-writer', () => ({
  VariableType: { Numeric: 0, String: 1, Date: 2, DateTime: 3 },
  VariableAlignment: { Left: 0, Centre: 1, Right: 2 },
  VariableMeasure: { Nominal: 0, Ordinal: 1, Continuous: 2 },
  saveToFile: jest.fn()
}));

import { VariableType, VariableAlignment, VariableMeasure } from 'sav-writer';

import type { VariableInput } from '../../types/sav.types';
import { transformVariable, transformRecord } from '../savController';

describe('savController helper functions', () => {
  describe('transformVariable', () => {
    it('should correctly transform STRING variable with value labels', () => {
      const input: VariableInput = {
        name: 'var1',
        label: 'Variable 1',
        type: 'STRING',
        width: 8,
        decimal: 0,
        alignment: 'left',
        measure: 'nominal',
        columns: 8,
        valueLabels: [
          { value: 'A', label: 'Alpha' },
          { value: 'B', label: 'Bravo' }
        ]
      };

      const result = transformVariable(input);

      expect(result).toEqual({
        name: 'var1',
        label: 'Variable 1',
        type: VariableType.String,
        width: 8,
        decimal: 0,
        alignment: VariableAlignment.Left,
        measure: VariableMeasure.Nominal,
        columns: 1, // 8 / 20 -> 0 -> Math.max(1, 0) = 1
        valueLabels: [
          { value: 'A', label: 'Alpha' },
          { value: 'B', label: 'Bravo' }
        ]
      });
    });

    it('should default to Numeric type and right alignment/continuous measure when unspecified', () => {
      const input: VariableInput = {
        name: 'numVar',
        label: '',
        type: 'NUMERIC',
        width: 5,
        decimal: 2
      };
      const result = transformVariable(input);

      expect(result.type).toBe(VariableType.Numeric);
      expect(result.alignment).toBe(VariableAlignment.Right);
      expect(result.measure).toBe(VariableMeasure.Continuous);
    });
  });

  describe('transformRecord', () => {
    const stringVar = transformVariable({
      name: 'str',
      label: 'Str',
      type: 'STRING',
      width: 10
    } as VariableInput);
    const dateVar = transformVariable({
      name: 'dt',
      label: 'Date',
      type: 'DATE',
      width: 10
    } as VariableInput);
    const numVar = transformVariable({
      name: 'num',
      label: 'Number',
      type: 'NUMERIC',
      width: 8,
      decimal: 0
    } as VariableInput);
    const transformedVars = [stringVar, dateVar, numVar];

    it('should convert values according to variable definitions', () => {
      const inputRecord = {
        str: 'hello',
        dt: '12-10-2023',
        num: '42'
      };

      const result = transformRecord(inputRecord, transformedVars);

      expect(result.str).toBe('hello');
      expect(result.num).toBe(42);
      // Date: 12 Oct 2023 UTC
      expect(result.dt).toBeInstanceOf(Date);
      const dtIso = result.dt instanceof Date ? result.dt.toISOString() : null;
      expect(dtIso).toBe('2023-10-12T00:00:00.000Z');
    });

    it('should set invalid or empty values to null', () => {
      const inputRecord = {
        str: '',
        dt: 'invalid-date',
        num: 'not-a-number'
      };
      const result = transformRecord(inputRecord, transformedVars);
      expect(result.str).toBeNull();
      expect(result.dt).toBeNull();
      expect(result.num).toBeNull();
    });
  });
}); 