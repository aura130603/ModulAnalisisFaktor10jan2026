import { renderHook, act } from '@testing-library/react';
import { useSortCases } from '../hooks/useSortCases';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import type { Variable, VariableType, VariableMeasure, VariableAlign, VariableRole } from '@/types/Variable';

// Mock stores
jest.mock('@/stores/useDataStore');
jest.mock('@/stores/useVariableStore');

const mockUseDataStore = useDataStore as unknown as jest.Mock;
const mockUseVariableStore = useVariableStore as unknown as jest.Mock;

const mockSortData = jest.fn();
const mockOnClose = jest.fn();

// Helper to create a mock variable
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
    label: `Label for ${name}`,
    values: [],
    missing: null,
    columns: 1,
    align: 'right' as VariableAlign,
    role: 'input' as VariableRole,
    tempId: `${columnIndex + 1}`,
});

const sampleVariables: Variable[] = [
    createMockVariable('Gender', 0, 'STRING', 'nominal'),
    createMockVariable('Age', 1, 'NUMERIC', 'scale'),
    createMockVariable('Income', 2, 'NUMERIC', 'scale'),
];

describe('useSortCases Hook', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseDataStore.mockReturnValue({ sortData: mockSortData });
        mockUseVariableStore.mockReturnValue({ variables: sampleVariables });
    });

    it('initializes with available variables and an empty sort list', () => {
        const { result } = renderHook(() => useSortCases({ onClose: mockOnClose }));
        
        expect(result.current.availableVariables.length).toBe(3);
        expect(result.current.sortByConfigs.length).toBe(0);
        expect(result.current.defaultSortOrder).toBe('asc');
        expect(result.current.error).toBeNull();
    });

    it('moves a variable from available to the sort by list', () => {
        const { result } = renderHook(() => useSortCases({ onClose: mockOnClose }));
        const variableToMove = result.current.availableVariables[0];

        act(() => {
            result.current.handleMoveVariable(variableToMove, 'available', 'sortBy');
        });

        expect(result.current.sortByConfigs.length).toBe(1);
        expect(result.current.sortByConfigs[0].variable.name).toBe(variableToMove.name);
        expect(result.current.sortByConfigs[0].direction).toBe('asc');
        expect(result.current.availableVariables.length).toBe(2);
    });

    it('moves a variable from the sort by list back to available', () => {
        const { result } = renderHook(() => useSortCases({ onClose: mockOnClose }));
        const variableToMove = result.current.availableVariables[0];

        act(() => {
            result.current.handleMoveVariable(variableToMove, 'available', 'sortBy');
        });

        const configToMoveBack = result.current.sortByConfigs[0];
        act(() => {
            result.current.handleMoveVariable(configToMoveBack.variable, 'sortBy', 'available');
        });

        expect(result.current.sortByConfigs.length).toBe(0);
        expect(result.current.availableVariables.length).toBe(3);
    });
    
    it('changes the sort direction for a variable', () => {
        const { result } = renderHook(() => useSortCases({ onClose: mockOnClose }));
        const variableToMove = result.current.availableVariables[0];

        act(() => {
            result.current.handleMoveVariable(variableToMove, 'available', 'sortBy');
        });

        const tempId = result.current.sortByConfigs[0].variable.tempId!;
        act(() => {
            result.current.changeSortDirection(tempId, 'desc');
        });

        expect(result.current.sortByConfigs[0].direction).toBe('desc');
    });

    it('moves a variable up and down in the sort list', () => {
        const { result } = renderHook(() => useSortCases({ onClose: mockOnClose }));
        const var1 = result.current.availableVariables.find(v => v.name === 'Gender')!;
        const var2 = result.current.availableVariables.find(v => v.name === 'Age')!;

        act(() => {
            result.current.handleMoveVariable(var1, 'available', 'sortBy');
            result.current.handleMoveVariable(var2, 'available', 'sortBy');
        });

        expect(result.current.sortByConfigs.map(c => c.variable.name)).toEqual(['Gender', 'Age']);

        const tempIdOfAge = result.current.sortByConfigs[1].variable.tempId!;
        act(() => result.current.moveVariableUp(tempIdOfAge));
        expect(result.current.sortByConfigs.map(c => c.variable.name)).toEqual(['Age', 'Gender']);
        
        act(() => result.current.moveVariableDown(tempIdOfAge));
        expect(result.current.sortByConfigs.map(c => c.variable.name)).toEqual(['Gender', 'Age']);
    });
    
    it('resets the state to its initial values', () => {
        const { result } = renderHook(() => useSortCases({ onClose: mockOnClose }));
        const variableToMove = result.current.availableVariables[0];
        
        act(() => {
            result.current.handleMoveVariable(variableToMove, 'available', 'sortBy');
            result.current.setDefaultSortOrder('desc');
        });

        act(() => result.current.handleReset());

        expect(result.current.sortByConfigs.length).toBe(0);
        expect(result.current.availableVariables.length).toBe(3);
        expect(result.current.defaultSortOrder).toBe('asc');
    });

    it('calls sortData with the correct configuration array on handleOk', async () => {
        const { result } = renderHook(() => useSortCases({ onClose: mockOnClose }));
        const var1 = result.current.availableVariables.find(v => v.name === 'Gender')!;
        const var2 = result.current.availableVariables.find(v => v.name === 'Age')!;

        act(() => {
            result.current.handleMoveVariable(var1, 'available', 'sortBy'); // Primary
            result.current.handleMoveVariable(var2, 'available', 'sortBy'); // Secondary
        });
        
        const tempIdOfAge = result.current.sortByConfigs.find(c => c.variable.name === 'Age')!.variable.tempId!;
        act(() => result.current.changeSortDirection(tempIdOfAge, 'desc'));

        await act(async () => {
            await result.current.handleOk();
        });

        const expectedConfigs = [
            { columnIndex: var1.columnIndex, direction: 'asc' },
            { columnIndex: var2.columnIndex, direction: 'desc' },
        ];

        expect(mockSortData).toHaveBeenCalledTimes(1);
        expect(mockSortData).toHaveBeenCalledWith(expectedConfigs);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('sets an error and does not sort if no variables are selected', async () => {
        const { result } = renderHook(() => useSortCases({ onClose: mockOnClose }));

        await act(async () => {
            await result.current.handleOk();
        });

        expect(result.current.error).toBe("Please select at least one variable to sort by");
        expect(mockSortData).not.toHaveBeenCalled();
        expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('clears the error when a variable is moved', () => {
        const { result } = renderHook(() => useSortCases({ onClose: mockOnClose }));

        act(() => {
            result.current.handleOk();
        });
        expect(result.current.error).not.toBeNull();
        
        const variableToMove = result.current.availableVariables[0];
        act(() => {
            result.current.handleMoveVariable(variableToMove, 'available', 'sortBy');
        });
        expect(result.current.error).toBeNull();
    });
}); 