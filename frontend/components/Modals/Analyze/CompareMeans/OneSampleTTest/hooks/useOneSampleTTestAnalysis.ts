import { useState, useCallback, useRef, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useDataStore } from '@/stores/useDataStore';

import {
  OneSampleTTestAnalysisProps,
  OneSampleTTestResult
} from '../types';

import {
  formatOneSampleTestTable,
  formatOneSampleStatisticsTable,
} from '../utils/formatters'

export const useOneSampleTTestAnalysis = ({
  testVariables,
  testValue,
  estimateEffectSize,
  onClose
}: OneSampleTTestAnalysisProps) => {
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { addLog, addAnalytic, addStatistic } = useResultStore();
  const { data: analysisData } = useAnalysisData();

  const workerRef = useRef<Worker | null>(null);

  const resultsRef = useRef<OneSampleTTestResult[]>([]);
  const errorCountRef = useRef<number>(0);
  const processedCountRef = useRef<number>(0);
  const insufficientDataVarsRef = useRef<{variableName: string, variableLabel: string, insufficientType: string[]}[]>([]);

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

  const runAnalysis = useCallback(async () => {
    // 1. Catat waktu ketika runAnalysis dimulai
    timingRef.current.analysisStart = performance.now();
    
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

    let analysisTypes;
    if (estimateEffectSize) {
        // analysisTypes = ['oneSampleTTest', 'oneSampleTTestEffectSize'];
        analysisTypes = ['oneSampleTTest'];
    } else {
        analysisTypes = ['oneSampleTTest'];
    }

    // 2. Catat waktu ketika data dikirim ke web worker
    timingRef.current.dataSentToWorker = performance.now();

    testVariables.forEach(variable => {
      const dataForVar = analysisData.map(row => row[variable.columnIndex]);
      const payload = {
        analysisType: analysisTypes,
        variable1: variable,
        data1: dataForVar,
        options: { testValue, estimateEffectSize }
      };
      worker.postMessage(payload);
    });

    worker.onmessage = async (event) => {
      const { variableName, results, status, error: workerError } = event.data;

      // 3. Catat waktu ketika data diterima dari web worker
      if (processedCountRef.current === 0) {
        timingRef.current.dataReceivedFromWorker = performance.now();
      }

      if (status === 'success' && results) {
        // Check for metadata about insufficient data
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

      processedCountRef.current++;

      if (processedCountRef.current === testVariables.length) {
        try {
          // 4. Catat waktu ketika data diubah ke format tabel
          timingRef.current.dataFormattedToTable = performance.now();

          // Prepare log message
          const variableNames = testVariables.map(v => v.name).join(" ");
          let logMsg = `T-TEST {TESTVAL=${testValue}} {VARIABLES=${variableNames}}`;

          if (estimateEffectSize) {
            logMsg += `{ES DISPLAY (TRUE)}`;
          } else {
            logMsg += `{ES DISPLAY (FALSE)}`;
          }
          
          logMsg += `{CRITERIA=0.95}`;

          // Save to database
          const logId = await addLog({ log: logMsg });
          
          // Prepare note about insufficient data if needed
          let oneSampleStatisticsNote = "";
          if (insufficientDataVarsRef.current.length > 0) {
            oneSampleStatisticsNote += "Note: ";
            const typeToVars: Record<string, string[]> = {};
            for (const { variableName, variableLabel, insufficientType } of insufficientDataVarsRef.current) {
              for (const type of insufficientType) {
                if (!typeToVars[type]) typeToVars[type] = [];
                typeToVars[type].push(variableLabel || variableName);
              }
            }
            if (typeToVars["empty"] && typeToVars["empty"].length > 0) {
              oneSampleStatisticsNote += `[t cannot be computed for variable(s): ${typeToVars["empty"].join(", ")}. There are no valid cases for this analysis because all caseweights are not positive.]`;
            }
            if (typeToVars["single"] && typeToVars["single"].length > 0) {
              oneSampleStatisticsNote += `[t cannot be computed for variable(s): ${typeToVars["single"].join(", ")}. The sum of caseweights is less than or equal 1.]`;
            }
            if (typeToVars["stdDev"] && typeToVars["stdDev"].length > 0) {
              oneSampleStatisticsNote += `[t cannot be computed for variable(s): ${typeToVars["stdDev"].join(", ")}. The standard deviation is 0.]`;
            }
          }

          let note = "";
          if (insufficientDataVarsRef.current.length === testVariables.length) {
            note = "Note: The One-Sample Test table is not produced because all variables have insufficient data.";
          }
          
          // Create analytic with or without note
          const analyticId = await addAnalytic(logId, { title: "T-Test", note: note || undefined });

          const formattedOneSampleStatisticsTable = formatOneSampleStatisticsTable(resultsRef.current);

          await addStatistic(analyticId, {
            title: "One-Sample Statistics",
            output_data: JSON.stringify({ tables: [formattedOneSampleStatisticsTable] }),
            components: "One-Sample Statistics",
            description: oneSampleStatisticsNote
          });

          if (resultsRef.current.length > 0 && insufficientDataVarsRef.current.length < testVariables.length) {
            const formattedOneSampleTestTable = formatOneSampleTestTable(resultsRef.current, testValue);
            await addStatistic(analyticId, {
              title: "One-Sample Test",
              output_data: JSON.stringify({ tables: [formattedOneSampleTestTable] }),
              components: "One-Sample Test",
              description: ""
            });
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
//           console.log(`[OneSampleTTest][${testVariables.length} var][${totalDataRows} data] TIMING SUMMARY:
// Analysis start to data sent: ${timeToSendData}ms
// Data sent to data received: ${timeToReceiveData}ms
// Data received to formatting: ${timeToFormatData}ms
// Formatting to completion: ${timeToComplete}ms
// TOTAL TIME: ${totalTime}ms`);

          setIsCalculating(false);
          worker.terminate();
          workerRef.current = null;
          onClose?.();
        } catch (err) {
          console.error("Error saving results:", err);
          setErrorMsg("Error saving results.");
          setIsCalculating(false);
          worker.terminate();
          workerRef.current = null;
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
  }, [testVariables, testValue, estimateEffectSize, analysisData, addLog, addAnalytic, addStatistic, onClose]);

  const cancelAnalysis = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      setIsCalculating(false);
      console.log("One-Sample T-Test calculation cancelled.");
    }
  }, []);

  useEffect(() => {
    return () => {
      cancelAnalysis();
    };
  }, [cancelAnalysis]);
  
  return {
    isCalculating,
    errorMsg,
    runAnalysis,
    cancelAnalysis
  };
};

export default useOneSampleTTestAnalysis;