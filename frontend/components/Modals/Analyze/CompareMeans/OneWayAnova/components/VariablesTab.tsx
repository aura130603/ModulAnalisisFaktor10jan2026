import { FC, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import VariableListManager, { TargetListConfig } from '@/components/Common/VariableListManager';
import { ActiveElementHighlight } from "@/components/Common/TourComponents";
import { Variable } from "@/types/Variable";
import { VariablesTabProps } from "../types";

const VariablesTab: FC<VariablesTabProps> = ({
    availableVariables,
    testVariables,
    factorVariable,
    estimateEffectSize,
    setEstimateEffectSize,
    highlightedVariable,
    setHighlightedVariable,
    moveToAvailableVariables,
    moveToTestVariables,
    moveToFactorVariable,
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
        
        if (sourceListId === 'available' && factorVariable) {
            moveToTestVariables(variable);
        } else if (sourceListId === 'test' || sourceListId === 'factor') {
            moveToAvailableVariables(variable);
        }
    };

    const targetLists: TargetListConfig[] = [
        {
            id: 'test',
            title: 'Test Variable(s)',
            variables: testVariables,
            height: '169.5px',
            draggableItems: true,
            droppable: true,
        },
        {
            id: 'factor',
            title: 'Factor Variable',
            variables: factorVariable ? [factorVariable] : [],
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
        if (value && (value.source === 'available' || value.source === 'test' || value.source === 'factor')) {
            setHighlightedVariable({ tempId: value.id, source: value.source as 'available' | 'test' | 'factor' });
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
        } else if (toListId === 'factor') {
            moveToFactorVariable(variable);
        } else if (toListId === 'available') {
            moveToAvailableVariables(variable);
        }
    }, [moveToTestVariables, moveToFactorVariable, moveToAvailableVariables, isVariableDisabled]);

    const handleReorderVariables = useCallback((listId: string, variables: Variable[]) => {
        if (listId === 'test') {
            reorderVariables('test', variables);
        }
    }, [reorderVariables]);

    const isTourElementActive = useCallback((elementId: string) => {
        if (!tourActive || currentStep >= tourSteps.length) return false;
        return tourSteps[currentStep]?.targetId === elementId;
    }, [tourActive, currentStep, tourSteps]);

    const estimateEffectSizeFooter = useCallback((listId: string) => {
        if (listId === 'factor') {
            return (
                <>
                    <div className="mt-2">
                        <div id="estimate-effect-size-section" className="flex items-center">
                            <Checkbox
                                id="estimate-effect-size"
                                checked={estimateEffectSize}
                                onCheckedChange={(checked) => setEstimateEffectSize(!!checked)}
                                className="mr-2 border-[#CCCCCC]"
                                disabled
                            />
                            <Label htmlFor="estimate-effect-size" className="text-sm">
                                Estimate effect size
                            </Label>
                            {tourActive && isTourElementActive("estimate-effect-size-section") && (
                                <div className="absolute bottom-0 right-0 w-full h-6 pointer-events-none border-2 border-primary animate-pulse rounded-md z-10"></div>
                            )}
                        </div>
                    </div>
                </>
            );
        }
        return null;
    }, [estimateEffectSize, setEstimateEffectSize, tourActive, isTourElementActive]);

    // --- Render the manager component and error message ---
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
                    availableListHeight={'273.5px'}
                    getDisplayName={getDisplayName}
                    isVariableDisabled={isVariableDisabled}
                    renderListFooter={estimateEffectSizeFooter}
                    showArrowButtons={true}
                />

                <div id="one-way-anova-available-variables" className="absolute top-0 left-0 w-[48%] h-full pointer-events-none rounded-md">
                    <ActiveElementHighlight active={tourActive && currentStep === tourSteps.findIndex(step => step.targetId === 'one-way-anova-available-variables')} />
                </div>
                <div id="one-way-anova-test-variables" className="absolute top-0 right-0 w-[48%] h-[75%] pointer-events-none rounded-md">
                    <ActiveElementHighlight active={tourActive && currentStep === tourSteps.findIndex(step => step.targetId === 'one-way-anova-test-variables')} />
                </div>
                <div id="factor-variable-section" className="absolute top-[52%] right-0 w-[48%] h-[22%] pointer-events-none rounded-md">
                    <ActiveElementHighlight active={tourActive && currentStep === tourSteps.findIndex(step => step.targetId === 'factor-variable-section')} />
                </div>
            </div>
        </div>
    );
};

export default VariablesTab;