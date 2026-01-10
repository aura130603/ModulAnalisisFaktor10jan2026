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
};

// ---------------------------------
// Type
// ---------------------------------

// Tab Type
export type TabType = typeof TABS.VARIABLES;

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

// Define Groups Options
export interface DefineGroupsOptions {
    useSpecifiedValues: boolean;
    cutPoint: boolean;
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
    defineGroups: DefineGroupsOptions;
    setDefineGroups: Dispatch<SetStateAction<DefineGroupsOptions>>;
    group1: number | null;
    setGroup1: Dispatch<SetStateAction<number | null>>;
    group2: number | null;
    setGroup2: Dispatch<SetStateAction<number | null>>;
    cutPointValue: number | null;
    setCutPointValue: Dispatch<SetStateAction<number | null>>;
    estimateEffectSize: boolean;
    setEstimateEffectSize: Dispatch<SetStateAction<boolean>>;
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

// GroupSettings Props
export interface GroupSettingsProps {
    initialDefineGroups?: DefineGroupsOptions;
    initialGroup1?: number | null;
    initialGroup2?: number | null;
    initialCutPointValue?: number | null;
    initialEstimateEffectSize?: boolean;
}

// VariableSelection Props
export interface VariableSelectionProps {
    initialVariables?: Variable[];
}

// IndependentSamplesTTestAnalysis Props
export interface IndependentSamplesTTestAnalysisProps extends Pick<BaseModalProps, 'onClose'> {
    testVariables: Variable[];
    groupingVariable: Variable | null;
    defineGroups: DefineGroupsOptions;
    group1: number | null;
    group2: number | null;
    cutPointValue: number | null;
    estimateEffectSize: boolean;
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

// Group Statistics
export interface GroupStatistics {
    group1: {
        label: string;
        N: number;
        Mean: number;
        StdDev: number;
        SEMean: number;
    };
    group2: {
        label: string;
        N: number;
        Mean: number;
        StdDev: number;
        SEMean: number;
    };
}
  
// Independent Samples Test
export interface IndependentSamplesTest {
    levene: {
        F: number;
        Sig: number;
    };
    equalVariances: {
        t: number;
        df: number;
        sig: number;
        meanDifference: number;
        stdErrorDifference: number;
        confidenceInterval: {
            lower: number;
            upper: number;
        };
    };
    unequalVariances: {
        t: number;
        df: number;
        sig: number;
        meanDifference: number;
        stdErrorDifference: number;
        confidenceInterval: {
            lower: number;
            upper: number;
        };
    };
}
  
// Independent Samples Effect Size Statistics
export interface IndependentSamplesEffectSizeStatistics {
    N: number;
    Mean?: number;
    StdDev?: number;
    Min?: number;
    Max?: number;
    Percentile25?: number;
    Percentile50?: number;
    Percentile75?: number;
}
  
// IndependentSamplesTTest Result Metadata
export interface IndependentSamplesTTestResultMetadata {
    hasInsufficientData: boolean;
    insufficientType: string[];
    variableName: string;
    variableLabel: string;
}

// IndependentSamplesTTest Analysis Result
export interface IndependentSamplesTTestResult {
    variable1?: Variable;
    variable2?: Variable;
    groupStatistics?: GroupStatistics;
    independentSamplesTest?: IndependentSamplesTest;
    independentSamplesEffectSize?: IndependentSamplesEffectSizeStatistics;
    metadata?: IndependentSamplesTTestResultMetadata;
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
  
  export interface IndependentSamplesTTestTable {
    title: string;
    columnHeaders: TableColumnHeader[];
    rows: TableRow[];
  }