import * as XLSX from "xlsx";
import type { Variable } from "@/types/Variable";
import type { ParseSheetOptions, ParsedSheetData, ProcessedImportData } from "./types";

/**
 * Parses the binary string content of an Excel file into a workbook object.
 */
export const parseExcelWorkbook = (binaryFileContent: string): XLSX.WorkBook | null => {
    try {
        return XLSX.read(binaryFileContent, { type: "binary", cellStyles: false, sheetStubs: true });
    } catch (e) {
        console.error("Error reading workbook: ", e);
        // Optionally, rethrow or return a custom error object if preferred
        return null;
    }
};

/**
 * Extracts sheet names from a given workbook.
 */
export const getSheetNamesFromWorkbook = (workbook: XLSX.WorkBook): string[] => {
    return workbook.SheetNames ?? [];
};

const getEffectiveRange = (sheet: XLSX.WorkSheet, userRange?: string): string => {
    let currentRange = userRange?.trim() ?? "";
    const sheetRef = sheet["!ref"];
    if (!currentRange && sheetRef) {
        currentRange = sheetRef;
    } else if (!currentRange) {
        currentRange = "A1"; // Default if no range and no sheet ref
    }
    return currentRange;
};

/**
 * Parses a specific sheet from a workbook for data preview (e.g., first 100 rows).
 */
export const parseSheetForPreview = (
    workbook: XLSX.WorkBook,
    sheetName: string,
    options: ParseSheetOptions
): ParsedSheetData & { error?: string } => {
    try {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) {
            return { data: [], headers: false, error: `Worksheet "${sheetName}" not found.` };
        }

        const effectiveRange = getEffectiveRange(sheet, options.range);

        const jsonDataOpts: XLSX.Sheet2JSONOpts = {
            raw: true,
            defval: options.readEmptyCellsAs === 'empty' ? "" : undefined,
            header: options.firstLineContains ? 1 : "A",
            range: effectiveRange !== "A1" || (sheet["!ref"] && effectiveRange !== sheet["!ref"]) ? effectiveRange : undefined,
            skipHidden: !options.readHiddenRowsCols,
        };

        let dataToDisplay: unknown[][];
        let headersArray: string[] = [];

        if (options.firstLineContains) {
            const rawDataWithHeader = XLSX.utils.sheet_to_json(sheet, { ...jsonDataOpts, header: 1 }) as unknown[][];
            if (rawDataWithHeader.length > 0) {
                headersArray = (rawDataWithHeader.shift() as unknown[]).map(val => String(val ?? ""));
                dataToDisplay = rawDataWithHeader;
            } else {
                dataToDisplay = [];
            }
        } else {
            // No header row: parse as array of arrays and generate default column letters
            dataToDisplay = XLSX.utils.sheet_to_json(sheet, { ...jsonDataOpts, header: 1 }) as unknown[][];
            const numColsPreview = dataToDisplay.length > 0 ? dataToDisplay[0].length : 0;
            headersArray = Array.from({ length: numColsPreview }, (_, i) => XLSX.utils.encode_col(i));
        }

        // Use headersArray if any, else false
        const finalHeaders = headersArray.length > 0 ? headersArray : false;
        const numFinalCols = headersArray.length > 0 
            ? headersArray.length 
            : (dataToDisplay.length > 0 ? (dataToDisplay[0]?.length ?? 0) : 0);

        const normalizedData = dataToDisplay.map(row => {
            const newRow = Array(numFinalCols).fill(options.readEmptyCellsAs === 'empty' ? "" : null);
            for (let i = 0; i < Math.min(row?.length ?? 0, numFinalCols); i++) {
                const cellValue = row[i];
                newRow[i] = (cellValue === undefined || cellValue === null) && options.readEmptyCellsAs === 'missing' ? null : (cellValue ?? "");
            }
            return newRow;
        });

        return { data: normalizedData.slice(0, 100), headers: finalHeaders };
    } catch (e: unknown) {
        console.error("Error parsing sheet for preview: ", e);
        const msg = e instanceof Error ? e.message : String(e);
        return { data: [], headers: false, error: `Error parsing sheet. Check range or file. (${msg})` };
    }
};

/**
 * Processes the full data from a specific sheet for import into the application.
 */
