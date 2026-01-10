import { variableRepository, dataRepository, VariableRepository, DataRepository } from "@/repositories";
import { Variable, ValueLabel } from "@/types/Variable";
import db from "@/lib/db";
import { DataRow } from "@/types/Data";

/**
 * Service for orchestrating operations that affect the entire sheet (both variables and data).
 * This service coordinates transactions across the VariableService and DataService.
 */
export class SheetService {
  private variableRepository: VariableRepository;
  private dataRepository: DataRepository;

  constructor(
    variableRepo: VariableRepository = variableRepository,
    dataRepo: DataRepository = dataRepository
  ) {
    this.variableRepository = variableRepo;
    this.dataRepository = dataRepo;
  }

  /**
   * Replaces all variables and all data rows in the database within a single transaction.
   * This is the primary method for loading a new dataset from a file.
   * @param variables The new array of variables to import.
   * @param data The new array of data rows to import.
   */
  async replaceAll(variables: Variable[], data: DataRow[]) {
    try {
      await db.transaction('rw', db.variables, db.dataRows, db.valueLabels, async () => {
        await this.dataRepository.replaceAllData(data);
        await this.variableRepository.clearVariables(); // Clears vars and labels

        const validVariables = variables.filter(v => v);
        if (validVariables.length === 0) return;

        const newIds = await db.variables.bulkAdd(validVariables, { allKeys: true });

        const labels: ValueLabel[] = [];
        validVariables.forEach((v, i) => {
          if (v.values && v.values.length > 0) {
            const variableId = newIds[i] as number;
            v.values.forEach(val => {
              labels.push({ ...val, variableId });
            });
          }
        });

        if (labels.length > 0) {
          await db.valueLabels.bulkPut(labels);
        }
      });
    } catch (error) {
      console.error("Error in SheetService.replaceAll:", error);
      throw error;
    }
  }

  /**
   * Orchestrates the complete insertion of a single column, creating its variable definition
   * and the data column itself within a single transaction. It re-indexes subsequent variables.
   */
  async insertColumn(newVar: Omit<Variable, 'id'>) {
    await db.transaction('rw', db.variables, db.dataRows, async () => {
      // 1. Shift existing variables to make space
      await this.variableRepository.shiftColumnIndexes(newVar.columnIndex, 1);
      
      // 2. Shift the actual data columns
      await this.dataRepository.insertColumn(newVar.columnIndex);

      // 3. Now that space is made, save the new variable definition.
      await this.variableRepository.saveVariable(newVar as Variable);
    });
  }

  /**
   * Orchestrates the complete insertion of MULTIPLE columns, creating their variable definitions
   * and the data columns within a single transaction. It re-indexes subsequent variables.
   * This function rebuilds the variable and data structure to ensure contiguous indices.
   */
  async addMultipleColumns(newVars: Omit<Variable, 'id'>[]) {
    await db.transaction('rw', db.variables, db.dataRows, db.valueLabels, async () => {
        const allCurrentVars = await this.variableRepository.getAllVariables();
        const allData = await this.dataRepository.getAllRows();

        const finalVarMap = new Map<number, any>();
        [...allCurrentVars, ...newVars].forEach(v => {
            finalVarMap.set(v.columnIndex, v);
        });
        const finalSortedIndices = Array.from(finalVarMap.keys()).sort((a, b) => a - b);

        const finalVars = finalSortedIndices.map((originalIndex, newIndex) => {
            const { id, ...rest } = finalVarMap.get(originalIndex); // Destructure to remove 'id'
            return {
                ...rest,
                columnIndex: newIndex,
            };
        });
        
        const maxOriginalIndex = Math.max(...finalSortedIndices, 0);
        const newData = allData.map(oldRow => {
            const wideOldRow = [...oldRow];
            while (wideOldRow.length <= maxOriginalIndex) wideOldRow.push('');

            const newRow: (string | number | null)[] = [];
            finalSortedIndices.forEach(originalIndex => {
                newRow.push(wideOldRow[originalIndex]);
            });
            return newRow;
        });

        await this.dataRepository.replaceAllData(newData);
        await this.variableRepository.clearVariables(); 

        if (finalVars.length > 0) {
            const newIds = await db.variables.bulkAdd(finalVars as Variable[], { allKeys: true });
            
            const labels: ValueLabel[] = [];
            finalVars.forEach((v, i) => {
                if (v.values && v.values.length > 0) {
                    const variableId = newIds[i] as number;
                    (v.values as ValueLabel[]).forEach((val: ValueLabel) => {
                        labels.push({ ...val, variableId });
                    });
                }
            });
            if (labels.length > 0) {
                await db.valueLabels.bulkPut(labels);
            }
        }
    });
  }

