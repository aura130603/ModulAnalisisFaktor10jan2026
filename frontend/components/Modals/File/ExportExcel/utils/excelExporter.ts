import * as XLSX from 'xlsx';
import type { DataRow } from '@/types/Data';
import type { Variable } from '@/types/Variable';
// import { Meta } from '@/types/Meta'; // Assuming Meta might not be available or needed directly here for now
import type { ExcelUtilOptions } from '../types';

/**
 * Generates an Excel Workbook object from data, variables, and metadata.
 * @param data The array of data rows.
 * @param variables The array of variable definitions.
 * @param meta Optional metadata about the project or dataset.
 * @param options Configuration options for Excel generation.
 * @returns XLSX.WorkBook object.
 */
export const generateExcelWorkbook = (
    data: DataRow[],
    variables: Variable[],
    meta: any | null, // Using 'any' for meta if its type is uncertain
    options: ExcelUtilOptions
): XLSX.WorkBook => {
    const wb = XLSX.utils.book_new();

    // Create Data Sheet
    const dataSheetData = [];
    if (options.includeHeaders) {
        dataSheetData.push(variables.map(v => v.name));
    }
    data.forEach(row => {
        const dataRow = variables.map((variable, index) => row[variable.columnIndex] ?? (options.includeDataLabels ? "SYSMIS" : ""));
        dataSheetData.push(dataRow);
    });

    if (dataSheetData.length > 0) {
        const wsData = XLSX.utils.aoa_to_sheet(dataSheetData);
        XLSX.utils.book_append_sheet(wb, wsData, 'Data');
    }

    // Create Variable Properties Sheet
    if (options.includeVariablePropertiesSheet && variables.length > 0) {
        const varSheetData = [
            ['Index', 'Name', 'Type', 'Label', 'Measure', 'Width', 'Decimals', 'Values', 'Missing'] // Headers
        ];
        variables.forEach(v => {
            const valueLabels = v.values.map(val => `${val.value}=${val.label}`).join(', ');
            const missingValues = v.missing ? JSON.stringify(v.missing) : '';
            varSheetData.push([
                v.columnIndex as any,
                v.name,
                v.type,
                v.label || '',
                v.measure,
                v.width as any,
                v.decimals as any,
                valueLabels,
                missingValues
            ]);
        });
        const wsVars = XLSX.utils.aoa_to_sheet(varSheetData);
        XLSX.utils.book_append_sheet(wb, wsVars, 'VariableProperties');
    }

    // Create Metadata Sheet
    if (options.includeMetadataSheet && meta) {
        const metaSheetData: any[][] = [['Property', 'Value']];
        for (const key in meta) {
            if (Object.prototype.hasOwnProperty.call(meta, key)) {
                metaSheetData.push([key, typeof meta[key] === 'object' ? JSON.stringify(meta[key]) : meta[key]]);
            }
        }
        if (metaSheetData.length > 1) {
            const wsMeta = XLSX.utils.aoa_to_sheet(metaSheetData);
            XLSX.utils.book_append_sheet(wb, wsMeta, 'Metadata');
        }
    }

    return wb;
}; 