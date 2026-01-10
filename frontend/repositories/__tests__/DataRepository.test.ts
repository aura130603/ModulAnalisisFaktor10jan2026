import { DataRepository } from '../DataRepository';
import db from '@/lib/db';
import { DataRow } from '@/types/Data';

const mockModify = jest.fn();

// Mock the db module
jest.mock('@/lib/db', () => {
  const mockDb = {
    dataRows: {
      toArray: jest.fn(),
      clear: jest.fn(),
      get: jest.fn(),
      update: jest.fn(),
      add: jest.fn(),
      bulkAdd: jest.fn(),
      where: jest.fn(),
      bulkDelete: jest.fn(),
      toCollection: jest.fn(() => ({
        modify: mockModify,
      })),
    },
    transaction: jest.fn(),
  };

  // Mock the transaction to just execute the callback by default
  mockDb.transaction.mockImplementation((mode, tables, callback) => {
    return callback();
  });

  return {
    __esModule: true,
    default: mockDb,
  };
});

// Create a typed mock for easier use
const mockedDb = db as jest.Mocked<typeof db>;

describe('DataRepository', () => {
  let repository: DataRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    mockModify.mockClear();
    // Re-mock the transaction implementation before each test to allow for specific overrides
    (mockedDb.transaction as jest.Mock).mockImplementation((mode, tables, callback) => {
        return callback();
    });
    repository = new DataRepository();
  });

  // Suppress console.error during tests
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });

  describe('clearAllData', () => {
    it('should call db.dataRows.clear', async () => {
      (mockedDb.dataRows.clear as jest.Mock).mockResolvedValue(undefined);
      await repository.clearAllData();
      expect(mockedDb.dataRows.clear).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if clear fails', async () => {
      const mockError = new Error('DB clear failed');
      (mockedDb.dataRows.clear as jest.Mock).mockRejectedValue(mockError);
      
      await expect(repository.clearAllData()).rejects.toThrow("Failed to reset data");
      expect(console.error).toHaveBeenCalledWith('Failed to reset data', expect.any(Object));
    });
  });

  describe('getAllRows', () => {
    it('should return sorted and gap-filled data from the database', async () => {
      const mockDbData = [
        { id: 2, data: ['c1', 'c2'] },
        { id: 0, data: ['a1', 'a2'] },
      ];
      (mockedDb.dataRows.toArray as jest.Mock).mockResolvedValue(mockDbData);

      const result = await repository.getAllRows();

      const expectedData = [
        ['a1', 'a2'],
        ['', ''],
        ['c1', 'c2'],
      ];
      expect(result).toEqual(expectedData);
    });

    it('should return an empty array if the database is empty', async () => {
      (mockedDb.dataRows.toArray as jest.Mock).mockResolvedValue([]);
      const result = await repository.getAllRows();
      expect(result).toEqual([]);
    });

    it('should throw an error if the database operation fails', async () => {
      const mockError = new Error('DB read failed');
      (mockedDb.dataRows.toArray as jest.Mock).mockRejectedValue(mockError);

      await expect(repository.getAllRows()).rejects.toThrow("Failed to load data");
      expect(console.error).toHaveBeenCalledWith('Failed to load data', expect.any(Object));
    });
  });

  describe('updateRow', () => {
    const rowIndex = 5;
    const rowData: DataRow = ['new', 'data'];

    it('should update an existing row', async () => {
      (mockedDb.dataRows.get as jest.Mock).mockResolvedValue({ id: rowIndex, data: ['old', 'data'] });
      await repository.updateRow(rowIndex, rowData);
      expect(mockedDb.dataRows.get).toHaveBeenCalledWith(rowIndex);
      expect(mockedDb.dataRows.update).toHaveBeenCalledWith(rowIndex, { data: rowData });
      expect(mockedDb.dataRows.add).not.toHaveBeenCalled();
    });

    it('should add a new row if it does not exist', async () => {
      (mockedDb.dataRows.get as jest.Mock).mockResolvedValue(undefined);
      await repository.updateRow(rowIndex, rowData);
      expect(mockedDb.dataRows.get).toHaveBeenCalledWith(rowIndex);
      expect(mockedDb.dataRows.add).toHaveBeenCalledWith({ id: rowIndex, data: rowData });
      expect(mockedDb.dataRows.update).not.toHaveBeenCalled();
    });

    it('should throw an error if the operation fails', async () => {
        const mockError = new Error('DB get failed');
        (mockedDb.dataRows.get as jest.Mock).mockRejectedValue(mockError);
        await expect(repository.updateRow(rowIndex, rowData)).rejects.toThrow(`Failed to update row ${rowIndex}`);
        expect(console.error).toHaveBeenCalledWith(`Failed to update row ${rowIndex}`, expect.any(Object));
      });
  });

  describe('replaceAllData', () => {
    const newData: DataRow[] = [['a', 'b'], ['c', 'd']];

    it('should clear, format, and bulk add new data within a transaction', async () => {
      (mockedDb.dataRows.clear as jest.Mock).mockResolvedValue(undefined);
      (mockedDb.dataRows.bulkAdd as jest.Mock).mockResolvedValue(undefined);

      await repository.replaceAllData(newData);

      expect(mockedDb.transaction).toHaveBeenCalledWith('rw', mockedDb.dataRows, expect.any(Function));
      
      const clearOrder = (mockedDb.dataRows.clear as jest.Mock).mock.invocationCallOrder[0];
      const bulkAddOrder = (mockedDb.dataRows.bulkAdd as jest.Mock).mock.invocationCallOrder[0];
      expect(clearOrder).toBeLessThan(bulkAddOrder);
      
      const expectedBulkData = [{ id: 0, data: ['a', 'b'] }, { id: 1, data: ['c', 'd'] }];
      expect(mockedDb.dataRows.bulkAdd).toHaveBeenCalledWith(expectedBulkData);
    });

    it('should throw an error if the transaction fails', async () => {
      const mockError = new Error('Transaction failed');
      (mockedDb.transaction as jest.Mock).mockRejectedValue(mockError);

      await expect(repository.replaceAllData(newData)).rejects.toThrow("Failed to replace all data");
      expect(console.error).toHaveBeenCalledWith('Failed to replace all data', expect.any(Object));
    });
  });

  describe('ensureRowExists', () => {
    it('should not do anything if the row already exists', async () => {
      (mockedDb.dataRows.get as jest.Mock).mockResolvedValue({ id: 1, data: ['a'] });
      
      await repository.ensureRowExists(1, 5);

      expect(mockedDb.dataRows.get).toHaveBeenCalledWith(1);
      expect(mockedDb.dataRows.add).not.toHaveBeenCalled();
    });

    it('should add an empty row if the row does not exist', async () => {
      (mockedDb.dataRows.get as jest.Mock).mockResolvedValue(undefined);
      
      await repository.ensureRowExists(1, 3);

      expect(mockedDb.dataRows.get).toHaveBeenCalledWith(1);
      const expectedEmptyRow = {
        id: 1,
        data: ['', '', ''],
      };
      expect(mockedDb.dataRows.add).toHaveBeenCalledWith(expectedEmptyRow);
    });

    it('should throw an error if the get operation fails', async () => {
      const mockError = new Error('DB check failed');
      (mockedDb.dataRows.get as jest.Mock).mockRejectedValue(mockError);
      
      await expect(repository.ensureRowExists(1, 3)).rejects.toThrow("Failed to ensure row 1 exists");
      expect(console.error).toHaveBeenCalledWith('Failed to ensure row 1 exists', expect.any(Object));
    });
  });

  describe('updateBulkCells', () => {
    it('should correctly update multiple cells in an existing row', async () => {
      const initialRowData = ['a', 'b', 'c'];
      const rowIndex = 0;
      (mockedDb.dataRows.get as jest.Mock).mockResolvedValue({ id: rowIndex, data: initialRowData });
      (mockedDb.dataRows.update as jest.Mock).mockResolvedValue(undefined);

      const cellsToUpdate = [
        { row: rowIndex, col: 0, value: 'A_NEW' },
        { row: rowIndex, col: 2, value: 'C_NEW' },
      ];

      await repository.updateBulkCells(cellsToUpdate);

      // It should get the existing row to update it
      expect(mockedDb.dataRows.get).toHaveBeenCalledWith(rowIndex);

      // It should then update the row with the merged data
      const expectedData = ['A_NEW', 'b', 'C_NEW'];
      expect(mockedDb.dataRows.update).toHaveBeenCalledWith(rowIndex, { data: expectedData });
      
      // It should not add a new row
      expect(mockedDb.dataRows.add).not.toHaveBeenCalled();
    });

    it('should correctly create a new row and update cells within it', async () => {
      const rowIndex = 1;
      // Row 1 does not exist initially
      (mockedDb.dataRows.get as jest.Mock).mockResolvedValue(undefined);
      (mockedDb.dataRows.add as jest.Mock).mockResolvedValue(undefined);

      const cellsToUpdate = [
        { row: rowIndex, col: 1, value: 'B_NEW' },
      ];

      await repository.updateBulkCells(cellsToUpdate);

      // It should attempt to get the row first
      expect(mockedDb.dataRows.get).toHaveBeenCalledWith(rowIndex);

      // It should then add a new row with the correct data, padded with empty strings
      const expectedData = ['', 'B_NEW']; // Padded at index 0
      expect(mockedDb.dataRows.add).toHaveBeenCalledWith({ id: rowIndex, data: expectedData });

      // It should not update an existing row
      expect(mockedDb.dataRows.update).not.toHaveBeenCalled();
    });

    it('should handle updates and deletions in the same transaction', async () => {
      const rowIndex = 0;
      const initialRowData = ['a', 'b', 'c', 'd'];
      (mockedDb.dataRows.get as jest.Mock).mockResolvedValue({ id: rowIndex, data: initialRowData });
      (mockedDb.dataRows.update as jest.Mock).mockResolvedValue(undefined);

      const cellsToUpdate = [
        { row: rowIndex, col: 0, value: 'A_NEW' }, // Update
      ];
      // Note: keysToDelete format is [col, row]
      const keysToDelete: Array<[number, number]> = [
        [2, rowIndex], // Delete col 2
      ];

      await repository.updateBulkCells(cellsToUpdate, keysToDelete);

      // Verify the final updated row data
      const expectedData = ['A_NEW', 'b', '', 'd']; // col 0 updated, col 2 cleared
      expect(mockedDb.dataRows.update).toHaveBeenCalledWith(rowIndex, { data: expectedData });
    });

    it('should throw an error if the transaction fails', async () => {
      const mockError = new Error('Transaction failed');
      (mockedDb.transaction as jest.Mock).mockImplementation((mode, tables, callback) => {
        return Promise.reject(mockError);
      });

      await expect(repository.updateBulkCells([], [])).rejects.toThrow("Failed to update bulk cells");
      expect(console.error).toHaveBeenCalledWith('Failed to update bulk cells', expect.any(Object));
    });
  });

  describe('Row Manipulation', () => {
    describe('deleteRow', () => {
      it('should delete a row and shift subsequent rows up', async () => {
        const rowIndexToDelete = 1;
        const rowsToShift = [
          { id: 2, data: ['row', '3'] },
          { id: 3, data: ['row', '4'] },
        ];
        
        // Mock the specific sequence of db calls for this test
        (mockedDb.dataRows.where as jest.Mock).mockImplementation((query) => {
          if (query.id === rowIndexToDelete) {
            return { delete: jest.fn().mockResolvedValue(1) };
          }
          if (query === 'id') {
            return {
              above: jest.fn().mockReturnValue({
                toArray: jest.fn().mockResolvedValue(rowsToShift),
              }),
            };
          }
          return {};
        });
        (mockedDb.dataRows.bulkDelete as jest.Mock).mockResolvedValue(1);
        (mockedDb.dataRows.bulkAdd as jest.Mock).mockResolvedValue(1);

        await repository.deleteRow(rowIndexToDelete);

        // 1. Transaction is opened
        expect(mockedDb.transaction).toHaveBeenCalled();
        // 2. The target row is deleted
        expect(mockedDb.dataRows.where).toHaveBeenCalledWith({ id: rowIndexToDelete });
        // 3. Subsequent rows are fetched
        expect(mockedDb.dataRows.where).toHaveBeenCalledWith('id');
        // 4. Old subsequent rows are deleted
        const idsToDelete = rowsToShift.map(r => r.id);
        expect(mockedDb.dataRows.bulkDelete).toHaveBeenCalledWith(idsToDelete);
        // 5. Shifted rows are added back
        const shiftedRows = [
            { id: 1, data: ['row', '3'] },
            { id: 2, data: ['row', '4'] },
        ];
        expect(mockedDb.dataRows.bulkAdd).toHaveBeenCalledWith(shiftedRows);
      });

      it('should throw an error if the transaction fails', async () => {
        const mockError = new Error('Transaction failed');
        (mockedDb.transaction as jest.Mock).mockImplementationOnce(() => Promise.reject(mockError));
        await expect(repository.deleteRow(1)).rejects.toThrow('Failed to delete row at 1');
      });
    });

    describe('insertRow', () => {
      it('should insert a row and shift subsequent rows down', async () => {
        const rowIndexToInsert = 1;
        const newRowData = ['new', 'row'];
        const rowsToShift = [
          { id: 1, data: ['old', 'row1'] },
          { id: 2, data: ['old', 'row2'] },
        ];

        (mockedDb.dataRows.where as jest.Mock).mockReturnValue({
          aboveOrEqual: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue(rowsToShift),
          }),
        });

        (mockedDb.dataRows.bulkDelete as jest.Mock).mockResolvedValue(undefined);
        (mockedDb.dataRows.bulkAdd as jest.Mock).mockResolvedValue(undefined);
        (mockedDb.dataRows.add as jest.Mock).mockResolvedValue(undefined);

        await repository.insertRow(rowIndexToInsert, newRowData);

        expect(mockedDb.transaction).toHaveBeenCalledWith('rw', mockedDb.dataRows, expect.any(Function));
        
        // 1. Get rows to shift
        const whereMock = mockedDb.dataRows.where('id');
        expect(whereMock.aboveOrEqual).toHaveBeenCalledWith(rowIndexToInsert);

        // 2. Bulk deletes old rows
        const idsToDelete = rowsToShift.map(r => r.id);
        expect(mockedDb.dataRows.bulkDelete).toHaveBeenCalledWith(idsToDelete);

        // 3. Bulk adds shifted rows
        const shiftedRows = [
            { id: 2, data: ['old', 'row1'] },
            { id: 3, data: ['old', 'row2'] },
        ];
        expect(mockedDb.dataRows.bulkAdd).toHaveBeenCalledWith(shiftedRows);
        
        // 4. Adds the new row
        expect(mockedDb.dataRows.add).toHaveBeenCalledWith({ id: rowIndexToInsert, data: newRowData });
      });

      it('should throw an error if the transaction fails', async () => {
        const mockError = new Error('Transaction failed');
        (mockedDb.transaction as jest.Mock).mockImplementationOnce(() => Promise.reject(mockError));
        await expect(repository.insertRow(1, ['new'])).rejects.toThrow('Failed to insert row at 1');
      });
    });
  });

  describe('Column Manipulation', () => {
    it('should delete a column from all rows', async () => {
        const columnIndexToDelete = 1;

        mockModify.mockResolvedValue(undefined);

        await repository.deleteColumn(columnIndexToDelete);

        expect(mockedDb.dataRows.toCollection).toHaveBeenCalledTimes(1);
        expect(mockModify).toHaveBeenCalledTimes(1);

        // Optional: verify the logic of the callback passed to modify
        const modifyCallback = mockModify.mock.calls[0][0];
        const testRow = { data: ['a', 'b', 'c'] };
        modifyCallback(testRow);
        expect(testRow.data).toEqual(['a', 'c']);
    });

    it('should insert a column with a default value into all rows', async () => {
        const columnIndexToInsert = 1;
        const defaultValue = 'new_val';
        
        mockModify.mockResolvedValue(undefined);

        await repository.insertColumn(columnIndexToInsert, defaultValue);

        expect(mockedDb.dataRows.toCollection).toHaveBeenCalledTimes(1);
        expect(mockModify).toHaveBeenCalledTimes(1);
        
        // Optional: verify the logic of the callback passed to modify
        const modifyCallback = mockModify.mock.calls[0][0];
        const testRow = { data: ['a', 'b'] };
        modifyCallback(testRow);
        expect(testRow.data).toEqual(['a', 'new_val', 'b']);
    });

    it('should not fail when inserting a column into an empty dataset', async () => {
        mockModify.mockResolvedValue(undefined);
        
        await repository.insertColumn(0);
        
        expect(mockedDb.dataRows.toCollection).toHaveBeenCalledTimes(1);
        expect(mockModify).toHaveBeenCalledTimes(1);
    });
  });
});
