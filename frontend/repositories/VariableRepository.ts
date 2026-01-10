import db from "@/lib/db";
import { Variable, ValueLabel } from "@/types/Variable";
import { RepositoryError } from "@/types/RepositoryError";

export class VariableRepository {
  async getAllVariables(): Promise<Variable[]> {
    try {
      return await db.variables.toArray();
    } catch (error) {
      const repoError = new RepositoryError("Failed to load variables", "VariableRepository.getAllVariables", error);
      console.error(repoError.message, repoError);
      throw repoError;
    }
  }

  async getVariableByColumnIndex(columnIndex: number): Promise<Variable | undefined> {
    try {
      return await db.variables.where('columnIndex').equals(columnIndex).first();
    } catch (error) {
      const repoError = new RepositoryError(`Failed to get variable for column ${columnIndex}`, "VariableRepository.getVariableByColumnIndex", error);
      console.error(repoError.message, repoError);
      throw repoError;
    }
  }

  async getVariableByName(name: string): Promise<Variable | undefined> {
    try {
      return await db.variables.where('name').equals(name).first();
    } catch (error) {
      const repoError = new RepositoryError(`Failed to get variable by name ${name}`, "VariableRepository.getVariableByName", error);
      console.error(repoError.message, repoError);
      throw repoError;
    }
  }

  async saveVariable(variable: Variable): Promise<number> {
    try {
      // Insert or update variable in one step
      const id = await db.variables.put(variable);
      return id;
    } catch (error) {
      const repoError = new RepositoryError("Failed to save variable", "VariableRepository.saveVariable", error);
      console.error(repoError.message, repoError);
      throw repoError;
    }
  }

  async deleteVariable(id: number): Promise<void> {
    try {
      // Use a transaction to ensure both operations succeed or fail together
      await db.transaction('rw', db.variables, db.valueLabels, async () => {
        // First, delete all associated value labels
        await db.valueLabels.where('variableId').equals(id).delete();
        // Then, delete the variable itself
        await db.variables.delete(id);
      });
    } catch (error) {
      const repoError = new RepositoryError(`Failed to delete variable with id ${id}`, "VariableRepository.deleteVariable", error);
      console.error(repoError.message, repoError);
      throw repoError;
    }
  }

  async clearVariables(): Promise<void> {
    try {
      // Also clear value labels to prevent orphaned data
      await db.transaction('rw', db.variables, db.valueLabels, async () => {
        await db.variables.clear();
        await db.valueLabels.clear();
      });
    } catch (error) {
      const repoError = new RepositoryError("Failed to clear variables", "VariableRepository.clearVariables", error);
      console.error(repoError.message, repoError);
      throw repoError;
    }
  }

  // Value Labels operations
  async getValueLabels(variableId: number): Promise<ValueLabel[]> {
    try {
      return await db.valueLabels.where('variableId').equals(variableId).toArray();
    } catch (error) {
      const repoError = new RepositoryError(`Failed to get value labels for variable ID ${variableId}`, "VariableRepository.getValueLabels", error);
      console.error(repoError.message, repoError);
      throw repoError;
    }
  }

  /**
   * Saves a variable and its associated value labels in a single transaction.
   * This is more efficient and ensures data integrity.
   */
  async saveVariableWithLabels(variable: Omit<Variable, 'id'>, labels: Omit<ValueLabel, 'id' | 'variableId'>[]): Promise<number> {
    try {
      let varId: number | undefined;
      await db.transaction('rw', db.variables, db.valueLabels, async () => {
        // Save the variable and get its ID
        varId = await db.variables.put(variable as Variable);
        
        // Prepare labels with the correct variableId
        if (labels.length > 0 && varId !== undefined) {
          const labelsToSave = labels.map(label => ({ ...label, variableId: varId as number }));
          // Bulk add all labels
          await db.valueLabels.bulkAdd(labelsToSave as ValueLabel[]);
        }
      });
      if (varId === undefined) {
        throw new Error("Variable ID could not be obtained.");
      }
      return varId;
    } catch (error) {
      const repoError = new RepositoryError("Failed to save variable with labels", "VariableRepository.saveVariableWithLabels", error);
      console.error(repoError.message, repoError);
      throw repoError;
    }
  }

