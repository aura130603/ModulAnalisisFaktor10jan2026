import type { Variable } from "@/types/Variable";
import { BaseModalProps } from "@/types/modalTypes";

// === Statistics Options ===
export interface PercentileOptions {
    quartiles: boolean;
    cutPoints: boolean;
    cutPointsN: number;
    enablePercentiles: boolean;
    percentilesList: string[];
}

export interface CentralTendencyOptions {
    mean: boolean;
    median: boolean;
    mode: boolean;
    sum: boolean;
}

export interface DispersionOptions {
    stddev: boolean;
    variance: boolean;
    range: boolean;
    minimum: boolean;
    maximum: boolean;
    stdErrorMean: boolean;
}

export interface DistributionOptions {
    skewness: boolean;
    stdErrorSkewness: boolean;
    kurtosis: boolean;
    stdErrorKurtosis: boolean;
}

export interface StatisticsOptions {
    percentileValues: PercentileOptions;
    centralTendency: CentralTendencyOptions;
    dispersion: DispersionOptions;
    distribution: DistributionOptions;
}

// === Chart Options ===
export interface ChartOptions {
    type: "barCharts" | "pieCharts" | "histograms" | null;
    values: "frequencies" | "percentages";
    showNormalCurveOnHistogram: boolean;
}

// === Main Hook Params ===
export interface FrequenciesAnalysisParams extends Pick<BaseModalProps, 'onClose'> {
    selectedVariables: Variable[];
    showFrequencyTables: boolean;
    showStatistics: boolean;
    statisticsOptions: StatisticsOptions | null;
    showCharts: boolean;
    chartOptions: ChartOptions | null;
}

// === Worker I/O Types ===
export interface WorkerInput {
    variableData: {
        variable: Variable;
        data: (string | number | null | undefined)[];
    }[];
    weightVariableData: number[] | null;
    options: {
        displayFrequency: boolean;
        displayDescriptive: boolean;
        statisticsOptions: StatisticsOptions | null;
        chartOptions: ChartOptions | null;
    };
}

export interface FrequencyTableRow {
    label: string;
    frequency: number;
    percent?: number;
    validPercent?: number;
    cumulativePercent?: number;
}

export interface FrequencyTable {
    title: string;
    rows: FrequencyTableRow[];
    summary: {
        valid: number;
        missing: number;
        total: number;
    };
}

export interface DescriptiveStatistics {
    N?: number;
    Missing?: number;
    Mean?: number | null;
    Median?: number | null;
    Mode?: number | null;
    Sum?: number | null;
    StdDev?: number | null;
    Variance?: number | null;
    Minimum?: number | null;
    Maximum?: number | null;
    Range?: number | null;
    SEMean?: number | null;
    Kurtosis?: number | null;
    SEKurtosis?: number | null;
    Skewness?: number | null;
    SESkewness?: number | null;
    Percentiles?: { [key: string]: number | null };
}

export interface CombinedResults {
    statistics: { [variableName: string]: DescriptiveStatistics };
    frequencyTables: { [variableName: string]: FrequencyTable };
}

export interface WorkerResult {
    success: boolean;
    results?: CombinedResults;
    error?: string;
}

export interface FrequenciesResult {
    variable: Variable;
    stats?: DescriptiveStatistics;
    frequencyTable?: FrequencyTable;
}

export interface TableColumnHeader {
  header: string;
  key?: string;
  children?: TableColumnHeader[];
}

export interface TableRow {
  rowHeader: string[];
  [key: string]: any;
}