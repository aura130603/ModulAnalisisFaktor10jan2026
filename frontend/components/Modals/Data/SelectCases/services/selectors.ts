import type { Variable } from "@/types/Variable";
import { evaluateCondition } from "./evaluator";

export interface RandomSampleConfig {
  sampleType: "approximate" | "exact";
  percentage?: number;
  exactCount?: number;
  fromFirstCount?: number;
}

export interface RangeConfig {
  firstCase?: string;
  lastCase?: string;
}

/**
 * Selects cases based on a condition expression
 * @param data Array of data rows
 * @param variables Array of variables with column mappings
 * @param expression Condition expression to evaluate
 * @returns Array of indices for rows that satisfy the condition
 */
export function selectByCondition(data: any[][], variables: Variable[], expression: string): number[] {
  if (!expression.trim()) return [];
  
  const selectedIndices: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    try {
      if (evaluateCondition(expression, row, variables)) {
        selectedIndices.push(i);
      }
    } catch (error) {
      console.error(`Error evaluating condition for row ${i}:`, error);
    }
  }
  
  return selectedIndices;
}

/**
 * Selects a random sample of cases
 * @param data Array of data rows
 * @param config Random sample configuration
 * @returns Array of indices for selected rows
 */
export function selectRandomSample(data: any[][], config: RandomSampleConfig): number[] {
  const totalCases = data.length;
  if (totalCases === 0) return [];
  
  const selectedIndices: number[] = [];
  
  if (config.sampleType === "approximate" && config.percentage) {
    const sampleSize = Math.round((config.percentage / 100) * totalCases);
    const indices = Array.from({ length: totalCases }, (_, i) => i);
    
    // Fisher-Yates shuffle and take first n elements
    for (let i = 0; i < sampleSize && indices.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * indices.length);
      selectedIndices.push(indices[randomIndex]);
      indices.splice(randomIndex, 1);
    }
  } else if (config.sampleType === "exact" && config.exactCount) {
    const maxIndex = config.fromFirstCount
      ? Math.min(config.fromFirstCount, totalCases)
      : totalCases;
      
    const indices = Array.from({ length: maxIndex }, (_, i) => i);
    const sampleSize = Math.min(config.exactCount, maxIndex);
    
    // Fisher-Yates shuffle and take first n elements
    for (let i = 0; i < sampleSize && indices.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * indices.length);
      selectedIndices.push(indices[randomIndex]);
      indices.splice(randomIndex, 1);
    }
  }
  
  return selectedIndices;
}

/**
 * Selects cases based on a range of indices
 * @param data Array of data rows
 * @param range Range configuration
 * @returns Array of indices for rows in the specified range
 */
export function selectByRange(data: any[][], range: RangeConfig): number[] {
  const totalCases = data.length;
  if (totalCases === 0) return [];
  
  const firstCase = range.firstCase ? parseInt(range.firstCase) - 1 : 0;
  const lastCase = range.lastCase ? parseInt(range.lastCase) - 1 : totalCases - 1;
  
  if (firstCase < 0 || lastCase >= totalCases || firstCase > lastCase) {
    console.error("Invalid case range specified");
    return [];
  }
  
  return Array.from({ length: lastCase - firstCase + 1 }, (_, i) => firstCase + i);
}

/**
 * Selects cases based on filter variable values
 * @param data Array of data rows
 * @param variables Array of variables with column mappings
 * @param filterVarIndex Index of the filter variable
 * @returns Array of indices for rows where filter variable has non-zero/non-empty value
 */
export function selectByFilterVariable(data: any[][], variables: Variable[], filterVar: Variable): number[] {
  if (!filterVar) return [];
  const filterVarIndex = filterVar.columnIndex;
  
  const selectedIndices: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (filterVarIndex < data[i].length) {
      const value = data[i][filterVarIndex];
      if (value !== 0 && value !== "" && value !== null && value !== undefined) {
        selectedIndices.push(i);
      }
    }
  }
  
  return selectedIndices;
} 