import { evaluateCondition } from '../services/evaluator';
import type { Variable } from '@/types/Variable';

const mockVariables: Variable[] = [
    { name: 'age', columnIndex: 0, type: 'NUMERIC', measure: 'scale', role: 'input', label: 'Age', values: [], missing: null, decimals: 0, width: 8, columns: 12, align: 'left' },
    { name: 'income', columnIndex: 1, type: 'NUMERIC', measure: 'scale', role: 'input', label: 'Income', values: [], missing: null, decimals: 0, width: 8, columns: 12, align: 'left' },
    { name: 'gender', columnIndex: 2, type: 'STRING', measure: 'nominal', role: 'input', label: 'Gender', values: [], missing: null, decimals: 0, width: 8, columns: 12, align: 'left' },
    { name: 'region', columnIndex: 3, type: 'STRING', measure: 'nominal', role: 'input', label: 'Region', values: [], missing: null, decimals: 0, width: 8, columns: 12, align: 'left' },
];

describe('evaluateCondition in services/evaluator.ts', () => {
    it('should evaluate simple numeric comparisons correctly', () => {
        const row = [30, 50000, 'M', 'North'];
        expect(evaluateCondition('age > 25', row, mockVariables)).toBe(true);
        expect(evaluateCondition('age < 25', row, mockVariables)).toBe(false);
        expect(evaluateCondition('income == 50000', row, mockVariables)).toBe(true);
        expect(evaluateCondition('income != 60000', row, mockVariables)).toBe(true);
        expect(evaluateCondition('age >= 30', row, mockVariables)).toBe(true);
        expect(evaluateCondition('income <= 40000', row, mockVariables)).toBe(false);
    });

    it('should evaluate simple string comparisons correctly', () => {
        const row = [30, 50000, 'M', 'North'];
        expect(evaluateCondition('gender == "M"', row, mockVariables)).toBe(true);
        expect(evaluateCondition('gender != "F"', row, mockVariables)).toBe(true);
        expect(evaluateCondition('region == "East"', row, mockVariables)).toBe(false);
    });

    it('should handle logical operators correctly', () => {
        const row = [30, 50000, 'M', 'North'];
        expect(evaluateCondition('age > 25 & income > 40000', row, mockVariables)).toBe(true);
        expect(evaluateCondition('age > 25 & income > 60000', row, mockVariables)).toBe(false);
        expect(evaluateCondition('age > 35 | gender == "M"', row, mockVariables)).toBe(true);
        expect(evaluateCondition('age > 35 | gender == "F"', row, mockVariables)).toBe(false);
        expect(evaluateCondition('~(age > 35)', row, mockVariables)).toBe(true);
        expect(evaluateCondition('~(age < 35)', row, mockVariables)).toBe(false);
    });

    it('should handle parentheses correctly', () => {
        const row = [30, 50000, 'M', 'North'];
        expect(evaluateCondition('(age > 25 & income > 40000) | gender == "F"', row, mockVariables)).toBe(true);
        expect(evaluateCondition('age > 25 & (income > 60000 | gender == "M")', row, mockVariables)).toBe(true);
    });
    
    it('should handle mathematical functions correctly', () => {
        const row = [25, 62500, 'F', 'South'];
        expect(evaluateCondition('SQRT(age) == 5', row, mockVariables)).toBe(true);
        expect(evaluateCondition('ABS(-10) == 10', row, mockVariables)).toBe(true);
        expect(evaluateCondition('SUM(age, 5) == 30', row, mockVariables)).toBe(true);
    });
    
    it('should handle string functions correctly', () => {
        const row = [25, 62500, 'Female', 'South '];
        const stringVars: Variable[] = [
            ...mockVariables,
            { name: 'gender', columnIndex: 2, type: 'STRING', measure: 'nominal', role: 'input', label: 'Gender', values: [], missing: null, decimals: 0, width: 8, columns: 12, align: 'left' },
            { name: 'region', columnIndex: 3, type: 'STRING', measure: 'nominal', role: 'input', label: 'Region', values: [], missing: null, decimals: 0, width: 8, columns: 12, align: 'left' }
        ];
        expect(evaluateCondition('LOWER(gender) == "female"', row, stringVars)).toBe(true);
        expect(evaluateCondition('UPPER(gender) == "FEMALE"', row, stringVars)).toBe(true);
        expect(evaluateCondition('TRIM(region) == "South"', row, stringVars)).toBe(true);
        expect(evaluateCondition('LENGTH(gender) == 6', row, stringVars)).toBe(true);
    });

    it('should return false for invalid expressions', () => {
        const row = [30, 50000, 'M', 'North'];
        expect(evaluateCondition('age >', row, mockVariables)).toBe(false);
        expect(evaluateCondition('age > 25 &', row, mockVariables)).toBe(false);
        expect(evaluateCondition('nonExistentVar == 1', row, mockVariables)).toBe(false);
    });
}); 