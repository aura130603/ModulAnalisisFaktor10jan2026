import { formatCaseProcessingSummary, formatCrosstabulationTable } from '../utils/formatters';
import type { CrosstabsWorkerResult, CrosstabsAnalysisParams } from '../types';
import type { Variable } from '@/types/Variable';

const mockParams: CrosstabsAnalysisParams = {
    rowVariables: [{ name: 'gender', label: 'Gender' } as Variable],
    columnVariables: [{ name: 'jobcat', label: 'Job Category' } as Variable],
    options: {
        cells: { observed: true, expected: false, row: false, column: false, total: false, hideSmallCounts: false, hideSmallCountsThreshold: 5 },
        residuals: { unstandardized: false, standardized: false, adjustedStandardized: false },
        nonintegerWeights: 'roundCell',
    },
};

const mockResult: CrosstabsWorkerResult = {
    summary: {
        valid: 474,
        missing: 0,
        rowCategories: ['Female', 'Male'],
        colCategories: ['Clerical', 'Custodial', 'Manager'],
        rowTotals: [216, 258],
        colTotals: [363, 27, 84],
        totalCases: 474,
    },
    contingencyTable: [
        [180, 0, 36],
        [183, 27, 48],
    ],
};

describe('Crosstabs Formatters', () => {

    describe('formatCaseProcessingSummary', () => {
        it('should format the case processing summary correctly', () => {
            const formatted = formatCaseProcessingSummary(mockResult, mockParams);
            
            expect(formatted?.title).toBe('Case Processing Summary');
            expect(formatted?.rows).toHaveLength(1);
            
            const row = formatted?.rows[0];
            expect(row?.rowHeader).toEqual(['Gender * Job Category']);
            expect(row?.valid_n).toBe(474);
            expect(row?.missing_n).toBe(0);
            expect(row?.total_n).toBe(474);
        });

        it('should handle zero total cases', () => {
            const zeroResult: CrosstabsWorkerResult = { ...mockResult, summary: { ...mockResult.summary, valid: 0, missing: 0, totalCases: 0 } };
            const formatted = formatCaseProcessingSummary(zeroResult, mockParams);
            const row = formatted?.rows[0];

            expect(row?.valid_percent).toBe('0.0%');
            expect(row?.missing_percent).toBe('0.0%');
        });

        it('should return null if result is not provided', () => {
            const formatted = formatCaseProcessingSummary(null as any, mockParams);
            expect(formatted).toBeNull();
        });
    });

    describe('formatCrosstabulationTable', () => {
        it('should format the crosstabulation table correctly', () => {
            const formatted = formatCrosstabulationTable(mockResult, mockParams);

            expect(formatted?.title).toBe('Gender * Job Category Crosstabulation');
            
            // Check headers
            expect(formatted?.columnHeaders).toHaveLength(4);
            expect(formatted?.columnHeaders[2].header).toBe('Job Category');
            expect((formatted?.columnHeaders[2].children as any[])).toHaveLength(3);
            expect((formatted?.columnHeaders[2].children as any[])[0].header).toBe('Clerical');

            // Check rows (main row + total row)
            expect(formatted?.rows).toHaveLength(2);

            // Check main row and its children
            const mainRow = formatted?.rows[0] as any;
            expect(mainRow.rowHeader).toEqual(['Gender', null]);
            expect(mainRow.children).toHaveLength(2); // Female, Male

            // Check a data cell
            const femaleRow = mainRow.children[0];
            expect(femaleRow.rowHeader).toEqual([null, 'Female']);
            expect(femaleRow.c1).toBe('180'); // Female x Clerical
            expect(femaleRow.total).toBe('216');

            // Check total row
            const totalRow = formatted?.rows[1] as any;
            expect(totalRow.rowHeader).toEqual(['Total', null]);
            expect(totalRow.c1).toBe('363');
            expect(totalRow.total).toBe('474');
        });

        it('should return null if result is not provided', () => {
            const formatted = formatCrosstabulationTable(null as any, mockParams);
            expect(formatted).toBeNull();
        });

        it('should handle zero row totals for row percentages', () => {
            // Create a mock result where one row has zero total
            const zeroRowResult: CrosstabsWorkerResult = {
                ...mockResult,
                summary: {
                    ...mockResult.summary,
                    rowTotals: [0, 258], // First row has zero total
                },
                contingencyTable: [
                    [0, 0, 0], // First row has all zeros
                    [183, 27, 48],
                ],
            };

            const paramsWithRowPct: CrosstabsAnalysisParams = {
                ...mockParams,
                options: {
                    ...mockParams.options,
                    cells: { ...mockParams.options.cells, row: true },
                },
            };

            const formatted = formatCrosstabulationTable(zeroRowResult, paramsWithRowPct);
            
            expect(formatted).not.toBeNull();
            expect(formatted?.title).toBe('Gender * Job Category Crosstabulation');
            
            // Check that the first row (with zero total) has empty percentage values
            const mainRow = formatted?.rows[0] as any;
            const firstDataRow = mainRow.children[0]; // First data row (Female)
            
            // All percentage cells should show 0.0% for the row with zero total
            expect(firstDataRow.c1).toBe('0.0%'); // Should show 0.0% instead of empty
            expect(firstDataRow.c2).toBe('0.0%'); // Should show 0.0% instead of empty
            expect(firstDataRow.c3).toBe('0.0%'); // Should show 0.0% instead of empty
            expect(firstDataRow.total).toBe('100.0%'); // Total should show 100.0% for valid rows
            
            // Second row should still have valid percentages
            const secondDataRow = mainRow.children[1]; // Second data row (Male)
            expect(secondDataRow.total).toBe('100.0%'); // This should still work
        });

        it('should show column percentages in total row for row percentages', () => {
            const paramsWithRowPct: CrosstabsAnalysisParams = {
                ...mockParams,
                options: {
                    ...mockParams.options,
                    cells: { ...mockParams.options.cells, row: true },
                },
            };

            const formatted = formatCrosstabulationTable(mockResult, paramsWithRowPct);
            
            expect(formatted).not.toBeNull();
            
            // Check total row - should show column percentages for row percentage statistic
            const totalRow = formatted?.rows[1] as any; // Total row
            expect(totalRow.rowHeader).toEqual(['Total', null, '% within Gender']);
            
            // Check that total row shows column percentages (colTotals/totalCases)
            // 363/474 = 76.6%, 27/474 = 5.7%, 84/474 = 17.7%
            expect(totalRow.c1).toBe('76.6%'); // Clerical percentage of total
            expect(totalRow.c2).toBe('5.7%');  // Custodial percentage of total  
            expect(totalRow.c3).toBe('17.7%'); // Manager percentage of total
            expect(totalRow.total).toBe('100.0%'); // Always 100% for total
        });
    });
}); 