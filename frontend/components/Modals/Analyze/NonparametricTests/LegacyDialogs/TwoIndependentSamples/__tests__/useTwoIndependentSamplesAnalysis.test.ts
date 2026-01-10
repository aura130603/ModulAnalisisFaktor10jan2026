import { renderHook, act } from '@testing-library/react';
import { useTwoIndependentSamplesAnalysis } from '../hooks/useTwoIndependentSamplesAnalysis';
import { Variable } from '@/types/Variable';

// Mock the stores
jest.mock('@/stores/useResultStore', () => ({
  useResultStore: jest.fn(() => ({
    addLog: jest.fn(),
    addAnalytic: jest.fn(),
    addStatistic: jest.fn(),
  })),
}));

jest.mock('@/hooks/useAnalysisData', () => ({
  useAnalysisData: jest.fn(() => ({
    data: [
      [1, 'Group1', 10],
      [2, 'Group1', 15],
      [3, 'Group2', 12],
      [4, 'Group2', 18],
      [5, 'Group1', 14],
      [6, 'Group2', 16],
    ],
  })),
}));

jest.mock('@/stores/useDataStore', () => ({
  useDataStore: {
    getState: jest.fn(() => ({
      checkAndSave: jest.fn().mockResolvedValue(undefined),
    })),
  },
}));

// Mock Worker
const mockWorker = {
  postMessage: jest.fn(),
  terminate: jest.fn(),
  onmessage: null as any,
  onerror: null as any,
};

global.Worker = jest.fn(() => mockWorker) as any;

// Mock formatters
jest.mock('../utils/formatters', () => ({
  formatFrequenciesRanksTable: jest.fn(() => ({ headers: [], rows: [] })),
  formatMannWhitneyUTestStatisticsTable: jest.fn(() => ({ headers: [], rows: [] })),
  formatKolmogorovSmirnovZTestStatisticsTable: jest.fn(() => ({ headers: [], rows: [] })),
  formatDescriptiveStatisticsTable: jest.fn(() => ({ headers: [], rows: [] })),
}));

