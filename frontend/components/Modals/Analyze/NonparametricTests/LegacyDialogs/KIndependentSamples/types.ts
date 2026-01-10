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
  source: 'available' | 'test' | 'grouping';
};

// Test Type
export type TestType = {
    kruskalWallisH: boolean;
    median: boolean;
    jonckheereTerpstra: boolean;
};

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
    groupingVariable: Variable | null;
    minimum: number | null;
    setMinimum: Dispatch<SetStateAction<number | null>>;
    maximum: number | null;
    setMaximum: Dispatch<SetStateAction<number | null>>;
    highlightedVariable: HighlightedVariable | null;
    setHighlightedVariable: Dispatch<SetStateAction<HighlightedVariable | null>>;
    moveToAvailableVariables: (variable: Variable) => void;
    moveToTestVariables: (variable: Variable, targetIndex?: number) => void;
    moveToGroupingVariable: (variable: Variable) => void;
    reorderVariables: (source: 'available' | 'test', variables: Variable[]) => void;
    tourActive?: boolean;
    currentStep?: number;
    tourSteps?: TourStep[];
}

// OptionsTab Props
export interface OptionsTabProps {
    testType: TestType;
    setTestType: Dispatch<SetStateAction<TestType>>;
    displayStatistics: DisplayStatisticsOptions;
    setDisplayStatistics: Dispatch<SetStateAction<DisplayStatisticsOptions>>;
    tourActive?: boolean;
    currentStep?: number;
    tourSteps?: TourStep[];
}

// TestSettings Props
export interface TestSettingsProps {
    initialMinimum?: number | null;
    initialMaximum?: number | null;
    initialTestType?: TestType;
    initialDisplayStatistics?: DisplayStatisticsOptions;
}

// VariableSelection Props
export interface VariableSelectionProps {
    initialVariables?: Variable[];
}

// KIndependentSamplesTestAnalysis Props
export interface KIndependentSamplesTestAnalysisProps extends Pick<BaseModalProps, 'onClose'> {
    testVariables: Variable[];
    groupingVariable: Variable | null;
    minimum: number | null;
    maximum: number | null;
    testType: TestType;
    displayStatistics: DisplayStatisticsOptions;
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

// Ranks
export interface Ranks {
    groups: {
        value: number;
        label: string;
        N: number;
        meanRank: number;
        sumRanks: number;
    }[];
}

// KruskalWallisH Test Statistics
export interface KruskalWallisHTestStatistics {
    H: number;
    df: number;
    pValue: number;
}

// Frequencies
export interface Frequencies {
    group1: {
        label: string;
        N: number;
    };
    group2: {
        label: string;
        N: number;
    };
}

// Median Test Statistics
export interface MedianTestStatistics {
    N: number;
    Median: number;
    ChiSquare: number;
    df: number;
    pValue: number;
}

// JonckheereTerpstra Test
export interface JonckheereTerpstraTest {
    Levels: number;
    N: number;
    Observed: number;
    Mean: number;
    StdDev: number;
    Std: number;
    pValue: number;
}
  
// Test Statistics
export interface TestStatistics {
    KruskalWallisH?: KruskalWallisHTestStatistics;
    Median?: MedianTestStatistics;
    JonckheereTerpstra?: JonckheereTerpstraTest;
}
  
// Descriptive Statistics
export interface DescriptiveStatistics {
    N: number;
    Mean?: number;
    StdDev?: number;
    Min?: number;
    Max?: number;
    Percentile25?: number;
    Percentile50?: number;
    Percentile75?: number;
  }
  
// K Independent Samples Test Result
export interface KIndependentSamplesTestResult {
    variable1: Variable;
    descriptiveStatistics?: DescriptiveStatistics;
    ranks?: Ranks;  // Changed from Ranks[] to Ranks
    testStatisticsKruskalWallisH?: KruskalWallisHTestStatistics;
    frequencies?: Frequencies;
    testStatisticsMedian?: MedianTestStatistics;
    jonckheereTerpstraTest?: JonckheereTerpstraTest;
    metadata?: {
        hasInsufficientData: boolean;
        insufficientType: string[];
        variableName: string;
        variableLabel: string;
    };
}
  
  // K Independent Samples Test Results Collection
  export interface KIndependentSamplesTestResults {
    ranks?: KIndependentSamplesTestResult[];
    testStatisticsKruskalWallisH?: KIndependentSamplesTestResult[];
    frequencies?: KIndependentSamplesTestResult[];
    testStatisticsMedian?: KIndependentSamplesTestResult[];
    jonckheereTerpstraTest?: KIndependentSamplesTestResult[];
    descriptiveStatistics?: KIndependentSamplesTestResult[];
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
  
  export interface KIndependentSamplesTestTable {
    title: string;
    columnHeaders: TableColumnHeader[];
    rows: TableRow[];
  }