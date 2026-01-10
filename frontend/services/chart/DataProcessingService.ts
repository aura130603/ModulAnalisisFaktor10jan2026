/**
 * DataProcessingService - Service untuk memproses raw data menjadi format yang sesuai untuk chart
 *
 * ============================================================================
 * DOKUMENTASI PENGGUNAAN SPESIFIK
 * ============================================================================
 *
 * 1. Q-Q PLOT
 * =================
 *
 * // Raw data dari CSV/SPSS (format: rows = cases, columns = variables)
 * const rawData = [
 *   [1, 2.1, 3.5, 4.2, 5.1, 6.3, 7.0, 8.1, 9.5, 10.2], // Case 1: NN values
 *   [2, 3.8, 4.1, 5.3, 6.2, 7.1, 8.5, 9.2, 10.1, 11.3], // Case 2: NN values
 *   [3, 4.5, 5.2, 6.1, 7.3, 8.2, 9.1, 10.5, 11.2, 12.1]  // Case 3: NN values
 * ];
 *
 * // Variable definitions (metadata dari SPSS/CSV)
 * const variables = [
 *   { name: "NN", type: "NUMERIC" },
 *   { name: "N", type: "NUMERIC" },
 *   { name: "GM", type: "NUMERIC" }
 * ];
 *
 * // Process data untuk Q-Q Plot
 * const result = DataProcessingService.processDataForChart({
 *   chartType: "Q-Q Plot",
 *   rawData: rawData,
 *   variables: variables,
 *   chartVariables: {
 *     y: ["NN"] // Hanya butuh 1 variabel di Y-axis
 *   },
 *   processingOptions: {
 *     filterEmpty: true, // Hapus data kosong
 *     sortBy: "value",   // Sort berdasarkan nilai
 *     sortOrder: "asc"   // Ascending order
 *   }
 * });
 *
 * console.log(result.data);
 * // Output: [
 * //   { x: -1.96, y: -2.1 },
 * //   { x: -1.28, y: -1.3 },
 * //   { x: 0, y: 0.1 },
 * //   { x: 1.28, y: 1.2 },
 * //   { x: 1.96, y: 2.0 }
 * // ]
 *
 * console.log(result.axisInfo);
 * // Output: {
 * //   x: "Theoretical Quantiles",
 * //   y: "NN"
 * // }
 *
 * ============================================================================
 *
 * 2. P-P PLOT
 * ===========
 *
 * // Raw data dari CSV/SPSS
 * const rawData = [
 *   [1, 2.1, 3.5, 4.2, 5.1, 6.3, 7.0, 8.1, 9.5, 10.2],
 *   [2, 3.8, 4.1, 5.3, 6.2, 7.1, 8.5, 9.2, 10.1, 11.3],
 *   [3, 4.5, 5.2, 6.1, 7.3, 8.2, 9.1, 10.5, 11.2, 12.1]
 * ];
 *
 * const variables = [
 *   { name: "NN", type: "NUMERIC" },
 *   { name: "N", type: "NUMERIC" },
 *   { name: "GM", type: "NUMERIC" }
 * ];
 *
 * // Process data untuk P-P Plot
 * const result = DataProcessingService.processDataForChart({
 *   chartType: "P-P Plot",
 *   rawData: rawData,
 *   variables: variables,
 *   chartVariables: {
 *     y: ["NN"] // Hanya butuh 1 variabel di Y-axis
 *   },
 *   processingOptions: {
 *     filterEmpty: true,
 *     sortBy: "value",
 *     sortOrder: "asc"
 *   }
 * });
 *
 * console.log(result.data);
 * // Output: [
 * //   { x: 0.1, y: 0.12 },
 * //   { x: 0.3, y: 0.28 },
 * //   { x: 0.5, y: 0.52 },
 * //   { x: 0.7, y: 0.68 },
 * //   { x: 0.9, y: 0.91 }
 * // ]
 *
 * console.log(result.axisInfo);
 * // Output: {
 * //   x: "Observed Cum Prop",
 * //   y: "NN"
 * // }
 *
 * ============================================================================
 *
 * 3. SCATTER PLOT WITH MULTIPLE FIT LINE
 * =======================================
 *
 * // Raw data dari CSV/SPSS
 * const rawData = [
 *   [1, 2.1, 3.5, 4.2, 5.1, 6.3, 7.0, 8.1, 9.5, 10.2], // Case 1: [NN, N, GM]
 *   [2, 3.8, 4.1, 5.3, 6.2, 7.1, 8.5, 9.2, 10.1, 11.3], // Case 2: [NN, N, GM]
 *   [3, 4.5, 5.2, 6.1, 7.3, 8.2, 9.1, 10.5, 11.2, 12.1]  // Case 3: [NN, N, GM]
 * ];
 *
 * const variables = [
 *   { name: "NN", type: "NUMERIC" },
 *   { name: "N", type: "NUMERIC" },
 *   { name: "GM", type: "NUMERIC" }
 * ];
 *
 * // Process data untuk Scatter Plot With Multiple Fit Line
 * const result = DataProcessingService.processDataForChart({
 *   chartType: "Scatter Plot With Multiple Fit Line",
 *   rawData: rawData,
 *   variables: variables,
 *   chartVariables: {
 *     x: ["NN"], // X-axis variable
 *     y: ["N"]   // Y-axis variable
 *   },
 *   processingOptions: {
 *     filterEmpty: true, // Hapus data kosong
 *     sortBy: "x",       // Sort berdasarkan X values
 *     sortOrder: "asc"   // Ascending order
 *   }
 * });
 *
 * console.log(result.data);
 * // Output: [
 * //   { x: 1, y: 2.1 },
 * //   { x: 2, y: 3.8 },
 * //   { x: 3, y: 4.5 },
 * //   { x: 4, y: 5.2 },
 * //   { x: 5, y: 6.1 }
 * // ]
 *
 * console.log(result.axisInfo);
 * // Output: {
 * //   x: "NN",
 * //   y: "N"
 * // }
 *
 * ============================================================================
 *
 * CATATAN PENTING:
 * ================
 *
 * 1. rawData format: Array of arrays dimana setiap row = 1 case, setiap column = 1 variable
 * 2. variables: Metadata dari SPSS/CSV yang mendefinisikan nama dan tipe variabel
 * 3. chartVariables: Mapping variabel ke axis (x, y, z, groupBy, dll)
 * 4. processingOptions: Opsi untuk filtering, sorting, aggregation
 * 5. Output: { data: processedData[], axisInfo: { x: string, y: string } }
 *
 * FORMAT INPUT/OUTPUT:
 * ===================
 *
 * Input rawData: number[][]
 * - Row = Case/Record
 * - Column = Variable
 * - Example: [[1,2,3], [4,5,6], [7,8,9]] = 3 cases, 3 variables
 *
 * Input variables: Array<{name: string, type?: string}>
 * - name: Nama variabel (harus sama dengan chartVariables)
 * - type: Tipe data (NUMERIC, STRING, dll)
 *
 * Input chartVariables: Object
 * - x: string[] - Variabel untuk X-axis
 * - y: string[] - Variabel untuk Y-axis
 * - z: string[] - Variabel untuk Z-axis (3D charts)
 * - groupBy: string[] - Variabel untuk grouping
 *
 * Output: { data: any[], axisInfo: Record<string, string> }
 * - data: Data yang sudah diproses sesuai format chart
 * - axisInfo: Label untuk setiap axis
 *
 * ============================================================================
 */

import { isNull } from "mathjs";
import { probit, mean, variance, standardDeviation } from "simple-statistics";

// Interface untuk output data processing
export interface DataProcessingOutput {
  data: any[];
  axisInfo: Record<string, string>;
}

// Interface untuk input data processing
export interface DataProcessingInput {
  // Required
  chartType: string;
  rawData: any[][]; // Raw data dari CSV/SPSS
  variables: Array<{ name: string; type?: string }>; // Variable definitions

  // Chart variables mapping
  chartVariables: {
    x?: string[]; // X-axis variables
    y?: string[]; // Y-axis variables
    z?: string[]; // Z-axis variables (3D)
    groupBy?: string[]; // Grouping variables
    low?: string[]; // Low values (range charts)
    high?: string[]; // High values (range charts)
    close?: string[]; // Close values (financial charts)
    y2?: string[]; // Secondary Y-axis
  };

