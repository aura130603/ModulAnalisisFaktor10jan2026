import { useState, useEffect } from 'react';
import { Variable } from '@/types/Variable';
import { useVariableStore } from '@/stores/useVariableStore';
import { 
  VariableSelectionProps,
  HighlightedVariableInfo 
} from '../types';

export const useVariableSelection = ({
  initialVariables = []
}: Omit<VariableSelectionProps, 'resetVariableSelection'> = {}) => {
  const { variables } = useVariableStore();
  const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
  const [selectedVariables, setSelectedVariables] = useState<Variable[]>(initialVariables);
  const [highlightedVariable, setHighlightedVariable] = useState<HighlightedVariableInfo | null>(null);

  useEffect(() => {
    useVariableStore.getState().loadVariables();
  }, []);

  useEffect(() => {
    // Filter out variables without a valid id or empty name
    const validGlobalVars = variables.filter(v => v.id !== undefined && v.name !== "");

    const globalIdLookup = new Map(validGlobalVars.map(v => [v.id as number, v]));

    // Keep only selected variables whose id still exists in the global list
    const stillExistingSelectedVars = selectedVariables.filter(sv => {
      if (sv.id === undefined) return false;
      return globalIdLookup.has(sv.id);
    });

    // Update selectedVariables state if there are changes
    if (
      stillExistingSelectedVars.length !== selectedVariables.length ||
      !stillExistingSelectedVars.every((val, idx) => val.id === selectedVariables[idx]?.id)
    ) {
      setSelectedVariables(stillExistingSelectedVars);
    }

    // Compute available variables (those not selected and having valid id & name)
    const selectedIds = new Set(stillExistingSelectedVars.map(v => v.id as number));
    const newAvailableVariables = validGlobalVars.filter(v => !selectedIds.has(v.id as number));

    setAvailableVariables(newAvailableVariables);

  }, [variables, selectedVariables]);

  const moveToSelectedVariables = (variable: Variable, targetIndex?: number) => {
    if (variable.id === undefined) return; // Cannot move a variable without id

    setAvailableVariables(prev => prev.filter(v => v.id !== variable.id));
    setSelectedVariables(prev => {
      if (prev.some(v => v.id === variable.id)) {
        return prev;
      }

      const newList = [...prev];
      if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= newList.length) {
        newList.splice(targetIndex, 0, variable);
      } else {
        newList.push(variable);
      }
      return newList;
    });
    setHighlightedVariable(null);
  };

  const moveToAvailableVariables = (variable: Variable, targetIndex?: number) => {
    if (variable.id === undefined) return;

    setSelectedVariables(prev => prev.filter(v => v.id !== variable.id));
    setAvailableVariables(prev => {
      if (prev.some(v => v.id === variable.id)) {
        return prev;
      }

      const newList = [...prev];
      if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= newList.length) {
        newList.splice(targetIndex, 0, variable);
      } else {
        newList.push(variable);
      }
      newList.sort((a, b) => (a.columnIndex || 0) - (b.columnIndex || 0));
      return newList;
    });
    setHighlightedVariable(null);
  };

  const reorderVariables = (source: 'available' | 'selected', variablesToReorder: Variable[]) => {
    if (source === 'available') {
      setAvailableVariables([...variablesToReorder]);
    } else {
      setSelectedVariables([...variablesToReorder]);
    }
  };

  const resetVariableSelection = () => {
    setSelectedVariables([]);
    setAvailableVariables(variables.filter(v => v.name !== "" && v.id !== undefined));
    setHighlightedVariable(null);
  };

  return {
    availableVariables,
    selectedVariables,
    highlightedVariable,
    setHighlightedVariable,
    moveToSelectedVariables,
    moveToAvailableVariables,
    reorderVariables,
    resetVariableSelection
  };
}; 