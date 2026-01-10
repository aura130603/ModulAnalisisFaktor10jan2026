import { renderHook, act } from '@testing-library/react';
import { useTestSettings } from '../hooks/useTestSettings';

describe('useTestSettings hook', () => {
  const initialTestValue = 10;
  const initialEstimateEffectSize = true;

  it('should initialize with default values when no params provided', () => {
    const { result } = renderHook(() => useTestSettings());
    
    expect(result.current.testValue).toBe(0);
    expect(result.current.estimateEffectSize).toBe(false);
  });

  it('should initialize with provided values', () => {
    const { result } = renderHook(() => useTestSettings({
      initialTestValue,
      initialEstimateEffectSize
    }));
    
    expect(result.current.testValue).toBe(initialTestValue);
    expect(result.current.estimateEffectSize).toBe(initialEstimateEffectSize);
  });

  it('should update testValue when setTestValue is called', () => {
    const { result } = renderHook(() => useTestSettings());
    
    act(() => {
      result.current.setTestValue(5);
    });
    
    expect(result.current.testValue).toBe(5);
  });

  it('should update estimateEffectSize when setEstimateEffectSize is called', () => {
    const { result } = renderHook(() => useTestSettings());
    
    act(() => {
      result.current.setEstimateEffectSize(true);
    });
    
    expect(result.current.estimateEffectSize).toBe(true);
  });

  it('should reset all values when resetTestSettings is called', () => {
    const { result } = renderHook(() => useTestSettings({
      initialTestValue,
      initialEstimateEffectSize
    }));
    
    // Change values
    act(() => {
      result.current.setTestValue(5);
      result.current.setEstimateEffectSize(false);
    });
    
    // Reset values
    act(() => {
      result.current.resetTestSettings();
    });
    
    // Verify reset to initial values
    expect(result.current.testValue).toBe(initialTestValue);
    expect(result.current.estimateEffectSize).toBe(initialEstimateEffectSize);
  });
}); 