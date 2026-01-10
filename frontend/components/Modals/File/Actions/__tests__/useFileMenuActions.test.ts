import { renderHook, act } from '@testing-library/react';
import { useFileMenuActions } from '../useFileMenuActions';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { useMetaStore } from '@/stores/useMetaStore';
import { useResultStore } from '@/stores/useResultStore';
import { useRouter } from 'next/navigation';
import * as api from '@/services/api';

// Mock dependencies
jest.mock('@/stores/useDataStore');
jest.mock('@/stores/useVariableStore');
jest.mock('@/stores/useMetaStore');
jest.mock('@/stores/useResultStore');
jest.mock('next/navigation');
jest.mock('@/services/api');

const mockedUseDataStore = useDataStore as jest.Mocked<typeof useDataStore>;
const mockedUseVariableStore = useVariableStore as jest.Mocked<typeof useVariableStore>;
const mockedUseMetaStore = useMetaStore as jest.Mocked<typeof useMetaStore>;
const mockedUseResultStore = useResultStore as jest.Mocked<typeof useResultStore>;
const mockedUseRouter = useRouter as jest.Mock;
const mockedApi = api as jest.Mocked<typeof api>;

describe('useFileMenuActions hook', () => {
    const mockResetData = jest.fn();
    const mockResetVariables = jest.fn();
    const mockResetMeta = jest.fn();
    const mockClearAllResults = jest.fn();
    const mockSaveData = jest.fn();
    const mockSaveVariables = jest.fn();
    const mockSaveMeta = jest.fn();
    const mockLoadData = jest.fn();
    const mockLoadVariables = jest.fn();
    const mockPush = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        mockedUseDataStore.getState = jest.fn().mockReturnValue({
            resetData: mockResetData,
            saveData: mockSaveData,
            loadData: mockLoadData,
            data: [[1, 'test']],
        });
        mockedUseVariableStore.getState = jest.fn().mockReturnValue({
            resetVariables: mockResetVariables,
            saveVariables: mockSaveVariables,
            loadVariables: mockLoadVariables,
            variables: [{ name: 'var1', columnIndex: 0 }],
        });
        mockedUseMetaStore.getState = jest.fn().mockReturnValue({
            resetMeta: mockResetMeta,
            saveMeta: mockSaveMeta,
        });
        mockedUseResultStore.getState = jest.fn().mockReturnValue({
            clearAll: mockClearAllResults,
        });
        mockedUseRouter.mockReturnValue({ push: mockPush });
        mockedApi.createSavFile.mockResolvedValue(new Blob());
        mockedApi.downloadBlobAsFile.mockImplementation(() => {});
    });

    it("should call reset on all stores for 'New' action", async () => {
        const { result } = renderHook(() => useFileMenuActions());
        await act(async () => {
            await result.current.handleAction({ actionType: 'New' });
        });
        expect(mockResetData).toHaveBeenCalled();
        expect(mockResetVariables).toHaveBeenCalled();
        expect(mockResetMeta).toHaveBeenCalled();
        expect(mockClearAllResults).toHaveBeenCalled();
    });

    it("should call save on relevant stores for 'Save' action", async () => {
        const { result } = renderHook(() => useFileMenuActions());
        await act(async () => {
            await result.current.handleAction({ actionType: 'Save' });
        });
        expect(mockSaveData).toHaveBeenCalled();
        expect(mockSaveVariables).toHaveBeenCalled();
        expect(mockSaveMeta).toHaveBeenCalled();
    });

    it("should handle 'SaveAs' action correctly", async () => {
        const { result } = renderHook(() => useFileMenuActions());
        await act(async () => {
            await result.current.handleAction({ actionType: 'SaveAs' });
        });
        expect(mockLoadVariables).toHaveBeenCalled();
        expect(mockLoadData).toHaveBeenCalled();
        expect(mockedApi.createSavFile).toHaveBeenCalled();
        expect(mockedApi.downloadBlobAsFile).toHaveBeenCalled();
    });
    
    it("should handle 'Exit' action correctly", async () => {
        const { result } = renderHook(() => useFileMenuActions());
        await act(async () => {
            await result.current.handleAction({ actionType: 'Exit' });
        });
        expect(mockResetData).toHaveBeenCalled();
        expect(mockResetVariables).toHaveBeenCalled();
        expect(mockResetMeta).toHaveBeenCalled();
        expect(mockClearAllResults).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('should warn for unknown action type', async () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const { result } = renderHook(() => useFileMenuActions());
        await act(async () => {
            await result.current.handleAction({ actionType: 'UnknownAction' as any });
        });
        expect(consoleWarnSpy).toHaveBeenCalledWith("Unknown file action:", "UnknownAction");
        consoleWarnSpy.mockRestore();
    });
}); 