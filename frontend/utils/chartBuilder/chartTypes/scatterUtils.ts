import * as d3 from "d3";
import * as ss from "simple-statistics";
import { probit } from "simple-statistics";
import {
  addChartTitle,
  addStandardAxes,
  truncateText,
  formatAxisNumber,
  generateAxisTicks,
  YAxisOptions,
  ChartTitleOptions,
} from "./chartUtils";
import {
  createStandardSVG,
  getMajorTicks,
  AxisLabelOptions,
  addAxisLabels,
  addLegend,
  calculateLegendPosition,
} from "../chartUtils";
import { calculateResponsiveMargin } from "../responsiveMarginUtils";
import { defaultChartColors } from "../defaultStyles/defaultColors";
import { max } from "lodash";
import * as math from "mathjs";

interface GroupedScatterPlotData {
  category: string;
  x: number;
  y: number;
}

export const createScatterPlot = (
  data: { x: number; y: number }[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: ChartTitleOptions,
  axisLabels?: { x?: string; y?: string },
  axisScaleOptions?: {
    x?: {
      min?: string;
      max?: string;
      majorIncrement?: string;
      origin?: string;
    };
    y?: {
      min?: string;
      max?: string;
      majorIncrement?: string;
      origin?: string;
    };
  },
  chartColors?: string[]
) => {
  const validData = data.filter(
    (d) =>
      d.x !== null &&
      d.y !== null &&
      d.x !== undefined &&
      d.y !== undefined &&
      !isNaN(d.x) &&
      !isNaN(d.y)
  );

  console.log("Creating scatter plot with valid data:", validData);

  if (validData.length === 0) {
    console.error("No valid data available for the scatter plot");
    return null;
  }

  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";

  let xMin = d3.min(validData, (d) => d.x) as number;
  let xMax = d3.max(validData, (d) => d.x) as number;
  let yMin = d3.min(validData, (d) => d.y) as number;
  let yMax = d3.max(validData, (d) => d.y) as number;

  if (axisScaleOptions?.x) {
    if (axisScaleOptions.x.min !== undefined && axisScaleOptions.x.min !== "")
      xMin = Number(axisScaleOptions.x.min);
    if (axisScaleOptions.x.max !== undefined && axisScaleOptions.x.max !== "")
      xMax = Number(axisScaleOptions.x.max);
  }

  if (axisScaleOptions?.y) {
    if (axisScaleOptions.y.min !== undefined && axisScaleOptions.y.min !== "")
      yMin = Number(axisScaleOptions.y.min);
    if (axisScaleOptions.y.max !== undefined && axisScaleOptions.y.max !== "")
      yMax = Number(axisScaleOptions.y.max);
  }

  const xTickCount = Math.min(10, Math.floor(width / 80));
  const yTickCount = Math.min(10, Math.floor(height / 50));

  const xTicks = d3.scaleLinear().domain([xMin, xMax]).nice().ticks(xTickCount);

  const yTicks = d3.scaleLinear().domain([yMin, yMax]).nice().ticks(yTickCount);

  const maxYLabelWidth =
    d3.max(yTicks.map((tick) => ctx.measureText(tick.toFixed(1)).width)) ?? 0;
  const maxXLabelWidth =
    d3.max(xTicks.map((tick) => ctx.measureText(tick.toFixed(1)).width)) ?? 0;

  const margin = calculateResponsiveMargin({
    width,
    height,
    useAxis,
    titleOptions: titleOptions
      ? { title: titleOptions.title, subtitle: titleOptions.subtitle }
      : undefined,
    axisLabels,
    maxLabelWidth: Math.max(maxYLabelWidth, maxXLabelWidth),
  });

  const x = d3
    .scaleLinear()
    .domain([xMin, xMax])
    .nice()
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleLinear()
    .domain([yMin, yMax])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const svg = createStandardSVG({
    width,
    height,
    marginTop: margin.top,
    marginRight: margin.right,
    marginBottom: margin.bottom,
    marginLeft: margin.left,
  });

  if (titleOptions) {
    addChartTitle(svg, {
      ...titleOptions,
      marginTop: margin.top,
      useResponsivePositioning: true,
    });
  }

  // Add points
  svg
    .append("g")
    .attr(
      "stroke",
      Array.isArray(chartColors) && chartColors.length > 0
        ? chartColors[0]
        : defaultChartColors[0]
    )
    .attr("stroke-width", 1.5)
    .attr(
      "fill",
      Array.isArray(chartColors) && chartColors.length > 0
        ? chartColors[0]
        : defaultChartColors[0]
    )
    .selectAll("circle")
    .data(validData)
    .join("circle")
    .attr("cx", (d) => x(d.x))
    .attr("cy", (d) => y(d.y))
    .attr("r", 3);

  // Add standardized axes
  if (useAxis) {
    const xTickValues = axisScaleOptions?.x?.majorIncrement
      ? getMajorTicks(xMin, xMax, Number(axisScaleOptions.x.majorIncrement))
      : xTicks;

    const yTickValues = axisScaleOptions?.y?.majorIncrement
      ? getMajorTicks(yMin, yMax, Number(axisScaleOptions.y.majorIncrement))
      : yTicks;

    addStandardAxes(svg, {
      xScale: x,
      yScale: y,
      width,
      height,
      marginTop: margin.top,
      marginRight: margin.right,
      marginBottom: margin.bottom,
      marginLeft: margin.left,
      categories: xTicks.map((d) => d.toString()),
      axisLabels,
      xMin,
      xMax,
      yMin,
      yMax,
      chartType: "vertical",
      xAxisOptions: {
        maxValueLength: 8,
        tickFormat: (d: any) => formatAxisNumber(d),
        showGridLines: true,
        tickValues: xTickValues,
      },
      yAxisOptions: {
        customFormat: formatAxisNumber,
        showGridLines: true,
        maxValueLength: 6,
        tickValues: yTickValues,
      },
    });
  }

  return svg.node();
};

export const createScatterPlotWithFitLine = (
  data: { x: number; y: number }[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: ChartTitleOptions,
  axisLabels?: { x?: string; y?: string },
  axisScaleOptions?: {
    x?: {
      min?: string;
      max?: string;
      majorIncrement?: string;
      origin?: string;
    };
    y?: {
      min?: string;
      max?: string;
      majorIncrement?: string;
      origin?: string;
    };
  },
  chartColors?: string[]
) => {
  // Filter valid data points
  const validData = data.filter(
    (d) =>
      d.x !== null &&
      d.y !== null &&
      d.x !== undefined &&
      d.y !== undefined &&
      !isNaN(d.x) &&
      !isNaN(d.y)
  );

  console.log("Creating scatter plot with fitline, valid data:", validData);

  if (validData.length === 0) {
    console.error("No valid data available for the scatter plot with fitline");
    return null;
  }

  // Calculate label widths for margin calculation
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";

  // Calculate domains with nice values
  let xMin = d3.min(validData, (d) => d.x) as number;
  let xMax = d3.max(validData, (d) => d.x) as number;
  let yMin = d3.min(validData, (d) => d.y) as number;
  let yMax = d3.max(validData, (d) => d.y) as number;

  // Apply axis scale options if provided
  if (axisScaleOptions?.x) {
    if (axisScaleOptions.x.min !== undefined && axisScaleOptions.x.min !== "")
      xMin = Number(axisScaleOptions.x.min);
    if (axisScaleOptions.x.max !== undefined && axisScaleOptions.x.max !== "")
      xMax = Number(axisScaleOptions.x.max);
  }

  if (axisScaleOptions?.y) {
    if (axisScaleOptions.y.min !== undefined && axisScaleOptions.y.min !== "")
      yMin = Number(axisScaleOptions.y.min);
    if (axisScaleOptions.y.max !== undefined && axisScaleOptions.y.max !== "")
      yMax = Number(axisScaleOptions.y.max);
  }

  // Calculate nice tick values
  const xTickCount = Math.min(10, Math.floor(width / 80));
  const yTickCount = Math.min(10, Math.floor(height / 50));

  const xTicks = d3.scaleLinear().domain([xMin, xMax]).nice().ticks(xTickCount);

  const yTicks = d3.scaleLinear().domain([yMin, yMax]).nice().ticks(yTickCount);

  // Calculate max label widths for margin
  const maxYLabelWidth =
    d3.max(yTicks.map((tick) => ctx.measureText(tick.toFixed(1)).width)) ?? 0;
  const maxXLabelWidth =
    d3.max(xTicks.map((tick) => ctx.measureText(tick.toFixed(1)).width)) ?? 0;

  // Use responsive margin utility with label measurements
  const margin = calculateResponsiveMargin({
    width,
    height,
    useAxis,
    titleOptions,
    axisLabels,
    maxLabelWidth: Math.max(maxYLabelWidth, maxXLabelWidth),
  });

  // Create scales with nice values
  const x = d3
    .scaleLinear()
    .domain([xMin, xMax])
    .nice()
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleLinear()
    .domain([yMin, yMax])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Create standard SVG
  const svg = createStandardSVG({
    width,
    height,
    marginTop: margin.top,
    marginRight: margin.right,
    marginBottom: margin.bottom,
    marginLeft: margin.left,
  });

  // Add title with responsive positioning
  if (titleOptions) {
    addChartTitle(svg, {
      ...titleOptions,
      marginTop: margin.top,
      useResponsivePositioning: true,
    });
  }

  // Calculate regression line
  const xSeries = validData.map((d) => d.x);
  const ySeries = validData.map((d) => d.y);
  const n = validData.length;
  const xMean = xSeries.reduce((a, b) => a + b) / n;
  const yMean = ySeries.reduce((a, b) => a + b) / n;
  const ssxx = xSeries.reduce((a, b) => a + Math.pow(b - xMean, 2), 0);
  const ssxy = xSeries.reduce(
    (a, b, i) => a + (b - xMean) * (ySeries[i] - yMean),
    0
  );
  const slope = ssxy / ssxx;
  const intercept = yMean - slope * xMean;

  // Add regression line
  const lineColor =
    Array.isArray(chartColors) && chartColors.length > 1
      ? chartColors[1]
      : defaultChartColors[1];

  svg
    .append("line")
    .attr("x1", x(xMin))
    .attr("y1", y(slope * xMin + intercept))
    .attr("x2", x(xMax))
    .attr("y2", y(slope * xMax + intercept))
    .attr("stroke", lineColor)
    .attr("stroke-width", 2);

  // Add points
  svg
    .append("g")
    .attr(
      "stroke",
      Array.isArray(chartColors) && chartColors.length > 0
        ? chartColors[0]
        : defaultChartColors[0]
    )
    .attr("stroke-width", 1.5)
    .attr(
      "fill",
      Array.isArray(chartColors) && chartColors.length > 0
        ? chartColors[0]
        : defaultChartColors[0]
    )
    .selectAll("circle")
    .data(validData)
    .join("circle")
    .attr("cx", (d) => x(d.x))
    .attr("cy", (d) => y(d.y))
    .attr("r", 3);

  // Add standardized axes
  if (useAxis) {
    const xTickValues = axisScaleOptions?.x?.majorIncrement
      ? getMajorTicks(xMin, xMax, Number(axisScaleOptions.x.majorIncrement))
      : xTicks;

    const yTickValues = axisScaleOptions?.y?.majorIncrement
      ? getMajorTicks(yMin, yMax, Number(axisScaleOptions.y.majorIncrement))
      : yTicks;

    addStandardAxes(svg, {
      xScale: x,
      yScale: y,
      width,
      height,
      marginTop: margin.top,
      marginRight: margin.right,
      marginBottom: margin.bottom,
      marginLeft: margin.left,
      categories: xTicks.map((d) => d.toString()),
      axisLabels,
      xMin,
      xMax,
      yMin,
      yMax,
      chartType: "vertical",
      xAxisOptions: {
        maxValueLength: 8,
        tickFormat: (d: any) => formatAxisNumber(d),
        tickValues: xTickValues,
        showGridLines: true,
      },
      yAxisOptions: {
        customFormat: formatAxisNumber,
        showGridLines: true,
        maxValueLength: 6,
        tickValues: yTickValues,
      },
    });
    // Add equation text with background
    const equation = `Y = ${slope.toFixed(2)}X + ${intercept.toFixed(2)}`;

    // Add background rect for equation
    const eqnPadding = { x: 8, y: 4 }; // Padding around text
    const eqnGroup = svg.append("g");

    // First add text to measure its size
    const eqnText = eqnGroup
      .append("text")
      .attr("x", width - margin.right - eqnPadding.x)
      .attr("y", margin.top - 0.1) // Adjusted position
      .attr("text-anchor", "end")
      .attr("fill", "hsl(var(--foreground))")
      .style("font-size", "12px")
      .text(equation);

    // Get text dimensions
    const textBox = eqnText.node()?.getBBox();
    if (textBox) {
      // Add semi-transparent background
      eqnGroup
        .insert("rect", "text") // Insert before text
        .attr("x", textBox.x - eqnPadding.x)
        .attr("y", textBox.y - eqnPadding.y)
        .attr("width", textBox.width + eqnPadding.x * 2)
        .attr("height", textBox.height + eqnPadding.y * 2)
        .attr("fill", "white")
        .attr("fill-opacity", 0.8)
        .attr("rx", 4) // Rounded corners
        .attr("ry", 4);
    }
  }

  return svg.node();
};

// Tipe untuk fungsi fitting
type FitFunction = {
  fn: string; // String representation of function: "x => parameters.a + parameters.b * x"
  equation?: string;
  color?: string;
  parameters?: Record<string, number>; // Store coefficients: {a: 2, b: 3}
};

// Fungsi utama
export const createScatterPlotWithMultipleFitLine = (
  data: { x: number; y: number }[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: ChartTitleOptions,
  axisLabels?: { x?: string; y?: string },
  axisScaleOptions?: {
    x?: {
      min?: string;
      max?: string;
      majorIncrement?: string;
      origin?: string;
    };
    y?: {
      min?: string;
      max?: string;
      majorIncrement?: string;
      origin?: string;
    };
  },
  chartColors?: string[],
  fitFunctions: FitFunction[] = []
): SVGSVGElement | null => {
  // Debug logging untuk memahami data yang masuk
  console.log("🔍 Input data length:", data.length);
  console.log("🔍 Sample data:", data.slice(0, 3));

  const validData = data.filter(
    (d) =>
      d.x !== null &&
      d.y !== null &&
      d.x !== undefined &&
      d.y !== undefined &&
      !isNaN(d.x) &&
      !isNaN(d.y)
  );

  console.log("🔍 Valid data length:", validData.length);
  console.log("🔍 Sample valid data:", validData.slice(0, 3));

  if (validData.length === 0) {
    console.warn(
      "⚠️ No valid data available for the scatter plot with fitline"
    );
    console.warn("⚠️ Original data:", data);
    console.warn("⚠️ This might be a timing issue or data format problem");

    // Return empty chart instead of null to prevent crashes
    const svg = createStandardSVG({
      width,
      height,
      marginTop: 50,
      marginRight: 50,
      marginBottom: 50,
      marginLeft: 50,
    });

    // Add message
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#666")
      .text("No valid data available");

    return svg.node();
  }

  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";

  let xMin = d3.min(validData, (d) => d.x)!;
  let xMax = d3.max(validData, (d) => d.x)!;
  let yMin = d3.min(validData, (d) => d.y)!;
  let yMax = d3.max(validData, (d) => d.y)!;

  if (axisScaleOptions?.x?.min !== undefined && axisScaleOptions.x.min !== "")
    xMin = Number(axisScaleOptions.x.min ?? xMin);
  if (axisScaleOptions?.x?.max !== undefined && axisScaleOptions.x.max !== "")
    xMax = Number(axisScaleOptions.x.max ?? xMax);
  if (axisScaleOptions?.y?.min !== undefined && axisScaleOptions.y.min !== "")
    yMin = Number(axisScaleOptions.y.min ?? yMin);
  if (axisScaleOptions?.y?.max !== undefined && axisScaleOptions.y.max !== "")
    yMax = Number(axisScaleOptions.y.max ?? yMax);

  const xTicks = d3
    .scaleLinear()
    .domain([xMin, xMax])
    .nice()
    .ticks(Math.min(10, Math.floor(width / 80)));
  const yTicks = d3
    .scaleLinear()
    .domain([yMin, yMax])
    .nice()
    .ticks(Math.min(10, Math.floor(height / 50)));

  const maxYLabelWidth =
    d3.max(yTicks.map((tick) => ctx.measureText(tick.toFixed(1)).width)) ?? 0;
  const maxXLabelWidth =
    d3.max(xTicks.map((tick) => ctx.measureText(tick.toFixed(1)).width)) ?? 0;

  const margin = calculateResponsiveMargin({
    width,
    height,
    useAxis,
    titleOptions,
    axisLabels,
    maxLabelWidth: Math.max(maxYLabelWidth, maxXLabelWidth),
    hasLegend: true,
    legendPosition: "right",
  });

  const x = d3
    .scaleLinear()
    .domain([xMin, xMax])
    .nice()
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleLinear()
    .domain([yMin, yMax])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const svg = createStandardSVG({
    width,
    height,
    marginTop: margin.top,
    marginRight: margin.right,
    marginBottom: margin.bottom,
    marginLeft: margin.left,
  });

  if (titleOptions) {
    addChartTitle(svg, {
      ...titleOptions,
      marginTop: margin.top,
      useResponsivePositioning: true,
    });
  }

  // Draw scatter points
  svg
    .append("g")
    .attr(
      "stroke",
      Array.isArray(chartColors) && chartColors.length > 0
        ? chartColors[0]
        : defaultChartColors[0]
    )
    .attr("stroke-width", 1.5)
    .attr(
      "fill",
      Array.isArray(chartColors) && chartColors.length > 0
        ? chartColors[0]
        : defaultChartColors[0]
    )
    .selectAll("circle")
    .data(validData)
    .join("circle")
    .attr("cx", (d) => x(d.x))
    .attr("cy", (d) => y(d.y))
    .attr("r", 3);

  // Draw each fit line
  fitFunctions.forEach((fit, idx) => {
    const { fn, color, parameters } = fit;
    const lineColor =
      color ??
      chartColors?.[idx + 1] ??
      defaultChartColors[(idx + 1) % defaultChartColors.length];

    // Convert string function to executable function
    const executableFn = new Function(
      "x",
      "parameters",
      `return ${fn.replace("x =>", "")}`
    );

    const visualXMin = x.domain()[0];
    const visualXMax = x.domain()[1];

    const lineData = d3
      .range(visualXMin, visualXMax, (visualXMax - visualXMin) / 100)
      .map((xVal) => ({ x: xVal, y: executableFn(xVal, parameters || {}) }))
      .filter((d) => Number.isFinite(d.y));

    const line = d3
      .line<{ x: number; y: number }>()
      .x((d) => x(d.x))
      .y((d) => y(d.y))
      .curve(d3.curveLinear);

    svg
      .append("path")
      .datum(lineData)
      .attr("fill", "none")
      .attr("stroke", lineColor)
      .attr("stroke-width", 2)
      .attr("d", line as any);
  });

  // Axes
  if (useAxis) {
    const xTickValues = axisScaleOptions?.x?.majorIncrement
      ? getMajorTicks(xMin, xMax, Number(axisScaleOptions.x.majorIncrement))
      : xTicks;

    const yTickValues = axisScaleOptions?.y?.majorIncrement
      ? getMajorTicks(yMin, yMax, Number(axisScaleOptions.y.majorIncrement))
      : yTicks;

    addStandardAxes(svg, {
      xScale: x,
      yScale: y,
      width,
      height,
      marginTop: margin.top,
      marginRight: margin.right,
      marginBottom: margin.bottom,
      marginLeft: margin.left,
      categories: xTicks.map((d) => d.toString()),
      axisLabels,
      xMin,
      xMax,
      yMin,
      yMax,
      chartType: "vertical",
      xAxisOptions: {
        maxValueLength: 8,
        tickFormat: (d: any) => formatAxisNumber(d),
        tickValues: xTickValues,
        showGridLines: true,
      },
      yAxisOptions: {
        customFormat: formatAxisNumber,
        showGridLines: true,
        maxValueLength: 6,
        tickValues: yTickValues,
      },
    });
  }

  // Legend
  if (fitFunctions.length > 0) {
    const legendPosition = calculateLegendPosition({
      width,
      height,
      marginLeft: margin.left,
      marginRight: margin.right,
      marginBottom: margin.bottom,
      marginTop: margin.top,
      legendPosition: "right",
      itemCount: fitFunctions.length,
      itemSpacing: 150,
    });

    const legendData = fitFunctions.map((fit, idx) => ({
      name: fit.equation?.split(":")[0] || `Fit Line ${idx + 1}`,
      color:
        fit.color ??
        chartColors?.[idx + 1] ??
        defaultChartColors[(idx + 1) % defaultChartColors.length],
    }));

    addLegend({
      svg,
      colorScale: (d: string) => {
        const item = legendData.find((item) => item.name === d);
        return item ? item.color : "#000";
      },
      position: legendPosition,
      domain: legendData.map((d) => d.name),
      itemWidth: 25,
      itemHeight: 3,
      fontSize: 12,
      legendPosition: "right",
      title: "Fit Lines:",
    });
  }

  return svg.node();
};

/**
 * Membuat Grouped Scatter Plot

 * @param data - Array dari objek GroupedScatterPlotData
 * @param width - Lebar SVG (default: 928)
 * @param height - Tinggi SVG (default: 600)
 * @param useAxis - Boolean untuk menentukan apakah sumbu dan grid lines akan ditampilkan (default: true)
 * @returns SVGSVGElement atau null jika data tidak valid
 */
export const createGroupedScatterPlot = (
  data: GroupedScatterPlotData[],
  width: number = 600,
  height: number = 400,
  useAxis: boolean = true,
  titleOptions?: ChartTitleOptions,
  axisLabels?: { x?: string; y?: string },
  axisScaleOptions?: {
    x?: {
      min?: string;
      max?: string;
      majorIncrement?: string;
      origin?: string;
    };
    y?: {
      min?: string;
      max?: string;
      majorIncrement?: string;
      origin?: string;
    };
  },
  chartColors?: string[]
): SVGSVGElement | null => {
  const validData = data.filter(
    (d) =>
      d.category !== null &&
      d.x !== null &&
      d.y !== null &&
      d.category !== undefined &&
      d.x !== undefined &&
      d.y !== undefined &&
      !isNaN(d.x) &&
      !isNaN(d.y)
  );

  if (validData.length === 0) {
    console.error("No valid data available for the grouped scatter plot");
    return null;
  }

  const categories = Array.from(new Set(validData.map((d) => d.category)));
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";

  // Calculate X scale
  let xMin = d3.min(validData, (d) => d.x)!;
  let xMax = d3.max(validData, (d) => d.x)!;
  if (axisScaleOptions?.x) {
    if (axisScaleOptions.x.min !== undefined && axisScaleOptions.x.min !== "")
      xMin = Number(axisScaleOptions.x.min);
    if (axisScaleOptions.x.max !== undefined && axisScaleOptions.x.max !== "")
      xMax = Number(axisScaleOptions.x.max);
  }

  // Calculate Y scale
  let yMin = d3.min(validData, (d) => d.y)!;
  let yMax = d3.max(validData, (d) => d.y)!;
  if (axisScaleOptions?.y) {
    if (axisScaleOptions.y.min !== undefined && axisScaleOptions.y.min !== "")
      yMin = Number(axisScaleOptions.y.min);
    if (axisScaleOptions.y.max !== undefined && axisScaleOptions.y.max !== "")
      yMax = Number(axisScaleOptions.y.max);
  }

  const xTickCount = Math.min(10, Math.floor(width / 80));
  const yTickCount = Math.min(10, Math.floor(height / 50));

  const xTicks = d3.scaleLinear().domain([xMin, xMax]).nice().ticks(xTickCount);
  const yTicks = d3.scaleLinear().domain([yMin, yMax]).nice().ticks(yTickCount);

  const maxYLabelWidth =
    d3.max(yTicks.map((tick) => ctx.measureText(tick.toFixed(1)).width)) ?? 0;
  const maxXLabelWidth =
    d3.max(xTicks.map((tick) => ctx.measureText(tick.toFixed(1)).width)) ?? 0;

  // Calculate responsive margin
  const margin = calculateResponsiveMargin({
    width,
    height,
    useAxis,
    titleOptions: titleOptions
      ? { title: titleOptions.title, subtitle: titleOptions.subtitle }
      : undefined,
    axisLabels,
    maxLabelWidth: Math.max(maxYLabelWidth, maxXLabelWidth),
    hasLegend: true,
    legendPosition: "right",
  });

  // Create scales
  const x = d3
    .scaleLinear()
    .domain([xMin, xMax])
    .nice()
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleLinear()
    .domain([yMin, yMax])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Create color scale with explicit domain
  const colorScale = d3
    .scaleOrdinal<string>()
    .domain(categories)
    .range(chartColors || defaultChartColors);

  // Create SVG
  const svg = createStandardSVG({
    width,
    height,
    marginTop: margin.top,
    marginRight: margin.right,
    marginBottom: margin.bottom,
    marginLeft: margin.left,
  });

  // Add title if provided
  if (titleOptions) {
    addChartTitle(svg, {
      ...titleOptions,
      marginTop: margin.top,
      useResponsivePositioning: true,
    });
  }

  // Add axes if needed
  if (useAxis) {
    const xTickValues = axisScaleOptions?.x?.majorIncrement
      ? getMajorTicks(xMin, xMax, Number(axisScaleOptions.x.majorIncrement))
      : xTicks;

    const yTickValues = axisScaleOptions?.y?.majorIncrement
      ? getMajorTicks(yMin, yMax, Number(axisScaleOptions.y.majorIncrement))
      : yTicks;

    addStandardAxes(svg, {
      xScale: x,
      yScale: y,
      width,
      height,
      marginTop: margin.top,
      marginRight: margin.right,
      marginBottom: margin.bottom,
      marginLeft: margin.left,
      categories: xTicks.map((d) => d.toString()),
      axisLabels,
      xMin,
      xMax,
      yMin,
      yMax,
      chartType: "vertical",
      xAxisOptions: {
        maxValueLength: 8,
        tickFormat: (d: any) => formatAxisNumber(d),
        showGridLines: true,
        tickValues: xTickValues,
      },
      yAxisOptions: {
        customFormat: formatAxisNumber,
        showGridLines: true,
        maxValueLength: 6,
        tickValues: yTickValues,
      },
    });
  }

  // Add data points
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background", "#f9f9f9")
    .style("padding", "8px")
    .style("border", "1px solid #d3d3d3")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("font-size", "12px")
    .style("box-shadow", "0px 0px 6px #aaa");

  svg
    .append("g")
    .attr("stroke-width", 1.5)
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .selectAll("circle")
    .data(validData)
    .join("circle")
    .attr("cx", (d) => x(d.x))
    .attr("cy", (d) => y(d.y))
    .attr("r", 5)
    .attr("fill", (d) => colorScale(d.category) as string)
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip
        .html(
          `
          <strong>Category:</strong> ${d.category}<br/>
          <strong>X Value:</strong> ${d.x}<br/>
          <strong>Y Value:</strong> ${d.y}
        `
        )
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", () => {
      tooltip.transition().duration(500).style("opacity", 0);
    });

  // Add legend
  const legendPosition = calculateLegendPosition({
    width,
    height,
    marginLeft: margin.left,
    marginRight: margin.right,
    marginBottom: margin.bottom,
    marginTop: margin.top,
    legendPosition: "right",
    itemCount: categories.length,
    itemSpacing: 150, // Memberikan ruang lebih untuk teks kategori
  });

  addLegend({
    svg,
    colorScale: (d: string) => colorScale(d),
    position: legendPosition,
    domain: categories,
    itemWidth: 15,
    itemHeight: 15,
    fontSize: 12,
    legendPosition: "right",
    title: "Keterangan:",
  });

  return svg.node();
};

export const createDotPlot = (
  data: { category: string; value: number }[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: ChartTitleOptions,
  axisLabels?: AxisLabelOptions,
  axisScaleOptions?: {
    y?: {
      min?: string;
      max?: string;
      majorIncrement?: string;
    };
  },
  chartColors?: string[]
) => {
  console.log("Creating improved stacked dot plot with data:", data);

  // Filter out invalid data and group by category
  const validData = data.filter(
    (d) => d.value !== null && d.value !== undefined && !Number.isNaN(d.value)
  );

  // Group data by category
  const groupedData = d3.group(validData, (d) => d.category);
  const categories = Array.from(groupedData.keys());

  // Create a canvas context for measuring text
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";

  // Calculate max label width for margin calculation
  const maxLabelWidth = Math.max(
    ...categories.map((cat) => ctx.measureText(cat).width)
  );

  // Calculate responsive margins
  const margin = calculateResponsiveMargin({
    width,
    height,
    useAxis,
    titleOptions: titleOptions
      ? { title: titleOptions.title, subtitle: titleOptions.subtitle }
      : undefined,
    axisLabels,
    maxLabelWidth,
    categories,
  });

  // Create standard SVG
  const svg = createStandardSVG({
    width,
    height,
    marginTop: margin.top,
    marginRight: margin.right,
    marginBottom: margin.bottom,
    marginLeft: margin.left,
    includeFont: true,
  });

  // Add title if provided
  if (titleOptions) {
    addChartTitle(svg, { ...titleOptions, marginTop: margin.top });
  }

  const dotRadius = 7;

  // Skala X: satu band per kategori
  const x = d3
    .scaleBand()
    .domain(categories)
    .range([margin.left, width - margin.right])
    .padding(0.5);

  // Skala Y: Nilai dari data
  let yMin = 0;
  let yMax = d3.max(validData, (d) => d.value) || 0;
  let yAxisMajorIncrement = axisScaleOptions?.y?.majorIncrement
    ? Number(axisScaleOptions.y.majorIncrement)
    : undefined;

  if (axisScaleOptions?.y) {
    if (axisScaleOptions.y.min !== undefined && axisScaleOptions.y.min !== "")
      yMin = Number(axisScaleOptions.y.min);
    if (axisScaleOptions.y.max !== undefined && axisScaleOptions.y.max !== "")
      yMax = Number(axisScaleOptions.y.max);
  }

  const y = d3
    .scaleLinear()
    .domain([yMin, yMax])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Add standard axes
  if (useAxis) {
    addStandardAxes(svg, {
      xScale: x,
      yScale: y,
      width,
      height,
      marginTop: margin.top,
      marginRight: margin.right,
      marginBottom: margin.bottom,
      marginLeft: margin.left,
      categories,
      axisLabels,
      yMin,
      yMax,
      chartType: "vertical",
      xAxisOptions: {
        showGridLines: true,
      },
      yAxisOptions: {
        showGridLines: false,
        tickValues: yAxisMajorIncrement
          ? generateAxisTicks(yMin, yMax, yAxisMajorIncrement)
          : undefined,
      },
    });
  }

  // Draw the dots
  const dotGroup = svg
    .append("g")
    .attr(
      "fill",
      chartColors && chartColors.length > 0
        ? chartColors[0]
        : defaultChartColors[0]
    );

  // Draw dots for each category
  groupedData.forEach((values, category) => {
    const xBase = x(category)! + x.bandwidth() / 2;
    values.forEach((d) => {
      for (let i = 0; i < d.value; i++) {
        dotGroup
          .append("circle")
          .attr("cx", xBase)
          .attr("cy", y(i + 1))
          .attr("r", dotRadius);
      }
    });
  });

  return svg.node();
};

export const createScatterPlotMatrix = (
  data: { [key: string]: any }[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: ChartTitleOptions,
  axisLabels?: { x?: string; y?: string },
  chartColors?: string[]
) => {
  console.log("Creating scatter plot matrix with data:", data);
  // Validate data first
  if (!data || data.length === 0 || !data[0]) {
    console.error("No valid data available for the scatter plot matrix");
    return null;
  }

  // Filter numeric columns and validate data
  const columns: string[] = Object.keys(data[0]).filter((key) =>
    data.some((d) => typeof d[key] === "number" && !isNaN(d[key]))
  );

  if (columns.length === 0) {
    console.error("No numeric columns available for the scatter plot matrix");
    return null;
  }

  const validData = data.filter((d) =>
    columns.every(
      (col) => d[col] !== null && d[col] !== undefined && !isNaN(d[col])
    )
  );

  if (validData.length === 0) {
    console.error("No valid data points available for the scatter plot matrix");
    return null;
  }

  const n = columns.length;
  const padding = useAxis ? 20 : 5;

  // Create a canvas context for measuring text
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "12px sans-serif";

  // Estimate Y axis tick labels
  const yTicks = d3
    .scaleLinear()
    .domain([0, 100]) // dummy domain, will be replaced per cell
    .ticks(5)
    .map((tick) => tick.toString());
  const maxYTickWidth =
    d3.max(yTicks.map((tick) => ctx.measureText(tick).width)) ?? 0;
  const yLabelWidth = axisLabels?.y ? ctx.measureText(axisLabels.y).width : 0;
  const marginLeft = useAxis
    ? Math.max(maxYTickWidth + (axisLabels?.y ? 30 : 10), 40, yLabelWidth + 10)
    : 10;

  // Calculate responsive margin with custom bottom margin for scatter plot matrix
  const margin = calculateResponsiveMargin({
    width,
    height,
    useAxis,
    titleOptions: titleOptions
      ? { title: titleOptions.title, subtitle: titleOptions.subtitle }
      : undefined,
    axisLabels,
    maxLabelWidth: maxYTickWidth,
  });

  margin.left -= 0.5 * margin.left;
  margin.right -= 0.8 * margin.right;
  margin.top -= 0.5 * margin.top;
  margin.bottom -= 0.5 * margin.bottom;

  const matrixWidth = width - margin.left - margin.right;
  const matrixHeight = height - margin.top - margin.bottom;
  const size =
    (Math.min(matrixWidth, matrixHeight) - (n + 1) * padding) / n + padding;
  const offsetX = margin.left + (matrixWidth - size * n) / 2;
  const offsetY = margin.top + (matrixHeight - size * n) / 2;

  const color =
    chartColors && chartColors.length > 0
      ? chartColors[0]
      : defaultChartColors[0];

  const x: d3.ScaleLinear<number, number>[] = columns.map((c) =>
    d3
      .scaleLinear()
      .domain(d3.extent(validData, (d) => d[c]) as [number, number])
      .rangeRound([padding / 2, size - padding / 2])
  );

  const y: d3.ScaleLinear<number, number>[] = x.map((xScale) =>
    xScale.copy().range([size - padding / 2, padding / 2])
  );

  // Responsive tick count based on chart size
  const tickCount = Math.max(2, Math.min(4, Math.floor(size / 40)));

  const axisx = d3
    .axisBottom(d3.scaleLinear())
    .ticks(tickCount)
    .tickSize(size * columns.length)
    .tickFormat(d3.format(".0f")); // Format numbers without decimals

  const axisy = d3
    .axisLeft(d3.scaleLinear())
    .ticks(tickCount)
    .tickSize(-size * columns.length)
    .tickFormat(d3.format(".0f"));

  const xAxis = (g: d3.Selection<SVGGElement, any, null, undefined>) => {
    g.selectAll<SVGGElement, d3.ScaleLinear<number, number>>("g")
      .data(x)
      .join("g")
      .attr("transform", (d, i) => `translate(${i * size}, 0)`)
      .each(function (d) {
        d3.select(this as SVGGElement).call(axisx.scale(d));
      })
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", "#ddd"))
      .call((g) =>
        g
          .selectAll(".tick text")
          .style("font-size", `${Math.max(8, Math.min(12, size / 10))}px`)
          .attr("fill", "#666")
      );
  };

  const yAxis = (g: d3.Selection<SVGGElement, any, null, undefined>) => {
    g.selectAll<SVGGElement, d3.ScaleLinear<number, number>>("g")
      .data(y)
      .join("g")
      .attr("transform", (d, i) => `translate(0,${i * size})`)
      .each(function (d) {
        d3.select(this as SVGGElement).call(axisy.scale(d));
      })
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", "#ddd"))
      .call((g) =>
        g
          .selectAll(".tick text")
          .style("font-size", `${Math.max(8, Math.min(12, size / 10))}px`)
          .attr("fill", "#666")
      );
  };

  // Create standard SVG with calculated margins
  const svg = createStandardSVG({
    width,
    height,
    marginTop: margin.top,
    marginRight: margin.right,
    marginBottom: margin.bottom,
    marginLeft: margin.left,
  });

  // Add title if provided
  if (titleOptions) {
    addChartTitle(svg, {
      ...titleOptions,
      marginTop: margin.top,
      useResponsivePositioning: true,
    });
  }

  // Matrix group di-offset sesuai margin dan di-center-kan di area matrix
  const matrixGroup = svg
    .append("g")
    .attr("transform", `translate(${offsetX},${offsetY})`);

  if (useAxis) {
    matrixGroup.append("g").call(xAxis);
    matrixGroup.append("g").call(yAxis);
  }

  const cell = matrixGroup
    .append("g")
    .selectAll("g")
    .data(d3.cross(d3.range(columns.length), d3.range(columns.length)))
    .join("g")
    .attr("transform", ([i, j]) => `translate(${i * size},${j * size})`);

  cell
    .append("rect")
    .attr("fill", "none")
    .attr("stroke", "#aaa")
    .attr("x", padding / 2 + 0.5)
    .attr("y", padding / 2 + 0.5)
    .attr("width", size - padding)
    .attr("height", size - padding);

  cell.each(function ([i, j]: [number, number]) {
    // Responsive circle size based on cell size
    const circleRadius = Math.max(1.5, Math.min(3.5, size / 25));

    d3.select(this)
      .selectAll<SVGCircleElement, { [key: string]: number }>("circle")
      .data(
        validData.filter((d) => !isNaN(d[columns[i]]) && !isNaN(d[columns[j]]))
      )
      .join("circle")
      .attr("cx", (d) => x[i](d[columns[i]]))
      .attr("cy", (d) => y[j](d[columns[j]]))
      .attr("r", circleRadius)
      .attr("fill-opacity", 0.7)
      .attr("fill", color);
  });

  if (useAxis) {
    // Add grid lines
    for (let i = 0; i <= columns.length; i++) {
      const xPos = i * size;
      if (xPos <= size * columns.length) {
        matrixGroup
          .append("line")
          .attr("x1", xPos)
          .attr("x2", xPos)
          .attr("y1", 0)
          .attr("y2", size * columns.length)
          .attr("stroke", "#ddd");
      }
    }
    for (let j = 0; j <= columns.length; j++) {
      const yPos = j * size;
      if (yPos <= size * columns.length) {
        matrixGroup
          .append("line")
          .attr("x1", 0)
          .attr("x2", size * columns.length)
          .attr("y1", yPos)
          .attr("y2", yPos)
          .attr("stroke", "#ddd");
      }
    }

    // Add column labels with responsive font size
    const labelFontSize = Math.max(8, Math.min(16, size / 8));
    const labelOffset = Math.max(4, size / 20);

    columns.forEach((col, i) => {
      // Truncate long variable names
      const truncatedName = col.length > 8 ? col.substring(0, 8) + "..." : col;

      matrixGroup
        .append("text")
        .attr("x", i * size + labelOffset)
        .attr("y", i * size + labelFontSize + labelOffset)
        .attr("text-anchor", "start")
        .attr("fill", "#222")
        .style("font-size", `${labelFontSize}px`)
        .style("font-weight", "bold")
        .text(truncatedName);
    });
  }

  return svg.node();
};

export const createDropLineChart = (
  data: { x: string; y: number; category: string }[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: ChartTitleOptions,
  axisLabels?: { x?: string; y?: string },
  axisScaleOptions?: {
    x?: {
      min?: string;
      max?: string;
      majorIncrement?: string;
      origin?: string;
    };
    y?: {
      min?: string;
      max?: string;
      majorIncrement?: string;
      origin?: string;
    };
  },
  chartColors?: string[]
) => {
  const validData = data.filter(
    (d) =>
      d.x !== null &&
      d.y !== null &&
      d.category !== null &&
      d.x !== undefined &&
      d.y !== undefined &&
      d.category !== undefined &&
      !isNaN(d.y)
  );

  console.log("Creating drop-line chart with valid data:", validData);

  if (validData.length === 0) {
    console.error("No valid data available for the drop-line chart");
    return null;
  }

  // Calculate max label widths for margin calculation
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";
  const maxXLabelWidth =
    d3.max(validData, (d) => ctx.measureText(d.x).width) ?? 0;
  const yTicks = d3
    .scaleLinear()
    .domain([0, d3.max(validData, (d) => d.y) as number])
    .ticks(5);
  const maxYLabelWidth =
    d3.max(yTicks.map((tick) => ctx.measureText(tick.toFixed(0)).width)) ?? 0;

  // Get unique categories for legend
  const uniqueCategories = Array.from(
    new Set(validData.map((d) => d.category))
  );

  // Use responsive margin utility
  const margin = calculateResponsiveMargin({
    width,
    height,
    useAxis,
    titleOptions,
    axisLabels,
    maxLabelWidth: maxYLabelWidth,
    categories: validData.map((d) => d.x),
    hasLegend: true,
    legendPosition: "right",
  });

  const {
    top: marginTop,
    bottom: marginBottom,
    left: marginLeft,
    right: marginRight,
  } = margin;

  // Skala untuk sumbu X (category)
  const x = d3
    .scaleBand()
    .domain(validData.map((d) => d.x))
    .range([marginLeft, width - marginRight])
    .padding(0.1);

  // Apply axis scale options for Y if provided
  let yMin = 0;
  let yMax = d3.max(validData, (d) => d.y) as number;
  let majorIncrement = axisScaleOptions?.y?.majorIncrement
    ? Number(axisScaleOptions.y.majorIncrement)
    : undefined;

  if (axisScaleOptions?.y) {
    if (axisScaleOptions.y.min !== undefined && axisScaleOptions.y.min !== "")
      yMin = Number(axisScaleOptions.y.min);
    if (axisScaleOptions.y.max !== undefined && axisScaleOptions.y.max !== "")
      yMax = Number(axisScaleOptions.y.max);
  }

  const y = d3
    .scaleLinear()
    .domain([yMin, yMax])
    .nice()
    .range([height - marginBottom, marginTop]);

  // Create standard SVG
  const svg = createStandardSVG({
    width,
    height,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
  });

  // Add title if provided with margin-aware positioning
  if (titleOptions) {
    addChartTitle(svg, {
      ...titleOptions,
      marginTop,
      useResponsivePositioning: true,
    });
  }

  // Create color scale - use chartColors if provided, otherwise default
  const color =
    chartColors && chartColors.length > 0
      ? d3.scaleOrdinal(chartColors)
      : d3.scaleOrdinal(defaultChartColors);

  if (useAxis) {
    // Add standard axes with automatic formatting
    const categories = validData.map((d) => d.x);

    addStandardAxes(svg, {
      xScale: x,
      yScale: y,
      width,
      height,
      marginTop,
      marginRight,
      marginBottom,
      marginLeft,
      categories,
      axisLabels,
      majorIncrement,
      yMin,
      yMax,
      chartType: "vertical",
      xAxisOptions: {
        tickFormat: (d: any) => truncateText(d, 12),
        maxValueLength: 12,
      },
      yAxisOptions: {
        customFormat: formatAxisNumber,
      },
    });
  }

  const groupedData = d3.groups(validData, (d) => d.x);

  // Draw vertical lines for each group
  svg
    .append("g")
    .selectAll("line")
    .data(groupedData)
    .join("line")
    .attr("x1", (d) => x(d[0])! + x.bandwidth() / 2)
    .attr("x2", (d) => x(d[0])! + x.bandwidth() / 2)
    .attr("y1", (d) => y(d[1][0]?.y || 0))
    .attr("y2", (d) => y(d[1][d[1].length - 1]?.y || 0))
    .attr("stroke", "black")
    .attr("stroke-width", 1.5);

  // Draw horizontal lines connecting points within each group
  groupedData.forEach((categoryData) => {
    svg
      .append("g")
      .selectAll("line")
      .data(categoryData[1].slice(1))
      .join("line")
      .attr("x1", (d, i) => x(d.x)! + x.bandwidth() / 2)
      .attr("x2", (d, i) => x(categoryData[1][i].x)! + x.bandwidth() / 2)
      .attr("y1", (d) => y(d.y))
      .attr("y2", (d, i) => y(categoryData[1][i].y))
      .attr("stroke", "black")
      .attr("stroke-width", 1.5);
  });

  // Add points
  svg
    .append("g")
    .selectAll("circle")
    .data(validData)
    .join("circle")
    .attr("cx", (d) => x(d.x)! + x.bandwidth() / 2)
    .attr("cy", (d) => y(d.y))
    .attr("r", 6)
    .attr("fill", (d) => color(d.category));

  // Add legend
  const legendItems = uniqueCategories.map((category) => ({
    label: category,
    color: color(category),
  }));

  const legendPosition = calculateLegendPosition({
    width,
    height,
    marginLeft: margin.left,
    marginRight: margin.right,
    marginBottom: margin.bottom,
    marginTop: margin.top,
    legendPosition: "right",
    itemCount: legendItems.length,
    dualAxes: false,
  });

  addLegend({
    svg,
    colorScale: d3
      .scaleOrdinal<string>()
      .domain(legendItems.map((item) => item.label))
      .range(legendItems.map((item) => item.color)),
    position: legendPosition,
    legendPosition: "right",
    itemWidth: 15,
    itemHeight: 15,
    fontSize: 12,
  });

  return svg.node();
};

export const createSummaryPointPlot = (
  data: { category: string; value: number }[],
  width: number,
  height: number,
  useAxis: boolean = true,
  statistic: "mean" | "median" | "mode" | "min" | "max" = "mean",
  titleOptions?: ChartTitleOptions,
  axisLabels?: { x?: string; y?: string },
  axisScaleOptions?: {
    x?: {
      min?: string;
      max?: string;
      majorIncrement?: string;
      origin?: string;
    };
    y?: {
      min?: string;
      max?: string;
      majorIncrement?: string;
      origin?: string;
    };
  },
  chartColors?: string[]
) => {
  // Mengelompokkan data berdasarkan category dan menghitung statistik per kategori
  const categoryValues = Array.from(
    d3.group(data, (d) => d.category),
    ([key, value]) => {
      const calculatedValue = calculateStat(value, statistic);
      console.log(
        `📊 Category ${key}: ${statistic} = ${calculatedValue} (from values: ${value
          .map((v) => v.value)
          .join(", ")})`
      );
      return {
        category: key,
        value: calculatedValue,
      };
    }
  );

  console.log(
    `🎯 Creating Summary Point Plot with "${statistic}" statistic:`,
    categoryValues
  );

  if (categoryValues.length === 0) {
    console.error("No valid data available for the summary point plot");
    return null;
  }

  // Calculate max label widths for margin calculation
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";
  const maxXLabelWidth =
    d3.max(categoryValues, (d) => ctx.measureText(d.category).width) ?? 0;
  const yTicks = d3
    .scaleLinear()
    .domain([0, d3.max(categoryValues, (d) => d.value) as number])
    .ticks(5);
  const maxYLabelWidth =
    d3.max(yTicks.map((tick) => ctx.measureText(tick.toFixed(0)).width)) ?? 0;

  // Use responsive margin utility
  const margin = calculateResponsiveMargin({
    width,
    height,
    useAxis,
    titleOptions,
    axisLabels,
    maxLabelWidth: maxYLabelWidth,
    categories: categoryValues.map((d) => d.category),
    hasLegend: false,
  });

  // Adjust bottom margin to accommodate statistic label
  const {
    top: marginTop,
    bottom: baseMarginBottom,
    left: marginLeft,
    right: marginRight,
  } = margin;

  // Add extra space for statistic label
  const marginBottom =
    baseMarginBottom + (useAxis ? Math.max(0.1 * height, 40) : 0);

  // Skala untuk sumbu X (category)
  const x = d3
    .scaleBand()
    .domain(categoryValues.map((d) => d.category))
    .range([marginLeft, width - marginRight])
    .padding(0.1);

  // Apply axis scale options for Y if provided
  let yMin = 0;
  let yMax = d3.max(categoryValues, (d) => d.value) as number;
  let majorIncrement = axisScaleOptions?.y?.majorIncrement
    ? Number(axisScaleOptions.y.majorIncrement)
    : undefined;

  if (axisScaleOptions?.y) {
    if (axisScaleOptions.y.min !== undefined && axisScaleOptions.y.min !== "")
      yMin = Number(axisScaleOptions.y.min);
    if (axisScaleOptions.y.max !== undefined && axisScaleOptions.y.max !== "")
      yMax = Number(axisScaleOptions.y.max);
  }

  // Skala untuk sumbu Y (statistik nilai)
  const y = d3
    .scaleLinear()
    .domain([yMin, yMax])
    .nice()
    .range([height - marginBottom, marginTop]);

  // Create standard SVG
  const svg = createStandardSVG({
    width,
    height,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
  });

  // Add title if provided with margin-aware positioning
  if (titleOptions) {
    addChartTitle(svg, {
      ...titleOptions,
      marginTop,
      useResponsivePositioning: true,
    });
  }

  if (useAxis) {
    // Add standard axes with automatic formatting
    const categories = categoryValues.map((d) => d.category);

    addStandardAxes(svg, {
      xScale: x,
      yScale: y,
      width,
      height,
      marginTop,
      marginRight,
      marginBottom,
      marginLeft,
      categories,
      axisLabels,
      majorIncrement,
      yMin,
      yMax,
      chartType: "vertical",
      xAxisOptions: {
        tickFormat: (d: any) => truncateText(d, 12),
        maxValueLength: 12,
      },
      yAxisOptions: {
        customFormat: formatAxisNumber,
      },
    });
  }

  // Get colors for points
  const getPointColor = (index: number) => {
    if (Array.isArray(chartColors) && chartColors.length > 0) {
      return chartColors[index % chartColors.length];
    }
    return defaultChartColors[index % defaultChartColors.length];
  };

  // Add points for each category
  svg
    .append("g")
    .selectAll("circle")
    .data(categoryValues)
    .join("circle")
    .attr("cx", (d) => x(d.category)! + x.bandwidth() / 2)
    .attr("cy", (d) => y(d.value))
    .attr("r", 6)
    .attr("fill", (d, i) => getPointColor(i));

  if (useAxis) {
    // Add statistic label below x-axis
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 0.03 * height) // Adjust position to be closer to bottom
      .attr("text-anchor", "middle")
      .attr("fill", "hsl(var(--foreground))")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text(
        `Statistic: ${statistic.charAt(0).toUpperCase() + statistic.slice(1)}`
      );
  }

  return svg.node();
};

// Fungsi untuk menghitung statistik berdasarkan pilihan
function calculateStat(
  data: { value: number }[],
  statistic: "mean" | "median" | "mode" | "min" | "max"
): number {
  switch (statistic) {
    case "mean":
      return d3.mean(data, (d) => d.value) as number;
    case "median":
      return d3.median(data, (d) => d.value) as number;
    case "mode":
      return mode(data);
    case "min":
      return d3.min(data, (d) => d.value) as number;
    case "max":
      return d3.max(data, (d) => d.value) as number;
    default:
      return 0;
  }
}

// Fungsi untuk menghitung mode
function mode(data: { value: number }[]): number {
  const frequency: { [key: number]: number } = {};
  let maxFreq = 0;
  let modeValue = 0;
  data.forEach((d) => {
    frequency[d.value] = (frequency[d.value] || 0) + 1;
    if (frequency[d.value] > maxFreq) {
      maxFreq = frequency[d.value];
      modeValue = d.value;
    }
  });
  return modeValue;
}

/**
 * Create a Normal QQ Plot comparing sample data against theoretical normal distribution
 * @param data - Array of numbers (sample data)
 * @param width - SVG width
 * @param height - SVG height
 * @param useAxis - Whether to show axes
 * @param titleOptions - Chart title options
 * @param axisLabels - Axis label options
 * @param chartColors - Optional color array
 * @returns SVGSVGElement | null
 */
export const createNormalQQPlot = (
  data: number[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: ChartTitleOptions,
  axisLabels?: { x?: string; y?: string },
  axisScaleOptions?: {
    x?: {
      min?: string;
      max?: string;
      majorIncrement?: string;
      origin?: string;
    };
    y?: {
      min?: string;
      max?: string;
      majorIncrement?: string;
      origin?: string;
    };
  },
  chartColors?: string[]
): SVGSVGElement | null => {
  // Filter and sort numeric data
  const validData = data
    .filter((d) => typeof d === "number" && !isNaN(d))
    .sort((a, b) => a - b);
  const n = validData.length;
  if (n === 0) return null;

  // Mean and standard deviation
  const mean = d3.mean(validData)!;
  const std = d3.deviation(validData)!;

  // Theoretical z-scores from standard normal distribution
  // Rankit formula (used by SPSS for Normal Q-Q)
  const z = (i: number) => {
    const p = (i + 1 - 0.375) / (n + 0.25);
    return ss.probit(p);
  };

  // Quantile data
  const xData = d3.range(n).map(z);
  const yData = validData;

  // Axis domains (allow override)
  const xExtent = d3.extent(xData) as [number, number];
  const yExtent: [number, number] = [
    mean + std * xExtent[0],
    mean + std * xExtent[1],
  ];
  let xMin = xExtent[0];
  let xMax = xExtent[1];
  let yMin = yExtent[0];
  let yMax = yExtent[1];
  if (axisScaleOptions?.x) {
    if (axisScaleOptions.x.min !== undefined && axisScaleOptions.x.min !== "")
      xMin = Number(axisScaleOptions.x.min);
    if (axisScaleOptions.x.max !== undefined && axisScaleOptions.x.max !== "")
      xMax = Number(axisScaleOptions.x.max);
  }
  if (axisScaleOptions?.y) {
    if (axisScaleOptions.y.min !== undefined && axisScaleOptions.y.min !== "")
      yMin = Number(axisScaleOptions.y.min);
    if (axisScaleOptions.y.max !== undefined && axisScaleOptions.y.max !== "")
      yMax = Number(axisScaleOptions.y.max);
  }

  // Canvas context for label measurement
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";
  const xTickCount = 6;
  const yTickCount = 6;
  const xTicks = d3.scaleLinear().domain([xMin, xMax]).nice().ticks(xTickCount);
  const yTicks = d3.scaleLinear().domain([yMin, yMax]).nice().ticks(yTickCount);
  const maxYLabelWidth =
    d3.max(yTicks.map((tick) => ctx.measureText(tick.toFixed(1)).width)) ?? 0;
  const maxXLabelWidth =
    d3.max(xTicks.map((tick) => ctx.measureText(tick.toFixed(1)).width)) ?? 0;

  // Responsive margin
  const margin = calculateResponsiveMargin({
    width,
    height,
    useAxis,
    titleOptions: titleOptions
      ? { title: titleOptions.title, subtitle: titleOptions.subtitle }
      : undefined,
    axisLabels,
    maxLabelWidth: Math.max(maxYLabelWidth, maxXLabelWidth),
  });

  // Scales
  const x = d3
    .scaleLinear()
    .domain([xMin, xMax])
    .nice()
    .range([margin.left, width - margin.right]);
  const y = d3
    .scaleLinear()
    .domain([yMin, yMax])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Custom ticks if majorIncrement is set
  const xTickValues = axisScaleOptions?.x?.majorIncrement
    ? getMajorTicks(xMin, xMax, Number(axisScaleOptions.x.majorIncrement))
    : xTicks;
  const yTickValues = axisScaleOptions?.y?.majorIncrement
    ? getMajorTicks(yMin, yMax, Number(axisScaleOptions.y.majorIncrement))
    : yTicks;

  // SVG
  const svg = createStandardSVG({
    width,
    height,
    marginTop: margin.top,
    marginRight: margin.right,
    marginBottom: margin.bottom,
    marginLeft: margin.left,
  });

  // Add clipping for points outside axis domain
  const clipPathId = `qq-clip-${Math.random().toString(36).substr(2, 9)}`;
  svg
    .append("defs")
    .append("clipPath")
    .attr("id", clipPathId)
    .append("rect")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom);

  // Title
  if (titleOptions) {
    addChartTitle(svg, {
      ...titleOptions,
      marginTop: margin.top,
      useResponsivePositioning: true,
    });
  }

  // Reference diagonal line (with clipping)
  svg
    .append("g")
    .attr("clip-path", `url(#${clipPathId})`)
    .append("line")
    .attr("x1", x(xExtent[0]))
    .attr("x2", x(xExtent[1]))
    .attr("y1", y(yExtent[0]))
    .attr("y2", y(yExtent[1]))
    .attr("stroke", "currentColor")
    .attr("stroke-opacity", 0.3);

  // QQ points (with clipping)
  svg
    .append("g")
    .attr("clip-path", `url(#${clipPathId})`)
    .attr(
      "fill",
      Array.isArray(chartColors) && chartColors.length > 0
        ? chartColors[0]
        : defaultChartColors[0]
    )
    .selectAll("circle")
    .data(d3.range(n))
    .join("circle")
    .attr("cx", (i) => x(xData[i]))
    .attr("cy", (i) => y(yData[i]))
    .attr("r", 3)
    .append("title")
    .text((i) => `Z: ${xData[i].toFixed(2)}, Data: ${yData[i].toFixed(2)}`);

  // Standardized axes
  if (useAxis) {
    addStandardAxes(svg, {
      xScale: x,
      yScale: y,
      width,
      height,
      marginTop: margin.top,
      marginRight: margin.right,
      marginBottom: margin.bottom,
      marginLeft: margin.left,
      categories: xTicks.map((d) => d.toString()),
      axisLabels: {
        x: axisLabels?.x || "Theoretical Quantiles (Z)",
        y: axisLabels?.y || "Sample Quantiles",
      },
      xMin,
      xMax,
      yMin,
      yMax,
      chartType: "vertical",
      xAxisOptions: {
        maxValueLength: 8,
        tickFormat: (d: any) => formatAxisNumber(d),
        showGridLines: true,
        tickValues: xTickValues,
      },
      yAxisOptions: {
        customFormat: formatAxisNumber,
        showGridLines: true,
        maxValueLength: 6,
        tickValues: yTickValues,
      },
    });
  }

  return svg.node() as SVGSVGElement;
};

type DistributionType =
  | "normal"
  | "logistic"
  | "exponential"
  | "chisquare"
  | "gamma"
  | "beta";
/**
 * Creates a P-P Plot (Probability-Probability Plot) for normality testing
 * @param data - Array of numeric data
 * @param width - Chart width
 * @param height - Chart height
 * @param useAxis - Whether to show axes
 * @param titleOptions - Chart title options
 * @param axisLabels - Axis labels
 * @param axisScaleOptions - Axis scale options
 * @param chartColors - Optional color array
 * @returns SVGSVGElement | null
 */
export const createPPPlot = (
  data: number[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: ChartTitleOptions,
  axisLabels?: { x?: string; y?: string },
  axisScaleOptions?: {
    x?: {
      min?: string;
      max?: string;
      majorIncrement?: string;
      origin?: string;
    };
    y?: {
      min?: string;
      max?: string;
      majorIncrement?: string;
      origin?: string;
    };
  },
  chartColors?: string[],
  distribution: DistributionType = "normal", // Tambahan parameter
  distParams?: Record<string, number> // Parameter distribusi opsional
): SVGSVGElement | null => {
  const validData = data
    .filter((d) => typeof d === "number" && !isNaN(d))
    .sort((a, b) => a - b);
  const n = validData.length;
  if (n === 0) return null;

  // Observed CDF: i / (n + 1)
  const observedCDF = d3.range(n).map((i) => (i + 1) / (n + 1));

  // Expected CDF (depends on distribution)
  const expectedCDF = validData.map((value) => {
    switch (distribution) {
      case "normal": {
        const mean = d3.mean(validData)!;
        const std = d3.deviation(validData)!;
        const z = (value - mean) / std;
        return 0.5 * (1 + math.erf(z / Math.sqrt(2)));
      }
      case "logistic": {
        const mean = d3.mean(validData)!;
        const scale = (d3.deviation(validData)! / Math.PI) * Math.sqrt(3); // approx
        return 1 / (1 + Math.exp(-(value - mean) / scale));
      }
      case "exponential": {
        const lambda = 1 / (distParams?.rate ?? 1 / d3.mean(validData)!);
        return 1 - Math.exp(-lambda * value);
      }
      default:
        return observedCDF[validData.indexOf(value)] ?? 0;
    }
  });

  // xData: observed, yData: expected
  const xData = observedCDF;
  const yData = expectedCDF;

  let xMin = 0,
    xMax = 1,
    yMin = 0,
    yMax = 1;
  if (axisScaleOptions?.x?.min) xMin = Number(axisScaleOptions.x.min);
  if (axisScaleOptions?.x?.max) xMax = Number(axisScaleOptions.x.max);
  if (axisScaleOptions?.y?.min) yMin = Number(axisScaleOptions.y.min);
  if (axisScaleOptions?.y?.max) yMax = Number(axisScaleOptions.y.max);

  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";
  const xTicks = d3.scaleLinear().domain([xMin, xMax]).nice().ticks(6);
  const yTicks = d3.scaleLinear().domain([yMin, yMax]).nice().ticks(6);
  const maxYLabelWidth =
    d3.max(yTicks.map((tick) => ctx.measureText(tick.toFixed(2)).width)) ?? 0;
  const maxXLabelWidth =
    d3.max(xTicks.map((tick) => ctx.measureText(tick.toFixed(2)).width)) ?? 0;

  const margin = calculateResponsiveMargin({
    width,
    height,
    useAxis,
    titleOptions,
    axisLabels,
    maxLabelWidth: Math.max(maxYLabelWidth, maxXLabelWidth),
  });

  const x = d3
    .scaleLinear()
    .domain([xMin, xMax])
    .nice()
    .range([margin.left, width - margin.right]);
  const y = d3
    .scaleLinear()
    .domain([yMin, yMax])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const xTickValues = axisScaleOptions?.x?.majorIncrement
    ? getMajorTicks(xMin, xMax, Number(axisScaleOptions.x.majorIncrement))
    : xTicks;
  const yTickValues = axisScaleOptions?.y?.majorIncrement
    ? getMajorTicks(yMin, yMax, Number(axisScaleOptions.y.majorIncrement))
    : yTicks;

  const svg = createStandardSVG({
    width,
    height,
    marginTop: margin.top,
    marginRight: margin.right,
    marginBottom: margin.bottom,
    marginLeft: margin.left,
  });

  const clipPathId = `pp-clip-${Math.random().toString(36).substr(2, 9)}`;
  svg
    .append("defs")
    .append("clipPath")
    .attr("id", clipPathId)
    .append("rect")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom);

  if (titleOptions) {
    addChartTitle(svg, {
      ...titleOptions,
      marginTop: margin.top,
      useResponsivePositioning: true,
    });
  }

  // Garis diagonal y = x
  svg
    .append("g")
    .attr("clip-path", `url(#${clipPathId})`)
    .append("line")
    .attr("x1", x(xMin))
    .attr("x2", x(xMax))
    .attr("y1", y(yMin))
    .attr("y2", y(yMax))
    .attr("stroke", "currentColor")
    .attr("stroke-opacity", 0.3);

  // Titik-titik P-P
  svg
    .append("g")
    .attr("clip-path", `url(#${clipPathId})`)
    .attr(
      "fill",
      Array.isArray(chartColors) && chartColors.length > 0
        ? chartColors[0]
        : defaultChartColors[0]
    )
    .selectAll("circle")
    .data(d3.range(n))
    .join("circle")
    .attr("cx", (i) => x(xData[i]))
    .attr("cy", (i) => y(yData[i]))
    .attr("r", 3)
    .append("title")
    .text(
      (i) =>
        `Observed: ${xData[i].toFixed(3)}, Expected: ${yData[i].toFixed(3)}`
    );

  if (useAxis) {
    addStandardAxes(svg, {
      xScale: x,
      yScale: y,
      width,
      height,
      marginTop: margin.top,
      marginRight: margin.right,
      marginBottom: margin.bottom,
      marginLeft: margin.left,
      categories: xTicks.map((d) => d.toString()),
      axisLabels: {
        x: axisLabels?.x || "Observed Cumulative Probability",
        y: axisLabels?.y || "Expected Cumulative Probability",
      },
      xMin,
      xMax,
      yMin,
      yMax,
      chartType: "vertical",
      xAxisOptions: {
        maxValueLength: 8,
        tickFormat: (d: any) => formatAxisNumber(d),
        showGridLines: true,
        tickValues: xTickValues,
      },
      yAxisOptions: {
        customFormat: formatAxisNumber,
        showGridLines: true,
        maxValueLength: 6,
        tickValues: yTickValues,
      },
    });
  }

  return svg.node() as SVGSVGElement;
};
