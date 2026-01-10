import type { ContainerType } from "@/types/ui";

export type PaperSize = "a4" | "a3" | "letter" | "legal";

export interface SelectedOptions {
    data: boolean;
    variable: boolean;
    result: boolean;
}

export interface UsePrintLogicProps {
    onClose: () => void;
}

export interface UsePrintLogicOutput {
    fileName: string;
    setFileName: React.Dispatch<React.SetStateAction<string>>;
    selectedOptions: SelectedOptions;
    setSelectedOptions: React.Dispatch<React.SetStateAction<SelectedOptions>>;
    paperSize: PaperSize;
    setPaperSize: React.Dispatch<React.SetStateAction<PaperSize>>;
    isGenerating: boolean;
    isMobile: boolean;
    isPortrait: boolean;
    handlePrint: () => Promise<void>;
    handleModalClose: () => void;
    resetOptions: () => void;
}

// Props for main PrintModal component
export interface PrintProps {
    onClose: () => void;
    containerType?: ContainerType; // Changed from string to ContainerType
}

// Props for the options/content component (PrintOptions)
export interface PrintOptionsProps {
    fileName: string;
    onFileNameChange: (name: string) => void;
    selectedOptions: SelectedOptions;
    onOptionChange: (option: keyof SelectedOptions) => void;
    paperSize: PaperSize;
    onPaperSizeChange: (size: PaperSize) => void;
    onPrint: () => Promise<void>;
    onCancel: () => void;
    isGenerating: boolean;
    isMobile: boolean; // For responsive styling in options
    isPortrait: boolean; // For responsive styling in options
    onReset: () => void;
} 