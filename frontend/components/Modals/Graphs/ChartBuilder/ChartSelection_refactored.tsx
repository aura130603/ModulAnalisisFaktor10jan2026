// import React, { useEffect, useRef } from "react";
// import * as d3 from "d3";
// import { chartUtils } from "@/utils/chartBuilder/chartTypes/chartUtils";

// interface ChartSelectionProps {
//   chartType: string;
//   width: number;
//   height: number;
//   useaxis: boolean;
// }

// const ChartSelection: React.FC<ChartSelectionProps> = ({
//   chartType,
//   width,
//   height,
//   useaxis,
// }) => {
//   const chartContainerRef = useRef<HTMLDivElement | null>(null);

//   useEffect(() => {
//     if (chartContainerRef.current) {
//       chartContainerRef.current.innerHTML = ""; // Bersihkan kontainer dulu

//       const data1 = [
//         { category: "A", value: 30 },
//         { category: "B", value: 80 },
//         { category: "C", value: 45 },
//         { category: "D", value: 60 },
//         { category: "E", value: 20 },
//         { category: "F", value: 90 },
//       ];
//       const data2 = [
//         { category: "Jan", value: 10 },
//         { category: "Feb", value: 30 },
//         { category: "Mar", value: 55 },
//         { category: "Apr", value: 60 },
//         { category: "Mei", value: 70 },
//         { category: "Jun", value: 90 },
//         { category: "Jul", value: 55 },
//         { category: "Agu", value: 30 },
//         { category: "Sep", value: 50 },
//         { category: "Okt", value: 20 },
//         { category: "Nov", value: 25 },
//         { category: "Des", value: 25 },
//       ];
//       const data3 = [5, 8, 9, 7, 3, 6, 3, 7, 3, 2, 9, 1, 4, 2, 5];
//       const data4 = [
//         { x: 15, y: 50 },
//         { x: 20, y: 200 },
//         { x: 60, y: 100 },
//         { x: 200, y: 325 },
//         { x: 80, y: 150 },
//         { x: 130, y: 275 },
//         { x: 50, y: 220 },
//         { x: 170, y: 300 },
//         { x: 100, y: 30 },
//         { x: 170, y: 125 },
//         { x: 150, y: 80 },
//         { x: 100, y: 190 },
//         { x: 95, y: 75 },
//       ];
//       const data5 = [
//         { category: "A", value: 20 },
//         { category: "A", value: 40 },
//         { category: "A", value: 60 },
//         { category: "A", value: 80 },
//         { category: "B", value: 30 },
//         { category: "B", value: 50 },
//         { category: "B", value: 70 },
//         { category: "B", value: 90 },
//       ];
//       const data6 = [
//         { category: "male", subcategory: "blue", value: 30 },
//         { category: "male", subcategory: "white", value: 20 },
//         { category: "male", subcategory: "green", value: 10 },
//         { category: "female", subcategory: "blue", value: 25 },
//         { category: "female", subcategory: "white", value: 15 },
//         { category: "female", subcategory: "green", value: 10 },
//       ];
//       const data7 = [
//         { category: "Product A", subcategory: "Division 1", value: 30 },
//         { category: "Product A", subcategory: "Division 2", value: 20 },
//         { category: "Product B", subcategory: "Division 1", value: 25 },
//         { category: "Product B", subcategory: "Division 2", value: 15 },
//         { category: "Product C", subcategory: "Division 1", value: 40 },
//         { category: "Product C", subcategory: "Division 2", value: 10 },
//       ];
//       const data8 = [
//         { category: "B", value: 80, error: 60 },
//         { category: "D", value: 60, error: 60 },
//         { category: "E", value: 20, error: 30 },
//         { category: "F", value: 90, error: 70 },
//       ];
//       const data9 = [
//         { category: "Sun", subcategory: "Product 1", value: 30 },
//         { category: "Sun", subcategory: "Product 2", value: 20 },
//         { category: "Sun", subcategory: "Product 3", value: 25 },
//         { category: "Mon", subcategory: "Product 1", value: 15 },
//         { category: "Mon", subcategory: "Product 2", value: 40 },
//         { category: "Mon", subcategory: "Product 3", value: 10 },
//         { category: "Tue", subcategory: "Product 1", value: 20 },
//         { category: "Tue", subcategory: "Product 2", value: 30 },
//         { category: "Tue", subcategory: "Product 3", value: 15 },
//         { category: "Wed", subcategory: "Product 1", value: 10 },
//         { category: "Wed", subcategory: "Product 2", value: 25 },
//         { category: "Wed", subcategory: "Product 3", value: 40 },
//       ];
//       const data10 = [
//         { category: "A", x: 5.1, y: 3.5 },
//         { category: "B", x: 4.9, y: 3.0 },
//         { category: "A", x: 4.7, y: 3.2 },
//         { category: "C", x: 4.6, y: 3.1 },
//         { category: "B", x: 5.0, y: 3.6 },
//         { category: "C", x: 5.4, y: 3.9 },
//         { category: "A", x: 4.6, y: 3.4 },
//         { category: "B", x: 5.0, y: 3.4 },
//         { category: "C", x: 4.4, y: 2.9 },
//         { category: "A", x: 4.9, y: 3.1 },
//         { category: "B", x: 5.4, y: 3.7 },
//         { category: "C", x: 4.8, y: 3.4 },
//         { category: "A", x: 4.8, y: 3.0 },
//         { category: "B", x: 4.3, y: 3.0 },
//         { category: "C", x: 5.8, y: 4.0 },
//         { category: "A", x: 5.7, y: 4.4 },
//         { category: "B", x: 5.4, y: 3.9 },
//         { category: "C", x: 5.1, y: 3.5 },
//         { category: "A", x: 5.1, y: 3.8 },
//         { category: "B", x: 5.0, y: 3.3 },
//       ];
//       const data11 = [
//         { category: "A", value: 3 },
//         { category: "B", value: 2 },
//         { category: "C", value: 5 },
//         { category: "D", value: 4 },
//         { category: "E", value: 2 },
//         { category: "F", value: 5 },
//       ];
//       const data12 = [
//         { category: "0-4", subcategory: "M", value: 9736305 },
//         { category: "0-4", subcategory: "F", value: 10031835 },
//         { category: "5-9", subcategory: "M", value: 10117913 },
//         { category: "5-9", subcategory: "F", value: 10411857 },
//         { category: "10-14", subcategory: "M", value: 10470147 },
//         { category: "10-14", subcategory: "F", value: 11027820 },
//         { category: "15-19", subcategory: "M", value: 10561873 },
//         { category: "15-19", subcategory: "F", value: 11094262 },
//         { category: "20-24", subcategory: "M", value: 11576412 },
//         { category: "20-24", subcategory: "F", value: 10889596 },
//         { category: "25-29", subcategory: "M", value: 10625791 },
//         { category: "25-29", subcategory: "F", value: 9889569 },
//         { category: "30-34", subcategory: "M", value: 9899569 },
//         { category: "30-34", subcategory: "F", value: 10330988 },
//         { category: "35-39", subcategory: "M", value: 10330988 },
//         { category: "35-39", subcategory: "F", value: 10571884 },
//         { category: "40-44", subcategory: "M", value: 10571884 },
//         { category: "40-44", subcategory: "F", value: 11051409 },
//         { category: "45-49", subcategory: "M", value: 10173646 },
//         { category: "45-49", subcategory: "F", value: 8824852 },
//         { category: "50-54", subcategory: "M", value: 8824852 },
//         { category: "50-54", subcategory: "F", value: 6876271 },
//         { category: "55-59", subcategory: "M", value: 6876271 },
//         { category: "55-59", subcategory: "F", value: 4867513 },
//         { category: "60-64", subcategory: "M", value: 4867513 },
//         { category: "60-64", subcategory: "F", value: 3416432 },
//         { category: "65-69", subcategory: "M", value: 3416432 },
//         { category: "65-69", subcategory: "F", value: 2378691 },
//         { category: "70-74", subcategory: "M", value: 2378691 },
//         { category: "70-74", subcategory: "F", value: 2000771 },
//         { category: "75-79", subcategory: "M", value: 2000771 },
//         { category: "75-79", subcategory: "F", value: 4313687 },
//         { category: "80-84", subcategory: "M", value: 4313687 },
//         { category: "80-84", subcategory: "F", value: 3432738 },
//       ];

