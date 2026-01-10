import { useState, useCallback } from "react";
import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import type { Variable } from "@/types/Variable";
import type { ClipboardProcessingOptions } from "../types";
import {
    excelStyleTextToColumns,
    getDelimiterCharacter,
    parsePreviewData
} from "../importClipboard.utils";

export const useImportClipboardProcessor = () => {
    const { setData } = useDataStore();
    const { overwriteAll } = useVariableStore();
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    const processClipboardData = useCallback(async (
        text: string,
        options: ClipboardProcessingOptions & { customDelimiter?: string }
    ) => {
        if (!text) {
            throw new Error("No text data provided");
        }

        setIsProcessing(true);
        
        try {
            let parsedDataResult: string[][];
            
            if (options.excelProcessedData && options.excelProcessedData.length > 0) {
                console.log('Using pre-processed data from Excel-style parser');
                parsedDataResult = options.excelProcessedData;
            } else {
                console.log('Starting Excel-style Text to Columns processing...');
                const currentDelimiter = getDelimiterCharacter(options);
                const excelParsedResult = excelStyleTextToColumns(text, {
                    delimiterType: 'delimited',
                    delimiter: currentDelimiter,
                    textQualifier: '"',
                    treatConsecutiveDelimitersAsOne: options.skipEmptyRows,
                    trimWhitespace: options.trimWhitespace,
                    detectDataTypes: options.detectDataTypes,
                    hasHeaderRow: options.firstRowAsHeader
                });
                console.log('Excel-style Text to Columns processing complete.');
                parsedDataResult = excelParsedResult;
            }
            
            if (parsedDataResult.length === 0) {
                throw new Error("No valid data found in the pasted text");
            }
            
            let headers: string[];
            let dataRows: string[][];
            
            if (options.firstRowAsHeader && parsedDataResult.length > 0) {
                headers = parsedDataResult[0];
                dataRows = parsedDataResult.slice(1);
            } else {
                headers = Array.from(
                    { length: parsedDataResult[0] ? parsedDataResult[0].length : 0 },
                    (_, i) => `VAR${String(i + 1).padStart(3, '0')}`
                );
                dataRows = parsedDataResult;
            }
            
            const newVariables: Variable[] = [];
            for (let colIndex = 0; colIndex < headers.length; colIndex++) {
                const colData = dataRows.map(row => row[colIndex] || '');
                const variableName = headers[colIndex] || `VAR${String(colIndex + 1).padStart(3, '0')}`;

                let isNumeric = false;
                let maxDecimalPlaces = 0;
                
                if (options.detectDataTypes) {
                    isNumeric = true;
                    for (const value of colData) {
                        if (value === null || value.trim() === '') continue;
                        if (isNaN(Number(value))) {
                            isNumeric = false;
                            break;
                        }
                        const parts = String(value).split('.');
                        if (parts.length > 1) {
                            maxDecimalPlaces = Math.max(maxDecimalPlaces, parts[1].length);
                        }
                    }
                }

                const newVar: Variable = {
                    columnIndex: colIndex,
                    name: variableName,
                    type: isNumeric ? 'NUMERIC' : 'STRING',
                    width: isNumeric ? 8 : Math.min(32767, Math.max(8, ...colData.map(v => v?.length || 0), variableName.length)),
                    decimals: isNumeric ? Math.min(maxDecimalPlaces, 16) : 0,
                    label: '',
                    columns: 72,
                    align: isNumeric ? 'right' : 'left',
                    measure: isNumeric ? 'scale' : 'nominal',
                    role: 'input',
                    values: [],
                    missing: null
                };
                
                newVariables.push(newVar);
            }
            
            await overwriteAll(newVariables, dataRows);

            return { headers, data: dataRows };
            
        } catch (error) {
            console.error("Error processing clipboard data:", error);
            throw error;
        } finally {
            setIsProcessing(false);
        }
    }, [overwriteAll]);

    return {
        isProcessing,
        processClipboardData,
        excelStyleTextToColumns,
        parsePreviewData,
    };
}; 