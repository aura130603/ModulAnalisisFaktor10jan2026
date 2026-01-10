import { useState, useEffect, useCallback } from 'react';
import type { Variable } from "@/types/Variable";
import { useVariableStore } from "@/stores/useVariableStore";
import { HighlightedVariable } from '../types';

export interface VariableManagementState {
    availableVariables: Variable[];
    dependentVariables: Variable[];
    factorVariables: Variable[];
    labelVariable: Variable | null;
    highlightedVariable: HighlightedVariable | null;
}

export interface VariableManagementHandlers {
    moveToDependentVariables: (variable: Variable, targetIndex?: number) => void;
    moveToFactorVariables: (variable: Variable, targetIndex?: number) => void;
    moveToLabelVariable: (variable: Variable) => void;
    moveToAvailableVariables: (variable: Variable, source: 'dependent' | 'factor' | 'label', targetIndex?: number) => void;
    reorderVariables: (source: 'dependent' | 'factor', reorderedList: Variable[]) => void;
    setHighlightedVariable: (variable: HighlightedVariable | null) => void;
    resetVariableSelections: () => void;
}

export type UseVariableManagementResult = VariableManagementState & VariableManagementHandlers;

export const useVariableManagement = (): UseVariableManagementResult => {
    // Some Jest mocks replace useVariableStore with a simple jest.fn() that does not
    // support selector functions. Attempt selector first, then fall back to getState.
    let allVariables = useVariableStore((state: any) => state.variables as Variable[]);
    if (!Array.isArray(allVariables)) {
        // Fallback for tests where the selector form isn't implemented
        allVariables = (typeof (useVariableStore as any).getState === 'function')
            ? (useVariableStore as any).getState().variables
            : [];
    }

    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [dependentVariables, setDependentVariables] = useState<Variable[]>([]);
    const [factorVariables, setFactorVariables] = useState<Variable[]>([]);
    const [labelVariable, setLabelVariable] = useState<Variable | null>(null);
    const [highlightedVariable, setHighlightedVariable] = useState<HighlightedVariable | null>(null);

    const getInitialAvailable = useCallback(() => {
        return allVariables
            .filter(v => v.name !== "")
            // Ensure each variable has an `id` property; if not, use `columnIndex` as fallback
            .map(v => ({ ...v, id: v.id ?? v.columnIndex }))
            .sort((a, b) => a.columnIndex - b.columnIndex);
    }, [allVariables]);

    useEffect(() => {
        const initialVars = getInitialAvailable();
        // Use `id` (string) as unique key
        const dependentIds = new Set(dependentVariables.map(v => String(v.id)));
        const factorIds = new Set(factorVariables.map(v => String(v.id)));
        const labelId = labelVariable?.id ? String(labelVariable.id) : null;

        const finalAvailable = initialVars.filter(v => {
            const vid = String(v.id);
            return vid &&
                !dependentIds.has(vid) &&
                !factorIds.has(vid) &&
                (!labelId || vid !== labelId);
        });
        setAvailableVariables(finalAvailable);
    }, [allVariables, dependentVariables, factorVariables, labelVariable, getInitialAvailable]);

    const moveToDependentVariables = useCallback((variable: Variable, targetIndex?: number) => {
        // Only allow numeric types in dependent list
        const numericTypes: Variable['type'][] = ["NUMERIC", "COMMA", "DOT", "SCIENTIFIC", "RESTRICTED_NUMERIC"];
        if (variable.id === undefined || variable.id === null) return;
        if (variable.type && !numericTypes.includes(variable.type)) {
            console.warn(`[Explore] Variable '${variable.name}' of type '${variable.type}' is not numeric; ignoring.`);
            return; // Reject non-numeric variables
        }
        // Remove variable from available list
        setAvailableVariables(prev => prev.filter(v => String(v.id) !== String(variable.id)));
        setDependentVariables(prev => {
            // Avoid duplication
            if (prev.some(v => String(v.id) === String(variable.id))) return prev;
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

    const moveToFactorVariables = useCallback((variable: Variable, targetIndex?: number) => {
        if (variable.id === undefined || variable.id === null) return;
        setAvailableVariables(prev => prev.filter(v => String(v.id) !== String(variable.id)));
        setFactorVariables(prev => {
            // Hindari duplikasi
            if (prev.some(v => String(v.id) === String(variable.id))) return prev;
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

    const moveToLabelVariable = useCallback((variable: Variable) => {
        if (variable.id === undefined || variable.id === null) return;
        if (labelVariable && labelVariable.id !== undefined && labelVariable.id !== null) {
            setAvailableVariables(prev => {
                if (!prev.some(v => String(v.id) === String(labelVariable.id))) {
                    const newList = [...prev, labelVariable];
                    newList.sort((a, b) => a.columnIndex - b.columnIndex);
                    return newList;
                }
                return prev;
            });
        }
        setLabelVariable(variable);
        setAvailableVariables(prev => prev.filter(v => String(v.id) !== String(variable.id)));
        setHighlightedVariable(null);
    }, [labelVariable]);

    const moveToAvailableVariables = useCallback((variable: Variable, source: 'dependent' | 'factor' | 'label', targetIndex?: number) => {
        if (variable.id === undefined || variable.id === null) return;
        if (source === 'dependent') setDependentVariables(prev => prev.filter(v => String(v.id) !== String(variable.id)));
        else if (source === 'factor') setFactorVariables(prev => prev.filter(v => String(v.id) !== String(variable.id)));
        else if (source === 'label') setLabelVariable(null);

        setAvailableVariables(prev => {
            if (prev.some(v => String(v.id) === String(variable.id))) return prev;
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

    const reorderVariables = useCallback((source: 'dependent' | 'factor', reorderedList: Variable[]) => {
        if (source === 'dependent') setDependentVariables([...reorderedList]);
        else if (source === 'factor') setFactorVariables([...reorderedList]);
    }, []);
    
    const resetVariableSelections = useCallback(() => {
        setDependentVariables([]);
        setFactorVariables([]);
        setLabelVariable(null);
        setAvailableVariables(getInitialAvailable());
        setHighlightedVariable(null);
    }, [getInitialAvailable]);

    return {
        availableVariables,
        dependentVariables,
        factorVariables,
        labelVariable,
        highlightedVariable,
        moveToDependentVariables,
        moveToFactorVariables,
        moveToLabelVariable,
        moveToAvailableVariables,
        reorderVariables,
        setHighlightedVariable,
        resetVariableSelections
    };
};