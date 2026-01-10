import { renderHook, act } from '@testing-library/react';
import { useCsvWorker } from '../useCsvWorker';
import { parseCsvWithWorker } from '../../services/services';
import type { CSVProcessingOptions } from '../../types';
import type { ProcessedCsvData } from '../../services/services';

// Mock the service dependency
jest.mock('../../services/services', () => ({
  parseCsvWithWorker: jest.fn(),
}));

const mockParseCsvWithWorker = parseCsvWithWorker as jest.Mock;

describe('useCsvWorker', () => {
  const fileContent = 'a,b\nc,d';
  const options: CSVProcessingOptions = { 
    delimiter: 'comma', 
    firstLineContains: true, 
    removeLeading: false, 
    removeTrailing: false, 
    decimal: 'period', 
    textQualifier: 'doubleQuote' 
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have correct initial state', () => {
    const { result } = renderHook(() => useCsvWorker());
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle successful parsing', async () => {
    const mockData = { rows: [], variables: [], preview: [] };
    mockParseCsvWithWorker.mockResolvedValue(mockData);

    const { result } = renderHook(() => useCsvWorker());

    let parsePromise: Promise<ProcessedCsvData>;
    act(() => {
      parsePromise = result.current.parse(fileContent, options);
    });

    // Check intermediate state
    expect(result.current.isProcessing).toBe(true);
    expect(result.current.error).toBeNull();

    // Wait for the promise to resolve and check its value
    await act(async () => {
      await expect(parsePromise).resolves.toEqual(mockData);
    });

    // Check final state
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockParseCsvWithWorker).toHaveBeenCalledWith(fileContent, options);
  });

  it('should handle parsing errors', async () => {
    const errorMessage = 'Worker failed';
    mockParseCsvWithWorker.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useCsvWorker());

    let parsePromise: Promise<ProcessedCsvData>;
    act(() => {
      parsePromise = result.current.parse(fileContent, options);
    });

    // Check intermediate state
    expect(result.current.isProcessing).toBe(true);

    // Wait for the promise to reject
    await act(async () => {
      await expect(parsePromise).rejects.toThrow(errorMessage);
    });

    // Check final state
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });
});
