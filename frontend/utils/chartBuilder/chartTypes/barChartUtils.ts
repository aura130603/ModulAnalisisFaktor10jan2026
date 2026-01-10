import * as d3 from "d3";

import {
  getMajorTicks,
  createStandardSVG,
  addAxisLabels,
  addLegend,
  calculateLegendPosition,
} from "../chartUtils";
import { filterDataByAxisRange } from "../dataFilter";
import {
  generateAxisTicks,
  formatAxisNumber,
  truncateText,
  addStandardAxes,
  ChartTitleOptions,
  addChartTitle,
} from "./chartUtils";
import { calculateResponsiveMargin } from "../responsiveMarginUtils";
import { defaultChartColors } from "../defaultStyles/defaultColors";

// Definisikan interface untuk data chart
interface ChartData {
  category: string;
  subcategory: string;
  value: number;
}

// Definisikan interface untuk formattedData
interface FormattedData {
  category: string;
  [key: string]: number | string;
}

export const createVerticalBarChart2 = (
  data: { category: string; value: number }[],
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
  // Filter data sesuai axis min/max
  const filteredData = filterDataByAxisRange(
    data,
    {
      x: { min: axisScaleOptions?.x?.min, max: axisScaleOptions?.x?.max },
      y: { min: axisScaleOptions?.y?.min, max: axisScaleOptions?.y?.max },
    },
    { x: "category", y: "value" }
  );
  console.log("Creating chart with filtered data:", filteredData);
  console.log("Creating chart with data:", axisLabels);

  // Handle duplicate categories by creating unique identifiers
  const processedData = filteredData.map((d, index) => ({
    ...d,
    originalCategory: d.category,
    uniqueId: `${d.category}_${index}`, // Create unique ID for positioning
    displayLabel: d.category, // Keep original category name for display
  }));

  const maxValue = d3.max(processedData, (d) => d.value) as number;

  // Label X dinamis - use original category names for width calculation
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";
  const maxXLabelWidth =
    d3.max(processedData, (d) => ctx.measureText(d.displayLabel).width) ?? 0;
  const yTicks = d3.scaleLinear().domain([0, maxValue]).ticks(5);
  const maxYLabelWidth =
    d3.max(yTicks.map((tick) => ctx.measureText(tick.toFixed(0)).width)) ?? 0;

  const needRotateX = maxXLabelWidth > width / processedData.length;

  // Use responsive margin utility with categories for automatic rotation detection
  const margin = calculateResponsiveMargin({
    width,
    height,
    useAxis,
    titleOptions,
    axisLabels,
    maxLabelWidth: maxYLabelWidth,
    categories: processedData.map((d) => d.displayLabel),
    hasLegend: false,
  });

  const {
    top: marginTop,
    bottom: marginBottom,
    left: marginLeft,
    right: marginRight,
  } = margin;

  // Y scale
  let yMin = 0;
  let yMax = maxValue;
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

  // X scale (band) - use unique IDs for positioning, but display original category names
  const x = d3
    .scaleBand()
    .domain(processedData.map((d) => d.uniqueId))
    .range([marginLeft, width - marginRight])
    .padding(0.1);

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
    console.log("Adding title with options:", titleOptions);
    addChartTitle(svg, {
      ...titleOptions,
      marginTop,
      useResponsivePositioning: true,
    });
  }

  svg
    .append("g")
    .selectAll("rect")
    .data(processedData)
    .join("rect")
    .attr("x", (d) => x(d.uniqueId) || 0)
    .attr("y", (d) => y(d.value))
    .attr("height", (d) => (y(yMin) as number) - (y(d.value) as number))
    .attr("width", x.bandwidth())
    .attr("fill", (d, i) =>
      Array.isArray(chartColors) && chartColors.length > 0
        ? chartColors[i % chartColors.length]
        : defaultChartColors[i % defaultChartColors.length]
    );

  if (useAxis) {
    // Use standardized axis functions with automatic formatting and rotation
    const categories = processedData.map((d) => d.displayLabel);

    const axisConfig = addStandardAxes(svg, {
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
        tickFormat: (d: any) => {
          const dataPoint = processedData.find((item) => item.uniqueId === d);
          return dataPoint ? truncateText(dataPoint.displayLabel, 12) : d;
        },
        maxValueLength: 8,
        showGridLines: true,
      },
      yAxisOptions: {
        customFormat: formatAxisNumber,
        showGridLines: false,
        showTicks: true,
        maxValueLength: 8,
      },
    });
  }

  return svg.node();
};

