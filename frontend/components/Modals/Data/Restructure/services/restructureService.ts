import type { DataRow } from "@/types/Data";
import type { Variable } from "@/types/Variable";
import type { RestructureConfig} from "../types";
import { RestructureMethod } from "../types";

/**
 * Entry point for restructuring data and variables.
 */
export function restructureData(
  data: DataRow[],
  variables: Variable[],
  config: RestructureConfig
): { data: DataRow[]; variables: Variable[] } {
  switch (config.method) {
    case RestructureMethod.VariablesToCases:
      return wideToLong(data, variables, config);
    case RestructureMethod.CasesToVariables:
      return longToWide(data, variables, config);
    case RestructureMethod.TransposeAllData:
      return transposeAll(data, variables);
    default:
      throw new Error(`Unknown restructure method: ${config.method}`);
  }
}

/**
 * Convert wide format to long format (Variables to Cases).
 */
function wideToLong(
  data: DataRow[],
  variables: Variable[],
  config: RestructureConfig
): { data: DataRow[]; variables: Variable[] } {
  const origIdxVars = config.indexVariables.map(iv => {
    const o = variables.find(v => v.columnIndex === iv.columnIndex);
    if (!o) throw new Error(`Index variable not found: ${iv.name}`);
    return o;
  });
  const origStubVars = config.selectedVariables.map(sv => {
    const o = variables.find(v => v.columnIndex === sv.columnIndex);
    if (!o) throw new Error(`Selected variable not found: ${sv.name}`);
    return o;
  });
  const { createIndex, createCount } = config.options;

  const newVars: Variable[] = [];
  origIdxVars.forEach(v => newVars.push({ ...v, columnIndex: newVars.length }));
  const stubVar = origStubVars[0];
  newVars.push({ ...stubVar, columnIndex: newVars.length, name: "value" });

  if (createIndex) {
    newVars.push({
      ...stubVar,
      columnIndex: newVars.length,
      id: undefined,
      tempId: undefined,
      name: "variable",
      type: "STRING",
      width: 64,
      decimals: 0,
      label: "",
      values: [],
      missing: null,
      columns: stubVar.columns,
      align: "left",
      measure: stubVar.measure === "scale" ? "nominal" : stubVar.measure,
      role: stubVar.role,
    });
  }
  if (createCount) {
    newVars.push({
      ...stubVar,
      columnIndex: newVars.length,
      id: undefined,
      tempId: undefined,
      name: "count",
      type: "NUMERIC",
      width: stubVar.width,
      decimals: 0,
      label: "",
      values: [],
      missing: null,
      columns: stubVar.columns,
      align: "right",
      measure: "scale",
      role: stubVar.role,
    });
  }

  const newData: DataRow[] = [];
  data.forEach(row => {
    const countNonMissing = origStubVars.reduce(
      (acc, v) => acc + ((row[v.columnIndex] !== "" && row[v.columnIndex] != null) ? 1 : 0),
      0
    );
    origStubVars.forEach(v => {
      const newRow: DataRow = [];
      origIdxVars.forEach(iv => newRow.push(row[iv.columnIndex]));
      newRow.push(row[v.columnIndex]);
      if (createIndex) newRow.push(v.name);
      if (createCount) newRow.push(countNonMissing);
      newData.push(newRow);
    });
  });

  return { data: newData, variables: newVars };
}

/**
 * Convert long format to wide format (Cases to Variables).
 */
