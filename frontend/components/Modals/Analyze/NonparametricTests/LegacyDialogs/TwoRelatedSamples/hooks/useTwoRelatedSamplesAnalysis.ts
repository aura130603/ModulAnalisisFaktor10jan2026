import { useState, useCallback, useRef, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useDataStore } from '@/stores/useDataStore';

import {
    TwoRelatedSamplesAnalysisProps,
    TwoRelatedSamplesResults,
    TwoRelatedSamplesResult
} from '../types';

import {
    formatDescriptiveStatisticsTable,
    formatRanksFrequenciesTable,
    formatTestStatisticsTable,
} from '../utils/formatters';

export const useTwoRelatedSamplesAnalysis = ({
    testVariables1,
    testVariables2,
    testType,
    displayStatistics,
    areAllPairsValid,
    hasDuplicatePairs,
    onClose
}: TwoRelatedSamplesAnalysisProps) => {
    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const { data: analysisData } = useAnalysisData();
    
    const [isCalculating, setIsCalculating] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    const workerRef = useRef<Worker | null>(null);
    const workerPostRef = useRef<number>(0);
    
    const resultsRef = useRef<TwoRelatedSamplesResult[]>([]);
    const errorCountRef = useRef<number>(0);
    const processedCountRef = useRef<number>(0);
    const insufficientDataVarsRef = useRef<{variable1Name: string, variable1Label: string, variable2Name: string, variable2Label: string, insufficientType: string[]}[]>([]);

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

        const worker = new Worker('/workers/NonparametricTests/manager.js', { type: 'module' });
        workerRef.current = worker;

        const uniqueVariables: typeof testVariables1 = [];
        const seen = new Set<string>();
        for (const v of [...testVariables1, ...testVariables2]) {
            const key = v.tempId || v.name || v.columnIndex.toString();
            if (!seen.has(key)) {
                uniqueVariables.push(v);
                seen.add(key);
            }
        }
        if (displayStatistics.descriptive || displayStatistics.quartiles) {
            for (const v of uniqueVariables) {
                const dataForVar1 = analysisData.map(row => row[v.columnIndex]);
                const payload = {
                    analysisType: ['descriptiveStatistics'],
                    variable1: v,
                    data1: dataForVar1,
                    options: { displayStatistics }
                };
                worker.postMessage(payload);
                workerPostRef.current += 1;
            }
        }
        
        for (let i = 0; i < testVariables1.length; i++) {
            const dataForVar1 = analysisData.map(row => row[testVariables1[i].columnIndex]);
            const dataForVar2 = analysisData.map(row => row[testVariables2[i].columnIndex]);
            const payload = {
                analysisType: ['twoRelatedSamples'],
                variable1: testVariables1[i],
                data1: dataForVar1,
                variable2: testVariables2[i],
                data2: dataForVar2,
                options: { testType, displayStatistics }
            };
            worker.postMessage(payload);
            workerPostRef.current += 1;
        }

        worker.onmessage = async (event) => {
            const { variableName, results, status, error: workerError } = event.data;

            if (status === 'success' && results) {
                // Check for insufficient data
                if (results.metadata && results.metadata.hasInsufficientData) {
                    insufficientDataVarsRef.current.push({variable1Name: results.metadata.variable1Name, variable1Label: results.metadata.variable1Label, variable2Name: results.metadata.variable2Name, variable2Label: results.metadata.variable2Label, insufficientType: results.metadata.insufficientType});
                    // console.warn(`Insufficient valid data for variable: ${results.metadata.variableLabel || results.metadata.variableName}. Insufficient type: ${results.metadata.insufficientType.join(', ')}`);
                }
                resultsRef.current.push(results);
            } else {
                console.error(`Error processing ${variableName}:`, workerError);
                const errorMsg = results === null 
                    ? `No results for ${variableName}`
                    : `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                errorCountRef.current += 1;
            }
            // console.log('[Results before] processedCountRef.current:', processedCountRef.current);
            processedCountRef.current += 1;
            // console.log('[Results after] processedCountRef.current:', processedCountRef.current);

            if (processedCountRef.current === workerPostRef.current) {
                if (resultsRef.current.length > 0) {
                    try {
                        // console.log('Results to format:', JSON.stringify(resultsRef.current));

                        // Prepare log message
                        const variableNames1 = testVariables1.map(v => v.name).join(" ");
                        const variableNames2 = testVariables2.map(v => v.name).join(" ");
                        let logMsg = `NPAR TEST`;


                        if (testType.wilcoxon) {
                            logMsg += `{WILCOXON=${variableNames1} WITH ${variableNames2} (PAIRED)}`;
                        }

                        if (testType.sign) {
                            logMsg += `{SIGN=${variableNames1} WITH ${variableNames2} (PAIRED)}`;
                        }

                        if (testType.mcNemar) {
                            logMsg += `{MCNEMAR=${variableNames1} WITH ${variableNames2} (PAIRED)}`;
                        }

                        if (testType.marginalHomogeneity) {
                            logMsg += `{MH=${variableNames1} WITH ${variableNames2} (PAIRED)}`;
                        }

                        if (displayStatistics?.descriptive || displayStatistics?.quartiles) {
                            logMsg += `{STATISTICS`;
                            if (displayStatistics.descriptive) logMsg += ` DESCRIPTIVES`;
                            if (displayStatistics.quartiles) logMsg += ` QUARTILES`;
                            logMsg += `}`;
                        }


                        // Save to database
                        const logId = await addLog({ log: logMsg });

                        let twoRelatedSamplesNote = "";
                        let note = "";
                        let typeToVars: Record<string, string[]> = {};
                        if (insufficientDataVarsRef.current.length > 0) {
                            twoRelatedSamplesNote += "Note: "; 
                            for (const { variable1Name, variable1Label, variable2Name, variable2Label, insufficientType } of insufficientDataVarsRef.current) {
                                for (const type of insufficientType) {
                                    if (!typeToVars[type]) typeToVars[type] = [];
                                    const key = `${variable1Label || variable1Name} and ${variable2Label || variable2Name}`;
                                    typeToVars[type].push(key);
                                }
                            }
                            if (typeToVars["empty"] && typeToVars["empty"].length > 0) {
                                let testNames = [];
                                if (testType.wilcoxon) testNames.push("Wilcoxon Signed Ranks Test");
                                if (testType.sign) testNames.push("Sign Test");
                                if (testNames.length > 0) {
                                    note += `Note: There are not enough valid cases to perform the ${testNames.join(" and ")} for ${typeToVars["empty"].join(", ")}. No statistics are computed.`;
                                }
                            }
                            if (typeToVars["no_difference"] && typeToVars["no_difference"].length > 0) {
                                twoRelatedSamplesNote += `The sum of negative ranks equals the sum of positive ranks for the pairs of ${typeToVars["no_difference"].join(", ")}.`;
                            }
                        }
                        const analyticId = await addAnalytic(logId, { title: "Two Related Samples Test", note: note || "" });



                        // Add descriptive statistics table
                        if (displayStatistics?.descriptive || displayStatistics?.quartiles) {
                            const formattedDescriptiveStatisticsTable = formatDescriptiveStatisticsTable(resultsRef.current, displayStatistics);
                            // console.log('Formatted descriptive statistics table:', JSON.stringify(formattedDescriptiveStatisticsTable));
                       
                            await addStatistic(analyticId, {
                                title: "Descriptive Statistics",
                                output_data: JSON.stringify({ tables: [formattedDescriptiveStatisticsTable] }),
                                components: "Descriptive Statistics",
                                description: ""
                            });
                        }

                        if (testType.wilcoxon && errorCountRef.current < testVariables1.length) {
                            const formattedRanksFrequenciesTable = formatRanksFrequenciesTable(resultsRef.current, "WILCOXON");
                            // console.log('Formatted frequencies ranks table:', JSON.stringify(formattedRanksFrequenciesTable));

                            await addStatistic(analyticId, {
                                title: "Ranks",
                                output_data: JSON.stringify({ tables: [formattedRanksFrequenciesTable] }),
                                components: "Wilcoxon Test",
                                description: ""
                            });

                            const formattedTestStatisticsTable = formatTestStatisticsTable(resultsRef.current, "WILCOXON");
                            // console.log('Formatted test statistics table:', JSON.stringify(formattedTestStatisticsTable));

                            await addStatistic(analyticId, {
                                title: "Test Statistics",
                                output_data: JSON.stringify({ tables: [formattedTestStatisticsTable] }),
                                components: "Wilcoxon Test",
                                description: twoRelatedSamplesNote
                            });
                        }

                        if (testType.sign && errorCountRef.current < testVariables1.length) {
                            const formattedRanksFrequenciesTable = formatRanksFrequenciesTable(resultsRef.current, "SIGN");
                            // console.log('Formatted frequencies ranks table:', JSON.stringify(formattedRanksFrequenciesTable));

                            await addStatistic(analyticId, {
                                title: "Frequencies",
                                output_data: JSON.stringify({ tables: [formattedRanksFrequenciesTable] }),
                                components: "Sign Test",
                                description: ""
                            });

                            const formattedTestStatisticsTable = formatTestStatisticsTable(resultsRef.current, "SIGN");
                            // console.log('Formatted test statistics table:', JSON.stringify(formattedTestStatisticsTable));

                            await addStatistic(analyticId, {
                                title: "Test Statistics",
                                output_data: JSON.stringify({ tables: [formattedTestStatisticsTable] }),
                                components: "Sign Test",
                                description: twoRelatedSamplesNote
                            });
                        }


                        if (onClose) {
                            onClose();
                        }
                    } catch (err) {
                        console.error("Error saving results:", err);
                        setErrorMsg("Error saving results.");
                    }
                }

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
    }, [testVariables1, testVariables2, testType, displayStatistics, addLog, addAnalytic, addStatistic, onClose, analysisData]);

    const cancelCalculation = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
            setIsCalculating(false);
            console.log("Two Related Samples Test calculation cancelled.");
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

export default useTwoRelatedSamplesAnalysis;