import { renderHook, act } from '@testing-library/react';
import { useVariableSelection } from '../hooks/useVariableSelection';
import { useVariableStore } from '@/stores/useVariableStore';
import type { Variable } from '@/types/Variable';
import { HighlightedVariable } from '../types';

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
  {
    name: 'group',
    label: 'Group',
    tempId: 'temp_3',
    columnIndex: 3,
    type: 'NUMERIC',
    width: 8,
    decimals: 0,
    values: [],
    missing: {},
    align: 'right',
    measure: 'nominal',
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
describe('useVariableSelection hook for OneWayAnova', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseVariableStore.mockReturnValue(createMockStore(mockVariables));
  });

  it('should initialize availableVariables with variables from the global store', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    expect(result.current.availableVariables).toHaveLength(mockVariables.length);
    expect(result.current.testVariables).toHaveLength(0);
    expect(result.current.factorVariable).toBeNull();
  });

  it('should move a variable from available to test variables', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
    });

    expect(result.current.testVariables).toHaveLength(1);
    expect(result.current.availableVariables).toHaveLength(mockVariables.length - 1);
    expect(result.current.factorVariable).toBeNull();
  });

  it('should move a variable from available to factor variable', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    act(() => {
      result.current.moveToFactorVariable(mockVariables[3]); // group variable
    });

    expect(result.current.factorVariable).not.toBeNull();
    expect(result.current.factorVariable?.name).toBe('group');
    expect(result.current.availableVariables).toHaveLength(mockVariables.length - 1);
    expect(result.current.testVariables).toHaveLength(0);
  });

  it('should move a variable back to available variables from test variables', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    // Move to test variables first
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
    });

    // Now move it back
    act(() => {
      result.current.moveToAvailableVariables(mockVariables[0]);
    });

    expect(result.current.testVariables).toHaveLength(0);
    expect(result.current.availableVariables).toHaveLength(mockVariables.length);
  });

  it('should move a variable back to available variables from factor variable', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    // Move to factor variable first
    act(() => {
      result.current.moveToFactorVariable(mockVariables[3]);
    });

    // Now move it back
    act(() => {
      result.current.moveToAvailableVariables(mockVariables[3]);
    });

    expect(result.current.factorVariable).toBeNull();
    expect(result.current.availableVariables).toHaveLength(mockVariables.length);
  });

  it('should move a variable from test to factor', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    // Move to test variables first
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
    });

    // Now move it to factor
    act(() => {
      result.current.moveToFactorVariable(mockVariables[0]);
    });

    expect(result.current.testVariables).toHaveLength(0);
    expect(result.current.factorVariable).not.toBeNull();
    expect(result.current.factorVariable?.name).toBe('age');
  });

  it('should move a variable from factor to test', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    // Move to factor first
    act(() => {
      result.current.moveToFactorVariable(mockVariables[3]);
    });

    // Now move it to test
    act(() => {
      result.current.moveToTestVariables(mockVariables[3]);
    });

    expect(result.current.factorVariable).toBeNull();
    expect(result.current.testVariables).toHaveLength(1);
    expect(result.current.testVariables[0].name).toBe('group');
  });

  it('should reorder variables in the test list', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    // Move both variables to test
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
      result.current.moveToTestVariables(mockVariables[1]);
    });

    // Reverse order
    act(() => {
      result.current.reorderVariables('test', [...result.current.testVariables].reverse());
    });

    expect(result.current.testVariables[0].name).toBe('height');
    expect(result.current.testVariables[1].name).toBe('age');
  });

  it('should reorder variables in the available list', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    // Move one variable to test to ensure available has at least 2 items
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
    });

    const availableVars = [...result.current.availableVariables];
    
    // Reverse order of available variables
    act(() => {
      result.current.reorderVariables('available', [...availableVars].reverse());
    });

    expect(result.current.availableVariables[0].name).toBe(availableVars[availableVars.length - 1].name);
  });

  it('should reset variable selection correctly', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    // Move variables to test and factor
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
      result.current.moveToFactorVariable(mockVariables[3]);
    });

    // Reset
    act(() => {
      result.current.resetVariableSelection();
    });

    expect(result.current.testVariables).toHaveLength(0);
    expect(result.current.factorVariable).toBeNull();
    expect(result.current.availableVariables).toHaveLength(mockVariables.length);
  });

  it('should handle highlighting a variable', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    const highlightedVar: HighlightedVariable = {
      tempId: mockVariables[0].tempId!,
      source: 'available'
    };

    act(() => {
      result.current.setHighlightedVariable(highlightedVar);
    });

    expect(result.current.highlightedVariable).toEqual(highlightedVar);
  });
}); 