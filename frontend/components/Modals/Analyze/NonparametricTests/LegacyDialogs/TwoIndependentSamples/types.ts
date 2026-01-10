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
    mannWhitneyU: boolean;
    mosesExtremeReactions: boolean;
    kolmogorovSmirnovZ: boolean;
    waldWolfowitzRuns: boolean;
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
    group1: number | null;
    setGroup1: Dispatch<SetStateAction<number | null>>;
    group2: number | null;
    setGroup2: Dispatch<SetStateAction<number | null>>;
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
    initialGroup1?: number | null;
    initialGroup2?: number | null;
    initialTestType?: TestType;
    initialDisplayStatistics?: DisplayStatisticsOptions;
}

// VariableSelection Props
export interface VariableSelectionProps {
    initialVariables?: Variable[];
}

// TwoIndependentSamplesTestAnalysis Props
export interface TwoIndependentSamplesTestAnalysisProps extends Pick<BaseModalProps, 'onClose'> {
    testVariables: Variable[];
    groupingVariable: Variable | null;
    group1: number | null;
    group2: number | null;
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

// Frequencies
export interface FrequenciesRanks {
    group1: {
        label: string;
        N: number;
        MeanRank?: number;
        SumRanks?: number;
    };
    group2: {
        label: string;
        N: number;
        MeanRank?: number;
        SumRanks?: number;
    };
}

// KolmogorovSmirnovZ Test Statistics
export interface KolmogorovSmirnovZTestStatistics {
    D_absolute: number;
    D_positive: number;
    D_negative: number;
    d_stat: number;
    pValue: number;
}

// Mann-Whitney U Test Statistics
export interface MannWhitneyUTestStatistics {
    U: number;
    W: number;
    Z: number;
    pValue: number;
    pExact: number;
    showExact: boolean;
}
  
// Test Statistics
export interface TestStatistics {
    KolmogorovSmirnovZ?: KolmogorovSmirnovZTestStatistics;
    MannWhitneyU?: MannWhitneyUTestStatistics;
}
  
// Descriptive Statistics
export interface DescriptiveStatistics {
    variable1: Variable;
    N: number;
    Mean?: number;
    StdDev?: number;
    Min?: number;
    Max?: number;
    Percentile25?: number;
    Percentile50?: number;
    Percentile75?: number;
  }
  
// Two Independent Samples Test Result
export interface TwoIndependentSamplesTestResult {
    variable1: Variable;
    variable2: Variable;
    descriptiveStatistics?: DescriptiveStatistics;
    frequenciesRanks?: FrequenciesRanks;
    testStatisticsMannWhitneyU?: MannWhitneyUTestStatistics;
    testStatisticsKolmogorovSmirnovZ?: KolmogorovSmirnovZTestStatistics;
    metadata?: {
        hasInsufficientData: boolean;
        insufficentType: string[];
        variableName: string;
        variableLabel: string;
    };
}
  
  // Two Independent Samples Test Results Collection
  export interface TwoIndependentSamplesTestResults {
    frequenciesRanks?: TwoIndependentSamplesTestResult[];
    testStatisticsMannWhitneyU?: TwoIndependentSamplesTestResult[];
    testStatisticsKolmogorovSmirnovZ?: TwoIndependentSamplesTestResult[];
    descriptiveStatistics?: TwoIndependentSamplesTestResult[];
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
  
  export interface TwoIndependentSamplesTestTable {
    title: string;
    columnHeaders: TableColumnHeader[];
    rows: TableRow[];
  }