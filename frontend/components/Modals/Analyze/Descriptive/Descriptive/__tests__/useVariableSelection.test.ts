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
    id: 1,
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
    id: 2,
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
describe('useVariableSelection hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseVariableStore.mockReturnValue(createMockStore(mockVariables));
  });

  it('initializes availableVariables with variables from the global store', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    expect(result.current.availableVariables).toHaveLength(mockVariables.length);
    expect(result.current.selectedVariables).toHaveLength(0);
  });

  it('moves a variable from available to selected', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    act(() => {
      result.current.moveToSelectedVariables(mockVariables[0]);
    });

    expect(result.current.selectedVariables).toHaveLength(1);
    expect(result.current.availableVariables).toHaveLength(mockVariables.length - 1);
  });

  it('moves a variable back to available', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    // Move to selected first
    act(() => {
      result.current.moveToSelectedVariables(mockVariables[0]);
    });

    // Now move it back
    act(() => {
      result.current.moveToAvailableVariables(mockVariables[0]);
    });

    expect(result.current.selectedVariables).toHaveLength(0);
    expect(result.current.availableVariables).toHaveLength(mockVariables.length);
  });

  it('reorders variables in the selected list', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    // Move both variables to selected
    act(() => {
      result.current.moveToSelectedVariables(mockVariables[0]);
      result.current.moveToSelectedVariables(mockVariables[1]);
    });

    // Reverse order
    act(() => {
      result.current.reorderVariables('selected', [...result.current.selectedVariables].reverse());
    });

    expect(result.current.selectedVariables[0].name).toBe('height');
  });

  it('resets variable selection correctly', () => {
    const { result } = renderHook(() => useVariableSelection({}));

    // Move variable to selected
    act(() => {
      result.current.moveToSelectedVariables(mockVariables[0]);
    });

    // Reset
    act(() => {
      result.current.resetVariableSelection();
    });

    expect(result.current.selectedVariables).toHaveLength(0);
    expect(result.current.availableVariables).toHaveLength(mockVariables.length);
  });
}); 