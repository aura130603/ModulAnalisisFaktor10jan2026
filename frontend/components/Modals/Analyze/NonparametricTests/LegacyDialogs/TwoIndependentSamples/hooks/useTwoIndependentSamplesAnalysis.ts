import { useState, useCallback, useRef, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useDataStore } from '@/stores/useDataStore';

import {
    TwoIndependentSamplesTestAnalysisProps,
    TwoIndependentSamplesTestResults,
    TwoIndependentSamplesTestResult,
    DescriptiveStatistics
} from '../types';

import {
    formatFrequenciesRanksTable,
    formatMannWhitneyUTestStatisticsTable,
    formatKolmogorovSmirnovZTestStatisticsTable,
    formatDescriptiveStatisticsTable,
} from '../utils/formatters';

export const useTwoIndependentSamplesAnalysis = ({
    testVariables,
    groupingVariable,
    group1,
    group2,
    testType,
    displayStatistics,
    onClose
}: TwoIndependentSamplesTestAnalysisProps) => {
    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const { data: analysisData } = useAnalysisData();
    
    const [isCalculating, setIsCalculating] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    const workerRef = useRef<Worker | null>(null);
    const insufficientDataVarsRef = useRef<{ variableName: string; variableLabel: string; insufficentType: string[]}[]>([]);
    const resultsRef = useRef<TwoIndependentSamplesTestResult[]>([]);
    const errorCountRef = useRef<number>(0);
    const processedCountRef = useRef<number>(0);
    const descriptiveStatisticsRef = useRef<DescriptiveStatistics[]>([]);

    const runAnalysis = useCallback(async (): Promise<void> => {
        if (testVariables.length === 0) {
            setErrorMsg('Please select at least one variable to analyze.');
            return;
        }

        if (!groupingVariable) {
            setErrorMsg("Please select a grouping variable.");
            return;
        }

        if (group1 === null || group2 === null) {
            setErrorMsg("Please define grouping variable range.");
            return;
        }

        if (!testType.mannWhitneyU && !testType.mosesExtremeReactions && 
            !testType.kolmogorovSmirnovZ && !testType.waldWolfowitzRuns) {
            setErrorMsg("Please select at least one test type.");
            return;
        }

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
        descriptiveStatisticsRef.current = [];
        errorCountRef.current = 0;
        processedCountRef.current = 0;
        insufficientDataVarsRef.current = [];
        let workerCount = 0;

        const worker = new Worker('/workers/NonparametricTests/manager.js', { type: 'module' });
        workerRef.current = worker;

        if (displayStatistics.descriptive || displayStatistics.quartiles) {
            testVariables.forEach(variable => {
                const dataForVar = analysisData.map(row => row[variable.columnIndex]);
                const payload = {
                    analysisType: ['descriptiveStatistics'],
                    variable1: variable,
                    data1: dataForVar,
                    options: { testType, displayStatistics, group1, group2 }
                };
                worker.postMessage(payload);
                workerCount += 1;
            }); 
            const dataForVar = analysisData.map(row => row[groupingVariable.columnIndex]);
            const payload = {
                analysisType: ['descriptiveStatistics'],
                variable1: groupingVariable,
                data1: dataForVar,
                options: { testType, displayStatistics, group1, group2 }
            };
            worker.postMessage(payload);
            workerCount += 1;
        }

        testVariables.forEach(variable => {
            const dataForVar = analysisData.map(row => row[variable.columnIndex]);
            const groupingDataForVar = analysisData.map(row => row[groupingVariable.columnIndex]);
            const payload = {
                analysisType: ['twoIndependentSamples'],
                variable1: variable,
                data1: dataForVar,
                variable2: groupingVariable,
                data2: groupingDataForVar,
                options: { testType, displayStatistics, group1, group2 }
            };
            worker.postMessage(payload);
            workerCount += 1;
        });

        worker.onmessage = async (event) => {
            const { variableName, results, status, error: workerError } = event.data;
            // console.log('results', JSON.stringify(results));
            if (status === 'success' && results) {
                if (results.metadata && results.metadata.hasInsufficientData) {
                    insufficientDataVarsRef.current.push({ variableName: results.metadata.variableName, variableLabel: results.metadata.variableLabel, insufficentType: results.metadata.insufficentType });
                    // console.warn(`Insufficient valid data for variable: ${results.metadata.variableLabel || results.metadata.variableName}.`);
                }
                if (results.descriptiveStatistics) {
                    descriptiveStatisticsRef.current.push(results.descriptiveStatistics);
                } else {
                    resultsRef.current.push(results);
                }
            } else {
                console.error(`Error processing ${variableName}:`, workerError);
                const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                errorCountRef.current += 1;
            }

            processedCountRef.current += 1;
            
            if (processedCountRef.current === workerCount) {
                if (resultsRef.current.length > 0) {
                    try {
                        // console.log('[Results] Results:', JSON.stringify(resultsRef.current));
                        // Prepare log message
                        const variableNames = testVariables.map(v => v.name).join(" ");
                        let logMsg = `NPAR TESTS`;

                        if (testType.mannWhitneyU) {
                            logMsg += `{M-W=${variableNames} BY ${groupingVariable.name}(${group1} ${group2})}`;
                        }

                        if (testType.mosesExtremeReactions) {
                            logMsg += `{MOSES=${variableNames} BY ${groupingVariable.name}(${group1} ${group2})}`;
                        }

                        if (testType.kolmogorovSmirnovZ) {
                            logMsg += `{K-S=${variableNames} BY ${groupingVariable.name}(${group1} ${group2})}`;
                        }

                        if (testType.waldWolfowitzRuns) {
                            logMsg += `{W-W=${variableNames} BY ${groupingVariable.name}(${group1} ${group2})}`;
                        }

                        if (displayStatistics?.descriptive || displayStatistics?.quartiles) {
                            logMsg += `{STATISTICS`;
                            if (displayStatistics.descriptive) logMsg += ` DESCRIPTIVES`;
                            if (displayStatistics.quartiles) logMsg += ` QUARTILES`;
                            logMsg += `}`;
                        }

                        // Save to database
                        const logId = await addLog({ log: logMsg });

                        let mannWhitneyUTestNote = "";
                        let kolmogorovSmirnovZTestNote = "";
                        let note = "";
                        let typeToVars: Record<string, string[]> = {};
                        if (insufficientDataVarsRef.current.length > 0) {
                            for (const { variableName, variableLabel, insufficentType } of insufficientDataVarsRef.current) {
                                for (const type of insufficentType) {
                                    if (!typeToVars[type]) typeToVars[type] = [];
                                    typeToVars[type].push(variableLabel || variableName);
                                }
                            }
                            if (typeToVars["empty"] && typeToVars["empty"].length > 0) {
                                let testNames = [];
                                if (testType.mannWhitneyU) testNames.push("Mann-Whitney U Test");
                                if (testType.kolmogorovSmirnovZ) testNames.push("Kolmogorov-Smirnov Z Test");
                                if (testType.mosesExtremeReactions) testNames.push("Moses Extreme Reactions Test");
                                if (testType.waldWolfowitzRuns) testNames.push("Wald-Wolfowitz Runs Test");
                                if (testNames.length > 0) {
                                    note += `Note: There are not enough valid cases to perform the ${testNames.join(" and ")} for ${typeToVars["empty"].join(", ")}. No statistics are computed.`;
                                }
                            }
                            if (typeToVars["hasEmptyGroup"] && typeToVars["hasEmptyGroup"].length > 0) {
                                if (testType.mannWhitneyU) {
                                    mannWhitneyUTestNote += `Note: The Mann-Whitney U Test cannot be performed for variable(s): ${typeToVars["hasEmptyGroup"].join(", ")}. Mann-Whitney Test cannot be performed on empty groups.`;
                                }
                                if (testType.kolmogorovSmirnovZ) {
                                    kolmogorovSmirnovZTestNote += `Note: The Kolmogorov-Smirnov Z Test cannot be performed for variable(s): ${typeToVars["hasEmptyGroup"].join(", ")}. There are not enough cases in one or more groups.`;
                                }
                            }
                        }

                        const analyticId = await addAnalytic(logId, { title: "NPar Tests", note: note || undefined });

                        // Add descriptive statistics table
                         if (displayStatistics?.descriptive || displayStatistics?.quartiles) {
                            // console.log('descriptiveStatisticsRef.current', JSON.stringify(descriptiveStatisticsRef.current));
                            const formattedDescriptiveStatisticsTable = formatDescriptiveStatisticsTable(descriptiveStatisticsRef.current, displayStatistics);
                            // console.log('Formatted descriptive statistics table:', JSON.stringify(formattedDescriptiveStatisticsTable));
                       
                            await addStatistic(analyticId, {
                                title: "Descriptive Statistics",
                                output_data: JSON.stringify({ tables: [formattedDescriptiveStatisticsTable] }),
                                components: "Descriptive Statistics",
                                description: ""
                            });
                        }

                        const empty = typeToVars["empty"] || [];
                        // console.log('empty', JSON.stringify(empty));
                        
                        if (testType.mannWhitneyU) {
                            const formattedFrequenciesRanksTable = formatFrequenciesRanksTable(resultsRef.current, groupingVariable.label || groupingVariable.name, "M-W");
                            // console.log('Formatted frequencies ranks table:', JSON.stringify(formattedFrequenciesRanksTable));
                            
                            if (empty.length < testVariables.length) {
                                await addStatistic(analyticId, {
                                    title: "Ranks",
                                    output_data: JSON.stringify({ tables: [formattedFrequenciesRanksTable] }),
                                    components: "Mann-Whitney Test",
                                    description: mannWhitneyUTestNote
                                });
                            }

                            if (insufficientDataVarsRef.current.length < testVariables.length) {
                                const formattedTestStatisticsTable = formatMannWhitneyUTestStatisticsTable(resultsRef.current);
                                // console.log('Formatted test statistics table:', JSON.stringify(formattedTestStatisticsTable));

                                await addStatistic(analyticId, {
                                    title: "Test Statistics",
                                    output_data: JSON.stringify({ tables: [formattedTestStatisticsTable] }),
                                    components: "Mann-Whitney Test",
                                    description: ""
                                });
                            }
                        }

                        if (testType.kolmogorovSmirnovZ) {
                            const formattedFrequenciesRanksTable = formatFrequenciesRanksTable(resultsRef.current, groupingVariable.label || groupingVariable.name, "K-S");
                            // console.log('Formatted frequencies ranks table:', JSON.stringify(formattedFrequenciesRanksTable));

                            if (empty.length < testVariables.length) {
                                await addStatistic(analyticId, {
                                    title: "Frequencies",
                                    output_data: JSON.stringify({ tables: [formattedFrequenciesRanksTable] }),
                                    components: "Two-Samples Kolmogorov-Smirnov Test",
                                    description: kolmogorovSmirnovZTestNote
                                });
                            }

                            if (insufficientDataVarsRef.current.length < testVariables.length) {
                                const formattedTestStatisticsTable = formatKolmogorovSmirnovZTestStatisticsTable(resultsRef.current);
                                // console.log('Formatted test statistics table:', JSON.stringify(formattedTestStatisticsTable));

                                await addStatistic(analyticId, {
                                    title: "Test Statistics",
                                    output_data: JSON.stringify({ tables: [formattedTestStatisticsTable] }),
                                    components: "Two-Samples Kolmogorov-Smirnov Test",
                                    description: ""
                                });
                            }
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
    }, [testVariables, groupingVariable, group1, group2, testType, displayStatistics, addLog, addAnalytic, addStatistic, onClose, analysisData]);

    const cancelCalculation = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
            setIsCalculating(false);
            console.log("Two Independent Samples Test calculation cancelled.");
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

export default useTwoIndependentSamplesAnalysis;