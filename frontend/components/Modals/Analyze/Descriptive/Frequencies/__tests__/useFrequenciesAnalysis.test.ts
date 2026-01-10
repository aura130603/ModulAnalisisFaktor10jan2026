import { renderHook, act } from '@testing-library/react';
import { useFrequenciesAnalysis } from '../hooks/useFrequenciesAnalysis';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { FrequenciesAnalysisParams } from '../types';
import type { Variable } from '@/types/Variable';

// Mock dependencies
jest.mock('@/stores/useResultStore');
jest.mock('@/hooks/useAnalysisData');

// Mock Worker
const mockPostMessage = jest.fn();
const mockTerminate = jest.fn();
let workerOnMessage: (event: { data: any }) => void;
let workerOnError: (event: ErrorEvent) => void;

global.Worker = jest.fn().mockImplementation(() => ({
  postMessage: mockPostMessage,
  terminate: mockTerminate,
  set onmessage(fn: (event: { data: any }) => void) {
    workerOnMessage = fn;
  },
  set onerror(fn: (event: ErrorEvent) => void) {
    workerOnError = fn;
  },
}));

// Mock implementations
const mockedUseResultStore = useResultStore as unknown as jest.Mock;
const mockedUseAnalysisData = useAnalysisData as unknown as jest.Mock;

const mockAddLog = jest.fn();
const mockAddAnalytic = jest.fn();
const mockAddStatistic = jest.fn();
const mockOnClose = jest.fn();

const mockVariables: Variable[] = [
    { name: 'var1', label: 'Variable 1', columnIndex: 0, type: 'STRING', tempId: '1' } as Variable,
];

const mockAnalysisData = [['A'], ['B'], ['A']];
const mockWeights = null;

describe('useFrequenciesAnalysis', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedUseResultStore.mockReturnValue({ addLog: mockAddLog, addAnalytic: mockAddAnalytic, addStatistic: mockAddStatistic });
        mockedUseAnalysisData.mockReturnValue({ data: mockAnalysisData, weights: mockWeights });
        
        mockAddLog.mockResolvedValue('log-789');
        mockAddAnalytic.mockResolvedValue('analytic-789');

        // Ensure getState returns our mocked addStatistic for utilities that access the store directly
        (useResultStore as any).getState = () => ({ addStatistic: mockAddStatistic });
    });

    const defaultParams: Omit<FrequenciesAnalysisParams, 'onClose'> = {
        selectedVariables: mockVariables,
        showFrequencyTables: true,
        showStatistics: false,
        statisticsOptions: null,
        showCharts: false,
        chartOptions: null,
    };

    const renderTestHook = (params: Partial<FrequenciesAnalysisParams> = {}) => {
        return renderHook(() => useFrequenciesAnalysis({ ...defaultParams, ...params, onClose: mockOnClose }));
    };

    it('should run analysis and process a successful worker response', async () => {
        const { result } = renderTestHook();

        let runPromise: Promise<void> | undefined;
        act(() => {
            runPromise = result.current.runAnalysis();
        });

        await act(async () => { if (runPromise) await runPromise; });

        expect(result.current.isLoading).toBe(true);
        expect(mockPostMessage).toHaveBeenCalledTimes(1);
        expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({
            variableData: [
                expect.objectContaining({
                    variable: expect.objectContaining({
                        name: 'var1',
                        label: 'Variable 1',
                        columnIndex: 0,
                        tempId: '1',
                        type: 'STRING',
                    }),
                    data: mockAnalysisData.map(row => row[0])
                })
            ],
            weightVariableData: mockWeights,
        }));

        const mockWorkerResult = {
            success: true,
            results: {
                statistics: {},
                frequencyTables: {
                    'var1': { title: 'Var1 Frequencies', rows: [], summary: { valid: 3, missing: 0, total: 3 } }
                }
            }
        };
        
        await act(async () => {
            workerOnMessage({ data: mockWorkerResult });
            if (runPromise) await runPromise;
        });

        expect(mockAddLog).toHaveBeenCalled();
        expect(mockAddAnalytic).toHaveBeenCalled();
        expect(mockAddStatistic).toHaveBeenCalledTimes(1); // Frequency table
        expect(mockTerminate).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.errorMsg).toBeNull();
    });

    it('should also add charts if chartOptions are provided', async () => {
        const { result } = renderTestHook({
            showCharts: true,
            chartOptions: { type: 'barCharts', values: 'frequencies', showNormalCurveOnHistogram: false }
        });

        let runPromise: Promise<void> | undefined;
        act(() => {
            runPromise = result.current.runAnalysis();
        });

        await act(async () => { if (runPromise) await runPromise; });

        const mockWorkerResult = {
            success: true,
            results: {
                statistics: {},
                frequencyTables: {
                    'var1': { title: 'Var1 Frequencies', rows: [{label: 'A', frequency: 2}, {label: 'B', frequency: 1}], summary: { valid: 3, missing: 0, total: 3 } }
                }
            }
        };

        await act(async () => {
            workerOnMessage({ data: mockWorkerResult });
            if (runPromise) await runPromise;
        });

        expect(mockAddStatistic).toHaveBeenCalledTimes(2); // One for freq table, one for chart
        
        const chartCall = mockAddStatistic.mock.calls.find(call => call[1].components === 'Bar');
        expect(chartCall).toBeDefined();
        expect(chartCall[1]).toEqual(expect.objectContaining({
            title: expect.stringContaining('Bar Chart'),
            components: 'Bar',
        }));
    });

    it('should handle worker errors', async () => {
        const { result } = renderTestHook();

        let runPromise: Promise<void> | undefined;
        act(() => {
            runPromise = result.current.runAnalysis();
        });

        await act(async () => { if (runPromise) await runPromise; });

        const mockWorkerError = { success: false, error: 'Frequency calculation failed' };

        await act(async () => {
            workerOnMessage({ data: mockWorkerError });
            if (runPromise) await runPromise;
        });

        expect(result.current.errorMsg).toBe('Frequency calculation failed');
        expect(result.current.isLoading).toBe(false);
        expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should handle critical worker instantiation errors', async () => {
        const { result } = renderTestHook();
        
        let runPromise: Promise<void> | undefined;
        act(() => {
            runPromise = result.current.runAnalysis();
        });

        await act(async () => { if (runPromise) await runPromise; });

        const errorEvent = new ErrorEvent('error', {
            error: new Error('Script failed'),
            message: 'Worker died'
        });

        await act(async () => {
            workerOnError(errorEvent);
        });

        expect(result.current.errorMsg).toContain('An unexpected error occurred in the Frequencies worker: Worker died');
        expect(result.current.isLoading).toBe(false);
        expect(mockTerminate).toHaveBeenCalled();
    });
}); 