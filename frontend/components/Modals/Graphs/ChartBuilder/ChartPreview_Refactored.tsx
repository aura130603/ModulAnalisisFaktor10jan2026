// // This is a refactored version of the chart rendering logic
// // Combining two separate switch statements into one unified switch statement

// useEffect(() => {
//   console.log("🎨 Chart rendering useEffect triggered:", {
//     chartType,
//     selectedStatistic,
//     variablesChanged: JSON.stringify({
//       side: sideVariables,
//       bottom: bottomVariables,
//       color: colorVariables,
//     }),
//   });

//   if (chartContainerRef.current) {
//     chartContainerRef.current.innerHTML = ""; // Bersihkan kontainer dulu
//     chartContainerRef.current.id = "chart-container"; // Pastikan ada ID
//     let chartNode = null;
//     const svg = d3.select(chartContainerRef.current);
//     svg.selectAll("*").remove();

//     // UNIFIED SWITCH STATEMENT - All chart types in one place
//     switch (chartType) {
//       // === REGULAR 2D CHARTS ===
//       case "Vertical Bar Chart": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createChartConfig(chartType, isDefault);

//         chartNode = chartUtils.createVerticalBarChart2(
//           config.data,
//           width,
//           height,
//           useaxis,
//           config.titleConfig,
//           config.axisConfig,
//           config.scaleConfig,
//           chartColors
//         );
//         break;
//       }

//       case "Horizontal Bar Chart": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createChartConfig(chartType, isDefault);

//         chartNode = chartUtils.createHorizontalBarChart(
//           config.data,
//           width,
//           height,
//           useaxis,
//           undefined,
//           undefined,
//           config.titleConfig,
//           config.axisConfig,
//           config.scaleConfig,
//           chartColors
//         );
//         break;
//       }

//       case "Vertical Stacked Bar Chart": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createStackedChartConfig(chartType, isDefault);

//         chartNode = chartUtils.createVerticalStackedBarChart(
//           config.data,
//           width,
//           height,
//           useaxis,
//           config.titleConfig,
//           config.axisConfig,
//           config.scaleConfig,
//           chartColors
//         );
//         break;
//       }

//       case "Horizontal Stacked Bar Chart": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createStackedChartConfig(chartType, isDefault);

//         chartNode = chartUtils.createHorizontalStackedBarChart(
//           config.data,
//           width,
//           height,
//           useaxis,
//           config.titleConfig,
//           config.axisConfig,
//           config.scaleConfig,
//           chartColors
//         );
//         break;
//       }

//       case "Clustered Bar Chart": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createStackedChartConfig(chartType, isDefault);

//         chartNode = chartUtils.createClusteredBarChart(
//           config.data,
//           width,
//           height,
//           useaxis,
//           config.titleConfig,
//           config.axisConfig,
//           config.scaleConfig,
//           chartColors
//         );
//         break;
//       }

//       case "Line Chart": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createChartConfig(chartType, isDefault);

//         chartNode = chartUtils.createLineChart(
//           config.data,
//           width,
//           height,
//           useaxis,
//           config.titleConfig,
//           config.axisConfig,
//           config.scaleConfig,
//           chartColors
//         );
//         break;
//       }

//       case "Multiple Line Chart": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createStackedChartConfig(chartType, isDefault);

//         chartNode = chartUtils.createMultipleLineChart(
//           config.data,
//           width,
//           height,
//           useaxis,
//           config.titleConfig,
//           config.axisConfig,
//           config.scaleConfig,
//           chartColors
//         );
//         break;
//       }

//       case "Pie Chart": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createChartConfig(chartType, isDefault);
//         chartNode = chartUtils.createPieChart(
//           config.data,
//           width,
//           height,
//           useaxis,
//           config.titleConfig,
//           chartColors
//         );
//         break;
//       }

