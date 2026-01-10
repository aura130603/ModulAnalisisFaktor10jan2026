import * as d3 from "d3";
import {
  createStandardSVG,
  AxisLabelOptions,
  addLegend,
  calculateLegendPosition,
} from "../chartUtils";
import {
  ChartTitleOptions,
  addChartTitle,
  addStandardAxes,
  generateAxisTicks,
  formatAxisNumber,
} from "./chartUtils";
import { defaultChartColors } from "../defaultStyles/defaultColors";
import { calculateResponsiveMargin } from "../responsiveMarginUtils";

export interface BoxplotAxisScaleOptions {
  y?: {
    min?: string | number;
    max?: string | number;
  };
}

interface BoxplotDataPoint {
  category: string;
  value: number;
}

interface BoxplotGroupData {
  category: string;
  q1: number;
  median: number;
  q3: number;
  lowerWhisker: number;
  upperWhisker: number;
  outliers: BoxplotDataPoint[];
}

export const createBoxplot = (
  data: BoxplotDataPoint[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: ChartTitleOptions,
  axisLabels?: AxisLabelOptions,
  axisScaleOptions?: BoxplotAxisScaleOptions,
  chartColors?: string[]
) => {
  console.log("Creating box plot with data:", data);

  // Filter data untuk menghilangkan nilai null, undefined, dan NaN
  const validData = data
    .filter(
      (d) => d.value !== null && d.value !== undefined && !Number.isNaN(d.value)
    )
    .map((d) => ({
      category:
        d.category === null || d.category === undefined || d.category === ""
          ? "unknown"
          : d.category,
      value: d.value,
    }));

  console.log("Valid Data:", validData);

  // Calculate responsive margins
  const margin = calculateResponsiveMargin({
    width,
    height,
    useAxis,
    titleOptions: titleOptions
      ? { title: titleOptions.title, subtitle: titleOptions.subtitle }
      : undefined,
    axisLabels,
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

  // Skala X
  const x = d3
    .scaleBand()
    .domain(validData.map((d) => d.category))
    .range([margin.left, width - margin.right])
    .padding(0.5);

  // Skala Y
  const validY = validData
    .map((d) => d.value)
    .filter((d) => d !== null && d !== undefined && !Number.isNaN(d));
  let yMin = d3.min(validY) || 0;
  let yMax = d3.max(validY) || 0;
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
      categories: validData.map((d) => d.category),
      axisLabels,
      yMin,
      yMax,
      chartType: "vertical",
      yAxisOptions: {
        showGridLines: true,
      },
    });
  }

  // Create color scale for different categories
  const colorScale: d3.ScaleOrdinal<string, string> = d3
    .scaleOrdinal<string>()
    .domain(validData.map((d) => d.category))
    .range(chartColors || defaultChartColors);

  // Mengelompokkan data berdasarkan kategori
  const groupedData = d3.group(validData, (d) => d.category);
  const boxData: BoxplotGroupData[] = Array.from(
    groupedData,
    ([category, group]) => {
      const sorted = group.map((d) => d.value).sort(d3.ascending);
      const q1 = d3.quantile(sorted, 0.25) ?? 0;
      const median = d3.quantile(sorted, 0.5) ?? 0;
      const q3 = d3.quantile(sorted, 0.75) ?? 0;
      const iqr = q3 - q1;
      const min = d3.min(group, (d) => d.value) ?? 0;
      const max = d3.max(group, (d) => d.value) ?? 0;
      const lowerWhisker = Math.max(min, q1 - 1.5 * iqr);
      const upperWhisker = Math.min(max, q3 + 1.5 * iqr);
      const outliers = group.filter(
        (d) => d.value < lowerWhisker || d.value > upperWhisker
      );
      return { category, q1, median, q3, lowerWhisker, upperWhisker, outliers };
    }
  );

  // Membuat grup untuk setiap kategori pada sumbu X
  const g = svg
    .append("g")
    .selectAll("g")
    .data(boxData)
    .join("g")
    .attr("transform", (d: BoxplotGroupData) => {
      const xPos = x(d.category);
      const bandwidth = x.bandwidth();
      return xPos !== undefined && bandwidth !== undefined
        ? `translate(${xPos + bandwidth / 2}, 0)`
        : "";
    });

  // Menambahkan whiskers (garis vertikal untuk rentang IQR)
  g.append("line")
    .attr("x1", 0)
    .attr("x2", 0)
    .attr("y1", (d: BoxplotGroupData) => y(d.upperWhisker))
    .attr("y2", (d: BoxplotGroupData) => y(d.lowerWhisker))
    .attr("stroke", "currentColor")
    .attr("stroke-width", 1);

  // Box (Q1 hingga Q3)
  g.append("rect")
    .attr("x", -x.bandwidth() / 2)
    .attr("y", (d: BoxplotGroupData) => y(d.q3))
    .attr("width", x.bandwidth())
    .attr("height", (d: BoxplotGroupData) => y(d.q1) - y(d.q3))
    .attr("fill", (d: BoxplotGroupData) => colorScale(d.category) as string)
    .attr("stroke", "none");

  // Median (garis horisontal)
  g.append("line")
    .attr("x1", -x.bandwidth() / 2)
    .attr("x2", x.bandwidth() / 2)
    .attr("y1", (d: BoxplotGroupData) => y(d.median))
    .attr("y2", (d: BoxplotGroupData) => y(d.median))
    .attr("stroke", "currentColor")
    .attr("stroke-width", 2);

  // Outliers (titik di luar whiskers)
  g.append("g")
    .attr("fill", (d: BoxplotGroupData) => colorScale(d.category) as string)
    .attr("fill-opacity", 0.6)
    .attr("stroke", "none")
    .selectAll("circle")
    .data((d: BoxplotGroupData) => d.outliers)
    .join("circle")
    .attr("cx", 0)
    .attr("cy", (d: BoxplotDataPoint) => y(d.value))
    .attr("r", 3);

  return svg.node();
};