function longToWide(
  data: DataRow[],
  variables: Variable[],
  config: RestructureConfig
): { data: DataRow[]; variables: Variable[] } {
  const origStubVars = config.selectedVariables.map(sv => {
    const o = variables.find(v => v.columnIndex === sv.columnIndex);
    if (!o) throw new Error(`Selected variable not found: ${sv.name}`);
    return o;
  });
  const origIdVar = variables.find(v => v.columnIndex === config.identifierVariables[0].columnIndex);
  if (!origIdVar) throw new Error(`Identifier variable not found: ${config.identifierVariables[0].name}`);
  const dropEmpty = config.options.dropEmptyVariables;

  const groupVars = variables.filter(
    v => !config.selectedVariables.some(s => s.columnIndex === v.columnIndex) &&
         !config.identifierVariables.some(i => i.columnIndex === v.columnIndex)
  );
  const groupCols = groupVars.map(v => v.columnIndex);

  const map = new Map<string, { keyValues: DataRow; values: Map<string | number | null, DataRow> }>();
  data.forEach(row => {
    const keyValues = groupCols.map(ci => row[ci]);
    const key = JSON.stringify(keyValues);
    if (!map.has(key)) map.set(key, { keyValues, values: new Map<string | number | null, DataRow>() });

    const idValue = row[origIdVar.columnIndex];
    const stubValues = origStubVars.reduce((acc, v) => {
        acc[v.columnIndex] = row[v.columnIndex];
        return acc;
    }, {} as DataRow);
    
    const mapEntry = map.get(key);
    if (mapEntry) {
      mapEntry.values.set(idValue, stubValues);
    }
  });

  const uniqueIds = Array.from(new Set(data.map(r => r[origIdVar.columnIndex])))
    .filter(id => id !== null && id !== undefined && id !== "")
    .sort((a,b)=> String(a).localeCompare(String(b)));

  const newVars: Variable[] = [];
  groupVars.forEach((v, index) => {
    newVars.push({ ...v, columnIndex: index });
  });

  const existingNames = new Set(newVars.map(v => v.name));

  uniqueIds.forEach(uid => {
    origStubVars.forEach(stubVar => {
      const { id, ...restOfStubVar } = stubVar; // Exclude the original id
      const safeUid = String(uid).replace(/[^a-zA-Z0-9_]/g, '_');
      const baseName = `${restOfStubVar.name}_${safeUid}`;
      let finalName = baseName;
      let counter = 1;
      while (existingNames.has(finalName)) {
        finalName = `${baseName}_${counter}`;
        counter++;
      }
      existingNames.add(finalName);
      newVars.push({ ...restOfStubVar, columnIndex: newVars.length, name: finalName });
    });
  });

  const newData: DataRow[] = [];
  map.forEach(({ keyValues, values }) => {
    const row: DataRow = [...keyValues];
    uniqueIds.forEach(uid => {
      const stubValues = values.get(uid);
      origStubVars.forEach(stubVar => {
        row.push(stubValues ? stubValues[stubVar.columnIndex] : "");
      });
    });
    newData.push(row);
  });

  if (dropEmpty) {
    const dropIndices: number[] = [];
    for (let i = groupVars.length; i < newVars.length; i++) {
      const columnValues = newData.map(r => r[i]);
      const allMissing = columnValues.every(value => {
        return value === "" || value === null || value === undefined;
      });
      if (allMissing) {
        dropIndices.push(i);
      }
    }
    // Sort in descending order to remove from right to left
    dropIndices.sort((a, b) => b - a).forEach(i => {
      newVars.splice(i, 1);
      newData.forEach(r => r.splice(i, 1));
    });
    // Update column indices after removal
    newVars.forEach((v, idx) => (v.columnIndex = idx));
  }

  return { data: newData, variables: newVars };
}

/**
 * Transpose all data: swap rows and columns.
 */
function transposeAll(
  data: DataRow[],
  variables: Variable[]
): { data: DataRow[]; variables: Variable[] } {
  const rows = data.length;
  const cols = rows > 0 ? data[0].length : 0;
  const newData: DataRow[] = [];
  for (let c = 0; c < cols; c++) {
    const row: DataRow = [];
    for (let r = 0; r < rows; r++) {
      row.push(data[r][c]);
    }
    newData.push(row);
  }
  const newVars: Variable[] = [];
  const varCount = newData[0]?.length ?? 0;
  for (let i = 0; i < varCount; i++) {
    newVars.push({
      columnIndex: i,
      name: `V${i + 1}`,
      type: "STRING",
      width: 64,
      decimals: 0,
      label: "",
      values: [],
      missing: null,
      columns: variables.length,
      align: "left",
      measure: "unknown",
      role: "input",
    });
  }
  return { data: newData, variables: newVars };
}