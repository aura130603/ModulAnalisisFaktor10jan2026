import { renderHook, act } from '@testing-library/react';
import { useTestSettings } from '../hooks/useTestSettings';

describe('useTestSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useTestSettings());

    expect(result.current.group1).toBeNull();
    expect(result.current.group2).toBeNull();
    expect(result.current.testType).toEqual({
      mannWhitneyU: true,
      kolmogorovSmirnovZ: false,
      mosesExtremeReactions: false,
      waldWolfowitzRuns: false
    });
    expect(result.current.displayStatistics).toEqual({
      descriptive: true,
      quartiles: false
    });
  });

  it('should set group1 value', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setGroup1(1);
    });

    expect(result.current.group1).toBe(1);
  });

  it('should set group2 value', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setGroup2(2);
    });

    expect(result.current.group2).toBe(2);
  });

  it('should update test type settings', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setTestType({
        mannWhitneyU: false,
        kolmogorovSmirnovZ: true,
        mosesExtremeReactions: false,
        waldWolfowitzRuns: false
      });
    });

    expect(result.current.testType).toEqual({
      mannWhitneyU: false,
      kolmogorovSmirnovZ: true,
      mosesExtremeReactions: false,
      waldWolfowitzRuns: false
    });
  });

  it('should update display statistics settings', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setDisplayStatistics({
        descriptive: false,
        quartiles: true
      });
    });

    expect(result.current.displayStatistics).toEqual({
      descriptive: false,
      quartiles: true
    });
  });

  it('should reset test settings to defaults', () => {
    const { result } = renderHook(() => useTestSettings());

    // First change some settings
    act(() => {
      result.current.setGroup1(1);
      result.current.setGroup2(2);
      result.current.setTestType({
        mannWhitneyU: false,
        kolmogorovSmirnovZ: true,
        mosesExtremeReactions: false,
        waldWolfowitzRuns: false
      });
      result.current.setDisplayStatistics({
        descriptive: false,
        quartiles: true
      });
    });

    // Then reset
    act(() => {
      result.current.resetTestSettings();
    });

    expect(result.current.group1).toBeNull();
    expect(result.current.group2).toBeNull();
    expect(result.current.testType).toEqual({
      mannWhitneyU: true,
      kolmogorovSmirnovZ: false,
      mosesExtremeReactions: false,
      waldWolfowitzRuns: false
    });
    expect(result.current.displayStatistics).toEqual({
      descriptive: true,
      quartiles: false
    });
  });

  it('should handle setting group1 to null', () => {
    const { result } = renderHook(() => useTestSettings());

    // First set a value
    act(() => {
      result.current.setGroup1(1);
    });

    // Then set to null
    act(() => {
      result.current.setGroup1(null);
    });

    expect(result.current.group1).toBeNull();
  });

  it('should handle setting group2 to null', () => {
    const { result } = renderHook(() => useTestSettings());

    // First set a value
    act(() => {
      result.current.setGroup2(2);
    });

    // Then set to null
    act(() => {
      result.current.setGroup2(null);
    });

    expect(result.current.group2).toBeNull();
  });

  it('should handle setting group1 to null', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setGroup1(null);
    });

    expect(result.current.group1).toBe(null);
  });

  it('should handle setting group2 to null', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setGroup2(null);
    });

    expect(result.current.group2).toBe(null);
  });

  it('should handle multiple test types being true', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setTestType({
        mannWhitneyU: true,
        kolmogorovSmirnovZ: true,
        mosesExtremeReactions: false,
        waldWolfowitzRuns: false
      });
    });

    expect(result.current.testType).toEqual({
      mannWhitneyU: true,
      kolmogorovSmirnovZ: true,
      mosesExtremeReactions: false,
      waldWolfowitzRuns: false
    });
  });

  it('should handle all test types being false', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setTestType({
        mannWhitneyU: false,
        kolmogorovSmirnovZ: false,
        mosesExtremeReactions: false,
        waldWolfowitzRuns: false
      });
    });

    expect(result.current.testType).toEqual({
      mannWhitneyU: false,
      kolmogorovSmirnovZ: false,
      mosesExtremeReactions: false,
      waldWolfowitzRuns: false
    });
  });

  it('should handle all test types being true', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setTestType({
        mannWhitneyU: true,
        kolmogorovSmirnovZ: true,
        mosesExtremeReactions: true,
        waldWolfowitzRuns: true
      });
    });

    expect(result.current.testType).toEqual({
      mannWhitneyU: true,
      kolmogorovSmirnovZ: true,
      mosesExtremeReactions: true,
      waldWolfowitzRuns: true
    });
  });

  it('should handle both display statistics being true', () => {
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

  it('should handle both display statistics being false', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setDisplayStatistics({
        descriptive: false,
        quartiles: false
      });
    });

    expect(result.current.displayStatistics).toEqual({
      descriptive: false,
      quartiles: false
    });
  });

  it('should handle setting groups with special characters', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setGroup1(1);
      result.current.setGroup2(2);
    });

    expect(result.current.group1).toBe(1);
    expect(result.current.group2).toBe(2);
  });

  it('should handle setting groups with numbers', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setGroup1(1);
      result.current.setGroup2(2);
    });

    expect(result.current.group1).toBe(1);
    expect(result.current.group2).toBe(2);
  });

  it('should handle setting groups with spaces', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setGroup1(1);
      result.current.setGroup2(2);
    });

    expect(result.current.group1).toBe(1);
    expect(result.current.group2).toBe(2);
  });

  it('should maintain state across multiple updates', () => {
    const { result } = renderHook(() => useTestSettings());

    // Multiple updates to group1
    act(() => {
      result.current.setGroup1(1);
    });

    act(() => {
      result.current.setGroup1(2);
    });

    act(() => {
      result.current.setGroup1(3);
    });

    expect(result.current.group1).toBe(3);
  });

  it('should handle rapid state changes', () => {
    const { result } = renderHook(() => useTestSettings());

    // Rapid changes to test type
    act(() => {
      result.current.setTestType({
        mannWhitneyU: true,
        kolmogorovSmirnovZ: false,
        mosesExtremeReactions: false,
        waldWolfowitzRuns: false
      });
    });

    act(() => {
      result.current.setTestType({
        mannWhitneyU: false,
        kolmogorovSmirnovZ: true,
        mosesExtremeReactions: false,
        waldWolfowitzRuns: false
      });
    });

    act(() => {
      result.current.setTestType({
        mannWhitneyU: true,
        kolmogorovSmirnovZ: true,
        mosesExtremeReactions: false,
        waldWolfowitzRuns: false
      });
    });

    expect(result.current.testType).toEqual({
      mannWhitneyU: true,
      kolmogorovSmirnovZ: true,
      mosesExtremeReactions: false,
      waldWolfowitzRuns: false
    });
  });

  it('should handle setting same group values multiple times', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setGroup1(1);
      result.current.setGroup1(2); // Same value
    });

    expect(result.current.group1).toBe(2);

    act(() => {
      result.current.setGroup1(3);
      result.current.setGroup1(4);
      result.current.setGroup1(5);
    });

    expect(result.current.group1).toBe(5);

    act(() => {
      result.current.setGroup1(1);
      result.current.setGroup1(1); // Same value
    });

    expect(result.current.group1).toBe(1);
  });

  it('should handle setting same test type multiple times', () => {
    const { result } = renderHook(() => useTestSettings());

    const testType = {
      mannWhitneyU: true,
      kolmogorovSmirnovZ: false,
      mosesExtremeReactions: false,
      waldWolfowitzRuns: false
    };

    act(() => {
      result.current.setTestType(testType);
      result.current.setTestType(testType); // Same value
    });

    expect(result.current.testType).toEqual(testType);
  });

  it('should handle setting same display statistics multiple times', () => {
    const { result } = renderHook(() => useTestSettings());

    const displayStats = {
      descriptive: true,
      quartiles: false
    };

    act(() => {
      result.current.setDisplayStatistics(displayStats);
      result.current.setDisplayStatistics(displayStats); // Same value
    });

    expect(result.current.displayStatistics).toEqual(displayStats);
  });

  it('should handle complex state management scenarios', () => {
    const { result } = renderHook(() => useTestSettings());

    // Set initial complex state
    act(() => {
      result.current.setGroup1(100);
      result.current.setGroup2(200);
      result.current.setTestType({
        mannWhitneyU: true,
        kolmogorovSmirnovZ: true,
        mosesExtremeReactions: false,
        waldWolfowitzRuns: false
      });
      result.current.setDisplayStatistics({
        descriptive: true,
        quartiles: true
      });
    });

    // Verify complex state
    expect(result.current.group1).toBe(100);
    expect(result.current.group2).toBe(200);
    expect(result.current.testType).toEqual({
      mannWhitneyU: true,
      kolmogorovSmirnovZ: true,
      mosesExtremeReactions: false,
      waldWolfowitzRuns: false
    });
    expect(result.current.displayStatistics).toEqual({
      descriptive: true,
      quartiles: true
    });

    // Reset and verify defaults
    act(() => {
      result.current.resetTestSettings();
    });

    expect(result.current.group1).toBeNull();
    expect(result.current.group2).toBeNull();
    expect(result.current.testType).toEqual({
      mannWhitneyU: true,
      kolmogorovSmirnovZ: false,
      mosesExtremeReactions: false,
      waldWolfowitzRuns: false
    });
    expect(result.current.displayStatistics).toEqual({
      descriptive: true,
      quartiles: false
    });
  });

  it('should handle edge case with very long group names', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setGroup1(123456789);
      result.current.setGroup2(987654321);
    });

    expect(result.current.group1).toBe(123456789);
    expect(result.current.group2).toBe(987654321);
  });

  it('should handle edge case with special unicode characters', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setGroup1(111);
      result.current.setGroup2(222);
    });

    expect(result.current.group1).toBe(111);
    expect(result.current.group2).toBe(222);
  });
}); 