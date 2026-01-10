import type { Variable } from "@/types/Variable";

interface TransposeResult {
    transposedData: (string | number)[][];
    finalTransposedVariables: Variable[];
}

const processVariableName = (name: string, existingVars: Variable[]): string => {
    let processedName = name || "Var1";
    if (!/^[a-zA-Z@#$]/.test(processedName)) {
        processedName = `var_${  processedName}`;
    }
    processedName = processedName
        .replace(/[^a-zA-Z0-9@#$_.]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/\.$/, '_');
    if (processedName.length > 64) {
        processedName = processedName.substring(0, 64);
    }
    const existingNames = existingVars.map(v => v.name.toLowerCase());
    if (existingNames.includes(processedName.toLowerCase())) {
        let counter = 1;
        let uniqueName = processedName;
        while (existingNames.includes(uniqueName.toLowerCase())) {
            uniqueName = `${processedName.substring(0, Math.min(60, processedName.length))}_${counter}`;
            counter++;
        }
        processedName = uniqueName;
    }
    return processedName;
};

export const transposeDataService = (
    data: (string | number)[][],
    variablesToTranspose: Variable[],
    nameVariable: Variable | null
): TransposeResult => {
    if (variablesToTranspose.length === 0) {
        return { transposedData: [], finalTransposedVariables: [] };
    }

    const transposedData: (string | number)[][] = [];
    const newBaseVariables: Variable[] = [];

    const caseLabelVariable: Variable = {
        columnIndex: 0,
        name: "case_lbl",
        type: "STRING",
        width: 64,
        decimals: 0,
        label: "Original Variable Name",
        columns: 72,
        align: "left",
        measure: "nominal",
        role: "input",
        values: [],
        missing: null
    };
    newBaseVariables.push(caseLabelVariable);

    const caseCount = data.length;
    const newColVariables: Variable[] = [];
    for (let i = 0; i < caseCount; i++) {
        let varName: string;
        if (nameVariable && data[i]?.[nameVariable.columnIndex] !== undefined) {
            const nameValue = data[i][nameVariable.columnIndex];
            varName = (typeof nameValue === 'number') ? `V${nameValue}` : String(nameValue);
        } else {
            varName = `Var${i + 1}`;
        }
        varName = processVariableName(varName, [...newBaseVariables, ...newColVariables]);
        const newVar: Variable = {
            columnIndex: i + 1,
            name: varName,
            type: "NUMERIC",
            width: 8,
            decimals: 2,
            label: "",
            columns: 72,
            align: "right",
            measure: "scale",
            role: "input",
            values: [],
            missing: null
        };
        newColVariables.push(newVar);
    }
    const finalTransposedVariables = [...newBaseVariables, ...newColVariables];

    for (let varIdx = 0; varIdx < variablesToTranspose.length; varIdx++) {
        const variable = variablesToTranspose[varIdx];
        const newRow: (string | number)[] = [variable.name];
        for (let caseIdx = 0; caseIdx < caseCount; caseIdx++) {
            newRow.push(data[caseIdx]?.[variable.columnIndex] ?? "");
        }
        transposedData.push(newRow);
    }

    return { transposedData, finalTransposedVariables };
}; 