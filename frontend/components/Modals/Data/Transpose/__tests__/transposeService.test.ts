import { transposeDataService } from '../services/transposeService';
import type { Variable, VariableType, VariableMeasure, VariableAlign, VariableRole } from '@/types/Variable';

const createMockVariable = (
    name: string,
    columnIndex: number,
    type: VariableType = 'NUMERIC',
    measure: VariableMeasure = 'scale',
    label = ''
): Variable => ({
    id: columnIndex + 1,
    name,
    columnIndex,
    type,
    measure,
    label,
    width: 8,
    decimals: 2,
    values: [],
    missing: null,
    columns: 8,
    align: 'right' as VariableAlign,
    role: 'input' as VariableRole,
});

const mockData = [
    ['PersonA', 25, 50000],
    ['PersonB', 30, 60000],
    ['PersonC', 35, 70000],
];

const mockVariables: Variable[] = [
    createMockVariable('Name', 0, 'STRING', 'nominal'),
    createMockVariable('Age', 1, 'NUMERIC', 'scale'),
    createMockVariable('Salary', 2, 'NUMERIC', 'scale'),
];

describe('transposeDataService', () => {

    it('should return empty results if no variables are selected for transpose', () => {
        const result = transposeDataService(mockData, [], null);
        expect(result.transposedData).toEqual([]);
        expect(result.finalTransposedVariables).toEqual([]);
    });

    it('should transpose data with default variable names when no name variable is provided', () => {
        const varsToTranspose = [mockVariables[1], mockVariables[2]]; // Age and Salary
        const { transposedData, finalTransposedVariables } = transposeDataService(mockData, varsToTranspose, null);

        // Expected variables: case_lbl, Var1, Var2, Var3
        expect(finalTransposedVariables.length).toBe(4);
        expect(finalTransposedVariables[0].name).toBe('case_lbl');
        expect(finalTransposedVariables[1].name).toBe('Var1');
        expect(finalTransposedVariables[2].name).toBe('Var2');
        expect(finalTransposedVariables[3].name).toBe('Var3');
        
        // Expected data: 2 rows (for Age and Salary), 4 columns each
        expect(transposedData.length).toBe(2);
        expect(transposedData[0]).toEqual(['Age', 25, 30, 35]); // Row for Age
        expect(transposedData[1]).toEqual(['Salary', 50000, 60000, 70000]); // Row for Salary
    });

    it('should transpose data using a name variable for new column names', () => {
        const varsToTranspose = [mockVariables[1], mockVariables[2]]; // Age and Salary
        const nameVariable = mockVariables[0]; // Name
        const { transposedData, finalTransposedVariables } = transposeDataService(mockData, varsToTranspose, nameVariable);

        // Expected variables: case_lbl, PersonA, PersonB, PersonC
        expect(finalTransposedVariables.length).toBe(4);
        expect(finalTransposedVariables[0].name).toBe('case_lbl');
        expect(finalTransposedVariables[1].name).toBe('PersonA');
        expect(finalTransposedVariables[2].name).toBe('PersonB');
        expect(finalTransposedVariables[3].name).toBe('PersonC');

        // Data should be the same as the previous test, just with different variable names
        expect(transposedData.length).toBe(2);
        expect(transposedData[0]).toEqual(['Age', 25, 30, 35]);
        expect(transposedData[1]).toEqual(['Salary', 50000, 60000, 70000]);
    });

    it('should process and sanitize variable names from name variable', () => {
        const dataWithInvalidNames = [
            ['123 Starts with number', 25],
            ['Has Space', 30],
            ['Has-Special-Char', 35],
            ['TooLongName'.repeat(10), 40],
            ['duplicate', 45],
            ['duplicate', 50]
        ];
        const varsToTranspose = [mockVariables[1]]; // Age
        const nameVariable = mockVariables[0]; // Name

        const { finalTransposedVariables } = transposeDataService(dataWithInvalidNames, varsToTranspose, nameVariable);

        expect(finalTransposedVariables.length).toBe(dataWithInvalidNames.length + 1); // +1 for case_lbl
        expect(finalTransposedVariables[1].name).toBe('var_123_Starts_with_number');
        expect(finalTransposedVariables[2].name).toBe('Has_Space');
        expect(finalTransposedVariables[3].name).toBe('Has_Special_Char');
        expect(finalTransposedVariables[4].name).toBe('TooLongName'.repeat(10).substring(0, 64));
        expect(finalTransposedVariables[5].name).toBe('duplicate');
        expect(finalTransposedVariables[6].name).toBe('duplicate_1');
    });

    it('should handle empty or missing data points gracefully', () => {
        const dataWithMissing = [
            ['PersonA', 25, 50000],
            ['PersonB', , 60000], // Using empty slot for undefined
            ['PersonC', 35] // Missing salary
        ];
        const varsToTranspose = [mockVariables[1], mockVariables[2]]; // Age and Salary
        const { transposedData } = transposeDataService(dataWithMissing as (string | number)[][], varsToTranspose, null);
        
        // Expect empty strings for missing/undefined values
        expect(transposedData[0]).toEqual(['Age', 25, '', 35]);
        expect(transposedData[1]).toEqual(['Salary', 50000, 60000, '']);
    });
}); 