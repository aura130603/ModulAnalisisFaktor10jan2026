import { useState, useEffect, useCallback, useRef } from "react";
import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import type { Variable } from "@/types/Variable";
import type { SortVariableConfig } from "../types";

interface UseSortCasesProps {
    onClose: () => void;
}

export const useSortCases = ({ onClose }: UseSortCasesProps) => {
    const { sortData } = useDataStore();
    const { variables: storeVariables } = useVariableStore();

    const prepareVariablesWithTempId = useCallback((vars: Variable[]) => {
        return vars.map(v => ({
            ...v,
            tempId: v.tempId || `temp_sort_${v.columnIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }));
    }, []);

    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [sortByConfigs, setSortByConfigs] = useState<SortVariableConfig[]>([]);
    const [defaultSortOrder, setDefaultSortOrder] = useState<"asc" | "desc">("asc");
    const [highlightedVariable, setHighlightedVariable] = useState<{ id: string; source: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Keep track of previous default sort order so we can selectively update existing configs
    const prevDefaultSortOrderRef = useRef<"asc" | "desc">(defaultSortOrder);

    // When the user changes the default sort order, automatically update any variables that
    // are still using the *previous* default so the UI (arrow icons) remains consistent.
    useEffect(() => {
        const prevOrder = prevDefaultSortOrderRef.current;
        if (prevOrder === defaultSortOrder) return; // nothing changed

        setSortByConfigs(prevConfigs =>
            prevConfigs.map(cfg =>
                cfg.direction === prevOrder ? { ...cfg, direction: defaultSortOrder } : cfg
            )
        );

        prevDefaultSortOrderRef.current = defaultSortOrder;
    }, [defaultSortOrder]);

    useEffect(() => {
        const sortByVarColIndexes = sortByConfigs.map(config => config.variable.columnIndex);
        const filtered = storeVariables.filter(v => !sortByVarColIndexes.includes(v.columnIndex));
        setAvailableVariables(prepareVariablesWithTempId(filtered));
    }, [storeVariables, sortByConfigs, prepareVariablesWithTempId]);

    const getSortByVariables = useCallback(() => {
        return sortByConfigs.map(config => config.variable);
    }, [sortByConfigs]);

    const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => {
        setError(null);
        if (fromListId === 'available' && toListId === 'sortBy') {
            const newConfig: SortVariableConfig = { variable, direction: defaultSortOrder };
            setSortByConfigs(prev => {
                const newConfigs = [...prev];
                if (typeof targetIndex === 'number') newConfigs.splice(targetIndex, 0, newConfig);
                else newConfigs.push(newConfig);
                return newConfigs;
            });
        } else if (fromListId === 'sortBy' && toListId === 'available') {
            setSortByConfigs(prev => prev.filter(c => c.variable.tempId !== variable.tempId));
        }
        setHighlightedVariable(null);
    }, [defaultSortOrder]);

    const handleReorderVariable = useCallback((listId: string, reorderedVariables: Variable[]) => {
        setError(null);
        if (listId === 'sortBy') {
            setSortByConfigs(prevConfigs => 
                reorderedVariables.map(variable => {
                    const existingConfig = prevConfigs.find(c => c.variable.tempId === variable.tempId);
                    return { variable, direction: existingConfig?.direction || defaultSortOrder };
                })
            );
        } else if (listId === 'available') {
            setAvailableVariables(reorderedVariables.sort((a,b) => a.columnIndex - b.columnIndex));
        }
    }, [defaultSortOrder]);

    const changeSortDirection = (tempId: string, direction: 'asc' | 'desc') => {
        setError(null);
        setSortByConfigs(prev =>
            prev.map(config =>
                config.variable.tempId === tempId ? { ...config, direction } : config
            )
        );
    };

    const moveVariableUp = (tempId: string) => {
        setError(null);
        setSortByConfigs(prev => {
            const index = prev.findIndex(c => c.variable.tempId === tempId);
            if (index <= 0) return prev;
            const newConfigs = [...prev];
            [newConfigs[index], newConfigs[index - 1]] = [newConfigs[index - 1], newConfigs[index]];
            return newConfigs;
        });
    };

    const moveVariableDown = (tempId: string) => {
        setError(null);
        setSortByConfigs(prev => {
            const index = prev.findIndex(c => c.variable.tempId === tempId);
            if (index === -1 || index >= prev.length - 1) return prev;
            const newConfigs = [...prev];
            [newConfigs[index], newConfigs[index + 1]] = [newConfigs[index + 1], newConfigs[index]];
            return newConfigs;
        });
    };

    const performSort = async () => {
        setError(null);
        if (sortByConfigs.length === 0) {
            setError("Please select at least one variable to sort by");
            return;
        }
        try {
            const configsToApply = sortByConfigs.map(config => ({
                columnIndex: config.variable.columnIndex,
                direction: config.direction,
            }));
            await sortData(configsToApply);
            onClose();
        } catch (error) {
            console.error("Error during sort operation:", error);
            setError("An error occurred while sorting the data");
        }
    };

    const handleOk = () => performSort();

    const handleReset = () => {
        setError(null);
        setSortByConfigs([]);
        setDefaultSortOrder("asc");
        setHighlightedVariable(null);
    };

    return {
        availableVariables,
        sortByConfigs, 
        setSortByConfigs,
        defaultSortOrder, 
        setDefaultSortOrder,
        highlightedVariable, 
        setHighlightedVariable,
        error,
        getSortByVariables,
        handleMoveVariable,
        handleReorderVariable,
        changeSortDirection,
        moveVariableUp,
        moveVariableDown,
        handleOk,
        handleReset,
    };
}; 