export const createHorizontalBarChart = (
  data: { category: string; value: number }[],
  width: number,
  height: number,
  useAxis: boolean = true,
  barColor: string = "steelblue",
  threshold: number = 0.007,
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
  // Filter data sesuai axis min/max
  const filteredData = filterDataByAxisRange(
    data,
    {
      x: { min: axisScaleOptions?.x?.min, max: axisScaleOptions?.x?.max },
      y: { min: axisScaleOptions?.y?.min, max: axisScaleOptions?.y?.max },
    },
    { x: "category", y: "value" }
  );

  // Handle duplicate categories by creating unique identifiers
  const processedData = filteredData.map((d, index) => ({
    ...d,
    originalCategory: d.category,
    uniqueId: `${d.category}_${index}`, // Create unique ID for positioning
    displayLabel: d.category, // Keep original category name for display
  }));

  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";

  const maxCategoryWidth =
    d3.max(processedData.map((d) => ctx.measureText(d.displayLabel).width)) ??
    0;

  // Responsive margin for horizontal bar chart
  const xScaleTemp = d3
    .scaleLinear()
    .domain([0, d3.max(processedData, (d) => d.value) ?? 0]);
  const xTicks = xScaleTemp.ticks(5).map((d) => d.toFixed(0) + "%");
  const maxTickWidth = d3.max(xTicks.map((t) => ctx.measureText(t).width)) ?? 0;

  // Use responsive margin utility for horizontal chart
  const margin = calculateResponsiveMargin({
    width,
    height,
    useAxis,
    titleOptions,
    axisLabels,
    maxLabelWidth: maxCategoryWidth,
    maxTickWidth,
    isHorizontalChart: true,
  });

  const {
    top: marginTop,
    bottom: marginBottom,
    left: marginLeft,
    right: marginRight,
  } = margin;

  // Use responsive margins directly - no need to override

  // X scale
  let xMin = 0;
  let xMax = d3.max(processedData, (d) => d.value) as number;
  let majorIncrement = axisScaleOptions?.x?.majorIncrement
    ? Number(axisScaleOptions.x.majorIncrement)
    : undefined;
  if (axisScaleOptions?.x) {
    if (axisScaleOptions.x.min !== undefined && axisScaleOptions.x.min !== "")
      xMin = Number(axisScaleOptions.x.min);
    if (axisScaleOptions.x.max !== undefined && axisScaleOptions.x.max !== "")
      xMax = Number(axisScaleOptions.x.max);
  }
  const x = d3
    .scaleLinear()
    .domain([xMin, xMax])
    .nice()
    .range([marginLeft, width - marginRight]);

  // Y scale (band) - use unique IDs for positioning, but display original category names
  const y = d3
    .scaleBand()
    .domain(processedData.map((d) => d.uniqueId))
    .rangeRound([marginTop, height - marginBottom])
    .paddingInner(0.1)
    .paddingOuter(0.02); // Lebih rapat ke tepi

  const format = x.tickFormat(20, "%");

  const svg = createStandardSVG({
    width,
    height,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
  });

  // Add title if provided
  if (titleOptions) {
    addChartTitle(svg, titleOptions);
  }

  // Bars
  svg
    .append("g")
    .attr("fill", (d, i) =>
      Array.isArray(chartColors) && chartColors.length > 0
        ? chartColors[i % chartColors.length]
        : defaultChartColors[i % defaultChartColors.length]
    )
    .selectAll("rect")
    .data(processedData)
    .join("rect")
    .attr("x", x(xMin))
    .attr("y", (d) => y(d.uniqueId) ?? 0)
    .attr("width", (d) => x(d.value) - x(xMin))
    .attr("height", y.bandwidth());

  // Axis with standardized functions
  if (useAxis) {
    // Use standardized axis functions for horizontal chart
    const categories = processedData.map((d) => d.displayLabel);

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
      xMin,
      xMax,
      chartType: "horizontal",
      data: processedData, // Pass processed data for display label lookup
      xAxisOptions: {
        axisPosition: "top",
        customFormat: formatAxisNumber,
        showGridLines: false,
      },
      yAxisOptions: {
        maxValueLength: 6,
        showGridLines: true,
      },
    });
  }

  return svg.node();
};

