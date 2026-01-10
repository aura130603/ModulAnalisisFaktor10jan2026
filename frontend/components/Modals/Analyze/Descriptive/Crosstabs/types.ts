import { Dispatch, SetStateAction } from 'react';
import type { Variable } from "@/types/Variable";
import { BaseModalProps } from "@/types/modalTypes";
import { TourStep } from './hooks/useTourGuide';

// === Shared Types ===
export type NonintegerWeightsType = 'roundCell' | 'roundCase' | 'truncateCell' | 'truncateCase' | 'noAdjustment';
export type VariableHighlight = { id: string, source: 'available' | 'row' | 'column' } | null;

// === Tour Props ===
export interface TourProps {
    tourActive?: boolean;
    currentStep?: number;
    tourSteps?: TourStep[];
}

// === Variables Tab Props ===
export interface VariablesTabProps extends TourProps {
    availableVariables: Variable[];
    rowVariables: Variable[];
    columnVariables: Variable[];
    highlightedVariable: VariableHighlight;
    setHighlightedVariable: (value: VariableHighlight) => void;
    moveToRowVariables: (variable: Variable) => void;
    moveToColumnVariables: (variable: Variable) => void;
    moveToAvailableVariables: (variable: Variable, source: 'row' | 'column') => void;
    reorderVariables: (source: 'available' | 'row' | 'column', variables: Variable[]) => void;
    containerType?: "dialog" | "sidebar";
}

// === Cells Tab Props ===
export interface CellsTabProps extends TourProps {
    options: CrosstabsAnalysisParams['options'];
    setOptions: Dispatch<SetStateAction<CrosstabsAnalysisParams['options']>>;
    rowVariables: Variable[];
    columnVariables: Variable[];
    containerType?: "dialog" | "sidebar";
}

// === Analysis Params ===
export interface CrosstabsAnalysisParams {
    rowVariables: Variable[];
    columnVariables: Variable[];
    options: {
        cells: {
            observed: boolean;
            expected: boolean;
            row: boolean;
            column: boolean;
            total: boolean;
            hideSmallCounts: boolean;
            hideSmallCountsThreshold: number;
        },
        residuals: {
            unstandardized: boolean;
            standardized: boolean;
            adjustedStandardized: boolean;
        },
        nonintegerWeights: NonintegerWeightsType;
    }
}

export interface CrosstabsWorkerResult {
    summary: {
        valid: number;
        missing: number;
        rowCategories: (string | number)[];
        colCategories: (string | number)[];
        rowTotals: number[];
        colTotals: number[];
        totalCases: number;
    };
    contingencyTable: number[][];
    cellStatistics?: {
        count: number;
        expected: number | null;
        residual: number | null;
        standardizedResidual: number | null;
        adjustedResidual: number | null;
        rowPercent: number;
        colPercent: number;
        totalPercent: number;
    }[][];
} 