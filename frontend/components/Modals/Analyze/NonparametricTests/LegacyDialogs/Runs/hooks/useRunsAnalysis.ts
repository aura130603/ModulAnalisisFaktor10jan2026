import { useState, useCallback, useRef, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useDataStore } from '@/stores/useDataStore';

import {
  RunsAnalysisProps,
  RunsTestResults,
  RunsTestResult
} from '../types';

import {
  formatRunsTestTable,
  formatDescriptiveStatisticsTable,
} from '../utils/formatters';

export const useRunsAnalysis = ({
  testVariables,
  cutPoint,
  customValue,
  displayStatistics,
  onClose
}: RunsAnalysisProps) => {
  const { addLog, addAnalytic, addStatistic } = useResultStore();
  const { data: analysisData } = useAnalysisData();

  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);

  const resultsRef = useRef<RunsTestResult[]>([]);
  const errorCountRef = useRef<number>(0);
  const processedCountRef = useRef<number>(0);
  const insufficientDataVarsRef = useRef<{ variableName: string; variableLabel: string; insufficientType: string[] }[]>([]);

  // Perform analysis
  const runAnalysis = useCallback(async (): Promise<void> => {
    if (testVariables.length === 0) {
      setErrorMsg("Please select at least one variable.");
      return;
    }

    if (!cutPoint.median && !cutPoint.mode && !cutPoint.mean && !cutPoint.custom) {
      setErrorMsg("Please select at least one cut point.");
      return;
    }

    if (cutPoint.custom && customValue === null) {
      setErrorMsg("Please provide a custom value.");
      return;
    }

    setErrorMsg(null);
    setIsCalculating(true);

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

    const worker = new Worker('/workers/NonparametricTests/manager.js', { type: 'module' });
    workerRef.current = worker;

    let analysisTypes;
    if (displayStatistics.descriptive || displayStatistics.quartiles) {
      analysisTypes = ['descriptiveStatistics', 'runs'];
    } else {
      analysisTypes = ['runs'];
    }

    testVariables.forEach(variable => {
      const dataForVar = analysisData.map(row => row[variable.columnIndex]);
      const payload = {
        analysisType: analysisTypes,
        variable1: variable,
        data1: dataForVar,
        options: { cutPoint, customValue, displayStatistics }
      };
      worker.postMessage(payload);
    });

    worker.onmessage = async (event) => {
      const { variableName, results, status, error: workerError } = event.data;
      
      if (status === 'success' && results) {
        // console.log(variableName, 'results', JSON.stringify(results));
        if (results.metadata?.hasInsufficientData) {
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

      processedCountRef.current += 1;

      if (processedCountRef.current === testVariables.length) {
        if (resultsRef.current.length > 0) {
          try {
            // Format tables
            const formattedDescriptiveStatisticsTable = formatDescriptiveStatisticsTable(resultsRef.current, displayStatistics);
            const formattedRunsTestTable = formatRunsTestTable(resultsRef.current);

            // Prepare log message
            const variableNames = testVariables.map(v => v.name).join(" ");
            let logMsg = `NPAR TESTS`;

            if (cutPoint.median) {
              logMsg += `{RUNS (MEDIAN)=${variableNames}}`;
            }

            if (cutPoint.mode) {
              logMsg += `{RUNS (MODE)=${variableNames}}`;
            }

            if (cutPoint.mean) {
              logMsg += `{RUNS (MEAN)=${variableNames}}`;
            }

            if (cutPoint.custom) {
              logMsg += `{RUNS (${customValue})=${variableNames}}`;
            }

            if (displayStatistics?.descriptive || displayStatistics?.quartiles) {
              logMsg += `{STATISTICS`;
              if (displayStatistics.descriptive) logMsg += ` DESCRIPTIVES`;
              if (displayStatistics.quartiles) logMsg += ` QUARTILES`;
              logMsg += `}`;
            }

            // Save to database
            const logId = await addLog({ log: logMsg });

            let runsTestNote: Record<string, string> = {};
            let note = "";
            let typeToVars: Record<string, string[]> = {};
            // console.log('insufficientDataVarsRef.current', JSON.stringify(insufficientDataVarsRef.current));
            if (insufficientDataVarsRef.current.length > 0) {
              for (const { variableName, variableLabel, insufficientType } of insufficientDataVarsRef.current) {
                for (const type of insufficientType) {
                  if (!typeToVars[type]) typeToVars[type] = [];
                  typeToVars[type].push(variableLabel || variableName);
                }
              }
              if (typeToVars["empty"] && typeToVars["empty"].length > 0) {
                note += `Note: There are not enough valid cases to perform the Runs Test for ${typeToVars["empty"].join(", ")}. No statistics are computed.`;
              }
              if (typeToVars["single median"] && typeToVars["single median"].length > 0) {
                runsTestNote["Median"] = `Note: The Runs Test cannot be performed for variable(s): ${typeToVars["single median"].join(", ")}. All values are greater than or less than the cutoff (Only one run occurs).`;
              }
              if (typeToVars["single mode"] && typeToVars["single mode"].length > 0) {
                runsTestNote["Mode"] = `Note: The Runs Test cannot be performed for variable(s): ${typeToVars["single mode"].join(", ")}. All values are greater than or less than the cutoff (Only one run occurs).`;
              }
              if (typeToVars["single mean"] && typeToVars["single mean"].length > 0) {
                runsTestNote["Mean"] = `Note: The Runs Test cannot be performed for variable(s): ${typeToVars["single mean"].join(", ")}. All values are greater than or less than the cutoff (Only one run occurs).`;
              }
              if (typeToVars["single custom"] && typeToVars["single custom"].length > 0) {
                runsTestNote[`Custom (${customValue})`] = `Note: The Runs Test cannot be performed for variable(s): ${typeToVars["single custom"].join(", ")}. All values are greater than or less than the cutoff (Only one run occurs).`;
              }

            }
            // console.log('runsTestNote', JSON.stringify(runsTestNote));

            const analyticId = await addAnalytic(logId, { title: "Runs Test", note: note || undefined });

            // Add descriptive statistics table
            if (displayStatistics?.descriptive || displayStatistics?.quartiles) {
              await addStatistic(analyticId, {
                title: "Descriptive Statistics",
                output_data: JSON.stringify({ tables: [formattedDescriptiveStatisticsTable] }),
                components: "Descriptive Statistics",
                description: ""
              });
            }

            // Add runs test table
            // formattedRunsTestTable is an array of RunsTestTable(s)
            if (Array.isArray(formattedRunsTestTable) && formattedRunsTestTable.length > 0) {
              for (const table of formattedRunsTestTable) {
                let cutPointType = "Test";
                
                // Extract cut point type from table title
                if (table.title.includes("(Median)")) {
                  cutPointType = "Median";
                } else if (table.title.includes("(Mean)")) {
                  cutPointType = "Mean";
                } else if (table.title.includes("(Mode)")) {
                  cutPointType = "Mode";
                } else if (table.title.includes(`Custom (${customValue})`)) {
                  cutPointType = `Custom (${customValue})`;
                }
                
                await addStatistic(analyticId, {
                  title: `Runs Test (${cutPointType})`,
                  output_data: JSON.stringify({ tables: [table] }),
                  components: `Runs Test (${cutPointType})`,
                  description: runsTestNote[cutPointType] || ""
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
  }, [testVariables, cutPoint, customValue, displayStatistics, addLog, addAnalytic, addStatistic, onClose, analysisData]);

  const cancelCalculation = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      setIsCalculating(false);
      console.log("Runs Test calculation cancelled.");
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

export default useRunsAnalysis;