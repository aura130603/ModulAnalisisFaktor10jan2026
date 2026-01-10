"use client";

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import HandsontableWrapper from './HandsontableWrapper';
import { registerAllModules } from 'handsontable/registry';
import { useDataTableLogic } from './hooks';
import { useColumnSizing } from './hooks/useColumnSizing';
import { useTableRefStore } from '@/stores/useTableRefStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { useMetaStore } from '@/stores/useMetaStore';
import './DataTable.css';
import type { HotTableRef } from '@handsontable/react-wrapper';

registerAllModules();

// Memoized HandsontableWrapper to prevent unnecessary re-renders
const MemoizedHandsontableWrapper = React.memo(HandsontableWrapper);

function Index() {
    const hotTableRef = useRef<HotTableRef>(null);
    const { viewMode, setDataTableRef } = useTableRefStore();
    
    const {
        colHeaders,
        columns,
        displayData,
        contextMenuConfig,
        handleBeforeChange,
        handleAfterChange,
        handleAfterColumnResize,
        handleAfterValidate,
        actualNumRows,
        actualNumCols,
        displayNumRows,
        displayNumCols,
    } = useDataTableLogic(hotTableRef);
    
    // Column sizing optimization
    const { shouldUseAutoColumnSize, resetColumnSizingCache } = useColumnSizing({
        hotTableRef,
        actualNumRows,
        actualNumCols
    });

    // Expose resetColumnSizingCache to store for access from Toolbar
    useEffect(() => {
        useTableRefStore.getState().setResetColumnSizingCache?.(resetColumnSizingCache);
    }, [resetColumnSizingCache]);
    
    const filterVarName = useMetaStore(state => state.meta.filter);
    const variables = useVariableStore(state => state.variables); // Keep for filter logic
    const filterVarIndex = useMemo(() => {
        // Create variable name map for O(1) lookup
        const variableNameMap = new Map(variables.map(v => [v.name, v]));
        return variableNameMap.get(filterVarName)?.columnIndex;
    }, [variables, filterVarName]);

    const handleAfterGetRowHeader = useCallback((row: number, TH: HTMLTableCellElement) => {
        // Efficient class toggling instead of remove/add pattern
        const isSpareRow = row >= actualNumRows;
        const isUnselected = !isSpareRow && filterVarIndex !== undefined && 
            (displayData[row]?.[filterVarIndex] === 0 || 
             displayData[row]?.[filterVarIndex] === '' || 
             displayData[row]?.[filterVarIndex] === null || 
             displayData[row]?.[filterVarIndex] === undefined);

        TH.classList.toggle('grayed-row-header', isSpareRow);
        TH.classList.toggle('visual-spare-header', isSpareRow);
        TH.classList.toggle('unselected-row-header', isUnselected);
    }, [actualNumRows, filterVarIndex, displayData]);

    const handleAfterGetColHeader = useCallback((col: number, TH: HTMLTableCellElement) => {
        // Efficient class toggling for column headers
        const isSpareCol = col >= actualNumCols;
        TH.classList.toggle('grayed-col-header', isSpareCol);
        TH.classList.toggle('visual-spare-header', isSpareCol);
    }, [actualNumCols]);

    useEffect(() => {
        if (hotTableRef.current) {
            setDataTableRef(hotTableRef);
        }
        // Capture the instance reference at effect time
        const instanceRef = hotTableRef.current;
        
        // Cleanup function to prevent memory leaks
        return () => {
            if (instanceRef?.hotInstance) {
                try {
                    instanceRef.hotInstance.destroy();
                } catch (error) {
                    console.warn('Error destroying Handsontable instance:', error);
                }
            }
            setDataTableRef(null);
        };
    }, [setDataTableRef]);

    // Track significant changes to avoid unnecessary Handsontable updates
    const lastUpdateRef = useRef<string>('');
    
    useEffect(() => {
        const hotInstance = hotTableRef.current?.hotInstance;
        if (hotInstance) {
            // Create a hash of current state for comparison
            const currentHash = JSON.stringify({ colHeaders, columns, viewMode });
            
            // Only update if there are actual structural changes
            if (lastUpdateRef.current !== currentHash) {
                hotInstance.updateSettings({ colHeaders, columns });
                hotInstance.render();
                lastUpdateRef.current = currentHash;
            }
        }
        
        // Cleanup function for settings update effect
        return () => {
            // Clear the hash reference on cleanup
            lastUpdateRef.current = '';
        };
    }, [colHeaders, columns, viewMode]);

    // Memoize static props separately from dynamic data
    const staticProps = useMemo(() => ({
        ref: hotTableRef,
        contextMenu: contextMenuConfig,
        beforeChange: handleBeforeChange,
        afterColumnResize: handleAfterColumnResize,
        afterValidate: handleAfterValidate,
        afterGetRowHeader: handleAfterGetRowHeader,
        afterGetColHeader: handleAfterGetColHeader,
        afterChange: handleAfterChange
    }), [contextMenuConfig, handleBeforeChange, handleAfterColumnResize, 
         handleAfterValidate, handleAfterGetRowHeader, handleAfterGetColHeader, handleAfterChange]);

    // Memoize dynamic data props separately
    const dataProps = useMemo(() => ({
        data: displayData,
        minRows: displayNumRows,
        minCols: displayNumCols,
        colHeaders,
        columns
    }), [displayData, displayNumRows, displayNumCols, colHeaders, columns]);

    // Combine props with minimal re-creation
    const tableProps = useMemo(() => ({
    ...staticProps,
    ...dataProps,
    autoColumnSize: shouldUseAutoColumnSize
  }), [staticProps, dataProps, shouldUseAutoColumnSize]);

    return (
        <div className="h-full w-full z-0 relative hot-container overflow-hidden">
            <MemoizedHandsontableWrapper {...tableProps} />
        </div>
    );
}

// Export memoized component to prevent parent re-renders from affecting this component
export default React.memo(Index);