export const processSheetForImport = (
    workbook: XLSX.WorkBook,
    sheetName: string,
    options: ParseSheetOptions
): ProcessedImportData & { error?: string } => {
    try {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) {
            return { processedFullData: [], actualHeaders: [], error: `Worksheet "${sheetName}" not found.` };
        }

        const effectiveRange = getEffectiveRange(sheet, options.range);

        const jsonDataOpts: XLSX.Sheet2JSONOpts = {
            raw: true,
            defval: options.readEmptyCellsAs === 'empty' ? "" : undefined,
            header: options.firstLineContains ? 1 : "A",
            range: effectiveRange !== "A1" || (sheet["!ref"] && effectiveRange !== sheet["!ref"]) ? effectiveRange : undefined,
            skipHidden: !options.readHiddenRowsCols,
        };

        let actualHeadersArray: string[];
        let fullDataForStore: unknown[][];

        if (options.firstLineContains) {
            const rawFullData = XLSX.utils.sheet_to_json(sheet, { ...jsonDataOpts, header: 1 }) as unknown[][];
            if (rawFullData.length > 0) {
                actualHeadersArray = (rawFullData.shift() as unknown[]).map(val => String(val ?? ""));
                fullDataForStore = rawFullData;
            } else {
                actualHeadersArray = [];
                fullDataForStore = [];
            }
        } else {
            // No header row: parse as arrays and generate default header letters
            fullDataForStore = XLSX.utils.sheet_to_json(sheet, { ...jsonDataOpts, header: 1 }) as unknown[][];
            const numCols = fullDataForStore.length > 0 ? fullDataForStore[0].length : 0;
            actualHeadersArray = Array.from({ length: numCols }, (_, i) => XLSX.utils.encode_col(i));
        }

        // Use actualHeadersArray length or fallback
        const numFinalCols = actualHeadersArray.length;
        const emptyValue = options.readEmptyCellsAs === 'empty' ? "" : "";
        const missingValue = "SYSMIS";

        const processedData = fullDataForStore.map(row => {
            const newRow = Array(numFinalCols).fill(emptyValue);
            for (let i = 0; i < Math.min(row?.length ?? 0, numFinalCols); i++) {
                const cellValue = row[i];
                newRow[i] = (cellValue === undefined || cellValue === null) && options.readEmptyCellsAs === 'missing' ? missingValue : (cellValue ?? emptyValue);
            }
            return newRow;
        });

        return { processedFullData: processedData, actualHeaders: actualHeadersArray };

    } catch (e: unknown) {
        console.error("Error processing sheet for import: ", e);
        const msg = e instanceof Error ? e.message : String(e);
        return { processedFullData: [], actualHeaders: [], error: `Import failed during data processing: ${msg}` };
    }
};

/**
 * Generates variable metadata based on processed data and headers.
 */
export const generateVariablesFromData = (
    processedFullData: unknown[][],
    actualHeaders: string[],
    _readEmptyCellsAs: "empty" | "missing" // Needed to correctly interpret data for type detection
): Variable[] => {

    const variables: Variable[] = [];
    if (!actualHeaders || actualHeaders.length === 0) return variables;

    for (let colIndex = 0; colIndex < actualHeaders.length; colIndex++) {
        const colData = processedFullData.map(row => row[colIndex]);
        const headerName = String(actualHeaders[colIndex] ?? "").trim();
        const variableName = headerName !== '' ? headerName : `VAR${String(colIndex + 1).padStart(3, '0')}`;

        let isNumeric = true;
        let maxDecimalPlaces = 0;

        if (colData.length > 0) {
            let hasNonNullData = false;
            for (const val of colData) {
                if (val === null || String(val).trim() === '' || String(val).toUpperCase() === "SYSMIS") {
                    continue;
                }
                hasNonNullData = true;
                const numVal = Number(val);
                if (isNaN(numVal) || !isFinite(numVal)) {
                    isNumeric = false;
                    break;
                }
                const parts = String(val).split('.');
                if (parts.length > 1) {
                    maxDecimalPlaces = Math.max(maxDecimalPlaces, parts[1].length);
                }
            }
            // If all data points were SYSMIS, null, or empty, and readEmptyCellsAs is 'empty', 
            // it's safer to assume string unless there's a numeric header.
            // However, if readEmptyCellsAs is 'missing', SYSMIS implies numeric potential.
            if (!hasNonNullData) {
                // If all are effectively missing, default to string unless header is purely numeric
                isNumeric = /^[0-9.]+$/.test(headerName) && headerName.trim() !== ""; 
            }
        } else {
            isNumeric = false; // No data, default to string
        }
        
        // Final check: if the column is entirely empty or SYSMIS, it's not numeric by content.
        const isEmptyOrSysmisColumn = colData.every(v => v === null || String(v).trim() === '' || String(v).toUpperCase() === "SYSMIS");
        if (isEmptyOrSysmisColumn) {
            isNumeric = false;
        }

        const newVar: Variable = {
            columnIndex: colIndex,
            name: variableName,
            type: isNumeric ? 'NUMERIC' : 'STRING',
            width: isNumeric ? 8 : Math.min(32767, Math.max(8, ...colData.map(v => String(v ?? "").length), variableName.length)),
            decimals: isNumeric ? Math.min(maxDecimalPlaces, 16) : 0,
            label: '',
            columns: 72,
            align: isNumeric ? 'right' : 'left',
            measure: isNumeric ? 'scale' : 'nominal',
            role: 'input',
            values: [],
            missing: null, // Default, can be configured later
        };
        variables.push(newVar);
    }
    return variables;
}; 