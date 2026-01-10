import { useState, useEffect } from 'react';
import { useVariableStore } from '@/stores/useVariableStore';
import { Variable } from '@/types/Variable';
import {
    HighlightedVariable,
    VariableSelectionProps,
} from '../types';

export const useVariableSelection = ({
    initialVariables = []
}: Omit<VariableSelectionProps, 'resetVariableSelection'> = {}) => {
    const { variables } = useVariableStore();
    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [testVariables, setTestVariables] = useState<Variable[]>(initialVariables);
    const [factorVariable, setFactorVariable] = useState<Variable | null>(null);
    const [highlightedVariable, setHighlightedVariable] = useState<HighlightedVariable | null>(null);

    useEffect(() => {
        useVariableStore.getState().loadVariables();
    }, []);

    useEffect(() => {
        const globalVarsWithTempId = variables.map(v => ({
            ...v,
            tempId: v.tempId || `temp_id_${v.columnIndex}`
        }));
        const globalVarTempIds = new Set(globalVarsWithTempId.map(v => v.tempId));

        const filteredTestVars = testVariables.filter(
            sv => sv.tempId && globalVarTempIds.has(sv.tempId)
        );

        if (
            filteredTestVars.length !== testVariables.length ||
            !filteredTestVars.every((val, idx) => val.tempId === testVariables[idx]?.tempId)
        ) {
            setTestVariables(filteredTestVars);
        }

        if (factorVariable) {
            const factorTempId = factorVariable.tempId || `temp_id_${factorVariable.columnIndex}`;
            if (!globalVarTempIds.has(factorTempId)) {
                setFactorVariable(null);
            }
        }

        // Update availableVariables: variabel yang tidak ada di testVariables dan groupingVariable
        const usedTempIds = new Set(filteredTestVars.map(v => v.tempId));
        if (factorVariable) {
            usedTempIds.add(factorVariable.tempId || `temp_id_${factorVariable.columnIndex}`);
        }
        const newAvailableVariables = globalVarsWithTempId.filter(
            v => v.name !== "" && v.tempId && !usedTempIds.has(v.tempId)
        );
        setAvailableVariables(newAvailableVariables);

    }, [variables, testVariables, factorVariable]);

    const moveToTestVariables = (variable: Variable, targetIndex?: number) => {
        const variableWithTempId = {
            ...variable,
            tempId: variable.tempId || `temp_id_${variable.columnIndex}`
        };

        if (availableVariables.some(v => v.tempId === variableWithTempId.tempId)) {
            setAvailableVariables(prev => prev.filter(v => v.tempId !== variableWithTempId.tempId));
        } 
        else if (factorVariable && factorVariable.tempId === variableWithTempId.tempId) {
            setFactorVariable(null);
        }
        
        setTestVariables(prev => {
            if (prev.some(v => v.tempId === variableWithTempId.tempId)) {
                return prev;
            }
            const newList = [...prev];
            if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= newList.length) {
                newList.splice(targetIndex, 0, variableWithTempId);
            } else {
                newList.push(variableWithTempId);
            }
            return newList;
        });
        setHighlightedVariable(null);
    };

    const moveToFactorVariable = (variable: Variable) => {
        const variableWithTempId = {
            ...variable,
            tempId: variable.tempId || `temp_id_${variable.columnIndex}`
        };
        
        if (availableVariables.some(v => v.tempId === variableWithTempId.tempId)) {
            setAvailableVariables(prev => prev.filter(v => v.tempId !== variableWithTempId.tempId));
        } 
        else if (testVariables.some(v => v.tempId === variableWithTempId.tempId)) {
            setTestVariables(prev => prev.filter(v => v.tempId !== variableWithTempId.tempId));
        }
        
        setFactorVariable(variableWithTempId);
        setHighlightedVariable(null);
    };

    const moveToAvailableVariables = (variable: Variable) => {
        const variableWithTempId = {
            ...variable,
            tempId: variable.tempId || `temp_id_${variable.columnIndex}`
        };

        if (testVariables.some(v => v.tempId === variableWithTempId.tempId)) {
            setTestVariables(prev => prev.filter(v => v.tempId !== variableWithTempId.tempId));
        }
        else if (factorVariable && factorVariable.tempId === variableWithTempId.tempId) {
            setFactorVariable(null);
        }

        setAvailableVariables(prev => {
            if (prev.some(v => v.tempId === variableWithTempId.tempId)) {
                return prev;
            }
            const newList = [...prev, variableWithTempId];
            newList.sort((a, b) => (a.columnIndex || 0) - (b.columnIndex || 0));
            return newList;
        });

        setHighlightedVariable(null);
    };

    const reorderVariables = (source: 'available' | 'test', reorderedVariables: Variable[]) => {
        if (source === 'available') {
            setAvailableVariables([...reorderedVariables]);
        } else if (source === 'test') {
            setTestVariables([...reorderedVariables]);
        }
    };

    const resetVariableSelection = () => {
        const allVarsWithTempId = variables.map(v => ({
            ...v,
            tempId: v.tempId || `temp_id_${v.columnIndex}`
        }));
        setAvailableVariables(allVarsWithTempId.filter(v => v.name !== ""));
        setTestVariables([]);
        setFactorVariable(null);
        setHighlightedVariable(null);
    };
    
    return {
        availableVariables,
        testVariables,
        factorVariable,
        highlightedVariable,
        setHighlightedVariable,
        moveToTestVariables,
        moveToFactorVariable,
        moveToAvailableVariables,
        reorderVariables,
        resetVariableSelection
    };
};

export default useVariableSelection;