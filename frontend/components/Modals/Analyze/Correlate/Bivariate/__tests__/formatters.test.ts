import {
  formatNumber,
  formatPValue,
  formatDF,
  formatCorrelationValue,
  formatCorrelationTable,
  formatPartialCorrelationTable,
  formatDescriptiveStatisticsTable
} from '../utils/formatters';
import { BivariateResults } from '../types';
import { Variable, VariableType } from '@/types/Variable';

describe('Bivariate Correlation Formatters', () => {
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

  describe('formatCorrelationValue', () => {
    const options = { flagSignificantCorrelations: true };

    it('should format correlation values with 3 decimal places', () => {
      expect(formatCorrelationValue(0.123456, 0.05, options)).toBe('0.123');
      expect(formatCorrelationValue(-0.789, 0.01, options)).toBe('-0.789 *');
      expect(formatCorrelationValue(1, null, options)).toBe(1);
    });

    it('should add significance flags when flagSignificantCorrelations is true', () => {
      expect(formatCorrelationValue(0.5, 0.005, options)).toBe('0.500 **');
      expect(formatCorrelationValue(0.3, 0.03, options)).toBe('0.300 *');
      expect(formatCorrelationValue(0.1, 0.1, options)).toBe('0.100');
    });

    it('should not add significance flags when flagSignificantCorrelations is false', () => {
      const optionsNoFlag = { flagSignificantCorrelations: false };
      expect(formatCorrelationValue(0.5, 0.005, optionsNoFlag)).toBe('0.500');
      expect(formatCorrelationValue(0.3, 0.03, optionsNoFlag)).toBe('0.300');
    });

    it('should handle null or undefined values', () => {
      expect(formatCorrelationValue(null, 0.05, options)).toBeNull();
      expect(formatCorrelationValue(undefined, 0.05, options)).toBeNull();
    });
  });

  describe('formatDescriptiveStatisticsTable', () => {
    it('should format descriptive statistics table with valid data', () => {
      const mockResults: BivariateResults = {
        descriptiveStatistics: [
          {
            variable: 'var1',
            Mean: 15.5,
            StdDev: 3.2,
            N: 10
          },
          {
            variable: 'var2',
            Mean: 20.1,
            StdDev: 4.5,
            N: 10
          }
        ],
        correlation: [],
        partialCorrelation: []
      };

      const table = formatDescriptiveStatisticsTable(mockResults);
      
      expect(table.title).toBe('Descriptive Statistics');
      expect(table.columnHeaders).toHaveLength(4);
      expect(table.rows).toHaveLength(2);
      expect(table.rows[0].rowHeader).toEqual(['var1']);
      expect(table.rows[0].Mean).toBe('15.500');
      expect(table.rows[0].StdDev).toBe('3.200');
      expect(table.rows[0].N).toBe(10);
    });

    it('should handle empty results', () => {
      const emptyResults: BivariateResults = {
        descriptiveStatistics: [],
        correlation: [],
        partialCorrelation: []
      };

      const table = formatDescriptiveStatisticsTable(emptyResults);
      
      expect(table.title).toBe('No Data');
      expect(table.columnHeaders).toHaveLength(1);
      expect(table.columnHeaders[0].header).toBe('No Data');
      expect(table.rows).toHaveLength(0);
    });
  });

  describe('formatCorrelationTable', () => {
    const mockTestVariables: Variable[] = [
      {
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
      },
      {
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
      }
    ];

    const mockOptions = {
      testOfSignificance: {
        oneTailed: false,
        twoTailed: true
      },
      flagSignificantCorrelations: true,
      showOnlyTheLowerTriangle: false,
      showDiagonal: true,
      statisticsOptions: {
        meansAndStandardDeviations: false,
        crossProductDeviationsAndCovariances: false,
      },
    };

    it('should format correlation table with Pearson correlation', () => {
      const mockResults: BivariateResults = {
        descriptiveStatistics: [],
        correlation: [
          {
            variable1: 'var1',
            variable2: 'var1',
            pearsonCorrelation: {
              Pearson: 1,
              PValue: null,
              SumOfSquares: 100,
              Covariance: 10,
              N: 10
            }
          },
          {
            variable1: 'var1',
            variable2: 'var2',
            pearsonCorrelation: {
              Pearson: 0.8,
              PValue: 0.01,
              SumOfSquares: 50,
              Covariance: 5,
              N: 10
            }
          },
          {
            variable1: 'var2',
            variable2: 'var2',
            pearsonCorrelation: {
              Pearson: 1,
              PValue: null,
              SumOfSquares: 200,
              Covariance: 20,
              N: 10
            }
          }
        ],
        partialCorrelation: []
      };

      const table = formatCorrelationTable(mockResults, mockOptions, mockTestVariables, ['Pearson']);
      
      expect(table.title).toBe('Correlation');
      expect(table.columnHeaders.length).toBeGreaterThan(3);
      expect(table.rows.length).toBeGreaterThan(0);
      
      // Check that diagonal elements are 1
      const correlationRows = table.rows.filter(row => row.type === 'Pearson Correlation');
      expect(correlationRows.length).toBeGreaterThan(0);
    });

    it('should handle empty correlation results', () => {
      const emptyResults: BivariateResults = {
        descriptiveStatistics: [],
        correlation: [],
        partialCorrelation: []
      };

      const table = formatCorrelationTable(emptyResults, mockOptions, mockTestVariables, ['Pearson']);
      
      expect(table.title).toBe('Correlation');
      expect(table.columnHeaders).toHaveLength(1);
      expect(table.columnHeaders[0].header).toBe('No Data');
      expect(table.rows).toHaveLength(0);
    });
  });

  describe('formatPartialCorrelationTable', () => {
    const mockTestVariables: Variable[] = [
      {
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
      },
      {
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
      },
      {
        name: 'var3',
        label: 'Variable 3',
        columnIndex: 2,
        type: 'NUMERIC' as VariableType,
        tempId: '3',
        width: 8,
        decimals: 2,
        values: [],
        missing: {},
        align: 'left',
        measure: 'scale',
        role: 'input',
        columns: 8
      }
    ];

    const mockOptions = {
      testOfSignificance: {
        oneTailed: false,
        twoTailed: true
      },
      flagSignificantCorrelations: true,
      showOnlyTheLowerTriangle: false,
      showDiagonal: true,
      statisticsOptions: {
        meansAndStandardDeviations: false,
        crossProductDeviationsAndCovariances: false,
      },
    };

    it('should format partial correlation table with valid data', () => {
      const mockResults: BivariateResults = {
        descriptiveStatistics: [],
        correlation: [],
        partialCorrelation: [
          {
            controlVariable: 'var1',
            variable1: 'var2',
            variable2: 'var3',
            partialCorrelation: {
              Correlation: 0.5,
              PValue: 0.05,
              df: 7
            }
          }
        ]
      };

      const table = formatPartialCorrelationTable(mockResults, mockOptions, mockTestVariables);
      
      expect(table.title).toBe('Partial Correlation');
      expect(table.columnHeaders.length).toBeGreaterThan(3);
      expect(table.rows.length).toBeGreaterThan(0);
      
      // Check that control variable column is empty
      const controlVarIndex = mockTestVariables.findIndex(v => v.name === 'var1');
      if (controlVarIndex !== -1) {
        const correlationRows = table.rows.filter(row => row.type === 'Correlation');
        correlationRows.forEach(row => {
          expect(row[`var_${controlVarIndex}`]).toBe('');
        });
      }
    });

    it('should handle empty partial correlation results', () => {
      const emptyResults: BivariateResults = {
        descriptiveStatistics: [],
        correlation: [],
        partialCorrelation: []
      };

      const table = formatPartialCorrelationTable(emptyResults, mockOptions, mockTestVariables);
      
      expect(table.title).toBe('Partial Correlation');
      expect(table.columnHeaders).toHaveLength(1);
      expect(table.columnHeaders[0].header).toBe('No Data');
      expect(table.rows).toHaveLength(0);
    });
  });
}); 