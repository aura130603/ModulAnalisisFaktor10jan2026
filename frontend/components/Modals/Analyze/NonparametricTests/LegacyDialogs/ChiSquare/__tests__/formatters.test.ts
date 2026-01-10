import {
  formatFrequenciesTable,
  formatTestStatisticsTable,
  formatDescriptiveStatisticsTable,
  formatErrorTable
} from '../utils/formatters';
import type { Variable } from '@/types/Variable';
import type { ChiSquareResult } from '../types';

describe('ChiSquare Formatters', () => {
  const mockVariable: Variable = {
    name: 'testVar',
    label: 'Test Variable',
    columnIndex: 0,
    type: 'NUMERIC',
    tempId: '1',
    width: 8,
    decimals: 2,
    values: [],
    missing: {},
    align: 'left',
    measure: 'nominal',
    role: 'input',
    columns: 8
  };

  describe('formatFrequenciesTable', () => {
    it('should format frequencies table correctly', () => {
      const mockResult: ChiSquareResult = {
        variable1: mockVariable,
        frequencies: {
          categoryList: ['1', '2', '3'],
          observedN: [10, 15, 5],
          expectedN: 10,
          residual: [0, 5, -5],
          N: 30
        }
      };

      const result = formatFrequenciesTable([mockResult]);

      expect(Array.isArray(result)).toBe(true);
      const table = (result as any[])[0];
      expect(table.title).toBe('Test Variable');
      expect(table.columnHeaders).toHaveLength(4);
      expect(table.rows).toHaveLength(4); // 3 categories + 1 total
    });

    it('should handle empty frequencies', () => {
      const mockResult: ChiSquareResult = {
        variable1: mockVariable,
        frequencies: {
          categoryList: [],
          observedN: [],
          expectedN: 0,
          residual: [],
          N: 0
        }
      };

      const result = formatFrequenciesTable([mockResult]);

      expect(Array.isArray(result)).toBe(true);
      const table = (result as any[])[0];
      expect(table.title).toBe('Test Variable');
      expect(table.rows).toHaveLength(1); // Only total row
    });

    it('should format numbers with correct decimals', () => {
      const mockResult: ChiSquareResult = {
        variable1: mockVariable,
        frequencies: {
          categoryList: ['1'],
          observedN: [10.123],
          expectedN: 10.456,
          residual: [0.333],
          N: 10
        }
      };

      const result = formatFrequenciesTable([mockResult]);
      const table = (result as any[])[0];
      const firstRow = table.rows[0];

      expect(firstRow.observedN).toBe(10.123);
      expect(firstRow.expectedN).toBe('10.5');
      expect(firstRow.residual).toBe('0.3');
    });
  });

  describe('formatTestStatisticsTable', () => {
    it('should format test statistics table correctly', () => {
      const mockResult: ChiSquareResult = {
        variable1: mockVariable,
        testStatistics: {
          ChiSquare: 5.67,
          DF: 2,
          PValue: 0.059
        }
      };

      const result = formatTestStatisticsTable([mockResult]);

      expect(result.title).toBe('Test Statistics');
      expect(result.columnHeaders).toHaveLength(4);
      expect(result.rows).toHaveLength(1);
    });

    it('should handle very small p-values', () => {
      const mockResult: ChiSquareResult = {
        variable1: mockVariable,
        testStatistics: {
          ChiSquare: 15.8,
          DF: 3,
          PValue: 0.001
        }
      };

      const result = formatTestStatisticsTable([mockResult]);

      expect(result.rows[0].pValue).toBe('0.001');
    });

    it('should handle large p-values', () => {
      const mockResult: ChiSquareResult = {
        variable1: mockVariable,
        testStatistics: {
          ChiSquare: 0.5,
          DF: 1,
          PValue: 0.479
        }
      };

      const result = formatTestStatisticsTable([mockResult]);

      expect(result.rows[0].pValue).toBe('0.479');
    });
  });

  describe('formatDescriptiveStatisticsTable', () => {
    it('should format descriptive statistics table correctly', () => {
      const mockResult: ChiSquareResult = {
        variable1: mockVariable,
        descriptiveStatistics: {
          N1: 30,
          Mean1: 2.1,
          StdDev1: 0.8,
          Min1: 1,
          Max1: 3
        }
      };

      const result = formatDescriptiveStatisticsTable([mockResult]);

      expect(result.title).toBe('Descriptive Statistics');
      expect(result.columnHeaders).toHaveLength(2);
      expect(result.rows.length).toBeGreaterThan(0);
    });

    it('should handle missing values in descriptive statistics', () => {
      const mockResult: ChiSquareResult = {
        variable1: mockVariable,
        descriptiveStatistics: {
          N1: 25,
          Mean1: 2.1,
          StdDev1: 0.8,
          Min1: 1,
          Max1: 3
        }
      };

      const result = formatDescriptiveStatisticsTable([mockResult]);

      expect(result.rows[0].statistic).toBe('N');
      expect(result.rows[0].value).toBe('25');
    });
  });

  describe('formatErrorTable', () => {
    it('should format error table correctly', () => {
      const result = formatErrorTable();

      expect(result.title).toBe('Error');
      expect(result.columnHeaders).toHaveLength(1);
      expect(result.rows).toHaveLength(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined values gracefully', () => {
      const mockResult: ChiSquareResult = {
        variable1: mockVariable,
        frequencies: {
          categoryList: ['1', '2'],
          observedN: [10, null as any],
          expectedN: undefined as any,
          residual: [0, 5],
          N: 10
        }
      };

      const result = formatFrequenciesTable([mockResult]);
      const table = (result as any[])[0];

      expect(table.rows[1].observedN).toBe(0);
      expect(table.rows[1].expectedN).toBe('0.0');
    });

    it('should handle very large numbers', () => {
      const mockResult: ChiSquareResult = {
        variable1: mockVariable,
        testStatistics: {
          ChiSquare: 999999.99,
          DF: 100,
          PValue: 0.999
        }
      };

      const result = formatTestStatisticsTable([mockResult]);

      expect(result.rows[0].chiSquare).toBe('999999.99');
      expect(result.rows[0].df).toBe('100');
    });

    it('should handle zero values', () => {
      const mockResult: ChiSquareResult = {
        variable1: mockVariable,
        testStatistics: {
          ChiSquare: 0,
          DF: 0,
          PValue: 0
        }
      };

      const result = formatTestStatisticsTable([mockResult]);

      expect(result.rows[0].chiSquare).toBe('0.00');
      expect(result.rows[0].df).toBe('0');
      expect(result.rows[0].pValue).toBe('0.000');
    });
  });

  describe('Number Formatting', () => {
    it('should format numbers with correct precision', () => {
      const mockResult: ChiSquareResult = {
        variable1: mockVariable,
        frequencies: {
          categoryList: ['1'],
          observedN: [10.123456],
          expectedN: 10.123456,
          residual: [0.123456],
          N: 10
        }
      };

      const result = formatFrequenciesTable([mockResult]);
      const table = (result as any[])[0];

      // Should round to 1 decimal place for expectedN and residual
      expect(table.rows[0].expectedN).toBe('10.1');
      expect(table.rows[0].residual).toBe('0.1');
    });

    it('should handle scientific notation', () => {
      const mockResult: ChiSquareResult = {
        variable1: mockVariable,
        testStatistics: {
          ChiSquare: 1.23e-5,
          DF: 1,
          PValue: 1.23e-10
        }
      };

      const result = formatTestStatisticsTable([mockResult]);

      expect(result.rows[0].chiSquare).toBe('0.00001');
      expect(result.rows[0].pValue).toBe('0.0000000001');
    });
  });
}); 