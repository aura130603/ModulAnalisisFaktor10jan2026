import type { TableData } from '../print.utils';
import { generateAutoTableDataFromString } from '../print.utils';

// Mock data based on a realistic structure from an analysis result
const mockStatisticsData: { tables: TableData[] } = {
  tables: [
    {
      title: 'Descriptive Statistics',
      columnHeaders: [
        { header: '' },
        { header: 'N' },
        { header: 'Minimum' },
        { header: 'Maximum' },
        { header: 'Mean' },
        { header: 'Std. Deviation' },
      ],
      rows: [
        {
          rowHeader: ['Age of Respondent'],
          'N': 100,
          'Minimum': 25,
          'Maximum': 65,
          'Mean': 45.5,
          'Std. Deviation': 10.2,
        },
        {
          rowHeader: ['Income Level (in thousands)'],
          'N': 98,
          'Minimum': 30,
          'Maximum': 150,
          'Mean': 75.8,
          'Std. Deviation': 25.4,
        },
        {
          rowHeader: ['Valid N (listwise)'],
          'N': 98,
        },
      ],
    },
    {
        title: 'Frequency Table',
        columnHeaders: [
            { header: '' },
            { header: 'Frequency' },
            { header: 'Percent' },
            { header: 'Valid Percent' },
            { header: 'Cumulative Percent' },
        ],
        rows: [
            {
                rowHeader: ['Gender', 'Male'],
                Frequency: 50,
                Percent: 50.0,
                'Valid Percent': 50.0,
                'Cumulative Percent': 50.0,
            },
            {
                rowHeader: ['Gender', 'Female'],
                Frequency: 50,
                Percent: 50.0,
                'Valid Percent': 50.0,
                'Cumulative Percent': 100.0,
            },
            {
                rowHeader: ['Gender', 'Total'],
                Frequency: 100,
                Percent: 100.0,
                'Valid Percent': 100.0,
            },
        ],
    },
  ],
};

const mockEmptyTable = {
    tables: [{
        title: "Empty Table",
        columnHeaders: [{header: 'Col1'}],
        rows: []
    }]
};

describe('print.utils', () => {
  describe('generateAutoTableDataFromString', () => {
    it('should return empty tables array for invalid JSON', () => {
      const result = generateAutoTableDataFromString('invalid-json');
      expect(result.tables).toEqual([]);
    });

    it('should correctly parse a simple table structure', () => {
      const jsonData = JSON.stringify({ tables: [mockStatisticsData.tables[0]] });
      const result = generateAutoTableDataFromString(jsonData);

      expect(result.tables).toHaveLength(1);
      const table = result.tables[0];
      expect(table.title).toBe('Descriptive Statistics');

      // Check header
      expect(table.head).toHaveLength(1);
      expect(table.head[0].map(h => h.content)).toEqual([
        '', 'N', 'Minimum', 'Maximum', 'Mean', 'Std. Deviation'
      ]);

      // Check body
      expect(table.body).toHaveLength(3);
      expect(table.body[0][0].content).toBe('Age of Respondent');
      expect(table.body[0][1].content).toBe('100');
      expect(table.body[2][0].content).toBe('Valid N (listwise)');
      expect(table.body[2][1].content).toBe('98');
      expect(table.body[2][2].content).toBe(''); // Null/undefined values should be empty strings
    });

    it('should handle nested row headers correctly', () => {
        const jsonData = JSON.stringify({ tables: [mockStatisticsData.tables[1]] });
        const result = generateAutoTableDataFromString(jsonData);

        expect(result.tables).toHaveLength(1);
        const table = result.tables[0];
        expect(table.title).toBe('Frequency Table');

        // Check body for merged row headers
        expect(table.body).toHaveLength(3);

        // Row 1: "Gender" should have a rowspan of 3, "Male" is the next cell
        const firstRow = table.body[0];
        expect(firstRow[0]).toEqual(expect.objectContaining({ content: 'Gender', rowSpan: 3 }));
        expect(firstRow[1]).toEqual(expect.objectContaining({ content: 'Male' }));
        expect(firstRow[2].content).toBe("50");

        // Row 2: First cell should be skipped due to rowspan
        const secondRow = table.body[1];
        expect(secondRow[0]).toEqual(expect.objectContaining({ content: 'Female' }));
        expect(secondRow[1].content).toBe("50");

        // Row 3: First cell is still skipped
        const thirdRow = table.body[2];
        expect(thirdRow[0]).toEqual(expect.objectContaining({ content: 'Total' }));
        expect(thirdRow[1].content).toBe("100");
    });
    
    it('should not generate a table if there are no rows', () => {
        const jsonData = JSON.stringify(mockEmptyTable);
        const result = generateAutoTableDataFromString(jsonData);
        expect(result.tables).toHaveLength(0);
    });

    it('should handle multiple tables in a single JSON string', () => {
      const jsonData = JSON.stringify(mockStatisticsData);
      const result = generateAutoTableDataFromString(jsonData);

      expect(result.tables).toHaveLength(2);
      expect(result.tables[0].title).toBe('Descriptive Statistics');
      expect(result.tables[1].title).toBe('Frequency Table');
    });

    it('should return an empty array if tables property is missing', () => {
        const jsonData = JSON.stringify({ not_tables: [] });
        const result = generateAutoTableDataFromString(jsonData);
        expect(result.tables).toEqual([]);
    });
  });
}); 