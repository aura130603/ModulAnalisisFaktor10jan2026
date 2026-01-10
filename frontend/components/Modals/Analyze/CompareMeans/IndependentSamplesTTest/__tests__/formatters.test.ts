import {
  formatNumber,
  formatPValue,
  formatDF,
  formatGroupStatisticsTable,
  formatIndependentSamplesTestTable
} from '../utils/formatters';
import { IndependentSamplesTTestResult, GroupStatistics, IndependentSamplesTest } from '../types';
import { Variable, VariableType } from '@/types/Variable';

describe('IndependentSamplesTTest Formatters', () => {
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
  });

  describe('formatDF', () => {
    it('should return integer degrees of freedom as is', () => {
      expect(formatDF(5)).toBe(5);
      expect(formatDF(0)).toBe(0);
    });

    it('should format non-integer degrees of freedom with 3 decimal places', () => {
      expect(formatDF(5.123456)).toBe('5.123');
      expect(formatDF(0.5)).toBe('0.500');
    });

    it('should handle null or undefined values', () => {
      expect(formatDF(null)).toBeNull();
      expect(formatDF(undefined)).toBeNull();
    });
  });



  describe('formatGroupStatisticsTable', () => {
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

    const mockGroupingVariableLabel = 'Group';

    it('should format group statistics table with valid data', () => {
      const mockResults: IndependentSamplesTTestResult[] = [
        {
          variable1: mockVariable,
          groupStatistics: {
            group1: {
              label: 'Group A',
              N: 10,
              Mean: 15.5,
              StdDev: 3.2,
              SEMean: 1.01
            },
            group2: {
              label: 'Group B',
              N: 12,
              Mean: 18.3,
              StdDev: 4.1,
              SEMean: 1.18
            }
          }
        }
      ];

      const table = formatGroupStatisticsTable(mockResults, mockGroupingVariableLabel);
      
      expect(table.title).toBe('Group Statistics');
      expect(table.columnHeaders).toHaveLength(6);
      expect(table.rows).toHaveLength(2);
      
      // Group 1 row
      expect(table.rows[0].rowHeader).toEqual(['var1']);
      expect(table.rows[0].label).toBe('Group A');
      expect(table.rows[0].N).toBe(10);
      expect(table.rows[0].Mean).toBe('15.5000');
      expect(table.rows[0].StdDev).toBe('3.20000');
      expect(table.rows[0].SEMean).toBe('1.01000');
      
      // Group 2 row
      expect(table.rows[1].rowHeader).toEqual(['var1']);
      expect(table.rows[1].label).toBe('Group B');
      expect(table.rows[1].N).toBe(12);
      expect(table.rows[1].Mean).toBe('18.3000');
      expect(table.rows[1].StdDev).toBe('4.10000');
      expect(table.rows[1].SEMean).toBe('1.18000');
    });

    it('should handle empty results', () => {
      const emptyResults: IndependentSamplesTTestResult[] = [];

      const table = formatGroupStatisticsTable(emptyResults, mockGroupingVariableLabel);
      
      expect(table.title).toBe('Group Statistics');
      expect(table.columnHeaders).toHaveLength(1);
      expect(table.columnHeaders[0].header).toBe('No Data');
      expect(table.rows).toHaveLength(0);
    });
  });

  describe('formatIndependentSamplesTestTable', () => {
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

    it('should format independent samples test table with valid data', () => {
      const mockResults: IndependentSamplesTTestResult[] = [
        {
          variable1: mockVariable,
          independentSamplesTest: {
            levene: {
              F: 1.23,
              Sig: 0.275
            },
            equalVariances: {
              t: 2.5,
              df: 20,
              sig: 0.021,
              meanDifference: 2.8,
              stdErrorDifference: 1.12,
              confidenceInterval: {
                lower: 0.48,
                upper: 5.12
              }
            },
            unequalVariances: {
              t: 2.48,
              df: 18.4,
              sig: 0.023,
              meanDifference: 2.8,
              stdErrorDifference: 1.13,
              confidenceInterval: {
                lower: 0.45,
                upper: 5.15
              }
            }
          }
        }
      ];

      const table = formatIndependentSamplesTestTable(mockResults);
      
      expect(table.title).toBe('Independent Samples Test');
      expect(table.columnHeaders).toHaveLength(4);
      expect(table.rows).toHaveLength(2);
      
      // Equal variances row
      expect(table.rows[0].rowHeader).toEqual(['var1']);
      expect(table.rows[0].type).toBe('Equal variances assumed');
      expect(table.rows[0].FL).toBe('1.23000');
      expect(table.rows[0].SigL).toBe('0.275');
      expect(table.rows[0].T).toBe('2.50000');
      expect(table.rows[0].DF).toBe(20);
      expect(table.rows[0].Sig2tailed).toBe('0.021');
      expect(table.rows[0].MeanDifference).toBe('2.80000');
      expect(table.rows[0].StdErrorDifference).toBe('1.12000');
      expect(table.rows[0].Lower).toBe('0.48000');
      expect(table.rows[0].Upper).toBe('5.12000');
      
      // Unequal variances row
      expect(table.rows[1].rowHeader).toEqual(['var1']);
      expect(table.rows[1].type).toBe('Equal variances not assumed');
      expect(table.rows[1].FL).toBe('');
      expect(table.rows[1].SigL).toBe('');
      expect(table.rows[1].T).toBe('2.48000');
      expect(table.rows[1].DF).toBe('18.400');
      expect(table.rows[1].Sig2tailed).toBe('0.023');
      expect(table.rows[1].MeanDifference).toBe('2.80000');
      expect(table.rows[1].StdErrorDifference).toBe('1.13000');
      expect(table.rows[1].Lower).toBe('0.45000');
      expect(table.rows[1].Upper).toBe('5.15000');
    });

    it('should handle empty results', () => {
      const emptyResults: IndependentSamplesTTestResult[] = [];

      const table = formatIndependentSamplesTestTable(emptyResults);
      
      expect(table.title).toBe('No Data');
      expect(table.columnHeaders).toHaveLength(1);
      expect(table.columnHeaders[0].header).toBe('No Data');
      expect(table.rows).toHaveLength(0);
    });
    
    it('should skip invalid t-test results', () => {
      const mockResults: IndependentSamplesTTestResult[] = [
        {
          variable1: mockVariable,
          independentSamplesTest: {
            levene: {
              F: 1.23,
              Sig: 0.275
            },
            equalVariances: {
              t: NaN, // Invalid value
              df: 20,
              sig: 0.021,
              meanDifference: 2.8,
              stdErrorDifference: 1.12,
              confidenceInterval: {
                lower: 0.48,
                upper: 5.12
              }
            },
            unequalVariances: {
              t: NaN, // Invalid value
              df: 18.4,
              sig: 0.023,
              meanDifference: 2.8,
              stdErrorDifference: 1.13,
              confidenceInterval: {
                lower: 0.45,
                upper: 5.15
              }
            }
          }
        }
      ];

      const table = formatIndependentSamplesTestTable(mockResults);
      
      // Should not add any rows for invalid t-test results
      expect(table.rows).toHaveLength(0);
    });
  });
}); 