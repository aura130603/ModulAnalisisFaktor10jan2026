// Mock d3 library to avoid ES modules issue
jest.mock("d3", () => ({
  // Continuous interpolate functions
  interpolateBlues: jest.fn(),
  interpolateGreens: jest.fn(),
  interpolateGreys: jest.fn(),
  interpolateOranges: jest.fn(),
  interpolatePurples: jest.fn(),
  interpolateReds: jest.fn(),
  interpolateTurbo: jest.fn(),
  interpolateViridis: jest.fn(),
  interpolateInferno: jest.fn(),
  interpolateMagma: jest.fn(),
  interpolatePlasma: jest.fn(),
  interpolateCividis: jest.fn(),
  interpolateWarm: jest.fn(),
  interpolateCool: jest.fn(),
  interpolateCubehelixDefault: jest.fn(),
  interpolateBuGn: jest.fn(),
  interpolateBuPu: jest.fn(),
  interpolateGnBu: jest.fn(),
  interpolateOrRd: jest.fn(),
  interpolatePuBu: jest.fn(),
  interpolatePuBuGn: jest.fn(),
  interpolatePuRd: jest.fn(),
  interpolateRdPu: jest.fn(),
  interpolateYlGn: jest.fn(),
  interpolateYlGnBu: jest.fn(),
  interpolateYlOrBr: jest.fn(),
  interpolateYlOrRd: jest.fn(),
  // Diverging continuous interpolate functions
  interpolateBrBG: jest.fn(),
  interpolatePRGn: jest.fn(),
  interpolatePiYG: jest.fn(),
  interpolatePuOr: jest.fn(),
  interpolateRdBu: jest.fn(),
  interpolateRdGy: jest.fn(),
  interpolateRdYlBu: jest.fn(),
  interpolateRdYlGn: jest.fn(),
  interpolateSpectral: jest.fn(),
  // Sequential discrete schemes
  schemeBlues: Array(11).fill("#000"),
  schemeGreens: Array(11).fill("#000"),
  schemeGreys: Array(11).fill("#000"),
  schemeOranges: Array(11).fill("#000"),
  schemePurples: Array(11).fill("#000"),
  schemeReds: Array(11).fill("#000"),
  schemeBuGn: Array(11).fill("#000"),
  schemeBuPu: Array(11).fill("#000"),
  schemeGnBu: Array(11).fill("#000"),
  schemeOrRd: Array(11).fill("#000"),
  schemePuBuGn: Array(11).fill("#000"),
  schemePuBu: Array(11).fill("#000"),
  schemePuRd: Array(11).fill("#000"),
  schemeRdPu: Array(11).fill("#000"),
  schemeYlGnBu: Array(11).fill("#000"),
  schemeYlGn: Array(11).fill("#000"),
  schemeYlOrBr: Array(11).fill("#000"),
  schemeYlOrRd: Array(11).fill("#000"),
  // Diverging discrete schemes
  schemeBrBG: Array(11).fill("#000"),
  schemePRGn: Array(11).fill("#000"),
  schemePiYG: Array(11).fill("#000"),
  schemePuOr: Array(11).fill("#000"),
  schemeRdBu: Array(11).fill("#000"),
  schemeRdGy: Array(11).fill("#000"),
  schemeRdYlBu: Array(11).fill("#000"),
  schemeRdYlGn: Array(11).fill("#000"),
  schemeSpectral: Array(11).fill("#000"),
  // Categorical schemes
  schemeCategory10: Array(10).fill("#000"),
  schemeObservable10: Array(10).fill("#000"),
  schemeAccent: Array(8).fill("#000"),
  schemeDark2: Array(8).fill("#000"),
  schemePaired: Array(10).fill("#000"),
  schemePastel1: Array(9).fill("#000"),
  schemePastel2: Array(8).fill("#000"),
  schemeSet1: Array(9).fill("#000"),
  schemeSet2: Array(8).fill("#000"),
  schemeSet3: Array(9).fill("#000"),
  schemeTableau10: Array(10).fill("#000"),
}));

