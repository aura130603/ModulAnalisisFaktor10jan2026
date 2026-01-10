// Mock mathjs to avoid ES modules issue
jest.mock("mathjs", () => ({
  isNull: jest.fn((value) => value === null || value === undefined),
}));

// Mock simple-statistics
jest.mock("simple-statistics", () => ({
  probit: jest.fn((p: number) => {
    // Simple probit implementation for testing
    if (p === 0.975) return 1.96; // 95% confidence level
    if (p === 0.99) return 2.326; // 98% confidence level
    return 1.96; // default
  }),
  mean: jest.fn((values: number[]) => {
    if (values.length === 0) return 0;
    return (
      values.reduce((sum: number, val: number) => sum + val, 0) / values.length
    );
  }),
  variance: jest.fn((values: number[]) => {
    if (values.length === 0) return 0;
    const avg =
      values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
    return (
      values.reduce(
        (sum: number, val: number) => sum + Math.pow(val - avg, 2),
        0
      ) / values.length
    );
  }),
  standardDeviation: jest.fn((values: number[]) => {
    if (values.length === 0) return 0;
    const avg =
      values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
    const variance =
      values.reduce(
        (sum: number, val: number) => sum + Math.pow(val - avg, 2),
        0
      ) / values.length;
    return Math.sqrt(variance);
  }),
}));

import { DataProcessingService } from "../DataProcessingService";