//       case "Area Chart": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createChartConfig(chartType, isDefault);
//         chartNode = chartUtils.createAreaChart(
//           config.data,
//           width,
//           height,
//           useaxis,
//           config.titleConfig,
//           config.axisConfig,
//           config.scaleConfig,
//           chartColors
//         );
//         break;
//       }

//       case "Stacked Area Chart": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createStackedChartConfig(chartType, isDefault);

//         chartNode = chartUtils.createStackedAreaChart(
//           config.data,
//           width,
//           height,
//           useaxis,
//           config.titleConfig,
//           config.axisConfig,
//           config.scaleConfig,
//           chartColors
//         );
//         break;
//       }

//       // === SCATTER PLOTS ===
//       case "Scatter Plot": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createChartConfig(chartType, isDefault);
//         chartNode = chartUtils.createScatterPlot(
//           config.data,
//           width,
//           height,
//           useaxis,
//           config.titleConfig,
//           config.axisConfig,
//           config.scaleConfig,
//           chartColors
//         );
//         break;
//       }

//       case "Scatter Plot With Fit Line": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createChartConfig(chartType, isDefault);
//         chartNode = chartUtils.createScatterPlotWithFitLine(
//           config.data,
//           width,
//           height,
//           useaxis,
//           config.titleConfig,
//           config.axisConfig,
//           config.scaleConfig,
//           chartColors
//         );
//         break;
//       }

//       case "Grouped Scatter Plot": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createChartConfig(chartType, isDefault);

//         chartNode = chartUtils.createGroupedScatterPlot(
//           config.data,
//           width,
//           height,
//           useaxis,
//           config.titleConfig,
//           config.axisConfig,
//           config.scaleConfig,
//           chartColors
//         );
//         break;
//       }

//       case "Scatter Plot Matrix": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createChartConfig(chartType, isDefault);
//         chartNode = chartUtils.createScatterPlotMatrix(
//           config.data,
//           width,
//           height,
//           useaxis,
//           config.titleConfig,
//           config.axisConfig,
//           chartColors
//         );
//         break;
//       }

//       // === STATISTICAL CHARTS ===
//       case "Histogram": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createChartConfig(chartType, isDefault);
//         chartNode = chartUtils.createHistogram(
//           config.data,
//           width,
//           height,
//           useaxis,
//           config.titleConfig,
//           config.axisConfig,
//           config.scaleConfig,
//           chartColors
//         );
//         break;
//       }

//       case "Stacked Histogram": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createStackedChartConfig(chartType, isDefault);

//         chartNode = chartUtils.createStackedHistogram(
//           config.data,
//           width,
//           height,
//           useaxis,
//           config.titleConfig,
//           config.axisConfig,
//           chartColors
//         );
//         break;
//       }

//       case "Boxplot": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createChartConfig(chartType, isDefault);
//         chartNode = chartUtils.createBoxplot(
//           config.data,
//           width,
//           height,
//           useaxis,
//           config.titleConfig,
//           config.axisConfig,
//           config.scaleConfig,
//           chartColors
//         );
//         break;
//       }

//       case "Clustered Boxplot": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createChartConfig(chartType, isDefault);
//         chartNode = chartUtils.createClusteredBoxplot(
//           config.data,
//           width,
//           height,
//           useaxis,
//           config.titleConfig,
//           config.axisConfig,
//           config.scaleConfig,
//           chartColors
//         );
//         break;
//       }

//       case "1-D Boxplot": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createChartConfig(chartType, isDefault);
//         chartNode = chartUtils.create1DBoxplot(
//           config.data,
//           width,
//           height,
//           useaxis,
//           config.titleConfig,
//           config.axisConfig,
//           config.scaleConfig,
//           chartColors
//         );
//         break;
//       }

//       case "Violin Plot": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createChartConfig(chartType, isDefault);
//         chartNode = chartUtils.createViolinPlot(
//           config.data,
//           width,
//           height,
//           useaxis,
//           config.titleConfig,
//           config.axisConfig,
//           config.scaleConfig,
//           chartColors
//         );
//         break;
//       }

