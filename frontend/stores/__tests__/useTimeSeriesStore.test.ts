import { renderHook, act } from '@testing-library/react';
import { useTimeSeriesStore } from '../useTimeSeriesStore';

describe('useTimeSeriesStore', () => {
    let initialState: any;
    beforeEach(() => {
        initialState = useTimeSeriesStore.getState();
        jest.clearAllMocks();
    });

    afterEach(() => {
        act(() => {
            useTimeSeriesStore.setState(initialState);
        });
    });

    it('should have a correct initial state', () => {
        const { result } = renderHook(() => useTimeSeriesStore());
        expect(result.current.typeDate).toBe('nd');
        expect(result.current.year).toBe(2025);
        expect(result.current.week).toBe(1);
        expect(result.current.day).toBe(1);
        expect(result.current.hour).toBe(0);
    });

    it('should set values correctly using setters', () => {
        const { result } = renderHook(() => useTimeSeriesStore());

        act(() => {
            result.current.setTypeDate('yq');
            result.current.setYear(2024);
            result.current.setWeek(10);
            result.current.setDay(15);
            result.current.setHour(12);
        });

        expect(result.current.typeDate).toBe('yq');
        expect(result.current.year).toBe(2024);
        expect(result.current.week).toBe(10);
        expect(result.current.day).toBe(15);
        expect(result.current.hour).toBe(12);
    });

    it('should validate and clamp values when setting them', () => {
        const { result } = renderHook(() => useTimeSeriesStore());

        act(() => {
            // Set values outside the valid range
            result.current.setYear(1800); // Should be clamped to 1900
            result.current.setWeek(100);  // Should be clamped to 52
            result.current.setDay(0);     // Should be clamped to 1
            result.current.setHour(25);   // Should be clamped to 23
        });

        expect(result.current.year).toBe(1900);
        expect(result.current.week).toBe(52);
        expect(result.current.day).toBe(1);
        expect(result.current.hour).toBe(23);
    });
}); 