import { ResultService } from '../ResultService';
import resultRepository from '@/repositories/ResultRepository';
import { Statistic } from '@/types/Result';

// Mock the repository
jest.mock('@/repositories/ResultRepository');

const mockedResultRepository = resultRepository as jest.Mocked<typeof resultRepository>;
const resultService = new ResultService();

const mockStatistic: Statistic = {
    id: 1,
    analyticId: 10,
    title: 'Initial Title',
    output_data: '{}',
    components: '',
    description: '',
};

describe('ResultService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getAllResults', () => {
        it('should call repository.getAllLogs', async () => {
            (mockedResultRepository.getAllLogs as jest.Mock).mockResolvedValue([]);
            await resultService.getAllResults();
            expect(mockedResultRepository.getAllLogs).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateStatistic', () => {
        it('should get the existing statistic and then save the merged data', async () => {
            const updates: Partial<Statistic> = { title: 'Updated Title' };
            
            // Mock the repository methods
            (mockedResultRepository.getStatistic as jest.Mock).mockResolvedValue(mockStatistic);
            // Ensure the mock returns a number, as expected
            (mockedResultRepository.saveStatistic as jest.Mock).mockResolvedValue(mockStatistic.id as number);

            await resultService.updateStatistic(1, updates);

            // Verify the get call
            expect(mockedResultRepository.getStatistic).toHaveBeenCalledTimes(1);
            expect(mockedResultRepository.getStatistic).toHaveBeenCalledWith(1);

            // Verify the save call with merged data
            expect(mockedResultRepository.saveStatistic).toHaveBeenCalledTimes(1);
            expect(mockedResultRepository.saveStatistic).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 1,
                    title: 'Updated Title', // The new title
                    description: '',      // The old description
                })
            );
        });

        it('should throw an error if the statistic to update is not found', async () => {
            (mockedResultRepository.getStatistic as jest.Mock).mockResolvedValue(undefined);

            await expect(resultService.updateStatistic(99, { title: 'No-op' })).rejects.toThrow(
                'Statistic with ID 99 not found'
            );
            
            expect(mockedResultRepository.saveStatistic).not.toHaveBeenCalled();
        });
    });
}); 