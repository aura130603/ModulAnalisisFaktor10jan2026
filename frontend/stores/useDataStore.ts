// /stores/useDataStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import dataService from "@/services/data/DataService";
import { Variable } from "@/types/Variable";
import { WritableDraft } from 'immer';
import { DataRow } from "@/types/Data";

// Sync status types
export type SyncStatusType = 'idle' | 'syncing' | 'error';

export type CellUpdate = { row: number; col: number; value: string | number };
export type DataStoreError = {
    message: string;
    source: string;
    originalError?: any;
};

export interface DataStoreState {
    data: DataRow[];
    isLoading: boolean;
    error: DataStoreError | null;
    lastUpdated: Date | null;
    hasUnsavedChanges: boolean;
    // pending cell updates for delta sync
    pendingUpdates: CellUpdate[];
    syncStatus: SyncStatusType;
    lastSyncedAtSync: Date | null;
    syncError: string | null;

    loadData: (pendingUpdates?: CellUpdate[]) => Promise<void>;
    resetData: () => Promise<void>;

    setData: (newData: DataRow[]) => void;
    saveData: (rowsToSave?: DataRow[]) => Promise<void>;

    updateCell: (row: number, col: number, value: string | number) => Promise<void>;
    updateCells: (updates: CellUpdate[]) => Promise<void>;

    addRow: (index?: number) => Promise<void>;
    addRows: (indices: number[]) => Promise<void>;

    deleteRow: (index: number) => Promise<void>;
    deleteRows: (indices: number[]) => Promise<void>;

    sortData: (configs: { columnIndex: number; direction: 'asc' | 'desc' }[]) => Promise<void>;

    getVariableData: (variable: Variable) => Promise<{ variable: Variable, data: (string | number | null)[] }>;
    validateVariableData: (columnIndex: number, type: string, width: number) => Promise<{
        isValid: boolean;
        issues: Array<{ row: number; message: string }>
    }>;

    ensureColumns: (targetColIndex: number) => Promise<void>;
    checkAndSave: () => Promise<void>;
}

const initialState: Omit<DataStoreState, 'loadData' | 'resetData' | 'updateCell' | 'updateCells' | 'setData' | 'saveData' | 'addRow' | 'addRows' | 'deleteRow' | 'deleteRows' | 'sortData' | 'getVariableData' | 'validateVariableData' | 'ensureColumns' | 'checkAndSave'> = {
    data: [],
    isLoading: false,
    error: null,
    lastUpdated: null,
    hasUnsavedChanges: false,
    pendingUpdates: [],
    syncStatus: 'idle',
    lastSyncedAtSync: null,
    syncError: null
};

const _ensureMatrixDimensionsInternal = (state: WritableDraft<DataStoreState>, maxRow: number, maxCol: number, minColCount?: number): boolean => {
    const effectiveMaxCol = minColCount !== undefined ? Math.max(maxCol, minColCount - 1) : maxCol;
    const currentRows = state.data?.length || 0;
    const initialCols = currentRows > 0 ? (state.data[0]?.length || 0) : 0;

    let structureChanged = false;
    const targetRows = maxRow + 1;
    const targetCols = Math.max(initialCols, effectiveMaxCol + 1);

    if (targetRows <= currentRows && targetCols <= initialCols) {
        return false;
    }

    if (targetRows > currentRows) {
        for (let i = currentRows; i < targetRows; i++) {
            state.data.push(Array(targetCols).fill(""));
        }
        structureChanged = true;
    }

    if (targetCols > initialCols) {
        for (let i = 0; i < state.data.length; i++) {
            const currentRowWidth = state.data[i]?.length || 0;
            if (currentRowWidth < targetCols) {
                const colsToAdd = targetCols - currentRowWidth;
                state.data[i].push(...Array(colsToAdd).fill(""));
                structureChanged = true;
            }
        }
    }

    if (structureChanged) {
        state.lastUpdated = new Date();
    }

    return structureChanged;
};

