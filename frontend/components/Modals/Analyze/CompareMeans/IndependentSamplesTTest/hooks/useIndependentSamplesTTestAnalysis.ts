import { useState, useCallback, useRef, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useDataStore } from '@/stores/useDataStore';

import {
    IndependentSamplesTTestAnalysisProps,
    IndependentSamplesTTestResult
} from '../types';

import {
    formatGroupStatisticsTable,
    formatIndependentSamplesTestTable,
} from '../utils/formatters';

export const useIndependentSamplesTTestAnalysis = ({
    testVariables,
    groupingVariable,
    defineGroups,
    group1,
    group2,
    cutPointValue,
    estimateEffectSize,
    onClose
}: IndependentSamplesTTestAnalysisProps) => {
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const { data: analysisData } = useAnalysisData();

    const workerRef = useRef<Worker | null>(null);

    const resultsRef = useRef<IndependentSamplesTTestResult[]>([]);
    const errorCountRef = useRef<number>(0);
    const processedCountRef = useRef<number>(0);
    const insufficientDataVarsRef = useRef<{ variableName: string, variableLabel: string, insufficientType: string[] }[]>([]);
    
    const runAnalysis = useCallback(async (): Promise<void> => {
        setIsCalculating(true);
        setErrorMsg(null);

        try {
            await useDataStore.getState().checkAndSave();
        } catch (e: any) {
            setErrorMsg(`Failed to save pending changes: ${e.message}`);
            setIsCalculating(false);
            return;
        }

        // Reset refs for new analysis run
        resultsRef.current = [];
        errorCountRef.current = 0;
        processedCountRef.current = 0;
        insufficientDataVarsRef.current = [];

        const worker = new Worker('/workers/CompareMeans/manager.js', { type: 'module' });
        workerRef.current = worker;

        let analysisTypes;
        if (estimateEffectSize) {
            analysisTypes = ['independentSamplesTTest'];
            // analysisTypes = ['independentSamplesTTest', 'effectSize'];
        } else {
            analysisTypes = ['independentSamplesTTest'];
        }

        testVariables.forEach(variable => {
            const dataForVar = analysisData.map(row => row[variable.columnIndex]);
            const dataForGroupingVar = analysisData.map(row => row[groupingVariable!.columnIndex]);
            const payload = {
                analysisType: analysisTypes,
                variable1: variable,
                data1: dataForVar,
                variable2: groupingVariable,
                data2: dataForGroupingVar,
                options: { defineGroups, group1, group2, cutPointValue, estimateEffectSize }
            };
            // console.log("payload", JSON.stringify(payload));
            worker.postMessage(payload);
        });

        worker.onmessage = async (event) => {
            const { variableName, results, status, error: workerError } = event.data;

            if (status === 'success' && results) {
                // Check for metadata about insufficient data
                if (results.metadata && results.metadata.hasInsufficientData) {
                    insufficientDataVarsRef.current.push({variableName: results.metadata.variableName, variableLabel: results.metadata.variableLabel, insufficientType: results.metadata.insufficientType});
                    // console.warn(`Insufficient valid data for variable: ${results.metadata.variableLabel || results.metadata.variableName}. Insufficient type: ${results.metadata.insufficientType.join(', ')}`);
                }
                resultsRef.current.push(results);
            } else {
                console.error(`Error processing ${variableName}:`, workerError);
                const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                errorCountRef.current += 1;
            }

            processedCountRef.current += 1;

            if (processedCountRef.current === testVariables.length) {
                // if (resultsRef.current.length > 0) {
                    try {
                        // console.log("resultsRef.current", JSON.stringify(resultsRef.current));
                        // Format tables
                        const formattedGroupStatisticsTable = formatGroupStatisticsTable(resultsRef.current, groupingVariable!.label || groupingVariable!.name);
                        const formattedIndependentSamplesTestTable = formatIndependentSamplesTestTable(resultsRef.current);
                        // const formattedIndependentSamplesEffectSizeTable = formatEffectSizeTable(results);
                        
                        // console.log("formattedIndependentSamplesTestTable", JSON.stringify(formattedIndependentSamplesTestTable));

                        const variableNames = testVariables.map(v => v.name);
                        let logMsg = `T-TEST`;

                        if (defineGroups.useSpecifiedValues) {
                            logMsg += ` GROUPS=${groupingVariable!.name}(${group1} ${group2}) {VARIABLES=${variableNames.join(" ")}}`;
                        } else {
                            logMsg += ` GROUPS=${groupingVariable!.name}(${cutPointValue}) {VARIABLES=${variableNames.join(" ")}}`;
                        }

                        // Only add tests that are enabled
                        if (estimateEffectSize) {
                            logMsg += `{ES DISPLAY (TRUE)}`;
                        } else {
                            logMsg += `{ES DISPLAY (FALSE)}`;
                        }

                        logMsg += `{CRITERIA=0.95}`;

                        const logId = await addLog({ log: logMsg });

                        // Prepare note about insufficient data if needed
                        let independentSamplesStatisticsNote = "";
                        if (insufficientDataVarsRef.current.length > 0) {
                            independentSamplesStatisticsNote += "Note: ";
                            const typeToVars: Record<string, string[]> = {};
                            for (const { variableName, variableLabel, insufficientType } of insufficientDataVarsRef.current) {
                                for (const type of insufficientType) {
                                    if (!typeToVars[type]) typeToVars[type] = [];
                                    typeToVars[type].push(variableLabel || variableName);
                                }
                            }
                            if (typeToVars["empty"] && typeToVars["empty"].length > 0) {
                                independentSamplesStatisticsNote += `[t cannot be computed for variable(s): ${typeToVars["empty"].join(", ")}. At least one of the groups is empty.]`;
                            }
                            if (typeToVars["stdDev"] && typeToVars["stdDev"].length > 0) {
                                independentSamplesStatisticsNote += `[t cannot be computed for variable(s): ${typeToVars["stdDev"].join(", ")}. The standard deviation of both groups is 0.]`;
                            }
                        }

                        let note = "";
                        if (insufficientDataVarsRef.current.length === testVariables.length) {
                            note = "Note: The Independent Samples Test table is not produced because all variables have insufficient data.";
                        }

                        const analyticId = await addAnalytic(logId, { title: "T-Test", note: note || undefined });

                        // Add group statistics table
                        await addStatistic(analyticId, {
                            title: "Group Statistics",
                            output_data: JSON.stringify({ tables: [formattedGroupStatisticsTable] }),
                            components: "Group Statistics",
                            description: independentSamplesStatisticsNote
                        });

                        // Add test statistics table
                        if (insufficientDataVarsRef.current.length < testVariables.length) {
                            await addStatistic(analyticId, {
                                title: "Independent Samples Test",
                                output_data: JSON.stringify({ tables: [formattedIndependentSamplesTestTable] }),
                                components: "Independent Samples Test",
                                description: ""
                            });
                        }

                        if (onClose) {
                            onClose();
                        }
                    } catch (err) {
                        console.error("Error saving results:", err);
                        setErrorMsg("Error saving results.");
                    }
                // }

                setIsCalculating(false);
                worker.terminate();
                workerRef.current = null;
                if (errorCountRef.current === 0) {
                    onClose?.();
                }
            }
        };

        worker.onerror = (err) => {
            console.error("A critical worker error occurred:", err);
            setErrorMsg(`A critical worker error occurred: ${err.message}`);
            setIsCalculating(false);
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
        };
    }, [testVariables, groupingVariable, defineGroups, group1, group2, cutPointValue, estimateEffectSize, addLog, addStatistic, addAnalytic, analysisData, onClose]);

    const cancelCalculation = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
            setIsCalculating(false);
            console.log("Independent Samples T-Test calculation cancelled.");
        }
    }, []);
    
    useEffect(() => {
        return () => {
            cancelCalculation();
        };
    }, [cancelCalculation]);
    
    return {
        isCalculating,
        errorMsg,
        runAnalysis,
        cancelCalculation
    };
}; 

export default useIndependentSamplesTTestAnalysis; 