  // Data processing options
  processingOptions?: {
    aggregation?: "sum" | "count" | "average" | "none";
    filterEmpty?: boolean;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    limit?: number;
    errorBar?: ErrorBarOptions;
  };
}

// Konfigurasi aggregation support per chart type
const CHART_AGGREGATION_CONFIG: { [chartType: string]: string[] } = {
  // Charts dengan full aggregation support
  "Vertical Bar Chart": ["sum", "count", "average", "none"],
  "Horizontal Bar Chart": ["sum", "count", "average", "none"],
  "Line Chart": ["sum", "count", "average", "none"],
  "Area Chart": ["sum", "count", "average", "none"],
  "Pie Chart": ["sum", "count", "average", "none"],
  "Error Bar Chart": ["average", "none"],
  "Frequency Polygon": ["count", "none"],
  "Summary Point Plot": ["sum", "count", "average", "none"],

  // Charts dengan data mentah only
  Boxplot: ["none"],
  "Dot Plot": ["none"],
  "Violin Plot": ["none"],

  // Charts dengan limited aggregation
  "Vertical Stacked Bar Chart": ["sum", "none"],
  "Horizontal Stacked Bar Chart": ["sum", "none"],
  "Clustered Bar Chart": ["sum", "none"],
  "Multiple Line Chart": ["sum", "none"],
  "Stacked Area Chart": ["sum", "none"],
  "Population Pyramid": ["sum", "none"],
  "3D Bar Chart": ["sum", "none"],
  "3D Bar Chart (ECharts)": ["sum", "count", "average", "none"],
  "3D Bar Chart2": ["sum", "none"],
  "Clustered 3D Bar Chart": ["sum", "none"],
  "Stacked 3D Bar Chart": ["sum", "none"],
  "Difference Area": ["sum", "none"],
  "Vertical Bar & Line Chart": ["sum", "none"],
  "Clustered Error Bar Chart": ["average", "none"],

  // Charts dengan count only
  Histogram: ["count", "none"],
  "Stacked Histogram": ["count", "none"],

  // Charts dengan data individual only
  "Scatter Plot": ["none"],
  "Scatter Plot With Fit Line": ["none"],
  "Scatter Plot With Multiple Fit Line": ["none"],
  "3D Scatter Plot": ["none"],
  "Grouped Scatter Plot": ["none"],
  "Drop Line Chart": ["none"],
  "Simple Range Bar": ["none"],
  "High-Low-Close Chart": ["none"],
  "Clustered Range Bar": ["none"],
  "Dual Axes Scatter Plot": ["none"],
  "Grouped 3D Scatter Plot": ["none"],
  "Density Chart": ["none"],
  "Q-Q Plot": ["count", "none"],
  "P-P Plot": ["count", "none"],
  "Scatter Plot Matrix": ["none"],
  "Clustered Boxplot": ["none"],
  "1-D Boxplot": ["none"],
  "Stem And Leaf Plot": ["none"],
  "3D Scatter Plot (ECharts)": ["none"],
  "Clustered 3D Bar Chart (ECharts)": ["sum", "count", "average", "none"],
  "Stacked 3D Bar Chart (ECharts)": ["sum", "count", "average", "none"],
};

// Type definitions for processed data
interface SimpleChartData {
  category: string;
  value: number;
}

interface ErrorBarChartData {
  category: string;
  value: number;
  error: number;
}

interface ScatterData {
  x: number;
  y: number;
}

interface StackedChartData {
  category: string;
  subcategory: string;
  value: number;
}

interface ThreeDData {
  x: number;
  y: number;
  z: number;
}

interface ThreeDDataEChart {
  x: number | string;
  y: number | string;
  z: number | string;
}

interface ThreeDScatterDataEChart {
  x: number | string;
  y: number | string;
  z: number; // z must be number for 3D scatter plot
}

interface DropLineData {
  category: string;
  x: string;
  y: number;
}

interface GroupedScatterData {
  category: string;
  x: number;
  y: number;
}

interface RangeChartData {
  category: string;
  low: number;
  high: number;
  close: number;
}

interface ClusteredRangeData {
  category: string;
  subcategory: string;
  low: number;
  high: number;
  close: number;
}

interface DifferenceAreaData {
  category: string;
  [key: string]: string | number; // Support flexible column names
}

interface BarLineData {
  category: string;
  barValue: number;
  lineValue: number;
}

interface DualAxesData {
  x: number;
  y1: number;
  y2: number;
}

interface Grouped3DScatterData {
  x: number;
  y: number;
  z: number;
  category: string;
}

interface HistogramData {
  value: number;
}

interface StackedHistogramData {
  value: number;
  category: string;
}

interface ClusteredErrorBarData {
  category: string;
  subcategory: string;
  value: number;
  error: number;
}

interface ScatterMatrixData {
  [key: string]: number;
}

interface ClusteredBoxplotData {
  category: string;
  subcategory: string;
  value: number;
}

interface OneDBoxplotData {
  value: number;
}

// Add type definitions for error bar options
export type CIErrorBarOptions = {
  type: "ci";
  confidenceLevel: number;
};

export type SEErrorBarOptions = {
  type: "se";
  multiplier: number;
};

export type SDErrorBarOptions = {
  type: "sd";
  multiplier: number;
};

export type ErrorBarOptions =
  | CIErrorBarOptions
  | SEErrorBarOptions
  | SDErrorBarOptions;

