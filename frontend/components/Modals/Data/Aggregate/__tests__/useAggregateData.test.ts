import { renderHook, act } from '@testing-library/react';
import { useAggregateData } from '../hooks/useAggregateData';
import { useVariableStore } from '@/stores/useVariableStore';
import { useDataStore } from '@/stores/useDataStore';
import { useModalStore } from '@/stores/useModalStore';

// Mock stores
jest.mock('@/stores/useVariableStore');
jest.mock('@/stores/useDataStore');
jest.mock('@/stores/useModalStore');

const mockUseVariableStore = useVariableStore as unknown as jest.Mock;
const mockUseDataStore = useDataStore as unknown as jest.Mock;
const mockUseModalStore = useModalStore as unknown as jest.Mock;

const mockAddVariables = jest.fn();
const mockUpdateCells = jest.fn();
const mockSetStatisticProgress = jest.fn();

// Using a simplified version of Variable for testing purposes
interface Variable {
    columnIndex: number;
    name: string;
    type: 'STRING' | 'NUMERIC';
    label?: string;
    measure: 'scale' | 'nominal' | 'ordinal';
}

const sampleVariables: Variable[] = [
    { columnIndex: 0, name: 'Gender', type: 'STRING', label: 'Gender', measure: 'nominal' },
    { columnIndex: 1, name: 'Region', type: 'STRING', label: 'Region', measure: 'nominal' },
    { columnIndex: 2, name: 'Salary', type: 'NUMERIC', label: 'Salary', measure: 'scale' },
    { columnIndex: 3, name: 'Age', type: 'NUMERIC', label: 'Age', measure: 'scale' },
];

const sampleData = [
    ['Male', 'North', 50000, 34],
    ['Female', 'North', 60000, 29],
    ['Male', 'South', 55000, 45],
    ['Female', 'South', 65000, 39],
    ['Male', 'North', 52000, 27],
];

