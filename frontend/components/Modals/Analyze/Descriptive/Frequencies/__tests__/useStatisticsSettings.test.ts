import { renderHook, act } from '@testing-library/react';
import { useStatisticsSettings } from '../hooks/useStatisticsSettings';

describe('Frequencies useStatisticsSettings hook', () => {
  it('initializes with default values (showStatistics true, others false)', () => {
    const { result } = renderHook(() => useStatisticsSettings());

    expect(result.current.showStatistics).toBe(true);
    // Spot-check a few defaults
    expect(result.current.meanChecked).toBe(false);
    expect(result.current.quartilesChecked).toBe(false);
  });

  it('updates statistic flags correctly', () => {
    const { result } = renderHook(() => useStatisticsSettings());

    act(() => {
      result.current.setMeanChecked(true);
      result.current.setVarianceChecked(true);
    });

    expect(result.current.meanChecked).toBe(true);
    expect(result.current.varianceChecked).toBe(true);
  });

  it('getCurrentStatisticsOptions returns null when statistics are disabled', () => {
    const { result } = renderHook(() => useStatisticsSettings({ initialShowStatistics: false }));
    expect(result.current.getCurrentStatisticsOptions()).toBeNull();
  });

  it('getCurrentStatisticsOptions returns structured object when enabled', () => {
    const { result } = renderHook(() => useStatisticsSettings());

    act(() => {
      result.current.setMeanChecked(true);
      result.current.setQuartilesChecked(true);
    });

    const options = result.current.getCurrentStatisticsOptions();
    expect(options).not.toBeNull();
    if (options) {
      expect(options.centralTendency.mean).toBe(true);
      expect(options.percentileValues.quartiles).toBe(true);
    }
  });

  it('resets all flags to default', () => {
    const { result } = renderHook(() => useStatisticsSettings());

    act(() => {
      result.current.setMeanChecked(true);
      result.current.setQuartilesChecked(true);
      result.current.resetStatisticsSettings();
    });

    expect(result.current.meanChecked).toBe(false);
    expect(result.current.quartilesChecked).toBe(false);
    expect(result.current.showStatistics).toBe(true);
  });
}); 