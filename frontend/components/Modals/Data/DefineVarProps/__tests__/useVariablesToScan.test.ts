import { renderHook, act } from '@testing-library/react';
import { useVariablesToScan } from '../hooks/useVariablesToScan';
import { useVariableStore } from '@/stores/useVariableStore';
import type { Variable } from '@/types/Variable';

jest.mock('@/stores/useVariableStore');

const mockVariables: Variable[] = [
  { tempId: '1', name: 'var1', columnIndex: 0, type: 'NUMERIC', measure: 'scale', role: 'input', values: [], missing: null, decimals: 0, width: 8, columns: 12, align: 'left' },
  { tempId: '2', name: 'var2', columnIndex: 1, type: 'STRING', measure: 'nominal', role: 'input', values: [], missing: null, decimals: 0, width: 8, columns: 12, align: 'left' },
  { tempId: '3', name: 'var3', columnIndex: 2, type: 'NUMERIC', measure: 'ordinal', role: 'input', values: [], missing: null, decimals: 0, width: 8, columns: 12, align: 'left' },
];

describe('useVariablesToScan', () => {
  const onContinue = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useVariableStore as unknown as jest.Mock).mockReturnValue({
      variables: [...mockVariables], // Use a copy to avoid mutation across tests
    });
  });

  it('should initialize with variables from the store', () => {
    const { result } = renderHook(() => useVariablesToScan({ initialAvailableVariables: mockVariables as any, onContinue }));
    expect(result.current.availableVariables).toHaveLength(3);
    expect(result.current.targetListsConfig[0].variables).toHaveLength(0);
  });

  it('should move a variable to the scan list', () => {
    const { result } = renderHook(() => useVariablesToScan({ initialAvailableVariables: mockVariables as any, onContinue }));
    
    act(() => {
      result.current.handleMoveVariable(mockVariables[0], 'available', 'toScan');
    });

    expect(result.current.availableVariables).toHaveLength(2);
    expect(result.current.targetListsConfig[0].variables).toHaveLength(1);
    expect(result.current.targetListsConfig[0].variables[0].name).toBe('var1');
  });

  it('should move a variable back to the available list', () => {
    const { result } = renderHook(() => useVariablesToScan({ initialAvailableVariables: mockVariables as any, onContinue }));
    
    act(() => {
      result.current.handleMoveVariable(mockVariables[0], 'available', 'toScan');
    });
    
    const varToMoveBack = result.current.targetListsConfig[0].variables[0];
    
    act(() => {
      result.current.handleMoveVariable(varToMoveBack, 'toScan', 'available');
    });

    expect(result.current.availableVariables).toHaveLength(3);
    expect(result.current.targetListsConfig[0].variables).toHaveLength(0);
  });

  it('should reorder variables in the scan list', () => {
    const { result } = renderHook(() => useVariablesToScan({ initialAvailableVariables: mockVariables as any, onContinue }));

    act(() => {
      result.current.handleMoveVariable(mockVariables[0], 'available', 'toScan');
      result.current.handleMoveVariable(mockVariables[1], 'available', 'toScan');
    });

    const variablesToReorder = result.current.targetListsConfig[0].variables;
    act(() => {
      result.current.handleReorderVariable('toScan', [variablesToReorder[1], variablesToReorder[0]]);
    });

    const reorderedVariables = result.current.targetListsConfig[0].variables;
    expect(reorderedVariables[0].name).toBe('var2');
    expect(reorderedVariables[1].name).toBe('var1');
  });

  it('should not call onContinue if no variables are selected', () => {
    const { result } = renderHook(() => useVariablesToScan({ initialAvailableVariables: mockVariables as any, onContinue }));

    act(() => {
      result.current.handleContinue();
    });

    expect(onContinue).not.toHaveBeenCalled();
    expect(result.current.errorMessage).toBe('No variables have been selected for scanning.');
    expect(result.current.errorDialogOpen).toBe(true);
  });

  it('should call onContinue with selected variables and limits', () => {
    const { result } = renderHook(() => useVariablesToScan({ initialAvailableVariables: mockVariables as any, onContinue }));

    act(() => {
      result.current.handleMoveVariable(mockVariables[0], 'available', 'toScan');
    });

    act(() => {
        result.current.handleContinue();
    });

    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(onContinue).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ name: 'var1' })]),
        '50',
        '200'
    );
  });

  it('should call onContinue with null limits if checkboxes are unchecked', () => {
    const { result } = renderHook(() => useVariablesToScan({ initialAvailableVariables: mockVariables as any, onContinue }));

    act(() => {
        result.current.handleMoveVariable(mockVariables[0], 'available', 'toScan');
        result.current.setLimitCases(false);
        result.current.setLimitValues(false);
    });

    act(() => {
        result.current.handleContinue();
    });

    expect(onContinue).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ name: 'var1' })]),
        null,
        null
    );
  });
}); 