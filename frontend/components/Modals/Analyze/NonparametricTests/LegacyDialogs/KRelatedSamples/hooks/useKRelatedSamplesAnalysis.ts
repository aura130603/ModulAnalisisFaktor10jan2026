import { useState, useCallback, useRef, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useDataStore } from '@/stores/useDataStore';

import {
    KRelatedSamplesAnalysisProps,
    KRelatedSamplesResults,
    KRelatedSamplesResult
} from '../types';

import {
    formatRanksTable,
    formatFrequenciesTable,
    formatTestStatisticsTable,
    formatDescriptiveStatisticsTable,
} from '../utils/formatters';

export const useKRelatedSamplesAnalysis = ({
    testVariables,
    testType,
    displayStatistics,
    onClose
}: KRelatedSamplesAnalysisProps) => {
    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const { data: analysisData } = useAnalysisData();
    
    const [isCalculating, setIsCalculating] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    const workerRef = useRef<Worker | null>(null);
    
    const resultsRef = useRef<KRelatedSamplesResult[]>([]);
    const errorCountRef = useRef<number>(0);
    const processedCountRef = useRef<number>(0);
    const processedCountBatchRef = useRef<number>(0);
   
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
        processedCountBatchRef.current = 0;

        const worker = new Worker('/workers/NonparametricTests/manager.js', { type: 'module' });
        workerRef.current = worker;

        const batch = testVariables.map(variable => ({
            variable,
            data: analysisData.map(row => row[variable.columnIndex]).filter(item => item !== null && item !== undefined) as (string | number)[],
        }));

        if (displayStatistics.descriptive || displayStatistics.quartiles) {
            testVariables.forEach(variable => {
                const dataForVar = analysisData.map(row => row[variable.columnIndex]);
                const descriptiveStatisticsPayload = {
                    analysisType: ['descriptiveStatistics'],
                    variable1: variable,
                    data1: dataForVar,
                    options: { displayStatistics }
                };
                worker.postMessage(descriptiveStatisticsPayload);
                // console.log('[Results] processedCountBatchRef.current:', processedCountBatchRef.current);
                processedCountBatchRef.current += 1;
            });
        }

        const payload = {
            analysisType: ['kRelatedSamples'],
            variable1: 'K-Related Samples Test',
            batchVariable: batch.map(vd => vd.variable),
            data1: batch.map(vd => vd.data),
            batchData: batch.flatMap(vd => vd.data),
            options: { 
                testType,
                k: testVariables.length
            }
        };
        worker.postMessage(payload);
        // console.log('[Results] processedCountBatchRef.current:', processedCountBatchRef.current);
        processedCountBatchRef.current += 1;
        worker.onmessage = async (event) => {
            const { variableName, results, status, error: workerError } = event.data;
            
            if (status === 'success' && results) {
                resultsRef.current.push(results);
            } else {
                console.error(`Error processing ${variableName}:`, workerError);
                const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                errorCountRef.current += 1;
            }
            // console.log('[Results before] processedCountRef.current:', processedCountRef.current);
            // console.log('[Results] processedCountBatchRef.current:', processedCountBatchRef.current);
            processedCountRef.current += 1;
            // console.log('[Results after] processedCountRef.current:', processedCountRef.current);
            // console.log('[Results after] processedCountBatchRef.current:', processedCountBatchRef.current);

            if (processedCountRef.current === processedCountBatchRef.current) {

                if (resultsRef.current.length > 0) {
                    try {
                        // console.log('[Results] resultsRef.current:', JSON.stringify(resultsRef.current));
                        // Prepare log message
                        const variableNames = testVariables.map(v => v.name).join(" ");
                        let logMsg = `NPAR TESTS`;

                        if (testType.friedman) {
                            logMsg += `{FRIEDMAN=${variableNames}}`;
                        }

                        if (testType.cochransQ) {
                            logMsg += `{COCHRAN=${variableNames}}`;
                        }

                        if (testType.kendallsW) {
                            logMsg += `{KENDALL=${variableNames}}`;
                        }

                        if (displayStatistics?.descriptive || displayStatistics?.quartiles) {
                            logMsg += `{STATISTICS`;
                            if (displayStatistics.descriptive) logMsg += ` DESCRIPTIVES`;
                            if (displayStatistics.quartiles) logMsg += ` QUARTILES`;
                            logMsg += `}`;
                        }

                        // Save to database
                        const logId = await addLog({ log: logMsg });
                        let note = "";
                        let hasInsufficientDataEmpty = false;
                        let hasInsufficientDataSingle = false;
                        
                        // Check all results for insufficient data and add note if any
                        for (const res of resultsRef.current) {
                            if (res?.metadata?.hasInsufficientDataEmpty) {
                                hasInsufficientDataEmpty = true;
                            }
                            if (res?.metadata?.hasInsufficientDataSingle) {
                                hasInsufficientDataSingle = true;
                            }
                            // Early exit if both are true
                            if (hasInsufficientDataEmpty && hasInsufficientDataSingle) break;
                        }
                        if (hasInsufficientDataEmpty || hasInsufficientDataSingle) {
                            note += "Note: There are not enough valid cases to perform the K Related Samples Test. No statistics are computed.";
                        }
                        const analyticId = await addAnalytic(logId, { title: "K Related Samples Test", note: note || "" });

                        // Add descriptive statistics table
                        if (displayStatistics?.descriptive || displayStatistics?.quartiles || !hasInsufficientDataEmpty) {
                            const formattedDescriptiveStatisticsTable = formatDescriptiveStatisticsTable(resultsRef.current, displayStatistics);
                            // console.log('Formatted descriptive statistics table:', JSON.stringify(formattedDescriptiveStatisticsTable));
                        
                            await addStatistic(analyticId, {
                                title: "Descriptive Statistics",
                                output_data: JSON.stringify({ tables: [formattedDescriptiveStatisticsTable] }),
                                components: "Descriptive Statistics",
                                description: ""
                            });
                        }

                        if (testType.friedman && !hasInsufficientDataEmpty && !hasInsufficientDataSingle && !hasInsufficientDataEmpty) {
                            const formattedRanksTable = formatRanksTable(resultsRef.current);
                            // console.log('Formatted ranks table:', JSON.stringify(formattedRanksTable));

                            await addStatistic(analyticId, {
                                title: "Ranks",
                                output_data: JSON.stringify({ tables: [formattedRanksTable] }),
                                components: "Friedman Test",
                                description: ""
                            });

                            const formattedTestStatisticsTable = formatTestStatisticsTable(resultsRef.current, "Friedman Test");
                            // console.log('Formatted test statistics table:', JSON.stringify(formattedTestStatisticsTable));

                            await addStatistic(analyticId, {
                                title: "Test Statistics",
                                output_data: JSON.stringify({ tables: [formattedTestStatisticsTable] }),
                                components: "Friedman Test",
                                description: ""
                            });
                        }

                        if (testType.cochransQ && !hasInsufficientDataEmpty && !hasInsufficientDataSingle && !hasInsufficientDataEmpty) {
                            const formattedFrequenciesTable = formatFrequenciesTable(resultsRef.current);
                            // console.log('Formatted frequencies table:', JSON.stringify(formattedFrequenciesTable));

                            await addStatistic(analyticId, {
                                title: "Frequencies",
                                output_data: JSON.stringify({ tables: [formattedFrequenciesTable] }),
                                components: "Cochran's Q Test",
                                description: ""
                            });

                            const formattedTestStatisticsTable = formatTestStatisticsTable(resultsRef.current, "Cochran's Q Test");
                            // console.log('Formatted test statistics table:', JSON.stringify(formattedTestStatisticsTable));

                            await addStatistic(analyticId, {
                                title: "Test Statistics",
                                output_data: JSON.stringify({ tables: [formattedTestStatisticsTable] }),
                                components: "Cochran's Q Test",
                                description: ""
                            });
                        }

                        if (testType.kendallsW && !hasInsufficientDataEmpty && !hasInsufficientDataSingle) {
                            const formattedRanksTable = formatRanksTable(resultsRef.current);
                            // console.log('Formatted ranks table:', JSON.stringify(formattedRanksTable));

                            await addStatistic(analyticId, {
                                title: "Ranks",
                                output_data: JSON.stringify({ tables: [formattedRanksTable] }),
                                components: "Kendall's W Test",
                                description: ""
                            });

                            const formattedTestStatisticsTable = formatTestStatisticsTable(resultsRef.current, "Kendall's W Test");
                            // console.log('Formatted test statistics table:', JSON.stringify(formattedTestStatisticsTable));

                            await addStatistic(analyticId, {
                                title: "Test Statistics",
                                output_data: JSON.stringify({ tables: [formattedTestStatisticsTable] }),
                                components: "Kendall's W Test",
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
    }, [testVariables, testType, displayStatistics, addLog, addAnalytic, addStatistic, onClose, analysisData]);

    const cancelCalculation = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
            setIsCalculating(false);
            console.log("K Related Samples Test calculation cancelled.");
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

export default useKRelatedSamplesAnalysis;