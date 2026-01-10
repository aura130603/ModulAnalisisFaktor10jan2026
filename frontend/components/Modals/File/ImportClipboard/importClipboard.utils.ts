import type { ClipboardProcessingOptions } from "./types"; // Corrected path

// Utility functions originally from useImportClipboardProcessor.ts

export const isDateString = (value: string, format: string): boolean => {
    const mdyRegex = /^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}$/;
    const dmyRegex = /^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}$/;
    const ymdRegex = /^\d{4}[\/-]\d{1,2}[\/-]\d{1,2}$/;
    
    if (format === 'MDY' && mdyRegex.test(value)) return true;
    if (format === 'DMY' && dmyRegex.test(value)) return true;
    if (format === 'YMD' && ymdRegex.test(value)) return true;
    return false;
};

export const detectValueType = (value: string): string => {
    if (!value || value.trim() === '') return 'empty';
    
    const trimmedValue = value.trim();
    
    const numericRegex = /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/;
    if (numericRegex.test(trimmedValue)) {
        return 'number';
    }
    
    if (/^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}$/.test(trimmedValue)) {
        return 'date';
    }
    return 'text';
};

export const inferDataType = (value: string, dateFormat: string): string => {
    if (!value || value.trim() === '') return value;
    
    const trimmedValue = value.trim();
    
    const numericRegex = /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/;
    if (numericRegex.test(trimmedValue)) {
        return trimmedValue;
    }
    
    if (isDateString(trimmedValue, dateFormat)) {
        return trimmedValue;
    }
    return value;
};

export const getDelimiterCharacter = (options: ClipboardProcessingOptions & { customDelimiter?: string }): string => {
    switch (options.delimiter) {
        case "tab": return "\t";
        case "comma": return ",";
        case "semicolon": return ";";
        case "space": return " ";
        case "custom": return options.customDelimiter || "\t";
        default: return "\t";
    }
};

