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

// Mock DataProcessingService
jest.mock("../DataProcessingService", () => ({
  DataProcessingService: {
    generateAxisInfo: jest.fn((chartType, chartVariables) => ({
      x: chartVariables?.x?.[0] || "Category",
      y: chartVariables?.y?.[0] || "Value",
    })),
  },
}));

import { ChartService } from "../ChartService";

describe("ChartService Unit Tests", () => {
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

  describe("createChartJSON Method - Unit Tests", () => {
    describe("Input Validation", () => {
      it("should validate chartData is required", () => {
        expect(() => {
          ChartService.createChartJSON({
            chartType: "Vertical Bar Chart",
            chartData: undefined as any,
          });
        }).toThrow("chartData is required and must be a non-empty array");
      });

      it("should validate chartData is an array", () => {
        expect(() => {
          ChartService.createChartJSON({
            chartType: "Vertical Bar Chart",
            chartData: "not an array" as any,
          });
        }).toThrow("chartData is required and must be a non-empty array");
      });

      it("should validate chartData is not empty", () => {
        expect(() => {
          ChartService.createChartJSON({
            chartType: "Vertical Bar Chart",
            chartData: [],
          });
        }).toThrow("chartData is required and must be a non-empty array");
      });

      it("should accept valid chartData", () => {
        expect(() => {
          ChartService.createChartJSON({
            chartType: "Vertical Bar Chart",
            chartData: mockChartData,
          });
        }).not.toThrow();
      });
    });

    describe("Default Values", () => {
      it("should use default width and height when not provided", () => {
        const result = ChartService.createChartJSON({
          chartType: "Vertical Bar Chart",
          chartData: mockChartData,
        });

        expect(result.charts[0].chartConfig.width).toBe(800);
        expect(result.charts[0].chartConfig.height).toBe(600);
      });

      it("should use default titleFontSize and subtitleFontSize when not provided", () => {
        const result = ChartService.createChartJSON({
          chartType: "Vertical Bar Chart",
          chartData: mockChartData,
        });

        expect(result.charts[0].chartMetadata.titleFontSize).toBe(16);
        expect(result.charts[0].chartMetadata.subtitleFontSize).toBe(12);
      });

      it("should use default useAxis and useLegend when not provided", () => {
        const result = ChartService.createChartJSON({
          chartType: "Vertical Bar Chart",
          chartData: mockChartData,
        });

        expect(result.charts[0].chartConfig.useAxis).toBe(true);
        expect(result.charts[0].chartConfig.useLegend).toBe(true);
      });
    });

    describe("Title Generation", () => {
      it("should use provided title", () => {
        const result = ChartService.createChartJSON({
          chartType: "Vertical Bar Chart",
          chartData: mockChartData,
          chartMetadata: {
            title: "Custom Title",
          },
        });

        expect(result.charts[0].chartMetadata.title).toBe("Custom Title");
      });

      it("should generate default title from chartType when not provided", () => {
        const result = ChartService.createChartJSON({
          chartType: "Vertical Bar Chart",
          chartData: mockChartData,
        });

        expect(result.charts[0].chartMetadata.title).toBe("Vertical Bar Chart");
      });

      it("should handle empty title", () => {
        const result = ChartService.createChartJSON({
          chartType: "Vertical Bar Chart",
          chartData: mockChartData,
          chartMetadata: {
            title: "",
          },
        });

        expect(result.charts[0].chartMetadata.title).toBe("Vertical Bar Chart"); // Empty string falls back to chartType
      });
    });

    describe("Subtitle and Description", () => {
      it("should use provided subtitle", () => {
        const result = ChartService.createChartJSON({
          chartType: "Vertical Bar Chart",
          chartData: mockChartData,
          chartMetadata: {
            subtitle: "Custom Subtitle",
          },
        });

        expect(result.charts[0].chartMetadata.subtitle).toBe("Custom Subtitle");
      });

      it("should use provided description", () => {
        const result = ChartService.createChartJSON({
          chartType: "Vertical Bar Chart",
          chartData: mockChartData,
          chartMetadata: {
            description: "Custom Description",
          },
        });

        expect(result.charts[0].chartMetadata.description).toBe(
          "Custom Description"
        );
      });

      it("should use empty string for description when not provided", () => {
        const result = ChartService.createChartJSON({
          chartType: "Vertical Bar Chart",
          chartData: mockChartData,
        });

        expect(result.charts[0].chartMetadata.description).toBe("");
      });
    });
  });

  describe("createFitFunctions Method - Unit Tests", () => {
    // describe("Linear Fit", () => {
    //   it("should calculate linear fit correctly", () => {
    //     const data = [
    //       { x: 1, y: 2 },
    //       { x: 2, y: 4 },
    //       { x: 3, y: 6 },
    //     ];

    //     const fitFunctions = ChartService.createFitFunctions(data);
    //     const linearFit = fitFunctions.find((f) => f.equation === "Linear");

    //     expect(linearFit).toBeDefined();
    //     expect(linearFit?.parameters).toBeDefined();
    //     expect(typeof linearFit?.fn).toBe("string");
    //   });

    //   it("should handle single data point", () => {
    //     const data = [{ x: 1, y: 2 }];

    //     const fitFunctions = ChartService.createFitFunctions(data);
    //     const linearFit = fitFunctions.find((f) => f.equation === "Linear");

    //     expect(linearFit).toBeDefined();
    //     expect(linearFit?.parameters).toBeDefined();
    //   });

    //   it("should handle zero values", () => {
    //     const data = [
    //       { x: 0, y: 0 },
    //       { x: 1, y: 1 },
    //       { x: 2, y: 2 },
    //     ];

    //     const fitFunctions = ChartService.createFitFunctions(data);
    //     const linearFit = fitFunctions.find((f) => f.equation === "Linear");

    //     expect(linearFit).toBeDefined();
    //     expect(linearFit?.parameters).toBeDefined();
    //   });
    // });

    // describe("Exponential Fit", () => {
    //   it("should calculate exponential fit correctly", () => {
    //     const data = [
    //       { x: 1, y: 2 },
    //       { x: 2, y: 4 },
    //       { x: 3, y: 8 },
    //     ];

    //     const fitFunctions = ChartService.createFitFunctions(data);
    //     const expFit = fitFunctions.find((f) => f.equation === "Exp");

    //     expect(expFit).toBeDefined();
    //     expect(expFit?.parameters).toBeDefined();
    //   });

    //   it("should handle negative y values by filtering them out", () => {
    //     const data = [
    //       { x: 1, y: 2 },
    //       { x: 2, y: -1 }, // This should be filtered out
    //       { x: 3, y: 8 },
    //     ];

    //     const fitFunctions = ChartService.createFitFunctions(data);
    //     const expFit = fitFunctions.find((f) => f.equation === "Exp");

    //     expect(expFit).toBeDefined();
    //     expect(expFit?.parameters).toBeDefined();
    //   });
    // });

    // describe("Logarithmic Fit", () => {
    //   it("should calculate logarithmic fit correctly", () => {
    //     const data = [
    //       { x: 1, y: 0 },
    //       { x: 2, y: 0.69 },
    //       { x: 3, y: 1.1 },
    //     ];

    //     const fitFunctions = ChartService.createFitFunctions(data);
    //     const logFit = fitFunctions.find((f) => f.equation === "Log");

    //     expect(logFit).toBeDefined();
    //     expect(logFit?.parameters).toBeDefined();
    //   });

    //   it("should handle zero x values by filtering them out", () => {
    //     const data = [
    //       { x: 0, y: 1 }, // This should be filtered out
    //       { x: 1, y: 0 },
    //       { x: 2, y: 0.69 },
    //     ];

    //     const fitFunctions = ChartService.createFitFunctions(data);
    //     const logFit = fitFunctions.find((f) => f.equation === "Log");

    //     expect(logFit).toBeDefined();
    //     expect(logFit?.parameters).toBeDefined();
    //   });
    // });

    // describe("Power Fit", () => {
    //   it("should calculate power fit correctly", () => {
    //     const data = [
    //       { x: 1, y: 1 },
    //       { x: 2, y: 4 },
    //       { x: 3, y: 9 },
    //     ];

    //     const fitFunctions = ChartService.createFitFunctions(data);
    //     const powerFit = fitFunctions.find((f) => f.equation === "Power");

    //     expect(powerFit).toBeDefined();
    //     expect(powerFit?.parameters).toBeDefined();
    //   });

    //   it("should handle negative x and y values by filtering them out", () => {
    //     const data = [
    //       { x: -1, y: 1 }, // This should be filtered out
    //       { x: 1, y: -1 }, // This should be filtered out
    //       { x: 2, y: 4 },
    //     ];

    //     const fitFunctions = ChartService.createFitFunctions(data);
    //     const powerFit = fitFunctions.find((f) => f.equation === "Power");

    //     expect(powerFit).toBeDefined();
    //     expect(powerFit?.parameters).toBeDefined();
    //   });
    // });

    // describe("Compound Fit", () => {
    //   it("should calculate compound fit correctly", () => {
    //     const data = [
    //       { x: 1, y: 2 },
    //       { x: 2, y: 4 },
    //       { x: 3, y: 8 },
    //     ];

    //     const fitFunctions = ChartService.createFitFunctions(data);
    //     const compoundFit = fitFunctions.find((f) => f.equation === "Compound");

    //     expect(compoundFit).toBeDefined();
    //     expect(compoundFit?.parameters).toBeDefined();
    //   });
    // });

    describe("Return Structure", () => {
      it("should return array with 5 fit functions", () => {
        const fitFunctions = ChartService.createFitFunctions(mockScatterData);

        expect(Array.isArray(fitFunctions)).toBe(true);
        expect(fitFunctions).toHaveLength(5);
      });

      it("should return fit functions with correct structure", () => {
        const fitFunctions = ChartService.createFitFunctions(mockScatterData);

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

      it("should include all required equation types", () => {
        const fitFunctions = ChartService.createFitFunctions(mockScatterData);
        const equations = fitFunctions.map((f) => f.equation);

        expect(equations).toContain("Linear");
        expect(equations).toContain("Log");
        expect(equations).toContain("Compound");
        expect(equations).toContain("Power");
        expect(equations).toContain("Exp");
      });
    });
  });

  // describe("quickChart Method - Unit Tests", () => {
  //   it("should create chart with default chartType", () => {
  //     const result = ChartService.quickChart(mockChartData);

  //     expect(result.charts[0].chartType).toBe("Vertical Bar Chart");
  //     expect(result.charts[0].chartData).toEqual(mockChartData);
  //   });

  //   it("should create chart with custom chartType", () => {
  //     const result = ChartService.quickChart(mockChartData, "Line Chart");

  //     expect(result.charts[0].chartType).toBe("Line Chart");
  //     expect(result.charts[0].chartData).toEqual(mockChartData);
  //   });

  //   it("should use default configuration", () => {
  //     const result = ChartService.quickChart(mockChartData);

  //     expect(result.charts[0].chartConfig.width).toBe(800);
  //     expect(result.charts[0].chartConfig.height).toBe(600);
  //     expect(result.charts[0].chartConfig.useAxis).toBe(true);
  //     expect(result.charts[0].chartConfig.useLegend).toBe(true);
  //   });
  // });

  describe("createMultipleCharts Method - Unit Tests", () => {
    it("should create multiple charts with same data", () => {
      const chartTypes = ["Vertical Bar Chart", "Line Chart", "Area Chart"];
      const input = {
        chartType: "Vertical Bar Chart",
        chartData: mockChartData,
      };

      const results = ChartService.createMultipleCharts(input, chartTypes);

      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.charts[0].chartType).toBe(chartTypes[index]);
        expect(result.charts[0].chartData).toEqual(mockChartData);
      });
    });

    it("should handle empty chartTypes array", () => {
      const input = {
        chartType: "Vertical Bar Chart",
        chartData: mockChartData,
      };

      const results = ChartService.createMultipleCharts(input, []);

      expect(results).toHaveLength(0);
    });

    it("should preserve all input properties", () => {
      const input = {
        chartType: "Vertical Bar Chart",
        chartData: mockChartData,
        chartMetadata: {
          title: "Test Title",
          subtitle: "Test Subtitle",
        },
        chartConfig: {
          width: 1000,
          height: 800,
        },
      };

      const chartTypes = ["Vertical Bar Chart", "Line Chart"];
      const results = ChartService.createMultipleCharts(input, chartTypes);

      results.forEach((result) => {
        expect(result.charts[0].chartMetadata.title).toBe("Test Title");
        expect(result.charts[0].chartMetadata.subtitle).toBe("Test Subtitle");
        expect(result.charts[0].chartConfig.width).toBe(1000);
        expect(result.charts[0].chartConfig.height).toBe(800);
      });
    });
  });

  describe("createScatterPlotWithMultipleFitLine Method - Unit Tests", () => {
    it("should create scatter plot with auto-generated fit functions", () => {
      const result =
        ChartService.createScatterPlotWithMultipleFitLine(mockScatterData);

      expect(result.charts[0].chartType).toBe(
        "Scatter Plot With Multiple Fit Line"
      );
      expect(result.charts[0].chartData).toEqual(mockScatterData);
      expect(result.charts[0].chartConfig.fitFunctions).toBeDefined();
      expect(Array.isArray(result.charts[0].chartConfig.fitFunctions)).toBe(
        true
      );
    });

    it("should use default metadata when not provided", () => {
      const result =
        ChartService.createScatterPlotWithMultipleFitLine(mockScatterData);

      expect(result.charts[0].chartMetadata.title).toBe(
        "Scatter Plot With Multiple Fit Lines"
      );
      expect(result.charts[0].chartMetadata.description).toBe(
        "Scatter plot with automatically calculated fit lines"
      );
    });

    it("should use custom metadata when provided", () => {
      const metadata = {
        title: "Custom Title",
        subtitle: "Custom Subtitle",
        description: "Custom Description",
        axisLabels: {
          x: "Custom X",
          y: "Custom Y",
        },
      };

      const result = ChartService.createScatterPlotWithMultipleFitLine(
        mockScatterData,
        metadata
      );

      expect(result.charts[0].chartMetadata.title).toBe("Custom Title");
      expect(result.charts[0].chartMetadata.subtitle).toBe("Custom Subtitle");
      expect(result.charts[0].chartMetadata.description).toBe(
        "Custom Description"
      );
      expect(result.charts[0].chartConfig.axisLabels.x).toBe("Custom X");
      expect(result.charts[0].chartConfig.axisLabels.y).toBe("Custom Y");
    });

    it("should use default axis labels when not provided", () => {
      const result =
        ChartService.createScatterPlotWithMultipleFitLine(mockScatterData);

      expect(result.charts[0].chartConfig.axisLabels.x).toBe("X-axis");
      expect(result.charts[0].chartConfig.axisLabels.y).toBe("Y-axis");
    });
  });

  describe("Edge Cases and Error Handling", () => {
    // describe("createFitFunctions Edge Cases", () => {
    //   it("should handle empty data array", () => {
    //     const fitFunctions = ChartService.createFitFunctions([]);

    //     // Should still return array with 5 fit functions even with empty data
    //     expect(Array.isArray(fitFunctions)).toBe(true);
    //     expect(fitFunctions).toHaveLength(5);
    //   });

    //   it("should handle single data point", () => {
    //     const data = [{ x: 1, y: 2 }];
    //     const fitFunctions = ChartService.createFitFunctions(data);

    //     expect(Array.isArray(fitFunctions)).toBe(true);
    //     expect(fitFunctions).toHaveLength(5);
    //   });

    //   it("should handle all negative y values for exponential fit", () => {
    //     const data = [
    //       { x: 1, y: -2 },
    //       { x: 2, y: -4 },
    //       { x: 3, y: -8 },
    //     ];

    //     const fitFunctions = ChartService.createFitFunctions(data);
    //     const expFit = fitFunctions.find((f) => f.equation === "Exp");

    //     // Should still return a fit function even if all values are negative
    //     expect(expFit).toBeDefined();
    //   });

    //   it("should handle all zero x values for logarithmic fit", () => {
    //     const data = [
    //       { x: 0, y: 1 },
    //       { x: 0, y: 2 },
    //       { x: 0, y: 3 },
    //     ];

    //     const fitFunctions = ChartService.createFitFunctions(data);
    //     const logFit = fitFunctions.find((f) => f.equation === "Log");

    //     // Should still return a fit function
    //     expect(logFit).toBeDefined();
    //   });
    // });

    describe("createChartJSON Edge Cases", () => {
      it("should handle very large numbers", () => {
        const largeData = [
          { category: "A", value: 1e15 },
          { category: "B", value: 2e15 },
        ];

        const result = ChartService.createChartJSON({
          chartType: "Vertical Bar Chart",
          chartData: largeData,
        });

        expect(result.charts[0].chartData).toEqual(largeData);
      });

      it("should handle very small numbers", () => {
        const smallData = [
          { category: "A", value: 1e-15 },
          { category: "B", value: 2e-15 },
        ];

        const result = ChartService.createChartJSON({
          chartType: "Vertical Bar Chart",
          chartData: smallData,
        });

        expect(result.charts[0].chartData).toEqual(smallData);
      });

      it("should handle special characters in data", () => {
        const specialData = [
          { category: "A&B", value: 10 },
          { category: "C<>D", value: 20 },
        ];

        const result = ChartService.createChartJSON({
          chartType: "Vertical Bar Chart",
          chartData: specialData,
        });

        expect(result.charts[0].chartData).toEqual(specialData);
      });
    });
  });

  describe("Helper Functions - Unit Tests", () => {
    describe("isDualAxisChart Function", () => {
      it("should return true for dual axis charts", () => {
        const dualAxisCharts = [
          "Vertical Bar & Line Chart",
          "Dual Axes Scatter Plot",
        ];

        dualAxisCharts.forEach((chartType) => {
          const result = ChartService.createChartJSON({
            chartType,
            chartData: mockChartData,
            chartConfig: {
              axisLabels: {
                y1: "Y1 Axis",
                y2: "Y2 Axis",
              },
            },
          });

          expect(result.charts[0].chartConfig.axisLabels.y1).toBe("Y1 Axis");
          expect(result.charts[0].chartConfig.axisLabels.y2).toBe("Y2 Axis");
        });
      });

      it("should return false for single axis charts", () => {
        const singleAxisCharts = [
          "Vertical Bar Chart",
          "Line Chart",
          "Area Chart",
        ];

        singleAxisCharts.forEach((chartType) => {
          const result = ChartService.createChartJSON({
            chartType,
            chartData: mockChartData,
            chartConfig: {
              axisLabels: {
                y: "Y Axis",
              },
            },
          });

          expect(result.charts[0].chartConfig.axisLabels.y).toBe("Y Axis");
          expect(result.charts[0].chartConfig.axisLabels.y1).toBeUndefined();
          expect(result.charts[0].chartConfig.axisLabels.y2).toBeUndefined();
        });
      });
    });

    describe("generateFinalAxisLabels Function", () => {
      it("should generate Q-Q Plot specific labels", () => {
        const result = ChartService.createChartJSON({
          chartType: "Q-Q Plot",
          chartData: mockChartData,
        });

        expect(result.charts[0].chartConfig.axisLabels.x).toBe(
          "Theoretical Quantiles"
        );
        expect(result.charts[0].chartConfig.axisLabels.y).toBe(
          "Sample Quantiles"
        );
      });

      it("should generate P-P Plot specific labels", () => {
        const result = ChartService.createChartJSON({
          chartType: "P-P Plot",
          chartData: mockChartData,
        });

        expect(result.charts[0].chartConfig.axisLabels.x).toBe(
          "Observed Cum Prop"
        );
        expect(result.charts[0].chartConfig.axisLabels.y).toBe(
          "Expected Cum Prop"
        );
      });

      it("should generate 3D chart labels", () => {
        const result = ChartService.createChartJSON({
          chartType: "3D Bar Chart",
          chartData: mockChartData,
          chartConfig: {
            axisLabels: {
              x: "Custom X",
              y: "Custom Y",
              z: "Custom Z",
            },
          },
        });

        expect(result.charts[0].chartConfig.axisLabels.x).toBe("Custom X");
        expect(result.charts[0].chartConfig.axisLabels.y).toBe("Custom Y");
        expect(result.charts[0].chartConfig.axisLabels.z).toBe("Custom Z");
      });

      it("should use default labels when not provided", () => {
        const result = ChartService.createChartJSON({
          chartType: "Vertical Bar Chart",
          chartData: mockChartData,
        });

        expect(result.charts[0].chartConfig.axisLabels.x).toBe("X-axis");
        expect(result.charts[0].chartConfig.axisLabels.y).toBe("Y-axis");
      });
    });

    describe("generateChartColors Function", () => {
      it("should return custom colors when provided", () => {
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
        });
      });

      it("should generate multiple colors for multi-color charts", () => {
        const multiColorCharts = [
          "Vertical Stacked Bar Chart",
          "Horizontal Stacked Bar Chart",
          "Clustered Bar Chart",
        ];

        multiColorCharts.forEach((chartType) => {
          const result = ChartService.createChartJSON({
            chartType,
            chartData: mockChartData,
            chartVariables: {
              x: ["Category"],
              y: ["Value", "Subcategory"],
            },
          });

          expect(
            result.charts[0].chartConfig.chartColor?.length
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

    describe("generateAxisInfo Function", () => {
      it("should use custom axisInfo when provided", () => {
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

      it("should generate axisInfo from chartVariables", () => {
        const result = ChartService.createChartJSON({
          chartType: "Vertical Bar Chart",
          chartData: mockChartData,
          chartVariables: {
            x: ["Category"],
            y: ["Value"],
          },
        });

        expect(result.charts[0].chartMetadata.axisInfo).toBeDefined();
        expect(result.charts[0].chartMetadata.axisInfo.x).toBe("Category");
        expect(result.charts[0].chartMetadata.axisInfo.y).toBe("Value");
      });
    });
  });

  describe("Advanced Edge Cases - Unit Tests", () => {
    // describe("createFitFunctions Advanced Edge Cases", () => {
    //   it("should handle division by zero in linear fit", () => {
    //     const data = [
    //       { x: 1, y: 2 },
    //       { x: 1, y: 4 }, // Same x value
    //       { x: 1, y: 6 },
    //     ];

    //     const fitFunctions = ChartService.createFitFunctions(data);
    //     const linearFit = fitFunctions.find((f) => f.equation === "Linear");

    //     expect(linearFit).toBeDefined();
    //     expect(linearFit?.parameters).toBeDefined();
    //   });

    //   it("should handle NaN values in exponential fit", () => {
    //     const data = [
    //       { x: 1, y: 0 }, // y = 0 will cause log(0) = -Infinity
    //       { x: 2, y: 1 },
    //       { x: 3, y: 2 },
    //     ];

    //     const fitFunctions = ChartService.createFitFunctions(data);
    //     const expFit = fitFunctions.find((f) => f.equation === "Exp");

    //     expect(expFit).toBeDefined();
    //     expect(expFit?.parameters).toBeDefined();
    //   });

    //   it("should handle Infinity values in logarithmic fit", () => {
    //     const data = [
    //       { x: 0, y: 1 }, // x = 0 will cause log(0) = -Infinity
    //       { x: 1, y: 2 },
    //       { x: 2, y: 3 },
    //     ];

    //     const fitFunctions = ChartService.createFitFunctions(data);
    //     const logFit = fitFunctions.find((f) => f.equation === "Log");

    //     expect(logFit).toBeDefined();
    //     expect(logFit?.parameters).toBeDefined();
    //   });

    //   it("should handle all negative values for exponential fit", () => {
    //     const data = [
    //       { x: 1, y: -2 },
    //       { x: 2, y: -4 },
    //       { x: 3, y: -8 },
    //     ];

    //     const fitFunctions = ChartService.createFitFunctions(data);
    //     const expFit = fitFunctions.find((f) => f.equation === "Exp");

    //     expect(expFit).toBeDefined();
    //     expect(expFit?.parameters).toBeDefined();
    //   });

    //   it("should handle all zero values for logarithmic fit", () => {
    //     const data = [
    //       { x: 0, y: 1 },
    //       { x: 0, y: 2 },
    //       { x: 0, y: 3 },
    //     ];

    //     const fitFunctions = ChartService.createFitFunctions(data);
    //     const logFit = fitFunctions.find((f) => f.equation === "Log");

    //     expect(logFit).toBeDefined();
    //     expect(logFit?.parameters).toBeDefined();
    //   });
    // });

    describe("createChartJSON Advanced Edge Cases", () => {
      it("should handle complex chartVariables combinations", () => {
        const result = ChartService.createChartJSON({
          chartType: "Clustered Bar Chart",
          chartData: mockChartData,
          chartVariables: {
            x: ["Category"],
            y: ["Value", "Subcategory"],
            groupBy: ["Group"],
            z: ["Z-Axis"],
          },
        });

        expect(result.charts[0].chartMetadata.axisInfo).toBeDefined();
      });

      it("should handle custom colors vs auto-generated colors", () => {
        // Test with custom colors
        const customResult = ChartService.createChartJSON({
          chartType: "Vertical Bar Chart",
          chartData: mockChartData,
          chartConfig: {
            chartColor: ["#ff0000"],
          },
        });

        // Test without custom colors (auto-generated)
        const autoResult = ChartService.createChartJSON({
          chartType: "Vertical Bar Chart",
          chartData: mockChartData,
        });

        expect(customResult.charts[0].chartConfig.chartColor).toEqual([
          "#ff0000",
        ]);
        expect(autoResult.charts[0].chartConfig.chartColor).toHaveLength(1);
        expect(autoResult.charts[0].chartConfig.chartColor).not.toEqual([
          "#ff0000",
        ]);
      });

      it("should handle showNormalCurve only for Histogram", () => {
        // Test with Histogram
        const histogramResult = ChartService.createChartJSON({
          chartType: "Histogram",
          chartData: mockChartData,
          chartConfig: {
            showNormalCurve: true,
          },
        });

        // Test with non-Histogram
        const barResult = ChartService.createChartJSON({
          chartType: "Vertical Bar Chart",
          chartData: mockChartData,
          chartConfig: {
            showNormalCurve: true,
          },
        });

        expect(histogramResult.charts[0].chartConfig.showNormalCurve).toBe(
          true
        );
        expect(barResult.charts[0].chartConfig.showNormalCurve).toBeUndefined();
      });

      it("should handle fitFunctions only for Scatter Plot With Multiple Fit Line", () => {
        const fitFunctions = [
          {
            fn: "x => parameters.a + parameters.b * x",
            equation: "Linear",
            color: "#ff0000",
            parameters: { a: 1, b: 2 },
          },
        ];

        // Test with Scatter Plot With Multiple Fit Line
        const scatterResult = ChartService.createChartJSON({
          chartType: "Scatter Plot With Multiple Fit Line",
          chartData: mockScatterData,
          chartConfig: {
            fitFunctions,
          },
        });

        // Test with non-scatter chart
        const barResult = ChartService.createChartJSON({
          chartType: "Vertical Bar Chart",
          chartData: mockChartData,
          chartConfig: {
            fitFunctions,
          },
        });

        expect(scatterResult.charts[0].chartConfig.fitFunctions).toEqual(
          fitFunctions
        );
        expect(barResult.charts[0].chartConfig.fitFunctions).toBeUndefined();
      });

      it("should handle all chartConfig properties correctly", () => {
        const result = ChartService.createChartJSON({
          chartType: "Summary Point Plot",
          chartData: mockChartData,
          chartConfig: {
            width: 1000,
            height: 800,
            chartColor: ["#ff0000"],
            useAxis: false,
            useLegend: false,
            statistic: "mean",
            axisLabels: {
              x: "Custom X",
              y: "Custom Y",
            },
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

        expect(result.charts[0].chartConfig.width).toBe(1000);
        expect(result.charts[0].chartConfig.height).toBe(800);
        expect(result.charts[0].chartConfig.chartColor).toEqual(["#ff0000"]);
        expect(result.charts[0].chartConfig.useAxis).toBe(false);
        expect(result.charts[0].chartConfig.useLegend).toBe(false);
        expect(result.charts[0].chartConfig.statistic).toBe("mean");
        expect(result.charts[0].chartConfig.axisLabels.x).toBe("Custom X");
        expect(result.charts[0].chartConfig.axisLabels.y).toBe("Custom Y");
        expect(result.charts[0].chartConfig.axisScaleOptions?.x?.min).toBe("0");
        expect(result.charts[0].chartConfig.axisScaleOptions?.y?.max).toBe(
          "30"
        );
      });
    });
  });
});
