import { ChartType } from "@/components/Modals/Graphs/ChartTypes";

export type AllowedDataTypes = "numeric" | "string" | "both";

export interface VariableConfig {
  min: number;
  max: number;
  allowedTypes?: AllowedDataTypes;
}

export interface ChartVariableRequirements {
  side: VariableConfig;
  bottom: VariableConfig;
  side2?: VariableConfig;
  color?: VariableConfig;
  filter?: VariableConfig;
  high?: VariableConfig;
  low?: VariableConfig;
  close?: VariableConfig;
  bottom2?: VariableConfig;
}

export const chartVariableConfig: Record<ChartType, ChartVariableRequirements> =
  {
    "Vertical Bar Chart": {
      side: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom: { min: 1, max: 1, allowedTypes: "both" },
      color: { min: 0, max: 0, allowedTypes: "both" },
      filter: { min: 0, max: 0, allowedTypes: "both" },
    },
    "Horizontal Bar Chart": {
      side: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom: { min: 1, max: 1, allowedTypes: "both" },
      color: { min: 0, max: 0, allowedTypes: "both" },
      filter: { min: 0, max: 0, allowedTypes: "both" },
    },
    "Line Chart": {
      side: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom: { min: 1, max: 1, allowedTypes: "both" },
      color: { min: 0, max: 0, allowedTypes: "both" },
      filter: { min: 0, max: 0, allowedTypes: "both" },
    },
    "Pie Chart": {
      side: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom: { min: 1, max: 1, allowedTypes: "both" },
      color: { min: 0, max: 0, allowedTypes: "both" },
      filter: { min: 0, max: 0, allowedTypes: "both" },
    },
    "Area Chart": {
      side: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom: { min: 1, max: 1, allowedTypes: "both" },
      color: { min: 0, max: 0, allowedTypes: "both" },
      filter: { min: 0, max: 0, allowedTypes: "both" },
    },
    Histogram: {
      side: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom: { min: 0, max: 0, allowedTypes: "both" },
      color: { min: 0, max: 0, allowedTypes: "both" },
      filter: { min: 0, max: 0, allowedTypes: "both" },
    },
    "Scatter Plot": {
      side: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom: { min: 1, max: 1, allowedTypes: "numeric" },
      color: { min: 0, max: 0, allowedTypes: "both" },
      filter: { min: 0, max: 0, allowedTypes: "both" },
    },
    "Scatter Plot With Fit Line": {
      side: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom: { min: 1, max: 1, allowedTypes: "numeric" },
      color: { min: 0, max: 0, allowedTypes: "both" },
      filter: { min: 0, max: 0, allowedTypes: "both" },
    },
    "Scatter Plot With Multiple Fit Line": {
      side: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom: { min: 1, max: 1, allowedTypes: "numeric" },
      color: { min: 0, max: 0, allowedTypes: "both" },
      filter: { min: 0, max: 0, allowedTypes: "both" },
    },
    Boxplot: {
      side: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom: { min: 1, max: 1, allowedTypes: "string" },
      color: { min: 0, max: 0, allowedTypes: "both" },
      filter: { min: 0, max: 0, allowedTypes: "both" },
    },
    "Horizontal Stacked Bar Chart": {
      side: { min: 1, max: Infinity, allowedTypes: "numeric" },
      bottom: { min: 1, max: 1, allowedTypes: "both" },
      color: { min: 0, max: 0, allowedTypes: "both" },
      filter: { min: 0, max: 0, allowedTypes: "both" },
    },
    "Vertical Stacked Bar Chart": {
      side: { min: 1, max: Infinity, allowedTypes: "numeric" },
      bottom: { min: 1, max: 1, allowedTypes: "both" },
      color: { min: 0, max: 0, allowedTypes: "both" },
      filter: { min: 0, max: 0, allowedTypes: "both" },
    },
    "Clustered Bar Chart": {
      side: { min: 1, max: Infinity, allowedTypes: "numeric" },
      bottom: { min: 1, max: 1, allowedTypes: "string" },
      color: { min: 0, max: 0, allowedTypes: "both" },
      filter: { min: 0, max: 0, allowedTypes: "both" },
    },
    "Multiple Line Chart": {
      side: { min: 1, max: Infinity, allowedTypes: "numeric" },
      bottom: { min: 1, max: 1, allowedTypes: "both" },
      color: { min: 0, max: 0, allowedTypes: "both" },
      filter: { min: 0, max: 0, allowedTypes: "both" },
    },
    "Error Bar Chart": {
      side: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom: { min: 1, max: 1, allowedTypes: "string" },
      color: { min: 0, max: 0, allowedTypes: "both" },
      filter: { min: 0, max: 0, allowedTypes: "both" },
    },
    "Stacked Area Chart": {
      side: { min: 1, max: Infinity, allowedTypes: "numeric" },
      bottom: { min: 1, max: 1, allowedTypes: "both" },
      color: { min: 0, max: 0, allowedTypes: "both" },
      filter: { min: 0, max: 0, allowedTypes: "both" },
    },
    "Grouped Scatter Plot": {
      side: { min: 1, max: Infinity, allowedTypes: "numeric" },
      bottom: { min: 1, max: 1, allowedTypes: "numeric" },
      color: { min: 0, max: 1, allowedTypes: "string" },
      filter: { min: 0, max: 0, allowedTypes: "both" },
    },
    "Dot Plot": {
      side: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom: { min: 1, max: 1, allowedTypes: "string" },
      color: { min: 0, max: 0, allowedTypes: "both" },
      filter: { min: 0, max: 0, allowedTypes: "both" },
    },
    "Population Pyramid": {
      side: { min: 1, max: 2, allowedTypes: "numeric" },
      bottom: { min: 1, max: 1, allowedTypes: "string" },
      color: { min: 0, max: 0, allowedTypes: "both" },
      filter: { min: 0, max: 0, allowedTypes: "both" },
    },
    "Frequency Polygon": {
      side: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom: { min: 0, max: 0, allowedTypes: "both" },
      color: { min: 0, max: 0, allowedTypes: "both" },
      filter: { min: 0, max: 0, allowedTypes: "both" },
    },
    "Clustered Error Bar Chart": {
      side: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom: { min: 1, max: 1, allowedTypes: "string" },
      color: { min: 1, max: 1, allowedTypes: "both" },
      filter: { min: 0, max: 0, allowedTypes: "both" },
    },
    "Scatter Plot Matrix": {
      side: { min: 0, max: 0, allowedTypes: "both" },
      bottom: { min: 1, max: Infinity, allowedTypes: "numeric" },
      color: { min: 0, max: 0, allowedTypes: "both" },
      filter: { min: 0, max: 0, allowedTypes: "both" },
    },
    "Stacked Histogram": {
      side: { min: 0, max: 0, allowedTypes: "both" },
      bottom: { min: 1, max: 1, allowedTypes: "numeric" },
      color: { min: 1, max: 1, allowedTypes: "string" },
      filter: { min: 0, max: 0, allowedTypes: "both" },
    },
    "Clustered Boxplot": {
      side: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom: { min: 1, max: 1, allowedTypes: "both" },
      color: { min: 1, max: 1, allowedTypes: "both" },
      filter: { min: 0, max: 0, allowedTypes: "both" },
    },
    "1-D Boxplot": {
      side: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom: { min: 0, max: 0, allowedTypes: "both" },
      color: { min: 0, max: 0, allowedTypes: "both" },
      filter: { min: 0, max: 0, allowedTypes: "both" },
    },
    "Simple Range Bar": {
      side: { min: 0, max: 0, allowedTypes: "both" },
      bottom: { min: 1, max: 1, allowedTypes: "string" },
      color: { min: 0, max: 0, allowedTypes: "both" },
      filter: { min: 0, max: 0, allowedTypes: "both" },
      high: { min: 1, max: 1, allowedTypes: "numeric" },
      low: { min: 1, max: 1, allowedTypes: "numeric" },
      close: { min: 1, max: 1, allowedTypes: "numeric" },
    },
    "Clustered Range Bar": {
      side: { min: 0, max: 0, allowedTypes: "both" },
      bottom: { min: 1, max: 1, allowedTypes: "string" },
      color: { min: 1, max: 1, allowedTypes: "string" },
      filter: { min: 0, max: 0, allowedTypes: "both" },
      high: { min: 1, max: 1, allowedTypes: "numeric" },
      low: { min: 1, max: 1, allowedTypes: "numeric" },
      close: { min: 1, max: 1, allowedTypes: "numeric" },
    },
    "High-Low-Close Chart": {
      side: { min: 0, max: 0, allowedTypes: "both" },
      bottom: { min: 1, max: 1, allowedTypes: "string" },
      color: { min: 0, max: 0, allowedTypes: "both" },
      filter: { min: 0, max: 0, allowedTypes: "both" },
      high: { min: 1, max: 1, allowedTypes: "numeric" },
      low: { min: 1, max: 1, allowedTypes: "numeric" },
      close: { min: 1, max: 1, allowedTypes: "numeric" },
    },
    "Difference Area": {
      side: { min: 0, max: 0, allowedTypes: "both" },
      bottom: { min: 1, max: 1, allowedTypes: "both" },
      color: { min: 0, max: 0, allowedTypes: "both" },
      filter: { min: 0, max: 0, allowedTypes: "both" },
      high: { min: 1, max: 1, allowedTypes: "numeric" },
      low: { min: 1, max: 1, allowedTypes: "numeric" },
      close: { min: 0, max: 0, allowedTypes: "both" },
    },
    // "Word Cloud": {
    //   side: { min: 0, max: 0 },
    //   bottom: { min: 0, max: 0 },
    //   color: { min: 0, max: 0 },
    //   filter: { min: 0, max: 0 },
    //   high: { min: 0, max: 0 },
    //   low: { min: 0, max: 0 },
    //   close: { min: 0, max: 0 },
    // },
    "Vertical Bar & Line Chart": {
      side: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom: { min: 1, max: 1, allowedTypes: "both" },
      color: { min: 0, max: 0, allowedTypes: "both" },
      side2: { min: 1, max: 1, allowedTypes: "numeric" },
    },
    // "Vertical Bar & Line Chart2": {
    //   side: { min: 1, max: Infinity },
    //   bottom: { min: 1, max: 1 },
    //   color: { min: 0, max: 0 },
    //   side2: { min: 1, max: Infinity },
    // },
    "Dual Axes Scatter Plot": {
      side: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom: { min: 1, max: 1, allowedTypes: "numeric" },
      color: { min: 0, max: 0, allowedTypes: "both" },
      side2: { min: 1, max: 1, allowedTypes: "numeric" },
    },
    "Drop Line Chart": {
      side: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom: { min: 1, max: 1, allowedTypes: "string" },
      color: { min: 1, max: 1, allowedTypes: "string" },
    },
    "Summary Point Plot": {
      side: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom: { min: 1, max: 1, allowedTypes: "string" },
    },
    // "3D Bar Chart2": {
    //   side: { min: 1, max: 1, allowedTypes: "numeric" },
    //   bottom: { min: 1, max: 1, allowedTypes: "numeric" },
    //   bottom2: { min: 1, max: 1, allowedTypes: "numeric" },
    // },
    "3D Bar Chart (ECharts)": {
      side: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom2: { min: 1, max: 1, allowedTypes: "numeric" },
    },
    "3D Scatter Plot (ECharts)": {
      side: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom2: { min: 1, max: 1, allowedTypes: "numeric" },
    },
    "Clustered 3D Bar Chart (ECharts)": {
      side: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom2: { min: 1, max: 1, allowedTypes: "numeric" },
      color: { min: 1, max: 1, allowedTypes: "string" },
    },
    "Stacked 3D Bar Chart (ECharts)": {
      side: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom2: { min: 1, max: 1, allowedTypes: "numeric" },
      color: { min: 1, max: 1, allowedTypes: "string" },
    },
    "Grouped 3D Scatter Plot (ECharts)": {
      side: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom2: { min: 1, max: 1, allowedTypes: "numeric" },
      color: { min: 1, max: 1, allowedTypes: "string" },
    },
    // "Clustered 3D Bar Chart": {
    //   side: { min: 1, max: 1, allowedTypes: "numeric" },
    //   bottom: { min: 1, max: 1, allowedTypes: "numeric" },
    //   color: { min: 1, max: 1, allowedTypes: "string" },
    //   bottom2: { min: 1, max: 1, allowedTypes: "numeric" },
    // },
    // "3D Scatter Plot": {
    //   side: { min: 1, max: 1, allowedTypes: "numeric" },
    //   bottom: { min: 1, max: 1, allowedTypes: "numeric" },
    //   bottom2: { min: 1, max: 1, allowedTypes: "numeric" },
    // },
    // "Grouped 3D Scatter Plot": {
    //   side: { min: 1, max: 1, allowedTypes: "numeric" },
    //   bottom: { min: 1, max: 1, allowedTypes: "numeric" },
    //   color: { min: 1, max: 1, allowedTypes: "string" },
    //   bottom2: { min: 1, max: 1, allowedTypes: "numeric" },
    // },
    // "Stacked 3D Bar Chart": {
    //   side: { min: 1, max: 1, allowedTypes: "numeric" },
    //   bottom: { min: 1, max: 1, allowedTypes: "numeric" },
    //   color: { min: 1, max: 1, allowedTypes: "string" },
    //   bottom2: { min: 1, max: 1, allowedTypes: "numeric" },
    // },
    "Violin Plot": {
      side: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom: { min: 1, max: 1, allowedTypes: "string" },
      color: { min: 0, max: 0, allowedTypes: "both" },
      side2: { min: 0, max: 0, allowedTypes: "both" },
    },
    "Density Chart": {
      side: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom: { min: 0, max: 0, allowedTypes: "both" },
      color: { min: 0, max: 0, allowedTypes: "both" },
      bottom2: { min: 0, max: 0, allowedTypes: "both" },
    },
    "Q-Q Plot": {
      side: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom: { min: 0, max: 0, allowedTypes: "both" },
      color: { min: 0, max: 0, allowedTypes: "both" },
      filter: { min: 0, max: 0, allowedTypes: "both" },
    },
    "P-P Plot": {
      side: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom: { min: 0, max: 0, allowedTypes: "both" },
      color: { min: 0, max: 0, allowedTypes: "both" },
      filter: { min: 0, max: 0, allowedTypes: "both" },
    },
    "Stem And Leaf Plot": {
      side: { min: 1, max: 1, allowedTypes: "numeric" },
      bottom: { min: 0, max: 0, allowedTypes: "both" },
      color: { min: 0, max: 0, allowedTypes: "both" },
      bottom2: { min: 0, max: 0, allowedTypes: "both" },
    },
  };
