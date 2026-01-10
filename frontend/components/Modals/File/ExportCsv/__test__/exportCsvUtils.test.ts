import { generateCsvContent } from '../utils/exportCsvUtils';
import type { Variable } from '@/types/Variable';
import type { DataRow } from '@/types/Data';
import type { CsvExportOptions } from '../types';

describe('generateCsvContent', () => {
    const mockVariables: Variable[] = [
        { name: 'ID', type: 'NUMERIC', columnIndex: 0, width: 8, decimals: 0, label: '', columns: 8, align: 'right', measure: 'nominal', role: 'input', values: [], missing: null },
        { name: 'Name', type: 'STRING', columnIndex: 1, width: 8, decimals: 0, label: 'Full Name', columns: 8, align: 'left', measure: 'nominal', role: 'input', values: [], missing: null },
        { name: 'Score', type: 'NUMERIC', columnIndex: 2, width: 8, decimals: 2, label: '', columns: 8, align: 'right', measure: 'scale', role: 'input', values: [{value: 99, label: 'High', variableId: 2}], missing: {discrete: [ -9, -99 ]} },
    ];
    const mockData: DataRow[] = [
        [1, 'Alice', 95.5],
        [2, 'Bob, "The Builder"', 88],
        [3, 'Charlie', null],
    ];
    
    it('should generate basic CSV with headers', () => {
        const options: CsvExportOptions = {
            delimiter: ',',
            includeHeaders: true,
            includeVariableProperties: false,
            quoteStrings: false,
        };
        const result = generateCsvContent(mockData, mockVariables, options);
        const expectedRefined = [
            'ID,Name,Score',
            '1,Alice,95.5',
            '2,"Bob, ""The Builder""",88',
            '3,Charlie,',
        ].join('\n');
        expect(result).toBe(expectedRefined);
    });

    it('should generate CSV without headers', () => {
        const options: CsvExportOptions = {
            delimiter: ';',
            includeHeaders: false,
            includeVariableProperties: false,
            quoteStrings: false,
        };
        const result = generateCsvContent(mockData, mockVariables, options);
        const expected = [
            '1;Alice;95.5',
            '2;"Bob, ""The Builder""";88',
            '3;Charlie;',
        ].join('\n');
        expect(result).toBe(expected);
    });

    it('should quote all string values when quoteStrings is true', () => {
        const options: CsvExportOptions = {
            delimiter: ',',
            includeHeaders: true,
            includeVariableProperties: false,
            quoteStrings: true,
        };
        const result = generateCsvContent(mockData, mockVariables, options);
        const expected = [
            '"ID","Name","Score"',
            '1,"Alice",95.5',
            '2,"Bob, ""The Builder""",88',
            '3,"Charlie",',
        ].join('\n');
        expect(result).toBe(expected);
    });

    it('should include variable properties when requested', () => {
        const options: CsvExportOptions = {
            delimiter: ',',
            includeHeaders: true,
            includeVariableProperties: true,
            quoteStrings: false,
        };
        const result = generateCsvContent(mockData, mockVariables, options);
        expect(result).toContain('# Variable Definitions:');
        expect(result).toContain('# "Index","Name","Type","Width","Decimals","Label","Measure","Align","Role","MissingValues","ValueLabels"');
        expect(result).toContain('"Full Name"'); // Check if label is included
        expect(result).toContain('"99=High"'); // Check value labels
        expect(result).toContain('"-9; -99"'); // Check missing values
    });

    it('should handle empty data gracefully', () => {
        const options: CsvExportOptions = {
            delimiter: ',',
            includeHeaders: true,
            includeVariableProperties: false,
            quoteStrings: false,
        };
        const result = generateCsvContent([], mockVariables, options);
        expect(result).toBe('ID,Name,Score');
    });

    it('should handle empty variables gracefully', () => {
        const options: CsvExportOptions = {
            delimiter: ',',
            includeHeaders: true,
            includeVariableProperties: true,
            quoteStrings: false,
        };
        const result = generateCsvContent(mockData, [], options);
        const expected = [
            '1,Alice,95.5',
            '2,"Bob, ""The Builder""",88',
            '3,Charlie,',
        ].join('\n');
        expect(result).toBe(expected);
    });

    it('should correctly escape quotes within a quoted string', () => {
        const dataWithQuotes = [
            [1, 'He said "Hello"', 100]
        ];
        const options: CsvExportOptions = {
            delimiter: ',',
            includeHeaders: false,
            includeVariableProperties: false,
            quoteStrings: false,
        };
        const result = generateCsvContent(dataWithQuotes, mockVariables.slice(0, 3), options);
        expect(result).toBe('1,"He said ""Hello""",100');
    });
}); 