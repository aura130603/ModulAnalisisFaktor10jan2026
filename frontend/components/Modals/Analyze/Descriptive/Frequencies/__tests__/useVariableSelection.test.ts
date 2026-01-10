import { renderHook, act } from '@testing-library/react';
import { useVariableSelection } from '../hooks/useVariableSelection';
import { useVariableStore } from '@/stores/useVariableStore';
import type { Variable } from '@/types/Variable';

// -------------------------
// Mock global variable store
// -------------------------
const mockVariables: Variable[] = [
  {
    name: 'gender',
    label: 'Gender',
    tempId: 'temp_0',
    columnIndex: 0,
    type: 'STRING',
    width: 8,
    decimals: 0,
    values: [],
    missing: {},
    align: 'left',
    measure: 'nominal',
    role: 'input',
    columns: 8,
  },
  {
    name: 'dept',
    label: 'Department',
    tempId: 'temp_1',
    columnIndex: 1,
    type: 'STRING',
    width: 8,
    decimals: 0,
    values: [],
    missing: {},
    align: 'left',
    measure: 'nominal',
    role: 'input',
    columns: 8,
  },
];

jest.mock('@/stores/useVariableStore', () => {
  const storeFn: any = jest.fn();
  storeFn.getState = () => ({ variables: mockVariables });
  return {
    __esModule: true,
    useVariableStore: storeFn,
  };
});

const mockedUseVariableStore = useVariableStore as unknown as jest.Mock;

// -------------------------
// Tests
// -------------------------
describe('Frequencies useVariableSelection hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseVariableStore.mockReturnValue({ variables: mockVariables });
  });

  it('initializes with available variables from the store', () => {
    const { result } = renderHook(() => useVariableSelection());
    expect(result.current.availableVariables).toHaveLength(mockVariables.length);
    expect(result.current.selectedVariables).toHaveLength(0);
  });

  it('moves a variable to selected and back to available', () => {
    const { result } = renderHook(() => useVariableSelection());

    act(() => {
      result.current.moveToSelectedVariables(mockVariables[0]);
    });
    expect(result.current.selectedVariables).toHaveLength(1);
    expect(result.current.availableVariables).toHaveLength(mockVariables.length - 1);

    act(() => {
      result.current.moveToAvailableVariables(mockVariables[0]);
    });
    expect(result.current.selectedVariables).toHaveLength(0);
    expect(result.current.availableVariables).toHaveLength(mockVariables.length);
  });

  it('reorders selected variables', () => {
    const { result } = renderHook(() => useVariableSelection());

    act(() => {
      result.current.moveToSelectedVariables(mockVariables[0]);
      result.current.moveToSelectedVariables(mockVariables[1]);
    });
    // Reverse order
    act(() => {
      result.current.reorderVariables('selected', [...result.current.selectedVariables].reverse());
    });
    expect(result.current.selectedVariables[0].name).toBe('dept');
  });

  it('resets variable selection', () => {
    const { result } = renderHook(() => useVariableSelection());

    act(() => {
      result.current.moveToSelectedVariables(mockVariables[0]);
    });
    expect(result.current.selectedVariables).toHaveLength(1);

    act(() => {
      result.current.resetVariableSelection();
    });
    expect(result.current.selectedVariables).toHaveLength(0);
    expect(result.current.availableVariables).toHaveLength(mockVariables.length);
  });
}); 