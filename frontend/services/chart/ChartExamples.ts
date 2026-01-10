import { ChartService } from "./ChartService";

/**
 * Contoh-contoh penggunaan ChartService
 * Menunjukkan betapa mudahnya membuat chart dengan minimal konfigurasi
 */

// Contoh 1: Paling Sederhana - Hanya Data Array
export function example1_SimpleArray() {
  // Hanya butuh array angka sederhana
  const simpleData = [10, 25, 40, 35, 60, 45];

  // Langsung jadi chart JSON!
  const chartJSON = ChartService.quickChart(simpleData, "Vertical Bar Chart");

  console.log("Example 1 - Simple Array:", chartJSON);
  console.log("Structure:", JSON.stringify(chartJSON, null, 2));
  return chartJSON;
}

// Contoh 2: Data Object Sederhana
export function example2_SimpleObject() {
  const data = [
    { name: "January", sales: 1000 },
    { name: "February", sales: 1500 },
    { name: "March", sales: 1200 },
    { name: "April", sales: 1800 },
  ];

  // Auto-detect format dan buat chart
  const chartJSON = ChartService.createChartJSON({
    chartData: data,
    chartType: "Line Chart",
    chartVariables: {
      x: ["name"],
      y: ["sales"],
    },
  });

  console.log("Example 2 - Simple Object:", chartJSON);
  return chartJSON;
}

// Contoh 3: Custom Title saja
export function example3_WithCustomTitle() {
  const data = [
    { category: "Product A", value: 120 },
    { category: "Product B", value: 190 },
    { category: "Product C", value: 150 },
  ];

  const chartJSON = ChartService.createChartJSON({
    chartData: data,
    chartType: "Pie Chart",
    chartVariables: {
      x: ["category"],
      y: ["value"],
    },
    chartMetadata: {
      title: "Product Sales Distribution",
      subtitle: "Q1 2024 Results",
    },
  });

  console.log("Example 3 - With Custom Title:", chartJSON);
  return chartJSON;
}

// Contoh 4: Bikin Multiple Charts Sekaligus
export function example4_MultipleCharts() {
  const data = [
    { category: "A", value: 30 },
    { category: "B", value: 80 },
    { category: "C", value: 45 },
  ];

  // Bikin beberapa chart type dari data yang sama
  const chartTypes = [
    "Vertical Bar Chart",
    "Line Chart",
    "Pie Chart",
    "Area Chart",
  ];
  const multipleCharts = ChartService.createMultipleCharts(
    {
      chartData: data,
      chartType: "Vertical Bar Chart", // Base type (akan di-override)
      chartVariables: {
        x: ["category"],
        y: ["value"],
      },
      chartMetadata: {
        title: "Multi-Chart Example",
      },
    },
    chartTypes
  );

  console.log("Example 4 - Multiple Charts:", multipleCharts);
  return multipleCharts;
}

// Contoh 5: Chart dengan Metadata Lengkap
export function example5_DetailedMetadata() {
  const data = [
    { category: "Q1", value: 100 },
    { category: "Q2", value: 150 },
    { category: "Q3", value: 120 },
    { category: "Q4", value: 180 },
  ];

  const chartJSON = ChartService.createChartJSON({
    chartData: data,
    chartType: "Vertical Bar Chart",
    chartVariables: {
      x: ["category"],
      y: ["value"],
    },
    chartMetadata: {
      title: "Quarterly Performance",
      subtitle: "2024 Financial Results",
    },
  });

  console.log("Example 5 - Detailed Chart Metadata:");
  console.log("- Chart Type:", chartJSON.charts[0].chartType);
  console.log("- Axis Info:", chartJSON.charts[0].chartMetadata.axisInfo);
  console.log("- Config:", chartJSON.charts[0].chartConfig);

  return chartJSON;
}