export const createVerticalStackedBarChart = (
  data: ChartData[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: ChartTitleOptions,
  axisLabels?: { x?: string; y?: string },
  axisScaleOptions?: {
    y?: {
      min?: string;
      max?: string;
      majorIncrement?: string;
    };
  },
  chartColors?: string[]
) => {
  // Validasi data
  console.log("Creating stacked bar plot with data", data);
  const validData = data.filter(
    (d) =>
      typeof d.category === "string" &&
      typeof d.subcategory === "string" &&
      typeof d.value === "number" &&
      d.value >= 0
  );

  if (validData.length === 0) {
    console.error("No valid data available for the stacked bar chart");
    return null;
  }

  // Create a canvas context for measuring text
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";

  // Kategori utama dan subkategori
  const categories = Array.from(new Set(validData.map((d) => d.category)));
  const subcategories = Array.from(
    new Set(validData.map((d) => d.subcategory))
  );

  // Format data untuk stack
  const formattedData: FormattedData[] = categories.map((category) => {
    const entry: FormattedData = { category };
    validData
      .filter((d) => d.category === category)
      .forEach((d) => {
        entry[d.subcategory] = d.value;
      });
    return entry;
  });

  // Membuat stack generator
  const stackGenerator = d3.stack<FormattedData>().keys(subcategories);
  const series = stackGenerator(formattedData);

  // Calculate max Y value for ticks
  const maxValue = d3.max(series, (s) => d3.max(s, (d) => d[1]))!;
  const yTicks = d3.scaleLinear().domain([0, maxValue]).nice().ticks(5);

  // Calculate max label width for margin calculation
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
    itemCount: subcategories.length,
  });

  // Skala untuk sumbu X
  const x0 = d3
    .scaleBand()
    .domain(categories)
    .range([margin.left, width - margin.right])
    .paddingInner(0.1);

  // Y scale with axis options
  let yMin = 0;
  let yMax = d3.max(series, (s) => d3.max(s, (d) => d[1]))!;
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

  // Color scale
  const color = d3
    .scaleOrdinal<string>()
    .domain(subcategories)
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

  // Draw bars
  svg
    .append("g")
    .selectAll("g")
    .data(series)
    .join("g")
    .attr("fill", (d) => color(d.key))
    .selectAll("rect")
    .data((d) => d.map((item) => ({ ...item, key: d.key })))
    .join("rect")
    .attr("x", (d) => x0(d.data.category)!)
    .attr("y", (d) => y(Math.min(Math.max(d[1], yMin), yMax)))
    .attr("height", (d) => {
      const y0 = Math.min(Math.max(d[0], yMin), yMax);
      const y1 = Math.min(Math.max(d[1], yMin), yMax);
      return Math.max(0, y(y0) - y(y1));
    })
    .attr("width", x0.bandwidth())
    .append("title")
    .text((d) => `${d.data.category}, ${d.key}: ${d[1] - d[0]}`);

  // Add axes if needed
  if (useAxis) {
    addStandardAxes(svg, {
      xScale: x0,
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
        maxValueLength: 8,
      },
      yAxisOptions: {
        tickValues: yAxisMajorIncrement
          ? generateAxisTicks(yMin, yMax, yAxisMajorIncrement)
          : undefined,
        customFormat: formatAxisNumber,
        showGridLines: false,
        maxValueLength: 8,
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

/**
 * Fungsi Horizontal Stacked Bar Chart
 *
 * @param data - Array dari objek ChartData
 * @param width - Lebar SVG
 * @param height - Tinggi SVG
 * @param useAxis - Boolean untuk menentukan apakah sumbu akan ditampilkan
 * @returns SVGElement atau null jika data tidak valid
 */
export const createHorizontalStackedBarChart = (
  data: ChartData[],
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
    };
  },
  chartColors?: string[]
): SVGElement | null => {
  // Validasi data
  const validData = data.filter(
    (d) =>
      typeof d.category === "string" &&
      typeof d.subcategory === "string" &&
      typeof d.value === "number" &&
      d.value >= 0
  );

  if (validData.length === 0) {
    console.error(
      "No valid data available for the horizontal stacked bar chart"
    );
    return null;
  }

  // Create a canvas context for measuring text
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";

  // Kategori utama dan subkategori
  const categories = Array.from(new Set(validData.map((d) => d.category)));
  const subcategories = Array.from(
    new Set(validData.map((d) => d.subcategory))
  );

  // Format data untuk stack
  const formattedData: FormattedData[] = categories.map((category) => {
    const entry: FormattedData = { category };
    validData
      .filter((d) => d.category === category)
      .forEach((d) => {
        entry[d.subcategory] = d.value;
      });
    return entry;
  });

  // Membuat stack generator
  const stackGenerator = d3.stack<FormattedData>().keys(subcategories);
  const series = stackGenerator(formattedData);

  // Calculate max X value for ticks
  const maxValue = d3.max(series, (s) => d3.max(s, (d) => d[1]))!;
  const xTicks = d3.scaleLinear().domain([0, maxValue]).nice().ticks(5);

  // Calculate max label width for margin calculation
  const maxLabelWidth = Math.max(
    ...xTicks.map((tick) => ctx.measureText(formatAxisNumber(tick)).width)
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
    isHorizontalChart: true,
    itemCount: subcategories.length,
  });

  // X scale with axis options
  let xMin = 0;
  let xMax = d3.max(series, (s) => d3.max(s, (d) => d[1]))!;
  let xAxisMajorIncrement = axisScaleOptions?.x?.majorIncrement
    ? Number(axisScaleOptions.x.majorIncrement)
    : undefined;

  if (axisScaleOptions?.x) {
    if (axisScaleOptions.x.min !== undefined && axisScaleOptions.x.min !== "")
      xMin = Number(axisScaleOptions.x.min);
    if (axisScaleOptions.x.max !== undefined && axisScaleOptions.x.max !== "")
      xMax = Number(axisScaleOptions.x.max);
  }

  // Skala untuk sumbu X
  const x = d3
    .scaleLinear()
    .domain([xMin, xMax])
    .nice()
    .range([margin.left, width - margin.right]);

  // Adjust Y scale to leave more space for title/subtitle at top
  const y = d3
    .scaleBand()
    .domain(categories)
    .range([margin.top, height - margin.bottom])
    .padding(0.1);

  // Color scale
  const color = d3
    .scaleOrdinal<string>()
    .domain(subcategories)
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

  // Draw bars
  svg
    .append("g")
    .selectAll("g")
    .data(series)
    .join("g")
    .attr("fill", (d) => color(d.key))
    .selectAll("rect")
    .data((d) => d.map((item) => ({ ...item, key: d.key })))
    .join("rect")
    .attr("y", (d) => y(d.data.category)!)
    .attr("x", (d) => x(Math.min(Math.max(d[0], 0), maxValue)))
    .attr("height", y.bandwidth())
    .attr("width", (d) => {
      const x0 = Math.min(Math.max(d[0], 0), maxValue);
      const x1 = Math.min(Math.max(d[1], 0), maxValue);
      return Math.max(0, x(x1) - x(x0));
    })
    .append("title")
    .text((d) => `${d.data.category}, ${d.key}: ${d[1] - d[0]}`);

  // Add axes if needed
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
      xMin: 0,
      xMax: maxValue,
      chartType: "horizontal",
      xAxisOptions: {
        tickValues: xAxisMajorIncrement
          ? generateAxisTicks(0, maxValue, xAxisMajorIncrement)
          : undefined,
        customFormat: formatAxisNumber,
        showGridLines: false,
        maxValueLength: 6,
      },
      yAxisOptions: {
        showGridLines: true,
        maxValueLength: 6,
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

/**
 * Fungsi Clustered Bar Chart
 *
 * @param data - Array dari objek ChartData
 * @param width - Lebar SVG
 * @param height - Tinggi SVG
 * @param useAxis - Boolean untuk menentukan apakah sumbu akan ditampilkan
 * @returns SVGElement atau null jika data tidak valid
 */

export const createClusteredBarChart = (
  data: ChartData[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: ChartTitleOptions,
  axisLabels?: { x?: string; y?: string },
  axisScaleOptions?: {
    y?: {
      min?: string;
      max?: string;
      majorIncrement?: string;
    };
  },
  chartColors?: string[]
): SVGElement | null => {
  // Validasi data
  const validData = data.filter(
    (d) =>
      typeof d.category === "string" &&
      typeof d.subcategory === "string" &&
      typeof d.value === "number" &&
      d.value >= 0
  );

  if (validData.length === 0) {
    console.error("No valid data available for the grouped bar chart");
    return null;
  }

  // Create a canvas context for measuring text
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";

  // Kategori utama dan subkategori
  const categories = Array.from(new Set(validData.map((d) => d.category)));
  const subcategories = Array.from(
    new Set(validData.map((d) => d.subcategory))
  );

  // Format data untuk grouped bar
  const formattedData: FormattedData[] = categories.map((category) => {
    const entry: FormattedData = { category };
    validData
      .filter((d) => d.category === category)
      .forEach((d) => {
        entry[d.subcategory] = d.value;
      });
    return entry;
  });

  // Calculate max Y value for ticks
  const maxValue = d3.max(validData, (d) => d.value)!;
  const yTicks = d3.scaleLinear().domain([0, maxValue]).nice().ticks(5);

  // Calculate max label width for margin calculation
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
    hasLegend: true,
    legendPosition: "right",
    itemCount: subcategories.length,
  });

  // Skala untuk sumbu X
  const x0 = d3
    .scaleBand()
    .domain(categories)
    .range([margin.left, width - margin.right])
    .paddingInner(0.1);

  const x1 = d3
    .scaleBand()
    .domain(subcategories)
    .range([0, x0.bandwidth()])
    .padding(0.05);

  // Y scale with axis options
  let yMin = 0;
  let yMax = maxValue;
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

  // Color scale
  const color = d3
    .scaleOrdinal<string>()
    .domain(subcategories)
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

  // Draw bars
  const barGroups = svg
    .append("g")
    .selectAll("g")
    .data(formattedData)
    .join("g")
    .attr("transform", (d) => `translate(${x0(d.category)},0)`);

  barGroups
    .selectAll("rect")
    .data((d) => subcategories.map((key) => ({ key, value: d[key] as number })))
    .join("rect")
    .attr("x", (d) => x1(d.key)!)
    .attr("y", (d) => y(Math.min(d.value, yMax)))
    .attr("height", (d) => y(yMin) - y(Math.min(d.value, yMax)))
    .attr("width", x1.bandwidth())
    .attr("fill", (d) => color(d.key))
    .append("title")
    .text((d) => `${d.key}: ${d.value}`);

  // Add axes if needed
  if (useAxis) {
    addStandardAxes(svg, {
      xScale: x0,
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
        maxValueLength: 6,
      },
      yAxisOptions: {
        tickValues: yAxisMajorIncrement
          ? generateAxisTicks(yMin, yMax, yAxisMajorIncrement)
          : undefined,
        customFormat: formatAxisNumber,
        showGridLines: false,
        maxValueLength: 6,
      },
    });

    // Add legend using standard function
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
      domain: subcategories,
      itemWidth: 15,
      itemHeight: 15,
      fontSize: 12,
      legendPosition: "right",
    });
  }

  return svg.node();
};

