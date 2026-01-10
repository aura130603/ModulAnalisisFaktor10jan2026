import { renderHook, act } from '@testing-library/react';
import { useOneWayAnovaAnalysis } from '../hooks/useOneWayAnovaAnalysis';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { OneWayAnovaAnalysisProps } from '../types';
import type { Variable } from '@/types/Variable';

// Mock dependencies
jest.mock('@/stores/useResultStore');
jest.mock('@/hooks/useAnalysisData');

// Mock Worker
const mockPostMessage = jest.fn();
const mockWorkerTerminate = jest.fn();
let workerOnMessage: (event: { data: any }) => void;
let workerOnError: (event: ErrorEvent) => void;

// A fake Worker instance used by the pooled client
const fakeWorker: any = {
  postMessage: mockPostMessage,
  terminate: mockWorkerTerminate,
  set onmessage(fn: (event: { data: any }) => void) {
    workerOnMessage = fn;
  },
  set onerror(fn: (event: ErrorEvent) => void) {
    workerOnError = fn;
  },
};

// Override global.Worker as fallback
global.Worker = jest.fn().mockImplementation(() => fakeWorker);

// Mock implementations
const mockedUseResultStore = useResultStore as unknown as jest.Mock;
const mockedUseAnalysisData = useAnalysisData as unknown as jest.Mock;

// Mock data
const mockAddLog = jest.fn();
const mockAddAnalytic = jest.fn();
const mockAddStatistic = jest.fn();
const mockCheckAndSave = jest.fn();
const mockOnClose = jest.fn();

const mockVariables: Variable[] = [
  {
    name: 'var1',
    label: 'Variable 1',
    columnIndex: 0,
    type: 'NUMERIC',
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
    type: 'NUMERIC',
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
    name: 'factor',
    label: 'Factor',
    columnIndex: 2,
    type: 'NUMERIC',
    tempId: '3',
    width: 8,
    decimals: 0,
    values: [],
    missing: {},
    align: 'left',
    measure: 'nominal',
    role: 'input',
    columns: 8
  }
];

const mockAnalysisData = [
  [10, 20, 1],
  [15, 25, 1],
  [30, 40, 2],
  [35, 45, 2],
  [50, 60, 3],
  [55, 65, 3],
];

