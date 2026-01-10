import db from "@/lib/db";
import { DataRow } from "@/types/Data";
import { RepositoryError } from "@/types/RepositoryError";

export class DataRepository {
  async getAllRows(): Promise<DataRow[]> {
    try {
      const dataRows = await db.dataRows.toArray();
      
      // Sort by ID to ensure correct order
      dataRows.sort((a, b) => a.id - b.id);
      
      // Create a sparse array with the correct indices
      const result: DataRow[] = [];
      dataRows.forEach(row => {
        result[row.id] = row.data;
      });
      
      // Fill any gaps with empty rows
      for (let i = 0; i < result.length; i++) {
        if (!result[i]) {
          const columnsCount = result.find(r => r)?.length || 0;
          result[i] = Array(columnsCount).fill("");
        }
      }
      
      return result;
    } catch (error) {
      const repoError = new RepositoryError("Failed to load data", "DataRepository.getAllRows", error);
      console.error(repoError.message, repoError);
      throw repoError;
    }
  }

  async clearAllData(): Promise<void> {
    try {
      await db.dataRows.clear();
    } catch (error) {
      const repoError = new RepositoryError("Failed to reset data", "DataRepository.clearAllData", error);
      console.error(repoError.message, repoError);
      throw repoError;
    }
  }

  async updateRow(rowIndex: number, rowData: DataRow): Promise<void> {
    try {
      // Check if this row already exists in DB by ID (not array position)
      const existingRow = await db.dataRows.get(rowIndex);
      
      if (existingRow) {
        await db.dataRows.update(rowIndex, { data: rowData });
      } else {
        await db.dataRows.add({ id: rowIndex, data: rowData });
      }
    } catch (error) {
      const repoError = new RepositoryError(`Failed to update row ${rowIndex}`, "DataRepository.updateRow", error);
      console.error(repoError.message, repoError);
      throw repoError;
    }
  }

  async updateRows(rowIndices: number[], data: DataRow[]): Promise<void> {
    try {
      await db.transaction('rw', db.dataRows, async () => {
        // Update or add each affected row
        for (const rowIndex of rowIndices) {
          if (rowIndex < data.length) {
            const rowData = data[rowIndex];
            // Check if this row already exists by ID
            const existingRow = await db.dataRows.get(rowIndex);
            
            if (existingRow) {
              await db.dataRows.update(rowIndex, { data: rowData });
            } else {
              await db.dataRows.add({ id: rowIndex, data: rowData });
            }
          }
        }
      });
    } catch (error) {
      const repoError = new RepositoryError("Failed to update rows", "DataRepository.updateRows", error);
      console.error(repoError.message, repoError);
      throw repoError;
    }
  }

  /**
   * Replace all data at once
   */
  async replaceAllData(dataRows: DataRow[]) {
    try {
      return await db.transaction('rw', db.dataRows, async () => {
        await db.dataRows.clear();
        
        // Batch add operations for better performance
        const rowsToAdd = dataRows.map((data, index) => ({ 
          id: index, 
          data 
        }));
        
        return await db.dataRows.bulkAdd(rowsToAdd);
      });
    } catch (error) {
      const repoError = new RepositoryError("Failed to replace all data", "DataRepository.replaceAllData", error);
      console.error(repoError.message, repoError);
      throw repoError;
    }
  }
  
  /**
   * Deletes a column from the dataset.
   * This operation iterates through all rows and updates them one by one.
   */
  async deleteColumn(columnIndex: number): Promise<void> {
    try {
        await db.dataRows.toCollection().modify(row => {
            if (columnIndex < row.data.length) {
                row.data.splice(columnIndex, 1);
            }
        });
    } catch (error) {
      const repoError = new RepositoryError(`Failed to delete column ${columnIndex}`, "DataRepository.deleteColumn", error);
      console.error(repoError.message, repoError);
      throw repoError;
    }
  }

  /**
   * Inserts a column into the dataset.
   * This operation iterates through all rows and updates them one by one.
   */
  async insertColumn(columnIndex: number, defaultValue: any = ''): Promise<void> {
    try {
        await db.dataRows.toCollection().modify(row => {
            row.data.splice(columnIndex, 0, defaultValue);
        });
    } catch (error) {
      const repoError = new RepositoryError(`Failed to insert column at index ${columnIndex}`, "DataRepository.insertColumn", error);
      console.error(repoError.message, repoError);
      throw repoError;
    }
  }

