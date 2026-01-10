import { VariableService } from '../VariableService';
import { variableRepository as mockedVariableRepository } from '@/repositories';
import { Variable, ValueLabel } from '@/types/Variable';
import db from '@/lib/db';

// Mock the repository and db
jest.mock('@/repositories', () => ({
  variableRepository: {
    getAllVariables: jest.fn(),
    clearVariables: jest.fn(),
    getVariableByName: jest.fn(),
    getVariableByColumnIndex: jest.fn(),
    saveVariable: jest.fn(),
    deleteVariable: jest.fn(),
    getValueLabels: jest.fn(),
    saveValueLabel: jest.fn(),
  },
}));

jest.mock('@/lib/db', () => ({
    transaction: jest.fn().mockImplementation(async (...args) => {
        const callback = args[args.length - 1];
        if (typeof callback === 'function') {
            return await callback();
        }
    }),
    variables: {
      bulkAdd: jest.fn(),
    },
    valueLabels: {
      bulkPut: jest.fn(),
    }
}));


const createMockVariable = (id: number, name: string, columnIndex: number): Variable => ({
  id,
  name,
  label: `${name} Label`,
  type: 'NUMERIC',
  width: 8,
  decimals: 2,
  align: 'right',
  measure: 'scale',
  role: 'input',
  columns: 8,
  missing: null,
  columnIndex: columnIndex,
  values: [],
});

describe('VariableService', () => {
    let variableService: VariableService;

    beforeEach(() => {
        jest.clearAllMocks();
        variableService = new VariableService(mockedVariableRepository as any);
    });

    describe('getAllVariables', () => {
        it('should return all variables from the repository', async () => {
            const mockVars = [createMockVariable(1, 'VarA', 0)];
            (mockedVariableRepository.getAllVariables as jest.Mock).mockResolvedValue(mockVars);

            const result = await variableService.getAllVariables();

            expect(mockedVariableRepository.getAllVariables).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockVars);
        });
    });

    describe('clearAllVariables', () => {
        it('should call repository to clear variables', async () => {
            await variableService.clearAllVariables();
            expect(mockedVariableRepository.clearVariables).toHaveBeenCalledTimes(1);
        });
    });
    
    describe('getVariableByName', () => {
        it('should call repository to get a variable by its name', async () => {
            const mockVar = createMockVariable(1, 'VarA', 0);
            (mockedVariableRepository.getVariableByName as jest.Mock).mockResolvedValue(mockVar);

            const result = await variableService.getVariableByName('VarA');

            expect(mockedVariableRepository.getVariableByName).toHaveBeenCalledWith('VarA');
            expect(result).toEqual(mockVar);
        });
    });

    describe('getVariableByColumnIndex', () => {
        it('should call repository to get a variable by its column index', async () => {
            const mockVar = createMockVariable(1, 'VarA', 0);
            (mockedVariableRepository.getVariableByColumnIndex as jest.Mock).mockResolvedValue(mockVar);

            const result = await variableService.getVariableByColumnIndex(0);

            expect(mockedVariableRepository.getVariableByColumnIndex).toHaveBeenCalledWith(0);
            expect(result).toEqual(mockVar);
        });
    });

    describe('saveVariable', () => {
        it('should save a variable using the repository', async () => {
            const newVariable = createMockVariable(1, 'NewVar', 0);
            (mockedVariableRepository.saveVariable as jest.Mock).mockResolvedValue(1);

            const result = await variableService.saveVariable(newVariable);

            expect(mockedVariableRepository.saveVariable).toHaveBeenCalledWith(newVariable);
            expect(result).toBe(1);
        });
    });

    describe('deleteVariable', () => {
        it('should call the repository to delete the variable', async () => {
            await variableService.deleteVariable(1);
            expect(mockedVariableRepository.deleteVariable).toHaveBeenCalledWith(1);
            expect(mockedVariableRepository.deleteVariable).toHaveBeenCalledTimes(1);
        });
    });

    describe('importVariables', () => {
        it('should clear old variables and bulk add new ones', async () => {
            const newVariables = [createMockVariable(1, 'NewVar', 0)];
            (db.variables.bulkAdd as jest.Mock).mockResolvedValue([1]);

            await variableService.importVariables(newVariables);

            expect(db.transaction).toHaveBeenCalled();
            expect(mockedVariableRepository.clearVariables).toHaveBeenCalled();
            expect(db.variables.bulkAdd).toHaveBeenCalledWith(newVariables, { allKeys: true });
        });
    });

    describe('getValueLabels', () => {
        it('should get value labels for a variable from the repository', async () => {
            const labels: ValueLabel[] = [{ variableId: 1, value: 1, label: 'One' }];
            (mockedVariableRepository.getValueLabels as jest.Mock).mockResolvedValue(labels);

            const result = await variableService.getValueLabels(1);

            expect(mockedVariableRepository.getValueLabels).toHaveBeenCalledWith(1);
            expect(result).toEqual(labels);
        });
    });

    describe('saveValueLabel', () => {
        it('should save a value label using the repository', async () => {
            const label: ValueLabel = { variableId: 1, value: 1, label: 'One' };
            (mockedVariableRepository.saveValueLabel as jest.Mock).mockResolvedValue(1);

            await variableService.saveValueLabel(label);
            
            expect(mockedVariableRepository.saveValueLabel).toHaveBeenCalledWith(label);
        });
    });
}); 