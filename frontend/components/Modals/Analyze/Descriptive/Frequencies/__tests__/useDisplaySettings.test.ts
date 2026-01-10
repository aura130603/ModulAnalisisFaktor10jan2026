import { renderHook, act } from '@testing-library/react';
import { useDisplaySettings } from '../hooks/useDisplaySettings';

describe('useDisplaySettings', () => {
  it('should initialize with default values (showFrequencyTables = true)', () => {
    const { result } = renderHook(() => useDisplaySettings());

    expect(result.current.showFrequencyTables).toBe(true);
  });

  it('should accept custom initial values', () => {
    const { result } = renderHook(() => useDisplaySettings({ showFrequencyTables: false }));

    expect(result.current.showFrequencyTables).toBe(false);
  });

  it('should update showFrequencyTables via setter', () => {
    const { result } = renderHook(() => useDisplaySettings());

    act(() => {
      result.current.setShowFrequencyTables(false);
    });

    expect(result.current.showFrequencyTables).toBe(false);
  });

  it('should reset showFrequencyTables to true', () => {
    const { result } = renderHook(() => useDisplaySettings({ showFrequencyTables: false }));

    act(() => {
      result.current.resetDisplaySettings();
    });

    expect(result.current.showFrequencyTables).toBe(true);
  });
}); 