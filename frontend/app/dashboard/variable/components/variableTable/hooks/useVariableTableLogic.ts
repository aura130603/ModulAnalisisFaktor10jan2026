import { useState, useMemo, useCallback } from 'react';
import type Handsontable from 'handsontable';
import type { HotTableRef } from '@handsontable/react-wrapper';
import { useVariableStore } from '@/stores/useVariableStore';
import {
    DEFAULT_VARIABLE_TYPE,
    COLUMN_INDEX_TO_FIELD_MAP,
    DIALOG_TRIGGER_COLUMNS,
} from '../tableConfig';
import type { Variable, VariableType, ValueLabel, MissingValuesSpec } from '@/types/Variable';

type ValuesChangePayload = ValueLabel[];
type MissingChangePayload = MissingValuesSpec | null;

export function useVariableTableLogic(hotTableRef: React.RefObject<HotTableRef>) {
    const { variables, addVariable, updateMultipleFields, deleteVariables } = useVariableStore();

    // --- DIALOG STATE MANAGEMENT ---
    const [showTypeDialog, setShowTypeDialog] = useState(false);
    const [showValuesDialog, setShowValuesDialog] = useState(false);
    const [showMissingDialog, setShowMissingDialog] = useState(false);
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

    const selectedVariable = useMemo(() => {
        if (!selectedCell) return null;
        return variables.find(v => v.columnIndex === selectedCell.row) ?? null;
    }, [selectedCell, variables]);

    const selectedVariableType = useMemo(() => {
        return selectedVariable?.type ?? DEFAULT_VARIABLE_TYPE;
    }, [selectedVariable]);

    // --- DIALOG HANDLERS ---
    const openDialog = useCallback((dialog: 'type' | 'values' | 'missing', row: number, col: number) => {
        requestAnimationFrame(() => {
            setSelectedCell({ row, col });
            if (dialog === 'type') setShowTypeDialog(true);
            else if (dialog === 'values') setShowValuesDialog(true);
            else if (dialog === 'missing') setShowMissingDialog(true);
        });
    }, []);

    const handleTypeChange = useCallback(async (type: VariableType, width: number, decimals: number) => {
        if (!selectedCell) return;
        const rowIndex = selectedCell.row;
        const payload: Partial<Variable> = { type, width, decimals };

        if (selectedVariable) {
            await updateMultipleFields(rowIndex, payload);
        } else {
            await addVariable({ ...payload, columnIndex: rowIndex });
        }
        setShowTypeDialog(false);
    }, [selectedCell, selectedVariable, updateMultipleFields, addVariable]);

    const handleValuesChange = useCallback(async (newValueLabels: ValuesChangePayload) => {
        if (!selectedCell) return;
        const rowIndex = selectedCell.row;
        const payload: Partial<Variable> = { values: newValueLabels };

        if (selectedVariable) {
            await updateMultipleFields(rowIndex, payload);
        } else {
            await addVariable({ ...payload, columnIndex: rowIndex });
        }
        setShowValuesDialog(false);
    }, [selectedCell, selectedVariable, updateMultipleFields, addVariable]);

    const handleMissingChange = useCallback(async (newMissingSpec: MissingChangePayload) => {
        if (!selectedCell) return;
        const rowIndex = selectedCell.row;
        const payload: Partial<Variable> = { missing: newMissingSpec };

        if (selectedVariable) {
            await updateMultipleFields(rowIndex, payload);
        } else {
            await addVariable({ ...payload, columnIndex: rowIndex });
        }
        setShowMissingDialog(false);
    }, [selectedCell, selectedVariable, updateMultipleFields, addVariable]);

    // --- GRID EVENT HANDLERS ---
    const handleBeforeChange = useCallback((
        changes: (Handsontable.CellChange | null)[],
        source: Handsontable.ChangeSource
    ): boolean | void => {
        if (source === 'loadData' || !changes) return;

        for (const change of changes) {
            if (!change) continue;
            const [row, prop, , newValue] = change;
            if (typeof row !== 'number') continue;

            const columnIndex: number = (typeof prop === 'number' || typeof prop === 'string')
                ? (hotTableRef.current?.hotInstance?.propToCol(prop) ?? -1)
                : -1;

            if (columnIndex === -1) continue;

            if (DIALOG_TRIGGER_COLUMNS.includes(columnIndex)) {
                openDialog(COLUMN_INDEX_TO_FIELD_MAP[columnIndex] as 'type' | 'values' | 'missing', row, columnIndex);
                return false; // Cancel the direct edit
            }

            const field = COLUMN_INDEX_TO_FIELD_MAP[columnIndex];
            if (field) {
                const existingVar = variables.find(v => v.columnIndex === row);
                if (existingVar) {
                    updateMultipleFields(row, { [field]: newValue });
                } else {
                    addVariable({ [field]: newValue, columnIndex: row });
                }
            }
        }
    }, [variables, updateMultipleFields, addVariable, openDialog, hotTableRef]);

    const handleAfterSelectionEnd = useCallback((row: number, col: number, row2: number, col2: number) => {
        if (row === row2 && col === col2) {
            setSelectedCell({ row, col });
            if (DIALOG_TRIGGER_COLUMNS.includes(col)) {
                openDialog(COLUMN_INDEX_TO_FIELD_MAP[col] as 'type' | 'values' | 'missing', row, col);
            }
        } else {
            setSelectedCell(null);
        }
    }, [openDialog]);

    // --- CONTEXT MENU HANDLERS ---
    const handleInsertVariable = useCallback(async () => {
        const hot = hotTableRef.current?.hotInstance;
        if (!hot) return;
        const selectedRange = hot.getSelectedRangeLast();
        const insertIndex = selectedRange ? Math.min(selectedRange.from.row, variables.length) : variables.length;
        await addVariable({ columnIndex: insertIndex });
    }, [hotTableRef, addVariable, variables.length]);

    const handleDeleteVariables = useCallback(async () => {
        const hot = hotTableRef.current?.hotInstance;
        if (!hot) return;
        const selectedRange = hot.getSelectedRangeLast();
        if (!selectedRange) return;

        const startRow = Math.min(selectedRange.from.row, selectedRange.to.row);
        const endRow = Math.max(selectedRange.from.row, selectedRange.to.row);

        const indicesToDelete = Array.from({ length: endRow - startRow + 1 }, (_, i) => startRow + i)
            .filter(index => variables.some(v => v.columnIndex === index));

        if (indicesToDelete.length > 0) {
            await deleteVariables(indicesToDelete);
        }
    }, [hotTableRef, variables, deleteVariables]);

    const handleCopyVariable = useCallback(() => {
        const hot = hotTableRef.current?.hotInstance;
        if (!hot) return;
        const selectedRange = hot.getSelectedRangeLast();
        const row = selectedRange?.from.row;
        if (row === undefined) return;

        const variable = variables.find(v => v.columnIndex === row);
        if (variable) {
            const copyData: Partial<Variable> = { ...(variable as Variable) };
            delete (copyData as { id?: unknown }).id;
            delete (copyData as { tempId?: unknown }).tempId;
            navigator.clipboard.writeText(JSON.stringify(copyData));
        }
    }, [hotTableRef, variables]);
    
    const handleContextMenu = useCallback((key: string) => {
        if (key === 'insert_variable') handleInsertVariable();
        else if (key === 'delete_variable') handleDeleteVariables();
        else if (key === 'copy_variable') handleCopyVariable();
    }, [handleInsertVariable, handleDeleteVariables, handleCopyVariable]);

    return {
        variables,
        // Grid Event Handlers
        handleBeforeChange,
        handleAfterSelectionEnd,
        handleContextMenu,
        // Dialog States and Handlers
        showTypeDialog,
        setShowTypeDialog,
        showValuesDialog,
        setShowValuesDialog,
        showMissingDialog,
        setShowMissingDialog,
        selectedVariable,
        selectedVariableType,
        handleTypeChange,
        handleValuesChange,
        handleMissingChange,
    };
}