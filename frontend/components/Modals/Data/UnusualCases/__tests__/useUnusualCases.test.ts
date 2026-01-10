import { renderHook, act } from '@testing-library/react';
import { useUnusualCases } from '../hooks/useUnusualCases';
import { useVariableStore } from '@/stores/useVariableStore';
import type { Variable, VariableType, VariableMeasure, VariableAlign, VariableRole } from '@/types/Variable';

jest.mock('@/stores/useVariableStore');

const mockedUseVariableStore = useVariableStore as unknown as jest.Mock;

const createMockVariable = (
    name: string,
    columnIndex: number
): Variable => ({
    id: columnIndex + 1,
    name,
    columnIndex,
    type: 'NUMERIC' as VariableType,
    measure: 'scale' as VariableMeasure,
    width: 8,
    decimals: 0,
    label: '',
    values: [],
    missing: null,
    columns: 1,
    align: 'right' as VariableAlign,
    role: 'input' as VariableRole,
    tempId: `temp_id_${columnIndex}`,
});

const mockVariables: Variable[] = [
    createMockVariable('VarA', 0),
    createMockVariable('VarB', 1),
    createMockVariable('VarC', 2),
];

describe('useUnusualCases Hook', () => {
    const mockAddVariables = jest.fn();
    const mockOnClose = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockedUseVariableStore.mockReturnValue({ 
            variables: mockVariables,
            addVariables: mockAddVariables,
        });
    });

    it('should initialize with variables from the store', () => {
        const { result } = renderHook(() => useUnusualCases({ onClose: mockOnClose }));
        expect(result.current.availableVariables.map(v => v.name)).toEqual(['VarA', 'VarB', 'VarC']);
        expect(result.current.analysisVariables).toEqual([]);
        expect(result.current.caseIdentifierVariable).toBeNull();
    });

    it('should move a variable to analysis variables', () => {
        const { result } = renderHook(() => useUnusualCases({ onClose: mockOnClose }));
        const varToMove = result.current.availableVariables[0];

        act(() => {
            result.current.moveToAnalysisVariables(varToMove);
        });

        expect(result.current.analysisVariables.map(v => v.name)).toEqual(['VarA']);
        expect(result.current.availableVariables.map(v => v.name)).toEqual(['VarB', 'VarC']);
    });

    it('should move a variable to be the case identifier', () => {
        const { result } = renderHook(() => useUnusualCases({ onClose: mockOnClose }));
        const varToMove = result.current.availableVariables[1];

        act(() => {
            result.current.moveToCaseIdentifierVariable(varToMove);
        });

        expect(result.current.caseIdentifierVariable?.name).toBe('VarB');
        expect(result.current.availableVariables.map(v => v.name)).toEqual(['VarA', 'VarC']);
    });
    
    it('should replace an existing case identifier variable', () => {
        const { result } = renderHook(() => useUnusualCases({ onClose: mockOnClose }));

        act(() => result.current.moveToCaseIdentifierVariable(result.current.availableVariables[1]));
        expect(result.current.caseIdentifierVariable?.name).toBe('VarB');

        const varToMove = result.current.availableVariables.find(v => v.name === 'VarC')!;
        act(() => result.current.moveToCaseIdentifierVariable(varToMove));
        
        expect(result.current.caseIdentifierVariable?.name).toBe('VarC');
        expect(result.current.availableVariables.map(v => v.name)).toContain('VarB');
    });

    it('should move a variable from analysis back to available', () => {
        const { result } = renderHook(() => useUnusualCases({ onClose: mockOnClose }));
        act(() => result.current.moveToAnalysisVariables(result.current.availableVariables[0]));
        
        const varToMoveBack = result.current.analysisVariables[0];
        act(() => {
            result.current.moveToAvailableVariables(varToMoveBack, 'analysis');
        });

        expect(result.current.analysisVariables).toEqual([]);
        expect(result.current.availableVariables.map(v => v.name)).toEqual(['VarA', 'VarB', 'VarC']);
    });

    it('should move the case identifier back to available', () => {
        const { result } = renderHook(() => useUnusualCases({ onClose: mockOnClose }));
        act(() => result.current.moveToCaseIdentifierVariable(result.current.availableVariables[1]));

        const varToMoveBack = result.current.caseIdentifierVariable!;
        act(() => {
            result.current.moveToAvailableVariables(varToMoveBack, 'identifier');
        });

        expect(result.current.caseIdentifierVariable).toBeNull();
        expect(result.current.availableVariables.map(v => v.name)).toEqual(['VarA', 'VarB', 'VarC']);
    });

    it('should call addVariables and close on confirm when save is enabled', async () => {
        const { result } = renderHook(() => useUnusualCases({ onClose: mockOnClose }));

        // Conditions to pass validation and trigger save
        act(() => {
            result.current.moveToAnalysisVariables(result.current.availableVariables[0]);
            result.current.setSaveAnomalyIndex(true);
        });

        await act(async () => {
            await result.current.handleConfirm();
        });

        expect(mockAddVariables).toHaveBeenCalledTimes(1);
        expect(mockAddVariables).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ name: 'AnomalyIndex' })
            ]),
            []
        );
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should set an error if handleConfirm is called with no analysis variables', async () => {
        const { result } = renderHook(() => useUnusualCases({ onClose: mockOnClose }));
        
        await act(async () => {
            await result.current.handleConfirm();
        });

        expect(result.current.errorMsg).toBe("Please select at least one analysis variable.");
        expect(mockAddVariables).not.toHaveBeenCalled();
        expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should reset all state to default values', () => {
        const { result } = renderHook(() => useUnusualCases({ onClose: mockOnClose }));
        
        // Change some state
        act(() => {
            result.current.moveToAnalysisVariables(result.current.availableVariables[0]);
            result.current.setIdentificationCriteria('fixed');
            result.current.setShowUnusualCasesList(false);
            result.current.setSaveAnomalyIndex(true);
            result.current.setMissingValuesOption('include');
        });

        // Verify changes
        expect(result.current.analysisVariables.length).toBe(1);
        expect(result.current.identificationCriteria).toBe('fixed');
        expect(result.current.showUnusualCasesList).toBe(false);

        // Reset
        act(() => {
            result.current.handleReset();
        });

        // Verify reset state
        expect(result.current.analysisVariables).toEqual([]);
        expect(result.current.caseIdentifierVariable).toBeNull();
        expect(result.current.identificationCriteria).toBe('percentage');
        expect(result.current.showUnusualCasesList).toBe(true);
        expect(result.current.saveAnomalyIndex).toBe(false);
        expect(result.current.missingValuesOption).toBe('exclude');
    });
}); 