import { v4 as uuidv4 } from 'uuid';
import { Variable, ValueLabel, MissingValuesSpec, MissingRange, spssDateTypes, VariableType } from "@/types/Variable";
import { spssSecondsToDateString } from "@/lib/spssDateConverter";
import type { SavUploadResponse, SavSysVar, SavValueLabelsForVariable, SavValueLabelEntry } from "@/types/SavUploadResponse";

/**
 * Processes a single cell's raw data value based on its variable definition.
 * This handles type coercion, date conversion, and trimming.
 * @param rawDataValue The raw value from the data row.
 * @param variable The variable definition for this cell's column.
 * @returns The processed and cleaned data value.
 */
const processCellData = (rawDataValue: any, variable: Variable | undefined): any => {
    // Return early if there's nothing to process
    if (rawDataValue === null || rawDataValue === undefined) {
        return null;
    }

    // Trim strings by default
    if (typeof rawDataValue === 'string') {
        rawDataValue = rawDataValue.trim();
    }

    // If no variable definition, return the trimmed (if string) or raw value
    if (!variable) {
        return rawDataValue;
    }

    // Convert date types from SPSS epoch seconds to a date string
    if (variable.type && spssDateTypes.has(variable.type) && typeof rawDataValue === 'number') {
        return spssSecondsToDateString(rawDataValue);
    }
    
    // Ensure STRING variables are actually strings
    if (variable.type === 'STRING' && typeof rawDataValue !== 'string') {
        return String(rawDataValue);
    }

    // Handle non-STRING types that might be read as strings
    if (variable.type !== 'STRING' && typeof rawDataValue === 'string') {
        // Return null for empty strings in numeric columns
        if (rawDataValue === "") return null;
        // Attempt to parse a float, otherwise return the string
        const num = parseFloat(rawDataValue);
        return isNaN(num) ? rawDataValue : num;
    }

    return rawDataValue;
};

/**
 * Maps arbitrary measurement level strings to the strict VariableMeasure union.
 */
const toVariableMeasure = (input: unknown): "scale" | "ordinal" | "nominal" | "unknown" => {
    if (typeof input === "string") {
        const m = input.toLowerCase();
        if (m === "scale" || m === "ordinal" || m === "nominal") return m;
    }
    return "unknown";
};

/**
 * Maps SPSS format type string to a VariableType.
 */
export const mapSPSSTypeToInterface = (formatType: string): VariableType => {
    const typeMap: { [key: string]: VariableType } = {
        "F": "NUMERIC", "COMMA": "COMMA", "DOT": "DOT", "E": "SCIENTIFIC", "DATE": "DATE",
        "ADATE": "ADATE", "EDATE": "EDATE", "SDATE": "SDATE", "JDATE": "JDATE",
        "QYR": "QYR", "MOYR": "MOYR", "WKYR": "WKYR", "DATETIME": "DATETIME",
        "TIME": "TIME", "DTIME": "DTIME", "WKDAY": "WKDAY", "MONTH": "MONTH",
        "DOLLAR": "DOLLAR", "A": "STRING", "CCA": "CCA", "CCB": "CCB",
        "CCC": "CCC", "CCD": "CCD", "CCE": "CCE"
    };
    return typeMap[formatType] || "NUMERIC"; // Default to NUMERIC if unknown
};

/**
 * Processes the raw API response from a .sav file upload.
 * It extracts metadata, variables, and data, standardizing them for the application.
 */
export const processSavApiResponse = (apiResponse: SavUploadResponse) => {
    const metaHeader = apiResponse.meta?.header;
    const sysvars = apiResponse.meta?.sysvars;
    const valueLabelsData = apiResponse.meta?.valueLabels;
    const dataRowsRaw = apiResponse.rows;

    if (!metaHeader || !sysvars || !dataRowsRaw) {
        throw new Error("Invalid response structure from backend. Essential metadata or data is missing.");
    }

    const numCases = metaHeader.n_cases;
    const numVars = metaHeader.n_vars;

    if (typeof numCases !== 'number' || typeof numVars !== 'number') {
        throw new Error("Invalid number of cases or variables in metadata.");
    }

    const variablePlaceholders = sysvars.map(() => ({
        tempId: uuidv4(),
    }));

    const variables: Variable[] = sysvars.map((varInfo: SavSysVar, colIndex: number): Variable => {
        const variableName = varInfo.name || `VAR${String(colIndex + 1).padStart(3, '0')}`;
        const formatType = varInfo.printFormat?.typestr || (varInfo.type === 1 ? "A" : "F");
        const isString = formatType === "A";
        const tempId = variablePlaceholders[colIndex].tempId;

        const valueLabelsObj = valueLabelsData?.find(
            (vl: SavValueLabelsForVariable) => vl.appliesToNames?.includes(variableName)
        );
        const values: ValueLabel[] = valueLabelsObj ?
            valueLabelsObj.entries.map((entry: SavValueLabelEntry): ValueLabel => ({
                variableId: colIndex,
                value: entry.val,
                label: entry.label
            })) : [];

        let missingValueSpec: MissingValuesSpec | null = null;
        const rawMissing = varInfo.missing;
        if (rawMissing !== null && rawMissing !== undefined) {
            if (typeof rawMissing === 'object' && !Array.isArray(rawMissing) && (rawMissing.hasOwnProperty('min') || rawMissing.hasOwnProperty('max'))) {
                const range: MissingRange = {};
                if (rawMissing.min !== undefined && typeof rawMissing.min === 'number') range.min = rawMissing.min;
                if (rawMissing.max !== undefined && typeof rawMissing.max === 'number') range.max = rawMissing.max;
                if (Object.keys(range).length > 0) missingValueSpec = { range };
            } else if (Array.isArray(rawMissing)) {
                const discreteValues = rawMissing.filter(v => typeof v === 'string' || typeof v === 'number');
                if (discreteValues.length > 0) missingValueSpec = { discrete: discreteValues };
            } else if (typeof rawMissing === 'string' || typeof rawMissing === 'number') {
                missingValueSpec = { discrete: [rawMissing] };
            }
        }

        return {
            tempId,
            columnIndex: colIndex,
            name: variableName,
            type: mapSPSSTypeToInterface(formatType),
            width: mapSPSSTypeToInterface(formatType) === 'DATE'
                ? 10
                : varInfo.printFormat?.width || (isString ? 80 : 8),
            decimals: varInfo.printFormat?.nbdec ?? (isString ? 0 : (varInfo.type === 0 ? 2 : 0)),
            label: varInfo.label || "",
            values: values,
            missing: missingValueSpec,
            columns: (varInfo.writeFormat?.width || varInfo.printFormat?.width || 8) * 8,
            align: isString ? "left" : "right",
            measure: toVariableMeasure(varInfo.measurementLevel),
            role: "input"
        };
    });

    const dataMatrix = Array(numCases).fill(null).map((_, rowIndex) => {
        const rowData = dataRowsRaw[rowIndex] || {};
        return Array(numVars).fill(null).map((_, colIndex) => {
            const variable = variables[colIndex];
            const colName = variable?.name;
            const rawDataValue = (colName && rowData.hasOwnProperty(colName)) ? rowData[colName] : null;
            return processCellData(rawDataValue, variable);
        });
    });

    return { variables, dataMatrix, metaHeader };
} 