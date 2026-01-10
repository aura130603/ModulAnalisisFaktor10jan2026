import { useMemo } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { MIN_ROWS, MIN_COLS } from '../constants';

/**
 * Hook untuk menghitung dimensi tabel
 * Memisahkan logika kalkulasi dimensi dari useTableLayout
 */
export const useTableDimensions = () => {
    const data = useDataStore(state => state.data);
    const variables = useVariableStore(state => state.variables);

    // Calculate Actual Dimensions
    const actualNumRows = useMemo(() => data?.length ?? 0, [data]);

    const actualNumCols = useMemo(() => {
        if ((!variables || variables.length === 0) && (!data || data.length === 0)) {
            return 0;
        }
        const maxVarIndex = variables.length > 0 ? Math.max(...variables.map(v => v.columnIndex)) : -1;
        const maxDataCols = data?.[0]?.length ?? 0;
        return Math.max(maxVarIndex + 1, maxDataCols);
    }, [variables, data]);

    // Determine Visual Grid Size (enforcing minimums)
    const targetVisualDataRows = useMemo(() => Math.max(actualNumRows, MIN_ROWS), [actualNumRows]);
    const targetVisualDataCols = useMemo(() => Math.max(actualNumCols, MIN_COLS), [actualNumCols]);

    // Calculate Final Display Dimensions (adding a spare row/column for UI)
    const displayNumRows = useMemo(() => targetVisualDataRows + 1, [targetVisualDataRows]);
    const displayNumCols = useMemo(() => targetVisualDataCols + 1, [targetVisualDataCols]);

    return {
        actualNumRows,
        actualNumCols,
        targetVisualDataRows,
        targetVisualDataCols,
        displayNumRows,
        displayNumCols,
    };
};