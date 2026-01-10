import {
  formatNumber,
  formatPValue,
  formatDF,
  formatOneSampleStatisticsTable,
  formatOneSampleTestTable,
} from '../utils/formatters';
import { OneSampleTTestResult } from '../types';
import { Variable, VariableType } from '@/types/Variable';

describe('OneSampleTTest Formatters', () => {
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

  describe('formatOneSampleStatisticsTable', () => {
    const mockVariable: Variable = {
      name: 'var1',
      label: 'Variable 1',
      columnIndex: 0,
      type: 'NUMERIC' as VariableType,
      tempId: '1',
      width: 8,
      decimals: 0,
      values: [],
      missing: {},
      align: 'left',
      measure: 'scale',
      role: 'input',
      columns: 8
    };

    it('should format statistics table with valid data', () => {
      const mockResults: OneSampleTTestResult[] = [
        {
          variable1: mockVariable,
          oneSampleStatistics: {
            N: 10,
            Mean: 15.5,
            StdDev: 3.2,
            SEMean: 1.01
          }
        }
      ];

      const table = formatOneSampleStatisticsTable(mockResults);
      
      expect(table.title).toBe('One-Sample Statistics');
      expect(table.columnHeaders).toHaveLength(5);
      expect(table.rows).toHaveLength(1);
      expect(table.rows[0].rowHeader).toEqual(['Variable 1']);
      expect(table.rows[0].N).toBe(10);
      expect(table.rows[0].Mean).toBe('15.50');
      expect(table.rows[0].StdDev).toBe('3.200');
      expect(table.rows[0].SEMean).toBe('1.010');
    });

    it('should handle empty results', () => {
      const emptyResults: OneSampleTTestResult[] = [];

      const table = formatOneSampleStatisticsTable(emptyResults);
      
      expect(table.title).toBe('One-Sample Statistics');
      expect(table.columnHeaders).toHaveLength(1);
      expect(table.columnHeaders[0].header).toBe('No Data');
      expect(table.rows).toHaveLength(0);
    });
  });

  describe('formatOneSampleTestTable', () => {
    const mockVariable: Variable = {
      name: 'var1',
      label: 'Variable 1',
      columnIndex: 0,
      type: 'NUMERIC' as VariableType,
      tempId: '1',
      width: 8,
      decimals: 0,
      values: [],
      missing: {},
      align: 'left',
      measure: 'scale',
      role: 'input',
      columns: 8
    };

    const testValue = 10;

    it('should format test table with valid data', () => {
      const mockResults: OneSampleTTestResult[] = [
        {
          variable1: mockVariable,
          testValue: testValue,
          oneSampleTest: {
            T: 2.5,
            DF: 9,
            PValue: 0.034,
            MeanDifference: 5.5,
            Lower: 0.48,
            Upper: 10.52
          }
        }
      ];

      const table = formatOneSampleTestTable(mockResults, testValue);
      
      expect(table.title).toBe('One-Sample Test');
      expect(table.columnHeaders).toHaveLength(2);
      expect(table.columnHeaders[1].header).toBe('Test Value = 10');
      expect(table.rows).toHaveLength(1);
      expect(table.rows[0].rowHeader).toEqual(['Variable 1']);
      expect(table.rows[0].T).toBe('2.500');
      expect(table.rows[0].DF).toBe(9);
      expect(table.rows[0].PValue).toBe('0.034');
      expect(table.rows[0].MeanDifference).toBe('5.500');
      expect(table.rows[0].Lower).toBe('0.48');
      expect(table.rows[0].Upper).toBe('10.52');
    });

    it('should handle empty results', () => {
      const emptyResults: OneSampleTTestResult[] = [];

      const table = formatOneSampleTestTable(emptyResults, testValue);
      
      expect(table.title).toBe('One-Sample Test');
      expect(table.columnHeaders).toHaveLength(1);
      expect(table.columnHeaders[0].header).toBe('No Data');
      expect(table.rows).toHaveLength(0);
    });
  });
}); 