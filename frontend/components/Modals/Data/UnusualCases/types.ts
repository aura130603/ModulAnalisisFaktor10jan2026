import type React from 'react';
import type { Variable } from "@/types/Variable";
import type { TourStep } from './hooks/useTourGuide';
import type { Dispatch, SetStateAction } from 'react';
import type { useUnusualCases } from './hooks/useUnusualCases';

export type TabType = 'variables' | 'options';

export interface IdentifyUnusualCasesProps {
    onClose: () => void;
    containerType?: "dialog" | "sidebar";
}

export type UnusualCasesHook = ReturnType<typeof useUnusualCases>;

// From VariablesTab.tsx
export type UnusualCasesSource = 'available' | 'analysis' | 'identifier';

interface TourTabProps {
    tourActive?: boolean;
    currentStep?: number;
    tourSteps?: TourStep[];
}

export type VariablesTabProps = Pick<UnusualCasesHook, 
    | "availableVariables" | "analysisVariables" | "caseIdentifierVariable" 
    | "highlightedVariable" | "setHighlightedVariable" | "moveToAvailableVariables" 
    | "moveToAnalysisVariables" | "moveToCaseIdentifierVariable" | "reorderVariables" | "errorMsg"
> & {
    getVariableIcon: (variable: Variable) => React.JSX.Element;
    getDisplayName: (variable: Variable) => string;
} & TourTabProps;


// From OutputTab.tsx
export type OutputTabProps = Pick<UnusualCasesHook,
    | "showUnusualCasesList" | "setShowUnusualCasesList" | "peerGroupNorms" 
    | "setPeerGroupNorms" | "anomalyIndices" | "setAnomalyIndices" 
    | "reasonOccurrence" | "setReasonOccurrence" | "caseProcessed" | "setCaseProcessed"
> & TourTabProps;

// From SaveTab.tsx
export type SaveTabProps = Pick<UnusualCasesHook,
    | "saveAnomalyIndex" | "setSaveAnomalyIndex" | "anomalyIndexName" 
    | "setAnomalyIndexName" | "savePeerGroups" | "setSavePeerGroups"
    | "saveReasons" | "setSaveReasons" | "replaceExisting" | "setReplaceExisting"
> & TourTabProps;


// From MissingValuesTab.tsx
export type MissingValuesTabProps = Pick<UnusualCasesHook,
    | "missingValuesOption" | "setMissingValuesOption" | "useProportionMissing" | "setUseProportionMissing"
> & TourTabProps;


// From OptionsTab.tsx
export type OptionsTabProps = Pick<UnusualCasesHook,
    | "identificationCriteria" | "setIdentificationCriteria" | "percentageValue" | "setPercentageValue"
    | "fixedNumber" | "setFixedNumber" | "useMinimumValue" | "setUseMinimumValue"
    | "cutoffValue" | "setCutoffValue" | "minPeerGroups" | "setMinPeerGroups"
    | "maxPeerGroups" | "setMaxPeerGroups" | "maxReasons" | "setMaxReasons"
> & TourTabProps; 