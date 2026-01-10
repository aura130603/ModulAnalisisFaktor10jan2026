import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";
import { variableService, sheetService } from "@/services/data";
import { Variable } from "@/types/Variable";
import { v4 as uuidv4 } from 'uuid';
import { useDataStore, CellUpdate } from '@/stores/useDataStore';

export type VariableStoreError = {
    message: string;
    source: string;
    originalError?: any;
};

const inferDefaultValues = (type: Variable['type']): Partial<Variable> => {
    const numericTypes: Variable['type'][] = ["NUMERIC", "DOT", "COMMA", "SCIENTIFIC"];
    const isNumeric = numericTypes.includes(type);
    return {
        decimals: isNumeric ? 2 : 0,
        align: type === "STRING" ? "left" : "right",
        measure: type === "STRING" ? "nominal" : "unknown",
        role: "input"
    };
};

// SPSS reserved keywords (cannot be used as variable names)
const RESERVED_KEYWORDS = new Set(["ALL","AND","BY","EQ","GE","GT","LE","LT","NE","NOT","OR","TO","WITH"]);

export const processVariableName = (name: string, existingVariables: Variable[]): {
    isValid: boolean;
    message?: string;
    processedName?: string;
} => {
    if (!name) return { isValid: false, message: "Variable name cannot be empty" };
    // Trim and replace spaces
    let processedName = name.trim().replace(/\s+/g, '_');
    // Keep only allowed chars: letters, digits, dot, underscore, @, #, $
    processedName = processedName.replace(/[^A-Za-z0-9._@#$]/g, '_');
    // Must start with letter or @,#,$
    if (!/^[A-Za-z@#$]/.test(processedName)) processedName = 'VAR_' + processedName;
    // Remove trailing dots or underscores
    processedName = processedName.replace(/[._]+$/g, '');
    // Enforce max length 64
    if (processedName.length > 64) processedName = processedName.slice(0, 64);
    // Avoid reserved keywords (case-insensitive)
    if (RESERVED_KEYWORDS.has(processedName.toUpperCase())) processedName = 'VAR_' + processedName;
    // Ensure uniqueness (case-insensitive)
    const existingNames = existingVariables.map(v => v.name.toLowerCase());
    if (existingNames.includes(processedName.toLowerCase())) {
        let counter = 1;
        const base = processedName.slice(0, 60);
        let uniqueName = processedName;
        while (existingNames.includes(uniqueName.toLowerCase())) {
            uniqueName = `${base}_${counter}`;
            counter++;
        }
        processedName = uniqueName;
    }
    return { isValid: true, processedName };
};

export const createDefaultVariable = (index: number, existingVariables: Variable[] = []): Variable => {
    // Match existing default names case-insensitively
    const regex = /^var(\d+)$/i;
    let maxNum = 0;
    existingVariables.forEach(v => {
        const match = v.name.match(regex);
        if (match) {
            const num = parseInt(match[1]);
            if (num > maxNum) maxNum = num;
        }
    });
    // Use uppercase prefix for default variable names
    const baseName = `VAR${maxNum + 1}`;
    const nameResult = processVariableName(baseName, existingVariables);
    return {
        tempId: uuidv4(),
        columnIndex: index, name: nameResult.processedName || baseName, type: "NUMERIC", width: 8, decimals: 2,
        label: "", values: [], missing: null, columns: 64, align: "right", measure: "unknown", role: "input"
    };
};

// Helper function to validate a variable object
const isValidVariable = (variable: any): variable is Variable => {
    return variable &&
           typeof variable.columnIndex === 'number' &&
           typeof variable.name === 'string' &&
           variable.name !== "" &&
           typeof variable.type === 'string' &&
           variable.type !== "" &&
           typeof variable.width === 'number' &&
           typeof variable.decimals === 'number' &&
           Array.isArray(variable.values) &&
           (variable.missing === null || typeof variable.missing === 'object') &&
           typeof variable.columns === 'number' &&
           typeof variable.align === 'string' &&
           typeof variable.measure === 'string' &&
           typeof variable.role === 'string';
};

// Helper function for finding variable index by identifier (number or string)
const findVariableIndexByIdentifier = (variables: Variable[], identifier: number | string): number => {
    if (typeof identifier === 'number') {
        return variables.findIndex(v => v.columnIndex === identifier);
    }
    const key = String(identifier).toLowerCase();
    return variables.findIndex(v => v.name.toLowerCase() === key);
};

// Helper function for updating state after successful operation
const updateStateAfterSuccess = (set: any, variables: Variable[]) => {
    set((draft: any) => {
        draft.variables = variables
            .filter(isValidVariable)
            .map(v => ({ ...v, tempId: v.tempId || uuidv4() }))
            .sort((a, b) => a.columnIndex - b.columnIndex);
        draft.lastUpdated = new Date();
        draft.error = null;
        draft.isLoading = false;
    });
};

// Unified error handler for store actions
const handleError = (set: any, source: string) => (error: any) => {
    console.error(`Error in ${source}:`, error);
    set((draft: any) => {
        draft.error = { message: error.message || `Error in ${source}`, source, originalError: error };
        draft.isLoading = false;
    });
};

// Helper to wrap async actions with loading and error handling
const action = <T extends (...args: any[]) => Promise<any>>(
    set: any,
    get: any,
    fn: T,
    source: string
): ((...args: Parameters<T>) => Promise<ReturnType<T> | void>) => {
    return async (...args) => {
        set((draft: any) => {
            draft.isLoading = true;
            draft.error = null;
        });
        try {
            return await fn(...args);
        } catch (error: any) {
            handleError(set, source)(error);
        }
    };
};

interface VariableStoreState {
    // State
    variables: Variable[];
    isLoading: boolean;
    error: VariableStoreError | null;
    lastUpdated: Date | null;

    // Initialization & state management
    loadVariables: () => Promise<void>;
    resetVariables: () => Promise<void>;
    setVariables: (variables: Variable[]) => void;
    overwriteAll: (variables: Variable[], data: any[]) => Promise<void>;

    // Accessors
    getVariableByColumnIndex: (columnIndex: number) => Variable | undefined;

    // Single-item operations
    addVariable: (variableData?: Partial<Variable>) => Promise<void>;
    addVariables: (variablesData: Partial<Variable>[], updates: CellUpdate[]) => Promise<void>;
    updateVariable: <K extends keyof Variable>(identifier: number | string, field: K, value: Variable[K]) => Promise<void>;
    updateMultipleFields: (identifier: number | string, changes: Partial<Variable>) => Promise<void>;
    deleteVariable: (columnIndex: number) => Promise<void>;
    deleteVariables: (columnIndices: number[]) => Promise<void>;

    // Batch operations
    updateMultipleVariables: (batch: { identifier: number | string; changes: Partial<Variable> }[]) => Promise<void>;
    sortVariables: (direction: 'asc' | 'desc', columnIndex: number) => Promise<void>;
    saveVariables: () => Promise<void>;
}

// Helper to enforce measure constraint
const enforceMeasureConstraint = (changes: Partial<Variable>, existingVariable?: Variable | null): Partial<Variable> => {
    const finalChanges = { ...changes };
    const currentType = existingVariable?.type;
    const finalType = finalChanges.type ?? currentType;
    const finalMeasure = finalChanges.measure ?? existingVariable?.measure;

    if (finalType === 'STRING' && finalMeasure === 'scale') {
        // If type is or becomes STRING, measure cannot be scale. Force to nominal.
        finalChanges.measure = 'nominal';
        console.warn(`Constraint Applied: Variable type is STRING, measure cannot be 'scale'. Setting measure to 'nominal'.`);
    }

    // Return the potentially modified changes object
    return finalChanges;
};

// Static mapping for field names by column index
const FIELD_NAME_MAPPING = [
  "name", "type", "width", "decimals", "label", "values", "missing",
  "columns", "align", "measure", "role"
] as const;

export const useVariableStore = create<VariableStoreState>()(
    devtools(
        immer((set, get) => ({
            variables: [],
            isLoading: false,
            error: null,
            lastUpdated: null,

            setVariables: (variables) => {
                updateStateAfterSuccess(set, variables);
            },

            updateVariable: async <K extends keyof Variable>(
                identifier: number | string,
                field: K,
                value: Variable[K]
            ) => {
                // Simply delegate to updateMultipleFields with a single field update
                return get().updateMultipleFields(identifier, { [field]: value } as Partial<Variable>);
            },

            updateMultipleFields: async (identifier, changes) => {
                set(draft => { draft.isLoading = true; draft.error = null; });
                let variableIndexInState: number = -1;
                let originalVariable: Variable | null = null;

                try {
                    // 1. Find variable in state
                    variableIndexInState = findVariableIndexByIdentifier(get().variables, identifier);
                    if (variableIndexInState === -1) throw new Error(`Variable "${identifier}" not found in state.`);
                    originalVariable = { ...get().variables[variableIndexInState] }; // Get a copy

                    // 2. Prepare changes (type inference)
                    let processedChanges = { ...changes };
                    let inferred: Partial<Variable> = {};
                    if ('type' in processedChanges && processedChanges.type !== originalVariable.type) {
                        inferred = inferDefaultValues(processedChanges.type as Variable['type']);
                        for (const key in inferred) {
                            if (key in processedChanges) delete inferred[key as keyof Partial<Variable>];
                        }
                    }

                    // 3. Combine changes and enforce constraints
                    let changesToApply = { ...inferred, ...processedChanges };
                    changesToApply = enforceMeasureConstraint(changesToApply, originalVariable);

                    // 4. Save changes via variableService
                    const updatedVariable = { ...originalVariable, ...changesToApply };
                    await variableService.saveVariable(updatedVariable);

                    // If type or width changed, validate data which may trigger data store auto-sync
                    if ('type' in changesToApply || 'width' in changesToApply) {
                        const { columnIndex, type, width } = updatedVariable;
                        useDataStore.getState().validateVariableData(columnIndex, type ?? 'STRING', width);
                    }

                    // 5. Update State
                    set((draft) => {
                        if (variableIndexInState !== -1) {
                            Object.assign(draft.variables[variableIndexInState], changesToApply);
                        }
                        draft.lastUpdated = new Date();
                        draft.error = null;
                        draft.isLoading = false;
                    });
                } catch (error: any) { handleError(set, 'updateMultipleFields')(error); }
            },

            // Batch-update multiple variables atomically
            updateMultipleVariables: async (batch: { identifier: number | string; changes: Partial<Variable> }[]) => {
                set(draft => { draft.isLoading = true; draft.error = null; });
                try {
                    const current = [...get().variables];
                    const updated = current.map(v => {
                        const found = batch.find(item => typeof item.identifier === 'number'
                            ? v.columnIndex === item.identifier
                            : v.name.toLowerCase() === String(item.identifier).toLowerCase());
                        return found ? { ...v, ...found.changes } : v;
                    });
                    await variableService.importVariables(updated);
                    await get().loadVariables();
                } catch (error: any) { handleError(set, 'updateMultipleVariables')(error); }
            },

            addVariables: async (variablesData, updates) => {
                set(draft => { draft.isLoading = true; draft.error = null; });
                try {
                    // Save any pending changes first to avoid data loss
                    await useDataStore.getState().checkAndSave();
            
                    const finalNewVars: Variable[] = [];
                    const combinedVars = [...get().variables]; // Start with current variables for uniqueness checks
            
                    // Sort by column index to process them in order
                    const sortedVariablesData = [...variablesData].sort((a, b) => a.columnIndex! - b.columnIndex!);
            
                    for (const varData of sortedVariablesData) {
                        const idx = varData.columnIndex!;
                        // Use the combined array which grows with each new variable
                        const defaultVar = createDefaultVariable(idx, combinedVars);
                        const inferred = varData.type ? inferDefaultValues(varData.type) : {};
                        const baseVar: Variable = { ...defaultVar, ...inferred, ...varData, columnIndex: idx };
                        
                        const nameRes = processVariableName(baseVar.name, combinedVars);
                        const finalName = nameRes.processedName ?? baseVar.name;
                        const finalVar: Variable = { ...baseVar, name: finalName, ...enforceMeasureConstraint({ ...baseVar, name: finalName }, null) };
                        
                        finalNewVars.push(finalVar);
                        combinedVars.push(finalVar); // Add to temp array for the next iteration's uniqueness check
                    }
                    
                    // Update data state immediately to show the column insertions
                    const dataStore = useDataStore.getState();
                    let currentData = [...dataStore.data];
                    
                    // Process columns in reverse order to maintain correct indices
                    const reverseSortedVars = [...finalNewVars].sort((a, b) => b.columnIndex - a.columnIndex);
                    for (const newVar of reverseSortedVars) {
                        currentData = currentData.map(row => {
                            const newRow = [...row];
                            newRow.splice(newVar.columnIndex, 0, ""); // Insert empty cell at the specified column index
                            return newRow;
                        });
                    }
                    
                    // Update the data store state immediately
                    dataStore.setData(currentData);
                    
                    // Apply the pending updates to the new data structure
                    if (updates && updates.length > 0) {
                        await dataStore.updateCells(updates);
                    }
                    
                    // Create variables in database
                    await sheetService.addMultipleColumns(finalNewVars);
                    
                    // Reload variables to get the new structure from database
                    const variables = await variableService.getAllVariables();
                    updateStateAfterSuccess(set, variables);
                    
                    // Save the data changes to database
                    await dataStore.saveData();
                } catch (error: any) {
                    handleError(set, 'addVariables')(error);
                }
            },

            addVariable: async (variableData?) => {
                set(draft => { draft.isLoading = true; draft.error = null; });
                try {
                    await useDataStore.getState().checkAndSave();
                    const existing = [...get().variables];
                    const maxInitial = existing.length > 0 ? Math.max(...existing.map(v => v.columnIndex)) : -1;
                    const idx = variableData?.columnIndex ?? (maxInitial + 1);

                    // If a user tries to insert a column far away from the last one,
                    // this logic detects the "gap" and creates default variables to fill it.
                    if (idx > maxInitial + 1) {
                        const variablesToAdd: Partial<Variable>[] = [];
                        // Create default variables to fill the gap
                        for (let i = maxInitial + 1; i < idx; i++) {
                            variablesToAdd.push({ columnIndex: i });
                        }
                        // Add the user-triggered variable
                        variablesToAdd.push({ ...variableData, columnIndex: idx });
                        
                        // Delegate to the 'addVariables' (plural) function which can handle this.
                        return get().addVariables(variablesToAdd, []);
                    }

                    // Standard logic for single insertion without gaps
                    const defaultVar = createDefaultVariable(idx, existing);
                    const inferred = variableData?.type ? inferDefaultValues(variableData.type) : {};
                    const baseVar: Variable = { ...defaultVar, ...inferred, ...variableData, columnIndex: idx, tempId: variableData?.tempId ?? defaultVar.tempId };
                    const nameRes = processVariableName(baseVar.name, existing);
                    const finalName = nameRes.processedName ?? baseVar.name;
                    const constraintChanges = enforceMeasureConstraint({ ...baseVar, name: finalName }, null);
                    const newVar: Variable = { ...baseVar, name: finalName, ...constraintChanges };

                    // Update data state immediately to show the column insertion
                    const dataStore = useDataStore.getState();
                    const currentData = [...dataStore.data];
                    const updatedData = currentData.map(row => {
                        const newRow = [...row];
                        newRow.splice(idx, 0, ""); // Insert empty cell at the specified column index
                        return newRow;
                    });
                    
                    // Update the data store state immediately
                    dataStore.setData(updatedData);

                    // Now perform the database operation
                    await sheetService.insertColumn(newVar);
                    
                    // Reload variables to get the updated structure from database
                    await get().loadVariables();
                    
                    // Save the data changes to database
                    await dataStore.saveData();
                } catch (error: any) { 
                    handleError(set, 'addVariable')(error); 
                }
            },

            loadVariables: async () => {
                set({ isLoading: true, error: null });
                try {
                    // Only check and save if we're not in the middle of an overwrite operation
                    const dataStore = useDataStore.getState();
                    if (dataStore.hasUnsavedChanges && !get().isLoading) {
                        await dataStore.checkAndSave();
                    }
                    const variables = await variableService.getAllVariables();
                    updateStateAfterSuccess(set, variables);
                } catch (error: any) {
                    handleError(set, 'loadVariables')(error);
                }
            },

            resetVariables: async () => {
                set({ isLoading: true, error: null });
                try {
                    await variableService.clearAllVariables();
                    updateStateAfterSuccess(set, []);
                } catch (error: any) {
                    handleError(set, 'resetVariables')(error);
                }
            },

            deleteVariable: async (columnIndex: number) => {
                set(draft => { draft.isLoading = true; draft.error = null; });
                try {
                    await useDataStore.getState().checkAndSave();
                    await sheetService.deleteColumn(columnIndex);
                    await get().loadVariables(); // Reload state from DB
                    await useDataStore.getState().loadData(); // Reload data state from DB
                } catch (error: any) { 
                    handleError(set, 'deleteVariable')(error); 
                }
            },

            deleteVariables: async (columnIndices: number[]) => {
                set(draft => { draft.isLoading = true; draft.error = null; });
                try {
                    await useDataStore.getState().checkAndSave();
                    await sheetService.deleteMultipleColumns(columnIndices);
                    await get().loadVariables(); 
                    await useDataStore.getState().loadData();
                } catch (error: any) { 
                    handleError(set, 'deleteVariables')(error); 
                }
            },

            overwriteAll: async (variables, data) => {
                set(draft => { draft.isLoading = true; draft.error = null; });
                try {
                    // Replace all data without checking for unsaved changes since we're overwriting everything
                    await sheetService.replaceAll(variables, data);
                    // After success, reload everything to ensure stores are in sync
                    // Use direct service calls to avoid circular dependency
                    const freshVariables = await variableService.getAllVariables();
                    updateStateAfterSuccess(set, freshVariables);
                    
                    // Update data store directly without triggering checkAndSave
                    const dataStore = useDataStore.getState();
                    dataStore.setData(data);
                    set(draft => { draft.isLoading = false; });
                } catch (error: any) {
                    handleError(set, 'overwriteAll')(error);
                }
            },

            sortVariables: async (direction, columnIndex) => {
                set(draft => { draft.isLoading = true; draft.error = null; });
                try {
                    await useDataStore.getState().checkAndSave();
                    const field = FIELD_NAME_MAPPING[columnIndex] ?? null;
                    if (!field) {
                        throw new Error(`Invalid column index ${columnIndex} for sorting.`);
                    }
                    
                    await sheetService.sortSheetByVariable(direction, field);
                    
                    await get().loadVariables();
                    await useDataStore.getState().loadData();
                } catch (error: any) { handleError(set, 'sortVariables')(error); }
            },

            saveVariables: async () => {
                set(draft => { draft.isLoading = true; draft.error = null; });
                try {
                    const variablesToSave = get().variables.filter(v => v && v.name);
                    await variableService.importVariables(variablesToSave);
                    await get().loadVariables();
                } catch (error: any) {
                    handleError(set, 'saveVariables')(error);
                }
            },

            getVariableByColumnIndex: (columnIndex: number) => {
                return get().variables.find(v => v.columnIndex === columnIndex);
            },
        }))
    )
);