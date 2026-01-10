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
export type TestType = {
  wilcoxon: boolean;
  sign: boolean;
  mcNemar: boolean;
  marginalHomogeneity: boolean;
};

// Display Statistics
export type DisplayStatistics = {
  descriptive: boolean;
  quartiles: boolean;
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
  testType: TestType;
  setTestType: Dispatch<SetStateAction<TestType>>;
  displayStatistics: DisplayStatistics;
  setDisplayStatistics: Dispatch<SetStateAction<DisplayStatistics>>;
  tourActive?: boolean;
  currentStep?: number;
  tourSteps?: TourStep[];
}

// TestSettings Props
export interface TestSettingsProps {
  initialTestType?: TestType;
  initialDisplayStatistics?: DisplayStatistics;
}

// VariableSelection Props
export interface VariableSelectionProps {
  initialVariables?: Variable[];
}

// TwoRelatedSamplesAnalysis Props
export interface TwoRelatedSamplesAnalysisProps extends Pick<BaseModalProps, 'onClose'> {
  testVariables1: Variable[];
  testVariables2: Variable[];
  testType: TestType;
  displayStatistics: DisplayStatistics;
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

// DescriptiveStatistics
export interface DescriptiveStatistics {
  N1: number;
  Mean1?: number;
  StdDev1?: number;
  Min1?: number;
  Max1?: number;
  Percentile25_1?: number;
  Percentile50_1?: number;
  Percentile75_1?: number;
  N2: number;
  Mean2?: number;
  StdDev2?: number;
  Min2?: number;
  Max2?: number;
  Percentile25_2?: number;
  Percentile50_2?: number;
  Percentile75_2?: number;
}

// RanksFrequencies
export interface RanksFrequencies {
  negative: {
    N: number;
    MeanRank: number;
    SumOfRanks: number;
  };
  positive: {
    N: number;
    MeanRank: number;
    SumOfRanks: number;
  };
  ties: {
    N: number;
  };
  total: {
    N: number;
  };
}

// TestStatistics
export interface TestStatistics {
  zValue: number;
  pValue: number;
}

// TwoRelatedSamplesResult
export interface TwoRelatedSamplesResult {
  variable1: Variable;
  variable2: Variable;
  descriptiveStatistics?: DescriptiveStatistics;
  ranksFrequencies?: RanksFrequencies;
  testStatisticsWilcoxon?: TestStatistics;
  testStatisticsSign?: TestStatistics;
  metadata?: {
    hasInsufficientData: boolean;
    variable1Label: string;
    variable2Label: string;
    variable1Name: string;
    variable2Name: string;
  };
}
  
// TwoRelatedSamplesResults
export interface TwoRelatedSamplesResults {
  descriptiveStatistics?: TwoRelatedSamplesResult[];
  ranksFrequencies?: TwoRelatedSamplesResult[];
  testStatisticsWilcoxon?: TwoRelatedSamplesResult[];
  testStatisticsSign?: TwoRelatedSamplesResult[];
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

export interface TwoRelatedSamplesTable {
  title: string;
  columnHeaders: TableColumnHeader[];
  rows: TableRow[];
}