export const createClusteredBoxplot = (
  data: { category: string; subcategory: string; value: number }[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: ChartTitleOptions,
  axisLabels?: AxisLabelOptions,
  axisScaleOptions?: BoxplotAxisScaleOptions,
  chartColors?: string[]
) => {
  console.log("Creating clustered box plot with data:", data);

  // Filter data untuk menghilangkan nilai null, undefined, dan NaN
  const validData = data.filter(
    (d) =>
      d.value !== null &&
      d.value !== undefined &&
      !Number.isNaN(d.value) &&
      d.subcategory !== ""
  );

  if (validData.length === 0) {
    console.error("No valid data available for the clustered boxplot");
    return null;
  }

  console.log("Valid Data:", validData);

  // Mengelompokkan data berdasarkan kategori utama
  const categories = Array.from(new Set(validData.map((d) => d.category)));
  const subcategories = Array.from(
    new Set(validData.map((d) => d.subcategory))
  );

  // Create canvas context for measuring text
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";

  // Calculate Y domain with axis scale options
  let yMin = d3.min(validData, (d) => d.value) ?? 0;
  let yMax = d3.max(validData, (d) => d.value) ?? 0;
  if (axisScaleOptions?.y) {
    if (axisScaleOptions.y.min !== undefined && axisScaleOptions.y.min !== "")
      yMin = Number(axisScaleOptions.y.min);
    if (axisScaleOptions.y.max !== undefined && axisScaleOptions.y.max !== "")
      yMax = Number(axisScaleOptions.y.max);
  }

  // Calculate max label width for margin calculation
  const yTicks = d3.scaleLinear().domain([yMin, yMax]).nice().ticks(5);
  const maxYLabelWidth = Math.max(
    ...yTicks.map((tick) => ctx.measureText(formatAxisNumber(tick)).width)
  );

  // Calculate max category width
  const maxCategoryWidth = Math.max(
    ...categories.map((cat) => ctx.measureText(cat).width)
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
    maxLabelWidth: maxYLabelWidth,
    categories,
    hasLegend: true,
    legendPosition: "right",
  });

  // Skala X untuk kategori utama
  const x = d3
    .scaleBand()
    .domain(categories)
    .range([margin.left, width - margin.right])
    .padding(0.2);

  // Skala X untuk sub-kategori dalam kategori utama (cluster)
  const xSub = d3
    .scaleBand()
    .domain(subcategories)
    .range([0, x.bandwidth()])
    .padding(0.1);

  // Skala Y berdasarkan nilai
  const y = d3
    .scaleLinear()
    .domain([yMin, yMax])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Color scale using default colors
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

  // Mengelompokkan data berdasarkan kategori dan subkategori
  const groupedData = d3.group(
    validData,
    (d) => `${d.category}-${d.subcategory}`
  );

  const boxData = Array.from(groupedData, ([key, group]) => {
    const [category, subcategory] = key.split("-");
    const sorted = group.map((d) => d.value).sort(d3.ascending);
    const q1 = d3.quantile(sorted, 0.25) ?? 0;
    const median = d3.quantile(sorted, 0.5) ?? 0;
    const q3 = d3.quantile(sorted, 0.75) ?? 0;
    const iqr = q3 - q1;
    const min = d3.min(group, (d) => d.value) ?? 0;
    const max = d3.max(group, (d) => d.value) ?? 0;
    const lowerWhisker = Math.max(min, q1 - 1.5 * iqr);
    const upperWhisker = Math.min(max, q3 + 1.5 * iqr);
    const outliers = group.filter(
      (d) => d.value < lowerWhisker || d.value > upperWhisker
    );

    return {
      category,
      subcategory,
      q1,
      median,
      q3,
      lowerWhisker,
      upperWhisker,
      outliers,
    };
  });

  // Membuat grup untuk setiap kategori utama dan subkategori
  const g = svg
    .append("g")
    .selectAll("g")
    .data(boxData)
    .join("g")
    .attr("transform", (d) => {
      const xPos = x(d.category);
      const subXPos = xSub(d.subcategory);
      return xPos !== undefined && subXPos !== undefined
        ? `translate(${xPos + subXPos + xSub.bandwidth() / 2}, 0)`
        : "";
    });

  // Menambahkan whiskers (garis vertikal untuk rentang IQR)
  g.append("line")
    .attr("x1", 0)
    .attr("x2", 0)
    .attr("y1", (d) => y(d.upperWhisker))
    .attr("y2", (d) => y(d.lowerWhisker))
    .attr("stroke", "currentColor")
    .attr("stroke-width", 1);

  // Box (Q1 hingga Q3)
  g.append("rect")
    .attr("x", -xSub.bandwidth() / 2)
    .attr("y", (d) => y(d.q3))
    .attr("width", xSub.bandwidth())
    .attr("height", (d) => y(d.q1) - y(d.q3))
    .attr("fill", (d) => color(d.subcategory) as string);

  // Median (garis horisontal)
  g.append("line")
    .attr("x1", -xSub.bandwidth() / 2)
    .attr("x2", xSub.bandwidth() / 2)
    .attr("y1", (d) => y(d.median))
    .attr("y2", (d) => y(d.median))
    .attr("stroke", "currentColor")
    .attr("stroke-width", 2);

  // Outliers (titik di luar whiskers)
  g.append("g")
    .attr("fill", "currentColor")
    .attr("fill-opacity", 0.6)
    .attr("stroke", "none")
    .selectAll("circle")
    .data((d) => d.outliers)
    .join("circle")
    .attr("cx", 0)
    .attr("cy", (d) => y(d.value))
    .attr("r", 3);

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
        showGridLines: true,
      },
      yAxisOptions: {
        customFormat: formatAxisNumber,
        showGridLines: false,
      },
    });

    // Add legend using the standard legend utility
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

