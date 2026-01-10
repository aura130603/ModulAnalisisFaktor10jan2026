import type { Variable } from "@/types/Variable";
import type { CSVProcessingOptions } from "./types";

export class CSVProcessingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "CSVProcessingError";
    }
}

export const processCSVContent = (fileContent: string, options: CSVProcessingOptions) => {
    const { firstLineContains, removeLeading, removeTrailing, delimiter, decimal, textQualifier } = options;

    // New helper to parse a single CSV line while respecting text qualifiers
    const parseCsvLine = (line: string, delim: string, qualifier: string | null): string[] => {
        const cells: string[] = [];
        let current = "";
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (qualifier && ch === qualifier) {
                // If we are inside quotes and next char is also qualifier, it's an escape (""
                if (inQuotes && i + 1 < line.length && line[i + 1] === qualifier) {
                    current += qualifier;
                    i++; // Skip the escaped quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (ch === delim && !inQuotes) {
                cells.push(current);
                current = "";
            } else {
                current += ch;
            }
        }
        cells.push(current);
        return cells.map((cell) => {
            if (!qualifier) return cell;
            // Remove surrounding qualifier if present
            const trimmed = cell.trim();
            if (trimmed.startsWith(qualifier) && trimmed.endsWith(qualifier)) {
                return trimmed.substring(1, trimmed.length - 1).replace(new RegExp(`${qualifier}${qualifier}`, 'g'), qualifier);
            }
            return cell;
        });
    };

    try {
        let delimChar = ',';
        if (delimiter === 'semicolon') delimChar = ';';
        else if (delimiter === 'tab') delimChar = '\t';

        const qualifierChar = textQualifier === 'doubleQuote' ? '"' : textQualifier === 'singleQuote' ? "'" : null;

        const lines = fileContent.split(/\r\n|\n|\r/);
        
        const parsedRows: string[][] = [];
        for (const line of lines) {
            if (line.trim() === "") continue;

            let currentLine = line;
            if (removeLeading) currentLine = currentLine.replace(/^\s+/, '');
            if (removeTrailing) currentLine = currentLine.replace(/\s+$/, '');

            parsedRows.push(parseCsvLine(currentLine, delimChar, qualifierChar)); 
        }

        if (parsedRows.length === 0) {
            throw new CSVProcessingError("No data found in the file after processing.");
        }

        let headerRow: string[] | undefined;
        if (firstLineContains && parsedRows.length > 0) {
            headerRow = parsedRows.shift();
            if (!headerRow || headerRow.length === 0) {
                throw new CSVProcessingError("Header row is empty or missing.");
            }
        }
        
        if (parsedRows.length === 0 && !headerRow) {
            throw new CSVProcessingError("The file appears to be empty or contains no valid data rows.");
        }

        const numCols = headerRow ? headerRow.length : (parsedRows.length > 0 ? parsedRows[0].length : 0);
        if (numCols === 0) {
            throw new CSVProcessingError("Could not determine the number of columns. The file might be empty or malformed.");
        }

        // Generate variable definitions
        const variables: Variable[] = [];
        for (let colIndex = 0; colIndex < numCols; colIndex++) {
            const colData = parsedRows.map(row => row[colIndex] || '');
            const variableName = (firstLineContains && headerRow?.[colIndex]) 
                ? headerRow[colIndex].trim() 
                : `VAR${String(colIndex + 1).padStart(3, '0')}`;

            let isNumeric = true;
            let potentialDecimals = 0;
            if (colData.length > 0) {
                for (const val of colData) {
                    if (val === null || val.trim() === '') continue;
                    const processedVal = decimal === 'comma' ? val.replace(',', '.') : val;
                    if (isNaN(Number(processedVal))) {
                        isNumeric = false;
                        break;
                    }
                    const parts = processedVal.split('.');
                    if (parts.length > 1) {
                        potentialDecimals = Math.max(potentialDecimals, parts[1].length);
                    }
                }
            } else if (parsedRows.length === 0 && headerRow) {
                // If only header row exists, assume columns based on header are string type
                isNumeric = false;
            }


            const newVar: Variable = {
                columnIndex: colIndex,
                name: variableName,
                type: isNumeric ? 'NUMERIC' : 'STRING',
                width: isNumeric ? 8 : Math.min(32767, Math.max(8, ...colData.map(v => v?.length || 0), variableName.length)),
                decimals: isNumeric ? Math.min(potentialDecimals, 16) : 0,
                label: '',
                columns: 72,
                align: isNumeric ? 'right' : 'left',
                measure: isNumeric ? 'scale' : 'nominal',
                role: 'input',
                values: [],
                missing: null
            };
            
            variables.push(newVar);
        }

        // Process actual data
        const data: string[][] = [];
        parsedRows.forEach((row) => {
            const processedRow: string[] = [];
            
            for (let colIndex = 0; colIndex < numCols; colIndex++) {
                let value = row[colIndex] || '';
                const variable = variables[colIndex];
                
                if (variable && variable.type === 'NUMERIC' && value.trim() !== '') {
                    value = decimal === 'comma' ? value.replace(',', '.') : value;
                    if (isNaN(Number(value))) value = ''; 
                }
                
                processedRow.push(value);
            }
            
            data.push(processedRow);
        });

        return {
            variables,
            data
        };
    } catch (err) {
        if (err instanceof CSVProcessingError) {
            throw err;
        }
        console.error("Error processing CSV:", err);
        throw new CSVProcessingError("Failed to process CSV data. Please check the file format.");
    }
}; 