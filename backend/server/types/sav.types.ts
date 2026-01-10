// Note: We intentionally avoid importing enum types from 'sav-writer' here
// because the package re-exports them as value-only aliases, which breaks
// using them as types (TS2749). We keep numeric types to match the runtime enums.

export type SPSSVariableType =
    'NUMERIC' | 'STRING' |
    'DATE' | 'ADATE' | 'EDATE' | 'SDATE' | 'JDATE' |
    'QYR' | 'MOYR' | 'WKYR' | 'WKDAY' | 'MONTH' |
    'DATETIME' | 'TIME' | 'DTIME' |
    'DOLLAR' | 'DOT' | 'COMMA' | 'SCIENTIFIC' |
    'CUSTOM_CURRENCY' | 'CCA' | 'CCB' | 'CCC' | 'CCD' | 'CCE';

export interface SavVariable {
    name: string;
    label: string;
    type: SPSSVariableType;
    width: number;
    decimal: number;
    alignment: string;
    measure: string;
    columns: number;
    columnIndex?: number;
    valueLabels?: Array<{
        value: string | number;
        label: string;
    }>;
}

// Minimal, forward-compatible meta shape returned by sav-reader that our FE consumes
export interface SavMetaHeader {
    n_cases?: number;
    n_vars?: number;
    [key: string]: unknown;
}

export interface SavSysVarPrintFormat {
    // Mirrors sav-reader DisplayFormat (numeric enum under the hood)
    type?: number;
    typestr?: string; // e.g. 'A', 'F', 'DATE', etc.
    width?: number;
    nbdec?: number;
    [key: string]: unknown;
}

export interface SavSysVarWriteFormat {
    // Mirrors sav-reader DisplayFormat
    type?: number;
    typestr?: string;
    width?: number;
    nbdec?: number;
    [key: string]: unknown;
}

export type SavMissingSpec =
    | number[]
    | { min?: number; max?: number }
    | string
    | number
    | null
    | undefined;

export interface SavSysVar {
    name: string;
    // sav-reader commonly exposes 0 (numeric) / 1 (string)
    type?: 0 | 1;
    label?: string;
    printFormat?: SavSysVarPrintFormat;
    writeFormat?: SavSysVarWriteFormat;
    measurementLevel?: string; // e.g. 'scale', 'ordinal', 'nominal'
    missing?: SavMissingSpec;
    [key: string]: unknown;
}

export interface SavValueLabelEntry {
    val: string | number;
    label: string;
}

export interface SavValueLabelsForVariable {
    appliesToNames?: string[];
    entries: SavValueLabelEntry[];
}

export interface SavMeta {
    header?: SavMetaHeader;
    sysvars?: SavSysVar[];
    valueLabels?: SavValueLabelsForVariable[];
    [key: string]: unknown;
}

export interface SavResponse {
    meta: SavMeta;
    rows: Record<string, unknown>[];
}

// Value label as received from client payload (may be loosely typed)
export interface ValueLabelInput {
    value?: string | number | null;
    label?: string | null;
}

// Variable shape as received from client payload
export interface VariableInput {
    name: string;
    label?: string;
    type: SPSSVariableType;
    width: number;
    decimal?: number;
    alignment?: 'left' | 'centre' | 'center' | 'right';
    measure?: 'nominal' | 'ordinal' | 'continuous';
    columns?: number;
    valueLabels?: ValueLabelInput[];
}

// Variable shape required by sav-writer after transformation
// Mirrors sav-writer's SavVariable from lib/writer/variables.d.ts
export interface TransformedVariable {
    name: string;
    short?: string;
    label: string;
    // enum values from sav-writer.types (Numeric=5, String=1, Date=20, DateTime=22)
    type: number;
    width: number;
    decimal: number;
    // Optional per sav-writer interface
    alignment?: number;
    measure?: number;
    columns: number;
    valueLabels?: Array<{ label: string; value: string | number }>;
}

export const DATE_FORMATS = [
    { format: "dd-mmm-yyyy", type: "DATE", width: 11 },
    { format: "dd-mmm-yy", type: "DATE", width: 9 },
    { format: "mm/dd/yyyy", type: "ADATE", width: 10 },
    { format: "mm/dd/yy", type: "ADATE", width: 8 },
    { format: "dd.mm.yyyy", type: "EDATE", width: 10 },
    { format: "dd.mm.yy", type: "EDATE", width: 8 },
    { format: "yyyy/mm/dd", type: "SDATE", width: 10 },
    { format: "yy/mm/dd", type: "SDATE", width: 8 },
    { format: "yyddd", type: "JDATE", width: 5 },
    { format: "yyyyddd", type: "JDATE", width: 7 },
    { format: "q Q yyyy", type: "QYR", width: 8 },
    { format: "q Q yy", type: "QYR", width: 6 },
    { format: "mmm yyyy", type: "MOYR", width: 8 },
    { format: "mmm yy", type: "MOYR", width: 6 },
    { format: "ww WK yyyy", type: "WKYR", width: 10 },
    { format: "ww WK yy", type: "WKYR", width: 8 },
    { format: "dd-mmm-yyyy hh:mm", type: "DATETIME", width: 17 },
    { format: "dd-mmm-yyyy hh:mm:ss", type: "DATETIME", width: 20 },
    { format: "dd-mmm-yyyy hh:mm:ss.ss", type: "DATETIME", width: 23 },
    { format: "my-mm-dd hh:mm", type: "DATETIME", width: 16 },
    { format: "my-mm-dd hh:mm:ss", type: "DATETIME", width: 19 },
    { format: "yyyy-mm-dd hh:mm:ss.ss", type: "DATETIME", width: 22 },
    { format: "mm:ss", type: "TIME", width: 5 },
    { format: "mm:ss.ss", type: "TIME", width: 8 },
    { format: "hh:mm", type: "TIME", width: 5 },
    { format: "hh:mm:ss", type: "TIME", width: 8 },
    { format: "hh:mm:ss.ss", type: "TIME", width: 11 },
    { format: "ddd hh:mm", type: "DTIME", width: 9 },
    { format: "ddd hh:mm:ss", type: "DTIME", width: 12 },
    { format: "ddd hh:mm:ss.ss", type: "DTIME", width: 15 },
    { format: "Monday, Tuesday, ...", type: "WKDAY", width: 9 },
    { format: "Mon, Tue, Wed, ...", type: "WKDAY", width: 3 },
    { format: "January, February, ...", type: "MONTH", width: 9 },
    { format: "Jan, Feb, Mar, ...", type: "MONTH", width: 3 }
];