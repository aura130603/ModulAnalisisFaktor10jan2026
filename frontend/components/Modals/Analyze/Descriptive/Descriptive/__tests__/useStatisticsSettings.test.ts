import { renderHook, act } from '@testing-library/react';
import { useStatisticsSettings } from '../hooks/useStatisticsSettings';


describe('useStatisticsSettings hook', () => {
  it('initializes with default values', () => {
    const { result } = renderHook(() => useStatisticsSettings());

    const { displayStatistics, displayOrder, saveStandardized } = result.current;

    expect(displayOrder).toBe('variableList');
    expect(saveStandardized).toBe(false);
    // A couple of spot checks on default statistics values
    expect(displayStatistics.mean).toBe(true);
    expect(displayStatistics.variance).toBe(false);
  });

  it('allows updating individual statistic flags', () => {
    const { result } = renderHook(() => useStatisticsSettings());

    act(() => {
      result.current.updateStatistic('variance', true);
    });

    expect(result.current.displayStatistics.variance).toBe(true);
  });

  it('updates display order and saveStandardized flags', () => {
    const { result } = renderHook(() => useStatisticsSettings());

    act(() => {
      result.current.setDisplayOrder('alphabetic');
      result.current.setSaveStandardized(true);
    });

    expect(result.current.displayOrder).toBe('alphabetic');
    expect(result.current.saveStandardized).toBe(true);
  });

  it('resets to default values', () => {
    const { result } = renderHook(() => useStatisticsSettings());

    act(() => {
      result.current.updateStatistic('variance', true);
      result.current.setDisplayOrder('alphabetic');
      result.current.setSaveStandardized(true);
    });

    act(() => {
      result.current.resetStatisticsSettings();
    });

    expect(result.current.displayStatistics.variance).toBe(false);
    expect(result.current.displayOrder).toBe('variableList');
    expect(result.current.saveStandardized).toBe(false);
  });
}); 