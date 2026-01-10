import { renderHook, act } from '@testing-library/react';
import { useVariableSelection } from '../hooks/useVariableSelection';
import { useVariableStore } from '@/stores/useVariableStore';
import type { Variable } from '@/types/Variable';

// ------------------------------
// Mock the variable store
// ------------------------------
const mockLoadVariables = jest.fn();

// Helper to create a mock Zustand-like store object
function createMockStore(variables: Variable[]) {
  return {
    variables,
    loadVariables: mockLoadVariables,
  } as any;
}

const mockVariables: Variable[] = [
  {
    name: 'age',
    label: 'Age',
    tempId: 'temp_0',
    columnIndex: 0,
    type: 'NUMERIC',
    width: 8,
    decimals: 0,
    values: [],
    missing: {},
    align: 'right',
    measure: 'scale',
    role: 'input',
    columns: 8,
  },
  {
    name: 'height',
    label: 'Height',
    tempId: 'temp_1',
    columnIndex: 1,
    type: 'NUMERIC',
    width: 8,
    decimals: 0,
    values: [],
    missing: {},
    align: 'right',
    measure: 'scale',
    role: 'input',
    columns: 8,
  },
  {
    name: 'weight',
    label: 'Weight',
    tempId: 'temp_2',
    columnIndex: 2,
    type: 'NUMERIC',
    width: 8,
    decimals: 0,
    values: [],
    missing: {},
    align: 'right',
    measure: 'scale',
    role: 'input',
    columns: 8,
  },
];

// jest.mock needs to be called before the hook file is imported, so we use jest.mock outside of test scope
jest.mock('@/stores/useVariableStore', () => {
  const storeFn: any = jest.fn();
  storeFn.getState = () => createMockStore(mockVariables);
  return {
    __esModule: true,
    useVariableStore: storeFn,
  };
});

// Re-import after mocking
const mockedUseVariableStore = useVariableStore as unknown as jest.Mock;

