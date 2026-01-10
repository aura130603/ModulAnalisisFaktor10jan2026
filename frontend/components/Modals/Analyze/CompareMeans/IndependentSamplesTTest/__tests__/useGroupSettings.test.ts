import { renderHook, act } from '@testing-library/react';
import { useGroupSettings } from '../hooks/useGroupSettings';
import { DefineGroupsOptions } from '../types';

describe('useGroupSettings hook', () => {
  const initialDefineGroups: DefineGroupsOptions = {
    useSpecifiedValues: false,
    cutPoint: true,
  };
  const initialGroup1 = 1;
  const initialGroup2 = 2;
  const initialCutPointValue = 10;
  const initialEstimateEffectSize = false;

  it('should initialize with default values when no params provided', () => {
    const { result } = renderHook(() => useGroupSettings());
    
    expect(result.current.defineGroups).toEqual({
      useSpecifiedValues: false,
      cutPoint: true,
    });
    expect(result.current.group1).toBeNull();
    expect(result.current.group2).toBeNull();
    expect(result.current.cutPointValue).toBeNull();
    expect(result.current.estimateEffectSize).toBe(false);
  });

  it('should initialize with provided values', () => {
    const { result } = renderHook(() => useGroupSettings({
      initialDefineGroups,
      initialGroup1,
      initialGroup2,
      initialCutPointValue,
      initialEstimateEffectSize
    }));
    
    expect(result.current.defineGroups).toEqual(initialDefineGroups);
    expect(result.current.group1).toBe(initialGroup1);
    expect(result.current.group2).toBe(initialGroup2);
    expect(result.current.cutPointValue).toBe(initialCutPointValue);
    expect(result.current.estimateEffectSize).toBe(initialEstimateEffectSize);
  });

  it('should update defineGroups when setDefineGroups is called', () => {
    const { result } = renderHook(() => useGroupSettings());
    
    const newDefineGroups: DefineGroupsOptions = {
      useSpecifiedValues: true,
      cutPoint: false,
    };
    
    act(() => {
      result.current.setDefineGroups(newDefineGroups);
    });
    
    expect(result.current.defineGroups).toEqual(newDefineGroups);
  });

  it('should update group1 when setGroup1 is called', () => {
    const { result } = renderHook(() => useGroupSettings());
    
    act(() => {
      result.current.setGroup1(5);
    });
    
    expect(result.current.group1).toBe(5);
  });

  it('should update group2 when setGroup2 is called', () => {
    const { result } = renderHook(() => useGroupSettings());
    
    act(() => {
      result.current.setGroup2(10);
    });
    
    expect(result.current.group2).toBe(10);
  });

  it('should update cutPointValue when setCutPointValue is called', () => {
    const { result } = renderHook(() => useGroupSettings());
    
    act(() => {
      result.current.setCutPointValue(15);
    });
    
    expect(result.current.cutPointValue).toBe(15);
  });

  it('should update estimateEffectSize when setEstimateEffectSize is called', () => {
    const { result } = renderHook(() => useGroupSettings());
    
    act(() => {
      result.current.setEstimateEffectSize(true);
    });
    
    expect(result.current.estimateEffectSize).toBe(true);
  });

  it('should reset all values when resetGroupSettings is called', () => {
    const { result } = renderHook(() => useGroupSettings({
      initialDefineGroups,
      initialGroup1,
      initialGroup2,
      initialCutPointValue,
      initialEstimateEffectSize
    }));
    
    // Change values
    act(() => {
      result.current.setDefineGroups({
        useSpecifiedValues: true,
        cutPoint: false,
      });
      result.current.setGroup1(5);
      result.current.setGroup2(10);
      result.current.setCutPointValue(15);
      result.current.setEstimateEffectSize(true);
    });
    
    // Reset values
    act(() => {
      result.current.resetGroupSettings();
    });
    
    // Verify reset to initial values
    expect(result.current.defineGroups).toEqual(initialDefineGroups);
    expect(result.current.group1).toBe(initialGroup1);
    expect(result.current.group2).toBe(initialGroup2);
    expect(result.current.cutPointValue).toBe(initialCutPointValue);
    expect(result.current.estimateEffectSize).toBe(initialEstimateEffectSize);
  });
}); 