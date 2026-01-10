import { renderHook, act } from '@testing-library/react';
import { useResultStore } from '../useResultStore';
import resultService from '@/services/data/ResultService';
import { Log, Analytic, Statistic } from '@/types/Result';

// Mock the resultService
jest.mock('@/services/data/ResultService', () => ({
    getAllResults: jest.fn(),
    getLog: jest.fn(),
    addResultLog: jest.fn(),
    updateLog: jest.fn(),
    deleteLog: jest.fn(),
    updateAnalytic: jest.fn(),
    deleteAnalytic: jest.fn(),
    updateStatistic: jest.fn(),
    deleteStatistic: jest.fn(),
    clearAll: jest.fn(),
}));

// Cast the mock to the correct type to allow mocking its methods
const mockedResultService = resultService as jest.Mocked<typeof resultService>;

const mockStatistic1: Statistic = { id: 101, title: 'Stat 1', components: 'Comp A', output_data: '{}', description: '' };
const mockStatistic2: Statistic = { id: 102, title: 'Stat 2', components: 'Comp B', output_data: '{}', description: '' };

const mockAnalytic1: Analytic = { id: 11, title: 'Analytic 1', statistics: [mockStatistic1, mockStatistic2] };
const mockAnalytic2: Analytic = { id: 12, title: 'Analytic 2', statistics: [] };

const mockLog1: Log = { id: 1, log: 'First log entry', analytics: [mockAnalytic1, mockAnalytic2] };
const mockLog2: Log = { id: 2, log: 'Second log entry', analytics: [] };

describe('useResultStore', () => {
    let initialState: any;
    beforeEach(() => {
        initialState = useResultStore.getState();
        jest.clearAllMocks();
    });

    afterEach(() => {
        act(() => {
            useResultStore.setState(initialState);
        });
    });

    it('should have a correct initial state', () => {
        const { result } = renderHook(() => useResultStore());
        expect(result.current.logs).toEqual([]);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe(null);
    });

    it('should add a new log', async () => {
        const { result } = renderHook(() => useResultStore());
        const newLogData = { log: 'New log' };
        
        mockedResultService.addResultLog.mockResolvedValue(1);

        await act(async () => {
            await result.current.addLog(newLogData);
        });

        expect(result.current.logs).toHaveLength(1);
        expect(result.current.logs[0]!.log).toBe('New log');
        expect(result.current.logs[0]!.id).toBe(1);
        expect(mockedResultService.addResultLog).toHaveBeenCalledWith(newLogData);
    });

    it('should delete a log', async () => {
        const { result } = renderHook(() => useResultStore());

        act(() => {
            useResultStore.setState({ logs: [mockLog1, mockLog2] });
        });

        mockedResultService.deleteLog.mockResolvedValue(true);

        await act(async () => {
            if (typeof mockLog1.id === 'number') {
                await result.current.deleteLog(mockLog1.id);
            }
        });

        expect(result.current.logs).toHaveLength(1);
        expect(result.current.logs[0]!.id).toBe(mockLog2.id);
        expect(mockedResultService.deleteLog).toHaveBeenCalledWith(mockLog1.id);
    });

    it('should clear all logs', async () => {
        const { result } = renderHook(() => useResultStore());

        act(() => {
            useResultStore.setState({ logs: [mockLog1, mockLog2] });
        });

        mockedResultService.clearAll.mockResolvedValue(true);

        await act(async () => {
            await result.current.clearAll();
        });

        expect(result.current.logs).toHaveLength(0);
        expect(mockedResultService.clearAll).toHaveBeenCalledTimes(1);
    });

    it('should update a statistic description', async () => {
        const { result } = renderHook(() => useResultStore());
        act(() => {
            useResultStore.setState({ logs: [JSON.parse(JSON.stringify(mockLog1))] });
        });

        const newDescription = 'This is an updated description.';
        mockedResultService.updateStatistic.mockResolvedValue(101);

        await act(async () => {
            await result.current.updateStatistic(101, { description: newDescription });
        });

        const updatedStat = result.current.logs[0]!.analytics![0]!.statistics![0]!;
        expect(updatedStat.description).toBe(newDescription);
        expect(mockedResultService.updateStatistic).toHaveBeenCalledWith(101, { description: newDescription });
    });

    it('should delete an analytic from a log', async () => {
        const { result } = renderHook(() => useResultStore());
        act(() => {
            useResultStore.setState({ logs: [JSON.parse(JSON.stringify(mockLog1))] });
        });

        mockedResultService.deleteAnalytic.mockResolvedValue(true);

        await act(async () => {
            await result.current.deleteAnalytic(11);
        });

        expect(result.current.logs[0]!.analytics).toHaveLength(1);
        expect(result.current.logs[0]!.analytics![0]!.id).toBe(12);
        expect(mockedResultService.deleteAnalytic).toHaveBeenCalledWith(11);
    });

    it('should delete a statistic from an analytic', async () => {
        const { result } = renderHook(() => useResultStore());
        act(() => {
            useResultStore.setState({ logs: [JSON.parse(JSON.stringify(mockLog1))] });
        });

        mockedResultService.deleteStatistic.mockResolvedValue(true);

        await act(async () => {
            await result.current.deleteStatistic(101);
        });

        expect(result.current.logs[0]!.analytics![0]!.statistics).toHaveLength(1);
        expect(result.current.logs[0]!.analytics![0]!.statistics![0]!.id).toBe(102);
        expect(mockedResultService.deleteStatistic).toHaveBeenCalledWith(101);
    });

    it('should fetch all results and populate the store', async () => {
        const { result } = renderHook(() => useResultStore());
        mockedResultService.getAllResults.mockResolvedValue([mockLog1, mockLog2]);

        await act(async () => {
            await result.current.loadResults();
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.logs).toHaveLength(2);
        expect(result.current.logs[0]!.id).toBe(1);
        expect(result.current.logs[1]!.id).toBe(2);
        expect(mockedResultService.getAllResults).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when adding a log', async () => {
        const { result } = renderHook(() => useResultStore());
        const error = new Error('Failed to add');
        mockedResultService.addResultLog.mockRejectedValue(error);

        await expect(
            act(async () => {
                await result.current.addLog({ log: 'This will fail' });
            })
        ).rejects.toThrow('Failed to add');

        expect(result.current.logs).toHaveLength(0);
    });
}); 