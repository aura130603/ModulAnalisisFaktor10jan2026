import * as d3 from "d3";

// Utility: Major ticks generator
export function getMajorTicks(min: number, max: number, inc: number): number[] {
  const ticks = [];
  let v = min;
  while (v < max) {
    ticks.push(Number(v.toFixed(10))); // Hindari floating point error
    v += inc;
  }
  if (ticks.length === 0 || Math.abs(ticks[ticks.length - 1] - max) > 1e-8) {
    ticks.push(max);
  }
  return ticks;
}

export interface SVGCreationOptions {
  width: number;
  height: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  includeFont?: boolean;
  customViewBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Creates a standardized SVG element with consistent attributes
 * This function standardizes SVG creation across all chart utilities
 *
 * @param options - Configuration object for SVG creation
 * @returns D3 selection of the created SVG element
 */
export const createStandardSVG = (options: SVGCreationOptions) => {
  const {
    width,
    height,
    marginTop = 0,
    marginRight = 0,
    marginBottom = 0,
    marginLeft = 0,
    includeFont = false,
    customViewBox,
  } = options;

  const totalWidth = width + marginLeft + marginRight;
  const totalHeight = height + marginTop + marginBottom;

  // Determine viewBox - use custom if provided, otherwise use standard dimensions
  const viewBox = customViewBox
    ? [
        customViewBox.x,
        customViewBox.y,
        customViewBox.width,
        customViewBox.height,
      ]
    : [0, 0, width, height];

  // Base style
  let style = "max-width: 100%; height: auto;";
  if (includeFont) {
    style += " font: 10px sans-serif;";
  }

  return d3
    .create("svg")
    .attr("width", totalWidth)
    .attr("height", totalHeight)
    .attr("viewBox", viewBox)
    .attr("style", style);
};

export interface AxisLabelOptions {
  x?: string;
  y?: string;
  y1?: string; // For dual axis charts
  y2?: string; // For dual axis charts
}

export interface AxisLabelConfig {
  svg: d3.Selection<SVGSVGElement, any, null, undefined>;
  width: number;
  height: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  axisLabels?: AxisLabelOptions;
  chartType?:
    | "vertical"
    | "horizontal"
    | "scatter"
    | "line"
    | "pyramid"
    | "default";
  xAxisOptions?: {
    showAxisLabel?: boolean;
  };
  yAxisOptions?: {
    showAxisLabel?: boolean;
  };
}

/**
 * Adds X axis label to an SVG element
 * This function standardizes X axis label placement across all chart types
 */
export const addXAxisLabel = (config: AxisLabelConfig) => {
  const {
    svg,
    width,
    height,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    axisLabels,
    chartType = "default",
  } = config;

  if (!axisLabels?.x) return;

  let xPosition: number;
  let yPosition: number;

  // Calculate dynamic offset based on chart size and margin
  const calculateDynamicOffset = (margin: number, dimension: number) => {
    // Base offset that scales with chart size, with min/max bounds
    return Math.max(20, Math.min(40, margin * 0.6 + dimension * 0.02));
  };

  switch (chartType) {
    case "horizontal":
      // For horizontal bar charts, X label goes below the chart (bottom)
      xPosition = width / 2;
      yPosition = height - marginBottom / 3;
      // + calculateDynamicOffset(marginBottom, height);
      break;
    case "pyramid":
      // For pyramid charts, X label goes below with adjusted positioning
      xPosition = (width + marginLeft - marginRight) / 2;
      yPosition = height - marginBottom / 3;
      // calculateDynamicOffset(marginBottom, 0.8 * height);
      break;
    case "vertical":
    case "line":
    case "scatter":
    case "default":
    default:
      // For vertical charts, X label goes below the chart (bottom axis)
      xPosition = (width + marginLeft - marginRight) / 2;
      yPosition = height - marginBottom / 6; // Posisi lebih ke bawah untuk menghindari overlap

      // + calculateDynamicOffset(marginBottom, height);
      break;
  }

  svg
    .append("text")
    .attr("x", xPosition)
    .attr("y", yPosition)
    .attr("text-anchor", "middle")
    .attr("fill", "hsl(var(--foreground))")
    .style("font-size", "14px")
    .text(axisLabels.x);
};

/**
 * Adds Y axis label to an SVG element
 * This function standardizes Y axis label placement across all chart types
 */
export const addYAxisLabel = (config: AxisLabelConfig) => {
  const {
    svg,
    width,
    height,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    axisLabels,
    chartType = "default",
  } = config;

  if (!axisLabels?.y) return;

  let xPosition: number;
  let yPosition: number;

  // Calculate dynamic offset based on chart size and margin (same as X axis for consistency)
  const calculateDynamicOffset = (margin: number, dimension: number) => {
    return Math.max(30, Math.min(50, margin * 0.5 + dimension * 0.02));
  };

  switch (chartType) {
    case "horizontal":
      // For horizontal bar charts
      xPosition = -(height / 2);
      yPosition = marginLeft - calculateDynamicOffset(marginLeft, width);
      break;
    case "vertical":
    case "line":
    case "scatter":
    case "default":
    default:
      // For vertical charts
      xPosition = -(height + marginTop - marginBottom) / 2;
      yPosition = marginLeft - calculateDynamicOffset(marginLeft, width);
      break;
  }

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", xPosition)
    .attr("y", yPosition)
    .attr("text-anchor", "middle")
    .attr("fill", "hsl(var(--foreground))")
    .style("font-size", "14px")
    .text(axisLabels.y);
};

/**
 * Adds both X and Y axis labels to an SVG element
 * This is a convenience function that calls both addXAxisLabel and addYAxisLabel
 */
export const addAxisLabels = (config: AxisLabelConfig) => {
  // Add X axis label if showAxisLabel is true
  if (config.xAxisOptions?.showAxisLabel !== false) {
    addXAxisLabel(config);
  }

  // Add Y axis label if showAxisLabel is true
  if (config.yAxisOptions?.showAxisLabel !== false) {
    addYAxisLabel(config);
  }
};

/**
 * Adds dual Y axis labels for charts with two Y axes (left and right)
 * Used for dual-axis charts like bar-and-line combinations
 */
export const addDualYAxisLabels = (config: AxisLabelConfig) => {
  const {
    svg,
    height,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    axisLabels,
  } = config;

  // Left Y axis label (y1)
  if (axisLabels?.y1) {
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(height + marginTop - marginBottom) / 2)
      .attr("y", marginLeft - 40)
      .attr("text-anchor", "middle")
      .attr("fill", "hsl(var(--foreground))")
      .style("font-size", "14px")
      .text(axisLabels.y1);
  }

