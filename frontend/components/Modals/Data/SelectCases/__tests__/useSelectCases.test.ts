import { renderHook, act } from '@testing-library/react';
import { useSelectCases } from '../hooks/useSelectCases';
import { useVariableStore } from '@/stores/useVariableStore';
import { useDataStore } from '@/stores/useDataStore';
import { useModalStore } from '@/stores/useModalStore';
import { useMetaStore } from '@/stores/useMetaStore';
import * as selectors from '../services/selectors';
import type { Variable } from '@/types/Variable';

jest.mock('@/stores/useVariableStore');
jest.mock('@/stores/useDataStore');
jest.mock('@/stores/useModalStore');
jest.mock('@/stores/useMetaStore');
jest.mock('../services/selectors');

const mockedUseVariableStore = useVariableStore as unknown as jest.Mock;
const mockedUseDataStore = useDataStore as unknown as jest.Mock;
const mockedUseModalStore = useModalStore as unknown as jest.Mock;
const mockedUseMetaStore = useMetaStore as unknown as jest.Mock;
const mockedSelectors = selectors as jest.Mocked<typeof selectors>;

const mockVariables: Variable[] = [
    { name: 'age', columnIndex: 0, type: 'NUMERIC', label: 'Age', measure: 'scale', role: 'input', values: [], missing: null, decimals: 0, width: 8, columns: 12, align: 'left' },
    { name: 'gender', columnIndex: 1, type: 'STRING', label: 'Gender', measure: 'nominal', role: 'input', values: [], missing: null, decimals: 0, width: 8, columns: 12, align: 'left' }
];
const mockData = [[25, 'M'], [35, 'F']];

describe('useSelectCases Hook', () => {
    const mockCloseModal = jest.fn();
    const mockAddVariables = jest.fn();
    const mockUpdateCells = jest.fn();
    const mockSetFilter = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockedUseVariableStore.mockReturnValue({ variables: mockVariables, addVariables: mockAddVariables });
        mockedUseDataStore.mockReturnValue({ data: mockData, updateCells: mockUpdateCells });
        mockedUseModalStore.mockReturnValue({ closeModal: mockCloseModal });
        mockedUseMetaStore.mockReturnValue({ setFilter: mockSetFilter });
        mockedSelectors.selectByCondition.mockReturnValue([0]); // Default mock
    });

    it('initializes correctly', () => {
        const { result } = renderHook(() => useSelectCases());
        expect(result.current.selectOption).toBe('all');
        expect(result.current.storeVariables.length).toBe(2);
        expect(result.current.currentStatus).toBe('Do not filter cases');
    });

    it('handles opening sub-dialogs', () => {
        const { result } = renderHook(() => useSelectCases());
        
        act(() => result.current.handleIfButtonClick());
        expect(result.current.ifConditionDialogOpen).toBe(true);

        act(() => result.current.handleSampleButtonClick());
        expect(result.current.randomSampleDialogOpen).toBe(true);

        act(() => result.current.handleRangeButtonClick());
        expect(result.current.rangeDialogOpen).toBe(true);
    });

    it('updates state when a condition is provided', () => {
        const { result } = renderHook(() => useSelectCases());
        const condition = 'age > 30';
        act(() => result.current.handleIfConditionContinue(condition));
        
        expect(result.current.conditionExpression).toBe(condition);
        expect(result.current.ifConditionDialogOpen).toBe(false);
        expect(result.current.currentStatus).toBe(`Condition: ${condition}`);
    });

    it('handles selecting a filter variable', () => {
        const { result } = renderHook(() => useSelectCases());
        
        act(() => result.current.handleVariableSelect(1, 'available'));
        expect(result.current.highlightedVariable).toEqual({ id: '1', source: 'available' });

        act(() => result.current.handleTransferClick());
        expect(result.current.filterVariable?.name).toBe('gender');
        expect(result.current.selectOption).toBe('variable');
    });

    it('handles reset correctly', () => {
        const { result } = renderHook(() => useSelectCases());
        act(() => result.current.handleIfConditionContinue('age > 30'));
        act(() => result.current.handleReset());

        expect(result.current.conditionExpression).toBe('');
        expect(result.current.selectOption).toBe('all');
        expect(result.current.currentStatus).toBe('Do not filter cases');
        expect(mockSetFilter).toHaveBeenCalledWith('');
    });

    describe('handleConfirm', () => {
        it('successfully applies a condition filter and creates a new filter variable', async () => {
            mockedUseVariableStore.mockReturnValue({ variables: mockVariables, addVariables: mockAddVariables, updateVariable: jest.fn() });
            
            const { result } = renderHook(() => useSelectCases());
            
            act(() => {
                result.current.setSelectOption('condition');
                result.current.handleIfConditionContinue('age > 25');
            });

            await act(async () => {
                await result.current.handleConfirm();
            });

            expect(mockedSelectors.selectByCondition).toHaveBeenCalledWith(mockData, mockVariables, 'age > 25');
            expect(mockAddVariables).toHaveBeenCalledTimes(1);
            
            const [newVars, updates] = mockAddVariables.mock.calls[0];
            expect(newVars).toHaveLength(1);
            expect(newVars[0]).toMatchObject({ name: 'filter_$' });
            expect(updates).toBeInstanceOf(Array);
            expect(updates.length).toBe(mockData.length);

            expect(mockUpdateCells).not.toHaveBeenCalled();
            expect(mockSetFilter).toHaveBeenCalledWith('filter_$');
            expect(mockCloseModal).toHaveBeenCalledTimes(1);
        });

        it('successfully applies a condition filter and updates an existing filter variable', async () => {
            const existingFilterVar = { name: 'filter_$', columnIndex: 2, type: 'NUMERIC', measure: 'nominal', role: 'input', label: 'Filter', values: [], missing: null, decimals: 0, width: 8, columns: 12, align: 'left' };
            const varsWithFilter = [...mockVariables, existingFilterVar];
            mockedUseVariableStore.mockReturnValue({ variables: varsWithFilter, addVariables: mockAddVariables, updateVariable: jest.fn() });
            
            const { result } = renderHook(() => useSelectCases());
            
            act(() => {
                result.current.setSelectOption('condition');
                result.current.handleIfConditionContinue('age > 25');
            });

            await act(async () => {
                await result.current.handleConfirm();
            });

            expect(mockedSelectors.selectByCondition).toHaveBeenCalledWith(mockData, varsWithFilter, 'age > 25');
            expect(mockAddVariables).not.toHaveBeenCalled();
            expect(mockUpdateCells).toHaveBeenCalledTimes(1);
            
            const [updates] = mockUpdateCells.mock.calls[0];
            expect(updates).toBeInstanceOf(Array);
            expect(updates.length).toBe(mockData.length);

            expect(mockSetFilter).toHaveBeenCalledWith('filter_$');
            expect(mockCloseModal).toHaveBeenCalledTimes(1);
        });

        it('shows an error if no cases are selected', async () => {
            mockedSelectors.selectByCondition.mockReturnValue([]);
            const { result } = renderHook(() => useSelectCases());
            
            act(() => {
                result.current.setSelectOption('condition');
                result.current.handleIfConditionContinue('age > 99');
            });

            await act(async () => {
                await result.current.handleConfirm();
            });

            expect(result.current.errorMessage).toBe('No cases match the specified condition');
            expect(result.current.errorDialogOpen).toBe(true);
            expect(mockCloseModal).not.toHaveBeenCalled();
        });
    });
}); 