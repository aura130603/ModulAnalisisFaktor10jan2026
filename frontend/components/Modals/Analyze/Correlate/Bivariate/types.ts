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
// export type TabType = typeof TABS.VARIABLES;

// TourStep Type
export type TourStep = BaseTourStep & {
    requiredTab?: TabType | string;
    forceChangeTab?: boolean;
};

// Statistics
export interface StatisticsOptions {
    meansAndStandardDeviations: boolean;
    crossProductDeviationsAndCovariances: boolean;
}

// Missing Values Options
export interface MissingValuesOptions {
    excludeCasesPairwise: boolean;
    excludeCasesListwise: boolean;
}

// Highlighted Variable
export type HighlightedVariable = {
  tempId: string;
  source: 'available' | 'test' | 'control';
};

// Test Type
export type CorrelationCoefficient = {
    pearson: boolean;
    kendallsTauB: boolean;
    spearman: boolean;
};

export type TestOfSignificance = {
    oneTailed: boolean;
    twoTailed: boolean;
};

// ---------------------------------
// Props
// ---------------------------------

// TabControl Props
export interface TabControlProps {
    setActiveTab: (tab: 'variables' | 'options') => void;
    // setActiveTab: (tab: 'variables') => void;
    currentActiveTab: string;
}

// VariablesTab Props
export interface VariablesTabProps {
    availableVariables: Variable[];
    testVariables: Variable[];
    highlightedVariable: HighlightedVariable | null;
    setHighlightedVariable: Dispatch<SetStateAction<HighlightedVariable | null>>;
    moveToAvailableVariables: (variable: Variable) => void;
    moveToTestVariables: (variable: Variable, targetIndex?: number) => void;
    reorderVariables: (source: 'available' | 'test', variables: Variable[]) => void;
    // Moved from OptionsTab
    correlationCoefficient: CorrelationCoefficient;
    setCorrelationCoefficient: Dispatch<SetStateAction<CorrelationCoefficient>>;
    testOfSignificance: TestOfSignificance;
    setTestOfSignificance: Dispatch<SetStateAction<TestOfSignificance>>;
    flagSignificantCorrelations: boolean;
    setFlagSignificantCorrelations: Dispatch<SetStateAction<boolean>>;
    showOnlyTheLowerTriangle: boolean;
    setShowOnlyTheLowerTriangle: Dispatch<SetStateAction<boolean>>;
    showDiagonal: boolean;
    setShowDiagonal: Dispatch<SetStateAction<boolean>>;
    tourActive?: boolean;
    currentStep?: number;
    tourSteps?: TourStep[];
}

// OptionsTab Props
export interface OptionsTabProps {
    // Removed options moved to VariablesTab
    partialCorrelationKendallsTauB: boolean;
    setPartialCorrelationKendallsTauB: Dispatch<SetStateAction<boolean>>;
    statisticsOptions: StatisticsOptions;
    setStatisticsOptions: Dispatch<SetStateAction<StatisticsOptions>>;
    // Added missing properties
    missingValuesOptions: MissingValuesOptions;
    setMissingValuesOptions: Dispatch<SetStateAction<MissingValuesOptions>>;
    highlightedVariable: HighlightedVariable | null;
    setHighlightedVariable: Dispatch<SetStateAction<HighlightedVariable | null>>;
    moveToKendallsTauBControlVariables: (variable: Variable) => void;
    moveToKendallsTauBAvailableVariables: (variable: Variable) => void;
    controlVariables: Variable[];
    reorderVariables: (source: 'available' | 'test' | 'control', variables: Variable[]) => void;
    tourActive?: boolean;
    currentStep?: number;
    tourSteps?: TourStep[];
    testVariables: Variable[];
    // Added back for dependency
    correlationCoefficient: CorrelationCoefficient;
}

// TestSettings Props
export interface TestSettingsProps {
    initialCorrelationCoefficient?: CorrelationCoefficient;
    initialTestOfSignificance?: TestOfSignificance;
    initialFlagSignificantCorrelations?: boolean;
    initialShowOnlyTheLowerTriangle?: boolean;
    initialShowDiagonal?: boolean;
    initialPartialCorrelationKendallsTauB?: boolean;
    initialStatisticsOptions?: StatisticsOptions;
    initialMissingValuesOptions?: MissingValuesOptions;
}

// VariableSelection Props
export interface VariableSelectionProps {
    initialVariables?: Variable[];
}

// BivariateAnalysis Props
export interface BivariateAnalysisProps extends Pick<BaseModalProps, 'onClose'> {
    testVariables: Variable[];
    correlationCoefficient: CorrelationCoefficient;
    testOfSignificance: TestOfSignificance;
    flagSignificantCorrelations: boolean;
    showOnlyTheLowerTriangle: boolean;
    showDiagonal: boolean;
    partialCorrelationKendallsTauB: boolean;
    statisticsOptions: StatisticsOptions;
    missingValuesOptions: MissingValuesOptions;
    controlVariables: Variable[];
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

// Descriptive Statistics
export interface DescriptiveStatistics {
    Mean: number;
    StdDev: number;
    N: number;
}

// Correlation Result
export interface CorrelationResult {
    Pearson?: number;
    KendallTauB?: number;
    Spearman?: number;
    PValue: number;
    SumOfSquares?: number;
    Covariance?: number;
    N: number;
}

// Partial Correlation
export interface PartialCorrelation {
    PartialCorrelation: number;
    PValue: number;
    df: number;
}
// Correlation
export interface Correlation {
    pearsonCorrelation?: CorrelationResult;
    kendallsTauBCorrelation?: CorrelationResult;
    spearmanCorrelation?: CorrelationResult;
}
  

// Bivariate Result
  export interface BivariateResults {
    descriptiveStatistics: Array<{
        variable: string;
        Mean: number;
        StdDev: number;
        N: number;
    }>;
    correlation: Array<{
        variable1: string;
        variable2: string;
        pearsonCorrelation?: {
            Pearson: number;
            PValue: number | null;
            SumOfSquares?: number;
            Covariance?: number;
            N: number;
        };
        kendallsTauBCorrelation?: {
            KendallsTauB: number;
            PValue: number | null;
            N: number;
        };
        spearmanCorrelation?: {
            Spearman: number;
            PValue: number | null;
            N: number;
        };
    }>;
    partialCorrelation: Array<{
        controlVariable: string;
        variable1: string;
        variable2: string;
        partialCorrelation: {
            Correlation: number;
            PValue: number;
            df: number;
        };
    }>;
    matrixValidation?: MatrixValidation;
    metadata?: Array<{
        hasInsufficientData: boolean;
        insufficientType: string[];
        variableLabel: string;
        variableName: string;
        totalData: number;
        validData: number;
    }>;
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
  
  export interface BivariateTable {
    title: string;
    columnHeaders: TableColumnHeader[];
    rows: TableRow[];
  }

// Matrix Validation Types
export interface InvalidCorrelation {
    variable1: string;
    variable2: string;
    value: number;
}

export interface InvalidN {
    variable1: string;
    variable2: string;
    value: number;
}

export interface MatrixValidation {
    hasInvalidCorrelations: boolean;
    hasInvalidNs: boolean;
    invalidCorrelations: InvalidCorrelation[];
    invalidNs: InvalidN[];
}