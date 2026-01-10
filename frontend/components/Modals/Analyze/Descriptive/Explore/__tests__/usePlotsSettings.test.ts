import { renderHook, act } from '@testing-library/react';
import { usePlotsSettings } from '../hooks/usePlotsSettings';

describe('usePlotsSettings Hook', () => {

    it('should initialize with default settings', () => {
        const { result } = renderHook(() => usePlotsSettings());

        expect(result.current.boxplotType).toBe('none');
        expect(result.current.showStemAndLeaf).toBe(false);
        expect(result.current.showHistogram).toBe(false);
        expect(result.current.showNormalityPlots).toBe(false);
    });

    it('should update boxplotType correctly', () => {
        const { result } = renderHook(() => usePlotsSettings());

        act(() => {
            result.current.setBoxplotType('factor-levels-together');
        });

        expect(result.current.boxplotType).toBe('factor-levels-together');

        act(() => {
            result.current.setBoxplotType('dependents-separately');
        });

        expect(result.current.boxplotType).toBe('dependents-separately');
    });

    it('should update showStemAndLeaf correctly', () => {
        const { result } = renderHook(() => usePlotsSettings());

        act(() => {
            result.current.setShowStemAndLeaf(true);
        });

        expect(result.current.showStemAndLeaf).toBe(true);
    });

    it('should update showHistogram correctly', () => {
        const { result } = renderHook(() => usePlotsSettings());

        act(() => {
            result.current.setShowHistogram(true);
        });

        expect(result.current.showHistogram).toBe(true);
    });

    it('should update showNormalityPlots correctly', () => {
        const { result } = renderHook(() => usePlotsSettings());

        act(() => {
            result.current.setShowNormalityPlots(true);
        });

        expect(result.current.showNormalityPlots).toBe(true);
    });

    it('should reset all settings to their initial state', () => {
        const { result } = renderHook(() => usePlotsSettings());

        // Change some settings first
        act(() => {
            result.current.setBoxplotType('factor-levels-together');
            result.current.setShowHistogram(true);
            result.current.setShowNormalityPlots(true);
        });

        // Verify they were changed
        expect(result.current.boxplotType).toBe('factor-levels-together');
        expect(result.current.showHistogram).toBe(true);

        // Reset the settings
        act(() => {
            result.current.resetPlotsSettings();
        });

        // Verify they are back to default
        expect(result.current.boxplotType).toBe('none');
        expect(result.current.showHistogram).toBe(false);
        expect(result.current.showNormalityPlots).toBe(false);
    });
});