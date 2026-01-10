import { dataRepository, DataRepository } from "@/repositories";
import { DataRow } from "@/types/Data";
import db from "@/lib/db";

export class DataService {
  private repository: DataRepository;

  constructor(repository: DataRepository = dataRepository) {
    this.repository = repository;
  }

  /**
   * Load all data from the database
   */
  async loadAllData() {
    try {
      const data = await this.repository.getAllRows();
      return { data };
    } catch (error) {
      console.error("Error in DataService.loadAllData:", error);
      throw error;
    }
  }

  /**
   * Reset the database by clearing all data
   */
  async resetAllData() {
    try {
      await this.repository.clearAllData();
      return true;
    } catch (error) {
      console.error("Error in DataService.resetAllData:", error);
      throw error;
    }
  }
  
  /**
   * Apply bulk updates to the data via repository.updateBulkCells for efficiency
   */
  async applyBulkUpdates(updates: { row: number; col: number; value: string | number }[]) {
    try {
      // Deduplicate row indices for return
      const updatedRowIndices = Array.from(new Set(updates.map(u => u.row)));
      // Delegate to repository for batch update in single transaction
      await this.repository.updateBulkCells(updates);
      return updatedRowIndices;
    } catch (error) {
      console.error("Error in DataService.applyBulkUpdates:", error);
      throw error;
    }
  }
  
  /**
   * Import data from a file or external source. This replaces all existing data.
   */
  async importData(data: DataRow[]) {
    try {
      await this.repository.replaceAllData(data);
      return true;
    } catch (error) {
      console.error("Error in DataService.importData:", error);
      throw error;
    }
  }
  
  /**
   * Get data for a specific column
   */
  async getColumnData(columnIndex: number) {
    try {
      const columnData = await this.repository.getColumnData(columnIndex);
      return { columnData };
    } catch (error) {
      console.error(`Error in DataService.getColumnData for column ${columnIndex}:`, error);
      throw error;
    }
  }

  /**
   * Replace all data with new rows
   */
  async replaceAllData(data: DataRow[]) {
    try {
      await this.repository.replaceAllData(data);
      return true;
    } catch (error) {
      console.error("Error in DataService.replaceAllData:", error);
      throw error;
    }
  }

  /**
   * Update a single cell value
   */
  async updateCell(row: number, col: number, value: string | number) {
    return this.applyBulkUpdates([{ row, col, value }]);
  }
  
  /**
   * Add a new row at the specified index
   */
  async addRow(index: number, data?: DataRow) {
    try {
      // If no data is provided, we need to know how many columns to create.
      // This requires a read, which is inefficient. The UI should ideally provide a complete row.
      let rowData = data;
      if (!rowData) {
        const allData = await this.repository.getAllRows();
        const colCount = allData[0]?.length ?? 0;
        rowData = Array(colCount).fill("");
      }
      await this.repository.insertRow(index, rowData);
      return index;
    } catch (error) {
      console.error(`Error in DataService.addRow at index ${index}:`, error);
      throw error;
    }
  }
  
  /**
   * Add multiple rows at specified indices
   */
  async addBulkRows(rowsToAdd: { index: number; data: DataRow }[]) {
    try {
      if (!rowsToAdd || rowsToAdd.length === 0) return true;
      await this.repository.addBulkRows(rowsToAdd);
      return true;
    } catch (error) {
      console.error("Error in DataService.addBulkRows:", error);
      throw error;
    }
  }
  
  /**
   * Delete a row at the specified index
   */
  async deleteRow(index: number) {
    try {
      await this.repository.deleteRow(index);
      return true;
    } catch (error) {
      console.error(`Error in DataService.deleteRow at index ${index}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete multiple rows at specified indices
   */
  async deleteBulkRows(indices: number[]) {
    try {
      if (!indices || indices.length === 0) return true;
      await this.repository.deleteBulkRows(indices);
      return true;
    } catch (error) {
      console.error("Error in DataService.deleteBulkRows:", error);
      throw error;
    }
  }

  /**
   * Swap two rows in the dataset
   */
  // OPTIMIZE: This currently swaps by fetching both full rows and re-saving them.
  // A more direct repository method could be more efficient if performance is an issue.
  async swapRows(row1: number, row2: number) {
    try {
      await this.repository.swapRows(row1, row2);
      return true;
    } catch (error) {
      console.error(`Error in DataService.swapRows for rows ${row1}, ${row2}:`, error);
      throw error;
    }
  }
  
  /**
   * Sort the data by a specific column
   */
  // OPTIMIZE: This loads the entire dataset into memory for sorting.
  // For very large datasets, this will be slow and memory-intensive.
  // Sorting should ideally be handled by the database/repository layer if possible.
  async sortData(columnIndex: number, direction: 'asc' | 'desc') {
    try {
      await this.repository.sortData(columnIndex, direction);
      return true;
    } catch (error) {
      console.error(`Error in DataService.sortData for column ${columnIndex}:`, error);
      throw error;
    }
  }

  /**
   * Finds and replaces values across the entire dataset.
   * @param findValue The value to search for.
   * @param replaceValue The value to replace with.
   * @param options Optional settings for the search (e.g., case-sensitive).
   * @returns The number of cells that were replaced.
   */
  async findAndReplace(findValue: string | number, replaceValue: string | number, options?: { caseSensitive?: boolean, matchEntireCell?: boolean }): Promise<number> {
    try {
      return await this.repository.findAndReplace(findValue, replaceValue, options);
    } catch (error) {
      console.error(`Error in DataService.findAndReplace:`, error);
      throw error;
    }
  }
}

const dataService = new DataService();
export default dataService; 