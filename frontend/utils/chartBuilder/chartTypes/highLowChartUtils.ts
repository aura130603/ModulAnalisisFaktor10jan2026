import * as d3 from "d3";
// const d3Cloud = require("d3-cloud");
import {
  addChartTitle,
  generateAxisTicks,
  formatAxisNumber,
  addStandardAxes,
} from "./chartUtils";
import {
  getMajorTicks,
  createStandardSVG,
  addAxisLabels,
  addLegend,
  calculateLegendPosition,
} from "../chartUtils";
import { calculateResponsiveMargin } from "../responsiveMarginUtils";
import { defaultChartColors } from "../defaultStyles/defaultColors";

interface chartData {
  category: string;
  subcategory?: string;
  high: number;
  low: number;
  close: number;
}

interface FormattedData {
  category: string;
  [key: string]: string | number;
}

// Helper function for color selection
const getColor = (colors?: string[]) => {
  return function (this: any, d: any, i: number): string {
    return Array.isArray(colors) && colors.length > 0
      ? colors[i % colors.length]
      : defaultChartColors[i % defaultChartColors.length];
  };
};

export const createSimpleRangeBar = (
  data: chartData[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: any,
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
  // Filter data
  const filteredData = data.filter(
    (d: chartData) =>
      d.high != null &&
      d.low != null &&
      d.close != null &&
      !isNaN(d.high) &&
      !isNaN(d.low) &&
      !isNaN(d.close) &&
      d.category != " "
  );

  console.log("Creating simplerangebar with filtered data", filteredData);

  // Create a canvas context for measuring text
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";

  // Calculate max label width for margin calculation
  const categories = filteredData.map((d) => d.category);
  const yValues = filteredData.flatMap((d) => [d.high, d.low, d.close]);
  const yTicks = d3
    .scaleLinear()
    .domain([Math.min(...yValues), Math.max(...yValues)])
    .nice()
    .ticks(5);
  const maxLabelWidth = Math.max(
    ...yTicks.map((tick) => ctx.measureText(formatAxisNumber(tick)).width)
  );

  // Use responsive margin utility
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

  // Axis scale options
  let yMin = d3.min(filteredData, (d) => d.low) as number;
  let yMax = d3.max(filteredData, (d) => d.high) as number;
  let majorIncrement = axisScaleOptions?.y?.majorIncrement
    ? Number(axisScaleOptions.y.majorIncrement)
    : undefined;

  if (axisScaleOptions?.y) {
    if (axisScaleOptions.y.min !== undefined && axisScaleOptions.y.min !== "")
      yMin = Number(axisScaleOptions.y.min);
    if (axisScaleOptions.y.max !== undefined && axisScaleOptions.y.max !== "")
      yMax = Number(axisScaleOptions.y.max);
  }

  const x = d3
    .scaleBand()
    .domain(filteredData.map((d) => d.category))
    .range([margin.left, width - margin.right])
    .padding(0.1);

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
    includeFont: true,
  });

  // Add title if provided
  if (titleOptions) {
    addChartTitle(svg, {
      ...titleOptions,
      marginTop: margin.top,
      useResponsivePositioning: true,
    });
  }

  svg
    .append("g")
    .selectAll("rect")
    .data(filteredData)
    .join("rect")
    .attr("x", (d: chartData) => x(d.category) || 0)
    .attr("y", (d: chartData) => y(d.high))
    .attr("height", (d: chartData) => y(d.low) - y(d.high))
    .attr("width", x.bandwidth())
    .attr("fill", (d: chartData, i: number) =>
      Array.isArray(chartColors) && chartColors.length > 0
        ? chartColors[i % chartColors.length]
        : defaultChartColors[i % defaultChartColors.length]
    );

  // Add close value
  svg
    .append("g")
    .attr("fill", "black")
    .selectAll("circle")
    .data(filteredData)
    .join("circle")
    .attr("cx", (d: chartData) => {
      const categoryX = x(d.category);
      return categoryX !== undefined ? categoryX + x.bandwidth() / 2 : 0;
    })
    .attr("cy", (d: chartData) => y(d.close))
    .attr("r", 3);

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
        tickValues: majorIncrement
          ? generateAxisTicks(yMin, yMax, majorIncrement)
          : undefined,
        customFormat: formatAxisNumber,
        showGridLines: false,
      },
    });
  }

  return svg.node();
};

