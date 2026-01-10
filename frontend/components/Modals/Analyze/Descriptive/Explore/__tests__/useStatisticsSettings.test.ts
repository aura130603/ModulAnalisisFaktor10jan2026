import { renderHook, act } from '@testing-library/react';
import { useStatisticsSettings } from '../hooks/useStatisticsSettings';

describe('Explore useStatisticsSettings hook', () => {
  it('initializes with default values', () => {
    const { result } = renderHook(() => useStatisticsSettings());

    expect(result.current.showDescriptives).toBe(true);
    expect(result.current.confidenceInterval).toBe('95');
    expect(result.current.showMEstimators).toBe(false);
    expect(result.current.showOutliers).toBe(false);
    expect(result.current.showPercentiles).toBe(false);
  });

  it('updates individual flags and CI correctly', () => {
    const { result } = renderHook(() => useStatisticsSettings());

    act(() => {
      result.current.setShowMEstimators(true);
      result.current.setShowOutliers(true);
      result.current.setConfidenceInterval('99');
    });

    expect(result.current.showMEstimators).toBe(true);
    expect(result.current.showOutliers).toBe(true);
    expect(result.current.confidenceInterval).toBe('99');
  });

  it('resetStatisticsSettings restores defaults', () => {
    const { result } = renderHook(() => useStatisticsSettings());

    act(() => {
      result.current.setShowMEstimators(true);
      result.current.setShowPercentiles(true);
      result.current.resetStatisticsSettings();
    });

    expect(result.current.showMEstimators).toBe(false);
    expect(result.current.showPercentiles).toBe(false);
    expect(result.current.confidenceInterval).toBe('95');
    expect(result.current.showDescriptives).toBe(true);
  });
}); 