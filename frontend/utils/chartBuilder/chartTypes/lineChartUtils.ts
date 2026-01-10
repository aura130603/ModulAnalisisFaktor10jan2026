import * as d3 from "d3";
import {
  ChartTitleOptions,
  addChartTitle,
  generateAxisTicks,
  addStandardAxes,
  formatAxisNumber,
  truncateText,
} from "./chartUtils";
import {
  getMajorTicks,
  createStandardSVG,
  addAxisLabels,
  calculateLegendPosition,
  addLegend,
} from "../chartUtils";
import { filterDataByAxisRange } from "../dataFilter";
import { calculateResponsiveMargin } from "../responsiveMarginUtils";
import { defaultChartColors } from "../defaultStyles/defaultColors";

interface ChartData {
  category: string;
  subcategory: string;
  value: number;
}

export const createLineChart = (
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
  console.log("Creating chart with data:", data);

  // Filter data sesuai axis min/max
  const filteredData = filterDataByAxisRange(
    data,
    { y: { min: axisScaleOptions?.y?.min, max: axisScaleOptions?.y?.max } },
    { x: "category", y: "value" }
  );

  // Tambahkan uniqueId ke setiap data point
  const processedData = filteredData.map((d, i) => ({
    ...d,
    uniqueId: `${d.category}_${i}`,
    displayLabel: d.category,
  }));

  // Mengukur panjang label secara dinamis
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif"; // Pastikan font ini sesuai dengan font axis

  // Menghitung panjang label X secara dinamis
  const maxXLabelWidth =
    d3.max(processedData, (d) => ctx.measureText(d.displayLabel).width) ?? 0;
  const yTicks = d3
    .scaleLinear()
    .domain([0, d3.max(processedData, (d) => d.value)!])
    .ticks(5);
  const maxYLabelWidth =
    d3.max(yTicks.map((tick) => ctx.measureText(tick.toFixed(0)).width)) ?? 0;

  // Menentukan apakah rotasi diperlukan
  const needRotateX = maxXLabelWidth > width / processedData.length;

  // Use responsive margin utility for line chart
  const margin = calculateResponsiveMargin({
    width,
    height,
    useAxis,
    titleOptions,
    axisLabels,
    maxLabelWidth: Math.max(maxYLabelWidth, maxXLabelWidth),
  });

  // Adjust bottom margin for rotated X labels if needed
  let marginBottom = margin.bottom;
  if (needRotateX && useAxis) {
    const rotatedLabelSpace = maxXLabelWidth * 0.8 + 20;
    marginBottom = Math.max(marginBottom, rotatedLabelSpace);
  }

  const { top: marginTop, left: marginLeft, right: marginRight } = margin;

  // Skala X dan Y
  // X pakai uniqueId
  const x = d3
    .scaleBand()
    .domain(processedData.map((d) => d.uniqueId))
    .range([marginLeft, width - marginRight])
    .padding(0.1);

  // Y axis min/max/majorIncrement
  let yMin = d3.min(processedData, (d) => d.value) ?? 0;
  let yMax = d3.max(processedData, (d) => d.value) ?? 1;
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
    .range([height - marginBottom, marginTop]);

  // Membuat elemen SVG
  const svg = createStandardSVG({
    width,
    height,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
  });

  // Tambahkan judul dan subtitle jika ada dengan margin-aware positioning
  if (titleOptions) {
    addChartTitle(svg, {
      ...titleOptions,
      marginTop,
      useResponsivePositioning: true,
    });
  }

  // Mendeklarasikan generator garis
  const line = d3
    .line<{ uniqueId: string; value: number }>()
    .x((d, i) => x(d.uniqueId)! + x.bandwidth() / 2)
    .y((d) => y(d.value)!)
    .curve(d3.curveLinear);

  // Menambahkan path untuk garis
  svg
    .append("path")
    .attr("fill", "none")
    .attr(
      "stroke",
      chartColors && chartColors.length > 0
        ? chartColors[0]
        : defaultChartColors[0]
    )
    .attr("stroke-width", 1.5)
    .attr("d", line(processedData));

  if (useAxis) {
    // Use standardized axis functions for line chart
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
      yMin,
      yMax,
      chartType: "vertical",
      data: processedData, // For display label lookup
      xAxisOptions: {
        maxValueLength: 8,
        tickFormat: (d: any) => {
          // Custom formatter for line chart categories WITH truncation
          const dataPoint = processedData.find((item) => item.uniqueId === d);
          const displayLabel = dataPoint ? dataPoint.displayLabel : d;
          return truncateText(displayLabel, 8); // Apply maxLabelLength manually
        },
      },
      yAxisOptions: {
        customFormat: formatAxisNumber,
        showGridLines: true,
        maxValueLength: 6, // Control Y-axis number label length
      },
    });
  }

  return svg.node();
};