//       // === ERROR BAR CHARTS ===
//       case "Error Bar Chart": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createErrorBarChartConfig(chartType, isDefault);

//         chartNode = chartUtils.createErrorBarChart(
//           config.data,
//           width,
//           height,
//           useaxis,
//           config.titleConfig,
//           config.axisConfig,
//           config.scaleConfig,
//           chartColors
//         );
//         break;
//       }

//       case "Clustered Error Bar Chart": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createClusteredErrorBarChartConfig(chartType, isDefault);

//         console.log("config.data", config.data);

//         chartNode = chartUtils.createClusteredErrorBarChart(
//           config.data,
//           width,
//           height,
//           useaxis,
//           config.titleConfig,
//           config.axisConfig,
//           config.scaleConfig,
//           chartColors
//         );
//         break;
//       }

//       // === SPECIALIZED CHARTS ===
//       case "Dot Plot": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createChartConfig(chartType, isDefault);

//         chartNode = chartUtils.createDotPlot(
//           config.data,
//           width,
//           height,
//           useaxis,
//           config.titleConfig,
//           config.axisConfig,
//           config.scaleConfig,
//           chartColors
//         );
//         break;
//       }

//       case "Population Pyramid": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createStackedChartConfig(chartType, isDefault);

//         chartNode = chartUtils.createPopulationPyramid(
//           config.data,
//           width,
//           height,
//           useaxis,
//           config.titleConfig,
//           config.axisConfig,
//           config.scaleConfig,
//           chartColors
//         );
//         break;
//       }

//       case "Frequency Polygon": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createChartConfig(chartType, isDefault);
//         chartNode = chartUtils.createFrequencyPolygon(
//           config.data,
//           width,
//           height,
//           useaxis,
//           config.titleConfig,
//           config.axisConfig,
//           config.scaleConfig,
//           chartColors
//         );
//         break;
//       }

//       case "Drop Line Chart": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createChartConfig(chartType, isDefault);

//         chartNode = chartUtils.createDropLineChart(
//           config.data,
//           width,
//           height,
//           useaxis,
//           config.titleConfig,
//           config.axisConfig,
//           config.scaleConfig,
//           chartColors
//         );
//         break;
//       }

//       case "Summary Point Plot": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createChartConfig(chartType, isDefault);
//         const statistics = selectedStatistic || "mean";

//         console.log("🔄 Summary Point Plot rendering:", {
//           selectedStatistic,
//           statistics,
//           isDefault,
//           dataLength: config.data.length,
//           data: config.data,
//         });

//         chartNode = chartUtils.createSummaryPointPlot(
//           config.data,
//           width,
//           height,
//           useaxis,
//           statistics,
//           config.titleConfig,
//           config.axisConfig,
//           config.scaleConfig,
//           chartColors
//         );
//         break;
//       }

//       case "Stem And Leaf Plot": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createChartConfig(chartType, isDefault);

//         chartNode = chartUtils.createStemAndLeafPlot(
//           config.data,
//           width,
//           height,
//           useaxis,
//           config.titleConfig,
//           config.axisConfig,
//           config.scaleConfig,
//           chartColors
//         );
//         break;
//       }

//       case "Density Chart": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createChartConfig(chartType, isDefault);

//         // Convert config.data to array of numbers for density chart
//         const densityData =
//           Array.isArray(config.data) && config.data.length > 0
//             ? config.data
//                 .map((d) => (typeof d === "number" ? d : d.value))
//                 .filter((v) => !isNaN(v))
//             : config.data;

//         chartNode = chartUtils.createDensityChart(
//           densityData,
//           width,
//           height,
//           useaxis,
//           config.titleConfig,
//           config.axisConfig,
//           config.scaleConfig,
//           chartColors
//         );
//         break;
//       }

