import {
  formatNumber,
  formatPValue,
  formatDF,
  formatPairedSamplesStatisticsTable,
  formatPairedSamplesCorrelationTable,
  formatPairedSamplesTestTable
} from '../utils/formatters';
import { 
  PairedSamplesTTestResult, 
  PairedSamplesStatistics, 
  PairedSamplesCorrelation,
  PairedSamplesTest 
} from '../types';
import { Variable, VariableType } from '@/types/Variable';

describe('PairedSamplesTTest Formatters', () => {
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

  describe('formatPairedSamplesStatisticsTable', () => {
    const mockVariable1: Variable = {
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

    const mockVariable2: Variable = {
      name: 'var2',
      label: 'Variable 2',
      columnIndex: 1,
      type: 'NUMERIC' as VariableType,
      tempId: '2',
      width: 8,
      decimals: 2,
      values: [],
      missing: {},
      align: 'left',
      measure: 'scale',
      role: 'input',
      columns: 8
    };

    it('should format paired samples statistics table with valid data', () => {
      const mockResults: PairedSamplesTTestResult[] = [
        {
          variable1: mockVariable1,
          variable2: mockVariable2,
          pair: 1,
          metadata: {
            pair: 1,
            hasInsufficientData: false,
            totalData1: 10,
            validData1: 10,
            totalData2: 10,
            validData2: 10,
            variable1Name: 'var1',
            variable2Name: 'var2'
          },
          pairedSamplesStatistics: {
            group1: {
              label: 'Variable 1',
              Mean: 15.5,
              N: 10,
              StdDev: 3.2,
              SEMean: 1.01
            },
            group2: {
              label: 'Variable 2',
              Mean: 18.3,
              N: 10,
              StdDev: 4.1,
              SEMean: 1.18
            }
          }
        }
      ];

      const table = formatPairedSamplesStatisticsTable(mockResults);
      
      expect(table.title).toBe('Paired Samples Statistics');
      expect(table.columnHeaders).toHaveLength(6);
      expect(table.rows).toHaveLength(2);
      
      // Group 1 row
      expect(table.rows[0].rowHeader).toEqual(['Pair 1']);
      expect(table.rows[0].group).toBe('Variable 1');
      expect(table.rows[0].N).toBe(10);
      expect(table.rows[0].Mean).toBe('15.5000');
      expect(table.rows[0].StdDev).toBe('3.20000');
      expect(table.rows[0].SEMean).toBe('1.01000');
      
      // Group 2 row
      expect(table.rows[1].rowHeader).toEqual(['Pair 1']);
      expect(table.rows[1].group).toBe('Variable 2');
      expect(table.rows[1].N).toBe(10);
      expect(table.rows[1].Mean).toBe('18.3000');
      expect(table.rows[1].StdDev).toBe('4.10000');
      expect(table.rows[1].SEMean).toBe('1.18000');
    });

    it('should handle empty results', () => {
      const emptyResults: PairedSamplesTTestResult[] = [];

      const table = formatPairedSamplesStatisticsTable(emptyResults);
      
      expect(table.title).toBe('No Data');
      expect(table.columnHeaders).toHaveLength(1);
      expect(table.columnHeaders[0].header).toBe('No Data');
      expect(table.rows).toHaveLength(0);
    });

    it('should handle results with missing pairedSamplesStatistics', () => {
      const mockResults: PairedSamplesTTestResult[] = [
        {
          variable1: mockVariable1,
          variable2: mockVariable2,
          pair: 1,
          metadata: {
            pair: 1,
            hasInsufficientData: false,
            totalData1: 10,
            validData1: 10,
            totalData2: 10,
            validData2: 10,
            variable1Name: 'var1',
            variable2Name: 'var2'
          },
          pairedSamplesStatistics: undefined
        }
      ];

      const table = formatPairedSamplesStatisticsTable(mockResults);
      
      expect(table.title).toBe('Paired Samples Statistics');
      expect(table.columnHeaders).toHaveLength(6);
      expect(table.rows).toHaveLength(0);
    });

    it('should handle results with zero sample sizes', () => {
      const mockResults: PairedSamplesTTestResult[] = [
        {
          variable1: mockVariable1,
          variable2: mockVariable2,
          pair: 1,
          metadata: {
            pair: 1,
            hasInsufficientData: false,
            totalData1: 0,
            validData1: 0,
            totalData2: 0,
            validData2: 0,
            variable1Name: 'var1',
            variable2Name: 'var2'
          },
          pairedSamplesStatistics: {
            group1: {
              label: 'Variable 1',
              Mean: 0,
              N: 0,
              StdDev: 0,
              SEMean: 0
            },
            group2: {
              label: 'Variable 2',
              Mean: 0,
              N: 0,
              StdDev: 0,
              SEMean: 0
            }
          }
        }
      ];

      const table = formatPairedSamplesStatisticsTable(mockResults);
      
      expect(table.rows).toHaveLength(2);
      expect(table.rows[0].Mean).toBeNull();
      expect(table.rows[0].StdDev).toBeNull();
      expect(table.rows[0].SEMean).toBeNull();
      expect(table.rows[0].N).toBe(0);
      expect(table.rows[1].Mean).toBeNull();
      expect(table.rows[1].StdDev).toBeNull();
      expect(table.rows[1].SEMean).toBeNull();
      expect(table.rows[1].N).toBe(0);
    });
  });

  describe('formatPairedSamplesCorrelationTable', () => {
    const mockVariable1: Variable = {
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

    const mockVariable2: Variable = {
      name: 'var2',
      label: 'Variable 2',
      columnIndex: 1,
      type: 'NUMERIC' as VariableType,
      tempId: '2',
      width: 8,
      decimals: 2,
      values: [],
      missing: {},
      align: 'left',
      measure: 'scale',
      role: 'input',
      columns: 8
    };

    it('should format paired samples correlation table with valid data', () => {
      const mockResults: PairedSamplesTTestResult[] = [
        {
          variable1: mockVariable1,
          variable2: mockVariable2,
          pair: 1,
          metadata: {
            pair: 1,
            hasInsufficientData: false,
            totalData1: 10,
            validData1: 10,
            totalData2: 10,
            validData2: 10,
            variable1Name: 'var1',
            variable2Name: 'var2'
          },
          pairedSamplesCorrelation: {
            correlationLabel: 'Variable 1 & Variable 2',
            N: 10,
            Correlation: 0.85,
            correlationPValue: 0.002
          }
        }
      ];

      const table = formatPairedSamplesCorrelationTable(mockResults);
      
      expect(table.title).toBe('Paired Samples Correlation');
      expect(table.columnHeaders).toHaveLength(5);
      expect(table.rows).toHaveLength(1);
      
      expect(table.rows[0].rowHeader).toEqual(['Pair 1']);
      expect(table.rows[0].correlationLabel).toBe('Variable 1 & Variable 2');
      expect(table.rows[0].N).toBe(10);
      expect(table.rows[0].Correlation).toBe('0.85000');
      expect(table.rows[0].PValue).toBe('0.002');
    });

    it('should handle empty results', () => {
      const emptyResults: PairedSamplesTTestResult[] = [];

      const table = formatPairedSamplesCorrelationTable(emptyResults);
      
      expect(table.title).toBe('No Data');
      expect(table.columnHeaders).toHaveLength(1);
      expect(table.columnHeaders[0].header).toBe('No Data');
      expect(table.rows).toHaveLength(0);
    });

    it('should handle results with missing pairedSamplesCorrelation', () => {
      const mockResults: PairedSamplesTTestResult[] = [
        {
          variable1: mockVariable1,
          variable2: mockVariable2,
          pair: 1,
          metadata: {
            pair: 1,
            hasInsufficientData: false,
            totalData1: 10,
            validData1: 10,
            totalData2: 10,
            validData2: 10,
            variable1Name: 'var1',
            variable2Name: 'var2'
          },
          pairedSamplesCorrelation: undefined
        }
      ];

      const table = formatPairedSamplesCorrelationTable(mockResults);
      
      expect(table.title).toBe('Paired Samples Correlation');
      expect(table.columnHeaders).toHaveLength(5);
      expect(table.rows).toHaveLength(0);
    });

    it('should handle correlation with different decimal precision', () => {
      const mockVariable1HighPrecision: Variable = {
        ...mockVariable1,
        decimals: 4
      };

      const mockVariable2LowPrecision: Variable = {
        ...mockVariable2,
        decimals: 1
      };

      const mockResults: PairedSamplesTTestResult[] = [
        {
          variable1: mockVariable1HighPrecision,
          variable2: mockVariable2LowPrecision,
          pair: 1,
          metadata: {
            pair: 1,
            hasInsufficientData: false,
            totalData1: 10,
            validData1: 10,
            totalData2: 10,
            validData2: 10,
            variable1Name: 'var1',
            variable2Name: 'var2'
          },
          pairedSamplesCorrelation: {
            correlationLabel: 'Variable 1 & Variable 2',
            N: 10,
            Correlation: 0.12345,
            correlationPValue: 0.001
          }
        }
      ];

      const table = formatPairedSamplesCorrelationTable(mockResults);
      
      // Should use max decimals + 3 (4 + 3 = 7)
      expect(table.rows[0].Correlation).toBe('0.1234500');
    });
  });

  describe('formatPairedSamplesTestTable', () => {
    const mockVariable1: Variable = {
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

    const mockVariable2: Variable = {
      name: 'var2',
      label: 'Variable 2',
      columnIndex: 1,
      type: 'NUMERIC' as VariableType,
      tempId: '2',
      width: 8,
      decimals: 2,
      values: [],
      missing: {},
      align: 'left',
      measure: 'scale',
      role: 'input',
      columns: 8
    };

    it('should format paired samples test table with valid data', () => {
      const mockResults: PairedSamplesTTestResult[] = [
        {
          variable1: mockVariable1,
          variable2: mockVariable2,
          pair: 1,
          metadata: {
            pair: 1,
            hasInsufficientData: false,
            totalData1: 10,
            validData1: 10,
            totalData2: 10,
            validData2: 10,
            variable1Name: 'var1',
            variable2Name: 'var2'
          },
          pairedSamplesTest: {
            label: 'Variable 1 - Variable 2',
            Mean: -2.8,
            StdDev: 1.5,
            SEMean: 0.47,
            LowerCI: -3.85,
            UpperCI: -1.75,
            t: -5.96,
            df: 9,
            pValue: 0.000
          }
        }
      ];

      const table = formatPairedSamplesTestTable(mockResults);
      
      expect(table.title).toBe('Paired Samples Test');
      expect(table.columnHeaders).toHaveLength(6);
      expect(table.rows).toHaveLength(1);
      
      expect(table.rows[0].rowHeader).toEqual(['Pair 1']);
      expect(table.rows[0].Label).toBe('Variable 1 - Variable 2');
      expect(table.rows[0].Mean).toBe('-2.80000');
      expect(table.rows[0].StdDev).toBe('1.50000');
      expect(table.rows[0].SEMean).toBe('0.47000');
      expect(table.rows[0].LowerCI).toBe('-3.85000');
      expect(table.rows[0].UpperCI).toBe('-1.75000');
      expect(table.rows[0].t).toBe('-5.96000');
      expect(table.rows[0].df).toBe(9);
      expect(table.rows[0].pValue).toBe('<.001');
    });

    it('should handle empty results', () => {
      const emptyResults: PairedSamplesTTestResult[] = [];

      const table = formatPairedSamplesTestTable(emptyResults);
      
      expect(table.title).toBe('No Data');
      expect(table.columnHeaders).toHaveLength(1);
      expect(table.columnHeaders[0].header).toBe('No Data');
      expect(table.rows).toHaveLength(0);
    });

    it('should handle results with missing pairedSamplesTest', () => {
      const mockResults: PairedSamplesTTestResult[] = [
        {
          variable1: mockVariable1,
          variable2: mockVariable2,
          pair: 1,
          metadata: {
            pair: 1,
            hasInsufficientData: false,
            totalData1: 10,
            validData1: 10,
            totalData2: 10,
            validData2: 10,
            variable1Name: 'var1',
            variable2Name: 'var2'
          },
          pairedSamplesTest: undefined
        }
      ];

      const table = formatPairedSamplesTestTable(mockResults);
      
      expect(table.title).toBe('Paired Samples Test');
      expect(table.columnHeaders).toHaveLength(6);
      expect(table.rows).toHaveLength(0);
    });

    it('should handle non-integer degrees of freedom', () => {
      const mockResults: PairedSamplesTTestResult[] = [
        {
          variable1: mockVariable1,
          variable2: mockVariable2,
          pair: 1,
          metadata: {
            pair: 1,
            hasInsufficientData: false,
            totalData1: 10,
            validData1: 10,
            totalData2: 10,
            validData2: 10,
            variable1Name: 'var1',
            variable2Name: 'var2'
          },
          pairedSamplesTest: {
            label: 'Variable 1 - Variable 2',
            Mean: -2.8,
            StdDev: 1.5,
            SEMean: 0.47,
            LowerCI: -3.85,
            UpperCI: -1.75,
            t: -5.96,
            df: 9.5,
            pValue: 0.000
          }
        }
      ];

      const table = formatPairedSamplesTestTable(mockResults);
      
      expect(table.rows[0].df).toBe('9.500');
    });

    it('should handle different decimal precision for variables', () => {
      const mockVariable1HighPrecision: Variable = {
        ...mockVariable1,
        decimals: 4
      };

      const mockVariable2LowPrecision: Variable = {
        ...mockVariable2,
        decimals: 1
      };

      const mockResults: PairedSamplesTTestResult[] = [
        {
          variable1: mockVariable1HighPrecision,
          variable2: mockVariable2LowPrecision,
          pair: 1,
          metadata: {
            pair: 1,
            hasInsufficientData: false,
            totalData1: 10,
            validData1: 10,
            totalData2: 10,
            validData2: 10,
            variable1Name: 'var1',
            variable2Name: 'var2'
          },
          pairedSamplesTest: {
            label: 'Variable 1 - Variable 2',
            Mean: -2.8,
            StdDev: 1.5,
            SEMean: 0.47,
            LowerCI: -3.85,
            UpperCI: -1.75,
            t: -5.96,
            df: 9,
            pValue: 0.000
          }
        }
      ];

      const table = formatPairedSamplesTestTable(mockResults);
      
      // Should use max decimals + 3 (4 + 3 = 7)
      expect(table.rows[0].Mean).toBe('-2.8000000');
      expect(table.rows[0].StdDev).toBe('1.5000000');
      expect(table.rows[0].SEMean).toBe('0.4700000');
      expect(table.rows[0].LowerCI).toBe('-3.8500000');
      expect(table.rows[0].UpperCI).toBe('-1.7500000');
      expect(table.rows[0].t).toBe('-5.9600000');
    });

    it('should skip invalid test results', () => {
      const mockResults: PairedSamplesTTestResult[] = [
        {
          variable1: mockVariable1,
          variable2: mockVariable2,
          pair: 1,
          metadata: {
            pair: 1,
            hasInsufficientData: true, // This should cause the result to be skipped
            totalData1: 10,
            validData1: 10,
            totalData2: 10,
            validData2: 10,
            variable1Name: 'var1',
            variable2Name: 'var2'
          },
          pairedSamplesTest: {
            label: 'Variable 1 - Variable 2',
            Mean: -2.8,
            StdDev: 1.5,
            SEMean: 0.47,
            LowerCI: -3.85,
            UpperCI: -1.75,
            t: -5.96,
            df: 9,
            pValue: 0.000
          }
        }
      ];

      const table = formatPairedSamplesTestTable(mockResults);
      
      // Should not add any rows for results with insufficient data
      expect(table.rows).toHaveLength(0);
    });

    it('should handle multiple pairs', () => {
      const mockResults: PairedSamplesTTestResult[] = [
        {
          variable1: mockVariable1,
          variable2: mockVariable2,
          pair: 1,
          metadata: {
            pair: 1,
            hasInsufficientData: false,
            totalData1: 10,
            validData1: 10,
            totalData2: 10,
            validData2: 10,
            variable1Name: 'var1',
            variable2Name: 'var2'
          },
          pairedSamplesTest: {
            label: 'Variable 1 - Variable 2',
            Mean: -2.8,
            StdDev: 1.5,
            SEMean: 0.47,
            LowerCI: -3.85,
            UpperCI: -1.75,
            t: -5.96,
            df: 9,
            pValue: 0.000
          }
        },
        {
          variable1: mockVariable2,
          variable2: mockVariable1,
          pair: 2,
          metadata: {
            pair: 2,
            hasInsufficientData: false,
            totalData1: 10,
            validData1: 10,
            totalData2: 10,
            validData2: 10,
            variable1Name: 'var2',
            variable2Name: 'var1'
          },
          pairedSamplesTest: {
            label: 'Variable 2 - Variable 1',
            Mean: 2.8,
            StdDev: 1.5,
            SEMean: 0.47,
            LowerCI: 1.75,
            UpperCI: 3.85,
            t: 5.96,
            df: 9,
            pValue: 0.000
          }
        }
      ];

      const table = formatPairedSamplesTestTable(mockResults);
      
      expect(table.rows).toHaveLength(2);
      expect(table.rows[0].rowHeader).toEqual(['Pair 1']);
      expect(table.rows[1].rowHeader).toEqual(['Pair 2']);
      expect(table.rows[0].Mean).toBe('-2.80000');
      expect(table.rows[1].Mean).toBe('2.80000');
    });
  });
});
