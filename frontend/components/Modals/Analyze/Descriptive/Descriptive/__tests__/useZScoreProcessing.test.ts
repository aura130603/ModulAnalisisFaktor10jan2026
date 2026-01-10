import { renderHook, act } from '@testing-library/react';
import { useZScoreProcessing } from '../hooks/useZScoreProcessing';
import { useVariableStore } from '@/stores/useVariableStore';
import { useDataStore } from '@/stores/useDataStore';

// ------------------------------
// Mock the global stores accessed via getState
// ------------------------------
const mockAddVariables = jest.fn().mockResolvedValue(undefined);
const mockUpdateCells = jest.fn().mockResolvedValue(undefined);

function createMockVariableStore(variables: any[]) {
  return {
    variables,
    addVariables: mockAddVariables,
  } as any;
}

function createMockDataStore() {
  return {
    updateCells: mockUpdateCells,
  } as any;
}

jest.mock('@/stores/useVariableStore', () => {
  const storeFn: any = jest.fn();
  storeFn.getState = () => createMockVariableStore([]);
  return {
    __esModule: true,
    useVariableStore: storeFn,
  };
});

jest.mock('@/stores/useDataStore', () => {
  const storeFn: any = jest.fn();
  storeFn.getState = () => createMockDataStore();
  return {
    __esModule: true,
    useDataStore: storeFn,
  };
});

const mockedUseVariableStore = useVariableStore as unknown as jest.Mock;
const mockedUseDataStore = useDataStore as unknown as jest.Mock;

// ------------------------------
// Helper data
// ------------------------------
const baseVariable = {
  name: 'var1',
  label: 'Variable 1',
  type: 'NUMERIC',
  decimals: 2,
  columnIndex: 0,
};

const zScoreDataNew = {
  var1: {
    scores: [1.5, -0.5],
    variableInfo: {
      name: 'Zvar1',
      label: 'Zscore(var1)'
    },
  },
};

const zScoreDataExisting = {
  var1: {
    scores: [0.1, 0.2],
    variableInfo: {
      name: 'Zvar1',
      label: 'Zscore(var1)'
    },
  },
};

// ------------------------------
// Tests
// ------------------------------
describe('useZScoreProcessing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a new Z-score variable via addVariables', async () => {
    (mockedUseVariableStore as any).getState = () => createMockVariableStore([]);
    (mockedUseDataStore as any).getState = () => createMockDataStore();

    const setErrorMsg = jest.fn();
    const { result } = renderHook(() => useZScoreProcessing({ setErrorMsg }));

    await act(async () => {
      const created = await result.current.processZScoreData(zScoreDataNew as any);
      expect(created).toBe(1);
    });

    expect(mockAddVariables).toHaveBeenCalledTimes(1);
    expect(mockAddVariables.mock.calls[0][0][0]).toMatchObject({ name: 'Zvar1' });
    expect(mockUpdateCells).not.toHaveBeenCalled();
    expect(setErrorMsg).not.toHaveBeenCalled();
  });

  it('updates existing Z-score variable via updateCells', async () => {
    const existingVar = { ...baseVariable, name: 'Zvar1', columnIndex: 3 };
    (mockedUseVariableStore as any).getState = () => createMockVariableStore([existingVar]);
    (mockedUseDataStore as any).getState = () => createMockDataStore();

    const setErrorMsg = jest.fn();
    const { result } = renderHook(() => useZScoreProcessing({ setErrorMsg }));

    await act(async () => {
      const created = await result.current.processZScoreData(zScoreDataExisting as any);
      expect(created).toBe(0);
    });

    expect(mockAddVariables).not.toHaveBeenCalled();
    expect(mockUpdateCells).toHaveBeenCalledTimes(1);
  });
}); 