//       // === RANGE CHARTS ===
//       case "Simple Range Bar": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createChartConfig(chartType, isDefault);
//         chartNode = chartUtils.createSimpleRangeBar(
//           config.data,
//           width,
//           height,
//           useaxis,
//           config.titleConfig,
//           config.axisConfig,
//           config.scaleConfig,
//           chartColors
//         );
//         break;
//       }

//       case "Clustered Range Bar": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createStackedChartConfig(chartType, isDefault);

//         chartNode = chartUtils.createClusteredRangeBar(
//           config.data,
//           width,
//           height,
//           useaxis,
//           config.titleConfig,
//           config.axisConfig,
//           config.scaleConfig,
//           chartColors
//         );
//         break;
//       }

//       case "High-Low-Close Chart": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createChartConfig(chartType, isDefault);

//         chartNode = chartUtils.createHighLowCloseChart(
//           config.data,
//           width,
//           height,
//           useaxis,
//           config.titleConfig,
//           config.axisConfig,
//           config.scaleConfig,
//           chartColors
//         );
//         break;
//       }

//       case "Difference Area": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createChartConfig(chartType, isDefault);

//         chartNode = chartUtils.createDifferenceArea(
//           config.data,
//           width,
//           height,
//           useaxis,
//           config.titleConfig,
//           config.axisConfig,
//           config.scaleConfig,
//           chartColors
//         );
//         break;
//       }

//       // === DUAL AXIS CHARTS ===
//       case "Vertical Bar & Line Chart": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createDualAxisChartConfig(chartType, isDefault);

//         chartNode = chartUtils.createBarAndLineChart(
//           config.data,
//           width,
//           height,
//           useaxis,
//           config.titleConfig,
//           config.axisConfig,
//           config.scaleConfig,
//           chartColors
//         );
//         break;
//       }

//       case "Vertical Bar & Line Chart2": {
//         const isDefault = processedResult.data.length === 0;
//         const config = createChartConfig(chartType, isDefault);

//         chartNode = chartUtils.createBarAndLineChart2(
//           config.data,
//           width,
//           height,
//           useaxis,
//           "stacked",
//           config.titleConfig,
//           config.axisConfig,
//           config.scaleConfig,
//           chartColors
//         );
//         break;
//       }

//       case "Dual Axes Scatter Plot": {
//         const dualAxisScatterConfig = createDualAxisChartConfig(chartType);
//         const dualAxesScatterPlotData =
//           processedResult.data.length === 0
//             ? [
//                 { x: 6, y1: 22, y2: 75 },
//                 { x: 8, y1: 25, y2: 78 },
//                 { x: 10, y1: 28, y2: 80 },
//                 { x: 12, y1: 30, y2: 82 },
//                 { x: 14, y1: 26, y2: 79 },
//                 { x: 16, y1: 24, y2: 74 },
//                 { x: 18, y1: 27, y2: 76 },
//                 { x: 20, y1: 25, y2: 70 },
//               ]
//             : processedResult.data;

//         chartNode = chartUtils.createDualAxesScatterPlot(
//           dualAxesScatterPlotData,
//           width,
//           height,
//           useaxis,
//           dualAxisScatterConfig.titleConfig,
//           dualAxisScatterConfig.axisConfig,
//           dualAxisScatterConfig.scaleConfig,
//           chartColors
//         );
//         break;
//       }