export class DataProcessingService {
  /**
   * Process raw data menjadi struktur yang dibutuhkan chart
   * Return: {data: processed data array, axisInfo: axis information}
   */
  static processDataForChart(input: DataProcessingInput): DataProcessingOutput {
    const {
      chartType,
      rawData,
      variables,
      chartVariables,
      processingOptions = {},
    } = input;

    console.log("🔍 DataProcessingService - Input received:", {
      chartType,
      rawDataLength: rawData?.length,
      variablesLength: variables?.length,
      chartVariables,
      processingOptions,
    });

    // Validate basic input
    if (!rawData || rawData.length === 0) {
      console.warn("⚠️ No raw data provided");
      return { data: [], axisInfo: {} };
    }

    if (!variables || variables.length === 0) {
      console.warn("⚠️ No variables defined");
      return { data: [], axisInfo: {} };
    }

    // Validate and set default aggregation
    const {
      aggregation = "none",
      filterEmpty = true,
      sortBy,
      sortOrder = "asc",
      limit,
    } = processingOptions;

    // Validate aggregation support
    this.validateAggregationSupport(chartType, aggregation);

    try {
      // Map variable names ke indices
      const variableIndices = this.mapVariableIndices(
        variables,
        chartVariables
      );
      console.log("📊 Variable indices mapped:", variableIndices);

      let processedData: any[] = [];

      // Process berdasarkan chart type
      switch (chartType) {
        case "Vertical Bar Chart":
        case "Horizontal Bar Chart":
        case "Line Chart":
        case "Area Chart":
        case "Pie Chart":
        case "Summary Point Plot":
        case "Violin Plot":
        case "Dot Plot":
        case "Boxplot":
          processedData = this.processSimpleChartData(
            rawData,
            variableIndices,
            { aggregation, filterEmpty },
            chartType
          );
          break;

        case "Error Bar Chart":
          processedData = this.processErrorBarChartData(
            rawData,
            variableIndices,
            processingOptions
          );
          break;

        case "Scatter Plot":
        case "Scatter Plot With Fit Line":
        case "Scatter Plot With Multiple Fit Line":
          processedData = this.processScatterData(rawData, variableIndices, {
            filterEmpty,
          });
          break;

        case "Vertical Stacked Bar Chart":
        case "Horizontal Stacked Bar Chart":
        case "Clustered Bar Chart":
        case "Multiple Line Chart":
        case "Stacked Area Chart":
        case "Population Pyramid":
          processedData = this.processStackedChartData(
            rawData,
            variableIndices,
            { aggregation, filterEmpty }
          );
          break;

        case "3D Bar Chart":
        case "3D Bar Chart2":
        case "3D Scatter Plot":
        case "Stacked 3D Bar Chart":
          processedData = this.process3DChartData(rawData, variableIndices, {
            aggregation,
            filterEmpty,
          });
          break;

        case "Grouped Scatter Plot":
        case "Drop Line Chart":
          processedData = this.processDropLineData(rawData, variableIndices, {
            filterEmpty,
          });
          break;

        case "Simple Range Bar":
        case "High-Low-Close Chart":
          processedData = this.processRangeChartData(rawData, variableIndices, {
            filterEmpty,
          });
          break;

        case "Clustered Range Bar":
          processedData = this.processClusteredRangeData(
            rawData,
            variableIndices,
            { filterEmpty }
          );
          break;

        case "Difference Area":
          processedData = this.processDifferenceAreaData(
            rawData,
            variableIndices,
            { filterEmpty },
            chartVariables
          );
          break;

        case "Vertical Bar & Line Chart":
          processedData = this.processBarLineData(
            rawData,
            variableIndices,
            {
              filterEmpty,
            },
            chartVariables
          );
          break;

        case "Dual Axes Scatter Plot":
          processedData = this.processDualAxesData(
            rawData,
            variableIndices,
            {
              filterEmpty,
            },
            chartVariables
          );
          break;

        case "Grouped 3D Scatter Plot":
          processedData = this.processGrouped3DScatterData(
            rawData,
            variableIndices,
            {
              aggregation,
              filterEmpty,
            }
          );
          break;
        case "Clustered 3D Bar Chart (ECharts)":
        case "Stacked 3D Bar Chart (ECharts)":
        case "Grouped 3D Scatter Plot (ECharts)":
          processedData = this.processClustered3DBarChartEchartData(
            rawData,
            variableIndices,
            {
              aggregation,
              filterEmpty,
            },
            chartVariables,
            variables
          );
          break;

        case "3D Bar Chart (ECharts)":
          processedData = this.process3DChartEchartData(
            rawData,
            variableIndices,
            {
              aggregation: "none",
              filterEmpty,
            }
          );
          break;

        case "3D Scatter Plot (ECharts)":
          processedData = this.process3DScatterEchartData(
            rawData,
            variableIndices,
            {
              filterEmpty,
            }
          );
          break;

        // case "Stacked 3D Bar Chart (ECharts)":
        //   processedData = this.processStacked3DBarChartEchartData(
        //     rawData,
        //     variableIndices,
        //     processingOptions,
        //     chartVariables
        //   );
        //   break;

        // case "Grouped 3D Scatter Plot (ECharts)":
        //   processedData = this.processGrouped3DScatterEchartData(
        //     rawData,
        //     variableIndices,
        //     processingOptions,
        //     chartVariables,
        //     variables
        //   );
        //   break;

        case "Histogram":
        case "Q-Q Plot":
        case "P-P Plot":
        case "Density Chart":
        case "Frequency Polygon":
          processedData = this.processHistogramData(rawData, variableIndices, {
            aggregation,
            filterEmpty,
          });
          break;

        case "Stacked Histogram":
          processedData = this.processStackedHistogramData(
            rawData,
            variableIndices,
            { aggregation, filterEmpty }
          );
          break;

        case "Clustered Error Bar Chart":
          processedData = this.processClusteredErrorBarData(
            rawData,
            variableIndices,
            processingOptions
          );
          break;

        case "Scatter Plot Matrix":
          processedData = this.processScatterMatrixData(
            rawData,
            variableIndices,
            { filterEmpty },
            variables
          );
          break;

        case "Clustered Boxplot":
          processedData = this.processClusteredBoxplotData(
            rawData,
            variableIndices,
            { filterEmpty }
          );
          break;

        case "1-D Boxplot":
          processedData = this.process1DBoxplotData(rawData, variableIndices, {
            filterEmpty,
          });
          break;

        case "Stem And Leaf Plot":
          processedData = this.processStemAndLeafData(
            rawData,
            variableIndices,
            { filterEmpty }
          );
          break;

        default:
          console.warn(`⚠️ Unsupported chart type: ${chartType}`);
          return { data: [], axisInfo: {} };
      }

      // Apply sorting jika diminta
      if (sortBy && processedData.length > 0) {
        processedData = this.applySorting(processedData, sortBy, sortOrder);
      }

      // Apply limit jika diminta
      if (limit && limit > 0) {
        processedData = processedData.slice(0, limit);
      }

      // Generate axisInfo based on chart type and variables
      const axisInfo = this.generateAxisInfo(
        chartType,
        chartVariables,
        variables
      );

      console.log("✅ Data processing completed:", {
        data: processedData,
        originalLength: rawData.length,
        processedLength: processedData.length,
        sampleData: processedData.slice(0, 3),
        axisInfo,
      });

      return { data: processedData, axisInfo };
    } catch (error) {
      console.error("❌ Error processing data:", error);
      return { data: [], axisInfo: {} };
    }
  }

  /**
   * Generate axisInfo based on chart type and variables
   */
  static generateAxisInfo(
    chartType: string,
    chartVariables: any,
    variables?: Array<{ name: string; type?: string }>
  ): Record<string, string> {
    const getVariableName = (varArray: string[], index: number = 0): string => {
      return varArray && varArray[index] ? varArray[index] : "";
    };

    switch (chartType) {
      case "Vertical Bar Chart":
      case "Horizontal Bar Chart":
      case "Line Chart":
      case "Area Chart":
      case "Pie Chart":
      case "Error Bar Chart":
      case "Frequency Polygon":
      case "Summary Point Plot":
      case "Violin Plot":
      case "Dot Plot":
        return {
          category: getVariableName(chartVariables.x, 0),
          value: getVariableName(chartVariables.y, 0),
        };

      case "Scatter Plot":
      case "Scatter Plot With Fit Line":
      case "Scatter Plot With Multiple Fit Line":
        return {
          x: getVariableName(chartVariables.x, 0),
          y: getVariableName(chartVariables.y, 0),
        };

      case "Vertical Stacked Bar Chart":
      case "Horizontal Stacked Bar Chart":
      case "Clustered Bar Chart":
      case "Multiple Line Chart":
      case "Stacked Area Chart":
      case "Population Pyramid":
        return {
          category: getVariableName(chartVariables.x, 0),
          subcategory: getVariableName(chartVariables.groupBy, 0),
          value: getVariableName(chartVariables.y, 0),
        };

      case "3D Bar Chart":
      case "3D Bar Chart2":
      case "3D Bar Chart (ECharts)":
      case "3D Scatter Plot":
      case "3D Scatter Plot (ECharts)":
      case "Clustered 3D Bar Chart":
      case "Stacked 3D Bar Chart":
      case "Clustered 3D Bar Chart (ECharts)":
      case "Stacked 3D Bar Chart (ECharts)":
        return {
          x: getVariableName(chartVariables.x, 0),
          y: getVariableName(chartVariables.y, 0),
          z: getVariableName(chartVariables.z, 0),
        };

      case "Grouped Scatter Plot":
      case "Drop Line Chart":
        return {
          x: getVariableName(chartVariables.x, 0),
          y: getVariableName(chartVariables.y, 0),
          category: getVariableName(chartVariables.groupBy, 0),
        };

      case "Grouped 3D Scatter Plot":
      case "Grouped 3D Scatter Plot (ECharts)":
        return {
          x: getVariableName(chartVariables.x, 0),
          y: getVariableName(chartVariables.y, 0),
          z: getVariableName(chartVariables.z, 0),
          category: getVariableName(chartVariables.groupBy, 0),
        };

      case "Simple Range Bar":
      case "High-Low-Close Chart":
        return {
          category: getVariableName(chartVariables.x, 0),
          low: getVariableName(chartVariables.low, 0),
          high: getVariableName(chartVariables.high, 0),
          close: getVariableName(chartVariables.close, 0),
        };

      case "Clustered Range Bar":
        return {
          category: getVariableName(chartVariables.x, 0),
          subcategory: getVariableName(chartVariables.groupBy, 0),
          low: getVariableName(chartVariables.low, 0),
          high: getVariableName(chartVariables.high, 0),
          close: getVariableName(chartVariables.close, 0),
        };

      case "Difference Area":
        return {
          category: getVariableName(chartVariables.x, 0),
          value0: getVariableName(chartVariables.low, 0),
          value1: getVariableName(chartVariables.high, 0),
        };

      case "Vertical Bar & Line Chart":
        return {
          category: getVariableName(chartVariables.x, 0),
          barValue: getVariableName(chartVariables.y, 0),
          lineValue: getVariableName(chartVariables.y2, 0),
        };

      case "Dual Axes Scatter Plot":
        return {
          x: getVariableName(chartVariables.x, 0),
          y1: getVariableName(chartVariables.y, 0),
          y2: getVariableName(chartVariables.y2, 0),
        };

      case "Histogram":
      case "Density Chart":
      case "Frequency Polygon":
        return {
          value: getVariableName(chartVariables.y, 0),
        };

      case "Stacked Histogram":
        return {
          value: getVariableName(chartVariables.y, 0),
          category: getVariableName(chartVariables.groupBy, 0),
        };

      case "Error Bar Chart":
        return {
          category: getVariableName(chartVariables.x, 0),
          value: getVariableName(chartVariables.y, 0),
          error: `Error of ${getVariableName(chartVariables.y, 0)}`,
        };

      case "Clustered Error Bar Chart":
        return {
          category: getVariableName(chartVariables.x, 0),
          subcategory: getVariableName(chartVariables.groupBy, 0),
          value: getVariableName(chartVariables.y, 0),
          error: `Error of ${getVariableName(chartVariables.y, 0)}`,
        };

      case "Scatter Plot Matrix":
        return {
          variables: chartVariables.y?.join(", "),
        };

      case "Clustered Boxplot":
        return {
          category: getVariableName(chartVariables.x, 0),
          subcategory: getVariableName(chartVariables.groupBy, 0),
          value: getVariableName(chartVariables.y, 0),
        };

      case "1-D Boxplot":
      case "Boxplot":
        return {
          value: getVariableName(chartVariables.y, 0),
        };

      case "Stem And Leaf Plot":
        return {
          value: getVariableName(chartVariables.y, 0),
        };

      default:
        return { undefined: "undefined" };
    }
  }

