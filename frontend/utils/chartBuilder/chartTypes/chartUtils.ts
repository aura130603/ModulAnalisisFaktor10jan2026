import * as barChartUtils from "./barChartUtils";
import * as lineChartUtils from "./lineChartUtils";
import * as pieChartUtils from "./pieChartUtils";
import * as areaChartUtils from "./areaChartUtils";
import * as histogramUtils from "./histogramUtils";
import * as scatterUtils from "./scatterUtils";
import * as boxplotUtils from "./boxplotUtils";
import * as highLowChartUtils from "./highLowChartUtils";
import * as dualAxesChartUtils from "./dualAxesChartUtils";
import * as threeDChartUtils from "./ThreeDChart";
import * as d3 from "d3";
import { addAxisLabels } from "../chartUtils";

export const chartUtils: Record<string, any> = {
  ...barChartUtils,
  ...lineChartUtils,
  ...pieChartUtils,
  ...areaChartUtils,
  ...histogramUtils,
  ...scatterUtils,
  ...boxplotUtils,
  ...highLowChartUtils,
  ...dualAxesChartUtils,
  ...threeDChartUtils,
};

export interface ChartTitleOptions {
  title: string;
  subtitle?: string;
  titleColor?: string;
  subtitleColor?: string;
  titleFontSize?: number;
  subtitleFontSize?: number;
  titleFontFamily?: string;
  subtitleFontFamily?: string;
  titleY?: number;
  subtitleY?: number;
  // New: margin-aware positioning
  marginTop?: number;
  useResponsivePositioning?: boolean;
}

export const addChartTitle = (
  svg: d3.Selection<SVGSVGElement, any, null, undefined>,
  options: ChartTitleOptions
) => {
  const {
    title,
    subtitle,
    titleColor = "hsl(var(--foreground))",
    subtitleColor = "hsl(var(--muted-foreground))",
    titleFontSize = 16,
    subtitleFontSize = 12,
    titleFontFamily = "sans-serif",
    subtitleFontFamily = "sans-serif",
    titleY,
    subtitleY,
    marginTop = 0,
    useResponsivePositioning = true,
  } = options;

  // Calculate responsive positioning based on margin
  let calculatedTitleY: number;
  let calculatedSubtitleY: number;

  if (useResponsivePositioning && marginTop > 0) {
    // Position title within the margin area, leaving some padding
    const titlePadding = Math.max(8, marginTop * 0.1); // 10% of margin as padding, min 8px
    calculatedTitleY = titlePadding + titleFontSize;
    calculatedSubtitleY =
      calculatedTitleY + titleFontSize + Math.max(4, marginTop * 0.05); // Gap between title and subtitle
  } else {
    // Fall back to provided values or defaults
    calculatedTitleY = titleY || 30;
    calculatedSubtitleY = subtitleY || 50;
  }

  // Add main title
  svg
    .append("text")
    .attr("x", "50%")
    .attr("y", calculatedTitleY)
    .attr("text-anchor", "middle")
    .attr("fill", titleColor)
    .style("font-size", `${titleFontSize}px`)
    .style("font-family", titleFontFamily)
    .style("font-weight", "bold")
    .text(title);

  // Add subtitle if provided
  if (subtitle) {
    svg
      .append("text")
      .attr("x", "50%")
      .attr("y", calculatedSubtitleY)
      .attr("text-anchor", "middle")
      .attr("fill", subtitleColor)
      .style("font-size", `${subtitleFontSize}px`)
      .style("font-family", subtitleFontFamily)
      .text(subtitle);
  }
};

export function generateAxisTicks(
  min: number,
  max: number,
  majorIncrement: number
): number[] | undefined {
  if (
    typeof min !== "number" ||
    typeof max !== "number" ||
    typeof majorIncrement !== "number" ||
    isNaN(min) ||
    isNaN(max) ||
    isNaN(majorIncrement) ||
    majorIncrement <= 0
  ) {
    return undefined; // fallback ke d3 default
  }
  const ticks = [];
  for (let v = min; v < max; v += majorIncrement) {
    ticks.push(v);
  }
  if (ticks.length === 0 || ticks[ticks.length - 1] !== max) {
    ticks.push(max);
  }
  return ticks;
}

