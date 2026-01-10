import { Variable } from "@/types/Variable";

type VariableType = {
    dataVariables: string[][];
    variables: Variable[];
    selectedVariables: string[] | string | null;
};

export function getMaxIndex({
    dataVariables,
    variables,
    selectedVariables,
}: VariableType) {
    if (!selectedVariables) return 0;
    let maxIndex = -1;

    dataVariables.forEach((row, rowIndex) => {
        let hasData = false;

        for (const varName of Array.isArray(selectedVariables)
            ? selectedVariables
            : [selectedVariables]) {
            const varDef = variables.find((v) => v.name === varName);
            if (!varDef) continue;

            const rawValue = row[varDef.columnIndex];

            if (
                rawValue !== undefined &&
                rawValue !== null &&
                rawValue !== ""
            ) {
                hasData = true;
                break;
            }
        }

        if (hasData) maxIndex = rowIndex;
    });

    if (maxIndex < 0) maxIndex = 0;
    return maxIndex;
}

export function getSlicedData({
    dataVariables,
    variables,
    selectedVariables,
}: VariableType) {
    if (!selectedVariables) return [];

    const names = Array.isArray(selectedVariables)
        ? selectedVariables
        : [selectedVariables];
    const maxIndex = getMaxIndex({
        dataVariables,
        variables,
        selectedVariables: names,
    });
    const newSlicedData: Record<string, string | number | null>[][] = [];

    names.forEach((varName) => {
        const slicedDataForVar: Record<string, string | number | null>[] = [];

        for (let i = 0; i <= maxIndex; i++) {
            const row = dataVariables[i];
            const rowObj: Record<string, string | number | null> = {};

            const varDef = variables.find((v) => v.name === varName);
            if (varDef) {
                const rawValue = row[varDef.columnIndex];
                const stringValue =
                    rawValue === null || rawValue === undefined
                        ? ""
                        : String(rawValue);
                const num = parseFloat(stringValue.replace(",", "."));
                rowObj[varName] = isNaN(num)
                    ? stringValue === ""
                        ? null
                        : stringValue
                    : num;
            }

            slicedDataForVar.push(rowObj);
        }

        newSlicedData.push(slicedDataForVar);
    });

    return newSlicedData;
}

export function getVarDefs(
    variables: Variable[],
    selectedVariables: string[] | string | null
) {
    if (!selectedVariables) return [];

    const names = Array.isArray(selectedVariables)
        ? selectedVariables
        : [selectedVariables];
    const newVarDefs: any[][] = [];

    names.forEach((varName) => {
        const varDef = variables.find((v) => v.name === varName);
        const varDefObj = {
            id: varDef?.id,
            columnIndex: varDef?.columnIndex ?? 0,
            name: varDef?.name ?? "",
            type: varDef?.type ?? "STRING",
            width: varDef?.width ?? 0,
            decimals: varDef?.decimals ?? 0,
            label: varDef?.label ?? "",
            values: varDef?.values ?? [],
            missing: varDef?.missing ?? [],
            columns: varDef?.columns ?? 0,
            align: varDef?.align ?? "left",
            measure: varDef?.measure ?? "unknown",
            role: varDef?.role ?? "none",
        };

        newVarDefs.push([varDefObj]);
    });

    return newVarDefs;
}
