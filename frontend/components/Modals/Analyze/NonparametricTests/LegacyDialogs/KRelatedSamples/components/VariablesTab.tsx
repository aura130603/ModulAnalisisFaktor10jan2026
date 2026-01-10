import React, { FC, useCallback } from "react";
import VariableListManager, { TargetListConfig } from '@/components/Common/VariableListManager';
import { ActiveElementHighlight } from "@/components/Common/TourComponents";
import { Variable } from "@/types/Variable";
import { VariablesTabProps } from "../types";

const VariablesTab: FC<VariablesTabProps> = ({
    availableVariables,
    testVariables,
    highlightedVariable,
    setHighlightedVariable,
    moveToTestVariables,
    moveToAvailableVariables,
    reorderVariables,
    tourActive = false,
    currentStep = 0,
    tourSteps = [],
}) => {
    const variableIdKeyToUse: keyof Variable = 'tempId';

    const getDisplayName = (variable: Variable) => {
        if (!variable.label) return variable.name;
        return `${variable.label} [${variable.name}]`;
    };

    const isVariableDisabled = useCallback((variable: Variable): boolean => {   
        return variable.type !== 'NUMERIC';
    }, []);

    const handleDoubleClick = (variable: Variable, sourceListId: string) => {
        if (sourceListId === 'available' && isVariableDisabled(variable)) {
            return;
        }
        
        if (sourceListId === 'available') {
            moveToTestVariables(variable);
        } else if (sourceListId === 'test') {
            moveToAvailableVariables(variable);
        }
    };

    const targetLists: TargetListConfig[] = [
        {
            id: 'test',
            title: 'Test Variables:',
            variables: testVariables,
            height: '300px'
        }
    ];

    const managerHighlightedVariable = highlightedVariable
        ? { id: highlightedVariable.tempId, source: highlightedVariable.source }
        : null;

    const setManagerHighlightedVariable = useCallback((value: { id: string, source: string } | null) => {
        if (value && (value.source === 'available' || value.source === 'test')) {
            setHighlightedVariable({ tempId: value.id, source: value.source as 'available' | 'test' });
        } else {
            setHighlightedVariable(null);
        }
    }, [setHighlightedVariable]);

    const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => {
        if (toListId === 'test' && isVariableDisabled(variable)) {
            return;
        }
        
        if (toListId === 'test') {
            moveToTestVariables(variable, targetIndex);
        } else if (toListId === 'available') {
            moveToAvailableVariables(variable);
        }
    }, [moveToTestVariables, moveToAvailableVariables, isVariableDisabled]);

    const handleReorderVariables = useCallback((listId: string, variables: Variable[]) => {
        if (listId === 'test') {
            reorderVariables('test', variables);
        }
    }, [reorderVariables]);

    const isTourElementActive = useCallback((elementId: string) => {
        if (!tourActive || currentStep >= tourSteps.length) return false;
        return tourSteps[currentStep]?.targetId === elementId;
    }, [tourActive, currentStep, tourSteps]);

    return (
        <div className="space-y-2">
            <VariableListManager
                availableVariables={availableVariables}
                targetLists={targetLists}
                variableIdKey={variableIdKeyToUse}
                highlightedVariable={managerHighlightedVariable}
                setHighlightedVariable={setManagerHighlightedVariable}
                onMoveVariable={handleMoveVariable}
                onReorderVariable={handleReorderVariables}
                onVariableDoubleClick={handleDoubleClick}
                getDisplayName={getDisplayName}
                isVariableDisabled={isVariableDisabled}
                showArrowButtons={true}
            />

            <div id="k-related-samples-available-variables" className="absolute top-0 left-0 w-[48%] h-full pointer-events-none rounded-md">
                <ActiveElementHighlight active={tourActive && currentStep === tourSteps.findIndex(step => step.targetId === 'k-related-samples-available-variables')} />
            </div>
            <div id="k-related-samples-test-variables" className="absolute top-0 right-0 w-[48%] h-full pointer-events-none rounded-md">
                <ActiveElementHighlight active={tourActive && currentStep === tourSteps.findIndex(step => step.targetId === 'k-related-samples-test-variables')} />
            </div>
        </div>
    );
};

export default VariablesTab;