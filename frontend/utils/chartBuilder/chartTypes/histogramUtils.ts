import * as d3 from "d3";
import {
  ChartTitleOptions,
  addChartTitle,
  addStandardAxes,
  formatAxisNumber,
  truncateText,
} from "./chartUtils";
import {
  createStandardSVG,
  addAxisLabels,
  AxisLabelOptions,
  getMajorTicks,
  addLegend,
  calculateLegendPosition,
  SVGCreationOptions,
  LegendOptions,
  LegendPositionOptions,
} from "../chartUtils";
import { calculateResponsiveMargin } from "../responsiveMarginUtils";
import { defaultChartColors } from "../defaultStyles/defaultColors";

export interface ChartData {
  category: string;
  subcategory: string;
  value: number;
}

// Definisikan interface untuk formattedData
interface FormattedData {
  category: string;
  [key: string]: number | string;
}

export interface AxisLabels {
  x?: string;
  y?: string;
}

export interface AxisScaleOptions {
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
}

export const createHistogram = (
  data: number[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: ChartTitleOptions,
  axisLabels?: AxisLabels,
  axisScaleOptions?: AxisScaleOptions,
  chartColors?: string[],
  showNormalCurve: boolean = false
) => {
  console.log("Creating histogram with data:", data);

  // Filter data
  const validData = data.filter(
    (d) => d !== null && d !== undefined && !Number.isNaN(d) && d !== 0
  );

  console.log("Creating histogram with valid data:", validData);

  // Menentukan jumlah bins
  const thresholds = Math.ceil(1 + 3.3 * Math.log10(validData.length));

  // Membuat bins dari data yang valid
  const bins = d3
    .bin()
    .thresholds(thresholds)
    .value((d: any) => d)(validData);

  // Pastikan x0 dan x1 memiliki nilai fallback jika undefined
  const x0 =
    bins.length > 0 && bins[0].x0 !== undefined
      ? bins[0].x0
      : d3.min(validData) || 0;
  const x1 =
    bins.length > 0 && bins[bins.length - 1].x1 !== undefined
      ? bins[bins.length - 1].x1
      : d3.max(validData);

  // Pastikan x0 dan x1 adalah tipe number
  let x0Value: number = typeof x0 === "number" ? x0 : 0;
  let x1Value: number =
    typeof x1 === "number" ? x1 : Math.max(d3.max(validData) as number, 10);

  // Apply axis scale options if provided
  if (axisScaleOptions?.x) {
    if (axisScaleOptions.x.min !== undefined && axisScaleOptions.x.min !== "")
      x0Value = Number(axisScaleOptions.x.min);
    if (axisScaleOptions.x.max !== undefined && axisScaleOptions.x.max !== "")
      x1Value = Number(axisScaleOptions.x.max);
  }

  // Calculate label widths for margin calculation
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";

  // Calculate Y domain with nice values
  let yMin = 0;
  let yMax = d3.max(bins, (d) => d.length) || 0;
  let majorIncrement = axisScaleOptions?.y?.majorIncrement
    ? Number(axisScaleOptions.y.majorIncrement)
    : undefined;

  if (axisScaleOptions?.y) {
    if (axisScaleOptions.y.min !== undefined && axisScaleOptions.y.min !== "")
      yMin = Number(axisScaleOptions.y.min);
    if (axisScaleOptions.y.max !== undefined && axisScaleOptions.y.max !== "")
      yMax = Number(axisScaleOptions.y.max);
  }

  // Calculate nice tick values
  const tickCount = Math.min(10, Math.floor(height / 50));
  const yTicks = d3.scaleLinear().domain([yMin, yMax]).nice().ticks(tickCount);

  // Calculate max label widths for margin
  const maxYLabelWidth =
    d3.max(yTicks.map((tick) => ctx.measureText(tick.toFixed(1)).width)) ?? 0;
  const maxXLabelWidth =
    d3.max(
      bins,
      (d) => ctx.measureText((d.x0 ?? 0).toFixed(1).toString()).width
    ) ?? 0;

  // Use responsive margin utility with label measurements
  // Jika normal curve ditampilkan, tambahkan margin kanan untuk box statistik
  // Hitung margin dengan pertimbangan khusus untuk normal curve
  const baseMargin = calculateResponsiveMargin({
    width,
    height,
    useAxis,
    titleOptions,
    axisLabels,
    maxLabelWidth: Math.max(maxYLabelWidth, maxXLabelWidth),
    hasLegend: showNormalCurve, // Tambahkan legend space jika normal curve ditampilkan
    legendPosition: showNormalCurve ? "right" : undefined, // Posisi legend di kanan
  });

  // Tambahkan margin ekstra untuk statistics box jika normal curve ditampilkan
  const margin = {
    ...baseMargin,
    right: showNormalCurve
      ? Math.max(baseMargin.right, 140) // Pastikan ada ruang untuk statistics box (120px + padding)
      : baseMargin.right,
  };

  // Menentukan skala untuk sumbu X
  const x = d3
    .scaleLinear()
    .domain([x0Value, x1Value])
    .range([margin.left, width - margin.right]);

  // Y scale with nice values
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

  // Menambahkan rectangle untuk setiap bin
  svg
    .append("g")
    .attr(
      "fill",
      Array.isArray(chartColors) && chartColors.length > 0
        ? chartColors[0]
        : "steelblue"
    )
    .selectAll("rect")
    .data(bins)
    .join("rect")
    .attr("x", (d) => x(d.x0 || 0) + 1)
    .attr("width", (d) => x(d.x1 || 0) - x(d.x0 || 0) - 2)
    .attr("y", (d) => y(d.length))
    .attr("height", (d) => y(0) - y(d.length));

  // Tambahkan kurva normal jika diminta
  if (showNormalCurve) {
    // Hitung mean dan standar deviasi dari data
    const mean = d3.mean(validData) ?? 0;
    const stdDev = d3.deviation(validData) ?? 1;

    // Buat data kurva normal berdasarkan skala X
    const normalCurveData = d3
      .range(x0Value, x1Value, (x1Value - x0Value) / 100)
      .map((xVal) => {
        const pdf =
          (1 / (stdDev * Math.sqrt(2 * Math.PI))) *
          Math.exp(-0.5 * Math.pow((xVal - mean) / stdDev, 2));
        return {
          x: xVal,
          y: (pdf * validData.length * (x1Value - x0Value)) / thresholds, // penskalaan tinggi
        };
      });

    // Tambahkan path untuk kurva normal
    const line = d3
      .line<{ x: number; y: number }>()
      .x((d) => x(d.x))
      .y((d) => y(d.y))
      .curve(d3.curveBasis); // bikin halus

    svg
      .append("path")
      .datum(normalCurveData)
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Tambahkan informasi statistik menggunakan fungsi calculateLegendPosition
    const statsGroup = svg.append("g").attr("class", "statistics-info");

    // Hitung posisi legend yang tepat
    const legendPosition = calculateLegendPosition({
      width,
      height,
      marginLeft: margin.left,
      marginRight: margin.right,
      marginBottom: margin.bottom,
      marginTop: margin.top,
      legendPosition: "right",
      itemCount: 3, // 3 item: Mean, Std Dev, N
    });

    // Background box untuk statistik
    const statsBox = statsGroup
      .append("rect")
      .attr("x", legendPosition.x)
      .attr("y", legendPosition.y)
      .attr("width", 120)
      .attr("height", 70)
      .attr("fill", "white")
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("rx", 3);

    // Text untuk statistik
    statsGroup
      .append("text")
      .attr("x", legendPosition.x + 5)
      .attr("y", legendPosition.y + 15)
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "black")
      .text(`Mean = ${mean.toFixed(3)}`);

    statsGroup
      .append("text")
      .attr("x", legendPosition.x + 5)
      .attr("y", legendPosition.y + 30)
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "black")
      .text(`Std. Dev. = ${stdDev.toFixed(5)}`);

    statsGroup
      .append("text")
      .attr("x", legendPosition.x + 5)
      .attr("y", legendPosition.y + 45)
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "black")
      .text(`N = ${validData.length}`);
  }

  // Add standardized axes
  if (useAxis) {
    // Generate tick values based on majorIncrement or calculated tick count
    const tickValues = axisScaleOptions?.y?.majorIncrement
      ? getMajorTicks(yMin, yMax, Number(axisScaleOptions.y.majorIncrement))
      : yTicks;

    // Generate categories from bin boundaries
    const categories = bins.map((d) => (d.x0?.toFixed(1) || "0").toString());

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
        maxValueLength: 8,
        tickFormat: (d: any) => formatAxisNumber(d),
        showGridLines: true,
      },
      yAxisOptions: {
        customFormat: formatAxisNumber,
        showGridLines: false,
        maxValueLength: 6,
        tickValues,
        showAxis: true,
        showTicks: true,
        showValues: true,
        showAxisLabel: true,
      },
    });
  }

  return svg.node();
};

