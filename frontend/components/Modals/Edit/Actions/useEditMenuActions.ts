import { useCallback } from 'react';
import { useVariableStore } from '@/stores/useVariableStore';
import { useTableRefStore } from '@/stores/useTableRefStore';
import { useDataStore } from '@/stores/useDataStore';
import type Handsontable from 'handsontable';

type ValidAlterAction =
    | 'insert_row_above'
    | 'insert_row_below'
    | 'remove_row'
    | 'insert_col_start'
    | 'insert_col_end'
    | 'remove_col';

export type EditMenuActionType =
    | "Undo"
    | "Redo"
    | "Cut"
    | "Copy"
    | "CopyWithVariableNames"
    | "CopyWithVariableLabels"
    | "Paste"
    | "PasteVariables"
    | "PasteWithVariableNames"
    | "Clear"
    | "InsertVariable"
    | "InsertCases";

export const useEditMenuActions = () => {
    const { getVariableByColumnIndex } = useVariableStore();
    const { dataTableRef } = useTableRefStore();

    const handleAction = useCallback(async (actionType: EditMenuActionType) => {
        const hotInstance = dataTableRef?.current?.hotInstance;
        if (!hotInstance) {
            console.warn("Handsontable instance is not available.");
            return;
        }

        const copyPastePlugin = hotInstance.getPlugin('copyPaste');

        const getSelectedRange = (): Handsontable.CellRange | undefined => {
            const selected = hotInstance.getSelectedRange();
            return selected && selected.length > 0 ? selected[0] : undefined;
        };

        // Helper function to get clipboard data
        const getClipboardData = async (): Promise<string[][] | null> => {
            try {
                const text = await navigator.clipboard.readText();
                if (!text) return null;

                // Split by newlines and tabs to get rows and columns
                return text.split('\n')
                    .filter(line => line.trim())
                    .map(row => row.split('\t').map(cell => cell.trim()));
            } catch (error) {
                console.error("Failed to read clipboard:", error);
                return null;
            }
        };

        // Corrected the type for 'index' to match usage within this hook
        const alterGrid = (
            action: ValidAlterAction,
            index?: number | undefined, // Adjusted type here
            amount?: number | undefined,
            source?: string | undefined,
            keepEmptyRows?: boolean | undefined
        ) => {
            hotInstance.alter(action, index, amount, source, keepEmptyRows);
        };

        switch (actionType) {
            case "Undo":
                hotInstance.undo();
                break;

            case "Redo":
                hotInstance.redo();
                break;

            case "Cut":
                const rangeForCut = getSelectedRange();
                if (rangeForCut) {
                    copyPastePlugin.cut();
                } else {
                    console.warn("Cannot Cut: No cells selected.");
                }
                break;

            case "Copy":
                const rangeForCopy = getSelectedRange();
                if (rangeForCopy) {
                    copyPastePlugin.copy();
                } else {
                    console.warn("Cannot Copy: No cells selected.");
                }
                break;

            case "CopyWithVariableNames":
            case "CopyWithVariableLabels":
                const rangeForCustomCopy = getSelectedRange();
                if (!rangeForCustomCopy) {
                    console.warn(`Cannot ${actionType}: No cells selected.`);
                    return;
                }
                const { from, to } = rangeForCustomCopy;
                let dataToCopy: any[][] = [];
                try {
                    dataToCopy = hotInstance.getData(from.row, from.col, to.row, to.col);
                } catch (error) {
                    console.error("Error getting data:", error);
                    return;
                }
                const headers: string[] = [];
                for (let c = from.col; c <= to.col; c++) {
                    const variable = getVariableByColumnIndex(c);
                    headers.push(actionType === "CopyWithVariableNames"
                        ? (variable?.name || `var${c + 1}`)
                        : (variable?.label || variable?.name || `var${c + 1}`)
                    );
                }
                const tsvHeader = headers.join('\t');
                const tsvData = dataToCopy.map(row =>
                    row.map(cell => (cell === null || cell === undefined) ? '' : String(cell).replace(/\n/g, ' ').replace(/\t/g, ' ') ).join('\t')
                ).join('\n');
                const fullTsv = `${tsvHeader}\n${tsvData}`;
                try {
                    await navigator.clipboard.writeText(fullTsv);
                } catch (err) {
                    console.error(`Failed copy with headers: ${err}`);
                    try {
                        copyPastePlugin.copy();
                        console.warn("Fallback copy.");
                    } catch(copyErr) {
                        console.error("Fallback copy failed:", copyErr);
                    }
                }
                break;

            case "Paste":
                const targetCell = hotInstance.getSelectedLast();
                if(targetCell){
                    hotInstance.selectCell(targetCell[0], targetCell[1]);
                    copyPastePlugin.paste();
                } else {
                    hotInstance.selectCell(0,0);
                    copyPastePlugin.paste();
                }
                break;

            case "PasteVariables":
                try {
                    const clipboardData = await getClipboardData();
                    if (!clipboardData || clipboardData.length === 0) {
                        console.warn("No valid data in clipboard");
                        return;
                    }

                    const selectedColCoords = hotInstance.getSelectedLast();
                    const startColumnIndex = selectedColCoords ? selectedColCoords[1] : 0;
                    
                    const variableNames = clipboardData.flatMap(row => row.filter(name => name.trim()));
                    
                    const variablesToAdd = variableNames.map((name, idx) => ({
                        name,
                        columnIndex: startColumnIndex + idx
                    }));

                    if (variablesToAdd.length === 0) {
                        console.warn("No valid variable names found in clipboard");
                        return;
                    }

                    const { addVariables } = useVariableStore.getState();
                    await addVariables(variablesToAdd, []);
                } catch (error) {
                    console.error("Error pasting variables:", error);
                }
                break;

            case "PasteWithVariableNames":
                try {
                    const clipboardData = await getClipboardData();
                    if (!clipboardData || clipboardData.length < 2) {
                        console.warn("Clipboard must contain headers and at least one data row");
                        return;
                    }

                    const selectedCoords = hotInstance.getSelectedLast();
                    const startRow = selectedCoords ? selectedCoords[0] : 0;
                    const startCol = selectedCoords ? selectedCoords[1] : 0;
                    
                    const variableNames = clipboardData[0].filter(name => name.trim());
                    if (variableNames.length === 0) {
                        console.warn("No valid variable names found in the header row of the clipboard");
                        return;
                    }

                    const variablesToAdd = variableNames.map((name, idx) => ({
                        name,
                        columnIndex: startCol + idx
                    }));

                    const dataRows = clipboardData.slice(1);
                    const updates = dataRows.flatMap((row, rIdx) =>
                        row.slice(0, variableNames.length).map((cell, cIdx) => ({
                            row: startRow + rIdx,
                            col: startCol + cIdx,
                            value: cell,
                        }))
                    );

                    const { addVariables } = useVariableStore.getState();
                    await addVariables(variablesToAdd, updates);
                } catch (error) {
                    console.error("Error pasting with variable names:", error);
                }
                break;

            case "Clear":
                const rangeForClear = getSelectedRange();
                if (rangeForClear) {
                    hotInstance.emptySelectedCells();
                } else {
                    console.warn("Cannot Clear: No cells selected.");
                }
                break;

            case "InsertVariable":
                const selectedCol = hotInstance.getSelectedLast();
                const insertColIndex = selectedCol ? selectedCol[3] + 1 : hotInstance.countCols();
                useVariableStore.getState().addVariable({ columnIndex: insertColIndex });
                break;

            case "InsertCases":
                const selectedRow = hotInstance.getSelectedLast();
                const insertRowIndex = selectedRow ? selectedRow[2] + 1 : undefined;
                useDataStore.getState().addRow(insertRowIndex);
                break;

            default:
                const actionString = typeof actionType === 'string' ? actionType : 'Unknown Action Type';
                console.warn("Unknown edit action:", actionString);
        }
    }, [dataTableRef, getVariableByColumnIndex]);

    return {
        handleAction
    };
}; 