export const createErrorBarChart = (
  data: { category: string; value: number; error: number }[],
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
  // Validate data
  const validData = data.filter(
    (d) =>
      typeof d.category === "string" &&
      typeof d.value === "number" &&
      typeof d.error === "number" &&
      !isNaN(d.value) &&
      !isNaN(d.error)
  );

  if (validData.length === 0) {
    console.error("No valid data available for the error bar chart");
    return null;
  }

  // Filter data according to axis min/max
  const filteredData = filterDataByAxisRange(
    validData,
    {
      x: { min: axisScaleOptions?.x?.min, max: axisScaleOptions?.x?.max },
      y: { min: axisScaleOptions?.y?.min, max: axisScaleOptions?.y?.max },
    },
    { x: "category", y: "value" }
  );

  // Handle duplicate categories by creating unique identifiers
  const processedData = filteredData.map((d, index) => ({
    ...d,
    originalCategory: d.category,
    uniqueId: `${d.category}_${index}`,
    displayLabel: d.category,
  }));

  // Create a canvas context for measuring text
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";

  // Calculate max Y value for ticks and margin calculations
  const maxValue = d3.max(processedData, (d) => d.value + d.error)!;
  const yTicks = d3.scaleLinear().domain([0, maxValue]).nice().ticks(5);

  // Calculate max label widths for margin calculation
  const maxXLabelWidth = Math.max(
    ...processedData.map((d) => ctx.measureText(d.displayLabel).width)
  );
  const maxYLabelWidth = Math.max(
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
    maxLabelWidth: Math.max(maxYLabelWidth, maxXLabelWidth),
    categories: processedData.map((d) => d.displayLabel),
    hasLegend: false,
  });

  // Y scale with axis options
  let yMin = 0;
  let yMax = maxValue;
  let majorIncrement = axisScaleOptions?.y?.majorIncrement
    ? Number(axisScaleOptions.y.majorIncrement)
    : undefined;

  if (axisScaleOptions?.y) {
    if (axisScaleOptions.y.min !== undefined && axisScaleOptions.y.min !== "")
      yMin = Number(axisScaleOptions.y.min);
    if (axisScaleOptions.y.max !== undefined && axisScaleOptions.y.max !== "")
      yMax = Number(axisScaleOptions.y.max);
  }

  // Create scales
  const x = d3
    .scaleBand()
    .domain(processedData.map((d) => d.uniqueId))
    .range([margin.left, width - margin.right])
    .padding(0.1);

  const y = d3
    .scaleLinear()
    .domain([yMin, yMax])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Create SVG using standardized function
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

  // Set default colors
  const colors = chartColors || defaultChartColors;

  // Add error bars
  svg
    .append("g")
    .attr("stroke", "hsl(var(--foreground))")
    .attr("stroke-width", 2)
    .selectAll("line")
    .data(processedData)
    .join("line")
    .attr("x1", (d) => x(d.uniqueId)! + x.bandwidth() / 2)
    .attr("x2", (d) => x(d.uniqueId)! + x.bandwidth() / 2)
    .attr("y1", (d) => y(Math.min(Math.max(d.value + d.error, yMin), yMax)))
    .attr("y2", (d) => y(Math.min(Math.max(d.value - d.error, yMin), yMax)));

  // Add error bar caps (top)
  svg
    .append("g")
    .attr("stroke", "hsl(var(--foreground))")
    .attr("stroke-width", 2)
    .selectAll(".error-cap-top")
    .data(processedData)
    .join("line")
    .attr("x1", (d) => x(d.uniqueId)! + x.bandwidth() / 2 - 5)
    .attr("x2", (d) => x(d.uniqueId)! + x.bandwidth() / 2 + 5)
    .attr("y1", (d) => y(Math.min(Math.max(d.value + d.error, yMin), yMax)))
    .attr("y2", (d) => y(Math.min(Math.max(d.value + d.error, yMin), yMax)));

  // Add error bar caps (bottom)
  svg
    .append("g")
    .attr("stroke", "hsl(var(--foreground))")
    .attr("stroke-width", 2)
    .selectAll(".error-cap-bottom")
    .data(processedData)
    .join("line")
    .attr("x1", (d) => x(d.uniqueId)! + x.bandwidth() / 2 - 5)
    .attr("x2", (d) => x(d.uniqueId)! + x.bandwidth() / 2 + 5)
    .attr("y1", (d) => y(Math.min(Math.max(d.value - d.error, yMin), yMax)))
    .attr("y2", (d) => y(Math.min(Math.max(d.value - d.error, yMin), yMax)));

  // Add data points
  svg
    .append("g")
    .selectAll("circle")
    .data(processedData)
    .join("circle")
    .attr("cx", (d) => x(d.uniqueId)! + x.bandwidth() / 2)
    .attr("cy", (d) => y(Math.min(Math.max(d.value, yMin), yMax)))
    .attr("r", 5)
    .attr("fill", (d, i) => colors[i % colors.length])
    .append("title")
    .text((d) => `${d.displayLabel}: ${d.value} ± ${d.error}`);

  // Add axes if needed
  if (useAxis) {
    const categories = processedData.map((d) => d.displayLabel);

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
      majorIncrement,
      yMin,
      yMax,
      chartType: "vertical",
      data: processedData,
      xAxisOptions: {
        maxValueLength: 8,
        tickFormat: (d: any) => {
          const dataPoint = processedData.find((item) => item.uniqueId === d);
          const displayLabel = dataPoint ? dataPoint.displayLabel : d;
          return truncateText(displayLabel, 8);
        },
        showGridLines: false,
      },
      yAxisOptions: {
        customFormat: formatAxisNumber,
        showGridLines: true,
        maxValueLength: 6,
        tickValues: majorIncrement
          ? generateAxisTicks(yMin, yMax, majorIncrement)
          : undefined,
      },
    });
  }

  return svg.node();
};

