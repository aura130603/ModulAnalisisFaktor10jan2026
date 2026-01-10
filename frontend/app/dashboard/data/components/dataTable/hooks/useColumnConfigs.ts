import { useMemo } from 'react';
import { useTableRefStore } from '@/stores/useTableRefStore';
import { getColumnConfig } from '../utils/utils';
import type { Variable } from '@/types/Variable';
import type Handsontable from 'handsontable';

/**
 * Hook untuk mengelola column configurations
 * Memisahkan logika column config generation dari useTableLayout
 */
export const useColumnConfigs = (variableMap: Map<number, Variable>, displayNumCols: number) => {
    const { viewMode } = useTableRefStore();

    // Generate Column Configurations untuk Handsontable dengan optimized lookups
    const columns = useMemo<Handsontable.ColumnSettings[]>(() => {
        return Array.from({ length: displayNumCols }, (_, colIndex) => {
            const variable = variableMap.get(colIndex);
            return getColumnConfig(variable, viewMode);
        });
    }, [variableMap, displayNumCols, viewMode]);

    return {
        columns,
    };
};