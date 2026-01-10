import { renderHook, act } from '@testing-library/react';
import { useVariableSelection } from '../hooks/useVariableSelection';
import { useVariableStore } from '@/stores/useVariableStore';
import type { Variable } from '@/types/Variable';
import type { HighlightedVariable } from '../types';

// Mock dependencies
jest.mock('@/stores/useVariableStore');

const mockVariables: Variable[] = [
  {
    name: 'var1',
    label: 'Variable 1',
    columnIndex: 0,
    type: 'NUMERIC',
    tempId: '1',
    width: 8,
    decimals: 0,
    values: [],
    missing: {},
    align: 'left',
    measure: 'nominal',
    role: 'input',
    columns: 8
  },
  {
    name: 'var2',
    label: 'Variable 2',
    columnIndex: 1,
    type: 'NUMERIC',
    tempId: '2',
    width: 8,
    decimals: 0,
    values: [],
    missing: {},
    align: 'left',
    measure: 'ordinal',
    role: 'input',
    columns: 8
  },
  {
    name: 'var3',
    label: 'Variable 3',
    columnIndex: 2,
    type: 'NUMERIC',
    tempId: '3',
    width: 8,
    decimals: 0,
    values: [],
    missing: {},
    align: 'left',
    measure: 'scale',
    role: 'input',
    columns: 8
  }
];

