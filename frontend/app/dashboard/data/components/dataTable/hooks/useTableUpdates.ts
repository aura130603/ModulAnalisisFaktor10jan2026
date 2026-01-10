import { useCallback, useMemo, useRef } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { useStoreMediator } from '@/stores/useStoreMediator';
import type { Variable } from '@/types/Variable';
import { toast } from "sonner";
import type Handsontable from 'handsontable';
import type { CellUpdate } from '@/stores/useDataStore';
import type { StoreMediatorState } from '@/stores/useStoreMediator';

/** Handle creation of new variables when data is pasted into spare columns */
async function handleNewColumns(
  updates: CellUpdate[],
  currentVariables: Variable[],
  mediator: Pick<StoreMediatorState, 'emit'>
) {
  const addVariablesAction = useVariableStore.getState().addVariables;

  const actualNumCols = currentVariables.length > 0 ? Math.max(...currentVariables.map(v => v.columnIndex)) + 1 : 0;
  const maxCol = updates.reduce((max, u) => Math.max(max, u.col), -1);

  if (maxCol < actualNumCols) return;

  const newColIndices = Array.from({ length: maxCol - actualNumCols + 1 }, (_, i) => actualNumCols + i);

  // Group updates by new column index
  const updatesByCol: Record<number, Array<string | number>> = {};
  updates.forEach(({ col, value }) => {
    if (col >= actualNumCols) {
      (updatesByCol[col] ||= []).push(value);
    }
  });

  // Create one variable definition for each new column, inferring type.
  const newVariableDefinitions = newColIndices.map(colIndex => {
    const vals = updatesByCol[colIndex] || [];
    const isNumericOnly = vals.every(v => {
      if (v === null || String(v).trim() === '') return true; // Treat empty as conforming
      const num = typeof v === 'number' ? v : Number(String(v).replace(/,/g, ''));
      return !isNaN(num);
    });

    const newVar: Partial<Variable> = {
      columnIndex: colIndex,
      type: isNumericOnly ? 'NUMERIC' : 'STRING',
    };
    return newVar;
  });

  try {
    // Pass both the definitions and the data to be applied atomically
    await addVariablesAction(newVariableDefinitions, updates);
    
    // Notify mediator of structure change
    mediator.emit({
      type: 'STRUCTURE_CHANGED',
      payload: { source: 'variables' }
    });
  } catch (error) {
    console.error('Failed to add new variables/columns:', error);
    toast.error("Error Creating Columns: Could not add new columns automatically.");
  }
}

/**
 * Custom hook to manage data updates via Handsontable change events.
 * It handles data validation, type enforcement, and state persistence.
 */
