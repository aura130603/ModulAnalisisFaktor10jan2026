import { ResultRepository } from '../ResultRepository';
import db from '@/lib/db';
import { Log, Analytic, Statistic } from '@/types/Result';

// Mock the db module
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    logs: {
      put: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
    },
    analytics: {
      where: jest.fn().mockReturnThis(),
      equals: jest.fn().mockReturnThis(),
      delete: jest.fn(),
      put: jest.fn(),
      clear: jest.fn(),
    },
    statistics: {
      where: jest.fn().mockReturnThis(),
      equals: jest.fn().mockReturnThis(),
      delete: jest.fn(),
      put: jest.fn(),
      clear: jest.fn(),
      get: jest.fn(),
    },
    // Mock custom transaction methods
    transaction: jest.fn().mockImplementation((...args) => {
        const callback = args[args.length - 1];
        if (typeof callback === 'function') {
            return callback();
        }
        return Promise.resolve();
    }),
    getAllLogsWithRelations: jest.fn(),
    getLogWithRelations: jest.fn(),
    deleteLogAndRelations: jest.fn(),
  },
}));

// Create a typed mock for easier use
const mockedDb = db as jest.Mocked<typeof db>;

describe('ResultRepository', () => {
  let repository: ResultRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new ResultRepository();
  });

  // Suppress console.error during tests
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });

  describe('deleteStatistic', () => {
    it('should call db.statistics.delete with the correct id', async () => {
      const statisticId = 123;
      (mockedDb.statistics.delete as jest.Mock).mockResolvedValue(undefined);

      await repository.deleteStatistic(statisticId);

      expect(mockedDb.statistics.delete).toHaveBeenCalledWith(statisticId);
      expect(mockedDb.statistics.delete).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if the delete operation fails', async () => {
      const statisticId = 123;
      const mockError = new Error('DB delete failed');
      (mockedDb.statistics.delete as jest.Mock).mockRejectedValue(mockError);

      await expect(repository.deleteStatistic(statisticId)).rejects.toThrow(mockError);
      expect(console.error).toHaveBeenCalledWith(`Failed to delete statistic with ID ${statisticId}:`, mockError);
    });
  });

  describe('deleteAnalytic', () => {
    const analyticId = 456;

    it('should delete statistics and the analytic within a transaction', async () => {
      const statisticsDeleteMock = jest.fn().mockResolvedValue(undefined);
      (mockedDb.statistics.where as jest.Mock).mockReturnValue({
        equals: jest.fn().mockReturnValue({
          delete: statisticsDeleteMock,
        }),
      });
      (mockedDb.analytics.delete as jest.Mock).mockResolvedValue(undefined);

      await repository.deleteAnalytic(analyticId);

      // Verify it runs in a transaction
      expect(mockedDb.transaction).toHaveBeenCalledWith('rw', mockedDb.analytics, mockedDb.statistics, expect.any(Function));

      // Verify that we first query and delete the statistics
      expect(mockedDb.statistics.where).toHaveBeenCalledWith('analyticId');
      expect(mockedDb.statistics.where('analyticId').equals).toHaveBeenCalledWith(analyticId);
      expect(statisticsDeleteMock).toHaveBeenCalledTimes(1);

      // Verify that we then delete the analytic
      expect(mockedDb.analytics.delete).toHaveBeenCalledWith(analyticId);
    });

    it('should throw an error if the transaction fails', async () => {
      const mockError = new Error('Transaction failed');
      (mockedDb.transaction as jest.Mock).mockImplementationOnce(() => Promise.reject(mockError));
    
      await expect(repository.deleteAnalytic(analyticId)).rejects.toThrow(mockError);
      expect(console.error).toHaveBeenCalledWith(`Failed to delete analytic with ID ${analyticId}:`, mockError);
    });
  });

  describe('deleteLog', () => {
    const logId = 789;

    it('should call db.deleteLogAndRelations with the correct id', async () => {
      (mockedDb.deleteLogAndRelations as jest.Mock).mockResolvedValue(undefined);

      await repository.deleteLog(logId);

      expect(mockedDb.deleteLogAndRelations).toHaveBeenCalledWith(logId);
      expect(mockedDb.deleteLogAndRelations).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if the deletion fails', async () => {
      const mockError = new Error('DB delete failed');
      (mockedDb.deleteLogAndRelations as jest.Mock).mockRejectedValue(mockError);

      await expect(repository.deleteLog(logId)).rejects.toThrow(mockError);
      expect(console.error).toHaveBeenCalledWith(`Failed to delete log with ID ${logId}:`, mockError);
    });
  });

  describe('saveStatistic', () => {
    const mockStatistic: Statistic = {
      analyticId: 1,
      title: 'Test Statistic',
      output_data: JSON.stringify({ some: 'data' }),
      components: JSON.stringify([]),
      description: 'A test'
    };

    it('should save a statistic using put', async () => {
      (mockedDb.statistics.put as jest.Mock).mockResolvedValue(999);
      const result = await repository.saveStatistic(mockStatistic);

      expect(result).toBe(999);
      expect(mockedDb.statistics.put).toHaveBeenCalledWith(mockStatistic);
      expect(mockedDb.statistics.put).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if save fails', async () => {
        const mockError = new Error('DB put failed');
        (mockedDb.statistics.put as jest.Mock).mockRejectedValue(mockError);

        await expect(repository.saveStatistic(mockStatistic)).rejects.toThrow(mockError);
        expect(console.error).toHaveBeenCalledWith('Failed to save statistic:', mockError);
    });
  });

  describe('clearResults', () => {
    it('should clear all result-related tables in a single transaction', async () => {
      (mockedDb.statistics.clear as jest.Mock).mockResolvedValue(undefined);
      (mockedDb.analytics.clear as jest.Mock).mockResolvedValue(undefined);
      (mockedDb.logs.clear as jest.Mock).mockResolvedValue(undefined);

      await repository.clearResults();

      // Verify it runs in a transaction
      expect(mockedDb.transaction).toHaveBeenCalledWith('rw', [mockedDb.logs, mockedDb.analytics, mockedDb.statistics], expect.any(Function));

      // Verify all clear methods were called
      expect(mockedDb.statistics.clear).toHaveBeenCalledTimes(1);
      expect(mockedDb.analytics.clear).toHaveBeenCalledTimes(1);
      expect(mockedDb.logs.clear).toHaveBeenCalledTimes(1);

      // Verify order
      const statsClearOrder = (mockedDb.statistics.clear as jest.Mock).mock.invocationCallOrder[0];
      const analyticsClearOrder = (mockedDb.analytics.clear as jest.Mock).mock.invocationCallOrder[0];
      const logsClearOrder = (mockedDb.logs.clear as jest.Mock).mock.invocationCallOrder[0];

      expect(statsClearOrder).toBeLessThan(analyticsClearOrder);
      expect(analyticsClearOrder).toBeLessThan(logsClearOrder);
    });

    it('should throw an error if the transaction fails', async () => {
        const mockError = new Error('Transaction failed');
        (mockedDb.transaction as jest.Mock).mockImplementation((mode, tables, callback) => {
            return Promise.reject(mockError);
        });

        await expect(repository.clearResults()).rejects.toThrow(mockError);
        expect(console.error).toHaveBeenCalledWith('Failed to clear results:', mockError);
    });
  });

  describe('getAllLogs', () => {
    it('should return all logs from db.getAllLogsWithRelations', async () => {
      const mockLogs: Log[] = [{ id: 1, log: 'Log 1', analytics: [] }];
      (mockedDb.getAllLogsWithRelations as jest.Mock).mockResolvedValue(mockLogs);

      const result = await repository.getAllLogs();

      expect(result).toEqual(mockLogs);
      expect(mockedDb.getAllLogsWithRelations).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if db call fails', async () => {
      const mockError = new Error('DB failed');
      (mockedDb.getAllLogsWithRelations as jest.Mock).mockRejectedValue(mockError);

      await expect(repository.getAllLogs()).rejects.toThrow(mockError);
    });
  });

  describe('getLog', () => {
    const logId = 1;
    it('should return a single log from db.getLogWithRelations', async () => {
      const mockLog: Log = { id: logId, log: 'Log 1', analytics: [] };
      (mockedDb.getLogWithRelations as jest.Mock).mockResolvedValue(mockLog);

      const result = await repository.getLog(logId);

      expect(result).toEqual(mockLog);
      expect(mockedDb.getLogWithRelations).toHaveBeenCalledWith(logId);
    });

    it('should throw an error if db call fails', async () => {
      const mockError = new Error('DB failed');
      (mockedDb.getLogWithRelations as jest.Mock).mockRejectedValue(mockError);

      await expect(repository.getLog(logId)).rejects.toThrow(mockError);
    });
  });

  describe('getStatistic', () => {
    const statisticId = 1;
    it('should return a single statistic from db.statistics.get', async () => {
        const mockStatistic: Statistic = { id: statisticId, analyticId: 1, title: 'Stat 1', output_data: '{}', components: '[]', description: '' };
        (mockedDb.statistics.get as jest.Mock).mockResolvedValue(mockStatistic);

        const result = await repository.getStatistic(statisticId);

        expect(result).toEqual(mockStatistic);
        expect(mockedDb.statistics.get).toHaveBeenCalledWith(statisticId);
    });

    it('should throw an error if db call fails', async () => {
        const mockError = new Error('DB failed');
        (mockedDb.statistics.get as jest.Mock).mockRejectedValue(mockError);

        await expect(repository.getStatistic(statisticId)).rejects.toThrow(mockError);
    });
  });

  describe('saveLog', () => {
    it('should save a log using put', async () => {
      const mockLog: Log = { id: 1, log: 'Test Log', analytics: [] };
      (mockedDb.logs.put as jest.Mock).mockResolvedValue(1);

      const result = await repository.saveLog(mockLog);

      expect(result).toBe(1);
      // The repository method extracts only relevant properties
      expect(mockedDb.logs.put).toHaveBeenCalledWith({ log: mockLog.log, id: mockLog.id });
    });

    it('should throw an error if save fails', async () => {
      const mockLog: Log = { id: 1, log: 'Test Log', analytics: [] };
      const mockError = new Error('DB put failed');
      (mockedDb.logs.put as jest.Mock).mockRejectedValue(mockError);

      await expect(repository.saveLog(mockLog)).rejects.toThrow(mockError);
      expect(console.error).toHaveBeenCalledWith('Failed to save log:', mockError);
    });
  });

  describe('saveAnalytic', () => {
    const mockAnalytic: Analytic = { 
      logId: 1, 
      title: 'Test Analytic', 
      statistics: [] 
    };

    it('should save an analytic without its relations', async () => {
      (mockedDb.analytics.put as jest.Mock).mockResolvedValue(2);

      const result = await repository.saveAnalytic(mockAnalytic);

      expect(result).toBe(2);
      // Verify that the `statistics` relation is stripped before saving
      const { statistics, ...analyticData } = mockAnalytic;
      expect(mockedDb.analytics.put).toHaveBeenCalledWith(analyticData);
    });

    it('should throw an error if save fails', async () => {
      const mockError = new Error('DB put failed');
      (mockedDb.analytics.put as jest.Mock).mockRejectedValue(mockError);

      await expect(repository.saveAnalytic(mockAnalytic)).rejects.toThrow(mockError);
      expect(console.error).toHaveBeenCalledWith('Failed to save analytic:', mockError);
    });
  });
}); 