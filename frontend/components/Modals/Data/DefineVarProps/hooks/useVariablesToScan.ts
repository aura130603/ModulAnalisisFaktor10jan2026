import { useState, useEffect, useCallback } from 'react';
import type { Variable } from '@/types/Variable';
import type { TargetListConfig } from '@/components/Common/VariableListManager'; // Assuming TargetListConfig is exported

interface UseVariablesToScanProps {
    initialAvailableVariables: Variable[];
    onContinue: (variables: Variable[], caseLimit: string | null, valueLimit: string | null) => void;
    // onClose is handled by the component directly, not part of this hook's core logic
}

export const useVariablesToScan = ({ initialAvailableVariables, onContinue }: UseVariablesToScanProps) => {
    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [variablesToScan, setVariablesToScan] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{tempId: string, source: 'available' | 'toScan'} | null>(null);
    const [managerHighlightedVariable, setManagerHighlightedVariable] = useState<{id: string, source: string} | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [errorDialogOpen, setErrorDialogOpen] = useState<boolean>(false);
    const [limitCases, setLimitCases] = useState<boolean>(true);
    const [limitValues, setLimitValues] = useState<boolean>(true);
    const [caseLimit, setCaseLimit] = useState<string>("50");
    const [valueLimit, setValueLimit] = useState<string>("200");

    useEffect(() => {
        if (initialAvailableVariables && initialAvailableVariables.length > 0) {
            const validVars = initialAvailableVariables.filter(v => v.name !== "").map(v => ({
                ...v,
                tempId: v.tempId || `temp_${v.columnIndex}`
            }));
            setAvailableVariables(validVars);
        }
    }, [initialAvailableVariables]);

    const moveToScan = useCallback((variable: Variable, targetIndex?: number) => {
        if (!variable.tempId) return;
        setAvailableVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        setVariablesToScan(prev => {
            if (prev.some(v => v.tempId === variable.tempId)) return prev;
            const newList = [...prev];
            if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= newList.length) {
                newList.splice(targetIndex, 0, variable);
            } else {
                newList.push(variable);
            }
            return newList;
        });
        setHighlightedVariable(null);
    }, []);

    const moveToAvailable = useCallback((variable: Variable, targetIndex?: number) => {
        if (!variable.tempId) return;
        setVariablesToScan(prev => prev.filter(v => v.tempId !== variable.tempId));
        setAvailableVariables(prev => {
            if (prev.some(v => v.tempId === variable.tempId)) return prev;
            const newList = [...prev];
            if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= newList.length) {
                newList.splice(targetIndex, 0, variable);
            } else {
                newList.push(variable);
            }
            newList.sort((a, b) => a.columnIndex - b.columnIndex);
            return newList;
        });
        setHighlightedVariable(null);
    }, []);

    const reorderTargetVariables = useCallback((reorderedList: Variable[]) => {
        setVariablesToScan([...reorderedList]);
    }, []);

    // Sync internal highlightedVariable with managerHighlightedVariable for VariableListManager
    useEffect(() => {
        if (highlightedVariable) {
            setManagerHighlightedVariable({ id: highlightedVariable.tempId, source: highlightedVariable.source });
        } else {
            setManagerHighlightedVariable(null);
        }
    }, [highlightedVariable]);

    // Handle highlight changes from the VariableListManager
    const handleManagerHighlightChange = useCallback((value: { id: string, source: string } | null) => {
        if (value && (value.source === 'available' || value.source === 'toScan')) {
            setHighlightedVariable({ tempId: value.id, source: value.source as 'available' | 'toScan' });
        } else {
            setHighlightedVariable(null);
        }
    }, []);

    const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => {
        if (toListId === 'toScan') {
            moveToScan(variable, targetIndex);
        } else if (toListId === 'available') {
            moveToAvailable(variable, targetIndex);
        }
    }, [moveToScan, moveToAvailable]);

    const handleReorderVariable = useCallback((listId: string, reorderedList: Variable[]) => {
        if (listId === 'toScan') {
            reorderTargetVariables(reorderedList);
        } else if (listId === 'available') {
            setAvailableVariables([...reorderedList]); // For reordering within available list
        }
    }, [reorderTargetVariables]);

    const handleContinue = useCallback(() => {
        if (variablesToScan.length === 0) {
            setErrorMessage("No variables have been selected for scanning.");
            setErrorDialogOpen(true);
            return;
        }
        onContinue(
            variablesToScan,
            limitCases ? caseLimit : null,
            limitValues ? valueLimit : null
        );
    }, [variablesToScan, limitCases, caseLimit, limitValues, valueLimit, onContinue]);

    const targetListsConfig: TargetListConfig[] = [
        {
            id: 'toScan',
            title: 'Variables to Scan:',
            variables: variablesToScan,
            height: '300px',
            draggableItems: true,
            droppable: true
        }
    ];

    return {
        availableVariables,
        variablesToScan,
        // setAvailableVariables, // Not exposed directly
        // setVariablesToScan, // Not exposed directly
        managerHighlightedVariable,
        setManagerHighlightedVariable: handleManagerHighlightChange, // Expose the handler for VariableListManager
        errorMessage,
        errorDialogOpen,
        setErrorDialogOpen,
        limitCases,
        setLimitCases,
        caseLimit,
        setCaseLimit,
        limitValues,
        setLimitValues,
        valueLimit,
        setValueLimit,
        handleContinue,
        targetListsConfig, // Pass the generated config to the component
        handleMoveVariable, // For VariableListManager
        handleReorderVariable, // For VariableListManager
    };
}; 