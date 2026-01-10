import { useState, useCallback, useRef, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useDataStore } from '@/stores/useDataStore';

import {
    PairedSamplesTTestAnalysisProps,
    PairedSamplesTTestResult,
} from '../types';

import {
    formatPairedSamplesStatisticsTable,
    formatPairedSamplesCorrelationTable,
    formatPairedSamplesTestTable,
} from '../utils/formatters';

export const usePairedSamplesTTestAnalysis = ({
    testVariables1,
    testVariables2,
    pairNumbers,
    estimateEffectSize,
    calculateStandardizer,
    areAllPairsValid,
    hasDuplicatePairs,
    onClose
}: PairedSamplesTTestAnalysisProps) => {
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const { data: analysisData } = useAnalysisData();
    
    const workerRef = useRef<Worker | null>(null);

    const insufficientDataVarsRef = useRef<{ pair: string, insufficientType: string[] }[]>([]);
    const resultsRef = useRef<PairedSamplesTTestResult[]>([]);
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

        const worker = new Worker('/workers/CompareMeans/manager.js', { type: 'module' });
        workerRef.current = worker;
        
        for (let i = 0; i < testVariables1.length; i++) {
            const dataForVar1 = analysisData.map(row => row[testVariables1[i].columnIndex]);
            const dataForVar2 = analysisData.map(row => row[testVariables2[i].columnIndex]);
            const payload = {
                analysisType: ['pairedSamplesTTest'],
                variable1: testVariables1[i],
                variable2: testVariables2[i],
                pair: pairNumbers[i] || i + 1,
                data1: dataForVar1,
                data2: dataForVar2,
                options: { estimateEffectSize, calculateStandardizer }
            };
            // console.log(`pair: ${pairNumbers[i]}, variable1: ${testVariables1[i].name}, variable2: ${testVariables2[i].name}`);
            worker.postMessage(payload);
        }

        worker.onmessage = async (event) => {
            // console.log(`event.data ke-${processedCountRef.current}: `, JSON.stringify(event.data));
            const { variableName, results, status, error: workerError } = event.data;

            if (status === 'success' && results) {
                // Check for metadata about insufficient data
                if (results.metadata && results.metadata.hasInsufficientData) {
                    insufficientDataVarsRef.current.push({pair: results.metadata.pair, insufficientType: results.metadata.insufficientType});
                    // console.warn(`Insufficient valid data for Pair ${results.metadata.pair}. Insufficient type: ${results.metadata.insufficientType.join(', ')}`);
                }
                // console.log(`results: ${JSON.stringify(results)}`);
                resultsRef.current.push(results);
            } else {
                console.error(`Error processing ${variableName}:`, workerError);
                const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                errorCountRef.current += 1;
            }
            // console.log('[Results before] processedCountRef.current:', processedCountRef.current);
            processedCountRef.current += 1;
            // console.log('[Results after] processedCountRef.current:', processedCountRef.current);

            if (processedCountRef.current === testVariables1.length) {
                if (resultsRef.current.length > 0) {
                    try {
                        // console.log('Results to format:', JSON.stringify(resultsRef.current));

                        const formattedPairedSamplesStatisticsTable = formatPairedSamplesStatisticsTable(resultsRef.current);
                        const formattedPairedSamplesCorrelationTable = formatPairedSamplesCorrelationTable(resultsRef.current);
                        const formattedPairedSamplesTestTable = formatPairedSamplesTestTable(resultsRef.current);
                        // console.log('formattedPairedSamplesStatisticsTable', JSON.stringify(formattedPairedSamplesStatisticsTable));
                        // console.log('formattedPairedSamplesCorrelationTable', JSON.stringify(formattedPairedSamplesCorrelationTable));
                        // console.log('formattedPairedSamplesTestTable', JSON.stringify(formattedPairedSamplesTestTable));

                        // Prepare log message
                        const variableNames1 = testVariables1.map(v => v.name).join(" ");
                        const variableNames2 = testVariables2.map(v => v.name).join(" ");
                        let logMsg = `T-TEST PAIRS=${variableNames1} WITH ${variableNames2} PAIRED`;

                        if (estimateEffectSize) {
                            logMsg += `{K-W=${variableNames1} BY ${variableNames2}}`;
                        }

                        // Save to database
                        const logId = await addLog({ log: logMsg });

                        // Prepare note about insufficient data if needed
                        let pairedSamplesStatisticsNote = "";
                        if (insufficientDataVarsRef.current.length > 0) {
                            pairedSamplesStatisticsNote += "Note: ";
                            const typeToVars: Record<string, string[]> = {};
                            for (const { pair, insufficientType } of insufficientDataVarsRef.current) {
                                for (const type of insufficientType) {
                                    if (!typeToVars[type]) typeToVars[type] = [];
                                    typeToVars[type].push(pair);
                                }
                            }
                            if (typeToVars["empty"] && typeToVars["empty"].length > 0) {
                                pairedSamplesStatisticsNote += `[t cannot be computed for pair(s): ${typeToVars["empty"].join(", ")}. There are no valid pairs.]`;
                            }
                            if (typeToVars["single"] && typeToVars["single"].length > 0) {
                                pairedSamplesStatisticsNote += `[t cannot be computed for pair(s): ${typeToVars["single"].join(", ")}. The sum of caseweights is less than or equal to 1.]`;
                            }
                            if (typeToVars["stdDev"] && typeToVars["stdDev"].length > 0) {
                                pairedSamplesStatisticsNote += `[t cannot be computed for pair(s): ${typeToVars["stdDev"].join(", ")}. The standard error of the difference is 0.]`;
                            }
                        }

                        let note = "";
                        if (insufficientDataVarsRef.current.length === testVariables1.length) {
                            note = "Note: The Paired Correlation table and the Paired Samples Test table are not produced because all pairs have insufficient data.";
                        }

                        const analyticId = await addAnalytic(logId, { title: "T Test", note: note || undefined });


                        await addStatistic(analyticId, {
                            title: "Paired Samples Statistics",
                            output_data: JSON.stringify({ tables: [formattedPairedSamplesStatisticsTable] }),
                            components: "Paired Samples Statistics",
                            description: pairedSamplesStatisticsNote
                        });

                        if (formattedPairedSamplesCorrelationTable.rows.length > 0) {
                            await addStatistic(analyticId, {
                                title: "Paired Samples Correlation",
                                output_data: JSON.stringify({ tables: [formattedPairedSamplesCorrelationTable] }),
                                components: "Paired Samples Correlation",
                                description: ""
                            });
                        }

                        if (formattedPairedSamplesTestTable.rows.length > 0) {
                            await addStatistic(analyticId, {
                                title: "Paired Samples Test",
                                output_data: JSON.stringify({ tables: [formattedPairedSamplesTestTable] }),
                                components: "Paired Samples Test",
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
    }, [testVariables1, testVariables2, pairNumbers, estimateEffectSize, calculateStandardizer, addLog, addAnalytic, addStatistic, onClose, analysisData]);

    const cancelCalculation = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
            setIsCalculating(false);
            console.log("Paired Samples T Test calculation cancelled.");
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

export default usePairedSamplesTTestAnalysis;