  /**
   * Orchestrates the complete deletion of a column, including its variable definition
   * and all associated data, within a single transaction. It re-indexes subsequent variables.
   */
  async deleteColumn(columnIndex: number) {
    await db.transaction('rw', db.variables, db.dataRows, db.valueLabels, async () => {
      const allVars = await this.variableRepository.getAllVariables();
      const variableToDelete = allVars.find(v => v.columnIndex === columnIndex);
      
      await this.dataRepository.deleteColumn(columnIndex);
      
      if (variableToDelete?.id) {
        await this.variableRepository.deleteVariable(variableToDelete.id);
      }

      const remainingVars = allVars.filter(v => v.columnIndex !== columnIndex)
          .sort((a,b) => a.columnIndex - b.columnIndex)
          .map((v, i) => ({ ...v, columnIndex: i }));

      for (const v of remainingVars) {
        await this.variableRepository.saveVariable(v);
      }
    });
  }

  /**
   * Orchestrates the complete deletion of MULTIPLE columns in a single transaction.
   * To prevent re-indexing issues, it processes deletions in descending order of column index.
   */
  async deleteMultipleColumns(columnIndices: number[]) {
    await db.transaction('rw', db.variables, db.dataRows, db.valueLabels, async () => {
        const sortedIndices = [...columnIndices].sort((a, b) => b - a); // Descending order is crucial
        for (const index of sortedIndices) {
            // Re-using the single-delete logic is safe here because we are iterating downwards.
            // Deleting a higher index does not affect the position of a lower index within the same loop.
            await this.deleteColumn(index);
        }
    });
  }

  /**
   * Sorts variables based on a specific field and reorders the actual data columns
   * to match the new variable order.
   * @param direction The sort direction ('asc' or 'desc').
   * @param field The variable field to sort by.
   */
  async sortSheetByVariable(direction: 'asc' | 'desc', field: keyof Variable) {
    await db.transaction('rw', db.variables, db.dataRows, db.valueLabels, async () => {
      const allVars = await this.variableRepository.getAllVariables();
      const allData = await this.dataRepository.getAllRows();

      if (allVars.length === 0) return;

      const originalOrder = allVars.map(v => v.columnIndex).sort((a, b) => a - b);
      const sortedVarsMeta = allVars
        .map((v) => ({ v, originalIndex: v.columnIndex }))
        .sort((a, b) => {
          const aValue = a.v[field];
          const bValue = b.v[field];
          
          if (aValue == null && bValue == null) return 0;
          if (aValue == null) return direction === 'asc' ? -1 : 1;
          if (bValue == null) return direction === 'asc' ? 1 : -1;
          
          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return direction === 'asc' ? aValue - bValue : bValue - aValue;
          }
          
          const aStr = String(aValue).toLowerCase();
          const bStr = String(bValue).toLowerCase();
          return direction === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
        });

      const newOrderMap = sortedVarsMeta.map(item => item.originalIndex);

      const reorderedData = allData.map(row => {
        if (!row) return [];
        // Create a temporary object to map originalIndex to value for the current row
        const rowMap = new Map<number, any>();
        originalOrder.forEach((originalIdx, i) => {
            rowMap.set(originalIdx, row[i]);
        });
        
        // Build the new row using the new order of original indices
        const orderedRow = newOrderMap.map(oldIndex => {
            return rowMap.get(oldIndex) ?? '';
        });
        return orderedRow;
      });

      const finalVars = sortedVarsMeta.map((item, newIndex) => ({
        ...item.v,
        columnIndex: newIndex
      }));

      await this.dataRepository.replaceAllData(reorderedData);
      
      await this.variableRepository.clearVariables();
      // Since we cleared, we need to re-import
      const validVariables = finalVars.filter(v => v);
      if (validVariables.length > 0) {
        const newIds = await db.variables.bulkAdd(validVariables as Variable[], { allKeys: true });

        const labels: ValueLabel[] = [];
        validVariables.forEach((v, i) => {
          if (v.values && v.values.length > 0) {
            const variableId = newIds[i] as number;
            v.values.forEach(val => {
              labels.push({ ...val, variableId });
            });
          }
        });

        if (labels.length > 0) {
          await db.valueLabels.bulkPut(labels);
        }
      }
    });
  }
}

const sheetService = new SheetService();
export default sheetService; 