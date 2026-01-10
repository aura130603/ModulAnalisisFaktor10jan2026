import { renderHook, act } from '@testing-library/react';
import { useTranspose } from '../hooks/useTranspose';
import { useVariableStore } from '@/stores/useVariableStore';
import { useDataStore } from '@/stores/useDataStore';
import * as TransposeService from '../services/transposeService';
import type { Variable } from '@/types/Variable';

// Mock dependencies
jest.mock('@/stores/useVariableStore');
jest.mock('@/stores/useDataStore');
jest.mock('../services/transposeService');

const mockedUseVariableStore = useVariableStore as unknown as jest.Mock;
const mockedUseDataStore = useDataStore as unknown as jest.Mock;
const mockedTransposeService = jest.spyOn(TransposeService, 'transposeDataService');

const mockOverwriteAll = jest.fn();
const mockOnClose = jest.fn();

const mockVariables: Variable[] = [
  { id: 1, name: 'VarA', columnIndex: 0, type: 'NUMERIC', measure: 'scale', tempId: 't1' } as Variable,
  { id: 2, name: 'VarB', columnIndex: 1, type: 'STRING', measure: 'nominal', tempId: 't2' } as Variable,
  { id: 3, name: 'VarC', columnIndex: 2, type: 'NUMERIC', measure: 'scale', tempId: 't3' } as Variable,
];

const mockData = [[1, 'a', 10], [2, 'b', 20]];

describe('useTranspose Hook', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseVariableStore.mockReturnValue({
      variables: mockVariables,
      overwriteAll: mockOverwriteAll,
    });
    mockedUseDataStore.mockReturnValue({
      data: mockData,
    });
    mockedTransposeService.mockReturnValue({
      transposedData: 'transposed data' as any,
      finalTransposedVariables: 'transposed variables' as any,
    });
  });

  it('initializes with available variables from the store', () => {
    const { result } = renderHook(() => useTranspose({ onClose: mockOnClose }));
    expect(result.current.availableVariables.length).toBe(3);
    expect(result.current.selectedVariables.length).toBe(0);
    expect(result.current.nameVariables.length).toBe(0);
  });

  it('moves a variable to the selected list', () => {
    const { result } = renderHook(() => useTranspose({ onClose: mockOnClose }));
    const varToMove = result.current.availableVariables[0];
    
    act(() => {
      result.current.handleMoveVariable(varToMove, 'available', 'selected');
    });

    expect(result.current.availableVariables.length).toBe(2);
    expect(result.current.selectedVariables.length).toBe(1);
    expect(result.current.selectedVariables[0].name).toBe('VarA');
  });
  
  it('moves a variable to the name list and replaces any existing one', () => {
    const { result } = renderHook(() => useTranspose({ onClose: mockOnClose }));
    const varToMoveFirst = result.current.availableVariables[0];
    const varToMoveSecond = result.current.availableVariables[1];
    
    act(() => {
      result.current.handleMoveVariable(varToMoveFirst, 'available', 'name');
    });
    expect(result.current.nameVariables.length).toBe(1);
    expect(result.current.nameVariables[0].name).toBe('VarA');

    act(() => {
        result.current.handleMoveVariable(varToMoveSecond, 'available', 'name');
    });
    expect(result.current.nameVariables.length).toBe(1);
    expect(result.current.nameVariables[0].name).toBe('VarB');
  });

  it('resets the state correctly', () => {
    const { result } = renderHook(() => useTranspose({ onClose: mockOnClose }));
    act(() => {
      result.current.handleMoveVariable(result.current.availableVariables[0], 'available', 'selected');
      result.current.handleMoveVariable(result.current.availableVariables[1], 'available', 'name');
    });

    expect(result.current.selectedVariables.length).toBe(1);
    expect(result.current.nameVariables.length).toBe(1);

    act(() => {
      result.current.handleReset();
    });

    expect(result.current.availableVariables.length).toBe(3);
    expect(result.current.selectedVariables.length).toBe(0);
    expect(result.current.nameVariables.length).toBe(0);
  });

  it('calls the transpose service and updates stores on handleOk', async () => {
    const { result } = renderHook(() => useTranspose({ onClose: mockOnClose }));
    const varToSelect = result.current.availableVariables[0];
    const varForName = result.current.availableVariables[1];

    act(() => {
      result.current.handleMoveVariable(varToSelect, 'available', 'selected');
      result.current.handleMoveVariable(varForName, 'available', 'name');
    });

    await act(async () => {
      await result.current.handleOk();
    });

    const sanitizedData = mockData.map(row => row.map(cell => cell ?? ""));
    expect(mockedTransposeService).toHaveBeenCalledWith(sanitizedData, [varToSelect], varForName);
    expect(mockOverwriteAll).toHaveBeenCalledWith('transposed variables', 'transposed data');
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not call transpose service if no variables are selected', async () => {
    const { result } = renderHook(() => useTranspose({ onClose: mockOnClose }));

    await act(async () => {
        await result.current.handleOk();
    });

    expect(mockedTransposeService).not.toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

}); 