export const createClusteredErrorBarChart = (
  data: {
    category: string;
    subcategory: string;
    value: number;
    error: number;
  }[],
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
  // Validate data
  const validData = data.filter(
    (d) =>
      typeof d.category === "string" &&
      typeof d.subcategory === "string" &&
      typeof d.value === "number" &&
      typeof d.error === "number" &&
      !isNaN(d.value) &&
      !isNaN(d.error)
  );

  if (validData.length === 0) {
    console.error("No valid data available for the clustered error bar chart");
    return null;
  }

  // Create a canvas context for measuring text
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";

  // Extract categories and subcategories
  const categories = Array.from(new Set(validData.map((d) => d.category)));
  const subcategories = Array.from(
    new Set(validData.map((d) => d.subcategory))
  );

  // Calculate max Y value for ticks and margin calculations
  const maxValue = d3.max(validData, (d) => d.value + d.error)!;
  const yTicks = d3.scaleLinear().domain([0, maxValue]).nice().ticks(5);

  // Calculate max label widths for margin calculation
  const maxYLabelWidth = Math.max(
    ...yTicks.map((tick) => ctx.measureText(formatAxisNumber(tick)).width)
  );
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
    maxLabelWidth: Math.max(maxYLabelWidth, maxLegendWidth),
    categories,
    hasLegend: true,
    legendPosition: "right",
  });

  // Y scale with axis options
  let yMin = 0;
  let yMax = maxValue;
  let majorIncrement = axisScaleOptions?.y?.majorIncrement
    ? Number(axisScaleOptions.y.majorIncrement)
    : undefined;

  if (axisScaleOptions?.y) {
    if (axisScaleOptions.y.min !== undefined && axisScaleOptions.y.min !== "")
      yMin = Number(axisScaleOptions.y.min);
    if (axisScaleOptions.y.max !== undefined && axisScaleOptions.y.max !== "")
      yMax = Number(axisScaleOptions.y.max);
  }

  // Create scales
  const x = d3
    .scaleBand()
    .domain(categories)
    .range([margin.left, width - margin.right])
    .padding(0.1);

  const y = d3
    .scaleLinear()
    .domain([yMin, yMax])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Color scale with default colors
  const colorScale = d3
    .scaleOrdinal<string>()
    .domain(subcategories)
    .range(chartColors || defaultChartColors);

  // Create SVG using standardized function
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

  // Helper function to clamp values within Y range
  const clampY = (val: number) => Math.max(yMin, Math.min(yMax, val));

  // Add error bars
  svg
    .append("g")
    .attr("stroke-width", 2)
    .selectAll("line")
    .data(validData)
    .join("line")
    .attr("x1", (d) => x(d.category)! + x.bandwidth() / 2)
    .attr("x2", (d) => x(d.category)! + x.bandwidth() / 2)
    .attr("y1", (d) => y(clampY(d.value + d.error)))
    .attr("y2", (d) => y(clampY(d.value - d.error)))
    .attr("stroke", (d) => colorScale(d.subcategory));

  // Add error bar caps (top)
  svg
    .append("g")
    .attr("stroke-width", 2)
    .selectAll(".error-cap-top")
    .data(validData)
    .join("line")
    .attr("x1", (d) => x(d.category)! + x.bandwidth() / 2 - 5)
    .attr("x2", (d) => x(d.category)! + x.bandwidth() / 2 + 5)
    .attr("y1", (d) => y(clampY(d.value + d.error)))
    .attr("y2", (d) => y(clampY(d.value + d.error)))
    .attr("stroke", (d) => colorScale(d.subcategory));

  // Add error bar caps (bottom)
  svg
    .append("g")
    .attr("stroke-width", 2)
    .selectAll(".error-cap-bottom")
    .data(validData)
    .join("line")
    .attr("x1", (d) => x(d.category)! + x.bandwidth() / 2 - 5)
    .attr("x2", (d) => x(d.category)! + x.bandwidth() / 2 + 5)
    .attr("y1", (d) => y(clampY(d.value - d.error)))
    .attr("y2", (d) => y(clampY(d.value - d.error)))
    .attr("stroke", (d) => colorScale(d.subcategory));

  // Add data points (only if within range)
  svg
    .append("g")
    .selectAll("circle")
    .data(validData.filter((d) => d.value >= yMin && d.value <= yMax))
    .join("circle")
    .attr("cx", (d) => x(d.category)! + x.bandwidth() / 2)
    .attr("cy", (d) => y(d.value))
    .attr("r", 5)
    .attr("fill", (d) => colorScale(d.subcategory))
    .append("title")
    .text((d) => `${d.category}, ${d.subcategory}: ${d.value} ± ${d.error}`);

  // Add axes if needed
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
      majorIncrement,
      yMin,
      yMax,
      chartType: "vertical",
      xAxisOptions: {
        showGridLines: false,
      },
      yAxisOptions: {
        customFormat: formatAxisNumber,
        showGridLines: true,
        tickValues: majorIncrement
          ? generateAxisTicks(yMin, yMax, majorIncrement)
          : undefined,
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
      colorScale,
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

type ChartData2 = {
  category: string;
  bars: { [seriesName: string]: number };
  lines: { [seriesName: string]: number };
};

export const createBarAndLineChart2 = (
  data: ChartData2[],
  width: number,
  height: number,
  useAxis: boolean = true,
  barMode: "grouped" | "stacked" = "grouped",
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
  // Filter and validate data
  const filteredData = data.filter(
    (d) =>
      d.bars != null &&
      d.lines != null &&
      d.category != " " &&
      Object.values(d.bars).every((v) => v != null && !isNaN(v)) &&
      Object.values(d.lines).every((v) => v != null && !isNaN(v))
  );

  if (filteredData.length === 0) {
    console.error("No valid data available for the bar and line chart");
    return null;
  }

  // Create a canvas context for measuring text
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";

  // Extract keys for bars and lines
  const barKeys = Object.keys(filteredData[0]?.bars || {});
  const lineKeys = Object.keys(filteredData[0]?.lines || {});
  const allKeys = [...barKeys, ...lineKeys];
  const categories = filteredData.map((d) => d.category);

  // Calculate value ranges
  const allBarValues = filteredData.flatMap((d) => Object.values(d.bars));
  const allLineValues = filteredData.flatMap((d) => Object.values(d.lines));

  let stackedBarSums: number[] = [];
  if (barMode === "stacked") {
    stackedBarSums = filteredData.map((d) => d3.sum(Object.values(d.bars)));
  }

  const allValues =
    barMode === "stacked"
      ? [...stackedBarSums, ...allLineValues]
      : [...allBarValues, ...allLineValues];

  // Calculate max Y value for ticks and margin calculations
  const maxValue = d3.max(allValues) ?? 0;
  const minValue = d3.min(allValues) ?? 0;
  const yTicks = d3.scaleLinear().domain([minValue, maxValue]).nice().ticks(5);

  // Calculate max label widths for margin calculation
  const maxYLabelWidth = Math.max(
    ...yTicks.map((tick) => ctx.measureText(formatAxisNumber(tick)).width)
  );

  // Calculate max legend text width
  const maxLegendWidth = Math.max(
    ...allKeys.map((key) => ctx.measureText(key).width)
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
    maxLabelWidth: Math.max(maxYLabelWidth, maxLegendWidth),
    categories,
    hasLegend: true,
    legendPosition: "right",
  });

  // Y scale with axis scale options
  let yMin = Math.min(0, minValue);
  let yMax = maxValue;
  let yAxisMajorIncrement = axisScaleOptions?.y?.majorIncrement
    ? Number(axisScaleOptions.y.majorIncrement)
    : undefined;

  if (axisScaleOptions?.y) {
    if (axisScaleOptions.y.min !== undefined && axisScaleOptions.y.min !== "")
      yMin = Number(axisScaleOptions.y.min);
    if (axisScaleOptions.y.max !== undefined && axisScaleOptions.y.max !== "")
      yMax = Number(axisScaleOptions.y.max);
  }

  // Create scales
  const x = d3
    .scaleBand()
    .domain(categories)
    .range([margin.left, width - margin.right])
    .padding(0.1);

  const y = d3
    .scaleLinear()
    .domain([yMin, yMax])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Y2 scale for lines (independent domain)
  const y2 = d3
    .scaleLinear()
    .domain([yMin, yMax])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Create color scales with default fallback
  const colorBar = d3
    .scaleOrdinal<string>()
    .domain(barKeys)
    .range(chartColors || defaultChartColors);

  const colorLine = d3
    .scaleOrdinal<string>()
    .domain(lineKeys)
    .range(
      chartColors && chartColors.length > barKeys.length
        ? chartColors.slice(barKeys.length)
        : defaultChartColors.slice(barKeys.length)
    );

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

  // Draw bars
  if (barMode === "grouped") {
    const x1 = d3
      .scaleBand()
      .domain(barKeys)
      .range([0, x.bandwidth()])
      .padding(0.05);

    svg
      .append("g")
      .selectAll("g")
      .data(filteredData)
      .join("g")
      .attr("transform", (d) => `translate(${x(d.category)},0)`)
      .selectAll("rect")
      .data((d) => barKeys.map((key) => ({ key, value: d.bars[key] })))
      .join("rect")
      .attr("x", (d) => x1(d.key)!)
      .attr("y", (d) => y(Math.max(0, d.value)))
      .attr("width", x1.bandwidth())
      .attr("height", (d) => Math.abs(y(d.value) - y(0)))
      .attr("fill", (d) => colorBar(d.key)!);
  } else {
    const stack = d3
      .stack<ChartData2>()
      .keys(barKeys)
      .value((d, key) => d.bars[key]);

    const series = stack(filteredData);

    svg
      .append("g")
      .selectAll("g")
      .data(series)
      .join("g")
      .attr("fill", (d) => colorBar(d.key)!)
      .selectAll("rect")
      .data((d) => d.map((item) => ({ ...item, key: d.key })))
      .join("rect")
      .attr("x", (d) => x(d.data.category)!)
      .attr("y", (d) => y(Math.max(d[0], d[1])))
      .attr("height", (d) => Math.abs(y(d[0]) - y(d[1])))
      .attr("width", x.bandwidth());
  }

  // Draw lines
  lineKeys.forEach((key) => {
    const line = d3
      .line<ChartData2>()
      .x((d) => x(d.category)! + x.bandwidth() / 2)
      .y((d) => y2(d.lines[key]));

    // Add line path
    svg
      .append("path")
      .datum(filteredData)
      .attr("fill", "none")
      .attr("stroke", colorLine(key)!)
      .attr("stroke-width", 1.5)
      .attr("d", line);

    // Add line points
    svg
      .selectAll(`.dot-${key}`)
      .data(filteredData)
      .join("circle")
      .attr("class", `dot-${key}`)
      .attr("cx", (d) => x(d.category)! + x.bandwidth() / 2)
      .attr("cy", (d) => y2(d.lines[key]))
      .attr("r", 4)
      .attr("fill", colorLine(key)!);
  });

  // Add axes if needed
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
        maxValueLength: 10,
        showGridLines: true,
      },
      yAxisOptions: {
        tickValues: yAxisMajorIncrement
          ? generateAxisTicks(yMin, yMax, yAxisMajorIncrement)
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
      itemCount: allKeys.length,
    });

    // Create combined color scale for legend
    const combinedColorScale = d3
      .scaleOrdinal<string>()
      .domain(allKeys)
      .range([
        ...barKeys.map((key) => colorBar(key)!),
        ...lineKeys.map((key) => colorLine(key)!),
      ]);

    addLegend({
      svg,
      colorScale: combinedColorScale,
      position: legendPosition,
      legendPosition: "right",
      domain: allKeys,
      itemWidth: 15,
      itemHeight: 15,
      fontSize: 12,
    });
  }

  return svg.node();
};

