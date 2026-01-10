import { ChartService } from "./ChartService";

// Test function untuk ChartService
export function testChartService() {
  console.log("🧪 Testing ChartService...\n");

  // Test 1: Simple Array
  console.log("--- Test 1: Simple Array ---");
  const test1 = ChartService.quickChart(
    [10, 25, 40, 35, 60],
    "Vertical Bar Chart"
  );
  console.log("Input: [10, 25, 40, 35, 60]");
  console.log("Output Chart Type:", test1.charts[0].chartType);
  console.log("Output Data:", test1.charts[0].chartData);
  console.log("Full JSON:", JSON.stringify(test1, null, 2));
  console.log("\n");

  // Test 2: Object Data
  console.log("--- Test 2: Object Data ---");
  const test2Data = [
    { name: "January", sales: 1000 },
    { name: "February", sales: 1500 },
    { name: "March", sales: 1200 },
    { name: "April", sales: 1800 },
  ];

  const test2 = ChartService.createChartJSON({
    chartData: test2Data,
    chartType: "Line Chart",
    chartVariables: {
      x: ["name"],
      y: ["sales"],
    },
    chartMetadata: {
      title: "Monthly Sales Report",
      subtitle: "2024 Data",
    },
  });

  console.log("Input:", test2Data);
  console.log("Chart Metadata:", test2.charts[0].chartMetadata);
  console.log("Chart Config:", test2.charts[0].chartConfig);
  console.log("\n");

  // Test 3: Multiple Chart Types
  console.log("--- Test 3: Multiple Chart Types ---");
  const test3Data = [
    { category: "A", value: 30 },
    { category: "B", value: 80 },
    { category: "C", value: 45 },
  ];

  const chartTypes = ["Vertical Bar Chart", "Pie Chart", "Line Chart"];
  const test3 = ChartService.createMultipleCharts(
    {
      chartData: test3Data,
      chartType: "Base Chart",
      chartVariables: {
        x: ["category"],
        y: ["value"],
      },
    },
    chartTypes
  );

  console.log("Input Data:", test3Data);
  console.log(
    "Chart Types Generated:",
    test3.map((chart) => chart.charts[0].chartType)
  );
  console.log("\n");

  // Test 4: Auto-Detection
  console.log("--- Test 4: Auto-Detection ---");
  const test4Data = [
    { product: "Laptop", revenue: 50000 },
    { product: "Mouse", revenue: 25000 },
    { product: "Keyboard", revenue: 15000 },
  ];

  const test4 = ChartService.createChartJSON({
    chartData: test4Data,
    chartType: "Horizontal Bar Chart",
    chartVariables: {
      x: ["product"],
      y: ["revenue"],
    },
  });

  console.log("Input (mixed keys):", test4Data);
  console.log("Auto-formatted data:", test4.charts[0].chartData);
  console.log("Axis info:", test4.charts[0].chartMetadata.axisInfo);
  console.log("\n");

  // Test 5: Empty Data (Fallback)
  console.log("--- Test 5: Empty Data Fallback ---");
  const test5 = ChartService.createChartJSON({
    chartData: [],
    chartType: "Scatter Plot",
    chartVariables: {
      x: ["x"],
      y: ["y"],
    },
  });

  console.log("Input: []");
  console.log("Fallback data:", test5.charts[0].chartData);
  console.log("\n");

  console.log("✅ All tests completed!");

  return {
    test1,
    test2,
    test3,
    test4,
    test5,
  };
}

// Shortcut functions untuk test cepat
export function quickTest() {
  console.log("🚀 Quick Test:");
  const result = ChartService.quickChart(
    [100, 200, 150, 300],
    "Vertical Bar Chart"
  );
  console.log(result);
  return result;
}

export function customTest(data: any[], chartType: string, title?: string) {
  console.log(`🔧 Custom Test: ${chartType}`);
  const result = ChartService.createChartJSON({
    chartData: data,
    chartType,
    chartVariables: {
      x: ["category"],
      y: ["value"],
    },
    chartMetadata: {
      title: title || `Test ${chartType}`,
    },
  });
  console.log(result);
  return result;
}

// Export untuk akses langsung
export { ChartService };