  /**
   * Deletes a row from the dataset efficiently without re-writing the whole table.
   * This operation is transactional.
   */
  async deleteRow(rowIndex: number): Promise<void> {
    try {
      await db.transaction('rw', db.dataRows, async () => {
        // 1. Delete the target row. The result is the number of deleted rows.
        const deleteCount = await db.dataRows.where({ id: rowIndex }).delete();
        if (deleteCount === 0) {
            console.warn(`Attempted to delete non-existent row at index ${rowIndex}`);
            return;
        }

        // 2. Get all rows with a higher index that need to be shifted up.
        const rowsToShift = await db.dataRows.where('id').above(rowIndex).toArray();

        if (rowsToShift.length > 0) {
          // 3. To prevent primary key conflicts, we must first delete the old rows.
          const idsToDelete = rowsToShift.map(r => r.id);
          await db.dataRows.bulkDelete(idsToDelete);

          // 4. Now, create the new rows with their IDs decremented by 1.
          const shiftedRows = rowsToShift.map(row => ({
            id: row.id - 1,
            data: row.data,
          }));

          // 5. Bulk-add the shifted rows back into the database.
          await db.dataRows.bulkAdd(shiftedRows);
        }
      });
    } catch (error) {
      const repoError = new RepositoryError(`Failed to delete row at ${rowIndex}`, "DataRepository.deleteRow", error);
      console.error(repoError.message, repoError);
      throw repoError;
    }
  }

  /**
   * Inserts a row into the dataset efficiently without re-writing the whole table.
   * This operation is transactional.
   */
  async insertRow(rowIndex: number, rowData: DataRow): Promise<void> {
    try {
      await db.transaction('rw', db.dataRows, async () => {
        // 1. Get all rows from the insertion point onwards. We need to shift them.
        const rowsToShift = await db.dataRows.where('id').aboveOrEqual(rowIndex).toArray();

        // 2. To avoid primary key conflicts, delete the old rows first.
        if (rowsToShift.length > 0) {
            const idsToDelete = rowsToShift.map(r => r.id);
            await db.dataRows.bulkDelete(idsToDelete);

            // 3. Create the new rows with their IDs incremented by 1.
            const shiftedRows = rowsToShift.map(row => ({
                id: row.id + 1,
                data: row.data
            }));
            await db.dataRows.bulkAdd(shiftedRows);
        }

        // 4. Finally, insert the new row at the specified index.
        await db.dataRows.add({ id: rowIndex, data: rowData });
      });
    } catch (error) {
      const repoError = new RepositoryError(`Failed to insert row at ${rowIndex}`, "DataRepository.insertRow", error);
      console.error(repoError.message, repoError);
      throw repoError;
    }
  }

  /**
   * Deletes multiple rows from the dataset efficiently.
   * This operation is now fully transactional.
   */
  async deleteBulkRows(indices: number[]): Promise<void> {
    try {
      await db.transaction('rw', db.dataRows, async () => {
        if (indices.length === 0) return;

        // 1. Sort indices to understand the gaps that will be created.
        const sortedIndices = [...indices].sort((a, b) => a - b);
        
        // 2. Delete all the target rows in a single bulk operation.
        await db.dataRows.bulkDelete(sortedIndices);

        // 3. Now, we must shift the remaining rows to fill the gaps.
        // We only need to fetch rows that came after the first deleted row,
        // as they are the only ones that could possibly need shifting.
        const firstDeletedIndex = sortedIndices[0];
        const rowsToShift = await db.dataRows.where('id').above(firstDeletedIndex).toArray();

        if (rowsToShift.length > 0) {
          // 4. To prevent primary key conflicts, we must first delete the old items
          // before re-adding them with their new, shifted IDs.
          const idsToDelete = rowsToShift.map(r => r.id);
          await db.dataRows.bulkDelete(idsToDelete);

          // 5. Calculate the new ID for each row based on how many deleted items were "before" it.
          const shiftedRows = rowsToShift.map(row => {
            const shiftAmount = sortedIndices.filter(deletedIndex => deletedIndex < row.id).length;
            return {
              id: row.id - shiftAmount,
              data: row.data,
            };
          });

          // 6. Bulk-add the shifted rows back into the database.
          await db.dataRows.bulkAdd(shiftedRows);
        }
      });
    } catch (error) {
      const repoError = new RepositoryError(`Failed to delete bulk rows`, "DataRepository.deleteBulkRows", error);
      console.error(repoError.message, repoError);
      throw repoError;
    }
  }

