import { renderHook, act } from '@testing-library/react';
import { useChiSquareAnalysis } from '../hooks/useChiSquareAnalysis';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useDataStore } from '@/stores/useDataStore';
import type { Variable } from '@/types/Variable';

// Mock dependencies
jest.mock('@/stores/useResultStore');
jest.mock('@/hooks/useAnalysisData');
jest.mock('@/stores/useDataStore');

// Mock Web Worker
const mockWorker = {
  postMessage: jest.fn(),
  terminate: jest.fn(),
  onmessage: null as any,
  onerror: null as any
};

global.Worker = jest.fn(() => mockWorker) as any;

const mockAddLog = jest.fn().mockResolvedValue('log-123');
const mockAddAnalytic = jest.fn().mockResolvedValue('analytic-123');
const mockAddStatistic = jest.fn().mockResolvedValue('statistic-123');
const mockCheckAndSave = jest.fn().mockResolvedValue(undefined);

const mockVariables: Variable[] = [
  {
    name: 'var1',
    label: 'Variable 1',
    columnIndex: 0,
    type: 'NUMERIC',
    tempId: '1',
    width: 8,
    decimals: 0,
    values: [],
    missing: {},
    align: 'left',
    measure: 'nominal',
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
    decimals: 0,
    values: [],
    missing: {},
    align: 'left',
    measure: 'ordinal',
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

describe('useChiSquareAnalysis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useResultStore as unknown as jest.Mock).mockReturnValue({
      addLog: mockAddLog,
      addAnalytic: mockAddAnalytic,
      addStatistic: mockAddStatistic
    });

    (useAnalysisData as unknown as jest.Mock).mockReturnValue({
      data: mockAnalysisData
    });

    (useDataStore as unknown as jest.Mock).mockReturnValue({
      getState: () => ({
        checkAndSave: mockCheckAndSave
      })
    });
  });

  const defaultProps = {
    testVariables: mockVariables,
    expectedRange: { getFromData: true, useSpecifiedRange: false },
    rangeValue: { lowerValue: null, upperValue: null },
    expectedValue: { allCategoriesEqual: true, values: false, inputValue: null },
    expectedValueList: [],
    displayStatistics: { descriptive: false, quartiles: false },
    onClose: jest.fn()
  };

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useChiSquareAnalysis(defaultProps));

    expect(result.current.isCalculating).toBe(false);
    expect(result.current.errorMsg).toBe(null);
    expect(typeof result.current.runAnalysis).toBe('function');
    expect(typeof result.current.cancelCalculation).toBe('function');
  });

  it('should start analysis when runAnalysis is called', async () => {
    const { result } = renderHook(() => useChiSquareAnalysis(defaultProps));

    await act(async () => {
      await result.current.runAnalysis();
    });

    expect(mockCheckAndSave).toHaveBeenCalled();
    expect(mockWorker.postMessage).toHaveBeenCalled();
  });

  it('should handle successful worker response', async () => {
    const { result } = renderHook(() => useChiSquareAnalysis(defaultProps));

    await act(async () => {
      await result.current.runAnalysis();
    });

    // Simulate successful worker response
    const mockResponse = {
      variableName: 'var1',
      results: {
        metadata: {
          hasInsufficientData: false,
          variableName: 'var1',
          variableLabel: 'Variable 1',
          insufficientType: []
        },
        frequencies: [],
        testStatistics: []
      },
      status: 'success'
    };

    await act(async () => {
      mockWorker.onmessage({ data: mockResponse });
    });

    expect(mockAddLog).toHaveBeenCalled();
    expect(mockAddAnalytic).toHaveBeenCalled();
  });

  it('should handle worker error', async () => {
    const { result } = renderHook(() => useChiSquareAnalysis(defaultProps));

    await act(async () => {
      await result.current.runAnalysis();
    });

    // Simulate worker error
    const mockError = {
      variableName: 'var1',
      status: 'error',
      error: 'Test error'
    };

    await act(async () => {
      mockWorker.onmessage({ data: mockError });
    });

    expect(result.current.errorMsg).toContain('Test error');
  });

  it('should handle insufficient data', async () => {
    const { result } = renderHook(() => useChiSquareAnalysis(defaultProps));

    await act(async () => {
      await result.current.runAnalysis();
    });

    // Simulate insufficient data response
    const mockInsufficientResponse = {
      variableName: 'var1',
      results: {
        metadata: {
          hasInsufficientData: true,
          variableName: 'var1',
          variableLabel: 'Variable 1',
          insufficientType: ['empty']
        }
      },
      status: 'success'
    };

    await act(async () => {
      mockWorker.onmessage({ data: mockInsufficientResponse });
    });

    expect(mockAddLog).toHaveBeenCalled();
    expect(mockAddAnalytic).toHaveBeenCalled();
  });

  it('should cancel calculation', async () => {
    const { result } = renderHook(() => useChiSquareAnalysis(defaultProps));

    await act(async () => {
      await result.current.runAnalysis();
    });

    await act(async () => {
      result.current.cancelCalculation();
    });

    expect(mockWorker.terminate).toHaveBeenCalled();
    expect(result.current.isCalculating).toBe(false);
  });

  it('should handle critical worker error', async () => {
    const { result } = renderHook(() => useChiSquareAnalysis(defaultProps));

    await act(async () => {
      await result.current.runAnalysis();
    });

    // Simulate critical worker error
    const mockCriticalError = new Error('Critical worker error');
    await act(async () => {
      mockWorker.onerror(mockCriticalError);
    });

    expect(result.current.errorMsg).toContain('Critical worker error');
    expect(result.current.isCalculating).toBe(false);
  });

  it('should handle multiple variables', async () => {
    const multipleVariables = [mockVariables[0], mockVariables[1]];
    const props = { ...defaultProps, testVariables: multipleVariables };
    
    const { result } = renderHook(() => useChiSquareAnalysis(props));

    await act(async () => {
      await result.current.runAnalysis();
    });

    // Should post message for each variable
    expect(mockWorker.postMessage).toHaveBeenCalledTimes(2);
  });

  it('should handle descriptive statistics option', async () => {
    const props = {
      ...defaultProps,
      displayStatistics: { descriptive: true, quartiles: false }
    };
    
    const { result } = renderHook(() => useChiSquareAnalysis(props));

    await act(async () => {
      await result.current.runAnalysis();
    });

    // Should include descriptive statistics in analysis types
    expect(mockWorker.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        analysisType: ['descriptiveStatistics', 'chiSquare']
      })
    );
  });

  it('should cleanup worker on unmount', () => {
    const { unmount } = renderHook(() => useChiSquareAnalysis(defaultProps));

    unmount();

    expect(mockWorker.terminate).toHaveBeenCalled();
  });

  it('should handle save error', async () => {
    mockCheckAndSave.mockRejectedValueOnce(new Error('Save failed'));
    
    const { result } = renderHook(() => useChiSquareAnalysis(defaultProps));

    await act(async () => {
      await result.current.runAnalysis();
    });

    expect(result.current.errorMsg).toContain('Save failed');
    expect(result.current.isCalculating).toBe(false);
  });
}); 