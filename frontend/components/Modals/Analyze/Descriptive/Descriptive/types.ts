import type { Variable, VariableData } from '@/types/Variable';
import type { Dispatch, SetStateAction } from 'react';
import { ContainerType } from '@/types/ui';
import { BaseModalProps } from '@/types/modalTypes';

// ---------------------------------
// Statistics Settings Types
// ---------------------------------
export interface DescriptiveStatisticsOptions {
  mean: boolean;
  stdDev: boolean;
  minimum: boolean;
  maximum: boolean;
  variance: boolean;
  range: boolean;
  sum: boolean;
  median: boolean;
  skewness: boolean;
  kurtosis: boolean;
  standardError: boolean;
}

export type DisplayOrderType = 'variableList' | 'alphabetic' | 'mean' | 'ascendingMeans' | 'descendingMeans';

// ---------------------------------
// Variable Selection Types
// ---------------------------------
export interface HighlightedVariableInfo {
  id: number;
  source: 'available' | 'selected';
}

// ---------------------------------
// Z-Score Data Types
// ---------------------------------
export type ZScoreVariableInfo = {
  name: string;
  label: string;
  type: "NUMERIC";
  width: number;
  decimals: number;
  measure: 'scale';
};

export type ZScoreData = {
  [variableName: string]: {
    scores?: (string | number)[];
    variableInfo?: ZScoreVariableInfo;
    error?: string;
  };
};

// ---------------------------------
// Worker & Formatting Types
// ---------------------------------
export interface DescriptiveStatistics {
  title: string;
  output_data: any;
  components: string;
  description: string;
}

export interface DescriptiveStatisticsTable {
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

// Tipe yang lebih spesifik untuk hasil dari worker
export interface DescriptiveStats {
    N: number;
    Missing: number;
    Valid?: number | null;
    Mean?: number | null;
    Median?: number | null;
    '25th Percentile'?: number | null;
    '75th Percentile'?: number | null;
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
    Mode?: (string | number)[] | string | number | null;
}

export interface DescriptiveResult {
    variable: Variable;
    stats: DescriptiveStats;
}

// ---------------------------------
// Hook Props and Results
// ---------------------------------
export interface VariableSelectionProps {
  initialVariables?: Variable[];
  resetVariableSelection: () => void;
}

export interface StatisticsSettingsProps {
  initialDisplayStatistics?: Partial<DescriptiveStatisticsOptions>;
  initialDisplayOrder?: DisplayOrderType;
  initialSaveStandardized?: boolean;
  resetStatisticsSettings: () => void;
}

export interface StatisticsSettingsResult {
  displayStatistics: DescriptiveStatisticsOptions;
  setDisplayStatistics: Dispatch<SetStateAction<DescriptiveStatisticsOptions>>;
  updateStatistic: (key: keyof DescriptiveStatisticsOptions, value: boolean) => void;
  displayOrder: DisplayOrderType;
  setDisplayOrder: Dispatch<SetStateAction<DisplayOrderType>>;
  saveStandardized: boolean;
  setSaveStandardized: Dispatch<SetStateAction<boolean>>;
}

export interface DescriptivesAnalysisProps extends Pick<BaseModalProps, 'onClose' | 'containerType'> {
  selectedVariables: Variable[];
  displayStatistics: DescriptiveStatisticsOptions;
  saveStandardized: boolean;
  displayOrder?: DisplayOrderType;
}

export interface DescriptivesAnalysisResult {
  runAnalysis: () => Promise<void>;
  isCalculating: boolean;
  cancelCalculation: () => void;
  error: string | null;
} 