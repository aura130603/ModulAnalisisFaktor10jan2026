import React, { FC, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import VariableListManager, { TargetListConfig } from '@/components/Common/VariableListManager';
import { ActiveElementHighlight } from "@/components/Common/TourComponents";
import { Variable } from "@/types/Variable";
import { VariablesTabProps } from "../types";

const VariablesTab: FC<VariablesTabProps> = ({
    availableVariables,
    testVariables,
    testValue,
    setTestValue,
    estimateEffectSize,
    setEstimateEffectSize,
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
            title: 'Test Variable(s):',
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
            moveToAvailableVariables(variable, targetIndex);
        }
    }, [moveToTestVariables, moveToAvailableVariables, isVariableDisabled]);

    const handleReorderVariables = useCallback((listId: string, variables: Variable[]) => {
        if (listId === 'test') {
            reorderVariables('test', variables);
        }
    }, [reorderVariables]);
    
    // Helper function to check if an element is the current tour target
    const isTourElementActive = useCallback((elementId: string) => {
        if (!tourActive || currentStep >= tourSteps.length) return false;
        return tourSteps[currentStep]?.targetId === elementId;
    }, [tourActive, currentStep, tourSteps]);


    const renderTestFooter = useCallback((listId: string) => {
        if (listId === 'test') {
            return (
                <>
                    <div className="mt-4 space-y-2">
                        <div id="test-value-section" className="flex items-center relative">
                            <Label htmlFor="test-value" className="w-20 h-8 text-sm">Test Value:</Label>
                            <Input
                                id="test-value"
                                type="number"
                                value={testValue}
                                onChange={(e) => setTestValue(Number(e.target.value))}
                                className="w-20 h-8 text-sm"
                            />
                            {tourActive && isTourElementActive("test-value-section") && (
                                <div className="absolute inset-0 pointer-events-none border-2 border-primary animate-pulse rounded-md z-10"></div>
                            )}
                        </div>
                        <div id="estimate-effect-size-section" className="flex items-center relative">
                            <Checkbox
                                id="estimate-effect-size"
                                checked={estimateEffectSize}
                                onCheckedChange={(checked) => setEstimateEffectSize(!!checked)}
                                className="mr-2 h-4 w-4 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                disabled
                            />
                            <Label htmlFor="estimate-effect-size" className="text-sm cursor-pointer">
                                Estimate effect size
                            </Label>
                            {tourActive && isTourElementActive("estimate-effect-size-section") && (
                                <div className="absolute inset-0 pointer-events-none border-2 border-primary animate-pulse rounded-md z-10"></div>
                            )}
                        </div>
                    </div>
                </>
            );
        }
        return null;
    }, [testValue, setTestValue, estimateEffectSize, setEstimateEffectSize, tourActive, isTourElementActive]);

    return (
        <div className="space-y-4">
            <div className="relative">
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
                    renderListFooter={renderTestFooter}
                />
                <div id="one-sample-t-test-available-variables" className="absolute top-0 left-0 w-[48%] h-full pointer-events-none rounded-md">
                    <ActiveElementHighlight active={tourActive && currentStep === tourSteps.findIndex(step => step.targetId === 'one-sample-t-test-available-variables')} />
                </div>
                <div id="one-sample-t-test-test-variables" className="absolute top-0 right-0 w-[48%] h-full pointer-events-none rounded-md">
                    <ActiveElementHighlight active={tourActive && currentStep === tourSteps.findIndex(step => step.targetId === 'one-sample-t-test-test-variables')} />
                </div>
            </div>
        </div>
    );
};

export default VariablesTab;