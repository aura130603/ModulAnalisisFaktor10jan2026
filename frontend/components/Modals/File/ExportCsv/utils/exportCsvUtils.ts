import type { Variable, MissingValuesSpec } from "@/types/Variable";
import type { DataRow } from "@/types/Data";
import type { CsvExportOptions } from "../types";

const escapeCsvCell = (cellValue: string | number | undefined | null, delimiter: string, quoteStrings: boolean): string => {
    if (cellValue === undefined || cellValue === null) {
        return "";
    }
    const stringValue = String(cellValue);

    const needsQuoting =
        stringValue.includes('"') ||
        stringValue.includes(delimiter) ||
        stringValue.includes('\n') ||
        stringValue.includes('\r');

    const shouldQuote = (typeof cellValue === 'string' && quoteStrings) || needsQuoting;

    if (shouldQuote) {
        const escapedValue = stringValue.replace(/"/g, '""');
        return `"${escapedValue}"`;
    }

    return stringValue;
};

// Helper function to format MissingValuesSpec into a string for export
const formatMissingSpecToString = (spec: MissingValuesSpec | null): string => {
    if (!spec) {
        return "";
    }
    const parts: string[] = [];
    if (spec.range) {
        const { min, max } = spec.range;
        if (min !== undefined && max !== undefined) {
            parts.push(`RANGE(${min} THRU ${max})`);
        } else if (min !== undefined) {
            parts.push(`RANGE(${min} THRU HIGHEST)`);
        } else if (max !== undefined) {
            parts.push(`RANGE(LOWEST THRU ${max})`);
        }
    }
    if (spec.discrete && spec.discrete.length > 0) {
        const discreteFormatted = spec.discrete.map(v => {
            if (typeof v === 'string') {
                 if (v === " ") return "'[SPACE]'";
                 if (v.includes(';') || v.includes(' ') || !isNaN(Number(v))) {
                    return JSON.stringify(v); // Use JSON stringify for quoting
                 }
            }
            return String(v);
        });
        parts.push(discreteFormatted.join('; '));
    }
    return parts.join('; ');
};

export const generateCsvContent = (
    data: DataRow[],
    variables: Variable[],
    options: CsvExportOptions
): string => {
    const { delimiter, includeHeaders, includeVariableProperties, quoteStrings } = options;
    const lines: string[] = [];

    if (includeVariableProperties && variables.length > 0) {
        lines.push(`# Variable Definitions:`);
        const propHeaders = [
            "Index", "Name", "Type", "Width", "Decimals",
            "Label", "Measure", "Align", "Role", "MissingValues", "ValueLabels"
        ].map(h => escapeCsvCell(h, delimiter, true))
         .join(delimiter);
        lines.push(`# ${propHeaders}`);

        variables.forEach(v => {
            const valueLabelsString = v.values.map(vl => `${vl.value}=${vl.label}`).join('; ');
            const missingString = formatMissingSpecToString(v.missing);
            const properties = [
                v.columnIndex, v.name, v.type, v.width, v.decimals,
                v.label || "", v.measure, v.align, v.role, missingString, valueLabelsString
            ].map(prop => escapeCsvCell(prop, delimiter, true))
                .join(delimiter);
            lines.push(`# ${properties}`);
        });
        lines.push('');
    }

    if (includeHeaders && variables.length > 0) {
        const headers = variables.map(v => escapeCsvCell(v.name, delimiter, quoteStrings));
        lines.push(headers.join(delimiter));
    }

    data.forEach(row => {
        const formattedRow = row.map((cell: string | number | null) => escapeCsvCell(cell, delimiter, quoteStrings));
        lines.push(formattedRow.join(delimiter));
    });

    return lines.join("\n");
}; 