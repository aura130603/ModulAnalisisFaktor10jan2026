import type { ContainerType } from "@/types/ui";
import type { SheetData } from "./services/services";

export type ImportExcelStage = "select" | "configure";

// Dihapus karena container akan dihilangkan
// export interface ImportExcelContainerProps {
//     isOpen: boolean;
//     onClose: () => void;
//     containerType?: ContainerType;
// }

export interface UseImportExcelLogicProps {
    onClose: () => void;
}

export interface UseImportExcelLogicOutput {
    file: File | null;
    // removed binary content; now parsedSheets is provided
    parsedSheets: SheetData[] | null;
    fileName: string;
    isLoading: boolean;
    error: string | null;
    stage: ImportExcelStage;
    isMobile: boolean;
    isPortrait: boolean;
    handleFileSelect: (selectedFile: File | null) => void;
    handleContinueToConfigure: () => void;
    handleBackToSelect: () => void;
    handleModalClose: () => void;
    // Exposing setters for flexibility during refactor, can be removed if not used by UI component
    setFile: React.Dispatch<React.SetStateAction<File | null>>;
    setFileName: React.Dispatch<React.SetStateAction<string>>;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
    setStage: React.Dispatch<React.SetStateAction<ImportExcelStage>>;
    setParsedSheets: React.Dispatch<React.SetStateAction<SheetData[] | null>>;
}

// Props untuk komponen utama ImportExcel (sebelumnya ImportExcelUIProps)
export interface ImportExcelProps {
    onClose: () => void; // Diteruskan ke hook dan digunakan oleh step
    containerType: ContainerType; // Diterima dari ModalRenderer
}

// Props for the first step (file selection)
export interface ImportExcelSelectionStepProps {
    onClose: () => void; 
    onFileSelect: (file: File | null) => void;
    onContinue: () => void;
    isLoading: boolean;
    error: string | null;
    selectedFile: File | null;
    isMobile: boolean;
    isPortrait: boolean;
}

// Props for the second step (configuration and preview)
export interface ImportExcelConfigurationStepProps {
    onClose: () => void; 
    onBack: () => void;
    fileName: string;
    parsedSheets: SheetData[]; // Parsed sheet data from worker
}

export interface ParseSheetOptions {
    range?: string;
    firstLineContains: boolean;
    readHiddenRowsCols: boolean;
    readEmptyCellsAs: "empty" | "missing";
    sheetRef?: string; // Optional: The '!ref' property of the sheet for default range
}

export interface ParsedSheetData {
    data: unknown[][];
    headers: string[] | false; // string[] if firstLineContains is true, false otherwise or if no headers
}

export interface ProcessedImportData {
    processedFullData: unknown[][];
    actualHeaders: string[];
}

// re-export SheetData for use in configuration component
export type { SheetData } from "./services/services";