describe('useAggregateData', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        const variableStoreState = {
            variables: sampleVariables,
            addVariables: mockAddVariables,
        };
        mockUseVariableStore.mockReturnValue(variableStoreState);
        (useVariableStore as any).getState = () => variableStoreState;

        mockUseDataStore.mockReturnValue({
            data: sampleData,
            updateCells: mockUpdateCells,
        });

        mockUseModalStore.mockReturnValue({
            setStatisticProgress: mockSetStatisticProgress,
        });
    });

    it('should initialize with available variables from the store', () => {
        const { result } = renderHook(() => useAggregateData());
        expect(result.current.availableVariables).toEqual(sampleVariables);
        expect(result.current.breakVariables).toEqual([]);
        expect(result.current.aggregatedVariables).toEqual([]);
    });

    it('should move a variable to break variables and back', () => {
        const { result } = renderHook(() => useAggregateData());

        // Move to break
        act(() => {
            result.current.moveToBreak(sampleVariables[0] as any);
        });

        expect(result.current.breakVariables).toHaveLength(1);
        expect(result.current.breakVariables[0].name).toBe('Gender');
        expect(result.current.availableVariables).toHaveLength(sampleVariables.length - 1);

        // Move from break
        act(() => {
            result.current.moveFromBreak(result.current.breakVariables[0] as any);
        });

        expect(result.current.breakVariables).toHaveLength(0);
        expect(result.current.availableVariables).toHaveLength(sampleVariables.length);
    });

    it('should move a variable to aggregated variables and back', () => {
        const { result } = renderHook(() => useAggregateData());

        // Move to aggregated
        act(() => {
            result.current.moveToAggregated(sampleVariables[2] as any);
        });
        expect(result.current.aggregatedVariables).toHaveLength(1);

        // Move from aggregated
        act(() => {
            result.current.moveFromAggregated(result.current.aggregatedVariables[0]);
        });
        expect(result.current.aggregatedVariables).toHaveLength(0);
        expect(result.current.availableVariables).toHaveLength(sampleVariables.length); // Should not change available vars
    });

    it('should move a variable to aggregated variables with default function', () => {
        const { result } = renderHook(() => useAggregateData());

        act(() => {
            result.current.moveToAggregated(sampleVariables[2] as any); // Salary (NUMERIC)
        });

        expect(result.current.aggregatedVariables).toHaveLength(1);
        const aggVar = result.current.aggregatedVariables[0];
        expect(aggVar.baseVarName).toBe('Salary');
        expect(aggVar.function).toBe('MEAN'); // Default for numeric
        expect(aggVar.name).toBe('Salary_mean');
        expect(aggVar.displayName).toContain("AvgSalary 'Average Salary'");
    });

    it('should apply a new function to an aggregated variable', () => {
        const { result } = renderHook(() => useAggregateData());
        act(() => {
            result.current.moveToAggregated(sampleVariables[2] as any);
        });

        act(() => {
            result.current.setCurrentEditingVariable(result.current.aggregatedVariables[0]);
            result.current.setSelectedFunction('SUM');
            result.current.setFunctionCategory('summary');
            result.current.applyFunction();
        });

        const updatedVar = result.current.aggregatedVariables[0];
        expect(updatedVar.function).toBe('SUM');
        expect(updatedVar.name).toBe('Salary_sum');
        expect(updatedVar.displayName).toContain("SUM(Salary)");
    });

    it('should apply a new name and label', () => {
        const { result } = renderHook(() => useAggregateData());
        act(() => {
            result.current.moveToAggregated(sampleVariables[2] as any);
        });

        act(() => {
            result.current.setCurrentEditingVariable(result.current.aggregatedVariables[0]);
            result.current.setNewVariableName('AvgSalary');
            result.current.setNewVariableLabel('Average Salary');
            result.current.applyNameLabel();
        });

        const updatedVar = result.current.aggregatedVariables[0];
        expect(updatedVar.name).toBe('AvgSalary');
        expect(updatedVar.label).toBe('Average Salary');
        expect(updatedVar.displayName).toContain("AvgSalary 'Average Salary'");
    });

    it('should show error when applying a duplicate name', () => {
        const { result } = renderHook(() => useAggregateData());
        act(() => {
            result.current.moveToAggregated(sampleVariables[2] as any); // Creates Salary_mean
            result.current.moveToAggregated(sampleVariables[3] as any); // Creates Age_mean
        });

        act(() => {
            result.current.setCurrentEditingVariable(result.current.aggregatedVariables[1]); // Editing Age_mean
            result.current.setNewVariableName('Salary_mean'); // Try to use existing name
            result.current.applyNameLabel();
        });

        expect(result.current.errorMessage).toBe("A variable with this name already exists.");
        expect(result.current.errorDialogOpen).toBe(true);
    });

    it('should show error for empty N_BREAK name when addNumberOfCases is true', async () => {
        const { result } = renderHook(() => useAggregateData());
        const closeModal = jest.fn();

        act(() => {
            result.current.setAddNumberOfCases(true);
            result.current.setBreakName(' ');
        });

        await act(async () => {
            await result.current.handleConfirm(closeModal);
        });

        expect(result.current.errorMessage).toBe("The name for the 'Number of cases' variable cannot be empty.");
        expect(result.current.errorDialogOpen).toBe(true);
        expect(mockAddVariables).not.toHaveBeenCalled();
    });

    it('should reset all state', () => {
        const { result } = renderHook(() => useAggregateData());
        act(() => {
            result.current.moveToBreak(sampleVariables[0] as any);
            result.current.moveToAggregated(sampleVariables[2] as any);
            result.current.setAddNumberOfCases(true);
        });

        act(() => {
            result.current.handleReset();
        });

        expect(result.current.breakVariables).toEqual([]);
        expect(result.current.aggregatedVariables).toEqual([]);
        expect(result.current.availableVariables).toEqual(sampleVariables);
        expect(result.current.addNumberOfCases).toBe(false);
    });

    it('should handle confirming aggregation', async () => {
        const { result } = renderHook(() => useAggregateData());
        const closeModal = jest.fn();

        act(() => {
            result.current.moveToBreak(sampleVariables[0] as any);
            result.current.moveToAggregated(sampleVariables[2] as any);
        });

        await act(async () => {
            await result.current.handleConfirm(closeModal);
        });

        expect(mockSetStatisticProgress).toHaveBeenCalledWith(true);
        expect(mockAddVariables).toHaveBeenCalledTimes(1);
        const [newVars, updates] = mockAddVariables.mock.calls[0];
        
        // Validate new variable
        expect(newVars).toHaveLength(1);
        expect(newVars[0]).toMatchObject({
            name: 'Salary_mean',
            type: 'NUMERIC',
        });

        // Validate cell updates
        expect(updates).toHaveLength(sampleData.length);
        const maleAvg = (50000 + 55000 + 52000) / 3;
        const femaleAvg = (60000 + 65000) / 2;

        expect(updates).toContainEqual({ row: 0, col: 4, value: maleAvg });
        expect(updates).toContainEqual({ row: 1, col: 4, value: femaleAvg });
        expect(updates).toContainEqual({ row: 2, col: 4, value: maleAvg });
        expect(updates).toContainEqual({ row: 3, col: 4, value: femaleAvg });
        expect(updates).toContainEqual({ row: 4, col: 4, value: maleAvg });

        expect(mockSetStatisticProgress).toHaveBeenCalledWith(false);
        expect(closeModal).toHaveBeenCalledTimes(1);
    });

    it('should add a number of cases variable when requested', async () => {
        const { result } = renderHook(() => useAggregateData());
        const closeModal = jest.fn();

        act(() => {
            result.current.moveToBreak(sampleVariables[0] as any);
            result.current.setAddNumberOfCases(true);
            result.current.setBreakName('N_Gender');
        });

        await act(async () => {
            await result.current.handleConfirm(closeModal);
        });

        expect(mockAddVariables).toHaveBeenCalledTimes(1);
        const [newVars, updates] = mockAddVariables.mock.calls[0];

        // Check the new variable for number of cases
        expect(newVars).toHaveLength(1);
        expect(newVars[0]).toMatchObject({
            name: 'N_Gender',
            type: 'NUMERIC',
            label: 'Number of cases in break group'
        });

        // Check the cell updates for the new variable
        expect(updates).toHaveLength(sampleData.length);
        expect(updates).toContainEqual({ row: 0, col: 4, value: 3 });
        expect(updates).toContainEqual({ row: 1, col: 4, value: 2 });
        expect(updates).toContainEqual({ row: 2, col: 4, value: 3 });
        expect(updates).toContainEqual({ row: 3, col: 4, value: 2 });
        expect(updates).toContainEqual({ row: 4, col: 4, value: 3 });
    });
}); 