describe("DataProcessingService Unit Tests", () => {
  // Mock data for testing
  const mockRawData = [
    [1, "A", 10, 20, 30],
    [2, "B", 15, 25, 35],
    [3, "A", 12, 22, 32],
    [4, "B", 18, 28, 38],
    [5, "C", 20, 30, 40],
  ];

  const mockVariables = [
    { name: "ID", type: "NUMERIC" },
    { name: "Category", type: "STRING" },
    { name: "Value1", type: "NUMERIC" },
    { name: "Value2", type: "NUMERIC" },
    { name: "Value3", type: "NUMERIC" },
  ];

  const mockChartVariables = {
    x: ["Category"],
    y: ["Value1"],
    z: ["Value2"],
    groupBy: ["Category"],
    low: ["Value1"],
    high: ["Value2"],
    close: ["Value3"],
    y2: ["Value3"],
  };

  describe("processDataForChart Method - Unit Tests", () => {
    describe("Input Validation", () => {
      it("should handle empty rawData", () => {
        const result = DataProcessingService.processDataForChart({
          chartType: "Vertical Bar Chart",
          rawData: [],
          variables: mockVariables,
          chartVariables: { x: ["Category"], y: ["Value1"] },
        });

        expect(result.data).toEqual([]);
        expect(result.axisInfo).toEqual({});
      });

      it("should handle empty variables", () => {
        const result = DataProcessingService.processDataForChart({
          chartType: "Vertical Bar Chart",
          rawData: mockRawData,
          variables: [],
          chartVariables: { x: ["Category"], y: ["Value1"] },
        });

        expect(result.data).toEqual([]);
        expect(result.axisInfo).toEqual({});
      });

      it("should handle missing chartVariables", () => {
        const result = DataProcessingService.processDataForChart({
          chartType: "Vertical Bar Chart",
          rawData: mockRawData,
          variables: mockVariables,
          chartVariables: {},
        });

        // Should return empty data when no chartVariables provided
        expect(result.data).toEqual([]);
        expect(result.axisInfo).toEqual({});
      });

      it("should handle invalid variable names", () => {
        // The service now handles missing variables gracefully instead of throwing
        const result = DataProcessingService.processDataForChart({
          chartType: "Vertical Bar Chart",
          rawData: mockRawData,
          variables: mockVariables,
          chartVariables: { x: ["NonExistent"], y: ["Value1"] },
        });

        expect(result.data).toEqual([]);
        expect(result.axisInfo).toEqual({});
      });
    });

    describe("Simple Chart Types", () => {
      it("should process Vertical Bar Chart data", () => {
        const result = DataProcessingService.processDataForChart({
          chartType: "Vertical Bar Chart",
          rawData: mockRawData,
          variables: mockVariables,
          chartVariables: { x: ["Category"], y: ["Value1"] },
          processingOptions: { aggregation: "sum" },
        });

        expect(result.data).toHaveLength(3); // A, B, C categories
        expect(result.axisInfo).toEqual({
          category: "Category",
          value: "Value1",
        });
      });

      it("should process Horizontal Bar Chart data", () => {
        const result = DataProcessingService.processDataForChart({
          chartType: "Horizontal Bar Chart",
          rawData: mockRawData,
          variables: mockVariables,
          chartVariables: { x: ["Category"], y: ["Value1"] },
          processingOptions: { aggregation: "average" },
        });

        expect(result.data).toHaveLength(3);
        expect(result.axisInfo).toEqual({
          category: "Category",
          value: "Value1",
        });
      });

      it("should process Line Chart data", () => {
        const result = DataProcessingService.processDataForChart({
          chartType: "Line Chart",
          rawData: mockRawData,
          variables: mockVariables,
          chartVariables: { x: ["Category"], y: ["Value1"] },
          processingOptions: { aggregation: "count" },
        });

        expect(result.data).toHaveLength(3);
        expect(result.axisInfo).toEqual({
          category: "Category",
          value: "Value1",
        });
      });

      it("should process Pie Chart data", () => {
        const result = DataProcessingService.processDataForChart({
          chartType: "Pie Chart",
          rawData: mockRawData,
          variables: mockVariables,
          chartVariables: { x: ["Category"], y: ["Value1"] },
          processingOptions: { aggregation: "sum" },
        });

        expect(result.data).toHaveLength(3);
        expect(result.axisInfo).toEqual({
          category: "Category",
          value: "Value1",
        });
      });
    });

    describe("Scatter Plot Types", () => {
      it("should process Scatter Plot data", () => {
        const result = DataProcessingService.processDataForChart({
          chartType: "Scatter Plot",
          rawData: mockRawData,
          variables: mockVariables,
          chartVariables: { x: ["Value1"], y: ["Value2"] },
          processingOptions: { filterEmpty: true },
        });

        expect(result.data).toHaveLength(5);
        expect(result.axisInfo).toEqual({
          x: "Value1",
          y: "Value2",
        });
      });

      it("should process Scatter Plot With Fit Line data", () => {
        const result = DataProcessingService.processDataForChart({
          chartType: "Scatter Plot With Fit Line",
          rawData: mockRawData,
          variables: mockVariables,
          chartVariables: { x: ["Value1"], y: ["Value2"] },
          processingOptions: { filterEmpty: true },
        });

        expect(result.data).toHaveLength(5);
        expect(result.axisInfo).toEqual({
          x: "Value1",
          y: "Value2",
        });
      });

      it("should process Scatter Plot With Multiple Fit Line data", () => {
        const result = DataProcessingService.processDataForChart({
          chartType: "Scatter Plot With Multiple Fit Line",
          rawData: mockRawData,
          variables: mockVariables,
          chartVariables: { x: ["Value1"], y: ["Value2"] },
          processingOptions: { filterEmpty: true },
        });

        expect(result.data).toHaveLength(5);
        expect(result.axisInfo).toEqual({
          x: "Value1",
          y: "Value2",
        });
      });
    });

    describe("Stacked Chart Types", () => {
      it("should process Vertical Stacked Bar Chart data", () => {
        const result = DataProcessingService.processDataForChart({
          chartType: "Vertical Stacked Bar Chart",
          rawData: mockRawData,
          variables: mockVariables,
          chartVariables: { x: ["Category"], y: ["Value1", "Value2"] },
          processingOptions: { aggregation: "sum" },
        });

        expect(result.data.length).toBeGreaterThan(0);
        expect(result.axisInfo).toEqual({
          category: "Category",
          subcategory: "",
          value: "Value1",
        });
      });

      it("should process Clustered Bar Chart data", () => {
        const result = DataProcessingService.processDataForChart({
          chartType: "Clustered Bar Chart",
          rawData: mockRawData,
          variables: mockVariables,
          chartVariables: {
            x: ["Category"],
            y: ["Value1", "Value2"],
            groupBy: ["Category"],
          },
          processingOptions: { aggregation: "sum" },
        });

        expect(result.data.length).toBeGreaterThan(0);
        expect(result.axisInfo).toEqual({
          category: "Category",
          subcategory: "Category",
          value: "Value1",
        });
      });
    });

    describe("3D Chart Types", () => {
      it("should process 3D Bar Chart data", () => {
        const result = DataProcessingService.processDataForChart({
          chartType: "3D Bar Chart",
          rawData: mockRawData,
          variables: mockVariables,
          chartVariables: { x: ["Value1"], y: ["Value2"], z: ["Value3"] },
          processingOptions: { aggregation: "sum" },
        });

        expect(result.data.length).toBeGreaterThan(0);
        expect(result.axisInfo).toEqual({
          x: "Value1",
          y: "Value2",
          z: "Value3",
        });
      });

      it("should process 3D Scatter Plot data", () => {
        const result = DataProcessingService.processDataForChart({
          chartType: "3D Scatter Plot",
          rawData: mockRawData,
          variables: mockVariables,
          chartVariables: { x: ["Value1"], y: ["Value2"], z: ["Value3"] },
          processingOptions: { filterEmpty: true },
        });

        expect(result.data.length).toBeGreaterThan(0);
        expect(result.axisInfo).toEqual({
          x: "Value1",
          y: "Value2",
          z: "Value3",
        });
      });
    });

    describe("Error Bar Chart Types", () => {
      it("should process Error Bar Chart data", () => {
        const result = DataProcessingService.processDataForChart({
          chartType: "Error Bar Chart",
          rawData: mockRawData,
          variables: mockVariables,
          chartVariables: { x: ["Category"], y: ["Value1"] },
          processingOptions: {
            aggregation: "average",
            errorBar: { type: "se", multiplier: 2 },
          },
        });

        expect(result.data.length).toBeGreaterThan(0);
        expect(result.axisInfo).toEqual({
          category: "Category",
          value: "Value1",
        });
      });

      it("should process Clustered Error Bar Chart data", () => {
        const result = DataProcessingService.processDataForChart({
          chartType: "Clustered Error Bar Chart",
          rawData: mockRawData,
          variables: mockVariables,
          chartVariables: {
            x: ["Category"],
            y: ["Value1"],
            groupBy: ["Category"],
          },
          processingOptions: {
            errorBar: { type: "ci", confidenceLevel: 95 },
          },
        });

        expect(result.data.length).toBeGreaterThan(0);
        expect(result.axisInfo).toEqual({
          category: "Category",
          subcategory: "Category",
          value: "Value1",
          error: "Error of Value1",
        });
      });
    });

    describe("Range Chart Types", () => {
      it("should process Simple Range Bar data", () => {
        const result = DataProcessingService.processDataForChart({
          chartType: "Simple Range Bar",
          rawData: mockRawData,
          variables: mockVariables,
          chartVariables: {
            x: ["Category"],
            low: ["Value1"],
            high: ["Value2"],
            close: ["Value3"],
          },
          processingOptions: { filterEmpty: true },
        });

        expect(result.data.length).toBeGreaterThan(0);
        expect(result.axisInfo).toEqual({
          category: "Category",
          low: "Value1",
          high: "Value2",
          close: "Value3",
        });
      });

      it("should process High-Low-Close Chart data", () => {
        const result = DataProcessingService.processDataForChart({
          chartType: "High-Low-Close Chart",
          rawData: mockRawData,
          variables: mockVariables,
          chartVariables: {
            x: ["Category"],
            low: ["Value1"],
            high: ["Value2"],
            close: ["Value3"],
          },
          processingOptions: { filterEmpty: true },
        });

        expect(result.data.length).toBeGreaterThan(0);
        expect(result.axisInfo).toEqual({
          category: "Category",
          low: "Value1",
          high: "Value2",
          close: "Value3",
        });
      });
    });

    describe("Histogram Types", () => {
      it("should process Histogram data", () => {
        const result = DataProcessingService.processDataForChart({
          chartType: "Histogram",
          rawData: mockRawData,
          variables: mockVariables,
          chartVariables: { y: ["Value1"] },
          processingOptions: { aggregation: "count" },
        });

        expect(result.data).toHaveLength(5);
        expect(result.axisInfo).toEqual({
          value: "Value1",
        });
      });

      it("should process Stacked Histogram data", () => {
        const result = DataProcessingService.processDataForChart({
          chartType: "Stacked Histogram",
          rawData: mockRawData,
          variables: mockVariables,
          chartVariables: { x: ["Value1"], groupBy: ["Category"] },
          processingOptions: { aggregation: "count" },
        });

        expect(result.data.length).toBeGreaterThan(0);
        expect(result.axisInfo).toEqual({
          value: "",
          category: "Category",
        });
      });
    });

    describe("Special Chart Types", () => {
      it("should process Q-Q Plot data", () => {
        const result = DataProcessingService.processDataForChart({
          chartType: "Q-Q Plot",
          rawData: mockRawData,
          variables: mockVariables,
          chartVariables: { y: ["Value1"] },
          processingOptions: { aggregation: "count" },
        });

        expect(result.data).toHaveLength(5);
      });

      it("should process P-P Plot data", () => {
        const result = DataProcessingService.processDataForChart({
          chartType: "P-P Plot",
          rawData: mockRawData,
          variables: mockVariables,
          chartVariables: { y: ["Value1"] },
          processingOptions: { aggregation: "count" },
        });

        expect(result.data).toHaveLength(5);
      });

      it("should process Scatter Plot Matrix data", () => {
        const result = DataProcessingService.processDataForChart({
          chartType: "Scatter Plot Matrix",
          rawData: mockRawData,
          variables: mockVariables,
          chartVariables: { x: ["Value1", "Value2", "Value3"] },
          processingOptions: { filterEmpty: true },
        });

        expect(result.data.length).toBeGreaterThan(0);
      });
    });

    describe("Processing Options", () => {
      it("should apply sorting correctly", () => {
        const result = DataProcessingService.processDataForChart({
          chartType: "Vertical Bar Chart",
          rawData: mockRawData,
          variables: mockVariables,
          chartVariables: { x: ["Category"], y: ["Value1"] },
          processingOptions: {
            aggregation: "sum",
            sortBy: "value",
            sortOrder: "desc",
          },
        });

        expect(result.data).toHaveLength(3);
        // Check if sorted in descending order
        const values = result.data.map((item) => item.value);
        expect(values).toEqual([...values].sort((a, b) => b - a));
      });

      it("should apply limit correctly", () => {
        const result = DataProcessingService.processDataForChart({
          chartType: "Vertical Bar Chart",
          rawData: mockRawData,
          variables: mockVariables,
          chartVariables: { x: ["Category"], y: ["Value1"] },
          processingOptions: {
            aggregation: "sum",
            limit: 2,
          },
        });

        expect(result.data).toHaveLength(2);
      });

      it("should filter empty values when filterEmpty is true", () => {
        const dataWithEmpty = [
          [1, "A", 10, 20],
          [2, "", 15, 25], // Empty category
          [3, "B", null, 30], // Null value
          [4, "C", 20, 35],
        ];

        const result = DataProcessingService.processDataForChart({
          chartType: "Vertical Bar Chart",
          rawData: dataWithEmpty,
          variables: mockVariables,
          chartVariables: { x: ["Category"], y: ["Value1"] },
          processingOptions: { filterEmpty: true },
        });

        expect(result.data).toHaveLength(2); // Only A and C should remain
      });

      it("should not filter empty values when filterEmpty is false", () => {
        const dataWithEmpty = [
          [1, "A", 10, 20],
          [2, "", 15, 25],
          [3, "B", null, 30],
          [4, "C", 20, 35],
        ];

        const result = DataProcessingService.processDataForChart({
          chartType: "Vertical Bar Chart",
          rawData: dataWithEmpty,
          variables: mockVariables,
          chartVariables: { x: ["Category"], y: ["Value1"] },
          processingOptions: { filterEmpty: false },
        });

        expect(result.data).toHaveLength(4); // All should remain
      });
    });

    describe("Aggregation Support", () => {
      it("should validate aggregation support for chart types", () => {
        // Test chart that supports all aggregations
        expect(() => {
          DataProcessingService.processDataForChart({
            chartType: "Vertical Bar Chart",
            rawData: mockRawData,
            variables: mockVariables,
            chartVariables: { x: ["Category"], y: ["Value1"] },
            processingOptions: { aggregation: "sum" },
          });
        }).not.toThrow();

        // Test chart that only supports "none"
        expect(() => {
          DataProcessingService.processDataForChart({
            chartType: "Scatter Plot",
            rawData: mockRawData,
            variables: mockVariables,
            chartVariables: { x: ["Value1"], y: ["Value2"] },
            processingOptions: { aggregation: "none" },
          });
        }).not.toThrow();

        // Test invalid aggregation for chart type
        expect(() => {
          DataProcessingService.processDataForChart({
            chartType: "Scatter Plot",
            rawData: mockRawData,
            variables: mockVariables,
            chartVariables: { x: ["Value1"], y: ["Value2"] },
            processingOptions: { aggregation: "sum" },
          });
        }).toThrow(
          'Aggregation "sum" is not supported for chart type "Scatter Plot"'
        );
      });
    });

    describe("Error Bar Options", () => {
      it("should handle CI error bar options", () => {
        const result = DataProcessingService.processDataForChart({
          chartType: "Error Bar Chart",
          rawData: mockRawData,
          variables: mockVariables,
          chartVariables: { x: ["Category"], y: ["Value1"] },
          processingOptions: {
            aggregation: "average",
            errorBar: { type: "ci", confidenceLevel: 95 },
          },
        });

        expect(result.data.length).toBeGreaterThan(0);
        result.data.forEach((item) => {
          expect(item).toHaveProperty("error");
          expect(typeof item.error).toBe("number");
        });
      });

      it("should handle SE error bar options", () => {
        const result = DataProcessingService.processDataForChart({
          chartType: "Error Bar Chart",
          rawData: mockRawData,
          variables: mockVariables,
          chartVariables: { x: ["Category"], y: ["Value1"] },
          processingOptions: {
            aggregation: "average",
            errorBar: { type: "se", multiplier: 2 },
          },
        });

        expect(result.data.length).toBeGreaterThan(0);
        result.data.forEach((item) => {
          expect(item).toHaveProperty("error");
          expect(typeof item.error).toBe("number");
        });
      });

      it("should handle SD error bar options", () => {
        const result = DataProcessingService.processDataForChart({
          chartType: "Error Bar Chart",
          rawData: mockRawData,
          variables: mockVariables,
          chartVariables: { x: ["Category"], y: ["Value1"] },
          processingOptions: {
            aggregation: "average",
            errorBar: { type: "sd", multiplier: 1 },
          },
        });

        expect(result.data.length).toBeGreaterThan(0);
        result.data.forEach((item) => {
          expect(item).toHaveProperty("error");
          expect(typeof item.error).toBe("number");
        });
      });

      it("should use default error bar options when not provided", () => {
        const result = DataProcessingService.processDataForChart({
          chartType: "Error Bar Chart",
          rawData: mockRawData,
          variables: mockVariables,
          chartVariables: { x: ["Category"], y: ["Value1"] },
          processingOptions: {
            aggregation: "average",
          },
        });

        expect(result.data.length).toBeGreaterThan(0);
        result.data.forEach((item) => {
          expect(item).toHaveProperty("error");
          expect(typeof item.error).toBe("number");
        });
      });
    });
  });

  describe("generateAxisInfo Method - Unit Tests", () => {
    it("should generate axis info for simple charts", () => {
      const result = DataProcessingService.generateAxisInfo(
        "Vertical Bar Chart",
        { x: ["Category"], y: ["Value1"] },
        mockVariables
      );

      expect(result).toEqual({
        category: "Category",
        value: "Value1",
      });
    });

    it("should generate axis info for scatter plots", () => {
      const result = DataProcessingService.generateAxisInfo(
        "Scatter Plot",
        { x: ["Value1"], y: ["Value2"] },
        mockVariables
      );

      expect(result).toEqual({
        x: "Value1",
        y: "Value2",
      });
    });

    it("should generate axis info for 3D charts", () => {
      const result = DataProcessingService.generateAxisInfo(
        "3D Bar Chart",
        { x: ["Value1"], y: ["Value2"], z: ["Value3"] },
        mockVariables
      );

      expect(result).toEqual({
        x: "Value1",
        y: "Value2",
        z: "Value3",
      });
    });

    it("should generate axis info for dual axis charts", () => {
      const result = DataProcessingService.generateAxisInfo(
        "Vertical Bar & Line Chart",
        { x: ["Category"], y: ["Value1"], y2: ["Value2"] },
        mockVariables
      );

      expect(result).toEqual({
        category: "Category",
        barValue: "Value1",
        lineValue: "Value2",
      });
    });

    it("should handle missing chartVariables gracefully", () => {
      const result = DataProcessingService.generateAxisInfo(
        "Vertical Bar Chart",
        {},
        mockVariables
      );

      expect(result).toEqual({
        category: "",
        value: "",
      });
    });

    it("should handle undefined chart type", () => {
      const result = DataProcessingService.generateAxisInfo(
        "Unknown Chart Type",
        { x: ["Category"], y: ["Value1"] },
        mockVariables
      );

      expect(result).toEqual({ undefined: "undefined" });
    });
  });

  describe("Edge Cases and Error Handling", () => {
    describe("Data Processing Edge Cases", () => {
      it("should handle very large numbers", () => {
        const largeData = [
          [1, "A", 1e15, 2e15],
          [2, "B", 2e15, 3e15],
        ];

        const result = DataProcessingService.processDataForChart({
          chartType: "Vertical Bar Chart",
          rawData: largeData,
          variables: mockVariables,
          chartVariables: { x: ["Category"], y: ["Value1"] },
          processingOptions: { aggregation: "sum" },
        });

        expect(result.data.length).toBeGreaterThan(0);
      });

      it("should handle very small numbers", () => {
        const smallData = [
          [1, "A", 1e-15, 2e-15],
          [2, "B", 2e-15, 3e-15],
        ];

        const result = DataProcessingService.processDataForChart({
          chartType: "Vertical Bar Chart",
          rawData: smallData,
          variables: mockVariables,
          chartVariables: { x: ["Category"], y: ["Value1"] },
          processingOptions: { aggregation: "sum" },
        });

        expect(result.data.length).toBeGreaterThan(0);
      });

      it("should handle special characters in data", () => {
        const specialData = [
          [1, "A&B", 10, 20],
          [2, "C<>D", 15, 25],
        ];

        const result = DataProcessingService.processDataForChart({
          chartType: "Vertical Bar Chart",
          rawData: specialData,
          variables: mockVariables,
          chartVariables: { x: ["Category"], y: ["Value1"] },
          processingOptions: { aggregation: "sum" },
        });

        expect(result.data.length).toBeGreaterThan(0);
      });

      it("should handle NaN values", () => {
        const nanData = [
          [1, "A", NaN, 20],
          [2, "B", 15, NaN],
          [3, "C", 20, 30],
        ];

        const result = DataProcessingService.processDataForChart({
          chartType: "Vertical Bar Chart",
          rawData: nanData,
          variables: mockVariables,
          chartVariables: { x: ["Category"], y: ["Value1"] },
          processingOptions: { filterEmpty: true },
        });

        expect(result.data.length).toBeGreaterThan(0);
      });

      it("should handle Infinity values", () => {
        const infData = [
          [1, "A", Infinity, 20],
          [2, "B", 15, -Infinity],
          [3, "C", 20, 30],
        ];

        const result = DataProcessingService.processDataForChart({
          chartType: "Vertical Bar Chart",
          rawData: infData,
          variables: mockVariables,
          chartVariables: { x: ["Category"], y: ["Value1"] },
          processingOptions: { filterEmpty: true },
        });

        expect(result.data.length).toBeGreaterThan(0);
      });
    });

    describe("Error Bar Edge Cases", () => {
      it("should handle empty data for error bar calculation", () => {
        const emptyData = [
          [1, "A", null, 20],
          [2, "B", null, 25],
        ];

        const result = DataProcessingService.processDataForChart({
          chartType: "Error Bar Chart",
          rawData: emptyData,
          variables: mockVariables,
          chartVariables: { x: ["Category"], y: ["Value1"] },
          processingOptions: {
            aggregation: "average",
            errorBar: { type: "se", multiplier: 2 },
          },
        });

        expect(result.data).toHaveLength(0);
      });

      it("should handle single data point for error bar", () => {
        const singleData = [[1, "A", 10, 20]];

        const result = DataProcessingService.processDataForChart({
          chartType: "Error Bar Chart",
          rawData: singleData,
          variables: mockVariables,
          chartVariables: { x: ["Category"], y: ["Value1"] },
          processingOptions: {
            aggregation: "average",
            errorBar: { type: "ci", confidenceLevel: 95 },
          },
        });

        expect(result.data).toHaveLength(1);
        expect(result.data[0]).toHaveProperty("error");
      });
    });

    describe("Sorting Edge Cases", () => {
      it("should handle sorting with mixed data types", () => {
        const mixedData = [
          [1, "A", 10, 20],
          [2, 5, 15, 25], // Number as category
          [3, "B", 20, 30],
        ];

        const result = DataProcessingService.processDataForChart({
          chartType: "Vertical Bar Chart",
          rawData: mixedData,
          variables: mockVariables,
          chartVariables: { x: ["Category"], y: ["Value1"] },
          processingOptions: {
            aggregation: "sum",
            sortBy: "category",
            sortOrder: "asc",
          },
        });

        expect(result.data).toHaveLength(3);
      });

      it("should handle sorting with undefined values", () => {
        const undefinedData = [
          [1, "A", 10, 20],
          [2, undefined, 15, 25],
          [3, "B", 20, 30],
        ];

        const result = DataProcessingService.processDataForChart({
          chartType: "Vertical Bar Chart",
          rawData: undefinedData,
          variables: mockVariables,
          chartVariables: { x: ["Category"], y: ["Value1"] },
          processingOptions: {
            aggregation: "sum",
            sortBy: "category",
            sortOrder: "asc",
          },
        });

        expect(result.data).toHaveLength(2); // undefined values are filtered out
      });
    });
  });

  describe("Performance and Memory Tests", () => {
    it("should handle large datasets efficiently", () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => [
        i,
        `Category${i % 10}`,
        Math.random() * 100,
        Math.random() * 100,
      ]);

      const startTime = Date.now();
      const result = DataProcessingService.processDataForChart({
        chartType: "Vertical Bar Chart",
        rawData: largeData,
        variables: mockVariables,
        chartVariables: { x: ["Category"], y: ["Value1"] },
        processingOptions: { aggregation: "sum" },
      });
      const endTime = Date.now();

      expect(result.data).toHaveLength(10); // 10 unique categories
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it("should handle memory usage for complex aggregations", () => {
      const complexData = Array.from({ length: 1000 }, (_, i) => [
        i,
        `Category${i % 20}`,
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100,
      ]);

      const result = DataProcessingService.processDataForChart({
        chartType: "Clustered Bar Chart",
        rawData: complexData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value1", "Value2"],
          groupBy: ["Category"],
        },
        processingOptions: { aggregation: "sum" },
      });

      expect(result.data.length).toBeGreaterThan(0);
    });
  });
});
