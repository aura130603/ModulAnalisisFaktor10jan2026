import { isDateType, DATE_FORMAT_SPECS } from '../constants/dateSpecs';
import { getFormattedTypeName, formatDropdownText } from '../utils/typeFormatters';

describe('DefineVarProps utility helpers', () => {
    describe('isDateType', () => {
        it('returns true for known date types', () => {
            const knownDateTypes = ['DATE', 'ADATE', 'DATETIME', 'TIME'];
            knownDateTypes.forEach(type => {
                expect(isDateType(type)).toBe(true);
            });
        });

        it('returns false for non-date types', () => {
            expect(isDateType('NUMERIC')).toBe(false);
            expect(isDateType('STRING')).toBe(false);
        });
    });

    describe('DATE_FORMAT_SPECS', () => {
        it('should have unique format strings', () => {
            const formats = DATE_FORMAT_SPECS.map(spec => spec.format);
            const uniqueFormats = new Set(formats);
            expect(uniqueFormats.size).toBe(formats.length);
        });

        it('each spec width should be a positive integer', () => {
            DATE_FORMAT_SPECS.forEach(spec => {
                expect(spec.width).toBeGreaterThan(0);
                expect(Number.isInteger(spec.width)).toBe(true);
            });
        });
    });

    describe('typeFormatters', () => {
        it('getFormattedTypeName maps known codes correctly', () => {
            expect(getFormattedTypeName('NUMERIC')).toBe('Numeric');
            expect(getFormattedTypeName('DATE')).toBe('Date');
            expect(getFormattedTypeName('PERCENT')).toBe('Percent');
        });

        it('getFormattedTypeName falls back gracefully', () => {
            expect(getFormattedTypeName('CUSTOM_TYPE')).toBe('Custom_type');
        });

        it('formatDropdownText capitalizes correctly', () => {
            expect(formatDropdownText('numeric')).toBe('Numeric');
            expect(formatDropdownText('STRING')).toBe('String');
        });
    });
}); 