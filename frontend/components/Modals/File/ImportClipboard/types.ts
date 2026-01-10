import type { ContainerType } from "@/types/ui";

export type ImportClipboardStage = "paste" | "configure";

export interface UseImportClipboardLogicProps {
    onClose: () => void;
}

export interface UseImportClipboardLogicOutput {
    pastedText: string | null;
    parsedData: string[][];
    isLoading: boolean;
    error: string | null;
    stage: ImportClipboardStage;
    isMobile: boolean;
    isPortrait: boolean;
    handleTextPaste: (text: string) => void;
    handleContinueToConfigure: () => void;
    handleBackToPaste: () => void;
    handleModalClose: () => void;
}

// Props for the main ImportClipboard component
export interface ImportClipboardProps {
    onClose: () => void;
    containerType?: ContainerType;
}

// Props for the first step (paste)
export interface ImportClipboardPasteStepProps {
    onClose: () => void;
    onTextPaste: (text: string) => void;
    onContinue: () => void;
    isLoading: boolean;
    error: string | null;
    pastedText: string | null;
    isMobile: boolean;
    isPortrait: boolean;
}

// Props for the second step (configuration and preview)
export interface ImportClipboardConfigurationStepProps {
    onClose: () => void;
    onBack: () => void;
    pastedText: string;
    parsedData: string[][];
}

export interface ClipboardProcessingOptions {
    delimiter: "tab" | "comma" | "semicolon" | "space" | "custom";
    customDelimiter?: string;
    firstRowAsHeader: boolean;
    trimWhitespace: boolean;
    skipEmptyRows: boolean;
    detectDataTypes: boolean;
    excelProcessedData?: string[][]; // Data already processed by Excel-style parser
} 