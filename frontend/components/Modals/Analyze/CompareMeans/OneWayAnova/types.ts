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
    POST_HOC: 'postHoc' as const,
    OPTIONS: 'options' as const,
};

// ---------------------------------
// Type
// ---------------------------------

// Tab Type
export type TabType = typeof TABS.VARIABLES | typeof TABS.POST_HOC | typeof TABS.OPTIONS;

// TourStep Type
export type TourStep = BaseTourStep & {
    requiredTab?: TabType | string;
    forceChangeTab?: boolean;
};

// Highlighted Variable
export type HighlightedVariable = {
  tempId: string;
  source: 'available' | 'test' | 'factor';
};

// Define Groups Options
export interface EqualVariancesAssumedOptions {
    tukey: boolean;
    duncan: boolean;
}

// Statistics Options
export interface StatisticsOptions {
    descriptive: boolean;
    homogeneityOfVariance: boolean;
}

// ---------------------------------
// Props
// ---------------------------------

// TabControl Props
export interface TabControlProps {
    setActiveTab: (tab: 'variables' | 'postHoc' | 'options') => void;
    currentActiveTab: string;
}

// VariablesTab Props
export interface VariablesTabProps {
    availableVariables: Variable[];
    testVariables: Variable[];
    factorVariable: Variable | null;
    estimateEffectSize: boolean;
    setEstimateEffectSize: Dispatch<SetStateAction<boolean>>;
    highlightedVariable: HighlightedVariable | null;
    setHighlightedVariable: Dispatch<SetStateAction<HighlightedVariable | null>>;
    moveToAvailableVariables: (variable: Variable) => void;
    moveToTestVariables: (variable: Variable, targetIndex?: number) => void;
    moveToFactorVariable: (variable: Variable) => void;
    reorderVariables: (source: 'available' | 'test', variables: Variable[]) => void;
    tourActive?: boolean;
    currentStep?: number;
    tourSteps?: TourStep[];
}

// PostHocTab Props
export interface PostHocTabProps {
    equalVariancesAssumed: EqualVariancesAssumedOptions;
    setEqualVariancesAssumed: Dispatch<SetStateAction<EqualVariancesAssumedOptions>>;
    tourActive?: boolean;
    currentStep?: number;
    tourSteps?: TourStep[];
}

// OptionsTab Props
export interface OptionsTabProps {
    statisticsOptions: StatisticsOptions;
    setStatisticsOptions: Dispatch<SetStateAction<StatisticsOptions>>;
    tourActive?: boolean;
    currentStep?: number;
    tourSteps?: TourStep[];
}

// TestSettings Props
export interface TestSettingsProps {
    initialEstimateEffectSize?: boolean;
    initialEqualVariancesAssumed?: EqualVariancesAssumedOptions;
    initialStatisticsOptions?: StatisticsOptions;
}

// VariableSelection Props
export interface VariableSelectionProps {
    initialVariables?: Variable[];
}

// OneWayAnovaAnalysis Props
export interface OneWayAnovaAnalysisProps extends Pick<BaseModalProps, 'onClose'> {
    testVariables: Variable[];
    factorVariable: Variable | null;
    estimateEffectSize: boolean;
    equalVariancesAssumed: EqualVariancesAssumedOptions;
    statisticsOptions: StatisticsOptions;
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

// OneWayAnova
export interface OneWayAnova {
    SumOfSquares: number;
    df: number;
    MeanSquare: number;
    F: number;
    Sig: number;
    withinGroupsSumOfSquares: number;
    withinGroupsDf: number;
    withinGroupsMeanSquare: number;
    totalSumOfSquares: number;
    totalDf: number;
}

// Descriptive
export interface Descriptives {
    factor: string;
    N: number;
    Mean: number;
    StdDeviation: number;
    StdError: number;
    LowerBound: number;
    UpperBound: number;
    Minimum: number;
    Maximum: number;
}
  
// Homogeneity of Variance
export interface HomogeneityOfVariance {
    type: string;
    LeveneStatistic: number;
    df1: number;
    df2: number;
    Sig: number;
}
  
// Multiple Comparisons
export interface MultipleComparisons {
    method?: string;
    factor1: string;
    factor2: string;
    meanDifference: number;
    stdError: number;
    Sig: number;
    lowerBound: number;
    upperBound: number;
}
  
// Homogeneous Subsets
export interface HomogeneousSubsets {
    subsetCount: number;
    method: string;
    factor?: string;
    N?: number;
    subset?: number[];
    output?: any[];
}

// OneWayAnova Analysis Result
export interface OneWayAnovaResult {
    variable1: Variable;
    variable2: Variable;
    subsetCount?: number;
    oneWayAnova?: OneWayAnova;
    descriptives?: Descriptives | Descriptives[];
    homogeneityOfVariances?: HomogeneityOfVariance | HomogeneityOfVariance[];
    multipleComparisons?: MultipleComparisons | MultipleComparisons[];
    homogeneousSubsets?: HomogeneousSubsets | HomogeneousSubsets[];
    metadata?: {
        hasInsufficientData: boolean;
        insufficientType: string[];
        variable1Label: string;
        variable2Label: string;
        variable1Name: string;
        variable2Name: string;
    };
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

export interface OneWayAnovaTable {
  title: string;
  columnHeaders: TableColumnHeader[];
  rows: TableRow[];
}
