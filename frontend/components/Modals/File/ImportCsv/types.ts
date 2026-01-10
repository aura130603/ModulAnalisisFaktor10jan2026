export interface CSVProcessingOptions {
    firstLineContains: boolean;
    removeLeading: boolean;
    removeTrailing: boolean;
    delimiter: "comma" | "semicolon" | "tab";
    decimal: "period" | "comma";
    textQualifier: "doubleQuote" | "singleQuote" | "none";
}

export type DelimiterOption = CSVProcessingOptions['delimiter'];
export type DecimalOption = CSVProcessingOptions['decimal'];
export type TextQualifierOption = CSVProcessingOptions['textQualifier'];

export interface SelectOption {
    value: string;
    label: string;
}

// Add other types related to ImportCsv here if needed 