// Contoh 6: Data dari API Response (format bebas)
export function example6_FromAPIResponse() {
  // Simulasi data dari API yang formatnya beragam
  const apiResponse = {
    results: [
      { region: "North", total_revenue: 50000 },
      { region: "South", total_revenue: 75000 },
      { region: "East", total_revenue: 60000 },
      { region: "West", total_revenue: 80000 },
    ],
  };

  // Extract dan format otomatis
  const chartJSON = ChartService.createChartJSON({
    chartData: apiResponse.results,
    chartType: "Horizontal Bar Chart",
    chartVariables: {
      x: ["region"],
      y: ["total_revenue"],
    },
    chartMetadata: {
      title: "Revenue by Region",
    },
  });

  console.log("Example 6 - From API Response:", chartJSON);
  return chartJSON;
}

// Contoh 7: Untuk Module/Component Lain
export function createChartForModule(
  moduleData: any[],
  chartType: string,
  title?: string
) {
  /**
   * Function ini bisa dipanggil dari module lain
   * Cukup kasih data array, chart type, dan optional title
   * Sisanya otomatis!
   */

  return ChartService.createChartJSON({
    chartData: moduleData,
    chartType,
    chartVariables: {
      x: ["category"],
      y: ["value"],
    },
    chartMetadata: {
      title: title || `${chartType} - Generated Automatically`,
    },
  });
}

// Contoh 8: Batch Processing untuk Banyak Data
export function example8_BatchProcessing() {
  const datasets = [
    {
      name: "Sales Data",
      data: [100, 150, 120, 180, 200],
      type: "Line Chart",
    },
    {
      name: "User Demographics",
      data: [
        { category: "18-25", value: 35 },
        { category: "26-35", value: 45 },
        { category: "36-45", value: 20 },
      ],
      type: "Pie Chart",
    },
  ];

  const batchResults = datasets.map((dataset) =>
    ChartService.createChartJSON({
      chartData: dataset.data,
      chartType: dataset.type,
      chartVariables: {
        x: ["category"],
        y: ["value"],
      },
      chartMetadata: {
        title: dataset.name,
      },
    })
  );

  console.log("Example 8 - Batch Processing:", batchResults);
  return batchResults;
}

// Contoh 9: Scatter Plot
export function example9_ScatterPlot() {
  const data = [
    { x: 10, y: 20 },
    { x: 15, y: 25 },
    { x: 20, y: 30 },
    { x: 25, y: 35 },
  ];

  const chartJSON = ChartService.createChartJSON({
    chartData: data,
    chartType: "Scatter Plot",
    chartVariables: {
      x: ["x"],
      y: ["y"],
    },
    chartMetadata: {
      title: "Scatter Plot Example",
    },
  });

  console.log("Example 9 - Scatter Plot:", chartJSON);
  return chartJSON;
}

// Contoh 10: 3D Chart
export function example10_3DChart() {
  const data = [
    { x: 1, y: 2, z: 3 },
    { x: 2, y: 4, z: 6 },
    { x: 3, y: 6, z: 9 },
  ];

  const chartJSON = ChartService.createChartJSON({
    chartData: data,
    chartType: "3D Scatter Plot",
    chartVariables: {
      x: ["x"],
      y: ["y"],
      z: ["z"],
    },
    chartMetadata: {
      title: "3D Scatter Plot Example",
    },
  });

  console.log("Example 10 - 3D Chart:", chartJSON);
  return chartJSON;
}

// Contoh 11: Stacked Chart
export function example11_StackedChart() {
  const data = [
    { category: "A", subcategory: "Group1", value: 30 },
    { category: "A", subcategory: "Group2", value: 20 },
    { category: "B", subcategory: "Group1", value: 25 },
    { category: "B", subcategory: "Group2", value: 15 },
  ];

  const chartJSON = ChartService.createChartJSON({
    chartData: data,
    chartType: "Vertical Stacked Bar Chart",
    chartVariables: {
      x: ["category"],
      y: ["subcategory"],
    },
    chartMetadata: {
      title: "Stacked Bar Chart Example",
    },
  });

  console.log("Example 11 - Stacked Chart:", chartJSON);
  return chartJSON;
}

