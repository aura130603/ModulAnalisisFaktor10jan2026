import {
    getFunctionSuffix,
    createVariableName,
    mapUIFunctionToCalculationFunction,
    getFunctionDisplay,
    calculateAggregateValue,
} from '../aggregateUtils';

describe('Aggregate Utils', () => {

    describe('getFunctionSuffix', () => {
        it('should return correct suffixes for known functions', () => {
            expect(getFunctionSuffix('MEAN')).toBe('mean');
            expect(getFunctionSuffix('STDDEV')).toBe('sd');
            expect(getFunctionSuffix('WEIGHTED')).toBe('n');
            expect(getFunctionSuffix('PGT')).toBe('pgt');
            expect(getFunctionSuffix('FRACTION')).toBe('frac');
        });

        it('should return lowercase function name for unknown functions', () => {
            expect(getFunctionSuffix('UNKNOWN')).toBe('unknown');
        });
    });

    describe('createVariableName', () => {
        it('should create a standard variable name', () => {
            expect(createVariableName('Salary', 'MEAN', [])).toBe('Salary_mean');
        });

        it('should handle existing names by adding a numeric suffix', () => {
            const existing = ['Salary_mean'];
            expect(createVariableName('Salary', 'MEAN', existing)).toBe('Salary_mean_1');
        });

        it('should handle multiple existing names correctly', () => {
            const existing = ['Salary_mean', 'Salary_mean_1'];
            expect(createVariableName('Salary', 'MEAN', existing)).toBe('Salary_mean_2');
        });
    });

    describe('mapUIFunctionToCalculationFunction', () => {
        it('should map weighted functions correctly', () => {
            expect(mapUIFunctionToCalculationFunction('WEIGHTED')).toBe('N');
            expect(mapUIFunctionToCalculationFunction('UNWEIGHTED')).toBe('NU');
        });

        it('should map percentage functions based on type', () => {
            expect(mapUIFunctionToCalculationFunction('PERCENTAGE', 'above')).toBe('PGT');
            expect(mapUIFunctionToCalculationFunction('PERCENTAGE', 'below')).toBe('PLT');
            expect(mapUIFunctionToCalculationFunction('PERCENTAGE', 'inside')).toBe('PIN');
            expect(mapUIFunctionToCalculationFunction('PERCENTAGE', 'outside')).toBe('POUT');
        });

        it('should map fraction functions based on type', () => {
            expect(mapUIFunctionToCalculationFunction('FRACTION', 'above')).toBe('FGT');
            expect(mapUIFunctionToCalculationFunction('FRACTION', 'below')).toBe('FLT');
            expect(mapUIFunctionToCalculationFunction('FRACTION', 'inside')).toBe('FIN');
            expect(mapUIFunctionToCalculationFunction('FRACTION', 'outside')).toBe('FOUT');
        });

        it('should return the original function name if no mapping exists', () => {
            expect(mapUIFunctionToCalculationFunction('MEAN')).toBe('MEAN');
            expect(mapUIFunctionToCalculationFunction('SUM')).toBe('SUM');
        });
    });

    describe('getFunctionDisplay', () => {
        it('should display simple functions correctly', () => {
            expect(getFunctionDisplay('MEAN', 'Salary')).toBe('MEAN(Salary)');
        });

        it('should display functions with one value parameter', () => {
            expect(getFunctionDisplay('PGT', 'Age', '25')).toBe('PGT(Age, 25)');
            expect(getFunctionDisplay('PLT', 'Age')).toBe('PLT(Age, value)'); // Placeholder
        });

        it('should display functions with two value parameters', () => {
            expect(getFunctionDisplay('PIN', 'Score', '60', '90')).toBe('PIN(Score, 60, 90)');
            expect(getFunctionDisplay('POUT', 'Score')).toBe('POUT(Score, low, high)'); // Placeholders
        });
    });

    describe('calculateAggregateValue', () => {
        const numericData = [10, 20, 30, 40, 50];
        const stringData = ['A', 'B', 'A', 'C', 'B'];
        const mixedData = [1, '2', null, 3, '', 4];
        const allNulls = [null, null, ''];

        // --- Basic Stats ---
        it('calculates MEAN correctly', () => {
            expect(calculateAggregateValue('MEAN', numericData)).toBe(30);
        });

        it('calculates SUM correctly', () => {
            expect(calculateAggregateValue('SUM', numericData)).toBe(150);
        });

        it('calculates MEDIAN correctly for odd number of values', () => {
            expect(calculateAggregateValue('MEDIAN', numericData)).toBe(30);
        });

        it('calculates MEDIAN correctly for even number of values', () => {
            expect(calculateAggregateValue('MEDIAN', [10, 20, 30, 40])).toBe(25);
        });
        
        it('calculates STDDEV correctly', () => {
            expect(calculateAggregateValue('STDDEV', numericData)).toBeCloseTo(15.81);
        });

        // --- Specific Values ---
        it('finds MIN value', () => {
            expect(calculateAggregateValue('MIN', numericData)).toBe(10);
        });

        it('finds MAX value', () => {
            expect(calculateAggregateValue('MAX', numericData)).toBe(50);
        });

        it('finds FIRST non-missing value', () => {
            expect(calculateAggregateValue('FIRST', [null, '', 'First', 'Second'])).toBe('First');
        });

        it('finds LAST non-missing value', () => {
            expect(calculateAggregateValue('LAST', ['First', 'Second', null, ''])).toBe('Second');
        });
        
        // --- Counts ---
        it('calculates N (weighted count)', () => {
            expect(calculateAggregateValue('N', mixedData)).toBe(4);
        });

        it('calculates NU (unweighted count)', () => {
            expect(calculateAggregateValue('NU', mixedData)).toBe(6);
        });

        it('calculates NMISS (weighted missing count)', () => {
            expect(calculateAggregateValue('NMISS', mixedData)).toBe(2);
        });

        it('calculates NUMISS (unweighted missing count)', () => {
            expect(calculateAggregateValue('NUMISS', mixedData)).toBe(2);
        });
        
        it('returns correct counts for all-null data', () => {
            expect(calculateAggregateValue('N', allNulls)).toBe(0);
            expect(calculateAggregateValue('NMISS', allNulls)).toBe(3);
        });

        // --- Percentages ---
        it('calculates PGT (Percentage Greater Than)', () => {
            expect(calculateAggregateValue('PGT', numericData, { percentageValue: '30' })).toBe(40); // 40, 50 are > 30 (2/5)
        });

        it('calculates PLT (Percentage Less Than)', () => {
            expect(calculateAggregateValue('PLT', numericData, { percentageValue: '30' })).toBe(40); // 10, 20 are < 30 (2/5)
        });

        it('calculates PIN (Percentage Inside Range)', () => {
            expect(calculateAggregateValue('PIN', numericData, { percentageLow: '20', percentageHigh: '40' })).toBe(60); // 20, 30, 40 (3/5)
        });
        
        it('calculates POUT (Percentage Outside Range)', () => {
            expect(calculateAggregateValue('POUT', numericData, { percentageLow: '20', percentageHigh: '40' })).toBe(40); // 10, 50 (2/5)
        });

        // --- Fractions ---
        it('calculates FGT (Fraction Greater Than)', () => {
            expect(calculateAggregateValue('FGT', numericData, { percentageValue: '30' })).toBe(0.4);
        });
        
        it('calculates FIN (Fraction Inside Range)', () => {
            expect(calculateAggregateValue('FIN', numericData, { percentageLow: '20', percentageHigh: '40' })).toBe(0.6);
        });
        
        it('calculates FLT (Fraction Less Than)', () => {
            expect(calculateAggregateValue('FLT', numericData, { percentageValue: '30' })).toBe(0.4);
        });

        it('calculates FOUT (Fraction Outside Range)', () => {
            expect(calculateAggregateValue('FOUT', numericData, { percentageLow: '20', percentageHigh: '40' })).toBe(0.4);
        });

        it('calculates COUNT correctly', () => {
            expect(calculateAggregateValue('COUNT', mixedData)).toBe(4);
        });
        
        // --- Edge Cases ---
        it('returns null for stats on empty or all-null data', () => {
            expect(calculateAggregateValue('MEAN', allNulls)).toBeNull();
            expect(calculateAggregateValue('MEDIAN', [])).toBeNull();
            expect(calculateAggregateValue('STDDEV', [10])).toBeNull();
            expect(calculateAggregateValue('PGT', [], {percentageValue: '10'})).toBeNull();
        });
    });
}); 