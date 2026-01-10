# Chart Services Documentation

## Overview

This document provides comprehensive documentation for using `DataProcessingService` and `ChartService` to create charts in the Statify application.

## Table of Contents

1. [DataProcessingService](#dataprocessingservice)
2. [ChartService](#chartservice)
3. [Specific Chart Examples](#specific-chart-examples)
4. [Best Practices](#best-practices)

## DataProcessingService

The `DataProcessingService` transforms raw data from CSV/SPSS files into the correct format for chart rendering.

### Basic Usage

```typescript
import { DataProcessingService } from "./DataProcessingService";

const result = DataProcessingService.processDataForChart({
  chartType: "Chart Type Name",
  rawData: rawDataArray,
  variables: variableDefinitions,
  chartVariables: {
    x: ["Variable1"],
    y: ["Variable2"],
  },
});
```

### Input Parameters

#### `rawData: number[][]`

- **Format**: Array of arrays where each row = 1 case, each column = 1 variable
- **Example**: `[[1,2,3], [4,5,6], [7,8,9]]` = 3 cases, 3 variables

#### `variables: Array<{name: string, type?: string}>`

- **name**: Variable name (must match chartVariables)
- **type**: Data type (NUMERIC, STRING, etc.)
- **Example**: `[{ name: "NN", type: "NUMERIC" }, { name: "N", type: "NUMERIC" }]`

#### `chartVariables: Object`

- **x**: string[] - Variables for X-axis
- **y**: string[] - Variables for Y-axis
- **z**: string[] - Variables for Z-axis (3D charts)
- **groupBy**: string[] - Variables for grouping

#### `processingOptions?: Object`

- **filterEmpty**: boolean - Remove empty data
- **sortBy**: string - Sort field
- **sortOrder**: "asc" | "desc" - Sort direction
- **aggregation**: "sum" | "count" | "average" | "none"
- **limit**: number - Limit number of records

### Output

```typescript
{
  data: any[], // Processed data in chart format
  axisInfo: Record<string, string> // Axis labels
}
```

## ChartService

The `ChartService` creates chart JSON objects ready for rendering.

### Required vs Optional Parameters

**ChartService.createChartJSON()** only requires **2 mandatory parameters**:

#### ✅ Required Parameters

- **chartType**: string - The type of chart to create
- **chartData**: any[] - Processed data from DataProcessingService

#### 📝 Optional Parameters

- **chartVariables**: Object - Variable mapping for axes
- **chartMetadata**: Object - Title, subtitle, description, etc.
- **chartConfig**: Object - Width, height, colors, axis labels, etc.

#### Default Values

If optional parameters are not provided, the following defaults are used:

- **width**: 800
- **height**: 600
- **useAxis**: true
- **useLegend**: true
- **titleFontSize**: 16
- **subtitleFontSize**: 12

### Basic Usage

#### Minimal Usage (Only Required Parameters)

```typescript
import { ChartService } from "./ChartService";

const chartJSON = ChartService.createChartJSON({
  chartType: "Normal QQ Plot",
  chartData: processedData,
});
```

#### Full Usage (With Optional Parameters)

```typescript
import { ChartService } from "./ChartService";

const chartJSON = ChartService.createChartJSON({
  chartType: "Chart Type Name",
  chartData: processedData,
  chartVariables: {
    x: ["Variable1"],
    y: ["Variable2"],
  },
  chartMetadata: {
    title: "Chart Title",
    subtitle: "Chart Subtitle",
  },
  chartConfig: {
    width: 800,
    height: 600,
  },
});
```

### Input Parameters

#### ✅ Required Parameters

#### `chartType: string`

The type of chart to create (e.g., "Normal QQ Plot", "P-P Plot", "Scatter Plot With Multiple Fit Line")

#### `chartData: any[]`

Processed data from DataProcessingService

#### 📝 Optional Parameters

#### `chartVariables: Object`

Variable mapping for axes

- **x**: string[] - Variables for X-axis
- **y**: string[] - Variables for Y-axis
- **z**: string[] - Variables for Z-axis (3D charts)
- **groupBy**: string[] - Variables for grouping
- **low**: string[] - Variables for low values (range charts)
- **high**: string[] - Variables for high values (range charts)
- **close**: string[] - Variables for close values (financial charts)
- **y2**: string[] - Variables for secondary Y-axis

#### `chartMetadata: Object`

- **title**: string - Chart title
- **subtitle**: string - Chart subtitle
- **description**: string - Chart description
- **notes**: string - Additional notes
- **titleFontSize**: number - Title font size (default: 16)
- **subtitleFontSize**: number - Subtitle font size (default: 12)
- **axisInfo**: any - Custom axis information

#### `chartConfig: Object`

- **width**: number - Chart width (default: 800)
- **height**: number - Chart height (default: 600)
- **chartColor**: string[] - Chart colors
- **useAxis**: boolean - Show axes (default: true)
- **useLegend**: boolean - Show legend (default: true)
- **statistic**: "mean" | "median" | "mode" | "min" | "max" - For Summary Point Plot
- **fitFunctions**: Array - For scatter plots with fit lines
- **axisLabels**: Object - Custom axis labels
- **axisScaleOptions**: Object - Scale configuration

### Minimal Usage Example

```typescript
// Only required parameters
const chartJSON = ChartService.createChartJSON({
  chartType: "Normal QQ Plot",
  chartData: processedData.data,
});
```

### Output

```typescript
{
  charts: [{
    chartType: string,
    chartMetadata: Object,
    chartData: any[],
    chartConfig: Object
  }]
}
```

## Specific Chart Examples

### 1. Normal QQ Plot

**Purpose**: Test normality assumption by comparing theoretical vs sample quantiles.

#### Step 1: Process Data

```typescript
// Raw data from CSV/SPSS
const rawData = [
  [1, 2.1, 3.5, 4.2, 5.1, 6.3, 7.0, 8.1, 9.5, 10.2], // Case 1: NN values
  [2, 3.8, 4.1, 5.3, 6.2, 7.1, 8.5, 9.2, 10.1, 11.3], // Case 2: NN values
  [3, 4.5, 5.2, 6.1, 7.3, 8.2, 9.1, 10.5, 11.2, 12.1], // Case 3: NN values
];

const variables = [
  { name: "NN", type: "NUMERIC" },
  { name: "N", type: "NUMERIC" },
  { name: "GM", type: "NUMERIC" },
];

// Process data
const processedData = DataProcessingService.processDataForChart({
  chartType: "Normal QQ Plot",
  rawData: rawData,
  variables: variables,
  chartVariables: {
    y: ["NN"], // Only need 1 variable for Y-axis
  },
  processingOptions: {
    filterEmpty: true,
    sortBy: "value",
    sortOrder: "asc",
  },
});
```

#### Step 2: Create Chart

```typescript
const chartJSON = ChartService.createChartJSON({
  chartType: "Normal QQ Plot",
  chartData: processedData.data,
  chartVariables: {
    y: ["NN"],
  },
  chartMetadata: {
    title: "Normal Q-Q Plot of NN",
    subtitle: "Testing normality assumption",
    description:
      "Normal Q-Q plot showing the relationship between theoretical and sample quantiles",
  },
  chartConfig: {
    width: 800,
    height: 600,
    axisLabels: {
      x: "Theoretical Quantiles",
      y: "Sample Quantiles",
    },
  },
});
```

#### Quick Method

```typescript
const chartJSON = ChartService.quickChart(
  [
    { x: -1.96, y: -2.1 },
    { x: -1.28, y: -1.3 },
    { x: 0, y: 0.1 },
    { x: 1.28, y: 1.2 },
    { x: 1.96, y: 2.0 },
  ],
  "Normal QQ Plot"
);
```

### 2. P-P Plot

**Purpose**: Compare observed vs expected cumulative probabilities.

#### Step 1: Process Data

```typescript
const processedData = DataProcessingService.processDataForChart({
  chartType: "P-P Plot",
  rawData: rawData,
  variables: variables,
  chartVariables: {
    y: ["NN"], // Only need 1 variable for Y-axis
  },
  processingOptions: {
    filterEmpty: true,
    sortBy: "value",
    sortOrder: "asc",
  },
});
```

#### Step 2: Create Chart

```typescript
const chartJSON = ChartService.createChartJSON({
  chartType: "P-P Plot",
  chartData: processedData.data,
  chartVariables: {
    y: ["NN"],
  },
  chartMetadata: {
    title: "P-P Plot of NN",
    subtitle: "Probability-Probability Plot",
    description:
      "P-P plot showing observed vs expected cumulative probabilities",
  },
  chartConfig: {
    width: 800,
    height: 600,
    axisLabels: {
      x: "Observed Cum Prop",
      y: "Expected Cum Prop",
    },
  },
});
```

### 3. Scatter Plot With Multiple Fit Line

**Purpose**: Show relationship between two variables with multiple regression lines.

#### Step 1: Process Data

```typescript
const processedData = DataProcessingService.processDataForChart({
  chartType: "Scatter Plot With Multiple Fit Line",
  rawData: rawData,
  variables: variables,
  chartVariables: {
    x: ["NN"], // X-axis variable
    y: ["N"], // Y-axis variable
  },
  processingOptions: {
    filterEmpty: true,
    sortBy: "x",
    sortOrder: "asc",
  },
});
```

#### Step 2: Create Fit Functions

```typescript
// Manual fit functions declaration
const fitFunctions = [
  {
    fn: "x => parameters.a + parameters.b * x",
    equation: "Linear",
    color: "#ff6b6b",
    parameters: { a: 1.5, b: 2.3 },
  },
  {
    fn: "x => parameters.a + parameters.b * Math.log(x)",
    equation: "Logarithmic",
    color: "#6a4c93",
    parameters: { a: 0.8, b: 1.2 },
  },
  {
    fn: "x => parameters.a * Math.exp(parameters.b * x)",
    equation: "Exponential",
    color: "#4ecdc4",
    parameters: { a: 1.2, b: 0.5 },
  },
];
```

#### Step 3: Create Chart

```typescript
const chartJSON = ChartService.createChartJSON({
  chartType: "Scatter Plot With Multiple Fit Line",
  chartData: processedData.data,
  chartVariables: {
    x: ["NN"],
    y: ["N"],
  },
  chartMetadata: {
    title: "Scatter Plot: NN vs N",
    subtitle: "With Multiple Fit Lines",
    description:
      "Scatter plot showing relationship between NN and N with various fit lines",
  },
  chartConfig: {
    width: 800,
    height: 600,
    fitFunctions: fitFunctions, // Manual fit functions
    axisLabels: {
      x: "NN Values",
      y: "N Values",
    },
  },
});
```

#### Quick Method

```typescript
const chartJSON = ChartService.createChartJSON({
  chartType: "Scatter Plot With Multiple Fit Line",
  chartData: [
    { x: 1, y: 2.1 },
    { x: 2, y: 3.8 },
    { x: 3, y: 7.2 },
    { x: 4, y: 13.5 },
    { x: 5, y: 26.0 },
  ],
  chartMetadata: {
    title: "My Scatter Plot",
    subtitle: "With Multiple Fit Lines",
  },
  chartConfig: {
    fitFunctions: [
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
    ],
  },
});
```

## Best Practices

### 1. Data Validation

- Always validate raw data before processing
- Check for missing values and handle them appropriately
- Ensure variable names match between raw data and variable definitions

### 2. Error Handling

```typescript
try {
  const processedData = DataProcessingService.processDataForChart(input);
  const chartJSON = ChartService.createChartJSON({
    chartType: "Normal QQ Plot",
    chartData: processedData.data,
    // ... other options
  });
} catch (error) {
  console.error("Error creating chart:", error);
  // Handle error appropriately
}
```

### 3. Performance Optimization

- Use `filterEmpty: true` to remove unnecessary data
- Use `limit` option for large datasets
- Consider using `aggregation` for summary statistics

### 4. Chart Configuration

- Always provide meaningful titles and descriptions
- Use appropriate axis labels
- Choose suitable chart dimensions
- Consider color schemes for accessibility

### 5. Fit Functions (Scatter Plots)

- Declare fit functions manually with proper format
- Use string format for function representation
- Store fit functions as strings for JSON compatibility
- Include parameters object for coefficient storage

## Common Issues and Solutions

### Issue 1: "No valid data available" Error

**Cause**: Data format mismatch or empty data
**Solution**:

- Check raw data format
- Ensure variables are correctly mapped
- Use `filterEmpty: true` option

### Issue 2: Fit Functions Not Working

**Cause**: Function format incorrect
**Solution**:

- Use string format: `"x => parameters.a + parameters.b * x"`
- Include parameters object: `{ a: 1.5, b: 2.3 }`
- Ensure proper function syntax and parameter names

### Issue 3: Axis Labels Not Showing

**Cause**: Missing axisLabels configuration
**Solution**:

- Provide axisLabels in chartConfig
- Use meaningful variable names
- Check chartType-specific requirements

## Integration with Chart Builder

The services are designed to work seamlessly with the Chart Builder interface:

1. **Variable Selection**: Map user-selected variables to chartVariables
2. **Data Processing**: Use DataProcessingService to transform raw data
3. **Chart Creation**: Use ChartService to generate chart JSON
4. **Rendering**: Pass chart JSON to chart rendering components

## Support

For additional support or questions:

1. Check the inline documentation in the service files
2. Review the TypeScript interfaces for parameter types
3. Test with sample data to verify functionality
4. Check console logs for debugging information
