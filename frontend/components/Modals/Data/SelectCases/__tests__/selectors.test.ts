import {
    selectByCondition,
    selectByFilterVariable,
    selectByRange,
    selectRandomSample
} from '../services/selectors';
import * as evaluator from '../services/evaluator';
import type { Variable } from '@/types/Variable';

jest.mock('../services/evaluator');
const mockedEvaluator = evaluator as jest.Mocked<typeof evaluator>;

const mockVariables: Variable[] = [
    { name: 'age', columnIndex: 0, type: 'NUMERIC', measure: 'scale', role: 'input', label: 'Age', values: [], missing: null, decimals: 0, width: 8, columns: 12, align: 'left' },
    { name: 'income', columnIndex: 1, type: 'NUMERIC', measure: 'scale', role: 'input', label: 'Income', values: [], missing: null, decimals: 0, width: 8, columns: 12, align: 'left' },
    { name: 'filter_var', columnIndex: 2, type: 'NUMERIC', measure: 'nominal', role: 'input', label: 'Filter', values: [], missing: null, decimals: 0, width: 8, columns: 12, align: 'left' }
];

const mockData: any[][] = [
    [25, 50000, 1],
    [35, 80000, 0],
    [45, 60000, 1],
    [22, 40000, 1],
    [50, 120000, 0],
];

describe('Selector Service', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('selectByCondition', () => {
        it('should return indices of rows that satisfy the condition', () => {
            mockedEvaluator.evaluateCondition.mockImplementation((exp, row, vars) => {
                // Mocking simple logic: if age > 30
                const age = row[vars.findIndex(v => v.name === 'age')];
                return age > 30;
            });

            const result = selectByCondition(mockData, mockVariables, 'age > 30');
            expect(mockedEvaluator.evaluateCondition).toHaveBeenCalledTimes(mockData.length);
            expect(result).toEqual([1, 2, 4]);
        });

        it('should return an empty array if the expression is empty', () => {
            const result = selectByCondition(mockData, mockVariables, '   ');
            expect(result).toEqual([]);
        });
    });

    describe('selectRandomSample', () => {
        it('should select approximately the correct percentage of cases', () => {
            const result = selectRandomSample(mockData, { sampleType: 'approximate', percentage: 50 });
            // With 5 items, 50% is rounded to 3
            expect(result.length).toBe(3);
            result.forEach(index => {
                expect(index).toBeGreaterThanOrEqual(0);
                expect(index).toBeLessThan(mockData.length);
            });
        });

        it('should select an exact number of cases from the first N cases', () => {
            const result = selectRandomSample(mockData, { sampleType: 'exact', exactCount: 2, fromFirstCount: 3 });
            expect(result.length).toBe(2);
            result.forEach(index => {
                expect(index).toBeLessThan(3); // Should only be from first 3 cases (0, 1, 2)
            });
        });
    });

    describe('selectByRange', () => {
        it('should select cases within the specified 1-based range', () => {
            const result = selectByRange(mockData, { firstCase: '2', lastCase: '4' });
            expect(result).toEqual([1, 2, 3]); // Corresponds to rows at index 1, 2, 3
        });

        it('should handle range from the start', () => {
            const result = selectByRange(mockData, { lastCase: '3' });
            expect(result).toEqual([0, 1, 2]);
        });

        it('should handle range to the end', () => {
            const result = selectByRange(mockData, { firstCase: '4' });
            expect(result).toEqual([3, 4]);
        });
    });

    describe('selectByFilterVariable', () => {
        it('should select cases where the filter variable is non-zero', () => {
            const filterVar = mockVariables.find(v => v.name === 'filter_var');
            if (!filterVar) throw new Error("Mock filter variable not found");
            
            const result = selectByFilterVariable(mockData, mockVariables, filterVar);
            expect(result).toEqual([0, 2, 3]);
        });
    });
}); 