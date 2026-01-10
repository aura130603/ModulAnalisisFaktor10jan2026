import React, { FC, useCallback } from "react";
import { Label } from "@/components/ui/label";
import VariableListManager, { TargetListConfig } from '@/components/Common/VariableListManager';
import { ActiveElementHighlight } from "@/components/Common/TourComponents";
import { Variable } from "@/types/Variable";
import { VariablesTabProps } from "../types";
import { Input } from "@/components/ui/input";

const VariablesTab: FC<VariablesTabProps> = ({
    availableVariables,
    testVariables,
    groupingVariable,
    group1,
    setGroup1,
    group2,
    setGroup2,
    highlightedVariable,
    setHighlightedVariable,
    moveToAvailableVariables,
    moveToTestVariables,
    moveToGroupingVariable,
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
        
        if (sourceListId === 'available' && groupingVariable) {
            moveToTestVariables(variable);
        } else if (sourceListId === 'test' || sourceListId === 'grouping') {
            moveToAvailableVariables(variable);
        }
    };

    const targetLists: TargetListConfig[] = [
        {
            id: 'test',
            title: 'Test Variables',
            variables: testVariables,
            height: '169.5px',
            draggableItems: true,
            droppable: true,
        },
        {
            id: 'grouping',
            title: 'Grouping Variable',
            variables: groupingVariable ? [groupingVariable] : [],
            height: '44px',
            maxItems: 1,
            draggableItems: true,
            droppable: true
        }
    ];

    const managerHighlightedVariable = highlightedVariable
        ? { id: highlightedVariable.tempId, source: highlightedVariable.source }
        : null;

    const setManagerHighlightedVariable = useCallback((value: { id: string, source: string } | null) => {
        if (value && (value.source === 'available' || value.source === 'test' || value.source === 'grouping')) {
            setHighlightedVariable({ tempId: value.id, source: value.source as 'available' | 'test' | 'grouping' });
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
        } else if (toListId === 'grouping') {
            moveToGroupingVariable(variable);
        } else if (toListId === 'available') {
            moveToAvailableVariables(variable);
        }
    }, [moveToTestVariables, moveToGroupingVariable, moveToAvailableVariables, isVariableDisabled]);

    const handleReorderVariables = useCallback((listId: string, variables: Variable[]) => {
        if (listId === 'test') {
            reorderVariables('test', variables);
        }
    }, [reorderVariables]);

    const isTourElementActive = useCallback((elementId: string) => {
        if (!tourActive || currentStep >= tourSteps.length) return false;
        return tourSteps[currentStep]?.targetId === elementId;
    }, [tourActive, currentStep, tourSteps]);

    const groupingFooter = useCallback((listId: string) => {
        if (listId === 'grouping') {
            return (
                <>
                    <div className="mt-2">
                        <div id="define-groups-section" className="bg-card border border-border rounded-md p-5 relative">
                            <div className="text-sm font-medium mb-3 text-gray-900">Define Groups</div>
                            <div className="space-y-3">
                                <div className="flex items-center space-x-3">
                                    <Label htmlFor="group1" className={`text-sm text-gray-600 min-w-[60px]`}>
                                        Group 1:
                                    </Label>
                                    <Input
                                        id="group1"
                                        type="number"
                                        value={group1 !== null && group1 !== undefined ? group1 : ""}
                                        onChange={(e) => setGroup1(e.target.value === "" ? null : Number(e.target.value))}
                                        className="w-20 h-8 text-sm"
                                    />
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Label htmlFor="group2" className={`text-sm text-gray-600 min-w-[60px]`}>
                                        Group 2:
                                    </Label>
                                    <Input
                                        id="group2"
                                        type="number"
                                        value={group2 !== null && group2 !== undefined ? group2 : ""}
                                        onChange={(e) => setGroup2(e.target.value === "" ? null : Number(e.target.value))}
                                        className="w-20 h-8 text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            );
        }
        return null;
    }, [group1, group2, setGroup1, setGroup2]);

    // --- Render the manager component and error message ---
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
                availableListHeight={'273.5px'}
                getDisplayName={getDisplayName}
                isVariableDisabled={isVariableDisabled}
                renderListFooter={groupingFooter}
                showArrowButtons={true}
            />

            <div id="two-independent-samples-available-variables" className="absolute top-0 left-0 w-[48%] h-full pointer-events-none rounded-md">
                <ActiveElementHighlight active={tourActive && currentStep === tourSteps.findIndex(step => step.targetId === 'two-independent-samples-available-variables')} />
            </div>
            <div id="two-independent-samples-test-variables" className="absolute top-0 right-0 w-[48%] h-full pointer-events-none rounded-md">
                <ActiveElementHighlight active={tourActive && currentStep === tourSteps.findIndex(step => step.targetId === 'two-independent-samples-test-variables')} />
            </div>
        </div>
    );
};

export default VariablesTab;