export const createPopulationPyramid = (
  data: ChartData[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: ChartTitleOptions,
  axisLabels?: AxisLabels,
  axisScaleOptions?: AxisScaleOptions,
  chartColors?: string[]
) => {
  // Validasi data
  if (!data || data.length === 0) {
    console.error("No data available for the population pyramid");
    return null;
  }

  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";

  // Dapatkan unique subcategories dari data
  const subcategories = Array.from(new Set(data.map((d) => d.subcategory)));

  // Gunakan subcategories yang ada untuk menentukan sisi
  const leftCategory = subcategories[0];
  const rightCategory = subcategories[1];

  // Persiapkan data untuk label sumbu Y
  const categories = Array.from(new Set(data.map((d) => d.category)));
  const yTicks = categories;
  const maxYLabelWidth =
    d3.max(yTicks.map((tick) => ctx.measureText(tick).width)) ?? 0;

  // Hitung margin responsif
  const margin = calculateResponsiveMargin({
    width,
    height,
    useAxis,
    titleOptions: titleOptions
      ? { title: titleOptions.title, subtitle: titleOptions.subtitle }
      : undefined,
    axisLabels,
    maxLabelWidth: maxYLabelWidth,
    hasLegend: true,
    legendPosition: "right",
    isHorizontalChart: false, // Menggunakan vertical layout
  });

  // Hitung maxPopulation berdasarkan kategori yang ada
  let maxPopulation = 0;
  if (leftCategory) {
    const leftMax =
      d3.max(
        data.filter((d) => d.subcategory === leftCategory),
        (d) => d.value
      ) || 0;
    maxPopulation = Math.max(maxPopulation, leftMax);
  }
  if (rightCategory) {
    const rightMax =
      d3.max(
        data.filter((d) => d.subcategory === rightCategory),
        (d) => d.value
      ) || 0;
    maxPopulation = Math.max(maxPopulation, rightMax);
  }

  // Update xMin dan xMax berdasarkan data yang ada
  let xMin = leftCategory ? -maxPopulation : 0;
  let xMax = rightCategory ? maxPopulation : 0;

  // Apply axis scale options if provided
  if (axisScaleOptions?.x) {
    if (axisScaleOptions.x.min !== undefined && axisScaleOptions.x.min !== "")
      xMin = Number(axisScaleOptions.x.min);
    if (axisScaleOptions.x.max !== undefined && axisScaleOptions.x.max !== "")
      xMax = Number(axisScaleOptions.x.max);
  }

  // Buat skala
  const x = d3
    .scaleLinear()
    .domain([xMin, xMax])
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleBand()
    .domain(categories)
    .range([height - margin.bottom, margin.top])
    .padding(0.1);

  // Buat SVG
  const svg = createStandardSVG({
    width,
    height,
    marginTop: margin.top,
    marginRight: margin.right,
    marginBottom: margin.bottom,
    marginLeft: margin.left,
  });

  // Tambahkan judul
  if (titleOptions) {
    addChartTitle(svg, {
      ...titleOptions,
      marginTop: margin.top,
      useResponsivePositioning: true,
    });
  }

  // Warna bar default atau dari chartColors
  let leftColor = defaultChartColors[0]; // E69F00 (orange)
  let rightColor = defaultChartColors[1]; // 56B4E9 (blue)
  if (chartColors && chartColors.length === 1) {
    leftColor = chartColors[0];
    rightColor = chartColors[0];
  } else if (chartColors && chartColors.length > 1) {
    leftColor = chartColors[0];
    rightColor = chartColors[1];
  }

  // Grid lines
  if (useAxis) {
    svg
      .append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(
        d3
          .axisBottom(x)
          .tickSize(-(height - margin.top - margin.bottom))
          .tickFormat(() => "")
      )
      .call((g) => {
        g.select(".domain").remove();
        g.selectAll(".tick line")
          .attr("stroke", "rgba(0,0,0,0.1)")
          .attr("stroke-dasharray", "2,2");
      });
  }

  if (leftCategory) {
    // Bar sisi kiri (nilai negatif)
    svg
      .append("g")
      .selectAll(".bar-left")
      .data(data.filter((d) => d.subcategory === leftCategory))
      .join("rect")
      .attr("class", "bar-left")
      .attr("x", (d) => x(Math.min(0, -d.value)))
      .attr("y", (d) => y(d.category) || 0)
      .attr("width", (d) => Math.abs(x(-d.value) - x(0)))
      .attr("height", y.bandwidth())
      .attr("fill", leftColor);
  }

  if (rightCategory) {
    // Bar sisi kanan (nilai positif)
    svg
      .append("g")
      .selectAll(".bar-right")
      .data(data.filter((d) => d.subcategory === rightCategory))
      .join("rect")
      .attr("class", "bar-right")
      .attr("x", x(0))
      .attr("y", (d) => y(d.category) || 0)
      .attr("width", (d) => Math.abs(x(d.value) - x(0)))
      .attr("height", y.bandwidth())
      .attr("fill", rightColor);
  }

  // Tambahkan axis jika diperlukan
  if (useAxis) {
    const xTickValues = axisScaleOptions?.x?.majorIncrement
      ? getMajorTicks(xMin, xMax, Number(axisScaleOptions.x.majorIncrement))
      : undefined;

    addStandardAxes(svg, {
      xScale: x,
      yScale: y,
      width,
      height,
      marginTop: margin.top,
      marginRight: margin.right,
      marginBottom: margin.bottom,
      marginLeft: margin.left,
      categories: [], // Set empty categories to prevent rotation
      axisLabels,
      xMin,
      xMax,
      chartType: "vertical",
      xAxisOptions: {
        maxValueLength: 8,
        tickFormat: (d: any) => {
          const absValue = Math.abs(Number(d));
          return d < 0
            ? `-${formatAxisNumber(absValue)}`
            : formatAxisNumber(absValue);
        },
        showGridLines: false,
        tickValues: xTickValues,
        axisPosition: "bottom",
      },
      yAxisOptions: {
        showGridLines: false,
      },
    });
  }

  // Tambahkan legenda
  const legendPosition = calculateLegendPosition({
    width,
    height,
    marginLeft: margin.left,
    marginRight: margin.right,
    marginBottom: margin.bottom,
    marginTop: margin.top,
    legendPosition: "right",
    itemCount: 2,
  });

  // Buat color scale untuk legenda dengan nama variabel yang ada
  const legendDomain = subcategories.filter(Boolean);
  const legendColors = [leftColor, rightColor].slice(0, legendDomain.length);

  const colorScale = d3
    .scaleOrdinal<string>()
    .domain(legendDomain)
    .range(legendColors);

  // Tambahkan legenda hanya jika ada data
  if (legendDomain.length > 0) {
    addLegend({
      svg,
      colorScale: (d: string) => colorScale(d),
      position: legendPosition,
      domain: legendDomain,
      itemWidth: 15,
      itemHeight: 15,
      fontSize: 12,
      legendPosition: "right",
      title: "Keterangan:",
    });
  }

  return svg.node();
};

export const createFrequencyPolygon = (
  data: number[], // Ubah tipe data untuk konsisten dengan histogram
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: ChartTitleOptions,
  axisLabels?: AxisLabels,
  axisScaleOptions?: AxisScaleOptions,
  chartColors?: string[]
) => {
  // Filter data
  const validData = data.filter(
    (d) => d !== null && d !== undefined && !Number.isNaN(d) && d !== 0
  );

  // Hitung bins seperti di histogram
  const thresholds = Math.ceil(1 + 3.3 * Math.log10(validData.length));
  const bins = d3
    .bin()
    .thresholds(thresholds)
    .value((d: any) => d)(validData);

  // Pastikan x0 dan x1 memiliki nilai fallback jika undefined
  const x0 =
    bins.length > 0 && bins[0].x0 !== undefined
      ? bins[0].x0
      : d3.min(validData) || 0;
  const x1 =
    bins.length > 0 && bins[bins.length - 1].x1 !== undefined
      ? bins[bins.length - 1].x1
      : d3.max(validData);

  // Pastikan x0 dan x1 adalah tipe number
  let x0Value: number = typeof x0 === "number" ? x0 : 0;
  let x1Value: number =
    typeof x1 === "number" ? x1 : Math.max(d3.max(validData) as number, 10);

  // Apply axis scale options if provided
  if (axisScaleOptions?.x) {
    if (axisScaleOptions.x.min !== undefined && axisScaleOptions.x.min !== "")
      x0Value = Number(axisScaleOptions.x.min);
    if (axisScaleOptions.x.max !== undefined && axisScaleOptions.x.max !== "")
      x1Value = Number(axisScaleOptions.x.max);
  }

  // Calculate Y domain with nice values
  let yMin = 0;
  let yMax = d3.max(bins, (d) => d.length) || 0;
  let majorIncrement = axisScaleOptions?.y?.majorIncrement
    ? Number(axisScaleOptions.y.majorIncrement)
    : undefined;

  if (axisScaleOptions?.y) {
    if (axisScaleOptions.y.min !== undefined && axisScaleOptions.y.min !== "")
      yMin = Number(axisScaleOptions.y.min);
    if (axisScaleOptions.y.max !== undefined && axisScaleOptions.y.max !== "")
      yMax = Number(axisScaleOptions.y.max);
  }

  // Calculate nice tick values
  const tickCount = Math.min(10, Math.floor(height / 50));
  const yTicks = d3.scaleLinear().domain([yMin, yMax]).nice().ticks(tickCount);

  // Calculate max label widths for margin
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";
  const maxYLabelWidth =
    d3.max(yTicks.map((tick) => ctx.measureText(tick.toFixed(1)).width)) ?? 0;
  const maxXLabelWidth =
    d3.max(
      bins,
      (d) => ctx.measureText((d.x0 ?? 0).toFixed(1).toString()).width
    ) ?? 0;

  // Use responsive margin utility with label measurements
  const margin = calculateResponsiveMargin({
    width,
    height,
    useAxis,
    titleOptions,
    axisLabels,
    maxLabelWidth: Math.max(maxYLabelWidth, maxXLabelWidth),
  });

  // Buat skala
  const x = d3
    .scaleLinear()
    .domain([x0Value, x1Value])
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

  // Warna garis/titik dari chartColors atau default
  const mainColor =
    chartColors && chartColors[0] ? chartColors[0] : defaultChartColors[0];

  // Buat data points dari titik tengah setiap bin
  const plotData = bins.map((bin) => ({
    x: (bin.x0! + bin.x1!) / 2, // Titik tengah bin
    y: bin.length, // Frekuensi
  }));

  // Tambahkan titik awal dan akhir dengan y=0 untuk polygon yang lengkap
  plotData.unshift({ x: x0Value, y: 0 });
  plotData.push({ x: x1Value, y: 0 });

  // Append frequency polygon line
  svg
    .append("path")
    .datum(plotData)
    .attr("fill", "none")
    .attr("stroke", mainColor)
    .attr("stroke-width", 2)
    .attr(
      "d",
      d3
        .line<(typeof plotData)[0]>()
        .x((d) => x(d.x))
        .y((d) => y(d.y))
        .curve(d3.curveLinear) // Gunakan linear untuk polygon yang tepat
    );

  // Append data points (hanya untuk titik tengah bin, bukan titik awal/akhir)
  svg
    .append("g")
    .selectAll("circle")
    .data(plotData.slice(1, -1)) // Exclude titik awal dan akhir
    .join("circle")
    .attr("cx", (d) => x(d.x))
    .attr("cy", (d) => y(d.y))
    .attr("r", 4)
    .attr("fill", mainColor);

  // Add standardized axes
  if (useAxis) {
    // Generate tick values based on majorIncrement or calculated tick count
    const tickValues = axisScaleOptions?.y?.majorIncrement
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
      categories: [],
      axisLabels,
      xMin: x0Value,
      xMax: x1Value,
      yMin,
      yMax,
      chartType: "vertical",
      xAxisOptions: {
        showGridLines: true,
      },
      yAxisOptions: {
        showGridLines: true,
        tickValues,
      },
    });
  }

  return svg.node();
};

