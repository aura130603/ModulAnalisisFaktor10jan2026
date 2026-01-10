import { restructureData } from '../services/restructureService';
import type { RestructureConfig} from '../types';
import { RestructureMethod } from '../types';
import type { Variable, VariableType, VariableMeasure, VariableAlign, VariableRole } from '@/types/Variable';
import type { DataRow } from '@/types/Data';

// Helper to create a mock variable with all required fields
const createMockVariable = (
    name: string,
    columnIndex: number,
    type: VariableType,
    measure: VariableMeasure
): Variable => ({
    id: columnIndex + 1,
    name,
    columnIndex,
    type,
    measure,
    width: 8,
    decimals: 0,
    label: '',
    values: [],
    missing: null,
    columns: 1,
    align: 'right' as VariableAlign,
    role: 'input' as VariableRole,
});

// Mock data based on README and component implementation
const mockVariables: Variable[] = [
    createMockVariable('SubjectID', 0, 'NUMERIC', 'nominal'),
    createMockVariable('Age', 1, 'NUMERIC', 'scale'),
    createMockVariable('Gender', 2, 'STRING', 'nominal'),
    createMockVariable('Score1', 3, 'NUMERIC', 'scale'),
    createMockVariable('Score2', 4, 'NUMERIC', 'scale'),
    createMockVariable('Score3', 5, 'NUMERIC', 'scale'),
];

const mockWideData: DataRow[] = [
    [1, 25, 'M', 85, 90, 78],
    [2, 30, 'F', 92, 88, 95],
    [3, 28, 'M', 75, 82, 80],
];

const mockLongVariables: Variable[] = [
    createMockVariable('SubjectID', 0, 'NUMERIC', 'nominal'),
    createMockVariable('TimePoint', 1, 'NUMERIC', 'nominal'),
    createMockVariable('Score', 2, 'NUMERIC', 'scale'),
];

const mockLongData: DataRow[] = [
    [1, 1, 85], [1, 2, 90], [1, 3, 78],
    [2, 1, 92], [2, 2, 88], [2, 3, 95],
    [3, 1, 75], [3, 2, 82], [3, 3, 80],
];