export const createStemAndLeafPlot = (
  data: Array<{ stem: string; leaves: number[] }>,
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
  // Calculate max label widths for margin calculation
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";
  const maxYLabelWidth = Math.max(
    ...data.map((d) => ctx.measureText(d.stem).width)
  );

  // Calculate responsive margins
  const margin = calculateResponsiveMargin({
    width,
    height,
    useAxis,
    titleOptions,
    axisLabels,
    maxLabelWidth: maxYLabelWidth,
    categories: [],
    hasLegend: false,
  });

  // Calculate dimensions
  const bodyFontSize = useAxis
    ? Math.max(12, Math.min(18, width / 30))
    : Math.max(10, Math.min(14, width / 35));
  const keyFontSize = useAxis ? Math.max(10, Math.min(16, width / 35)) : 0;
  const lineHeight = bodyFontSize + (useAxis ? 12 : 8);

  // Create SVG with standard settings
  const svg = createStandardSVG({
    width,
    height,
    marginTop: margin.top,
    marginRight: margin.right,
    marginBottom: margin.bottom,
    marginLeft: margin.left,
  });

  // Add title if provided with margin-aware positioning
  if (titleOptions) {
    addChartTitle(svg, {
      ...titleOptions,
      marginTop: margin.top,
      useResponsivePositioning: true,
    });
  }

  // Sort stems numerically
  const sortedData = data
    .slice()
    .sort((a, b) => Number(a.stem) - Number(b.stem));

  const rowGroup = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Use default colors if not provided
  const stemColor = chartColors?.[0] ?? defaultChartColors[0];
  const leafBackgroundColor = chartColors?.[1] ?? defaultChartColors[1];

  // Draw rows
  sortedData.forEach((row, i) => {
    const leaves = row.leaves.slice().sort((a, b) => a - b);
    const leafText = leaves.map((v) => v.toString()).join(" ");

    const group = rowGroup
      .append("g")
      .attr("transform", `translate(0, ${i * lineHeight})`);

    // Stem column
    group
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 50)
      .attr("height", lineHeight - 4)
      .attr("fill", stemColor)
      .attr("rx", 4)
      .attr("stroke", "hsl(var(--border))")
      .attr("stroke-width", 1);

    group
      .append("text")
      .attr("x", 25)
      .attr("y", (lineHeight - 4) / 2)
      .attr("fill", "hsl(var(--primary-foreground))")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .style("font-size", `${bodyFontSize}px`)
      .style("font-weight", "bold")
      .text(row.stem);

    // Leaf area
    group
      .append("rect")
      .attr("x", 60)
      .attr("y", 0)
      .attr("width", width - margin.left - margin.right - 60)
      .attr("height", lineHeight - 4)
      .attr("fill", leafBackgroundColor)
      .attr("rx", 4)
      .attr("stroke", "hsl(var(--border))")
      .attr("stroke-width", 1);

    group
      .append("text")
      .attr("x", 70)
      .attr("y", (lineHeight - 4) / 2)
      .attr("dominant-baseline", "middle")
      .style("font-size", `${bodyFontSize}px`)
      .style("fill", "hsl(var(--foreground))")
      .text(leafText);
  });

  // Add key text if needed
  if (useAxis && sortedData.length > 0 && sortedData[0].leaves.length > 0) {
    const firstStem = sortedData[0].stem;
    const firstLeaf = sortedData[0].leaves[0];
    const defaultKeyText = `Key: ${firstStem} | ${firstLeaf} = ${firstStem}${firstLeaf}`;

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", margin.top + sortedData.length * lineHeight + 25)
      .attr("text-anchor", "middle")
      .style("font-size", `${keyFontSize}px`)
      .style("font-style", "italic")
      .style("fill", "hsl(var(--muted-foreground))")
      .text(defaultKeyText);
  }

  return svg.node();
};

