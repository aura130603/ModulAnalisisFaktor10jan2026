import * as d3 from "d3";
import {
  ChartTitleOptions,
  addChartTitle,
  generateAxisTicks,
  formatAxisNumber,
  addStandardAxes,
} from "./chartUtils";
import {
  createStandardSVG,
  addLegend,
  calculateLegendPosition,
} from "../chartUtils";
import { calculateResponsiveMargin } from "../responsiveMarginUtils";
import { defaultChartColors } from "../defaultStyles/defaultColors";

export const createBarAndLineChart = (
  data: { [key: string]: any }[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: ChartTitleOptions,
  axisLabels?: { x?: string; y1?: string; y2?: string },
  axisScaleOptions?: {
    x?: {
      min?: string;
      max?: string;
      majorIncrement?: string;
      origin?: string;
    };
    y1?: {
      min?: string;
      max?: string;
      majorIncrement?: string;
      origin?: string;
    };
    y2?: {
      min?: string;
      max?: string;
      majorIncrement?: string;
      origin?: string;
    };
  },
  chartColors?: string[]
) => {
  console.log("Creating combined chart with data:", data);

  // Ambil key dinamis urut: X, Bar, Line
  const dataKeys = Object.keys(data[0] || {});
  const keyX = dataKeys[0] || "x";
  const keyBar = dataKeys[1] || "barValue";
  const keyLine = dataKeys[2] || "lineValue";

  // Filter data
  const filteredData = data.filter(
    (d) =>
      d[keyBar] != null &&
      d[keyLine] != null &&
      !isNaN(d[keyBar]) &&
      !isNaN(d[keyLine]) &&
      d[keyX] != null &&
      d[keyX] !== " "
  );

  if (filteredData.length === 0) {
    console.error("No valid data available for the bar and line chart");
    return null;
  }

  // Create a canvas context for measuring text
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";

  // Calculate max label width for margin calculation
  const categories = filteredData.map((d) => d[keyX]);
  const yValues = filteredData.flatMap((d) => [d[keyBar], d[keyLine]]);
  const yTicks = d3
    .scaleLinear()
    .domain([Math.min(...yValues), Math.max(...yValues)])
    .nice()
    .ticks(5);
  const maxLabelWidth = Math.max(
    ...yTicks.map((tick) => ctx.measureText(formatAxisNumber(tick)).width)
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
    itemCount: 2, // Bar and Line
  });

  // For small preview charts, reduce margins to make chart larger
  const isPreview = width < 150 || height < 150;
  if (isPreview) {
    margin.top = Math.max(2, margin.top * 0.2);
    margin.right = Math.max(2, margin.right * 0.2);
    margin.bottom = Math.max(8, margin.bottom * 0.4);
    margin.left = Math.max(8, margin.left * 0.4);
  } else {
    // Increase right margin for legend and second axis only for full-size charts
    margin.right += 20;
  }

  // Definisi X axis
  const x = d3
    .scaleBand()
    .domain(filteredData.map((d) => d[keyX]))
    .range([margin.left, width - margin.right])
    .padding(0.1);

  // Definisi Y1 axis (untuk Bar) dengan axis scale options
  let y1Min = Math.min(0, d3.min(filteredData, (d) => d[keyBar]) as number);
  let y1Max = Math.max(d3.max(filteredData, (d) => d[keyBar]) as number);
  if (axisScaleOptions?.y1) {
    if (axisScaleOptions.y1.min !== undefined && axisScaleOptions.y1.min !== "")
      y1Min = Number(axisScaleOptions.y1.min);
    if (axisScaleOptions.y1.max !== undefined && axisScaleOptions.y1.max !== "")
      y1Max = Number(axisScaleOptions.y1.max);
  }

  const y = d3
    .scaleLinear()
    .domain([y1Min, y1Max])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Definisi Y2 axis (untuk Line) - independent domain
  let y2Min = Math.min(0, d3.min(filteredData, (d) => d[keyLine]) as number);
  let y2Max = Math.max(d3.max(filteredData, (d) => d[keyLine]) as number);
  if (axisScaleOptions?.y2) {
    if (axisScaleOptions.y2.min !== undefined && axisScaleOptions.y2.min !== "")
      y2Min = Number(axisScaleOptions.y2.min);
    if (axisScaleOptions.y2.max !== undefined && axisScaleOptions.y2.max !== "")
      y2Max = Number(axisScaleOptions.y2.max);
  }

  const y2 = d3
    .scaleLinear()
    .domain([y2Min, y2Max])
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

  if (useAxis) {
    // Add standard axes for X and Y1
    addStandardAxes(svg, {
      xScale: x,
      yScale: y,
      width,
      height,
      marginTop: margin.top,
      marginRight: margin.right,
      marginBottom: margin.bottom,
      marginLeft: margin.left,
      axisLabels: { x: axisLabels?.x, y: axisLabels?.y1 },
      yMin: y1Min,
      yMax: y1Max,
      chartType: "vertical",
      categories: filteredData.map((d) => d[keyX].toString()),
      xAxisOptions: {
        showGridLines: true,
        customFormat: formatAxisNumber,
      },
      yAxisOptions: {
        showGridLines: false,
        tickValues: axisScaleOptions?.y1?.majorIncrement
          ? generateAxisTicks(
              y1Min,
              y1Max,
              Number(axisScaleOptions.y1.majorIncrement)
            )
          : undefined,
        customFormat: formatAxisNumber,
      },
    });

    // Style Y1 axis to match bar color
    svg
      .selectAll(".y-axis .tick text")
      .attr("fill", chartColors?.[0] || defaultChartColors[0]);

    // Add Y2 axis only for full-size charts
    if (!isPreview) {
      const y2Axis = d3.axisRight(y2);
      if (axisScaleOptions?.y2?.majorIncrement) {
        const y2Ticks = generateAxisTicks(
          y2Min,
          y2Max,
          Number(axisScaleOptions.y2.majorIncrement)
        );
        if (y2Ticks) {
          y2Axis.tickValues(y2Ticks);
        }
      }
      y2Axis.tickFormat((d) => formatAxisNumber(d as number));

      const y2AxisG = svg
        .append("g")
        .attr("class", "y2-axis")
        .attr("transform", `translate(${width - margin.right}, 0)`)
        .call(y2Axis);

      // Style Y2 axis to match line color
      y2AxisG
        .selectAll(".tick text")
        .attr("fill", chartColors?.[1] || defaultChartColors[1]);

      // Add Y2 axis label if provided
      if (axisLabels?.y2) {
        svg
          .append("text")
          .attr("class", "y2-axis-label")
          .attr("transform", "rotate(-90)")
          .attr("y", width - margin.right + 40)
          .attr("x", -(height - margin.bottom + margin.top) / 2)
          .attr("text-anchor", "middle")
          .attr("fill", chartColors?.[1] || defaultChartColors[1])
          .text(axisLabels.y2);
      }
    }
  }

  // Bar chart
  svg
    .append("g")
    .attr("fill", chartColors?.[0] || defaultChartColors[0])
    .selectAll("rect")
    .data(filteredData)
    .join("rect")
    .attr("x", (d) => x(d[keyX]) || 0)
    .attr("y", (d) => y(Math.max(0, d[keyBar])))
    .attr("height", (d) => Math.abs(y(d[keyBar]) - y(0)))
    .attr("width", isPreview ? x.bandwidth() * 0.8 : x.bandwidth());

  // Line chart
  const line = d3
    .line<{ [key: string]: any }>()
    .x((d) => x(d[keyX])! + x.bandwidth() / 2)
    .y((d) => y2(d[keyLine])!);

  svg
    .append("path")
    .datum(filteredData)
    .attr("fill", "none")
    .attr("stroke", chartColors?.[1] || defaultChartColors[1])
    .attr("stroke-width", isPreview ? 1 : 1.5)
    .attr("d", line);

  // Points for the line
  svg
    .selectAll(".dot")
    .data(filteredData)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("cx", (d) => x(d[keyX])! + x.bandwidth() / 2)
    .attr("cy", (d) => y2(d[keyLine]))
    .attr("r", isPreview ? 2 : 4)
    .attr("fill", chartColors?.[1] || defaultChartColors[1]);

  // Add legend
  const legendItems = [
    { label: keyBar, color: chartColors?.[0] || defaultChartColors[0] },
    { label: keyLine, color: chartColors?.[1] || defaultChartColors[1] },
  ];

  const legendPosition = calculateLegendPosition({
    width,
    height,
    marginLeft: margin.left,
    marginRight: margin.right,
    marginBottom: margin.bottom,
    marginTop: margin.top,
    legendPosition: "right",
    itemCount: legendItems.length,
    dualAxes: true,
  });

  addLegend({
    svg,
    colorScale: d3
      .scaleOrdinal<string>()
      .domain(legendItems.map((item) => item.label))
      .range(legendItems.map((item) => item.color)),
    position: legendPosition,
    legendPosition: "right",
    itemWidth: isPreview ? 10 : 15,
    itemHeight: isPreview ? 10 : 15,
    fontSize: isPreview ? 9 : 12,
  });

  return svg.node();
};

