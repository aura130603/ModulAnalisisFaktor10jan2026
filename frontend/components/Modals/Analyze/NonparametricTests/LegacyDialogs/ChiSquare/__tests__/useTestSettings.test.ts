import { renderHook, act } from '@testing-library/react';
import { useTestSettings } from '../hooks/useTestSettings';

describe('useTestSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useTestSettings());

    expect(result.current.expectedRange).toEqual({
      getFromData: true,
      useSpecifiedRange: false
    });
    expect(result.current.rangeValue).toEqual({
      lowerValue: null,
      upperValue: null
    });
    expect(result.current.expectedValue).toEqual({
      allCategoriesEqual: true,
      values: false,
      inputValue: null
    });
    expect(result.current.expectedValueList).toEqual([]);
    expect(result.current.displayStatistics).toEqual({
      descriptive: false,
      quartiles: false
    });
  });

  it('should update expected range', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setExpectedRange({
        getFromData: false,
        useSpecifiedRange: true
      });
    });

    expect(result.current.expectedRange).toEqual({
      getFromData: false,
      useSpecifiedRange: true
    });
  });

  it('should update range value', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setRangeValue({
        lowerValue: 1,
        upperValue: 10
      });
    });

    expect(result.current.rangeValue).toEqual({
      lowerValue: 1,
      upperValue: 10
    });
  });

  it('should update expected value', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setExpectedValue({
        allCategoriesEqual: false,
        values: true,
        inputValue: 5
      });
    });

    expect(result.current.expectedValue).toEqual({
      allCategoriesEqual: false,
      values: true,
      inputValue: 5
    });
  });

  it('should update expected value list', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setExpectedValueList([1, 2, 3]);
    });

    expect(result.current.expectedValueList).toEqual([1, 2, 3]);
  });

  it('should update display statistics', () => {
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

  it('should handle partial updates', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setExpectedRange({
        getFromData: false,
        useSpecifiedRange: true
      });
    });

    // Only expectedRange should change, others should remain default
    expect(result.current.expectedRange).toEqual({
      getFromData: false,
      useSpecifiedRange: true
    });
    expect(result.current.rangeValue).toEqual({
      lowerValue: null,
      upperValue: null
    });
    expect(result.current.expectedValue).toEqual({
      allCategoriesEqual: true,
      values: false,
      inputValue: null
    });
  });

  it('should handle null values in range', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setRangeValue({
        lowerValue: null,
        upperValue: null
      });
    });

    expect(result.current.rangeValue).toEqual({
      lowerValue: null,
      upperValue: null
    });
  });

  it('should handle numeric values in range', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setRangeValue({
        lowerValue: 0,
        upperValue: 100
      });
    });

    expect(result.current.rangeValue).toEqual({
      lowerValue: 0,
      upperValue: 100
    });
  });

  it('should handle empty expected value list', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setExpectedValueList([]);
    });

    expect(result.current.expectedValueList).toEqual([]);
  });

  it('should handle single value in expected value list', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setExpectedValueList([5]);
    });

    expect(result.current.expectedValueList).toEqual([5]);
  });

  it('should handle multiple values in expected value list', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setExpectedValueList([1, 2, 3, 4, 5]);
    });

    expect(result.current.expectedValueList).toEqual([1, 2, 3, 4, 5]);
  });

  it('should handle boolean values in display statistics', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setDisplayStatistics({
        descriptive: true,
        quartiles: false
      });
    });

    expect(result.current.displayStatistics).toEqual({
      descriptive: true,
      quartiles: false
    });
  });

  it('should maintain state between renders', () => {
    const { result, rerender } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setExpectedRange({
        getFromData: false,
        useSpecifiedRange: true
      });
      result.current.setRangeValue({
        lowerValue: 1,
        upperValue: 10
      });
    });

    // Re-render the hook
    rerender();

    expect(result.current.expectedRange).toEqual({
      getFromData: false,
      useSpecifiedRange: true
    });
    expect(result.current.rangeValue).toEqual({
      lowerValue: 1,
      upperValue: 10
    });
  });

  it('should handle rapid state changes', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setExpectedRange({
        getFromData: false,
        useSpecifiedRange: true
      });
      result.current.setRangeValue({
        lowerValue: 1,
        upperValue: 10
      });
      result.current.setExpectedValue({
        allCategoriesEqual: false,
        values: true,
        inputValue: 5
      });
      result.current.setExpectedValueList([1, 2, 3]);
      result.current.setDisplayStatistics({
        descriptive: true,
        quartiles: true
      });
    });

    expect(result.current.expectedRange).toEqual({
      getFromData: false,
      useSpecifiedRange: true
    });
    expect(result.current.rangeValue).toEqual({
      lowerValue: 1,
      upperValue: 10
    });
    expect(result.current.expectedValue).toEqual({
      allCategoriesEqual: false,
      values: true,
      inputValue: 5
    });
    expect(result.current.expectedValueList).toEqual([1, 2, 3]);
    expect(result.current.displayStatistics).toEqual({
      descriptive: true,
      quartiles: true
    });
  });

  it('should handle edge cases for range values', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setRangeValue({
        lowerValue: 0,
        upperValue: 0
      });
    });

    expect(result.current.rangeValue).toEqual({
      lowerValue: 0,
      upperValue: 0
    });
  });

  it('should handle negative values in range', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setRangeValue({
        lowerValue: -10,
        upperValue: -1
      });
    });

    expect(result.current.rangeValue).toEqual({
      lowerValue: -10,
      upperValue: -1
    });
  });

  it('should handle decimal values in expected value list', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setExpectedValueList([1.5, 2.7, 3.2]);
    });

    expect(result.current.expectedValueList).toEqual([1.5, 2.7, 3.2]);
  });

  it('should handle zero values in expected value list', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setExpectedValueList([0, 1, 2]);
    });

    expect(result.current.expectedValueList).toEqual([0, 1, 2]);
  });

  it('should handle negative values in expected value list', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setExpectedValueList([-1, 0, 1]);
    });

    expect(result.current.expectedValueList).toEqual([-1, 0, 1]);
  });
}); 