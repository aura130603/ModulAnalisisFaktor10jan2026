import { excelStyleTextToColumns } from '../importClipboard.utils';

describe('importClipboard.utils', () => {
    describe('excelStyleTextToColumns', () => {

        // --- Delimited Tests ---
        it('should parse tab-separated values correctly', () => {
            const input = 'a\tb\tc\n1\t2\t3';
            const result = excelStyleTextToColumns(input, { delimiterType: 'delimited', delimiter: '\t' });
            expect(result).toEqual([['a', 'b', 'c'], ['1', '2', '3']]);
        });

        it('should parse comma-separated values with quotes', () => {
            const input = '"a,b",c\n"d",e';
            const result = excelStyleTextToColumns(input, { delimiterType: 'delimited', delimiter: ',', textQualifier: '"' });
            expect(result).toEqual([['a,b', 'c'], ['d', 'e']]);
        });

        it('should handle escaped quotes inside quoted fields', () => {
            const input = '"a ""b"" c",d';
            const result = excelStyleTextToColumns(input, { delimiterType: 'delimited', delimiter: ',', textQualifier: '"' });
            expect(result).toEqual([['a "b" c', 'd']]);
        });
        
        it('should handle consecutive delimiters when treatConsecutiveDelimitersAsOne is false', () => {
            const input = 'a,,b';
            const result = excelStyleTextToColumns(input, { delimiterType: 'delimited', delimiter: ',', treatConsecutiveDelimitersAsOne: false });
            expect(result).toEqual([['a', '', 'b']]);
        });

        it('should handle consecutive delimiters when treatConsecutiveDelimitersAsOne is true', () => {
            const input = 'a,,b';
            const result = excelStyleTextToColumns(input, { delimiterType: 'delimited', delimiter: ',', treatConsecutiveDelimitersAsOne: true });
            expect(result).toEqual([['a', 'b']]);
        });
        
        it('should trim whitespace when trimWhitespace is true', () => {
            const input = ' a , b ';
            const result = excelStyleTextToColumns(input, { delimiterType: 'delimited', delimiter: ',', trimWhitespace: true });
            expect(result).toEqual([['a', 'b']]);
        });

        it('should not trim whitespace when trimWhitespace is false', () => {
            const input = ' a , b ';
            const result = excelStyleTextToColumns(input, { delimiterType: 'delimited', delimiter: ',', trimWhitespace: false });
            expect(result).toEqual([[' a ', ' b ']]);
        });

        // --- Fixed-Width Tests ---
        it('should parse fixed-width data correctly', () => {
            const input = 'abcde12345';
            const result = excelStyleTextToColumns(input, { delimiterType: 'fixed', fixedWidthPositions: [3, 5] });
            expect(result).toEqual([['abc', 'de', '12345']]);
        });

        // --- Edge Case Tests ---
        it('should return an empty array for empty input', () => {
            const result = excelStyleTextToColumns('', { delimiterType: 'delimited' });
            expect(result).toEqual([]);
        });
        
        it('should handle rows with different column counts', () => {
            const input = 'a,b\nc,d,e';
            const result = excelStyleTextToColumns(input, { delimiterType: 'delimited', delimiter: ',' });
            expect(result).toEqual([['a', 'b'], ['c', 'd', 'e']]);
        });
        
        it('should skip empty lines', () => {
            const input = 'a,b\n\nc,d';
            const result = excelStyleTextToColumns(input, { delimiterType: 'delimited', delimiter: ',', trimWhitespace: true });
            expect(result).toEqual([['a', 'b'], ['c', 'd']]);
        });
    });
}); 