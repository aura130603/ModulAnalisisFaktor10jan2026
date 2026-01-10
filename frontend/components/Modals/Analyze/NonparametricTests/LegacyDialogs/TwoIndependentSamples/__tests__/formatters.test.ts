import {
  formatFrequenciesRanksTable,
  formatMannWhitneyUTestStatisticsTable,
  formatKolmogorovSmirnovZTestStatisticsTable
} from '../utils/formatters';
import { TwoIndependentSamplesTestResult, TwoIndependentSamplesTestTable } from '../types';
import { Variable, VariableType, ValueLabel } from '@/types/Variable';

describe('TwoIndependentSamples Formatters', () => {
  const mockVariable: Variable = {
    name: 'var1',
    label: 'Variable 1',
    columnIndex: 0,
    type: 'NUMERIC' as VariableType,
    tempId: '1',
    width: 8,
    decimals: 0,
    values: [
      { variableId: 1, value: 1, label: '1' },
      { variableId: 1, value: 2, label: '2' },
      { variableId: 1, value: 3, label: '3' },
      { variableId: 1, value: 4, label: '4' },
      { variableId: 1, value: 5, label: '5' }
    ],
    missing: {},
    align: 'left',
    measure: 'scale',
    role: 'input',
    columns: 8
  };

  const mockGroupingVariable: Variable = {
    name: 'group',
    label: 'Group Variable',
    columnIndex: 1,
    type: 'NUMERIC' as VariableType,
    tempId: '2',
    width: 8,
    decimals: 0,
    values: [
      { variableId: 2, value: 1, label: 'Group1' },
      { variableId: 2, value: 2, label: 'Group2' }
    ],
    missing: {},
    align: 'left',
    measure: 'nominal',
    role: 'input',
    columns: 8
  };

  const mockResults: TwoIndependentSamplesTestResult[] = [
    {
      variable1: mockVariable,
      variable2: mockGroupingVariable,
      metadata: {
        hasInsufficientData: false,
        insufficentType: [],
        variableName: 'var1',
        variableLabel: 'Variable 1'
      },
      testStatisticsMannWhitneyU: {
        U: 15.5,
        W: 45.5,
        Z: 1.2,
        pValue: 0.123,
        pExact: 0.125,
        showExact: false
      },
      testStatisticsKolmogorovSmirnovZ: {
        D_absolute: 0.85,
        D_positive: 0.85,
        D_negative: 0.0,
        d_stat: 0.85,
        pValue: 0.456
      },
      descriptiveStatistics: {
        variable1: mockVariable,
        N: 20,
        Mean: 15.5,
        StdDev: 3.2,
        Min: 10,
        Max: 20,
        Percentile25: 12,
        Percentile50: 15,
        Percentile75: 18
      }
    }
  ];

  describe('formatFrequenciesRanksTable', () => {
    it('should format frequencies and ranks table for Mann-Whitney U test', () => {
      const result = formatFrequenciesRanksTable(mockResults, 'Group Variable', 'M-W');

      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('columnHeaders');
      expect(result).toHaveProperty('rows');
      expect(Array.isArray(result.columnHeaders)).toBe(true);
      expect(Array.isArray(result.rows)).toBe(true);
    });

    it('should format frequencies and ranks table for Kolmogorov-Smirnov Z test', () => {
      const result = formatFrequenciesRanksTable(mockResults, 'Group Variable', 'K-S');

      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('columnHeaders');
      expect(result).toHaveProperty('rows');
      expect(Array.isArray(result.columnHeaders)).toBe(true);
      expect(Array.isArray(result.rows)).toBe(true);
    });

    it('should handle insufficient data', () => {
      const insufficientResults: TwoIndependentSamplesTestResult[] = [
        {
          variable1: mockVariable,
          variable2: mockGroupingVariable,
          metadata: {
            hasInsufficientData: true,
            insufficentType: ['insufficientData'],
            variableName: 'var1',
            variableLabel: 'Variable 1'
          },
          testStatisticsMannWhitneyU: {
            U: 15.5,
            W: 45.5,
            Z: 1.2,
            pValue: 0.123,
            pExact: 0.125,
            showExact: false
          },
          testStatisticsKolmogorovSmirnovZ: {
            D_absolute: 0.85,
            D_positive: 0.85,
            D_negative: 0.0,
            d_stat: 0.85,
            pValue: 0.456
          },
          descriptiveStatistics: {
            variable1: mockVariable,
            N: 20,
            Mean: 15.5,
            StdDev: 3.2,
            Min: 10,
            Max: 20,
            Percentile25: 12,
            Percentile50: 15,
            Percentile75: 18
          }
        }
      ];

      const result = formatFrequenciesRanksTable(insufficientResults, 'Group Variable', 'M-W');

      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('columnHeaders');
      expect(result).toHaveProperty('rows');
    });

    it('should handle missing grouping variable label', () => {
      const result = formatFrequenciesRanksTable(mockResults, '', 'M-W');

      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('columnHeaders');
      expect(result).toHaveProperty('rows');
    });

    it('should handle null grouping variable label', () => {
      const result = formatFrequenciesRanksTable(mockResults, null as any, 'M-W');

      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('columnHeaders');
      expect(result).toHaveProperty('rows');
    });
  });

  describe('formatMannWhitneyUTestStatisticsTable', () => {
    it('should format Mann-Whitney U test statistics table', () => {
      const result = formatMannWhitneyUTestStatisticsTable(mockResults);

      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('columnHeaders');
      expect(result).toHaveProperty('rows');
      expect(Array.isArray(result.columnHeaders)).toBe(true);
      expect(Array.isArray(result.rows)).toBe(true);
    });

    it('should handle results without Mann-Whitney U test', () => {
      const resultsWithoutMW: TwoIndependentSamplesTestResult[] = [
        {
          variable1: mockVariable,
          variable2: mockGroupingVariable,
          testStatisticsMannWhitneyU: undefined,
          metadata: {
            hasInsufficientData: false,
            insufficentType: [],
            variableName: 'var1',
            variableLabel: 'Variable 1'
          },
          testStatisticsKolmogorovSmirnovZ: {
            D_absolute: 0.85,
            D_positive: 0.85,
            D_negative: 0.0,
            d_stat: 0.85,
            pValue: 0.456
          },
          descriptiveStatistics: {
            variable1: mockVariable,
            N: 20,
            Mean: 15.5,
            StdDev: 3.2,
            Min: 10,
            Max: 20,
            Percentile25: 12,
            Percentile50: 15,
            Percentile75: 18
          }
        }
      ];

      const result = formatMannWhitneyUTestStatisticsTable(resultsWithoutMW);

      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('columnHeaders');
      expect(result).toHaveProperty('rows');
    });

    it('should handle insufficient data', () => {
      const insufficientResults: TwoIndependentSamplesTestResult[] = [
        {
          variable1: mockVariable,
          variable2: mockGroupingVariable,
          metadata: {
            hasInsufficientData: true,
            insufficentType: ['insufficientData'],
            variableName: 'var1',
            variableLabel: 'Variable 1'
          },
          testStatisticsMannWhitneyU: {
            U: 15.5,
            W: 45.5,
            Z: 1.2,
            pValue: 0.123,
            pExact: 0.125,
            showExact: false
          },
          testStatisticsKolmogorovSmirnovZ: {
            D_absolute: 0.85,
            D_positive: 0.85,
            D_negative: 0.0,
            d_stat: 0.85,
            pValue: 0.456
          },
          descriptiveStatistics: {
            variable1: mockVariable,
            N: 20,
            Mean: 15.5,
            StdDev: 3.2,
            Min: 10,
            Max: 20,
            Percentile25: 12,
            Percentile50: 15,
            Percentile75: 18
          }
        }
      ];

      const result = formatMannWhitneyUTestStatisticsTable(insufficientResults);

      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('columnHeaders');
      expect(result).toHaveProperty('rows');
    });

    it('should handle multiple results', () => {
      const multipleResults: TwoIndependentSamplesTestResult[] = [
        {
          variable1: mockVariable,
          variable2: mockGroupingVariable,
          metadata: {
            hasInsufficientData: false,
            insufficentType: [],
            variableName: 'var1',
            variableLabel: 'Variable 1'
          },
          testStatisticsMannWhitneyU: {
            U: 15.5,
            W: 45.5,
            Z: 1.2,
            pValue: 0.123,
            pExact: 0.125,
            showExact: false
          },
          testStatisticsKolmogorovSmirnovZ: {
            D_absolute: 0.85,
            D_positive: 0.85,
            D_negative: 0.0,
            d_stat: 0.85,
            pValue: 0.456
          },
          descriptiveStatistics: {
            variable1: mockVariable,
            N: 20,
            Mean: 15.5,
            StdDev: 3.2,
            Min: 10,
            Max: 20,
            Percentile25: 12,
            Percentile50: 15,
            Percentile75: 18
          }
        },
        {
          variable1: { ...mockVariable, name: 'var2', label: 'Variable 2' },
          variable2: mockGroupingVariable,
          metadata: {
            hasInsufficientData: false,
            insufficentType: [],
            variableName: 'var2',
            variableLabel: 'Variable 2'
          },
          testStatisticsMannWhitneyU: {
            U: 18.2,
            W: 48.2,
            Z: 1.7,
            pValue: 0.089,
            pExact: 0.091,
            showExact: false
          },
          testStatisticsKolmogorovSmirnovZ: {
            D_absolute: 0.92,
            D_positive: 0.92,
            D_negative: 0.0,
            d_stat: 0.92,
            pValue: 0.367
          },
          descriptiveStatistics: {
            variable1: { ...mockVariable, name: 'var2', label: 'Variable 2' },
            N: 18,
            Mean: 17.8,
            StdDev: 2.9,
            Min: 12,
            Max: 22,
            Percentile25: 15,
            Percentile50: 18,
            Percentile75: 20
          }
        }
      ];

      const result = formatMannWhitneyUTestStatisticsTable(multipleResults);

      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('columnHeaders');
      expect(result).toHaveProperty('rows');
    });
  });

  describe('formatKolmogorovSmirnovZTestStatisticsTable', () => {
    it('should format Kolmogorov-Smirnov Z test statistics table', () => {
      const result = formatKolmogorovSmirnovZTestStatisticsTable(mockResults);

      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('columnHeaders');
      expect(result).toHaveProperty('rows');
      expect(Array.isArray(result.columnHeaders)).toBe(true);
      expect(Array.isArray(result.rows)).toBe(true);
    });

    it('should handle results without Kolmogorov-Smirnov Z test', () => {
      const resultsWithoutKS: TwoIndependentSamplesTestResult[] = [
        {
          variable1: mockVariable,
          variable2: mockGroupingVariable,
          testStatisticsKolmogorovSmirnovZ: undefined,
          metadata: {
            hasInsufficientData: false,
            insufficentType: [],
            variableName: 'var1',
            variableLabel: 'Variable 1'
          },
          testStatisticsMannWhitneyU: {
            U: 15.5,
            W: 45.5,
            Z: 1.2,
            pValue: 0.123,
            pExact: 0.125,
            showExact: false
          },
          descriptiveStatistics: {
            variable1: mockVariable,
            N: 20,
            Mean: 15.5,
            StdDev: 3.2,
            Min: 10,
            Max: 20,
            Percentile25: 12,
            Percentile50: 15,
            Percentile75: 18
          }
        }
      ];

      const result = formatKolmogorovSmirnovZTestStatisticsTable(resultsWithoutKS);

      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('columnHeaders');
      expect(result).toHaveProperty('rows');
    });

    it('should handle insufficient data', () => {
      const insufficientResults: TwoIndependentSamplesTestResult[] = [
        {
          variable1: mockVariable,
          variable2: mockGroupingVariable,
          metadata: {
            hasInsufficientData: true,
            insufficentType: ['insufficientData'],
            variableName: 'var1',
            variableLabel: 'Variable 1'
          },
          testStatisticsMannWhitneyU: {
            U: 15.5,
            W: 45.5,
            Z: 1.2,
            pValue: 0.123,
            pExact: 0.125,
            showExact: false
          },
          testStatisticsKolmogorovSmirnovZ: {
            D_absolute: 0.85,
            D_positive: 0.85,
            D_negative: 0.0,
            d_stat: 0.85,
            pValue: 0.456
          },
          descriptiveStatistics: {
            variable1: mockVariable,
            N: 20,
            Mean: 15.5,
            StdDev: 3.2,
            Min: 10,
            Max: 20,
            Percentile25: 12,
            Percentile50: 15,
            Percentile75: 18
          }
        }
      ];

      const result = formatKolmogorovSmirnovZTestStatisticsTable(insufficientResults);

      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('columnHeaders');
      expect(result).toHaveProperty('rows');
    });
  });
}); 