import { getTimeComponentsFromCase, getDateFormatString, formatDateString, formatDateForMetaStore, formatCurrentDates, getMaxRow } from '../utils/dateTimeFormatters';

describe('dateTimeFormatters', () => {
    describe('getTimeComponentsFromCase', () => {
        it('should return correct components for "Years, quarters, months"', () => {
            const components = getTimeComponentsFromCase('Years, quarters, months');
            expect(components).toEqual([
                { name: 'Year', value: 1900 },
                { name: 'Quarter', value: 1, periodicity: 4 },
                { name: 'Month', value: 1, periodicity: 12 },
            ]);
        });

        it('should return correct components for "Weeks, work days(5)"', () => {
            const components = getTimeComponentsFromCase('Weeks, work days(5)');
            expect(components).toEqual([
                { name: 'Week', value: 1 },
                { name: 'Work day', value: 1, periodicity: 5 },
            ]);
        });
        
        it('should return correct components for "Days, hours, minutes"', () => {
            const components = getTimeComponentsFromCase('Days, hours, minutes');
            expect(components).toEqual([
                { name: 'Day', value: 1 },
                { name: 'Hour', value: 0, periodicity: 24 },
                { name: 'Minute', value: 0, periodicity: 60 },
            ]);
        });

        it('should return empty array for "Not dated"', () => {
            const components = getTimeComponentsFromCase('Not dated');
            expect(components).toEqual([]);
        });
    });

    describe('getDateFormatString', () => {
        it('should return correct format for Year, Quarter, Month', () => {
            const format = getDateFormatString([
                { name: 'Year', value: 1 },
                { name: 'Quarter', value: 1 },
                { name: 'Month', value: 1 },
            ]);
            expect(format).toBe('YYYY-QQ-MM');
        });
        
        it('should return correct format for Week, Day', () => {
            const format = getDateFormatString([
                { name: 'Week', value: 1 },
                { name: 'Day', value: 1 },
            ]);
            expect(format).toBe('WW-D');
        });

        it('should return correct format for time components', () => {
            const format = getDateFormatString([
                { name: 'Hour', value: 1 },
                { name: 'Minute', value: 1 },
                { name: 'Second', value: 1 },
            ]);
            expect(format).toBe('HH:MM:SS');
        });

        it('should combine date and time formats', () => {
            const format = getDateFormatString([
                { name: 'Day', value: 1 },
                { name: 'Hour', value: 1 },
                { name: 'Minute', value: 1 },
            ]);
            expect(format).toBe('DD HH:MM');
        });
    });

    describe('formatDateString', () => {
        it('should format Year, Month, Day correctly', () => {
            const result = formatDateString(
                { year: 2023, month: 4, day: 5 },
                [{ name: 'Year' }, { name: 'Month' }, { name: 'Day' }] as any
            );
            expect(result).toBe('2023-04 5');
        });

        it('should format Year, Quarter correctly', () => {
            const result = formatDateString(
                { year: 2023, quarter: 2 },
                [{ name: 'Year' }, { name: 'Quarter' }] as any
            );
            expect(result).toBe('2023-Q2');
        });

        it('should format Week and Day correctly', () => {
            const result = formatDateString(
                { week: 14, day: 3 },
                [{ name: 'Week' }, { name: 'Day' }] as any
            );
            expect(result).toBe('W14 3');
        });

        it('should format a full date and time string correctly', () => {
            const result = formatDateString(
                { year: 2023, month: 4, day: 5, hour: 14, minute: 30, second: 10 },
                [{ name: 'Year' }, { name: 'Month' }, { name: 'Day' }, { name: 'Hour' }, { name: 'Minute' }, { name: 'Second' }] as any
            );
            expect(result).toBe('2023-04 5 14:30:10');
        });
        
        it('should format only the time part correctly', () => {
            const result = formatDateString(
                { hour: 8, minute: 5, second: 0 },
                [{ name: 'Hour' }, { name: 'Minute' }, { name: 'Second' }] as any
            );
            expect(result).toBe('08:05:00');
        });
    });

    describe('formatDateForMetaStore & formatCurrentDates', () => {
        it('should format metadata string correctly for Year, Quarter, Month', () => {
            const components = [
                { name: 'Year', value: 2024 },
                { name: 'Quarter', value: 2, periodicity: 4 },
                { name: 'Month', value: 5, periodicity: 12 },
            ];
            const metaString = formatDateForMetaStore('Years, quarters, months', components as any);
            expect(metaString).toBe('Year(2024)Quarter(2;4)Month(5;12)');
        });

        it('should return empty string when selectedCase is "Not dated"', () => {
            const metaString = formatDateForMetaStore('Not dated', []);
            expect(metaString).toBe('');
        });

        it('should format current dates string with periodicity', () => {
            const components = [
                { name: 'Week', value: 52 },
                { name: 'Work day', value: 5, periodicity: 5 },
            ];
            const currentString = formatCurrentDates('Weeks, work days(5)', components as any);
            expect(currentString).toBe('Week(52)Work day(5)(5)');
        });
    });

    describe('getMaxRow', () => {
        it('should return the correct maximum row count', () => {
            const data = [[1,2],[3,4],[5,6]];
            expect(getMaxRow(data)).toBe(3);
        });
    });
}); 