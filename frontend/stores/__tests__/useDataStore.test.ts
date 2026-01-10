import { renderHook, act } from '@testing-library/react';
import { useDataStore } from '../useDataStore';
import dataService from '@/services/data/DataService';

// Mock the dataService
jest.mock('@/services/data/DataService', () => ({
    loadAllData: jest.fn(),
    resetAllData: jest.fn(),
    replaceAllData: jest.fn(),
    applyBulkUpdates: jest.fn(),
}));

describe('useDataStore', () => {
    // Get the initial state before each test
    let initialState: any;
    beforeEach(() => {
        initialState = useDataStore.getState();
        jest.clearAllMocks();
    });

    afterEach(() => {
        // Reset the store to its initial state after each test
        act(() => {
            useDataStore.setState(initialState);
        });
    });

    it('should have a correct initial state', () => {
        const { result } = renderHook(() => useDataStore());

        expect(result.current.data).toEqual([]);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe(null);
        expect(result.current.hasUnsavedChanges).toBe(false);
        expect(result.current.pendingUpdates).toEqual([]);
    });

    it('should set data correctly using setData', () => {
        const { result } = renderHook(() => useDataStore());
        const newData = [[1, 2], [3, 4]];

        act(() => {
            result.current.setData(newData);
        });

        expect(result.current.data).toEqual(newData);
        expect(result.current.hasUnsavedChanges).toBe(true);
        expect(result.current.lastUpdated).toBeInstanceOf(Date);
    });

    it('should update a single cell correctly using updateCell', async () => {
        const { result } = renderHook(() => useDataStore());
        const initialData = [['a', 'b'], ['c', 'd']];

        // Set initial data first
        act(() => {
            result.current.setData(initialData);
        });

        // Reset hasUnsavedChanges for this specific test
        act(() => {
             useDataStore.setState({ hasUnsavedChanges: false });
        });

        await act(async () => {
            await result.current.updateCell(0, 1, 'x');
        });

        expect(result.current.data[0][1]).toBe('x');
        expect(result.current.hasUnsavedChanges).toBe(true);
        expect(result.current.pendingUpdates).toHaveLength(1);
        expect(result.current.pendingUpdates[0]).toEqual({ row: 0, col: 1, value: 'x' });
    });

    it('should expand the matrix when updating an out-of-bounds cell', async () => {
        const { result } = renderHook(() => useDataStore());
        const initialData = [[1]]; // 1x1 grid

        act(() => {
            result.current.setData(initialData);
        });
        
        await act(async () => {
            // Update a cell that requires adding a new row and column
            await result.current.updateCell(1, 1, 'new');
        });

        // Expect the grid to be expanded to 2x2
        expect(result.current.data).toEqual([[1, ""], ["", "new"]]);
        expect(result.current.hasUnsavedChanges).toBe(true);
        expect(result.current.pendingUpdates).toHaveLength(1);
        expect(result.current.pendingUpdates[0]).toEqual({ row: 1, col: 1, value: 'new' });
    });

    it('should not mark changes if the cell value is the same', async () => {
         const { result } = renderHook(() => useDataStore());
        const initialData = [['a', 'b'], ['c', 'd']];

        act(() => {
            result.current.setData(initialData);
        });
        
        // Reset hasUnsavedChanges and pendingUpdates
        act(() => {
             useDataStore.setState({ hasUnsavedChanges: false, pendingUpdates: [] });
        });

        await act(async () => {
            await result.current.updateCell(0, 0, 'a'); // Same value
        });

        expect(result.current.hasUnsavedChanges).toBe(false);
        expect(result.current.pendingUpdates).toHaveLength(0);
    });
}); 