describe('useVariableSelection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useVariableStore as unknown as jest.Mock).mockReturnValue({
      variables: mockVariables
    });
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useVariableSelection());

    expect(result.current.availableVariables).toEqual(mockVariables);
    expect(result.current.testVariables).toEqual([]);
    expect(result.current.highlightedVariable).toBe(null);
  });

  it('should move variable to test variables', () => {
    const { result } = renderHook(() => useVariableSelection());

    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
    });

    expect(result.current.testVariables).toEqual([mockVariables[0]]);
    expect(result.current.availableVariables).toEqual([mockVariables[1], mockVariables[2]]);
  });

  it('should move variable back to available variables', () => {
    const { result } = renderHook(() => useVariableSelection());

    // First move to test variables
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
    });

    // Then move back to available variables
    act(() => {
      result.current.moveToAvailableVariables(mockVariables[0]);
    });

    expect(result.current.testVariables).toEqual([]);
    expect(result.current.availableVariables).toEqual(mockVariables);
  });

  it('should set highlighted variable', () => {
    const { result } = renderHook(() => useVariableSelection());

    const highlightedVar: HighlightedVariable = {
      tempId: mockVariables[0].tempId!,
      source: 'available'
    };

    act(() => {
      result.current.setHighlightedVariable(highlightedVar);
    });

    expect(result.current.highlightedVariable).toBe(highlightedVar);
  });

  it('should clear highlighted variable', () => {
    const { result } = renderHook(() => useVariableSelection());

    const highlightedVar: HighlightedVariable = {
      tempId: mockVariables[0].tempId!,
      source: 'available'
    };

    act(() => {
      result.current.setHighlightedVariable(highlightedVar);
    });

    act(() => {
      result.current.setHighlightedVariable(null);
    });

    expect(result.current.highlightedVariable).toBe(null);
  });

  it('should reorder test variables', () => {
    const { result } = renderHook(() => useVariableSelection());

    // Add two variables to test variables
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
      result.current.moveToTestVariables(mockVariables[1]);
    });

    // Reorder them
    act(() => {
      result.current.reorderVariables('test', [mockVariables[1], mockVariables[0]]);
    });

    expect(result.current.testVariables).toEqual([mockVariables[1], mockVariables[0]]);
  });

  it('should reset variable selection', () => {
    const { result } = renderHook(() => useVariableSelection());

    // Add some variables to test variables
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
      result.current.moveToTestVariables(mockVariables[1]);
    });

    // Reset selection
    act(() => {
      result.current.resetVariableSelection();
    });

    expect(result.current.testVariables).toEqual([]);
    expect(result.current.availableVariables).toEqual(mockVariables);
    expect(result.current.highlightedVariable).toBe(null);
  });

  it('should handle multiple variables in test variables', () => {
    const { result } = renderHook(() => useVariableSelection());

    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
      result.current.moveToTestVariables(mockVariables[1]);
      result.current.moveToTestVariables(mockVariables[2]);
    });

    expect(result.current.testVariables).toEqual([mockVariables[0], mockVariables[1], mockVariables[2]]);
    expect(result.current.availableVariables).toEqual([]);
  });

  it('should handle moving variable that is not in available variables', () => {
    const { result } = renderHook(() => useVariableSelection());

    // Try to move a variable that's not in available variables
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
    });

    // Try to move the same variable again
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
    });

    // Should only have one instance
    expect(result.current.testVariables).toEqual([mockVariables[0]]);
  });

  it('should handle moving variable that is not in test variables', () => {
    const { result } = renderHook(() => useVariableSelection());

    // Try to move a variable from test variables when it's not there
    act(() => {
      result.current.moveToAvailableVariables(mockVariables[0]);
    });

    // Should not change anything
    expect(result.current.testVariables).toEqual([]);
    expect(result.current.availableVariables).toEqual(mockVariables);
  });

  it('should handle reordering with invalid indices', () => {
    const { result } = renderHook(() => useVariableSelection());

    // Add a variable to test variables
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
    });

    // Try to reorder with invalid indices
    act(() => {
      result.current.reorderVariables('test', [mockVariables[0]]);
    });

    // Should not change anything
    expect(result.current.testVariables).toEqual([mockVariables[0]]);
  });

  it('should handle empty variables list', () => {
    (useVariableStore as unknown as jest.Mock).mockReturnValue({
      variables: []
    });

    const { result } = renderHook(() => useVariableSelection());

    expect(result.current.availableVariables).toEqual([]);
    expect(result.current.testVariables).toEqual([]);
  });

  it('should handle null variables', () => {
    (useVariableStore as unknown as jest.Mock).mockReturnValue({
      variables: null
    });

    const { result } = renderHook(() => useVariableSelection());

    expect(result.current.availableVariables).toEqual([]);
    expect(result.current.testVariables).toEqual([]);
  });

  it('should maintain state between renders', () => {
    const { result, rerender } = renderHook(() => useVariableSelection());

    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
    });

    // Re-render the hook
    rerender();

    expect(result.current.testVariables).toEqual([mockVariables[0]]);
    expect(result.current.availableVariables).toEqual([mockVariables[1], mockVariables[2]]);
  });

  it('should handle variables with missing labels', () => {
    const variablesWithoutLabels = mockVariables.map(v => ({ ...v, label: '' }));
    
    (useVariableStore as unknown as jest.Mock).mockReturnValue({
      variables: variablesWithoutLabels
    });

    const { result } = renderHook(() => useVariableSelection());

    expect(result.current.availableVariables).toEqual(variablesWithoutLabels);
  });

  it('should handle variables with different measure types', () => {
    const { result } = renderHook(() => useVariableSelection());

    // All variables should be available regardless of measure type
    expect(result.current.availableVariables).toHaveLength(3);
    expect(result.current.availableVariables[0].measure).toBe('nominal');
    expect(result.current.availableVariables[1].measure).toBe('ordinal');
    expect(result.current.availableVariables[2].measure).toBe('scale');
  });

  it('should handle rapid state changes', () => {
    const { result } = renderHook(() => useVariableSelection());

    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
      result.current.moveToTestVariables(mockVariables[1]);
      result.current.moveToAvailableVariables(mockVariables[0]);
      
      const highlightedVar: HighlightedVariable = {
        tempId: mockVariables[2].tempId!,
        source: 'available'
      };
      result.current.setHighlightedVariable(highlightedVar);
    });

    expect(result.current.testVariables).toEqual([mockVariables[1]]);
    expect(result.current.availableVariables).toEqual([mockVariables[0], mockVariables[2]]);
    expect(result.current.highlightedVariable).toEqual({
      tempId: mockVariables[2].tempId!,
      source: 'available'
    });
  });
}); 