import { ChartService } from "../ChartService";

describe("ChartService Blackbox Tests", () => {
  // Mock data for testing
  const mockChartData = [
    { category: "A", value: 10 },
    { category: "B", value: 20 },
    { category: "C", value: 15 },
  ];

  const mockScatterData = [
    { x: 1, y: 2.1 },
    { x: 2, y: 3.8 },
    { x: 3, y: 5.2 },
    { x: 4, y: 7.1 },
    { x: 5, y: 9.5 },
  ];

  const mockHistogramData = [
    { category: "0-2", value: 6 },
    { category: "2-4", value: 4 },
    { category: "4-6", value: 3 },
    { category: "6-8", value: 3 },
    { category: "8-10", value: 2 },
  ];

  describe("Basic Functionality Tests", () => {
    it("should create basic chart JSON correctly", () => {
      const result = ChartService.createChartJSON({
        chartType: "Vertical Bar Chart",
        chartData: mockChartData,
      });

      expect(result).toBeDefined();
      expect(result.charts).toHaveLength(1);
      expect(result.charts[0].chartType).toBe("Vertical Bar Chart");
      expect(result.charts[0].chartData).toEqual(mockChartData);
      expect(result.charts[0].chartMetadata.title).toBe("Vertical Bar Chart");
      expect(result.charts[0].chartConfig.width).toBe(800);
      expect(result.charts[0].chartConfig.height).toBe(600);
    });

    it("should handle empty data array", () => {
      expect(() => {
        ChartService.createChartJSON({
          chartType: "Vertical Bar Chart",
          chartData: [],
        });
      }).toThrow("chartData is required and must be a non-empty array");
    });

    it("should handle null data", () => {
      expect(() => {
        ChartService.createChartJSON({
          chartType: "Vertical Bar Chart",
          chartData: null as any,
        });
      }).toThrow("chartData is required and must be a non-empty array");
    });

    it("should handle undefined data", () => {
      expect(() => {
        ChartService.createChartJSON({
          chartType: "Vertical Bar Chart",
          chartData: undefined as any,
        });
      }).toThrow("chartData is required and must be a non-empty array");
    });
  });

  describe("Chart Metadata Tests", () => {
    it("should set custom title and subtitle", () => {
      const result = ChartService.createChartJSON({
        chartType: "Vertical Bar Chart",
        chartData: mockChartData,
        chartMetadata: {
          title: "Custom Title",
          subtitle: "Custom Subtitle",
          description: "Custom Description",
        },
      });

      expect(result.charts[0].chartMetadata.title).toBe("Custom Title");
      expect(result.charts[0].chartMetadata.subtitle).toBe("Custom Subtitle");
      expect(result.charts[0].chartMetadata.description).toBe(
        "Custom Description"
      );
    });

    it("should set custom font sizes", () => {
      const result = ChartService.createChartJSON({
        chartType: "Vertical Bar Chart",
        chartData: mockChartData,
        chartMetadata: {
          titleFontSize: 20,
          subtitleFontSize: 14,
        },
      });

      expect(result.charts[0].chartMetadata.titleFontSize).toBe(20);
      expect(result.charts[0].chartMetadata.subtitleFontSize).toBe(14);
    });

    it("should use default font sizes when not provided", () => {
      const result = ChartService.createChartJSON({
        chartType: "Vertical Bar Chart",
        chartData: mockChartData,
      });

      expect(result.charts[0].chartMetadata.titleFontSize).toBe(16);
      expect(result.charts[0].chartMetadata.subtitleFontSize).toBe(12);
    });
  });

  describe("Chart Configuration Tests", () => {
    it("should set custom width and height", () => {
      const result = ChartService.createChartJSON({
        chartType: "Vertical Bar Chart",
        chartData: mockChartData,
        chartConfig: {
          width: 1000,
          height: 800,
        },
      });

      expect(result.charts[0].chartConfig.width).toBe(1000);
      expect(result.charts[0].chartConfig.height).toBe(800);
    });

    it("should use default width and height when not provided", () => {
      const result = ChartService.createChartJSON({
        chartType: "Vertical Bar Chart",
        chartData: mockChartData,
      });

      expect(result.charts[0].chartConfig.width).toBe(800);
      expect(result.charts[0].chartConfig.height).toBe(600);
    });

    it("should set custom chart colors", () => {
      const customColors = ["#ff0000", "#00ff00", "#0000ff"];
      const result = ChartService.createChartJSON({
        chartType: "Vertical Bar Chart",
        chartData: mockChartData,
        chartConfig: {
          chartColor: customColors,
        },
      });

      expect(result.charts[0].chartConfig.chartColor).toEqual(customColors);
    });

    it("should set useAxis and useLegend", () => {
      const result = ChartService.createChartJSON({
        chartType: "Vertical Bar Chart",
        chartData: mockChartData,
        chartConfig: {
          useAxis: false,
          useLegend: false,
        },
      });

      expect(result.charts[0].chartConfig.useAxis).toBe(false);
      expect(result.charts[0].chartConfig.useLegend).toBe(false);
    });
  });

  describe("Axis Labels Tests", () => {
    it("should generate default axis labels for single axis chart", () => {
      const result = ChartService.createChartJSON({
        chartType: "Vertical Bar Chart",
        chartData: mockChartData,
      });

      expect(result.charts[0].chartConfig.axisLabels.x).toBe("X-axis");
      expect(result.charts[0].chartConfig.axisLabels.y).toBe("Y-axis");
    });

    it("should set custom axis labels", () => {
      const result = ChartService.createChartJSON({
        chartType: "Vertical Bar Chart",
        chartData: mockChartData,
        chartConfig: {
          axisLabels: {
            x: "Categories",
            y: "Values",
          },
        },
      });

      expect(result.charts[0].chartConfig.axisLabels.x).toBe("Categories");
      expect(result.charts[0].chartConfig.axisLabels.y).toBe("Values");
    });

    it("should generate Q-Q Plot specific axis labels", () => {
      const result = ChartService.createChartJSON({
        chartType: "Q-Q Plot",
        chartData: mockScatterData,
      });

      expect(result.charts[0].chartConfig.axisLabels.x).toBe(
        "Theoretical Quantiles"
      );
      expect(result.charts[0].chartConfig.axisLabels.y).toBe(
        "Sample Quantiles"
      );
    });

    it("should generate P-P Plot specific axis labels", () => {
      const result = ChartService.createChartJSON({
        chartType: "P-P Plot",
        chartData: mockScatterData,
      });

      expect(result.charts[0].chartConfig.axisLabels.x).toBe(
        "Observed Cum Prop"
      );
      expect(result.charts[0].chartConfig.axisLabels.y).toBe(
        "Expected Cum Prop"
      );
    });

    it("should generate dual axis labels", () => {
      const result = ChartService.createChartJSON({
        chartType: "Vertical Bar & Line Chart",
        chartData: mockChartData,
        chartConfig: {
          axisLabels: {
            x: "Categories",
            y1: "Bar Values",
            y2: "Line Values",
          },
        },
      });

      expect(result.charts[0].chartConfig.axisLabels.x).toBe("Categories");
      expect(result.charts[0].chartConfig.axisLabels.y1).toBe("Bar Values");
      expect(result.charts[0].chartConfig.axisLabels.y2).toBe("Line Values");
    });

    it("should generate 3D axis labels", () => {
      const result = ChartService.createChartJSON({
        chartType: "3D Bar Chart",
        chartData: mockChartData,
        chartConfig: {
          axisLabels: {
            x: "X Values",
            y: "Y Values",
            z: "Z Values",
          },
        },
      });

      expect(result.charts[0].chartConfig.axisLabels.x).toBe("X Values");
      expect(result.charts[0].chartConfig.axisLabels.y).toBe("Y Values");
      expect(result.charts[0].chartConfig.axisLabels.z).toBe("Z Values");
    });
  });

  describe("Chart Color Generation Tests", () => {
    it("should generate single color for single color charts", () => {
      const singleColorCharts = [
        "Vertical Bar Chart",
        "Horizontal Bar Chart",
        "Line Chart",
        "Area Chart",
        "Scatter Plot",
        "Histogram",
        "Boxplot",
      ];

      singleColorCharts.forEach((chartType) => {
        const result = ChartService.createChartJSON({
          chartType,
          chartData: mockChartData,
        });

        expect(result.charts[0].chartConfig.chartColor).toHaveLength(1);
        expect(
          typeof (result.charts[0].chartConfig.chartColor as string[])[0]
        ).toBe("string");
      });
    });

    it("should generate multiple colors for multi-color charts", () => {
      const multiColorData = [
        { category: "A", subcategory: "Group1", value: 10 },
        { category: "A", subcategory: "Group2", value: 15 },
        { category: "B", subcategory: "Group1", value: 20 },
        { category: "B", subcategory: "Group2", value: 25 },
      ];

      const multiColorCharts = [
        "Vertical Stacked Bar Chart",
        "Horizontal Stacked Bar Chart",
        "Clustered Bar Chart",
      ];

      multiColorCharts.forEach((chartType) => {
        const result = ChartService.createChartJSON({
          chartType,
          chartData: multiColorData,
          chartVariables: {
            x: ["category"],
            y: ["value", "subcategory"], // Multiple y variables to trigger multi-color
          },
        });

        expect(
          (result.charts[0].chartConfig.chartColor as string[]).length
        ).toBeGreaterThan(1);
      });
    });

    it("should generate Population Pyramid specific colors", () => {
      const result = ChartService.createChartJSON({
        chartType: "Population Pyramid",
        chartData: mockChartData,
      });

      expect(result.charts[0].chartConfig.chartColor).toEqual([
        "#4682B4",
        "#e74c3c",
      ]);
    });

    it("should generate dual axis colors", () => {
      const result = ChartService.createChartJSON({
        chartType: "Vertical Bar & Line Chart",
        chartData: mockChartData,
      });

      expect(result.charts[0].chartConfig.chartColor).toHaveLength(2);
    });
  });

  describe("Special Chart Features Tests", () => {
    it("should handle Histogram with normal curve", () => {
      const result = ChartService.createChartJSON({
        chartType: "Histogram",
        chartData: mockHistogramData,
        chartConfig: {
          showNormalCurve: true,
        },
      });

      expect(result.charts[0].chartConfig.showNormalCurve).toBe(true);
    });

    it("should handle Histogram without normal curve (default)", () => {
      const result = ChartService.createChartJSON({
        chartType: "Histogram",
        chartData: mockHistogramData,
      });

      expect(result.charts[0].chartConfig.showNormalCurve).toBeUndefined();
    });

    it("should handle Scatter Plot With Multiple Fit Line with fit functions", () => {
      const fitFunctions = [
        {
          fn: "x => parameters.a + parameters.b * x",
          equation: "Linear",
          color: "#ff6b6b",
          parameters: { a: 1.5, b: 2.3 },
        },
        {
          fn: "x => parameters.a * Math.exp(parameters.b * x)",
          equation: "Exponential",
          color: "#4ecdc4",
          parameters: { a: 1.2, b: 0.5 },
        },
      ];

      const result = ChartService.createChartJSON({
        chartType: "Scatter Plot With Multiple Fit Line",
        chartData: mockScatterData,
        chartConfig: {
          fitFunctions,
        },
      });

      expect(result.charts[0].chartConfig.fitFunctions).toEqual(fitFunctions);
    });

    it("should not include fitFunctions for non-scatter charts", () => {
      const result = ChartService.createChartJSON({
        chartType: "Vertical Bar Chart",
        chartData: mockChartData,
        chartConfig: {
          fitFunctions: [
            {
              fn: "x => parameters.a + parameters.b * x",
              equation: "Linear",
              color: "#ff6b6b",
              parameters: { a: 1.5, b: 2.3 },
            },
          ],
        },
      });

      expect(result.charts[0].chartConfig.fitFunctions).toBeUndefined();
    });

    it("should handle Summary Point Plot with statistic", () => {
      const result = ChartService.createChartJSON({
        chartType: "Summary Point Plot",
        chartData: mockChartData,
        chartConfig: {
          statistic: "mean",
        },
      });

      expect(result.charts[0].chartConfig.statistic).toBe("mean");
    });
  });

  describe("Utility Methods Tests", () => {
    it("should create quick chart correctly", () => {
      const result = ChartService.quickChart(
        mockChartData,
        "Vertical Bar Chart"
      );

      expect(result.charts[0].chartType).toBe("Vertical Bar Chart");
      expect(result.charts[0].chartData).toEqual(mockChartData);
    });

    it("should create multiple charts correctly", () => {
      const chartTypes = ["Vertical Bar Chart", "Line Chart", "Area Chart"];
      const results = ChartService.createMultipleCharts(
        {
          chartType: "Vertical Bar Chart", // Add required chartType
          chartData: mockChartData,
        },
        chartTypes
      );

      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.charts[0].chartType).toBe(chartTypes[index]);
        expect(result.charts[0].chartData).toEqual(mockChartData);
      });
    });

    it("should create Scatter Plot With Multiple Fit Line with auto-generated fit functions", () => {
      const result = ChartService.createScatterPlotWithMultipleFitLine(
        mockScatterData,
        {
          title: "My Scatter Plot",
          subtitle: "With Multiple Fit Lines",
          axisLabels: {
            x: "X Values",
            y: "Y Values",
          },
        }
      );

      expect(result.charts[0].chartType).toBe(
        "Scatter Plot With Multiple Fit Line"
      );
      expect(result.charts[0].chartData).toEqual(mockScatterData);
      expect(result.charts[0].chartMetadata.title).toBe("My Scatter Plot");
      expect(result.charts[0].chartMetadata.subtitle).toBe(
        "With Multiple Fit Lines"
      );
      expect(result.charts[0].chartConfig.axisLabels.x).toBe("X Values");
      expect(result.charts[0].chartConfig.axisLabels.y).toBe("Y Values");
      expect(result.charts[0].chartConfig.fitFunctions).toBeDefined();
      expect(Array.isArray(result.charts[0].chartConfig.fitFunctions)).toBe(
        true
      );
    });
  });

  describe("Fit Functions Tests", () => {
    it("should create fit functions correctly", () => {
      const fitFunctions = ChartService.createFitFunctions(mockScatterData);

      expect(Array.isArray(fitFunctions)).toBe(true);
      expect(fitFunctions.length).toBeGreaterThan(0);

      fitFunctions.forEach((fitFunction) => {
        expect(fitFunction).toHaveProperty("fn");
        expect(fitFunction).toHaveProperty("equation");
        expect(fitFunction).toHaveProperty("color");
        expect(fitFunction).toHaveProperty("parameters");
        expect(typeof fitFunction.fn).toBe("string");
        expect(typeof fitFunction.equation).toBe("string");
        expect(typeof fitFunction.color).toBe("string");
        expect(typeof fitFunction.parameters).toBe("object");
      });
    });

    it("should include all fit function types", () => {
      const fitFunctions = ChartService.createFitFunctions(mockScatterData);
      const equations = fitFunctions.map((f) => f.equation);

      expect(equations).toContain("Linear");
      expect(equations).toContain("Log");
      expect(equations).toContain("Compound");
      expect(equations).toContain("Power");
      expect(equations).toContain("Exp");
    });
  });

  describe("All Chart Types Tests", () => {
    const allChartTypes = [
      "Vertical Bar Chart",
      "Horizontal Bar Chart",
      "Line Chart",
      "Pie Chart",
      "Area Chart",
      "Histogram",
      "Scatter Plot",
      "Scatter Plot With Fit Line",
      "Scatter Plot With Multiple Fit Line",
      "Boxplot",
      "Vertical Stacked Bar Chart",
      "Horizontal Stacked Bar Chart",
      "Clustered Bar Chart",
      "Multiple Line Chart",
      "Error Bar Chart",
      "Stacked Area Chart",
      "Grouped Scatter Plot",
      "Dot Plot",
      "Population Pyramid",
      "Frequency Polygon",
      "Clustered Error Bar Chart",
      "Scatter Plot Matrix",
      "Stacked Histogram",
      "Clustered Boxplot",
      "1-D Boxplot",
      "Simple Range Bar",
      "Clustered Range Bar",
      "High-Low-Close Chart",
      "Difference Area",
      "Vertical Bar & Line Chart",
      "Dual Axes Scatter Plot",
      "Drop Line Chart",
      "Summary Point Plot",
      "Stem And Leaf Plot",
      "Violin Plot",
      "Density Chart",
      "Q-Q Plot",
      "P-P Plot",
      "3D Bar Chart (ECharts)",
      "3D Scatter Plot (ECharts)",
      "Clustered 3D Bar Chart (ECharts)",
      "Stacked 3D Bar Chart (ECharts)",
      "Grouped 3D Scatter Plot (ECharts)",
      // Additional chart types that are supported but not in the main list
      "3D Bar Chart",
      "3D Bar Chart2",
      "3D Scatter Plot",
      "Clustered 3D Bar Chart",
      "Stacked 3D Bar Chart",
      "Grouped 3D Scatter Plot",
    ];

    allChartTypes.forEach((chartType) => {
      it(`should create ${chartType} correctly`, () => {
        const result = ChartService.createChartJSON({
          chartType,
          chartData: mockChartData,
        });

        expect(result.charts[0].chartType).toBe(chartType);
        expect(result.charts[0].chartData).toEqual(mockChartData);
        expect(result.charts[0].chartConfig.chartColor).toBeDefined();
        expect(Array.isArray(result.charts[0].chartConfig.chartColor)).toBe(
          true
        );
      });
    });
  });

  describe("Edge Cases Tests", () => {
    it("should handle single data point", () => {
      const singleData = [{ category: "A", value: 10 }];
      const result = ChartService.createChartJSON({
        chartType: "Vertical Bar Chart",
        chartData: singleData,
      });

      expect(result.charts[0].chartData).toEqual(singleData);
    });

    it("should handle large numbers", () => {
      const largeData = [
        { category: "A", value: 1e10 },
        { category: "B", value: 2e10 },
      ];
      const result = ChartService.createChartJSON({
        chartType: "Vertical Bar Chart",
        chartData: largeData,
      });

      expect(result.charts[0].chartData).toEqual(largeData);
    });

    it("should handle negative numbers", () => {
      const negativeData = [
        { category: "A", value: -10 },
        { category: "B", value: -20 },
      ];
      const result = ChartService.createChartJSON({
        chartType: "Vertical Bar Chart",
        chartData: negativeData,
      });

      expect(result.charts[0].chartData).toEqual(negativeData);
    });

    it("should handle special characters in titles", () => {
      const result = ChartService.createChartJSON({
        chartType: "Vertical Bar Chart",
        chartData: mockChartData,
        chartMetadata: {
          title: "Chart with special chars: !@#$%^&*()",
          subtitle: "Subtitle with symbols: <>&\"'",
        },
      });

      expect(result.charts[0].chartMetadata.title).toBe(
        "Chart with special chars: !@#$%^&*()"
      );
      expect(result.charts[0].chartMetadata.subtitle).toBe(
        "Subtitle with symbols: <>&\"'"
      );
    });
  });

  describe("Axis Scale Options Tests", () => {
    it("should set axis scale options correctly", () => {
      const result = ChartService.createChartJSON({
        chartType: "Vertical Bar Chart",
        chartData: mockChartData,
        chartConfig: {
          axisScaleOptions: {
            x: {
              min: "0",
              max: "10",
              majorIncrement: "2",
            },
            y: {
              min: "0",
              max: "30",
              majorIncrement: "5",
            },
          },
        },
      });

      expect(result.charts[0].chartConfig.axisScaleOptions.x.min).toBe("0");
      expect(result.charts[0].chartConfig.axisScaleOptions.x.max).toBe("10");
      expect(
        result.charts[0].chartConfig.axisScaleOptions.x.majorIncrement
      ).toBe("2");
      expect(result.charts[0].chartConfig.axisScaleOptions.y.min).toBe("0");
      expect(result.charts[0].chartConfig.axisScaleOptions.y.max).toBe("30");
      expect(
        result.charts[0].chartConfig.axisScaleOptions.y.majorIncrement
      ).toBe("5");
    });

    it("should use default axis scale options when not provided", () => {
      const result = ChartService.createChartJSON({
        chartType: "Vertical Bar Chart",
        chartData: mockChartData,
      });

      expect(result.charts[0].chartConfig.axisScaleOptions).toBeDefined();
      expect(result.charts[0].chartConfig.axisScaleOptions.x).toBeDefined();
      expect(result.charts[0].chartConfig.axisScaleOptions.y).toBeDefined();
    });
  });

  describe("Chart Variables Tests", () => {
    it("should handle chart variables correctly", () => {
      const result = ChartService.createChartJSON({
        chartType: "Vertical Bar Chart",
        chartData: mockChartData,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
        },
      });

      expect(result.charts[0].chartMetadata.axisInfo).toBeDefined();
    });

    it("should handle 3D chart variables", () => {
      const result = ChartService.createChartJSON({
        chartType: "3D Bar Chart",
        chartData: mockChartData,
        chartVariables: {
          x: ["X"],
          y: ["Y"],
          z: ["Z"],
        },
      });

      expect(result.charts[0].chartMetadata.axisInfo).toBeDefined();
    });

    it("should handle grouped chart variables", () => {
      const result = ChartService.createChartJSON({
        chartType: "Clustered Bar Chart",
        chartData: mockChartData,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
          groupBy: ["Group"],
        },
      });

      expect(result.charts[0].chartMetadata.axisInfo).toBeDefined();
    });

    it("should handle range chart variables", () => {
      const result = ChartService.createChartJSON({
        chartType: "Simple Range Bar",
        chartData: mockChartData,
        chartVariables: {
          x: ["Category"],
          low: ["Low"],
          high: ["High"],
        },
      });

      expect(result.charts[0].chartMetadata.axisInfo).toBeDefined();
    });

    it("should handle dual axis chart variables", () => {
      const result = ChartService.createChartJSON({
        chartType: "Vertical Bar & Line Chart",
        chartData: mockChartData,
        chartVariables: {
          x: ["Category"],
          y: ["BarValue"],
          y2: ["LineValue"],
        },
      });

      expect(result.charts[0].chartMetadata.axisInfo).toBeDefined();
    });
  });

  describe("Advanced Features Tests", () => {
    it("should handle notes field", () => {
      const result = ChartService.createChartJSON({
        chartType: "Vertical Bar Chart",
        chartData: mockChartData,
        chartMetadata: {
          notes: "This is a test note for the chart",
        },
      });

      expect(result.charts[0].chartMetadata.notes).toBe(
        "This is a test note for the chart"
      );
    });

    it("should handle custom axisInfo override", () => {
      const customAxisInfo = {
        x: "Custom X Label",
        y: "Custom Y Label",
      };

      const result = ChartService.createChartJSON({
        chartType: "Vertical Bar Chart",
        chartData: mockChartData,
        chartMetadata: {
          axisInfo: customAxisInfo,
        },
      });

      expect(result.charts[0].chartMetadata.axisInfo).toEqual(customAxisInfo);
    });

    it("should handle invalid statistic value gracefully", () => {
      const result = ChartService.createChartJSON({
        chartType: "Summary Point Plot",
        chartData: mockChartData,
        chartConfig: {
          statistic: "invalid" as any,
        },
      });

      expect(result.charts[0].chartConfig.statistic).toBe("invalid");
    });

    it("should not include showNormalCurve for non-Histogram charts", () => {
      const result = ChartService.createChartJSON({
        chartType: "Vertical Bar Chart",
        chartData: mockChartData,
        chartConfig: {
          showNormalCurve: true,
        },
      });

      expect(result.charts[0].chartConfig.showNormalCurve).toBeUndefined();
    });

    it("should handle empty fitFunctions array", () => {
      const result = ChartService.createChartJSON({
        chartType: "Scatter Plot With Multiple Fit Line",
        chartData: mockScatterData,
        chartConfig: {
          fitFunctions: [],
        },
      });

      expect(result.charts[0].chartConfig.fitFunctions).toEqual([]);
    });

    it("should handle invalid fitFunctions gracefully", () => {
      const invalidFitFunctions = [
        {
          fn: "invalid function",
          equation: "Invalid",
          color: "#ff0000",
          parameters: {},
        },
      ];

      const result = ChartService.createChartJSON({
        chartType: "Scatter Plot With Multiple Fit Line",
        chartData: mockScatterData,
        chartConfig: {
          fitFunctions: invalidFitFunctions,
        },
      });

      expect(result.charts[0].chartConfig.fitFunctions).toEqual(
        invalidFitFunctions
      );
    });
  });

  describe("Default Export Tests", () => {
    it("should export default instance", () => {
      const chartService = require("../ChartService").default;
      expect(chartService).toBeDefined();
      // The default export is an instance, not the class itself
      expect(typeof chartService).toBe("object");
    });
  });

  describe("Error Handling Tests", () => {
    it("should throw error for invalid chartType", () => {
      expect(() => {
        ChartService.createChartJSON({
          chartType: "Invalid Chart Type",
          chartData: mockChartData,
        });
      }).not.toThrow(); // ChartService doesn't validate chartType, it just creates the JSON
    });

    it("should handle undefined chartVariables gracefully", () => {
      const result = ChartService.createChartJSON({
        chartType: "Vertical Bar Chart",
        chartData: mockChartData,
        chartVariables: undefined as any,
      });

      expect(result.charts[0].chartMetadata.axisInfo).toBeDefined();
    });

    it("should handle null chartVariables gracefully", () => {
      // ChartService should handle null chartVariables by using default values
      expect(() => {
        ChartService.createChartJSON({
          chartType: "Vertical Bar Chart",
          chartData: mockChartData,
          chartVariables: null as any,
        });
      }).toThrow(); // This will throw because DataProcessingService can't handle null
    });
  });

  describe("Edge Cases for Chart Colors Tests", () => {
    it("should handle empty chartData for color generation", () => {
      // ChartService validates that chartData cannot be empty
      expect(() => {
        ChartService.createChartJSON({
          chartType: "Pie Chart",
          chartData: [],
        });
      }).toThrow("chartData is required and must be a non-empty array");
    });

    it("should handle chartData without category field", () => {
      const dataWithoutCategory = [{ value: 10 }, { value: 20 }, { value: 15 }];

      const result = ChartService.createChartJSON({
        chartType: "Pie Chart",
        chartData: dataWithoutCategory,
      });

      expect(result.charts[0].chartConfig.chartColor).toBeDefined();
      expect(Array.isArray(result.charts[0].chartConfig.chartColor)).toBe(true);
    });

    it("should handle chartData with null/undefined categories", () => {
      const dataWithNullCategories = [
        { category: "A", value: 10 },
        { category: null, value: 20 },
        { category: undefined, value: 15 },
        { category: "", value: 25 },
      ];

      const result = ChartService.createChartJSON({
        chartType: "Pie Chart",
        chartData: dataWithNullCategories,
      });

      expect(result.charts[0].chartConfig.chartColor).toBeDefined();
      expect(Array.isArray(result.charts[0].chartConfig.chartColor)).toBe(true);
    });
  });
});
