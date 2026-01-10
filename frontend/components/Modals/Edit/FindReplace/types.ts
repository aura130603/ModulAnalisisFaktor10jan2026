import type { BaseModalProps } from "@/types/modalTypes";

export enum FindReplaceMode {
    FIND = "find",
    REPLACE = "replace",
}

export enum TabType {
    FIND = "find",
    REPLACE = "replace",
}

// Interface extending BaseModalProps for type safety with our modal system
export interface FindAndReplaceModalProps extends BaseModalProps {
    // columns?: string[]; // Columns are now fetched from useVariableStore via the hook
    defaultTab?: FindReplaceMode;
    initialTab?: FindReplaceMode; // For setting initial tab from outside
} 