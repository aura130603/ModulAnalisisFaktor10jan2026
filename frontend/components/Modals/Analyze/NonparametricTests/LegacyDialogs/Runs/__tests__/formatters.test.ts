import {
  formatNumber,
  formatPValue,
  formatRunsTestTable,
  formatDescriptiveStatisticsTable
} from '../utils/formatters';
import { RunsTestResult, DescriptiveStatistics } from '../types';
import { Variable, VariableType } from '@/types/Variable';

describe('Runs Test Formatters', () => {
  describe('formatNumber', () => {
    it('should format a number with specified precision', () => {
      expect(formatNumber(10.12345, 2)).toBe('10.12');
      expect(formatNumber(0, 3)).toBe('0.000');
      expect(formatNumber(-5.6789, 1)).toBe('-5.7');
    });

    it('should handle null or undefined values', () => {
      expect(formatNumber(null, 2)).toBeNull();
      expect(formatNumber(undefined, 2)).toBeNull();
    });

    it('should handle zero precision', () => {
      expect(formatNumber(10.12345, 0)).toBe('10');
      expect(formatNumber(10.6789, 0)).toBe('11');
    });

    it('should handle large numbers', () => {
      expect(formatNumber(1234567.89, 2)).toBe('1234567.89');
      expect(formatNumber(999999.999, 1)).toBe('1000000.0');
    });
  });

  describe('formatPValue', () => {
    it('should format p-values less than 0.001 as <.001', () => {
      expect(formatPValue(0.0001)).toBe('<.001');
      expect(formatPValue(0.00099)).toBe('<.001');
    });

    it('should format p-values greater than or equal to 0.001 with 3 decimal places', () => {
      expect(formatPValue(0.001)).toBe('0.001');
      expect(formatPValue(0.1234)).toBe('0.123');
      expect(formatPValue(1)).toBe('1.000');
    });

    it('should handle null or undefined values', () => {
      expect(formatPValue(null)).toBeNull();
      expect(formatPValue(undefined)).toBeNull();
    });

    it('should handle edge cases', () => {
      expect(formatPValue(0)).toBe('0.000');
      expect(formatPValue(0.999)).toBe('0.999');
    });
  });

  describe('formatRunsTestTable', () => {
    const mockVariable: Variable = {
      name: 'var1',
      label: 'Variable 1',
      columnIndex: 0,
      type: 'NUMERIC' as VariableType,
      tempId: '1',
      width: 8,
      decimals: 2,
      values: [],
      missing: {},
      align: 'left',
      measure: 'scale',
      role: 'input',
      columns: 8
    };

    it('should format runs test table with valid data', () => {
      const mockResult: RunsTestResult = {
        variable1: mockVariable,
        runsTest: {
          median: {
            TestValue: 15.0,
            CasesBelow: 5,
            CasesAbove: 5,
            Total: 10,
            Runs: 8,
            Z: 1.5,
            PValue: 0.123
          }
        },
        descriptiveStatistics: {
          variable1: mockVariable,
          N1: 10,
          Mean1: 15.5,
          StdDev1: 2.0,
          Min1: 12,
          Max1: 18,
          Percentile25_1: 13,
          Percentile50_1: 15,
          Percentile75_1: 17
        },
        metadata: {
          hasInsufficientData: false,
          insufficientType: [],
          variableName: 'var1',
          variableLabel: 'Variable 1'
        }
      };

      const formatted = formatRunsTestTable([mockResult]);

      expect(formatted).toHaveLength(1);
      expect(formatted[0]).toHaveProperty('title');
      expect(formatted[0]).toHaveProperty('columnHeaders');
      expect(formatted[0]).toHaveProperty('rows');
    });

    it('should handle multiple results', () => {
      const mockResults: RunsTestResult[] = [
        {
          variable1: mockVariable,
          runsTest: {
            median: {
              TestValue: 15.0,
              CasesBelow: 5,
              CasesAbove: 5,
              Total: 10,
              Runs: 8,
              Z: 1.5,
              PValue: 0.123
            }
          },
          descriptiveStatistics: {
            variable1: mockVariable,
            N1: 10,
            Mean1: 15.5,
            StdDev1: 2.0,
            Min1: 12,
            Max1: 18,
            Percentile25_1: 13,
            Percentile50_1: 15,
            Percentile75_1: 17
          },
          metadata: {
            hasInsufficientData: false,
            insufficientType: [],
            variableName: 'var1',
            variableLabel: 'Variable 1'
          }
        },
        {
          variable1: { ...mockVariable, name: 'var2', label: 'Variable 2' },
          runsTest: {
            mean: {
              TestValue: 20.0,
              CasesBelow: 7,
              CasesAbove: 8,
              Total: 15,
              Runs: 12,
              Z: 2.1,
              PValue: 0.045
            }
          },
          descriptiveStatistics: {
            variable1: { ...mockVariable, name: 'var2', label: 'Variable 2' },
            N1: 15,
            Mean1: 20.3,
            StdDev1: 3.0,
            Min1: 15,
            Max1: 25,
            Percentile25_1: 17,
            Percentile50_1: 20,
            Percentile75_1: 23
          },
          metadata: {
            hasInsufficientData: false,
            insufficientType: [],
            variableName: 'var2',
            variableLabel: 'Variable 2'
          }
        },
      ];

      const formatted = formatRunsTestTable(mockResults);

      expect(formatted).toHaveLength(2);
      expect(formatted[0]).toHaveProperty('title');
      expect(formatted[1]).toHaveProperty('title');
    });

    it('should handle null or undefined values in results', () => {
      const mockResult: RunsTestResult = {
        variable1: mockVariable,
        runsTest: {
          median: {
            TestValue: 15.0,
            CasesBelow: 5,
            CasesAbove: 5,
            Total: 10,
            Runs: 8,
            Z: undefined,
            PValue: undefined
          }
        },
        descriptiveStatistics: {
          variable1: mockVariable,
          N1: 10,
          Mean1: undefined,
          StdDev1: undefined,
          Min1: undefined,
          Max1: undefined,
          Percentile25_1: undefined,
          Percentile50_1: undefined,
          Percentile75_1: undefined
        },
        metadata: {
          hasInsufficientData: false,
          insufficientType: [],
          variableName: 'var1',
          variableLabel: 'Variable 1'
        }
      };

      const formatted = formatRunsTestTable([mockResult]);

      expect(formatted[0]).toHaveProperty('title');
      expect(formatted[0]).toHaveProperty('columnHeaders');
      expect(formatted[0]).toHaveProperty('rows');
    });

    it('should handle empty results array', () => {
      const formatted = formatRunsTestTable([]);

      expect(formatted).toHaveLength(1);
      expect(formatted[0]).toHaveProperty('title', 'Runs Test');
    });

    it('should use variable name when label is not available', () => {
      const mockResult: RunsTestResult = {
        variable1: { ...mockVariable, label: '' },
        runsTest: {
          median: {
            TestValue: 15.0,
            CasesBelow: 5,
            CasesAbove: 5,
            Total: 10,
            Runs: 8,
            Z: 1.5,
            PValue: 0.123
          }
        },
        descriptiveStatistics: {
          variable1: { ...mockVariable, label: '' },
          N1: 10,
          Mean1: 15.5,
          StdDev1: 2.0,
          Min1: 12,
          Max1: 18,
          Percentile25_1: 13,
          Percentile50_1: 15,
          Percentile75_1: 17
        },
        metadata: {
          hasInsufficientData: false,
          insufficientType: [],
          variableName: 'var1',
          variableLabel: ''
        }
      };

      const formatted = formatRunsTestTable([mockResult]);

      expect(formatted[0]).toHaveProperty('title');
    });
  });

  describe('formatDescriptiveStatisticsTable', () => {
    const mockVariable: Variable = {
      name: 'var1',
      label: 'Variable 1',
      columnIndex: 0,
      type: 'NUMERIC' as VariableType,
      tempId: '1',
      width: 8,
      decimals: 2,
      values: [],
      missing: {},
      align: 'left',
      measure: 'scale',
      role: 'input',
      columns: 8
    };

    it('should format descriptive statistics table with valid data', () => {
      const mockResult: RunsTestResult = {
        variable1: mockVariable,
        runsTest: {},
        descriptiveStatistics: {
          variable1: mockVariable,
          N1: 10,
          Mean1: 15.5,
          StdDev1: 2.0,
          Min1: 12,
          Max1: 18,
          Percentile25_1: 13,
          Percentile50_1: 15,
          Percentile75_1: 17
        },
        metadata: {
          hasInsufficientData: false,
          insufficientType: [],
          variableName: 'var1',
          variableLabel: 'Variable 1'
        }
      };

      const formatted = formatDescriptiveStatisticsTable([mockResult]);

      expect(formatted).toHaveProperty('title', 'Descriptive Statistics');
      expect(formatted).toHaveProperty('columnHeaders');
      expect(formatted).toHaveProperty('rows');
    });

    it('should handle multiple variables', () => {
      const mockResults: RunsTestResult[] = [
        {
          variable1: mockVariable,
          runsTest: {},
          descriptiveStatistics: {
            variable1: mockVariable,
            N1: 10,
            Mean1: 15.5,
            StdDev1: 2.0,
            Min1: 12,
            Max1: 18,
            Percentile25_1: 13,
            Percentile50_1: 15,
            Percentile75_1: 17
          },
          metadata: {
            hasInsufficientData: false,
            insufficientType: [],
            variableName: 'var1',
            variableLabel: 'Variable 1'
          }
        },
        {
          variable1: { ...mockVariable, name: 'var2', label: 'Variable 2' },
          runsTest: {},
          descriptiveStatistics: {
            variable1: { ...mockVariable, name: 'var2', label: 'Variable 2' },
            N1: 15,
            Mean1: 20.3,
            StdDev1: 3.0,
            Min1: 15,
            Max1: 25,
            Percentile25_1: 17,
            Percentile50_1: 20,
            Percentile75_1: 23
          },
          metadata: {
            hasInsufficientData: false,
            insufficientType: [],
            variableName: 'var2',
            variableLabel: 'Variable 2'
          }
        },
      ];

      const formatted = formatDescriptiveStatisticsTable(mockResults);

      expect(formatted).toHaveProperty('title', 'Descriptive Statistics');
      expect(formatted).toHaveProperty('columnHeaders');
      expect(formatted).toHaveProperty('rows');
    });

    it('should handle null or undefined values in statistics', () => {
      const mockResult: RunsTestResult = {
        variable1: mockVariable,
        runsTest: {},
        descriptiveStatistics: {
          variable1: mockVariable,
          N1: 10,
          Mean1: undefined,
          StdDev1: undefined,
          Min1: undefined,
          Max1: undefined,
          Percentile25_1: undefined,
          Percentile50_1: undefined,
          Percentile75_1: undefined
        },
        metadata: {
          hasInsufficientData: false,
          insufficientType: [],
          variableName: 'var1',
          variableLabel: 'Variable 1'
        }
      };

      const formatted = formatDescriptiveStatisticsTable([mockResult]);

      expect(formatted).toHaveProperty('title', 'Descriptive Statistics');
      expect(formatted).toHaveProperty('columnHeaders');
      expect(formatted).toHaveProperty('rows');
    });

    it('should handle empty results array', () => {
      const formatted = formatDescriptiveStatisticsTable([]);

      expect(formatted).toHaveProperty('title', 'Descriptive Statistics');
      expect(formatted).toHaveProperty('columnHeaders');
      expect(formatted).toHaveProperty('rows');
    });

    it('should use variable name when label is not available', () => {
      const mockResult: RunsTestResult = {
        variable1: { ...mockVariable, label: '' },
        runsTest: {},
        descriptiveStatistics: {
          variable1: { ...mockVariable, label: '' },
          N1: 10,
          Mean1: 15.5,
          StdDev1: 2.0,
          Min1: 12,
          Max1: 18,
          Percentile25_1: 13,
          Percentile50_1: 15,
          Percentile75_1: 17
        },
        metadata: {
          hasInsufficientData: false,
          insufficientType: [],
          variableName: 'var1',
          variableLabel: ''
        }
      };

      const formatted = formatDescriptiveStatisticsTable([mockResult]);

      expect(formatted).toHaveProperty('title', 'Descriptive Statistics');
    });

    it('should handle negative values', () => {
      const mockResult: RunsTestResult = {
        variable1: mockVariable,
        runsTest: {},
        descriptiveStatistics: {
          variable1: mockVariable,
          N1: 10,
          Mean1: -15.5,
          StdDev1: 2.0,
          Min1: -18,
          Max1: -12,
          Percentile25_1: -17,
          Percentile50_1: -15,
          Percentile75_1: -13
        },
        metadata: {
          hasInsufficientData: false,
          insufficientType: [],
          variableName: 'var1',
          variableLabel: 'Variable 1'
        }
      };

      const formatted = formatDescriptiveStatisticsTable([mockResult]);

      expect(formatted).toHaveProperty('title', 'Descriptive Statistics');
    });

    it('should handle zero values', () => {
      const mockResult: RunsTestResult = {
        variable1: mockVariable,
        runsTest: {},
        descriptiveStatistics: {
          variable1: mockVariable,
          N1: 10,
          Mean1: 0,
          StdDev1: 0,
          Min1: 0,
          Max1: 0,
          Percentile25_1: 0,
          Percentile50_1: 0,
          Percentile75_1: 0
        },
        metadata: {
          hasInsufficientData: false,
          insufficientType: [],
          variableName: 'var1',
          variableLabel: 'Variable 1'
        }
      };

      const formatted = formatDescriptiveStatisticsTable([mockResult]);

      expect(formatted).toHaveProperty('title', 'Descriptive Statistics');
    });
  });
}); 