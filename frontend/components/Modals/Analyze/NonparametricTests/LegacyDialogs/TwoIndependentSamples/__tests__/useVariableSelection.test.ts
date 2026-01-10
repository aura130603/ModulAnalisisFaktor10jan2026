import { renderHook, act } from '@testing-library/react';
import { useVariableSelection } from '../hooks/useVariableSelection';
import { Variable } from '@/types/Variable';

// Mock the stores
jest.mock('@/stores/useVariableStore', () => ({
  useVariableStore: jest.fn((selector) => selector({
    variables: [
      {
        name: 'Var1',
        tempId: '1',
        columnIndex: 0,
        label: 'Variable 1',
        type: 'NUMERIC',
        width: 8,
        decimals: 0,
        values: [1, 2, 3, 4, 5],
        missing: {},
        align: 'left',
        measure: 'scale',
        role: 'input',
        columns: 8
      },
      {
        name: 'Var2',
        tempId: '2',
        columnIndex: 1,
        label: 'Variable 2',
        type: 'NUMERIC',
        width: 8,
        decimals: 0,
        values: [6, 7, 8, 9, 10],
        missing: {},
        align: 'left',
        measure: 'scale',
        role: 'input',
        columns: 8
      },
      {
        name: 'GroupVar',
        tempId: '3',
        columnIndex: 2,
        label: 'Group Variable',
        type: 'STRING',
        width: 8,
        decimals: 0,
        values: ['Group1', 'Group2', 'Group1', 'Group2', 'Group1'],
        missing: {},
        align: 'left',
        measure: 'nominal',
        role: 'input',
        columns: 8
      }
    ],
    isLoading: false,
    error: null,
  })),
}));

