import { renderHook, act } from '@testing-library/react';
import { useExampleDatasetLogic } from '../hooks/useExampleDatasetLogic';
import * as services from '../services/services';
import * as utils from '@/utils/savFileUtils';

// Mocks for external dependencies ----------------------------------

const overwriteAllMock = jest.fn();
jest.mock('@/stores/useVariableStore', () => ({
  useVariableStore: () => ({ overwriteAll: overwriteAllMock }),
}));

const resetDataMock = jest.fn();
const setDataMock = jest.fn();
jest.mock('@/stores/useDataStore', () => ({
  useDataStore: () => ({ resetData: resetDataMock, setData: setDataMock }),
}));

const setMetaMock = jest.fn();
jest.mock('@/stores/useMetaStore', () => ({
  useMetaStore: () => ({ setMeta: setMetaMock }),
}));

const processSavFileFromUrlMock = jest.fn();
jest.mock('../services/services', () => ({
  processSavFileFromUrl: jest.fn(),
}));

const processSavApiResponseMock = jest.fn();
jest.mock('@/utils/savFileUtils', () => ({
  processSavApiResponse: jest.fn(),
}));

// -------------------------------------------------------------------

describe('useExampleDatasetLogic hook', () => {
  const mockOnClose = jest.fn();
  const filePath = '/exampleData/accidents.sav';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('successfully loads a dataset and updates stores', async () => {
    // Arrange mocks
    (services.processSavFileFromUrl as jest.Mock).mockResolvedValue('raw-response');
    const parsedResult = {
      variables: [{ name: 'v1' }],
      dataMatrix: [[1]],
      metaHeader: { created: '2023-01-01T00:00:00Z' },
    };
    (utils.processSavApiResponse as jest.Mock).mockReturnValue(parsedResult);

    const { result } = renderHook(() => useExampleDatasetLogic({ onClose: mockOnClose }));

    // Act
    await act(async () => {
      await result.current.loadDataset(filePath);
    });

    // Assert
    expect(resetDataMock).toHaveBeenCalledTimes(1);
    expect(services.processSavFileFromUrl).toHaveBeenCalledWith(filePath);
    expect(utils.processSavApiResponse).toHaveBeenCalledWith('raw-response');
    expect(overwriteAllMock).toHaveBeenCalledWith(parsedResult.variables, parsedResult.dataMatrix);
    expect(setMetaMock).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('handles errors and sets error state', async () => {
    const errorMessage = 'Network error';
    (services.processSavFileFromUrl as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useExampleDatasetLogic({ onClose: mockOnClose }));

    await act(async () => {
      await result.current.loadDataset(filePath);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.isLoading).toBe(false);
    // Should NOT call store updates
    expect(overwriteAllMock).not.toHaveBeenCalled();
    expect(setMetaMock).not.toHaveBeenCalled();
    // onClose should not be called on failure
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('sets loading state correctly during data fetch', async () => {
    // Arrange: Mock service to return a promise that we can control
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise(resolve => {
        resolvePromise = resolve;
    });
    (services.processSavFileFromUrl as jest.Mock).mockReturnValue(promise);
    
    const { result } = renderHook(() => useExampleDatasetLogic({ onClose: mockOnClose }));

    // Act: Initiate the loading, but don't wait for it to finish yet
    act(() => {
        result.current.loadDataset(filePath);
    });

    // Assert: Check that loading is immediately set to true
    expect(result.current.isLoading).toBe(true);

    // Act: Now, resolve the promise and wait for the hook to finish
    await act(async () => {
        resolvePromise('raw-response');
        await promise;
    });

    // Assert: Check that loading is set back to false
    expect(result.current.isLoading).toBe(false);
  });
}); 