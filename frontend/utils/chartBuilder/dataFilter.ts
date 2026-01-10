// Utility to filter data by axis min/max for both X and Y (or custom fields)
export function filterDataByAxisRange(
  data: any[],
  axisScaleOptions?: {
    x?: { min?: string | number; max?: string | number };
    y?: { min?: string | number; max?: string | number };
    [key: string]: any; // for custom axis/fields
  },
  fieldMap: { x?: string; y?: string } = { x: "category", y: "value" }
) {
  return data.filter((d) => {
    // X axis filtering
    if (axisScaleOptions?.x) {
      const xField = fieldMap.x || "category";
      const xVal = Number(d[xField]);
      if (
        axisScaleOptions.x.min !== undefined &&
        axisScaleOptions.x.min !== "" &&
        xVal < Number(axisScaleOptions.x.min)
      )
        return false;
      if (
        axisScaleOptions.x.max !== undefined &&
        axisScaleOptions.x.max !== "" &&
        xVal > Number(axisScaleOptions.x.max)
      )
        return false;
    }
    // Y axis filtering
    if (axisScaleOptions?.y) {
      const yField = fieldMap.y || "value";
      const yVal = Number(d[yField]);
      if (
        axisScaleOptions.y.min !== undefined &&
        axisScaleOptions.y.min !== "" &&
        yVal < Number(axisScaleOptions.y.min)
      )
        return false;
      if (
        axisScaleOptions.y.max !== undefined &&
        axisScaleOptions.y.max !== "" &&
        yVal > Number(axisScaleOptions.y.max)
      )
        return false;
    }
    return true;
  });
}
