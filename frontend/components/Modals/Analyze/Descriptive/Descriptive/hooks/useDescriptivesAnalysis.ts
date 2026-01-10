import { useState, useCallback, useRef, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { Variable } from '@/types/Variable';
import { 
    DescriptivesAnalysisProps, 
    DescriptiveResult, 
    ZScoreData
} from '../types';
import { formatDescriptiveTableOld } from '../utils/formatters';
import { useZScoreProcessing } from './useZScoreProcessing';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useDataStore } from '@/stores/useDataStore';
import { createPooledWorkerClient, WorkerClient } from '@/utils/workerClient';

export const useDescriptivesAnalysis = ({
    selectedVariables,
    displayStatistics,
    saveStandardized,
    displayOrder,
    onClose
}: DescriptivesAnalysisProps) => {
    const [isCalculating, setIsCalculating] = useState(false);
    const [error, setErrorMsg] = useState<string | null>(null);
    const workerClientRef = useRef<WorkerClient<any, any> | null>(null);

    // Refs for accumulating results inside the worker callback
    const resultsRef = useRef<DescriptiveResult[]>([]);
    const zScoresRef = useRef<ZScoreData>({});
    const errorCountRef = useRef<number>(0);
    const processedCountRef = useRef<number>(0);
    
    const { processZScoreData } = useZScoreProcessing({ setErrorMsg });
    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const { data: analysisData, weights } = useAnalysisData();

    const runAnalysis = useCallback(async () => {
        // === Performance Monitoring: Start ===
        const startTime = performance.now();
        const variableCount = selectedVariables.length;
        const caseCount = analysisData?.length || 0;
        console.log(`[Descriptive Analysis] Starting analysis:`);
        console.log(`  - Variables: ${variableCount}`);
        console.log(`  - Cases: ${caseCount}`);
        console.log(`  - Start time: ${new Date().toISOString()}`);
        // === Performance Monitoring: End ===

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
        zScoresRef.current = {};
        errorCountRef.current = 0;
        processedCountRef.current = 0;
        
        const workerClient = createPooledWorkerClient('descriptives');
        workerClientRef.current = workerClient;

        // Send payload for each variable
        selectedVariables.forEach(variable => {
            const dataForVar = analysisData.map(row => row[variable.columnIndex]);
            const payload = {
                analysisType: 'descriptives',
                variable,
                data: dataForVar,
                weights,
                options: { ...displayStatistics, saveStandardized }
            };
            workerClient.post(payload);
        });
        
        workerClient.onMessage(async (eventData) => {
            const { variableName, results, status, error: workerError } = eventData;
            const { variable, stats, zScores } = results || {};
            
            if (status === 'success' && variable && stats) {
                resultsRef.current.push({ variable, stats });
                if (saveStandardized && zScores) {
                    zScoresRef.current[variable.name] = { 
                        scores: zScores, 
                        variableInfo: {
                            name: `Z${variable.name}`,
                            label: `Zscore(${variable.label || variable.name})`,
                            type: "NUMERIC",
                            width: 8,
                            decimals: 3,
                            measure: 'scale'
                        }
                    };
                }
            } else {
                console.error(`Error processing ${variableName}:`, workerError);
                const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                errorCountRef.current += 1;
            }
            
            processedCountRef.current += 1;
            
            if (processedCountRef.current === selectedVariables.length) {
                const zScoreVarsCreated = Object.keys(zScoresRef.current).length > 0
                    ? await processZScoreData(zScoresRef.current)
                    : 0;

                if (resultsRef.current.length > 0) {
                    const formattedTable = formatDescriptiveTableOld(resultsRef.current, displayStatistics, displayOrder);

                    // ----------------------------------------------------
                    // Build SPSS-style command log that reflects parameters
                    // ----------------------------------------------------
                    const baseCmd = `DESCRIPTIVES VARIABLES=${selectedVariables.map(v => v.name).join(" ")}`;

                    // Helper to prepend two spaces for continuation lines (SPSS style)
                    const continuation = (text: string) => `  ${text}`;

                    // 1) /SAVE clause (standardized values)
                    const lines: string[] = [baseCmd];
                    if (saveStandardized) {
                        lines.push(continuation("/SAVE"));
                    }

                    // 2) /STATISTICS clause – map UI selections to SPSS keywords
                    const statKeywordMap: Record<keyof typeof displayStatistics, string> = {
                        mean: "MEAN",
                        sum: "SUM",
                        stdDev: "STDDEV",
                        variance: "VARIANCE",
                        range: "RANGE",
                        minimum: "MIN",
                        maximum: "MAX",
                        standardError: "SEMEAN",
                        median: "MEDIAN",
                        skewness: "SKEWNESS",
                        kurtosis: "KURTOSIS",
                    };

                    const requestedStats = (Object.keys(displayStatistics) as (keyof typeof displayStatistics)[])
                        .filter(key => displayStatistics[key])
                        .map(key => statKeywordMap[key]);

                    if (requestedStats.length > 0) {
                        lines.push(continuation(`/STATISTICS=${requestedStats.join(" ")}`));
                    }

                    // 3) /SORT clause – based on displayOrder selection
                    let sortClause = "";
                    switch (displayOrder) {
                        case "alphabetic":
                            sortClause = "NAME (A)"; // Ascending alphabetical
                            break;
                        case "mean":
                        case "ascendingMeans":
                            sortClause = "MEAN (A)";
                            break;
                        case "descendingMeans":
                            sortClause = "MEAN (D)";
                            break;
                        default:
                            // 'variableList' or undefined → no explicit sort clause
                            break;
                    }
                    if (sortClause) {
                        lines.push(continuation(`/SORT=${sortClause}`));
                    }

                    // Append terminating period to last line (SPSS syntax)
                    if (lines.length > 0) {
                        lines[lines.length - 1] = `${lines[lines.length - 1]}.`;
                    }

                    const logId = await addLog({ log: lines.join("\n") });
                    const analyticId = await addAnalytic(logId, { title: "Descriptives" });
                    await addStatistic(analyticId, {
                        title: "Descriptive Statistics",
                        output_data: JSON.stringify({ tables: [formattedTable] }),
                        components: "Descriptive Statistics",
                        description: ""
                    });
                }
                
                // === Performance Monitoring: End ===
                const endTime = performance.now();
                const executionTime = endTime - startTime;
                console.log(`[Descriptive Analysis] Analysis completed:`);
                console.log(`  - Variables processed: ${resultsRef.current.length}/${variableCount}`);
                console.log(`  - Cases analyzed: ${caseCount}`);
                console.log(`  - Execution time: ${executionTime.toFixed(2)}ms`);
                console.log(`  - End time: ${new Date().toISOString()}`);
                if (errorCountRef.current > 0) {
                    console.log(`  - Errors encountered: ${errorCountRef.current}`);
                }
                // === Performance Monitoring: End ===
                
                setIsCalculating(false);
                workerClient.terminate();
                workerClientRef.current = null;
                if (errorCountRef.current === 0) {
                    onClose?.();
                }
            }
        });

        workerClient.onError((err) => {
            console.error("A critical worker error occurred:", err);
            setErrorMsg(`A critical worker error occurred: ${err.message}`);
            setIsCalculating(false);
            if (workerClientRef.current) {
                workerClientRef.current.terminate();
                workerClientRef.current = null;
            }
        });

    }, [selectedVariables, displayStatistics, saveStandardized, displayOrder, onClose, addLog, addAnalytic, addStatistic, processZScoreData, analysisData, weights]);

    const cancelCalculation = useCallback(() => {
        if (workerClientRef.current) {
            workerClientRef.current.terminate();
            workerClientRef.current = null;
            setIsCalculating(false);
            console.log("Descriptives calculation cancelled.");
        }
    }, []);

    useEffect(() => {
        return () => {
            cancelCalculation();
        };
    }, [cancelCalculation]);

    return { runAnalysis, isCalculating, cancelCalculation, error };
};