// ------------------------------
// Tests
// ------------------------------
describe('useVariableSelection hook for Runs Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseVariableStore.mockReturnValue(createMockStore(mockVariables));
  });

  it('should initialize availableVariables with variables from the global store', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    expect(result.current.availableVariables).toHaveLength(mockVariables.length);
    expect(result.current.testVariables).toHaveLength(0);
    expect(result.current.highlightedVariable).toBeNull();
  });

  it('should move a variable from available to test variables', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
    });

    expect(result.current.availableVariables).toHaveLength(mockVariables.length - 1);
    expect(result.current.testVariables).toHaveLength(1);
    expect(result.current.testVariables[0]).toEqual(mockVariables[0]);
  });

  it('should move a variable from test to available variables', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    // First move to test variables
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
    });

    // Then move back to available variables
    act(() => {
      result.current.moveToAvailableVariables(mockVariables[0]);
    });

    expect(result.current.availableVariables).toHaveLength(mockVariables.length);
    expect(result.current.testVariables).toHaveLength(0);
  });

  it('should reorder variables in test list', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    // Add two variables to test list
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
      result.current.moveToTestVariables(mockVariables[1]);
    });

    // Reorder variables (swap positions)
    act(() => {
      result.current.reorderVariables('test', [mockVariables[1], mockVariables[0]]);
    });

    expect(result.current.testVariables[0]).toEqual(mockVariables[1]);
    expect(result.current.testVariables[1]).toEqual(mockVariables[0]);
  });

  it('should reorder variables up in test list', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    // Add two variables to test list
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
      result.current.moveToTestVariables(mockVariables[1]);
    });

    // Reorder variables (move second to first)
    act(() => {
      result.current.reorderVariables('test', [mockVariables[1], mockVariables[0]]);
    });

    expect(result.current.testVariables[0]).toEqual(mockVariables[1]);
    expect(result.current.testVariables[1]).toEqual(mockVariables[0]);
  });

  it('should not reorder when moving up from first position', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    // Add two variables to test list
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
      result.current.moveToTestVariables(mockVariables[1]);
    });

    // Try to reorder with same order (no change)
    act(() => {
      result.current.reorderVariables('test', [mockVariables[0], mockVariables[1]]);
    });

    // Order should remain unchanged
    expect(result.current.testVariables[0]).toEqual(mockVariables[0]);
    expect(result.current.testVariables[1]).toEqual(mockVariables[1]);
  });

  it('should not reorder when moving down from last position', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    // Add two variables to test list
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
      result.current.moveToTestVariables(mockVariables[1]);
    });

    // Try to reorder with same order (no change)
    act(() => {
      result.current.reorderVariables('test', [mockVariables[0], mockVariables[1]]);
    });

    // Order should remain unchanged
    expect(result.current.testVariables[0]).toEqual(mockVariables[0]);
    expect(result.current.testVariables[1]).toEqual(mockVariables[1]);
  });

  it('should set highlighted variable', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    const highlightedVar = {
      tempId: mockVariables[0].tempId!,
      source: 'available' as const
    };

    act(() => {
      result.current.setHighlightedVariable(highlightedVar);
    });

    expect(result.current.highlightedVariable).toEqual(highlightedVar);
  });

  it('should clear highlighted variable when set to null', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    // First set highlighted variable
    const highlightedVar = {
      tempId: mockVariables[0].tempId!,
      source: 'available' as const
    };

    act(() => {
      result.current.setHighlightedVariable(highlightedVar);
    });

    // Then clear it
    act(() => {
      result.current.setHighlightedVariable(null);
    });

    expect(result.current.highlightedVariable).toBeNull();
  });

  it('should reset variable selection', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    // Add some variables to test list
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
      result.current.moveToTestVariables(mockVariables[1]);
    });

    // Set highlighted variable
    const highlightedVar = {
      tempId: mockVariables[0].tempId!,
      source: 'available' as const
    };

    act(() => {
      result.current.setHighlightedVariable(highlightedVar);
    });

    // Reset selection
    act(() => {
      result.current.resetVariableSelection();
    });

    expect(result.current.availableVariables).toHaveLength(mockVariables.length);
    expect(result.current.testVariables).toHaveLength(0);
    expect(result.current.highlightedVariable).toBeNull();
  });

  it('should handle moving non-existent variable', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    const nonExistentVariable = {
      ...mockVariables[0],
      tempId: 'non-existent',
    };

    act(() => {
      result.current.moveToTestVariables(nonExistentVariable);
    });

    // Should not affect the lists
    expect(result.current.availableVariables).toHaveLength(mockVariables.length);
    expect(result.current.testVariables).toHaveLength(0);
  });

  it('should handle reordering with invalid index', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    // Add one variable to test list
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
    });

    // Try to reorder with empty array
    act(() => {
      result.current.reorderVariables('test', []);
    });

    // Should not affect the list
    expect(result.current.testVariables).toHaveLength(1);
    expect(result.current.testVariables[0]).toEqual(mockVariables[0]);
  });

  it('should handle empty variable store', () => {
    mockedUseVariableStore.mockReturnValue(createMockStore([]));

    const { result } = renderHook(() => useVariableSelection({}));

    expect(result.current.availableVariables).toHaveLength(0);
    expect(result.current.testVariables).toHaveLength(0);
    expect(result.current.highlightedVariable).toBeNull();
  });

  it('should maintain variable order when moving between lists', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    // Move variables to test list in order
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
      result.current.moveToTestVariables(mockVariables[1]);
      result.current.moveToTestVariables(mockVariables[2]);
    });

    // Check order is maintained
    expect(result.current.testVariables[0]).toEqual(mockVariables[0]);
    expect(result.current.testVariables[1]).toEqual(mockVariables[1]);
    expect(result.current.testVariables[2]).toEqual(mockVariables[2]);
  });

  it('should handle multiple variables with same name but different tempId', () => {
    const duplicateVariables = [
      ...mockVariables,
      {
        ...mockVariables[0],
        tempId: 'duplicate_0',
        columnIndex: 3,
      },
    ];

    mockedUseVariableStore.mockReturnValue(createMockStore(duplicateVariables));

    const { result } = renderHook(() => useVariableSelection({}));

    expect(result.current.availableVariables).toHaveLength(duplicateVariables.length);

    // Move specific variable by tempId
    act(() => {
      result.current.moveToTestVariables(duplicateVariables[3]); // The duplicate
    });

    expect(result.current.testVariables).toHaveLength(1);
    expect(result.current.testVariables[0].tempId).toBe('duplicate_0');
  });
}); 