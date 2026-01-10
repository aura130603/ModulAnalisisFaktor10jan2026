import * as d3 from "d3";
import {
  addChartTitle,
  ChartTitleOptions,
  generateAxisTicks,
  addStandardAxes,
  formatAxisNumber,
  truncateText,
} from "./chartUtils";
import {
  createStandardSVG,
  addAxisLabels,
  addLegend,
  calculateLegendPosition,
  SVGCreationOptions,
  LegendOptions,
  LegendPositionOptions,
} from "../chartUtils";
import { calculateResponsiveMargin } from "../responsiveMarginUtils";
import { filterDataByAxisRange } from "../dataFilter";
import { defaultChartColors } from "../defaultStyles/defaultColors";

interface ChartData {
  category: string;
  subcategory: string;
  value: number;
}

interface StackedAreaChartInput {
  category: string;
  [key: string]: number | string;
}

export const createAreaChart = (
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
  console.log("Creating area chart with data:", data);

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
  ctx.font = "10px sans-serif";

  // Calculate Y domain with nice values, always starting from 0
  const yMax = d3.max(processedData, (d) => d.value) as number;
  const yDomain = [
    // Area chart should always start from 0
    0,
    // Use user-defined max or add 5% padding to data max
    axisScaleOptions?.y?.max !== undefined && axisScaleOptions.y.max !== ""
      ? Number(axisScaleOptions.y.max)
      : Math.ceil(yMax * 1.05),
  ];

  // Calculate nice tick values
  const tickCount = Math.min(10, Math.floor(height / 50)); // Ensure reasonable number of ticks
  const yTicks = d3
    .scaleLinear()
    .domain(yDomain)
    .nice() // Make the domain values nice round numbers
    .ticks(tickCount);

  // Menghitung panjang label X dan Y secara dinamis
  const maxXLabelWidth =
    d3.max(processedData, (d) => ctx.measureText(d.displayLabel).width) ?? 0;
  const maxYLabelWidth =
    d3.max(yTicks.map((tick) => ctx.measureText(tick.toFixed(1)).width)) ?? 0;

  // Menentukan apakah rotasi diperlukan
  const needRotateX = maxXLabelWidth > width / processedData.length;

  // Use responsive margin utility
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
  // X pakai uniqueId dengan padding yang lebih besar untuk label
  const x = d3
    .scaleBand()
    .domain(processedData.map((d) => d.uniqueId))
    .range([marginLeft, width - marginRight])
    .padding(0.1);

  // Y scale with nice values
  const y = d3
    .scaleLinear()
    .domain(yDomain)
    .nice() // Make the scale use nice round numbers
    .range([height - marginBottom, marginTop]);

  // Area generator with defined y0 baseline at 0
  const area = d3
    .area<{ uniqueId: string; value: number }>()
    .x((d) => x(d.uniqueId)! + x.bandwidth() / 2)
    .y0(y(0)) // Always use 0 as baseline
    .y1((d) => y(d.value))
    .curve(d3.curveLinear); // Use linear curve for sharp angles like line chart

  // SVG using standard utility with custom viewBox
  const svg = createStandardSVG({
    width,
    height,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
  });

  // Tambahkan judul dan subtitle dengan responsive positioning
  if (titleOptions) {
    addChartTitle(svg, {
      ...titleOptions,
      marginTop,
      useResponsivePositioning: true,
    });
  }

  // Area path
  svg
    .append("path")
    .datum(processedData)
    .attr(
      "fill",
      chartColors && chartColors.length > 0
        ? chartColors[0]
        : defaultChartColors[0]
    )
    .attr("d", area);

  // Axis with standardized implementation
  if (useAxis) {
    const categories = processedData.map((d) => d.displayLabel);

    // Generate tick values based on majorIncrement or calculated tick count
    const tickValues = axisScaleOptions?.y?.majorIncrement
      ? d3.range(
          0, // Always start from 0
          yDomain[1] + Number(axisScaleOptions.y.majorIncrement),
          Number(axisScaleOptions.y.majorIncrement)
        )
      : yTicks;

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
      majorIncrement: axisScaleOptions?.y?.majorIncrement
        ? Number(axisScaleOptions.y.majorIncrement)
        : undefined,
      yMin: 0, // Always use 0 as minimum
      yMax: yDomain[1],
      chartType: "vertical",
      data: processedData,
      xAxisOptions: {
        maxValueLength: 6,
        tickFormat: (d: any) => {
          const dataPoint = processedData.find((item) => item.uniqueId === d);
          const displayLabel = dataPoint ? dataPoint.displayLabel : d;
          return truncateText(displayLabel, 8);
        },
      },
      yAxisOptions: {
        customFormat: formatAxisNumber,
        showGridLines: true,
        maxValueLength: 6,
        tickValues: tickValues,
      },
    });
  }

  return svg.node();
};

