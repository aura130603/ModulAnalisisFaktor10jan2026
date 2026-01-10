import type { useTranspose } from "./hooks/useTranspose";

export interface TransposeModalProps {
    onClose: () => void;
    containerType?: "dialog" | "sidebar";
}

export type TransposeUIProps = ReturnType<typeof useTranspose> & TransposeModalProps; 