export const createClusteredRangeBar = (
  data: {
    category: string;
    subcategory: string;
    low: number;
    high: number;
    close: number;
  }[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: any,
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
  // Filter out data where high, low, or close are null, undefined, empty string, or NaN
  const filteredData = data.filter(
    (d: {
      category: string;
      subcategory: string;
      low: number;
      high: number;
      close: number;
    }) =>
      d.high != null &&
      d.low != null &&
      d.close != null &&
      !isNaN(d.high) &&
      !isNaN(d.low) &&
      !isNaN(d.close)
  );

  console.log("Creating Clusteredrangebar with filtered data", filteredData);

  // Create a canvas context for measuring text
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";

  // Group data by category
  const categories = Array.from(new Set(filteredData.map((d) => d.category)));
  const subcategories = Array.from(
    new Set(filteredData.map((d) => d.subcategory))
  );

  // Calculate max label width for margin calculation
  const yValues = filteredData.flatMap((d) => [d.high, d.low, d.close]);
  const yTicks = d3
    .scaleLinear()
    .domain([Math.min(...yValues), Math.max(...yValues)])
    .nice()
    .ticks(5);
  const maxLabelWidth = Math.max(
    ...yTicks.map((tick) => ctx.measureText(formatAxisNumber(tick)).width)
  );

  // Calculate max legend text width
  const maxLegendWidth = Math.max(
    ...subcategories.map((subcat) => ctx.measureText(subcat).width)
  );

  // Use responsive margin utility with legend consideration
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
    hasLegend: true,
    legendPosition: "right",
  });

  // Skala X untuk kategori utama
  const x = d3
    .scaleBand()
    .domain(categories)
    .range([margin.left, width - margin.right])
    .padding(0.1);

  // Skala X untuk sub-kategori dalam kategori utama
  const xSub = d3
    .scaleBand()
    .domain(subcategories)
    .range([0, x.bandwidth()])
    .padding(0.05);

  // Y scale with axis options
  let yMin = d3.min(filteredData, (d) => d.low) as number;
  let yMax = d3.max(filteredData, (d) => d.high) as number;
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
    .range([height - margin.bottom, margin.top]);

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
    addChartTitle(svg, {
      ...titleOptions,
      marginTop: margin.top,
      useResponsivePositioning: true,
    });
  }

  // Color scale with custom colors or defaults
  const color = d3
    .scaleOrdinal<string>()
    .domain(subcategories)
    .range(chartColors || defaultChartColors);

  // Grouping data by category and subcategory
  const groupedData = d3.group(filteredData, (d) => d.category);

  // Create bars for each category and subcategory
  const categoryGroup = svg
    .append("g")
    .selectAll("g")
    .data(Array.from(groupedData))
    .join("g")
    .attr(
      "transform",
      ([category]: [string, chartData[]]) => `translate(${x(category) || 0}, 0)`
    );

  categoryGroup
    .selectAll("rect")
    .data(([_category, values]: [string, chartData[]]) => values)
    .join("rect")
    .attr("x", (d: chartData) => xSub(d.subcategory || "") || 0)
    .attr("y", (d: chartData) => y(d.high))
    .attr("height", (d: chartData) => y(d.low) - y(d.high))
    .attr("width", xSub.bandwidth())
    .attr("fill", (d: chartData) => color(d.subcategory || ""));

  // Add close value
  svg
    .append("g")
    .attr("fill", "black")
    .selectAll("circle")
    .data(filteredData)
    .join("circle")
    .attr("cx", (d: chartData) => {
      const categoryX = x(d.category);
      const subcategoryX = xSub(d.subcategory || "");
      return categoryX !== undefined && subcategoryX !== undefined
        ? categoryX + subcategoryX + xSub.bandwidth() / 2
        : 0;
    })
    .attr("cy", (d: chartData) => y(d.close))
    .attr("r", 3);

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
        tickValues: majorIncrement
          ? generateAxisTicks(yMin, yMax, majorIncrement)
          : undefined,
        customFormat: formatAxisNumber,
        showGridLines: false,
      },
    });

    // Add legend using the improved legend utility
    const legendPosition = calculateLegendPosition({
      width,
      height,
      marginLeft: margin.left,
      marginRight: margin.right,
      marginBottom: margin.bottom,
      marginTop: margin.top,
      legendPosition: "right",
      itemCount: subcategories.length,
    });

    addLegend({
      svg,
      colorScale: color,
      position: legendPosition,
      legendPosition: "right",
      domain: subcategories,
      itemWidth: 15,
      itemHeight: 15,
      fontSize: 12,
    });
  }

  return svg.node();
};

