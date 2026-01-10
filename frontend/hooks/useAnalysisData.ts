import { useMemo } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { useMetaStore } from '@/stores/useMetaStore';
import type { Variable } from '@/types/Variable';
import type { DataRow } from '@/types/Data';

/**
 * Interface for the return value of useAnalysisData.
 */
export interface AnalysisData {
  /** The processed data, filtered by the active 'select case' variable. */
  data: DataRow[];
  /** An array of weights corresponding to each row in `data`. Defaults to 1 if no weight variable is set. */
  weights: number[];
  /** The variable currently used for filtering ('select case'). */
  filterVariable?: Variable;
  /** The variable currently used for weighting. */
  weightVariable?: Variable;
}

/**
 * A centralized hook to get data for statistical analysis.
 * It automatically applies 'select case' (filtering) and 'weight' logic
 * based on the global settings in `useMetaStore`.
 *
 * @returns {AnalysisData} An object containing the filtered data, corresponding weights, and the variables used.
 */
export function useAnalysisData(): AnalysisData {
  const allData = useDataStore(state => state.data);
  const variables = useVariableStore(state => state.variables);
  const { filter: filterVarName, weight: weightVarName } = useMetaStore(state => state.meta);

  const filterVariable = useMemo(() => 
    variables.find(v => v.name === filterVarName),
    [variables, filterVarName]
  );
  
  const weightVariable = useMemo(() =>
    variables.find(v => v.name === weightVarName),
    [variables, weightVarName]
  );

  const filteredData = useMemo(() => {
    if (!filterVariable) {
      return allData;
    }
    const filterColumnIndex = filterVariable.columnIndex;
    return allData.filter(row => {
      const value = row[filterColumnIndex];
      // A case is included if the filter variable value is not 0, empty, null, or undefined.
      return value !== 0 && value !== '' && value !== null && value !== undefined;
    });
  }, [allData, filterVariable]);

  const weights = useMemo(() => {
    return filteredData.map(row => {
      if (!weightVariable) {
        return 1; // Default weight is 1
      }
      const weightColumnIndex = weightVariable.columnIndex;
      const value = row[weightColumnIndex];
      
      if (typeof value === 'number' && !isNaN(value) && value > 0) {
        return value;
      }
      if (typeof value === 'string') {
        const num = parseFloat(value);
        if (!isNaN(num) && num > 0) {
          return num;
        }
      }
      // Cases with invalid, zero, or negative weights are typically excluded
      // from analysis by statistical procedures, but here we'll return 0
      // and let the specific procedure handle it.
      return 0;
    });
  }, [filteredData, weightVariable]);

  return {
    data: filteredData,
    weights,
    filterVariable,
    weightVariable
  };
} 