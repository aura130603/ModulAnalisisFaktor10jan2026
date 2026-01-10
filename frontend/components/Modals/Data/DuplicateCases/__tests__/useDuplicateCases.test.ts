import { renderHook, act } from '@testing-library/react';
import { useDuplicateCases } from '../hooks/useDuplicateCases';
import { useVariableStore } from '@/stores/useVariableStore';
import { useDataStore } from '@/stores/useDataStore';
import { useResultStore } from '@/stores/useResultStore';
import * as duplicateCasesService from '../services/duplicateCasesService';
import type { Variable } from '@/types/Variable';

// Mock stores and services
jest.mock('@/stores/useVariableStore');
jest.mock('@/stores/useDataStore');
jest.mock('@/stores/useResultStore');
jest.mock('../services/duplicateCasesService');
jest.mock('../hooks/useDuplicateCases');


const mockedUseVariableStore = useVariableStore as unknown as jest.Mock;
const mockedUseDataStore = useDataStore as unknown as jest.Mock;
const mockedUseResultStore = useResultStore as unknown as jest.Mock;
const mockedProcessDuplicates = duplicateCasesService.processDuplicates as jest.Mock;
const mockedGenerateStatistics = duplicateCasesService.generateStatistics as jest.Mock;

const mockAddVariable = jest.fn().mockResolvedValue(undefined);
const mockUpdateCells = jest.fn().mockResolvedValue(undefined);
const mockSetData = jest.fn().mockResolvedValue(undefined);
const mockAddLog = jest.fn().mockResolvedValue('log1');
const mockAddAnalytic = jest.fn().mockResolvedValue('analytic1');
const mockAddStatistic = jest.fn().mockResolvedValue(undefined);

// New tests for useDuplicateCases hook
const sampleVariables: Variable[] = [
    { tempId: '1', columnIndex: 0, name: 'Var1', type: 'NUMERIC', measure: 'scale', label: "Variable 1", width: 8, decimals: 2, columns: 8, align: 'right', role: 'input', values: [], missing: {} },
    { tempId: '2', columnIndex: 1, name: 'Var2', type: 'STRING', measure: 'nominal', label: "Variable 2", width: 8, decimals: 0, columns: 8, align: 'left', role: 'input', values: [], missing: {} },
];

const sampleData = [
    ['Var1', 'Var2'],
    [1, 'A'],
    [2, 'B'],
];

// Unmock the hook for direct testing
jest.unmock('../hooks/useDuplicateCases');

