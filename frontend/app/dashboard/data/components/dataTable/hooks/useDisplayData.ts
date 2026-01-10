import { useMemo, useRef, useEffect } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import type { DataRow } from '@/types/Data';

/**
 * Hook untuk mengelola display data matrix dengan caching dan cleanup
 * Memisahkan logika data matrix construction dari useTableLayout
 */
export const useDisplayData = (
    actualNumRows: number,
    actualNumCols: number,
    targetVisualDataRows: number,
    targetVisualDataCols: number
) => {
    const data = useDataStore(state => state.data);
    
    // Cache untuk data hash dan matrix
    const dataHashRef = useRef<string>('');
    const cachedDisplayDataRef = useRef<DataRow[]>([]);

    // Cleanup cache saat component unmount
    useEffect(() => {
        return () => {
            cachedDisplayDataRef.current = [];
            dataHashRef.current = '';
        };
    }, []);

    // Construct Data Matrix untuk Display dengan optimized memoization
    const displayData = useMemo(() => {
        // Buat lightweight hash dari data untuk detect actual changes
        const dataHash = `${actualNumRows}-${actualNumCols}-${targetVisualDataRows}-${targetVisualDataCols}-${data?.length || 0}`;
        
        // Hanya recreate matrix jika dimensions atau data structure benar-benar berubah
        if (dataHashRef.current === dataHash && cachedDisplayDataRef.current.length > 0) {
            return cachedDisplayDataRef.current;
        }
        
        // Pre-allocate matrix untuk performa yang lebih baik
        const matrix: DataRow[] = new Array(targetVisualDataRows);
        for (let i = 0; i < targetVisualDataRows; i++) {
            matrix[i] = new Array(targetVisualDataCols).fill(null);
        }
        
        // Hanya copy existing data, hindari iterasi yang tidak perlu
        if (data && data.length > 0) {
            const rowsToCopy = Math.min(actualNumRows, targetVisualDataRows);
            for (let i = 0; i < rowsToCopy; i++) {
                if (data[i]) {
                    const colsToCopy = Math.min(data[i].length, targetVisualDataCols);
                    for (let j = 0; j < colsToCopy; j++) {
                        matrix[i][j] = data[i][j] ?? null;
                    }
                }
            }
        }
        
        // Cache hasilnya
        dataHashRef.current = dataHash;
        cachedDisplayDataRef.current = matrix;
        
        return matrix;
    }, [data, actualNumRows, actualNumCols, targetVisualDataRows, targetVisualDataCols]);

    return {
        displayData,
    };
};