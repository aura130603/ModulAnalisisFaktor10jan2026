import { renderHook, act } from '@testing-library/react';
import { useVariableStore } from '../useVariableStore';
import { Variable } from '@/types/Variable';
import { variableService, sheetService } from '@/services/data';

// Mock the entire module from where variableService is imported
jest.mock('@/services/data', () => ({
    variableService: {
        getAllVariables: jest.fn().mockResolvedValue([]),
        clearAllVariables: jest.fn().mockResolvedValue(undefined),
        importVariables: jest.fn().mockResolvedValue(undefined),
        saveVariable: jest.fn().mockResolvedValue(undefined),
    },
    sheetService: {
        insertColumn: jest.fn().mockResolvedValue(undefined),
        deleteColumn: jest.fn().mockResolvedValue(undefined),
        addMultipleColumns: jest.fn().mockResolvedValue(undefined),
        deleteMultipleColumns: jest.fn().mockResolvedValue(undefined),
        sortSheetByVariable: jest.fn().mockResolvedValue(undefined),
        replaceAll: jest.fn().mockResolvedValue(undefined),
    },
    dataService: jest.fn(),
    resultService: jest.fn(),
    metaService: jest.fn(),
}));

jest.mock('@/stores/useDataStore', () => ({
    useDataStore: {
        getState: jest.fn(() => ({
            checkAndSave: jest.fn().mockResolvedValue(undefined),
            loadData: jest.fn().mockResolvedValue(undefined),
            validateVariableData: jest.fn().mockResolvedValue({ isValid: true, issues: [] }),
        })),
    },
}));

jest.mock('../../app/dashboard/variable/components/variableTable/utils', () => ({
    transformVariablesToTableData: jest.fn(() => []),
}));

// Helper to create a mock variable
const createMockVariable = (columnIndex: number, name: string): Variable => ({
    tempId: `temp-${columnIndex}`,
    columnIndex,
    name,
    type: 'NUMERIC',
    width: 8,
    decimals: 2,
    label: '',
    values: [],
    missing: null,
    columns: 72,
    align: 'right',
    measure: 'scale',
    role: 'input',
});

describe('useVariableStore', () => {
    let initialState: any;
    beforeEach(() => {
        initialState = useVariableStore.getState();
        jest.clearAllMocks();
    });

    afterEach(() => {
        act(() => {
            useVariableStore.setState(initialState);
        });
    });

    it('should have a correct initial state', () => {
        const { result } = renderHook(() => useVariableStore());
        expect(result.current.variables).toEqual([]);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe(null);
    });

    it('should set variables, sort them by columnIndex, and filter invalid ones', () => {
        const { result } = renderHook(() => useVariableStore());
        const unsortedVariables = [
            createMockVariable(1, 'VarB'),
            createMockVariable(0, 'VarA'),
        ];
        const invalidVariable: any = { name: 'invalid' }; // Missing required fields

        act(() => {
            result.current.setVariables([...unsortedVariables, invalidVariable]);
        });

        expect(result.current.variables).toHaveLength(2);
        expect(result.current.variables[0].name).toBe('VarA');
        expect(result.current.variables[1].name).toBe('VarB');
        expect(result.current.lastUpdated).toBeInstanceOf(Date);
    });

    it('should add a new variable to the end of the list', async () => {
        const { result } = renderHook(() => useVariableStore());
        // use mocked services from jest.mock above
        const initialVar = createMockVariable(0, 'VarA');
        
        act(() => {
            result.current.setVariables([initialVar]);
        });

        const db: Variable[] = [initialVar];
        sheetService.insertColumn.mockImplementation((v: Variable) => {
            db.push(v);
            return Promise.resolve(undefined);
        });
        variableService.getAllVariables.mockImplementation(() => Promise.resolve(db));

        await act(async () => {
            // Using a partial here as the store completes it
            await result.current.addVariable({ name: 'VarB', type: 'STRING' });
        });

        expect(result.current.variables).toHaveLength(2);
        expect(result.current.variables[1].name).toBe('VarB');
        expect(result.current.variables[1].type).toBe('STRING');
        expect(result.current.variables[1].columnIndex).toBe(1); // Should be next available index
    });
    
    it('should update a single field of a variable and enforce constraints', async () => {
        const { result } = renderHook(() => useVariableStore());
        const initialVars = [createMockVariable(0, 'VarA')];
        
        act(() => {
            result.current.setVariables(initialVars);
        });

        // Test updating the type to STRING
        await act(async () => {
            await result.current.updateVariable(0, 'type', 'STRING');
        });

        // When type becomes 'STRING', measure should be forced to 'nominal'
        expect(result.current.variables[0].type).toBe('STRING');
        expect(result.current.variables[0].measure).toBe('nominal');

        // Test updating the label
         await act(async () => {
            await result.current.updateVariable(0, 'label', 'New Label');
        });
        expect(result.current.variables[0].label).toBe('New Label');
    });

    it('should not allow measure to be set to "scale" if type is "STRING"', async () => {
        const { result } = renderHook(() => useVariableStore());
        const initialVars = [
            { ...createMockVariable(0, 'VarA'), type: 'STRING', measure: 'nominal' } as Variable
        ];
        
        act(() => {
            result.current.setVariables(initialVars);
        });

        // Attempt to update measure to 'scale'
        await act(async () => {
            await result.current.updateVariable(0, 'measure', 'scale');
        });

        // The measure should remain 'nominal' due to the constraint
        expect(result.current.variables[0].measure).toBe('nominal');
    });
}); 