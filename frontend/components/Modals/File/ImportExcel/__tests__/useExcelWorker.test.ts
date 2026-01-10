import { renderHook, act } from '@testing-library/react';
import { useExcelWorker } from '../hooks/useExcelWorker';
import * as services from '../services/services';

// Mock the service that interacts with the worker
jest.mock('../services/services');
const mockedParseExcelWithWorker = services.parseExcelWithWorker as jest.Mock;

describe('useExcelWorker hook', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle the full lifecycle: parsing, success', async () => {
    const mockFile = new File([''], 'test.xlsx');
    const mockResult = [{ sheetName: 'Sheet1', data: [['a']] }];
    
    mockedParseExcelWithWorker.mockResolvedValue(mockResult);
    
    const { result } = renderHook(() => useExcelWorker());
    
    let promise;
    act(() => {
      promise = result.current.parse(mockFile);
    });

    // Check initial state after calling parse
    expect(result.current.isParsing).toBe(true);
    expect(result.current.error).toBeNull();
    
    await act(async () => {
        await promise;
    });

    // Check final state after promise resolves
    expect(result.current.isParsing).toBe(false);
    expect(result.current.error).toBeNull();
    
    // Ensure the service was called
    expect(mockedParseExcelWithWorker).toHaveBeenCalledWith(mockFile);
  });

  it('should handle the full lifecycle: parsing, failure', async () => {
    const mockFile = new File([''], 'test.xlsx');
    const errorMessage = 'Failed to parse';
    
    mockedParseExcelWithWorker.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useExcelWorker());

    let promise;
    act(() => {
      promise = result.current.parse(mockFile);
    });
    
    // Initial state
    expect(result.current.isParsing).toBe(true);
    expect(result.current.error).toBeNull();

    await act(async () => {
        // We need to catch the rejection to prevent Jest from failing the test
        await promise.catch(() => null);
    });
    
    // Final state after rejection
    expect(result.current.isParsing).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

}); 