//       const data14 = [
//         { category: "A", group: "2023", value: 10 },
//         { category: "A", group: "2024", value: 15 },
//         { category: "B", group: "2023", value: 8 },
//         { category: "B", group: "2024", value: 12 },
//         { category: "C", group: "2023", value: 6 },
//         { category: "C", group: "2024", value: 9 },
//       ];

//       const data15 = [
//         { category: "A", subcategory: "A1", value: 20, error: 7 },
//         { category: "A", subcategory: "A2", value: 30, error: 8 },
//         { category: "A", subcategory: "A3", value: 50, error: 9 },
//         { category: "B", subcategory: "A1", value: 25, error: 7 },
//         { category: "B", subcategory: "A2", value: 35, error: 8 },
//         { category: "B", subcategory: "A3", value: 53, error: 9 },
//         { category: "C", subcategory: "A1", value: 22, error: 7 },
//         { category: "C", subcategory: "A2", value: 40, error: 8 },
//         { category: "C", subcategory: "A3", value: 49, error: 9 },
//       ];
//       const data16 = [
//         { A: 15, B: 50, C: 20 },
//         { A: 20, B: 200, C: 30 },
//         { A: 60, B: 100, C: 70 },
//         { A: 200, B: 325, C: 180 },
//         { A: 80, B: 150, C: 60 },
//         { A: 130, B: 275, C: 110 },
//       ];
//       const data17 = [
//         { value: 10, category: "A" },
//         { value: 12, category: "B" },
//         { value: 15, category: "A" },
//         { value: 18, category: "C" },
//         { value: 20, category: "B" },
//         { value: 25, category: "C" },
//         { value: 30, category: "A" },
//         { value: 10, category: "B" },
//         { value: 12, category: "C" },
//         { value: 15, category: "A" },
//         { value: 22, category: "B" },
//         { value: 28, category: "C" },
//         { value: 32, category: "A" },
//         { value: 35, category: "B" },
//         { value: 38, category: "C" },
//       ];