  /**
   * Inserts multiple rows into the dataset efficiently.
   * This operation is now fully transactional.
   */
  async addBulkRows(rowsToAdd: { index: number; data: DataRow }[]): Promise<void> {
    try {
      await db.transaction('rw', db.dataRows, async () => {
        if (rowsToAdd.length === 0) return;

        // 1. Sort the new rows by their target index, ascending.
        const sortedNewRows = [...rowsToAdd].sort((a, b) => a.index - b.index);
        
        // 2. Get all existing rows from the first insertion point onwards, as they will all need to be shifted down.
        const firstInsertionIndex = sortedNewRows[0].index;
        const rowsToShift = await db.dataRows.where('id').aboveOrEqual(firstInsertionIndex).toArray();

        // 3. To avoid primary key conflicts, delete these rows before re-adding them with new IDs.
        if (rowsToShift.length > 0) {
          const idsToDelete = rowsToShift.map(r => r.id);
          await db.dataRows.bulkDelete(idsToDelete);
        }
        
        // 4. Prepare the list of rows to be added back. This includes the new rows and the shifted original rows.
        const finalRowsToAdd: { id: number, data: DataRow }[] = [];

        // 5. Add the original rows back, but with their new, shifted IDs.
        for (const originalRow of rowsToShift) {
          // The shift amount is the number of new rows being inserted at or before this original row's index.
          const shiftAmount = sortedNewRows.filter(nr => nr.index <= originalRow.id).length;
          finalRowsToAdd.push({
            id: originalRow.id + shiftAmount,
            data: originalRow.data
          });
        }
        
        // 6. Add the new rows. Their indices must also be shifted based on how many OTHER new rows are inserted before them.
        let accumulatedShift = 0;
        for (const newRow of sortedNewRows) {
          finalRowsToAdd.push({
            id: newRow.index + accumulatedShift,
            data: newRow.data
          });
          accumulatedShift++;
        }

        // 7. Perform a single bulk add operation.
        await db.dataRows.bulkAdd(finalRowsToAdd);
      });
    } catch (error) {
      const repoError = new RepositoryError(`Failed to add bulk rows`, "DataRepository.addBulkRows", error);
      console.error(repoError.message, repoError);
      throw repoError;
    }
  }

  async ensureRowExists(rowIndex: number, columnCount: number): Promise<void> {
    try {
      // Check if row exists
      const existingRow = await db.dataRows.get(rowIndex);
      
      if (!existingRow) {
        // Create empty row with the right number of columns
        const emptyRow = Array(columnCount).fill("");
        await db.dataRows.add({ id: rowIndex, data: emptyRow });
      }
    } catch (error) {
      const repoError = new RepositoryError(`Failed to ensure row ${rowIndex} exists`, "DataRepository.ensureRowExists", error);
      console.error(repoError.message, repoError);
      throw repoError;
    }
  }

  /**
   * Perform multiple cell updates and deletes in a single transaction
   */
  async updateBulkCells(
    cells: Array<{ row: number; col: number; value: string | number }>,
    keysToDelete?: Array<[number, number]>
  ): Promise<void> {
    try {
      await db.transaction('rw', db.dataRows, async () => {
        const rowsToProcess = new Set<number>();
        cells.forEach((c) => rowsToProcess.add(c.row));
        if (keysToDelete) {
          keysToDelete.forEach((k) => rowsToProcess.add(k[1])); // k is [col, row]
        }

        for (const rowIndex of Array.from(rowsToProcess)) {
          const existingRow = await db.dataRows.get(rowIndex);
          let rowData = existingRow ? [...existingRow.data] : [];

          const updatesForThisRow = cells.filter((c) => c.row === rowIndex);
          const deletesForThisRow = keysToDelete
            ? keysToDelete.filter((k) => k[1] === rowIndex)
            : [];

          let maxCol = -1;
          updatesForThisRow.forEach((c) => (maxCol = Math.max(maxCol, c.col)));
          deletesForThisRow.forEach((k) => (maxCol = Math.max(maxCol, k[0])));

          if (maxCol > -1 && rowData.length <= maxCol) {
            while (rowData.length <= maxCol) {
              rowData.push('');
            }
          }

          // Apply updates for this row
          for (const cell of updatesForThisRow) {
            rowData[cell.col] = cell.value;
          }

          // Apply deletes for this row
          if (deletesForThisRow) {
            for (const key of deletesForThisRow) {
              const colIndex = key[0];
              if (colIndex < rowData.length) {
                rowData[colIndex] = '';
              }
            }
          }

          // Update the row in the database
          if (existingRow) {
            await db.dataRows.update(rowIndex, { data: rowData });
          } else {
            await db.dataRows.add({ id: rowIndex, data: rowData });
          }
        }
      });
    } catch (error) {
      const repoError = new RepositoryError('Failed to update bulk cells', "DataRepository.updateBulkCells", error);
      console.error(repoError.message, repoError);
      throw repoError;
    }
  }