/**
 * Membuat Multipleline Chart dengan Sumbu X Berbasis Kategori (Ordinal)
 *
 * @param data - Array dari objek ChartData
 * @param width - Lebar SVG
 * @param height - Tinggi SVG
 * @param useAxis - Boolean untuk menentukan apakah sumbu akan ditampilkan
 * @returns SVGElement atau null jika data tidak valid
 */
export const createMultipleLineChart = (
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
      d.category !== ""
  );

  if (validData.length === 0) {
    console.error("No valid data available for the multiple line chart");
    return null;
  }

  // Create a canvas context for measuring text
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";

  // Ekstrak seri dan kategori unik
  const subcategories = Array.from(
    new Set(validData.map((d) => d.subcategory))
  );
  const categories = Array.from(new Set(validData.map((d) => d.category)));

  // Calculate max label width for margin calculation
  const yTicks = d3
    .scaleLinear()
    .domain([
      d3.min(validData, (d) => d.value)!,
      d3.max(validData, (d) => d.value)!,
    ])
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
    hasLegend: true,
    legendPosition: "right",
    itemCount: subcategories.length,
  });

  // Y scale with axis options
  let yMin = d3.min(validData, (d) => d.value)!;
  let yMax = d3.max(validData, (d) => d.value)!;
  let yAxisMajorIncrement = axisScaleOptions?.y?.majorIncrement
    ? Number(axisScaleOptions.y.majorIncrement)
    : undefined;

  if (axisScaleOptions?.y) {
    if (axisScaleOptions.y.min !== undefined && axisScaleOptions.y.min !== "")
      yMin = Number(axisScaleOptions.y.min);
    if (axisScaleOptions.y.max !== undefined && axisScaleOptions.y.max !== "")
      yMax = Number(axisScaleOptions.y.max);
  }

  // Skala X dan Y - gunakan scaleBand seperti vertical bar chart
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

  // Membentuk data terstruktur per subkategori
  const dataBySubcategory: {
    [key: string]: { category: string; value: number }[];
  } = {};
  subcategories.forEach((subcategory) => {
    dataBySubcategory[subcategory] = validData.filter(
      (d) => d.subcategory === subcategory
    );
  });

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

  // Membuat garis untuk setiap subkategori
  const line = d3
    .line<{ category: string; value: number }>()
    .x((d) => x(d.category)! + x.bandwidth() / 2)
    .y((d) => y(Math.max(yMin, Math.min(yMax, d.value))));

  svg
    .append("g")
    .selectAll("path")
    .data(subcategories)
    .join("path")
    .attr("fill", "none")
    .attr("stroke", (d) => color(d))
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("d", (d) => line(dataBySubcategory[d])!);

  // Add points for each data point
  subcategories.forEach((subcategory) => {
    svg
      .append("g")
      .selectAll("circle")
      .data(
        dataBySubcategory[subcategory].filter(
          (d) => d.value >= yMin && d.value <= yMax
        )
      )
      .join("circle")
      .attr("cx", (d) => x(d.category)! + x.bandwidth() / 2)
      .attr("cy", (d) => y(d.value))
      .attr("r", 3)
      .attr("fill", color(subcategory))
      .append("title")
      .text(
        (d) => `${subcategory}\nCategory: ${d.category}\nValue: ${d.value}`
      );
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
        maxValueLength: 12,
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
      maxItemsPerRow: legendPosition.maxItemsPerRow,
      legendPosition: "right",
    });
  }

  return svg.node();
};
