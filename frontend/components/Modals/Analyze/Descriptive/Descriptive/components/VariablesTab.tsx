import React, { FC, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Variable, spssDateTypes, VariableType } from "@/types/Variable";
import { HighlightedVariableInfo } from "../types";
import { Dispatch, SetStateAction } from "react";
import VariableListManager, { TargetListConfig } from "@/components/Common/VariableListManager";
import { ActiveElementHighlight } from "@/components/Common/TourComponents";
import { TourStep } from "../hooks/useTourGuide";

export interface VariablesTabProps {
    availableVariables: Variable[];
    selectedVariables: Variable[];
    highlightedVariable: HighlightedVariableInfo | null;
    setHighlightedVariable: Dispatch<SetStateAction<HighlightedVariableInfo | null>>;
    moveToSelectedVariables: (variable: Variable, targetIndex?: number) => void;
    moveToAvailableVariables: (variable: Variable, targetIndex?: number) => void;
    reorderVariables: (source: 'selected', variables: Variable[]) => void;
    saveStandardized: boolean;
    setSaveStandardized: Dispatch<SetStateAction<boolean>>;
    tourActive?: boolean;
    currentStep?: number;
    tourSteps?: TourStep[];
}

const VariablesTab: FC<VariablesTabProps> = ({
    availableVariables,
    selectedVariables,
    highlightedVariable,
    setHighlightedVariable,
    moveToSelectedVariables,
    moveToAvailableVariables,
    reorderVariables,
    saveStandardized,
    setSaveStandardized,
    tourActive = false,
    currentStep = 0,
    tourSteps = [],
}) => {
    const variableIdKeyToUse: keyof Variable = 'id';

    // Normalize to three core types: numeric, string, date
    const allowedNumericTypes = new Set<VariableType>([
        'NUMERIC',
        'COMMA',
        'DOT',
        'SCIENTIFIC',
        'DOLLAR',
        'RESTRICTED_NUMERIC',
    ]);

    const isNumericType = (t?: VariableType): boolean => !!t && allowedNumericTypes.has(t);
    // const isStringType = (t?: VariableType): boolean => t === 'STRING'; // reserved if needed later
    const isDateType = (t?: VariableType): boolean => !!t && spssDateTypes.has(t);

    // For Descriptives, only show numeric variables with scale measurement level
    const filteredAvailableVariables = availableVariables.filter(variable => 
        isNumericType(variable.type) && 
        (variable.measure === 'scale' || variable.measure === 'unknown' || !variable.measure)
    );

    const getDisplayName = (variable: Variable) => {
        if (!variable.label) return variable.name;
        return `${variable.label} [${variable.name}]`;
    };

    const handleDoubleClick = (variable: Variable, sourceListId: string) => {
        // Prevent moving from available to selected if it's disabled (numeric scale only)
        if (sourceListId === 'available') {
            const isValidForDescriptives = isNumericType(variable.type) && 
                (variable.measure === 'scale' || variable.measure === 'unknown' || !variable.measure);
            if (!isValidForDescriptives) {
                return;
            }
        }

        if (sourceListId === 'available') {
            moveToSelectedVariables(variable);
        } else if (sourceListId === 'selected') {
            // Always allow moving back to available
            moveToAvailableVariables(variable);
        }
    };

    const targetLists: TargetListConfig[] = [
        {
            id: 'selected',
            title: 'Variable(s):',
            variables: selectedVariables,
            height: '300px',
        }
    ];

    const managerHighlightedVariable = highlightedVariable
        ? { id: String(highlightedVariable.id), source: highlightedVariable.source }
        : null;

    const setManagerHighlightedVariable = useCallback((value: { id: string, source: string } | null) => {
        if (value && (value.source === 'available' || value.source === 'selected')) {
            setHighlightedVariable({ id: Number(value.id), source: value.source as 'available' | 'selected' });
        } else {
            setHighlightedVariable(null);
        }
    }, [setHighlightedVariable]);

    const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => {
        if (toListId === 'selected') {
            moveToSelectedVariables(variable, targetIndex);
        } else if (toListId === 'available') {
            moveToAvailableVariables(variable, targetIndex);
        }
    }, [moveToSelectedVariables, moveToAvailableVariables]);

    const handleReorderVariables = useCallback((listId: string, variables: Variable[]) => {
        if (listId === 'selected') {
            reorderVariables('selected', variables);
        }
    }, [reorderVariables]);

    // Check for variables with non-scale measurement levels (should be rare now due to filtering)
    const nonScaleVariables = selectedVariables.filter(variable => 
        variable.measure && variable.measure !== 'scale' && variable.measure !== 'unknown'
    );
    const nonScaleCount = nonScaleVariables.length;
    
    // Check for variables with unknown measurement levels
    const unknownVariables = selectedVariables.filter(variable => 
        variable.measure === 'unknown'
    );
    const unknownCount = unknownVariables.length;

    const renderSelectedFooter = useCallback((listId: string) => {
        if (listId === 'selected') {
            const stepIndex = tourSteps.findIndex(step => step.targetId === 'save-standardized-section');
            return (
                <div className="mt-4">
                    <div id="save-standardized-section" className="flex items-center relative">
                        <Checkbox
                            id="saveStandardized"
                            data-testid="save-standardized-checkbox"
                            checked={saveStandardized}
                            onCheckedChange={(checked) => setSaveStandardized(!!checked)}
                            className="mr-2 h-4 w-4 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        />
                        <Label htmlFor="saveStandardized" className="text-sm cursor-pointer">
                            Save standardized values as variables
                        </Label>
                        <ActiveElementHighlight active={tourActive && currentStep === stepIndex} />
                    </div>
                </div>
            );
        }
        return null;
    }, [saveStandardized, setSaveStandardized, tourActive, currentStep, tourSteps]);
    
    return (
        <div className="space-y-4">
            {/* Warning for unknown measurement levels */}
            {unknownCount > 0 && (
                <div className="text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-md p-2 mb-2">
                    {unknownCount} variable{unknownCount > 1 ? 's' : ''} with unknown measurement level.
                </div>
            )}
            {/* Warning for non-scale measurement levels */}
            {nonScaleCount > 0 && (
                <div className="text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-md p-2 mb-2">
                    {nonScaleCount} variable{nonScaleCount > 1 ? 's' : ''} with non-scale measurement level (nominal/ordinal).
                </div>
            )}
            <div className="relative">
                <VariableListManager
                    availableVariables={filteredAvailableVariables}
                    targetLists={targetLists}
                    variableIdKey={variableIdKeyToUse}
                    highlightedVariable={managerHighlightedVariable}
                    setHighlightedVariable={setManagerHighlightedVariable}
                    onMoveVariable={handleMoveVariable}
                    onReorderVariable={handleReorderVariables}
                    onVariableDoubleClick={handleDoubleClick}
                    getDisplayName={getDisplayName}
                    showArrowButtons={true}
                    renderListFooter={renderSelectedFooter}
                />
                <div id="descriptive-available-variables" className="absolute top-0 left-0 w-[48%] h-full pointer-events-none rounded-md">
             <ActiveElementHighlight active={tourActive && currentStep === tourSteps.findIndex(step => step.targetId === 'descriptive-available-variables')} />
                </div>
                <div id="descriptive-selected-variables" className="absolute top-0 right-0 w-[48%] h-full pointer-events-none rounded-md">
             <ActiveElementHighlight active={tourActive && currentStep === tourSteps.findIndex(step => step.targetId === 'descriptive-selected-variables')} />
                </div>
            </div>
        </div>
    );
};

export default VariablesTab;