//       // === 3D CHARTS ===
//       case "3D Bar Chart2": {
//         // Buat elemen chart
//         const d3BarChartData =
//           processedResult.data.length === 0
//             ? [
//                 { x: -5, y: 2, z: -5 }, // Kuadran (-, +, -)
//                 { x: -4, y: 3, z: 6 }, // Kuadran (-, +, +)
//                 { x: -3, y: 5, z: 4 }, // Kuadran (-, +, +)
//                 { x: -2, y: 7, z: -6 }, // Kuadran (-, +, -)
//                 { x: 0, y: 0, z: 0 }, // Sumbu (y positif)
//                 { x: 2, y: 2, z: -6 }, // Kuadran (+, +, -)
//                 { x: 2, y: 4, z: 7 }, // Kuadran (+, +, +)
//                 { x: 3, y: 6, z: -5 }, // Kuadran (+, +, -)
//                 { x: 4, y: 3, z: 2 }, // Kuadran (+, +, +)
//                 { x: 5, y: 5, z: -9 }, // Kuadran (+, +, -)
//                 { x: 6, y: 4, z: -2 }, // Kuadran (+, +, -)
//                 { x: 7, y: 3, z: 5 }, // Kuadran (+, +, +)
//                 { x: -7, y: 2, z: -6 }, // Kuadran (-, +, -)
//                 { x: -6, y: 4, z: -2 }, // Kuadran (-, +, -)
//                 { x: -5, y: 5, z: 5 }, // Kuadran (-, +, +)
//               ]
//             : processedResult.data.map((d) => ({
//                 x:
//                   d.category && Number(d.category) !== 0
//                     ? Number(d.category)
//                     : Number(d.bottom_0) || 0,
//                 y: Number(d.value) || 0,
//                 z: Number(d.bottom2_0) || 0,
//               }));

//         chartNode = chartUtils.create3DBarChart2(d3BarChartData, width, height);
//         break;
//       }

//       case "3D Scatter Plot": {
//         // Buat elemen chart
//         const d3ScatterPlotData =
//           processedResult.data.length === 0
//             ? [
//                 { x: -5, y: 2, z: -5 }, // Kuadran (-, +, -)
//                 { x: -4, y: 3, z: 6 }, // Kuadran (-, +, +)
//                 { x: -3, y: 5, z: 4 }, // Kuadran (-, +, +)
//                 { x: -2, y: 7, z: -6 }, // Kuadran (-, +, -)
//                 { x: 0, y: 0, z: 0 }, // Sumbu (y positif)
//                 { x: 2, y: 2, z: -6 }, // Kuadran (+, +, -)
//                 { x: 2, y: 4, z: 7 }, // Kuadran (+, +, +)
//                 { x: 3, y: 6, z: -5 }, // Kuadran (+, +, -)
//                 { x: 4, y: 3, z: 2 }, // Kuadran (+, +, +)
//                 { x: 5, y: 5, z: -9 }, // Kuadran (+, +, -)
//                 { x: 6, y: 4, z: -2 }, // Kuadran (+, +, -)
//                 { x: 7, y: 3, z: 5 }, // Kuadran (+, +, +)
//                 { x: -7, y: 2, z: -6 }, // Kuadran (-, +, -)
//                 { x: -6, y: 4, z: -2 }, // Kuadran (-, +, -)
//                 { x: -5, y: 5, z: 5 }, // Kuadran (-, +, +)
//               ]
//             : processedResult.data.map((d) => ({
//                 x:
//                   d.category && Number(d.category) !== 0
//                     ? Number(d.category)
//                     : Number(d.bottom_0) || 0,
//                 y: Number(d.value) || 0,
//                 z: Number(d.bottom2_0) || 0,
//               }));

//         chartNode = chartUtils.create3DScatterPlot(
//           d3ScatterPlotData,
//           width,
//           height
//         );
//         break;
//       }

//       case "Grouped 3D Scatter Plot": {
//         // Buat elemen chart
//         const d3GroupedScatterPlotData =
//           processedResult.data.length === 0
//             ? [
//                 { x: 1, y: 2, z: 3, category: "A" },
//                 { x: 1, y: 2, z: 3, category: "B" },
//                 { x: 1, y: 2, z: 3, category: "C" },
//                 { x: 1, y: 4, z: 3, category: "D" },
//                 { x: 2, y: 4, z: 1, category: "A" },
//                 { x: 3, y: 1, z: 2, category: "B" },
//                 { x: 4, y: 3, z: 4, category: "B" },
//                 { x: 5, y: 2, z: 5, category: "C" },
//                 { x: 6, y: 5, z: 3, category: "C" },
//                 { x: 7, y: 3, z: 2, category: "D" },
//                 { x: 8, y: 4, z: 1, category: "D" },
//               ]
//             : processedResult.data
//                 .filter((d) => d.color !== "" && d.color != undefined) // Hanya ambil data yang memiliki color
//                 .map((d) => ({
//                   x:
//                     d.category && Number(d.category) !== 0
//                       ? Number(d.category)
//                       : Number(d.bottom_0) || 0,
//                   y: Number(d.value) || 0,
//                   z: Number(d.bottom2_0) || 0,
//                   category: String(d.color || "unknown"),
//                 }));

