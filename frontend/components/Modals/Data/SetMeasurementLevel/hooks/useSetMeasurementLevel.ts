import { useState, useEffect, useCallback } from "react";
import { useVariableStore } from "@/stores/useVariableStore";
import type { Variable } from "@/types/Variable";

interface UseSetMeasurementLevelProps {
    onClose: () => void;
}

export const useSetMeasurementLevel = ({ onClose }: UseSetMeasurementLevelProps) => {
    const { variables: storeVariables, updateVariable } = useVariableStore(); // Renamed to storeVariables

    const [unknownVariables, setUnknownVariables] = useState<Variable[]>([]);
    const [nominalVariables, setNominalVariables] = useState<Variable[]>([]);
    const [ordinalVariables, setOrdinalVariables] = useState<Variable[]>([]);
    const [scaleVariables, setScaleVariables] = useState<Variable[]>([]);

    const [highlightedVariable, setHighlightedVariable] = useState<{
        id: string;
        source: string;
    } | null>(null);

    // Initialize lists from store
    useEffect(() => {
        // Ensure all variables have a tempId, primarily for VariableListManager keying
        const allVarsWithTempId = storeVariables.map(v => ({
            ...v,
            tempId: v.tempId || `temp_set_measure_${v.columnIndex}`
        }));

        const filtered = allVarsWithTempId
            .filter(v => v.measure === "unknown")
            .sort((a, b) => a.columnIndex - b.columnIndex);

        setUnknownVariables(filtered);
        setNominalVariables([]);
        setOrdinalVariables([]);
        setScaleVariables([]);
        setHighlightedVariable(null);
    }, [storeVariables]);

    // Handler for moving variables between lists
    const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => {
        const move = (setter: React.Dispatch<React.SetStateAction<Variable[]>>, filterCondition: boolean) => {
            setter(prev => filterCondition ? prev.filter(v => v.tempId !== variable.tempId) : prev);
        };

        switch (fromListId) {
            case 'available': move(setUnknownVariables, true); break;
            case 'nominal':   move(setNominalVariables, true); break;
            case 'ordinal':   move(setOrdinalVariables, true); break;
            case 'scale':     move(setScaleVariables, true); break;
        }

        const add = (setter: React.Dispatch<React.SetStateAction<Variable[]>>) => {
            setter(prev => {
                const newList = [...prev, variable];
                // Sort by columnIndex after adding, if needed, or maintain insertion order via targetIndex
                // For simplicity here, just adding. VariableListManager handles visual order.
                return newList.sort((a, b) => a.columnIndex - b.columnIndex); 
            });
        };

        switch (toListId) {
            case 'available': add(setUnknownVariables); break;
            case 'nominal':   add(setNominalVariables); break;
            case 'ordinal':   add(setOrdinalVariables); break;
            case 'scale':     add(setScaleVariables); break;
        }
        setHighlightedVariable(null);
    }, []);

    // Handler for reordering variables within a list
    const handleReorderVariable = useCallback((listId: string, reorderedVariables: Variable[]) => {
        // Reordering is primarily visual within VariableListManager. 
        // This callback updates the hook's state if direct manipulation of these lists is needed beyond VLM.
        // For SetMeasurementLevel, reordering within target lists ('nominal', 'ordinal', 'scale') is disabled in VariableTab.
        // Reordering 'available' (unknownVariables) might be relevant if its order matters.
        if (listId === 'available') {
            setUnknownVariables(reorderedVariables);
        }
        // No action needed for 'nominal', 'ordinal', 'scale' if their internal order doesn't affect logic here,
        // and VLM handles their visual presentation.
    }, []);

    const handleSave = () => {
        nominalVariables.forEach(variable => {
            updateVariable(variable.columnIndex, "measure", "nominal");
        });
        ordinalVariables.forEach(variable => {
            updateVariable(variable.columnIndex, "measure", "ordinal");
        });
        scaleVariables.forEach(variable => {
            updateVariable(variable.columnIndex, "measure", "scale");
        });
        onClose();
    };

    const handleReset = () => {
        // Re-initialize from store variables to get fresh tempIds if necessary
        const allVarsWithTempId = storeVariables.map(v => ({
            ...v,
            tempId: v.tempId || `temp_set_measure_${v.columnIndex}` 
        }));

        const unknowns = allVarsWithTempId
            .filter(v => v.measure === "unknown")
            .sort((a, b) => a.columnIndex - b.columnIndex);
        
        // Collect variables from nominal, ordinal, scale lists (they might have been moved there)
        const previouslyCategorized = [
            ...nominalVariables,
            ...ordinalVariables,
            ...scaleVariables,
        ].map(v => ({ ...v, measure: "unknown" as const })); // Reset their measure for logic if needed, or just visually move them
        
        // Combine and ensure no duplicates by tempId, prefering the one from `unknowns` if conflicts occur
        const combined = [...unknowns, ...previouslyCategorized];
        const uniqueCombined = Array.from(new Map(combined.map(item => [item.tempId, item])).values())
                                .sort((a,b) => a.columnIndex - b.columnIndex);

        setUnknownVariables(uniqueCombined);        
        setNominalVariables([]);
        setOrdinalVariables([]);
        setScaleVariables([]);
        setHighlightedVariable(null);
    };

    return {
        unknownVariables,
        nominalVariables,
        ordinalVariables,
        scaleVariables,
        highlightedVariable,
        setHighlightedVariable, // Pass setter to be used by VariableListManager via VariableTab
        handleMoveVariable,
        handleReorderVariable,
        handleSave,
        handleReset,
    };
}; 