export const createStackedHistogram = (
  data: { value: number; category: string }[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: ChartTitleOptions,
  axisLabels?: { x?: string; y?: string },
  chartColors?: string[]
) => {
  console.log("Creating stacked histogram with data:", data);

  // Filter data untuk menghilangkan nilai yang tidak valid
  const validData = data.filter(
    (d) =>
      d.value !== null &&
      d.value !== undefined &&
      !Number.isNaN(d.value) &&
      d.value !== 0
  );

  if (validData.length === 0) {
    console.error("No valid data available for the stacked histogram");
    return null;
  }

  // Kelompokkan data berdasarkan kategori
  const categories = Array.from(new Set(validData.map((d) => d.category)));

  // Handle case when no categories are found (should not happen with our fix, but safety check)
  if (categories.length === 0) {
    console.error("No categories found in stacked histogram data");
    return null;
  }

  // Menentukan bins
  const thresholds = Math.max(5, Math.ceil(validData.length / 5));
  const binGenerator = d3
    .bin<{ value: number; category: string }, number>()
    .thresholds(thresholds)
    .value((d) => d.value);

  const bins = binGenerator(validData);

  // Pastikan x0 dan x1 selalu bertipe number
  const x0Value: number = bins[0]?.x0 ?? 0;
  const x1Value: number =
    bins[bins.length - 1]?.x1 ?? d3.max(validData.map((d) => d.value)) ?? 10;

  // Buat struktur data untuk d3.stack()
  const stackedData = bins.map((bin) => {
    const counts: { [key: string]: number } = {};
    categories.forEach((category) => (counts[category] = 0));
    bin.forEach((d) => counts[d.category]++);
    return { x0: bin.x0 ?? 0, x1: bin.x1 ?? 0, ...counts };
  });

  // Create canvas context for measuring text
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";

  // Calculate max Y value for ticks
  const maxValue =
    d3.max(stackedData, (d) => d3.sum(categories, (c) => (d as any)[c])) ?? 0;
  const yTicks = d3.scaleLinear().domain([0, maxValue]).nice().ticks(5);

  // Calculate max label width for margin calculation
  const maxLabelWidth = Math.max(
    ...yTicks.map((tick) => ctx.measureText(formatAxisNumber(tick)).width)
  );

  // Calculate max legend text width
  const maxLegendWidth = Math.max(
    ...categories.map((category) => ctx.measureText(category).width)
  );

  // Use responsive margin utility with legend consideration
  // Only show legend if there are multiple categories
  const showLegend = categories.length > 1;

  const margin = calculateResponsiveMargin({
    width,
    height,
    useAxis,
    titleOptions: titleOptions
      ? { title: titleOptions.title, subtitle: titleOptions.subtitle }
      : undefined,
    axisLabels,
    maxLabelWidth,
    hasLegend: showLegend,
    legendPosition: "right",
  });

  // Skala X
  const x = d3
    .scaleLinear()
    .domain([x0Value, x1Value])
    .range([margin.left, width - margin.right]);

  // Skala Y
  const y = d3
    .scaleLinear()
    .domain([0, maxValue])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Color scale using default colors
  const color = d3
    .scaleOrdinal<string>()
    .domain(categories)
    .range(chartColors || defaultChartColors);

  // Data untuk d3.stack()
  const stack = d3.stack<{ [key: string]: number }>().keys(categories);
  const series = stack(stackedData);

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
    .attr("x", (d) => x(d.data.x0))
    .attr("width", (d) => Math.max(1, x(d.data.x1) - x(d.data.x0) - 2))
    .attr("y", (d) => y(d[1]))
    .attr("height", (d) => Math.max(0, y(d[0]) - y(d[1])))
    .append("title")
    .text((d) => `${d.key}: ${d[1] - d[0]}`);

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
      categories: stackedData.map((d) => d.x0.toString()),
      axisLabels,
      xMin: x0Value,
      xMax: x1Value,
      yMin: 0,
      yMax: maxValue,
      chartType: "vertical",
      xAxisOptions: {
        showGridLines: true,
        tickFormat: formatAxisNumber,
      },
      yAxisOptions: {
        customFormat: formatAxisNumber,
        showGridLines: false,
      },
    });

    // Add legend only if there are multiple categories
    if (showLegend) {
      const legendPosition = calculateLegendPosition({
        width,
        height,
        marginLeft: margin.left,
        marginRight: margin.right,
        marginBottom: margin.bottom,
        marginTop: margin.top,
        legendPosition: "right",
        itemCount: categories.length,
      });

      addLegend({
        svg,
        colorScale: color,
        position: legendPosition,
        legendPosition: "right",
        domain: categories,
        itemWidth: 15,
        itemHeight: 15,
        fontSize: 12,
      });
    }
  }

  // Return the SVG node
  return svg.node();
};

