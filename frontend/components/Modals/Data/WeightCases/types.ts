import type { useWeightCases } from "./hooks/useWeightCases";

export interface WeightCasesModalProps {
    onClose: () => void;
    containerType?: "dialog" | "sidebar";
}

export type WeightCasesUIProps = ReturnType<typeof useWeightCases> & WeightCasesModalProps; 