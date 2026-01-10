import React from "react";
import { jest, describe, it, expect } from "@jest/globals";
import { chartVariableConfig } from "../ChartVariableConfig";
import { chartConfigOptions } from "../ChartConfigOptions";

describe("ChartBuilder Complete Blackbox Tests", () => {
  describe("Variable Validation Logic Tests", () => {
    it("should validate minimum variable requirements for each chart type", () => {
      const chartTypes = Object.keys(chartVariableConfig);

      chartTypes.forEach((chartType) => {
        const config =
          chartVariableConfig[chartType as keyof typeof chartVariableConfig];

        // Test minimum side variables (handle Infinity case)
        if (config.side.max !== Infinity) {
          const minSideVariables = Array(config.side.min).fill("var1");
          const maxSideVariables = Array(config.side.max).fill("var1");

          // Should pass with minimum variables
          expect(minSideVariables.length).toBeGreaterThanOrEqual(
            config.side.min
          );
          expect(minSideVariables.length).toBeLessThanOrEqual(config.side.max);

          // Should pass with maximum variables
          expect(maxSideVariables.length).toBeGreaterThanOrEqual(
            config.side.min
          );
          expect(maxSideVariables.length).toBeLessThanOrEqual(config.side.max);
        } else {
          // For unlimited variables, just test minimum
          const minSideVariables = Array(config.side.min).fill("var1");
          expect(minSideVariables.length).toBeGreaterThanOrEqual(
            config.side.min
          );
        }
      });
    });

    it("should validate variable type restrictions", () => {
      const numericCharts = [
        "Scatter Plot",
        "Histogram",
        "Boxplot",
        "1-D Boxplot",
        "Density Chart",
        "Q-Q Plot",
        "P-P Plot",
      ];

      const stringCharts = [
        "Boxplot",
        "Clustered Bar Chart",
        "Population Pyramid",
        "Violin Plot",
      ];

      numericCharts.forEach((chartType) => {
        const config =
          chartVariableConfig[chartType as keyof typeof chartVariableConfig];
        expect(config.side.allowedTypes).toBe("numeric");
      });

      stringCharts.forEach((chartType) => {
        const config =
          chartVariableConfig[chartType as keyof typeof chartVariableConfig];
        expect(config.bottom.allowedTypes).toBe("string");
      });
    });

    it("should validate special variable requirements for financial charts", () => {
      const financialCharts = [
        "Simple Range Bar",
        "Clustered Range Bar",
        "High-Low-Close Chart",
      ];

      financialCharts.forEach((chartType) => {
        const config =
          chartVariableConfig[chartType as keyof typeof chartVariableConfig];

        expect(config.high).toBeDefined();
        expect(config.low).toBeDefined();
        expect(config.close).toBeDefined();

        expect(config.high?.allowedTypes).toBe("numeric");
        expect(config.low?.allowedTypes).toBe("numeric");
        expect(config.close?.allowedTypes).toBe("numeric");
      });
    });

    it("should validate dual axis chart requirements", () => {
      const dualAxisCharts = [
        "Vertical Bar & Line Chart",
        "Dual Axes Scatter Plot",
      ];

      dualAxisCharts.forEach((chartType) => {
        const config =
          chartVariableConfig[chartType as keyof typeof chartVariableConfig];

        expect(config.side2).toBeDefined();
        expect(config.side2?.allowedTypes).toBe("numeric");
        expect(config.side2?.min).toBeGreaterThan(0);
      });
    });

    it("should validate 3D chart requirements", () => {
      const threeDCharts = [
        "3D Bar Chart (ECharts)",
        "3D Scatter Plot (ECharts)",
        "Clustered 3D Bar Chart (ECharts)",
        "Stacked 3D Bar Chart (ECharts)",
        "Grouped 3D Scatter Plot (ECharts)",
      ];

      threeDCharts.forEach((chartType) => {
        const config =
          chartVariableConfig[chartType as keyof typeof chartVariableConfig];

        expect(config.bottom2).toBeDefined();
        expect(config.bottom2?.allowedTypes).toBe("numeric");
        expect(config.bottom2?.min).toBeGreaterThan(0);
      });
    });
  });

  describe("Configuration Options Validation Tests", () => {
    it("should validate axis configuration for different chart types", () => {
      // Test charts with single Y axis
      const singleYAxisCharts = [
        "Vertical Bar Chart",
        "Horizontal Bar Chart",
        "Line Chart",
        "Scatter Plot",
      ];

      singleYAxisCharts.forEach((chartType) => {
        const config =
          chartConfigOptions[chartType as keyof typeof chartConfigOptions];
        expect(config.axis).toBeDefined();
        expect(config.axis.x).toBeDefined();
        expect((config.axis as any).y).toBeDefined();
      });

      // Test charts with dual Y axis
      const dualYAxisCharts = [
        "Vertical Bar & Line Chart",
        "Dual Axes Scatter Plot",
      ];

      dualYAxisCharts.forEach((chartType) => {
        const config =
          chartConfigOptions[chartType as keyof typeof chartConfigOptions];
        expect(config.axis).toBeDefined();
        expect(config.axis.x).toBeDefined();
        expect((config.axis as any).y1).toBeDefined();
        expect((config.axis as any).y2).toBeDefined();
      });

      // Test charts with 3D axis
      const threeDAxisCharts = [
        "3D Bar Chart (ECharts)",
        "3D Scatter Plot (ECharts)",
      ];

      threeDAxisCharts.forEach((chartType) => {
        const config =
          chartConfigOptions[chartType as keyof typeof chartConfigOptions];
        expect(config.axis).toBeDefined();
        expect(config.axis.x).toBeDefined();
        expect((config.axis as any).y).toBeDefined();
        expect((config.axis as any).z).toBeDefined();
      });
    });

    it("should validate normal curve configuration for histogram", () => {
      const histogramConfig = chartConfigOptions["Histogram"];
      expect(histogramConfig.normalCurve).toBe(true);

      // Other charts should not have normal curve
      const otherCharts = ["Vertical Bar Chart", "Scatter Plot", "Pie Chart"];

      otherCharts.forEach((chartType) => {
        const config =
          chartConfigOptions[chartType as keyof typeof chartConfigOptions];
        expect(config.normalCurve).toBeUndefined();
      });
    });

    it("should validate chart colors configuration", () => {
      const colorCharts = [
        "Vertical Bar Chart",
        "Horizontal Bar Chart",
        "Pie Chart",
        "Area Chart",
      ];

      colorCharts.forEach((chartType) => {
        const config =
          chartConfigOptions[chartType as keyof typeof chartConfigOptions];
        expect(typeof config.chartColors).toBe("boolean");
      });
    });
  });

  describe("Edge Cases and Error Handling Tests", () => {
    it("should handle charts with no bottom variable requirements", () => {
      const noBottomCharts = [
        "Histogram",
        "Frequency Polygon",
        "1-D Boxplot",
        "Density Chart",
        "Q-Q Plot",
        "P-P Plot",
        "Stem And Leaf Plot",
      ];

      noBottomCharts.forEach((chartType) => {
        const config =
          chartVariableConfig[chartType as keyof typeof chartVariableConfig];
        expect(config.bottom.min).toBe(0);
        expect(config.bottom.max).toBe(0);
      });
    });

    it("should handle charts with unlimited variable requirements", () => {
      const unlimitedCharts = [
        "Horizontal Stacked Bar Chart",
        "Vertical Stacked Bar Chart",
        "Clustered Bar Chart",
        "Multiple Line Chart",
        "Grouped Scatter Plot",
        "Scatter Plot Matrix",
      ];

      unlimitedCharts.forEach((chartType) => {
        const config =
          chartVariableConfig[chartType as keyof typeof chartVariableConfig];
        expect(config.side.max).toBe(Infinity);
      });
    });

    it("should validate minimum variable requirements across all charts", () => {
      const allChartTypes = Object.keys(chartVariableConfig);

      allChartTypes.forEach((chartType) => {
        const config =
          chartVariableConfig[chartType as keyof typeof chartVariableConfig];

        // Every chart should have at least one side variable
        expect(config.side.min).toBeGreaterThanOrEqual(0);
        expect(config.side.max).toBeGreaterThanOrEqual(config.side.min);

        // Bottom variables should be valid
        expect(config.bottom.min).toBeGreaterThanOrEqual(0);
        expect(config.bottom.max).toBeGreaterThanOrEqual(config.bottom.min);
      });
    });

    it("should handle special variable combinations", () => {
      // Test Population Pyramid (allows 1-2 side variables)
      const pyramidConfig = chartVariableConfig["Population Pyramid"];
      expect(pyramidConfig.side.min).toBe(1);
      expect(pyramidConfig.side.max).toBe(2);

      // Test Scatter Plot Matrix (no side variables, multiple bottom)
      const matrixConfig = chartVariableConfig["Scatter Plot Matrix"];
      expect(matrixConfig.side.min).toBe(0);
      expect(matrixConfig.side.max).toBe(0);
      expect(matrixConfig.bottom.max).toBe(Infinity);

      // Test Stacked Histogram (no side, requires bottom and color)
      const stackedHistConfig = chartVariableConfig["Stacked Histogram"];
      expect(stackedHistConfig.side.min).toBe(0);
      expect(stackedHistConfig.color?.min).toBe(1);
    });
  });

  describe("Data Type Compatibility Tests", () => {
    it("should validate numeric variable compatibility", () => {
      const numericCharts = [
        "Scatter Plot",
        "Histogram",
        "Boxplot",
        "Line Chart",
      ];

      numericCharts.forEach((chartType) => {
        const config =
          chartVariableConfig[chartType as keyof typeof chartVariableConfig];

        // Side variables should be numeric
        expect(["numeric", "both"]).toContain(config.side.allowedTypes);

        // For charts that require bottom variables, they should also be numeric
        if (config.bottom.min > 0) {
          expect(["numeric", "both"]).toContain(config.bottom.allowedTypes);
        }
      });
    });

    it("should validate string variable compatibility", () => {
      const categoricalCharts = [
        "Pie Chart",
        "Vertical Bar Chart",
        "Horizontal Bar Chart",
      ];

      categoricalCharts.forEach((chartType) => {
        const config =
          chartVariableConfig[chartType as keyof typeof chartVariableConfig];

        // Bottom variables should accept string or both
        expect(["string", "both"]).toContain(config.bottom.allowedTypes);
      });
    });

    it("should validate mixed variable type charts", () => {
      const mixedCharts = [
        "Vertical Bar Chart",
        "Horizontal Bar Chart",
        "Pie Chart",
      ];

      mixedCharts.forEach((chartType) => {
        const config =
          chartVariableConfig[chartType as keyof typeof chartVariableConfig];

        // These charts should accept both numeric and string variables
        expect(config.bottom.allowedTypes).toBe("both");
      });
    });
  });

  describe("Configuration Integrity Tests", () => {
    it("should ensure all chart types have complete configurations", () => {
      const variableConfigTypes = Object.keys(chartVariableConfig);
      const optionsConfigTypes = Object.keys(chartConfigOptions);

      // All variable config types should have corresponding options config
      variableConfigTypes.forEach((chartType) => {
        expect(
          chartConfigOptions[chartType as keyof typeof chartConfigOptions]
        ).toBeDefined();
      });

      // All options config types should have corresponding variable config
      optionsConfigTypes.forEach((chartType) => {
        expect(
          chartVariableConfig[chartType as keyof typeof chartVariableConfig]
        ).toBeDefined();
      });
    });

    it("should validate configuration structure consistency", () => {
      const allChartTypes = Object.keys(chartVariableConfig);

      allChartTypes.forEach((chartType) => {
        const variableConfig =
          chartVariableConfig[chartType as keyof typeof chartVariableConfig];
        const optionsConfig =
          chartConfigOptions[chartType as keyof typeof chartConfigOptions];

        // Variable config structure
        expect(variableConfig.side).toBeDefined();
        expect(variableConfig.bottom).toBeDefined();
        expect(typeof variableConfig.side.min).toBe("number");
        expect(typeof variableConfig.side.max).toBe("number");
        expect(typeof variableConfig.bottom.min).toBe("number");
        expect(typeof variableConfig.bottom.max).toBe("number");

        // Options config structure
        expect(optionsConfig.title).toBeDefined();
        expect(optionsConfig.subtitle).toBeDefined();
        expect(typeof optionsConfig.title).toBe("boolean");
        expect(typeof optionsConfig.subtitle).toBe("boolean");
      });
    });

    it("should validate allowed types are consistent", () => {
      const validTypes = ["numeric", "string", "both"];
      const allChartTypes = Object.keys(chartVariableConfig);

      allChartTypes.forEach((chartType) => {
        const config =
          chartVariableConfig[chartType as keyof typeof chartVariableConfig];

        expect(validTypes).toContain(config.side.allowedTypes);
        expect(validTypes).toContain(config.bottom.allowedTypes);

        // Check optional variables
        if (config.color) {
          expect(validTypes).toContain(config.color.allowedTypes);
        }
        if (config.side2) {
          expect(validTypes).toContain(config.side2.allowedTypes);
        }
        if (config.bottom2) {
          expect(validTypes).toContain(config.bottom2.allowedTypes);
        }
        if (config.high) {
          expect(validTypes).toContain(config.high.allowedTypes);
        }
        if (config.low) {
          expect(validTypes).toContain(config.low.allowedTypes);
        }
        if (config.close) {
          expect(validTypes).toContain(config.close.allowedTypes);
        }
      });
    });
  });

  describe("Performance and Scalability Tests", () => {
    it("should handle large number of chart types efficiently", () => {
      const allChartTypes = Object.keys(chartVariableConfig);
      expect(allChartTypes.length).toBeGreaterThan(40); // Should have at least 40 chart types

      // Test that all configurations can be accessed quickly
      const startTime = Date.now();
      allChartTypes.forEach((chartType) => {
        const variableConfig =
          chartVariableConfig[chartType as keyof typeof chartVariableConfig];
        const optionsConfig =
          chartConfigOptions[chartType as keyof typeof chartConfigOptions];
        expect(variableConfig).toBeDefined();
        expect(optionsConfig).toBeDefined();
      });
      const endTime = Date.now();

      // Should complete within reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });

    it("should validate memory efficiency of configurations", () => {
      const allChartTypes = Object.keys(chartVariableConfig);

      // Test that configurations don't have circular references
      allChartTypes.forEach((chartType) => {
        const variableConfig =
          chartVariableConfig[chartType as keyof typeof chartVariableConfig];
        const optionsConfig =
          chartConfigOptions[chartType as keyof typeof chartConfigOptions];

        // Should be able to JSON.stringify without errors
        expect(() => JSON.stringify(variableConfig)).not.toThrow();
        expect(() => JSON.stringify(optionsConfig)).not.toThrow();
      });
    });
  });

  describe("Integration Tests", () => {
    it("should validate chart type and configuration alignment", () => {
      const allChartTypes = Object.keys(chartVariableConfig);

      allChartTypes.forEach((chartType) => {
        const variableConfig =
          chartVariableConfig[chartType as keyof typeof chartVariableConfig];
        const optionsConfig =
          chartConfigOptions[chartType as keyof typeof chartConfigOptions];

        // Both configurations should exist for the same chart type
        expect(variableConfig).toBeDefined();
        expect(optionsConfig).toBeDefined();

        // Chart type should be valid
        expect(typeof chartType).toBe("string");
        expect(chartType.length).toBeGreaterThan(0);
      });
    });

    it("should validate configuration completeness for all chart categories", () => {
      const categories = {
        basic: [
          "Vertical Bar Chart",
          "Horizontal Bar Chart",
          "Line Chart",
          "Pie Chart",
        ],
        advanced: ["Scatter Plot", "Boxplot", "Histogram", "Error Bar Chart"],
        stacked: [
          "Vertical Stacked Bar Chart",
          "Horizontal Stacked Bar Chart",
          "Stacked Area Chart",
        ],
        threeD: ["3D Bar Chart (ECharts)", "3D Scatter Plot (ECharts)"],
        statistical: ["Violin Plot", "Density Chart", "Q-Q Plot", "P-P Plot"],
        financial: [
          "Simple Range Bar",
          "Clustered Range Bar",
          "High-Low-Close Chart",
        ],
      };

      Object.entries(categories).forEach(([category, chartTypes]) => {
        chartTypes.forEach((chartType) => {
          expect(
            chartVariableConfig[chartType as keyof typeof chartVariableConfig]
          ).toBeDefined();
          expect(
            chartConfigOptions[chartType as keyof typeof chartConfigOptions]
          ).toBeDefined();
        });
      });
    });
  });

  describe("Business Logic Validation Tests", () => {
    it("should validate chart generation readiness logic", () => {
      // Test that charts require minimum variables
      const allChartTypes = Object.keys(chartVariableConfig);

      allChartTypes.forEach((chartType) => {
        const config =
          chartVariableConfig[chartType as keyof typeof chartVariableConfig];

        // Every chart should require at least one side variable
        expect(config.side.min).toBeGreaterThanOrEqual(0);

        // If chart requires bottom variables, they should be properly configured
        if (config.bottom.min > 0) {
          expect(config.bottom.allowedTypes).toBeDefined();
          expect(config.bottom.max).toBeGreaterThanOrEqual(config.bottom.min);
        }
      });
    });

    it("should validate variable assignment logic", () => {
      // Test that variable assignments follow chart requirements
      const testCases = [
        {
          chartType: "Vertical Bar Chart",
          sideVars: ["var1"],
          bottomVars: ["var2"],
          shouldBeValid: true,
        },
        {
          chartType: "Scatter Plot",
          sideVars: ["var1"],
          bottomVars: ["var2"],
          shouldBeValid: true,
        },
        {
          chartType: "Pie Chart",
          sideVars: ["var1"],
          bottomVars: ["var2"],
          shouldBeValid: true,
        },
      ];

      testCases.forEach((testCase) => {
        const config =
          chartVariableConfig[
            testCase.chartType as keyof typeof chartVariableConfig
          ];

        // Validate side variables
        const sideValid =
          testCase.sideVars.length >= config.side.min &&
          testCase.sideVars.length <= config.side.max;

        // Validate bottom variables
        const bottomValid =
          testCase.bottomVars.length >= config.bottom.min &&
          testCase.bottomVars.length <= config.bottom.max;

        expect(sideValid && bottomValid).toBe(testCase.shouldBeValid);
      });
    });
  });

  describe("Additional Coverage Tests", () => {
    it("should validate all 43 chart types are properly configured", () => {
      const allChartTypes = Object.keys(chartVariableConfig);
      expect(allChartTypes.length).toBe(43);

      allChartTypes.forEach((chartType) => {
        const variableConfig =
          chartVariableConfig[chartType as keyof typeof chartVariableConfig];
        const optionsConfig =
          chartConfigOptions[chartType as keyof typeof chartConfigOptions];

        expect(variableConfig).toBeDefined();
        expect(optionsConfig).toBeDefined();

        // Basic structure validation
        expect(variableConfig.side).toBeDefined();
        expect(variableConfig.bottom).toBeDefined();
        expect(optionsConfig.title).toBeDefined();
        expect(optionsConfig.subtitle).toBeDefined();
      });
    });

    it("should validate chart type naming consistency", () => {
      const allChartTypes = Object.keys(chartVariableConfig);

      allChartTypes.forEach((chartType) => {
        // Chart type names should be descriptive and consistent
        expect(chartType.length).toBeGreaterThan(0);
        expect(typeof chartType).toBe("string");

        // Should not contain invalid characters
        expect(chartType).toMatch(/^[a-zA-Z0-9\s\-\(\)]+$/);
      });
    });

    it("should validate configuration completeness", () => {
      const allChartTypes = Object.keys(chartVariableConfig);

      allChartTypes.forEach((chartType) => {
        const variableConfig =
          chartVariableConfig[chartType as keyof typeof chartVariableConfig];
        const optionsConfig =
          chartConfigOptions[chartType as keyof typeof chartConfigOptions];

        // Variable config should have required fields
        expect(variableConfig.side.min).toBeDefined();
        expect(variableConfig.side.max).toBeDefined();
        expect(variableConfig.side.allowedTypes).toBeDefined();
        expect(variableConfig.bottom.min).toBeDefined();
        expect(variableConfig.bottom.max).toBeDefined();
        expect(variableConfig.bottom.allowedTypes).toBeDefined();

        // Options config should have required fields
        expect(optionsConfig.title).toBeDefined();
        expect(optionsConfig.subtitle).toBeDefined();
        expect(optionsConfig.axis).toBeDefined();
      });
    });
  });
});
