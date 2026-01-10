import React, { FC, useCallback, useMemo } from "react";
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
}

const VariablesTab: FC<VariablesTabProps> = ({
    availableVariables,
    selectedVariables,
    highlightedVariable,
    setHighlightedVariable,
    moveToSelectedVariables,
    moveToAvailableVariables,
    reorderVariables,
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

    return (
        <VariableListManager
            availableVariables={filteredAvailableVariables}
            targetLists={targetLists}
            variableIdKey={variableIdKeyToUse}
            highlightedVariable={managerHighlightedVariable}
            setHighlightedVariable={setManagerHighlightedVariable}
            onMoveVariable={handleMoveVariable}
            onReorderVariable={handleReorderVariables}
            onVariableDoubleClick={() => {}}
        />
    );
};

export default VariablesTab;