describe('useDuplicateCases Hook', () => {

    beforeEach(() => {
        jest.clearAllMocks();

        const variableStoreState = {
            variables: sampleVariables,
            addVariable: mockAddVariable,
        };
        mockedUseVariableStore.mockReturnValue(variableStoreState);
        (useVariableStore as any).getState = () => variableStoreState;

        const dataStoreState = {
            data: sampleData,
            updateCells: mockUpdateCells,
            setData: mockSetData,
        };
        mockedUseDataStore.mockReturnValue(dataStoreState);
        (useDataStore as any).getState = () => dataStoreState;

        mockedUseResultStore.mockReturnValue({
            addLog: mockAddLog,
            addAnalytic: mockAddAnalytic,
            addStatistic: mockAddStatistic,
        });

        mockedProcessDuplicates.mockReturnValue({
            primaryValues: [1, 0],
            sequenceValues: [0, 0],
            reorderedData: null,
        });

        mockedGenerateStatistics.mockReturnValue([]);
    });

    it('initializes with variables from the store', () => {
        const { result } = renderHook(() => useDuplicateCases({ onClose: jest.fn() }));
        expect(result.current.sourceVariables.length).toBe(2);
        expect(result.current.matchingVariables.length).toBe(0);
        expect(result.current.sortingVariables.length).toBe(0);
    });

    it('moves a variable from available to matching', () => {
        const { result } = renderHook(() => useDuplicateCases({ onClose: jest.fn() }));
        act(() => {
            result.current.handleMoveVariable(sampleVariables[0], 'available', 'matching');
        });
        expect(result.current.sourceVariables.length).toBe(1);
        expect(result.current.matchingVariables.length).toBe(1);
        expect(result.current.matchingVariables[0].name).toBe('Var1');
    });

    it('resets the state', () => {
        const { result } = renderHook(() => useDuplicateCases({ onClose: jest.fn() }));
        act(() => {
            result.current.handleMoveVariable(sampleVariables[0], 'available', 'matching');
            result.current.setSequentialCount(true);
        });
        expect(result.current.matchingVariables.length).toBe(1);
        expect(result.current.sequentialCount).toBe(true);
        act(() => {
            result.current.handleReset();
        });
        expect(result.current.matchingVariables.length).toBe(0);
        expect(result.current.sequentialCount).toBe(false);
        expect(result.current.sourceVariables.length).toBe(2);
    });

    it('shows an error if handleConfirm is called with no matching variables', async () => {
        const { result } = renderHook(() => useDuplicateCases({ onClose: jest.fn() }));
        await act(async () => {
            await result.current.handleConfirm();
        });
        expect(result.current.errorMessage).toBe("No matching variables have been selected.");
        expect(result.current.errorDialogOpen).toBe(true);
        expect(mockedProcessDuplicates).not.toHaveBeenCalled();
    });

    it('calls processDuplicates on confirm with valid setup', async () => {
        const { result } = renderHook(() => useDuplicateCases({ onClose: jest.fn() }));
        act(() => {
            result.current.handleMoveVariable(sampleVariables[0], 'available', 'matching');
        });
        await act(async () => {
            await result.current.handleConfirm();
        });
        expect(result.current.isProcessing).toBe(false);
        expect(mockedProcessDuplicates).toHaveBeenCalledTimes(1);
        expect(mockAddVariable).toHaveBeenCalledTimes(1); // For PrimaryLast
        expect(mockUpdateCells).toHaveBeenCalledTimes(1);
    });
    
    it('moves matching cases to top when moveMatchingToTop is true', async () => {
        mockedProcessDuplicates.mockReturnValue({
            primaryValues: [1, 0],
            sequenceValues: [0, 0],
            reorderedData: [ ['Var2', 'Var1'], ['B', 2], ['A', 1] ],
        });
        const { result } = renderHook(() => useDuplicateCases({ onClose: jest.fn() }));

        act(() => {
            result.current.setMoveMatchingToTop(true);
            result.current.handleMoveVariable(sampleVariables[0], 'available', 'matching');
        });

        await act(async () => {
            await result.current.handleConfirm();
        });

        expect(mockSetData).toHaveBeenCalledWith([ ['B', 2], ['A', 1] ]);
    });

    it('filters out duplicate cases when filterByIndicator is true', async () => {
        const mockOnClose = jest.fn();
        const primaryVar: Variable = {
            tempId: 'primary',
            columnIndex: 2,
            name: 'PrimaryLast',
            type: 'NUMERIC',
            width: 1,
            decimals: 0,
            label: '',
            columns: 72,
            align: 'right',
            measure: 'nominal',
            role: 'input',
            values: [],
            missing: {},
        };
        const dataWithIndicators = [
            ['Var1', 'Var2', 'PrimaryLast'],
            [1, 'A', 1],
            [2, 'B', 0],
        ];

        (useVariableStore as any).getState = () => ({
            variables: [...sampleVariables, primaryVar],
        });
        (useDataStore as any).getState = () => ({
            data: dataWithIndicators,
        });

        const { result } = renderHook(() => useDuplicateCases({ onClose: mockOnClose }));

        act(() => {
            result.current.handleMoveVariable(sampleVariables[0], 'available', 'matching');
            result.current.setFilterByIndicator(true);
            result.current.setPrimaryName('PrimaryLast');
        });

        await act(async () => {
            await result.current.handleConfirm();
        });

        const expectedFilteredData = [
            ['Var1', 'Var2', 'PrimaryLast'],
            [1, 'A', 1]
        ];
        
        expect(mockSetData).toHaveBeenCalledWith(expectedFilteredData);
    });

    it('creates statistic log when displayFrequencies is true', async () => {
        mockedGenerateStatistics.mockReturnValue([{
            title: 'Freq Table',
            description: 'desc',
            component: 'FrequencyTable',
            output_data: { rows: [], headers: [] }
        }]);
        const { result } = renderHook(() => useDuplicateCases({ onClose: jest.fn() }));

        act(() => {
            result.current.setDisplayFrequencies(true);
            result.current.handleMoveVariable(sampleVariables[0], 'available', 'matching');
        });

        await act(async () => {
            await result.current.handleConfirm();
        });
        
        expect(mockedGenerateStatistics).toHaveBeenCalledTimes(1);
        expect(mockAddLog).toHaveBeenCalledTimes(1);
        expect(mockAddAnalytic).toHaveBeenCalledTimes(1);
        expect(mockAddStatistic).toHaveBeenCalledTimes(1);
    });
}); 