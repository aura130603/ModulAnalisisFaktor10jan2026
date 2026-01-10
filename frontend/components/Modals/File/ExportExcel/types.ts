import { Variable } from "@/types/Variable";
import { DataRow } from "@/types/Data";
import { Meta } from "@/types/Meta";
import type { ContainerType } from "@/types/ui";

// Options for the core Excel generation utility
export interface ExcelUtilOptions {
    includeHeaders: boolean;
    includeVariablePropertiesSheet: boolean;
    includeMetadataSheet: boolean;
    includeDataLabels: boolean;
    applyHeaderStyling: boolean;
}

// Main state type for the Excel export logic
export interface ExportExcelLogicState {
    filename: string;
    format: "xlsx" | "xls";
    includeHeaders: boolean;
    includeVariableProperties: boolean;
    includeMetadataSheet: boolean;
    includeDataLabels: boolean;
    applyHeaderStyling: boolean;
}

// Props for the logic hook
export interface UseExportExcelLogicProps {
    onClose: () => void;
}

// Props for the container component - AKAN DIHAPUS
// export interface ExportExcelContainerProps {
//     isOpen: boolean; // Diasumsikan tidak lagi dikontrol di sini
//     onClose: () => void;
//     containerType?: ContainerType;
// }

// Props for the main/UI component
// Mengganti nama dan menyederhanakan ExportExcelUIProps
export interface ExportExcelProps {
    onClose: () => void;
    containerType?: ContainerType; // Diterima dari ModalRenderer
    // exportOptions, isExporting, dan handler akan datang dari hook internal
} 