/**
 * Membuat Stacked Area Chart dengan Struktur Data Umum.
 *
 * @param data - Array dari objek ChartData
 * @param width - Lebar SVG (default: 928)
 * @param height - Tinggi SVG (default: 500)
 * @param useAxis - Boolean untuk menentukan apakah sumbu akan ditampilkan (default: true)
 * @returns SVGElement atau null jika data tidak valid
 */
export const createStackedAreaChart = (
  data: ChartData[],
  width: number = 928,
  height: number = 500,
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
    console.error("No valid data available for the stacked area chart");
    return null;
  }

  // Create a canvas context for measuring text
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";

  // Ekstrak kategori unik dan subkategori unik
  const categories = Array.from(new Set(validData.map((d) => d.category))).sort(
    d3.ascending
  );
  const subcategories = Array.from(
    new Set(validData.map((d) => d.subcategory))
  );

  // Membentuk data terstruktur per kategori
  const dataByCategory: { [key: string]: { [key: string]: number } } = {};
  validData.forEach((d) => {
    if (!dataByCategory[d.category]) {
      dataByCategory[d.category] = {};
    }
    dataByCategory[d.category][d.subcategory] = d.value;
  });

  // Membentuk data untuk d3.stack
  const stackData: StackedAreaChartInput[] = categories.map((category) => ({
    category,
    ...dataByCategory[category],
  }));

  // Type assertion untuk memastikan tipe data benar
  const typedStackData = stackData as Array<
    { category: string } & Record<string, number>
  >;

  // Membuat stack generator
  const stackedData = d3
    .stack<{ category: string } & Record<string, number>>()
    .keys(subcategories)
    .value((d, key) => d[key] || 0)(typedStackData);

  // Calculate max label width for margin calculation
  const yTicks = d3
    .scaleLinear()
    .domain([0, d3.max(stackedData, (layer) => d3.max(layer, (d) => d[1]))!])
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
    titleOptions,
    axisLabels,
    maxLabelWidth,
    categories,
    hasLegend: true,
    legendPosition: "right",
    itemCount: subcategories.length,
  });

  // Y scale with axis options
  let yMin = 0;
  let yMax = d3.max(stackedData, (layer) => d3.max(layer, (d) => d[1]))!;
  let majorIncrement = axisScaleOptions?.y?.majorIncrement
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

  // Color scale
  const color = d3
    .scaleOrdinal<string>()
    .domain(subcategories)
    .range(chartColors || defaultChartColors);

  // Area Generator
  const area = d3
    .area<d3.SeriesPoint<{ category: string } & Record<string, number>>>()
    .x((d) => x(d.data.category)! + x.bandwidth() / 2)
    .y0((d) => y(Math.max(yMin, Math.min(yMax, d[0]))))
    .y1((d) => y(Math.max(yMin, Math.min(yMax, d[1]))))
    .curve(d3.curveLinear);

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

  // Append areas
  svg
    .append("g")
    .selectAll("path")
    .data(stackedData)
    .join("path")
    .attr("fill", (d) => color(d.key)!)
    .attr("d", area)
    .append("title")
    .text((d) => d.key as string);

  if (useAxis) {
    // Add standard axes
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
        maxValueLength: 12,
        tickFormat: (d: string) => truncateText(d, 12),
        showGridLines: true, // Menampilkan grid lines horizontal (garis mendatar)
      },
      yAxisOptions: {
        customFormat: formatAxisNumber,
        showGridLines: false, // Tidak menampilkan grid lines vertikal (garis tegak)
        maxValueLength: 6,
      },
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
      itemCount: subcategories.length,
    });

    addLegend({
      svg,
      colorScale: color,
      position: legendPosition,
      domain: subcategories,
      legendPosition: "right",
    });
  }

  return svg.node();
};
