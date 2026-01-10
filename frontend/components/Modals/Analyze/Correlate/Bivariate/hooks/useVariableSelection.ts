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
    const [controlVariables, setControlVariables] = useState<Variable[]>([]);
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
    
        const stillExistingTestVars = testVariables.filter(sv => 
            sv.tempId && globalVarTempIds.has(sv.tempId)
        );
    
        if (stillExistingTestVars.length !== testVariables.length || 
            !stillExistingTestVars.every((val, index) => val.tempId === testVariables[index]?.tempId)) {
            setTestVariables(stillExistingTestVars);
        }

        const stillExistingControlVars = controlVariables.filter(sv => 
            sv.tempId && globalVarTempIds.has(sv.tempId)
        );
    
        if (stillExistingControlVars.length !== controlVariables.length || 
            !stillExistingControlVars.every((val, index) => val.tempId === controlVariables[index]?.tempId)) {
            setControlVariables(stillExistingControlVars);
        }
        
        const currentTestTempIds = new Set(stillExistingTestVars.filter(v => v.tempId).map(v => v.tempId!));
        const currentControlTempIds = new Set(stillExistingControlVars.filter(v => v.tempId).map(v => v.tempId!));
        const allUsedTempIds = new Set([...Array.from(currentTestTempIds), ...Array.from(currentControlTempIds)]);
        
        const newAvailableVariables = globalVarsWithTempId.filter(
          v => v.name !== "" && v.tempId && !allUsedTempIds.has(v.tempId)
        );
        setAvailableVariables(newAvailableVariables);
    
      }, [variables, testVariables, controlVariables]);

    const moveToTestVariables = (variable: Variable, targetIndex?: number) => {
        const variableWithTempId = {
            ...variable,
            tempId: variable.tempId || `temp_id_${variable.columnIndex}`
        };

        if (availableVariables.some(v => v.tempId === variableWithTempId.tempId)) {
            setAvailableVariables(prev => prev.filter(v => v.tempId !== variableWithTempId.tempId));
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

    const moveToAvailableVariables = (variable: Variable) => {
        const variableWithTempId = {
            ...variable,
            tempId: variable.tempId || `temp_id_${variable.columnIndex}`
        };

        if (testVariables.some(v => v.tempId === variableWithTempId.tempId)) {
            setTestVariables(prev => prev.filter(v => v.tempId !== variableWithTempId.tempId));
        }

        if (controlVariables.some(v => v.tempId === variableWithTempId.tempId)) {
            setControlVariables(prev => prev.filter(v => v.tempId !== variableWithTempId.tempId));
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

    const moveToKendallsTauBControlVariables = (variable: Variable) => {
        const variableWithTempId = {
            ...variable,
            tempId: variable.tempId || `temp_id_${variable.columnIndex}`
        };

        if (availableVariables.some(v => v.tempId === variableWithTempId.tempId)) {
            setAvailableVariables(prev => prev.filter(v => v.tempId !== variableWithTempId.tempId));
        } 
        
        setControlVariables(prev => {
            if (prev.some(v => v.tempId === variableWithTempId.tempId)) {
                return prev;
            }
            return [...prev, variableWithTempId];
        });
        setHighlightedVariable(null);
    };

    const moveToKendallsTauBAvailableVariables = (variable: Variable) => {
        const variableWithTempId = {
            ...variable,
            tempId: variable.tempId || `temp_id_${variable.columnIndex}`
        };

        if (controlVariables.some(v => v.tempId === variableWithTempId.tempId)) {
            setControlVariables(prev => prev.filter(v => v.tempId !== variableWithTempId.tempId));
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

    const reorderVariables = (source: 'available' | 'test' | 'control', reorderedVariables: Variable[]) => {
        if (source === 'available') {
            setAvailableVariables([...reorderedVariables]);
        } else if (source === 'test') {
            setTestVariables([...reorderedVariables]);
        } else if (source === 'control') {
            setControlVariables([...reorderedVariables]);
        }
    };

    const resetVariableSelection = () => {
        const allVarsWithTempId = variables.map(v => ({
            ...v,
            tempId: v.tempId || `temp_id_${v.columnIndex}`
        }));
        setAvailableVariables(allVarsWithTempId.filter(v => v.name !== ""));
        setTestVariables([]);
        setControlVariables([]);
        setHighlightedVariable(null);
    };
    
    return {
        availableVariables,
        testVariables,
        controlVariables,
        highlightedVariable,
        setHighlightedVariable,
        moveToTestVariables,
        moveToAvailableVariables,
        moveToKendallsTauBControlVariables,
        moveToKendallsTauBAvailableVariables,
        reorderVariables,
        resetVariableSelection
    };
};

export default useVariableSelection;