import { formatStatisticsTable, formatFrequencyTable } from '../utils/formatters';
import type { FrequenciesResult, FrequencyTable } from '../types';
import type { Variable } from '@/types/Variable';

const mockVar1: Variable = { name: 'var1', label: 'Variable 1', columnIndex: 0, type: 'NUMERIC' } as Variable;
const mockVar2: Variable = { name: 'var2', label: 'Variable 2', columnIndex: 1, type: 'NUMERIC' } as Variable;
const mockDateVar: Variable = { name: 'datevar', label: 'Date Variable', columnIndex: 2, type: 'DATE' } as Variable;

describe('Frequencies Formatters', () => {

  describe('formatStatisticsTable', () => {
    it('should format statistics results into a valid table structure', () => {
      const mockResults: FrequenciesResult[] = [
        {
          variable: mockVar1,
          stats: { N: 100, Missing: 5, Mean: 50.5, StdDev: 10.2, Percentiles: { '25': 40, '50': 50, '75': 60 } }
        },
        {
          variable: mockVar2,
          stats: { N: 100, Missing: 2, Mean: 25.0, StdDev: 5.1, Percentiles: { '25': 20, '50': 25, '75': 30 } }
        }
      ];

      const formatted = formatStatisticsTable(mockResults);
      const table = formatted.tables[0];
      
      expect(table.title).toBe('Statistics');
      expect(table.columnHeaders).toHaveLength(4);
      expect(table.columnHeaders[2].header).toBe('Variable 1');
      expect(table.rows.length).toBeGreaterThan(5); // Check for a reasonable number of rows

      // Check N (Valid)
      const nValidRow = table.rows[0].children.find((r: any) => r.rowHeader[1] === 'Valid');
      expect(nValidRow.var1).toBe('100');
    });

    it('should handle date variables correctly by hiding numerical statistics', () => {
      const mockResults: FrequenciesResult[] = [
        {
          variable: mockVar1,
          stats: { N: 100, Missing: 5, Mean: 50.5, StdDev: 10.2, Mode: [25], Percentiles: { '25': 40, '50': 50, '75': 60 } }
        },
        {
          variable: mockDateVar,
          stats: { N: 100, Missing: 2, Mean: 18628, StdDev: 365, Mode: [18628], Percentiles: { '25': 18500, '50': 18628, '75': 18750 } }
        }
      ];

      const formatted = formatStatisticsTable(mockResults);
      const table = formatted.tables[0];
      
      // Find Mean row
      const meanRow = table.rows.find((r: any) => r.rowHeader[0] === 'Mean');
      expect(meanRow.var1).toBe('50.50'); // Numeric variable should show mean
      expect(meanRow.datevar).toBe(''); // Date variable should not show mean
      
      // Find StdDev row
      const stdDevRow = table.rows.find((r: any) => r.rowHeader[0] === 'Std. Deviation');
      expect(stdDevRow.var1).toBe('10.20'); // Numeric variable should show std dev
      expect(stdDevRow.datevar).toBe(''); // Date variable should not show std dev
      
      // Find Mode row
      const modeRow = table.rows.find((r: any) => r.rowHeader[0] === 'Mode');
      expect(modeRow.var1).toBe('25.00'); // Numeric variable should show formatted mode
      expect(modeRow.datevar).toBe('18628'); // Date variable should show unformatted mode
      
      // Check percentiles
      const percentilesRow = table.rows.find((r: any) => r.rowHeader[0] === 'Percentiles');
      if (percentilesRow && percentilesRow.children) {
        const p25Row = percentilesRow.children.find((r: any) => r.rowHeader[1] === '25');
        expect(p25Row.var1).toBe('40.00'); // Numeric variable should show percentile
        expect(p25Row.datevar).toBe('.'); // Date variable should not show percentile
      }

      // Check percentiles
      const percentilesRowBasic = table.rows.find((r: any) => r.rowHeader[0] === 'Percentiles');
      expect(percentilesRowBasic.children).toHaveLength(3);
      const medianChild = percentilesRowBasic.children.find((r:any) => r.rowHeader[1] === "50");
      expect(medianChild.var1).toBe('50.00');
    });

    it('should return null if no statistics results are provided', () => {
      const formatted = formatStatisticsTable([]);
      expect(formatted).toBeNull();
    });
  });

  describe('formatFrequencyTable', () => {
    it('should format a frequency table result correctly', () => {
      const mockTable: FrequencyTable = {
        title: 'Gender Frequencies',
        rows: [
          { label: 'Female', frequency: 60, percent: 60, validPercent: 60, cumulativePercent: 60 },
          { label: 'Male', frequency: 40, percent: 40, validPercent: 40, cumulativePercent: 100 }
        ],
        summary: { valid: 100, missing: 0, total: 100 }
      };

      const formatted = formatFrequencyTable(mockTable);
      const table = formatted.tables[0];

      expect(table.title).toBe('Gender Frequencies');
      expect(table.columnHeaders).toHaveLength(6);
      
      const validRow = table.rows[0];
      expect(validRow.rowHeader).toEqual(['Valid', null]);
      expect(validRow.children).toHaveLength(3); // 2 data rows + 1 total row

      // Check first data row
      const femaleRow = validRow.children[0];
      expect(femaleRow.rowHeader).toEqual([null, 'Female']);
      expect(femaleRow.frequency).toBe(60);
      expect(femaleRow.percent).toBe('60.0');

      // Check valid total
      const validTotalRow = validRow.children[2];
      expect(validTotalRow.rowHeader).toEqual([null, 'Total']);
      expect(validTotalRow.frequency).toBe(100);
      expect(validTotalRow.validPercent).toBe('100.0');

      // Check grand total
      const grandTotalRow = table.rows[1];
      expect(grandTotalRow.rowHeader).toEqual(['Total', null]);
      expect(grandTotalRow.frequency).toBe(100);
    });

    it('should handle missing values correctly', () => {
        const mockTable: FrequencyTable = {
          title: 'Age Frequencies',
          rows: [{ label: '25', frequency: 90, percent: 90, validPercent: 100, cumulativePercent: 100 }],
          summary: { valid: 90, missing: 10, total: 100 }
        };
  
        const formatted = formatFrequencyTable(mockTable);
        const table = formatted.tables[0];
        
        // Should have a "Missing" row section
        const missingRow = table.rows[1];
        expect(missingRow.rowHeader[0]).toBe('Missing');
        expect(missingRow.children[0].frequency).toBe(10);
      });
  });
});