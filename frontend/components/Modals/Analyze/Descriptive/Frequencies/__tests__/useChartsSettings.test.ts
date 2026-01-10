import { renderHook, act } from '@testing-library/react';
import { useChartsSettings } from '../hooks/useChartsSettings';

describe('useChartsSettings', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useChartsSettings());

    expect(result.current.showCharts).toBe(false);
    expect(result.current.chartType).toBe('none');
    expect(result.current.chartValues).toBe('frequencies');
    expect(result.current.showNormalCurve).toBe(false);
    expect(result.current.getCurrentChartOptions()).toBeNull();
  });

  it('should accept custom initial values', () => {
    const { result } = renderHook(() =>
      useChartsSettings({
        initialShowCharts: true,
        initialChartType: 'barCharts',
        initialChartValues: 'percentages',
        initialShowNormalCurve: true,
      })
    );

    expect(result.current.showCharts).toBe(true);
    expect(result.current.chartType).toBe('barCharts');
    expect(result.current.chartValues).toBe('percentages');
    expect(result.current.showNormalCurve).toBe(true);

    // getCurrentChartOptions should mirror the current state
    expect(result.current.getCurrentChartOptions()).toEqual({
      type: 'barCharts',
      values: 'percentages',
      showNormalCurveOnHistogram: false,
    });
  });

  it('should update state setters and compute options correctly', () => {
    const { result } = renderHook(() => useChartsSettings());

    act(() => {
      result.current.setShowCharts(true);
      result.current.setChartType('histograms');
      result.current.setChartValues('percentages');
      result.current.setShowNormalCurve(true);
    });

    expect(result.current.showCharts).toBe(true);
    expect(result.current.chartType).toBe('histograms');
    expect(result.current.chartValues).toBe('percentages');
    expect(result.current.showNormalCurve).toBe(true);

    expect(result.current.getCurrentChartOptions()).toEqual({
      type: 'histograms',
      values: 'percentages',
      showNormalCurveOnHistogram: true,
    });
  });

  it('should reset to default values', () => {
    const { result } = renderHook(() =>
      useChartsSettings({ initialShowCharts: true, initialChartType: 'pieCharts' })
    );

    act(() => {
      result.current.resetChartsSettings();
    });

    expect(result.current.showCharts).toBe(false);
    expect(result.current.chartType).toBe('none');
    expect(result.current.chartValues).toBe('frequencies');
    expect(result.current.showNormalCurve).toBe(false);
    expect(result.current.getCurrentChartOptions()).toBeNull();
  });
}); 