export const create1DBoxplot = (
  data: { value: number }[],
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
  showAxes: { x: boolean; y: boolean } = { x: false, y: true } // Default: tampilkan kedua axis
) => {
  console.log("Creating 1D box plot with data:", data);

  // Filter data untuk menghilangkan nilai null, undefined, dan NaN
  const validData = data.filter(
    (d) =>
      d.value !== null &&
      d.value !== undefined &&
      d.value !== 0 &&
      !Number.isNaN(d.value)
  );

  console.log("Valid Data:", validData);

  // Menentukan skala sumbu Y (nilai)
  const validY = validData
    .map((d) => d.value)
    .filter((d) => d !== null && d !== undefined && !Number.isNaN(d));

  // Axis scale options
  let yMin = d3.min(validY) || 0;
  let yMax = d3.max(validY) || 0;
  let majorIncrement = axisScaleOptions?.y?.majorIncrement
    ? Number(axisScaleOptions.y.majorIncrement)
    : undefined;
  if (axisScaleOptions?.y) {
    if (axisScaleOptions.y.min !== undefined && axisScaleOptions.y.min !== "")
      yMin = Number(axisScaleOptions.y.min);
    if (axisScaleOptions.y.max !== undefined && axisScaleOptions.y.max !== "")
      yMax = Number(axisScaleOptions.y.max);
  }

  // Calculate responsive margins
  const margin = calculateResponsiveMargin({
    width,
    height,
    useAxis,
    titleOptions: titleOptions
      ? { title: titleOptions.title, subtitle: titleOptions.subtitle }
      : undefined,
    axisLabels: {
      // Hanya gunakan label Y untuk margin calculation
      y: axisLabels?.y,
    },
  });

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

  // Menghitung quartiles, median, whiskers untuk boxplot
  const sorted = validData.map((d) => d.value).sort(d3.ascending);
  const q1 = d3.quantile(sorted, 0.25) ?? 0;
  const median = d3.quantile(sorted, 0.5) ?? 0;
  const q3 = d3.quantile(sorted, 0.75) ?? 0;
  const iqr = q3 - q1;
  const min = d3.min(validData, (d) => d.value) ?? 0;
  const max = d3.max(validData, (d) => d.value) ?? 0;
  const lowerWhisker = Math.max(min, q1 - 1.5 * iqr);
  const upperWhisker = Math.min(max, q3 + 1.5 * iqr);
  const outliers = validData.filter(
    (d) => d.value < lowerWhisker || d.value > upperWhisker
  );

  // Calculate box plot dimensions based on margins
  const plotWidth = width - margin.left - margin.right;
  const plotCenter = margin.left + plotWidth / 2;
  const boxWidth = plotWidth / 2;

  // Menambahkan whiskers (garis vertikal untuk rentang IQR)
  svg
    .append("line")
    .attr("x1", plotCenter)
    .attr("x2", plotCenter)
    .attr("y1", y(upperWhisker))
    .attr("y2", y(lowerWhisker))
    .attr("stroke", "currentColor")
    .attr("stroke-width", 1);

  // Box (Q1 hingga Q3)
  svg
    .append("rect")
    .attr("x", plotCenter - boxWidth / 2)
    .attr("y", y(q3))
    .attr("width", boxWidth)
    .attr("height", y(q1) - y(q3))
    .attr(
      "fill",
      Array.isArray(chartColors) && chartColors.length > 0
        ? chartColors[0]
        : defaultChartColors[0]
    );

  // Median (garis horisontal)
  svg
    .append("line")
    .attr("x1", plotCenter - boxWidth / 2)
    .attr("x2", plotCenter + boxWidth / 2)
    .attr("y1", y(median))
    .attr("y2", y(median))
    .attr("stroke", "currentColor")
    .attr("stroke-width", 2);

  // Outliers (titik di luar whiskers)
  svg
    .append("g")
    .attr("fill", "currentColor")
    .attr("fill-opacity", 0.6)
    .attr("stroke", "none")
    .selectAll("circle")
    .data(outliers)
    .join("circle")
    .attr("cx", plotCenter)
    .attr("cy", (d) => y(d.value))
    .attr("r", 3);

  // Menambahkan sumbu Y jika diperlukan
  if (useAxis) {
    // Menggunakan helper function addStandardAxes
    addStandardAxes(svg, {
      xScale: d3
        .scaleLinear()
        .domain([0, 1])
        .range([margin.left, width - margin.right]), // dummy x scale
      yScale: y,
      width,
      height,
      marginTop: margin.top,
      marginRight: margin.right,
      marginBottom: margin.bottom,
      marginLeft: margin.left,
      categories: [], // tidak ada kategori untuk 1D boxplot
      axisLabels: {
        // Hanya tampilkan label Y jika ada
        y: axisLabels?.y,
      },
      majorIncrement,
      yMin,
      yMax,
      chartType: "vertical",
      xAxisOptions: {
        showAxis: showAxes.x, // kontrol tampilan garis axis utama
        showTicks: false, // tidak menampilkan garis-garis pendek
        showValues: false, // tidak menampilkan angka/nilai di axis
        showAxisLabel: false, // tidak menampilkan label axis
        showGridLines: true,
      },
      yAxisOptions: {
        customFormat: formatAxisNumber,
        showAxis: showAxes.y,
        showTicks: true,
        showValues: true,
        showAxisLabel: true, // tidak menampilkan label axis
        showGridLines: false,
        maxValueLength: 6, // Panjang maksimum untuk nilai di axis
      },
    });
  }

  return svg.node();
};
