export const getFormattedTypeName = (type: string): string => {
    switch (type) {
        case "NUMERIC": return "Numeric";
        case "COMMA": return "Comma";
        case "DOT": return "Dot";
        case "SCIENTIFIC": return "Scientific";
        case "DATE": return "Date";
        case "DOLLAR": return "Dollar";
        case "CCA": return "Currency A";
        case "CCB": return "Currency B";
        case "CCC": return "Currency C";
        case "CCD": return "Currency D";
        case "CCE": return "Currency E";
        case "PERCENT": return "Percent";
        case "STRING": return "String";
        case "RESTRICTED_NUMERIC": return "Restricted Numeric";
        default: return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    }
};

export const formatDropdownText = (text: string): string => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}; 