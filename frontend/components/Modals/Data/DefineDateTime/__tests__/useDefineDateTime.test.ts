import { renderHook, act } from '@testing-library/react';
import { useDefineDateTime } from '../hooks/useDefineDateTime';
import { useMetaStore } from '@/stores/useMetaStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { useDataStore } from '@/stores/useDataStore';
import { prepareDateVariables } from '../services/dateTimeService';

// Mock services and stores
jest.mock('@/stores/useMetaStore');
jest.mock('@/stores/useVariableStore');
jest.mock('@/stores/useDataStore');
jest.mock('../services/dateTimeService');

const mockedUseMetaStore = useMetaStore as unknown as jest.Mock;
const mockedUseVariableStore = useVariableStore as unknown as jest.Mock;
const mockedUseDataStore = useDataStore as unknown as jest.Mock;
const mockedPrepareDateVariables = prepareDateVariables as jest.Mock;

describe('useDefineDateTime Hook', () => {
    const mockSetMeta = jest.fn().mockResolvedValue(undefined);
    const mockAddVariables = jest.fn().mockResolvedValue(undefined);
    const mockResetVariables = jest.fn().mockResolvedValue(undefined);
    const mockOnClose = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        mockedUseMetaStore.mockReturnValue({ setMeta: mockSetMeta });
        mockedUseVariableStore.mockReturnValue({
            variables: [],
            addVariables: mockAddVariables,
            resetVariables: mockResetVariables,
        });
        mockedUseDataStore.mockReturnValue({ data: [[]] }); // Pass some data to avoid issues with getMaxRow

        mockedPrepareDateVariables.mockReturnValue({
            variablesToCreate: [{ name: 'YEAR_', columnIndex: 0 }],
            cellUpdates: [{ row: 0, col: 0, value: 2023 }],
        });
    });

    it('should call reset and setMeta when case is "Not dated" and then close', async () => {
        const { result } = renderHook(() => useDefineDateTime(mockOnClose));

        act(() => {
            result.current.setSelectedCase('Not dated');
        });
        
        await act(async () => {
            await result.current.handleOk();
        });

        expect(mockResetVariables).toHaveBeenCalledTimes(1);
        expect(mockSetMeta).toHaveBeenCalledWith({ dates: "" });
        expect(mockAddVariables).not.toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call prepareDateVariables and addVariables for a date case and then close', async () => {
        const { result } = renderHook(() => useDefineDateTime(mockOnClose));

        act(() => {
            result.current.setSelectedCase('Years');
        });

        await act(async () => {
            await result.current.handleOk();
        });

        expect(mockSetMeta).toHaveBeenCalledWith({ dates: expect.stringContaining('Year(1900)') });
        expect(mockedPrepareDateVariables).toHaveBeenCalledTimes(1);
        expect(mockAddVariables).toHaveBeenCalledWith(
            [{ name: 'YEAR_', columnIndex: 0 }],
            [{ row: 0, col: 0, value: 2023 }]
        );
        expect(mockResetVariables).not.toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
    
    it('should not call addVariables if no variables are created', async () => {
        mockedPrepareDateVariables.mockReturnValue({
            variablesToCreate: [],
            cellUpdates: [],
        });
        
        const { result } = renderHook(() => useDefineDateTime(mockOnClose));

        act(() => {
            result.current.setSelectedCase('Years');
        });
        
        await act(async () => {
            await result.current.handleOk();
        });

        expect(mockAddVariables).not.toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call handleReset and update selectedCase', () => {
        const { result } = renderHook(() => useDefineDateTime(mockOnClose));
    
        act(() => {
            result.current.setSelectedCase('Years');
        });

        act(() => {
            result.current.handleReset();
        });
    
        expect(result.current.selectedCase).toBe('Not dated');
    });
}); 