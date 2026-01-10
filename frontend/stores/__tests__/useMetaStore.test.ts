import { renderHook, act } from '@testing-library/react';
import { useMetaStore } from '../useMetaStore';
import metaService from '@/services/data/MetaService';
import { Meta } from '@/types/Meta';

// Mock the metaService
jest.mock('@/services/data/MetaService');

const mockedMetaService = metaService as jest.Mocked<typeof metaService>;

describe('useMetaStore', () => {
    let initialState: any;

    beforeEach(() => {
        // Reset mocks and state before each test
        jest.clearAllMocks();
        initialState = useMetaStore.getState();
    });

    afterEach(() => {
        act(() => {
            useMetaStore.setState(initialState, true);
        });
    });

    it('should have a correct initial state', () => {
        const { result } = renderHook(() => useMetaStore());
        expect(result.current.meta.name).toBe('');
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe(null);
        expect(result.current.isLoaded).toBe(false);
    });

    it('should load meta data correctly', async () => {
        const { result } = renderHook(() => useMetaStore());
        const mockMeta: Meta = { name: 'Test Project', location: '', created: new Date(), weight: 'W1', dates: '', filter: '' };
        
        mockedMetaService.loadMeta.mockResolvedValue(mockMeta);

        await act(async () => {
            await result.current.loadMeta();
        });

        expect(result.current.meta.name).toBe('Test Project');
        expect(result.current.isLoaded).toBe(true);
        expect(mockedMetaService.loadMeta).toHaveBeenCalledTimes(1);
    });

    it('should set meta data and call saveMeta', async () => {
        const { result } = renderHook(() => useMetaStore());
        const newMetaData = { name: 'My Project', weight: 'WGT' };

        mockedMetaService.saveMeta.mockResolvedValue(undefined);

        await act(async () => {
            await result.current.setMeta(newMetaData);
        });

        expect(result.current.meta.name).toBe('My Project');
        expect(result.current.meta.weight).toBe('WGT');
        expect(mockedMetaService.saveMeta).toHaveBeenCalledTimes(1);
        expect(mockedMetaService.saveMeta).toHaveBeenCalledWith(
            expect.objectContaining(newMetaData)
        );
    });

    it('should reset meta data and call resetMeta', async () => {
        const { result } = renderHook(() => useMetaStore());

        // Set some initial data
        act(() => {
            result.current.setMeta({ name: 'Old Project' });
        });
        
        mockedMetaService.resetMeta.mockResolvedValue(undefined);
        mockedMetaService.saveMeta.mockResolvedValue(undefined); // for the save after reset

        await act(async () => {
            await result.current.resetMeta();
        });

        expect(result.current.meta.name).toBe('');
        expect(result.current.isLoaded).toBe(false);
        expect(mockedMetaService.resetMeta).toHaveBeenCalledTimes(1);
        // It's called once in the setMeta, then once in the reset logic
        expect(mockedMetaService.saveMeta).toHaveBeenCalledTimes(2);
    });

    it('should handle errors during loadMeta', async () => {
        const { result } = renderHook(() => useMetaStore());
        const error = new Error('Failed to load');
        mockedMetaService.loadMeta.mockRejectedValue(error);

        await act(async () => {
            await result.current.loadMeta();
        });

        expect(result.current.error).not.toBe(null);
        expect(result.current.error?.message).toBe('Failed to load');
        expect(result.current.error?.source).toBe('loadMeta');
    });
}); 