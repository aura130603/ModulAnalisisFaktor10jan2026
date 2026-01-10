import {
  formatNumber,
  formatPValue,
  formatDF,
  formatOneWayAnovaTable,
  formatDescriptiveStatisticsTable,
  formatHomogeneityOfVarianceTable,
  formatMultipleComparisonsTable,
  formatHomogeneousSubsetsTable,
  formatErrorTable
} from '../utils/formatters';
import { OneWayAnovaResult, OneWayAnova, Descriptives, HomogeneityOfVariance, MultipleComparisons, HomogeneousSubsets } from '../types';
import { Variable, VariableType } from '@/types/Variable';

describe('OneWayAnova Formatters', () => {
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

  describe('formatOneWayAnovaTable', () => {
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

    it('should format one-way ANOVA table with valid data', () => {
      const mockResults: OneWayAnovaResult[] = [
        {
          variable1: mockVariable,
          variable2: mockVariable,
          oneWayAnova: {
            SumOfSquares: 1405.73,
            df: 2,
            MeanSquare: 702.87,
            F: 84.13,
            Sig: 0.001,
            withinGroupsSumOfSquares: 476.20,
            withinGroupsDf: 57,
            withinGroupsMeanSquare: 8.35,
            totalSumOfSquares: 1881.93,
            totalDf: 59
          }
        }
      ];

      const table = formatOneWayAnovaTable(mockResults);
      
      expect(table.title).toBe('ANOVA');
      expect(table.columnHeaders).toHaveLength(7);
      expect(table.rows).toHaveLength(3);
      
      // Between Groups row
      expect(table.rows[0].rowHeader).toEqual(['Variable 1']);
      expect(table.rows[0].type).toBe('Between Groups');
      expect(table.rows[0].SumOfSquares).toBe('1405.73000');
      expect(table.rows[0].df).toBe(2);
      expect(table.rows[0].MeanSquare).toBe('702.87000');
      expect(table.rows[0].F).toBe('84.13000');
      expect(table.rows[0].Sig).toBe('0.001');
      
      // Within Groups row
      expect(table.rows[1].rowHeader).toEqual(['Variable 1']);
      expect(table.rows[1].type).toBe('Within Groups');
      expect(table.rows[1].SumOfSquares).toBe('476.20000');
      expect(table.rows[1].df).toBe(57);
      expect(table.rows[1].MeanSquare).toBe('8.35000');
      
      // Total row
      expect(table.rows[2].rowHeader).toEqual(['Variable 1']);
      expect(table.rows[2].type).toBe('Total');
      expect(table.rows[2].SumOfSquares).toBe('1881.93000');
      expect(table.rows[2].df).toBe(59);
    });

    it('should handle empty results', () => {
      const emptyResults: OneWayAnovaResult[] = [];

      const table = formatOneWayAnovaTable(emptyResults);
      
      expect(table.title).toBe('ANOVA');
      expect(table.columnHeaders).toHaveLength(1);
      expect(table.columnHeaders[0].header).toBe('No Data');
      expect(table.rows).toHaveLength(0);
    });

    it('should skip invalid ANOVA results', () => {
      const mockResults: OneWayAnovaResult[] = [
        {
          variable1: mockVariable,
          variable2: mockVariable,
          oneWayAnova: {
            SumOfSquares: 1405.73,
            df: 2,
            MeanSquare: 702.87,
            F: 84.13,
            Sig: NaN, // Invalid value
            withinGroupsSumOfSquares: 476.20,
            withinGroupsDf: 57,
            withinGroupsMeanSquare: 8.35,
            totalSumOfSquares: 1881.93,
            totalDf: 59
          }
        }
      ];

      const table = formatOneWayAnovaTable(mockResults);
      
      // Should still process the result even with invalid Sig value
      expect(table.rows).toHaveLength(3); // Between Groups, Within Groups, Total
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
      const mockResults: OneWayAnovaResult[] = [
        {
          variable1: mockVariable,
          variable2: mockVariable,
          descriptives: [
            {
              factor: 'A',
              N: 20,
              Mean: 77.7,
              StdDeviation: 2.68,
              StdError: 0.60,
              LowerBound: 76.45,
              UpperBound: 78.95,
              Minimum: 74,
              Maximum: 82
            },
            {
              factor: 'B',
              N: 20,
              Mean: 72.8,
              StdDeviation: 2.86,
              StdError: 0.64,
              LowerBound: 71.46,
              UpperBound: 74.14,
              Minimum: 69,
              Maximum: 78
            }
          ]
        }
      ];

      const table = formatDescriptiveStatisticsTable(mockResults);
      
      expect(table.title).toBe('Descriptives');
      expect(table.columnHeaders).toHaveLength(9);
      expect(table.rows).toHaveLength(2);
      
      // First group row
      expect(table.rows[0].rowHeader).toEqual(['Variable 1']);
      expect(table.rows[0].factor).toBe('A');
      expect(table.rows[0].N).toBe(20);
      expect(table.rows[0].Mean).toBe('77.7000');
      expect(table.rows[0].StdDeviation).toBe('2.68000');
      expect(table.rows[0].StdError).toBe('0.60000');
      expect(table.rows[0].LowerBound).toBe('76.4500');
      expect(table.rows[0].UpperBound).toBe('78.9500');
      expect(table.rows[0].Minimum).toBe('74.00');
      expect(table.rows[0].Maximum).toBe('82.00');
      
      // Second group row
      expect(table.rows[1].rowHeader).toEqual(['Variable 1']);
      expect(table.rows[1].factor).toBe('B');
      expect(table.rows[1].N).toBe(20);
      expect(table.rows[1].Mean).toBe('72.8000');
    });

    it('should handle empty results', () => {
      const emptyResults: OneWayAnovaResult[] = [];

      const table = formatDescriptiveStatisticsTable(emptyResults);
      
      expect(table.title).toBe('Descriptives');
      expect(table.columnHeaders).toHaveLength(1);
      expect(table.columnHeaders[0].header).toBe('No Data');
      expect(table.rows).toHaveLength(0);
    });
  });

  describe('formatHomogeneityOfVarianceTable', () => {
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

    it('should format homogeneity of variance table with valid data', () => {
      const mockResults: OneWayAnovaResult[] = [
        {
          variable1: mockVariable,
          variable2: mockVariable,
          homogeneityOfVariances: [
            {
              type: 'Based on Mean',
              LeveneStatistic: 0.22,
              df1: 2,
              df2: 57,
              Sig: 0.802
            },
            {
              type: 'Based on Median',
              LeveneStatistic: 0.22,
              df1: 2,
              df2: 57,
              Sig: 0.806
            }
          ]
        }
      ];

      const table = formatHomogeneityOfVarianceTable(mockResults);
      
      expect(table.title).toBe('Test of Homogeneity of Variances');
      expect(table.columnHeaders).toHaveLength(6);
      expect(table.rows).toHaveLength(2);
      
      // First test row
      expect(table.rows[0].rowHeader).toEqual(['Variable 1']);
      expect(table.rows[0].type).toBe('Based on Mean');
      expect(table.rows[0].LeveneStatistic).toBe('0.22000');
      expect(table.rows[0].df1).toBe(2);
      expect(table.rows[0].df2).toBe(57);
      expect(table.rows[0].Sig).toBe('0.802');
      
      // Second row
      expect(table.rows[1].rowHeader).toEqual(['Variable 1']);
      expect(table.rows[1].type).toBe('Based on Median');
      expect(table.rows[1].LeveneStatistic).toBe('0.22000');
      expect(table.rows[1].df1).toBe(2);
      expect(table.rows[1].df2).toBe(57);
      expect(table.rows[1].Sig).toBe('0.806');
    });

    it('should handle empty results', () => {
      const emptyResults: OneWayAnovaResult[] = [];

      const table = formatHomogeneityOfVarianceTable(emptyResults);
      
      expect(table.title).toBe('Test of Homogeneity of Variances');
      expect(table.columnHeaders).toHaveLength(1);
      expect(table.columnHeaders[0].header).toBe('No Data');
      expect(table.rows).toHaveLength(0);
    });
  });

  describe('formatMultipleComparisonsTable', () => {
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

    it('should format multiple comparisons table with valid data', () => {
      const mockResults: OneWayAnovaResult[] = [
        {
          variable1: mockVariable,
          variable2: mockVariable,
          multipleComparisons: [
            {
              method: 'Tukey HSD',
              factor1: 'A',
              factor2: 'B',
              meanDifference: 4.9,
              stdError: 0.91,
              Sig: 0.001,
              lowerBound: 2.7,
              upperBound: 7.1
            },
            {
              method: 'Tukey HSD',
              factor1: 'A',
              factor2: 'C',
              meanDifference: -6.9,
              stdError: 0.91,
              Sig: 0.000,
              lowerBound: -9.1,
              upperBound: -4.7
            }
          ]
        }
      ];

      const table = formatMultipleComparisonsTable(mockResults, 'Group');
      
      expect(table.title).toBe('Multiple Comparisons');
      expect(table.columnHeaders).toHaveLength(7);
      expect(table.rows).toHaveLength(2);
      
      // First comparison row
      expect(table.rows[0].rowHeader).toEqual(['Variable 1']);
      expect(table.rows[0].factor1).toBe('A');
      expect(table.rows[0].factor2).toBe('B');
      expect(table.rows[0].meanDifference).toBe('4.90');
      expect(table.rows[0].stdError).toBe('0.91');
      expect(table.rows[0].Sig).toBe('0.001');
      expect(table.rows[0].lowerBound).toBe('2.70');
      expect(table.rows[0].upperBound).toBe('7.10');
      
      // Second comparison row
      expect(table.rows[1].rowHeader).toEqual(['Variable 1']);
      expect(table.rows[1].factor1).toBe('A');
      expect(table.rows[1].factor2).toBe('C');
      expect(table.rows[1].meanDifference).toBe('-6.90');
      expect(table.rows[1].Sig).toBe('<.001');
    });

    it('should handle empty results', () => {
      const emptyResults: OneWayAnovaResult[] = [];

      const table = formatMultipleComparisonsTable(emptyResults, 'Group');
      
      expect(table.title).toBe('Multiple Comparisons');
      expect(table.columnHeaders).toHaveLength(1);
      expect(table.columnHeaders[0].header).toBe('No Data');
      expect(table.rows).toHaveLength(0);
    });
  });

  describe('formatHomogeneousSubsetsTable', () => {
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

    it('should format homogeneous subsets table with valid data', () => {
      const mockResult: OneWayAnovaResult = {
        variable1: mockVariable,
        variable2: mockVariable,
        homogeneousSubsets: [
          {
            method: 'Tukey HSD',
            subsetCount: 3,
            output: [
              {
                method: 'Tukey HSD',
                factor: 'B',
                N: 20,
                subset1: 72.8
              },
              {
                method: 'Tukey HSD',
                factor: 'A',
                N: 20,
                subset2: 77.7
              },
              {
                method: 'Tukey HSD',
                factor: 'C',
                N: 20,
                subset3: 84.6
              },
              {
                method: 'Tukey HSD',
                factor: 'Sig.',
                subset1: 1,
                subset2: 1,
                subset3: 1
              }
            ]
          }
        ]
      };

      const table = formatHomogeneousSubsetsTable(mockResult, 'Group', mockVariable);
      
      expect(table.title).toBe('Variable 1');
      expect(table.columnHeaders).toHaveLength(4);
      expect(table.rows).toHaveLength(4);
      
      // Check that we have the expected structure
      expect(table.rows[0]).toHaveProperty('rowHeader');
      expect(table.rows[0]).toHaveProperty('factor');
      expect(table.rows[0]).toHaveProperty('N');
      expect(table.rows[0]).toHaveProperty('subset1');
      
      expect(table.rows[1]).toHaveProperty('rowHeader');
      expect(table.rows[1]).toHaveProperty('factor');
      expect(table.rows[1]).toHaveProperty('N');
      expect(table.rows[1]).toHaveProperty('subset2');
      
      expect(table.rows[2]).toHaveProperty('rowHeader');
      expect(table.rows[2]).toHaveProperty('factor');
      expect(table.rows[2]).toHaveProperty('N');
      expect(table.rows[2]).toHaveProperty('subset3');
      
      expect(table.rows[3]).toHaveProperty('rowHeader');
      expect(table.rows[3]).toHaveProperty('factor');
      expect(table.rows[3]).toHaveProperty('subset1');
      expect(table.rows[3]).toHaveProperty('subset2');
      expect(table.rows[3]).toHaveProperty('subset3');
    });

    it('should handle empty results', () => {
      const emptyResult: OneWayAnovaResult = {
        variable1: mockVariable,
        variable2: mockVariable
        // No homogeneousSubsets property
      };

      const table = formatHomogeneousSubsetsTable(emptyResult, 'Group', mockVariable);
      
      expect(table.title).toBe('Variable 1');
      expect(table.columnHeaders).toHaveLength(1);
      expect(table.columnHeaders[0].header).toBe('No Data');
      expect(table.rows).toHaveLength(0);
    });

    it('should handle missing homogeneous subsets', () => {
      const mockResult: OneWayAnovaResult = {
        variable1: mockVariable,
        variable2: mockVariable
        // No homogeneousSubsets property
      };

      const table = formatHomogeneousSubsetsTable(mockResult, 'Group', mockVariable);
      
      expect(table.title).toBe('Variable 1');
      expect(table.columnHeaders).toHaveLength(1);
      expect(table.columnHeaders[0].header).toBe('No Data');
      expect(table.rows).toHaveLength(0);
    });
  });

  describe('formatErrorTable', () => {
    it('should return empty error table', () => {
      const table = formatErrorTable();
      
      expect(table.title).toBe('');
      expect(table.columnHeaders).toHaveLength(1);
      expect(table.columnHeaders[0].header).toBe('No Data');
      expect(table.rows).toHaveLength(0);
    });
  });
}); 