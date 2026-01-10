import { useState, useEffect } from 'react';
import { Variable } from '@/types/Variable';
import { useVariableStore } from '@/stores/useVariableStore';

export interface VariableSelectionProps {
  initialVariables?: Variable[];
}

export interface VariableSelectionResult {
  availableVariables: Variable[];
  selectedVariables: Variable[];
  highlightedVariable: { id: number, source: 'available' | 'selected' } | null;
  setHighlightedVariable: React.Dispatch<React.SetStateAction<{ id: number, source: 'available' | 'selected' } | null>>;
  moveToSelectedVariables: (variable: Variable, targetIndex?: number) => void;
  moveToAvailableVariables: (variable: Variable, targetIndex?: number) => void;
  reorderVariables: (source: 'available' | 'selected', variables: Variable[]) => void;
  resetVariableSelection: () => void;
}

export const useVariableSelection = ({
  initialVariables = []
}: VariableSelectionProps = {}): VariableSelectionResult => {
  const { variables } = useVariableStore();
  const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
  const [selectedVariables, setSelectedVariables] = useState<Variable[]>(initialVariables);
  const [highlightedVariable, setHighlightedVariable] = useState<{ id: number, source: 'available' | 'selected' } | null>(null);

  // Update available variables when store variables change
  useEffect(() => {
    // Prepare list of valid variables from the global store (each ensured to have a tempId)
    const validVars = variables.filter(v => v.name !== "").map(v => {
      // Ensure each variable has an id. If not, fall back to columnIndex.
      const varId = (typeof v.id === 'number') ? v.id : v.columnIndex;
      return { ...v, id: varId } as Variable;
    });

    // Build a quick-lookup set of tempIds that still exist in the global store
    const validIds = new Set<number>(validVars
      .map(v => v.id)
      .filter((id): id is number => typeof id === 'number'));

    // 1) Synchronize the **selectedVariables** list – remove any variable that no longer exists globally
    if (selectedVariables.some(v => !validIds.has((v.id ?? v.columnIndex) as number))) {
      setSelectedVariables(prev => prev.filter(v => validIds.has((v.id ?? v.columnIndex) as number)));
    }

    // 2) Recompute the **availableVariables** list (global vars minus currently selected ones)
    const selectedIds = new Set<number>(selectedVariables.map(v => (v.id ?? v.columnIndex) as number));
    const finalAvailable = validVars.filter(v => !selectedIds.has((v.id as number)));
    setAvailableVariables(finalAvailable);
  }, [variables, selectedVariables]);

  const moveToSelectedVariables = (variable: Variable, targetIndex?: number) => {
    const varId = variable.id ?? variable.columnIndex;
    if (varId === undefined || varId === null) {
      console.error("Cannot move variable without id:", variable);
      return;
    }
    setAvailableVariables(prev => prev.filter(v => ((v.id ?? v.columnIndex) as number) !== varId));
    setSelectedVariables(prev => {
      if (prev.some(v => ((v.id ?? v.columnIndex) as number) === varId)) {
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
    const varId = variable.id ?? variable.columnIndex;
    if (varId === undefined || varId === null) {
      console.error("Cannot move variable without id:", variable);
      return;
    }
    setSelectedVariables(prev => prev.filter(v => ((v.id ?? v.columnIndex) as number) !== varId));
    setAvailableVariables(prev => {
      if (prev.some(v => ((v.id ?? v.columnIndex) as number) === varId)) {
        return prev;
      }
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
  };

  const reorderVariables = (source: 'available' | 'selected', reorderedList: Variable[]) => {
    if (source === 'available') {
      setAvailableVariables([...reorderedList]);
    } else {
      setSelectedVariables([...reorderedList]);
    }
  };

  const resetVariableSelection = () => {
    const allVars = [...availableVariables, ...selectedVariables].sort((a, b) => a.columnIndex - b.columnIndex);
    setAvailableVariables(allVars);
    setSelectedVariables([]);
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