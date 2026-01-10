import { useState, useEffect } from 'react';
import { useVariableStore } from '@/stores/useVariableStore';
import { Variable } from '@/types/Variable';
import {
  VariableSelectionProps,
  HighlightedVariable
} from '../types';

export const useVariableSelection = ({
  initialVariables = []
}: Omit<VariableSelectionProps, 'resetVariableSelection'> = {}) => {
  const { variables } = useVariableStore();
  const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
  const [testVariables, setTestVariables] = useState<Variable[]>(initialVariables);
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
    
    const currentTestTempIds = new Set(stillExistingTestVars.filter(v => v.tempId).map(v => v.tempId!));
    const newAvailableVariables = globalVarsWithTempId.filter(
      v => v.name !== "" && v.tempId && !currentTestTempIds.has(v.tempId)
    );
    setAvailableVariables(newAvailableVariables);

  }, [variables, testVariables]);

  const moveToTestVariables = (variable: Variable, targetIndex?: number) => {
    const variableWithTempId = {
      ...variable,
      tempId: variable.tempId || `temp_id_${variable.columnIndex}`
    };
    setAvailableVariables(prev => prev.filter(v => v.tempId !== variableWithTempId.tempId));
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

  const moveToAvailableVariables = (variable: Variable, targetIndex?: number) => {
    const variableWithTempId = {
      ...variable,
      tempId: variable.tempId || `temp_id_${variable.columnIndex}`
    };
    setTestVariables(prev => prev.filter(v => v.tempId !== variableWithTempId.tempId));
    setAvailableVariables(prev => {
      if (prev.some(v => v.tempId === variableWithTempId.tempId)) {
        return prev;
      }
      const newList = [...prev];
      if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= newList.length) {
        newList.splice(targetIndex, 0, variableWithTempId);
      } else {
        newList.push(variableWithTempId);
      }
      newList.sort((a, b) => (a.columnIndex || 0) - (b.columnIndex || 0));
      return newList;
    });
    setHighlightedVariable(null);
  };

  const reorderVariables = (source: 'available' | 'test', reorderedVariables: Variable[]) => {
    if (source === 'available') {
      setAvailableVariables(reorderedVariables);
    } else {
      setTestVariables(reorderedVariables);
    }
  };

  const resetVariableSelection = () => {
    const allVariablesWithTempId = variables.map(v => ({
      ...v,
      tempId: v.tempId || `temp_id_${v.columnIndex}`
    }));
    setAvailableVariables(allVariablesWithTempId.filter(v => v.name !== ""));
    setTestVariables([]);
    setHighlightedVariable(null);
  };

  return {
    availableVariables,
    testVariables,
    highlightedVariable,
    setHighlightedVariable,
    moveToTestVariables,
    moveToAvailableVariables,
    reorderVariables,
    resetVariableSelection
  };
};

export default useVariableSelection; 