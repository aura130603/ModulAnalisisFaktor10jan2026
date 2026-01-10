// @ts-nocheck
import { renderHook, act } from '@testing-library/react';
import { useVariableManagement } from '../hooks/useVariableManagement';
import type { Variable } from '@/types/Variable';

// Prepare variables covering types and measurement levels
const mockVars: Variable[] = [
  { id: 0, name: 'num_unknown', label: 'Num Unknown', tempId: 't0', columnIndex: 0, type: 'NUMERIC', measure: 'unknown', decimals: 0, width: 8, values: [], missing: null as any, align: 'right', role: 'input', columns: 8 } as Variable,
  { id: 1, name: 'num_nominal', label: 'Num Nominal', tempId: 't1', columnIndex: 1, type: 'NUMERIC', measure: 'nominal', decimals: 0, width: 8, values: [], missing: null as any, align: 'right', role: 'input', columns: 8 } as Variable,
  { id: 2, name: 'num_ordinal', label: 'Num Ordinal', tempId: 't2', columnIndex: 2, type: 'NUMERIC', measure: 'ordinal', decimals: 0, width: 8, values: [], missing: null as any, align: 'right', role: 'input', columns: 8 } as Variable,
  { id: 3, name: 'num_scale', label: 'Num Scale', tempId: 't3', columnIndex: 3, type: 'NUMERIC', measure: 'scale', decimals: 0, width: 8, values: [], missing: null as any, align: 'right', role: 'input', columns: 8 } as Variable,
  { id: 4, name: 'text', label: 'Text', tempId: 't4', columnIndex: 4, type: 'STRING', measure: 'nominal', decimals: 0, width: 8, values: [], missing: null as any, align: 'left', role: 'input', columns: 8 } as Variable,
  { id: 5, name: 'birth_dd_mm_yyyy', label: 'Birth (dd-mm-yyyy)', tempId: 't5', columnIndex: 5, type: 'DATE', measure: 'ordinal', decimals: 0, width: 8, values: [], missing: null as any, align: 'right', role: 'input', columns: 8 } as Variable,
];

jest.mock('@/stores/useVariableStore', () => {
  const storeFn: any = jest.fn();
  storeFn.getState = () => ({ variables: mockVars });
  return {
    __esModule: true,
    useVariableStore: storeFn,
  };
});

describe('useVariableManagement type and measurement handling', () => {
  const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

  beforeEach(() => {
    warnSpy.mockClear();
  });

  afterAll(() => {
    warnSpy.mockRestore();
  });

  it('allows moving NUMERIC variables regardless of measurement level', () => {
    const { result } = renderHook(() => useVariableManagement());

    act(() => {
      result.current.moveToDependentVariables(mockVars[0]);
      result.current.moveToDependentVariables(mockVars[1]);
      result.current.moveToDependentVariables(mockVars[2]);
      result.current.moveToDependentVariables(mockVars[3]);
    });

    expect(result.current.dependentVariables.map(v => v.name)).toEqual([
      'num_unknown', 'num_nominal', 'num_ordinal', 'num_scale',
    ]);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('rejects STRING and DATE (dd-mm-yyyy) variables from Dependent list', () => {
    const { result } = renderHook(() => useVariableManagement());

    act(() => {
      result.current.moveToDependentVariables(mockVars[4]); // STRING
      result.current.moveToDependentVariables(mockVars[5]); // DATE
    });

    expect(result.current.dependentVariables.some(v => v.name === 'text')).toBe(false);
    expect(result.current.dependentVariables.some(v => v.name === 'birth_dd_mm_yyyy')).toBe(false);
    expect(console.warn).toHaveBeenCalledTimes(2);
  });

  it('allows moving STRING and DATE variables to Factor list', () => {
    const { result } = renderHook(() => useVariableManagement());

    act(() => {
      result.current.moveToFactorVariables(mockVars[4]); // STRING
      result.current.moveToFactorVariables(mockVars[5]); // DATE
    });

    expect(result.current.factorVariables.map(v => v.name)).toEqual(['text', 'birth_dd_mm_yyyy']);
  });
});


