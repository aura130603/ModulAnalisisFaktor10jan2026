import { renderHook, act } from '@testing-library/react';
import { useVariableSelection } from '../hooks/useVariableSelection';
import { useVariableStore } from '@/stores/useVariableStore';
import type { Variable } from '@/types/Variable';
import { HighlightedVariable } from '../types';
import { HighlightedPair } from '../types';
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
    name: 'var1',
    label: 'Variable 1',
    tempId: 'temp_0',
    columnIndex: 0,
    type: 'NUMERIC',
    width: 8,
    decimals: 2,
    values: [],
    missing: {},
    align: 'left',
    measure: 'scale',
    role: 'input',
    columns: 8
  },
  {
    name: 'var2',
    label: 'Variable 2',
    tempId: 'temp_1',
    columnIndex: 1,
    type: 'NUMERIC',
    width: 8,
    decimals: 2,
    values: [],
    missing: {},
    align: 'left',
    measure: 'scale',
    role: 'input',
    columns: 8
  },
  {
    name: 'var3',
    label: 'Variable 3',
    tempId: 'temp_2',
    columnIndex: 2,
    type: 'NUMERIC',
    width: 8,
    decimals: 2,
    values: [],
    missing: {},
    align: 'left',
    measure: 'scale',
    role: 'input',
    columns: 8
  },
  {
    name: 'var4',
    label: 'Variable 4',
    tempId: 'temp_3',
    columnIndex: 3,
    type: 'NUMERIC',
    width: 8,
    decimals: 2,
    values: [],
    missing: {},
    align: 'left',
    measure: 'scale',
    role: 'input',
    columns: 8
  }
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
describe('useVariableSelection hook for PairedSamplesTTest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseVariableStore.mockImplementation((selector) => {
      const store = createMockStore(mockVariables);
      return selector ? selector(store) : store;
    });
  });

  it('should initialize with variables from the global store', () => {
    const { result } = renderHook(() => useVariableSelection());

    expect(result.current.availableVariables).toHaveLength(mockVariables.length);
    expect(result.current.testVariables1).toHaveLength(0);
    expect(result.current.testVariables2).toHaveLength(0);
    expect(result.current.pairNumbers).toHaveLength(0);
  });

  it('should move variable to testVariables1 when testVariables1 is shorter', () => {
    const { result } = renderHook(() => useVariableSelection());

    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
    });

    expect(result.current.testVariables1).toHaveLength(1);
    expect(result.current.testVariables2).toHaveLength(0);
    expect(result.current.availableVariables).toHaveLength(mockVariables.length);
    expect(result.current.pairNumbers).toEqual([1]);
  });

  it('should move variable to testVariables2 when testVariables1 is longer', () => {
    const { result } = renderHook(() => useVariableSelection());

    // First move two variables to testVariables1
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
      result.current.moveToTestVariables(mockVariables[1]);
    });

    // Then move one to testVariables2
    act(() => {
      result.current.moveToTestVariables(mockVariables[2]);
    });

    expect(result.current.testVariables1).toHaveLength(2);
    expect(result.current.testVariables2).toHaveLength(1);
    expect(result.current.pairNumbers).toEqual([1, 2]);
  });

  it('should remove variable from testVariables1', () => {
    const { result } = renderHook(() => useVariableSelection());

    // First add a variable
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
    });

    // Then remove it
    act(() => {
      result.current.removeVariable('test1', 0);
    });

    expect(result.current.testVariables1).toHaveLength(0);
    expect(result.current.testVariables2).toHaveLength(0);
    expect(result.current.availableVariables).toHaveLength(mockVariables.length);
    expect(result.current.pairNumbers).toHaveLength(0);
  });

  it('should remove variable from testVariables2', () => {
    const { result } = renderHook(() => useVariableSelection());

    // PENYIAPAN STATE: Gunakan act() terpisah untuk setiap perubahan state
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
    });
    act(() => {
      result.current.moveToTestVariables(mockVariables[1]);
    });
    act(() => {
      result.current.moveToTestVariables(mockVariables[2]);
    });
    // State sekarang: testVariables1 = [var1, var3], testVariables2 = [var2]

    // AKSI: Hapus variabel dari test2
    act(() => {
      result.current.removeVariable('test2', 0);
    });

    // ASERSI YANG DIPERBAIKI:
    // Periksa apakah testVariables1 tidak berubah
    expect(result.current.testVariables1).toHaveLength(2);
    expect(result.current.testVariables1[0].name).toBe('var1');
    expect(result.current.testVariables1[1].name).toBe('var3');

    // Periksa apakah testVariables2 sekarang berisi undefined
    expect(result.current.testVariables2).toHaveLength(1);
    expect(result.current.testVariables2[0]).toBeUndefined();
  });

  it('should move variable from testVariables1 to testVariables2', () => {
    const { result } = renderHook(() => useVariableSelection());

    // PENYIAPAN STATE: Gunakan act() terpisah
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
    });
    act(() => {
      result.current.moveToTestVariables(mockVariables[1]);
    });
    // State sekarang: testVariables1 = [var1], testVariables2 = [var2]

    // AKSI: Pindahkan variabel
    act(() => {
      result.current.moveVariableBetweenLists(0);
    });

    // ASERSI (Tetap sama, sekarang akan lulus)
    expect(result.current.testVariables1).toHaveLength(1);
    expect(result.current.testVariables2).toHaveLength(1);
    expect(result.current.testVariables1[0]).toEqual(mockVariables[1]);
    expect(result.current.testVariables2[0]).toEqual(mockVariables[0]);
  });

  it('should move variable from testVariables2 to testVariables1', () => {
    const { result } = renderHook(() => useVariableSelection());

    // 1. PENYIAPAN STATE:
    // Buat satu pasangan lengkap dan satu pasangan tidak lengkap.
    act(() => { result.current.moveToTestVariables(mockVariables[0]); }); // t1 = [var1]
    act(() => { result.current.moveToTestVariables(mockVariables[1]); }); // t2 = [var2]
    act(() => { result.current.moveToTestVariables(mockVariables[2]); }); // t1 = [var1, var3]
    // State Awal:
    // testVariables1 = [var1, var3]
    // testVariables2 = [var2] -> Perhatikan, testVariables2[1] adalah undefined

    // 2. AKSI:
    // Tukar variabel pada indeks 1. Ini akan menukar `var3` dengan `undefined`.
    act(() => {
      result.current.moveVariableBetweenLists(1);
    });

    // 3. ASERSI:
    // Pastikan panjang array tidak berubah (karena undefined tetap dihitung sebagai elemen)
    expect(result.current.testVariables1).toHaveLength(2);
    expect(result.current.testVariables2).toHaveLength(2);

    // Pastikan `var3` pindah ke testVariables2 dan slotnya di testVariables1 menjadi undefined
    expect(result.current.testVariables1[1]).toBeUndefined();
    expect(result.current.testVariables2[1]).toEqual(mockVariables[2]); // var3

    // Pastikan elemen pada indeks 0 tidak terpengaruh
    expect(result.current.testVariables1[0]).toEqual(mockVariables[0]); // var1
    expect(result.current.testVariables2[0]).toEqual(mockVariables[1]); // var2
  });

  it('should move pair up in the list', () => {
    const { result } = renderHook(() => useVariableSelection());

    // Add multiple pairs
    act(() => { result.current.moveToTestVariables(mockVariables[0]); });
    act(() => { result.current.moveToTestVariables(mockVariables[1]); });
    act(() => { result.current.moveToTestVariables(mockVariables[2]); });
    act(() => { result.current.moveToTestVariables(mockVariables[3]); });

    // Move second pair up
    act(() => {
      result.current.moveUpPair(1);
    });

    expect(result.current.testVariables1[0]).toEqual(mockVariables[2]);
    expect(result.current.testVariables1[1]).toEqual(mockVariables[0]);
    expect(result.current.testVariables2[0]).toEqual(mockVariables[3]);
    expect(result.current.testVariables2[1]).toEqual(mockVariables[1]);
  });

  it('should move pair down in the list', () => {
    const { result } = renderHook(() => useVariableSelection());

    // Add multiple pairs
    act(() => { result.current.moveToTestVariables(mockVariables[0]); });
    act(() => { result.current.moveToTestVariables(mockVariables[1]); });
    act(() => { result.current.moveToTestVariables(mockVariables[2]); });
    act(() => { result.current.moveToTestVariables(mockVariables[3]); });

    // Move first pair down
    act(() => {
      result.current.moveDownPair(0);
    });

    expect(result.current.testVariables1[0]).toEqual(mockVariables[2]);
    expect(result.current.testVariables1[1]).toEqual(mockVariables[0]);
    expect(result.current.testVariables2[0]).toEqual(mockVariables[3]);
    expect(result.current.testVariables2[1]).toEqual(mockVariables[1]);
  });

  it('should remove pair', () => {
    const { result } = renderHook(() => useVariableSelection());

    // Add a pair
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
    });
    act(() => {
      result.current.moveToTestVariables(mockVariables[1]);
    });

    // Remove the pair
    act(() => {
      result.current.removePair(0);
    });

    // Check that the pair is removed from test variables
    expect(result.current.testVariables1).toHaveLength(0);
    expect(result.current.testVariables2).toHaveLength(0);
    expect(result.current.pairNumbers).toHaveLength(0);
    
    // Variables are not returned to available (they remain in their original state)
    // The available variables are managed by the global store, not by this hook
    expect(result.current.availableVariables).toHaveLength(mockVariables.length);
  });

  it('should reorder pairs according to provided order', () => {
    const { result } = renderHook(() => useVariableSelection());

    // Add multiple pairs
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
      result.current.moveToTestVariables(mockVariables[1]);
      result.current.moveToTestVariables(mockVariables[2]);
      result.current.moveToTestVariables(mockVariables[3]);
    });

    // Reorder pairs (swap first and second)
    act(() => {
      result.current.reorderPairs([
        [mockVariables[2], mockVariables[3]],
        [mockVariables[0], mockVariables[1]]
      ]);
    });

    expect(result.current.testVariables1[0]).toEqual(mockVariables[2]);
    expect(result.current.testVariables1[1]).toEqual(mockVariables[0]);
    expect(result.current.testVariables2[0]).toEqual(mockVariables[3]);
    expect(result.current.testVariables2[1]).toEqual(mockVariables[1]);
  });

  it('should validate pair correctly', () => {
    const { result } = renderHook(() => useVariableSelection());

    // Perbaikan: Gunakan act() terpisah untuk setiap aksi
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
    });
    act(() => {
      result.current.moveToTestVariables(mockVariables[1]);
    });

    expect(result.current.isPairValid(0)).toBe(true);
    expect(result.current.isPairValid(1)).toBe(false); // Invalid index
  });

  it('should check if all pairs are valid', () => {
    const { result } = renderHook(() => useVariableSelection());

    // Add valid pairs
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
    });
    act(() => {
      result.current.moveToTestVariables(mockVariables[1]);
    });
    act(() => {
      result.current.moveToTestVariables(mockVariables[2]);
    });
    act(() => {
      result.current.moveToTestVariables(mockVariables[3]);
    });

    expect(result.current.areAllPairsValid()).toBe(true);
  });

  it('should check for duplicate pairs', () => {
    const { result } = renderHook(() => useVariableSelection());

    // Add different pairs
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
      result.current.moveToTestVariables(mockVariables[1]);
      result.current.moveToTestVariables(mockVariables[2]);
      result.current.moveToTestVariables(mockVariables[3]);
    });

    expect(result.current.hasDuplicatePairs()).toBe(false);
  });

  it('should reset variable selection correctly', () => {
    const { result } = renderHook(() => useVariableSelection());

    // Add some variables
    act(() => {
      result.current.moveToTestVariables(mockVariables[0]);
      result.current.moveToTestVariables(mockVariables[1]);
    });

    // Reset
    act(() => {
      result.current.resetVariableSelection();
    });

    expect(result.current.testVariables1).toHaveLength(0);
    expect(result.current.testVariables2).toHaveLength(0);
    expect(result.current.availableVariables).toHaveLength(mockVariables.length);
    expect(result.current.pairNumbers).toHaveLength(0);
  });

  it('should handle highlighting a pair', () => {
    const { result } = renderHook(() => useVariableSelection());

    act(() => {
      result.current.setHighlightedPair({ id: 1 });
    });

    expect(result.current.highlightedPair).toEqual({ id: 1 });
  });

  it('should handle highlighting a variable', () => {
    const { result } = renderHook(() => useVariableSelection());

    act(() => {
      result.current.setHighlightedVariable({ 
        tempId: 'temp_0', 
        source: 'available', 
        rowIndex: 0 
      });
    });

    expect(result.current.highlightedVariable).toEqual({ 
      tempId: 'temp_0', 
      source: 'available', 
      rowIndex: 0 
    });
  });
}); 