//         chartNode = chartUtils.createGrouped3DScatterPlot(
//           d3GroupedScatterPlotData,
//           width,
//           height
//         );
//         break;
//       }

//       case "Clustered 3D Bar Chart": {
//         // Buat elemen chart
//         const d3ClusteredBarChartData =
//           processedResult.data.length === 0
//             ? [
//                 { x: 1, z: 1, y: 6, category: "A" },
//                 { x: 2, z: 1, y: 7, category: "A" },
//                 { x: 2, z: 1, y: 6, category: "B" },
//                 { x: 2, z: 1, y: 5, category: "C" },
//                 { x: 2, z: 1, y: 6, category: "D" },
//                 { x: 6, z: 4, y: 7, category: "A" },
//                 { x: 6, z: 4, y: 6, category: "B" },
//                 { x: 6, z: 4, y: 5, category: "C" },
//                 { x: 6, z: 4, y: 6, category: "D" },
//                 { x: 4, z: 7, y: 5, category: "A" },
//                 { x: -4, z: 6, y: 3, category: "A" },
//                 { x: -4, z: 6, y: 6, category: "B" },
//                 { x: -4, z: 6, y: 7, category: "C" },
//                 { x: -4, z: 6, y: 1, category: "D" },
//                 { x: -4, z: 6, y: 4, category: "E" },
//                 { x: -9, z: 8, y: 4, category: "A" },
//                 { x: -9, z: 8, y: 6, category: "B" },
//                 { x: -9, z: 8, y: 2, category: "E" },
//                 { x: 8, z: -6, y: 3, category: "A" },
//                 { x: 8, z: -6, y: 4, category: "B" },
//                 { x: 8, z: -6, y: 9, category: "C" },
//                 { x: 8, z: -6, y: 2, category: "D" },
//                 { x: 8, z: -6, y: 5, category: "E" },
//                 { x: -8, z: -2, y: 3, category: "A" },
//                 { x: -8, z: -2, y: 6, category: "B" },
//                 { x: -8, z: -2, y: 3, category: "C" },
//                 { x: -8, z: -2, y: 1, category: "D" },
//                 { x: -8, z: -2, y: 4, category: "E" },
//               ]
//             : processedResult.data
//                 .filter((d) => d.color !== "" && d.color != undefined) // Hanya ambil data yang memiliki color
//                 .map((d) => ({
//                   x:
//                     d.category && Number(d.category) !== 0
//                       ? Number(d.category)
//                       : Number(d.bottom_0) || 0,
//                   y: Number(d.value) || 0,
//                   z: Number(d.bottom2_0) || 0,
//                   category: String(d.color || "unknown"),
//                 }));

//         chartNode = chartUtils.createClustered3DBarChart(
//           d3ClusteredBarChartData,
//           width,
//           height
//         );
//         break;
//       }

