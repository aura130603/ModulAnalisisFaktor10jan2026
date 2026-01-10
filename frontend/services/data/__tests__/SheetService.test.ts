import { SheetService } from '../SheetService';
import { variableRepository as mockedVariableRepository, dataRepository as mockedDataRepository } from '@/repositories';
import db from '@/lib/db';
import { Variable } from '@/types/Variable';
import { DataRow } from '@/types/Data';

// Mock repositories and db
jest.mock('@/repositories', () => ({
  variableRepository: {
    getAllVariables: jest.fn(),
    clearVariables: jest.fn(),
    saveVariable: jest.fn(),
    deleteVariable: jest.fn(),
    shiftColumnIndexes: jest.fn(),
  },
  dataRepository: {
    replaceAllData: jest.fn(),
    insertColumn: jest.fn(),
    deleteColumn: jest.fn(),
    getAllRows: jest.fn(),
  },
}));

// Mock Dexie transaction
jest.mock('@/lib/db', () => ({
  transaction: jest.fn().mockImplementation(async (...args) => {
    const callback = args[args.length - 1];
    if (typeof callback === 'function') {
        return await callback();
    }
  }),
  variables: {
    bulkAdd: jest.fn(),
    bulkPut: jest.fn(),
  },
  valueLabels: {
    bulkPut: jest.fn(),
  }
}));

const createMockVariable = (columnIndex: number, name: string): Variable => ({
  id: columnIndex + 1, // simplified for mock
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


describe('SheetService', () => {
  let sheetService: SheetService;

  beforeEach(() => {
    jest.clearAllMocks();
    sheetService = new SheetService(mockedVariableRepository as any, mockedDataRepository as any);
  });

  describe('insertColumn', () => {
    it('should orchestrate inserting a column, re-indexing subsequent variables', async () => {
        // This is a new variable, so it won't have an `id` yet.
        const { id, ...newVar } = createMockVariable(0, 'NewVar');

        await sheetService.insertColumn(newVar);
        
        // It shifts existing variables to make space
        expect(mockedVariableRepository.shiftColumnIndexes).toHaveBeenCalledWith(0, 1);
        
        // It inserts a column in the data
        expect(mockedDataRepository.insertColumn).toHaveBeenCalledWith(newVar.columnIndex);

        // It saves the new variable
        expect(mockedVariableRepository.saveVariable).toHaveBeenCalledWith(newVar);
        
        // Check transaction was used
        expect(db.transaction).toHaveBeenCalled();
    });
  });

  describe('deleteColumn', () => {
    it('should orchestrate deleting a column and re-indexing remaining variables', async () => {
        const var1 = createMockVariable(0, 'Var1');
        const var2 = createMockVariable(1, 'Var2');
        const var3 = createMockVariable(2, 'Var3');
        (mockedVariableRepository.getAllVariables as jest.Mock).mockResolvedValue([var1, var2, var3]);

        await sheetService.deleteColumn(1); // Delete Var2 at columnIndex 1

        expect(db.transaction).toHaveBeenCalled();
        expect(mockedVariableRepository.getAllVariables).toHaveBeenCalledTimes(1);
        expect(mockedDataRepository.deleteColumn).toHaveBeenCalledWith(1);
        expect(mockedVariableRepository.deleteVariable).toHaveBeenCalledWith(var2.id);

        // Check re-indexing: var3 should be moved to columnIndex 1
        expect(mockedVariableRepository.saveVariable).toHaveBeenCalledWith(expect.objectContaining({ name: 'Var3', columnIndex: 1 }));
        
        // Ensure var1 is also re-saved with its correct index
        expect(mockedVariableRepository.saveVariable).toHaveBeenCalledWith(expect.objectContaining({ name: 'Var1', columnIndex: 0 }));
    });
  });

  describe('replaceAll', () => {
    it('should replace all variables and data within a transaction', async () => {
        const newVars = [createMockVariable(0, 'v1')];
        const newData: DataRow[] = [[1,2,3]];
        (db.variables.bulkAdd as jest.Mock).mockResolvedValue([1]);

        await sheetService.replaceAll(newVars, newData);

        expect(db.transaction).toHaveBeenCalled();
        expect(mockedDataRepository.replaceAllData).toHaveBeenCalledWith(newData);
        expect(mockedVariableRepository.clearVariables).toHaveBeenCalled();
        expect(db.variables.bulkAdd).toHaveBeenCalledWith(newVars, { allKeys: true });
    });
  });

  describe('sortSheetByVariable', () => {
    it('should sort variables and reorder data columns accordingly', async () => {
      const varA = createMockVariable(0, 'A');
      const varB = createMockVariable(1, 'B');
      const varC = createMockVariable(2, 'C');
      const allVars = [varA, varB, varC]; // Correctly ordered by index
      const allData: DataRow[] = [['a1', 'b1', 'c1'], ['a2', 'b2', 'c2']];
      
      // Shuffle for the test scenario
      const shuffledVars = [varC, varA, varB];

      (mockedVariableRepository.getAllVariables as jest.Mock).mockResolvedValue(shuffledVars);
      (mockedDataRepository.getAllRows as jest.Mock).mockResolvedValue(allData);
      (db.variables.bulkAdd as jest.Mock).mockResolvedValue([1, 2, 3]);

      await sheetService.sortSheetByVariable('asc', 'name');

      expect(db.transaction).toHaveBeenCalled();
      
      // The service sorts variables by name: A, B, C.
      // The data is already in A, B, C order. The service should detect this and not change the data order.
      const expectedReorderedData = [['a1', 'b1', 'c1'], ['a2', 'b2', 'c2']];
      expect(mockedDataRepository.replaceAllData).toHaveBeenCalledWith(expectedReorderedData);

      expect(mockedVariableRepository.clearVariables).toHaveBeenCalled();
      
      const bulkAddCall = (db.variables.bulkAdd as jest.Mock).mock.calls[0][0];
      expect(bulkAddCall[0].name).toBe('A');
      expect(bulkAddCall[0].columnIndex).toBe(0);
      expect(bulkAddCall[1].name).toBe('B');
      expect(bulkAddCall[1].columnIndex).toBe(1);
      expect(bulkAddCall[2].name).toBe('C');
      expect(bulkAddCall[2].columnIndex).toBe(2);
    });
  });
}); 