  async saveValueLabel(valueLabel: ValueLabel): Promise<number> {
    try {
      // Insert or update value label in one step
      return await db.valueLabels.put(valueLabel);
    } catch (error) {
      const repoError = new RepositoryError("Failed to save value label", "VariableRepository.saveValueLabel", error);
      console.error(repoError.message, repoError);
      throw repoError;
    }
  }

  async deleteValueLabel(id: number): Promise<void> {
    try {
      await db.valueLabels.delete(id);
    } catch (error) {
      const repoError = new RepositoryError(`Failed to delete value label with id ${id}`, "VariableRepository.deleteValueLabel", error);
      console.error(repoError.message, repoError);
      throw repoError;
    }
  }

  async deleteValueLabelsByVariable(variableId: number): Promise<void> {
    try {
      await db.valueLabels.where('variableId').equals(variableId).delete();
    } catch (error) {
      const repoError = new RepositoryError(`Failed to delete value labels for variable ID ${variableId}`, "VariableRepository.deleteValueLabelsByVariable", error);
      console.error(repoError.message, repoError);
      throw repoError;
    }
  }

  async getVariableById(id: number): Promise<Variable | undefined> {
    try {
      return await db.variables.get(id);
    } catch (error) {
      const repoError = new RepositoryError(`Failed to get variable with id ${id}`, "VariableRepository.getVariableById", error);
      console.error(repoError.message, repoError);
      throw repoError;
    }
  }

  /**
   * Reorders a variable to a new column index, shifting other variables accordingly.
   */
  async reorderVariable(variableId: number, newIndex: number): Promise<void> {
    try {
        await db.transaction('rw', db.variables, async () => {
            const sourceVar = await db.variables.get(variableId);
            if (!sourceVar) throw new Error("Source variable not found.");

            const oldIndex = sourceVar.columnIndex;
            if (oldIndex === newIndex) return; // No change needed

            // Determine which variables are affected
            const [start, end] = oldIndex < newIndex ? [oldIndex, newIndex] : [newIndex, oldIndex];
            const affectedVars = await db.variables.where('columnIndex').between(start, end, true, true).toArray();

            const updates: Variable[] = [];

            for (const v of affectedVars) {
                if (v.id === variableId) {
                    // This is the variable we are moving
                    updates.push({ ...v, columnIndex: newIndex });
                } else {
                    // This is a variable that needs to be shifted
                    if (oldIndex < newIndex) {
                        // Moving down: vars between old and new index shift up
                        updates.push({ ...v, columnIndex: v.columnIndex - 1 });
                    } else {
                        // Moving up: vars between new and old index shift down
                        updates.push({ ...v, columnIndex: v.columnIndex + 1 });
                    }
                }
            }

            await db.variables.bulkPut(updates);
        });
    } catch (error) {
        const repoError = new RepositoryError(`Failed to reorder variable ${variableId} to index ${newIndex}`, "VariableRepository.reorderVariable", error);
        console.error(repoError.message, repoError);
        throw repoError;
    }
  }

  /**
   * Efficiently shifts column indexes for all variables at or after a given index.
   * @param startIndex The starting column index for the shift.
   * @param shiftAmount The amount to shift by (e.g., 1 for insertion, -1 for deletion).
   */
  async shiftColumnIndexes(startIndex: number, shiftAmount: number): Promise<void> {
    try {
      await db.variables
        .where('columnIndex')
        .aboveOrEqual(startIndex)
        .reverse()
        .modify(v => {
          v.columnIndex += shiftAmount;
        });
    } catch (error) {
      const repoError = new RepositoryError(`Failed to shift column indexes from ${startIndex}`, "VariableRepository.shiftColumnIndexes", error);
      console.error(repoError.message, repoError);
      throw repoError;
    }
  }
}

const variableRepository = new VariableRepository();
export default variableRepository; 