  // Right Y axis label (y2)
  if (axisLabels?.y2) {
    svg
      .append("text")
      .attr("transform", "rotate(90)")
      .attr("x", (height + marginTop - marginBottom) / 2)
      .attr("y", -marginRight + 20)
      .attr("text-anchor", "middle")
      .attr("fill", "hsl(var(--foreground))")
      .style("font-size", "14px")
      .text(axisLabels.y2);
  }
};

/**
 * Creates a standardized legend/swatches for charts
 * Based on Observable's Swatches pattern: https://observablehq.com/@d3/color-legend
 */
export interface LegendOptions {
  svg: any; // Allow flexible SVG selection type
  colorScale: any; // Allow flexible color scale type
  position: {
    x: number;
    y: number;
    width?: number; // Add width for bottom legend layout calculation
  };
  itemWidth?: number;
  itemHeight?: number;
  itemSpacing?: number;
  fontSize?: number;
  maxItemsPerRow?: number;
  title?: string;
  domain?: string[]; // Add domain option
  legendPosition?: "bottom" | "right"; // Add position option
}

export function addLegend({
  svg,
  colorScale,
  position,
  itemWidth = 19,
  itemHeight = 19,
  itemSpacing = 120,
  fontSize = 10,
  maxItemsPerRow,
  title,
  domain: customDomain,
  legendPosition = "bottom",
}: LegendOptions): void {
  const domain = customDomain || colorScale.domain();

  // Create canvas for text measurement
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = `${fontSize}px sans-serif`;

  // Function to truncate text with ellipsis - increased maxLength for better readability
  const truncateText = (text: string, maxLength: number = 25) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + "...";
  };

  // Calculate max text width for truncated text
  const maxTextWidth = Math.max(
    ...domain.map((item: string) => ctx.measureText(truncateText(item)).width)
  );

  // Calculate adaptive spacing based on text width and legend position
  const minSpacing =
    itemWidth + 8 + maxTextWidth + (legendPosition === "right" ? 15 : 30);
  const adaptiveSpacing = Math.max(
    legendPosition === "right" ? minSpacing : itemSpacing,
    minSpacing
  );

  const legendGroup = svg
    .append("g")
    .attr("class", "chart-legend")
    .attr("font-family", "sans-serif")
    .attr("font-size", fontSize)
    .attr("text-anchor", "start")
    .attr("transform", `translate(${position.x}, ${position.y})`);

  // Add title if provided
  if (title) {
    legendGroup
      .append("text")
      .attr("x", 0)
      .attr("y", -10)
      .attr("font-weight", "bold")
      .attr("fill", "hsl(var(--foreground))")
      .text(title);
  }

  // For bottom position, we want to spread items horizontally first
  if (legendPosition === "bottom") {
    const availableWidth = position.width || 500;
    const itemsPerRow = Math.max(
      1,
      Math.floor(availableWidth / adaptiveSpacing)
    );

    domain.forEach((item: string, index: number) => {
      const row = Math.floor(index / itemsPerRow);
      const col = index % itemsPerRow;

      const xOffset = col * adaptiveSpacing;
      const yOffset = row * (itemHeight + 8);

      // Create swatch rectangle
      legendGroup
        .append("rect")
        .attr("x", xOffset)
        .attr("y", yOffset)
        .attr("width", itemWidth)
        .attr("height", itemHeight)
        .attr("fill", colorScale(item))
        .attr("stroke", "hsl(var(--border))")
        .attr("stroke-width", 0.5);

      // Create label text with truncation
      const text = legendGroup
        .append("text")
        .attr("x", xOffset + itemWidth + 6)
        .attr("y", yOffset + itemHeight / 2)
        .attr("dy", "0.35em")
        .attr("fill", "hsl(var(--foreground))")
        .text(truncateText(item));

      // Add title attribute for full text on hover
      if (item.length > 20) {
        text.append("title").text(item);
      }
    });
  } else {
    // For right position, implement multi-column layout to prevent overflow
    const maxHeight = 300; // Maximum height for legend
    const itemHeightWithSpacing = itemHeight + 8;
    const maxItemsPerColumn = Math.floor(maxHeight / itemHeightWithSpacing);

    // Calculate number of columns needed
    const numColumns = Math.ceil(domain.length / maxItemsPerColumn);
    const columnWidth = Math.max(adaptiveSpacing, 140); // Ensure minimum column width

    domain.forEach((item: string, index: number) => {
      const column = Math.floor(index / maxItemsPerColumn);
      const row = index % maxItemsPerColumn;

      const xOffset = column * columnWidth;
      const yOffset = row * itemHeightWithSpacing;

      // Create swatch rectangle
      legendGroup
        .append("rect")
        .attr("x", xOffset)
        .attr("y", yOffset)
        .attr("width", itemWidth)
        .attr("height", itemHeight)
        .attr("fill", colorScale(item))
        .attr("stroke", "hsl(var(--border))")
        .attr("stroke-width", 0.5);

      // Create label text with truncation
      const text = legendGroup
        .append("text")
        .attr("x", xOffset + itemWidth + 6)
        .attr("y", yOffset + itemHeight / 2)
        .attr("dy", "0.35em")
        .attr("fill", "hsl(var(--foreground))")
        .text(truncateText(item));

      // Add title attribute for full text on hover
      if (item.length > 20) {
        text.append("title").text(item);
      }
    });
  }
}

