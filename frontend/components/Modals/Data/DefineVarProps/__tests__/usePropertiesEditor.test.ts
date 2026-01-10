import { renderHook, act } from '@testing-library/react';
import { usePropertiesEditor } from '../hooks/usePropertiesEditor';
import * as variablePropertiesService from '../services/variablePropertiesService';
import type { Variable } from '@/types/Variable';

jest.mock('../services/variablePropertiesService');

const mockedVPService = variablePropertiesService as jest.Mocked<typeof variablePropertiesService>;

const mockInitialVariables: Variable[] = [
  { tempId: '1', name: 'var1', columnIndex: 0, type: 'NUMERIC', measure: 'scale', role: 'input', values: [], missing: null, decimals: 0, width: 8, columns: 12, align: 'left', label: 'Variable 1' },
  { tempId: '2', name: 'var2', columnIndex: 1, type: 'STRING', measure: 'nominal', role: 'input', values: [{value: 'A', label: 'Category A', variableId: 1}], missing: null, decimals: 0, width: 8, columns: 12, align: 'left', label: 'Variable 2' },
];

describe('usePropertiesEditor', () => {
    const onSave = jest.fn();
    const onClose = jest.fn();
    const mockUniqueValues = [{ value: '1', count: 10 }, { value: '2', count: 5 }];

    beforeEach(() => {
        jest.clearAllMocks();
        mockedVPService.getUniqueValuesWithCounts.mockReturnValue(mockUniqueValues);
        mockedVPService.suggestMeasurementLevel.mockReturnValue({ level: 'ordinal', explanation: 'test explanation' });
        mockedVPService.saveVariableProperties.mockResolvedValue(undefined);
    });

    const setupHook = (initialVariables = mockInitialVariables) => {
        return renderHook(() => usePropertiesEditor({
            initialVariables,
            caseLimit: '50',
            valueLimit: '200',
            onSave,
            onClose,
        }));
    };

    it('should initialize with the first variable selected', () => {
        const { result } = setupHook();
        expect(result.current.currentVariable?.name).toBe('var1');
        expect(result.current.selectedVariableIndex).toBe(0);
        expect(mockedVPService.getUniqueValuesWithCounts).toHaveBeenCalledWith(expect.any(Array), 0, 'NUMERIC', '50', '200');
    });

    it('should change selected variable on handleVariableChange', () => {
        const { result } = setupHook();
        
        act(() => {
            result.current.handleVariableChange(1);
        });

        expect(result.current.currentVariable?.name).toBe('var2');
        expect(result.current.selectedVariableIndex).toBe(1);
        expect(mockedVPService.getUniqueValuesWithCounts).toHaveBeenCalledWith(expect.any(Array), 1, 'STRING', '50', '200');
    });

    it('should update a field on handleVariableFieldChange', () => {
        const { result } = setupHook();
        
        act(() => {
            result.current.handleVariableFieldChange('label', 'New Label');
        });

        expect(result.current.currentVariable?.label).toBe('New Label');
    });

    it('should suggest a measurement level', () => {
        const { result } = setupHook();

        act(() => {
            result.current.handleSuggestMeasurement();
        });

        expect(mockedVPService.suggestMeasurementLevel).toHaveBeenCalled();
        expect(result.current.suggestDialogOpen).toBe(true);
        expect(result.current.suggestedMeasure).toBe('ordinal');
    });

    it('should accept a suggested measurement level', () => {
        const { result } = setupHook();

        act(() => {
            result.current.handleSuggestMeasurement();
        });

        act(() => {
            result.current.handleAcceptSuggestion();
        });

        expect(result.current.currentVariable?.measure).toBe('ordinal');
        expect(result.current.suggestDialogOpen).toBe(false);
    });

    it('should auto-label unlabeled values', () => {
        const { result } = setupHook();

        // Initial grid data from mockUniqueValues
        expect(result.current.gridData[0][5]).toBe(''); // Label for value '1'
        expect(result.current.gridData[1][5]).toBe(''); // Label for value '2'

        act(() => {
            result.current.handleAutoLabel();
        });
        
        expect(result.current.gridData[0][5]).toBe('1');
        expect(result.current.gridData[1][5]).toBe('2');
    });

    it('should save properties on handleSave', async () => {
        const { result } = setupHook();

        act(() => {
            result.current.handleVariableFieldChange('label', 'A new label for saving');
        });
        
        await act(async () => {
            await result.current.handleSave();
        });

        expect(mockedVPService.saveVariableProperties).toHaveBeenCalledTimes(1);
        const savedVariables = (mockedVPService.saveVariableProperties as jest.Mock).mock.calls[0][0];
        expect(savedVariables[0].label).toBe('A new label for saving');
        
        expect(onSave).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

}); 