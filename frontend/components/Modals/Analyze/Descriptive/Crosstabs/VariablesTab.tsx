// VariablesTab.tsx
import React, { FC, useCallback } from "react";
import type { Variable } from "@/types/Variable";
import { VariablesTabProps, VariableHighlight } from "./types";
import { ActiveElementHighlight } from "@/components/Common/TourComponents";
import VariableListManager, { TargetListConfig } from "@/components/Common/VariableListManager";

const CrosstabsVariablesTab: FC<VariablesTabProps> = ({
    availableVariables,
    rowVariables,
    columnVariables,
    highlightedVariable,
    setHighlightedVariable,
    moveToRowVariables,
    moveToColumnVariables,
    moveToAvailableVariables,
    reorderVariables,
    tourActive = false,
    currentStep = 0,
    tourSteps = [],
}) => {
    // --- Configuration for VariableListManager ---
    // Use 'name' as universal identity; it's required and unique across variables
    const variableIdKeyToUse: keyof Variable = 'name';
    
    // Show all available variables (tests use STRING types)
    const filteredAvailableVariables = availableVariables;

    const targetLists: TargetListConfig[] = [
        {
            id: 'row',
            title: 'Row(s)',
            variables: rowVariables,
            height: '112px',
        },
        {
            id: 'column',
            title: 'Column(s)',
            variables: columnVariables,
            height: '112px',
        },
    ];

    // --- Adapter for highlighted variable state ---
    const handleSetHighlightedVariable = useCallback((value: { id: string; source: string; } | null) => {
        if (value && (value.source === 'available' || value.source === 'row' || value.source === 'column')) {
            setHighlightedVariable(value as VariableHighlight);
        } else {
            setHighlightedVariable(null);
        }
    }, [setHighlightedVariable]);

    // --- Adapter functions for event handlers ---
    const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string) => {
        if (toListId === 'row') {
            moveToRowVariables(variable);
        } else if (toListId === 'column') {
            moveToColumnVariables(variable);
        } else if (toListId === 'available') {
            moveToAvailableVariables(variable, fromListId as 'row' | 'column');
        }
    }, [moveToRowVariables, moveToColumnVariables, moveToAvailableVariables]);

    const handleReorderVariable = useCallback((listId: string, variables: Variable[]) => {
        reorderVariables(listId as 'available' | 'row' | 'column', variables);
    }, [reorderVariables]);

    const handleVariableDoubleClick = useCallback((variable: Variable, sourceListId: string) => {
        if (sourceListId === 'available') {
            moveToRowVariables(variable); // Default to rows on double-click from available
        } else if (sourceListId === 'row' || sourceListId === 'column') {
            moveToAvailableVariables(variable, sourceListId);
        }
    }, [moveToRowVariables, moveToAvailableVariables]);

    // --- Tour Guide Integration ---
    const getStepIndex = (targetId: string) => tourSteps.findIndex(step => step.targetId === targetId);
    const availableVarsStep = getStepIndex('crosstabs-available-variables');
    const rowVarsStep = getStepIndex('crosstabs-row-variables');
    const colVarsStep = getStepIndex('crosstabs-column-variables');

    return (
        <div className="p-4" data-testid="crosstabs-variables-tab-content">
            <div className="relative" data-testid="crosstabs-variable-lists-container">
                <VariableListManager
                    availableVariables={filteredAvailableVariables}
                    targetLists={targetLists}
                    variableIdKey={variableIdKeyToUse}
                    highlightedVariable={highlightedVariable}
                    setHighlightedVariable={handleSetHighlightedVariable}
                    onMoveVariable={handleMoveVariable}
                    onReorderVariable={handleReorderVariable}
                    onVariableDoubleClick={handleVariableDoubleClick}
                    availableListHeight="268px"
                    data-testid="crosstabs-variable-list-manager"
                />
                
                {/* Tour highlight overlays */}
                <div id="crosstabs-available-variables" className="absolute top-0 left-0 w-[49%] h-full pointer-events-none rounded-md" data-testid="crosstabs-available-variables-overlay">
                    <ActiveElementHighlight active={tourActive && currentStep === availableVarsStep} />
                </div>
                <div id="crosstabs-row-variables" className="absolute top-0 right-0 w-[49%] h-[48%] pointer-events-none rounded-md" data-testid="crosstabs-row-variables-overlay">
                    <ActiveElementHighlight active={tourActive && currentStep === rowVarsStep} />
                </div>
                <div id="crosstabs-column-variables" className="absolute top-[52%] right-0 w-[49%] h-[48%] pointer-events-none rounded-md" data-testid="crosstabs-column-variables-overlay">
                    <ActiveElementHighlight active={tourActive && currentStep === colVarsStep} />
                </div>
            </div>
        </div>
    );
};

export default CrosstabsVariablesTab;