export const createSPSSStyleHistogram = (
  data: number[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: ChartTitleOptions,
  axisLabels?: AxisLabels,
  axisScaleOptions?: AxisScaleOptions,
  chartColors?: string[],
  showNormalCurve: boolean = true
) => {
  console.log("Creating SPSS-style histogram with data:", data);

  // Filter data
  const validData = data.filter(
    (d) => d !== null && d !== undefined && !Number.isNaN(d)
  );

  if (validData.length === 0) {
    console.error("No valid data available for histogram");
    return null;
  }

  console.log("Creating SPSS-style histogram with valid data:", validData);

  // Hitung statistik deskriptif
  const mean = d3.mean(validData) ?? 0;
  const stdDev = d3.deviation(validData) ?? 1;
  const min = d3.min(validData) ?? 0;
  const max = d3.max(validData) ?? 10;

  // Menentukan jumlah bins menggunakan Sturges' formula (seperti SPSS)
  const n = validData.length;
  const binCount = Math.max(5, Math.ceil(1 + 3.322 * Math.log10(n)));

  // Membuat bins dengan range yang lebih lebar untuk kurva normal
  const dataRange = max - min;
  const binWidth = dataRange / binCount;

  // Extend range untuk kurva normal (3 standard deviations)
  const extendedMin = Math.min(min, mean - 3 * stdDev);
  const extendedMax = Math.max(max, mean + 3 * stdDev);
  const extendedRange = extendedMax - extendedMin;

  // Apply axis scale options if provided
  let x0Value = extendedMin;
  let x1Value = extendedMax;

  if (axisScaleOptions?.x) {
    if (axisScaleOptions.x.min !== undefined && axisScaleOptions.x.min !== "")
      x0Value = Number(axisScaleOptions.x.min);
    if (axisScaleOptions.x.max !== undefined && axisScaleOptions.x.max !== "")
      x1Value = Number(axisScaleOptions.x.max);
  }

  // Membuat bins dengan d3
  const bins = d3
    .bin()
    .domain([x0Value, x1Value])
    .thresholds(d3.thresholdScott(validData, x0Value, x1Value))
    .value((d: any) => d)(validData);

  // Calculate label widths for margin calculation
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";

  // Calculate Y domain
  let yMin = 0;
  let yMax = d3.max(bins, (d) => d.length) || 0;
  let majorIncrement = axisScaleOptions?.y?.majorIncrement
    ? Number(axisScaleOptions.y.majorIncrement)
    : undefined;

  if (axisScaleOptions?.y) {
    if (axisScaleOptions.y.min !== undefined && axisScaleOptions.y.min !== "")
      yMin = Number(axisScaleOptions.y.min);
    if (axisScaleOptions.y.max !== undefined && axisScaleOptions.y.max !== "")
      yMax = Number(axisScaleOptions.y.max);
  }

  // Calculate nice tick values
  const tickCount = Math.min(10, Math.floor(height / 50));
  const yTicks = d3.scaleLinear().domain([yMin, yMax]).nice().ticks(tickCount);

  // Calculate max label widths for margin
  const maxYLabelWidth =
    d3.max(yTicks.map((tick) => ctx.measureText(tick.toFixed(1)).width)) ?? 0;
  const maxXLabelWidth =
    d3.max(
      bins,
      (d) => ctx.measureText((d.x0 ?? 0).toFixed(1).toString()).width
    ) ?? 0;

  // Use responsive margin utility with label measurements
  const margin = calculateResponsiveMargin({
    width,
    height,
    useAxis,
    titleOptions,
    axisLabels,
    maxLabelWidth: Math.max(maxYLabelWidth, maxXLabelWidth),
  });

  // Menentukan skala untuk sumbu X
  const x = d3
    .scaleLinear()
    .domain([x0Value, x1Value])
    .range([margin.left, width - margin.right]);

  // Y scale with nice values
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

  // Menambahkan rectangle untuk setiap bin
  svg
    .append("g")
    .attr(
      "fill",
      Array.isArray(chartColors) && chartColors.length > 0
        ? chartColors[0]
        : "steelblue"
    )
    .selectAll("rect")
    .data(bins)
    .join("rect")
    .attr("x", (d) => x(d.x0 || 0) + 1)
    .attr("width", (d) => Math.max(1, x(d.x1 || 0) - x(d.x0 || 0) - 2))
    .attr("y", (d) => y(d.length))
    .attr("height", (d) => Math.max(0, y(0) - y(d.length)));

  // Tambahkan kurva normal jika diminta
  if (showNormalCurve) {
    // Buat data kurva normal dengan penskalaan yang tepat seperti SPSS
    const normalCurveData = d3
      .range(x0Value, x1Value, (x1Value - x0Value) / 200)
      .map((xVal) => {
        // Normal PDF
        const pdf =
          (1 / (stdDev * Math.sqrt(2 * Math.PI))) *
          Math.exp(-0.5 * Math.pow((xVal - mean) / stdDev, 2));

        // Penskalaan seperti SPSS: area di bawah kurva = area histogram
        // Area histogram = total frekuensi * bin width
        const totalFrequency = d3.sum(bins, (d) => d.length);
        const averageBinWidth = (x1Value - x0Value) / bins.length;
        const scaledPdf = pdf * totalFrequency * averageBinWidth;

        return {
          x: xVal,
          y: scaledPdf,
        };
      });

    // Tambahkan path untuk kurva normal
    const line = d3
      .line<{ x: number; y: number }>()
      .x((d) => x(d.x))
      .y((d) => y(d.y))
      .curve(d3.curveBasis);

    svg
      .append("path")
      .datum(normalCurveData)
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5")
      .attr("d", line);

    // Tambahkan legend untuk kurva normal
    const legendGroup = svg.append("g").attr("class", "normal-curve-legend");

    // Legend line
    legendGroup
      .append("line")
      .attr("x1", width - margin.right - 80)
      .attr("x2", width - margin.right - 60)
      .attr("y1", margin.top + 20)
      .attr("y2", margin.top + 20)
      .attr("stroke", "red")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5");

    // Legend text
    legendGroup
      .append("text")
      .attr("x", width - margin.right - 55)
      .attr("y", margin.top + 25)
      .attr("font-size", "12px")
      .attr("fill", "black")
      .text("Normal");
  }

  // Add standardized axes
  if (useAxis) {
    // Generate tick values based on majorIncrement or calculated tick count
    const tickValues = axisScaleOptions?.y?.majorIncrement
      ? getMajorTicks(yMin, yMax, Number(axisScaleOptions.y.majorIncrement))
      : yTicks;

    // Generate categories from bin boundaries
    const categories = bins.map((d) => (d.x0?.toFixed(1) || "0").toString());

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
        maxValueLength: 8,
        tickFormat: (d: any) => formatAxisNumber(d),
        showGridLines: true,
      },
      yAxisOptions: {
        customFormat: formatAxisNumber,
        showGridLines: false,
        maxValueLength: 6,
        tickValues,
        showAxis: true,
        showTicks: true,
        showValues: true,
        showAxisLabel: true,
      },
    });
  }

  return svg.node();
};

