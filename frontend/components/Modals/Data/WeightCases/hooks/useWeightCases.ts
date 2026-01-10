import { useState, useEffect, useCallback } from "react";
import type { Variable } from "@/types/Variable";

interface UseWeightCasesProps {
    onClose: () => void;
    initialVariables: Variable[];
    initialWeight: string;
    onSave: (newWeight: string) => void;
}

export const useWeightCases = ({ onClose, initialVariables, initialWeight, onSave }: UseWeightCasesProps) => {
    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [frequencyVariables, setFrequencyVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{ id: string; source: string } | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [errorDialogOpen, setErrorDialogOpen] = useState<boolean>(false);

    const weightMethod = frequencyVariables.length > 0 ? "byVariable" : "none";

    const ensureUniqueTempId = useCallback((variable: Variable): Variable => {
        return {
            ...variable,
            tempId: `weight_temp_${variable.columnIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
    }, []);

    useEffect(() => {
        const numericVariables = initialVariables
            .filter(v => v.name !== "" && v.type !== "STRING")
            .map(ensureUniqueTempId);

        if (initialWeight && initialWeight !== "") {
            const weightVar = numericVariables.find(v => v.name === initialWeight);
            if (weightVar) {
                setFrequencyVariables([ensureUniqueTempId(weightVar)]);
                setAvailableVariables(numericVariables.filter(v => v.name !== initialWeight));
            } else {
                setAvailableVariables(numericVariables);
                setFrequencyVariables([]);
            }
        } else {
            setAvailableVariables(numericVariables);
            setFrequencyVariables([]);
        }
    }, [initialVariables, initialWeight, ensureUniqueTempId]);

    const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string) => {
        const variableWithFreshTempId = ensureUniqueTempId(variable);

        if (toListId === 'frequency' && variableWithFreshTempId.type === "STRING") {
            setErrorMessage("Weight variable must be numeric");
            setErrorDialogOpen(true);
            return;
        }

        if (fromListId === 'available') {
            setAvailableVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        } else if (fromListId === 'frequency') {
            setFrequencyVariables([]); // Clear current frequency variable
        }

        if (toListId === 'available') {
            setAvailableVariables(prev => [...prev, variableWithFreshTempId].sort((a, b) => a.columnIndex - b.columnIndex));
        } else if (toListId === 'frequency') {
            // Move current frequency variable back to available if exists
            if (frequencyVariables.length > 0 && frequencyVariables[0].tempId !== variableWithFreshTempId.tempId) {
                const currentFreqVar = ensureUniqueTempId(frequencyVariables[0]);
                setAvailableVariables(prev => {
                    const filtered = prev.filter(v => v.name !== currentFreqVar.name);
                    return [...filtered, currentFreqVar].sort((a, b) => a.columnIndex - b.columnIndex);
                });
            }
            setFrequencyVariables([variableWithFreshTempId]);
        }
        setHighlightedVariable(null);
    }, [frequencyVariables, ensureUniqueTempId]);

    const handleReorderVariable = useCallback((listId: string, reorderedVariables: Variable[]) => {
        if (listId === 'available') {
            setAvailableVariables(reorderedVariables.map(ensureUniqueTempId));
        } else if (listId === 'frequency') {
            setFrequencyVariables(reorderedVariables.map(ensureUniqueTempId));
        }
    }, [ensureUniqueTempId]);

    const handleSave = () => {
        const newWeight = frequencyVariables.length > 0 ? frequencyVariables[0].name : "";
        onSave(newWeight);
        onClose();
    };

    const handleReset = () => {
        const numericVariables = initialVariables
            .filter(v => v.name !== "" && v.type !== "STRING")
            .map(ensureUniqueTempId);
        setAvailableVariables(numericVariables);
        setFrequencyVariables([]);
        setHighlightedVariable(null);
        setErrorMessage(null);
        setErrorDialogOpen(false);
    };

    return {
        availableVariables,
        frequencyVariables,
        highlightedVariable,
        setHighlightedVariable,
        errorMessage,
        errorDialogOpen,
        setErrorDialogOpen, // Expose setter for dialog
        weightMethod,
        handleMoveVariable,
        handleReorderVariable,
        handleSave,
        handleReset
    };
}; 