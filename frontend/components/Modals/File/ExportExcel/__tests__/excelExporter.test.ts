import { generateExcelWorkbook } from '../utils/excelExporter';
import type { DataRow } from '@/types/Data';
import type { Variable } from '@/types/Variable';
import type { ExcelUtilOptions } from '../types';
import * as XLSX from 'xlsx';

// Mock the XLSX library to inspect its usage without creating actual files
jest.mock('xlsx', () => ({
  utils: {
    book_new: jest.fn(() => ({ SheetNames: [], Sheets: {} })),
    aoa_to_sheet: jest.fn(data => ({ '!ref': `A1:B${data.length}` })),
    book_append_sheet: jest.fn(),
  },
}));

const mockedXLSXUtils = XLSX.utils as jest.Mocked<typeof XLSX.utils>;

describe('generateExcelWorkbook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockVariables: Variable[] = [
    { name: 'ID', columnIndex: 0, type: 'NUMERIC', measure: 'nominal', values: [], width: 8, decimals: 0, label: '', columns: 8, align: 'right', role: 'input', missing: null },
    { name: 'Name', columnIndex: 1, type: 'STRING', measure: 'nominal', values: [{value: 1, label: 'One', variableId: 1}], width: 8, decimals: 0, label: 'The Name', columns: 8, align: 'left', role: 'input', missing: null },
  ];
  const mockData: DataRow[] = [
    [1, 'Alice'],
    [2, 'Bob'],
  ];
  const mockMeta = { project: 'Test Project' };
  const defaultOptions: ExcelUtilOptions = {
    includeHeaders: true,
    includeVariablePropertiesSheet: true,
    includeMetadataSheet: true,
    includeDataLabels: false,
    applyHeaderStyling: true,
  };

  it('should create a new workbook', () => {
    generateExcelWorkbook(mockData, mockVariables, mockMeta, defaultOptions);
    expect(mockedXLSXUtils.book_new).toHaveBeenCalledTimes(1);
  });

  it('should create Data sheet with headers if specified', () => {
    generateExcelWorkbook(mockData, mockVariables, mockMeta, { ...defaultOptions, includeHeaders: true });
    expect(mockedXLSXUtils.aoa_to_sheet).toHaveBeenCalledWith([
      ['ID', 'Name'],
      [1, 'Alice'],
      [2, 'Bob'],
    ]);
    expect(mockedXLSXUtils.book_append_sheet).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), 'Data');
  });

  it('should create Data sheet without headers if not specified', () => {
    generateExcelWorkbook(mockData, mockVariables, mockMeta, { ...defaultOptions, includeHeaders: false });
    expect(mockedXLSXUtils.aoa_to_sheet).toHaveBeenCalledWith([
      [1, 'Alice'],
      [2, 'Bob'],
    ]);
  });

  it('should create Variable Properties sheet with correct data if specified', () => {
    generateExcelWorkbook(mockData, mockVariables, mockMeta, { ...defaultOptions, includeVariablePropertiesSheet: true });
    
    const varPropsCall = mockedXLSXUtils.aoa_to_sheet.mock.calls.find(call => {
        const data = call[0] as any[][];
        return data[0] && data[0][0] === 'Index' && data[0][1] === 'Name';
    });

    expect(varPropsCall).toBeDefined();
    const varPropsData = varPropsCall![0];

    expect(varPropsData[0]).toEqual(['Index', 'Name', 'Type', 'Label', 'Measure', 'Width', 'Decimals', 'Values', 'Missing']);
    expect(varPropsData[1]).toEqual([0, 'ID', 'NUMERIC', '', 'nominal', 8, 0, '', '']);
    expect(varPropsData[2]).toEqual([1, 'Name', 'STRING', 'The Name', 'nominal', 8, 0, '1=One', '']);
    expect(mockedXLSXUtils.book_append_sheet).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), 'VariableProperties');
  });

  it('should not create Variable Properties sheet if not specified', () => {
    generateExcelWorkbook(mockData, mockVariables, mockMeta, { ...defaultOptions, includeVariablePropertiesSheet: false });
    const varPropsCall = mockedXLSXUtils.aoa_to_sheet.mock.calls.find(call => {
        const data = call[0] as any[][];
        return data[0] && data[0][0] === 'Index';
    });
    expect(varPropsCall).toBeUndefined();
  });

  it('should create Metadata sheet with correct data if specified and meta is available', () => {
    generateExcelWorkbook(mockData, mockVariables, mockMeta, { ...defaultOptions, includeMetadataSheet: true });
    
    const metadataCall = mockedXLSXUtils.aoa_to_sheet.mock.calls.find(call => {
        const data = call[0] as any[][];
        return data[0] && data[0][0] === 'Property' && data[0][1] === 'Value';
    });
    
    expect(metadataCall).toBeDefined();
    const metadataSheetData = metadataCall![0];

    expect(metadataSheetData).toEqual([['Property', 'Value'], ['project', 'Test Project']]);
    expect(mockedXLSXUtils.book_append_sheet).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), 'Metadata');
  });

  it('should not create Metadata sheet if not specified', () => {
    generateExcelWorkbook(mockData, mockVariables, mockMeta, { ...defaultOptions, includeMetadataSheet: false });
    const metadataCall = mockedXLSXUtils.aoa_to_sheet.mock.calls.find(call => {
        const data = call[0] as any[][];
        return data[0] && data[0][0] === 'Property';
    });
    expect(metadataCall).toBeUndefined();
  });

  it('should not create Metadata sheet if meta is null', () => {
    generateExcelWorkbook(mockData, mockVariables, null, { ...defaultOptions, includeMetadataSheet: true });
    const metadataCall = mockedXLSXUtils.aoa_to_sheet.mock.calls.find(call => {
        const data = call[0] as any[][];
        return data[0] && data[0][0] === 'Property';
    });
    expect(metadataCall).toBeUndefined();
  });

  it('should represent missing data with SYSMIS text when option is true', () => {
    const dataWithMissing: DataRow[] = [[1, null]];
    generateExcelWorkbook(dataWithMissing, mockVariables, null, { ...defaultOptions, includeDataLabels: true, includeHeaders: false });
    expect(mockedXLSXUtils.aoa_to_sheet).toHaveBeenCalledWith([
        [1, 'SYSMIS'],
    ]);
  });
}); 