export const createDualAxesScatterPlot = (
  data: { [key: string]: any }[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: ChartTitleOptions,
  axisLabels?: { x?: string; y1?: string; y2?: string },
  axisScaleOptions?: {
    x?: {
      min?: string;
      max?: string;
      majorIncrement?: string;
      origin?: string;
    };
    y1?: {
      min?: string;
      max?: string;
      majorIncrement?: string;
      origin?: string;
    };
    y2?: {
      min?: string;
      max?: string;
      majorIncrement?: string;
      origin?: string;
    };
  },
  chartColors?: string[]
) => {
  // Get dynamic column names from first data item
  const dataKeys = Object.keys(data[0] || {});
  const xKey = dataKeys.find((key) => key !== "y1" && key !== "y2") || "x";
  const y1Key = dataKeys.find((key) => key !== xKey && key !== "y2") || "y1";
  const y2Key = dataKeys.find((key) => key !== xKey && key !== y1Key) || "y2";

  const validData = data.filter(
    (d) =>
      d[xKey] !== null &&
      d[y1Key] !== null &&
      d[y2Key] !== null &&
      d[xKey] !== undefined &&
      d[y1Key] !== undefined &&
      d[y2Key] !== undefined &&
      !isNaN(d[xKey]) &&
      !isNaN(d[y1Key]) &&
      !isNaN(d[y2Key])
  );

  console.log("Creating dual axis scatter plot with valid data:", validData);

  if (validData.length === 0) {
    console.error("No valid data available for the scatter plot");
    return null;
  }

  // Create a canvas context for measuring text
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";

  // Calculate max label width for margin calculation
  const xValues = validData.map((d) => d[xKey]);
  const yValues = validData.flatMap((d) => [d[y1Key], d[y2Key]]);
  const yTicks = d3
    .scaleLinear()
    .domain([Math.min(...yValues), Math.max(...yValues)])
    .nice()
    .ticks(5);
  const maxLabelWidth = Math.max(
    ...yTicks.map((tick) => ctx.measureText(formatAxisNumber(tick)).width)
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
    hasLegend: true,
    legendPosition: "right",
  });

  // Increase right margin for legend and second axis
  margin.right += 20;

  // Skala untuk sumbu X dengan axis scale options
  let xMin = d3.min(validData, (d) => d[xKey]) as number;
  let xMax = d3.max(validData, (d) => d[xKey]) as number;
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

  // Skala untuk sumbu Y1 dengan axis scale options
  let y1Min = d3.min(validData, (d) => d[y1Key]) as number;
  let y1Max = d3.max(validData, (d) => d[y1Key]) as number;
  if (axisScaleOptions?.y1) {
    if (axisScaleOptions.y1.min !== undefined && axisScaleOptions.y1.min !== "")
      y1Min = Number(axisScaleOptions.y1.min);
    if (axisScaleOptions.y1.max !== undefined && axisScaleOptions.y1.max !== "")
      y1Max = Number(axisScaleOptions.y1.max);
  }

  const y1 = d3
    .scaleLinear()
    .domain([y1Min, y1Max])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Skala untuk sumbu Y2 dengan axis scale options
  let y2Min = d3.min(validData, (d) => d[y2Key]) as number;
  let y2Max = d3.max(validData, (d) => d[y2Key]) as number;
  if (axisScaleOptions?.y2) {
    if (axisScaleOptions.y2.min !== undefined && axisScaleOptions.y2.min !== "")
      y2Min = Number(axisScaleOptions.y2.min);
    if (axisScaleOptions.y2.max !== undefined && axisScaleOptions.y2.max !== "")
      y2Max = Number(axisScaleOptions.y2.max);
  }

  const y2 = d3
    .scaleLinear()
    .domain([y2Min, y2Max])
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

  if (useAxis) {
    // Add standard axes for X and Y1
    addStandardAxes(svg, {
      xScale: x,
      yScale: y1,
      width,
      height,
      marginTop: margin.top,
      marginRight: margin.right,
      marginBottom: margin.bottom,
      marginLeft: margin.left,
      axisLabels: { x: axisLabels?.x, y: axisLabels?.y1 },
      yMin: y1Min,
      yMax: y1Max,
      chartType: "vertical",
      categories: validData.map((d) => d[xKey].toString()),
      xAxisOptions: {
        showGridLines: true,
        tickValues: axisScaleOptions?.x?.majorIncrement
          ? generateAxisTicks(
              xMin,
              xMax,
              Number(axisScaleOptions.x.majorIncrement)
            )
          : undefined,
        customFormat: formatAxisNumber,
      },
      yAxisOptions: {
        showGridLines: true,
        tickValues: axisScaleOptions?.y1?.majorIncrement
          ? generateAxisTicks(
              y1Min,
              y1Max,
              Number(axisScaleOptions.y1.majorIncrement)
            )
          : undefined,
        customFormat: formatAxisNumber,
      },
    });

    // Style Y1 axis to match chart color
    svg
      .selectAll(".y-axis .tick text")
      .attr("fill", chartColors?.[0] || defaultChartColors[0]);
    svg
      .selectAll(".y-axis .domain, .y-axis .tick line")
      .attr("stroke", chartColors?.[0] || defaultChartColors[0]);

    // Add Y2 axis with custom styling
    const y2Axis = d3
      .axisRight(y2)
      .tickFormat((v) => formatAxisNumber(v as number));
    if (axisScaleOptions?.y2?.majorIncrement) {
      const ticks = generateAxisTicks(
        y2Min,
        y2Max,
        Number(axisScaleOptions.y2.majorIncrement)
      );
      if (ticks) y2Axis.tickValues(ticks);
    }

    const y2AxisGroup = svg
      .append("g")
      .attr("transform", `translate(${width - margin.right}, 0)`)
      .call(y2Axis);

    // Style Y2 axis
    y2AxisGroup
      .selectAll(".tick text")
      .attr("fill", chartColors?.[1] || defaultChartColors[1]);
    y2AxisGroup
      .selectAll(".domain, .tick line")
      .attr("stroke", chartColors?.[1] || defaultChartColors[1]);

    // Add Y2 axis label
    if (axisLabels?.y2) {
      svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", width - margin.right + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", chartColors?.[1] || defaultChartColors[1])
        .text(axisLabels.y2);
    }
  }

  // Add scatter points for Y1
  svg
    .append("g")
    .selectAll("circle")
    .data(validData)
    .join("circle")
    .attr("cx", (d) => x(d[xKey]))
    .attr("cy", (d) => y1(d[y1Key]))
    .attr("r", 3)
    .attr("fill", chartColors?.[0] || defaultChartColors[0]);

  // Add scatter points for Y2
  svg
    .append("g")
    .selectAll("circle")
    .data(validData)
    .join("circle")
    .attr("cx", (d) => x(d[xKey]))
    .attr("cy", (d) => y2(d[y2Key]))
    .attr("r", 3)
    .attr("fill", chartColors?.[1] || defaultChartColors[1]);

  if (useAxis) {
    // Add legend with dynamic labels
    const legendItems = [
      { label: y1Key, color: chartColors?.[0] || defaultChartColors[0] },
      { label: y2Key, color: chartColors?.[1] || defaultChartColors[1] },
    ];

    const legendPosition = calculateLegendPosition({
      width,
      height,
      marginLeft: margin.left,
      marginRight: margin.right,
      marginBottom: margin.bottom,
      marginTop: margin.top,
      legendPosition: "right",
      itemCount: legendItems.length,
      dualAxes: true,
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
  }

  return svg.node();
};