//       const data18 = [
//         { category: "A", subcategory: "X", value: 10 },
//         { category: "A", subcategory: "X", value: 12 },
//         { category: "A", subcategory: "Y", value: 15 },
//         { category: "A", subcategory: "Y", value: 18 },
//         { category: "B", subcategory: "X", value: 20 },
//         { category: "B", subcategory: "X", value: 25 },
//         { category: "B", subcategory: "Y", value: 30 },
//         { category: "B", subcategory: "Y", value: 35 },
//       ];

//       const data19 = [
//         { category: "Jan", high: 100, low: 50, close: 75 },
//         { category: "Feb", high: 110, low: 60, close: 80 },
//         { category: "Mar", high: 120, low: 70, close: 95 },
//         { category: "Apr", high: 130, low: 80, close: 100 },
//         { category: "May", high: 125, low: 75, close: 110 },
//         { category: "Jun", high: 140, low: 90, close: 120 },
//       ];

//       const data20 = [
//         { category: "A", subcategory: "X", low: 20, high: 50, close: 35 },
//         { category: "A", subcategory: "Y", low: 25, high: 55, close: 40 },
//         { category: "B", subcategory: "X", low: 15, high: 45, close: 30 },
//         { category: "B", subcategory: "Y", low: 18, high: 48, close: 33 },
//         { category: "C", subcategory: "X", low: 22, high: 60, close: 42 },
//         { category: "C", subcategory: "Y", low: 27, high: 65, close: 46 },
//         { category: "D", subcategory: "X", low: 12, high: 40, close: 28 },
//         { category: "D", subcategory: "Y", low: 14, high: 42, close: 30 },
//         { category: "E", subcategory: "X", low: 30, high: 70, close: 50 },
//         { category: "E", subcategory: "Y", low: 35, high: 75, close: 55 },
//       ];

