import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useSetMeasurementLevel } from '../hooks/useSetMeasurementLevel';
import { useVariableStore } from '@/stores/useVariableStore';
import type { Variable } from '@/types/Variable';

jest.mock('@/stores/useVariableStore');
jest.mock('@/components/Common/VariableListManager', () => ({
    __esModule: true,
    default: () => <div>Mocked VariableListManager</div>,
}));

const mockUseVariableStore = useVariableStore as jest.MockedFunction<typeof useVariableStore>;
const mockUpdateVariable = jest.fn();
const mockOnClose = jest.fn();

const createMockVariable = (overrides: Partial<Variable> & { name: string; columnIndex: number }): Variable => ({
    type: 'NUMERIC',
    width: 8,
    decimals: 2,
    label: '',
    values: [],
    missing: null,
    align: 'right',
    measure: 'unknown',
    role: 'input',
    columns: 1,
    ...overrides,
});

const mockVariables: Variable[] = [
    createMockVariable({ name: 'Var1', columnIndex: 0, measure: 'unknown' }),
    createMockVariable({ name: 'Var2', columnIndex: 1, measure: 'nominal' }),
    createMockVariable({ name: 'Var3', columnIndex: 2, measure: 'unknown' }),
    createMockVariable({ name: 'Var4', columnIndex: 3, measure: 'scale' }),
    createMockVariable({ name: 'Var5', columnIndex: 4, measure: 'unknown' }),
];

describe('useSetMeasurementLevel Hook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseVariableStore.mockReturnValue({
            variables: mockVariables,
            updateVariable: mockUpdateVariable,
        } as any);
    });

    it('should initialize with only "unknown" variables', () => {
        const { result } = renderHook(() => useSetMeasurementLevel({ onClose: mockOnClose }));

        expect(result.current.unknownVariables).toHaveLength(3);
        expect(result.current.unknownVariables.map(v => v.name)).toEqual(['Var1', 'Var3', 'Var5']);
        expect(result.current.nominalVariables).toEqual([]);
        expect(result.current.ordinalVariables).toEqual([]);
        expect(result.current.scaleVariables).toEqual([]);
    });

    it('should move a variable from unknown to a target list', () => {
        const { result } = renderHook(() => useSetMeasurementLevel({ onClose: mockOnClose }));
        
        const variableToMove = result.current.unknownVariables[0]; // Var1

        act(() => {
            result.current.handleMoveVariable(variableToMove, 'available', 'nominal');
        });

        expect(result.current.unknownVariables).toHaveLength(2);
        expect(result.current.unknownVariables.map(v => v.name)).not.toContain('Var1');
        expect(result.current.nominalVariables).toHaveLength(1);
        expect(result.current.nominalVariables[0].name).toBe('Var1');
    });

    it('should save changes by calling updateVariable for each moved item and then call onClose', () => {
        const { result } = renderHook(() => useSetMeasurementLevel({ onClose: mockOnClose }));
        
        const var1 = result.current.unknownVariables.find(v => v.name === 'Var1')!;
        const var3 = result.current.unknownVariables.find(v => v.name === 'Var3')!;
        const var5 = result.current.unknownVariables.find(v => v.name === 'Var5')!;

        act(() => {
            result.current.handleMoveVariable(var1, 'available', 'nominal');
            result.current.handleMoveVariable(var3, 'available', 'ordinal');
            result.current.handleMoveVariable(var5, 'available', 'scale');
        });

        act(() => {
            result.current.handleSave();
        });

        expect(mockUpdateVariable).toHaveBeenCalledTimes(3);
        expect(mockUpdateVariable).toHaveBeenCalledWith(var1.columnIndex, "measure", "nominal");
        expect(mockUpdateVariable).toHaveBeenCalledWith(var3.columnIndex, "measure", "ordinal");
        expect(mockUpdateVariable).toHaveBeenCalledWith(var5.columnIndex, "measure", "scale");
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should reset lists to their initial state', () => {
        const { result } = renderHook(() => useSetMeasurementLevel({ onClose: mockOnClose }));

        act(() => {
            const variableToMove = result.current.unknownVariables[0];
            result.current.handleMoveVariable(variableToMove, 'available', 'nominal');
        });

        expect(result.current.nominalVariables).toHaveLength(1);

        act(() => {
            result.current.handleReset();
        });

        expect(result.current.unknownVariables).toHaveLength(3);
        expect(result.current.nominalVariables).toEqual([]);
        expect(result.current.ordinalVariables).toEqual([]);
        expect(result.current.scaleVariables).toEqual([]);
    });

    it('should correctly reset after moving multiple variables to different lists', () => {
        const { result } = renderHook(() => useSetMeasurementLevel({ onClose: mockOnClose }));
        
        const var1 = result.current.unknownVariables.find(v => v.name === 'Var1')!;
        const var3 = result.current.unknownVariables.find(v => v.name === 'Var3')!;
        const var5 = result.current.unknownVariables.find(v => v.name === 'Var5')!;

        act(() => {
            result.current.handleMoveVariable(var1, 'available', 'nominal');
            result.current.handleMoveVariable(var3, 'available', 'ordinal');
            result.current.handleMoveVariable(var5, 'available', 'scale');
        });

        // Verify variables were moved
        expect(result.current.unknownVariables).toHaveLength(0);
        expect(result.current.nominalVariables).toHaveLength(1);
        expect(result.current.ordinalVariables).toHaveLength(1);
        expect(result.current.scaleVariables).toHaveLength(1);

        // Reset the state
        act(() => {
            result.current.handleReset();
        });

        // Verify state is back to initial
        expect(result.current.unknownVariables).toHaveLength(3);
        expect(result.current.nominalVariables).toEqual([]);
        expect(result.current.ordinalVariables).toEqual([]);
        expect(result.current.scaleVariables).toEqual([]);
        // Verify the content of the unknown list
        const unknownNames = result.current.unknownVariables.map(v => v.name).sort();
        expect(unknownNames).toEqual(['Var1', 'Var3', 'Var5'].sort());
    });
}); 