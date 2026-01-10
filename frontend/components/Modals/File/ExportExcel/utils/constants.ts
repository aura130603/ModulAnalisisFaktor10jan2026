// Default filename when no project name is set
export const DEFAULT_FILENAME = "data_export";

// Excel format options
export const EXCEL_FORMATS = [
  { value: "xlsx", label: "Excel Workbook (*.xlsx)" },
  { value: "xls", label: "Excel 97-2003 Workbook (*.xls)" }
];

// Options for Excel export with tooltips
export const EXCEL_OPTIONS_CONFIG = [
  {
    id: "excel-includeHeaders",
    name: "includeHeaders",
    label: "Include variable names as header row",
    tooltip: "Adds variable names as the first row in the Excel file"
  },
  {
    id: "excel-includeVarProps",
    name: "includeVariableProperties",
    label: "Include variable properties sheet",
    tooltip: "Creates a separate sheet with metadata about each variable"
  },
  {
    id: "excel-includeMetaSheet",
    name: "includeMetadataSheet",
    label: "Include metadata sheet (if available)",
    tooltip: "Adds a sheet with dataset metadata if available"
  },
  {
    id: "excel-applyHeaderStyling",
    name: "applyHeaderStyling",
    label: "Apply basic header styling",
    tooltip: "Adds formatting to header rows to improve readability"
  },
  {
    id: "excel-includeDataLabels",
    name: "includeDataLabels",
    label: "Represent missing data with SYSMIS text",
    tooltip: "Shows 'SYSMIS' for missing values instead of leaving cells blank"
  }
]; 