describe('useTwoIndependentSamplesAnalysis', () => {
  const mockVariables: Variable[] = [
    {
      name: 'Var1',
      tempId: '1',
      columnIndex: 0,
      label: 'Variable 1',
      type: 'NUMERIC' as any,
      width: 8,
      decimals: 0,
      values: [
        { variableId: 1, value: 1, label: '1' },
        { variableId: 1, value: 2, label: '2' },
        { variableId: 1, value: 3, label: '3' },
        { variableId: 1, value: 4, label: '4' },
        { variableId: 1, value: 5, label: '5' },
        { variableId: 1, value: 6, label: '6' }
      ],
      missing: {},
      align: 'left',
      measure: 'scale',
      role: 'input',
      columns: 8
    },
    {
      name: 'GroupVar',
      tempId: '2',
      columnIndex: 1,
      label: 'Group Variable',
      type: 'STRING' as any,
      width: 8,
      decimals: 0,
      values: [
        { variableId: 2, value: 'Group1', label: 'Group1' },
        { variableId: 2, value: 'Group1', label: 'Group1' },
        { variableId: 2, value: 'Group2', label: 'Group2' },
        { variableId: 2, value: 'Group2', label: 'Group2' },
        { variableId: 2, value: 'Group1', label: 'Group1' },
        { variableId: 2, value: 'Group2', label: 'Group2' }
      ],
      missing: {},
      align: 'left',
      measure: 'nominal',
      role: 'input',
      columns: 8
    }
  ];

  const defaultProps = {
    testVariables: [mockVariables[0]],
    groupingVariable: mockVariables[1],
    group1: 1 as number | null,
    group2: 2 as number | null,
    testType: {
      mannWhitneyU: true,
      kolmogorovSmirnovZ: false,
      mosesExtremeReactions: false,
      waldWolfowitzRuns: false
    },
    displayStatistics: {
      descriptive: false,
      quartiles: false
    },
    onClose: jest.fn(),
  };

  const mockAddLog = jest.fn();
  const mockAddAnalytic = jest.fn();
  const mockAddStatistic = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset worker mock
    mockWorker.postMessage.mockClear();
    mockWorker.terminate.mockClear();
    mockWorker.onmessage = null;
    mockWorker.onerror = null;

    // Setup store mocks
    const { useResultStore } = require('@/stores/useResultStore');
    useResultStore.mockReturnValue({
      addLog: mockAddLog,
      addAnalytic: mockAddAnalytic,
      addStatistic: mockAddStatistic,
    });

    // Setup data store mock
    const { useDataStore } = require('@/stores/useDataStore');
    useDataStore.getState.mockReturnValue({
      checkAndSave: jest.fn().mockResolvedValue(undefined),
    });
  });

  const renderTestHook = (props = defaultProps) => {
    return renderHook(() => useTwoIndependentSamplesAnalysis(props));
  };

  it('should initialize with correct default state', () => {
    const { result } = renderTestHook();

    expect(result.current.isCalculating).toBe(false);
    expect(result.current.errorMsg).toBe(null);
    expect(typeof result.current.runAnalysis).toBe('function');
    expect(typeof result.current.cancelCalculation).toBe('function');
  });

  it('should start analysis when runAnalysis is called', async () => {
    const { result } = renderTestHook();

    await act(async () => {
      result.current.runAnalysis();
    });

    expect(result.current.isCalculating).toBe(true);
    expect(mockWorker.postMessage).toHaveBeenCalled();
  });

  it('should handle successful analysis completion with Mann-Whitney U test', async () => {
    const { result } = renderTestHook();

    await act(async () => {
      result.current.runAnalysis();
    });

    // Wait a bit for the worker to be created
    await new Promise(resolve => setTimeout(resolve, 10));

    // Simulate two independent samples analysis response
    await act(async () => {
      if (mockWorker.onmessage) {
        mockWorker.onmessage({
          data: {
            status: 'success',
            variableName: 'Var1',
            results: {
              variable1: mockVariables[0],
              variable2: mockVariables[1],
              frequenciesRanks: {
                group1: { label: 'Group1', N: 3, MeanRank: 2.5, SumRanks: 7.5 },
                group2: { label: 'Group2', N: 3, MeanRank: 4.5, SumRanks: 13.5 }
              },
              testStatisticsMannWhitneyU: {
                U: 2.5,
                W: 7.5,
                Z: 1.96,
                pValue: 0.05,
                pExact: 0.05,
                showExact: false
              },
              metadata: {
                hasInsufficientData: false,
                insufficentType: [],
                variableName: 'Var1',
                variableLabel: 'Variable 1'
              }
            }
          }
        });
      }
    });

    // Wait for the analysis to complete
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(mockAddLog).toHaveBeenCalled();
    expect(mockAddAnalytic).toHaveBeenCalled();
    expect(mockAddStatistic).toHaveBeenCalled();
  });

  it('should handle descriptive statistics response', async () => {
    const propsWithDescriptiveStats = {
      ...defaultProps,
      displayStatistics: {
        descriptive: true,
        quartiles: false
      }
    };

    const { result } = renderTestHook(propsWithDescriptiveStats);

    await act(async () => {
      result.current.runAnalysis();
    });

    // Wait a bit for the worker to be created
    await new Promise(resolve => setTimeout(resolve, 10));

    // Simulate descriptive statistics response for test variable
    await act(async () => {
      if (mockWorker.onmessage) {
        mockWorker.onmessage({
          data: {
            status: 'success',
            variableName: 'Var1',
            results: {
              descriptiveStatistics: {
                variable1: mockVariables[0],
                N: 6,
                Mean: 3.5,
                StdDev: 1.87,
                Min: 1,
                Max: 6,
                Percentile25: 2.25,
                Percentile50: 3.5,
                Percentile75: 4.75
              }
            }
          }
        });
      }
    });

    // Simulate descriptive statistics response for grouping variable
    await act(async () => {
      if (mockWorker.onmessage) {
        mockWorker.onmessage({
          data: {
            status: 'success',
            variableName: 'GroupVar',
            results: {
              descriptiveStatistics: {
                variable1: mockVariables[1],
                N: 6,
                Mean: 0,
                StdDev: 0,
                Min: 0,
                Max: 0,
                Percentile25: 0,
                Percentile50: 0,
                Percentile75: 0
              }
            }
          }
        });
      }
    });

    // Simulate main test analysis response
    await act(async () => {
      if (mockWorker.onmessage) {
        mockWorker.onmessage({
          data: {
            status: 'success',
            variableName: 'Var1',
            results: {
              variable1: mockVariables[0],
              variable2: mockVariables[1],
              frequenciesRanks: {
                group1: { label: 'Group1', N: 3, MeanRank: 2.5, SumRanks: 7.5 },
                group2: { label: 'Group2', N: 3, MeanRank: 4.5, SumRanks: 13.5 }
              },
              testStatisticsMannWhitneyU: {
                U: 2.5,
                W: 7.5,
                Z: 1.96,
                pValue: 0.05,
                pExact: 0.05,
                showExact: false
              },
              metadata: {
                hasInsufficientData: false,
                insufficentType: [],
                variableName: 'Var1',
                variableLabel: 'Variable 1'
              }
            }
          }
        });
      }
    });

    // Wait for the analysis to complete
    await new Promise(resolve => setTimeout(resolve, 50));

    // Both log/analytic and statistics should be called when there are main test results
    expect(mockAddLog).toHaveBeenCalled();
    expect(mockAddAnalytic).toHaveBeenCalled();
    expect(mockAddStatistic).toHaveBeenCalled();
  });

  it('should handle worker error', async () => {
    const { result } = renderTestHook();

    await act(async () => {
      result.current.runAnalysis();
    });

    // Simulate worker error
    await act(async () => {
      mockWorker.onerror(new Error('Worker error'));
    });

    expect(result.current.errorMsg).toContain('Worker error');
    expect(result.current.isCalculating).toBe(false);
  });

  it('should handle validation errors - no test variables', async () => {
    const propsWithoutVariables = {
      ...defaultProps,
      testVariables: []
    };

    const { result } = renderTestHook(propsWithoutVariables);

    await act(async () => {
      result.current.runAnalysis();
    });

    expect(result.current.errorMsg).toBe('Please select at least one variable to analyze.');
    expect(result.current.isCalculating).toBe(false);
  });

  it('should handle validation errors - missing grouping variable', async () => {
    const propsWithoutGrouping = {
      ...defaultProps,
      groupingVariable: null as any
    };

    const { result } = renderTestHook(propsWithoutGrouping);

    await act(async () => {
      result.current.runAnalysis();
    });

    expect(result.current.errorMsg).toBe('Please select a grouping variable.');
    expect(result.current.isCalculating).toBe(false);
  });

  it('should handle validation errors - undefined groups', async () => {
    const propsWithoutGroups = {
      ...defaultProps,
      group1: null,
      group2: null
    };

    const { result } = renderTestHook(propsWithoutGroups);

    await act(async () => {
      result.current.runAnalysis();
    });

    expect(result.current.errorMsg).toBe('Please define grouping variable range.');
    expect(result.current.isCalculating).toBe(false);
  });

  it('should handle validation errors - no test type selected', async () => {
    const propsWithoutTestType = {
      ...defaultProps,
      testType: {
        mannWhitneyU: false,
        kolmogorovSmirnovZ: false,
        mosesExtremeReactions: false,
        waldWolfowitzRuns: false
      }
    };

    const { result } = renderTestHook(propsWithoutTestType);

    await act(async () => {
      result.current.runAnalysis();
    });

    expect(result.current.errorMsg).toBe('Please select at least one test type.');
    expect(result.current.isCalculating).toBe(false);
  });

  it('should cancel calculation when cancelCalculation is called', async () => {
    const { result } = renderTestHook();

    await act(async () => {
      result.current.runAnalysis();
    });

    expect(result.current.isCalculating).toBe(true);

    await act(async () => {
      result.current.cancelCalculation();
    });

    expect(mockWorker.terminate).toHaveBeenCalled();
    expect(result.current.isCalculating).toBe(false);
  });

  it('should handle data save failure', async () => {
    const mockCheckAndSave = jest.fn().mockRejectedValue(new Error('Save failed'));
    const { useDataStore } = require('@/stores/useDataStore');
    useDataStore.getState.mockReturnValue({
      checkAndSave: mockCheckAndSave,
    });

    const { result } = renderTestHook();

    await act(async () => {
      result.current.runAnalysis();
    });

    expect(result.current.errorMsg).toBe('Failed to save pending changes: Save failed');
    expect(result.current.isCalculating).toBe(false);
  });

  it('should handle worker response with missing or malformed data', async () => {
    const { result } = renderTestHook();

    await act(async () => {
      result.current.runAnalysis();
    });

    // Wait a bit for the worker to be created
    await new Promise(resolve => setTimeout(resolve, 10));

    // Simulate malformed response
    await act(async () => {
      if (mockWorker.onmessage) {
        mockWorker.onmessage({
          data: {
            status: 'success',
            variableName: 'Var1',
            results: {
              // Missing required fields
              variable1: mockVariables[0],
              variable2: mockVariables[1],
              metadata: {
                hasInsufficientData: false,
                insufficentType: [],
                variableName: 'Var1',
                variableLabel: 'Variable 1'
              }
              // Missing frequenciesRanks, testStatisticsMannWhitneyU, etc.
            }
          }
        });
      }
    });

    // Wait for the analysis to complete
    await new Promise(resolve => setTimeout(resolve, 50));

    // Should handle gracefully without crashing
    expect(result.current.isCalculating).toBe(false);
    expect(result.current.errorMsg).toBe(null);
    expect(mockAddLog).toHaveBeenCalled();
    expect(mockAddAnalytic).toHaveBeenCalled();
  });

  it('should handle worker response with null results', async () => {
    const { result } = renderTestHook();

    await act(async () => {
      result.current.runAnalysis();
    });

    // Wait a bit for the worker to be created
    await new Promise(resolve => setTimeout(resolve, 10));

    // Simulate null results
    await act(async () => {
      if (mockWorker.onmessage) {
        mockWorker.onmessage({
          data: {
            status: 'success',
            variableName: 'Var1',
            results: {
              variable1: mockVariables[0],
              variable2: mockVariables[1],
              frequenciesRanks: null,
              testStatisticsMannWhitneyU: null,
              metadata: {
                hasInsufficientData: true,
                insufficentType: ['empty'],
                variableName: 'Var1',
                variableLabel: 'Variable 1'
              }
            }
          }
        });
      }
    });

    // Wait for the analysis to complete
    await new Promise(resolve => setTimeout(resolve, 50));

    // Should handle null results gracefully
    expect(result.current.isCalculating).toBe(false);
    expect(result.current.errorMsg).toBe(null);
    expect(mockAddLog).toHaveBeenCalled();
    expect(mockAddAnalytic).toHaveBeenCalled();
  });

  it('should call onClose when analysis completes successfully', async () => {
    const mockOnClose = jest.fn();
    const propsWithOnClose = {
      ...defaultProps,
      onClose: mockOnClose
    };

    const { result } = renderTestHook(propsWithOnClose);

    await act(async () => {
      result.current.runAnalysis();
    });

    // Wait a bit for the worker to be created
    await new Promise(resolve => setTimeout(resolve, 10));

    // Simulate successful completion
    await act(async () => {
      if (mockWorker.onmessage) {
        mockWorker.onmessage({
          data: {
            status: 'success',
            variableName: 'Var1',
            results: {
              variable1: mockVariables[0],
              variable2: mockVariables[1],
              frequenciesRanks: {
                group1: { label: 'Group1', N: 3, MeanRank: 2.5, SumRanks: 7.5 },
                group2: { label: 'Group2', N: 3, MeanRank: 4.5, SumRanks: 13.5 }
              },
              testStatisticsMannWhitneyU: {
                U: 2.5,
                W: 7.5,
                Z: 1.96,
                pValue: 0.05,
                pExact: 0.05,
                showExact: false
              },
              metadata: {
                hasInsufficientData: false,
                insufficentType: [],
                variableName: 'Var1',
                variableLabel: 'Variable 1'
              }
            }
          }
        });
      }
    });

    // Wait for the analysis to complete
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should handle descriptive statistics display option', async () => {
    const propsWithDescriptiveStats = {
      ...defaultProps,
      displayStatistics: {
        descriptive: true,
        quartiles: true
      }
    };

    const { result } = renderTestHook(propsWithDescriptiveStats);

    await act(async () => {
      result.current.runAnalysis();
    });

    // Should post messages for descriptive statistics
    expect(mockWorker.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        analysisType: ['descriptiveStatistics']
      })
    );
  });

  it('should handle quartiles display option', async () => {
    const propsWithQuartiles = {
      ...defaultProps,
      displayStatistics: {
        descriptive: false,
        quartiles: true
      }
    };

    const { result } = renderTestHook(propsWithQuartiles);

    await act(async () => {
      result.current.runAnalysis();
    });

    // Should post messages for quartiles
    expect(mockWorker.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        analysisType: ['descriptiveStatistics']
      })
    );
  });

  it('should handle critical worker error', async () => {
    const { result } = renderTestHook();

    await act(async () => {
      result.current.runAnalysis();
    });

    // Wait a bit for the worker to be created
    await new Promise(resolve => setTimeout(resolve, 10));

    // Simulate critical worker error
    await act(async () => {
      if (mockWorker.onerror) {
        mockWorker.onerror(new Error('Critical worker error'));
      }
    });

    expect(result.current.errorMsg).toContain('Critical worker error');
    expect(result.current.isCalculating).toBe(false);
    expect(mockWorker.terminate).toHaveBeenCalled();
  });

  it('should handle Kolmogorov-Smirnov Z test', async () => {
    const propsWithKSTest = {
      ...defaultProps,
      testType: {
        mannWhitneyU: false,
        kolmogorovSmirnovZ: true,
        mosesExtremeReactions: false,
        waldWolfowitzRuns: false
      }
    };

    const { result } = renderTestHook(propsWithKSTest);

    await act(async () => {
      result.current.runAnalysis();
    });

    // Wait a bit for the worker to be created
    await new Promise(resolve => setTimeout(resolve, 10));

    // Simulate successful KS test response
    await act(async () => {
      if (mockWorker.onmessage) {
        mockWorker.onmessage({
          data: {
            status: 'success',
            variableName: 'Var1',
            results: {
              variable1: mockVariables[0],
              variable2: mockVariables[1],
              frequenciesRanks: {
                group1: { label: 'Group1', N: 3 },
                group2: { label: 'Group2', N: 3 }
              },
              testStatisticsKolmogorovSmirnovZ: {
                D_absolute: 0.5,
                D_positive: 0.3,
                D_negative: -0.2,
                d_stat: 0.5,
                pValue: 0.1
              },
              metadata: {
                hasInsufficientData: false,
                insufficentType: [],
                variableName: 'Var1',
                variableLabel: 'Variable 1'
              }
            }
          }
        });
      }
    });

    // Wait for the analysis to complete
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(mockAddLog).toHaveBeenCalled();
    expect(mockAddAnalytic).toHaveBeenCalled();
    expect(mockAddStatistic).toHaveBeenCalled();
  });

  it('should handle multiple test types simultaneously', async () => {
    const propsWithMultipleTests = {
      ...defaultProps,
      testType: {
        mannWhitneyU: true,
        kolmogorovSmirnovZ: true,
        mosesExtremeReactions: false,
        waldWolfowitzRuns: false
      }
    };

    const { result } = renderTestHook(propsWithMultipleTests);

    await act(async () => {
      result.current.runAnalysis();
    });

    // Wait a bit for the worker to be created
    await new Promise(resolve => setTimeout(resolve, 10));

    // Simulate response with both test types
    await act(async () => {
      if (mockWorker.onmessage) {
        mockWorker.onmessage({
          data: {
            status: 'success',
            variableName: 'Var1',
            results: {
              variable1: mockVariables[0],
              variable2: mockVariables[1],
              frequenciesRanks: {
                group1: { label: 'Group1', N: 3, MeanRank: 2.5, SumRanks: 7.5 },
                group2: { label: 'Group2', N: 3, MeanRank: 4.5, SumRanks: 13.5 }
              },
              testStatisticsMannWhitneyU: {
                U: 2.5,
                W: 7.5,
                Z: 1.96,
                pValue: 0.05,
                pExact: 0.05,
                showExact: false
              },
              testStatisticsKolmogorovSmirnovZ: {
                D_absolute: 0.5,
                D_positive: 0.3,
                D_negative: -0.2,
                d_stat: 0.5,
                pValue: 0.1
              },
              metadata: {
                hasInsufficientData: false,
                insufficentType: [],
                variableName: 'Var1',
                variableLabel: 'Variable 1'
              }
            }
          }
        });
      }
    });

    // Wait for the analysis to complete
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(mockAddLog).toHaveBeenCalled();
    expect(mockAddAnalytic).toHaveBeenCalled();
    expect(mockAddStatistic).toHaveBeenCalled();
  });

  it('should handle multiple variables analysis', async () => {
    const propsWithMultipleVariables = {
      ...defaultProps,
      testVariables: [mockVariables[0], { ...mockVariables[0], name: 'Var2', tempId: '3', columnIndex: 2 }]
    };

    const { result } = renderTestHook(propsWithMultipleVariables);

    await act(async () => {
      result.current.runAnalysis();
    });

    // Wait a bit for the worker to be created
    await new Promise(resolve => setTimeout(resolve, 10));

    // Simulate responses for both variables
    await act(async () => {
      if (mockWorker.onmessage) {
        mockWorker.onmessage({
          data: {
            status: 'success',
            variableName: 'Var1',
            results: {
              variable1: mockVariables[0],
              variable2: mockVariables[1],
              frequenciesRanks: {
                group1: { label: 'Group1', N: 3, MeanRank: 2.5, SumRanks: 7.5 },
                group2: { label: 'Group2', N: 3, MeanRank: 4.5, SumRanks: 13.5 }
              },
              testStatisticsMannWhitneyU: {
                U: 2.5,
                W: 7.5,
                Z: 1.96,
                pValue: 0.05,
                pExact: 0.05,
                showExact: false
              },
              metadata: {
                hasInsufficientData: false,
                insufficentType: [],
                variableName: 'Var1',
                variableLabel: 'Variable 1'
              }
            }
          }
        });
      }
    });

    await act(async () => {
      if (mockWorker.onmessage) {
        mockWorker.onmessage({
          data: {
            status: 'success',
            variableName: 'Var2',
            results: {
              variable1: { ...mockVariables[0], name: 'Var2', tempId: '3', columnIndex: 2 },
              variable2: mockVariables[1],
              frequenciesRanks: {
                group1: { label: 'Group1', N: 3, MeanRank: 2.0, SumRanks: 6.0 },
                group2: { label: 'Group2', N: 3, MeanRank: 5.0, SumRanks: 15.0 }
              },
              testStatisticsMannWhitneyU: {
                U: 3.0,
                W: 6.0,
                Z: 2.17,
                pValue: 0.03,
                pExact: 0.03,
                showExact: false
              },
              metadata: {
                hasInsufficientData: false,
                insufficentType: [],
                variableName: 'Var2',
                variableLabel: 'Variable 2'
              }
            }
          }
        });
      }
    });

    // Wait for the analysis to complete
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(mockAddLog).toHaveBeenCalled();
    expect(mockAddAnalytic).toHaveBeenCalled();
    expect(mockAddStatistic).toHaveBeenCalled();
  });

  it('should handle worker response with error status', async () => {
    const { result } = renderTestHook();

    await act(async () => {
      result.current.runAnalysis();
    });

    // Simulate worker response with error status
    await act(async () => {
      mockWorker.onmessage({
        data: {
          status: 'error',
          variableName: 'Var1',
          error: 'Calculation failed for this variable'
        }
      });
    });

    expect(result.current.errorMsg).toContain('Calculation failed for Var1');
    expect(result.current.isCalculating).toBe(false);
  });

  describe('Insufficient Data Cases', () => {
    it('should handle insufficient data - empty case', async () => {
      const { result } = renderTestHook();

      await act(async () => {
        result.current.runAnalysis();
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await act(async () => {
        if (mockWorker.onmessage) {
          mockWorker.onmessage({
            data: {
              status: 'success',
              variableName: 'Var1',
              results: {
                variable1: mockVariables[0],
                variable2: mockVariables[1],
                frequenciesRanks: null,
                testStatisticsMannWhitneyU: null,
                metadata: {
                  hasInsufficientData: true,
                  insufficentType: ['empty'],
                  variableName: 'Var1',
                  variableLabel: 'Variable 1'
                }
              }
            }
          });
        }
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockAddLog).toHaveBeenCalled();
      expect(mockAddAnalytic).toHaveBeenCalled();
    });

    it('should handle insufficient data - hasEmptyGroup case', async () => {
      const { result } = renderTestHook();

      await act(async () => {
        result.current.runAnalysis();
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await act(async () => {
        if (mockWorker.onmessage) {
          mockWorker.onmessage({
            data: {
              status: 'success',
              variableName: 'Var1',
              results: {
                variable1: mockVariables[0],
                variable2: mockVariables[1],
                frequenciesRanks: {
                  group1: { label: 'Group1', N: 0, MeanRank: 0, SumRanks: 0 },
                  group2: { label: 'Group2', N: 3, MeanRank: 2.0, SumRanks: 6.0 }
                },
                testStatisticsMannWhitneyU: {
                  U: 0,
                  W: 0,
                  Z: 0,
                  pValue: 1,
                  pExact: null,
                  showExact: false
                },
                metadata: {
                  hasInsufficientData: true,
                  insufficentType: ['hasEmptyGroup'],
                  variableName: 'Var1',
                  variableLabel: 'Variable 1'
                }
              }
            }
          });
        }
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockAddLog).toHaveBeenCalled();
      expect(mockAddAnalytic).toHaveBeenCalled();
    });

    it('should handle mixed sufficient and insufficient data for multiple variables', async () => {
      const propsWithMultipleVariables = {
        ...defaultProps,
        testVariables: [mockVariables[0], { ...mockVariables[0], name: 'Var2', tempId: '3', columnIndex: 2 }]
      };

      const { result } = renderTestHook(propsWithMultipleVariables);

      await act(async () => {
        result.current.runAnalysis();
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      // First variable has sufficient data
      await act(async () => {
        if (mockWorker.onmessage) {
          mockWorker.onmessage({
            data: {
              status: 'success',
              variableName: 'Var1',
              results: {
                variable1: mockVariables[0],
                variable2: mockVariables[1],
                frequenciesRanks: {
                  group1: { label: 'Group1', N: 3, MeanRank: 2.5, SumRanks: 7.5 },
                  group2: { label: 'Group2', N: 3, MeanRank: 4.5, SumRanks: 13.5 }
                },
                testStatisticsMannWhitneyU: {
                  U: 2.5,
                  W: 7.5,
                  Z: 1.96,
                  pValue: 0.05,
                  pExact: 0.05,
                  showExact: false
                },
                metadata: {
                  hasInsufficientData: false,
                  insufficentType: [],
                  variableName: 'Var1',
                  variableLabel: 'Variable 1'
                }
              }
            }
          });
        }
      });

      // Second variable has insufficient data
      await act(async () => {
        if (mockWorker.onmessage) {
          mockWorker.onmessage({
            data: {
              status: 'success',
              variableName: 'Var2',
              results: {
                variable1: { ...mockVariables[0], name: 'Var2', tempId: '3', columnIndex: 2 },
                variable2: mockVariables[1],
                frequenciesRanks: null,
                testStatisticsMannWhitneyU: null,
                metadata: {
                  hasInsufficientData: true,
                  insufficentType: ['hasEmptyGroup'],
                  variableName: 'Var2',
                  variableLabel: 'Variable 2'
                }
              }
            }
          });
        }
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockAddLog).toHaveBeenCalled();
      expect(mockAddAnalytic).toHaveBeenCalled();
    });

    it('should handle multiple insufficient data types', async () => {
      const { result } = renderTestHook();

      await act(async () => {
        result.current.runAnalysis();
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await act(async () => {
        if (mockWorker.onmessage) {
          mockWorker.onmessage({
            data: {
              status: 'success',
              variableName: 'Var1',
              results: {
                variable1: mockVariables[0],
                variable2: mockVariables[1],
                frequenciesRanks: null,
                testStatisticsMannWhitneyU: null,
                metadata: {
                  hasInsufficientData: true,
                  insufficentType: ['empty', 'hasEmptyGroup'],
                  variableName: 'Var1',
                  variableLabel: 'Variable 1'
                }
              }
            }
          });
        }
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockAddLog).toHaveBeenCalled();
      expect(mockAddAnalytic).toHaveBeenCalled();
    });
  });
}); 