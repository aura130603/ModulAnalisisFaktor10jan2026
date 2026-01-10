import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useDataStore } from '@/stores/useDataStore';

import {
    BivariateAnalysisProps,
    BivariateResults,
    BivariateTable
} from '../types';

import {
    formatCorrelationTable,
    formatDescriptiveStatisticsTable,
    formatPartialCorrelationTable,
} from '../utils/formatters';

export const useBivariateAnalysis = ({
    testVariables,
    correlationCoefficient,
    testOfSignificance,
    flagSignificantCorrelations,
    showOnlyTheLowerTriangle,
    showDiagonal,
    partialCorrelationKendallsTauB,
    statisticsOptions,
    missingValuesOptions,
    controlVariables,
    onClose
}: BivariateAnalysisProps) => {
    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const { data: analysisData } = useAnalysisData();

    const options = useMemo(() => ({
        testOfSignificance,
        flagSignificantCorrelations,
        showOnlyTheLowerTriangle,
        showDiagonal,
        statisticsOptions,
        partialCorrelationKendallsTauB,
        missingValuesOptions,
        controlVariables
    }), [
        testOfSignificance,
        flagSignificantCorrelations,
        showOnlyTheLowerTriangle,
        showDiagonal,
        statisticsOptions,
        partialCorrelationKendallsTauB,
        missingValuesOptions,
        controlVariables
    ]);

    const [isCalculating, setIsCalculating] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    const workerRef = useRef<Worker | null>(null);
    
    const resultsRef = useRef<BivariateResults>();
    const errorCountRef = useRef<number>(0);
    const processedCountRef = useRef<number>(0);
    const insufficientDataVarsRef = useRef<{ variableName: string; variableLabel: string; insufficientType: string[] }[]>([]);

    // Timing refs
    const timingRef = useRef<{
        analysisStart: number;
        dataSentToWorker: number;
        dataReceivedFromWorker: number;
        dataFormattedToTable: number;
        processCompleted: number;
    }>({
        analysisStart: 0,
        dataSentToWorker: 0,
        dataReceivedFromWorker: 0,
        dataFormattedToTable: 0,
        processCompleted: 0
    });

    const runAnalysis = useCallback(async (): Promise<void> => {
        // 1. Catat waktu ketika runAnalysis dimulai
        timingRef.current.analysisStart = performance.now();
        
        if (testVariables.length === 0) {
            setErrorMsg('Please select at least one variable to analyze.');
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
        errorCountRef.current = 0;
        processedCountRef.current = 0;

        const worker = new Worker('/workers/Correlate/manager.js', { type: 'module' });
        workerRef.current = worker;

        const batch = testVariables.map(variable => ({
            variable,
            data: analysisData.map(row => row[variable.columnIndex]).filter(item => item !== null && item !== undefined) as (string | number)[],
        }));

        const batchControl = controlVariables.map(variable => ({
            variable,
            data: analysisData.map(row => row[variable.columnIndex]).filter(item => item !== null && item !== undefined) as (string | number)[],
        }));

        const payload = {
            analysisType: 'bivariate',
            variable: batch.map(vd => vd.variable),
            data: batch.map(vd => vd.data),
            options: {
                correlationCoefficient,
                testOfSignificance,
                flagSignificantCorrelations,
                showOnlyTheLowerTriangle,
                showDiagonal,
                statisticsOptions,
                partialCorrelationKendallsTauB,
                missingValuesOptions,
                controlVariables: batchControl.map(vd => vd.variable),
                controlData: batchControl.map(vd => vd.data)
            }
        };

        // 2. Catat waktu ketika data dikirim ke web worker
        timingRef.current.dataSentToWorker = performance.now();

        worker.postMessage(payload);

        worker.onmessage = async (event) => {
            // console.log('Received message:', JSON.stringify(event.data));
            const { variableName, results, status, error: workerError } = event.data;

            // 3. Catat waktu ketika data diterima dari web worker
            if (processedCountRef.current === 0) {
                timingRef.current.dataReceivedFromWorker = performance.now();
            }

            if (status === 'success' && results) {
                // Check for metadata about insufficient data
                if (Array.isArray(results.metadata)) {
                    results.metadata.forEach((meta: any) => {
                        if (meta.hasInsufficientData) {
                            insufficientDataVarsRef.current.push({
                                variableName: meta.variableName,
                                variableLabel: meta.variableLabel,
                                insufficientType: meta.insufficientType
                            });
                            // console.warn(`Insufficient valid data for variable: ${meta.variableLabel || meta.variableName}. Insufficient type: ${meta.insufficientType.join(', ')}`);
                        }
                    });
                }
                resultsRef.current = results;
            } else {
                console.error(`Error processing ${variableName}:`, workerError);
                const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                errorCountRef.current += 1;
            }

            processedCountRef.current += 1;
            if (processedCountRef.current === 1) {
                if (resultsRef.current) {
                    try {
                        // console.log('Results ref:', JSON.stringify(resultsRef.current));
                        // Prepare log message
                        const variableNames = testVariables.map(v => v.name).join(" ");
                        let logMsg = `CORRELATIONS {VARIABLES=${variableNames}}`;

                        // 4. Catat waktu ketika data diubah ke format tabel
                        timingRef.current.dataFormattedToTable = performance.now();

                        // Save to database
                        const logId = await addLog({ log: logMsg });
                        
                        // Prepare note about matrix validation issues if needed
                        let note = "";
                        if (partialCorrelationKendallsTauB && resultsRef.current.matrixValidation && 
                            (resultsRef.current.matrixValidation.hasInvalidCorrelations || resultsRef.current.matrixValidation.hasInvalidNs)) {
                            const issues = [];
                            if (resultsRef.current.matrixValidation.hasInvalidCorrelations) {
                                issues.push("invalid correlation values (less than -1 or greater than +1)");
                            }
                            if (resultsRef.current.matrixValidation.hasInvalidNs) {
                                issues.push("invalid N values (less than 1)");
                            }
                            note = `Note: Matrix validation detected ${issues.join(" and ")}. Partial correlation is not displayed.`;
                        }
                        
                        let correlationNote = "";
                        if (insufficientDataVarsRef.current.length > 0) {
                            correlationNote += "Note: ";
                            const typeToVars: Record<string, string[]> = {};
                            for (const { variableName, variableLabel, insufficientType } of insufficientDataVarsRef.current) {
                                for (const type of insufficientType) {
                                    if (!typeToVars[type]) typeToVars[type] = [];
                                    typeToVars[type].push(variableLabel || variableName);
                                }
                            }
                            if (typeToVars["empty"] && typeToVars["empty"].length > 0) {
                                correlationNote += `[Cannot be computed for variable(s): ${typeToVars["empty"].join(", ")}. There are no valid cases for this analysis because all caseweights are not positive.]`;
                            }
                            if (typeToVars["single"] && typeToVars["single"].length > 0) {
                                correlationNote += `[Cannot be computed for variable(s): ${typeToVars["single"].join(", ")}. The sum of caseweights is less than or equal 1.]`;
                            }
                            if (typeToVars["stdDev"] && typeToVars["stdDev"].length > 0) {
                                correlationNote += `[Cannot be computed for variable(s): ${typeToVars["stdDev"].join(", ")}. The standard deviation is 0.]`;
                            }
                        }
                        // Create analytic with or without note
                        const analyticId = await addAnalytic(logId, { 
                            title: "Correlation", 
                            note: note || undefined 
                        });

                        // Add descriptive statistics table
                        if (statisticsOptions.meansAndStandardDeviations) {
                            const formattedDescriptiveStatisticsTable = formatDescriptiveStatisticsTable(resultsRef.current);
                       
                            await addStatistic(analyticId, {
                                title: "Descriptive Statistics",
                                output_data: JSON.stringify({ tables: [formattedDescriptiveStatisticsTable] }),
                                components: "Descriptive Statistics",
                                description: ""
                            });
                        }

                        if (correlationCoefficient.pearson) {
                            const formattedCorrelationTable = formatCorrelationTable(resultsRef.current, options, testVariables, ["Pearson"]);

                            await addStatistic(analyticId, {
                                title: "Correlation",
                                output_data: JSON.stringify({ tables: [formattedCorrelationTable] }),
                                components: "Correlation",
                                description: correlationNote
                            });
                        }

                        if (correlationCoefficient.kendallsTauB || correlationCoefficient.spearman) {
                            let correlationType = [];
                            if (correlationCoefficient.kendallsTauB) {
                                correlationType.push("Kendall's tau_b");
                            }
                            if (correlationCoefficient.spearman) {
                                correlationType.push("Spearman's rho");
                            }
                            const formattedCorrelationTable = formatCorrelationTable(resultsRef.current, options, testVariables, correlationType);
                            // console.log('formattedCorrelationTable:', JSON.stringify(formattedCorrelationTable));

                            await addStatistic(analyticId, {
                                title: "Nonparametric Correlation",
                                output_data: JSON.stringify({ tables: [formattedCorrelationTable] }),
                                components: "Nonparametric Correlation",
                                description: ""
                            });

                            if (partialCorrelationKendallsTauB && correlationCoefficient.kendallsTauB && testVariables.length > 2 && missingValuesOptions.excludeCasesListwise) {
                                // Check for matrix validation issues
                                const hasMatrixIssues = resultsRef.current.matrixValidation && 
                                    (resultsRef.current.matrixValidation.hasInvalidCorrelations || resultsRef.current.matrixValidation.hasInvalidNs);
                                
                                if (!hasMatrixIssues) {
                                    const formattedPartialCorrelationTable = formatPartialCorrelationTable(resultsRef.current, options, testVariables);
                                    // console.log('Formatted partial correlation table:', JSON.stringify(formattedPartialCorrelationTable));

                                    await addStatistic(analyticId, {
                                        title: "Partial Correlation",
                                        output_data: JSON.stringify({ tables: [formattedPartialCorrelationTable] }),
                                        components: "Partial Correlation",
                                        description: ""
                                    });
                                }
                            }
                        }

                        
                        // 5. Catat waktu ketika proses selesai
                        timingRef.current.processCompleted = performance.now();

                        // Hitung semua timing durations

                        const timeToSendData = timingRef.current.dataSentToWorker - timingRef.current.analysisStart;
                        const timeToReceiveData = timingRef.current.dataReceivedFromWorker - timingRef.current.dataSentToWorker;
                        const timeToFormatData = timingRef.current.dataFormattedToTable - timingRef.current.dataReceivedFromWorker;
                        const timeToComplete = timingRef.current.processCompleted - timingRef.current.dataFormattedToTable;
                        const totalTime = timingRef.current.processCompleted - timingRef.current.analysisStart;

                        // Hitung jumlah data (total rows dari analysisData)
                        const totalDataRows = analysisData.length;

                        // Single console.log dengan format yang diminta
                        // console.log(`[BivariateCorrelation][${testVariables.length} var][${totalDataRows} data] TIMING SUMMARY:
                        //     Analysis start to data sent: ${timeToSendData}ms
                        //     Data sent to data received: ${timeToReceiveData}ms
                        //     Data received to formatting: ${timeToFormatData}ms
                        //     Formatting to completion: ${timeToComplete}ms
                        //     TOTAL TIME: ${totalTime}ms`);

                        setIsCalculating(false);
                        worker.terminate();
                        workerRef.current = null;
                        onClose?.();
                            
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
    }, [testVariables, correlationCoefficient, testOfSignificance, flagSignificantCorrelations, showOnlyTheLowerTriangle, showDiagonal, statisticsOptions, partialCorrelationKendallsTauB, missingValuesOptions, controlVariables, options, addLog, addAnalytic, addStatistic, onClose, analysisData]);

    const cancelCalculation = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
            setIsCalculating(false);
            console.log("Bivariate correlation calculation cancelled.");
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

export default useBivariateAnalysis;