  // Helper methods
  private static mapVariableIndices(variables: any[], chartVariables: any) {
    const indices: any = {};

    if (chartVariables.x) {
      indices.x = chartVariables.x.map((v: string) =>
        variables.findIndex((varObj) => varObj.name === v)
      );
      indices.xVariableName = chartVariables.x[0];
    }

    if (chartVariables.y) {
      indices.y = chartVariables.y.map((v: string) =>
        variables.findIndex((varObj) => varObj.name === v)
      );
      indices.yVariableNames = chartVariables.y;
    }

    if (chartVariables.z) {
      indices.z = chartVariables.z.map((v: string) =>
        variables.findIndex((varObj) => varObj.name === v)
      );
    }

    if (chartVariables.groupBy) {
      indices.groupBy = chartVariables.groupBy.map((v: string) =>
        variables.findIndex((varObj) => varObj.name === v)
      );
    }

    if (chartVariables.low) {
      indices.low = chartVariables.low.map((v: string) =>
        variables.findIndex((varObj) => varObj.name === v)
      );
    }

    if (chartVariables.high) {
      indices.high = chartVariables.high.map((v: string) =>
        variables.findIndex((varObj) => varObj.name === v)
      );
    }

    if (chartVariables.close) {
      indices.close = chartVariables.close.map((v: string) =>
        variables.findIndex((varObj) => varObj.name === v)
      );
    }

    if (chartVariables.y2) {
      indices.y2 = chartVariables.y2.map((v: string) =>
        variables.findIndex((varObj) => varObj.name === v)
      );
    }

    // Validate indices
    Object.entries(indices).forEach(([key, value]) => {
      if (Array.isArray(value) && value.includes(-1)) {
        const missingVars = chartVariables[key]?.filter(
          (v: string, i: number) => value[i] === -1
        );
        throw new Error(
          `Variable ${key} (${missingVars?.join(
            ", "
          )}) tidak ditemukan dalam dataset`
        );
      }
    });

    return indices;
  }

  // Helper method to apply sorting
  private static applySorting<T extends Record<string, any>>(
    data: T[],
    sortBy?: string,
    sortOrder: "asc" | "desc" = "asc"
  ): T[] {
    console.log("🔍 applySorting called with:", {
      sortBy,
      sortOrder,
      dataLength: data.length,
    });

    if (!sortBy || data.length === 0) {
      console.log(
        "⚠️ No sorting applied - sortBy:",
        sortBy,
        "dataLength:",
        data.length
      );
      return data;
    }

    // Check if sortBy field exists in data
    if (data.length > 0 && !(sortBy in data[0])) {
      console.warn(
        "⚠️ sortBy field not found:",
        sortBy,
        "available fields:",
        Object.keys(data[0])
      );
      return data;
    }

    // Test with sample data to verify sorting works
    if (data.length > 0) {
      console.log("🔍 Sample data before sorting:", data.slice(0, 3));
      console.log("🔍 Available fields:", Object.keys(data[0]));
    }

    const result = [...data].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      // Handle different data types
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === "asc" ? comparison : -comparison;
      }

