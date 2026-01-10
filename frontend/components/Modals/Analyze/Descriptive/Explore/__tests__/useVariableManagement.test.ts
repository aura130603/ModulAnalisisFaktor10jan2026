import { renderHook, act } from '@testing-library/react';
import { useVariableManagement } from '../hooks/useVariableManagement';
import { useVariableStore } from '@/stores/useVariableStore';
import type { Variable } from '@/types/Variable';

// Mock variable store
const mockVars: Variable[] = [
  { id: 0, name: 'age', label: 'Age', tempId: 't0', columnIndex: 0, type: 'NUMERIC', measure: 'scale', decimals: 0, width: 8, values: [], missing: {} as any, align: 'right', role: 'input', columns: 8 } as Variable,
  { id: 1, name: 'gender', label: 'Gender', tempId: 't1', columnIndex: 1, type: 'NUMERIC', measure: 'scale', decimals: 0, width: 8, values: [], missing: {} as any, align: 'left', role: 'input', columns: 8 } as Variable,
  { id: 2, name: 'dept', label: 'Department', tempId: 't2', columnIndex: 2, type: 'STRING', measure: 'nominal', decimals: 0, width: 8, values: [], missing: {} as any, align: 'left', role: 'input', columns: 8 } as Variable,
];

jest.mock('@/stores/useVariableStore', () => {
  const storeFn: any = jest.fn();
  storeFn.getState = () => ({ variables: mockVars });
  return {
    __esModule: true,
    useVariableStore: storeFn,
  };
});

const mockedUseVariableStore = useVariableStore as unknown as jest.Mock;

describe('Explore useVariableManagement hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseVariableStore.mockReturnValue({ variables: mockVars });
  });

  it('initializes available variables correctly', () => {
    const { result } = renderHook(() => useVariableManagement());
    expect(result.current.availableVariables).toHaveLength(mockVars.length);
    expect(result.current.dependentVariables).toHaveLength(0);
  });

  it('moves variable to Dependent list', () => {
    const { result } = renderHook(() => useVariableManagement());

    act(() => {
      result.current.moveToDependentVariables(mockVars[0]);
    });

    expect(result.current.dependentVariables).toHaveLength(1);
    expect(result.current.dependentVariables[0].name).toBe('age');
    expect(result.current.availableVariables).toHaveLength(mockVars.length - 1);
  });

  it('moves variable to Factor list and then back to available', () => {
    const { result } = renderHook(() => useVariableManagement());

    act(() => {
      result.current.moveToFactorVariables(mockVars[1]);
    });
    expect(result.current.factorVariables).toHaveLength(1);

    act(() => {
      result.current.moveToAvailableVariables(mockVars[1], 'factor');
    });

    expect(result.current.factorVariables).toHaveLength(0);
    expect(result.current.availableVariables).toHaveLength(mockVars.length);
  });

  it('sets label variable and replaces existing label when new one is set', () => {
    const { result } = renderHook(() => useVariableManagement());

    act(() => {
      result.current.moveToLabelVariable(mockVars[0]);
    });
    expect(result.current.labelVariable?.name).toBe('age');

    act(() => {
      result.current.moveToLabelVariable(mockVars[1]);
    });
    expect(result.current.labelVariable?.name).toBe('gender');
  });

  it('reorders dependent variables', () => {
    const { result } = renderHook(() => useVariableManagement());

    act(() => {
      result.current.moveToDependentVariables(mockVars[0]);
      result.current.moveToDependentVariables(mockVars[1]);
    });
    expect(result.current.dependentVariables[0].name).toBe('age');

    act(() => {
      result.current.reorderVariables('dependent', [...result.current.dependentVariables].reverse());
    });
    expect(result.current.dependentVariables[0].name).toBe('gender');
  });

  it('resetVariableSelections returns to initial state', () => {
    const { result } = renderHook(() => useVariableManagement());

    act(() => {
      result.current.moveToDependentVariables(mockVars[0]);
      result.current.resetVariableSelections();
    });

    expect(result.current.dependentVariables).toHaveLength(0);
    expect(result.current.availableVariables).toHaveLength(mockVars.length);
    expect(result.current.labelVariable).toBeNull();
  });
}); 