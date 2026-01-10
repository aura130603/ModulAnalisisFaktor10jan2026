// File: Variable.ts (atau path yang sesuai)

export interface ValueLabel {
    id?: number;
    variableId: number;
    value: number | string;
    label: string;
}

export type VariableType =
    | "NUMERIC"
    | "COMMA"
    | "DOT"
    | "SCIENTIFIC"
    | "DATE"
    | "ADATE"
    | "EDATE"
    | "SDATE"
    | "JDATE"
    | "QYR"
    | "MOYR"
    | "WKYR"
    | "DATETIME"
    | "TIME"
    | "DTIME"
    | "WKDAY"
    | "MONTH"
    | "DOLLAR"
    | "CCA"
    | "CCB"
    | "CCC"
    | "CCD"
    | "CCE"
    | "STRING"
    | "RESTRICTED_NUMERIC";

export const spssDateTypes: ReadonlySet<VariableType> = new Set<VariableType>([
    "DATE", "ADATE", "EDATE", "SDATE", "JDATE", "QYR",
    "MOYR", "WKYR", "DATETIME", "TIME", "DTIME"
]);

export type VariableAlign = "right" | "left" | "center";

export type VariableMeasure = "scale" | "ordinal" | "nominal" | "unknown";

export type VariableRole = "input" | "target" | "both" | "none" | "partition" | "split";

export interface MissingRange {
    min?: number;
    max?: number;
}

export interface MissingValuesSpec {
    discrete?: (number | string)[];
    range?: MissingRange;
}

export interface Variable {
    id?: number;
    tempId?: string;
    columnIndex: number;
    name: string;
    type?: VariableType;
    width: number;
    decimals: number;
    label?: string;
    values: ValueLabel[];
    missing: MissingValuesSpec | null;
    columns: number;
    align: VariableAlign;
    measure: VariableMeasure;
    role: VariableRole;
};

export interface VariableData {
    variable: Variable;
    data: (string | number | null)[];
}