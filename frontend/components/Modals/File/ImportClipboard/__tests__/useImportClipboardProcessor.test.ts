import { renderHook, act } from '@testing-library/react';
import { useImportClipboardProcessor } from '../hooks/useImportClipboardProcessor';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import * as utils from '../importClipboard.utils';
import type { ClipboardProcessingOptions } from '../types';

// Mock dependencies
jest.mock('@/stores/useDataStore');
jest.mock('@/stores/useVariableStore');
jest.mock('../importClipboard.utils', () => ({
  ...jest.requireActual('../importClipboard.utils'), // Keep actual implementation for some utils
  excelStyleTextToColumns: jest.fn(),
}));

const mockedUseDataStore = useDataStore as jest.Mocked<typeof useDataStore>;
const mockedUseVariableStore = useVariableStore as jest.Mocked<typeof useVariableStore>;

const mockOverwriteAll = jest.fn();
const mockedExcelStyleParser = utils.excelStyleTextToColumns as jest.Mock;

(useDataStore as unknown as jest.Mock).mockReturnValue({ });
(useVariableStore as unknown as jest.Mock).mockReturnValue({ overwriteAll: mockOverwriteAll });

describe('useImportClipboardProcessor', () => {
  const mockSetData = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useDataStore as unknown as jest.Mock).mockReturnValue({ setData: mockSetData });
    (useVariableStore as unknown as jest.Mock).mockReturnValue({ overwriteAll: mockOverwriteAll });
  });

  const sampleText = 'ID,Name\n1,Alice\n2,Bob';
  const parsedData = [['ID', 'Name'], ['1', 'Alice'], ['2', 'Bob']];

  const defaultOptions: ClipboardProcessingOptions = {
    delimiter: 'tab',
    firstRowAsHeader: false,
    trimWhitespace: true,
    skipEmptyRows: true,
    detectDataTypes: true,
  };

  it('should process tab-separated data correctly without headers', async () => {
    const { result } = renderHook(() => useImportClipboardProcessor());
    const text = 'val1\t100\nval2\t200';
    mockedExcelStyleParser.mockReturnValue([['val1', '100'], ['val2', '200']]);

    await act(async () => {
      await result.current.processClipboardData(text, defaultOptions);
    });

    expect(mockOverwriteAll).toHaveBeenCalledTimes(1);
    const [variables, data] = mockOverwriteAll.mock.calls[0];

    expect(variables).toHaveLength(2);
    expect(variables[0].name).toBe('VAR001');
    expect(variables[0].type).toBe('STRING');
    expect(variables[1].name).toBe('VAR002');
    expect(variables[1].type).toBe('NUMERIC');
    expect(data).toEqual([['val1', '100'], ['val2', '200']]);
  });

  it('should process comma-separated data with a header row', async () => {
    const { result } = renderHook(() => useImportClipboardProcessor());
    const text = 'Name,Age\nAlice,30\nBob,25';
    mockedExcelStyleParser.mockReturnValue([['Name', 'Age'], ['Alice', '30'], ['Bob', '25']]);
    const options: ClipboardProcessingOptions = {
      ...defaultOptions,
      delimiter: 'comma',
      firstRowAsHeader: true,
    };

    await act(async () => {
      await result.current.processClipboardData(text, options);
    });

    const [variables, data] = mockOverwriteAll.mock.calls[0];

    expect(variables).toHaveLength(2);
    expect(variables[0].name).toBe('Name');
    expect(variables[0].type).toBe('STRING');
    expect(variables[1].name).toBe('Age');
    expect(variables[1].type).toBe('NUMERIC');
    expect(data).toEqual([['Alice', '30'], ['Bob', '25']]);
  });

  it('should throw an error for empty text input', async () => {
    const { result } = renderHook(() => useImportClipboardProcessor());
    await expect(result.current.processClipboardData('', defaultOptions)).rejects.toThrow('No text data provided');
  });

  it('should throw an error if parsing results in no data', async () => {
    const { result } = renderHook(() => useImportClipboardProcessor());
    // This text only contains whitespace, which will be skipped
    const text = '\n  \n\t\n ';
    mockedExcelStyleParser.mockReturnValue([]);
    await expect(result.current.processClipboardData(text, defaultOptions)).rejects.toThrow('No valid data found in the pasted text');
  });
  
  it('should use pre-processed data if provided via excelProcessedData option', async () => {
    const { result } = renderHook(() => useImportClipboardProcessor());
    const text = 'this should be ignored';
    const excelData = [['pre-processed', 'data'], ['row1', '123']];
    const options: ClipboardProcessingOptions = {
      ...defaultOptions,
      firstRowAsHeader: true,
      excelProcessedData: excelData,
    };

    await act(async () => {
      await result.current.processClipboardData(text, options);
    });

    const [variables, data] = mockOverwriteAll.mock.calls[0];
    expect(variables).toHaveLength(2);
    expect(variables[0].name).toBe('pre-processed');
    expect(variables[1].name).toBe('data');
    expect(data).toEqual([['row1', '123']]);
  });
}); 