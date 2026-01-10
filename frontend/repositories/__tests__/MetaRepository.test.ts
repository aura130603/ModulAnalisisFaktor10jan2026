import { metaRepository } from '../MetaRepository';
import db from '@/lib/db';
import { Meta } from '@/types/Meta';

// Mock the entire db module
jest.mock('@/lib/db', () => {
    return {
        __esModule: true,
        default: {
            metadata: {
                get: jest.fn(),
                put: jest.fn(),
                delete: jest.fn(),
            },
        },
    };
});

const mockedDb = db as jest.Mocked<typeof db> & {
    metadata: {
        get: jest.Mock,
        put: jest.Mock,
        delete: jest.Mock
    }
};

describe('MetaRepository', () => {
    const mockMeta: Meta = {
        id: 'appMeta',
        name: 'Test File',
        location: '/test/location',
        created: new Date(),
        weight: '',
        dates: '',
        filter: '',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset mock implementations to prevent test leakage
        mockedDb.metadata.get.mockResolvedValue(undefined);
        mockedDb.metadata.put.mockResolvedValue(undefined);
        mockedDb.metadata.delete.mockResolvedValue(undefined);
    });

    // Suppress console.error during tests
    beforeAll(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterAll(() => {
        (console.error as jest.Mock).mockRestore();
    });

    describe('getMeta', () => {
        it('should get the meta object', async () => {
            mockedDb.metadata.get.mockResolvedValue(mockMeta);

            const result = await metaRepository.getMeta();

            expect(mockedDb.metadata.get).toHaveBeenCalledWith('appMeta');
            expect(result).toEqual(mockMeta);
        });

        it('should return undefined if no meta is found', async () => {
            mockedDb.metadata.get.mockResolvedValue(undefined);

            const result = await metaRepository.getMeta();

            expect(result).toBeUndefined();
        });

        it('should throw an error if the get operation fails', async () => {
            const mockError = new Error('DB get failed');
            mockedDb.metadata.get.mockRejectedValue(mockError);

            await expect(metaRepository.getMeta()).rejects.toThrow(mockError);
        });
    });

    describe('saveMeta', () => {
        it('should put the meta object', async () => {
            await metaRepository.saveMeta(mockMeta);

            expect(mockedDb.metadata.put).toHaveBeenCalledWith({ ...mockMeta, id: 'appMeta' });
        });

        it('should throw an error if the save operation fails', async () => {
            const mockError = new Error('DB put failed');
            mockedDb.metadata.put.mockRejectedValue(mockError);

            await expect(metaRepository.saveMeta(mockMeta)).rejects.toThrow(mockError);
        });
    });

    describe('deleteMeta', () => {
        it('should delete the meta object', async () => {
            await metaRepository.deleteMeta();

            expect(mockedDb.metadata.delete).toHaveBeenCalledWith('appMeta');
        });

        it('should throw an error if the delete operation fails', async () => {
            const mockError = new Error('DB delete failed');
            mockedDb.metadata.delete.mockRejectedValue(mockError);

            await expect(metaRepository.deleteMeta()).rejects.toThrow(mockError);
        });
    });

    describe('clearMeta', () => {
        it('should call deleteMeta', async () => {
            await metaRepository.clearMeta();

            expect(mockedDb.metadata.delete).toHaveBeenCalledWith('appMeta');
        });
    });
}); 