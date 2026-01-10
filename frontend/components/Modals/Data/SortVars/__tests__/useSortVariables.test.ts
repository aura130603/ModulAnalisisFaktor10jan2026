import { renderHook, act } from '@testing-library/react';
import { useSortVariables } from '../hooks/useSortVariables';
import { useVariableStore } from '@/stores/useVariableStore';
import { useDataStore } from '@/stores/useDataStore';
import { sortDataColumns } from '../services/sortVarsService';
import type { Variable } from '@/types/Variable';

// Mock dependencies
jest.mock('@/stores/useVariableStore');
jest.mock('@/stores/useDataStore');
jest.mock('../services/sortVarsService');

// Mock implementations
const mockedUseVariableStore = useVariableStore as unknown as jest.Mock;
const mockedUseDataStore = useDataStore as unknown as jest.Mock;
const mockedSortDataColumns = sortDataColumns as jest.Mock;

const mockOverwriteAll = jest.fn();
const mockSetData = jest.fn();
const mockOnClose = jest.fn();

const mockVariables: Variable[] = [
  { tempId: 't1', name: 'C-var', columnIndex: 0, type: 'NUMERIC', width: 8, decimals: 2, label: '', values: [], missing: null, columns: 8, align: 'right', measure: 'scale', role: 'input' },
  { tempId: 't2', name: 'A-var', columnIndex: 1, type: 'STRING', width: 10, decimals: 0, label: '', values: [], missing: null, columns: 10, align: 'left', measure: 'nominal', role: 'input' },
  { tempId: 't3', name: 'B-var', columnIndex: 2, type: 'NUMERIC', width: 8, decimals: 2, label: '', values: [], missing: null, columns: 8, align: 'right', measure: 'scale', role: 'input' },
];

const mockData = [
    [1, 'z', 100],
    [2, 'y', 200],
];

describe('useSortVariables', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockedUseVariableStore.mockReturnValue({
      variables: mockVariables,
      overwriteAll: mockOverwriteAll,
    });

    mockedUseDataStore.mockReturnValue({
      data: mockData,
      setData: mockSetData,
    });

    mockedSortDataColumns.mockReturnValue('sorted data');

    global.alert = jest.fn();
  });

  it('should sort variables by name ascending and update stores', async () => {
    const { result } = renderHook(() => useSortVariables({ onClose: mockOnClose }));

    act(() => {
      result.current.handleSelectColumn('Name');
      result.current.setSortOrder('asc');
    });
    
    await act(async () => {
      await result.current.handleOk();
    });

    expect(mockOverwriteAll).toHaveBeenCalledTimes(1);
    const [sortedVars, sortedData] = mockOverwriteAll.mock.calls[0];
    
    // Check if variables are sorted correctly by name: A-var, B-var, C-var
    expect(sortedVars[0].name).toBe('A-var');
    expect(sortedVars[1].name).toBe('B-var');
    expect(sortedVars[2].name).toBe('C-var');
    
    // Check if columnIndex is updated
    expect(sortedVars[0].columnIndex).toBe(0);
    expect(sortedVars[1].columnIndex).toBe(1);
    expect(sortedVars[2].columnIndex).toBe(2);

    expect(mockedSortDataColumns).toHaveBeenCalledWith(mockData, mockVariables, sortedVars);
    expect(sortedData).toBe('sorted data');
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  it('should handle sorting with null values correctly', async () => {
    const varsWithNull: Variable[] = [
        { ...mockVariables[0], label: 'Z Label', tempId: 't1' },
        { ...mockVariables[1], label: undefined, tempId: 't2' }, // null/undefined value
        { ...mockVariables[2], label: 'A Label', tempId: 't3' },
    ];
    
    mockedUseVariableStore.mockReturnValue({
      variables: varsWithNull,
      overwriteAll: mockOverwriteAll,
    });
    
    const { result } = renderHook(() => useSortVariables({ onClose: mockOnClose }));

    act(() => {
      result.current.handleSelectColumn('Label');
      result.current.setSortOrder('asc');
    });
    
    await act(async () => {
      await result.current.handleOk();
    });
    
    const [sortedVars] = mockOverwriteAll.mock.calls[0];

    // Null/undefined labels should come first
    expect(sortedVars[0].label).toBeUndefined();
    expect(sortedVars[1].label).toBe('A Label');
    expect(sortedVars[2].label).toBe('Z Label');
  });

  it('should show an alert if no column is selected', async () => {
    const { result } = renderHook(() => useSortVariables({ onClose: mockOnClose }));

    await act(async () => {
      await result.current.handleOk();
    });

    expect(global.alert).toHaveBeenCalledWith('Please select a column to sort by.');
    expect(mockOverwriteAll).not.toHaveBeenCalled();
    expect(mockSetData).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should reset the selection when handleReset is called', () => {
     const { result } = renderHook(() => useSortVariables({ onClose: mockOnClose }));

    act(() => {
      result.current.handleSelectColumn('Name');
      result.current.setSortOrder('desc');
    });

    expect(result.current.selectedColumn).toBe('Name');
    expect(result.current.sortOrder).toBe('desc');

    act(() => {
        result.current.handleReset();
    });

    expect(result.current.selectedColumn).toBeNull();
    expect(result.current.sortOrder).toBe('asc');
  });
}); 