import { useState, useEffect, useCallback } from "react";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import type { Variable } from "@/types/Variable";
import { transposeDataService } from "../services/transposeService";

interface UseTransposeProps {
    onClose: () => void;
}

export const useTranspose = ({ onClose }: UseTransposeProps) => {
    const { variables, overwriteAll } = useVariableStore();
    const { data } = useDataStore();

    const prepareVariablesWithTempId = useCallback((vars: Variable[]) => {
        return vars.map(v => ({
            ...v,
            tempId: v.tempId || `temp_${v.columnIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }));
    }, []);

    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [selectedVariables, setSelectedVariables] = useState<Variable[]>([]);
    const [nameVariables, setNameVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{
        id: string;
        source: string;
    } | null>(null);

    useEffect(() => {
        if (variables.length > 0) {
            const varsWithTempId = prepareVariablesWithTempId(variables);
            const initialAvailable: Variable[] = varsWithTempId;
            setAvailableVariables(initialAvailable);
            setSelectedVariables([]);
            setNameVariables([]);
        }
    }, [variables, prepareVariablesWithTempId]);

    const getDisplayName = (variable: Variable): string => {
        if (variable.label) {
            return `${variable.label} [${variable.name}]`;
        }
        return variable.name;
    };

    const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => {
        if (fromListId === 'available') {
            setAvailableVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        } else if (fromListId === 'selected') {
            setSelectedVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        } else if (fromListId === 'name') {
            setNameVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        }

        if (toListId === 'available') {
            setAvailableVariables(prev => [...prev, variable]);
        } else if (toListId === 'selected') {
            setSelectedVariables(prev => [...prev, variable]);
        } else if (toListId === 'name') {
            setNameVariables([variable]);
        }
        setHighlightedVariable(null);
    }, []);

    const handleReorderVariable = useCallback((listId: string, reorderedVariables: Variable[]) => {
        if (listId === 'available') {
            setAvailableVariables(reorderedVariables);
        } else if (listId === 'selected') {
            setSelectedVariables(reorderedVariables);
        }
    }, []);

    const handleOk = async () => {
        if (selectedVariables.length === 0) {
            onClose();
            return;
        }

        try {
            const nameVariable = nameVariables.length > 0 ? nameVariables[0] : null;
            const sanitizedData = data.map(row => row.map(cell => cell ?? ""));
            const { transposedData, finalTransposedVariables } = transposeDataService(sanitizedData, selectedVariables, nameVariable);

            if (transposedData.length > 0 || finalTransposedVariables.length > 0) {
                await overwriteAll(finalTransposedVariables, transposedData);
            }
            
            onClose();
        } catch (error) {
            console.error("Transpose operation failed:", error);
            // Optionally, show an error message to the user
            onClose();
        }
    };

    const handleReset = () => {
        if (variables.length > 0) {
            const varsWithTempId = prepareVariablesWithTempId(variables);
            setAvailableVariables(varsWithTempId);
            setSelectedVariables([]);
            setNameVariables([]);
        }
        setHighlightedVariable(null);
    };

    return {
        availableVariables,
        selectedVariables,
        nameVariables,
        highlightedVariable,
        setHighlightedVariable,
        getDisplayName,
        handleMoveVariable,
        handleReorderVariable,
        handleOk,
        handleReset,
    };
}; 