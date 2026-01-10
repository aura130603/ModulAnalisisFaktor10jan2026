import { renderHook, act } from '@testing-library/react';
import { useTableRefStore } from '../useTableRefStore';

describe('useTableRefStore', () => {
    let initialState: any;
    beforeEach(() => {
        initialState = useTableRefStore.getState();
        jest.clearAllMocks();
    });

    afterEach(() => {
        act(() => {
            useTableRefStore.setState(initialState);
        });
    });

    it('should have a correct initial state', () => {
        const { result } = renderHook(() => useTableRefStore());
        expect(result.current.dataTableRef).toBe(null);
        expect(result.current.variableTableRef).toBe(null);
        expect(result.current.viewMode).toBe('numeric');
    });

    it('should set the data table ref', () => {
        const { result } = renderHook(() => useTableRefStore());
        const mockRef = { current: 'mock-table-instance' };

        act(() => {
            result.current.setDataTableRef(mockRef);
        });

        expect(result.current.dataTableRef).toBe(mockRef);
    });

    it('should toggle the view mode', () => {
        const { result } = renderHook(() => useTableRefStore());

        // Initial state is 'numeric'
        expect(result.current.viewMode).toBe('numeric');

        // Toggle to 'label'
        act(() => {
            result.current.toggleViewMode();
        });
        expect(result.current.viewMode).toBe('label');

        // Toggle back to 'numeric'
        act(() => {
            result.current.toggleViewMode();
        });
        expect(result.current.viewMode).toBe('numeric');
    });

    it('should set the view mode directly', () => {
        const { result } = renderHook(() => useTableRefStore());

        act(() => {
            result.current.setViewMode('label');
        });
        expect(result.current.viewMode).toBe('label');
    });
}); 