import { DataService } from '../DataService';
import { dataRepository as mockedDataRepository } from '@/repositories';
import { DataRow } from '@/types/Data';

// Mock the repository
jest.mock('@/repositories', () => ({
  dataRepository: {
    getAllRows: jest.fn(),
    clearAllData: jest.fn(),
    replaceAllData: jest.fn(),
    updateBulkCells: jest.fn(),
    insertRow: jest.fn(),
    addBulkRows: jest.fn(),
    deleteRow: jest.fn(),
    deleteBulkRows: jest.fn(),
    updateRow: jest.fn(),
    getColumnData: jest.fn(),
  },
}));

describe('DataService', () => {
  let dataService: DataService;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Create a new service instance with the mocked repository
    dataService = new DataService(mockedDataRepository as any);
  });

  describe('loadAllData', () => {
    it('should return all data from the repository', async () => {
      const mockData: DataRow[] = [[1, 'a'], [2, 'b']];
      (mockedDataRepository.getAllRows as jest.Mock).mockResolvedValue(mockData);

      const result = await dataService.loadAllData();

      expect(result.data).toEqual(mockData);
      expect(mockedDataRepository.getAllRows).toHaveBeenCalledTimes(1);
    });
  });

  describe('importData', () => {
    it('should call replaceAllData', async () => {
      const newData: DataRow[] = [[1, 'a'], [2, 'b']];
      
      await dataService.importData(newData);

      expect(mockedDataRepository.replaceAllData).toHaveBeenCalledTimes(1);
      expect(mockedDataRepository.replaceAllData).toHaveBeenCalledWith(newData);
      expect(mockedDataRepository.clearAllData).not.toHaveBeenCalled();
    });
  });

  describe('getColumnData', () => {
    it('should return column data from the repository', async () => {
      const mockColumnData = ['a', 'b'];
      (mockedDataRepository.getColumnData as jest.Mock).mockResolvedValue(mockColumnData);

      const { columnData } = await dataService.getColumnData(1);

      expect(columnData).toEqual(mockColumnData);
      expect(mockedDataRepository.getColumnData).toHaveBeenCalledWith(1);
      expect(mockedDataRepository.getColumnData).toHaveBeenCalledTimes(1);
    });
  });
}); 