  async getColumnData(columnIndex: number): Promise<(string | number | null)[]> {
    try {
        const result: (string | number | null)[] = [];
        let maxId = -1;

        await db.dataRows.orderBy('id').each(row => {
            result[row.id] = (row.data && columnIndex < row.data.length) ? row.data[columnIndex] : null;
            if(row.id > maxId) maxId = row.id;
        });

        // Fill any gaps for a complete, non-sparse array
        for (let i = 0; i <= maxId; i++) {
            if (result[i] === undefined) {
                result[i] = null;
            }
        }
        
        return result;
    } catch (error) {
      const repoError = new RepositoryError(`Failed to get column data for index ${columnIndex}`, "DataRepository.getColumnData", error);
      console.error(repoError.message, repoError);
      throw repoError;
    }
  }

  async swapRows(rowIndex1: number, rowIndex2: number): Promise<void> {
    try {
        await db.transaction('rw', db.dataRows, async () => {
            const row1 = await db.dataRows.get(rowIndex1);
            const row2 = await db.dataRows.get(rowIndex2);

            if (!row1 || !row2) {
                throw new Error(`One or both rows for swapping not found: ${rowIndex1}, ${rowIndex2}`);
            }
            
            // Swap the data content, IDs remain the same.
            const tempData = row1.data;
            await db.dataRows.update(rowIndex1, { data: row2.data });
            await db.dataRows.update(rowIndex2, { data: tempData });
        });
    } catch (error) {
      const repoError = new RepositoryError(`Failed to swap rows ${rowIndex1} and ${rowIndex2}`, "DataRepository.swapRows", error);
      console.error(repoError.message, repoError);
      throw repoError;
    }
  }

  async sortData(columnIndex: number, direction: 'asc' | 'desc'): Promise<void> {
    try {
      const allData = await this.getAllRows();
      if (allData.length === 0) return;
      
      const sortedData = [...allData].sort((rowA, rowB) => {
        const valueA = columnIndex < (rowA?.length ?? 0) ? rowA[columnIndex] : "";
        const valueB = columnIndex < (rowB?.length ?? 0) ? rowB[columnIndex] : "";
        const isANumeric = typeof valueA === 'number' || (typeof valueA === 'string' && valueA !== "" && !isNaN(Number(valueA)));
        const isBNumeric = typeof valueB === 'number' || (typeof valueB === 'string' && valueB !== "" && !isNaN(Number(valueB)));
        
        if (isANumeric && isBNumeric) {
          const numA = typeof valueA === 'number' ? valueA : Number(valueA);
          const numB = typeof valueB === 'number' ? valueB : Number(valueB);
          return direction === 'asc' ? numA - numB : numB - numA;
        }
        
        if (isANumeric && !isBNumeric) return direction === 'asc' ? -1 : 1;
        if (!isANumeric && isBNumeric) return direction === 'asc' ? 1 : -1;
        
        const strA = String(valueA ?? '').toLowerCase();
        const strB = String(valueB ?? '').toLowerCase();
        return direction === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
      
      await this.replaceAllData(sortedData);
    } catch (error) {
      const repoError = new RepositoryError(`Failed to sort data by column ${columnIndex}`, "DataRepository.sortData", error);
      console.error(repoError.message, repoError);
      throw repoError;
    }
  }
  
  async findAndReplace(findValue: string | number, replaceValue: string | number, options?: { caseSensitive?: boolean, matchEntireCell?: boolean }): Promise<number> {
    try {
        let cellsReplaced = 0;
        const rowsToUpdate: { id: number; data: DataRow }[] = [];
        const { caseSensitive = false, matchEntireCell = true } = options || {};
        const searchStr = caseSensitive ? String(findValue) : String(findValue).toLowerCase();

        await db.dataRows.each(row => {
            let rowWasModified = false;
            const newRowData = row.data.map(cellValue => {
                if (cellValue === undefined || cellValue === null) return cellValue;
                const currentCellStr = caseSensitive ? String(cellValue) : String(cellValue).toLowerCase();

                let shouldReplace = matchEntireCell
                    ? currentCellStr === searchStr
                    : currentCellStr.includes(searchStr);

                if (shouldReplace) {
                    cellsReplaced++;
                    rowWasModified = true;
                    return replaceValue;
                }
                return cellValue;
            });

            if (rowWasModified) {
                rowsToUpdate.push({ id: row.id, data: newRowData });
            }
        });

        if (rowsToUpdate.length > 0) {
            await db.dataRows.bulkPut(rowsToUpdate);
        }
        
        return cellsReplaced;
    } catch (error) {
      const repoError = new RepositoryError(`Error during find and replace`, "DataRepository.findAndReplace", error);
      console.error(repoError.message, repoError);
      throw repoError;
    }
  }
}

const dataRepository = new DataRepository();
export default dataRepository; 