export const createViolinPlot = (
  data: { category: string; value: number }[],
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
  const categories = Array.from(new Set(data.map((d) => d.category)));

  // Calculate max label widths for margin calculation
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";
  const maxXLabelWidth =
    d3.max(categories, (d) => ctx.measureText(d).width) ?? 0;
  const yTicks = d3
    .scaleLinear()
    .domain([
      d3.min(data, (d) => d.value) ?? 0,
      d3.max(data, (d) => d.value) ?? 0,
    ])
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
    categories,
    hasLegend: false,
  });

  const {
    top: marginTop,
    bottom: marginBottom,
    left: marginLeft,
    right: marginRight,
  } = margin;

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

  // Y scale with axis scale options
  let yMin = d3.min(data, (d) => d.value) ?? 0;
  let yMax = d3.max(data, (d) => d.value) ?? 0;
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
    .domain(categories)
    .range([marginLeft, width - marginRight])
    .padding(0.05);

  const y = d3
    .scaleLinear()
    .domain([yMin, yMax])
    .nice()
    .range([height - marginBottom, marginTop]);

  const histogram = d3
    .histogram()
    .domain(y.domain() as [number, number])
    .thresholds(y.ticks(20));

  const sumstat = categories.map((category) => {
    const values = data
      .filter((d) => d.category === category)
      .map((d) => d.value);
    const bins = histogram(values);
    return { category, bins };
  });

  const maxNum =
    d3.max(sumstat.flatMap((s) => s.bins.map((b) => b.length))) ?? 0;

  const xNum = d3
    .scaleLinear()
    .range([0, x.bandwidth()])
    .domain([-maxNum, maxNum]);

  // Use default colors if no custom colors provided
  const colorScale = d3
    .scaleOrdinal<string>()
    .domain(categories)
    .range(
      chartColors && chartColors.length > 0 ? chartColors : defaultChartColors
    );

  // Add violin shapes
  svg
    .selectAll("myViolin")
    .data(sumstat)
    .enter()
    .append("g")
    .attr("transform", (d) => `translate(${x(d.category)},0)`)
    .each(function (d) {
      d3.select(this)
        .append("path")
        .datum(d.bins)
        .style("fill", colorScale(d.category))
        .style("stroke", "hsl(var(--border))")
        .style("stroke-width", 1)
        .style("opacity", 0.8)
        .attr(
          "d",
          d3
            .area<d3.Bin<number, number>>()
            .x0((d) => xNum(-d.length))
            .x1((d) => xNum(d.length))
            .y((d) => y(d.x0 ?? 0))
            .curve(d3.curveCatmullRom)
        );
    });

  if (useAxis) {
    // Add standard axes with automatic formatting
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

  return svg.node();
};

