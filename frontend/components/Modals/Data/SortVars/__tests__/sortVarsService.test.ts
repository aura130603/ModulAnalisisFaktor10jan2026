import { sortDataColumns } from '../services/sortVarsService';
import type { Variable } from '@/types/Variable';
import type { DataRow } from '@/types/Data';

describe('sortVarsService', () => {
  describe('sortDataColumns', () => {
    const originalVariables: Variable[] = [
      { tempId: 't1', name: 'VarA', columnIndex: 0, type: 'NUMERIC', width: 8, decimals: 2, label: '', values: [], missing: null, columns: 8, align: 'left', measure: 'scale', role: 'input' },
      { tempId: 't2', name: 'VarB', columnIndex: 1, type: 'STRING', width: 8, decimals: 0, label: '', values: [], missing: null, columns: 8, align: 'left', measure: 'nominal', role: 'input' },
      { tempId: 't3', name: 'VarC', columnIndex: 2, type: 'NUMERIC', width: 8, decimals: 2, label: '', values: [], missing: null, columns: 8, align: 'left', measure: 'scale', role: 'input' },
    ];

    const data: DataRow[] = [
      [10, 'apple', 100],
      [20, 'banana', 200],
    ];

    it('should correctly reorder data columns based on sorted variables', () => {
      // Sort by name descending: VarC, VarB, VarA
      const sortedVariables: Variable[] = [
        { ...originalVariables[2], columnIndex: 0, tempId: 't3' }, // VarC -> index 0
        { ...originalVariables[1], columnIndex: 1, tempId: 't2' }, // VarB -> index 1
        { ...originalVariables[0], columnIndex: 2, tempId: 't1' }, // VarA -> index 2
      ];

      const result = sortDataColumns(data, originalVariables, sortedVariables);

      const expectedData: DataRow[] = [
        [100, 'apple', 10],
        [200, 'banana', 20],
      ];

      expect(result).toEqual(expectedData);
    });

    it('should handle empty data array', () => {
      const result = sortDataColumns([], originalVariables, originalVariables);
      expect(result).toEqual([]);
    });

    it('should throw an error if column mapping is incomplete', () => {
      const incompleteSortedVariables = [originalVariables[0]]; // Missing VarB and VarC
      expect(() => {
        sortDataColumns(data, originalVariables, incompleteSortedVariables);
      }).toThrow('Failed to create a complete column mapping.');
    });

    it('should handle cases where row length is shorter than expected', () => {
       const shortData: DataRow[] = [
        [10, 'apple'], // Missing data for VarC
      ];
      const sortedVariables: Variable[] = [
        { ...originalVariables[1], columnIndex: 0, tempId: 't2' }, // VarB -> index 0
        { ...originalVariables[0], columnIndex: 1, tempId: 't1' }, // VarA -> index 1
        { ...originalVariables[2], columnIndex: 2, tempId: 't3' }, // VarC -> index 2
      ];

      const result = sortDataColumns(shortData, originalVariables, sortedVariables);
      
      // The implementation creates a new row with the length of the original shorter row
      // `newRow` is initialized with `Array(2).fill(null)` -> `[null, null]`
      // oldVar 'VarA' (oldIdx 0) is mapped to newIdx 1. `newRow` -> `[null, 10]`
      // oldVar 'VarB' (oldIdx 1) is mapped to newIdx 0. `newRow` -> `['apple', 10]`
      // oldVar 'VarC' (oldIdx 2) is skipped because `oldIndex < row.length` (2 < 2) is false.
      // Final row is `['apple', 10]`.
      expect(result).toEqual([['apple', 10]]);
    });
  });
}); 