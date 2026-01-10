// Place all jest.mock calls before any imports that might load the actual modules
jest.mock('@/stores/useVariableStore', () => ({
  useVariableStore: jest.fn(),
}));
jest.mock('@/stores/useDataStore', () => ({
  useDataStore: jest.fn(),
}));
jest.mock('@/stores/useTableRefStore', () => ({
  useTableRefStore: jest.fn(),
}));

import { renderHook, act } from '@testing-library/react';
import { useFindReplaceForm } from '../useFindReplaceForm';
import { useVariableStore } from '@/stores/useVariableStore';
import { useDataStore } from '@/stores/useDataStore';
import { useTableRefStore } from '@/stores/useTableRefStore';

// Mock stores
const mockUpdateCell = jest.fn();
const mockUpdateCells = jest.fn();
const mockDeselectCell = jest.fn();
const mockSelectCell = jest.fn();
const mockScrollViewportTo = jest.fn();

const mockVariables = [
  { name: 'Var1', columnIndex: 0, label: 'Variable 1' },
  { name: 'Var2', columnIndex: 1, label: 'Variable 2' },
];
const mockData = [
  ['A', 'B'],
  ['a', 'b'],
  ['C', 'd'],
];

// Typecast the mocked hooks
const mockUseVariableStore = useVariableStore as unknown as jest.Mock;
const mockUseDataStore = useDataStore as unknown as jest.Mock;
const mockUseTableRefStore = useTableRefStore as unknown as jest.Mock;


describe('useFindReplaceForm', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    // Setup mock implementations for each test
    mockUseVariableStore.mockImplementation(selector => selector({ variables: mockVariables }));
    mockUseDataStore.mockImplementation(selector => selector({
      data: mockData,
      updateCell: mockUpdateCell,
      updateCells: mockUpdateCells,
    }));
    mockUseTableRefStore.mockImplementation(selector => selector({
      dataTableRef: {
        current: {
          hotInstance: {
            deselectCell: mockDeselectCell,
            selectCell: mockSelectCell,
            scrollViewportTo: mockScrollViewportTo,
          }
        }
      }
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useFindReplaceForm({}));
    expect(result.current.findText).toBe('');
    expect(result.current.replaceText).toBe('');
    expect(result.current.columnNames).toEqual(['Var1', 'Var2']);
    expect(result.current.selectedColumnName).toBe('Var1');
  });

  it('should clear results if find text is empty', () => {
    const { result } = renderHook(() => useFindReplaceForm({}));

    // First find something
    act(() => {
      result.current.handleFindChange('a');
      jest.runAllTimers();
    });
    expect(result.current.searchResultsCount).toBe(2);

    // Then clear it
    act(() => {
      result.current.handleFindChange('');
      jest.runAllTimers();
    });

    expect(result.current.findError).toBe('');
    expect(result.current.searchResultsCount).toBe(0);
  });

  it('should perform a case-insensitive search correctly', () => {
    const { result } = renderHook(() => useFindReplaceForm({}));

    act(() => {
      result.current.setSelectedColumnName('Var1');
      result.current.handleFindChange('a');
      jest.runAllTimers();
    });

    expect(result.current.findError).toBe('');
    expect(result.current.searchResultsCount).toBe(2); // 'A' and 'a'
  });

  it('should perform a case-sensitive search correctly', () => {
    const { result } = renderHook(() => useFindReplaceForm({}));

    act(() => {
      result.current.setSelectedColumnName('Var1');
      result.current.setMatchCase(true);
      result.current.handleFindChange('a');
      jest.runAllTimers();
    });

    expect(result.current.findError).toBe('');
    expect(result.current.searchResultsCount).toBe(1); // only 'a'
  });

  it('should show no results found message', () => {
    const { result } = renderHook(() => useFindReplaceForm({}));

    act(() => {
      result.current.handleFindChange('nonexistent');
      jest.runAllTimers();
    });

    expect(result.current.findError).toBe('No results found.');
    expect(result.current.searchResultsCount).toBe(0);
  });
  
  it('should navigate between results', () => {
    const { result } = renderHook(() => useFindReplaceForm({}));

    act(() => {
        result.current.handleFindChange('a');
        jest.runAllTimers();
    });
    expect(result.current.searchResultsCount).toBe(2);

    // Find next
    act(() => { result.current.handleFindNext(); });
    expect(result.current.currentResultNumber).toBe(1);
    expect(mockSelectCell).toHaveBeenCalledWith(0, 0); // First result {row: 0, col: 0} for 'A'

    act(() => { result.current.handleFindNext(); });
    expect(result.current.currentResultNumber).toBe(2);
    expect(mockSelectCell).toHaveBeenCalledWith(1, 0); // Second result {row: 1, col: 0} for 'a'

    // Find previous
    act(() => { result.current.handleFindPrevious(); });
    expect(result.current.currentResultNumber).toBe(1);
    expect(mockSelectCell).toHaveBeenCalledWith(0, 0);
  });

  it('should replace a single instance and find next', async () => {
    const { result } = renderHook(() => useFindReplaceForm({}));

    act(() => {
        result.current.handleFindChange('a');
        jest.runAllTimers();
    });
    expect(result.current.searchResultsCount).toBe(2);

    // Select first result
    act(() => { result.current.handleFindNext(); });
    expect(result.current.currentResultNumber).toBe(1);

    // Replace
    await act(async () => {
        result.current.handleReplaceChange('Z');
        await result.current.handleReplace();
    });
    
    expect(mockUpdateCell).toHaveBeenCalledWith(0, 0, 'Z');
    
    // It should have moved to the next result automatically
    expect(result.current.searchResultsCount).toBe(1);
    expect(result.current.currentResultNumber).toBe(1); // The new "first" of the remaining results
    expect(mockSelectCell).toHaveBeenCalledWith(1, 0); // Navigated to next result
  });

  it('should replace all instances', async () => {
    const { result } = renderHook(() => useFindReplaceForm({}));

    act(() => {
        result.current.handleFindChange('a');
        jest.runAllTimers();
    });
    expect(result.current.searchResultsCount).toBe(2);

    await act(async () => {
        result.current.handleReplaceChange('Z');
        await result.current.handleReplaceAll();
    });
    
    expect(mockUpdateCells).toHaveBeenCalledWith([
        { row: 0, col: 0, value: 'Z' },
        { row: 1, col: 0, value: 'Z' }
    ]);
    expect(result.current.searchResultsCount).toBe(0);
  });
});
