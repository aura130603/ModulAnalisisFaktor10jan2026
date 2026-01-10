import { DataProcessingService } from "./DataProcessingService";
import { ChartService } from "./ChartService";

/**
 * Contoh-contoh penggunaan DataProcessingService
 * Menunjukkan cara process raw data menjadi format yang dibutuhkan chart
 */

// Contoh 1: Simple Bar Chart
export function example1_SimpleBarChart() {
  const rawData = [
    ["A", 30],
    ["B", 20],
    ["C", 10],
  ];

  const variables = [
    { name: "category", type: "string" },
    { name: "value", type: "number" },
  ];

  const processedData = DataProcessingService.processDataForChart({
    chartType: "Vertical Bar Chart",
    rawData: rawData,
    variables: variables,
    chartVariables: {
      x: ["category"],
      y: ["value"],
    },
    processingOptions: {
      filterEmpty: true,
    },
  });

  console.log("Example 1 - Simple Bar Chart:");
  console.log("Raw data:", rawData);
  console.log("Processed data:", processedData);

  // Generate chart JSON
  const chartJSON = ChartService.createChartJSON({
    chartType: "Vertical Bar Chart",
    chartData: processedData.data,
    chartVariables: {
      x: ["category"],
      y: ["value"],
    },
    chartMetadata: {
      title: "Simple Bar Chart",
    },
  });

  return { processedData, chartJSON };
}

// Contoh 2: Scatter Plot
export function example2_ScatterPlot() {
  const rawData = [
    [10, 20],
    [15, 25],
    [20, 30],
    [25, 35],
  ];

  const variables = [
    { name: "x", type: "number" },
    { name: "y", type: "number" },
  ];

  const processedData = DataProcessingService.processDataForChart({
    chartType: "Scatter Plot",
    rawData: rawData,
    variables: variables,
    chartVariables: {
      x: ["x"],
      y: ["y"],
    },
  });

  console.log("Example 2 - Scatter Plot:");
  console.log("Processed data:", processedData);

  return processedData.data;
}

// Contoh 3: Stacked Bar Chart
export function example3_StackedBarChart() {
  const rawData = [
    ["A", "Group1", 30],
    ["A", "Group2", 20],
    ["A", "Group3", 10],
    ["B", "Group1", 25],
    ["B", "Group2", 15],
    ["B", "Group3", 5],
  ];

  const variables = [
    { name: "category", type: "string" },
    { name: "group", type: "string" },
    { name: "value", type: "number" },
  ];

  const processedData = DataProcessingService.processDataForChart({
    chartType: "Vertical Stacked Bar Chart",
    rawData: rawData,
    variables: variables,
    chartVariables: {
      x: ["category"],
      y: ["group"],
    },
  });

  console.log("Example 3 - Stacked Bar Chart:");
  console.log("Processed data:", processedData);

  return processedData.data;
}

// Contoh 4: 3D Chart
export function example4_3DChart() {
  const rawData = [
    [1, 2, 3],
    [2, 4, 6],
    [3, 6, 9],
  ];

  const variables = [
    { name: "x", type: "number" },
    { name: "y", type: "number" },
    { name: "z", type: "number" },
  ];

  const processedData = DataProcessingService.processDataForChart({
    chartType: "3D Scatter Plot",
    rawData: rawData,
    variables: variables,
    chartVariables: {
      x: ["x"],
      y: ["y"],
      z: ["z"],
    },
  });

  console.log("Example 4 - 3D Chart:");
  console.log("Processed data:", processedData);

  return processedData.data;
}

// Contoh 5: Range Chart
export function example5_RangeChart() {
  const rawData = [
    ["A", 10, 20, 15],
    ["B", 15, 25, 20],
    ["C", 20, 30, 25],
  ];

  const variables = [
    { name: "category", type: "string" },
    { name: "low", type: "number" },
    { name: "high", type: "number" },
    { name: "close", type: "number" },
  ];

  const processedData = DataProcessingService.processDataForChart({
    chartType: "Simple Range Bar",
    rawData: rawData,
    variables: variables,
    chartVariables: {
      x: ["category"],
      low: ["low"],
      high: ["high"],
      close: ["close"],
    },
  });

  console.log("Example 5 - Range Chart:");
  console.log("Processed data:", processedData);

  return processedData.data;
}

// Contoh 6: Grouped Scatter Plot
export function example6_GroupedScatterPlot() {
  const rawData = [
    ["Group1", 10, 20],
    ["Group1", 15, 25],
    ["Group2", 20, 30],
    ["Group2", 25, 35],
  ];

  const variables = [
    { name: "group", type: "string" },
    { name: "x", type: "number" },
    { name: "y", type: "number" },
  ];

  const processedData = DataProcessingService.processDataForChart({
    chartType: "Grouped Scatter Plot",
    rawData: rawData,
    variables: variables,
    chartVariables: {
      x: ["x"],
      y: ["y"],
      groupBy: ["group"],
    },
  });

  console.log("Example 6 - Grouped Scatter Plot:");
  console.log("Processed data:", processedData);

  return processedData.data;
}

// Contoh 7: Histogram
export function example7_Histogram() {
  const rawData = [[20], [25], [30], [35], [40]];

  const variables = [{ name: "value", type: "number" }];

  const processedData = DataProcessingService.processDataForChart({
    chartType: "Histogram",
    rawData: rawData,
    variables: variables,
    chartVariables: {
      y: ["value"],
    },
  });

  console.log("Example 7 - Histogram:");
  console.log("Processed data:", processedData);

  return processedData.data;
}

// Contoh 8: Complete Workflow
export function example8_CompleteWorkflow() {
  // Raw data dari CSV/SPSS
  const rawData = [
    ["Product A", "Q1", 100],
    ["Product A", "Q2", 150],
    ["Product B", "Q1", 80],
    ["Product B", "Q2", 120],
  ];

  const variables = [
    { name: "product", type: "string" },
    { name: "quarter", type: "string" },
    { name: "sales", type: "number" },
  ];

  // Step 1: Process data
  const processedData = DataProcessingService.processDataForChart({
    chartType: "Vertical Stacked Bar Chart",
    rawData: rawData,
    variables: variables,
    chartVariables: {
      x: ["product"],
      y: ["quarter"],
    },
    processingOptions: {
      aggregation: "sum",
      filterEmpty: true,
    },
  });

  console.log("Example 8 - Complete Workflow:");
  console.log("Raw data:", rawData);
  console.log("Processed data:", processedData);

  // Step 2: Generate chart JSON
  const chartJSON = ChartService.createChartJSON({
    chartType: "Vertical Stacked Bar Chart",
    chartData: processedData.data,
    chartVariables: {
      x: ["product"],
      y: ["quarter"],
    },
    chartMetadata: {
      title: "Product Sales by Quarter",
      subtitle: "Stacked Bar Chart",
      axisInfo: processedData.axisInfo,
    },
  });

  console.log("Chart JSON:", chartJSON);

  return { processedData, chartJSON };
}

// Export semua contoh
export const dataProcessingExamples = {
  example1_SimpleBarChart,
  example2_ScatterPlot,
  example3_StackedBarChart,
  example4_3DChart,
  example5_RangeChart,
  example6_GroupedScatterPlot,
  example7_Histogram,
  example8_CompleteWorkflow,
};