//       const data21 = [
//         { category: "A", value0: 62.7, value1: 63.4 },
//         { category: "B", value0: 59.9, value1: 58 },
//         { category: "C", value0: 59.1, value1: 53.3 },
//         { category: "D", value0: 58.8, value1: 55.7 },
//         { category: "E", value0: 58.7, value1: 64.2 },
//         { category: "F", value0: 57, value1: 58.8 },
//         { category: "G", value0: 56.7, value1: 57.9 },
//         { category: "H", value0: 56.8, value1: 61.8 },
//         { category: "I", value0: 56.7, value1: 69.3 },
//         { category: "J", value0: 60.1, value1: 71.2 },
//         { category: "K", value0: 61.1, value1: 68.7 },
//         { category: "L", value0: 61.5, value1: 61.8 },
//         { category: "M", value0: 64.3, value1: 63 },
//         { category: "N", value0: 67.1, value1: 66.9 },
//         { category: "O", value0: 64.6, value1: 61.7 },
//         { category: "P", value0: 61.6, value1: 61.8 },
//         { category: "Q", value0: 61.1, value1: 62.8 },
//         { category: "R", value0: 59.2, value1: 60.8 },
//         { category: "S", value0: 58.9, value1: 62.1 },
//         { category: "T", value0: 57.2, value1: 65.1 },
//       ];

//       const data22 = [
//         { category: "A", barValue: 20, lineValue: 30 },
//         { category: "B", barValue: 40, lineValue: 50 },
//         { category: "C", barValue: 60, lineValue: 70 },
//         { category: "D", barValue: 40, lineValue: 30 },
//         { category: "E", barValue: 30, lineValue: 30 },
//         { category: "F", barValue: 70, lineValue: 80 },
//       ];

//       const data23 = [
//         { x: 6, y1: 22, y2: 75 },
//         { x: 8, y1: 25, y2: 78 },
//         { x: 10, y1: 28, y2: 80 },
//         { x: 12, y1: 30, y2: 82 },
//         { x: 14, y1: 26, y2: 79 },
//         { x: 16, y1: 24, y2: 74 },
//         { x: 18, y1: 27, y2: 76 },
//         { x: 20, y1: 25, y2: 70 },
//       ];

//       const data24 = [
//         { x: "A", y: 70, category: "1" },
//         { x: "A", y: 15, category: "2" },
//         { x: "A", y: 25, category: "3" },
//         { x: "B", y: 25, category: "1" },
//         { x: "B", y: 45, category: "3" },
//         { x: "C", y: 40, category: "1" },
//         { x: "D", y: 25, category: "1" },
//         { x: "D", y: 60, category: "2" },
//         { x: "E", y: 20, category: "1" },
//         { x: "E", y: 65, category: "2" },
//         { x: "E", y: 80, category: "3" },
//       ];

//       const data25 = [
//         { category: "A", value: 15 },
//         { category: "A", value: 30 },
//         { category: "B", value: 8 },
//         { category: "B", value: 12 },
//         { category: "C", value: 19 },
//         { category: "C", value: 22 },
//         { category: "D", value: 23 },
//       ];

//       const data26 = [
//         {
//           category: "Januari",
//           bars: { A: 30, B: 50 },
//           lines: { Target: 40 },
//         },
//         {
//           category: "Februari",
//           bars: { A: 20, B: 60 },
//           lines: { Target: 45 },
//         },
//         {
//           category: "Maret",
//           bars: { A: 50, B: 40 },
//           lines: { Target: 55 },
//         },
//         {
//           category: "April",
//           bars: { A: 35, B: 45 },
//           lines: { Target: 50 },
//         },
//         {
//           category: "Mei",
//           bars: { A: 25, B: 55 },
//           lines: { Target: 60 },
//         },
//         {
//           category: "Juni",
//           bars: { A: 40, B: 35 },
//           lines: { Target: 52 },
//         },
//         {
//           category: "Juli",
//           bars: { A: 45, B: 50 },
//           lines: { Target: 58 },
//         },
//       ];

