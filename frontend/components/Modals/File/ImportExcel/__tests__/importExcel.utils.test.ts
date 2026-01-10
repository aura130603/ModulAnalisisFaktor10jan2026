import {
  parseSheetForPreview,
  processSheetForImport,
  generateVariablesFromData,
} from '../importExcel.utils';
import * as XLSX from 'xlsx';

// Helper to create a mock workbook for testing
const createMockWorkbook = (data: Record<string, unknown[][]>) => {
  const wb = XLSX.utils.book_new();
  Object.keys(data).forEach(sheetName => {
    const ws = XLSX.utils.aoa_to_sheet(data[sheetName]);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });
  return wb;
};

const mockSheetData = [
  ['Name', 'Age', 'City'],
  ['Alice', 30, 'New York'],
  ['Bob', 25, 'Los Angeles'],
  ['', 35, 'Chicago'], // Empty name
  ['David', null, 'Houston'], // Null age (will be SYSMIS)
];

const mockWorkbook = createMockWorkbook({ 'Sheet1': mockSheetData });

describe('importExcel.utils', () => {

  describe('parseSheetForPreview', () => {
    it('should parse sheet with headers', () => {
      const result = parseSheetForPreview(mockWorkbook, 'Sheet1', { firstLineContains: true, readHiddenRowsCols: false, readEmptyCellsAs: 'empty' });
      expect(result.headers).toEqual(['Name', 'Age', 'City']);
      expect(result.data.length).toBe(4);
      expect(result.data[0]).toEqual(['Alice', 30, 'New York']);
    });

    it('should parse sheet without headers', () => {
      const result = parseSheetForPreview(mockWorkbook, 'Sheet1', { firstLineContains: false, readHiddenRowsCols: false, readEmptyCellsAs: 'empty' });
      expect(result.headers).toEqual(['A', 'B', 'C']);
      expect(result.data.length).toBe(5); // includes header row as data
      expect(result.data[0]).toEqual(['Name', 'Age', 'City']);
    });
  });

  describe('processSheetForImport', () => {
    it('should process full sheet with headers', () => {
      const result = processSheetForImport(mockWorkbook, 'Sheet1', { firstLineContains: true, readHiddenRowsCols: false, readEmptyCellsAs: 'empty' });
      expect(result.actualHeaders).toEqual(['Name', 'Age', 'City']);
      expect(result.processedFullData.length).toBe(4);
      expect(result.processedFullData[0]).toEqual(['Alice', 30, 'New York']);
    });

    it('should handle "readEmptyCellsAs" missing option', () => {
      const result = processSheetForImport(mockWorkbook, 'Sheet1', { firstLineContains: true, readHiddenRowsCols: false, readEmptyCellsAs: 'missing' });
      expect(result.processedFullData[2]).toEqual(['', 35, 'Chicago']); // Empty string is preserved
      expect(result.processedFullData[3]).toEqual(['David', 'SYSMIS', 'Houston']); // Null becomes SYSMIS
    });
  });

  describe('generateVariablesFromData', () => {
    const { processedFullData, actualHeaders } = processSheetForImport(mockWorkbook, 'Sheet1', { firstLineContains: true, readHiddenRowsCols: false, readEmptyCellsAs: 'missing' });

    it('should generate correct variables', () => {
      const variables = generateVariablesFromData(processedFullData, actualHeaders, 'missing');
      expect(variables.length).toBe(3);
      
      const nameVar = variables.find(v => v.name === 'Name');
      const ageVar = variables.find(v => v.name === 'Age');
      const cityVar = variables.find(v => v.name === 'City');

      expect(nameVar?.type).toBe('STRING');
      expect(ageVar?.type).toBe('NUMERIC');
      expect(cityVar?.type).toBe('STRING');
    });

    it('should correctly determine numeric vs string types', () => {
      const data = [['1'], ['2.5'], ['invalid'], ['4']];
      const headers = ['MixedData'];
      const variables = generateVariablesFromData(data, headers, 'empty');
      expect(variables[0].type).toBe('STRING');

      const numericData = [['1'], ['2.5'], [null], ['4']];
      const numericHeaders = ['NumericData'];
      const numericVars = generateVariablesFromData(numericData, numericHeaders, 'missing');
      expect(numericVars[0].type).toBe('NUMERIC');
    });
    
    it('should generate default variable names for empty headers', () => {
        const data = [['val1'], ['val2']];
        const headers = [''];
        const variables = generateVariablesFromData(data, headers, 'empty');
        expect(variables[0].name).toMatch(/VAR\d{3}/);
    });
  });
}); 