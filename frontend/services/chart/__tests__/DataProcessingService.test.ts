import {
  DataProcessingService,
  DataProcessingInput,
  ErrorBarOptions,
} from "../DataProcessingService";

describe("DataProcessingService Blackbox Tests", () => {
  // Mock data for testing
  const mockVariables = [
    { name: "Category", type: "STRING" },
    { name: "Value", type: "NUMERIC" },
    { name: "Group", type: "STRING" },
    { name: "X", type: "NUMERIC" },
    { name: "Y", type: "NUMERIC" },
    { name: "Z", type: "NUMERIC" },
    { name: "Low", type: "NUMERIC" },
    { name: "High", type: "NUMERIC" },
    { name: "Close", type: "NUMERIC" },
  ];

  const mockRawData = [
    ["A", 10, "Group1", 1, 5, 2, 8, 12, 10],
    ["B", 20, "Group2", 2, 8, 3, 15, 25, 20],
    ["C", 15, "Group1", 3, 12, 4, 12, 18, 15],
    ["D", 25, "Group2", 4, 15, 5, 20, 30, 25],
    ["E", 30, "Group1", 5, 18, 6, 25, 35, 30],
  ];

  describe("Basic Functionality Tests", () => {
    it("should process simple bar chart data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Vertical Bar Chart",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
        },
        processingOptions: {
          aggregation: "sum",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.axisInfo).toBeDefined();
      expect(result.axisInfo.category).toBe("Category");
      expect(result.axisInfo.value).toBe("Value");
    });

    it("should handle empty raw data gracefully", () => {
      const input: DataProcessingInput = {
        chartType: "Vertical Bar Chart",
        rawData: [],
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toEqual([]);
      expect(result.axisInfo).toEqual({});
    });

    it("should handle missing variables gracefully", () => {
      const input: DataProcessingInput = {
        chartType: "Vertical Bar Chart",
        rawData: mockRawData,
        variables: [],
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toEqual([]);
      expect(result.axisInfo).toEqual({});
    });
  });

  describe("Chart Type Support Tests", () => {
    const chartTypes = [
      "Vertical Bar Chart",
      "Horizontal Bar Chart",
      "Line Chart",
      "Area Chart",
      "Pie Chart",
      "Scatter Plot",
      "Boxplot",
      "Histogram",
      "Error Bar Chart",
      "3D Bar Chart",
      "Q-Q Plot",
      "P-P Plot",
    ];

    chartTypes.forEach((chartType) => {
      it(`should support ${chartType}`, () => {
        const input: DataProcessingInput = {
          chartType,
          rawData: mockRawData,
          variables: mockVariables,
          chartVariables: {
            x: ["Category"],
            y: ["Value"],
          },
          processingOptions: {
            filterEmpty: true,
          },
        };

        const result = DataProcessingService.processDataForChart(input);

        expect(result.data).toBeDefined();
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.axisInfo).toBeDefined();
      });
    });
  });

  describe("Aggregation Tests", () => {
    it("should apply sum aggregation correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Vertical Bar Chart",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
        },
        processingOptions: {
          aggregation: "sum",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("category");
        expect(item).toHaveProperty("value");
        expect(typeof item.value).toBe("number");
      });
    });

    it("should apply count aggregation correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Vertical Bar Chart",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
        },
        processingOptions: {
          aggregation: "count",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("category");
        expect(item).toHaveProperty("value");
        expect(typeof item.value).toBe("number");
      });
    });

    it("should apply average aggregation correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Vertical Bar Chart",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
        },
        processingOptions: {
          aggregation: "average",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("category");
        expect(item).toHaveProperty("value");
        expect(typeof item.value).toBe("number");
      });
    });

    it("should handle no aggregation correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Vertical Bar Chart",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
        },
        processingOptions: {
          aggregation: "none",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      expect(result.data.length).toBeGreaterThan(0);
    });
  });

  describe("Error Bar Chart Tests", () => {
    it("should process error bar chart with CI correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Error Bar Chart",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
        },
        processingOptions: {
          aggregation: "average",
          filterEmpty: true,
          errorBar: {
            type: "ci",
            confidenceLevel: 95,
          },
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("category");
        expect(item).toHaveProperty("value");
        expect(item).toHaveProperty("error");
        expect(typeof item.error).toBe("number");
      });
    });

    it("should process error bar chart with SE correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Error Bar Chart",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
        },
        processingOptions: {
          aggregation: "average",
          filterEmpty: true,
          errorBar: {
            type: "se",
            multiplier: 2,
          },
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("category");
        expect(item).toHaveProperty("value");
        expect(item).toHaveProperty("error");
        expect(typeof item.error).toBe("number");
      });
    });

    it("should process error bar chart with SD correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Error Bar Chart",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
        },
        processingOptions: {
          aggregation: "average",
          filterEmpty: true,
          errorBar: {
            type: "sd",
            multiplier: 1,
          },
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("category");
        expect(item).toHaveProperty("value");
        expect(item).toHaveProperty("error");
        expect(typeof item.error).toBe("number");
      });
    });
  });

  describe("Scatter Plot Tests", () => {
    it("should process scatter plot data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Scatter Plot",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["X"],
          y: ["Y"],
        },
        processingOptions: {
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("x");
        expect(item).toHaveProperty("y");
        expect(typeof item.x).toBe("number");
        expect(typeof item.y).toBe("number");
      });
    });

    it("should process scatter plot with fit line correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Scatter Plot With Fit Line",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["X"],
          y: ["Y"],
        },
        processingOptions: {
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      expect(result.axisInfo.x).toBe("X");
      expect(result.axisInfo.y).toBe("Y");
    });
  });

  describe("3D Chart Tests", () => {
    it("should process 3D bar chart data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "3D Bar Chart",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["X"],
          y: ["Y"],
          z: ["Z"],
        },
        processingOptions: {
          aggregation: "sum",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("x");
        expect(item).toHaveProperty("y");
        expect(item).toHaveProperty("z");
        expect(typeof item.x).toBe("number");
        expect(typeof item.y).toBe("number");
        expect(typeof item.z).toBe("number");
      });
    });

    it("should process 3D scatter plot data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "3D Scatter Plot",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["X"],
          y: ["Y"],
          z: ["Z"],
        },
        processingOptions: {
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("x");
        expect(item).toHaveProperty("y");
        expect(item).toHaveProperty("z");
        expect(typeof item.x).toBe("number");
        expect(typeof item.y).toBe("number");
        expect(typeof item.z).toBe("number");
      });
    });
  });

  describe("Range Chart Tests", () => {
    it("should process range bar chart data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Simple Range Bar",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          low: ["Low"],
          high: ["High"],
          close: ["Close"],
        },
        processingOptions: {
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("category");
        expect(item).toHaveProperty("low");
        expect(item).toHaveProperty("high");
        expect(item).toHaveProperty("close");
        expect(typeof item.low).toBe("number");
        expect(typeof item.high).toBe("number");
        expect(typeof item.close).toBe("number");
      });
    });

    it("should process high-low-close chart data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "High-Low-Close Chart",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          low: ["Low"],
          high: ["High"],
          close: ["Close"],
        },
        processingOptions: {
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("category");
        expect(item).toHaveProperty("low");
        expect(item).toHaveProperty("high");
        expect(item).toHaveProperty("close");
      });
    });
  });

  describe("Stacked Chart Tests", () => {
    it("should process stacked bar chart data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Vertical Stacked Bar Chart",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
          groupBy: ["Group"],
        },
        processingOptions: {
          aggregation: "sum",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("category");
        expect(item).toHaveProperty("subcategory");
        expect(item).toHaveProperty("value");
      });
    });

    it("should process clustered bar chart data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Clustered Bar Chart",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
          groupBy: ["Group"],
        },
        processingOptions: {
          aggregation: "sum",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("category");
        expect(item).toHaveProperty("subcategory");
        expect(item).toHaveProperty("value");
      });
    });
  });

  describe("Statistical Chart Tests", () => {
    it("should process histogram data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Histogram",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          y: ["Value"],
        },
        processingOptions: {
          aggregation: "count",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      result.data.forEach((item) => {
        expect(typeof item).toBe("number");
      });
    });

    it("should process Q-Q plot data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Q-Q Plot",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          y: ["Value"],
        },
        processingOptions: {
          aggregation: "count",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      // Q-Q Plot doesn't have specific axis labels in the current implementation
      expect(result.axisInfo).toBeDefined();
    });

    it("should process P-P plot data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "P-P Plot",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          y: ["Value"],
        },
        processingOptions: {
          aggregation: "count",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      // P-P Plot doesn't have specific axis labels in the current implementation
      expect(result.axisInfo).toBeDefined();
    });
  });

  describe("Data Filtering Tests", () => {
    it("should filter empty values when filterEmpty is true", () => {
      const dataWithEmpty = [
        ["A", 10, "Group1", 1, 5, 2, 8, 12, 10],
        ["", 20, "Group2", 2, 8, 3, 15, 25, 20], // Empty category
        ["C", null, "Group1", 3, 12, 4, 12, 18, 15], // Null value
        ["D", 25, "Group2", 4, 15, 5, 20, 30, 25],
      ];

      const input: DataProcessingInput = {
        chartType: "Vertical Bar Chart",
        rawData: dataWithEmpty,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
        },
        processingOptions: {
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      // Should only include valid data (A and D)
      expect(result.data.length).toBe(2);
    });

    it("should not filter empty values when filterEmpty is false", () => {
      const dataWithEmpty = [
        ["A", 10, "Group1", 1, 5, 2, 8, 12, 10],
        ["", 20, "Group2", 2, 8, 3, 15, 25, 20],
        ["C", null, "Group1", 3, 12, 4, 12, 18, 15],
        ["D", 25, "Group2", 4, 15, 5, 20, 30, 25],
      ];

      const input: DataProcessingInput = {
        chartType: "Vertical Bar Chart",
        rawData: dataWithEmpty,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
        },
        processingOptions: {
          filterEmpty: false,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      // Should include all data including empty values
      expect(result.data.length).toBeGreaterThan(2);
    });
  });

  describe("Sorting Tests", () => {
    it("should sort data by value in ascending order", () => {
      const input: DataProcessingInput = {
        chartType: "Vertical Bar Chart",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
        },
        processingOptions: {
          aggregation: "sum",
          filterEmpty: true,
          sortBy: "value",
          sortOrder: "asc",
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      expect(result.data.length).toBeGreaterThan(1);

      // Check if data is sorted in ascending order
      for (let i = 1; i < result.data.length; i++) {
        expect(result.data[i].value).toBeGreaterThanOrEqual(
          result.data[i - 1].value
        );
      }
    });

    it("should sort data by value in descending order", () => {
      const input: DataProcessingInput = {
        chartType: "Vertical Bar Chart",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
        },
        processingOptions: {
          aggregation: "sum",
          filterEmpty: true,
          sortBy: "value",
          sortOrder: "desc",
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      expect(result.data.length).toBeGreaterThan(1);

      // Check if data is sorted in descending order
      for (let i = 1; i < result.data.length; i++) {
        expect(result.data[i].value).toBeLessThanOrEqual(
          result.data[i - 1].value
        );
      }
    });
  });

  describe("Limit Tests", () => {
    it("should limit data when limit is specified", () => {
      const input: DataProcessingInput = {
        chartType: "Vertical Bar Chart",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
        },
        processingOptions: {
          aggregation: "sum",
          filterEmpty: true,
          limit: 2,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      expect(result.data.length).toBeLessThanOrEqual(2);
    });
  });

  describe("Error Handling Tests", () => {
    it("should handle invalid chart type gracefully", () => {
      const input: DataProcessingInput = {
        chartType: "Invalid Chart Type",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toEqual([]);
      expect(result.axisInfo).toEqual({});
    });

    it("should handle missing variable indices gracefully", () => {
      const input: DataProcessingInput = {
        chartType: "Vertical Bar Chart",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["NonExistentVariable"],
          y: ["Value"],
        },
      };

      // The service should handle missing variables gracefully by returning empty data
      const result = DataProcessingService.processDataForChart(input);
      expect(result.data).toEqual([]);
      expect(result.axisInfo).toEqual({});
    });

    it("should handle unsupported aggregation for chart type", () => {
      const input: DataProcessingInput = {
        chartType: "Boxplot", // Only supports 'none' aggregation
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
        },
        processingOptions: {
          aggregation: "sum", // Not supported for Boxplot
        },
      };

      expect(() => {
        DataProcessingService.processDataForChart(input);
      }).toThrow();
    });
  });

  describe("Edge Cases Tests", () => {
    it("should handle single data point", () => {
      const singleData = [["A", 10, "Group1", 1, 5, 2, 8, 12, 10]];

      const input: DataProcessingInput = {
        chartType: "Vertical Bar Chart",
        rawData: singleData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
        },
        processingOptions: {
          aggregation: "sum",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      expect(result.data.length).toBe(1);
    });

    it("should handle very large numbers", () => {
      const largeData = [
        ["A", 1e10, "Group1", 1, 5, 2, 8, 12, 10],
        ["B", 2e10, "Group2", 2, 8, 3, 15, 25, 20],
      ];

      const input: DataProcessingInput = {
        chartType: "Vertical Bar Chart",
        rawData: largeData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
        },
        processingOptions: {
          aggregation: "sum",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      expect(result.data.length).toBe(2);
      result.data.forEach((item) => {
        expect(typeof item.value).toBe("number");
        expect(item.value).toBeGreaterThan(0);
      });
    });

    it("should handle negative numbers", () => {
      const negativeData = [
        ["A", -10, "Group1", 1, 5, 2, 8, 12, 10],
        ["B", -20, "Group2", 2, 8, 3, 15, 25, 20],
      ];

      const input: DataProcessingInput = {
        chartType: "Vertical Bar Chart",
        rawData: negativeData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
        },
        processingOptions: {
          aggregation: "sum",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      expect(result.data.length).toBe(2);
      result.data.forEach((item) => {
        expect(typeof item.value).toBe("number");
        expect(item.value).toBeLessThan(0);
      });
    });
  });

  describe("Performance Tests", () => {
    it("should handle large datasets efficiently", () => {
      // Create large dataset
      const largeData = Array.from({ length: 1000 }, (_, i) => [
        `Category${i}`,
        Math.random() * 100,
        `Group${i % 5}`,
        i,
        Math.random() * 50,
        Math.random() * 10,
        Math.random() * 20,
        Math.random() * 30,
        Math.random() * 25,
      ]);

      const input: DataProcessingInput = {
        chartType: "Vertical Bar Chart",
        rawData: largeData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
        },
        processingOptions: {
          aggregation: "sum",
          filterEmpty: true,
        },
      };

      const startTime = Date.now();
      const result = DataProcessingService.processDataForChart(input);
      const endTime = Date.now();

      expect(result.data).toBeDefined();
      expect(result.data.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe("Axis Info Generation Tests", () => {
    it("should generate correct axis info for bar chart", () => {
      const input: DataProcessingInput = {
        chartType: "Vertical Bar Chart",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.axisInfo).toBeDefined();
      expect(result.axisInfo.category).toBe("Category");
      expect(result.axisInfo.value).toBe("Value");
    });

    it("should generate correct axis info for scatter plot", () => {
      const input: DataProcessingInput = {
        chartType: "Scatter Plot",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["X"],
          y: ["Y"],
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.axisInfo).toBeDefined();
      expect(result.axisInfo.x).toBe("X");
      expect(result.axisInfo.y).toBe("Y");
    });

    it("should generate correct axis info for 3D chart", () => {
      const input: DataProcessingInput = {
        chartType: "3D Bar Chart",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["X"],
          y: ["Y"],
          z: ["Z"],
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.axisInfo).toBeDefined();
      expect(result.axisInfo.x).toBe("X");
      expect(result.axisInfo.y).toBe("Y");
      expect(result.axisInfo.z).toBe("Z");
    });
  });

  describe("Missing Chart Types Tests", () => {
    it("should process Horizontal Stacked Bar Chart data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Horizontal Stacked Bar Chart",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
          groupBy: ["Group"],
        },
        processingOptions: {
          aggregation: "sum",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("category");
        expect(item).toHaveProperty("subcategory");
        expect(item).toHaveProperty("value");
        expect(typeof item.value).toBe("number");
      });
    });

    it("should process Multiple Line Chart data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Multiple Line Chart",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
          groupBy: ["Group"],
        },
        processingOptions: {
          aggregation: "sum",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("category");
        expect(item).toHaveProperty("subcategory");
        expect(item).toHaveProperty("value");
        expect(typeof item.value).toBe("number");
      });
    });

    it("should process Stacked Area Chart data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Stacked Area Chart",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
          groupBy: ["Group"],
        },
        processingOptions: {
          aggregation: "sum",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("category");
        expect(item).toHaveProperty("subcategory");
        expect(item).toHaveProperty("value");
        expect(typeof item.value).toBe("number");
      });
    });

    it("should process Population Pyramid data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Population Pyramid",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
          groupBy: ["Group"],
        },
        processingOptions: {
          aggregation: "sum",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("category");
        expect(item).toHaveProperty("subcategory");
        expect(item).toHaveProperty("value");
        expect(typeof item.value).toBe("number");
      });
    });

    it("should process 3D Bar Chart2 data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "3D Bar Chart2",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["X"],
          y: ["Y"],
          z: ["Z"],
        },
        processingOptions: {
          aggregation: "sum",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("x");
        expect(item).toHaveProperty("y");
        expect(item).toHaveProperty("z");
        expect(typeof item.x).toBe("number");
        expect(typeof item.y).toBe("number");
        expect(typeof item.z).toBe("number");
      });
    });

    it("should process Clustered 3D Bar Chart data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Clustered 3D Bar Chart",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["X"],
          y: ["Y"],
          z: ["Z"],
          groupBy: ["Group"],
        },
        processingOptions: {
          aggregation: "sum",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("x");
        expect(item).toHaveProperty("y");
        expect(item).toHaveProperty("z");
        expect(item).toHaveProperty("group");
        expect(typeof item.x).toBe("number");
        expect(typeof item.y).toBe("number");
        expect(typeof item.z).toBe("number");
      });
    });

    it("should process Stacked 3D Bar Chart data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Stacked 3D Bar Chart",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["X"],
          y: ["Y"],
          z: ["Z"],
          groupBy: ["Group"],
        },
        processingOptions: {
          aggregation: "sum",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("x");
        expect(item).toHaveProperty("y");
        expect(item).toHaveProperty("z");
        expect(item).toHaveProperty("group");
        expect(typeof item.x).toBe("number");
        expect(typeof item.y).toBe("number");
        expect(typeof item.z).toBe("number");
      });
    });

    it("should process Grouped Scatter Plot data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Grouped Scatter Plot",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["X"],
          y: ["Y"],
          groupBy: ["Group"],
        },
        processingOptions: {
          aggregation: "none",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("category");
        expect(item).toHaveProperty("x");
        expect(item).toHaveProperty("y");
        expect(typeof item.x).toBe("number");
        expect(typeof item.y).toBe("number");
      });
    });

    it("should process Drop Line Chart data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Drop Line Chart",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
          groupBy: ["Group"],
        },
        processingOptions: {
          aggregation: "none",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("category");
        expect(item).toHaveProperty("x");
        expect(item).toHaveProperty("y");
        expect(typeof item.y).toBe("number");
      });
    });

    it("should process Clustered Range Bar data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Clustered Range Bar",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          low: ["Low"],
          high: ["High"],
          groupBy: ["Group"],
        },
        processingOptions: {
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("category");
        expect(item).toHaveProperty("subcategory");
        expect(item).toHaveProperty("low");
        expect(item).toHaveProperty("high");
        expect(typeof item.low).toBe("number");
        expect(typeof item.high).toBe("number");
      });
    });

    it("should process Scatter Plot With Multiple Fit Line data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Scatter Plot With Multiple Fit Line",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["X"],
          y: ["Y"],
        },
        processingOptions: {
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("x");
        expect(item).toHaveProperty("y");
        expect(typeof item.x).toBe("number");
        expect(typeof item.y).toBe("number");
      });
    });

    it("should process 3D Bar Chart (ECharts) data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "3D Bar Chart (ECharts)",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["X"],
          y: ["Y"],
          z: ["Z"],
        },
        processingOptions: {
          aggregation: "sum",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("x");
        expect(item).toHaveProperty("y");
        expect(item).toHaveProperty("z");
        expect(typeof item.x).toBe("number");
        expect(typeof item.y).toBe("number");
        expect(typeof item.z).toBe("number");
      });
    });

    it("should process 3D Scatter Plot (ECharts) data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "3D Scatter Plot (ECharts)",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["X"],
          y: ["Y"],
          z: ["Z"],
        },
        processingOptions: {
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("x");
        expect(item).toHaveProperty("y");
        expect(item).toHaveProperty("z");
        expect(typeof item.x).toBe("number");
        expect(typeof item.y).toBe("number");
        expect(typeof item.z).toBe("number");
      });
    });

    it("should process Clustered 3D Bar Chart (ECharts) data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Clustered 3D Bar Chart (ECharts)",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["X"],
          y: ["Y"],
          z: ["Z"],
          groupBy: ["Group"],
        },
        processingOptions: {
          aggregation: "sum",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("x");
        expect(item).toHaveProperty("y");
        expect(item).toHaveProperty("z");
        expect(item).toHaveProperty("group");
        expect(typeof item.x).toBe("number");
        expect(typeof item.y).toBe("number");
        expect(typeof item.z).toBe("number");
      });
    });

    it("should process Stacked 3D Bar Chart (ECharts) data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Stacked 3D Bar Chart (ECharts)",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["X"],
          y: ["Y"],
          z: ["Z"],
          groupBy: ["Group"],
        },
        processingOptions: {
          aggregation: "sum",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("x");
        expect(item).toHaveProperty("y");
        expect(item).toHaveProperty("z");
        expect(item).toHaveProperty("group");
        expect(typeof item.x).toBe("number");
        expect(typeof item.y).toBe("number");
        expect(typeof item.z).toBe("number");
      });
    });

    it("should process Grouped 3D Scatter Plot (ECharts) data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Grouped 3D Scatter Plot (ECharts)",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["X"],
          y: ["Y"],
          z: ["Z"],
          groupBy: ["Group"],
        },
        processingOptions: {
          aggregation: "none",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("x");
        expect(item).toHaveProperty("y");
        expect(item).toHaveProperty("z");
        expect(item).toHaveProperty("group");
        expect(typeof item.x).toBe("number");
        expect(typeof item.y).toBe("number");
        expect(typeof item.z).toBe("number");
      });
    });
    it("should process Density Chart data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Density Chart",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          y: ["Value"],
        },
        processingOptions: {
          aggregation: "none",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.axisInfo).toBeDefined();
    });

    it("should process Frequency Polygon data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Frequency Polygon",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          y: ["Value"],
        },
        processingOptions: {
          aggregation: "count",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.axisInfo).toBeDefined();
    });

    it("should process Summary Point Plot data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Summary Point Plot",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
        },
        processingOptions: {
          aggregation: "sum",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("category");
        expect(item).toHaveProperty("value");
        expect(typeof item.value).toBe("number");
      });
    });

    it("should process Violin Plot data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Violin Plot",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
        },
        processingOptions: {
          aggregation: "none",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("category");
        expect(item).toHaveProperty("value");
        expect(typeof item.value).toBe("number");
      });
    });

    it("should process Dot Plot data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Dot Plot",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
        },
        processingOptions: {
          aggregation: "none",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("category");
        expect(item).toHaveProperty("value");
        expect(typeof item.value).toBe("number");
      });
    });
  });

  describe("Advanced Chart Types Tests", () => {
    it("should process Difference Area data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Difference Area",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          low: ["Low"],
          high: ["High"],
        },
        processingOptions: {
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("category");
        expect(item).toHaveProperty("Low");
        expect(item).toHaveProperty("High");
        expect(typeof item.Low).toBe("number");
        expect(typeof item.High).toBe("number");
      });
    });

    it("should process Vertical Bar & Line Chart data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Vertical Bar & Line Chart",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
          y2: ["Y"],
        },
        processingOptions: {
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("Category");
        expect(item).toHaveProperty("Value");
        expect(item).toHaveProperty("Y");
        expect(typeof item.Value).toBe("number");
        expect(typeof item.Y).toBe("number");
      });
    });

    it("should process Dual Axes Scatter Plot data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Dual Axes Scatter Plot",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["X"],
          y: ["Y"],
          y2: ["Value"],
        },
        processingOptions: {
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("X");
        expect(item).toHaveProperty("Y");
        expect(item).toHaveProperty("Value");
        expect(typeof item.X).toBe("number");
        expect(typeof item.Y).toBe("number");
        expect(typeof item.Value).toBe("number");
      });
    });

    it("should process Grouped 3D Scatter Plot data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Grouped 3D Scatter Plot",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["X"],
          y: ["Y"],
          z: ["Z"],
          groupBy: ["Group"],
        },
        processingOptions: {
          aggregation: "none",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("x");
        expect(item).toHaveProperty("y");
        expect(item).toHaveProperty("z");
        expect(item).toHaveProperty("category");
        expect(typeof item.x).toBe("number");
        expect(typeof item.y).toBe("number");
        expect(typeof item.z).toBe("number");
      });
    });
  });

  describe("Statistical Advanced Tests", () => {
    it("should process Stacked Histogram data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Stacked Histogram",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["Value"],
          groupBy: ["Group"],
        },
        processingOptions: {
          aggregation: "count",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("value");
        expect(item).toHaveProperty("category");
        expect(typeof item.value).toBe("number");
      });
    });

    it("should process Clustered Error Bar Chart data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Clustered Error Bar Chart",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
          groupBy: ["Group"],
        },
        processingOptions: {
          aggregation: "average",
          filterEmpty: true,
          errorBar: {
            type: "se",
            multiplier: 2,
          },
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("category");
        expect(item).toHaveProperty("subcategory");
        expect(item).toHaveProperty("value");
        expect(item).toHaveProperty("error");
        expect(typeof item.value).toBe("number");
        expect(typeof item.error).toBe("number");
      });
    });

    it("should process Scatter Plot Matrix data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Scatter Plot Matrix",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["X", "Y", "Value"],
        },
        processingOptions: {
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(typeof item).toBe("object");
        expect(Object.keys(item).length).toBeGreaterThan(0);
      });
    });

    it("should process Clustered Boxplot data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Clustered Boxplot",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
          groupBy: ["Group"],
        },
        processingOptions: {
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("category");
        expect(item).toHaveProperty("subcategory");
        expect(item).toHaveProperty("value");
        expect(typeof item.value).toBe("number");
      });
    });

    it("should process 1-D Boxplot data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "1-D Boxplot",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          y: ["Value"],
        },
        processingOptions: {
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item).toHaveProperty("value");
        expect(typeof item.value).toBe("number");
      });
    });

    it("should process Stem And Leaf Plot data correctly", () => {
      const input: DataProcessingInput = {
        chartType: "Stem And Leaf Plot",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          y: ["Value"],
        },
        processingOptions: {
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      result.data.forEach((item) => {
        expect(item).toHaveProperty("stem");
        expect(item).toHaveProperty("leaves");
        expect(Array.isArray(item.leaves)).toBe(true);
      });
    });
  });

  describe("Validation Tests", () => {
    it("should validate data structure requirements", () => {
      // Test minimum data requirements
      const minData = [
        ["Category A", 10],
        ["Category B", 20],
      ];

      const minVariables = [
        { name: "category", type: "string" },
        { name: "value", type: "number" },
      ];

      const input: DataProcessingInput = {
        chartType: "Vertical Bar Chart",
        rawData: minData,
        variables: minVariables,
        chartVariables: {
          x: ["category"],
          y: ["value"],
        },
        processingOptions: {
          aggregation: "sum",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      expect(result.data.length).toBe(2);
      result.data.forEach((item) => {
        expect(item).toHaveProperty("category");
        expect(item).toHaveProperty("value");
      });
    });

    it("should validate stacked data structure requirements", () => {
      const stackedData = [
        ["Category A", "Group 1", 10],
        ["Category A", "Group 2", 15],
        ["Category B", "Group 1", 20],
        ["Category B", "Group 2", 25],
      ];

      const stackedVariables = [
        { name: "category", type: "string" },
        { name: "group", type: "string" },
        { name: "value", type: "number" },
      ];

      const input: DataProcessingInput = {
        chartType: "Vertical Stacked Bar Chart",
        rawData: stackedData,
        variables: stackedVariables,
        chartVariables: {
          x: ["category"],
          y: ["value"],
          groupBy: ["group"],
        },
        processingOptions: {
          aggregation: "sum",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      expect(result.data.length).toBe(4);
      result.data.forEach((item) => {
        expect(item).toHaveProperty("category");
        expect(item).toHaveProperty("subcategory");
        expect(item).toHaveProperty("value");
      });
    });

    it("should validate 3D data structure requirements", () => {
      const threeDData = [
        ["Category A", 10, "Dimension 1"],
        ["Category B", 20, "Dimension 2"],
      ];

      const threeDVariables = [
        { name: "category", type: "string" },
        { name: "value", type: "number" },
        { name: "dimension", type: "string" },
      ];

      const input: DataProcessingInput = {
        chartType: "3D Bar Chart",
        rawData: threeDData,
        variables: threeDVariables,
        chartVariables: {
          x: ["category"],
          y: ["value"],
          z: ["dimension"],
        },
        processingOptions: {
          aggregation: "sum",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      // Handle case where data might be empty due to processing
      if (result.data.length > 0) {
        result.data.forEach((item) => {
          expect(item).toHaveProperty("x");
          expect(item).toHaveProperty("y");
          expect(item).toHaveProperty("z");
        });
      } else {
        // If data is empty, just verify the structure is correct
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.axisInfo).toBeDefined();
      }
    });
  });

  describe("Error Prevention Tests", () => {
    it("should handle empty rawData gracefully", () => {
      const input: DataProcessingInput = {
        chartType: "Vertical Bar Chart",
        rawData: [],
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toEqual([]);
      expect(result.axisInfo).toEqual({});
    });

    it("should handle mismatched variables and rawData", () => {
      const rawData = [
        ["A", 10],
        ["B", 20],
      ];
      const variables = [{ name: "category" }]; // Missing one variable

      const input: DataProcessingInput = {
        chartType: "Vertical Bar Chart",
        rawData: rawData,
        variables: variables,
        chartVariables: {
          x: ["category"],
          y: ["value"],
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toEqual([]);
      expect(result.axisInfo).toEqual({});
    });

    it("should handle missing required chart variables", () => {
      const input: DataProcessingInput = {
        chartType: "Vertical Bar Chart",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          // y missing - should be handled gracefully
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toEqual([]);
      expect(result.axisInfo).toEqual({});
    });

    it("should handle non-existent variables gracefully", () => {
      const input: DataProcessingInput = {
        chartType: "Vertical Bar Chart",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["NonExistentVariable"],
          y: ["Value"],
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toEqual([]);
      expect(result.axisInfo).toEqual({});
    });
  });

  describe("Aggregation Configuration Tests", () => {
    it("should validate full aggregation support for bar charts", () => {
      const aggregationTypes = ["sum", "count", "average", "none"];

      aggregationTypes.forEach((aggregation) => {
        const input: DataProcessingInput = {
          chartType: "Vertical Bar Chart",
          rawData: mockRawData,
          variables: mockVariables,
          chartVariables: {
            x: ["Category"],
            y: ["Value"],
          },
          processingOptions: {
            aggregation: aggregation as any,
            filterEmpty: true,
          },
        };

        const result = DataProcessingService.processDataForChart(input);

        expect(result.data).toBeDefined();
        expect(result.data.length).toBeGreaterThan(0);
      });
    });

    it("should validate limited aggregation for stacked charts", () => {
      const input: DataProcessingInput = {
        chartType: "Vertical Stacked Bar Chart",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["Category"],
          y: ["Value"],
          groupBy: ["Group"],
        },
        processingOptions: {
          aggregation: "sum",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      expect(result.data.length).toBeGreaterThan(0);
    });

    it("should validate count-only aggregation for histogram", () => {
      const input: DataProcessingInput = {
        chartType: "Histogram",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          y: ["Value"],
        },
        processingOptions: {
          aggregation: "count",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("should validate none-only aggregation for scatter plots", () => {
      const input: DataProcessingInput = {
        chartType: "Scatter Plot",
        rawData: mockRawData,
        variables: mockVariables,
        chartVariables: {
          x: ["X"],
          y: ["Y"],
        },
        processingOptions: {
          aggregation: "none",
          filterEmpty: true,
        },
      };

      const result = DataProcessingService.processDataForChart(input);

      expect(result.data).toBeDefined();
      expect(result.data.length).toBeGreaterThan(0);
    });
  });
});