export const createDensityChart = (
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
) => {
  // Filter data yang valid (bukan NaN)
  const filteredData = data.filter((d) => !isNaN(d));

  // Calculate max label widths for margin calculation
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";
  const yTicks = d3
    .scaleLinear()
    .domain([d3.min(filteredData) ?? 0, d3.max(filteredData) ?? 0])
    .ticks(5);
  const maxYLabelWidth =
    d3.max(yTicks.map((tick) => ctx.measureText(tick.toFixed(3)).width)) ?? 0;

  // Calculate responsive margins based on title and axis labels
  const margin = calculateResponsiveMargin({
    width,
    height,
    useAxis,
    titleOptions,
    axisLabels,
    maxLabelWidth: maxYLabelWidth,
    categories: [],
    hasLegend: false,
  });

  // Create SVG with standard settings
  const svg = createStandardSVG({
    width,
    height,
    marginTop: margin.top,
    marginRight: margin.right,
    marginBottom: margin.bottom,
    marginLeft: margin.left,
  });

  // Add title if provided with margin-aware positioning
  if (titleOptions) {
    addChartTitle(svg, {
      ...titleOptions,
      marginTop: margin.top,
      useResponsivePositioning: true,
    });
  }

  // X scale (value range) with axis scale options and padding
  let xMin = d3.min(filteredData) ?? 0;
  let xMax = d3.max(filteredData) ?? 0;

  // Add padding to domain
  const xRange = xMax - xMin;
  xMin = xMin - xRange * 0.05;
  xMax = xMax + xRange * 0.05;

  let xMajorIncrement = axisScaleOptions?.x?.majorIncrement
    ? Number(axisScaleOptions.x.majorIncrement)
    : undefined;

  if (axisScaleOptions?.x) {
    if (axisScaleOptions.x.min !== undefined && axisScaleOptions.x.min !== "")
      xMin = Number(axisScaleOptions.x.min);
    if (axisScaleOptions.x.max !== undefined && axisScaleOptions.x.max !== "")
      xMax = Number(axisScaleOptions.x.max);
  }

  const x = d3
    .scaleLinear()
    .domain([xMin, xMax])
    .nice()
    .range([margin.left, width - margin.right]);

  // Calculate optimal bandwidth based on Silverman's rule of thumb
  const n = filteredData.length;
  const sigma = d3.deviation(filteredData) ?? 1;
  const bandwidth =
    0.9 *
    Math.min(
      sigma,
      (d3.quantile(filteredData, 0.75) ?? 0) -
        (d3.quantile(filteredData, 0.25) ?? 0) / 1.34
    ) *
    Math.pow(n, -0.2);

  // Kernel Density Estimation with optimal bandwidth
  const kde = kernelDensityEstimator(
    kernelEpanechnikov(bandwidth),
    x.ticks(50)
  );
  const density = kde(filteredData);

  // Y scale (density value) with axis scale options and padding
  let yMin = 0;
  let yMax = d3.max(density, (d) => d[1]) ?? 0;

  // Add padding to y domain
  yMax = yMax * 1.05;

  let yMajorIncrement = axisScaleOptions?.y?.majorIncrement
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

  // Create area generator
  const area = d3
    .area<[number, number]>()
    .curve(d3.curveBasis)
    .x((d) => x(d[0]))
    .y0(height - margin.bottom)
    .y1((d) => y(d[1]));

  // Use default chart colors
  const fillColor = chartColors?.[0] ?? defaultChartColors[0];

  // Add density area
  svg
    .append("path")
    .datum(density as [number, number][])
    .attr("fill", fillColor)
    .attr("opacity", 0.8)
    .attr("stroke", "hsl(var(--border))")
    .attr("stroke-width", 1)
    .attr("stroke-linejoin", "round")
    .attr("d", area(density as [number, number][])!);

  // Add standard axes if needed
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
      categories: [],
      axisLabels,
      majorIncrement: xMajorIncrement,
      yMin,
      yMax,
      xMin,
      xMax,
      chartType: "vertical",
      xAxisOptions: {
        customFormat: (d: any) => d3.format(".1f")(d),
        showGridLines: true,
      },
      yAxisOptions: {
        customFormat: (d: any) => d3.format(".4f")(d),
        showGridLines: false,
      },
    });
  }

  return svg.node();
};

// Kernel density estimator
function kernelDensityEstimator(kernel: (v: number) => number, X: number[]) {
  return function (V: number[]) {
    return X.map((x) => [x, d3.mean(V, (v) => kernel(x - v)) ?? 0]);
  };
}

// Epanechnikov kernel
function kernelEpanechnikov(k: number) {
  return function (v: number) {
    return Math.abs((v /= k)) <= 1 ? (0.75 * (1 - v * v)) / k : 0;
  };
}
