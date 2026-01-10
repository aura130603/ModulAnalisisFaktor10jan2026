import { useState, useCallback, useRef, useEffect } from 'react';
import { createPooledWorkerClient, WorkerClient } from '@/utils/workerClient';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { 
    FrequenciesAnalysisParams, 
    WorkerInput, 
    WorkerResult, 
    StatisticsOptions,
    ChartOptions,
    FrequenciesResult
} from '../types';
import { processAndAddCharts, formatStatisticsTable, formatFrequencyTable } from '../utils';
import { Variable } from '@/types/Variable';

// --- Helper to build SPSS-style log string ----------------------------------
const buildFrequenciesLog = (
    variables: Variable[],
    statisticsOptions: StatisticsOptions | null,
    chartOptions: ChartOptions | null,
    showCharts: boolean,
): string => {
    // 1) VARIABLES section
    let log = `FREQUENCIES VARIABLES=${variables.map(v => v.name).join(" ")}`;

    // 2) NTILES section – derived from quartiles / cut points
    if (statisticsOptions) {
        const ntileValues: number[] = [];
        const { percentileValues } = statisticsOptions;
        if (percentileValues.quartiles) ntileValues.push(4);
        if (percentileValues.cutPoints) {
            const n = Number(percentileValues.cutPointsN);
            if (!isNaN(n) && n > 0) ntileValues.push(n);
        }
        ntileValues.forEach(n => {
            log += `\n  /NTILES=${n}`;
        });

        // 3) PERCENTILES section
        if (percentileValues.enablePercentiles && percentileValues.percentilesList.length > 0) {
            const pctList = percentileValues.percentilesList
                .map(p => {
                    const num = Number(p);
                    return isNaN(num) ? p : num.toFixed(1);
                })
                .join(" ");
            log += `\n  /PERCENTILES=${pctList}`;
        }

        // 4) STATISTICS section
        const statsTokens: string[] = [];
        const { centralTendency, dispersion, distribution } = statisticsOptions;

        if (dispersion.stddev) statsTokens.push("STDDEV");
        if (dispersion.variance) statsTokens.push("VARIANCE");
        if (dispersion.range) statsTokens.push("RANGE");
        if (dispersion.minimum) statsTokens.push("MINIMUM");
        if (dispersion.maximum) statsTokens.push("MAXIMUM");
        if (dispersion.stdErrorMean) statsTokens.push("SEMEAN");

        if (centralTendency.mean) statsTokens.push("MEAN");
        if (centralTendency.median) statsTokens.push("MEDIAN");
        if (centralTendency.mode) statsTokens.push("MODE");
        if (centralTendency.sum) statsTokens.push("SUM");

        if (distribution.skewness) statsTokens.push("SKEWNESS");
        if (distribution.stdErrorSkewness) statsTokens.push("SESKEW");
        if (distribution.kurtosis) statsTokens.push("KURTOSIS");
        if (distribution.stdErrorKurtosis) statsTokens.push("SEKURT");

        if (statsTokens.length > 0) {
            log += `\n  /STATISTICS=${statsTokens.join(" ")}`;
        }
    }

    // 5) Chart section – currently support bar chart/histogram/pie
    if (showCharts && chartOptions && chartOptions.type) {
        if (chartOptions.type === "barCharts") {
            log += `\n  /BARCHART ${chartOptions.values === "percentages" ? "PERC" : "FREQ"}`;
        } else if (chartOptions.type === "pieCharts") {
            log += `\n  /PIECHART ${chartOptions.values === "percentages" ? "PERC" : "FREQ"}`;
        } else if (chartOptions.type === "histograms") {
            log += `\n  /HISTOGRAM FREQ`;
        }
    }

    // 6) ORDER section – default to ANALYSIS
    log += "\n  /ORDER=ANALYSIS.";

    return log;
};

/**
 * Defines the return structure for the useFrequenciesAnalysis hook.
 */
interface FrequenciesAnalysisResult {
    isLoading: boolean;
    errorMsg: string | null;
    runAnalysis: () => Promise<void>;
    cancelAnalysis: () => void;
}

/**
 * A hook to perform frequency analysis.
 * This hook encapsulates the logic for interacting with a web worker to calculate frequencies,
 * handling state, processing results, and formatting them for display.
 *
 * @param params - The parameters for the analysis, including selected variables and options.
 * @returns An object containing the analysis state and control functions.
 */
