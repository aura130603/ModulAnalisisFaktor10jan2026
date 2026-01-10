import { renderHook, act } from '@testing-library/react';
import { useRunsAnalysis } from '../hooks/useRunsAnalysis';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { RunsAnalysisProps } from '../types';
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
const mockOnClose = jest.fn();

const mockVariables: Variable[] = [
  {
    name: 'var1',
    label: 'Variable 1',
    columnIndex: 0,
    type: 'NUMERIC' as any,
    tempId: '1',
    width: 8,
    decimals: 0,
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
    type: 'NUMERIC' as any,
    tempId: '2',
    width: 8,
    decimals: 0,
    values: [],
    missing: {},
    align: 'left',
    measure: 'scale',
    role: 'input',
    columns: 8
  }
];

const mockAnalysisData = [
  [1, 1],
  [2, 1],
  [1, 2],
  [2, 2],
  [1, 1],
  [2, 1]
];

describe('useRunsAnalysis', () => {

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
  });

  const defaultParams: RunsAnalysisProps = {
    testVariables: [mockVariables[0]],
    cutPoint: {
      median: true,
      mode: false,
      mean: false,
      custom: false
    },
    customValue: null,
    displayStatistics: {
      descriptive: false,
      quartiles: false
    },
    onClose: mockOnClose
  };

  const renderTestHook = (params: Partial<RunsAnalysisProps> = {}) => {
    return renderHook(() => useRunsAnalysis({ ...defaultParams, ...params }));
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
        runsTest: {
          median: {
            TestValue: 10.5,
            CasesBelow: 5,
            CasesAbove: 5,
            Total: 10,
            Runs: 8,
            Z: 1.5,
            PValue: 0.123
          }
        },
        descriptiveStatistics: {
          variable1: mockVariables[0],
          N1: 10,
          Mean1: 10.5,
          StdDev1: 2.1,
          Min1: 5,
          Max1: 15
        },
        metadata: {
          hasInsufficientData: false,
          insufficientType: [],
          variableName: 'var1',
          variableLabel: 'Variable 1'
        }
      }
    };

    await act(async () => {
      workerOnMessage({ data: mockWorkerResult });
    });

    expect(mockAddLog).toHaveBeenCalled();
    expect(mockAddAnalytic).toHaveBeenCalled();
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
            runsTest: {
              median: {
                TestValue: 10.5,
                CasesBelow: 5,
                CasesAbove: 5,
                Total: 10,
                Runs: 8,
                Z: 1.5,
                PValue: 0.123
              }
            },
            metadata: {
              hasInsufficientData: false,
              insufficientType: [],
              variableName: 'var1',
              variableLabel: 'Variable 1'
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
            runsTest: {
              median: {
                TestValue: 15.5,
                CasesBelow: 6,
                CasesAbove: 6,
                Total: 12,
                Runs: 10,
                Z: 2.1,
                PValue: 0.045
              }
            },
            metadata: {
              hasInsufficientData: false,
              insufficientType: [],
              variableName: 'var2',
              variableLabel: 'Variable 2'
            }
          }
        }
      });
    });
    
    // Now it should finish
    expect(mockAddAnalytic).toHaveBeenCalled();
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

  describe('Insufficient Data Cases', () => {
    
    it('should handle empty data case', async () => {
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
              metadata: {
                hasInsufficientData: true,
                insufficientType: ['empty'],
                variableName: 'var1',
                variableLabel: 'Variable 1'
              },
              runsTest: null,
              descriptiveStatistics: null
            }
          }
        });
      });
      
      expect(mockAddLog).toHaveBeenCalled();
      expect(mockAddAnalytic).toHaveBeenCalled();
      
             // Log should mention RUNS TEST
       const logCall = mockAddLog.mock.calls[0][0];
       expect(logCall.log).toContain('RUNS');
    });

    it('should handle insufficient data for runs calculation', async () => {
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
              metadata: {
                hasInsufficientData: true,
                insufficientType: ['single median'],
                variableName: 'var1',
                variableLabel: 'Variable 1'
              },
              runsTest: {
                median: {
                  TestValue: 5,
                  CasesBelow: 0,
                  CasesAbove: 3,
                  Total: 3,
                  Runs: 1,
                  Z: null,
                  PValue: null
                }
              },
              descriptiveStatistics: {
                variable1: mockVariables[0],
                N1: 3,
                Mean1: 5,
                StdDev1: 2.1,
                Min1: 2,
                Max1: 8
              }
            }
          }
        });
      });
      
      expect(mockAddLog).toHaveBeenCalled();
      expect(mockAddAnalytic).toHaveBeenCalled();
      
             const logCall = mockAddLog.mock.calls[0][0];
       expect(logCall.log).toContain('RUNS');
    });

    it('should handle mixed sufficient and insufficient data for multiple variables', async () => {
      const { result } = renderTestHook({
        testVariables: [mockVariables[0], mockVariables[1]]
      });
      
      await act(async () => {
        await result.current.runAnalysis();
      });

      // First variable has insufficient data
      await act(async () => {
        workerOnMessage({
          data: {
            status: 'success',
            variableName: 'var1',
            results: {
              variable1: mockVariables[0],
              metadata: {
                hasInsufficientData: true,
                insufficientType: ['empty'],
                variableName: 'var1',
                variableLabel: 'Variable 1'
              },
              runsTest: null,
              descriptiveStatistics: null
            }
          }
        });
      });
      
      expect(result.current.isCalculating).toBe(true);
      
      // Second variable has sufficient data
      await act(async () => {
        workerOnMessage({
          data: {
            status: 'success',
            variableName: 'var2',
            results: {
              variable1: mockVariables[1],
              metadata: {
                hasInsufficientData: false,
                insufficientType: [],
                variableName: 'var2',
                variableLabel: 'Variable 2'
              },
              runsTest: {
                median: {
                  TestValue: 15.5,
                  CasesBelow: 6,
                  CasesAbove: 6,
                  Total: 12,
                  Runs: 10,
                  Z: 2.1,
                  PValue: 0.045
                }
              },
              descriptiveStatistics: {
                variable1: mockVariables[1],
                N1: 12,
                Mean1: 15.5,
                StdDev1: 3.2,
                Min1: 10,
                Max1: 20
              }
            }
          }
        });
      });

      // Should process both results
      expect(mockAddLog).toHaveBeenCalled();
      expect(mockAddAnalytic).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
      expect(result.current.isCalculating).toBe(false);
    });

    it('should verify insufficient data metadata is properly handled', async () => {
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
              metadata: {
                hasInsufficientData: true,
                insufficientType: ['empty'],
                variableName: 'var1',
                variableLabel: 'Variable 1'
              },
              runsTest: null,
              descriptiveStatistics: null
            }
          }
        });
      });
      
      // Verify that the hook properly handles insufficient data
      expect(mockAddLog).toHaveBeenCalled();
      expect(result.current.isCalculating).toBe(false);
      expect(result.current.errorMsg).toBe(null); // Should not be an error, just insufficient data
    });

    it('should handle single run case with custom cut point', async () => {
      const { result } = renderTestHook({
        cutPoint: {
          median: false,
          mode: false,
          mean: false,
          custom: true
        },
        customValue: 10
      });
      
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
              metadata: {
                hasInsufficientData: true,
                insufficientType: ['single custom'],
                variableName: 'var1',
                variableLabel: 'Variable 1'
              },
              runsTest: {
                custom: {
                  TestValue: 10,
                  CasesBelow: 0,
                  CasesAbove: 5,
                  Total: 5,
                  Runs: 1,
                  Z: null,
                  PValue: null
                }
              },
              descriptiveStatistics: {
                variable1: mockVariables[0],
                N1: 5,
                Mean1: 12,
                StdDev1: 1.5,
                Min1: 10,
                Max1: 15
              }
            }
          }
        });
      });
      
      expect(mockAddLog).toHaveBeenCalled();
      expect(mockAddAnalytic).toHaveBeenCalled();
      expect(result.current.isCalculating).toBe(false);
      expect(result.current.errorMsg).toBe(null);
    });

    it('should handle multiple cut points analysis', async () => {
      const { result } = renderTestHook({
        cutPoint: {
          median: true,
          mode: false,
          mean: true,
          custom: false
        }
      });
      
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
              metadata: {
                hasInsufficientData: false,
                insufficientType: [],
                variableName: 'var1',
                variableLabel: 'Variable 1'
              },
              runsTest: {
                median: {
                  TestValue: 5.5,
                  CasesBelow: 5,
                  CasesAbove: 5,
                  Total: 10,
                  Runs: 6,
                  Z: 0.5,
                  PValue: 0.617
                },
                mean: {
                  TestValue: 5.5,
                  CasesBelow: 5,
                  CasesAbove: 5,
                  Total: 10,
                  Runs: 6,
                  Z: 0.5,
                  PValue: 0.617
                }
              },
              descriptiveStatistics: {
                variable1: mockVariables[0],
                N1: 10,
                Mean1: 5.5,
                StdDev1: 3.0,
                Min1: 1,
                Max1: 10
              }
            }
          }
        });
      });
      
      expect(mockAddLog).toHaveBeenCalled();
      expect(mockAddAnalytic).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
      expect(result.current.isCalculating).toBe(false);
    });
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
    
    // Unmount component
    unmount();
    
    // Worker should be cleaned up
    expect(mockWorkerTerminate).toHaveBeenCalled();
  });

  it('should handle custom cut point options', async () => {
    const { result } = renderTestHook({
      cutPoint: {
        median: false,
        mode: false,
        mean: false,
        custom: true
      },
      customValue: 15.5,
      displayStatistics: {
        descriptive: true,
        quartiles: false
      }
    });

    await act(async () => {
      await result.current.runAnalysis();
    });

    expect(mockPostMessage).toHaveBeenCalledWith({
      analysisType: ['descriptiveStatistics', 'runs'],
      variable1: mockVariables[0],
      data1: [1, 2, 1, 2, 1, 2],
      options: {
        cutPoint: {
          median: false,
          mode: false,
          mean: false,
          custom: true
        },
        customValue: 15.5,
        displayStatistics: {
          descriptive: true,
          quartiles: false
        }
      }
    });
  });

  it('should handle mode cut point options', async () => {
    const { result } = renderTestHook({
      cutPoint: {
        median: false,
        mode: true,
        mean: false,
        custom: false
      },
      displayStatistics: {
        descriptive: true,
        quartiles: true
      }
    });

    await act(async () => {
      await result.current.runAnalysis();
    });

    expect(mockPostMessage).toHaveBeenCalledWith({
      analysisType: ['descriptiveStatistics', 'runs'],
      variable1: mockVariables[0],
      data1: [1, 2, 1, 2, 1, 2],
      options: {
        cutPoint: {
          median: false,
          mode: true,
          mean: false,
          custom: false
        },
        customValue: null,
        displayStatistics: {
          descriptive: true,
          quartiles: true
        }
      }
    });
  });

  it('should handle all cut point types simultaneously', async () => {
    const { result } = renderTestHook({
      cutPoint: {
        median: true,
        mode: true,
        mean: true,
        custom: true
      },
      customValue: 7.5,
      displayStatistics: {
        descriptive: true,
        quartiles: true
      }
    });

    await act(async () => {
      await result.current.runAnalysis();
    });

    expect(mockPostMessage).toHaveBeenCalledWith({
      analysisType: ['descriptiveStatistics', 'runs'],
      variable1: mockVariables[0],
      data1: [1, 2, 1, 2, 1, 2],
      options: {
        cutPoint: {
          median: true,
          mode: true,
          mean: true,
          custom: true
        },
        customValue: 7.5,
        displayStatistics: {
          descriptive: true,
          quartiles: true
        }
      }
    });
  });

  it('should handle analysis timeout gracefully', async () => {
    const { result } = renderTestHook();
    
    await act(async () => {
      await result.current.runAnalysis();
    });
    
    // Simulate timeout by not calling workerOnMessage
    // The analysis should eventually timeout or be cancelled
    
    expect(result.current.isCalculating).toBe(true);
    
    // Cancel to clean up
    await act(async () => {
      result.current.cancelCalculation();
    });
    
    expect(result.current.isCalculating).toBe(false);
  });

  it('should handle worker response with missing or malformed data', async () => {
    const { result } = renderTestHook();
    
    await act(async () => {
      await result.current.runAnalysis();
    });
    
    // Send malformed response
    await act(async () => {
      workerOnMessage({
        data: {
          status: 'success',
          variableName: 'var1',
          results: {
            // Missing required fields
            variable1: mockVariables[0],
            // Missing runsTest, metadata, etc.
            metadata: {
              hasInsufficientData: false,
              insufficientType: [],
              variableName: 'var1',
              variableLabel: 'Variable 1'
            }
            // Missing runsTest and descriptiveStatistics
          }
        }
      });
    });
    
    // Should handle gracefully without crashing
    expect(result.current.isCalculating).toBe(false);
    expect(result.current.errorMsg).toBe(null);
    expect(mockAddLog).toHaveBeenCalled();
    expect(mockAddAnalytic).toHaveBeenCalled();
  });

  it('should handle worker response with null results', async () => {
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
            metadata: {
              hasInsufficientData: true,
              insufficientType: ['empty'],
              variableName: 'var1',
              variableLabel: 'Variable 1'
            },
            runsTest: null,
            descriptiveStatistics: null
          }
        }
      });
    });
    
    // Should handle null results gracefully
    expect(result.current.isCalculating).toBe(false);
    expect(result.current.errorMsg).toBe(null);
    expect(mockAddLog).toHaveBeenCalled();
    expect(mockAddAnalytic).toHaveBeenCalled();
  });
}); 