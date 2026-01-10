export interface Chart {
  chartType: string;
  chartMetadata: ChartMetadata;
  chartData: any[];
  chartConfig: ChartConfig;
}

export interface ChartMetadata {
  axisInfo: AxisInfo;
  description: string;
  notes: string | null;
  title: string;
  subtitle: string;
}

export interface AxisInfo {
  x: string;
  y: string;
  category: string;
}

export interface ChartConfig {
  width: number;
  height: number;
  useAxis: boolean;
  useLegend: boolean;
  axisLabels: {
    x: string;
    y: string;
  };
  chartColor?: string[];
  statistic?: "mean" | "median" | "mode" | "min" | "max";
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
  };
}
