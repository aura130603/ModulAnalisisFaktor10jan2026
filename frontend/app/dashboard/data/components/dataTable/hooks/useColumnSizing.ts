import type React from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { useVariableStore } from '@/stores/useVariableStore';
import { useDataStore } from '@/stores/useDataStore';
import { DEFAULT_COLUMN_WIDTH } from '../constants';
import type Handsontable from 'handsontable';
import type { HotTableRef } from '@handsontable/react-wrapper';

interface UseColumnSizingProps {
    hotTableRef: React.RefObject<HotTableRef>;
    actualNumRows: number;
    actualNumCols: number;
}

// Threshold untuk dataset besar
const AUTO_COLUMN_SIZE_THRESHOLD = {
    rows: 1000,
    cols: 50
};

/**
 * Hook untuk mengelola column sizing yang optimal.
 * Menghitung autoColumnSize sekali lalu menyimpannya ke variable.columns
 * untuk menghindari perhitungan berulang yang mahal.
 */
export const useColumnSizing = ({ hotTableRef, actualNumRows, actualNumCols }: UseColumnSizingProps) => {
    const variables = useVariableStore(state => state.variables);
    const data = useDataStore(state => state.data);
    
    // Track apakah column sizing sudah dihitung
    const columnSizingCalculatedRef = useRef<Set<number>>(new Set());
    const lastDataHashRef = useRef<string>('');
    
    // Determine apakah dataset terlalu besar untuk autoColumnSize
    const shouldUseAutoColumnSize = actualNumRows <= AUTO_COLUMN_SIZE_THRESHOLD.rows && 
                                   actualNumCols <= AUTO_COLUMN_SIZE_THRESHOLD.cols;
    
    // Calculate optimal column width untuk variable tertentu
    const calculateOptimalWidth = useCallback((columnIndex: number): number => {
        const hotInstance = hotTableRef.current?.hotInstance;
        if (!hotInstance || !data || data.length === 0) {
            return DEFAULT_COLUMN_WIDTH;
        }
        
        try {
            // Ambil sample data untuk perhitungan (maksimal 100 rows untuk performa)
            const sampleSize = Math.min(data.length, 100);
            const sampleData = data.slice(0, sampleSize);
            
            // Hitung width berdasarkan content
            let maxWidth = DEFAULT_COLUMN_WIDTH;
            
            // Check header width
            const variable = variables.find(v => v.columnIndex === columnIndex);
            if (variable?.name) {
                const headerWidth = variable.name.length * 8 + 40; // Estimasi width header
                maxWidth = Math.max(maxWidth, headerWidth);
            }
            
            // Check content width dari sample data
            for (const row of sampleData) {
                const cellValue = row[columnIndex];
                if (cellValue !== null && cellValue !== undefined) {
                    const contentWidth = String(cellValue).length * 8 + 20; // Estimasi width content
                    maxWidth = Math.max(maxWidth, contentWidth);
                }
            }
            
            // Batasi width maksimal untuk mencegah kolom terlalu lebar
            return Math.min(maxWidth, 300);
        } catch (error) {
            console.warn('Error calculating optimal width for column', columnIndex, error);
            return DEFAULT_COLUMN_WIDTH;
        }
    }, [hotTableRef, data, variables]);
    
    // Update column widths untuk variables yang belum memiliki width optimal
    const updateColumnWidths = useCallback(async () => {
        if (!shouldUseAutoColumnSize || !data || data.length === 0) {
            return;
        }
        
        // Create hash untuk detect perubahan data
        const dataHash = `${data.length}-${actualNumCols}-${variables.length}`;
        if (lastDataHashRef.current === dataHash) {
            return;
        }
        
        const variablesToUpdate = variables.filter(variable => {
            // Update jika:
            // 1. Belum pernah dihitung untuk variable ini DAN menggunakan default width
            // 2. Data berubah signifikan DAN menggunakan default width
            // Ini mencegah menimpa perubahan manual dari handleAutoWidth
            return (!columnSizingCalculatedRef.current.has(variable.columnIndex) &&
                   variable.columns === DEFAULT_COLUMN_WIDTH) ||
                   (lastDataHashRef.current !== dataHash &&
                   variable.columns === DEFAULT_COLUMN_WIDTH);
        });
        
        if (variablesToUpdate.length === 0) {
            lastDataHashRef.current = dataHash;
            return;
        }
        
        // Batch update untuk performa
        const updates = variablesToUpdate.map(variable => {
            const optimalWidth = calculateOptimalWidth(variable.columnIndex);
            columnSizingCalculatedRef.current.add(variable.columnIndex);
            
            return {
                identifier: variable.columnIndex,
                changes: { columns: optimalWidth }
            };
        });
        
        if (updates.length > 0) {
            try {
                await useVariableStore.getState().updateMultipleVariables(updates);
                lastDataHashRef.current = dataHash;
            } catch (error) {
                console.error('Error updating column widths:', error);
            }
        }
    }, [shouldUseAutoColumnSize, data, actualNumCols, variables, calculateOptimalWidth]);
    
    // Effect untuk trigger column width calculation
    useEffect(() => {
        // Delay calculation untuk memastikan Handsontable sudah ter-render
        const timeoutId = setTimeout(() => {
            updateColumnWidths();
        }, 100);
        
        return () => clearTimeout(timeoutId);
    }, [updateColumnWidths]);
    
    // Reset calculation cache ketika variables berubah drastis
    useEffect(() => {
        const currentVariableIndices = new Set(variables.map(v => v.columnIndex));
        const cachedIndices = Array.from(columnSizingCalculatedRef.current);
        
        // Remove cache untuk variables yang sudah tidak ada
        cachedIndices.forEach(index => {
            if (!currentVariableIndices.has(index)) {
                columnSizingCalculatedRef.current.delete(index);
            }
        });
    }, [variables]);
    
    // Function untuk reset cache (untuk digunakan oleh auto-width button)
    const resetColumnSizingCache = useCallback(() => {
        columnSizingCalculatedRef.current.clear();
        lastDataHashRef.current = '';
    }, []);

    return {
        shouldUseAutoColumnSize,
        updateColumnWidths,
        resetColumnSizingCache
    };
};