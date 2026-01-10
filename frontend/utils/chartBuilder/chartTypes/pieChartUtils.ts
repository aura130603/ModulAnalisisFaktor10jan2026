import { addChartTitle, ChartTitleOptions } from "./chartUtils";
import {
  addLegend,
  createStandardSVG,
  calculateLegendPosition,
  SVGCreationOptions,
  LegendOptions,
  LegendPositionOptions,
} from "../chartUtils";
import { calculateResponsiveMargin } from "../responsiveMarginUtils";
import * as d3 from "d3";

import { d3ColorScales } from "../defaultStyles/defaultColors";

// Combine multiple categorical schemes for more color options
const getExtendedColorScheme = () => {
  const colors = [];
  // Add Category10
  colors.push(...d3ColorScales.categorical[0].colors);
  // Add Observable10
  colors.push(...d3ColorScales.categorical[1].colors);
  // Add Accent
  colors.push(...d3ColorScales.categorical[2].colors);
  // Add Dark2
  colors.push(...d3ColorScales.categorical[3].colors);
  // Add Paired
  colors.push(...d3ColorScales.categorical[4].colors);
  // Add Pastel1
  colors.push(...d3ColorScales.categorical[5].colors);
  // Add Pastel2
  colors.push(...d3ColorScales.categorical[6].colors);
  // Add Set1
  colors.push(...d3ColorScales.categorical[7].colors);
  // Add Set2
  colors.push(...d3ColorScales.categorical[8].colors);
  // Add Set3
  colors.push(...d3ColorScales.categorical[9].colors);
  // Add Tableau10
  colors.push(...d3ColorScales.categorical[10].colors);

  return colors;
};

const colorScheme = getExtendedColorScheme();

export const createPieChart = (
  data: { category: string; value: number }[],
  width: number = 800,
  height: number = Math.min(width, 500),
  useAxis: boolean = true,
  titleOptions?: ChartTitleOptions,
  chartColors?: string[]
) => {
  const validData = data.filter(
    (d) =>
      typeof d.category === "string" &&
      typeof d.value === "number" &&
      d.value >= 0
  );

  if (validData.length === 0) {
    console.error("No valid data available for the pie chart");
    return null;
  }

  // Only use as many colors as there are categories
  const categories = validData.map((d) => d.category);
  const usedColors = (chartColors || colorScheme).slice(0, categories.length);

  const color = d3.scaleOrdinal<string>().domain(categories).range(usedColors);

  const pie = d3
    .pie<{ category: string; value: number }>()
    .sort(null)
    .value((d) => d.value);

  // Calculate label widths for margin calculation
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "12px sans-serif";
  const maxLabelWidth = Math.max(
    ...validData.map((d) => ctx.measureText(d.category).width)
  );

  // Calculate responsive margins with proper label consideration
  const margin = calculateResponsiveMargin({
    width,
    height,
    useAxis,
    titleOptions,
    hasLegend: true,
    legendPosition: "right",
    maxLabelWidth,
    categories: categories,
    itemCount: categories.length,
  });

  // For small preview charts, use minimal margins
  const isSmallChart = width < 200 || height < 200;

  const adjustedMargin = isSmallChart
    ? {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10,
      }
    : {
        ...margin,
        right: Math.max(margin.right, 250), // Increased right margin for legend
        bottom: Math.max(margin.bottom, 50),
      };

  // Calculate dimensions with margins
  const chartWidth = width - adjustedMargin.left - adjustedMargin.right;
  const chartHeight = height - adjustedMargin.top - adjustedMargin.bottom;

  // For small charts, use larger scale factor
  const scaleFactor = isSmallChart ? 1 : 1;
  const outerRadius = Math.max(
    10,
    (Math.min(chartWidth, chartHeight) / 2) * scaleFactor
  );
  const labelRadius = outerRadius * 1.1;

  const arc = d3
    .arc<d3.PieArcDatum<{ category: string; value: number }>>()
    .innerRadius(0)
    .outerRadius(outerRadius);

  const outerArc = d3
    .arc<d3.PieArcDatum<{ category: string; value: number }>>()
    .innerRadius(labelRadius)
    .outerRadius(labelRadius);

  const arcs = pie(validData);

  // Create SVG with standard utility and adjusted margins
  const svg = createStandardSVG({
    width,
    height,
    marginTop: adjustedMargin.top,
    marginRight: adjustedMargin.right,
    marginBottom: adjustedMargin.bottom,
    marginLeft: adjustedMargin.left,
  } as SVGCreationOptions);

  // Add title if provided - now with proper margin-aware positioning
  if (titleOptions) {
    addChartTitle(svg, {
      ...titleOptions,
      marginTop: adjustedMargin.top,
      useResponsivePositioning: true,
    });
  }

  // Draw pie slices - center for small charts, left-shifted for large charts
  const chartGroup = svg
    .append("g")
    .attr(
      "transform",
      `translate(${
        adjustedMargin.left + chartWidth * (isSmallChart ? 0.5 : 0.35)
      }, ${adjustedMargin.top + chartHeight / 2})`
    );

  chartGroup
    .append("g")
    .attr("stroke", "white")
    .selectAll("path")
    .data(arcs)
    .join("path")
    .attr(
      "fill",
      (d: d3.PieArcDatum<{ category: string; value: number }>) =>
        color(d.data.category) as string
    )
    .attr("d", arc)
    .append("title")
    .text(
      (d: d3.PieArcDatum<{ category: string; value: number }>) =>
        `${d.data.category}`
    );

  if (useAxis && !isSmallChart) {
    // Add legend using the improved legend utility (only for large charts)
    const legendPosition = calculateLegendPosition({
      width,
      height,
      marginLeft: adjustedMargin.left,
      marginRight: adjustedMargin.right,
      marginBottom: adjustedMargin.bottom,
      marginTop: adjustedMargin.top,
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

  return svg.node();
};

export const createDonutChart = (
  data: { category: string; value: number }[],
  width: number,
  height: number,
  useAxis: boolean = true,
  chartColors?: string[]
) => {
  // ... existing code ...
  const color = d3
    .scaleOrdinal<string>()
    .domain(data.map((d) => d.category))
    .range(chartColors || colorScheme);
  // ... existing code ...
};