describe('restructureService', () => {

    describe('wideToLong (Variables to Cases)', () => {
        it('should correctly restructure data from wide to long format with index and count', () => {
            const config: RestructureConfig = {
                method: RestructureMethod.VariablesToCases,
                selectedVariables: [{ name: 'Score1', columnIndex: 3, type: 'NUMERIC', measure: 'scale' }, { name: 'Score2', columnIndex: 4, type: 'NUMERIC', measure: 'scale' }, { name: 'Score3', columnIndex: 5, type: 'NUMERIC', measure: 'scale' }],
                indexVariables: [{ name: 'SubjectID', columnIndex: 0, type: 'NUMERIC', measure: 'nominal' }, { name: 'Age', columnIndex: 1, type: 'NUMERIC', measure: 'scale' }, { name: 'Gender', columnIndex: 2, type: 'STRING', measure: 'nominal' }],
                identifierVariables: [],
                options: { createIndex: true, createCount: true, dropEmptyVariables: false },
            };

            const { data, variables } = restructureData(mockWideData, mockVariables, config);

            // Verify variables
            expect(variables.map(v => v.name)).toEqual(['SubjectID', 'Age', 'Gender', 'value', 'variable', 'count']);
            
            // Verify data
            expect(data).toHaveLength(9);
            expect(data[0]).toEqual([1, 25, 'M', 85, 'Score1', 3]);
            expect(data[1]).toEqual([1, 25, 'M', 90, 'Score2', 3]);
            expect(data[2]).toEqual([1, 25, 'M', 78, 'Score3', 3]);
            expect(data[3]).toEqual([2, 30, 'F', 92, 'Score1', 3]);
        });

        it('should restructure wide to long without optional variables', () => {
            const config: RestructureConfig = {
                method: RestructureMethod.VariablesToCases,
                selectedVariables: [{ name: 'Score1', columnIndex: 3, type: 'NUMERIC', measure: 'scale' }, { name: 'Score2', columnIndex: 4, type: 'NUMERIC', measure: 'scale' }],
                indexVariables: [{ name: 'SubjectID', columnIndex: 0, type: 'NUMERIC', measure: 'nominal' }],
                identifierVariables: [],
                options: { createIndex: false, createCount: false, dropEmptyVariables: false },
            };

            const { data, variables } = restructureData(mockWideData, mockVariables, config);

            // Verify variables - should only be index and the new value variable
            expect(variables.map(v => v.name)).toEqual(['SubjectID', 'value']);
            
            // Verify data
            expect(data).toHaveLength(6); // 3 subjects * 2 scores
            expect(data[0]).toEqual([1, 85]);
            expect(data[1]).toEqual([1, 90]);
            expect(data[2]).toEqual([2, 92]);
        });
    });

    describe('longToWide (Cases to Variables)', () => {
        it('should correctly restructure data from long to wide format', () => {
            const config: RestructureConfig = {
                method: RestructureMethod.CasesToVariables,
                selectedVariables: [{ name: 'Score', columnIndex: 2, type: 'NUMERIC', measure: 'scale' }],
                identifierVariables: [{ name: 'TimePoint', columnIndex: 1, type: 'NUMERIC', measure: 'nominal' }],
                indexVariables: [],
                options: { dropEmptyVariables: false, createCount: false, createIndex: false },
            };

            const { data, variables } = restructureData(mockLongData, mockLongVariables, config);
            
            expect(variables.map(v => v.name)).toEqual(['SubjectID', 'Score_1', 'Score_2', 'Score_3']);
            
            expect(data).toHaveLength(3);
            expect(data[0]).toEqual([1, 85, 90, 78]);
            expect(data[1]).toEqual([2, 92, 88, 95]);
            expect(data[2]).toEqual([3, 75, 82, 80]);
        });

        it('should drop empty variables when the option is enabled', () => {
            const config: RestructureConfig = {
                method: RestructureMethod.CasesToVariables,
                selectedVariables: [{ name: 'Score', columnIndex: 2, type: 'NUMERIC', measure: 'scale' }],
                identifierVariables: [{ name: 'TimePoint', columnIndex: 1, type: 'NUMERIC', measure: 'nominal' }],
                indexVariables: [],
                options: { dropEmptyVariables: true, createCount: false, createIndex: false },
            };

            // Data where all subjects are missing timepoint 1, creating an empty Score_1 column
            const dataWithMissing = [
                [1, 2, 90], [1, 3, 78], // No timepoint 1 for any subject
                [2, 2, 88], [2, 3, 95], // No timepoint 1 for any subject
                [3, 2, 82], [3, 3, 80], // No timepoint 1 for any subject
            ];

            const { data, variables } = restructureData(dataWithMissing, mockLongVariables, config);
            
            // 'Score_1' column should be dropped because it's empty for all subjects
            expect(variables.map(v => v.name)).toEqual(['SubjectID', 'Score_2', 'Score_3']);
            
            expect(data).toHaveLength(3);
            expect(data[0]).toEqual([1, 90, 78]); // Subject 1 has no value for Score_1
            expect(data[1]).toEqual([2, 88, 95]); // Subject 2 has values for Score_2 and Score_3
            expect(data[2]).toEqual([3, 82, 80]); // Subject 3 has values for Score_2 and Score_3
        });
    });

    describe('transposeAll', () => {
        it('should correctly transpose the entire dataset', () => {
            const config: RestructureConfig = {
                method: RestructureMethod.TransposeAllData,
                selectedVariables: [],
                indexVariables: [],
                identifierVariables: [],
                options: { createCount: false, createIndex: false, dropEmptyVariables: false },
            };
            const simpleData = [[1, 2], [3, 4]];
            const simpleVars: Variable[] = [
                createMockVariable('A', 0, 'NUMERIC', 'scale'),
                createMockVariable('B', 1, 'NUMERIC', 'scale'),
            ];

            const { data, variables } = restructureData(simpleData, simpleVars, config);

            expect(variables).toHaveLength(2);
            expect(variables.map(v => v.name)).toEqual(['V1', 'V2']);
            expect(data).toEqual([[1, 3], [2, 4]]);
        });
    });
});