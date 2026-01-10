import { prepareDateVariables } from '../services/dateTimeService';
import type { TimeComponent } from '../types';
import type { Variable } from '@/types/Variable';

describe('dateTimeService', () => {
    describe('prepareDateVariables', () => {
        it('should correctly prepare variables and data for "Years, months"', () => {
            const timeComponents: TimeComponent[] = [
                { name: 'Year', value: 2020 },
                { name: 'Month', value: 1, periodicity: 12 },
            ];
            const currentVariables: Variable[] = [];
            const existingRowCount = 3;

            const { variablesToCreate, cellUpdates } = prepareDateVariables(
                timeComponents,
                currentVariables,
                existingRowCount
            );

            // 1. Test `variablesToCreate`
            expect(variablesToCreate).toHaveLength(3);
            
            expect(variablesToCreate[0]).toMatchObject({
                name: 'YEAR_',
                label: 'YEAR, not periodic',
                type: 'NUMERIC',
                columnIndex: 0,
            });
            
            expect(variablesToCreate[1]).toMatchObject({
                name: 'MONTH_',
                label: 'MONTH, period 12',
                type: 'NUMERIC',
                columnIndex: 1,
            });
            
            expect(variablesToCreate[2]).toMatchObject({
                name: 'DATE_',
                label: 'Date. Format: YYYY-MM',
                type: 'STRING',
                columnIndex: 2,
            });

            // 2. Test `cellUpdates`
            // Expected data:
            // Row 0: YEAR_ = 2020, MONTH_ = 1, DATE_ = "2020-01"
            // Row 1: YEAR_ = 2020, MONTH_ = 2, DATE_ = "2020-02"
            // Row 2: YEAR_ = 2020, MONTH_ = 3, DATE_ = "2020-03"
            
            const findUpdate = (row: number, col: number) => 
                cellUpdates.find(u => u.row === row && u.col === col);

            // Row 0
            expect(findUpdate(0, 0)?.value).toBe(2020); // Year
            expect(findUpdate(0, 1)?.value).toBe(1);    // Month
            expect(findUpdate(0, 2)?.value).toBe('2020-01'); // Date

            // Row 1
            expect(findUpdate(1, 0)?.value).toBe(2020); // Year
            expect(findUpdate(1, 1)?.value).toBe(2);    // Month
            expect(findUpdate(1, 2)?.value).toBe('2020-02'); // Date

            // Row 2
            expect(findUpdate(2, 0)?.value).toBe(2020); // Year
            expect(findUpdate(2, 1)?.value).toBe(3);    // Month
            expect(findUpdate(2, 2)?.value).toBe('2020-03'); // Date
        });

        it('should handle carry-over logic correctly when month wraps around', () => {
            const timeComponents: TimeComponent[] = [
                { name: 'Year', value: 2022 },
                { name: 'Month', value: 11, periodicity: 12 },
            ];
            const currentVariables: Variable[] = [];
            const existingRowCount = 4;

            const { variablesToCreate, cellUpdates } = prepareDateVariables(
                timeComponents,
                currentVariables,
                existingRowCount
            );
            
            // Expected data:
            // Row 0: YEAR_ = 2022, MONTH_ = 11
            // Row 1: YEAR_ = 2022, MONTH_ = 12
            // Row 2: YEAR_ = 2023, MONTH_ = 1
            // Row 3: YEAR_ = 2023, MONTH_ = 2

            const findUpdate = (row: number, col: number) => 
                cellUpdates.find(u => u.row === row && u.col === col);
            
            // Row 0
            expect(findUpdate(0, 0)?.value).toBe(2022);
            expect(findUpdate(0, 1)?.value).toBe(11);
            expect(findUpdate(0, 2)?.value).toBe('2022-11');

            // Row 1
            expect(findUpdate(1, 0)?.value).toBe(2022);
            expect(findUpdate(1, 1)?.value).toBe(12);
            expect(findUpdate(1, 2)?.value).toBe('2022-12');

            // Row 2 (Month wraps around, year increments)
            expect(findUpdate(2, 0)?.value).toBe(2023);
            expect(findUpdate(2, 1)?.value).toBe(1);
            expect(findUpdate(2, 2)?.value).toBe('2023-01');

            // Row 3
            expect(findUpdate(3, 0)?.value).toBe(2023);
            expect(findUpdate(3, 1)?.value).toBe(2);
            expect(findUpdate(3, 2)?.value).toBe('2023-02');
        });

        it('should handle complex carry-over with weeks, work days, and hours', () => {
            const timeComponents: TimeComponent[] = [
                { name: 'Week', value: 1 },
                { name: 'Work day', value: 5, periodicity: 5 },
                { name: 'Hour', value: 23, periodicity: 24 },
            ];
            const currentVariables: Variable[] = [];
            const existingRowCount = 3;

            const { variablesToCreate, cellUpdates } = prepareDateVariables(
                timeComponents,
                currentVariables,
                existingRowCount
            );

            // Expected data:
            // Row 0: Week=1, Work day=5, Hour=23
            // Row 1: Week=2, Work day=1, Hour=0
            // Row 2: Week=2, Work day=1, Hour=1

            const findUpdate = (row: number, col: number) => 
                cellUpdates.find(u => u.row === row && u.col === col);
            
            // Variables
            expect(variablesToCreate.map(v => v.name)).toEqual(['WEEK_', 'WORK DAY_', 'HOUR_', 'DATE_']);

            // Row 0
            expect(findUpdate(0, 0)?.value).toBe(1); // Week
            expect(findUpdate(0, 1)?.value).toBe(5); // Work day
            expect(findUpdate(0, 2)?.value).toBe(23); // Hour

            // Row 1 (hour and day wrap around, week increments)
            expect(findUpdate(1, 0)?.value).toBe(2); // Week
            expect(findUpdate(1, 1)?.value).toBe(1); // Work day
            expect(findUpdate(1, 2)?.value).toBe(0); // Hour
            
            // Row 2
            expect(findUpdate(2, 0)?.value).toBe(2); // Week
            expect(findUpdate(2, 1)?.value).toBe(1); // Work day
            expect(findUpdate(2, 2)?.value).toBe(1); // Hour
        });
    });
}); 