/**
 * Calculate optimal legend positioning based on chart dimensions and legend type
 */
export interface LegendPositionOptions {
  width: number;
  height: number;
  marginLeft: number;
  marginRight: number;
  marginBottom: number;
  marginTop: number;
  legendPosition?: "bottom" | "right";
  itemCount: number;
  itemSpacing?: number;
}

export function calculateLegendPosition({
  width,
  height,
  marginLeft,
  marginRight,
  marginBottom,
  marginTop,
  legendPosition = "bottom",
  itemCount,
  itemSpacing = 120,
  dualAxes = false, // ✅ parameter baru
}: LegendPositionOptions & { dualAxes?: boolean }): {
  x: number;
  y: number;
  width?: number;
  maxItemsPerRow?: number;
} {
  switch (legendPosition) {
    case "bottom": {
      const availableWidth = width - marginLeft - marginRight;
      const maxItemsPerRow = Math.max(
        1,
        Math.floor(availableWidth / itemSpacing)
      );
      return {
        x: marginLeft,
        y: height - marginBottom + 80,
        width: availableWidth,
        maxItemsPerRow,
      };
    }

    case "right": {
      // ✅ Geser lebih jauh ke kanan jika dual axes
      const legendOffset = dualAxes ? 60 : 20;

      // Calculate space needed for multi-column legend
      const maxHeight = 300; // Same as in addLegend function
      const itemHeightWithSpacing = 27; // itemHeight (19) + spacing (8)
      const maxItemsPerColumn = Math.floor(maxHeight / itemHeightWithSpacing);
      const numColumns = Math.ceil(itemCount / maxItemsPerColumn);

      // Adjust x position to accommodate multiple columns
      const columnWidth = 120; // Approximate width per column
      const totalLegendWidth = numColumns * columnWidth;

      return {
        x: width - marginRight + legendOffset,
        y: marginTop,
        maxItemsPerRow: 1,
      };
    }

    default:
      return {
        x: marginLeft,
        y: height - marginBottom + 40,
        width: width - marginLeft - marginRight,
        maxItemsPerRow: Math.max(
          1,
          Math.floor((width - marginLeft - marginRight) / itemSpacing)
        ),
      };
  }
}

export interface StandardAxesOptions {
  xScale: any;
  yScale: any;
  width: number;
  height: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  categories?: string[];
  axisLabels?: { x?: string; y?: string };
  yMin: number;
  yMax: number;
  chartType?: "vertical" | "horizontal";
  xAxisOptions?: {
    showGridLines?: boolean;
    tickValues?: number[];
    customFormat?: (value: number) => string;
  };
  yAxisOptions?: {
    showGridLines?: boolean;
    tickValues?: number[];
    customFormat?: (value: number) => string;
  };
  gridStyle?: Partial<{
    stroke: string;
    strokeWidth: number;
    opacity: number;
  }>;
}

export const addStandardAxes = (
  svg: d3.Selection<SVGSVGElement, any, null, undefined>,
  options: StandardAxesOptions
) => {
  // ... implementation ...
};