describe('useVariableSelection', () => {
  const mockVariables: Variable[] = [
    {
      name: 'Var1',
      tempId: '1',
      columnIndex: 0,
      label: 'Variable 1',
      type: 'NUMERIC' as any,
      width: 8,
      decimals: 0,
      values: [
        { variableId: 1, value: 1, label: '1' },
        { variableId: 1, value: 2, label: '2' },
        { variableId: 1, value: 3, label: '3' },
        { variableId: 1, value: 4, label: '4' },
        { variableId: 1, value: 5, label: '5' },
      ],
      missing: {},
      align: 'left',
      measure: 'scale',
      role: 'input',
      columns: 8
    },
    {
      name: 'Var2',
      tempId: '2',
      columnIndex: 1,
      label: 'Variable 2',
      type: 'NUMERIC' as any,
      width: 8,
      decimals: 0,
      values: [
        { variableId: 2, value: 6, label: '6' },
        { variableId: 2, value: 7, label: '7' },
        { variableId: 2, value: 8, label: '8' },
        { variableId: 2, value: 9, label: '9' },
        { variableId: 2, value: 10, label: '10' },
      ],
      missing: {},
      align: 'left',
      measure: 'scale',
      role: 'input',
      columns: 8
    },
    {
      name: 'GroupVar',
      tempId: '3',
      columnIndex: 2,
      label: 'Group Variable',
      type: 'STRING' as any,
      width: 8,
      decimals: 0,
      values: [
        { variableId: 3, value: 'Group1', label: 'Group1' },
        { variableId: 3, value: 'Group2', label: 'Group2' },
        { variableId: 3, value: 'Group1', label: 'Group1' },
        { variableId: 3, value: 'Group2', label: 'Group2' },
        { variableId: 3, value: 'Group1', label: 'Group1' },
      ],
      missing: {},
      align: 'left',
      measure: 'nominal',
      role: 'input',
      columns: 8
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useVariableSelection());

    expect(result.current.availableVariables).toEqual(mockVariables);
    expect(result.current.testVariables).toEqual([]);
    expect(result.current.groupingVariable).toBeNull();
    expect(result.current.highlightedVariable).toBeNull();
  });

  it('should move variable to test variables', () => {
    const { result } = renderHook(() => useVariableSelection());

    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
    });

    expect(result.current.testVariables).toEqual([mockVariables[0]]);
    expect(result.current.availableVariables).toEqual([mockVariables[1], mockVariables[2]]);
  });

  it('should move variable to grouping variable', () => {
    const { result } = renderHook(() => useVariableSelection());

    act(() => {
      result.current.moveToGroupingVariable(mockVariables[2]);
    });

    expect(result.current.groupingVariable).toEqual(mockVariables[2]);
    expect(result.current.availableVariables).toEqual([mockVariables[0], mockVariables[1]]);
  });

  it('should move variable back to available variables', () => {
    const { result } = renderHook(() => useVariableSelection());

    // First move to test variables
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
    });

    // Then move back to available
    act(() => {
      result.current.moveToAvailableVariables(mockVariables[0]);
    });

    expect(result.current.testVariables).toEqual([]);
    expect(result.current.availableVariables).toEqual(mockVariables);
  });

  it('should move grouping variable back to available variables', () => {
    const { result } = renderHook(() => useVariableSelection());

    // First move to grouping variable
    act(() => {
      result.current.moveToGroupingVariable(mockVariables[2]);
    });

    // Then move back to available
    act(() => {
      result.current.moveToAvailableVariables(mockVariables[2]);
    });

    expect(result.current.groupingVariable).toBeNull();
    expect(result.current.availableVariables).toEqual(mockVariables);
  });

  it('should set highlighted variable', () => {
    const { result } = renderHook(() => useVariableSelection());

    act(() => {
      result.current.setHighlightedVariable({ tempId: '1', source: 'test' });
    });

    expect(result.current.highlightedVariable).toEqual(mockVariables[0]);
  });

  it('should clear highlighted variable when set to null', () => {
    const { result } = renderHook(() => useVariableSelection());

    // First set highlighted variable
    act(() => {
      result.current.setHighlightedVariable({ tempId: '1', source: 'test' });
    });

    // Then clear it
    act(() => {
      result.current.setHighlightedVariable(null);
    });

    expect(result.current.highlightedVariable).toBeNull();
  });

  it('should reorder test variables', () => {
    const { result } = renderHook(() => useVariableSelection());

    // First add two variables to test variables
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
      result.current.moveToTestVariables(mockVariables[1]);
    });

    // Then reorder them
    act(() => {
      result.current.reorderVariables('test', [mockVariables[1], mockVariables[0]]);
    });

    expect(result.current.testVariables).toEqual([mockVariables[1], mockVariables[0]]);
  });

  it('should reset variable selection', () => {
    const { result } = renderHook(() => useVariableSelection());

    // First add variables to different lists
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
      result.current.moveToGroupingVariable(mockVariables[2]);
      result.current.setHighlightedVariable({ tempId: '2', source: 'test' });
    });

    // Then reset
    act(() => {
      result.current.resetVariableSelection();
    });

    expect(result.current.testVariables).toEqual([]);
    expect(result.current.groupingVariable).toBeNull();
    expect(result.current.highlightedVariable).toBeNull();
    expect(result.current.availableVariables).toEqual(mockVariables);
  });

  it('should handle moving multiple variables to test variables', () => {
    const { result } = renderHook(() => useVariableSelection());

    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
      result.current.moveToTestVariables(mockVariables[1]);
    });

    expect(result.current.testVariables).toEqual([mockVariables[0], mockVariables[1]]);
    expect(result.current.availableVariables).toEqual([mockVariables[2]]);
  });

  it('should not allow moving the same variable twice to test variables', () => {
    const { result } = renderHook(() => useVariableSelection());

    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
      result.current.moveToTestVariables(mockVariables[0]);
    });

    expect(result.current.testVariables).toEqual([mockVariables[0]]);
    expect(result.current.availableVariables).toEqual([mockVariables[1], mockVariables[2]]);
  });

  it('should not allow moving the same variable twice to grouping variable', () => {
    const { result } = renderHook(() => useVariableSelection());

    act(() => {
      result.current.moveToGroupingVariable(mockVariables[2]);
      result.current.moveToGroupingVariable(mockVariables[2]);
    });

    expect(result.current.groupingVariable).toEqual(mockVariables[2]);
    expect(result.current.availableVariables).toEqual([mockVariables[0], mockVariables[1]]);
  });

  it('should handle moving variable from test to grouping', () => {
    const { result } = renderHook(() => useVariableSelection());

    // First move to test variables
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
    });

    // Then move to grouping variable
    act(() => {
      result.current.moveToGroupingVariable(mockVariables[0]);
    });

    expect(result.current.testVariables).toEqual([]);
    expect(result.current.groupingVariable).toEqual(mockVariables[0]);
    expect(result.current.availableVariables).toEqual([mockVariables[1], mockVariables[2]]);
  });

  it('should handle moving variable from grouping to test', () => {
    const { result } = renderHook(() => useVariableSelection());

    // First move to grouping variable
    act(() => {
      result.current.moveToGroupingVariable(mockVariables[2]);
    });

    // Then move to test variables
    act(() => {
      result.current.moveToTestVariables(mockVariables[2]);
    });

    expect(result.current.groupingVariable).toBeNull();
    expect(result.current.testVariables).toEqual([mockVariables[2]]);
    expect(result.current.availableVariables).toEqual([mockVariables[0], mockVariables[1]]);
  });

  it('should handle reordering with invalid indices', () => {
    const { result } = renderHook(() => useVariableSelection());

    // Add variables to test variables
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
      result.current.moveToTestVariables(mockVariables[1]);
    });

    // Try to reorder with invalid indices
    act(() => {
      result.current.reorderVariables('test', [mockVariables[1], mockVariables[0]]); // Invalid from index
    });

    // Should not change the order
    expect(result.current.testVariables).toEqual([mockVariables[0], mockVariables[1]]);
  });

  it('should handle moving variable that is not in available variables', () => {
    const { result } = renderHook(() => useVariableSelection());

    const nonExistentVariable = {
      ...mockVariables[0],
      name: 'NonExistent',
      tempId: '999',
      columnIndex: 999
    };

    act(() => {
      result.current.moveToTestVariables(nonExistentVariable);
    });

    // Should not add the variable
    expect(result.current.testVariables).toEqual([]);
    expect(result.current.availableVariables).toEqual(mockVariables);
  });

  it('should maintain variable order when moving between lists', () => {
    const { result } = renderHook(() => useVariableSelection());

    // Move variables in specific order
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
      result.current.moveToTestVariables(mockVariables[1]);
    });

    // Move back to available in reverse order
    act(() => {
      result.current.moveToAvailableVariables(mockVariables[1]);
      result.current.moveToAvailableVariables(mockVariables[0]);
    });

    // Should maintain original order
    expect(result.current.availableVariables).toEqual(mockVariables);
  });

  it('should handle edge case with empty test variables list', () => {
    const { result } = renderHook(() => useVariableSelection());

    // Try to reorder empty list
    act(() => {
      result.current.reorderVariables('test', []);
    });

    expect(result.current.testVariables).toEqual([]);
  });

  it('should handle edge case with single variable in test variables', () => {
    const { result } = renderHook(() => useVariableSelection());

    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
    });

    // Try to reorder single item
    act(() => {
      result.current.reorderVariables('test', [mockVariables[0]]);
    });

    expect(result.current.testVariables).toEqual([mockVariables[0]]);
  });

  it('should handle moving variable when grouping variable is already set', () => {
    const { result } = renderHook(() => useVariableSelection());

    // First set grouping variable
    act(() => {
      result.current.moveToGroupingVariable(mockVariables[2]);
    });

    // Then move a different variable to test variables
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
    });

    expect(result.current.groupingVariable).toEqual(mockVariables[2]);
    expect(result.current.testVariables).toEqual([mockVariables[0]]);
    expect(result.current.availableVariables).toEqual([mockVariables[1]]);
  });

  it('should handle replacing grouping variable', () => {
    const { result } = renderHook(() => useVariableSelection());

    // First set grouping variable
    act(() => {
      result.current.moveToGroupingVariable(mockVariables[2]);
    });

    // Then replace with a different variable
    act(() => {
      result.current.moveToGroupingVariable(mockVariables[1]);
    });

    expect(result.current.groupingVariable).toEqual(mockVariables[1]);
    expect(result.current.availableVariables).toEqual([mockVariables[0], mockVariables[2]]);
  });

  it('should handle complex reordering scenarios', () => {
    const { result } = renderHook(() => useVariableSelection());

    // Add all variables to test variables
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
      result.current.moveToTestVariables(mockVariables[1]);
      result.current.moveToTestVariables(mockVariables[2]);
    });

    // Perform multiple reorders
    act(() => {
      result.current.reorderVariables('test', [mockVariables[2], mockVariables[0], mockVariables[1]]); // Move last to first
      result.current.reorderVariables('test', [mockVariables[1], mockVariables[2]]); // Move second to last
    });

    expect(result.current.testVariables).toEqual([mockVariables[2], mockVariables[0], mockVariables[1]]);
  });

  it('should handle highlighting variables in different lists', () => {
    const { result } = renderHook(() => useVariableSelection());

    // Add variables to different lists
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
      result.current.moveToGroupingVariable(mockVariables[2]);
    });

    // Highlight variables from different lists
    act(() => {
      result.current.setHighlightedVariable({ tempId: '1', source: 'test' }); // From test variables
    });

    expect(result.current.highlightedVariable).toEqual(mockVariables[0]);

    act(() => {
      result.current.setHighlightedVariable({ tempId: '3', source: 'grouping' }); // From grouping variable
    });

    expect(result.current.highlightedVariable).toEqual(mockVariables[2]);
  });

  it('should handle moving highlighted variable', () => {
    const { result } = renderHook(() => useVariableSelection());

    // Set highlighted variable
    act(() => {
      result.current.setHighlightedVariable({ tempId: '1', source: 'test' });
    });

    // Move the highlighted variable
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
    });

    // Highlighted variable should remain the same
    expect(result.current.highlightedVariable).toEqual(mockVariables[0]);
  });
}); 