import { renderHook, act } from '@testing-library/react';
import { useTwoRelatedSamplesAnalysis } from '../hooks/useTwoRelatedSamplesAnalysis';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useDataStore } from '@/stores/useDataStore';

// Mock the stores and hooks
jest.mock('@/stores/useResultStore');
jest.mock('@/hooks/useAnalysisData');
jest.mock('@/stores/useDataStore');

// Mock the formatters
jest.mock('../utils/formatters', () => ({
  formatDescriptiveStatisticsTable: jest.fn(() => ({
    title: 'Descriptive Statistics',
    columnHeaders: [],
    rows: []
  })),
  formatRanksFrequenciesTable: jest.fn(() => ({
    title: 'Ranks Frequencies',
    columnHeaders: [],
    rows: []
  })),
  formatTestStatisticsTable: jest.fn(() => ({
    title: 'Test Statistics',
    columnHeaders: [],
    rows: []
  }))
}));

const mockAddLog = jest.fn();
const mockAddAnalytic = jest.fn();
const mockAddStatistic = jest.fn();

const mockCheckAndSave = jest.fn();

describe('useTwoRelatedSamplesAnalysis', () => {
  const mockVariables = [
    { name: 'Var1', tempId: '1', columnIndex: 0, width: 1, decimals: 0, values: [], missing: null, type: 'NUMERIC' as const, measure: 'scale' as const, role: 'input' as const, columns: 1, align: 'right' as const },
    { name: 'Var2', tempId: '2', columnIndex: 1, width: 1, decimals: 0, values: [], missing: null, type: 'NUMERIC' as const, measure: 'scale' as const, role: 'input' as const, columns: 1, align: 'right' as const },
    { name: 'Var3', tempId: '3', columnIndex: 2, width: 1, decimals: 0, values: [], missing: null, type: 'NUMERIC' as const, measure: 'scale' as const, role: 'input' as const, columns: 1, align: 'right' as const },
    { name: 'Var4', tempId: '4', columnIndex: 3, width: 1, decimals: 0, values: [], missing: null, type: 'NUMERIC' as const, measure: 'scale' as const, role: 'input' as const, columns: 1, align: 'right' as const }
  ];

  const defaultProps = {
    testVariables1: [mockVariables[0], mockVariables[2]],
    testVariables2: [mockVariables[1], mockVariables[3]],
    testType: {
      wilcoxon: true,
      sign: false,
      mcNemar: false,
      marginalHomogeneity: false
    },
    displayStatistics: {
      descriptive: false,
      quartiles: false
    },
    areAllPairsValid: jest.fn(() => true),
    hasDuplicatePairs: jest.fn(() => false),
    onClose: jest.fn(),
  };

  const mockAnalysisData = [
    [1, 2, 3, 4],
    [2, 3, 4, 5],
    [3, 4, 5, 6],
    [4, 5, 6, 7],
    [5, 6, 7, 8]
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useResultStore as unknown as jest.Mock).mockReturnValue({
      addLog: mockAddLog,
      addAnalytic: mockAddAnalytic,
      addStatistic: mockAddStatistic,
    });

    (useAnalysisData as jest.Mock).mockReturnValue({
      data: mockAnalysisData,
    });

    (useDataStore.getState as jest.Mock).mockReturnValue({
      checkAndSave: mockCheckAndSave,
    });

    // Mock Worker
    global.Worker = jest.fn().mockImplementation(() => ({
      postMessage: jest.fn(),
      terminate: jest.fn(),
      onmessage: null,
      onerror: null,
    }));
  });

  const renderTestHook = (props = defaultProps) => {
    return renderHook(() => useTwoRelatedSamplesAnalysis(props));
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
    expect(mockCheckAndSave).toHaveBeenCalled();
  });

  it('should handle successful analysis completion with Wilcoxon test', async () => {
    const { result } = renderTestHook();

    await act(async () => {
      result.current.runAnalysis();
    });

    // Simulate successful worker response for both variables
    const worker = (global.Worker as jest.Mock).mock.results[0].value;
    
    // First variable response
    await act(async () => {
      worker.onmessage({
        data: {
          variableName: 'Var1',
          results: {
            variable1: mockVariables[0],
            variable2: mockVariables[1],
            N: 5,
            metadata: {
              hasInsufficientData: false,
              variable1Name: 'Var1',
              variable2Name: 'Var2'
            },
            ranksFrequencies: {
              negative: { N: 2, MeanRank: 2.5, SumOfRanks: 5 },
              positive: { N: 3, MeanRank: 3.5, SumOfRanks: 10.5 },
              ties: { N: 0 },
              total: { N: 5 }
            },
            testStatisticsWilcoxon: {
              zValue: -0.5,
              pValue: 0.617
            }
          },
          status: 'success'
        }
      });
    });

    // Second variable response
    await act(async () => {
      worker.onmessage({
        data: {
          variableName: 'Var3',
          results: {
            variable1: mockVariables[2],
            variable2: mockVariables[3],
            N: 5,
            metadata: {
              hasInsufficientData: false,
              variable1Name: 'Var3',
              variable2Name: 'Var4'
            },
            ranksFrequencies: {
              negative: { N: 1, MeanRank: 2.0, SumOfRanks: 2 },
              positive: { N: 4, MeanRank: 3.5, SumOfRanks: 14 },
              ties: { N: 0 },
              total: { N: 5 }
            },
            testStatisticsWilcoxon: {
              zValue: -1.2,
              pValue: 0.230
            }
          },
          status: 'success'
        }
      });
    });

    expect(mockAddAnalytic).toHaveBeenCalled();
    expect(result.current.isCalculating).toBe(false);
    expect(result.current.errorMsg).toBe(null);
  });

  it('should handle descriptive statistics response', async () => {
    const propsWithDescriptive = {
      ...defaultProps,
      displayStatistics: {
        descriptive: true,
        quartiles: false
      }
    };

    const { result } = renderTestHook(propsWithDescriptive);

    await act(async () => {
      result.current.runAnalysis();
    });

    const worker = (global.Worker as jest.Mock).mock.results[0].value;
    
    // Simulate descriptive statistics responses for all variables
    for (const variable of mockVariables) {
      await act(async () => {
        worker.onmessage({
          data: {
            variableName: variable.name,
            results: {
              variable1: variable,
              N: 5,
              metadata: {
                hasInsufficientData: false,
                variable1Name: variable.name
              },
              descriptiveStatistics: {
                N1: 5,
                Mean1: 3,
                StdDev1: 1.58,
                Min1: 1,
                Max1: 5
              }
            },
            status: 'success'
          }
        });
      });
    }

    // Simulate test results for both variable pairs
    await act(async () => {
      worker.onmessage({
        data: {
          variableName: 'Var1',
          results: {
            variable1: mockVariables[0],
            variable2: mockVariables[1],
            N: 5,
            metadata: {
              hasInsufficientData: false,
              variable1Name: 'Var1',
              variable2Name: 'Var2'
            },
            testStatisticsWilcoxon: {
              zValue: -0.5,
              pValue: 0.617
            }
          },
          status: 'success'
        }
      });
    });

    await act(async () => {
      worker.onmessage({
        data: {
          variableName: 'Var3',
          results: {
            variable1: mockVariables[2],
            variable2: mockVariables[3],
            N: 5,
            metadata: {
              hasInsufficientData: false,
              variable1Name: 'Var3',
              variable2Name: 'Var4'
            },
            testStatisticsWilcoxon: {
              zValue: -1.2,
              pValue: 0.230
            }
          },
          status: 'success'
        }
      });
    });

    expect(mockAddStatistic).toHaveBeenCalled();
  });

  it('should handle worker error', async () => {
    const { result } = renderTestHook();

    await act(async () => {
      result.current.runAnalysis();
    });

    const worker = (global.Worker as jest.Mock).mock.results[0].value;
    
    await act(async () => {
      worker.onerror(new Error('Worker error'));
    });

    expect(result.current.errorMsg).toContain('Worker error');
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

    expect(result.current.isCalculating).toBe(false);
  });

  it('should handle data save failure', async () => {
    mockCheckAndSave.mockRejectedValueOnce(new Error('Save failed'));

    const { result } = renderTestHook();

    await act(async () => {
      result.current.runAnalysis();
    });

    expect(result.current.errorMsg).toContain('Save failed');
    expect(result.current.isCalculating).toBe(false);
  });

  it('should handle worker response with missing or malformed data', async () => {
    const { result } = renderTestHook();

    await act(async () => {
      result.current.runAnalysis();
    });

    const worker = (global.Worker as jest.Mock).mock.results[0].value;
    
    await act(async () => {
      worker.onmessage({
        data: {
          variableName: 'Var1',
          results: null,
          status: 'error',
          error: 'Invalid data'
        }
      });
    });

    expect(result.current.errorMsg).toContain('No results for Var1');
  });

  it('should handle worker response with null results', async () => {
    const { result } = renderTestHook();

    await act(async () => {
      result.current.runAnalysis();
    });

    const worker = (global.Worker as jest.Mock).mock.results[0].value;
    
    await act(async () => {
      worker.onmessage({
        data: {
          variableName: 'Var1',
          results: null,
          status: 'success'
        }
      });
    });

    expect(result.current.errorMsg).toContain('No results');
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

    const worker = (global.Worker as jest.Mock).mock.results[0].value;
    
    // First variable response
    await act(async () => {
      worker.onmessage({
        data: {
          variableName: 'Var1',
          results: {
            variable1: mockVariables[0],
            variable2: mockVariables[1],
            N: 5,
            metadata: {
              hasInsufficientData: false,
              variable1Name: 'Var1',
              variable2Name: 'Var2'
            },
            testStatisticsWilcoxon: {
              zValue: -0.5,
              pValue: 0.617
            }
          },
          status: 'success'
        }
      });
    });

    // Second variable response
    await act(async () => {
      worker.onmessage({
        data: {
          variableName: 'Var3',
          results: {
            variable1: mockVariables[2],
            variable2: mockVariables[3],
            N: 5,
            metadata: {
              hasInsufficientData: false,
              variable1Name: 'Var3',
              variable2Name: 'Var4'
            },
            testStatisticsWilcoxon: {
              zValue: -1.2,
              pValue: 0.230
            }
          },
          status: 'success'
        }
      });
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should handle descriptive statistics display option', async () => {
    const propsWithDescriptive = {
      ...defaultProps,
      displayStatistics: {
        descriptive: true,
        quartiles: false
      }
    };

    const { result } = renderTestHook(propsWithDescriptive);

    await act(async () => {
      result.current.runAnalysis();
    });

    const worker = (global.Worker as jest.Mock).mock.results[0].value;
    expect(worker.postMessage).toHaveBeenCalledWith(
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

    const worker = (global.Worker as jest.Mock).mock.results[0].value;
    expect(worker.postMessage).toHaveBeenCalledWith(
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

    const worker = (global.Worker as jest.Mock).mock.results[0].value;
    
    await act(async () => {
      worker.onerror(new Error('Critical worker error'));
    });

    expect(result.current.errorMsg).toContain('Critical worker error');
    expect(result.current.isCalculating).toBe(false);
  });

  it('should handle multiple test types simultaneously', async () => {
    const propsWithMultipleTests = {
      ...defaultProps,
      testType: {
        wilcoxon: true,
        sign: true,
        mcNemar: false,
        marginalHomogeneity: false
      }
    };

    const { result } = renderTestHook(propsWithMultipleTests);

    await act(async () => {
      result.current.runAnalysis();
    });

    const worker = (global.Worker as jest.Mock).mock.results[0].value;
    expect(worker.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        analysisType: ['twoRelatedSamples']
      })
    );
  });

  it('should handle multiple variables analysis', async () => {
    const { result } = renderTestHook();

    await act(async () => {
      result.current.runAnalysis();
    });

    const worker = (global.Worker as jest.Mock).mock.results[0].value;
    // Should be called for each variable pair
    expect(worker.postMessage).toHaveBeenCalledTimes(2);
  });

  it('should handle worker response with error status', async () => {
    const { result } = renderTestHook();

    await act(async () => {
      result.current.runAnalysis();
    });

    const worker = (global.Worker as jest.Mock).mock.results[0].value;
    
    await act(async () => {
      worker.onmessage({
        data: {
          variableName: 'Var1',
          results: null,
          status: 'error',
          error: 'Calculation failed for this variable'
        }
      });
    });

    expect(result.current.errorMsg).toContain('No results for Var1');
  });

  describe('Insufficient Data Cases', () => {
    it('should handle insufficient data - empty case', async () => {
      const { result } = renderTestHook();

      await act(async () => {
        result.current.runAnalysis();
      });

      const worker = (global.Worker as jest.Mock).mock.results[0].value;
      
      // First variable has insufficient data
      await act(async () => {
        worker.onmessage({
          data: {
            variableName: 'Var1',
            results: {
              variable1: mockVariables[0],
              variable2: mockVariables[1],
              N: 0,
              metadata: {
                hasInsufficientData: true,
                insufficientType: ['empty'],
                variable1Name: 'Var1',
                variable2Name: 'Var2'
              }
            },
            status: 'success'
          }
        });
      });

      // Second variable has sufficient data
      await act(async () => {
        worker.onmessage({
          data: {
            variableName: 'Var3',
            results: {
              variable1: mockVariables[2],
              variable2: mockVariables[3],
              N: 5,
              metadata: {
                hasInsufficientData: false,
                variable1Name: 'Var3',
                variable2Name: 'Var4'
              },
              testStatisticsWilcoxon: {
                zValue: -1.2,
                pValue: 0.230
              }
            },
            status: 'success'
          }
        });
      });

      // Wait for the hook to process all results
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.errorMsg).toBe(null); // Should not be an error, just insufficient data
    });

    it('should handle insufficient data - single case', async () => {
      const { result } = renderTestHook();

      await act(async () => {
        result.current.runAnalysis();
      });

      const worker = (global.Worker as jest.Mock).mock.results[0].value;
      
      // First variable has insufficient data
      await act(async () => {
        worker.onmessage({
          data: {
            variableName: 'Var1',
            results: {
              variable1: mockVariables[0],
              variable2: mockVariables[1],
              N: 1,
              metadata: {
                hasInsufficientData: true,
                insufficientType: ['single'],
                variable1Name: 'Var1',
                variable2Name: 'Var2'
              }
            },
            status: 'success'
          }
        });
      });

      // Second variable has sufficient data
      await act(async () => {
        worker.onmessage({
          data: {
            variableName: 'Var3',
            results: {
              variable1: mockVariables[2],
              variable2: mockVariables[3],
              N: 5,
              metadata: {
                hasInsufficientData: false,
                variable1Name: 'Var3',
                variable2Name: 'Var4'
              },
              testStatisticsWilcoxon: {
                zValue: -1.2,
                pValue: 0.230
              }
            },
            status: 'success'
          }
        });
      });

      // Wait for the hook to process all results
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.errorMsg).toBe(null); // Should not be an error, just insufficient data
    });

    it('should handle mixed sufficient and insufficient data for multiple variables', async () => {
      const { result } = renderTestHook();

      await act(async () => {
        result.current.runAnalysis();
      });

      const worker = (global.Worker as jest.Mock).mock.results[0].value;
      
      // First variable has sufficient data
      await act(async () => {
        worker.onmessage({
          data: {
            variableName: 'Var1',
            results: {
              variable1: mockVariables[0],
              variable2: mockVariables[1],
              N: 5,
              metadata: {
                hasInsufficientData: false,
                variable1Name: 'Var1',
                variable2Name: 'Var2'
              },
              testStatisticsWilcoxon: {
                zValue: -0.5,
                pValue: 0.617
              }
            },
            status: 'success'
          }
        });
      });

      // Second variable has insufficient data
      await act(async () => {
        worker.onmessage({
          data: {
            variableName: 'Var3',
            results: {
              variable1: mockVariables[2],
              variable2: mockVariables[3],
              N: 0,
              metadata: {
                hasInsufficientData: true,
                insufficientType: ['empty'],
                variable1Name: 'Var3',
                variable2Name: 'Var4'
              }
            },
            status: 'success'
          }
        });
      });

      expect(mockAddAnalytic).toHaveBeenCalled();
      expect(result.current.errorMsg).toBe(null); // Should not be an error, just insufficient data
    });

    it('should handle multiple insufficient data types', async () => {
      const { result } = renderTestHook();

      await act(async () => {
        result.current.runAnalysis();
      });

      const worker = (global.Worker as jest.Mock).mock.results[0].value;
      
      // First variable has insufficient data
      await act(async () => {
        worker.onmessage({
          data: {
            variableName: 'Var1',
            results: {
              variable1: mockVariables[0],
              variable2: mockVariables[1],
              N: 0,
              metadata: {
                hasInsufficientData: true,
                insufficientType: ['empty', 'single'],
                variable1Name: 'Var1',
                variable2Name: 'Var2'
              }
            },
            status: 'success'
          }
        });
      });

      // Second variable has sufficient data
      await act(async () => {
        worker.onmessage({
          data: {
            variableName: 'Var3',
            results: {
              variable1: mockVariables[2],
              variable2: mockVariables[3],
              N: 5,
              metadata: {
                hasInsufficientData: false,
                variable1Name: 'Var3',
                variable2Name: 'Var4'
              },
              testStatisticsWilcoxon: {
                zValue: -1.2,
                pValue: 0.230
              }
            },
            status: 'success'
          }
        });
      });

      expect(result.current.errorMsg).toBe(null); // Should not be an error, just insufficient data
    });
  });
});
