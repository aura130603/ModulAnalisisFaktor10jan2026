import type { Variable } from "@/types/Variable";
import { TourStep } from './hooks/useTourGuide';
import { UseVariableManagementResult } from './hooks/useVariableManagement';
import { UseStatisticsSettingsResult } from './hooks/useStatisticsSettings';
import { UsePlotsSettingsResult } from './hooks/usePlotsSettings';

// Type for highlighted variable
export type HighlightedVariable = {
    id: string | number;
    source: 'available' | 'dependent' | 'factor' | 'label';
} | null;

// === Tour Props ===
export interface TourProps {
    tourActive?: boolean;
    currentStep?: number;
    tourSteps?: TourStep[];
}

// Props for VariablesTab component
export interface VariablesTabProps extends UseVariableManagementResult, TourProps {
    errorMsg: string | null;
    containerType?: "dialog" | "sidebar";
    reorderVariables: (source: 'dependent' | 'factor', variables: Variable[]) => void;
}

// Props for StatisticsTab component
export interface StatisticsTabProps extends UseStatisticsSettingsResult, TourProps {
    containerType?: "dialog" | "sidebar";
}

// Props for PlotsTab component
export interface PlotsTabProps extends UsePlotsSettingsResult, TourProps {
    containerType?: "dialog" | "sidebar";
    factorVariablesCount: number;
}

// === New types for structured results ===
export interface TableHeader {
    header: string;
    key: string;
}

export interface RowData {
    [key: string]: string | number | number[] | string[];
}

export interface StatisticsTable {
    title: string;
    columnHeaders: TableHeader[];
    rows: RowData[];
}

export interface ExploreResultsData {
    tables: StatisticsTable[];
}

// Main analysis parameters that will be used for execution and results
export interface ExploreAnalysisParams {
    dependentVariables: Variable[];
    factorVariables: Variable[];
    labelVariable: Variable | null;
    confidenceInterval: string;
    showDescriptives: boolean;
    showMEstimators: boolean;
    showOutliers: boolean;
    showPercentiles: boolean;
    boxplotType: 'none' | 'dependents-together' | 'factor-levels-together' | 'dependents-separately';
    showStemAndLeaf: boolean;
    showHistogram: boolean;
    showNormalityPlots: boolean;
}

// Results structure for the explore analysis
export interface ExploreResults {
    // Define types for the results data structure here
    type: 'explore';
    params: ExploreAnalysisParams;
    results: ExploreResultsData; // This will hold the structured results
}