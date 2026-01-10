import metaService from '../MetaService';
import { metaRepository } from '@/repositories/MetaRepository';
import { Meta } from '@/types/Meta';

// Mock the repository
jest.mock('@/repositories/MetaRepository');

const mockedMetaRepository = metaRepository as jest.Mocked<typeof metaRepository>;

describe('MetaService', () => {
  const mockMeta: Meta = {
    name: 'Test Service File',
    location: '/test/service/location',
    created: new Date(),
    weight: '1',
    dates: '2023-01-01',
    filter: 'active'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadMeta', () => {
    it('should call metaRepository.getMeta and return the result', async () => {
      mockedMetaRepository.getMeta.mockResolvedValue(mockMeta);
      
      const result = await metaService.loadMeta();

      expect(mockedMetaRepository.getMeta).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockMeta);
    });
  });

  describe('saveMeta', () => {
    it('should call metaRepository.saveMeta with the provided meta object', async () => {
      await metaService.saveMeta(mockMeta);

      expect(mockedMetaRepository.saveMeta).toHaveBeenCalledTimes(1);
      expect(mockedMetaRepository.saveMeta).toHaveBeenCalledWith(mockMeta);
    });
  });

  describe('resetMeta', () => {
    it('should call metaRepository.clearMeta', async () => {
      await metaService.resetMeta();

      expect(mockedMetaRepository.clearMeta).toHaveBeenCalledTimes(1);
    });
  });
}); 