export const useDataStore = create<DataStoreState>()(
    devtools(
        immer((set, get) => {
            // Helper function to handle the common logic for structural updates
            const performStructuralUpdate = async (newData: DataRow[], source: string) => {
                try {
                    await dataService.replaceAllData(newData);
                    set(state => {
                        state.data = newData;
                        state.lastUpdated = new Date();
                        state.hasUnsavedChanges = false;
                        state.error = null;
                        state.pendingUpdates = [];
                    });
                } catch (error: any) {
                    set(state => {
                        state.error = {
                            message: `Failed to save structural update from ${source}: ${error.message}`,
                            source,
                            originalError: error,
                        };
                    });
                }
            };

            return {
                ...initialState,

                loadData: async (pendingUpdates?: CellUpdate[]) => {
                    await get().checkAndSave();
                    set((state) => { state.isLoading = true; state.error = null; });
                    try {
                        const { data } = await dataService.loadAllData();
                        set((state) => { 
                            state.data = data;
                            let updatesApplied = false;
                            
                            if (pendingUpdates && pendingUpdates.length > 0) {
                                let maxRow = -1, maxCol = -1;
                                pendingUpdates.forEach(({ row, col }) => { if (row > maxRow) maxRow = row; if (col > maxCol) maxCol = col; });
                                
                                _ensureMatrixDimensionsInternal(state, maxRow, maxCol);
                                
                                pendingUpdates.forEach(({ row, col, value }) => {
                                    state.data[row][col] = value;
                                });

                                // Add the temporary updates to the main pending queue
                                state.pendingUpdates.push(...pendingUpdates);
                                updatesApplied = true;
                            }

                            state.lastUpdated = new Date(); 
                            state.isLoading = false;
                            // If we applied updates, the state now has unsaved changes.
                            state.hasUnsavedChanges = updatesApplied;
                        });
                    } catch (error: any) {
                        console.error("Failed to load data:", error);
                        set((state) => {
                            state.error = { message: error.message || "Error loading data", source: "loadData", originalError: error };
                            state.isLoading = false; state.data = [];
                        });
                    }
                },

                resetData: async () => {
                    try {
                        await dataService.resetAllData();
                        set((state) => { 
                            state.data = []; 
                            state.lastUpdated = new Date(); 
                            state.error = null; 
                            state.hasUnsavedChanges = false;
                        });
                    } catch (error: any) {
                        console.error("Failed to reset data:", error);
                        set((state) => { state.error = { message: error.message || "Error resetting data", source: "resetData", originalError: error }; });
                    }
                },

                updateCell: async (row, col, value) => {
                    return get().updateCells([{ row, col, value }]);
                },

                updateCells: async (updates) => {
                    if (!updates || updates.length === 0) return;

                    const oldData = get().data;
                    let maxRow = -1, maxCol = -1;
                    updates.forEach(({ row, col }) => { if (row > maxRow) maxRow = row; if (col > maxCol) maxCol = col; });

                    const validUpdates = updates.filter(({ row, col, value }) => {
                        const currentValue = oldData[row]?.[col];
                        const isNewCell = !(row < oldData.length && col < (oldData[row]?.length ?? 0));
                        return (currentValue !== value) || (isNewCell && (value !== "" && value !== null && value !== undefined));
                    });

                    if (validUpdates.length === 0) return;

                    let dataChanged = false;
                    let structureChanged = false;

                    set((state) => {
                        const minCols = state.data.length > 0 ? state.data[0]?.length ?? 0 : 0;
                        structureChanged = _ensureMatrixDimensionsInternal(state, maxRow, maxCol, minCols);
                        updates.forEach(({ row, col, value }) => {
                            if (state.data[row][col] !== value) {
                                state.data[row][col] = value;
                                dataChanged = true;
                            }
                        });

                        if (dataChanged || structureChanged) {
                            state.lastUpdated = new Date();
                            state.hasUnsavedChanges = true;
                            state.pendingUpdates.push(...validUpdates);
                        }
                    });
                },

                setData: (newData) => {
                    set(state => {
                        state.data = newData;
                        state.lastUpdated = new Date();
                        state.error = null;
                        state.hasUnsavedChanges = true;
                    });
                },

                saveData: async (rowsToSave) => {
                    set((state) => { state.syncStatus = 'syncing'; state.syncError = null; });
                    try {
                        if (rowsToSave) {
                            await dataService.replaceAllData(rowsToSave);
                        } else if (get().pendingUpdates.length > 0) {
                            await dataService.applyBulkUpdates(get().pendingUpdates);
                        } else if (get().hasUnsavedChanges) {
                            // This case handles structural changes (add/delete/sort rows)
                            // that modify the data array but don't create cell-based updates.
                            await dataService.replaceAllData(get().data);
                        } else {
                            // Nothing to save
                            set((state) => { state.syncStatus = 'idle'; });
                            return;
                        }

                        // On successful save, reset the state
                        set((state) => {
                            state.error = null;
                            state.lastUpdated = new Date();
                            state.hasUnsavedChanges = false;
                            state.syncStatus = 'idle';
                            state.lastSyncedAtSync = new Date();
                            state.pendingUpdates = [];
                        });
                    } catch (error: any) {
                        console.error("Failed to explicitly save data:", error);
                        set(state => {
                            state.error = { message: error.message || "Failed to save data during explicit save", source: "saveData", originalError: error };
                            state.syncStatus = 'error';
                            state.syncError = error.message;
                        });
                        throw error;
                    }
                },

                addRow: async (index) => {
                    return get().addRows(index !== undefined ? [index] : [get().data.length]);
                },

                addRows: async (indices) => {
                    if (!indices || indices.length === 0) return;
                    
                    const sorted = [...indices].sort((a, b) => b - a); // Process from highest index to lowest
                    
                    const oldData = [...get().data];
                    const colCount = oldData.length > 0 ? (oldData[0]?.length ?? 0) : 0;
                    const newRow = Array(colCount).fill("");
                    
                    let updatedData = [...oldData];
                    for (const index of sorted) {
                        const rowIndex = index !== undefined ? index : updatedData.length;
                        updatedData.splice(rowIndex, 0, [...newRow]);
                    }
                    
                    await performStructuralUpdate(updatedData, 'addRows');
                },

                deleteRow: async (index) => {
                    return get().deleteRows([index]);
                },

                deleteRows: async (indices) => {
                    if (!indices || indices.length === 0) return;
                    
                    const oldData = [...get().data];
                    const indicesSet = new Set(indices);
                    
                    for (const index of indices) {
                        if (index < 0 || index >= oldData.length) {
                            const error = { message: `Invalid row index ${index} for deletion`, source: "deleteRows" };
                            set(state => { state.error = error; });
                            console.error(error.message);
                            return; // Stop execution
                        }
                    }
                    
                    const newData = oldData.filter((_, index) => !indicesSet.has(index));
                    
                    await performStructuralUpdate(newData, 'deleteRows');
                },

                sortData: async (configs) => {
                    if (!configs || configs.length === 0) return;

                    const oldData = [...get().data];
                    if (oldData.length === 0) return;
                    
                    const rowsToSort = [...oldData];
                    rowsToSort.sort((rowA, rowB) => {
                        for (const config of configs) {
                            const { columnIndex, direction } = config;
                            const valueA = columnIndex < (rowA?.length ?? 0) ? rowA[columnIndex] : "";
                            const valueB = columnIndex < (rowB?.length ?? 0) ? rowB[columnIndex] : "";
                            
                            const isANumeric = typeof valueA === 'number' || (typeof valueA === 'string' && valueA !== "" && !isNaN(Number(valueA)));
                            const isBNumeric = typeof valueB === 'number' || (typeof valueB === 'string' && valueB !== "" && !isNaN(Number(valueB)));

                            let comparison = 0;
                            if (isANumeric && isBNumeric) {
                                const numA = typeof valueA === 'number' ? valueA : Number(valueA); 
                                const numB = typeof valueB === 'number' ? valueB : Number(valueB);
                                comparison = numA - numB;
                            } else if (isANumeric && !isBNumeric) {
                                comparison = -1;
                            } else if (!isANumeric && isBNumeric) {
                                comparison = 1;
                            } else {
                                const strA = String(valueA ?? '').toLowerCase(); 
                                const strB = String(valueB ?? '').toLowerCase();
                                comparison = strA.localeCompare(strB);
                            }

                            if (comparison !== 0) {
                                return direction === 'asc' ? comparison : -comparison;
                            }
                        }
                        return 0; // Return 0 if all sort criteria are equal
                    });

                    await performStructuralUpdate(rowsToSort, 'sortData');
                },

                getVariableData: async (variable) => {
                    if (get().data.length === 0 && !get().isLoading) { await get().loadData(); }
                    const currentData = get().data;
                    const { columnIndex } = variable;
                    if (columnIndex < 0) return { variable, data: [] };
                    
                    try {
                        const { columnData } = await dataService.getColumnData(columnIndex);
                        return { variable, data: columnData };
                    } catch (error) {
                        console.error(`Failed to get variable data via service, using local: ${error}`);
                        const columnData = currentData.map(row => (row && columnIndex < row.length) ? row[columnIndex] : null );
                        return { variable, data: columnData };
                    }
                },

                validateVariableData: async (columnIndex, type, width) => {
                    const currentData = get().data;
                    const issues: Array<{ row: number; message: string }> = [];
                    const updates: CellUpdate[] = [];
                    let isValid = true;
                    if (currentData.length === 0 || columnIndex < 0) return { isValid: true, issues: [] };
                    for (let row = 0; row < currentData.length; row++) {
                        const value = currentData[row]?.[columnIndex];
                        let correctedValue: string | number | undefined = undefined;
                        let issueMessage: string | null = null;
                        if (value === "" || value === null || value === undefined) continue;

                        if (type.startsWith("NUMERIC") || ["COMMA", "DOT", "SCIENTIFIC"].includes(type)) {
                            const numValue = Number(value);
                            if (isNaN(numValue)) { issueMessage = `R${row + 1}C${columnIndex + 1}: "${value}" invalid number.`; isValid = false; correctedValue = ""; }
                            else if (String(value).length > width) { issueMessage = `R${row + 1}C${columnIndex + 1}: Number "${value}" exceeds width.`; isValid = false; correctedValue = ""; }
                        } else if (type === "STRING") {
                            const strValue = String(value);
                            if (strValue.length > width) { issueMessage = `R${row + 1}C${columnIndex + 1}: String "${strValue}" exceeds width.`; isValid = false; correctedValue = strValue.substring(0, width); }
                        } else if (["DATE", "ADATE", "EDATE", "SDATE", "JDATE"].includes(type)) {
                            if (isNaN(Date.parse(String(value)))) { issueMessage = `R${row + 1}C${columnIndex + 1}: Value "${value}" invalid date.`; isValid = false; correctedValue = ""; }
                        }

                        if (issueMessage) issues.push({ row, message: issueMessage });
                        if (correctedValue !== undefined && correctedValue !== value) updates.push({ row, col: columnIndex, value: correctedValue });
                    }
                    if (updates.length > 0) await get().updateCells(updates);
                    return { isValid, issues };
                },

                ensureColumns: async (targetColIndex) => {
                    const currentMaxCol = get().data.length > 0 ? (get().data[0]?.length ?? 0) - 1 : -1;

                    if (targetColIndex > currentMaxCol) {
                        set((state) => {
                            const maxRowIndex = state.data.length > 0 ? state.data.length - 1 : 0;
                            _ensureMatrixDimensionsInternal(state, maxRowIndex, targetColIndex);
                        });
                    }
                },

                checkAndSave: async () => {
                    if (get().hasUnsavedChanges) {
                        try {
                            await get().saveData();
                        } catch (error) {
                            console.error("Auto-save before load failed:", error);
                            throw new Error("Failed to save pending changes. Please check for errors and try again.");
                        }
                    }
                },
            };
        })
    )
);