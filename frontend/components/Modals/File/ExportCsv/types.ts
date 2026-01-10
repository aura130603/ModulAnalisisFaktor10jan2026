export interface UseExportCsvOptions {
    initialFilename?: string;
    initialDelimiter?: string;
    initialIncludeHeaders?: boolean;
    initialIncludeVariableProperties?: boolean;
    initialQuoteStrings?: boolean;
    initialEncoding?: string;
}

export interface CsvExportOptions {
    delimiter: string;
    includeHeaders: boolean;
    includeVariableProperties: boolean;
    quoteStrings: boolean;
}

export interface ExportCsvProps extends UseExportCsvOptions {
    onClose: () => void;
    containerType?: "dialog" | "sidebar" | "panel";
} 