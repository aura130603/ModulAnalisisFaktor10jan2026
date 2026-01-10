import { useState, useCallback, useRef, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useDataStore } from '@/stores/useDataStore';

import {
    KIndependentSamplesTestAnalysisProps,
    KIndependentSamplesTestResults,
    KIndependentSamplesTestResult
} from '../types';

import {
    formatRanksTable,
    formatKruskalWallisHTestStatisticsTable,
    // formatFrequenciesTable,
    // formatMedianTestStatisticsTable,
    // formatJonckheereTerpstraTestTable,
    formatDescriptiveStatisticsTable,
} from '../utils/formatters';

export const useKIndependentSamplesAnalysis = ({
    testVariables,
    groupingVariable,
    minimum,
    maximum,
    testType,
    displayStatistics,
    onClose
}: KIndependentSamplesTestAnalysisProps) => {
    const [isCalculating, setIsCalculating] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const { data: analysisData } = useAnalysisData();
    
    const workerRef = useRef<Worker | null>(null);
    const workerPost = useRef<number>(0);
    
    const resultsRef = useRef<KIndependentSamplesTestResult[]>([]);
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
        workerPost.current = 0;

        const worker = new Worker('/workers/NonparametricTests/manager.js', { type: 'module' });
        workerRef.current = worker;

        const groupingDataForVar = analysisData.map(row => row[groupingVariable!.columnIndex]);

        testVariables.forEach(variable => {
            const dataForVar = analysisData.map(row => row[variable.columnIndex]);
            const payload = {
                analysisType: ['kIndependentSamples'],
                variable1: variable,
                data1: dataForVar,
                variable2: groupingVariable,
                data2: groupingDataForVar,
                options: { testType, minimum, maximum }
            };
            worker.postMessage(payload);
            workerPost.current += 1;
            if (displayStatistics.descriptive || displayStatistics.quartiles) {
                const displayStatisticsPayload = {
                    analysisType: ['descriptiveStatistics'],
                    variable1: variable,
                    data1: dataForVar,
                    options: { displayStatistics }
                };
                worker.postMessage(displayStatisticsPayload);
                workerPost.current += 1;
            }
        });
        if (displayStatistics.descriptive || displayStatistics.quartiles) {
            const displayStatisticsPayload = {
                analysisType: ['descriptiveStatistics'],
                variable1: groupingVariable,
                data1: groupingDataForVar,
                options: { displayStatistics }
            };
            worker.postMessage(displayStatisticsPayload);
            workerPost.current += 1;
        }

        worker.onmessage = async (event) => {
            const { variableName, results, status, error: workerError } = event.data;

            if (status === 'success' && results) {
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
            // console.log('[Results before] processedCountRef.current:', processedCountRef.current);
            processedCountRef.current += 1;
            // console.log('[Results after] processedCountRef.current:', processedCountRef.current, 'workerPost.current:', workerPost.current);

            if (processedCountRef.current === workerPost.current) {
                if (resultsRef.current.length > 0) {
                    try {
                        // console.log('Results to format:', JSON.stringify(resultsRef.current));

                        // Prepare log message
                        const variableNames = testVariables.map(v => v.name).join(" ");
                        let logMsg = `NPAR TESTS`;

                        if (testType.kruskalWallisH) {
                            logMsg += `{K-W=${variableNames} BY ${groupingVariable!.name}(${minimum} ${maximum})}`;
                        }

                        if (testType.median) {
                            logMsg += `{MEDIAN=${variableNames} BY ${groupingVariable!.name}(${minimum} ${maximum})}`;
                        }

                        if (testType.jonckheereTerpstra) {
                            logMsg += `{J-T=${variableNames} BY ${groupingVariable!.name}(${minimum} ${maximum})}`;
                        }

                        if (displayStatistics?.descriptive || displayStatistics?.quartiles) {
                            logMsg += `{STATISTICS`;
                            if (displayStatistics.descriptive) logMsg += ` DESCRIPTIVES`;
                            if (displayStatistics.quartiles) logMsg += ` QUARTILES`;
                            logMsg += `}`;
                        }

                        // Save to database
                        const logId = await addLog({ log: logMsg });

                        let kIndependentSamplesNote = "";
                        let note = "";
                        let typeToVars: Record<string, string[]> = {};
                        if (insufficientDataVarsRef.current.length > 0) {
                            kIndependentSamplesNote += "Note: "; 
                            for (const { variableName, variableLabel, insufficientType } of insufficientDataVarsRef.current) {
                                for (const type of insufficientType) {
                                    if (!typeToVars[type]) typeToVars[type] = [];
                                    typeToVars[type].push(variableLabel || variableName);
                                }
                            }
                            if (typeToVars["empty"] && typeToVars["empty"].length > 0) {
                                let testNames = [];
                                if (testType.kruskalWallisH) testNames.push("Kruskal-Wallis H Test");
                                if (testNames.length > 0) {
                                    note += `Note: There are not enough valid cases to perform the ${testNames.join(" and ")} for ${typeToVars["empty"].join(", ")}. No statistics are computed.`;
                                }
                            }
                            if (typeToVars["single"] && typeToVars["single"].length > 0) {
                                kIndependentSamplesNote += `[Kruskal-Wallis H cannot be computed for variable(s): ${typeToVars["single"].join(", ")}. There is only one non-empty group.]`;
                            }
                        }

                        const analyticId = await addAnalytic(logId, { title: "K Independent Samples Test", note: note || undefined });

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

                        const empty = typeToVars["empty"] || [];
                        if (testType.kruskalWallisH && empty.length !== testVariables.length) {
                            const formattedRanksTable = formatRanksTable(resultsRef.current, groupingVariable!.label || groupingVariable!.name);
                            // console.log('Formatted ranks table:', JSON.stringify(formattedRanksTable));

                            await addStatistic(analyticId, {
                                title: "Ranks",
                                output_data: JSON.stringify({ tables: [formattedRanksTable] }),
                                components: "Kruskal-Wallis Test",
                                description: kIndependentSamplesNote
                            });

                            if (insufficientDataVarsRef.current.length < testVariables.length) {
                                const formattedTestStatisticsTable = formatKruskalWallisHTestStatisticsTable(resultsRef.current);
                                // console.log('Formatted test statistics table:', JSON.stringify(formattedTestStatisticsTable));

                                await addStatistic(analyticId, {
                                    title: "Test Statistics",
                                    output_data: JSON.stringify({ tables: [formattedTestStatisticsTable] }),
                                    components: "Kruskal-Wallis Test",
                                    description: ""
                                });
                            }
                        }

                        // if (testType.median) {
                        //     const formattedFrequenciesTable = formatFrequenciesTable(results, groupingVariable.label || groupingVariable.name);
                        //     console.log('Formatted frequencies table:', JSON.stringify(formattedFrequenciesTable));

                        //     await addStatistic(analyticId, {
                        //         title: "Frequencies",
                        //         output_data: JSON.stringify({ tables: [formattedFrequenciesTable] }),
                        //         components: "Median Test",
                        //         description: ""
                        //     });

                        //     const formattedTestStatisticsTable = formatMedianTestStatisticsTable(results);
                        //     console.log('Formatted test statistics table:', JSON.stringify(formattedTestStatisticsTable));

                        //     await addStatistic(analyticId, {
                        //         title: "Test Statistics",
                        //         output_data: JSON.stringify({ tables: [formattedTestStatisticsTable] }),
                        //         components: "Median Test",
                        //         description: ""
                        //     });
                        // }

                        // if (testType.jonckheereTerpstra) {
                        //     const formattedJonckheereTerpstraTestTable = formatJonckheereTerpstraTestTable(results);
                        //     console.log('Formatted test statistics table:', JSON.stringify(formattedJonckheereTerpstraTestTable));

                        //     await addStatistic(analyticId, {
                        //         title: "Jonckheere-Terpstra Test",
                        //         output_data: JSON.stringify({ tables: [formattedJonckheereTerpstraTestTable] }),
                        //         components: "Jonckheere-Terpstra Test",
                        //         description: ""
                        //     });
                        // }

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
    }, [testVariables, groupingVariable, minimum, maximum, testType, displayStatistics, addLog, addAnalytic, addStatistic, onClose, analysisData]);

    const cancelCalculation = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
            setIsCalculating(false);
            console.log("K Independent Samples Test calculation cancelled.");
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

export default useKIndependentSamplesAnalysis;