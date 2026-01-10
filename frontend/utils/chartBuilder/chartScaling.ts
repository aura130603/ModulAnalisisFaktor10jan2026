import * as d3 from "d3";

interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface AxisScaleOptions {
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

export interface ChartScales {
  x: d3.ScaleBand<string>;
  y: d3.ScaleLinear<number, number>;
  numTicks: number;
}

export const createChartScales = (
  data: { category: string; value: number }[],
  width: number,
  height: number,
  margin: Margin,
  axisScaleOptions?: AxisScaleOptions
): ChartScales => {
  // X scale (band)
  const x = d3
    .scaleBand()
    .domain(data.map((d) => d.category))
    .range([margin.left, width - margin.right])
    .padding(0.1);

  // Y scale (linear)
  let yMin = 0;
  let yMax = d3.max(data, (d) => d.value) as number;

  if (axisScaleOptions?.y) {
    if (axisScaleOptions.y.min !== undefined && axisScaleOptions.y.min !== "") {
      yMin = Number(axisScaleOptions.y.min);
    }
    if (axisScaleOptions.y.max !== undefined && axisScaleOptions.y.max !== "") {
      yMax = Number(axisScaleOptions.y.max);
    }
  }

  const y = d3
    .scaleLinear()
    .domain([yMin, yMax])
    .range([height - margin.bottom, margin.top]);

  // Calculate number of ticks
  let numTicks = 5;
  if (
    axisScaleOptions?.y?.majorIncrement &&
    axisScaleOptions.y.majorIncrement !== ""
  ) {
    const increment = Number(axisScaleOptions.y.majorIncrement);
    if (!isNaN(increment) && increment > 0) {
      numTicks = Math.floor((yMax - yMin) / increment) + 1;
    }
  }

  return { x, y, numTicks };
};

// Utility function untuk validasi dan transformasi data
export const validateAndTransformData = (
  data: any[],
  axisScaleOptions?: AxisScaleOptions
) => {
  // Filter out invalid data
  const validData = data.filter(
    (d) =>
      typeof d.category === "string" &&
      typeof d.value === "number" &&
      !isNaN(d.value)
  );

  // Transform data if needed (e.g., apply min/max constraints)
  if (axisScaleOptions?.y) {
    const min = axisScaleOptions.y.min
      ? Number(axisScaleOptions.y.min)
      : undefined;
    const max = axisScaleOptions.y.max
      ? Number(axisScaleOptions.y.max)
      : undefined;

    if (min !== undefined || max !== undefined) {
      return validData.map((d) => ({
        ...d,
        value: Math.min(Math.max(d.value, min ?? -Infinity), max ?? Infinity),
      }));
    }
  }

  return validData;
};
