import { renderHook, act } from '@testing-library/react';
import { useVariableManagement } from '../hooks/useVariableManagement';
import type { Variable } from '@/types/Variable';

// Prepare a dedicated mock store for this test suite
const numericScale: Variable = {
  id: 0,
  name: 'num_scale', label: 'Numeric Scale', columnIndex: 0, type: 'NUMERIC', measure: 'scale', tempId: 'v0'
} as unknown as Variable;

const numericOrdinal: Variable = {
  id: 1,
  name: 'num_ordinal', label: 'Numeric Ordinal', columnIndex: 1, type: 'NUMERIC', measure: 'ordinal', tempId: 'v1'
} as unknown as Variable;

const numericNominal: Variable = {
  id: 2,
  name: 'num_nominal', label: 'Numeric Nominal', columnIndex: 2, type: 'NUMERIC', measure: 'nominal', tempId: 'v2'
} as unknown as Variable;

const numericUnknown: Variable = {
  id: 3,
  name: 'num_unknown', label: 'Numeric Unknown', columnIndex: 3, type: 'NUMERIC', measure: 'unknown', tempId: 'v3'
} as unknown as Variable;

const stringNominal: Variable = {
  id: 4,
  name: 'cat_string', label: 'Category', columnIndex: 4, type: 'STRING', measure: 'nominal', tempId: 'v4'
} as unknown as Variable;

const dateUnknown: Variable = {
  id: 5,
  name: 'date_ddmmyyyy', label: 'Date (dd-mm-yyyy)', columnIndex: 5, type: 'DATE', measure: 'unknown', tempId: 'v5'
} as unknown as Variable;

const allVars = [
  numericScale,
  numericOrdinal,
  numericNominal,
  numericUnknown,
  stringNominal,
  dateUnknown,
];

jest.mock('@/stores/useVariableStore', () => {
  const storeFn: any = jest.fn();
  storeFn.getState = () => ({ variables: allVars });
  return {
    __esModule: true,
    useVariableStore: storeFn,
  };
});

describe('Explore variable types and measurements support', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.warn as jest.Mock).mockRestore?.();
  });

  it('accepts numeric variables as dependents regardless of measurement level', () => {
    const { result } = renderHook(() => useVariableManagement());

    act(() => {
      result.current.moveToDependentVariables(numericScale);
      result.current.moveToDependentVariables(numericOrdinal);
      result.current.moveToDependentVariables(numericNominal);
      result.current.moveToDependentVariables(numericUnknown);
    });

    expect(result.current.dependentVariables.map(v => v.name)).toEqual([
      'num_scale', 'num_ordinal', 'num_nominal', 'num_unknown'
    ]);
  });

  it('rejects STRING and DATE variables as dependents', () => {
    const { result } = renderHook(() => useVariableManagement());

    act(() => {
      result.current.moveToDependentVariables(stringNominal);
      result.current.moveToDependentVariables(dateUnknown);
    });

    expect(result.current.dependentVariables).toHaveLength(0);
    // Ensure a warning is emitted for non-numeric
    expect(console.warn).toHaveBeenCalled();
  });

  it('allows STRING and DATE variables to be used as factors', () => {
    const { result } = renderHook(() => useVariableManagement());

    act(() => {
      result.current.moveToFactorVariables(stringNominal);
      result.current.moveToFactorVariables(dateUnknown);
    });

    expect(result.current.factorVariables.map(v => v.name)).toEqual([
      'cat_string', 'date_ddmmyyyy'
    ]);
  });
});


