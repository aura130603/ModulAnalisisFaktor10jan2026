import type { FC} from "react";
import React, { useCallback } from "react";
import { InfoIcon } from "lucide-react";
import type { TargetListConfig } from '@/components/Common/VariableListManager';
import VariableListManager from '@/components/Common/VariableListManager';
import { ActiveElementHighlight } from "@/components/Common/TourComponents";
import type { Variable } from "@/types/Variable";
import type { VariablesTabProps, UnusualCasesSource } from "./types";

// // Possible sources within this specific modal's variable lists (MOVED TO TYPES.TS)
// type UnusualCasesSource = 'available' | 'analysis' | 'identifier';

// interface VariablesTabProps { // MOVED TO TYPES.TS
//     availableVariables: Variable[];
//     analysisVariables: Variable[];
//     caseIdentifierVariable: Variable | null; 
//     highlightedVariable: { tempId: string, source: UnusualCasesSource } | null;
//     setHighlightedVariable: React.Dispatch<React.SetStateAction<{ tempId: string, source: UnusualCasesSource } | null>>;
//     moveToAvailableVariables: (variable: Variable, source: 'analysis' | 'identifier', targetIndex?: number) => void;
//     moveToAnalysisVariables: (variable: Variable, targetIndex?: number) => void;
//     moveToCaseIdentifierVariable: (variable: Variable) => void; 
//     reorderVariables: (source: 'analysis', variables: Variable[]) => void; 
//     errorMsg: string | null;
//     // getVariableIcon and getDisplayName will be passed through props
// }

const VariablesTab: FC<VariablesTabProps> = ({
    availableVariables,
    analysisVariables,
    caseIdentifierVariable,
    highlightedVariable,
    setHighlightedVariable,
    moveToAvailableVariables,
    moveToAnalysisVariables,
    moveToCaseIdentifierVariable,
    reorderVariables,
    errorMsg,
    getVariableIcon,
    getDisplayName,
    tourActive,
    currentStep,
    tourSteps
}) => {
    const analysisStepIndex = tourSteps?.findIndex(step => step.targetId === 'unusual-cases-analysis-variables');
    const identifierStepIndex = tourSteps?.findIndex(step => step.targetId === 'unusual-cases-identifier-variable');

    const variableIdKeyToUse: keyof Variable = 'tempId';

    // 1. Configure the target lists
    const targetLists: TargetListConfig[] = [
        {
            id: 'analysis',
            title: 'Analysis Variables',
            variables: analysisVariables,
            height: '13rem',
            draggableItems: true,
            droppable: true,
        },
        {
            id: 'identifier',
            title: 'Case Identifier Variable',
            variables: caseIdentifierVariable ? [caseIdentifierVariable] : [],
            height: '4.5rem',
            maxItems: 1,
            draggableItems: false,
            droppable: true,
        }
    ];

    // 2. Adapt highlightedVariable state for the manager (tempId -> id)
    const managerHighlightedVariable = highlightedVariable
        ? { id: highlightedVariable.tempId, source: highlightedVariable.source }
        : null;

    // Adapt the setter function to convert back (id -> tempId)
    const setManagerHighlightedVariable = useCallback((value: { id: string, source: string } | null) => {
        if (value && ['available', 'analysis', 'identifier'].includes(value.source)) {
            setHighlightedVariable({ tempId: value.id, source: value.source as UnusualCasesSource });
        } else {
            setHighlightedVariable(null);
        }
    }, [setHighlightedVariable]);

    // 3. Create onMoveVariable callback
    const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => {
        const source = fromListId as UnusualCasesSource;
        switch (toListId) {
            case 'available':
                if (source === 'analysis' || source === 'identifier') {
                    moveToAvailableVariables(variable, source, targetIndex);
                }
                break;
            case 'analysis':
                if (source === 'available') {
                    moveToAnalysisVariables(variable, targetIndex);
                }
                break;
            case 'identifier':
                if (source === 'available') {
                    moveToCaseIdentifierVariable(variable);
                }
                break;
        }
    }, [moveToAvailableVariables, moveToAnalysisVariables, moveToCaseIdentifierVariable]);

    // 4. Create onReorderVariable callback
    const handleReorderVariables = useCallback((listId: string, reorderedList: Variable[]) => {
        if (listId === 'analysis') {
            reorderVariables(listId as 'analysis', reorderedList);
        }
    }, [reorderVariables]);

    return (
        <div className="relative">
            <VariableListManager
                availableVariables={availableVariables}
                targetLists={targetLists}
                variableIdKey={variableIdKeyToUse}
                highlightedVariable={managerHighlightedVariable}
                setHighlightedVariable={setManagerHighlightedVariable}
                onMoveVariable={handleMoveVariable}
                onReorderVariable={handleReorderVariables}
                getVariableIcon={getVariableIcon}
                getDisplayName={getDisplayName}
            />
            {/* Overlays for tour highlighting. These are positioned over the target list areas */}
            <div 
                id="unusual-cases-analysis-variables" 
                className="absolute top-0 right-0 w-[48%] h-[15.5rem] pointer-events-none"
            >
                <ActiveElementHighlight active={!!(tourActive && currentStep === analysisStepIndex)} />
            </div>
            <div 
                id="unusual-cases-identifier-variable" 
                className="absolute top-[16.5rem] right-0 w-[48%] h-[7rem] pointer-events-none"
            >
                <ActiveElementHighlight active={!!(tourActive && currentStep === identifierStepIndex)} />
            </div>
            {errorMsg && (
                <div className="col-span-2 text-destructive text-sm mt-3 p-2 bg-destructive/10 border border-destructive/30 rounded">
                    {errorMsg}
                </div>
            )}
        </div>
    );
};

export default VariablesTab;