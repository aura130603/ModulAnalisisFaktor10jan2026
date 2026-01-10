import type { Variable, ValueLabel } from '@/types/Variable';

/** Column structure used by DataTableRenderer */
export interface ColumnHeader {
  header: string;
  key?: string;
  children?: ColumnHeader[];
}

/** Row data structure for DataTableRenderer */
export interface TableRowData {
  rowHeader: (string | null)[];
  [key: string]: any;
}

/** Single table definition expected by downstream renderer */
export interface FormattedTable {
  title: string;
  columnHeaders: ColumnHeader[];
  rows: TableRowData[];
  footnotes?: string[];
  /**
   * Unified footer support for DataTableRenderer. Accepts either a single string or an array of
   * strings (each will be rendered in its own cell when the length matches the number of data
   * columns). This duplicates the information in `footnotes` but allows newer renderers to rely
   * on `footer` while maintaining backward compatibility with existing consumer code that still
   * references `footnotes`.
   */
  footer?: string | string[];
}

/** Result from examine worker for a single variable */
export interface ExamineWorkerResult {
  variable: Variable;
  summary: {
    n: number;
    valid: number;
    missing: number;
  };
  // Additional statistics are attached dynamically (descriptives, percentiles, etc.)
  [key: string]: any;
}

/** Aggregated results keyed by factor grouping */
export interface ExploreAggregatedResults {
  [factorKey: string]: {
    factorLevels: Record<string, string | number>;
    results: ExamineWorkerResult[];
  };
}

/**
 * Return a display label for a factor value.
 */
export const getFactorLabel = (factorVar: Variable, factorValue: any): string => {
  const foundLabel = factorVar.values?.find((vl: ValueLabel) => String(vl.value) === String(factorValue));
  return foundLabel?.label || String(factorValue);
};

/**
 * Regroup aggregated results by dependent variable for easier table construction.
 */
export const regroupByDepVar = (results: ExploreAggregatedResults): Record<string, any[]> => {
  const resultsByDepVar: Record<string, any[]> = {};
  for (const groupKey in results) {
    for (const result of results[groupKey].results) {
      if (!resultsByDepVar[result.variable.name]) {
        resultsByDepVar[result.variable.name] = [];
      }
      resultsByDepVar[result.variable.name].push({ ...result, factorLevels: results[groupKey].factorLevels });
    }
  }
  return resultsByDepVar;
};

// Konstanta untuk precision yang konsisten
const STATS_DECIMAL_PLACES = 2;

// Helper function to format numbers according to variable decimal places
export const formatNumber = (value: number | undefined | null, decimals: number = STATS_DECIMAL_PLACES, fallback: string = ''): string => {
  if (value === undefined || value === null || isNaN(value as number)) return fallback;
  return (value as number).toFixed(decimals);
};