import { renderHook, act } from '@testing-library/react';
import { useRestructure, RestructureMethod } from '../hooks/useRestructure';
import { restructureData } from '../services/restructureService';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import type { Variable } from '@/types/Variable';

jest.mock('../services/restructureService');
jest.mock('@/stores/useDataStore');
jest.mock('@/stores/useVariableStore');

const mockedRestructureData = restructureData as jest.Mock;
const mockedSetData = jest.fn();
const mockedOverwriteAll = jest.fn();

const mockVariables: Variable[] = [
    { id: 1, name: 'var1', columnIndex: 0, type: 'NUMERIC', measure: 'scale', width: 8, decimals: 0, label: '', values: [], missing: null, columns: 1, align: 'right', role: 'input' },
    { id: 2, name: 'var2', columnIndex: 1, type: 'STRING', measure: 'nominal', width: 8, decimals: 0, label: '', values: [], missing: null, columns: 1, align: 'left', role: 'input' },
];

describe('useRestructure', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        const dataStoreState = {
            data: [[1, 'a'], [2, 'b']],
            setData: mockedSetData,
        };
        (useDataStore as unknown as jest.Mock).mockReturnValue(dataStoreState);
        (useDataStore as any).getState = () => dataStoreState;

        const variableStoreState = {
            variables: mockVariables,
            overwriteAll: mockedOverwriteAll,
        };
        (useVariableStore as unknown as jest.Mock).mockReturnValue(variableStoreState);
        (useVariableStore as any).getState = () => variableStoreState;

        mockedRestructureData.mockReturnValue({
            data: [[1, 2, 3]],
            variables: [{ name: 'newVar' }]
        });
    });

    it('initializes with default values', () => {
        const { result } = renderHook(() => useRestructure());
        expect(result.current.currentStep).toBe(1);
        expect(result.current.activeTab).toBe('type');
        expect(result.current.method).toBe(RestructureMethod.VariablesToCases);
    });

    it('handles step navigation with validation', () => {
        const { result } = renderHook(() => useRestructure());

        // Step 1 -> Step 2
        act(() => {
            result.current.handleNext();
        });

        expect(result.current.currentStep).toBe(2);
        expect(result.current.activeTab).toBe('variables');
        expect(result.current.validationErrors).toEqual([]);

        // Step 2 -> Step 1 (Back)
        act(() => {
            result.current.handleBack();
        });
        expect(result.current.currentStep).toBe(1);
        expect(result.current.activeTab).toBe('type');
        
        // Step 2 validation fail
        act(() => {
            result.current.handleNext(); // to step 2
        });
        act(() => {
            result.current.handleNext(); // to step 3, should fail
        });
        expect(result.current.validationErrors.length).toBeGreaterThan(0);
        expect(result.current.currentStep).toBe(2); // Stays on step 2
    });
    
    it('jumps to options step for Transpose method', () => {
        const { result } = renderHook(() => useRestructure());
        
        act(() => {
            result.current.setMethod(RestructureMethod.TransposeAllData);
        });
        
        act(() => {
            result.current.handleNext();
        });
        
        expect(result.current.currentStep).toBe(3);
        expect(result.current.activeTab).toBe('options');
    });

    it('calls restructure service on finish and updates stores', async () => {
        const { result } = renderHook(() => useRestructure());
        const mockOnClose = jest.fn();
        
        // Set up valid state to pass validation
        act(() => {
            result.current.handleMoveVariable(result.current.availableVariables[0], 'available', 'selected');
            result.current.handleMoveVariable(result.current.availableVariables[1], 'available', 'index');
        });

        await act(async () => {
            await result.current.handleFinish(mockOnClose);
        });

        expect(mockedRestructureData).toHaveBeenCalled();
        expect(mockedSetData).not.toHaveBeenCalled();
        expect(mockedOverwriteAll).toHaveBeenCalledWith([{ name: 'newVar' }], [[1, 2, 3]]);
        expect(mockOnClose).toHaveBeenCalled();
    });
}); 