import React, { FC, useCallback, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Variable } from "@/types/Variable";
import VariableListManager, { TargetListConfig } from '@/components/Common/VariableListManager';

interface VariablesTabProps {
    availableVariables: Variable[];
    selectedVariables: Variable[];
    highlightedVariable: { columnIndex: number, source: 'available' | 'selected' } | null;
    setHighlightedVariable: React.Dispatch<React.SetStateAction<{ columnIndex: number, source: 'available' | 'selected' } | null>>;
    moveToSelectedVariables: (variable: Variable, targetIndex?: number) => void;
    moveToAvailableVariables: (variable: Variable, targetIndex?: number) => void;
    reorderVariables: (source: 'available' | 'selected', variables: Variable[]) => void;
    saveAsVariable: boolean;
    setSaveAsVariable: React.Dispatch<React.SetStateAction<boolean>>;
}

const VariablesTab: FC<VariablesTabProps> = ({
    availableVariables,
    selectedVariables,
    highlightedVariable,
    setHighlightedVariable,
    moveToSelectedVariables,
    moveToAvailableVariables,
    reorderVariables,
    saveAsVariable,
    setSaveAsVariable
}) => {
    const variableIdKeyToUse: keyof Variable = 'columnIndex';

    // Filter availableVariables to include only NUMERIC and DATE types
    const filteredAvailableVariables = useMemo(() => {
        return availableVariables.filter(
            (variable) => variable
        );
    }, [availableVariables]);

    const targetLists: TargetListConfig[] = [
        {
            id: 'selected',
            title: 'Variable(s):',
            variables: selectedVariables,
            height: '100px',
            draggableItems: true,
            droppable: true,
            maxItems: 1,
        }
    ];

    const managerHighlightedVariable = highlightedVariable
        ? { id: highlightedVariable.columnIndex.toString(), source: highlightedVariable.source }
        : null;

    const setManagerHighlightedVariable = useCallback((value: { id: string, source: string } | null) => {
        const colIndex = value ? parseInt(value.id, 10) : null;
        if (value && (value.source === 'available' || value.source === 'selected') && colIndex !== null && !isNaN(colIndex)) {
            setHighlightedVariable({ columnIndex: colIndex, source: value.source as 'available' | 'selected' });
        } else {
            if (value && (isNaN(colIndex ?? NaN))) {
                console.warn(`Could not parse columnIndex from id: ${value.id}. Check variable data consistency.`);
            }
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

    const renderSelectedFooter = useCallback((listId: string) => {
        if (listId === 'selected') {
            return (
                <div className="mt-4">
                    <div className="flex items-center">
                        <Checkbox
                            id="saveAsVariable"
                            checked={saveAsVariable}
                            onCheckedChange={(checked) => setSaveAsVariable(!!checked)}
                            className="mr-2 border-slate-300 h-4 w-4 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        />
                        <Label htmlFor="saveAsVariable" className="text-sm cursor-pointer">
                            Save forecasting values as variable
                        </Label>
                    </div>
                </div>
            );
        }
        return null;
    }, [saveAsVariable, setSaveAsVariable]);

    return (
        <VariableListManager
            availableVariables={filteredAvailableVariables}
            targetLists={targetLists}
            variableIdKey={variableIdKeyToUse}
            highlightedVariable={managerHighlightedVariable}
            setHighlightedVariable={setManagerHighlightedVariable}
            onMoveVariable={handleMoveVariable}
            onReorderVariable={handleReorderVariables}
            renderListFooter={renderSelectedFooter}
            onVariableDoubleClick={() => {}}
        />
    );
};

export default VariablesTab;