//       case "Stacked 3D Bar Chart": {
//         // Buat elemen chart
//         const d3StackedBarChartData =
//           processedResult.data.length === 0
//             ? [
//                 { x: 1, z: 1, y: 6, category: "A" },
//                 { x: 2, z: 6, y: 2, category: "A" },
//                 { x: 2, z: 6, y: 3, category: "B" },
//                 { x: 2, z: 6, y: 2, category: "C" },
//                 { x: 2, z: 6, y: 1, category: "D" },
//                 { x: 5, z: 4, y: 1, category: "A" },
//                 { x: 5, z: 4, y: 2, category: "B" },
//                 { x: 5, z: 4, y: 3, category: "C" },
//                 { x: 5, z: 4, y: 1, category: "D" },
//                 { x: 9, z: 7, y: 7, category: "A" },
//                 { x: -4, z: 6, y: 3, category: "A" },
//                 { x: -4, z: 6, y: 1, category: "B" },
//                 { x: -4, z: 6, y: 2, category: "C" },
//                 { x: -4, z: 6, y: 2, category: "D" },
//                 { x: -4, z: 6, y: 1, category: "E" },
//                 { x: -9, z: 8, y: 1, category: "A" },
//                 { x: -9, z: 8, y: 2, category: "B" },
//                 { x: -9, z: 8, y: 2, category: "E" },
//                 { x: 8, z: -6, y: 3, category: "A" },
//                 { x: 8, z: -6, y: 2, category: "B" },
//                 { x: 8, z: -6, y: 1, category: "C" },
//                 { x: 8, z: -6, y: 2, category: "D" },
//                 { x: 8, z: -6, y: 2, category: "E" },
//                 { x: -8, z: -2, y: 3, category: "A" },
//                 { x: -8, z: -2, y: 2, category: "B" },
//                 { x: -8, z: -2, y: 3, category: "C" },
//                 { x: -8, z: -2, y: 1, category: "D" },
//                 { x: -8, z: -2, y: 1, category: "E" },
//               ]
//             : processedResult.data
//                 .filter((d) => d.color !== "" && d.color != undefined) // Hanya ambil data yang memiliki color
//                 .map((d) => ({
//                   x:
//                     d.category && Number(d.category) !== 0
//                       ? Number(d.category)
//                       : Number(d.bottom_0) || 0,
//                   y: Number(d.value) || 0,
//                   z: Number(d.bottom2_0) || 0,
//                   category: String(d.color || "unknown"),
//                 }));

//         chartNode = chartUtils.createStacked3DBarChart(
//           d3StackedBarChartData,
//           width,
//           height
//         );
//         break;
//       }

//       // === DEFAULT CASE ===
//       default:
//         console.error("Unknown chart type:", chartType);
//         break;
//     }

//     // Jika chartNode valid, append ke svgRef
//     if (chartNode && chartContainerRef.current) {
//       console.log("chartContainerRef.current:", chartContainerRef.current);
//       chartContainerRef.current.appendChild(chartNode); // Menambahkan node hasil dari fungsi ke dalam svgRef
//       console.log("chartContainerRef.current:", chartContainerRef.current);
//       console.log("chart:", chartNode);
//     }
//   }
// }, [
//   // Dependencies array remains the same
//   chartType,
//   sideVariables,
//   side2Variables,
//   bottomVariables,
//   bottom2Variables,
//   colorVariables,
//   filterVariables,
//   lowVariables,
//   highVariables,
//   closeVariables,
//   data,
//   useaxis,
//   width,
//   height,
//   variables,
//   chartTitle,
//   chartSubtitle,
//   xAxisLabel,
//   yAxisLabel,
//   yLeftAxisLabel,
//   yRightAxisLabel,
//   xAxisMin,
//   xAxisMax,
//   xAxisMajorIncrement,
//   xAxisOrigin,
//   yAxisMin,
//   yAxisMax,
//   yAxisMajorIncrement,
//   yAxisOrigin,
//   yRightAxisMin,
//   yRightAxisMax,
//   yRightAxisMajorIncrement,
//   yRightAxisOrigin,
//   chartColors,
//   processedResult,
//   selectedStatistic,
//   createChartConfig,
//   createClusteredErrorBarChartConfig,
//   createDualAxisChartConfig,
//   createErrorBarChartConfig,
//   createStackedChartConfig,
// ]);