//       const data27 = [
//         { stem: "1", leaves: [2, 5] },
//         { stem: "2", leaves: [1, 2, 4] },
//         { stem: "3", leaves: [1, 5, 6, 7] },
//         { stem: "4", leaves: [2, 6, 7, 8, 9] },
//         { stem: "5", leaves: [2, 3, 4, 5, 6, 7, 11] },
//         { stem: "6", leaves: [1, 1, 1, 8, 9] },
//       ];

//       const data28 = [
//         { category: "A", value: 10 },
//         { category: "A", value: 15 },
//         { category: "A", value: 20 },
//         { category: "A", value: 18 },
//         { category: "A", value: 12 },
//         { category: "B", value: 5 },
//         { category: "B", value: 8 },
//         { category: "B", value: 6 },
//         { category: "B", value: 9 },
//         { category: "B", value: 4 },
//         { category: "C", value: 22 },
//         { category: "C", value: 25 },
//         { category: "C", value: 24 },
//         { category: "C", value: 23 },
//         { category: "C", value: 26 },
//       ];

//       const data29 = Array.from({ length: 100 }, () =>
//         Math.round(d3.randomNormal(500, 100)())
//       );

//       const words = [
//         "freedom",
//         "justice",
//         "hope",
//         "equality",
//         "peace",
//         "love",
//         "future",
//         "strength",
//         "courage",
//         "change",
//         "believe",
//         "together",
//         "unity",
//         "progress",
//         "rights",
//         "voice",
//         "inspire",
//         "power",
//         "action",
//         "liberty",
//         "truth",
//         "vision",
//         "solidarity",
//         "respect",
//         "opportunity",
//         "compassion",
//         "dignity",
//         "empower",
//         "diversity",
//         "inclusion",
//         "harmony",
//         "bravery",
//         "dream",
//         "empowerment",
//         "respect",
//         "transformation",
//         "justice",
//         "courageous",
//         "success",
//         "tolerance",
//         "love",
//         "equality",
//         "togetherness",
//         "sustainability",
//         "strength",
//         "freedom",
//         "grace",
//         "compassion",
//         "positivity",
//         "honor",
//         "equality",
//         "hopeful",
//         "change",
//         "belonging",
//         "resilience",
//         "opportunity",
//         "solidarity",
//         "endurance",
//         "achieve",
//         "perseverance",
//         "justice",
//         "unity",
//         "growth",
//         "excellence",
//         "balance",
//         "progress",
//         "healing",
//         "visionary",
//         "potential",
//         "action",
//         "purpose",
//         "liberation",
//         "peaceful",
//         "dignified",
//         "openness",
//         "knowledge",
//       ].flatMap((word) => Array(25).fill(word));

//       // Create chart node based on chart type
//       let chartNode = null;

