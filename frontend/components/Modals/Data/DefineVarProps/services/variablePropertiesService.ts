import type { Variable, MissingValuesSpec } from "@/types/Variable";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";

/**
 * Checks if a value is considered missing based on a variable's missing value specification.
 */
const isMissingValueForSuggestion = (
    value: number | string | undefined | null,
    missingSpec: MissingValuesSpec | null
): boolean => {
    if (value === undefined || value === null || String(value).trim() === "" || missingSpec === null) {
        return false;
    }
    const strValue = String(value);
    if (missingSpec.discrete?.some(mv => String(mv) === strValue)) {
        return true;
    }
    if (missingSpec.range && typeof value === 'number') {
        const { min, max } = missingSpec.range;
        if (min !== undefined && max !== undefined && value >= min && value <= max) return true;
        if (min !== undefined && max === undefined && value >= min) return true;
        if (min === undefined && max !== undefined && value <= max) return true;
    }
    return false;
};

/**
 * Gets unique values and their counts from the dataset for a specific variable.
 */
export const getUniqueValuesWithCounts = (
    data: any[][],
    columnIndex: number,
    variableType: string,
    caseLimit: string,
    valueLimit: string
): { value: string; count: number }[] => {
    if (!data || data.length === 0) return [];
    
    const casesToScan = parseInt(caseLimit, 10) || data.length;
    const dataToScan = data.slice(0, casesToScan);
    
    const columnValues = dataToScan
        .map(row => row[columnIndex])
        .filter(value => {
            if (variableType === "STRING") return value !== undefined;
            return value !== "" && value !== undefined && value !== null;
        });

    const valueCounts: Record<string, number> = {};
    columnValues.forEach(value => {
        const strValue = String(value);
        valueCounts[strValue] = (valueCounts[strValue] || 0) + 1;
    });

    const uniqueValues = Object.entries(valueCounts).map(([val, count]) => ({ value: val, count }));
    const limit = parseInt(valueLimit, 10) || uniqueValues.length;
    
    return uniqueValues.slice(0, limit);
};

/**
 * Analyzes a variable's data and suggests an appropriate measurement level.
 */
export const suggestMeasurementLevel = (
    data: any[][],
    variable: Variable,
    caseLimit: string
): { level: string; explanation: string } => {
    if (!data || data.length === 0) {
        return { level: "nominal", explanation: "Not enough data to suggest." };
    }

    const columnIndex = variable.columnIndex;
    const casesToScan = parseInt(caseLimit, 10) || data.length;
    const dataToScan = data.slice(0, casesToScan);

    const columnValues = dataToScan
        .map(row => row[columnIndex])
        .filter(value => !isMissingValueForSuggestion(value, variable.missing));
    
    if (columnValues.length === 0) {
        return { level: "nominal", explanation: "No valid (non-missing) values found." };
    }

    const uniqueValues = new Set(columnValues.map(v => String(v).trim()));
    const uniqueCount = uniqueValues.size;
    const allNumeric = columnValues.every(v => String(v).trim() !== "" && !isNaN(Number(String(v).trim())));
    const allIntegers = allNumeric && columnValues.every(v => Number.isInteger(Number(String(v).trim())));

    if (!allNumeric) return { level: "nominal", explanation: "Contains non-numeric values." };
    if (uniqueCount <= 2) return { level: "nominal", explanation: `Only ${uniqueCount} unique values, suggests binary/nominal.` };
    if (uniqueCount <= 10 && allIntegers) return { level: "ordinal", explanation: `Few unique integers (${uniqueCount}), suggests ordered categories.` };
    
    const labeledValuesCount = (variable.values || []).length;
    if (uniqueCount > 0) {
        const percentLabeled = (labeledValuesCount / uniqueCount) * 100;
        if (percentLabeled > 50 && uniqueCount <= 20) return { level: "nominal", explanation: `Many values labeled (${percentLabeled.toFixed(0)}%), suggests nominal.` };
    }
    
    return { level: "scale", explanation: "Numeric with diverse values, suggests scale." };
};

/**
 * Saves the updated properties for a list of variables to the global store.
 */
export const saveVariableProperties = async (
    modifiedVariables: Variable[],
    originalVariables: Variable[],
    updateMultipleFields: (identifier: number | string, changes: Partial<Variable>) => Promise<void>
): Promise<void> => {
    const updatesToApply = modifiedVariables.filter(modVar => {
        const origVar = originalVariables.find(ov => ov.tempId === modVar.tempId);
        return origVar && JSON.stringify(origVar) !== JSON.stringify(modVar);
    });

    for (const modifiedVariable of updatesToApply) {
        const { tempId, values, missing, name, label, type, width, decimals, role, measure, ...rest } = modifiedVariable;
        const updatePayload: Partial<Variable> = { values, missing, name, label, type, width, decimals, role, measure };
        await updateMultipleFields(modifiedVariable.columnIndex, updatePayload);
    }
}; 