// Contoh 12: Range Chart
export function example12_RangeChart() {
  const data = [
    { category: "A", low: 10, high: 20, close: 15 },
    { category: "B", low: 15, high: 25, close: 20 },
    { category: "C", low: 20, high: 30, close: 25 },
  ];

  const chartJSON = ChartService.createChartJSON({
    chartData: data,
    chartType: "Simple Range Bar",
    chartVariables: {
      x: ["category"],
      low: ["low"],
      high: ["high"],
      close: ["close"],
    },
    chartMetadata: {
      title: "Range Bar Chart Example",
    },
  });

  console.log("Example 12 - Range Chart:", chartJSON);
  return chartJSON;
}

// Contoh 13: Multi-Color Chart (Stacked Bar)
export function example13_MultiColorChart() {
  const data = [
    { category: "A", subcategory: "Group1", value: 30 },
    { category: "A", subcategory: "Group2", value: 20 },
    { category: "A", subcategory: "Group3", value: 10 },
    { category: "B", subcategory: "Group1", value: 25 },
    { category: "B", subcategory: "Group2", value: 15 },
    { category: "B", subcategory: "Group3", value: 5 },
  ];

  const chartJSON = ChartService.createChartJSON({
    chartData: data,
    chartType: "Vertical Stacked Bar Chart",
    chartVariables: {
      x: ["category"],
      y: ["Group1", "Group2", "Group3"], // 3 subcategories = 3 colors
    },
    chartMetadata: {
      title: "Multi-Color Stacked Chart",
    },
  });

  console.log("Example 13 - Multi-Color Chart:");
  console.log("Generated colors:", chartJSON.charts[0].chartConfig.chartColor);
  return chartJSON;
}

// Contoh 14: Single Color Chart
export function example14_SingleColorChart() {
  const data = [
    { category: "A", value: 30 },
    { category: "B", value: 80 },
    { category: "C", value: 45 },
  ];

  const chartJSON = ChartService.createChartJSON({
    chartData: data,
    chartType: "Vertical Bar Chart",
    chartVariables: {
      x: ["category"],
      y: ["value"],
    },
    chartMetadata: {
      title: "Single Color Chart",
    },
  });

  console.log("Example 14 - Single Color Chart:");
  console.log("Generated colors:", chartJSON.charts[0].chartConfig.chartColor);
  return chartJSON;
}

// Contoh 15: Custom Colors
export function example15_CustomColors() {
  const data = [
    { category: "A", value: 30 },
    { category: "B", value: 80 },
    { category: "C", value: 45 },
  ];

  const chartJSON = ChartService.createChartJSON({
    chartData: data,
    chartType: "Vertical Bar Chart",
    chartVariables: {
      x: ["category"],
      y: ["value"],
    },
    chartConfig: {
      chartColor: ["#ff0000", "#00ff00", "#0000ff"], // Custom colors
    },
    chartMetadata: {
      title: "Custom Colors Chart",
    },
  });

  console.log("Example 15 - Custom Colors:");
  console.log("Custom colors:", chartJSON.charts[0].chartConfig.chartColor);
  return chartJSON;
}

// Contoh 16: Population Pyramid (Special 2-color case)
export function example16_PopulationPyramid() {
  const data = [
    { age: "0-10", male: 100, female: 95 },
    { age: "11-20", male: 120, female: 125 },
    { age: "21-30", male: 150, female: 155 },
  ];

  const chartJSON = ChartService.createChartJSON({
    chartData: data,
    chartType: "Population Pyramid",
    chartVariables: {
      x: ["age"],
      y: ["male", "female"],
    },
    chartMetadata: {
      title: "Population Pyramid",
    },
  });

  console.log("Example 16 - Population Pyramid:");
  console.log("Generated colors:", chartJSON.charts[0].chartConfig.chartColor);
  return chartJSON;
}

// Export semua contoh
export const chartExamples = {
  example1_SimpleArray,
  example2_SimpleObject,
  example3_WithCustomTitle,
  example4_MultipleCharts,
  example5_DetailedMetadata,
  example6_FromAPIResponse,
  createChartForModule,
  example8_BatchProcessing,
  example9_ScatterPlot,
  example10_3DChart,
  example11_StackedChart,
  example12_RangeChart,
  example13_MultiColorChart,
  example14_SingleColorChart,
  example15_CustomColors,
  example16_PopulationPyramid,
};