export const createHighLowCloseChart = (
  data: chartData[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: any,
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
  // Filter out data where high, low, or close are null, undefined, empty string, or NaN
  const filteredData = data.filter(
    (d: chartData) =>
      d.high != null &&
      d.low != null &&
      d.close != null &&
      !isNaN(d.high) &&
      !isNaN(d.low) &&
      !isNaN(d.close) &&
      d.category != " "
  );

  console.log("Creating highlowclose with filtered data", filteredData);

  // Create a canvas context for measuring text
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";

  // Calculate max label width for margin calculation
  const categories = filteredData.map((d) => d.category);
  const yValues = filteredData.flatMap((d) => [d.high, d.low, d.close]);
  const yTicks = d3
    .scaleLinear()
    .domain([Math.min(...yValues), Math.max(...yValues)])
    .nice()
    .ticks(5);
  const maxLabelWidth = Math.max(
    ...yTicks.map((tick) => ctx.measureText(formatAxisNumber(tick)).width)
  );

  // Use responsive margin utility with increased right margin for legend
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

  const x = d3
    .scaleBand()
    .domain(filteredData.map((d) => d.category))
    .range([margin.left, width - margin.right])
    .padding(0.2);

  // Axis scale options
  let yMin = d3.min(filteredData, (d) => d.low) as number;
  let yMax = d3.max(filteredData, (d) => d.high) as number;
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
    .range([height - margin.bottom, margin.top]);

  // Create color scale for categories
  const colorScale = d3
    .scaleOrdinal<string>()
    .domain(categories)
    .range(chartColors || defaultChartColors);

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
    addChartTitle(svg, {
      ...titleOptions,
      marginTop: margin.top,
      useResponsivePositioning: true,
    });
  }

  // Add vertical lines for high-low range
  svg
    .append("g")
    .attr("fill", "none")
    .selectAll("line")
    .data(filteredData)
    .join("line")
    .attr("x1", (d: chartData) => {
      const categoryX = x(d.category);
      return categoryX !== undefined ? categoryX + x.bandwidth() / 2 : 0;
    })
    .attr("x2", (d: chartData) => {
      const categoryX = x(d.category);
      return categoryX !== undefined ? categoryX + x.bandwidth() / 2 : 0;
    })
    .attr("y1", (d: chartData) => y(d.high))
    .attr("y2", (d: chartData) => y(d.low))
    .attr("stroke", (d) => colorScale(d.category) as string)
    .attr("stroke-width", 2);

  // Add horizontal lines for high range
  svg
    .append("g")
    .attr("fill", "none")
    .selectAll("line")
    .data(filteredData)
    .join("line")
    .attr("x1", (d: chartData) => {
      const categoryX = x(d.category);
      const range = y(d.high) - y(d.low);
      return categoryX !== undefined
        ? categoryX + x.bandwidth() / 2 - range / 10
        : 0;
    })
    .attr("x2", (d: chartData) => {
      const categoryX = x(d.category);
      const range = y(d.high) - y(d.low);
      return categoryX !== undefined
        ? categoryX + x.bandwidth() / 2 + range / 10
        : 0;
    })
    .attr("y1", (d: chartData) => y(d.high))
    .attr("y2", (d: chartData) => y(d.high))
    .attr("stroke", (d) => colorScale(d.category) as string)
    .attr("stroke-width", 2);

  // Add horizontal lines for low range
  svg
    .append("g")
    .attr("fill", "none")
    .selectAll("line")
    .data(filteredData)
    .join("line")
    .attr("x1", (d: chartData) => {
      const categoryX = x(d.category);
      const range = y(d.high) - y(d.low);
      return categoryX !== undefined
        ? categoryX + x.bandwidth() / 2 - range / 10
        : 0;
    })
    .attr("x2", (d: chartData) => {
      const categoryX = x(d.category);
      const range = y(d.high) - y(d.low);
      return categoryX !== undefined
        ? categoryX + x.bandwidth() / 2 + range / 10
        : 0;
    })
    .attr("y1", (d: chartData) => y(d.low))
    .attr("y2", (d: chartData) => y(d.low))
    .attr("stroke", (d) => colorScale(d.category) as string)
    .attr("stroke-width", 2);

  // Add close value points
  svg
    .append("g")
    .selectAll("circle")
    .data(filteredData)
    .join("circle")
    .attr("cx", (d: chartData) => {
      const categoryX = x(d.category);
      return categoryX !== undefined ? categoryX + x.bandwidth() / 2 : 0;
    })
    .attr("cy", (d: chartData) => y(d.close))
    .attr("r", 4)
    .attr("fill", (d) => colorScale(d.category) as string);

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
        tickValues: majorIncrement
          ? generateAxisTicks(yMin, yMax, majorIncrement)
          : undefined,
        customFormat: formatAxisNumber,
      },
    });
  }

  return svg.node();
};

