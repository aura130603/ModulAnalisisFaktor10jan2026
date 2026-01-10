import { Variable } from "@/types/Variable";

export enum RestructureMethod {
    VariablesToCases = "variables_to_cases",
    CasesToVariables = "cases_to_variables",
    TransposeAllData = "transpose_all_data",
}

export interface RestructureConfig {
    method: RestructureMethod;
    selectedVariables: Array<{
        name: string;
        columnIndex: number;
        type: string;
        measure: string;
    }>;
    indexVariables: Array<{
        name: string;
        columnIndex: number;
        type: string;
        measure: string;
    }>;
    identifierVariables: Array<{
        name: string;
        columnIndex: number;
        type: string;
        measure: string;
    }>;
    options: {
        createCount: boolean;
        createIndex: boolean;
        dropEmptyVariables: boolean;
    };
}

export interface RestructureUIProps {
    hook: any;
    onClose: () => void;
} 