export const excelStyleTextToColumns = (
    text: string, 
    options: {
        delimiterType: 'delimited' | 'fixed';
        delimiter?: string; 
        textQualifier?: string;
        treatConsecutiveDelimitersAsOne?: boolean;
        trimWhitespace?: boolean;
        detectDataTypes?: boolean;
        fixedWidthPositions?: number[];
        dateFormat?: string;
        hasHeaderRow?: boolean; // Added for clarity, used by calling logic
    }
): string[][] => {
    console.log('[excelStyleTextToColumns] INPUT Text:', text.substring(0, 100), 'Options:', options);

    if (!text || text.trim() === '') {
        return [];
    }
    
    console.log('Excel Text to Columns - Processing with options:', options);
    console.log('Input text sample:', text.slice(0, 200) + (text.length > 200 ? '...' : ''));
    
    const {
        delimiterType = 'delimited',
        delimiter = '\t',
        textQualifier = '"',
        treatConsecutiveDelimitersAsOne = true,
        trimWhitespace = true,
        detectDataTypes = true,
        fixedWidthPositions = [],
        dateFormat = 'MDY',
        // hasHeaderRow is not directly used in the parsing loop here, 
        // but it's important for the caller to know if the first row parsed is a header.
    } = options;
    
    const result: string[][] = [];
    
    if (delimiterType === 'delimited') {
        console.log('Using delimited mode with delimiter:', JSON.stringify(delimiter));
        console.log('Text qualifier:', JSON.stringify(textQualifier));
        
        const rows = text.split(/\r?\n/);
        console.log(`Found ${rows.length} rows`);
        
        rows.forEach((row, rowIndex) => {
            // Skip processing for completely empty rows if skipEmptyRows is part of general options (handled by caller or here)
            // For now, this function processes all non-blank-trimmed rows
            if (options.trimWhitespace && row.trim() === '') return; 
            // If not trimming, even a row of spaces could be valid, so let's process.
            // The skipEmptyRows is more about semantic empty rows rather than just whitespace.
            // The original logic was `if (row.trim() === '') return;` which seems fine for most cases.

            const parsedRow: string[] = [];
            let currentField = '';
            let insideQuotes = false;
            let lastCharWasDelimiter = false;
            
            for (let i = 0; i < row.length; i++) {
                const char = row[i];
                
                if (textQualifier && char === textQualifier) { // Ensure textQualifier is not empty
                    if (i < row.length - 1 && row[i + 1] === textQualifier) { // Escaped qualifier
                        currentField += textQualifier;
                        i++; // Skip next character
                    } else {
                        insideQuotes = !insideQuotes;
                    }
                    lastCharWasDelimiter = false;
                }
                else if (char === delimiter && !insideQuotes) {
                    if (treatConsecutiveDelimitersAsOne && lastCharWasDelimiter) {
                        // Skip if treating consecutive delimiters as one and previous was also a delimiter
                        // This implies an empty field, which should be added if not skipping empty fields.
                        // The original `continue` was for when `lastCharWasDelimiter` was true
                        // and `treatConsecutiveDelimitersAsOne` was true. This means the field is empty.
                        // It should still push an empty string unless `treatConsecutiveDelimitersAsOne`
                        // means "merge them and create NO field in between".
                        // Excel's "Treat consecutive delimiters as one" means that "a,,b" becomes "a,b" (2 fields)
                        // If unchecked, "a,,b" becomes "a,EMPTY,b" (3 fields).
                        // So if treatConsecutiveDelimitersAsOne is true, and lastCharWasDelimiter is true,
                        // we *don't* add an empty field here, we just continue.
                        lastCharWasDelimiter = true; // maintain state
                        continue; // Correct: skip creating an empty field for the second consecutive delimiter
                    }
                    
                    const fieldValue = trimWhitespace ? currentField.trim() : currentField;
                    parsedRow.push(fieldValue);
                    currentField = '';
                    lastCharWasDelimiter = true;
                }
                else {
                    currentField += char;
                    lastCharWasDelimiter = false;
                }
            }
            
            const fieldValue = trimWhitespace ? currentField.trim() : currentField;
            parsedRow.push(fieldValue);
            
            if (detectDataTypes) {
                for (let i = 0; i < parsedRow.length; i++) {
                    parsedRow[i] = inferDataType(parsedRow[i], dateFormat);
                }
            }
            
            result.push(parsedRow);
            
            if (rowIndex < 3) {
                console.log(`Row ${rowIndex + 1}:`, parsedRow);
            }
        });
    }
    else if (delimiterType === 'fixed') {
        console.log('Using fixed width mode with positions:', fixedWidthPositions);
        if (!fixedWidthPositions || fixedWidthPositions.length === 0) {
            console.error('No fixed width positions provided');
            return [];
        }
        
        const rows = text.split(/\r?\n/);
        console.log(`Found ${rows.length} rows`);
        
        rows.forEach((row, rowIndex) => {
            if (options.trimWhitespace && row.trim() === '') return;

            const parsedRow: string[] = [];
            let startPos = 0;
            
            for (const position of fixedWidthPositions) {
                const fieldValue = row.substring(startPos, position);
                parsedRow.push(trimWhitespace ? fieldValue.trim() : fieldValue);
                startPos = position;
            }
            
            // Add the last segment if any
            if (startPos < row.length) {
                const fieldValue = row.substring(startPos);
                parsedRow.push(trimWhitespace ? fieldValue.trim() : fieldValue);
            }
            
            if (detectDataTypes) {
                for (let i = 0; i < parsedRow.length; i++) {
                    parsedRow[i] = inferDataType(parsedRow[i], dateFormat);
                }
            }
            
            result.push(parsedRow);
            
            if (rowIndex < 3) {
                console.log(`Row ${rowIndex + 1}:`, parsedRow);
            }
        });
    }
    
    console.log(`Text to Columns processing complete. Parsed ${result.length} rows`);
    
    if (result.length > 0 && result[0]) { // Check if result[0] exists
        const columnCount = result[0].length;
        console.log(`Number of columns: ${columnCount}`);
        
        const typeSamples: {[column: number]: Set<string>} = {};
        
        // Only sample if data exists
        for (let i = 0; i < Math.min(result.length, 10); i++) {
            const sampleRow = result[i];
            if (!sampleRow) continue; // Should not happen if result.length > 0
            for (let j = 0; j < sampleRow.length; j++) {
                if (!typeSamples[j]) {
                    typeSamples[j] = new Set();
                }
                const type = detectValueType(sampleRow[j]);
                typeSamples[j].add(type);
            }
        }
        
        console.log('Column type samples:');
        Object.keys(typeSamples).forEach(colIndex => {
            const columnIndex = Number(colIndex);
            const types = Array.from(typeSamples[columnIndex]).join(', ');
            console.log(`Column ${columnIndex + 1}: ${types}`);
        });
    } else {
        console.log('No data parsed or first row is undefined.');
    }
    
    console.log('[excelStyleTextToColumns] OUTPUT Result:', JSON.stringify(result));
    return result;
};

// This parsePreviewData was simpler and used a basic split.
// If the preview needs to be robust, it should also use excelStyleTextToColumns.
// For now, retaining its original simpler logic as it was in useImportClipboardProcessor.
export const parsePreviewData = async (
    text: string,
    options: ClipboardProcessingOptions & { customDelimiter?: string }
): Promise<string[][]> => {
    if (!text) return [];

    const delimiter = getDelimiterCharacter(options); // Uses the utility
    const rows = text.split(/\r?\n/);
    
    const processedRows = rows
        .filter(row => options.skipEmptyRows ? row.trim() !== '' : true)
        .map(row => {
            // Simple split, not as robust as excelStyleTextToColumns for complex CSVs (e.g. quotes)
            const cells = row.split(delimiter); 
            return cells.map(cell => {
                let processedCell = cell;
                if (options.trimWhitespace) {
                    processedCell = processedCell.trim();
                }
                // Note: No detectDataTypes here for preview in this version
                return processedCell;
            });
        });
        
    return processedRows;
}; 