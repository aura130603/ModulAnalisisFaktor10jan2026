import { renderHook, act } from '@testing-library/react';
import { useTestSettings } from '../hooks/useTestSettings';
import { CutPointOptions, DisplayStatisticsOptions } from '../types';

describe('useTestSettings hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useTestSettings());

    expect(result.current.cutPoint).toEqual({
      median: true,
      mode: false,
      mean: false,
      custom: false
    });
    expect(result.current.customValue).toBe(0);
    expect(result.current.displayStatistics).toEqual({
      descriptive: false,
      quartiles: false
    });
  });

  it('should set cut point', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setCutPoint({
        median: false,
        mode: true,
        mean: false,
        custom: false
      });
    });

    expect(result.current.cutPoint).toEqual({
      median: false,
      mode: true,
      mean: false,
      custom: false
    });
  });

  it('should set custom value', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setCustomValue(15.5);
    });

    expect(result.current.customValue).toBe(15.5);
  });

  it('should set display statistics', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setDisplayStatistics({
        descriptive: true,
        quartiles: true
      });
    });

    expect(result.current.displayStatistics).toEqual({
      descriptive: true,
      quartiles: true
    });
  });

  it('should reset test settings to default values', () => {
    const { result } = renderHook(() => useTestSettings());

    // Change some values
    act(() => {
      result.current.setCutPoint({
        median: false,
        mode: true,
        mean: false,
        custom: false
      });
      result.current.setCustomValue(10.5);
      result.current.setDisplayStatistics({
        descriptive: true,
        quartiles: false
      });
    });

    // Reset to defaults
    act(() => {
      result.current.resetTestSettings();
    });

    expect(result.current.cutPoint).toEqual({
      median: true,
      mode: false,
      mean: false,
      custom: false
    });
    expect(result.current.customValue).toBe(0);
    expect(result.current.displayStatistics).toEqual({
      descriptive: false,
      quartiles: false
    });
  });

  it('should handle setting custom value to zero', () => {
    const { result } = renderHook(() => useTestSettings());

    // First set a value
    act(() => {
      result.current.setCustomValue(10.5);
    });

    // Then set to zero
    act(() => {
      result.current.setCustomValue(0);
    });

    expect(result.current.customValue).toBe(0);
  });

  it('should handle setting custom value to negative number', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setCustomValue(-5.5);
    });

    expect(result.current.customValue).toBe(-5.5);
  });

  it('should handle multiple state changes', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setCutPoint({
        median: false,
        mode: true,
        mean: false,
        custom: false
      });
    });

    act(() => {
      result.current.setCustomValue(20.0);
    });

    act(() => {
      result.current.setDisplayStatistics({
        descriptive: true,
        quartiles: true
      });
    });

    expect(result.current.cutPoint).toEqual({
      median: false,
      mode: true,
      mean: false,
      custom: false
    });
    expect(result.current.customValue).toBe(20.0);
    expect(result.current.displayStatistics).toEqual({
      descriptive: true,
      quartiles: true
    });
  });

  it('should maintain state between renders', () => {
    const { result, rerender } = renderHook(() => useTestSettings());

    // Set some values
    act(() => {
      result.current.setCutPoint({
        median: false,
        mode: true,
        mean: false,
        custom: false
      });
      result.current.setCustomValue(15.5);
    });

    // Rerender the hook
    rerender();

    // Values should be maintained
    expect(result.current.cutPoint).toEqual({
      median: false,
      mode: true,
      mean: false,
      custom: false
    });
    expect(result.current.customValue).toBe(15.5);
    expect(result.current.displayStatistics).toEqual({
      descriptive: false,
      quartiles: false
    }); // Default value
  });

  it('should handle rapid state changes', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setCutPoint({
        median: true,
        mode: false,
        mean: false,
        custom: false
      });
      result.current.setCutPoint({
        median: false,
        mode: true,
        mean: false,
        custom: false
      });
      result.current.setCutPoint({
        median: true,
        mode: false,
        mean: false,
        custom: false
      });
    });

    expect(result.current.cutPoint).toEqual({
      median: true,
      mode: false,
      mean: false,
      custom: false
    });
  });

  it('should handle setting same value multiple times', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setCustomValue(10.0);
      result.current.setCustomValue(10.0);
      result.current.setCustomValue(10.0);
    });

    expect(result.current.customValue).toBe(10.0);
  });

  it('should handle reset after multiple changes', () => {
    const { result } = renderHook(() => useTestSettings());

    // Make multiple changes
    act(() => {
      result.current.setCutPoint({
        median: false,
        mode: true,
        mean: false,
        custom: false
      });
      result.current.setCustomValue(25.5);
      result.current.setDisplayStatistics({
        descriptive: true,
        quartiles: true
      });
    });

    // Verify changes were made
    expect(result.current.cutPoint).toEqual({
      median: false,
      mode: true,
      mean: false,
      custom: false
    });
    expect(result.current.customValue).toBe(25.5);
    expect(result.current.displayStatistics).toEqual({
      descriptive: true,
      quartiles: true
    });

    // Reset
    act(() => {
      result.current.resetTestSettings();
    });

    // Verify reset to defaults
    expect(result.current.cutPoint).toEqual({
      median: true,
      mode: false,
      mean: false,
      custom: false
    });
    expect(result.current.customValue).toBe(0);
    expect(result.current.displayStatistics).toEqual({
      descriptive: false,
      quartiles: false
    });
  });
}); 