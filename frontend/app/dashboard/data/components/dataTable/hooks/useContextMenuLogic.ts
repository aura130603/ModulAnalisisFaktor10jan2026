import { useCallback, useMemo } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { getContextMenuConfig } from '../services/menuConfig';
import type { VariableAlign } from '@/types/Variable';
import type { HotTableRef } from '@handsontable/react-wrapper';
import type { CellUpdate } from '@/stores/useDataStore';

export interface ContextMenuLogicProps {
    hotTableRef: React.RefObject<HotTableRef>;
    actualNumRows: number;
    actualNumCols: number;
}

/**
 * Custom hook to manage Handsontable context menu logic, including item configuration and actions.
 */
export const useContextMenuLogic = ({ hotTableRef, actualNumRows: _actualNumRows, actualNumCols }: ContextMenuLogicProps) => {
    const isDataLoading = useDataStore(state => state.isLoading);
    const isVarLoading = useVariableStore(state => state.isLoading);
    const isLoading = isDataLoading || isVarLoading;

    const getSelectedCell = useCallback(() => {
        const hot = hotTableRef.current?.hotInstance;
        const selected = hot?.getSelectedLast();
        return { row: selected?.[0] ?? -1, col: selected?.[1] ?? -1 };
    }, [hotTableRef]);

    const getSelectedRange = useCallback(() => {
        const hot = hotTableRef.current?.hotInstance;
        const range = hot?.getSelectedRangeLast();
        if (!range) return null;
        const { from, to } = range;
        return {
            rows: [Math.min(from.row, to.row), Math.max(from.row, to.row)],
            cols: [Math.min(from.col, to.col), Math.max(from.col, to.col)],
        };
    }, [hotTableRef]);

    const isRangeSelected = useCallback(() => {
        if (isLoading) return false;
        const hot = hotTableRef.current?.hotInstance;
        return hot?.getSelectedRangeLast() !== undefined;
    }, [hotTableRef, isLoading]);

    // Memoize handlers with minimal dependencies to prevent unnecessary re-creation
    const handleInsertRow = useCallback(async (above: boolean) => {
        const { row } = getSelectedCell();
        if (row === -1) return;
        const insertIndex = above ? row : row + 1;
        await useDataStore.getState().addRow(insertIndex);
    }, [getSelectedCell]);

    const handleInsertColumn = useCallback(async (left: boolean) => {
        const { col } = getSelectedCell();
        if (col === -1) return;
        const insertIndex = left ? col : col + 1;
        if (insertIndex > actualNumCols) return;
        await useVariableStore.getState().addVariable({ columnIndex: insertIndex });
    }, [actualNumCols, getSelectedCell]);

    const handleRemoveRow = useCallback(async () => {
        const range = getSelectedRange();
        if (!range) return;
        const indices = Array.from({ length: range.rows[1] - range.rows[0] + 1 }, (_, i) => range.rows[0] + i);
        if (indices.length > 0) await useDataStore.getState().deleteRows(indices);
    }, [getSelectedRange]);

    const handleRemoveColumn = useCallback(async () => {
        const range = getSelectedRange();
        if (!range) return;
        const indices = Array.from({ length: range.cols[1] - range.cols[0] + 1 }, (_, i) => range.cols[0] + i);
        if (indices.length > 0) await useVariableStore.getState().deleteVariables(indices);
    }, [getSelectedRange]);

    const applyAlignment = useCallback(async (alignment: VariableAlign) => {
        const range = getSelectedRange();
        if (!range) return;
        const batch = Array.from({ length: range.cols[1] - range.cols[0] + 1 }, (_, i) => range.cols[0] + i)
            .map(colIndex => ({ identifier: colIndex, changes: { align: alignment } }));
        if (batch.length > 0) await useVariableStore.getState().updateMultipleVariables(batch);
    }, [getSelectedRange]);

    const handleClearColumn = useCallback(async () => {
        const range = getSelectedRange();
        if (!range) return;
        const updates: CellUpdate[] = [];
        for (let r = range.rows[0]; r <= range.rows[1]; r++) {
            for (let c = range.cols[0]; c <= range.cols[1]; c++) {
                updates.push({ row: r, col: c, value: "" });
            }
        }
        if (updates.length > 0) await useDataStore.getState().updateCells(updates);
    }, [getSelectedRange]);

    // Memoize handlers object to enable effective caching in menuConfig
    const handlers = useMemo(() => ({
        insertRow: handleInsertRow,
        insertColumn: handleInsertColumn,
        removeRow: handleRemoveRow,
        removeColumn: handleRemoveColumn,
        applyAlignment,
        clearColumn: handleClearColumn,
        isRangeSelected,
    }), [handleInsertRow, handleInsertColumn, handleRemoveRow, handleRemoveColumn, applyAlignment, handleClearColumn, isRangeSelected]);

    // Memoize context menu config with handlers object for effective WeakMap caching
    const contextMenuConfig = useMemo(() => getContextMenuConfig(handlers), [handlers]);

    return {
        contextMenuConfig,
        isRangeSelected,
    };
};