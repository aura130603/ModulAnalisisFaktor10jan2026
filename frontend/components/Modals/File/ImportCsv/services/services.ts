import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import type { Variable } from "@/types/Variable";
import type { CSVProcessingOptions } from "../types";

export interface ProcessedCsvData {
    variables: Variable[];
    data: string[][];
}

/**
 * Parses CSV content off the main thread via Web Worker.
 */
export function parseCsvWithWorker(
  fileContent: string,
  options: CSVProcessingOptions
): Promise<ProcessedCsvData> {
  return new Promise((resolve, reject) => {
    const worker = new Worker("/workers/DataManagement/csvWorker.js");
    worker.onmessage = (e) => {
      const { result, error } = e.data;
      if (error) reject(new Error(error));
      else resolve(result);
      worker.terminate();
    };
    worker.onerror = (err) => {
      reject(err.error || new Error("Worker error"));
      worker.terminate();
    };
    worker.postMessage({ fileContent, options });
  });
}

export const importCsvDataService = {
    async resetStores(): Promise<void> {
        // This function is now redundant as overwriteAll handles replacement.
        // Kept for now to avoid breaking the hook, but will be removed from the call chain.
        await useDataStore.getState().resetData();
        await useVariableStore.getState().resetVariables();
    },

    async populateStores(processedData: ProcessedCsvData): Promise<void> {
        const { variables, data } = processedData;
        const variableStore = useVariableStore.getState();

        // Atomically overwrite variables and data and persist them.
        await variableStore.overwriteAll(variables, data);
    }
}; 