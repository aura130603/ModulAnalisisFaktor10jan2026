import { Variable } from "@/types/Variable";
import { Dispatch, SetStateAction } from "react";
import { TourStep as BaseTourStep } from '@/types/tourTypes';
import { BaseModalProps } from "@/types/modalTypes";

// ---------------------------------
// Constants
// ---------------------------------

// Tab Constants
export const TABS = {
    VARIABLES: 'variables' as const,
    OPTIONS: 'options' as const
};

// ---------------------------------
// Type
// ---------------------------------

// Tab Type
export type TabType = typeof TABS.VARIABLES | typeof TABS.OPTIONS;

// TourStep Type
export type TourStep = BaseTourStep & {
  requiredTab?: TabType | string;
  forceChangeTab?: boolean;
};

// Highlighted Variable
export type HighlightedVariable = {
  tempId: string;
  source: 'available' | 'test1' | 'test2';
  rowIndex?: number;
};

// Highlighted Pair
export type HighlightedPair = {
  id: number;
  rowIndex?: number;
};

// Test Type
export type CalculateStandardizer = {
  standardDeviation: boolean;
  correctedStandardDeviation: boolean;
  averageOfVariances: boolean;
};

// ---------------------------------
// Props
// ---------------------------------

// TabControl Props
export interface TabControlProps {
  setActiveTab: (tab: 'variables' | 'options') => void;
  currentActiveTab: string;
}

// VariablesTab Props
export interface VariablesTabProps {
  availableVariables: Variable[];
  testVariables1: Variable[];
  testVariables2: Variable[];
  pairNumbers: number[];
  highlightedPair: HighlightedPair | null;
  setHighlightedPair: Dispatch<SetStateAction<HighlightedPair | null>>;
  highlightedVariable: HighlightedVariable | null;
  setHighlightedVariable: Dispatch<SetStateAction<HighlightedVariable | null>>;
  moveToTestVariables: (variable: Variable) => void;
  removeVariable: (sourceList: 'test1' | 'test2', rowIndex: number) => void;
  moveVariableBetweenLists: (rowIndex: number) => void;
  moveUpPair: (rowIndex: number) => void;
  moveDownPair: (rowIndex: number) => void;
  removePair: (rowIndex: number) => void;
  reorderPairs: (pairs: [Variable, Variable][]) => void;
  tourActive?: boolean;
  currentStep?: number;
  tourSteps?: TourStep[];
}

// OptionsTab Props
export interface OptionsTabProps {
  estimateEffectSize: boolean;
  setEstimateEffectSize: Dispatch<SetStateAction<boolean>>;
  calculateStandardizer: CalculateStandardizer;
  setCalculateStandardizer: Dispatch<SetStateAction<CalculateStandardizer>>;
  tourActive?: boolean;
  currentStep?: number;
  tourSteps?: TourStep[];
}

// TestSettings Props
export interface TestSettingsProps {
  initialEstimateEffectSize?: boolean;
  initialCalculateStandardizer?: CalculateStandardizer;
}

// VariableSelection Props
export interface VariableSelectionProps {
  initialVariables?: Variable[];
}

// PairedSamplesTTestAnalysis Props
export interface PairedSamplesTTestAnalysisProps extends Pick<BaseModalProps, 'onClose'> {
  testVariables1: Variable[];
  testVariables2: Variable[];
  pairNumbers: number[];
  calculateStandardizer: CalculateStandardizer;
  estimateEffectSize: boolean;
  areAllPairsValid: () => boolean;
  hasDuplicatePairs: () => boolean;
}

// ---------------------------------
// Result
// ---------------------------------

// UseTourGuide Result
export interface UseTourGuideResult {
  tourActive: boolean;
  currentStep: number;
  tourSteps: TourStep[];
  currentTargetElement: HTMLElement | null;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: () => void;
}

// PairedSamplesStatistics
export interface PairedSamplesStatistics {
  group1: {
    label: string;
    Mean: number;
    N: number;
    StdDev: number;
    SEMean: number;
  };
  group2: {
    label: string;
    Mean: number;
    N: number;
    StdDev: number;
    SEMean: number;
  };
}

// PairedSamplesCorrelation
export interface PairedSamplesCorrelation {
  correlationLabel: String;
  N: number;
  Correlation: number;
  correlationPValue: number;
}

// PairedSamplesTestStatistics
export interface PairedSamplesTest {
  label: String;
  Mean: number;
  StdDev: number;
  SEMean: number;
  LowerCI: number;
  UpperCI: number;
  t: number;
  df: number;
  pValue: number;
}
  
// PairedSamplesTTestResult
export interface PairedSamplesTTestResult {
  variable1: Variable;
  variable2: Variable;
  pair: number;
  metadata: {
    pair: number,
    hasInsufficientData: boolean,
    totalData1: number,
    validData1: number,
    totalData2: number,
    validData2: number,
    variable1Name: string,
    variable2Name: string
  };
  pairedSamplesStatistics?: PairedSamplesStatistics;
  pairedSamplesCorrelation?: PairedSamplesCorrelation;
  pairedSamplesTest?: PairedSamplesTest;
}
  
// ---------------------------------
// Table Types
// ---------------------------------
export interface TableColumnHeader {
  header: string;
  key: string;
  children?: TableColumnHeader[];
}
  
export interface TableRow {
  [key: string]: any;
  rowHeader?: any[];
}

export interface PairedSamplesTTestTable {
  title: string;
  columnHeaders: TableColumnHeader[];
  rows: TableRow[];
}