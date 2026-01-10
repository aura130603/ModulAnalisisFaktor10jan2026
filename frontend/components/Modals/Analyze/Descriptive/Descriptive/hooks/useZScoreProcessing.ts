import { useCallback } from 'react';
import type { Variable } from '@/types/Variable';
import { useDataStore, type CellUpdate } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import type { ZScoreData } from '../types';

interface ZScoreProcessingParams {
    setErrorMsg: (message: string | ((prev: string | null) => string)) => void;
}

/**
 * Isolated hook to handle all logic related to
 * processing and storing Z-score data received from worker.
 */
export const useZScoreProcessing = ({ setErrorMsg }: ZScoreProcessingParams) => {
    const processZScoreData = useCallback(async (zScoreData: ZScoreData | null): Promise<number> => {
        if (!zScoreData) return 0;

        const newVariableDefinitions: Partial<Variable>[] = [];
        const updatesForNewVars: CellUpdate[] = [];
        const updatesForExistingVars: CellUpdate[] = [];
        const currentVariables = useVariableStore.getState().variables;
        const variableMap = new Map(currentVariables.map(v => [v.name, v]));
        let nextColumnIndex = currentVariables.length > 0
            ? Math.max(...currentVariables.map(v => v.columnIndex)) + 1
            : 0;

        for (const varName in zScoreData) {
            const zData = zScoreData[varName];
            if (!zData) continue;

            if (zData.error) {
                const errorMsg = `Could not create Z-score for '${varName}': ${zData.error}`;
                console.warn(errorMsg);
                setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                continue;
            }

            if (!zData.scores || !zData.variableInfo) continue;

            const newVarName = zData.variableInfo.name;
            const existingVar = variableMap.get(newVarName);

            if (existingVar) {
                // The Z-score variable already exists. Stage its cell updates.
                zData.scores.forEach((zScore, rowIndex) => {
                    if (zScore !== "" && zScore !== null && zScore !== undefined) {
                        updatesForExistingVars.push({ row: rowIndex, col: existingVar.columnIndex, value: zScore as string | number });
                    }
                });
            } else {
                // This is a new Z-score variable. Stage its definition and cell updates.
                const variableInfo: Partial<Variable> = {
                    ...zData.variableInfo,
                    columnIndex: nextColumnIndex,
                    align: "right",
                    role: "input",
                    columns: 72,
                };
                newVariableDefinitions.push(variableInfo);

                zData.scores.forEach((zScore, rowIndex) => {
                    if (zScore !== "" && zScore !== null && zScore !== undefined) {
                        updatesForNewVars.push({ row: rowIndex, col: nextColumnIndex, value: zScore as string | number });
                    }
                });
                nextColumnIndex++;
            }
        }

        // Atomically create the new variables and insert their data in one operation.
        if (newVariableDefinitions.length > 0) {
            await useVariableStore.getState().addVariables(newVariableDefinitions, updatesForNewVars);
        }

        // Update cells for any Z-score variables that already existed.
        if (updatesForExistingVars.length > 0) {
            await useDataStore.getState().updateCells(updatesForExistingVars);
        }

        return newVariableDefinitions.length;
    }, [setErrorMsg]);

    return { processZScoreData };
};