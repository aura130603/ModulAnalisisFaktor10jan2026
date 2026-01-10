import { Variable } from '@/types/Variable';
import { Dispatch, SetStateAction } from 'react';
import { TourStep as BaseTourStep } from '@/types/tourTypes';
import { BaseModalProps } from '@/types/modalTypes';

// ---------------------------------
// Constants
// ---------------------------------

// Tab Constants
export const TABS = {
    VARIABLES: 'variables' as const,
    OPTIONS: 'options' as const,
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
  source: 'available' | 'test';
};

// Expected Range Options
export interface ExpectedRangeOptions {
  getFromData: boolean;
  useSpecifiedRange: boolean;
}

// Range Value Options
export interface RangeValueOptions {
  lowerValue: number | null;
  upperValue: number | null;
}

// Expected Value Options
export interface ExpectedValueOptions {
  allCategoriesEqual: boolean;
  values: boolean;
  inputValue: number | null;
}

// Display Statistics Options
export interface DisplayStatisticsOptions {
  descriptive: boolean;
  quartiles: boolean;
}

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
    testVariables: Variable[];
    highlightedVariable: HighlightedVariable | null;
    setHighlightedVariable: Dispatch<SetStateAction<HighlightedVariable | null>>;
    moveToTestVariables: (variable: Variable, targetIndex?: number) => void;
    moveToAvailableVariables: (variable: Variable, targetIndex?: number) => void;
    reorderVariables: (source: 'available' | 'test', variables: Variable[]) => void;
    tourActive?: boolean;
    currentStep?: number;
    tourSteps?: TourStep[];
}

// OptionsTab Props
export interface OptionsTabProps {
    expectedRange: ExpectedRangeOptions;
    setExpectedRange: Dispatch<SetStateAction<ExpectedRangeOptions>>;
    rangeValue: RangeValueOptions;
    setRangeValue: Dispatch<SetStateAction<RangeValueOptions>>;
    expectedValue: ExpectedValueOptions;
    setExpectedValue: Dispatch<SetStateAction<ExpectedValueOptions>>;
    expectedValueList: number[];
    setExpectedValueList: Dispatch<SetStateAction<number[]>>;
    displayStatistics: DisplayStatisticsOptions;
    setDisplayStatistics: Dispatch<SetStateAction<DisplayStatisticsOptions>>;
    highlightedExpectedValueIndex: number | null;
    setHighlightedExpectedValueIndex: Dispatch<SetStateAction<number | null>>;
    addExpectedValue: () => void;
    removeExpectedValue: (value: number) => void;
    changeExpectedValue: (oldValue: number) => void;
    tourActive?: boolean;
    currentStep?: number;
    tourSteps?: TourStep[];
}

// TestSettings Props
export interface TestSettingsProps {
  initialExpectedRange?: {
    getFromData: boolean;
    useSpecifiedRange: boolean;
  };
  initialRangeValue?: {
    lowerValue: number | null;
    upperValue: number | null;
  };
  initialExpectedValue?: {
    allCategoriesEqual: boolean;
    values: boolean;
    inputValue: number | null;
  };
  initialExpectedValueList?: number[];
  initialDisplayStatistics?: {
    descriptive: boolean;
    quartiles: boolean;
  };
}

// VariableSelection Props
export interface VariableSelectionProps {
  initialVariables?: Variable[];
}

// ChiSquareAnalysis Props
export interface ChiSquareAnalysisProps extends Pick<BaseModalProps, 'onClose' | 'containerType'> {
  testVariables: Variable[];
  expectedRange: {
    getFromData: boolean;
    useSpecifiedRange: boolean;
  };
  rangeValue: {
    lowerValue: number | null;
    upperValue: number | null;
  };
  expectedValue: {
    allCategoriesEqual: boolean;
    values: boolean;
    inputValue: number | null;
  };
  expectedValueList: number[];
  displayStatistics: {
    descriptive: boolean;
    quartiles: boolean;
  };
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

// Frequencies
export interface Frequencies {
  categoryList: (string | number)[];
  observedN: number[];
  expectedN: number[] | number;
  residual: number[];
  N: number;
}

// Test Statistics
export interface TestStatistics {
  ChiSquare: number;
  DF: number;
  PValue: number;
}

// Descriptive Statistics
export interface DescriptiveStatistics {
  N1: number;
  Mean1?: number;
  StdDev1?: number;
  Min1?: number;
  Max1?: number;
  Percentile25_1?: number;
  Percentile50_1?: number;
  Percentile75_1?: number;
}

// Chi Square Result
export interface ChiSquareResult {
  variable1: Variable;
  frequencies?: Frequencies;
  testStatistics?: TestStatistics;
  descriptiveStatistics?: DescriptiveStatistics;
  metadata?: {
    hasInsufficientData: boolean;
    insufficientType: string[];
    variableLabel: string;
    variableName: string;
  };
} 

// Chi Square Results Collection
export interface ChiSquareResults {
  frequencies?: ChiSquareResult[];
  testStatistics?: ChiSquareResult[];
  descriptiveStatistics?: ChiSquareResult[];
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

export interface ChiSquareTable {
    title: string;
    columnHeaders: TableColumnHeader[];
    rows: TableRow[];
}