import { variableRepository, VariableRepository } from "@/repositories";
import { Variable, ValueLabel } from "@/types/Variable";
import db from "@/lib/db";

export class VariableService {
  private variableRepository: VariableRepository;

  constructor(
    variableRepo: VariableRepository = variableRepository,
  ) {
    this.variableRepository = variableRepo;
  }

  /**
   * Load all variables from the database
   */
  async getAllVariables() {
    try {
      const variables = await this.variableRepository.getAllVariables();
      return variables;
    } catch (error) {
      console.error("Error in VariableService.getAllVariables:", error);
      throw error;
    }
  }

  /**
   * Clear all variables from the database
   */
  async clearAllVariables() {
    try {
      await this.variableRepository.clearVariables();
      return true;
    } catch (error) {
      console.error("Error in VariableService.clearAllVariables:", error);
      throw error;
    }
  }

  /**
   * Get variable by name
   */
  async getVariableByName(name: string) {
    try {
      const variable = await this.variableRepository.getVariableByName(name);
      return variable;
    } catch (error) {
      console.error(`Error in VariableService.getVariableByName for ${name}:`, error);
      throw error;
    }
  }

  /**
   * Get variable by column index
   */
  async getVariableByColumnIndex(columnIndex: number) {
    try {
      const variable = await this.variableRepository.getVariableByColumnIndex(columnIndex);
      return variable;
    } catch (error) {
      console.error(`Error in VariableService.getVariableByColumnIndex for column ${columnIndex}:`, error);
      throw error;
    }
  }

  /**
   * Update or create a variable
   */
  async saveVariable(variable: Variable) {
    try {
      return await this.variableRepository.saveVariable(variable);
    } catch (error) {
      console.error(`Error in VariableService.saveVariable for variable "${variable.name}":`, error);
      throw error;
    }
  }

  /**
   * Delete a variable's metadata and value labels from the database.
   * This does NOT affect other variables' indices or the data columns.
   */
  async deleteVariable(id: number) {
    try {
      await this.variableRepository.deleteVariable(id);
    } catch (error) {
      console.error(`Error in VariableService.deleteVariable for ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Replaces all variables and their associated value labels with the provided set.
   * This is used for bulk updates where the data rows should not be affected.
   */
  async importVariables(variables: Variable[]): Promise<void> {
    try {
      await db.transaction('rw', db.variables, db.valueLabels, async () => {
        await this.variableRepository.clearVariables();

        const validVariables = variables.filter(v => v);
        if (validVariables.length === 0) return;

        const newIds = await db.variables.bulkAdd(validVariables, { allKeys: true });

        const labels: ValueLabel[] = [];
        validVariables.forEach((v, i) => {
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
      });
    } catch (error) {
      console.error("Error in VariableService.importVariables:", error);
      throw error;
    }
  }
  
  /**
   * Get value labels for a variable
   */
  async getValueLabels(variableId: number) {
    try {
      return await this.variableRepository.getValueLabels(variableId);
    } catch (error) {
      console.error(`Error in VariableService.getValueLabels for variable ID ${variableId}:`, error);
      throw error;
    }
  }
  
  /**
   * Save value label
   */
  async saveValueLabel(valueLabel: ValueLabel) {
    try {
      return await this.variableRepository.saveValueLabel(valueLabel);
    } catch (error) {
      console.error("Error in VariableService.saveValueLabel:", error);
      throw error;
    }
  }
}

const variableService = new VariableService();
export default variableService; 