export const useTableUpdates = (viewMode: 'numeric' | 'label') => {
    // Use selective subscription to minimize re-renders
    const variables = useVariableStore(state => state.variables);
    const updateCells = useDataStore(state => state.updateCells);
    const updateMultipleFields = useVariableStore(state => state.updateMultipleFields);
    const mediator = useStoreMediator();
    
    // Memoize variable map for performance
    const variableMap = useMemo(() => 
        new Map(variables.map(v => [v.columnIndex, v])), 
        [variables]
    );

    // Adaptive debouncing: different delays for single vs bulk operations
    const pendingUpdatesRef = useRef<CellUpdate[]>([]);
    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    const adaptiveUpdateCells = useMemo(() => {
        return (updates: CellUpdate[]) => {
            // Add to pending updates
            pendingUpdatesRef.current.push(...updates);
            
            // Clear existing timeout
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
            
            // Determine delay based on operation type
            const isBulkOperation = pendingUpdatesRef.current.length > 5;
            const delay = isBulkOperation ? 500 : 50; // 50ms for single cell, 500ms for bulk
            
            updateTimeoutRef.current = setTimeout(() => {
                const batchedUpdates = [...pendingUpdatesRef.current];
                pendingUpdatesRef.current = []; // Clear pending updates
                
                if (batchedUpdates.length > 0) {
                    updateCells(batchedUpdates);
                }
            }, delay);
        };
    }, [updateCells]);

    const handleBeforeChange = useCallback(
        (changes: Handsontable.CellChange[] | null, source: Handsontable.ChangeSource): void | boolean => {
            if (source === 'loadData' || !changes) {
                return;
            }

            for (const change of changes) {
                if (!change) continue;
                const [, , , newValue] = change;
                const col = change[1] as number;
                const variable = variableMap.get(col);
                
                if (variable?.type === 'STRING' && newValue && newValue.length > variable.width) {
                    change[3] = newValue.substring(0, variable.width);
                } else if (variable?.type === 'DATE' && newValue && typeof newValue === 'string') {
                    // Manually parse DD-MM-YYYY to avoid `new Date()` ambiguity.
                    const parts = newValue.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/);
                    if (parts) {
                        const day = parseInt(parts[1], 10);
                        const month = parseInt(parts[2], 10);
                        const year = parseInt(parts[3], 10);

                        // Validate the parsed date (e.g., checks for Feb 30)
                        const testDate = new Date(year, month - 1, day);
                        if (testDate.getFullYear() === year && testDate.getMonth() === month - 1 && testDate.getDate() === day) {
                            // If valid, re-format to the consistent DD-MM-YYYY with padding
                            change[3] = `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
                        }
                    }
                    // If format is invalid, it will be caught by the validator later.
                }
            }
            return;
        },
        [variableMap]
    );

    const handleAfterChange = useCallback(
        async (changes: Handsontable.CellChange[] | null, source: Handsontable.ChangeSource) => {
            if (!changes || source === 'loadData' || source === 'updateData') {
             return;
         }
 
             try {
                 const validUpdates: CellUpdate[] = changes
                     .filter((change): change is Handsontable.CellChange => !!change && change[2] !== change[3])
                     .map(([row, col, , newValue]) => {
                         const columnIdx = col as number;
                         let valueToSave: string | number =
                           typeof newValue === 'number' ? newValue : String(newValue ?? '');

                         if (viewMode === 'label') {
                             const variable = variableMap.get(columnIdx);
                             if (variable?.values?.length && newValue !== null && newValue !== undefined) {
                                 const sNewValue = String(newValue).trim();
                                 
                                 // Create label map for O(1) lookup (case-insensitive)
                                 const labelMap = new Map(variable.values.map(v => [v.label.toLowerCase(), v]));
                                 
                                 // Attempt to match a label first (case-insensitive)
                                 const labelMatch = labelMap.get(sNewValue.toLowerCase());
                                 
                                 if (labelMatch) {
                                     valueToSave = labelMatch.value;
                                 } else if (!isNaN(Number(sNewValue)) && sNewValue !== '') {
                                     // If not a label, but a number, ensure it's saved as a number
                                     valueToSave = Number(sNewValue);
                                 }
                                 // If it is neither, the validator should have caught it.
                                 // We leave the value as is (e.g. for empty strings).
                             }
                         }
                         return { row, col: columnIdx, value: valueToSave } as CellUpdate;
                     });
 
                 if (validUpdates.length === 0) return;
 
                 const actualNumCols = variables.length > 0 ? Math.max(...variables.map(v => v.columnIndex)) + 1 : 0;
                 
                 const updatesForNewCols = validUpdates.filter(u => u.col >= actualNumCols);
                 const updatesForExistingCols = validUpdates.filter(u => u.col < actualNumCols);
 
                 // Handle new column creation and their initial data atomically
                 if (updatesForNewCols.length > 0) {
                     await handleNewColumns(updatesForNewCols, variables, mediator);
                 }
 
                 // Handle updates for existing columns with adaptive debouncing
                 if (updatesForExistingCols.length > 0) {
                     adaptiveUpdateCells(updatesForExistingCols);
                 }
 
             } catch (error) {
                 console.error("Error processing changes:", error);
                 toast.error("Perubahan Anda tidak dapat disimpan.");
             }
        },
        [variableMap, adaptiveUpdateCells, viewMode, mediator, variables]
    );

     const handleAfterColumnResize = useCallback((newSize: number, col: number) => {
         // Create variable map for O(1) lookup
         const variableMap = new Map(variables.map(v => [v.columnIndex, v]));
         const variable = variableMap.get(col);
         if (variable && variable.columns !== newSize) {
             const newWidth = Math.max(20, newSize); 
             updateMultipleFields(variable.name, { columns: newWidth });
         }
     }, [variables, updateMultipleFields]);

    const handleAfterValidate = (
        _isValid: boolean,
        _value: unknown,
        _row: number,
        _prop: number | string
    ) => {
        // Intentionally a no-op for now; keep hook to allow future validation side-effects
        void _isValid; void _value; void _row; void _prop;
    };

    return {
        handleBeforeChange,
        handleAfterChange,
        handleAfterColumnResize,
        handleAfterValidate
    };
};
