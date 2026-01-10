// DataProcessingWorkerService.ts
// TypeScript wrapper untuk DataProcessingWorker

// Interface untuk input worker
interface DataProcessingWorkerInput {
  chartType: string;
  rawData: any[][];
  variables: Array<{ name: string; type?: string }>;
  chartVariables: {
    x?: string[];
    y?: string[];
    z?: string[];
    groupBy?: string[];
    low?: string[];
    high?: string[];
    close?: string[];
    y2?: string[];
  };
  processingOptions?: {
    aggregation?: "sum" | "count" | "average" | "none";
    filterEmpty?: boolean;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    limit?: number;
  };
}

// Interface untuk output worker
interface DataProcessingWorkerOutput {
  success: boolean;
  processedData?: any[];
  chartType?: string;
  error?: string;
}

export class DataProcessingWorkerService {
  private static workerUrl = "/workers/ChartBuilder/DataProcessingWorker.js";

  /**
   * Process data menggunakan Web Worker
   * @param input DataProcessingWorkerInput
   * @returns Promise<any[]> - Processed data array
   */
  static async processData(input: DataProcessingWorkerInput): Promise<any[]> {
    return new Promise((resolve, reject) => {
      try {
        const worker = new Worker(this.workerUrl);

        // Setup event listeners
        worker.onmessage = function (
          event: MessageEvent<DataProcessingWorkerOutput>
        ) {
          if (event.data.success && event.data.processedData) {
            resolve(event.data.processedData);
          } else {
            reject(new Error(event.data.error || "Unknown error occurred"));
          }
          worker.terminate();
        };

        worker.onerror = function (error: ErrorEvent) {
          reject(new Error(`Worker error: ${error.message}`));
          worker.terminate();
        };

        // Send data to worker
        worker.postMessage(input);
      } catch (error) {
        reject(new Error(`Failed to create worker: ${error}`));
      }
    });
  }

  /**
   * Process data dengan timeout
   * @param input DataProcessingWorkerInput
   * @param timeoutMs Timeout dalam milliseconds (default: 30000ms)
   * @returns Promise<any[]> - Processed data array
   */
  static async processDataWithTimeout(
    input: DataProcessingWorkerInput,
    timeoutMs: number = 30000
  ): Promise<any[]> {
    return Promise.race([
      this.processData(input),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Data processing timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  }

  /**
   * Process data dengan progress callback
   * @param input DataProcessingWorkerInput
   * @param onProgress Progress callback function
   * @returns Promise<any[]> - Processed data array
   */
  static async processDataWithProgress(
    input: DataProcessingWorkerInput,
    onProgress?: (progress: number) => void
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      try {
        const worker = new Worker(this.workerUrl);
        let startTime = Date.now();

        // Setup event listeners
        worker.onmessage = function (
          event: MessageEvent<DataProcessingWorkerOutput>
        ) {
          if (event.data.success && event.data.processedData) {
            if (onProgress) {
              onProgress(100); // 100% complete
            }
            resolve(event.data.processedData);
          } else {
            reject(new Error(event.data.error || "Unknown error occurred"));
          }
          worker.terminate();
        };

        worker.onerror = function (error: ErrorEvent) {
          reject(new Error(`Worker error: ${error.message}`));
          worker.terminate();
        };

        // Simulate progress updates
        if (onProgress) {
          onProgress(0); // Start

          const progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const estimatedProgress = Math.min(90, (elapsed / 1000) * 10); // Estimate progress
            onProgress(estimatedProgress);
          }, 100);

          // Cleanup interval when done
          worker.onmessage = function (
            event: MessageEvent<DataProcessingWorkerOutput>
          ) {
            clearInterval(progressInterval);
            if (event.data.success && event.data.processedData) {
              onProgress(100);
              resolve(event.data.processedData);
            } else {
              reject(new Error(event.data.error || "Unknown error occurred"));
            }
            worker.terminate();
          };
        }

        // Send data to worker
        worker.postMessage(input);
      } catch (error) {
        reject(new Error(`Failed to create worker: ${error}`));
      }
    });
  }

  /**
   * Batch process multiple datasets
   * @param inputs Array of DataProcessingWorkerInput
   * @returns Promise<any[][]> - Array of processed data arrays
   */
  static async processBatchData(
    inputs: DataProcessingWorkerInput[]
  ): Promise<any[][]> {
    const promises = inputs.map((input) => this.processData(input));
    return Promise.all(promises);
  }

  /**
   * Check if Web Workers are supported
   * @returns boolean
   */
  static isSupported(): boolean {
    return typeof Worker !== "undefined";
  }

  /**
   * Get worker URL
   * @returns string
   */
  static getWorkerUrl(): string {
    return this.workerUrl;
  }

  /**
   * Set custom worker URL
   * @param url Custom worker URL
   */
  static setWorkerUrl(url: string): void {
    this.workerUrl = url;
  }
}

// Utility functions untuk common use cases
export const DataProcessingWorkerUtils = {
  /**
   * Process simple bar chart data
   */
  async processBarChart(
    rawData: any[][],
    variables: Array<{ name: string; type?: string }>,
    xVariable: string,
    yVariable: string,
    options?: {
      aggregation?: "sum" | "count" | "average" | "none";
      filterEmpty?: boolean;
    }
  ): Promise<any[]> {
    return DataProcessingWorkerService.processData({
      chartType: "Vertical Bar Chart",
      rawData,
      variables,
      chartVariables: {
        x: [xVariable],
        y: [yVariable],
      },
      processingOptions: options,
    });
  },

  /**
   * Process scatter plot data
   */
  async processScatterPlot(
    rawData: any[][],
    variables: Array<{ name: string; type?: string }>,
    xVariable: string,
    yVariable: string,
    options?: {
      filterEmpty?: boolean;
    }
  ): Promise<any[]> {
    return DataProcessingWorkerService.processData({
      chartType: "Scatter Plot",
      rawData,
      variables,
      chartVariables: {
        x: [xVariable],
        y: [yVariable],
      },
      processingOptions: options,
    });
  },

  /**
   * Process stacked bar chart data
   */
  async processStackedBarChart(
    rawData: any[][],
    variables: Array<{ name: string; type?: string }>,
    xVariable: string,
    yVariables: string[],
    options?: {
      aggregation?: "sum" | "count" | "average" | "none";
      filterEmpty?: boolean;
    }
  ): Promise<any[]> {
    return DataProcessingWorkerService.processData({
      chartType: "Vertical Stacked Bar Chart",
      rawData,
      variables,
      chartVariables: {
        x: [xVariable],
        y: yVariables,
      },
      processingOptions: options,
    });
  },

  /**
   * Process 3D chart data
   */
  async process3DChart(
    rawData: any[][],
    variables: Array<{ name: string; type?: string }>,
    xVariable: string,
    yVariable: string,
    zVariable: string,
    options?: {
      aggregation?: "sum" | "count" | "average" | "none";
      filterEmpty?: boolean;
    }
  ): Promise<any[]> {
    return DataProcessingWorkerService.processData({
      chartType: "3D Scatter Plot",
      rawData,
      variables,
      chartVariables: {
        x: [xVariable],
        y: [yVariable],
        z: [zVariable],
      },
      processingOptions: options,
    });
  },
};

// Export types
export type { DataProcessingWorkerInput, DataProcessingWorkerOutput };