export const createSPSSNormalCurveHistogram = (
  data: number[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: ChartTitleOptions,
  axisLabels?: AxisLabels,
  axisScaleOptions?: AxisScaleOptions,
  chartColors?: string[],
  showNormalCurve: boolean = true
) => {
  console.log("Creating SPSS normal curve histogram with data:", data);

  // Filter data
  const validData = data.filter(
    (d) => d !== null && d !== undefined && !Number.isNaN(d)
  );

  if (validData.length === 0) {
    console.error("No valid data available for histogram");
    return null;
  }

  // Hitung statistik deskriptif
  const mean = d3.mean(validData) ?? 0;
  const stdDev = d3.deviation(validData) ?? 1;
  const min = d3.min(validData) ?? 0;
  const max = d3.max(validData) ?? 10;

  // SPSS menggunakan formula yang lebih kompleks untuk binning
  // Menggunakan Scott's rule untuk bin width
  const binWidth = (3.5 * stdDev) / Math.pow(validData.length, 1 / 3);
  const binCount = Math.ceil((max - min) / binWidth);

  // Pastikan minimal 5 bins dan maksimal 20 bins
  const adjustedBinCount = Math.max(5, Math.min(20, binCount));

  // Extend range untuk kurva normal (4 standard deviations seperti SPSS)
  const extendedMin = Math.min(min, mean - 4 * stdDev);
  const extendedMax = Math.max(max, mean + 4 * stdDev);

  // Apply axis scale options if provided
  let x0Value = extendedMin;
  let x1Value = extendedMax;

  if (axisScaleOptions?.x) {
    if (axisScaleOptions.x.min !== undefined && axisScaleOptions.x.min !== "")
      x0Value = Number(axisScaleOptions.x.min);
    if (axisScaleOptions.x.max !== undefined && axisScaleOptions.x.max !== "")
      x1Value = Number(axisScaleOptions.x.max);
  }

  // Membuat bins dengan d3 menggunakan threshold yang lebih presisi
  const thresholds = d3.range(x0Value, x1Value + binWidth, binWidth);
  const bins = d3
    .bin()
    .domain([x0Value, x1Value])
    .thresholds(thresholds)
    .value((d: any) => d)(validData);

  // Calculate label widths for margin calculation
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";

  // Calculate Y domain
  let yMin = 0;
  let yMax = d3.max(bins, (d) => d.length) || 0;
  let majorIncrement = axisScaleOptions?.y?.majorIncrement
    ? Number(axisScaleOptions.y.majorIncrement)
    : undefined;

  if (axisScaleOptions?.y) {
    if (axisScaleOptions.y.min !== undefined && axisScaleOptions.y.min !== "")
      yMin = Number(axisScaleOptions.y.min);
    if (axisScaleOptions.y.max !== undefined && axisScaleOptions.y.max !== "")
      yMax = Number(axisScaleOptions.y.max);
  }

  // Calculate nice tick values
  const tickCount = Math.min(10, Math.floor(height / 50));
  const yTicks = d3.scaleLinear().domain([yMin, yMax]).nice().ticks(tickCount);

  // Calculate max label widths for margin
  const maxYLabelWidth =
    d3.max(yTicks.map((tick) => ctx.measureText(tick.toFixed(1)).width)) ?? 0;
  const maxXLabelWidth =
    d3.max(
      bins,
      (d) => ctx.measureText((d.x0 ?? 0).toFixed(1).toString()).width
    ) ?? 0;

  // Use responsive margin utility with label measurements
  const margin = calculateResponsiveMargin({
    width,
    height,
    useAxis,
    titleOptions,
    axisLabels,
    maxLabelWidth: Math.max(maxYLabelWidth, maxXLabelWidth),
  });

  // Menentukan skala untuk sumbu X
  const x = d3
    .scaleLinear()
    .domain([x0Value, x1Value])
    .range([margin.left, width - margin.right]);

  // Y scale with nice values
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

  // Menambahkan rectangle untuk setiap bin
  svg
    .append("g")
    .attr(
      "fill",
      Array.isArray(chartColors) && chartColors.length > 0
        ? chartColors[0]
        : "steelblue"
    )
    .selectAll("rect")
    .data(bins)
    .join("rect")
    .attr("x", (d) => x(d.x0 || 0) + 1)
    .attr("width", (d) => Math.max(1, x(d.x1 || 0) - x(d.x0 || 0) - 2))
    .attr("y", (d) => y(d.length))
    .attr("height", (d) => Math.max(0, y(0) - y(d.length)));

  // Tambahkan kurva normal jika diminta
  if (showNormalCurve) {
    // Buat data kurva normal dengan penskalaan yang sangat akurat seperti SPSS
    const normalCurveData = d3
      .range(x0Value, x1Value, (x1Value - x0Value) / 300)
      .map((xVal) => {
        // Normal PDF
        const pdf =
          (1 / (stdDev * Math.sqrt(2 * Math.PI))) *
          Math.exp(-0.5 * Math.pow((xVal - mean) / stdDev, 2));

        // Penskalaan SPSS yang akurat:
        // Area di bawah kurva normal = total frekuensi * bin width
        const totalFrequency = d3.sum(bins, (d) => d.length);
        const actualBinWidth = (x1Value - x0Value) / bins.length;

        // SPSS menggunakan penskalaan ini untuk memastikan area kurva = area histogram
        const scaledPdf = pdf * totalFrequency * actualBinWidth;

        return {
          x: xVal,
          y: scaledPdf,
        };
      });

    // Tambahkan path untuk kurva normal
    const line = d3
      .line<{ x: number; y: number }>()
      .x((d) => x(d.x))
      .y((d) => y(d.y))
      .curve(d3.curveBasis);

    svg
      .append("path")
      .datum(normalCurveData)
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 2.5)
      .attr("stroke-dasharray", "6,3")
      .attr("d", line);

    // Tambahkan legend untuk kurva normal dengan posisi yang lebih baik
    const legendGroup = svg.append("g").attr("class", "normal-curve-legend");

    // Legend line
    legendGroup
      .append("line")
      .attr("x1", width - margin.right - 100)
      .attr("x2", width - margin.right - 70)
      .attr("y1", margin.top + 25)
      .attr("y2", margin.top + 25)
      .attr("stroke", "red")
      .attr("stroke-width", 2.5)
      .attr("stroke-dasharray", "6,3");

    // Legend text
    legendGroup
      .append("text")
      .attr("x", width - margin.right - 65)
      .attr("y", margin.top + 30)
      .attr("font-size", "12px")
      .attr("fill", "black")
      .attr("font-weight", "500")
      .text("Normal Curve");

    // Tambahkan statistik deskriptif di legend
    legendGroup
      .append("text")
      .attr("x", width - margin.right - 100)
      .attr("y", margin.top + 45)
      .attr("font-size", "10px")
      .attr("fill", "gray")
      .text(`Mean: ${mean.toFixed(2)}, Std Dev: ${stdDev.toFixed(2)}`);
  }

  // Add standardized axes
  if (useAxis) {
    // Generate tick values based on majorIncrement or calculated tick count
    const tickValues = axisScaleOptions?.y?.majorIncrement
      ? getMajorTicks(yMin, yMax, Number(axisScaleOptions.y.majorIncrement))
      : yTicks;

    // Generate categories from bin boundaries
    const categories = bins.map((d) => (d.x0?.toFixed(1) || "0").toString());

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
        maxValueLength: 8,
        tickFormat: (d: any) => formatAxisNumber(d),
        showGridLines: true,
      },
      yAxisOptions: {
        customFormat: formatAxisNumber,
        showGridLines: false,
        maxValueLength: 6,
        tickValues,
        showAxis: true,
        showTicks: true,
        showValues: true,
        showAxisLabel: true,
      },
    });
  }

  return svg.node();
};
