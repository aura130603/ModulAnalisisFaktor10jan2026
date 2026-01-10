import type { DescriptiveResult, DescriptiveStatisticsOptions, DisplayOrderType } from '../types';
import { spssDateTypes } from '@/types/Variable';
import { spssSecondsToDateString } from '@/lib/spssDateConverter';

// Konstanta untuk precision yang konsisten
const STATS_DECIMAL_PLACES = 2;

export interface DescriptiveTable {
  title: string;
  columnHeaders: TableColumnHeader[];
  rows: TableRow[];
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

/**
 * Formats the raw statistics data into a table structure for display.
 * @param results - Array of analysis results from the worker.
 * @returns A formatted table object for descriptive statistics.
 */
export const formatDescriptiveTable = (results: DescriptiveResult[]): any => {
    if (!results || results.length === 0) return null;

    const columnHeaders: TableColumnHeader[] = [
        { header: "", key: "" },
        { header: "N", children: [{ header: "Statistic", key: "N_Statistic" }] },
        { header: "Range", children: [{ header: "Statistic", key: "Range_Statistic" }] },
        { header: "Minimum", children: [{ header: "Statistic", key: "Minimum_Statistic" }] },
        { header: "Maximum", children: [{ header: "Statistic", key: "Maximum_Statistic" }] },
        { header: "Sum", children: [{ header: "Statistic", key: "Sum_Statistic" }] },
        { header: "Mean", children: [
            { header: "Statistic", key: "Mean_Statistic" },
            { header: "Std. Error", key: "Mean_StdError" }
        ]},
        { header: "Std. Deviation", children: [{ header: "Statistic", key: "StdDeviation_Statistic" }] },
        { header: "Variance", children: [{ header: "Statistic", key: "Variance_Statistic" }] },
        { header: "Skewness", children: [
            { header: "Statistic", key: "Skewness_Statistic" },
            { header: "Std. Error", key: "Skewness_StdError" }
        ]},
        { header: "Kurtosis", children: [
            { header: "Statistic", key: "Kurtosis_Statistic" },
            { header: "Std. Error", key: "Kurtosis_StdError" }
        ]}
    ];

    let validNListwise = Infinity;

    const rows: TableRow[] = results
        .filter(result => result.stats)
        .map(result => {
            const stats = result.stats!;
            if (stats.N < validNListwise) {
                validNListwise = stats.N;
            }

            const row: TableRow = {
                rowHeader: [result.variable.label || result.variable.name],
                N_Statistic: stats.N,
                Range_Statistic: stats.Range?.toFixed(STATS_DECIMAL_PLACES),
                Minimum_Statistic: stats.Minimum?.toFixed(STATS_DECIMAL_PLACES),
                Maximum_Statistic: stats.Maximum?.toFixed(STATS_DECIMAL_PLACES),
                Sum_Statistic: stats.Sum?.toFixed(STATS_DECIMAL_PLACES),
                Mean_Statistic: stats.Mean?.toFixed(STATS_DECIMAL_PLACES),
                Mean_StdError: stats.SEMean?.toFixed(STATS_DECIMAL_PLACES),
                StdDeviation_Statistic: stats.StdDev?.toFixed(STATS_DECIMAL_PLACES),
                Variance_Statistic: stats.Variance?.toFixed(STATS_DECIMAL_PLACES),
                Skewness_Statistic: stats.Skewness?.toFixed(STATS_DECIMAL_PLACES),
                Skewness_StdError: stats.SESkewness?.toFixed(STATS_DECIMAL_PLACES),
                Kurtosis_Statistic: stats.Kurtosis?.toFixed(STATS_DECIMAL_PLACES),
                Kurtosis_StdError: stats.SEKurtosis?.toFixed(STATS_DECIMAL_PLACES),
            };
            return row;
        });

    if (results.length > 0) {
        rows.push({
            rowHeader: ["Valid N (listwise)"],
            N_Statistic: validNListwise === Infinity ? 0 : validNListwise,
        });
    }

    return {
        tables: [{
            title: "Descriptive Statistics",
            columnHeaders: columnHeaders,
            rows: rows,
        }]
    };
};

/**
 * Memformat data statistik mentah menjadi struktur tabel untuk UI (versi final yang disederhanakan)
 */
export function formatDescriptiveTableOld(
  data: DescriptiveResult[],
  displayStatistics: DescriptiveStatisticsOptions,
  displayOrder: DisplayOrderType = 'variableList'
): DescriptiveTable {
  
  // ------------------------------------------------------------------
  // 1. Build Multi-level Column Headers (SPSS-style)
  // ------------------------------------------------------------------
  const columnHeaders: TableColumnHeader[] = [{ header: "" }];

  const addSingleStatHeader = (label: string, key: string) => {
    columnHeaders.push({ header: label, children: [{ header: "Statistic", key }] });
  };

  // Always include N and Missing
  addSingleStatHeader("N", "N");
  addSingleStatHeader("Missing", "Missing");
  addSingleStatHeader("Valid", "Valid");

  // Detect stats that depend on measurement (Mode, Percentiles)
  const includeMode = data.some(({ stats }) => stats && (stats as any).Mode !== undefined);
  const includePercentiles = data.some(({ stats }) => stats && (((stats as any)["25th Percentile"]) !== undefined || ((stats as any)["75th Percentile"]) !== undefined));
  if (includeMode) addSingleStatHeader("Mode", "Mode");

  if (displayStatistics.range) addSingleStatHeader("Range", "Range");
  if (displayStatistics.minimum) addSingleStatHeader("Minimum", "Minimum");
  if (displayStatistics.maximum) addSingleStatHeader("Maximum", "Maximum");
  if (displayStatistics.sum) addSingleStatHeader("Sum", "Sum");

  // Mean (Statistic + Std. Error when requested)
  if (displayStatistics.mean) {
    const meanChildren: TableColumnHeader[] = [{ header: "Statistic", key: "Mean" }];
    if (displayStatistics.standardError) {
      meanChildren.push({ header: "Std. Error", key: "SEMean" });
    }
    columnHeaders.push({ header: "Mean", children: meanChildren });
  }

  if (displayStatistics.stdDev) addSingleStatHeader("Std. Deviation", "StdDev");
  if (displayStatistics.variance) addSingleStatHeader("Variance", "Variance");

  // Skewness & Kurtosis (each may include Std. Error)
  if (displayStatistics.skewness) {
    const skewChildren: TableColumnHeader[] = [{ header: "Statistic", key: "Skewness" }];
    if (displayStatistics.skewness) {
      skewChildren.push({ header: "Std. Error", key: "SESkewness" });
    }
    columnHeaders.push({ header: "Skewness", children: skewChildren });
  }

  if (displayStatistics.kurtosis) {
    const kurtChildren: TableColumnHeader[] = [{ header: "Statistic", key: "Kurtosis" }];
    if (displayStatistics.kurtosis) {
      kurtChildren.push({ header: "Std. Error", key: "SEKurtosis" });
    }
    columnHeaders.push({ header: "Kurtosis", children: kurtChildren });
  }

  if (includePercentiles) {
    addSingleStatHeader("25th Percentile", "25th Percentile");
    addSingleStatHeader("75th Percentile", "75th Percentile");
  }

  // ------------------------------------------------------------------
  // 2. Sort data based on display order
  // ------------------------------------------------------------------
  const sortedStats = [...data].sort((a, b) => {
    switch (displayOrder) {
      case 'alphabetic':
        return (a.variable.label || a.variable.name).localeCompare(b.variable.label || b.variable.name);
      case 'mean':
        return (a.stats?.Mean || 0) - (b.stats?.Mean || 0);
      case 'descendingMeans':
        return (b.stats?.Mean || 0) - (a.stats?.Mean || 0);
      default: // 'variableList' - maintain original order
        return 0;
    }
  });

  // ------------------------------------------------------------------
  // 3. Buat Baris Tabel
  // ------------------------------------------------------------------
  const rows: TableRow[] = sortedStats.map(({ variable, stats }) => {
    let headerText = variable.label || variable.name;
    if (headerText.length > 50) { // Truncate long labels
        headerText = headerText.substring(0, 47) + '...';
    }
    const row: TableRow = { rowHeader: [headerText] };
    const isDateType = variable.type ? spssDateTypes.has(variable.type) : false;
    const decimals = STATS_DECIMAL_PLACES; // Use consistent decimal places

    // Fungsi helper untuk memformat nilai
    const format = (value: number | null | undefined, formatAs: 'date' | 'number') => {
      if (value === null || value === undefined) return value;
      if (isDateType && formatAs === 'date') return spssSecondsToDateString(value);
      if (typeof value === 'number' && decimals >= 0) {
        // Use toFixed for rounding and convert back to number to remove trailing zeros
        return parseFloat(value.toFixed(decimals));
      }
      return value;
    };

    row.N = stats.N;
    row.Missing = stats.Missing;
    if ((stats as any).Valid !== undefined) row.Valid = (stats as any).Valid;
    if (includeMode) {
      const modeVal: any = (stats as any).Mode;
      if (Array.isArray(modeVal)) {
        row.Mode = modeVal.length === 0 ? null : modeVal.map(v => String(v)).join(', ');
      } else {
        row.Mode = modeVal;
      }
    }
    
    // Tetapkan setiap stat secara eksplisit untuk keamanan tipe
    if (displayStatistics.range) row.Range = format(stats.Range, 'number');
    if (displayStatistics.minimum) row.Minimum = format(stats.Minimum, 'date');
    if (displayStatistics.maximum) row.Maximum = format(stats.Maximum, 'date');
    if (displayStatistics.sum) row.Sum = format(stats.Sum, 'number');
    if (displayStatistics.mean) row.Mean = format(stats.Mean, 'date');
    if (displayStatistics.standardError) row.SEMean = format(stats.SEMean, 'number');
    if (displayStatistics.median) row.Median = format(stats.Median, 'date');
    if (displayStatistics.stdDev) row.StdDev = format(stats.StdDev, 'number');
    if (displayStatistics.variance) row.Variance = format(stats.Variance, 'number');
    if (displayStatistics.skewness) {
      row.Skewness = format(stats.Skewness, 'number');
      row.SESkewness = format(stats.SESkewness, 'number');
    }
    if (displayStatistics.kurtosis) {
      row.Kurtosis = format(stats.Kurtosis, 'number');
      row.SEKurtosis = format(stats.SEKurtosis, 'number');
    }
    if (includePercentiles) {
      row["25th Percentile"] = format((stats as any)["25th Percentile"], 'date');
      row["75th Percentile"] = format((stats as any)["75th Percentile"], 'date');
    }
    
    return row;
  });

  return {
    title: "Descriptive Statistics",
    columnHeaders: columnHeaders,
    rows: rows,
  };
} 