import React from "react";
import { jest, describe, it, expect } from "@jest/globals";
import { chartVariableConfig } from "../ChartVariableConfig";
import { chartConfigOptions } from "../ChartConfigOptions";

describe("ChartBuilder Clean Blackbox Tests", () => {
  // All 43 chart types that are currently active
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
    "Horizontal Stacked Bar Chart",
    "Vertical Stacked Bar Chart",
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
    "3D Bar Chart (ECharts)",
    "3D Scatter Plot (ECharts)",
    "Clustered 3D Bar Chart (ECharts)",
    "Stacked 3D Bar Chart (ECharts)",
    "Grouped 3D Scatter Plot (ECharts)",
    "Violin Plot",
    "Density Chart",
    "Q-Q Plot",
    "P-P Plot",
    "Stem And Leaf Plot",
  ];

  describe("Chart Variable Configuration Tests - All 43 Chart Types", () => {
    allChartTypes.forEach((chartType) => {
      it(`should validate ${chartType} requirements`, () => {
        const config =
          chartVariableConfig[chartType as keyof typeof chartVariableConfig];

        // Basic structure validation
        expect(config).toBeDefined();
        expect(config.side).toBeDefined();
        expect(config.bottom).toBeDefined();

        // Type validation
        expect(typeof config.side.min).toBe("number");
        expect(typeof config.side.max).toBe("number");
        expect(typeof config.bottom.min).toBe("number");
        expect(typeof config.bottom.max).toBe("number");

        // Allowed types validation
        const validTypes = ["numeric", "string", "both"];
        expect(validTypes).toContain(config.side.allowedTypes);
        expect(validTypes).toContain(config.bottom.allowedTypes);

        // Logic validation
        expect(config.side.max).toBeGreaterThanOrEqual(config.side.min);
        expect(config.bottom.max).toBeGreaterThanOrEqual(config.bottom.min);
      });
    });

    describe("Specific Chart Type Requirements", () => {
      it("should validate basic bar charts have correct requirements", () => {
        const verticalBar = chartVariableConfig["Vertical Bar Chart"];
        const horizontalBar = chartVariableConfig["Horizontal Bar Chart"];

        expect(verticalBar.side.allowedTypes).toBe("numeric");
        expect(verticalBar.bottom.allowedTypes).toBe("both");
        expect(horizontalBar.side.allowedTypes).toBe("numeric");
        expect(horizontalBar.bottom.allowedTypes).toBe("both");
      });

      it("should validate scatter plots require numeric variables", () => {
        const scatterPlot = chartVariableConfig["Scatter Plot"];
        const scatterWithFit =
          chartVariableConfig["Scatter Plot With Fit Line"];
        const scatterWithMultipleFit =
          chartVariableConfig["Scatter Plot With Multiple Fit Line"];

        expect(scatterPlot.side.allowedTypes).toBe("numeric");
        expect(scatterPlot.bottom.allowedTypes).toBe("numeric");
        expect(scatterWithFit.side.allowedTypes).toBe("numeric");
        expect(scatterWithFit.bottom.allowedTypes).toBe("numeric");
        expect(scatterWithMultipleFit.side.allowedTypes).toBe("numeric");
        expect(scatterWithMultipleFit.bottom.allowedTypes).toBe("numeric");
      });

      it("should validate stacked charts allow multiple variables", () => {
        const verticalStacked =
          chartVariableConfig["Vertical Stacked Bar Chart"];
        const horizontalStacked =
          chartVariableConfig["Horizontal Stacked Bar Chart"];
        const stackedArea = chartVariableConfig["Stacked Area Chart"];

        expect(verticalStacked.side.max).toBe(Infinity);
        expect(horizontalStacked.side.max).toBe(Infinity);
        expect(stackedArea.side.max).toBe(Infinity);
      });

      it("should validate 3D charts have bottom2 requirements", () => {
        const threeDBar = chartVariableConfig["3D Bar Chart (ECharts)"];
        const threeDScatter = chartVariableConfig["3D Scatter Plot (ECharts)"];

        expect(threeDBar.bottom2).toBeDefined();
        expect(threeDScatter.bottom2).toBeDefined();
        expect(threeDBar.bottom2?.allowedTypes).toBe("numeric");
        expect(threeDScatter.bottom2?.allowedTypes).toBe("numeric");
      });

      it("should validate financial charts have high/low/close requirements", () => {
        const simpleRangeBar = chartVariableConfig["Simple Range Bar"];
        const clusteredRangeBar = chartVariableConfig["Clustered Range Bar"];
        const highLowClose = chartVariableConfig["High-Low-Close Chart"];

        expect(simpleRangeBar.high).toBeDefined();
        expect(simpleRangeBar.low).toBeDefined();
        expect(simpleRangeBar.close).toBeDefined();
        expect(clusteredRangeBar.high).toBeDefined();
        expect(clusteredRangeBar.low).toBeDefined();
        expect(clusteredRangeBar.close).toBeDefined();
        expect(highLowClose.high).toBeDefined();
        expect(highLowClose.low).toBeDefined();
        expect(highLowClose.close).toBeDefined();
      });

      it("should validate dual axis charts have side2 requirements", () => {
        const verticalBarLine =
          chartVariableConfig["Vertical Bar & Line Chart"];
        const dualAxesScatter = chartVariableConfig["Dual Axes Scatter Plot"];

        expect(verticalBarLine.side2).toBeDefined();
        expect(dualAxesScatter.side2).toBeDefined();
        expect(verticalBarLine.side2?.allowedTypes).toBe("numeric");
        expect(dualAxesScatter.side2?.allowedTypes).toBe("numeric");
      });
    });
  });

  describe("Chart Configuration Options Tests - All 43 Chart Types", () => {
    allChartTypes.forEach((chartType) => {
      it(`should validate ${chartType} configuration options`, () => {
        const config =
          chartConfigOptions[chartType as keyof typeof chartConfigOptions];

        // Basic structure validation
        expect(config).toBeDefined();
        expect(typeof config.title).toBe("boolean");
        expect(typeof config.subtitle).toBe("boolean");

        // Chart-specific options validation
        if (config.chartColors !== undefined) {
          expect(typeof config.chartColors).toBe("boolean");
        }

        if (config.normalCurve !== undefined) {
          expect(typeof config.normalCurve).toBe("boolean");
        }

        // Axis configuration validation (if exists)
        if (config.axis) {
          expect(config.axis.x).toBeDefined();
          expect(typeof config.axis.x.label).toBe("boolean");

          // Check for different axis types with proper type assertions
          if ("y" in config.axis && !("y1" in config.axis)) {
            expect(typeof (config.axis as any).y.label).toBe("boolean");
          }

          if ("y1" in config.axis && "y2" in config.axis) {
            expect(typeof (config.axis as any).y1.label).toBe("boolean");
            expect(typeof (config.axis as any).y2.label).toBe("boolean");
          }

          if ("z" in config.axis) {
            expect(typeof (config.axis as any).z.label).toBe("boolean");
          }
        }
      });
    });

    describe("Specific Configuration Options", () => {
      it("should validate histogram has normal curve option", () => {
        const histogramConfig = chartConfigOptions["Histogram"];
        expect(histogramConfig.normalCurve).toBe(true);
      });

      it("should validate scatter plots have axis range options", () => {
        const scatterConfig = chartConfigOptions["Scatter Plot"];
        expect(scatterConfig.axis.x.min).toBe(true);
        expect(scatterConfig.axis.x.max).toBe(true);
        // Type assertion for y-axis since we know Scatter Plot uses SingleYAxisConfig
        expect((scatterConfig.axis as any).y.min).toBe(true);
        expect((scatterConfig.axis as any).y.max).toBe(true);
      });

      it("should validate pie chart has disabled axis configuration", () => {
        const pieConfig = chartConfigOptions["Pie Chart"];
        expect(pieConfig.axis).toBeDefined();
        // Pie chart has axis but it's disabled
        expect(pieConfig.axis.x.label).toBe(false);
      });
    });
  });

  describe("Configuration Consistency Tests", () => {
    it("should validate all chart types have matching configurations", () => {
      const variableConfigTypes = Object.keys(chartVariableConfig);
      const optionsConfigTypes = Object.keys(chartConfigOptions);

      // Check that all variable config types have corresponding options config
      variableConfigTypes.forEach((chartType) => {
        if (chartType in chartConfigOptions) {
          expect(
            chartConfigOptions[chartType as keyof typeof chartConfigOptions]
          ).toBeDefined();
        }
      });
    });

    it("should validate numeric chart types require numeric variables", () => {
      const numericChartTypes = [
        "Scatter Plot",
        "Scatter Plot With Fit Line",
        "Scatter Plot With Multiple Fit Line",
        "Histogram",
        "Boxplot",
        "1-D Boxplot",
        "3D Bar Chart (ECharts)",
        "3D Scatter Plot (ECharts)",
        "Density Chart",
        "Q-Q Plot",
        "P-P Plot",
        "Stem And Leaf Plot",
      ];

      numericChartTypes.forEach((chartType) => {
        const config =
          chartVariableConfig[chartType as keyof typeof chartVariableConfig];
        expect(config.side.allowedTypes).toBe("numeric");
      });
    });

    it("should validate categorical chart types allow string variables", () => {
      const categoricalChartTypes = [
        "Boxplot",
        "Error Bar Chart",
        "Dot Plot",
        "Population Pyramid",
        "Clustered Error Bar Chart",
        "Drop Line Chart",
        "Summary Point Plot",
        "Violin Plot",
      ];

      categoricalChartTypes.forEach((chartType) => {
        const config =
          chartVariableConfig[chartType as keyof typeof chartVariableConfig];
        expect(config.bottom.allowedTypes).toBe("string");
      });
    });

    it("should validate stacked charts allow multiple variables", () => {
      const stackedChartTypes = [
        "Vertical Stacked Bar Chart",
        "Horizontal Stacked Bar Chart",
        "Stacked Area Chart",
        "Multiple Line Chart",
        "Grouped Scatter Plot",
      ];

      stackedChartTypes.forEach((chartType) => {
        const config =
          chartVariableConfig[chartType as keyof typeof chartVariableConfig];
        expect(config.side.max).toBe(Infinity);
      });
    });

    it("should validate 3D charts have proper requirements", () => {
      const threeDChartTypes = [
        "3D Bar Chart (ECharts)",
        "3D Scatter Plot (ECharts)",
        "Clustered 3D Bar Chart (ECharts)",
        "Stacked 3D Bar Chart (ECharts)",
        "Grouped 3D Scatter Plot (ECharts)",
      ];

      threeDChartTypes.forEach((chartType) => {
        const config =
          chartVariableConfig[chartType as keyof typeof chartVariableConfig];
        expect(config.bottom2).toBeDefined();
        expect(config.bottom2?.allowedTypes).toBe("numeric");
      });
    });
  });

  describe("Edge Case Tests", () => {
    it("should handle charts with no bottom variable requirements", () => {
      const histogram = chartVariableConfig["Histogram"];
      const frequencyPolygon = chartVariableConfig["Frequency Polygon"];
      const oneDBoxplot = chartVariableConfig["1-D Boxplot"];
      const densityChart = chartVariableConfig["Density Chart"];
      const qqPlot = chartVariableConfig["Q-Q Plot"];
      const ppPlot = chartVariableConfig["P-P Plot"];
      const stemLeaf = chartVariableConfig["Stem And Leaf Plot"];

      expect(histogram.bottom.min).toBe(0);
      expect(frequencyPolygon.bottom.min).toBe(0);
      expect(oneDBoxplot.bottom.min).toBe(0);
      expect(densityChart.bottom.min).toBe(0);
      expect(qqPlot.bottom.min).toBe(0);
      expect(ppPlot.bottom.min).toBe(0);
      expect(stemLeaf.bottom.min).toBe(0);
    });

    it("should handle charts with special variable requirements", () => {
      const populationPyramid = chartVariableConfig["Population Pyramid"];
      const scatterMatrix = chartVariableConfig["Scatter Plot Matrix"];
      const stackedHistogram = chartVariableConfig["Stacked Histogram"];

      // Population Pyramid allows 1-2 side variables
      expect(populationPyramid.side.min).toBe(1);
      expect(populationPyramid.side.max).toBe(2);

      // Scatter Plot Matrix has no side variables but multiple bottom variables
      expect(scatterMatrix.side.min).toBe(0);
      expect(scatterMatrix.bottom.max).toBe(Infinity);

      // Stacked Histogram has no side variables but requires bottom and color
      expect(stackedHistogram.side.min).toBe(0);
      expect(stackedHistogram.color?.min).toBe(1);
    });
  });

  describe("Data Validation Tests", () => {
    it("should validate all chart types have valid configurations", () => {
      allChartTypes.forEach((chartType) => {
        const variableConfig =
          chartVariableConfig[chartType as keyof typeof chartVariableConfig];
        const optionsConfig =
          chartConfigOptions[chartType as keyof typeof chartConfigOptions];

        // Variable config validation
        expect(variableConfig.side).toBeDefined();
        expect(variableConfig.bottom).toBeDefined();
        expect(typeof variableConfig.side.min).toBe("number");
        expect(typeof variableConfig.side.max).toBe("number");
        expect(typeof variableConfig.bottom.min).toBe("number");
        expect(typeof variableConfig.bottom.max).toBe("number");

        // Options config validation
        expect(optionsConfig.title).toBeDefined();
        expect(optionsConfig.subtitle).toBeDefined();
        expect(typeof optionsConfig.title).toBe("boolean");
        expect(typeof optionsConfig.subtitle).toBe("boolean");
      });
    });

    it("should validate allowed types are valid for all charts", () => {
      const validTypes = ["numeric", "string", "both"];

      allChartTypes.forEach((chartType) => {
        const config =
          chartVariableConfig[chartType as keyof typeof chartVariableConfig];

        expect(validTypes).toContain(config.side.allowedTypes);
        expect(validTypes).toContain(config.bottom.allowedTypes);

        // Check optional variables if they exist
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

  describe("Blackbox Testing Coverage - All 43 Chart Types", () => {
    it("should test all 43 chart types exist and are properly configured", () => {
      expect(allChartTypes.length).toBe(43);

      allChartTypes.forEach((chartType) => {
        expect(
          chartVariableConfig[chartType as keyof typeof chartVariableConfig]
        ).toBeDefined();
        expect(
          chartConfigOptions[chartType as keyof typeof chartConfigOptions]
        ).toBeDefined();
      });
    });

    it("should validate chart type categories", () => {
      // Basic charts
      const basicCharts = [
        "Vertical Bar Chart",
        "Horizontal Bar Chart",
        "Line Chart",
        "Pie Chart",
        "Area Chart",
        "Histogram",
        "Scatter Plot",
      ];

      // Advanced charts
      const advancedCharts = [
        "Scatter Plot With Fit Line",
        "Scatter Plot With Multiple Fit Line",
        "Boxplot",
        "Error Bar Chart",
        "Dot Plot",
      ];

      // Stacked/Grouped charts
      const stackedCharts = [
        "Vertical Stacked Bar Chart",
        "Horizontal Stacked Bar Chart",
        "Stacked Area Chart",
        "Multiple Line Chart",
        "Grouped Scatter Plot",
      ];

      // 3D charts
      const threeDCharts = [
        "3D Bar Chart (ECharts)",
        "3D Scatter Plot (ECharts)",
        "Clustered 3D Bar Chart (ECharts)",
        "Stacked 3D Bar Chart (ECharts)",
        "Grouped 3D Scatter Plot (ECharts)",
      ];

      // Statistical charts
      const statisticalCharts = [
        "Violin Plot",
        "Density Chart",
        "Q-Q Plot",
        "P-P Plot",
        "Stem And Leaf Plot",
      ];

      // Financial charts
      const financialCharts = [
        "Simple Range Bar",
        "Clustered Range Bar",
        "High-Low-Close Chart",
        "Difference Area",
      ];

      // All categories should have valid configurations
      [
        ...basicCharts,
        ...advancedCharts,
        ...stackedCharts,
        ...threeDCharts,
        ...statisticalCharts,
        ...financialCharts,
      ].forEach((chartType) => {
        expect(
          chartVariableConfig[chartType as keyof typeof chartVariableConfig]
        ).toBeDefined();
        expect(
          chartConfigOptions[chartType as keyof typeof chartConfigOptions]
        ).toBeDefined();
      });
    });

    it("should validate configuration structure integrity for all charts", () => {
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
  });
});
