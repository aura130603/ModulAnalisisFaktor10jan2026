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
describe('useVariableSelection hook for Bivariate Correlation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseVariableStore.mockReturnValue(createMockStore(mockVariables));
  });

  it('should initialize availableVariables with variables from the global store', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    expect(result.current.availableVariables).toHaveLength(mockVariables.length);
    expect(result.current.testVariables).toHaveLength(0);
    expect(result.current.controlVariables).toHaveLength(0);
  });

  it('should move a variable from available to test variables', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
    });

    expect(result.current.testVariables).toHaveLength(1);
    expect(result.current.availableVariables).toHaveLength(mockVariables.length - 1);
    expect(result.current.controlVariables).toHaveLength(0);
  });

  it('should move a variable back to available variables', () => {
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

  it('should move a variable from available kendalls tau variable to control variables', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    // Move to test variables first
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
    });

    // Now move to control variables
    act(() => {
      result.current.moveToKendallsTauBControlVariables(mockVariables[0]);
    });

    expect(result.current.testVariables).toHaveLength(1);
    expect(result.current.controlVariables).toHaveLength(1);
    expect(result.current.availableVariables).toHaveLength(mockVariables.length - 1);
  });

  it('should move a variable from control variables back to available kendalls tau variables', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    // Move to test variables first
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
    });

    // Move to control variables
    act(() => {
      result.current.moveToKendallsTauBControlVariables(mockVariables[0]);
    });

    // Move back to available variables
    act(() => {
      result.current.moveToKendallsTauBAvailableVariables(mockVariables[0]);
    });

    expect(result.current.testVariables).toHaveLength(1);
    expect(result.current.controlVariables).toHaveLength(0);
    expect(result.current.availableVariables).toHaveLength(mockVariables.length - 1);
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
  });

  it('should reorder variables in the control list', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    // Move variables to test first
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
      result.current.moveToTestVariables(mockVariables[1]);
    });

    // Move to control variables
    act(() => {
      result.current.moveToKendallsTauBControlVariables(mockVariables[0]);
      result.current.moveToKendallsTauBControlVariables(mockVariables[1]);
    });

    // Reverse order in control list
    act(() => {
      result.current.reorderVariables('control', [...result.current.controlVariables].reverse());
    });

    expect(result.current.controlVariables[0].name).toBe('height');
  });

  it('should reset variable selection correctly', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    // Move variables to test and control
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
      result.current.moveToTestVariables(mockVariables[1]);
      result.current.moveToKendallsTauBControlVariables(mockVariables[0]);
    });

    // Reset
    act(() => {
      result.current.resetVariableSelection();
    });

    expect(result.current.testVariables).toHaveLength(0);
    expect(result.current.controlVariables).toHaveLength(0);
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

  it('should handle highlighting a control variable', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    // Move variable to test first
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
    });

    // Move to control
    act(() => {
      result.current.moveToKendallsTauBControlVariables(mockVariables[0]);
    });

    const highlightedVar: HighlightedVariable = {
      tempId: mockVariables[0].tempId!,
      source: 'control'
    };

    act(() => {
      result.current.setHighlightedVariable(highlightedVar);
    });

    expect(result.current.highlightedVariable).toEqual(highlightedVar);
  });


}); 