describe('useOneWayAnovaAnalysis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockedUseResultStore.mockReturnValue({
      addLog: mockAddLog,
      addAnalytic: mockAddAnalytic,
      addStatistic: mockAddStatistic,
    });
    
    mockedUseAnalysisData.mockReturnValue({
      data: mockAnalysisData,
    });
    
    mockAddLog.mockResolvedValue('log-123');
    mockAddAnalytic.mockResolvedValue('analytic-123');
    mockCheckAndSave.mockResolvedValue(undefined);
  });

  const defaultParams: OneWayAnovaAnalysisProps = {
    testVariables: [mockVariables[0]],
    factorVariable: mockVariables[2],
    estimateEffectSize: true,
    equalVariancesAssumed: { tukey: true, duncan: false },
    statisticsOptions: { descriptive: true, homogeneityOfVariance: true },
    onClose: mockOnClose
  };

  const renderTestHook = (params: Partial<OneWayAnovaAnalysisProps> = {}) => {
    return renderHook(() => useOneWayAnovaAnalysis({ ...defaultParams, ...params }));
  };

  it('should run analysis and process a successful worker response', async () => {
    const { result } = renderTestHook();

    await act(async () => {
      await result.current.runAnalysis();
    });

    expect(result.current.isCalculating).toBe(true);
    expect(mockPostMessage).toHaveBeenCalledTimes(1);
    
    // Success response from worker
    const mockWorkerResult = {
      status: 'success',
      variableName: 'var1',
      results: {
        variable1: mockVariables[0],
        variable2: mockVariables[2],
        metadata: {
          hasInsufficientData: false,
          variable1Name: 'var1',
          variable2Name: 'factor',
          totalData1: 6,
          totalData2: 6,
          validData1: 6,
          validData2: 6
        },
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
        },
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
          }
        ],
        homogeneityOfVariances: [
          {
            type: 'Based on Mean',
            LeveneStatistic: 0.22,
            df1: 2,
            df2: 57,
            Sig: 0.802
          }
        ],
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
          }
        ],
        homogeneousSubsets: [
          {
            method: 'Tukey HSD',
            output: [
              {
                method: 'Tukey HSD',
                factor: 'B',
                N: 20,
                subset1: 72.8
              }
            ],
            subsetCount: 1
          }
        ]
      }
    };

    await act(async () => {
      workerOnMessage({ data: mockWorkerResult });
    });

    expect(mockAddLog).toHaveBeenCalled();
    expect(mockAddAnalytic).toHaveBeenCalled();
    expect(mockAddStatistic).toHaveBeenCalledTimes(5); // descriptives, homogeneity, ANOVA, multiple comparisons, homogeneous subsets
    expect(mockOnClose).toHaveBeenCalled();
    expect(result.current.isCalculating).toBe(false);
    expect(result.current.errorMsg).toBe(null);
  });

  it('should handle multiple variables and aggregate results', async () => {
    const { result } = renderTestHook({
      testVariables: [mockVariables[0], mockVariables[1]]
    });

    await act(async () => {
      await result.current.runAnalysis();
    });

    expect(mockPostMessage).toHaveBeenCalledTimes(2);

    // First variable response
    await act(async () => {
      workerOnMessage({
        data: {
          status: 'success',
          variableName: 'var1',
          results: {
            variable1: mockVariables[0],
            variable2: mockVariables[2],
            metadata: {
              hasInsufficientData: false,
              variable1Name: 'var1',
              variable2Name: 'factor',
              totalData1: 6,
              totalData2: 6,
              validData1: 6,
              validData2: 6
            },
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
        }
      });
    });
    
    // Should not be complete yet
    expect(result.current.isCalculating).toBe(true);
    expect(mockOnClose).not.toHaveBeenCalled();
    
    // Second variable response
    await act(async () => {
      workerOnMessage({
        data: {
          status: 'success',
          variableName: 'var2',
          results: {
            variable1: mockVariables[1],
            variable2: mockVariables[2],
            metadata: {
              hasInsufficientData: false,
              variable1Name: 'var2',
              variable2Name: 'factor',
              totalData1: 6,
              totalData2: 6,
              validData1: 6,
              validData2: 6
            },
            oneWayAnova: {
              SumOfSquares: 1200.50,
              df: 2,
              MeanSquare: 600.25,
              F: 45.67,
              Sig: 0.002,
              withinGroupsSumOfSquares: 400.30,
              withinGroupsDf: 57,
              withinGroupsMeanSquare: 7.02,
              totalSumOfSquares: 1600.80,
              totalDf: 59
            }
          }
        }
      });
    });
    
    // Now it should finish
    expect(mockAddStatistic).toHaveBeenCalledTimes(6); // descriptives, homogeneity, ANOVA, multiple comparisons, homogeneous subsets (aggregated for multiple variables)
    expect(mockOnClose).toHaveBeenCalled();
    expect(result.current.isCalculating).toBe(false);
  });

  it('should handle worker errors gracefully', async () => {
    const { result } = renderTestHook();
    
    await act(async () => {
      await result.current.runAnalysis();
    });
    
    await act(async () => {
      workerOnMessage({
        data: {
          status: 'error',
          variableName: 'var1',
          error: 'Test worker error'
        }
      });
    });
    
    expect(result.current.errorMsg).toContain('Calculation failed for var1: Test worker error');
    expect(result.current.isCalculating).toBe(false);
  });
  
  it('should handle critical worker instantiation errors', async () => {
    const { result } = renderTestHook();
    
    await act(async () => {
      await result.current.runAnalysis();
    });

    const errorEvent = new ErrorEvent('error', {
      error: new Error('Script loading failed'),
      message: 'Worker script could not be loaded'
    });

    await act(async () => {
      workerOnError(errorEvent);
    });

    expect(result.current.errorMsg).toContain('A critical worker error occurred');
    expect(result.current.isCalculating).toBe(false);
  });
  
  it('should handle insufficient data cases', async () => {
    const { result } = renderTestHook();
    
    await act(async () => {
      await result.current.runAnalysis();
    });
    
    await act(async () => {
      workerOnMessage({
        data: {
          status: 'success',
          variableName: 'var1',
          results: {
            variable1: mockVariables[0],
            variable2: mockVariables[2],
            metadata: {
              hasInsufficientData: true,
              variable1Name: 'var1',
              variable2Name: 'factor',
              totalData1: 4,
              totalData2: 4,
              validData1: 1,
              validData2: 1
            },
            oneWayAnova: {
              SumOfSquares: 0,
              df: 0,
              MeanSquare: 0,
              F: 0,
              Sig: 1,
              withinGroupsSumOfSquares: 0,
              withinGroupsDf: 0,
              withinGroupsMeanSquare: 0,
              totalSumOfSquares: 0,
              totalDf: 0
            }
          }
        }
      });
    });
    
    expect(mockAddStatistic).toHaveBeenCalled();
    expect(mockAddLog).toHaveBeenCalled();
    
    // Log harus mencantumkan informasi tentang ONEWAY
    const logCall = mockAddLog.mock.calls[0][0];
    expect(logCall.log).toContain('ONEWAY');
  });
  
  it('should cancel analysis when requested', async () => {
    const { result } = renderTestHook();
    
    await act(async () => {
      await result.current.runAnalysis();
    });
    
    expect(result.current.isCalculating).toBe(true);
    
    await act(async () => {
      result.current.cancelCalculation();
    });
    
    expect(mockWorkerTerminate).toHaveBeenCalled();
    expect(result.current.isCalculating).toBe(false);
  });
  
  it('should clean up worker when unmounted', async () => {
    const { result, unmount } = renderTestHook();
    
    await act(async () => {
      await result.current.runAnalysis();
    });
    
    // Unmount komponen
    unmount();
    
    // Worker harus dibersihkan
    expect(mockWorkerTerminate).toHaveBeenCalled();
  });
}); 