      // Handle mixed types or undefined values
      const aStr = String(aValue || "");
      const bStr = String(bValue || "");
      const comparison = aStr.localeCompare(bStr);
      return sortOrder === "asc" ? comparison : -comparison;
    });

    console.log("✅ Sorting completed. First few items:", result.slice(0, 3));
    return result;
  }

  private static processSimpleChartData(
    rawData: any[][],
    indices: any,
    options: any,
    chartType?: string
  ): SimpleChartData[] {
    const {
      aggregation = "none",
      filterEmpty = true,
      sortBy,
      sortOrder = "asc",
    } = options;
    console.log("DI service clustered bar");
    console.log("rawData", rawData);
    console.log("indices", indices);
    console.log("options", options);

    // Get allowed aggregations for this chart type
    const allowedAggregations = chartType
      ? CHART_AGGREGATION_CONFIG[chartType]
      : ["sum", "count", "average", "none"];

    // If chart only supports "none", force it regardless of input
    if (allowedAggregations.length === 1 && allowedAggregations[0] === "none") {
      const result = this.processRawData(rawData, indices, filterEmpty);
      return this.applySorting(result, sortBy, sortOrder);
    }

    // If aggregation is not allowed, use first allowed option
    const effectiveAggregation = allowedAggregations.includes(aggregation)
      ? aggregation
      : allowedAggregations[0];

    // Handle "none" aggregation - return data as-is without grouping
    if (effectiveAggregation === "none") {
      const result = this.processRawData(rawData, indices, filterEmpty);
      return this.applySorting(result, sortBy, sortOrder);
    }

    const frequencyMap: {
      [key: string]: number | { sum: number; count: number };
    } = rawData.reduce((acc, row) => {
      const xKey = row[indices.x[0]];
      const yValue = parseFloat(row[indices.y[0]]);

      if (filterEmpty && (xKey === null || xKey === undefined || xKey === "")) {
        return acc;
      }

      if (!isNaN(yValue)) {
        const categoryKey = String(xKey); // Convert to string
        if (effectiveAggregation === "sum") {
          acc[categoryKey] = ((acc[categoryKey] as number) || 0) + yValue;
        } else if (effectiveAggregation === "count") {
          acc[categoryKey] = ((acc[categoryKey] as number) || 0) + 1;
        } else if (effectiveAggregation === "average") {
          if (!acc[categoryKey]) acc[categoryKey] = { sum: 0, count: 0 };
          (acc[categoryKey] as { sum: number; count: number }).sum += yValue;
          (acc[categoryKey] as { sum: number; count: number }).count += 1;
        }
      }

      return acc;
    }, {} as { [key: string]: number | { sum: number; count: number } });

    // Convert to array format
    const result = Object.keys(frequencyMap).map((key) => {
      const value =
        effectiveAggregation === "average"
          ? (frequencyMap[key] as { sum: number; count: number }).sum /
            (frequencyMap[key] as { sum: number; count: number }).count
          : (frequencyMap[key] as number);

      return {
        category: String(key), // Convert to string
        value: value,
      };
    });

    // Apply sorting
    return this.applySorting(result, sortBy, sortOrder);
  }

  private static processRawData(
    rawData: any[][],
    indices: any,
    filterEmpty: boolean
  ): SimpleChartData[] {
    return rawData
      .map((row) => {
        const xKey = row[indices.x[0]];
        const yValue = parseFloat(row[indices.y[0]]);

        if (
          filterEmpty &&
          (xKey === null || xKey === undefined || xKey === "" || isNaN(yValue))
        ) {
          return null;
        }

        return {
          category: String(xKey), // Convert to string
          value: yValue,
        };
      })
      .filter((item): item is SimpleChartData => item !== null);
  }

  private static processErrorBarChartData(
    rawData: any[][],
    indices: any,
    options: any
  ): ErrorBarChartData[] {
    const {
      aggregation = "average",
      filterEmpty = true,
      sortBy,
      sortOrder = "asc",
    } = options;

    // Get error bar options from options or use default
    const errorBarOptions = this.getValidErrorBarOptions(
      options.errorBar,
      "ci"
    );

    console.log("🔍 Options:", options);
    console.log("🔍 errorBarOptions:", errorBarOptions);

    // Validasi indices
    if (
      !indices.x ||
      !indices.y ||
      indices.x.length === 0 ||
      indices.y.length === 0
    ) {
      console.warn("Missing required indices for Error Bar Chart", indices);
      return [];
    }

    const yIndex = indices.y[0];
    const xIndex = indices.x[0];

    // Validasi indices valid
    if (xIndex === -1 || yIndex === -1) {
      console.warn("Invalid indices for Error Bar Chart", { xIndex, yIndex });
      return [];
    }

    const grouped: { [key: string]: number[] } = {};

    for (const row of rawData) {
      const category = row[xIndex];
      const value = parseFloat(row[yIndex]);

      if (
        filterEmpty &&
        (category === null || category === undefined || category === "")
      )
        continue;
      if (isNaN(value)) continue;

      const key = String(category);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(value);
    }

    const result: ErrorBarChartData[] = Object.entries(grouped).map(
      ([category, values]) => {
        const stats = this.calculateStatistics(values);
        const error = this.calculateErrorBar(stats, errorBarOptions);

        return {
          category,
          value: stats.mean,
          error,
        };
      }
    );

    return this.applySorting(result, sortBy, sortOrder);
  }

  private static processClusteredErrorBarData(
    rawData: any[][],
    indices: any,
    options: any
  ): ClusteredErrorBarData[] {
    const { filterEmpty = true } = options;

    // Get error bar options from options or use default
    const errorBarOptions = this.getValidErrorBarOptions(
      options.errorBar,
      "se"
    );

    console.log("🔍 errorBarOptions for clustered:", errorBarOptions);

    // Validasi indices
    if (
      !indices.x ||
      !indices.y ||
      !indices.groupBy ||
      indices.x.length === 0 ||
      indices.y.length === 0 ||
      indices.groupBy.length === 0
    ) {
      console.warn(
        "Missing required indices for Clustered Error Bar Chart",
        indices
      );
      return [];
    }

    const xIndex = indices.x[0];
    const yIndex = indices.y[0];
    const groupByIndex = indices.groupBy[0];

    // Validasi indices valid
    if (xIndex === -1 || yIndex === -1 || groupByIndex === -1) {
      console.warn("Invalid indices for Clustered Error Bar Chart", {
        xIndex,
        yIndex,
        groupByIndex,
      });
      return [];
    }

    const grouped: { [key: string]: { [subkey: string]: number[] } } = {};

    for (const row of rawData) {
      const category = row[xIndex];
      const subcategory = row[groupByIndex];
      const value = parseFloat(row[yIndex]);

      if (
        filterEmpty &&
        (category === null ||
          category === undefined ||
          category === "" ||
          subcategory === null ||
          subcategory === undefined ||
          subcategory === "" ||
          isNaN(value))
      )
        continue;

      const categoryKey = String(category);
      const subcategoryKey = String(subcategory);

      if (!grouped[categoryKey]) grouped[categoryKey] = {};
      if (!grouped[categoryKey][subcategoryKey])
        grouped[categoryKey][subcategoryKey] = [];
      grouped[categoryKey][subcategoryKey].push(value);
    }

    const result: ClusteredErrorBarData[] = [];

    for (const [category, subcategories] of Object.entries(grouped)) {
      for (const [subcategory, values] of Object.entries(subcategories)) {
        const stats = this.calculateStatistics(values);
        const error = this.calculateErrorBar(stats, errorBarOptions);

        result.push({
          category,
          subcategory,
          value: stats.mean,
          error,
        });
      }
    }

    return result;
  }

  private static getZScore(confidenceLevel: number): number {
    // Convert confidence level (e.g., 95) to probability (e.g., 0.95)
    const probability = confidenceLevel / 100;

    // Get z-score using probit function
    // probit gives one-tailed z-score, so we add (1 + p)/2 to get two-tailed
    return probit((1 + probability) / 2);
  }

  private static processScatterData(
    rawData: any[][],
    indices: any,
    options: any
  ): ScatterData[] {
    const { filterEmpty = true, sortBy, sortOrder = "asc" } = options;

    const result = rawData
      .map((row) => {
        const xValue = parseFloat(row[indices.x[0]]);
        const yValue = parseFloat(row[indices.y[0]]);

        if (filterEmpty && (isNaN(xValue) || isNaN(yValue))) {
          return null;
        }

        return {
          x: xValue,
          y: yValue,
        };
      })
      .filter((item): item is ScatterData => item !== null);

    // Apply sorting
    return this.applySorting(result, sortBy, sortOrder);
  }

  private static processStackedChartData(
    rawData: any[][],
    indices: any,
    options: any
  ): StackedChartData[] {
    const {
      aggregation = "sum",
      filterEmpty = true,
      sortBy,
      sortOrder = "asc",
    } = options;

    const frequencyMap: {
      [key: string]: Array<{ subcategory: string; value: number }>;
    } = rawData.reduce((acc, row) => {
      const xKey = row[indices.x[0]];
      if (filterEmpty && (xKey === null || xKey === undefined || xKey === ""))
        return acc;

      indices.y.forEach((yIndex: number, i: number) => {
        const yValue = parseFloat(row[yIndex]);
        if (!isNaN(yValue)) {
          const categoryKey = String(xKey); // Convert to string
          if (!acc[categoryKey]) acc[categoryKey] = [];
          acc[categoryKey].push({
            subcategory: indices.yVariableNames[i],
            value: yValue,
          });
        }
      });
      return acc;
    }, {} as { [key: string]: Array<{ subcategory: string; value: number }> });

    // Output persis seperti DefaultChartPrep.js
    const result = Object.keys(frequencyMap)
      .map((key) =>
        frequencyMap[key].map((entry) => ({
          category: String(key), // Convert to string
          subcategory: entry.subcategory,
          value: entry.value,
        }))
      )
      .flat();

    // Apply sorting
    return this.applySorting(result, sortBy, sortOrder);
  }

  private static process3DChartData(
    rawData: any[][],
    indices: any,
    options: any
  ): ThreeDData[] {
    const {
      aggregation = "sum",
      filterEmpty = true,
      sortBy,
      sortOrder = "asc",
    } = options;

    const reducedData: { [key: string]: ThreeDData } = rawData.reduce(
      (acc, row) => {
        const x = parseFloat(row[indices.x[0]]);
        const y = parseFloat(row[indices.y[0]]);
        const z = parseFloat(row[indices.z[0]]);

        if (filterEmpty && (isNaN(x) || isNaN(y) || isNaN(z))) {
          return acc;
        }

        // Create unique key based on x and z combination
        const key = `${x}-${z}`;

        if (!acc[key]) {
          acc[key] = { x, z, y: 0 };
        }

        acc[key].y += y;

        return acc;
      },
      {} as { [key: string]: ThreeDData }
    );

    const result = Object.values(reducedData);

    // Apply sorting
    return this.applySorting(result, sortBy, sortOrder);
  }

  private static process3DChartEchartData(
    rawData: any[][],
    indices: any,
    options: any
  ): { x: string | number; y: string | number; z: string | number }[] {
    const {
      aggregation = "sum",
      filterEmpty = true,
      sortBy,
      sortOrder = "asc",
    } = options;

    const parseFlexible = (value: any): string | number => {
      const num = parseFloat(value);
      return isNaN(num) ? String(value) : num;
    };

    const parseToNumber = (val: any): number | null => {
      const num = parseFloat(val);
      return isNaN(num) ? null : num;
    };

    if (aggregation === "none") {
      const minLength = Math.min(
        rawData.length,
        ...[indices.x[0], indices.y[0], indices.z[0]].map(
          (colIdx) =>
            rawData.map((r) => r[colIdx]).filter((v) => v !== undefined).length
        )
      );

      const result: {
        x: string | number;
        y: string | number;
        z: string | number;
      }[] = [];

      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        const xRaw = row[indices.x[0]];
        const yRaw = row[indices.y[0]];
        const zRaw = row[indices.z[0]];

        if (
          filterEmpty &&
          (xRaw == null ||
            yRaw == null ||
            zRaw == null ||
            xRaw === "" ||
            yRaw === "" ||
            zRaw === "")
        ) {
          continue;
        }

        result.push({
          x: parseFlexible(xRaw),
          y: parseFlexible(yRaw),
          z: parseFlexible(zRaw),
        });
      }

      return this.applySorting(result, sortBy, sortOrder);
    }

    // Aggregated mode (z must be numeric)
    const reducedData: {
      [key: string]: { x: string | number; y: string | number; z: number };
    } = rawData.reduce((acc, row) => {
      const xRaw = row[indices.x[0]];
      const yRaw = row[indices.y[0]];
      const zRaw = row[indices.z[0]];

      if (filterEmpty && (xRaw == null || yRaw == null || zRaw == null)) {
        return acc;
      }

      const xParsed = parseFlexible(xRaw);
      const yParsed = parseFlexible(yRaw);
      const zParsed = parseToNumber(zRaw);
      if (zParsed == null) return acc;

      const key = `${xRaw}-${yRaw}`;
      if (!acc[key]) {
        acc[key] = { x: xParsed, y: yParsed, z: 0 };
      }

      acc[key].z += zParsed;
      return acc;
    }, {} as { [key: string]: { x: string | number; y: string | number; z: number } });

    const result = Object.values(reducedData);
    return this.applySorting(result, sortBy, sortOrder);
  }

  private static process3DScatterEchartData(
    rawData: any[][],
    indices: any,
    options: any
  ): { x: string | number; y: string | number; z: number | string }[] {
    const { filterEmpty = true, sortBy, sortOrder = "asc" } = options;

    const parseFlexible = (val: any): string | number => {
      const num = parseFloat(val);
      return isNaN(num) ? String(val) : num;
    };

    const result: {
      x: string | number;
      y: string | number;
      z: number | string;
    }[] = [];

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const xRaw = row[indices.x[0]];
      const yRaw = row[indices.y[0]];
      const zRaw = row[indices.z[0]];

      if (
        filterEmpty &&
        (xRaw === undefined ||
          xRaw === null ||
          xRaw === "" ||
          yRaw === undefined ||
          yRaw === null ||
          yRaw === "" ||
          zRaw === undefined ||
          zRaw === null ||
          zRaw === "")
      ) {
        continue; // skip baris tidak valid
      }

      result.push({
        x: parseFlexible(xRaw),
        y: parseFlexible(yRaw),
        z: parseFlexible(zRaw),
      });
    }

    return this.applySorting(result, sortBy, sortOrder);
  }

  private static processGroupedScatterData(
    rawData: any[][],
    indices: any,
    options: any
  ): GroupedScatterData[] {
    const { filterEmpty = true, sortBy, sortOrder = "asc" } = options;

    const result = rawData
      .map((row) => {
        const group = row[indices.groupBy[0]];
        const xValue = parseFloat(row[indices.x[0]]);
        const yValue = parseFloat(row[indices.y[0]]);

        if (filterEmpty && (isNaN(xValue) || isNaN(yValue))) {
          return null;
        }

        return {
          category: String(group), // Convert to string
          x: xValue,
          y: yValue,
        };
      })
      .filter((item): item is GroupedScatterData => item !== null);

    // Apply sorting
    return this.applySorting(result, sortBy, sortOrder);
  }

  private static processDropLineData(
    rawData: any[][],
    indices: any,
    options: any
  ): DropLineData[] {
    const { filterEmpty = true, sortBy, sortOrder = "asc" } = options;

    const result = rawData
      .map((row) => {
        const group = row[indices.groupBy[0]];
        const xValue = row[indices.x[0]];
        const yValue = parseFloat(row[indices.y[0]]);

        if (filterEmpty && (isNull(xValue) || isNaN(yValue))) {
          return null;
        }

        return {
          category: String(group), // Convert to string
          x: String(xValue),
          y: yValue,
        };
      })
      .filter((item): item is DropLineData => item !== null);

    // Apply sorting
    return this.applySorting(result, sortBy, sortOrder);
  }

  private static processRangeChartData(
    rawData: any[][],
    indices: any,
    options: any
  ): RangeChartData[] {
    const { filterEmpty = true, sortBy, sortOrder = "asc" } = options;

    const result = rawData
      .map((row) => {
        const category = row[indices.x[0]];
        const lowValue = parseFloat(row[indices.low[0]]);
        const highValue = parseFloat(row[indices.high[0]]);
        const closeValue = parseFloat(row[indices.close[0]]);

        if (
          filterEmpty &&
          (isNaN(lowValue) || isNaN(highValue) || isNaN(closeValue))
        ) {
          return null;
        }

        return {
          category: String(category), // Convert to string
          low: lowValue,
          high: highValue,
          close: closeValue,
        };
      })
      .filter((item): item is RangeChartData => item !== null);

    // Apply sorting
    return this.applySorting(result, sortBy, sortOrder);
  }

  private static processClusteredRangeData(
    rawData: any[][],
    indices: any,
    options: any
  ): ClusteredRangeData[] {
    const { filterEmpty = true } = options;

    return rawData
      .map((row) => {
        const category = row[indices.x[0]];
        const subcategory = row[indices.groupBy[0]];
        const lowValue = parseFloat(row[indices.low[0]]);
        const highValue = parseFloat(row[indices.high[0]]);
        const closeValue = parseFloat(row[indices.close[0]]);

        if (
          filterEmpty &&
          (isNaN(lowValue) || isNaN(highValue) || isNaN(closeValue))
        ) {
          return null;
        }

        return {
          category: String(category), // Convert to string
          subcategory: String(subcategory), // Convert to string
          low: lowValue,
          high: highValue,
          close: closeValue,
        };
      })
      .filter((item): item is ClusteredRangeData => item !== null);
  }

  private static processDifferenceAreaData(
    rawData: any[][],
    indices: any,
    options: any,
    chartVariables?: any
  ): DifferenceAreaData[] {
    const { filterEmpty = true } = options;

    // Get actual variable names from chartVariables
    const lowKeyName = chartVariables?.low?.[0] || "value0";
    const highKeyName = chartVariables?.high?.[0] || "value1";

    return rawData
      .map((row) => {
        const category = row[indices.x[0]];
        const lowValue = parseFloat(row[indices.low[0]]);
        const highValue = parseFloat(row[indices.high[0]]);

        if (filterEmpty && (isNaN(lowValue) || isNaN(highValue))) {
          return null;
        }

        // Return flexible structure with dynamic keys
        const result: DifferenceAreaData = {
          category: String(category), // Convert to string
        };
        result[lowKeyName] = lowValue;
        result[highKeyName] = highValue;

        return result;
      })
      .filter((item): item is DifferenceAreaData => item !== null);
  }

  private static processBarLineData(
    rawData: any[][],
    indices: any,
    options: any,
    chartVariables?: any
  ): any[] {
    const { filterEmpty = true } = options;
    // Use chartVariables for dynamic key naming
    const categoryKey = chartVariables?.x?.[0] || "category";
    const barKey = chartVariables?.y?.[0] || "barValue";
    const lineKey = chartVariables?.y2?.[0] || "lineValue";

    const frequencyMap: {
      [key: string]: { [key: string]: any };
    } = rawData.reduce((acc, row) => {
      const category = row[indices.x[0]];
      const barValue = parseFloat(row[indices.y[0]]);
      const lineValue = parseFloat(row[indices.y2[0]]);

      if (
        filterEmpty &&
        (category === null || category === undefined || category === "")
      ) {
        return acc;
      }

      if (!isNaN(barValue) && !isNaN(lineValue)) {
        const categoryKeyStr = String(category);
        acc[categoryKeyStr] = {
          [categoryKey]: categoryKeyStr,
          [barKey]: barValue,
          [lineKey]: lineValue,
        };
      }
      return acc;
    }, {} as { [key: string]: { [key: string]: any } });

    return Object.values(frequencyMap);
  }

  private static processDualAxesData(
    rawData: any[][],
    indices: any,
    options: any,
    chartVariables?: any
  ): any[] {
    const { filterEmpty = true } = options;
    // Use chartVariables for dynamic key naming
    const xKey = chartVariables?.x?.[0] || "x";
    const y1Key = chartVariables?.y?.[0] || "y1";
    const y2Key = chartVariables?.y2?.[0] || "y2";

    return rawData
      .map((row) => {
        const xValue = parseFloat(row[indices.x[0]]);
        const y1Value = parseFloat(row[indices.y[0]]);
        const y2Value = parseFloat(row[indices.y2[0]]);

        if (
          filterEmpty &&
          (isNaN(xValue) || isNaN(y1Value) || isNaN(y2Value))
        ) {
          return null;
        }
        return {
          [xKey]: xValue,
          [y1Key]: y1Value,
          [y2Key]: y2Value,
        };
      })
      .filter((item) => item !== null);
  }

  private static processGrouped3DScatterData(
    rawData: any[][],
    indices: any,
    options: any
  ): Grouped3DScatterData[] {
    const { filterEmpty = true } = options;

    return rawData
      .map((row) => {
        const x = parseFloat(row[indices.x[0]]);
        const y = parseFloat(row[indices.y[0]]);
        const z = parseFloat(row[indices.z[0]]);
        const category = row[indices.groupBy[0]];

        if (filterEmpty && (isNaN(x) || isNaN(y) || isNaN(z))) {
          return null;
        }

        return {
          x,
          y,
          z,
          category: String(category), // Convert to string
        };
      })
      .filter((item): item is Grouped3DScatterData => item !== null);
  }

  private static processHistogramData(
    rawData: any[][],
    indices: any,
    options: any
  ): number[] {
    const { filterEmpty = true } = options;

    return rawData
      .map((row) => {
        const value = parseFloat(row[indices.y[0]]);

        if (filterEmpty && isNaN(value)) {
          return null;
        }

        return value;
      })
      .filter((item): item is number => item !== null);
  }

  private static processStackedHistogramData(
    rawData: any[][],
    indices: any,
    options: any
  ): StackedHistogramData[] {
    const { filterEmpty = true } = options;

    // If no groupBy variable is provided, use a default category
    const hasGroupBy = indices.groupBy && indices.groupBy.length > 0;

    return rawData
      .map((row) => {
        const value = parseFloat(row[indices.x[0]]);
        const category = hasGroupBy ? row[indices.groupBy[0]] : "Default";

        if (filterEmpty && isNaN(value)) {
          return null;
        }

        return {
          value: value,
          category: String(category),
        };
      })
      .filter((item): item is StackedHistogramData => item !== null);
  }

  private static processScatterMatrixData(
    rawData: any[][],
    indices: any,
    options: any,
    variables: Array<{ name: string }>
  ): ScatterMatrixData[] {
    const { filterEmpty = true } = options;

    // Return empty array if no variables are selected
    if (!indices.x || indices.x.length === 0) {
      return [];
    }

    return rawData
      .map((row) => {
        const entry: ScatterMatrixData = {};

        indices.x.forEach((xIndex: number, i: number) => {
          const value = parseFloat(row[xIndex]);
          if (!isNaN(value)) {
            entry[variables[xIndex].name] = value;
          }
        });

        // Only return if all variables have valid values
        return Object.keys(entry).length === indices.x.length ? entry : null;
      })
      .filter((item): item is ScatterMatrixData => item !== null);
  }

  private static processClusteredBoxplotData(
    rawData: any[][],
    indices: any,
    options: any
  ): ClusteredBoxplotData[] {
    const { filterEmpty = true } = options;

    return rawData
      .map((row) => {
        const category = row[indices.x[0]];
        const subcategory = row[indices.groupBy[0]];
        const value = parseFloat(row[indices.y[0]]);

        if (filterEmpty && isNaN(value)) {
          return null;
        }

        return {
          category: String(category),
          subcategory: String(subcategory),
          value: value,
        };
      })
      .filter((item): item is ClusteredBoxplotData => item !== null);
  }

  private static process1DBoxplotData(
    rawData: any[][],
    indices: any,
    options: any
  ): OneDBoxplotData[] {
    const { filterEmpty = true } = options;

    return rawData
      .map((row) => {
        const value = parseFloat(row[indices.y[0]]);

        if (filterEmpty && isNaN(value)) {
          return null;
        }

        return { value: value };
      })
      .filter((item): item is OneDBoxplotData => item !== null);
  }

  private static processStemAndLeafData(
    rawData: any[][],
    indices: any,
    options: any
  ): Array<{ stem: string; leaves: number[] }> {
    const { filterEmpty = true } = options;

    // Ambil semua nilai valid
    const values = rawData
      .map((row) => parseFloat(row[indices.y[0]]))
      .filter((v) => !isNaN(v));

    // Kelompokkan ke stem-leaf
    const stemMap: { [stem: string]: number[] } = {};
    values.forEach((val) => {
      const stem = Math.floor(val / 10).toString();
      const leaf = Math.floor(val % 10);
      if (!stemMap[stem]) stemMap[stem] = [];
      stemMap[stem].push(leaf);
    });

    // Konversi ke array of object dan urutkan leaves
    return Object.keys(stemMap).map((stem) => ({
      stem,
      leaves: stemMap[stem].sort((a, b) => a - b),
    }));
  }

  private static validateAggregationSupport(
    chartType: string,
    aggregation?: string
  ) {
    if (!aggregation) return; // No aggregation specified, use default

    const allowedAggregations = CHART_AGGREGATION_CONFIG[chartType];
    if (!allowedAggregations) {
      console.warn(
        `No aggregation configuration found for chart type: ${chartType}`
      );
      return;
    }

    if (!allowedAggregations.includes(aggregation)) {
      throw new Error(
        `Aggregation "${aggregation}" is not supported for chart type "${chartType}". ` +
          `Supported aggregations: ${allowedAggregations.join(", ")}`
      );
    }
  }

  private static getDefaultErrorBarOptions(
    type: "ci" | "se" | "sd"
  ): ErrorBarOptions {
    switch (type) {
      case "ci":
        return { type: "ci", confidenceLevel: 95 };
      case "se":
        return { type: "se", multiplier: 2 };
      case "sd":
        return { type: "sd", multiplier: 1 };
    }
  }

  /**
   * Helper function to get valid error bar options with fallback
   */
  private static getValidErrorBarOptions(
    options: any,
    defaultType: "ci" | "se" | "sd"
  ): ErrorBarOptions {
    if (!options || !options.type) {
      return this.getDefaultErrorBarOptions(defaultType);
    }

    // Ensure we have all required properties for the type
    return {
      ...this.getDefaultErrorBarOptions(options.type),
      ...options,
    } as ErrorBarOptions;
  }

  /**
   * Helper function to calculate statistics for error bars
   */
  private static calculateStatistics(values: number[]): {
    mean: number;
    variance: number;
    standardDeviation: number;
    count: number;
  } {
    const filteredValues = values.filter((v) => !isNaN(v));
    const n = filteredValues.length;

    if (n === 0) {
      return { mean: 0, variance: 0, standardDeviation: 0, count: 0 };
    }

    const meanValue = mean(filteredValues);
    const varianceValue = variance(filteredValues);
    const stdDev = standardDeviation(filteredValues);

    return {
      mean: meanValue,
      variance: varianceValue,
      standardDeviation: stdDev,
      count: n,
    };
  }

  /**
   * Helper function to calculate error bar value based on type
   */
  private static calculateErrorBar(
    stats: { mean: number; standardDeviation: number; count: number },
    errorBarOptions: ErrorBarOptions
  ): number {
    const { standardDeviation: sd, count: n } = stats;

    switch (errorBarOptions.type) {
      case "sd":
        return sd * errorBarOptions.multiplier;
      case "se":
        return (sd / Math.sqrt(n)) * errorBarOptions.multiplier;
      case "ci":
        const z = this.getZScore(errorBarOptions.confidenceLevel);
        return z * (sd / Math.sqrt(n));
      default:
        return 0;
    }
  }

  // private static processClustered3DBarChartEchartData(
  //   rawData: any[][],
  //   indices: any,
  //   options: any,
  //   chartVariables?: any
  // ): Array<{
  //   x: string | number;
  //   y: string | number;
  //   z: string | number;
  //   group: string | number;
  // }> {
  //   console.log("DI service clustered bar");
  //   console.log("rawData", rawData);
  //   console.log("indices", indices);
  //   console.log("options", options);
  //   console.log("chartVariables", chartVariables);
  //   const { aggregation = "sum", filterEmpty = true } = options;
  //   // Ambil info variabel dari chartVariables jika ada
  //   const colorVars =
  //     (chartVariables && chartVariables.color) || indices.colorVars || [];
  //   const sideVars =
  //     (chartVariables && chartVariables.y) || indices.sideVars || [];
  //   // Mode 1: color ada (group dari color, y dari satu variabel Y)
  //   if (
  //     indices.color &&
  //     indices.color.length > 0 &&
  //     indices.y &&
  //     indices.y.length === 1
  //   ) {
  //     const result: Record<
  //       string,
  //       { x: any; y: string | number; z: any; group: any }
  //     > = {};
  //     console.log("DI service clustered bar");
  //     console.log("rawData", rawData);
  //     rawData.forEach((row) => {
  //       const x = row[indices.x[0]];
  //       const yRaw = row[indices.y[0]];
  //       const y = isNaN(Number(yRaw)) ? yRaw : Number(yRaw);
  //       const z =
  //         indices.z && indices.z.length > 0 ? row[indices.z[0]] : undefined;
  //       const group = row[indices.color[0]];
  //       if (
  //         filterEmpty &&
  //         (x == null || y == null || z == null || group == null)
  //       )
  //         return;
  //       const key = `${x}|${z}|${group}`;
  //       if (!result[key]) {
  //         result[key] = { x, y: typeof y === "string" ? y : 0, z, group };
  //       }
  //       if (typeof y === "number" && typeof result[key].y === "number") {
  //         result[key].y += y;
  //       } else {
  //         result[key].y = y;
  //       }
  //     });
  //     return Object.values(result);
  //   }
  //   // Mode 2: color kosong, Y multi (group dari nama variabel Y)
  //   if (
  //     (!indices.color || indices.color.length === 0) &&
  //     indices.y &&
  //     indices.y.length > 1
  //   ) {
  //     const result: Record<
  //       string,
  //       { x: any; y: string | number; z: any; group: any }
  //     > = {};
  //     rawData.forEach((row) => {
  //       const x = row[indices.x[0]];
  //       const z =
  //         indices.z && indices.z.length > 0 ? row[indices.z[0]] : undefined;
  //       indices.y.forEach((yIdx: number, i: number) => {
  //         const yRaw = row[yIdx];
  //         const y = isNaN(Number(yRaw)) ? yRaw : Number(yRaw);
  //         const group =
  //           chartVariables && chartVariables.y && chartVariables.y[i]
  //             ? chartVariables.y[i]
  //             : `Y${i + 1}`;
  //         if (
  //           filterEmpty &&
  //           (x == null || y == null || z == null || group == null)
  //         )
  //           return;
  //         const key = `${x}|${z}|${group}`;
  //         if (!result[key]) {
  //           result[key] = { x, y: typeof y === "string" ? y : 0, z, group };
  //         }
  //         if (typeof y === "number" && typeof result[key].y === "number") {
  //           result[key].y += y;
  //         } else {
  //           result[key].y = y;
  //         }
  //       });
  //     });
  //     return Object.values(result);
  //   }
  //   // Default fallback (mode lama, group flexible, z bisa multi)
  //   const result: Record<string, { x: any; y: number; z: any; group: any }> =
  //     {};
  //   rawData.forEach((row) => {
  //     const x = row[indices.x[0]];
  //     const y = parseFloat(row[indices.y[0]]);
  //     const z =
  //       indices.z && indices.z.length > 0 ? row[indices.z[0]] : undefined;
  //     const group =
  //       row[
  //         (indices.color && indices.color[0]) ||
  //           (indices.groupBy && indices.groupBy[0]) ||
  //           (indices.category && indices.category[0])
  //       ] ?? "";
  //     if (filterEmpty && (x == null || isNaN(y) || z == null)) return;
  //     const key = `${x}|${z}|${group}`;
  //     if (!result[key]) {
  //       result[key] = { x, y: 0, z, group };
  //     }
  //     if (typeof y === "number" && typeof result[key].y === "number") {
  //       result[key].y += y;
  //     } else {
  //       result[key].y = y;
  //     }
  //   });
  //   return Object.values(result);
  // }

  private static processClustered3DBarChartEchartData(
    rawData: any[][],
    indices: any,
    options: any,
    chartVariables?: any,
    variables?: Array<{ name: string; type?: string }>
  ): Array<{
    x: string | number;
    y: string | number;
    z: string | number;
    group: string | number;
  }> {
    const { filterEmpty = true } = options;

    const parseFlexible = (value: any): string | number => {
      const num = parseFloat(value);
      return isNaN(num) ? String(value) : num;
    };

    const result: Array<{
      x: string | number;
      y: string | number;
      z: string | number;
      group: string | number;
    }> = [];

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const x = row[indices.x[0]];
      const y = row[indices.y[0]];
      const z = row[indices.z[0]];
      const group = row[indices.groupBy[0]];

      if (
        filterEmpty &&
        (x === undefined ||
          x === null ||
          x === "" ||
          y === undefined ||
          y === null ||
          y === "" ||
          z === undefined ||
          z === null ||
          z === "" ||
          group === undefined ||
          group === null ||
          group === "")
      ) {
        continue;
      }

      result.push({
        x: parseFlexible(x),
        y: parseFlexible(y),
        z: parseFlexible(z),
        group: parseFlexible(group),
      });
    }

    return result;
  }
  private static processStacked3DBarChartEchartData(
    rawData: any[][],
    indices: any,
    options: any,
    chartVariables?: any
  ): Array<{
    x: string | number;
    y: string | number;
    z: string | number;
    group: string | number;
  }> {
    const { filterEmpty = true } = options;

    const parseFlexible = (value: any): string | number => {
      const num = parseFloat(value);
      return isNaN(num) ? String(value) : num;
    };

    const result: Array<{
      x: string | number;
      y: string | number;
      z: string | number;
      group: string | number;
    }> = [];

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const x = row[indices.x[0]];
      const y = row[indices.y[0]];
      const z = row[indices.z[0]];
      const group = row[indices.groupBy[0]];

      if (
        filterEmpty &&
        (x === undefined ||
          x === null ||
          x === "" ||
          y === undefined ||
          y === null ||
          y === "" ||
          z === undefined ||
          z === null ||
          z === "" ||
          group === undefined ||
          group === null ||
          group === "")
      ) {
        continue;
      }

      result.push({
        x: parseFlexible(x),
        y: parseFlexible(y),
        z: parseFlexible(z),
        group: parseFlexible(group),
      });
    }

    return result;
  }

  private static processGrouped3DScatterEchartData(
    rawData: any[][],
    indices: any,
    options: any,
    chartVariables?: any,
    variables?: Array<{ name: string; type?: string }>
  ): Array<{
    x: number;
    y: number;
    z: number;
    group: string;
  }> {
    const { filterEmpty = true } = options;

    function parseByType(value: any, type: string) {
      if (type === "numeric") {
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
      }
      return value;
    }

    function getTypeByName(varName: string): string {
      return variables?.find((v) => v.name === varName)?.type || "string";
    }

    const result: Array<{
      x: number;
      y: number;
      z: number;
      group: string;
    }> = [];

    const xVar = chartVariables?.x?.[0];
    const yVar = chartVariables?.y?.[0];
    const zVar = chartVariables?.z?.[0];
    const groupVar = chartVariables?.groupBy?.[0];

    const xType = getTypeByName(xVar);
    const yType = getTypeByName(yVar);
    const zType = getTypeByName(zVar);
    const groupType = getTypeByName(groupVar);

    rawData.forEach((row) => {
      const x = parseByType(row[indices.x[0]], xType);
      const y = parseByType(row[indices.y[0]], yType);
      const z =
        indices.z && indices.z.length > 0
          ? parseByType(row[indices.z[0]], zType)
          : undefined;
      const group = parseByType(row[indices.groupBy[0]], groupType);

      // Convert to numbers and filter empty
      const xNum = typeof x === "number" ? x : parseFloat(x);
      const yNum = typeof y === "number" ? y : parseFloat(y);
      const zNum = typeof z === "number" ? z : parseFloat(z);

      if (
        filterEmpty &&
        (isNaN(xNum) || isNaN(yNum) || isNaN(zNum) || !group)
      ) {
        return;
      }

      result.push({
        x: xNum,
        y: yNum,
        z: zNum,
        group: String(group),
      });
    });

    return result;
  }
}
