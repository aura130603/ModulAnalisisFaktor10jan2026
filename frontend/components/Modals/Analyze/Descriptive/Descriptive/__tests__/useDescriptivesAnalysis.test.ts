import { renderHook, act } from '@testing-library/react';
import { useDescriptivesAnalysis } from '../hooks/useDescriptivesAnalysis';
import { useZScoreProcessing } from '../hooks/useZScoreProcessing';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { DescriptivesAnalysisProps } from '../types';
import type { Variable } from '@/types/Variable';

// Mock dependencies
jest.mock('@/stores/useResultStore');
jest.mock('../hooks/useZScoreProcessing');
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

// ------------------------------
// Override global.Worker as fallback (not used because we mock registry)
// ------------------------------
global.Worker = jest.fn().mockImplementation(() => fakeWorker);

// Mock implementations
const mockedUseResultStore = useResultStore as unknown as jest.Mock;
const mockedUseZScoreProcessing = useZScoreProcessing as jest.Mock;
const mockedUseAnalysisData = useAnalysisData as unknown as jest.Mock;

const mockAddLog = jest.fn();
const mockAddAnalytic = jest.fn();
const mockAddStatistic = jest.fn();
const mockProcessZScoreData = jest.fn();
const mockOnClose = jest.fn();

const mockVariables: Variable[] = [
    { name: 'var1', label: 'Variable 1', columnIndex: 0, type: 'NUMERIC', tempId: '1', width: 8, decimals: 0, values: [], missing: {}, align: 'left', measure: 'scale', role: 'input', columns: 8 },
    { name: 'var2', label: 'Variable 2', columnIndex: 1, type: 'NUMERIC', tempId: '2', width: 8, decimals: 0, values: [], missing: {}, align: 'left', measure: 'scale', role: 'input', columns: 8 },
];

const mockAnalysisData = [
    [10, 100],
    [20, 200],
];
const mockWeights = null;

describe('useDescriptivesAnalysis', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedUseResultStore.mockReturnValue({ addLog: mockAddLog, addAnalytic: mockAddAnalytic, addStatistic: mockAddStatistic });
        mockedUseZScoreProcessing.mockReturnValue({ processZScoreData: mockProcessZScoreData });
        mockedUseAnalysisData.mockReturnValue({ data: mockAnalysisData, weights: mockWeights });
        
        mockAddLog.mockResolvedValue('log-123');
        mockAddAnalytic.mockResolvedValue('analytic-123');
        mockProcessZScoreData.mockResolvedValue(1); // Mocks creating 1 z-score variable
    });

    const defaultParams: Omit<DescriptivesAnalysisProps, 'onClose'> = {
        selectedVariables: [mockVariables[0]],
        displayStatistics: { mean: true, stdDev: true, minimum: true, maximum: true, variance: false, range: false, sum: false, median: false, skewness: false, kurtosis: false, standardError: false },
        saveStandardized: false,
        displayOrder: 'variableList',
    };

    const renderTestHook = (params: Partial<DescriptivesAnalysisProps> = {}) => {
        return renderHook(() => useDescriptivesAnalysis({ ...defaultParams, ...params, onClose: mockOnClose }));
    };

    it('should run analysis and process a successful worker response without z-scores', async () => {
        const { result } = renderTestHook();

        await act(async () => {
            await result.current.runAnalysis();
        });

        expect(result.current.isCalculating).toBe(true);
        expect(mockPostMessage).toHaveBeenCalledTimes(1);
        expect(mockPostMessage).toHaveBeenCalledWith({
            analysisType: 'descriptives',
            variable: mockVariables[0],
            data: [10, 20],
            weights: mockWeights,
            options: { ...defaultParams.displayStatistics, saveStandardized: false }
        });

        const mockWorkerResult = {
            status: 'success',
            variableName: 'var1',
            results: {
                variable: mockVariables[0],
                stats: { N: 2, Missing: 0, Mean: 15 },
                zScores: undefined, // No z-scores requested
            }
        };

        await act(async () => {
            workerOnMessage({ data: mockWorkerResult });
        });

        expect(mockProcessZScoreData).not.toHaveBeenCalled();
        expect(mockAddLog).toHaveBeenCalled();
        expect(mockAddAnalytic).toHaveBeenCalled();
        expect(mockAddStatistic).toHaveBeenCalledTimes(1);
        expect(mockOnClose).toHaveBeenCalled();
        expect(result.current.isCalculating).toBe(false);
        expect(result.current.error).toBe(null);
    });

    it('should run analysis and process z-scores when saveStandardized is true', async () => {
        const { result } = renderTestHook({ saveStandardized: true });
        
        await act(async () => {
            await result.current.runAnalysis();
        });

        const mockZScores = [-1, 1];
        const mockWorkerResult = {
            status: 'success',
            variableName: 'var1',
            results: {
                variable: mockVariables[0],
                stats: { N: 2, Missing: 0, Mean: 15 },
                zScores: mockZScores,
            }
        };

        await act(async () => {
            workerOnMessage({ data: mockWorkerResult });
        });

        expect(mockProcessZScoreData).toHaveBeenCalledTimes(1);
        expect(mockProcessZScoreData).toHaveBeenCalledWith(expect.objectContaining({
            'var1': {
                scores: mockZScores,
                variableInfo: expect.any(Object),
            }
        }));
        expect(mockAddStatistic).toHaveBeenCalledTimes(1);
        expect(result.current.isCalculating).toBe(false);
    });

    it('should handle multiple variables and aggregate results', async () => {
        const { result } = renderTestHook({ selectedVariables: mockVariables });

        await act(async () => {
            await result.current.runAnalysis();
        });

        expect(mockPostMessage).toHaveBeenCalledTimes(2);

        const mockWorkerResult1 = { status: 'success', variableName: 'var1', results: { variable: mockVariables[0], stats: { N: 2 } } };
        const mockWorkerResult2 = { status: 'success', variableName: 'var2', results: { variable: mockVariables[1], stats: { N: 2 } } };

        await act(async () => {
            workerOnMessage({ data: mockWorkerResult1 });
        });
        
        // Should not terminate yet
        expect(result.current.isCalculating).toBe(true);
        
        await act(async () => {
            workerOnMessage({ data: mockWorkerResult2 });
        });

        // Now it should finish
        expect(mockAddStatistic).toHaveBeenCalledTimes(1);
        // The formatter receives both results
        const formatCall = (mockAddStatistic.mock.calls[0][1] as any).output_data;
        const parsedData = JSON.parse(formatCall);
        expect(parsedData.tables[0].rows).toHaveLength(2); // Two variable rows
        
        expect(mockOnClose).toHaveBeenCalled();
        expect(result.current.isCalculating).toBe(false);
    });

    it('should handle worker errors gracefully', async () => {
        const { result } = renderTestHook();
        
        await act(async () => {
            await result.current.runAnalysis();
        });
        
        const mockWorkerError = { status: 'error', variableName: 'var1', error: 'Test worker error' };

        await act(async () => {
            workerOnMessage({ data: mockWorkerError });
        });
        
        expect(result.current.error).toContain('Calculation failed for var1: Test worker error');
        expect(mockAddStatistic).not.toHaveBeenCalled(); // No results to add
        expect(mockOnClose).not.toHaveBeenCalled(); // Don't close on error
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

        expect(result.current.error).toContain('A critical worker error occurred: Worker script could not be loaded');
        expect(result.current.isCalculating).toBe(false);
    });
}); 