import type { useSortVariables } from "./hooks/useSortVariables";

export interface SortVariablesModalProps {
    onClose: () => void;
    containerType?: "dialog" | "sidebar";
}

export type SortVarsUIProps = ReturnType<typeof useSortVariables> & SortVariablesModalProps; 