export const useFrequenciesAnalysis = (params: FrequenciesAnalysisParams): FrequenciesAnalysisResult => {
    const { selectedVariables, showFrequencyTables, showStatistics, statisticsOptions, showCharts, chartOptions, onClose } = params;

    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const { data: allData, weights } = useAnalysisData();

    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const workerClientRef = useRef<WorkerClient<any, WorkerResult> | null>(null);
    const resultsRef = useRef<FrequenciesResult[]>([]);
    
    const handleWorkerResult = useCallback(async (result: WorkerResult, analyticId: number, startTime: number, variableCount: number, caseCount: number) => {
        // Release the worker back to the pool and update UI state
        if (workerClientRef.current) {
            workerClientRef.current.terminate();
            workerClientRef.current = null;
        }
        setIsLoading(false);

        const { success, results, error } = result;

        if (success && results) {
            if (showStatistics && results.statistics) {
                const statsResults: FrequenciesResult[] = Object.entries(results.statistics).map(([varName, stats]) => ({
                    variable: selectedVariables.find(v => v.name === varName)!,
                    stats: stats
                }));

                if (statsResults.length > 0) {
                    const statsTableObject = formatStatisticsTable(statsResults);
                    if (statsTableObject && statsTableObject.tables) {
                        await addStatistic(analyticId, {
                            title: statsTableObject.tables[0]?.title || 'Statistics',
                            output_data: JSON.stringify(statsTableObject),
                            components: 'Descriptive Statistics',
                            description: ''
                        });
                    }
                }
            }
            if (showFrequencyTables && results.frequencyTables) {
                for (const varName in results.frequencyTables) {
                    const freqTableData = results.frequencyTables[varName];
                    const freqTableObject = formatFrequencyTable(freqTableData);
                    if (freqTableObject && freqTableObject.tables) {
                        await addStatistic(analyticId, {
                            title: freqTableObject.tables[0]?.title || 'Frequency Table',
                            output_data: JSON.stringify(freqTableObject),
                            components: 'Frequency Table',
                            description: ''
                        });
                    }
                }
            }
            if (showCharts && chartOptions && results.frequencyTables) {
                await processAndAddCharts(analyticId, results.frequencyTables, chartOptions);
            }
            
            // === Performance Monitoring: End ===
            const endTime = performance.now();
            const executionTime = endTime - startTime;
            console.log(`[Frequencies Analysis] Analysis completed:`);
            console.log(`  - Variables processed: ${variableCount}`);
            console.log(`  - Cases analyzed: ${caseCount}`);
            console.log(`  - Execution time: ${executionTime.toFixed(2)}ms`);
            console.log(`  - End time: ${new Date().toISOString()}`);
            // === Performance Monitoring: End ===
            
            onClose();
        } else {
            // === Performance Monitoring: Error ===
            const endTime = performance.now();
            const executionTime = endTime - startTime;
            console.log(`[Frequencies Analysis] Analysis failed:`);
            console.log(`  - Execution time before error: ${executionTime.toFixed(2)}ms`);
            console.log(`  - Error: ${error || 'Unknown error'}`);
            // === Performance Monitoring: Error ===
            
            setErrorMsg(error || 'An unknown error occurred in the worker.');
        }
    }, [addStatistic, showFrequencyTables, showStatistics, onClose, selectedVariables, showCharts, chartOptions]);

    const runAnalysis = useCallback(async () => {
        if (selectedVariables.length === 0) {
            setErrorMsg("Please select at least one variable.");
            return;
        }

        // === Performance Monitoring: Start ===
        const startTime = performance.now();
        const variableCount = selectedVariables.length;
        const caseCount = allData?.length || 0;
        console.log(`[Frequencies Analysis] Starting analysis:`);
        console.log(`  - Variables: ${variableCount}`);
        console.log(`  - Cases: ${caseCount}`);
        console.log(`  - Start time: ${new Date().toISOString()}`);
        // === Performance Monitoring: End ===

        setIsLoading(true);
        setErrorMsg(null);

        // Compose SPSS-style log message based on current options
        const logMessage = buildFrequenciesLog(selectedVariables, statisticsOptions, chartOptions, showCharts);

        const logId = await addLog({ log: logMessage });
        const analyticId = await addAnalytic(logId, {
            title: 'Frequencies Analysis',
            note: selectedVariables.map(v => v.name).join(', '),
        });

        const workerClient = createPooledWorkerClient('frequencies');
        workerClientRef.current = workerClient;

        workerClient.onMessage((data: WorkerResult) => handleWorkerResult(data, analyticId, startTime, variableCount, caseCount));

        workerClient.onError((e: ErrorEvent) => {
            console.error("Frequencies worker error:", e);
            
            // === Performance Monitoring: Worker Error ===
            const endTime = performance.now();
            const executionTime = endTime - startTime;
            console.log(`[Frequencies Analysis] Worker error:`);
            console.log(`  - Execution time before error: ${executionTime.toFixed(2)}ms`);
            console.log(`  - Worker error: ${e.message}`);
            // === Performance Monitoring: Worker Error ===
            
            setErrorMsg(`An unexpected error occurred in the Frequencies worker: ${e.message}`);
            setIsLoading(false);
            if (workerClientRef.current) {
                workerClientRef.current.terminate();
                workerClientRef.current = null;
            }
        });
        
        const workerInput: WorkerInput = {
            variableData: selectedVariables.map(variable => ({
                variable: {
                    ...variable,
                    decimals: 2, // Use consistent 2 decimal places for all statistics
                },
                data: allData.map(row => row[variable.columnIndex]) as (string | number | null | undefined)[],
            })),
            weightVariableData: weights,
            options: {
                displayFrequency: showFrequencyTables,
                displayDescriptive: showStatistics,
                statisticsOptions,
                chartOptions
            }
        };
        workerClient.post(workerInput);

    }, [selectedVariables, allData, weights, showFrequencyTables, showStatistics, statisticsOptions, chartOptions, showCharts, addLog, addAnalytic, handleWorkerResult]);

    const cancelAnalysis = useCallback(() => {
        if (workerClientRef.current) {
            workerClientRef.current.terminate();
            workerClientRef.current = null;
            setIsLoading(false);
            console.log("Frequencies analysis cancelled.");
        }
    }, []);

    useEffect(() => {
        return () => cancelAnalysis();
    }, [cancelAnalysis]);

    return {
        isLoading,
        errorMsg,
        runAnalysis,
        cancelAnalysis,
    };
};