export const createDifferenceArea = (
  data: { category: string; [key: string]: any }[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: any,
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
  console.log("Creating differencearea with data", data);

  // Filter out invalid data
  const filteredData = data.filter(
    (d) => d.category != null && d.category != " "
  );

  // Ambil nama kolom secara dinamis dari data
  const dataKeys = Object.keys(filteredData[0] || {});
  const valueKeys = dataKeys.filter((key) => key !== "category");
  const key0 = valueKeys[0] || "value0";
  const key1 = valueKeys[1] || "value1";

  // Filter data berdasarkan kolom dinamis
  const validData = filteredData.filter(
    (d) =>
      d[key0] != null && d[key1] != null && !isNaN(d[key0]) && !isNaN(d[key1])
  );

  console.log("Filtered Data", validData);

  // Create a canvas context for measuring text
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";

  // Calculate max label width for margin calculation
  const categories = validData.map((d) => d.category);
  const yValues = validData.flatMap((d) => [d[key0], d[key1]]);
  const yTicks = d3
    .scaleLinear()
    .domain([Math.min(...yValues), Math.max(...yValues)])
    .nice()
    .ticks(5);
  const maxLabelWidth = Math.max(
    ...yTicks.map((tick) => ctx.measureText(formatAxisNumber(tick)).width)
  );

  // Use responsive margin utility like stacked bar chart
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
    hasLegend: useAxis,
    legendPosition: "right",
    itemCount: 2, // Only 2 legend items for difference area
  });

  // For small preview charts, reduce margins more aggressively to make chart larger
  const isPreview = width < 150 || height < 150;
  if (isPreview) {
    margin.top = Math.max(2, margin.top * 0.2);
    margin.right = Math.max(2, margin.right * 0.2);
    margin.bottom = Math.max(2, margin.bottom * 0.4);
    margin.left = Math.max(2, margin.left * 0.4);
  } else {
    // Only apply large right margin for full-size charts
    margin.right = Math.max(margin.right, 150);
  }

  // Axis scale options
  let yMin = d3.min(validData, (d) => Math.min(d[key0], d[key1])) ?? 0;
  let yMax = d3.max(validData, (d) => Math.max(d[key0], d[key1])) ?? 100;

  if (axisScaleOptions?.y) {
    if (axisScaleOptions.y.min !== undefined && axisScaleOptions.y.min !== "")
      yMin = Number(axisScaleOptions.y.min);
    if (axisScaleOptions.y.max !== undefined && axisScaleOptions.y.max !== "")
      yMax = Number(axisScaleOptions.y.max);
  }

  const x = d3
    .scaleBand()
    .domain(validData.map((d) => d.category))
    .range([margin.left, width - margin.right])
    .padding(0.1);

  const y = d3
    .scaleLinear()
    .domain([yMin, yMax])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Colors for areas
  const colors = {
    above: chartColors?.[0] || defaultChartColors[0],
    below: chartColors?.[1] || defaultChartColors[1],
  };

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
    addChartTitle(svg, {
      ...titleOptions,
      marginTop: margin.top,
      useResponsivePositioning: true,
    });
  }

  // Area di atas garis tengah (key1 > key0)
  const areaAbove = d3
    .area<{ category: string; [key: string]: any }>()
    .curve(d3.curveStep)
    .x((d) => (x(d.category) ?? 0) + x.bandwidth() / 2)
    .y0((d) => y(d[key0]))
    .y1((d) => y(d[key1]));

  // Area di bawah garis tengah (key0 > key1)
  const areaBelow = d3
    .area<{ category: string; [key: string]: any }>()
    .curve(d3.curveStep)
    .x((d) => (x(d.category) ?? 0) + x.bandwidth() / 2)
    .y0((d) => y(d[key1]))
    .y1((d) => y(d[key0]));

  // Filter data agar area tidak tumpang tindih
  const dataAbove = validData.map((d) =>
    d[key1] > d[key0]
      ? { ...d, [key0]: d[key0], [key1]: d[key1] }
      : { ...d, [key0]: d[key1], [key1]: d[key1] }
  );

  const dataBelow = validData.map((d) =>
    d[key0] > d[key1]
      ? { ...d, [key0]: d[key0], [key1]: d[key1] }
      : { ...d, [key0]: d[key0], [key1]: d[key0] }
  );

  // Buat grup untuk area warna
  const areaGroup = svg.append("g");

  // Area biru (hanya untuk key1 > key0)
  areaGroup
    .append("path")
    .attr("fill", colors.above)
    .attr("fill-opacity", "0.7")
    .attr("d", areaAbove(dataAbove));

  // Area oranye (hanya untuk key0 > key1)
  areaGroup
    .append("path")
    .attr("fill", colors.below)
    .attr("fill-opacity", "0.7")
    .attr("d", areaBelow(dataBelow));

  // Garis tengah antara key0 dan key1
  svg
    .append("path")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr(
      "d",
      d3
        .line<{ category: string; [key: string]: any }>()
        .curve(d3.curveStep)
        .x((d) => (x(d.category) ?? 0) + x.bandwidth() / 2)
        .y((d) => y(d[key0]))(validData)
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
      categories,
      axisLabels,
      yMin,
      yMax,
      chartType: "vertical",
      xAxisOptions: {
        showGridLines: true, // Keep grid lines like stacked bar chart
        maxValueLength: 8,
      },
      yAxisOptions: {
        tickValues: axisScaleOptions?.y?.majorIncrement
          ? generateAxisTicks(
              yMin,
              yMax,
              Number(axisScaleOptions.y.majorIncrement)
            )
          : undefined,
        customFormat: formatAxisNumber,
        showGridLines: false,
        maxValueLength: 8,
      },
    });

    // Show legend for all charts like stacked bar chart
    // Build legend items pakai nama kolom dinamis
    const legendItems = [
      { label: `${key1} > ${key0}`, color: colors.above },
      { label: `${key0} > ${key1}`, color: colors.below },
    ];

    // Use the same legend positioning as stacked bar chart
    const legendPosition = calculateLegendPosition({
      width,
      height,
      marginLeft: margin.left,
      marginRight: margin.right,
      marginBottom: margin.bottom,
      marginTop: margin.top,
      legendPosition: "right",
      itemCount: legendItems.length,
    });

    // Use addLegend utility with right positioning like vertical stacked bar chart
    addLegend({
      svg,
      colorScale: d3
        .scaleOrdinal()
        .domain(legendItems.map((item) => item.label))
        .range(legendItems.map((item) => item.color)),
      position: legendPosition,
      legendPosition: "right",
      domain: legendItems.map((item) => item.label),
      itemWidth: isPreview ? 10 : 15,
      itemHeight: isPreview ? 10 : 15,
      fontSize: isPreview ? 9 : 12,
    });
  }

  return svg.node();
};
