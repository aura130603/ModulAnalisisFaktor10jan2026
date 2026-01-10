import db from '@/lib/db';
import { Variable, ValueLabel } from '@/types/Variable';
import { VariableRepository } from '../VariableRepository';

// This object will mock the chained calls like .where().equals()
const mockChainedMethods = {
  equals: jest.fn().mockReturnThis(),
  first: jest.fn(),
  toArray: jest.fn(),
  delete: jest.fn(),
  between: jest.fn().mockReturnThis(), // .between() also returns 'this'
};

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    variables: {
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      toArray: jest.fn(),
      where: jest.fn(() => mockChainedMethods), // .where() returns the chainable object
      bulkPut: jest.fn(),
    },
    valueLabels: {
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      bulkAdd: jest.fn(),
      where: jest.fn(() => mockChainedMethods), // .where() returns the chainable object
    },
    // Correct transaction mock that executes the callback
    transaction: jest.fn().mockImplementation(async (...args) => {
      const callback = args[args.length - 1];
      if (typeof callback === 'function') {
        return callback(); // Execute the transaction's callback
      }
    }),
  },
}));

const mockedDb = db as jest.Mocked<typeof db>;

describe('VariableRepository', () => {
  let repository: VariableRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mocks on chained methods to ensure test isolation
    Object.values(mockChainedMethods).forEach(mock => mock.mockReset());
    // Re-chain methods that return 'this'
    mockChainedMethods.equals.mockReturnThis();
    mockChainedMethods.between.mockReturnThis();
    
    repository = new VariableRepository();
  });

  // Suppress console.error during tests
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });

  describe('Variable Operations', () => {
    const mockVariable: Variable = {
        id: 1, name: 'VAR1', type: 'NUMERIC', width: 8, decimals: 2, label: 'Variable 1',
        values: [], missing: null, columns: 1, align: 'right', measure: 'scale', role: 'input', columnIndex: 5
    };

    it('getAllVariables should return all variables from the database', async () => {
      const mockVariables = [mockVariable];
      (mockedDb.variables.toArray as jest.Mock).mockResolvedValue(mockVariables);
      const variables = await repository.getAllVariables();
      expect(variables).toEqual(mockVariables);
    });

    it('getVariableByColumnIndex should query by columnIndex', async () => {
      (mockChainedMethods.first as jest.Mock).mockResolvedValue(mockVariable);
      const variable = await repository.getVariableByColumnIndex(5);
      expect(variable).toEqual(mockVariable);
      expect(mockedDb.variables.where).toHaveBeenCalledWith('columnIndex');
      expect(mockChainedMethods.equals).toHaveBeenCalledWith(5);
    });

    it('deleteVariable should delete a variable and its labels in a transaction', async () => {
      const variableId = 123;
      await repository.deleteVariable(variableId);

      expect(mockedDb.transaction).toHaveBeenCalled();
      expect(mockedDb.valueLabels.where).toHaveBeenCalledWith('variableId');
      expect(mockChainedMethods.equals).toHaveBeenCalledWith(variableId);
      expect(mockChainedMethods.delete).toHaveBeenCalled();
      expect(mockedDb.variables.delete).toHaveBeenCalledWith(variableId);
    });

    it('clearVariables should clear variables and labels in a transaction', async () => {
      await repository.clearVariables();
      expect(mockedDb.transaction).toHaveBeenCalled();
      expect(mockedDb.variables.clear).toHaveBeenCalled();
      expect(mockedDb.valueLabels.clear).toHaveBeenCalled();
    });
  });

  describe('reorderVariable', () => {
    it('should correctly reorder variables', async () => {
      const sourceVar = { id: 1, columnIndex: 0, name: 'A' } as Variable;
      const allVars = [sourceVar, { id: 2, columnIndex: 1, name: 'B' }] as Variable[];
      (mockedDb.variables.get as jest.Mock).mockResolvedValue(sourceVar);
      (mockChainedMethods.toArray as jest.Mock).mockResolvedValue(allVars);

      await repository.reorderVariable(1, 1);

      expect(mockedDb.variables.bulkPut).toHaveBeenCalled();
    });
  });

  describe('Value Label Operations', () => {
    it('getValueLabels should return value labels for a variableId', async () => {
      const mockLabels = [{ id: 10, variableId: 1, value: 1, label: 'One' }];
      (mockChainedMethods.toArray as jest.Mock).mockResolvedValue(mockLabels);
      const result = await repository.getValueLabels(1);
      expect(result).toEqual(mockLabels);
    });

    it('saveVariableWithLabels should save a variable and its labels transactionally', async () => {
      const newVarData = { name: 'NEW_VAR', type: 'STRING' } as Omit<Variable, 'id'>;
      const newLabels = [{ value: 'F', label: 'Female' }];
      const newVarId = 55;
      (mockedDb.variables.put as jest.Mock).mockResolvedValue(newVarId);

      const resultId = await repository.saveVariableWithLabels(newVarData, newLabels);

      expect(resultId).toBe(newVarId);
      expect(mockedDb.transaction).toHaveBeenCalled();
      expect(mockedDb.variables.put).toHaveBeenCalledWith(newVarData);
      const expectedLabelsToSave = [{ ...newLabels[0], variableId: newVarId }];
      expect(mockedDb.valueLabels.bulkAdd).toHaveBeenCalledWith(expectedLabelsToSave);
    });

    it('deleteValueLabelsByVariable should delete labels by variableId', async () => {
      await repository.deleteValueLabelsByVariable(1);
      expect(mockedDb.valueLabels.where).toHaveBeenCalledWith('variableId');
      expect(mockChainedMethods.equals).toHaveBeenCalledWith(1);
      expect(mockChainedMethods.delete).toHaveBeenCalled();
    });
  });
});
