import type React from 'react';
import type Handsontable from 'handsontable';
import type { HotTableRef } from '@handsontable/react-wrapper';
import { useMemo } from 'react';
import { useTableLayout } from './useTableLayout';
import { useTableUpdates } from './useTableUpdates';
import { useContextMenuLogic } from './useContextMenuLogic';
import { useDataTablePerformance } from '@/hooks/usePerformanceMonitor';
import { useTableRefStore } from '@/stores/useTableRefStore';

/**
 * Main hook for the DataTable component.
 * This hook composes other hooks to manage layout, updates, and context menu logic.
 */
export const useDataTableLogic = (hotTableRef: React.RefObject<HotTableRef>) => {
    const { measureRender, measureUpdate } = useDataTablePerformance();
    
    // 1. Get viewMode from the store
    const { viewMode } = useTableRefStore();

    // 2. Generate Table Layout (Dimensions, Headers, Data Matrix, Column Configs)
    const {
        actualNumRows,
        actualNumCols,
        displayNumRows,
        displayNumCols,
        colHeaders,
        columns,
        displayData,
    } = useTableLayout();

    // 3. Setup Update Handling
    const {
        handleBeforeChange: originalHandleBeforeChange,
        handleAfterChange: originalHandleAfterChange,
        handleAfterColumnResize,
        handleAfterValidate,
    } = useTableUpdates(viewMode);
    
    // 4. Wrap handlers with performance monitoring
    const updateHandlers = useMemo(() => ({
        handleBeforeChange: (changes: (Handsontable.CellChange | null)[], source: Handsontable.ChangeSource) => {
            measureRender(() => {
                // HotTable passes an array with possibly null items; our inner handler expects
                // a nullable array of non-null items. Normalize by removing nulls.
                const normalized = (changes?.filter(Boolean) ?? []) as Handsontable.CellChange[];
                originalHandleBeforeChange(normalized, source);
            });
        },
        handleAfterChange: (changes: Handsontable.CellChange[] | null, source: Handsontable.ChangeSource) => {
            void measureUpdate(() => originalHandleAfterChange(changes, source));
        },
        handleAfterColumnResize,
        handleAfterValidate,
    }), [measureRender, measureUpdate, originalHandleBeforeChange, originalHandleAfterChange, handleAfterColumnResize, handleAfterValidate]);

    // 5. Setup Context Menu
    const {
        contextMenuConfig,
        isRangeSelected,
    } = useContextMenuLogic({
        hotTableRef,
        actualNumRows,
        actualNumCols,
    });

    // 5. Memoize layout data to prevent unnecessary re-renders
    const memoizedLayoutData = useMemo(() => ({
        actualNumRows,
        actualNumCols,
        displayNumRows,
        displayNumCols,
        colHeaders,
        columns,
        displayData,
    }), [actualNumRows, actualNumCols, displayNumRows, displayNumCols, colHeaders, columns, displayData]);

    // 7. Memoize context menu data separately
    const contextMenuData = useMemo(() => ({
        contextMenuConfig,
        isRangeSelected,
    }), [contextMenuConfig, isRangeSelected]);

    // 8. Return combined object with minimal re-creation
    return useMemo(() => ({
        ...memoizedLayoutData,
        ...updateHandlers,
        ...contextMenuData,
    }), [memoizedLayoutData, updateHandlers, contextMenuData]);
};