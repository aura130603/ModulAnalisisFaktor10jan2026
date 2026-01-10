import { useState, useCallback, useRef, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useDataStore } from '@/stores/useDataStore';

import {
    OneWayAnovaAnalysisProps,
    OneWayAnovaResult,
    Descriptives,
    HomogeneityOfVariance,
    HomogeneousSubsets
} from '../types';

import {
    formatOneWayAnovaTable,
    formatDescriptiveStatisticsTable,
    formatHomogeneityOfVarianceTable,
    formatMultipleComparisonsTable,
    formatHomogeneousSubsetsTable,
    formatErrorTable
} from '../utils/formatters';

export const useOneWayAnovaAnalysis = ({
    testVariables,
    factorVariable,
    estimateEffectSize,
    equalVariancesAssumed,
    statisticsOptions,
    onClose
}: OneWayAnovaAnalysisProps) => {
    const [isCalculating, setIsCalculating] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const { data: analysisData } = useAnalysisData();
    
    const workerRef = useRef<Worker | null>(null);

    const resultsRef = useRef<OneWayAnovaResult[]>([]);
    const errorCountRef = useRef<number>(0);
    const processedCountRef = useRef<number>(0);
    const insufficientDataVarsRef = useRef<{ variable1Label: string, variable1Name: string, insufficientType: string[] }[]>([]);

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

        testVariables.forEach(variable => {
            const dataForVar = analysisData.map(row => row[variable.columnIndex]);
            const dataForFactorVar = analysisData.map(row => row[factorVariable!.columnIndex]);
            const payload = {
                analysisType: ['oneWayAnova'],
                variable1: variable,
                data1: dataForVar,
                variable2: factorVariable,
                data2: dataForFactorVar,
                options: { equalVariancesAssumed, statisticsOptions, estimateEffectSize }
            };
            // console.log("payload", JSON.stringify(payload));
            worker.postMessage(payload);
        });

        worker.onmessage = async (event) => {
            // console.log("Received message:", JSON.stringify(event.data));
            const { variableName, results, status, error: workerError } = event.data;

            if (status === 'success' && results) {
                if (results.metadata.hasInsufficientData) {
                    insufficientDataVarsRef.current.push({ variable1Label: results.metadata.variable1Label, variable1Name: results.metadata.variable1Name, insufficientType: results.metadata.insufficientType });
                    console.warn(`Insufficient valid data for: ${results.metadata.variable1Label || results.metadata.variable1Name} & ${results.metadata.variable2Label || results.metadata.variable2Name}. Type: ${results.metadata.insufficientType.join(', ')}`);
                }

                // Since the worker now returns simplified structure, we can directly push the results
                resultsRef.current.push(results);
            } else {
                console.error(`Error processing ${variableName}:`, workerError);
                const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                errorCountRef.current += 1;
            }

            processedCountRef.current += 1;

            if (processedCountRef.current === testVariables.length) {

                try {
                    // Format tables - now resultsRef.current contains array of results for each variable
                    console.log("resultsRef.current", JSON.stringify(resultsRef.current));                    
                    const variableNames = testVariables.map(v => v.name);
                    let logMsg = `ONEWAY ${variableNames.join(' ')} BY ${factorVariable!.name}`;
                    

                    if (statisticsOptions.descriptive && statisticsOptions.homogeneityOfVariance) {
                        logMsg += `{STATISTICS DESCRIPTIVES HOMOGENEITY}`;
                    } else if (statisticsOptions.descriptive || statisticsOptions.homogeneityOfVariance) {
                        if (statisticsOptions.descriptive) {
                            logMsg += `{STATISTICS DESCRIPTIVES}`;
                        }
                        if (statisticsOptions.homogeneityOfVariance) {
                            logMsg += `{STATISTICS HOMOGENEITY}`;
                        }
                    }

                    logMsg += `{MISSING ANALYSIS}{CRITERIA=CILEVEL(0.95)}`;

                    if (equalVariancesAssumed.tukey && equalVariancesAssumed.duncan) {
                        logMsg += `{POSTHOC=TUKEY DUNCAN ALPHA(0.05)}`;
                    } else if (equalVariancesAssumed.tukey) {
                        logMsg += `{POSTHOC=TUKEY ALPHA(0.05)}`;
                    } else if (equalVariancesAssumed.duncan) {
                        logMsg += `{POSTHOC=DUNCAN ALPHA(0.05)}`;
                    }

                    const logId = await addLog({ log: logMsg });

                    let oneWayAnovaNote = "";
                    let typeToVars: Record<string, string[]> = {};
                    if (insufficientDataVarsRef.current.length > 0) {
                        oneWayAnovaNote += "Note: ";
                        for (const { variable1Label, variable1Name, insufficientType } of insufficientDataVarsRef.current) {
                            for (const type of insufficientType) {
                                if (!typeToVars[type]) typeToVars[type] = [];
                                typeToVars[type].push(`${variable1Label || variable1Name}`);
                            }
                        }

                        if (typeToVars["fewerThanTwoGroups"] && typeToVars["fewerThanTwoGroups"].length > 0) {
                            oneWayAnovaNote += `[t cannot be computed for variable(s): ${typeToVars["fewerThanTwoGroups"].join(", ")}. At least one of the groups is empty.]`;
                        }
                        if (typeToVars["fewerThanThreeGroups"] && typeToVars["fewerThanThreeGroups"].length > 0) {
                            oneWayAnovaNote += `[t cannot be computed for variable(s): ${typeToVars["fewerThanThreeGroups"].join(", ")}. At least one of the groups is empty.]`;
                        }
                        if (typeToVars["groupWithFewerThanTwoCases"] && typeToVars["groupWithFewerThanTwoCases"].length > 0) {
                            oneWayAnovaNote += `[t cannot be computed for variable(s): ${typeToVars["groupWithFewerThanTwoCases"].join(", ")}. At least one of the groups is empty.]`;
                        }
                        if (typeToVars["allDeviationsConstant"] && typeToVars["allDeviationsConstant"].length > 0) {
                            oneWayAnovaNote += `[t cannot be computed for variable(s): ${typeToVars["allDeviationsConstant"].join(", ")}. At least one of the groups is empty.]`;
                        }
                        if (typeToVars["noValidData"] && typeToVars["noValidData"].length > 0) {
                            oneWayAnovaNote += `[t cannot be computed for pair(s): ${typeToVars["noValidData"].join(", ")}. There are no valid pairs.]`;
                        }
                    }

                    let note = "";
                    if (insufficientDataVarsRef.current.length > 0) {
                        note = `Note: The following variables did not have sufficient valid data for analysis: . These variables require at least one valid numeric value for ANOVA calculation.`;
                    }

                    const analyticId = await addAnalytic(logId, { title: "Oneway", note: note || undefined });
                    // Add Descriptive Statistics table if enabled
                    const fewerThanTwoGroups = typeToVars["fewerThanTwoGroups"] || [];
                    if (statisticsOptions.descriptive && fewerThanTwoGroups.length < testVariables.length) {
                        console.log("disini1");
                        const formattedDescriptiveStatisticsTable = formatDescriptiveStatisticsTable(resultsRef.current);
                        console.log("disini2");
                        console.log("formattedDescriptiveStatisticsTable:", JSON.stringify(formattedDescriptiveStatisticsTable));
                        await addStatistic(analyticId, {
                            title: "Descriptives",
                            output_data: JSON.stringify({ tables: [formattedDescriptiveStatisticsTable] }),
                            components: "Descriptives",
                            description: ""
                        });
                    }

                    let showHomogeneity = true;
                    for (const variable of resultsRef.current) {
                        if (variable.metadata?.insufficientType?.includes('fewerThanTwoGroups')) {
                            showHomogeneity = false;
                            break;
                        } else if (variable.metadata?.insufficientType?.includes('allDeviationsConstant')) {
                            showHomogeneity = false;
                            break;
                        }
                    }
                    if (showHomogeneity) {
                        // Add Homogeneity of Variance table if enabled
                        if (statisticsOptions.homogeneityOfVariance) {
                            const formattedHomogeneityOfVarianceTable = formatHomogeneityOfVarianceTable(resultsRef.current);
                            // console.log("formattedHomogeneityOfVarianceTable", JSON.stringify(formattedHomogeneityOfVarianceTable));
                            await addStatistic(analyticId, {
                                title: "Test of Homogeneity of Variances",
                                output_data: JSON.stringify({ tables: [formattedHomogeneityOfVarianceTable] }),
                                components: "Test of Homogeneity of Variances",
                                description: ""
                            });
                        }
                    }

                    if (fewerThanTwoGroups.length < testVariables.length) {
                        const formattedOneWayAnovaTable = formatOneWayAnovaTable(resultsRef.current);
                        // Add ANOVA table
                        await addStatistic(analyticId, {
                            title: "ANOVA",
                            output_data: JSON.stringify({ tables: [formattedOneWayAnovaTable] }),
                            components: "ANOVA",
                            description: ""
                        });
                    }

                    // Add Multiple Comparisons table if post hoc tests are enabled
                    if (equalVariancesAssumed.tukey && insufficientDataVarsRef.current.length !== testVariables.length) {
                        const formattedMultipleComparisonsTable = formatMultipleComparisonsTable(resultsRef.current, factorVariable!.label || factorVariable!.name);
                        // console.log("formattedMultipleComparisonsTable", JSON.stringify(formattedMultipleComparisonsTable));
                        await addStatistic(analyticId, {
                            title: "Multiple Comparisons",
                            output_data: JSON.stringify({ tables: [formattedMultipleComparisonsTable] }),
                            components: "Post Hoc Tests",
                            description: ""
                        });
                    }

                    // Add Homogeneous Subsets tables if post hoc tests are enabled
                    if ((equalVariancesAssumed.tukey || equalVariancesAssumed.duncan) && insufficientDataVarsRef.current.length !== testVariables.length) {
                        // Create separate tables for each test variable
                        testVariables.forEach((variable, index) => {
                            if (insufficientDataVarsRef.current.some(v => v.variable1Name === variable.name)) {
                                return;
                            }

                            console.log("resultsRef.current[index]", JSON.stringify(resultsRef.current[index]));
                            const formattedHomogeneousSubsetsTable = formatHomogeneousSubsetsTable(resultsRef.current[index], factorVariable!.label || factorVariable!.name, variable);
                            console.log("formattedHomogeneousSubsetsTable", JSON.stringify(formattedHomogeneousSubsetsTable));
                            addStatistic(analyticId, {
                                title: "Homogeneous Subsets",
                                output_data: JSON.stringify({ tables: [formattedHomogeneousSubsetsTable] }),
                                components: "Post Hoc Tests",
                                description: ""
                            });
                        });
                    }

                    // if (resultsRef.current.length === 0 || insufficientDataVarsRef.current.length === testVariables.length) {
                    //     const formattedErrorTable = formatErrorTable();
                    //     // console.log('formattedErrorTable', JSON.stringify(formattedErrorTable));
                    //     await addStatistic(analyticId, {
                    //         title: "Error",
                    //         output_data: JSON.stringify({ tables: [formattedErrorTable] }),
                    //         components: "Error",
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
    }, [testVariables, factorVariable, estimateEffectSize, equalVariancesAssumed, statisticsOptions, addLog, addStatistic, addAnalytic, analysisData, onClose]);

    const cancelCalculation = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
            setIsCalculating(false);
            console.log("One-Way ANOVA calculation cancelled.");
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

export default useOneWayAnovaAnalysis; 