/**
 * Format large numbers with appropriate suffixes (K, M, B)
 */
export const formatAxisNumber = (value: number): string => {
  if (Math.abs(value) >= 1e9) {
    return (value / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  }
  if (Math.abs(value) >= 1e6) {
    return (value / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (Math.abs(value) >= 1e3) {
    return (value / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return value.toString();
};

/**
 * Truncate text with ellipsis if too long
 */
export const truncateText = (text: any, maxLength: number = 12): string => {
  // Convert to string and handle null/undefined safely
  const stringText = text?.toString() || "";
  if (stringText.length <= maxLength) return stringText;
  return stringText.substring(0, maxLength - 3) + "...";
};

/**
 * Calculate optimal rotation angle for X-axis labels based on text length
 */
export const calculateXAxisRotation = (
  categories: string[],
  chartWidth: number,
  marginLeft: number,
  marginRight: number
): { rotation: number; needsRotation: boolean; maxLabelWidth: number } => {
  const availableWidth = chartWidth - marginLeft - marginRight;
  const avgLabelWidth = Math.max(...categories.map((cat) => cat.length)) * 8; // approximate 8px per character
  const categoryWidth = availableWidth / categories.length;

  if (avgLabelWidth <= categoryWidth) {
    return { rotation: 0, needsRotation: false, maxLabelWidth: avgLabelWidth };
  }

  // For moderate overlap, use 30 degrees
  const diagonal30 = avgLabelWidth * Math.cos(Math.PI / 6); // 30 degrees
  if (diagonal30 <= categoryWidth * 1.5) {
    return { rotation: -30, needsRotation: true, maxLabelWidth: avgLabelWidth };
  }

  // For significant overlap, use 45 degrees
  const diagonal45 = avgLabelWidth * Math.cos(Math.PI / 4);
  if (diagonal45 <= categoryWidth * 1.2) {
    return { rotation: -45, needsRotation: true, maxLabelWidth: avgLabelWidth };
  }

  // For extreme cases, use 60 degrees instead of 90
  return { rotation: -60, needsRotation: true, maxLabelWidth: avgLabelWidth };
};

// Helper function to format numeric values with max length
function formatNumericValue(value: number, maxLength: number): string {
  const str = value.toString();
  if (str.length <= maxLength) {
    return str;
  }

  // If number has decimal points
  if (str.includes(".")) {
    const [whole, decimal] = str.split(".");

    if (whole.length >= maxLength) {
      // If whole part is already too long, use exponential notation
      const result = value.toExponential(maxLength - 4);
      return result;
    }
    // Calculate how many decimal places we can show
    const availableSpace = maxLength - whole.length - 1; // -1 for decimal point

    if (availableSpace <= 0) {
      // No space for decimals, return whole number
      return whole;
    }
    // Return with exact number of decimal places
    const result = value.toFixed(availableSpace);
    return result;
  }

  // For large integers, use exponential notation if longer than maxLength
  const result = value.toExponential(maxLength - 4);
  return result;
}

/**
 * Standard X-axis creation with automatic label handling
 */
export const addStandardXAxis = (
  svg: d3.Selection<SVGSVGElement, any, null, undefined>,
  xScale: any,
  height: number,
  marginBottom: number,
  categories: string[],
  width: number,
  marginLeft: number,
  marginRight: number,
  options: {
    showAxis?: boolean;
    showTicks?: boolean;
    showValues?: boolean;
    tickFormat?: (d: any) => string;
    maxValueLength?: number;
  } = {
    showAxis: true,
    showTicks: true,
    showValues: true,
  }
) => {
  const {
    showAxis = true,
    showTicks = true,
    showValues = true,
    tickFormat,
    maxValueLength = 12,
  } = options;

  const rotationInfo = calculateXAxisRotation(
    categories,
    width,
    marginLeft,
    marginRight
  );

  // Buat axis dasar
  const axis = d3
    .axisBottom(xScale)
    .tickSizeOuter(0)
    .tickFormat(
      showValues
        ? (d: any) => {
            const value = tickFormat ? tickFormat(d) : d;
            // If the value is numeric, use number formatting
            const num = Number(value);
            if (!isNaN(num)) {
              return formatNumericValue(num, maxValueLength);
            }
            // For non-numeric values, use truncation
            return truncateText(value.toString(), maxValueLength);
          }
        : () => ""
    )
    .tickSize(showTicks ? 6 : 0);

  const xAxis = svg
    .append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(axis);

  // Sembunyikan garis axis jika showAxis false
  if (!showAxis) {
    xAxis.call((g) => g.select(".domain").remove());
  }

  // Sembunyikan ticks jika showTicks false
  if (!showTicks) {
    xAxis.call((g) => g.selectAll(".tick line").remove());
  }

  // Apply rotation and truncation if needed
  if (rotationInfo.needsRotation) {
    xAxis
      .selectAll("text")
      .attr("dy", ".35em")
      .attr("y", 0)
      .attr("x", 9)
      .attr("transform", (d, i, nodes) => {
        const node = nodes[i] as SVGTextElement;
        const yOffset = Math.abs(rotationInfo.rotation) <= 30 ? 8 : 12;
        return `translate(0,${yOffset}) rotate(${rotationInfo.rotation})`;
      })
      .style("text-anchor", "end")
      .text((d: any) => {
        const value = tickFormat ? tickFormat(d) : d;
        // If the value is numeric, use number formatting
        const num = Number(value);
        if (!isNaN(num)) {
          return formatNumericValue(num, maxValueLength);
        }
        // For non-numeric values, use truncation with adjusted length for rotation
        const adjustedMaxLength = Math.floor(
          maxValueLength * (1 + Math.abs(rotationInfo.rotation) / 90)
        );
        return truncateText(value.toString(), adjustedMaxLength);
      });
  } else {
    xAxis.selectAll("text").text((d: any) => {
      const value = tickFormat ? tickFormat(d) : d;
      // If the value is numeric, use number formatting
      const num = Number(value);
      if (!isNaN(num)) {
        return formatNumericValue(num, maxValueLength);
      }
      // For non-numeric values, use truncation
      return truncateText(value.toString(), maxValueLength);
    });
  }

  return { xAxis, rotationInfo };
};

/**
 * Standard Y-axis creation with automatic category label handling for horizontal charts
 */
export const addStandardYAxisForHorizontal = (
  svg: d3.Selection<SVGSVGElement, any, null, undefined>,
  yScale: any,
  marginLeft: number,
  categories: string[],
  data: any[],
  options: {
    showTicks?: boolean;
    tickFormat?: (d: any) => string;
    maxValueLength?: number;
  } = {}
) => {
  const { showTicks = true, tickFormat, maxValueLength = 3 } = options;

  const yAxis = d3.axisLeft(yScale).tickFormat(
    tickFormat ||
      ((d: any) => {
        // For horizontal charts, find the display label for the category
        const dataPoint = data.find((item: any) => item.uniqueId === d);
        return dataPoint
          ? truncateText(dataPoint.displayLabel, maxValueLength)
          : truncateText(d, maxValueLength);
      })
  );

  const yAxisGroup = svg
    .append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(yAxis);

  if (!showTicks) {
    yAxisGroup.call((g) => g.select(".domain").remove());
  }

  // Style the axis
  yAxisGroup
    .call((g) => g.selectAll(".tick line").attr("stroke", "#6b7280"))
    .call((g) => g.selectAll("text").attr("fill", "#6b7280"));

  return yAxisGroup;
};

/**
 * Standard X-axis creation for horizontal charts (numeric values)
 */
export const addStandardXAxisForHorizontal = (
  svg: d3.Selection<SVGSVGElement, any, null, undefined>,
  xScale: any,
  marginTop: number,
  options: {
    showAxis?: boolean;
    showTicks?: boolean;
    showValues?: boolean;
    showGridLines?: boolean;
    height?: number;
    marginBottom?: number;
    tickValues?: number[];
    customFormat?: (d: any) => string;
    axisPosition?: "top" | "bottom";
    maxValueLength?: number;
  } = {
    showAxis: true,
    showTicks: true,
    showValues: true,
  }
) => {
  const {
    showAxis = true,
    showTicks = true,
    showValues = true,
    showGridLines = true,
    height,
    marginBottom,
    tickValues,
    customFormat,
    axisPosition = "top",
    maxValueLength = 12,
  } = options;

  const axis =
    axisPosition === "top" ? d3.axisTop(xScale) : d3.axisBottom(xScale);

  // Set format dan ukuran tick
  axis
    .tickFormat(
      showValues
        ? customFormat || ((d: any) => formatAxisNumber(Number(d)))
        : () => ""
    )
    .tickSize(showTicks ? 6 : 0); // 6px adalah ukuran default tick D3

  if (tickValues) {
    axis.tickValues(tickValues);
  }

  const yPos = axisPosition === "top" ? marginTop : height! - marginBottom!;

  const xAxisGroup = svg
    .append("g")
    .attr("transform", `translate(0,${yPos})`)
    .call(axis);

  // Sembunyikan garis axis jika showAxis false
  if (!showAxis) {
    xAxisGroup.call((g) => g.select(".domain").remove());
  }

  // Sembunyikan ticks jika showTicks false
  if (!showTicks) {
    xAxisGroup.call((g) => g.selectAll(".tick line").remove());
  }

  // Add grid lines if requested (vertical lines for horizontal chart)
  if (showGridLines && height && marginBottom) {
    xAxisGroup.call((g) =>
      g
        .selectAll(".tick line")
        .clone()
        .attr("y2", height - marginTop - marginBottom)
        .attr("stroke-opacity", 0.1)
        .attr("stroke", "#e5e7eb")
    );
  }

  // Style the axis
  xAxisGroup
    .call((g) => g.selectAll(".tick line").attr("stroke", "#6b7280"))
    .call((g) => g.selectAll("text").attr("fill", "#6b7280"));

  return xAxisGroup;
};

/**
 * Standard Y-axis creation with automatic number formatting
 */
export const addStandardYAxis = (
  svg: d3.Selection<SVGSVGElement, any, null, undefined>,
  yScale: any,
  marginLeft: number,
  options: {
    showAxis?: boolean;
    showTicks?: boolean;
    showValues?: boolean;
    showGridLines?: boolean;
    width?: number;
    marginRight?: number;
    tickValues?: number[];
    customFormat?: (d: any) => string;
    maxValueLength?: number;
  } = {
    showAxis: true,
    showTicks: true,
    showValues: true,
  }
) => {
  const {
    showAxis = true,
    showTicks = true,
    showValues = true,
    showGridLines = true,
    width,
    marginRight,
    tickValues,
    customFormat,
    maxValueLength = 6,
  } = options;

  // Buat axis dasar
  const axis = d3
    .axisLeft(yScale)
    .tickFormat(
      showValues
        ? (d: any) => {
            // If customFormat is provided, use it first
            const value = customFormat ? customFormat(d) : d;

            // If the value is numeric, use number formatting
            const num = Number(value);
            if (!isNaN(num)) {
              const result = formatNumericValue(num, maxValueLength);
              return result;
            }
            // For non-numeric values, use truncation
            const result = truncateText(value.toString(), maxValueLength);
            return result;
          }
        : () => ""
    )
    .tickSize(showTicks ? 6 : 0);

  if (tickValues) {
    axis.tickValues(tickValues);
  }

  const yAxisGroup = svg
    .append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(axis);

  // Sembunyikan garis axis jika showAxis false
  if (!showAxis) {
    yAxisGroup.call((g) => g.select(".domain").remove());
  }

  // Sembunyikan ticks jika showTicks false
  if (!showTicks) {
    yAxisGroup.call((g) => g.selectAll(".tick line").remove());
  }

  // Add grid lines if requested
  if (showGridLines && width && marginRight) {
    yAxisGroup.call((g) =>
      g
        .selectAll(".tick line")
        .clone()
        .attr("x2", width - marginLeft - marginRight)
        .attr("stroke-opacity", 0.1)
        .attr("stroke", "#e5e7eb")
    );
  }

  // Style the axis
  yAxisGroup
    .call((g) => g.selectAll(".tick line").attr("stroke", "#6b7280"))
    .call((g) => g.selectAll("text").attr("fill", "#6b7280"));

  return yAxisGroup;
};

export interface GridStyleOptions {
  strokeOpacity: number;
  strokeColor: string;
  offset: number;
}

export interface YAxisOptions {
  showGridLines?: boolean;
  tickValues?: number[];
  customFormat?: (value: any) => string;
  maxValueLength?: number;
}

/**
 * Enhanced comprehensive axis setup for both vertical and horizontal charts
 */
export const addStandardAxes = (
  svg: d3.Selection<SVGSVGElement, any, null, undefined>,
  config: {
    xScale: any;
    yScale: any;
    width: number;
    height: number;
    marginTop: number;
    marginRight: number;
    marginBottom: number;
    marginLeft: number;
    categories: string[];
    axisLabels?: { x?: string; y?: string };
    majorIncrement?: number;
    yMin?: number;
    yMax?: number;
    xMin?: number;
    xMax?: number;
    chartType?: "vertical" | "horizontal";
    data?: any[]; // For horizontal charts to find display labels
    xAxisOptions?: {
      showAxis?: boolean; // Kontrol tampilan garis axis utama
      showTicks?: boolean; // Kontrol tampilan garis-garis pendek
      showValues?: boolean; // Kontrol tampilan angka/nilai di axis
      showAxisLabel?: boolean; // Kontrol tampilan label axis (misal: "Tahun", "Jumlah")
      tickFormat?: (d: any) => string;
      maxValueLength?: number; // Panjang maksimum untuk nilai di axis
      axisPosition?: "top" | "bottom";
      tickValues?: number[];
      customFormat?: (d: any) => string;
      showGridLines?: boolean;
    };
    yAxisOptions?: {
      showAxis?: boolean; // Kontrol tampilan garis axis utama
      showTicks?: boolean; // Kontrol tampilan garis-garis pendek
      showValues?: boolean; // Kontrol tampilan angka/nilai di axis
      showAxisLabel?: boolean; // Kontrol tampilan label axis (misal: "Tahun", "Jumlah")
      showGridLines?: boolean;
      tickValues?: number[];
      customFormat?: (d: any) => string;
      maxValueLength?: number; // Panjang maksimum untuk nilai di axis
    };
    gridStyle?: Partial<GridStyleOptions>;
  }
) => {
  const {
    xScale,
    yScale,
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
    xMin,
    xMax,
    chartType = "vertical",
    data = [],
    xAxisOptions = {},
    yAxisOptions = {},
  } = config;

  // Default grid style with fallback values
  const defaultGridStyle: GridStyleOptions = {
    strokeOpacity: 0.1,
    strokeColor: "currentColor",
    offset: 0.5,
  };

  const gridStyle = { ...defaultGridStyle, ...config.gridStyle };

  let tickValues: number[] | undefined;
  let rotationInfo: any = {};

  // Add grid lines with consistent style if enabled
  // Add horizontal grid lines if enabled for X axis
  if (config.xAxisOptions?.showGridLines) {
    svg
      .append("g")
      .attr("class", "grid-lines")
      .attr("stroke", gridStyle.strokeColor)
      .attr("stroke-opacity", gridStyle.strokeOpacity)
      .selectAll("line")
      .data(d3.ticks(yScale.domain()[0], yScale.domain()[1], height / 50))
      .join("line")
      .attr("y1", (d) => gridStyle.offset + yScale(d))
      .attr("y2", (d) => gridStyle.offset + yScale(d))
      .attr("x1", marginLeft)
      .attr("x2", width - marginRight);
  }

  // Add vertical grid lines if enabled for Y axis
  if (config.yAxisOptions?.showGridLines) {
    svg
      .append("g")
      .attr("class", "grid-lines")
      .attr("stroke", gridStyle.strokeColor)
      .attr("stroke-opacity", gridStyle.strokeOpacity)
      .selectAll("line")
      .data(d3.ticks(xScale.domain()[0], xScale.domain()[1], width / 80))
      .join("line")
      .attr("x1", (d) => gridStyle.offset + xScale(d))
      .attr("x2", (d) => gridStyle.offset + xScale(d))
      .attr("y1", marginTop)
      .attr("y2", height - marginBottom);
  }

  if (chartType === "horizontal") {
    // For horizontal charts: X = numeric values, Y = categories

    // Generate tick values for X-axis (numeric) if majorIncrement is provided
    if (
      majorIncrement &&
      typeof xMin === "number" &&
      typeof xMax === "number"
    ) {
      tickValues = generateAxisTicks(xMin, xMax, majorIncrement);
    }

    // Add X-axis (numeric values) if enabled
    if (xAxisOptions.showAxis !== false) {
      addStandardXAxisForHorizontal(svg, xScale, marginTop, {
        ...xAxisOptions,
        showGridLines: false, // We're using custom grid lines now
        height,
        marginBottom,
        tickValues: tickValues || xAxisOptions.tickValues,
        customFormat: xAxisOptions.customFormat || formatAxisNumber,
      });
    }

    // Add Y-axis (categories) if enabled
    if (yAxisOptions.showAxis !== false) {
      addStandardYAxisForHorizontal(svg, yScale, marginLeft, categories, data, {
        ...yAxisOptions,
        maxValueLength: yAxisOptions.maxValueLength || 15,
      });
    }
  } else {
    // For vertical charts: X = categories, Y = numeric values

    // Generate tick values for Y-axis (numeric) if majorIncrement is provided
    if (
      majorIncrement &&
      typeof yMin === "number" &&
      typeof yMax === "number"
    ) {
      tickValues = generateAxisTicks(yMin, yMax, majorIncrement);
    }

    // Add X-axis (categories) if enabled
    if (xAxisOptions.showAxis !== false) {
      const axisResult = addStandardXAxis(
        svg,
        xScale,
        height,
        marginBottom,
        categories,
        width,
        marginLeft,
        marginRight,
        xAxisOptions
      );
      rotationInfo = axisResult.rotationInfo;
    }

    // Add Y-axis (numeric values) if enabled
    if (yAxisOptions.showAxis !== false) {
      addStandardYAxis(svg, yScale, marginLeft, {
        ...yAxisOptions,
        showGridLines: false, // We're using custom grid lines now
        width,
        marginRight,
        tickValues: tickValues || yAxisOptions.tickValues,
        customFormat: yAxisOptions.customFormat || formatAxisNumber,
      });
    }
  }

  // Calculate additional margin needed for rotated labels (only for vertical charts)
  const additionalBottomMargin =
    chartType === "vertical" && rotationInfo.needsRotation
      ? rotationInfo.rotation === -90
        ? rotationInfo.maxLabelWidth
        : rotationInfo.maxLabelWidth *
          Math.sin((Math.abs(rotationInfo.rotation) * Math.PI) / 180)
      : 0;

  // Add axis labels using existing utility function
  addAxisLabels({
    svg,
    width,
    height,
    marginTop,
    marginRight,
    marginBottom: marginBottom + additionalBottomMargin,
    marginLeft,
    axisLabels,
    chartType,
    xAxisOptions,
    yAxisOptions,
  });

  return {
    rotationInfo,
    additionalBottomMargin,
    tickValues,
  };
};
