import { Variable, MissingValuesSpec, MissingRange, VariableType } from '@/types/Variable';
import { DataRow } from '@/types/Data';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// Helper function to map SPSS format types to our interface types
export const mapSPSSTypeToInterface = (formatType: string): VariableType => {
    const typeMap: { [key: string]: VariableType } = {
        "F": "NUMERIC", "COMMA": "COMMA", "DOT": "DOT", "E": "SCIENTIFIC", "DATE": "DATE",
        "ADATE": "ADATE", "EDATE": "EDATE", "SDATE": "SDATE", "JDATE": "JDATE",
        "QYR": "QYR", "MOYR": "MOYR", "WKYR": "WKYR", "DATETIME": "DATETIME",
        "TIME": "TIME", "DTIME": "DTIME", "WKDAY": "WKDAY", "MONTH": "MONTH",
        "DOLLAR": "DOLLAR", "A": "STRING", "CCA": "CCA", "CCB": "CCB",
        "CCC": "CCC", "CCD": "CCD", "CCE": "CCE"
    };
    return typeMap[formatType] || "NUMERIC";
};

// Helper function to convert SAV missing info to MissingValuesSpec
export const convertSavMissingToSpec = (savMissing: any): MissingValuesSpec | null => {
    if (savMissing === null || savMissing === undefined) {
        return null;
    }

    if (Array.isArray(savMissing)) {
        return savMissing.length > 0 ? { discrete: savMissing } : null;
    }

    if (typeof savMissing === 'object' && (savMissing.hasOwnProperty('min') || savMissing.hasOwnProperty('max'))) {
        const range: MissingRange = {};
        if (savMissing.min !== undefined && typeof savMissing.min === 'number') {
            range.min = savMissing.min;
        }
        if (savMissing.max !== undefined && typeof savMissing.max === 'number') {
            range.max = savMissing.max;
        }
        return range.min !== undefined || range.max !== undefined ? { range } : null;
    }

    if (typeof savMissing === 'string' || typeof savMissing === 'number') {
        return { discrete: [savMissing] };
    }

    console.warn("Unknown SAV missing value format:", savMissing);
    return null;
};

export const parseCSV = (content: string): Promise<DataRow[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse(content, {
            header: false,
            skipEmptyLines: true,
            complete: (results: Papa.ParseResult<unknown>) => {
                if (results.errors.length) {
                    const errorMsg = results.errors.map((err: Papa.ParseError) => err.message).join("; ");
                    reject(new Error(errorMsg));
                } else {
                    const data = results.data as unknown[][];
                    if (data.length === 0) {
                        resolve([]);
                        return;
                    }
                    const sanitizedData = data.map(row => 
                        row.map(cell => (typeof cell === 'string' || typeof cell === 'number' ? cell : String(cell)))
                    );
                    const maxCols = Math.max(...sanitizedData.map(row => row.length));
                    const paddedData = sanitizedData.map(row => {
                        const newRow = [...row];
                        while (newRow.length < maxCols) {
                            newRow.push("");
                        }
                        return newRow;
                    });
                    resolve(paddedData as DataRow[]);
                }
            },
            error: (error: Papa.ParseError) => {
                reject(error);
            }
        } as Papa.ParseConfig<unknown>);
    });
};

export const parseXLSX = (content: ArrayBuffer): Promise<DataRow[]> => {
    return new Promise((resolve, reject) => {
        try {
            const workbook = XLSX.read(content, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
            resolve(jsonData as DataRow[]);
        } catch (err: unknown) {
            reject(err instanceof Error ? err : new Error(String(err)));
        }
    });
};

export const generateDefaultVariables = (numCols: number): Variable[] => {
    const variables: Variable[] = [];
    for (let i = 0; i < numCols; i++) {
        variables.push({
            columnIndex: i,
            name: `VAR${String(i + 1).padStart(3, '0')}`,
            type: "NUMERIC",
            width: 8,
            decimals: 2,
            label: "",
            values: [],
            missing: null,
            columns: 72,
            align: "right",
            measure: "unknown",
            role: "input"
        });
    }
    return variables;
}; 