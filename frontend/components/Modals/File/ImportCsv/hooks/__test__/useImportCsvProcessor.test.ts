import { renderHook, act } from '@testing-library/react';
import { useImportCsvProcessor } from '../useImportCsvProcessor';
import { importCsvDataService, parseCsvWithWorker } from '../../services/services';
import type { CSVProcessingOptions } from '../../types';

// Mock the entire services module
jest.mock('../../services/services', () => ({
  importCsvDataService: {
    populateStores: jest.fn(),
  },
  parseCsvWithWorker: jest.fn(),
}));

// Typecast the mocked functions for better type safety in tests
const mockPopulateStores = importCsvDataService.populateStores as jest.Mock;
const mockParseCsvWithWorker = parseCsvWithWorker as jest.Mock;

describe('useImportCsvProcessor', () => {
  beforeEach(() => {
    // Clear all mock history and implementations before each test
    jest.clearAllMocks();
  });

  const fileContent = 'header1,header2\nvalue1,value2';
  const options: CSVProcessingOptions = { delimiter: 'comma', firstLineContains: true, removeLeading: false, removeTrailing: false, decimal: 'period', textQualifier: 'doubleQuote' };
  const mockProcessedData = { 
    rows: [{ id: '1', values: { header1: 'value1', header2: 'value2' } }], 
    variables: [{ id: 'header1', name: 'header1' }, { id: 'header2', name: 'header2' }],
    preview: [['header1', 'header2'], ['value1', 'value2']]
  };

  it('should orchestrate the CSV processing flow successfully', async () => {
    mockParseCsvWithWorker.mockResolvedValue(mockProcessedData);
    mockPopulateStores.mockResolvedValue(undefined);

    const { result } = renderHook(() => useImportCsvProcessor());

    // Initial state
    expect(result.current.isProcessing).toBe(false);

    // Start processing
    let processPromise: Promise<any>;
    act(() => {
      processPromise = result.current.processCSV({ fileContent, options });
    });

    // State while processing
    expect(result.current.isProcessing).toBe(true);
    
    await act(async () => {
        await processPromise;
    });

    // Assertions for the flow
    expect(mockParseCsvWithWorker).toHaveBeenCalledWith(fileContent, options);
    expect(mockPopulateStores).toHaveBeenCalledWith(mockProcessedData);

    // Final state
    expect(result.current.isProcessing).toBe(false);
  });

  it('should handle errors from the CSV worker', async () => {
    const errorMessage = 'Error parsing CSV';
    mockParseCsvWithWorker.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useImportCsvProcessor());

    await act(async () => {
        await expect(result.current.processCSV({ fileContent, options })).rejects.toThrow(errorMessage);
    });

    expect(result.current.isProcessing).toBe(false);
    expect(mockPopulateStores).not.toHaveBeenCalled();
  });

  it('should handle errors from populating the store', async () => {
    const errorMessage = 'Error populating store';
    mockParseCsvWithWorker.mockResolvedValue(mockProcessedData);
    mockPopulateStores.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useImportCsvProcessor());

    await act(async () => {
        await expect(result.current.processCSV({ fileContent, options })).rejects.toThrow(errorMessage);
    });

    expect(result.current.isProcessing).toBe(false);
    expect(mockParseCsvWithWorker).toHaveBeenCalledWith(fileContent, options);
  });
});
