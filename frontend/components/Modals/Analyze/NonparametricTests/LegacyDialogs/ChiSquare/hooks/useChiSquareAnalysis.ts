import { useState, useCallback, useRef, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useDataStore } from '@/stores/useDataStore';

import {
    ChiSquareAnalysisProps,
    ChiSquareResults,
    ChiSquareResult
} from '../types';

import {
    formatFrequenciesTable,
    formatTestStatisticsTable,
    formatDescriptiveStatisticsTable,
    formatErrorTable
} from '../utils/formatters';

export const useChiSquareAnalysis = ({
    testVariables,
    expectedRange,
    rangeValue,
    expectedValue,
    expectedValueList,
    displayStatistics,
    onClose
}: ChiSquareAnalysisProps) => {
    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const { data: analysisData } = useAnalysisData();
    
    const [isCalculating, setIsCalculating] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    const workerRef = useRef<Worker | null>(null);
    const insufficientDataVarsRef = useRef<{ variableName: string; variableLabel: string; insufficientType: string[] }[]>([]);
    const resultsRef = useRef<ChiSquareResult[]>([]);
    const errorCountRef = useRef<number>(0);
    const processedCountRef = useRef<number>(0);

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

        let analysisTypes;
        if (displayStatistics.descriptive || displayStatistics.quartiles) {
            analysisTypes = ['descriptiveStatistics', 'chiSquare'];
        } else {
            analysisTypes = ['chiSquare'];
        }

        testVariables.forEach(variable => {
            const dataForVar = analysisData.map(row => row[variable.columnIndex]);
            const payload = {
                analysisType: analysisTypes,
                variable1: variable,
                data1: dataForVar,
                options: { expectedRange, rangeValue, expectedValue, expectedValueList, displayStatistics }
            };
            // console.log("payload", JSON.stringify(payload));
            worker.postMessage(payload);
        });

        worker.onmessage = async (event) => {
            // console.log("Received message:", JSON.stringify(event.data));
            const { variableName, results, status, error: workerError } = event.data;

            if (status === 'success' && results) {
                if (results.metadata && results.metadata.hasInsufficientData) {
                    insufficientDataVarsRef.current.push({variableName: results.metadata.variableName, variableLabel: results.metadata.variableLabel, insufficientType: results.metadata.insufficientType});
                    // console.warn(`Insufficient valid data for variable: ${results.metadata.variableLabel || results.metadata.variableName}. Insufficient type: ${results.metadata.insufficientType.join(', ')}`);
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
                if (resultsRef.current.length > 0) {
                    try {
                        // console.log('resultsRef.current', JSON.stringify(resultsRef.current));
                        const formattedDescriptiveStatisticsTable = formatDescriptiveStatisticsTable(resultsRef.current, displayStatistics);
                        const formattedFrequenciesTable = formatFrequenciesTable(resultsRef.current, expectedRange.useSpecifiedRange);
                        const formattedTestStatisticsTable = formatTestStatisticsTable(resultsRef.current);
                      
                        // console.log('Formatted descriptive statistics table:', JSON.stringify(formattedDescriptiveStatisticsTable));
                        // console.log('Formatted frequencies table:', JSON.stringify(formattedFrequenciesTable));
                        // console.log('Formatted test statistics table:', JSON.stringify(formattedTestStatisticsTable));
                        // Prepare log message
                        const variableNames = testVariables.map(v => v.name).join(" ");
                        let logMsg = `NPAR TESTS`;
                        
                        // Only add tests that are enabled
                        if (expectedRange.useSpecifiedRange) {
                            logMsg += `{CHISQUARE=${variableNames} (${rangeValue.lowerValue},${rangeValue.upperValue})}`;
                        } else {
                            logMsg += `{CHISQUARE=${variableNames}}`;
                        }

                        if (expectedValue.allCategoriesEqual) {
                            logMsg += `{EXPECTED=EQUAL}`;
                        } else {
                            logMsg += `{EXPECTED=${expectedValueList.join(" ")}}`;
                        }

                        if (displayStatistics?.descriptive || displayStatistics?.quartiles) {
                            logMsg += `{STATISTICS`;
                            if (displayStatistics.descriptive) logMsg += ` DESCRIPTIVES`;
                            if (displayStatistics.quartiles) logMsg += ` QUARTILES`;
                            logMsg += `}`;
                        }

                        // Save to database
                        const logId = await addLog({ log: logMsg });

                        let chiSquareNote = "";
                        let note = "";
                        let typeToVars: Record<string, string[]> = {};
                        if (insufficientDataVarsRef.current.length > 0) {
                            for (const { variableName, variableLabel, insufficientType } of insufficientDataVarsRef.current) {
                                for (const type of insufficientType) {
                                    if (!typeToVars[type]) typeToVars[type] = [];
                                    typeToVars[type].push(variableLabel || variableName);
                                }
                            }
                            if (typeToVars["empty"] && typeToVars["empty"].length > 0) {
                                note += `Note: There are not enough valid cases to perform the Chi-Square Test for ${typeToVars["empty"].join(", ")}. No statistics are computed.`;
                            }
                            if (typeToVars["single"] && typeToVars["single"].length > 0) {
                                chiSquareNote += `Note: The Chi-Square Test cannot be performed for variable(s): ${typeToVars["single"].join(", ")} because the variable(s) have only one category (constant value).`;
                            }
                        }
                        const analyticId = await addAnalytic(logId, { title: "NPar Tests", note: note || undefined });
                        
                        // console.log('insufficientDataVarsRef.current', JSON.stringify(insufficientDataVarsRef.current));
                        // console.log('insufficientDataVarsRef.current.length', JSON.stringify(insufficientDataVarsRef.current.length));
                        // console.log('testVariables.length', JSON.stringify(testVariables.length));
                        
                        // Check if we have any results with valid frequencies data
                        
                        const empty = typeToVars["empty"] || [];
                        if (empty.length < testVariables.length) {
                            // Add descriptive statistics table
                            if (displayStatistics?.descriptive || displayStatistics?.quartiles) {
                                await addStatistic(analyticId, {
                                    title: "Descriptive Statistics",
                                    output_data: JSON.stringify({ tables: [formattedDescriptiveStatisticsTable] }),
                                    components: "Descriptive Statistics",
                                    description: ""
                                });
                            }

                            // Add frequencies table
                            // Handle both array and single object for formattedFrequenciesTable
                            if (Array.isArray(formattedFrequenciesTable)) {
                                for (const table of formattedFrequenciesTable) {
                                    // INSERT_YOUR_CODE
                                    // hitung banyak baris, jika hanya 2, tambahkan note
                                    let freqNote = "";
                                    if (table && Array.isArray(table.rows) && table.rows.length === 2) {
                                        freqNote += (freqNote ? " " : "") + "Note: The Chi-Square Test cannot be performed because this variable have only one category (constant value).";
                                    }
                                    await addStatistic(analyticId, {
                                        title: "Frequencies",
                                        output_data: JSON.stringify({ tables: [table] }),
                                        components: "Frequencies",
                                        description: freqNote || ""
                                    });
                                }
                            } else if (formattedFrequenciesTable) {
                                await addStatistic(analyticId, {
                                    title: "Frequencies",
                                    output_data: JSON.stringify({ tables: [formattedFrequenciesTable] }),
                                    components: "Frequencies",
                                    description: chiSquareNote || ""
                                });
                            }
                            
                            let k = testVariables.length;
                            for (const result of resultsRef.current) {
                                if (result.metadata?.insufficientType.includes("empty")) {
                                    k--;
                                } else if (result.metadata?.insufficientType.includes("single")) {
                                    k--;
                                }
                            }
                            if (k > 0) {
                                await addStatistic(analyticId, {
                                    title: "Test Statistics",
                                    output_data: JSON.stringify({ tables: [formattedTestStatisticsTable] }),
                                    components: "Test Statistics",
                                    description: ""
                                });
                            }
                            // Add test statistics table
                            
                        } else if (displayStatistics?.descriptive || displayStatistics?.quartiles) {
                            await addStatistic(analyticId, {
                                title: "Descriptive Statistics",
                                output_data: JSON.stringify({ tables: [formattedDescriptiveStatisticsTable] }),
                                components: "Descriptive Statistics",
                                description: ""
                            });
                        } else {
                            const formattedErrorTable = formatErrorTable();
                            await addStatistic(analyticId, {
                              title: "Chi-Square Test Error",
                              output_data: JSON.stringify({ tables: [formattedErrorTable] }),
                              components: "Error",
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
    }, [testVariables, expectedRange, rangeValue, expectedValue, expectedValueList, displayStatistics, onClose, addLog, addAnalytic, addStatistic, analysisData]);

    const cancelCalculation = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
            setIsCalculating(false);
            console.log("Chi-Square Test calculation cancelled.");
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

export default useChiSquareAnalysis;