//       if (chartType === "Vertical Bar Chart") {
//         chartNode = chartUtils.createVerticalBarChart2(
//           data1,
//           width,
//           height,
//           useaxis
//         );
//       } else if (chartType === "Horizontal Bar Chart") {
//         chartNode = chartUtils.createHorizontalBarChart(
//           data1,
//           width,
//           height,
//           useaxis
//         );
//       } else if (chartType === "Line Chart") {
//         chartNode = chartUtils.createLineChart(data2, width, height, useaxis);
//       } else if (chartType === "Pie Chart") {
//         chartNode = chartUtils.createPieChart(
//           data1,
//           width * 0.8,
//           height * 0.8,
//           false
//         );
//       } else if (chartType === "Area Chart") {
//         chartNode = chartUtils.createAreaChart(data2, width, height, useaxis);
//       } else if (chartType === "Histogram") {
//         chartNode = chartUtils.createHistogram(data3, width, height, useaxis);
//       } else if (chartType === "Scatter Plot") {
//         chartNode = chartUtils.createScatterPlot(data4, width, height, useaxis);
//       } else if (chartType === "Boxplot") {
//         chartNode = chartUtils.createBoxplot(data5, width, height, useaxis);
//       } else if (chartType === "Scatter Plot With Fit Line") {
//         chartNode = chartUtils.createScatterPlotWithFitLine(
//           data4,
//           width,
//           height,
//           useaxis
//         );
//       } else if (chartType === "Vertical Stacked Bar Chart") {
//         chartNode = chartUtils.createVerticalStackedBarChart(
//           data6,
//           width,
//           height,
//           useaxis
//         );
//       } else if (chartType === "Horizontal Stacked Bar Chart") {
//         chartNode = chartUtils.createHorizontalStackedBarChart(
//           data6,
//           width,
//           height,
//           useaxis
//         );
//       } else if (chartType === "Clustered Bar Chart") {
//         chartNode = chartUtils.createClusteredBarChart(
//           data6,
//           width,
//           height,
//           useaxis
//         );
//       } else if (chartType === "Multiple Line Chart") {
//         chartNode = chartUtils.createMultipleLineChart(
//           data7,
//           width,
//           height,
//           useaxis
//         );
//       } else if (chartType === "Error Bar Chart") {
//         chartNode = chartUtils.createErrorBarChart(
//           data8,
//           width,
//           height,
//           useaxis
//         );
//       } else if (chartType === "Stacked Area Chart") {
//         chartNode = chartUtils.createStackedAreaChart(
//           data9,
//           width,
//           height,
//           useaxis
//         );
//       } else if (chartType === "Grouped Scatter Plot") {
//         chartNode = chartUtils.createGroupedScatterPlot(
//           data10,
//           width,
//           height,
//           useaxis
//         );
//       } else if (chartType === "Dot Plot") {
//         chartNode = chartUtils.createDotPlot(data11, width, height, useaxis);
//       } else if (chartType === "Population Pyramid") {
//         chartNode = chartUtils.createPopulationPyramid(
//           data12,
//           width,
//           height,
//           useaxis
//         );
//       } else if (chartType === "Frequency Polygon") {
//         chartNode = chartUtils.createFrequencyPolygon(
//           data3,
//           width,
//           height,
//           useaxis
//         );
//       } else if (chartType === "Clustered Error Bar Chart") {
//         chartNode = chartUtils.createClusteredErrorBarChart(
//           data15,
//           width,
//           height,
//           useaxis
//         );
//       } else if (chartType === "Scatter Plot Matrix") {
//         chartNode = chartUtils.createScatterPlotMatrix(
//           data16,
//           Math.max(width, height),
//           Math.max(width, height),
//           useaxis
//         );
//       } else if (chartType === "Stacked Histogram") {
//         chartNode = chartUtils.createStackedHistogram(
//           data17,
//           width,
//           height,
//           useaxis
//         );
//       } else if (chartType === "Clustered Boxplot") {
//         chartNode = chartUtils.createClusteredBoxplot(
//           data18,
//           width,
//           height,
//           useaxis
//         );
//       } else if (chartType === "1-D Boxplot") {
//         chartNode = chartUtils.create1DBoxplot(data1, width, height, useaxis);
//       } else if (chartType === "Simple Range Bar") {
//         chartNode = chartUtils.createSimpleRangeBar(
//           data19,
//           width,
//           height,
//           useaxis
//         );
//       } else if (chartType === "High-Low-Close Chart") {
//         chartNode = chartUtils.createHighLowCloseChart(
//           data19,
//           width,
//           height,
//           useaxis
//         );
//       } else if (chartType === "Clustered Range Bar") {
//         chartNode = chartUtils.createClusteredRangeBar(
//           data20,
//           width,
//           height,
//           useaxis
//         );
//       } else if (chartType === "Difference Area") {
//         chartNode = chartUtils.createDifferenceArea(
//           data21,
//           width,
//           height,
//           useaxis
//         );
//       } else if (chartType === "Vertical Bar & Line Chart") {
//         chartNode = chartUtils.createBarAndLineChart(
//           data22,
//           width,
//           height,
//           useaxis
//         );
//       } else if (chartType === "Dual Axes Scatter Plot") {
//         chartNode = chartUtils.createDualAxesScatterPlot(
//           data23,
//           width,
//           height,
//           useaxis
//         );
//       } else if (chartType === "Drop Line Chart") {
//         chartNode = chartUtils.createDropLineChart(
//           data24,
//           width,
//           height,
//           useaxis
//         );
//       } else if (chartType === "Summary Point Plot") {
//         chartNode = chartUtils.createSummaryPointPlot(
//           data25,
//           width,
//           height,
//           useaxis
//         );
//       } else if (chartType === "Stem And Leaf Plot") {
//         chartNode = chartUtils.createStemAndLeafPlot(
//           data27,
//           width,
//           height,
//           false
//         );
//       } else if (chartType === "Violin Plot") {
//         chartNode = chartUtils.createViolinPlot(data28, width, height, false);
//       } else if (chartType === "Density Chart") {
//         chartNode = chartUtils.createDensityChart(data29, width, height, false);
//       } else if (chartType === "3D Bar Chart2") {
//         chartNode = chartUtils.create3DBarChart2(
//           [
//             { x: -5, y: 2, z: -5 },
//             { x: -4, y: 3, z: 6 },
//             { x: -3, y: 5, z: 4 },
//             { x: -2, y: 7, z: -6 },
//             { x: 0, y: 0, z: 0 },
//             { x: 2, y: 2, z: -6 },
//             { x: 2, y: 4, z: 7 },
//             { x: 3, y: 6, z: -5 },
//             { x: 4, y: 3, z: 2 },
//             { x: 5, y: 5, z: -9 },
//             { x: 6, y: 4, z: -2 },
//             { x: 7, y: 3, z: 5 },
//             { x: -7, y: 2, z: -6 },
//             { x: -6, y: 4, z: -2 },
//             { x: -5, y: 5, z: 5 },
//           ],
//           width,
//           height
//         );
//       } else if (chartType === "3D Scatter Plot") {
//         chartNode = chartUtils.create3DScatterPlot(
//           [
//             { x: -5, y: 2, z: -5 },
//             { x: -4, y: 3, z: 6 },
//             { x: -3, y: 5, z: 4 },
//             { x: -2, y: 7, z: -6 },
//             { x: 0, y: 0, z: 0 },
//             { x: 2, y: 2, z: -6 },
//             { x: 2, y: 4, z: 7 },
//             { x: 3, y: 6, z: -5 },
//             { x: 4, y: 3, z: 2 },
//             { x: 5, y: 5, z: -9 },
//             { x: 6, y: 4, z: -2 },
//             { x: 7, y: 3, z: 5 },
//             { x: -7, y: 2, z: -6 },
//             { x: -6, y: 4, z: -2 },
//             { x: -5, y: 5, z: 5 },
//           ],
//           width,
//           height
//         );
//       } else if (chartType === "Grouped 3D Scatter Plot") {
//         chartNode = chartUtils.createGrouped3DScatterPlot(
//           [
//             { x: 1, y: 2, z: 3, category: "A" },
//             { x: 1, y: 2, z: 3, category: "B" },
//             { x: 1, y: 2, z: 3, category: "C" },
//             { x: 1, y: 4, z: 3, category: "D" },
//             { x: 2, y: 4, z: 1, category: "A" },
//             { x: 3, y: 1, z: 2, category: "B" },
//             { x: 4, y: 3, z: 4, category: "B" },
//             { x: 5, y: 2, z: 5, category: "C" },
//             { x: 6, y: 5, z: 3, category: "C" },
//             { x: 7, y: 3, z: 2, category: "D" },
//             { x: 8, y: 4, z: 1, category: "D" },
//           ],
//           width,
//           height
//         );
//       } else if (chartType === "Clustered 3D Bar Chart") {
//         chartNode = chartUtils.createClustered3DBarChart(
//           [
//             { x: 1, z: 1, y: 6, category: "A" },
//             { x: 2, z: 1, y: 7, category: "A" },
//             { x: 2, z: 1, y: 6, category: "B" },
//             { x: 2, z: 1, y: 5, category: "C" },
//             { x: 2, z: 1, y: 6, category: "D" },
//             { x: 6, z: 4, y: 7, category: "A" },
//             { x: 6, z: 4, y: 6, category: "B" },
//             { x: 6, z: 4, y: 5, category: "C" },
//             { x: 6, z: 4, y: 6, category: "D" },
//             { x: 4, z: 7, y: 5, category: "A" },
//             { x: -4, z: 6, y: 3, category: "A" },
//             { x: -4, z: 6, y: 6, category: "B" },
//             { x: -4, z: 6, y: 7, category: "C" },
//             { x: -4, z: 6, y: 1, category: "D" },
//             { x: -4, z: 6, y: 4, category: "E" },
//             { x: -9, z: 8, y: 4, category: "A" },
//             { x: -9, z: 8, y: 6, category: "B" },
//             { x: -9, z: 8, y: 2, category: "E" },
//             { x: 8, z: -6, y: 3, category: "A" },
//             { x: 8, z: -6, y: 4, category: "B" },
//             { x: 8, z: -6, y: 9, category: "C" },
//             { x: 8, z: -6, y: 2, category: "D" },
//             { x: 8, z: -6, y: 5, category: "E" },
//             { x: -8, z: -2, y: 3, category: "A" },
//             { x: -8, z: -2, y: 6, category: "B" },
//             { x: -8, z: -2, y: 3, category: "C" },
//             { x: -8, z: -2, y: 1, category: "D" },
//             { x: -8, z: -2, y: 4, category: "E" },
//           ],
//           width,
//           height
//         );
//       } else if (chartType === "Stacked 3D Bar Chart") {
//         chartNode = chartUtils.createStacked3DBarChart(
//           [
//             { x: 1, z: 1, y: 6, category: "A" },
//             { x: 2, z: 6, y: 2, category: "A" },
//             { x: 2, z: 6, y: 3, category: "B" },
//             { x: 2, z: 6, y: 2, category: "C" },
//             { x: 2, z: 6, y: 1, category: "D" },
//             { x: 5, z: 4, y: 1, category: "A" },
//             { x: 5, z: 4, y: 2, category: "B" },
//             { x: 5, z: 4, y: 3, category: "C" },
//             { x: 5, z: 4, y: 1, category: "D" },
//             { x: 9, z: 7, y: 7, category: "A" },
//             { x: -4, z: 6, y: 3, category: "A" },
//             { x: -4, z: 6, y: 1, category: "B" },
//             { x: -4, z: 6, y: 2, category: "C" },
//             { x: -4, z: 6, y: 2, category: "D" },
//             { x: -4, z: 6, y: 1, category: "E" },
//             { x: -9, z: 8, y: 1, category: "A" },
//             { x: -9, z: 8, y: 2, category: "B" },
//             { x: -9, z: 8, y: 2, category: "E" },
//             { x: 8, z: -6, y: 3, category: "A" },
//             { x: 8, z: -6, y: 2, category: "B" },
//             { x: 8, z: -6, y: 1, category: "C" },
//             { x: 8, z: -6, y: 2, category: "D" },
//             { x: 8, z: -6, y: 2, category: "E" },
//             { x: -8, z: -2, y: 3, category: "A" },
//             { x: -8, z: -2, y: 2, category: "B" },
//             { x: -8, z: -2, y: 3, category: "C" },
//             { x: -8, z: -2, y: 1, category: "D" },
//             { x: -8, z: -2, y: 1, category: "E" },
//           ],
//           width,
//           height
//         );
//       }

//       // Append chart node to container if valid
//       if (chartContainerRef.current && chartNode) {
//         chartContainerRef.current.appendChild(chartNode);
//       }
//     }
//   }, [chartType, width, height, useaxis]);

//   return (
//     <div
//       ref={chartContainerRef}
//       className="chart-container w-full h-full flex items-center justify-center"
//     />
//   );
// };

// export default ChartSelection;
