import React, { FC, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Variable } from "@/types/Variable";
import VariableListManager, { TargetListConfig } from '@/components/Common/VariableListManager';
import { TourStep } from "./hooks/useTourGuide";
import { ActiveElementHighlight } from "@/components/Common/TourComponents";
import { VariableSelectionResult } from "./hooks/useVariableSelection";
import { DisplaySettingsResult } from "./hooks/useDisplaySettings";

export interface VariablesTabProps {
    variableSelection: VariableSelectionResult;
    displaySettings: DisplaySettingsResult;
    containerType?: "dialog" | "sidebar";
    tourActive?: boolean;
    currentStep?: number;
    tourSteps?: TourStep[];
}

const VariablesTab: FC<VariablesTabProps> = ({
    variableSelection,
    displaySettings,
    containerType = "dialog",
    tourActive = false,
    currentStep = 0,
    tourSteps = [],
}) => {
    const {
        availableVariables,
        selectedVariables,
        highlightedVariable,
        setHighlightedVariable,
        moveToSelectedVariables,
        moveToAvailableVariables,
        reorderVariables,
    } = variableSelection;

    const { showFrequencyTables, setShowFrequencyTables } = displaySettings;
    
    const variableIdKeyToUse: keyof Variable = 'id';

    // --- Adapt props for VariableListManager ---

    // 1. Configure the target list(s)
    const targetLists: TargetListConfig[] = [
        {
            id: 'selected',
            title: 'Variable(s):',
            variables: selectedVariables,
            height: '300px', // Changed to fixed height
            draggableItems: true,
            droppable: true
        }
    ];

    // 2. Adapt highlightedVariable state
    // Map internal state {tempId, source} to manager's {id, source}
    const managerHighlightedVariable = highlightedVariable
        ? { id: String(highlightedVariable.id), source: highlightedVariable.source }
        : null;

    // Adapt setHighlightedVariable to map back from manager's format
    const setManagerHighlightedVariable = useCallback((value: { id: string, source: string } | null) => {
        if (value && (value.source === 'available' || value.source === 'selected')) {
            const parsedId = Number(value.id);
            if (!isNaN(parsedId)) {
                setHighlightedVariable({ id: parsedId, source: value.source as 'available' | 'selected' });
            }
        } else {
            setHighlightedVariable(null);
        }
    }, [setHighlightedVariable]);

    // 3. Create onMoveVariable callback
    const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => {
        if (toListId === 'selected') {
            moveToSelectedVariables(variable, targetIndex);
        } else if (toListId === 'available') {
            moveToAvailableVariables(variable, targetIndex);
        }
    }, [moveToSelectedVariables, moveToAvailableVariables]);

    // 4. Create onReorderVariable callback
    const handleReorderVariables = useCallback((listId: string, variables: Variable[]) => {
        if (listId === 'selected') {
            if (reorderVariables) reorderVariables('selected', variables);
        }
    }, [reorderVariables]);

    // 5. Create footer rendering function
    const renderSelectedFooter = useCallback((listId: string) => {
        if (listId === 'selected') {
            const stepIndex = tourSteps.findIndex(step => step.targetId === 'display-frequency-tables');
            return (
                <div className="mt-4">
                    <div className="flex items-center relative" id="display-frequency-tables">
                        <Checkbox
                            data-testid="display-frequency-tables-checkbox"
                            checked={showFrequencyTables}
                            onCheckedChange={(checked) => setShowFrequencyTables(!!checked)}
                            className="mr-2 h-4 w-4 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                            id="frequency-tables-checkbox"
                        />
                        <Label htmlFor="frequency-tables-checkbox" className="text-sm cursor-pointer">
                            Display frequency tables
                        </Label>
                        <ActiveElementHighlight active={tourActive && currentStep === stepIndex} />
                    </div>
                </div>
            );
        }
        return null;
    }, [showFrequencyTables, setShowFrequencyTables, tourActive, currentStep, tourSteps]);

    const availableStepIndex = tourSteps.findIndex(step => step.targetId === 'frequencies-available-variables');
    const selectedStepIndex = tourSteps.findIndex(step => step.targetId === 'frequencies-selected-variables');

    // Check if there are any selected variables with unknown measurement
    const unknownVariables = selectedVariables.filter(variable => variable.measure === 'unknown');
    const unknownCount = unknownVariables.length;

    // Render wrapper divs with IDs for tour targeting
    return (
        <div className="space-y-4">
            {/* Conditional info text about measurement levels */}
            {unknownCount > 0 && (
                <div className="text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-md p-2 mb-2">
                    {unknownCount} variable{unknownCount > 1 ? 's' : ''} with unknown measurement level.
                </div>
            )}
            <div className="relative">
                <VariableListManager
                    availableVariables={availableVariables}
                    targetLists={targetLists}
                    variableIdKey={variableIdKeyToUse}
                    highlightedVariable={managerHighlightedVariable}
                    setHighlightedVariable={setManagerHighlightedVariable}
                    onMoveVariable={handleMoveVariable}
                    onReorderVariable={handleReorderVariables}
                    renderListFooter={renderSelectedFooter}
                />
                <div id="frequencies-available-variables" className="absolute top-0 left-0 w-[48%] h-full pointer-events-none rounded-md">
                    <ActiveElementHighlight active={tourActive && currentStep === availableStepIndex} />
                </div>
                <div id="frequencies-selected-variables" className="absolute top-0 right-0 w-[48%] h-full pointer-events-none rounded-md">
                    <ActiveElementHighlight active={tourActive && currentStep === selectedStepIndex} />
                </div>
            </div>
            
            {/* Properly positioned selected-variables-wrapper around the actual selected variables content */}
            <div 
                id="selected-variables-wrapper" 
                style={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    pointerEvents: 'none',
                    opacity: 0
                }}
            >
                {/* This element allows proper tour targeting while being invisible and not interfering with UI */}
            </div>
        </div>
    );
};

export default VariablesTab;