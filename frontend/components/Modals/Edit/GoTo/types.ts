import type { BaseModalProps } from "@/types/modalTypes";

export enum GoToMode {
    CASE = "case",
    VARIABLE = "variable",
}

export interface GoToModalProps extends BaseModalProps {
    defaultMode?: GoToMode;
    initialMode?: GoToMode; // For setting initial mode from outside
    // variables?: string[]; // Will be fetched from useVariableStore via the hook
    // totalCases?: number; // Will be fetched from useDataStore via the hook
} 