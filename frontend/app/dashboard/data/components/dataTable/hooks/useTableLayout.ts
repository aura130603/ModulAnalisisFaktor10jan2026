import { useTableDimensions } from './useTableDimensions';
import { useColumnHeaders } from './useColumnHeaders';
import { useColumnConfigs } from './useColumnConfigs';
import { useDisplayData } from './useDisplayData';
import type Handsontable from 'handsontable';
import type { DataRow } from '@/types/Data';

/**
 * Hook yang telah direfactor untuk mengurangi kompleksitas dan mencegah memory leaks.
 * Menggunakan komposisi hooks yang lebih kecil untuk better separation of concerns.
 * 
 * @returns Object berisi semua properti yang diperlukan untuk rendering Handsontable instance
 */
type UseTableLayoutResult = {
    // Dimensions
    actualNumRows: number;
    actualNumCols: number;
    displayNumRows: number;
    displayNumCols: number;
    // Structure
    colHeaders: string[];
    columns: Handsontable.ColumnSettings[];
    displayData: DataRow[];
};

export const useTableLayout = (): UseTableLayoutResult => {
    // 1. Hitung dimensi tabel
    const dimensions = useTableDimensions();
    const {
        actualNumRows,
        actualNumCols,
        targetVisualDataRows,
        targetVisualDataCols,
        displayNumRows,
        displayNumCols,
    } = dimensions;

    // 2. Generate column headers dengan caching dan cleanup
    const { colHeaders, variableMap } = useColumnHeaders(displayNumCols, targetVisualDataCols);

    // 3. Generate column configurations
    const { columns } = useColumnConfigs(variableMap, displayNumCols);

    // 4. Construct display data matrix dengan optimisasi
    const { displayData } = useDisplayData(
        actualNumRows,
        actualNumCols,
        targetVisualDataRows,
        targetVisualDataCols
    );

    // 5. Return semua computed values
    return {
        // Dimensions
        actualNumRows,
        actualNumCols,
        displayNumRows,
        displayNumCols,
        // Structure
        colHeaders,
        columns,
        displayData,
    };
};