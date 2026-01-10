"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { DialogFooter } from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { useVariableStore } from '@/stores/useVariableStore';
import { useDataStore } from '@/stores/useDataStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useResultStore } from '@/stores/useResultStore';
import { useLinear } from '@/hooks/useLinear';
import { ChartService } from '@/services/chart/ChartService';
import { DataProcessingService } from '@/services/chart/DataProcessingService';
import Statistics, { StatisticsParams } from '@/components/Modals/Regression/Linear/Statistics';
import PlotsLinear, { PlotsLinearParams } from '@/components/Modals/Regression/Linear/PlotsLinear';
import SaveLinear from './SaveLinear';
import { SaveLinearParams } from './Type/SaveLinearParams';
import OptionsLinear, { OptionsLinearParams } from './OptionsLinear';
import VariablesLinearTab from './VariablesLinearTab';
import AssumptionTest, { AssumptionTestParams } from './AssumptionTest';
import { Variable } from '@/types/Variable';
import { CellUpdate } from '@/stores/useDataStore';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, HelpCircle } from "lucide-react";
import { TourPopup, ActiveElementHighlight } from '@/components/Common/TourComponents';
import { useTourGuide, TabControlProps } from '@/components/Modals/Analyze/Descriptive/Descriptive/hooks/useTourGuide';
import { baseTourSteps } from './hooks/tourConfig';
import { AnimatePresence } from 'framer-motion';

interface ModalLinearProps {
  onClose: () => void;
  containerType?: "dialog" | "sidebar";
}

// Default parameter states - sama seperti modal baru
const defaultStatsParams: StatisticsParams = {
  estimates: true,
  confidenceIntervals: false,
  confidenceLevel: '95', // Default confidence level
  covarianceMatrix: false,
  modelFit: true,
  rSquaredChange: false,
  descriptives: false,
  partAndPartial: false,
  collinearityDiagnostics: false,
  durbinWatson: false,
  casewiseDiagnostics: false,
  selectedResidualOption: '',
  outlierThreshold: '3'
};

const defaultPlotParams: PlotsLinearParams = {
    selectedY: null,
    selectedX: null,
    histogramForXChecked: false,
};

const defaultSaveParams: SaveLinearParams = {
  predictedUnstandardized: false,
  predictedStandardized: false,
  predictedAdjusted: false,
  predictedSE: false,
  residualUnstandardized: false,
  residualStandardized: false,
  residualStudentized: false,
  residualDeleted: false,
  residualStudentizedDeleted: false,
  distanceMahalanobis: false,
  distanceCooks: false,
  distanceLeverage: false,
  influenceDfBetas: false,
  influenceStandardizedDfBetas: false,
  influenceDfFits: false,
  influenceStandardizedDfFits: false,
  influenceCovarianceRatios: false,
  predictionMean: false,
  predictionIndividual: false,
  confidenceInterval: '95',
  createCoefficientStats: false,
  coefficientOption: 'newDataset',
  datasetName: '',
  xmlFilePath: '',
  includeCovarianceMatrixXml: false,
};

const defaultOptionsParams: OptionsLinearParams = {
  steppingMethod: 'probability',
  probEntry: '0.05',
  probRemoval: '0.10',
  fvalueEntry: '3.84',
  fvalueRemoval: '2.71',
  includeConstant: true,
  replaceWithMean: false,
};

const defaultAssumptionTestParams: AssumptionTestParams = {
  testLinearityEnabled: false,
  testNormalityEnabled: false,
  testHomoscedasticityEnabled: false,
  testMulticollinearityEnabled: false,
  testNonautocorrelationEnabled: false,
};

const ModalLinear: React.FC<ModalLinearProps> = ({ onClose, containerType = "dialog" }) => {
  // State variables - menggunakan struktur versi baru
  const [activeTab, setActiveTab] = useState<'variables' | 'statistics' | 'plots' | 'save' | 'options' | 'assumption'>('variables');
  const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);

  // -------------------- Help Tour --------------------
  const tabControl = React.useMemo<TabControlProps>(() => ({
    setActiveTab: (tab: string) => setActiveTab(tab as any),
    currentActiveTab: activeTab
  }), [activeTab]);

  const {
    tourActive,
    currentStep,
    tourSteps,
    currentTargetElement,
    startTour,
    nextStep,
    prevStep,
    endTour
  } = useTourGuide(baseTourSteps, containerType, tabControl);
  const [selectedDependentVariable, setSelectedDependentVariable] = useState<Variable | null>(null);
  const [selectedIndependentVariables, setSelectedIndependentVariables] = useState<Variable[]>([]);
  const [highlightedVariable, setHighlightedVariable] = useState<Variable | null>(null);
  const method = "Enter";
  
  // Inlined useValidationAlert hook logic
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ title: string, description: string }>({ title: "", description: "" });
  const [inlineAlertMessage, setInlineAlertMessage] = useState<string | null>(null);

  const showAlert = (title: string, description: string) => {
    if (containerType === "sidebar") {
        setInlineAlertMessage(`${title}: ${description}`);
    } else {
        setAlertMessage({ title, description });
        setAlertOpen(true);
    }
  };

  const ValidationAlert = () => (
    <>
        {containerType === "dialog" && (
            <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{alertMessage.title}</AlertDialogTitle>
                        <AlertDialogDescription>{alertMessage.description}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setAlertOpen(false)}>OK</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}
        {containerType === "sidebar" && inlineAlertMessage && (
            <div className="col-span-full p-2 mb-2 text-sm text-destructive-foreground bg-destructive rounded-md">
                {inlineAlertMessage}
                <Button variant="ghost" size="sm" onClick={() => setInlineAlertMessage(null)} className="ml-2 text-destructive-foreground hover:bg-destructive/80">Dismiss</Button>
            </div>
        )}
    </>
  );

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // State untuk parameter dari tab lain
  const [statsParams, setStatsParams] = useState<StatisticsParams>(defaultStatsParams);
  const [plotParams, setPlotParams] = useState<PlotsLinearParams>(defaultPlotParams);
  const [saveParams, setSaveParams] = useState<SaveLinearParams>(defaultSaveParams);
  const [optionsParams, setOptionsParams] = useState<OptionsLinearParams>(defaultOptionsParams);
  const [assumptionTestParams, setAssumptionTestParams] = useState<AssumptionTestParams>(defaultAssumptionTestParams);

  const variablesFromStore = useVariableStore((state) => state.variables);
  const { data } = useAnalysisData();
  const { calculateLinearRegression } = useLinear();
  const { addLog, addAnalytic, addStatistic } = useResultStore();

  // Side effect - mengambil dari versi baru yang lebih terstruktur
  useEffect(() => {
    // Update available variables for the Variables tab
    const allSelectedIndices = [
      selectedDependentVariable?.columnIndex,
      ...selectedIndependentVariables.map(v => v.columnIndex),
    ].filter(index => index !== undefined);

    const availableVars: Variable[] = variablesFromStore
      .filter(v => v.name && v.type !== 'STRING' && !allSelectedIndices.includes(v.columnIndex))
      .map((v): Variable => ({
        id: v.id,
        columnIndex: v.columnIndex,
        name: v.name,
        type: v.type,
        width: v.width,
        decimals: v.decimals,
        label: v.label,
        values: v.values,
        missing: v.missing,
        columns: v.columns,
        align: v.align,
        measure: v.measure,
        role: v.role,
      }));
    setAvailableVariables(availableVars);
  }, [variablesFromStore, selectedDependentVariable, selectedIndependentVariables]);

  // Prepare variables for the Plots tab - dari versi baru
  const availablePlotVariables = React.useMemo(() => {
    const standardPlotVars = [
        { name: "*ZPRED" },
        { name: "*ZRESID" },
        { name: "*DRESID" },
        { name: "*ADJPRED" },
        { name: "*SRESID" },
        { name: "*SDRESID" },
    ];
    const selectedVarsForPlot = [
        ...(selectedDependentVariable ? [{ name: selectedDependentVariable.name }] : []),
        ...selectedIndependentVariables.map(v => ({ name: v.name }))
    ];
    const combined = [...selectedVarsForPlot, ...standardPlotVars];
    return combined.filter((v, index, self) =>
        index === self.findIndex((t) => t.name === v.name)
    );
  }, [selectedDependentVariable, selectedIndependentVariables]);

  // Handler functions for variable tab - menggunakan yang dari versi baru
  const handleSelectAvailableVariable = (variable: Variable | null) => {
    setHighlightedVariable(variable);
  };

  const handleMoveToDependent = () => {
    if (highlightedVariable && availableVariables.some(v => v.columnIndex === highlightedVariable.columnIndex)) {
      const currentAvailable = availableVariables.filter(v => v.columnIndex !== highlightedVariable.columnIndex);
      if (selectedDependentVariable) {
          currentAvailable.push(selectedDependentVariable);
      }
      setAvailableVariables(currentAvailable.sort((a, b) => a.columnIndex - b.columnIndex));
      setSelectedDependentVariable(highlightedVariable);
      setHighlightedVariable(null);
    }
  };

  const handleMoveToIndependent = () => {
      if (highlightedVariable && availableVariables.some(v => v.columnIndex === highlightedVariable.columnIndex)) {
          const variableToAdd = availableVariables.find(v => v.columnIndex === highlightedVariable.columnIndex);
          if (variableToAdd) {
              setSelectedIndependentVariables((prev) => [...prev, variableToAdd].sort((a, b) => a.columnIndex - b.columnIndex));
              setAvailableVariables((prev) => prev.filter((item) => item.columnIndex !== highlightedVariable.columnIndex).sort((a, b) => a.columnIndex - b.columnIndex));
              setHighlightedVariable(null);
          }
      }
  };

  const handleRemoveFromDependent = () => {
    if (selectedDependentVariable) {
      setAvailableVariables((prev) => [...prev, selectedDependentVariable].sort((a, b) => a.columnIndex - b.columnIndex));
      setSelectedDependentVariable(null);
    }
  };

  const handleRemoveFromIndependent = (variable: Variable) => {
    setAvailableVariables((prev) => [...prev, variable].sort((a, b) => a.columnIndex - b.columnIndex));
    setSelectedIndependentVariables((prev) => prev.filter((item) => item.columnIndex !== variable.columnIndex));
  };

  // Handlers for parameter tabs - dari versi baru
  const handleStatsChange = (newParams: Partial<StatisticsParams>) => {
    setStatsParams(prev => ({ ...prev, ...newParams }));
  };

  const handlePlotChange = (newParams: Partial<PlotsLinearParams>) => {
    setPlotParams(prev => ({ ...prev, ...newParams }));
  };

  const handleSaveChange = (newParams: Partial<SaveLinearParams>) => {
    setSaveParams(prev => ({ ...prev, ...newParams }));
  };

  const handleOptionsChange = (newParams: Partial<OptionsLinearParams>) => {
    setOptionsParams(prev => ({ ...prev, ...newParams }));
  };

  const handleAssumptionTestChange = (newParams: Partial<AssumptionTestParams>) => {
    setAssumptionTestParams(prev => ({ ...prev, ...newParams }));
  };

  // handleReset - menggunakan versi baru
  const handleReset = () => {
    // Get all currently selected variables across all fields
     const allSelectedVars = [
        selectedDependentVariable,
        ...selectedIndependentVariables,
    ].filter(v => v !== null) as Variable[];

    // Reset available variables to the full list from the store
    setAvailableVariables(variablesFromStore.map(v => ({...v})).sort((a, b) => a.columnIndex - b.columnIndex));

    // Clear all selections
    setSelectedDependentVariable(null);
    setSelectedIndependentVariables([]);
    setHighlightedVariable(null);

    // Reset parameters for other tabs to defaults
    setStatsParams(defaultStatsParams);
    setPlotParams(defaultPlotParams);
    setSaveParams(defaultSaveParams);
    setOptionsParams(defaultOptionsParams);
    setAssumptionTestParams(defaultAssumptionTestParams);

    console.log("Reset button clicked - All selections and parameters reset");
  };

  const handleClose = () => {
    onClose();
  };

  // FUNGSI HANDLE ANALYZE DARI VERSI LAMA - diterapkan untuk versi baru
  const handleAnalyze = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // Validasi input
      if (!selectedDependentVariable || selectedIndependentVariables.length === 0) {
        showAlert('Input Error', 'Please select a dependent variable and at least one independent variable.');
        setIsLoading(false);
        return;
      }
      
      // Gunakan statsParams langsung dari state (tidak perlu localStorage)
      const currentStatsParams = statsParams;
      console.log("[Analyze] Using statistics parameters:", currentStatsParams);
  
      const dependentVarName = selectedDependentVariable.name;
      const independentVarNames = selectedIndependentVariables.map(v => v.name);
      // Prepare an array of objects with name and label for independents
      const independentVariableInfos = selectedIndependentVariables.map(v => ({
        name: v.name,
        label: v.label
      }));
  
      // Buat log message
      const logMessage = `REGRESSION 
      /MISSING LISTWISE 
      /STATISTICS COEFF OUTS R ANOVA 
      /CRITERIA=PIN(.05) POUT(.10) 
      /NOORIGIN 
      /DEPENDENT ${dependentVarName} 
      /METHOD=${method.toUpperCase()} ${independentVarNames.join(' ')}.`;
      
      console.log("[Analyze] Log message:", logMessage);
      const log = { log: logMessage };
      const logId = await addLog(log);
  
      const analytic = {
        title: "Linear Regression",
        note: "",
      };
      const analyticId = await addAnalytic(logId, analytic);
      console.log("[Analyze] Analytic ID:", analyticId);
  
      // Array to hold all statistic-generating promises
      const statisticPromises: Promise<any>[] = [];

      // Declare filtered data arrays ahead so helper functions can reference them
      let filteredDependentData: number[] = [];
      let filteredIndependentData: number[][] = [];

      // Flags indicating whether user ticked SAVE checkboxes for predicted and/or residual variables.
      const predictedSaveSelected =
        saveParams.predictedUnstandardized ||
        saveParams.predictedStandardized ||
        saveParams.predictedAdjusted ||
        saveParams.predictedSE;

      const residualSaveSelected =
        saveParams.residualUnstandardized ||
        saveParams.residualStandardized ||
        saveParams.residualStudentized ||
        saveParams.residualDeleted ||
        saveParams.residualStudentizedDeleted;

      // Will hold the residuals processing function, defined later.
      let processResiduals: () => Promise<void>;

      /* --------------------------------------------------------------------------------
         Helper functions so we can reuse the same worker-push code multiple times and
         keep the correct left-to-right order requested by the user.
      ---------------------------------------------------------------------------------*/

      // Flags to prevent duplicate queuing of shared workers
      let modelSummaryQueued = false;
      let variablesQueued = false;
      let anovaQueued = false;
      let coefficientsQueued = false;

      //  H1. Variables Entered/Removed (variables.js)
      const pushVariablesWorker = () => {
        if (variablesQueued) return;
        variablesQueued = true;
        statisticPromises.push(new Promise((resolve, reject) => {
          const variablesWorker = new Worker('/workers/Regression/variables.js');
          variablesWorker.postMessage({
            dependent: filteredDependentData,
            independent: filteredIndependentData,
            dependentVariableInfo: { name: selectedDependentVariable.name, label: selectedDependentVariable.label },
            independentVariableInfos: independentVariableInfos
          });

          variablesWorker.onmessage = async (e: MessageEvent) => {
            const variablesResults = e.data;
            await addStatistic(analyticId, {
              title: 'Variables Entered/Removed',
              output_data: JSON.stringify(variablesResults),
              components: 'VariablesEnteredRemoved',
              description: 'Variables entered/removed in the regression analysis'
            });
            variablesWorker.terminate();
            resolve(true);
          };

          variablesWorker.onerror = (err: ErrorEvent) => {
            variablesWorker.terminate();
            reject(err);
          };
        }));
      };

      //  H2. Model Summary (model_summary.js)
      const pushModelSummaryWorker = () => {
        if (modelSummaryQueued) return; // prevent duplicate queueing
        modelSummaryQueued = true;
        statisticPromises.push(new Promise((resolve, reject) => {
          const modelSummaryWorker = new Worker('/workers/Regression/model_summary.js');
          modelSummaryWorker.postMessage({
            dependent: filteredDependentData,
            independent: filteredIndependentData
          });

          modelSummaryWorker.onmessage = async (e: MessageEvent) => {
            const modelSummaryResults = e.data;
            await addStatistic(analyticId, {
              title: 'Model Summary',
              output_data: JSON.stringify(modelSummaryResults),
              components: 'ModelSummary',
              description: 'Summary of the regression model'
            });
            modelSummaryWorker.terminate();
            resolve(true);
          };

          modelSummaryWorker.onerror = (err: ErrorEvent) => {
            modelSummaryWorker.terminate();
            reject(err);
          };
        }));
      };

      //  H3. ANOVA (anova.js)
      const pushAnovaWorker = () => {
        if (anovaQueued) return;
        anovaQueued = true;
        statisticPromises.push(new Promise((resolve, reject) => {
          const anovaWorker = new Worker('/workers/Regression/anova.js');
          anovaWorker.postMessage({
            dependentData: filteredDependentData,
            independentData: filteredIndependentData
          });

          anovaWorker.onmessage = async (e: MessageEvent) => {
            const anovaStat = e.data;
            if (anovaStat.error) {
              anovaWorker.terminate();
              reject(new Error(anovaStat.error));
              return;
            }
            await addStatistic(analyticId, {
              title: anovaStat.title,
              output_data: anovaStat.output_data,
              components: anovaStat.components,
              description: 'ANOVA analysis results'
            });
            anovaWorker.terminate();
            resolve(true);
          };

          anovaWorker.onerror = (err: ErrorEvent) => {
            anovaWorker.terminate();
            reject(err);
          };
        }));
      };

      //  H4. Coefficients (coefficients.js)
      const pushCoefficientsWorker = () => {
        if (coefficientsQueued) return;
        coefficientsQueued = true;
        statisticPromises.push(new Promise((resolve, reject) => {
          const coefficientsWorker = new Worker('/workers/Regression/coefficients.js');
          coefficientsWorker.postMessage({
            dependentData: filteredDependentData,
            independentData: filteredIndependentData,
            independentVariableInfos: independentVariableInfos
          });

          coefficientsWorker.onmessage = async (e: MessageEvent) => {
            const { success, result, error } = e.data;
            if (success) {
              await addStatistic(analyticId, {
                title: 'Coefficients',
                output_data: JSON.stringify(result),
                components: 'Coefficients',
                description: 'Coefficients of the regression model'
              });
              coefficientsWorker.terminate();
              resolve(true);
            } else {
              coefficientsWorker.terminate();
              reject(new Error(error));
            }
          };

          coefficientsWorker.onerror = (err: ErrorEvent) => {
            coefficientsWorker.terminate();
            reject(err);
          };
        }));
      };

      // Persiapkan data dan variabel
      const allVariables = variablesFromStore;
      const dataRows = data;
  
      const dependentVar = selectedDependentVariable;
      const independentVars = selectedIndependentVariables;
  
      const dependentVarIndex = dependentVar?.columnIndex;
      const independentVarIndices = independentVars.map(v => v.columnIndex);
  
      if (dependentVarIndex === undefined || independentVarIndices.some(index => index === undefined)) {
        throw new Error('Variable indices not found.');
      }
  
      const depVarIndex = dependentVarIndex;
      const indepVarIndices = independentVarIndices as number[];
  
      // Persiapkan data untuk analisis
      const dependentData = dataRows.map(row => parseFloat(String(row[depVarIndex])));
      const independentData = indepVarIndices.map(index => dataRows.map(row => parseFloat(String(row[index]))));
      console.log("[Analyze] Data awal - Dependent:", dependentData);
      console.log("[Analyze] Data awal - Independent (per variable):", independentData);

      if (optionsParams.replaceWithMean) {
        console.log("[Analyze] Missing value strategy: Replace with mean.");
        const calculateMean = (arr: number[]) => {
            const validNumbers = arr.filter(n => !isNaN(n));
            if (validNumbers.length === 0) return 0;
            const sum = validNumbers.reduce((acc, val) => acc + val, 0);
            return sum / validNumbers.length;
        };

        const dependentMean = calculateMean(dependentData);
        filteredDependentData = dependentData.map(val => isNaN(val) ? dependentMean : val);

        filteredIndependentData = independentData.map(varData => {
            const mean = calculateMean(varData);
            return varData.map(val => isNaN(val) ? mean : val);
        });
      } else {
        console.log("[Analyze] Missing value strategy: Listwise deletion.");
        // Filter data yang valid (listwise deletion)
        const validIndices = dependentData.map((value, idx) => {
          if (isNaN(value) || independentData.some(indepData => isNaN(indepData[idx]))) {
            return false;
          }
          return true;
        });
    
        filteredDependentData = dependentData.filter((_, idx) => validIndices[idx]);
        filteredIndependentData = independentData.map(indepData => indepData.filter((_, idx) => validIndices[idx]));
      }
  
      console.log("[Analyze] Data valid - Dependent:", filteredDependentData);
      console.log("[Analyze] Data valid - Independent (per variable):", filteredIndependentData);
  
      // Transpose data untuk perhitungan regresi
      const independentDataTransposed = filteredIndependentData[0].map((_, idx) =>
        filteredIndependentData.map(indepData => indepData[idx])
      );
  
      // Hitung regresi (core calculation)
      const regressionResults = calculateLinearRegression(filteredDependentData, independentDataTransposed);
      console.log("[Analyze] Hasil regresi (calculateLinearRegression):", regressionResults);

      // Process SaveLinear options
      if (
        saveParams.predictedUnstandardized ||
        saveParams.predictedStandardized ||
        saveParams.predictedAdjusted ||
        saveParams.predictedSE
      ) {
        if (regressionResults && regressionResults.coefficients) {
          console.log("[Analyze] Starting Predicted Values calculation...");
          
          const predictedValuesWorker = new Worker('/workers/Regression/Save/predictedValues.js');
          console.log("[Analyze] Worker created for Predicted Values");
          
          // Format data untuk worker
          const workerData = {
            independentData: independentDataTransposed.map(row => 
              row.map(val => {
                const num = Number(val);
                return isNaN(num) ? 0 : num;
              })
            ),
            coefficients: regressionResults.coefficients.map(coef => {
              const num = Number(coef.coefficient);
              return isNaN(num) ? 0 : num;
            }),
            dependentData: filteredDependentData
          };
          
          console.log("[Analyze] Data prepared for worker:", {
            independentDataLength: workerData.independentData.length,
            independentVarsCount: workerData.independentData[0]?.length,
            firstRow: workerData.independentData[0],
            coefficients: workerData.coefficients,
            dependentDataLength: workerData.dependentData.length
          });
          
          predictedValuesWorker.postMessage(workerData);
          console.log("[Analyze] Data sent to worker");

          predictedValuesWorker.onmessage = async (e: MessageEvent) => {
            console.log("[Analyze] Received response from worker:", e.data);
            const response = e.data;
            
            if (response && response.error) {
              console.error("[Analyze] Worker error:", response.error);
              alert(`Error in Predicted Values worker: ${response.error}`);
            } else {
              console.log("[Analyze] Processing worker response...");
              
              try {
                // Pastikan response adalah array objek dengan nilai prediksi
                const predictedValues = Array.isArray(response) ? response : [];
                console.log("[Analyze] Predicted values array:", predictedValues);
                
                const existingVars = useVariableStore.getState().variables.map(v => v.name);
                
                const findNextNumber = (prefix: string) => {
                  const pattern = new RegExp(`^${prefix}_(\\d+)$`);
                  let maxNum = 0;
                  
                  existingVars.forEach(name => {
                    const match = name.match(pattern);
                    if (match) {
                      const num = parseInt(match[1], 10);
                      if (num > maxNum) maxNum = num;
                    }
                  });
                  
                  return maxNum + 1;
                };
                
                // 1. Prepare metadata and values for each requested predicted type
                interface NewPredictedVar { meta: Partial<Variable>; values: number[]; }

                const newPredictedVars: NewPredictedVar[] = [];

                if (saveParams.predictedUnstandardized) {
                  const preNumber = findNextNumber("PRE");
                  newPredictedVars.push({
                    meta: {
                      name: `PRE_${preNumber}`,
                      label: `Predicted Values (Unstandardized) - ${selectedDependentVariable.name}`,
                      type: "NUMERIC",
                      width: 12,
                      decimals: 5,
                      measure: "scale",
                    },
                    values: predictedValues.map(v => v.unstandardized),
                  });
                }

                if (saveParams.predictedStandardized) {
                  const zprNumber = findNextNumber("ZPR");
                  newPredictedVars.push({
                    meta: {
                      name: `ZPR_${zprNumber}`,
                      label: `Predicted Values (Standardized) - ${selectedDependentVariable.name}`,
                      type: "NUMERIC",
                      width: 12,
                      decimals: 5,
                      measure: "scale",
                    },
                    values: predictedValues.map(v => v.standardized),
                  });
                }

                if (saveParams.predictedAdjusted) {
                  const adjNumber = findNextNumber("ADJ");
                  newPredictedVars.push({
                    meta: {
                      name: `ADJ_${adjNumber}`,
                      label: `Predicted Values (Adjusted) - ${selectedDependentVariable.name}`,
                      type: "NUMERIC",
                      width: 12,
                      decimals: 5,
                      measure: "scale",
                    },
                    values: predictedValues.map(v => v.adjusted),
                  });
                }

                if (saveParams.predictedSE) {
                  const sepNumber = findNextNumber("SEP");
                  newPredictedVars.push({
                    meta: {
                      name: `SEP_${sepNumber}`,
                      label: `S.E. of mean predictions - ${selectedDependentVariable.name}`,
                      type: "NUMERIC",
                      width: 12,
                      decimals: 5,
                      measure: "scale",
                    },
                    values: predictedValues.map(v => v.se),
                  });
                }

                if (newPredictedVars.length === 0) {
                  console.warn("[Analyze] No predicted variables selected, skipping variable creation.");
                } else {
                  // 2. Convert to structures expected by addVariables and aggregate cell updates
                  const currentVarCount = useVariableStore.getState().variables.length;
                  const varsForStore: Partial<Variable>[] = [];
                  const aggregatedUpdates: CellUpdate[] = [];

                  newPredictedVars.forEach((nv, idx) => {
                    const columnIndex = currentVarCount + idx;
                    varsForStore.push({
                      ...nv.meta,
                      columnIndex,
                    });

                    nv.values.forEach((value, rowIndex) => {
                      aggregatedUpdates.push({
                        row: rowIndex,
                        col: columnIndex,
                        value: Number(value.toFixed(5)),
                      });
                    });
                  });

                  // 3. Add all variables in a single operation and apply updates
                  await useVariableStore.getState().addVariables(varsForStore, aggregatedUpdates);
                  console.log("[Analyze] Predicted variables added:", varsForStore.map(v => v.name));

                  // After predicted variables are safely added, run residuals
                  // if the user requested them.
                  if (residualSaveSelected) {
                    await processResiduals();
                  }
                }

              } catch (error) {
                console.error("[Analyze] Error saving predicted values:", error);
                alert("Failed to save predicted values as new variables");
              }
            }
            predictedValuesWorker.terminate();
            
            // Resolve helper promise in case someone wants to await completion
            // (currently not used but kept for future sequencing needs)
            // resolvePredicted?.();
          };

          predictedValuesWorker.onerror = (error: ErrorEvent) => {
            console.error("[Analyze] Worker error:", {
              message: error.message,
              error: error
            });
            alert(`Failed to run Predicted Values worker: ${error.message}`);
            predictedValuesWorker.terminate();
          };
        } else {
          console.error("[Analyze] Missing regression results:", {
            hasResults: !!regressionResults,
            hasCoefficients: regressionResults?.coefficients ? true : false
          });
          alert("Regression results or coefficients not available to calculate predicted values.");
        }
      }
      // End of SaveLinear options processing example

      // ------------------------------------------------------------------
      // Residuals processing is wrapped into an async helper so we can call
      // it after predicted values finish (to prevent column index overlap).
      // ------------------------------------------------------------------
      processResiduals = async () => {
        if (!(saveParams.residualUnstandardized || saveParams.residualStandardized || 
              saveParams.residualStudentized || saveParams.residualDeleted || 
              saveParams.residualStudentizedDeleted)) {
          return; // nothing to do
        }

        // ----- (original block content begins) -----
        if (regressionResults && regressionResults.coefficients) {
          console.log("[Analyze] Starting Residuals calculation...");
          console.log("[Analyze] Regression results:", regressionResults);
          
          const residualsWorker = new Worker('/workers/Regression/Save/residuals.js');
          console.log("[Analyze] Worker created for Residuals");
          
          // Format data untuk worker
          const workerData = {
            independentData: independentDataTransposed.map(row => 
              row.map(val => {
                const num = Number(val);
                return isNaN(num) ? 0 : num;
              })
            ),
            coefficients: regressionResults.coefficients.map(coef => {
              const num = Number(coef.coefficient);
              return isNaN(num) ? 0 : num;
            }),
            dependentData: filteredDependentData
          };
          
          console.log("[Analyze] Data prepared for residuals worker:", {
            independentDataLength: workerData.independentData.length,
            independentVarsCount: workerData.independentData[0]?.length,
            firstRow: workerData.independentData[0],
            coefficients: workerData.coefficients,
            dependentDataLength: workerData.dependentData.length
          });
          
          return new Promise<void>((resolve, reject) => {
            residualsWorker.postMessage(workerData);

            residualsWorker.onmessage = async (e: MessageEvent) => {
              console.log("[Analyze] Received response from residuals worker:", e.data);
              const response = e.data;
              
              if (response && response.error) {
                console.error("[Analyze] Residuals worker error:", response.error);
                alert(`Error in Residuals worker: ${response.error}`);
              } else {
                console.log("[Analyze] Processing residuals worker response...");
                
                try {
                  // Pastikan response adalah array objek dengan nilai residual
                  const residualValues = Array.isArray(response) ? response : [];
                  console.log("[Analyze] Residual values array:", residualValues);
                  
                  // Get the next save sequence number for each residual type
                  const existingVars = useVariableStore.getState().variables.map(v => v.name);
                  
                  // Find the highest number for each prefix
                  const findNextNumber = (prefix: string) => {
                    const pattern = new RegExp(`^${prefix}_(\\d+)$`);
                    let maxNum = 0;
                    
                    existingVars.forEach(name => {
                      const match = name.match(pattern);
                      if (match) {
                        const num = parseInt(match[1], 10);
                        if (num > maxNum) maxNum = num;
                      }
                    });
                    
                    return maxNum + 1;
                  };
                  
                  // Create new variables for each type of residual
                  const newVariables = [];
                  
                  if (saveParams.residualUnstandardized) {
                    const resNumber = findNextNumber("RES");
                    newVariables.push({
                      name: `RES_${resNumber}`,
                      label: `Residuals (Unstandardized) - ${selectedDependentVariable.name}`,
                      values: residualValues.map(v => v.unstandardized)
                    });
                  }
                  
                  if (saveParams.residualStandardized) {
                    const zresNumber = findNextNumber("ZRE");
                    newVariables.push({
                      name: `ZRE_${zresNumber}`,
                      label: `Residuals (Standardized) - ${selectedDependentVariable.name}`,
                      values: residualValues.map(v => v.standardized)
                    });
                  }
                  
                  if (saveParams.residualStudentized) {
                    const sreNumber = findNextNumber("SRE");
                    newVariables.push({
                      name: `SRE_${sreNumber}`,
                      label: `Residuals (Studentized) - ${selectedDependentVariable.name}`,
                      values: residualValues.map(v => v.studentized)
                    });
                  }
                  
                  if (saveParams.residualDeleted) {
                    const dreNumber = findNextNumber("DRE");
                    newVariables.push({
                      name: `DRE_${dreNumber}`,
                      label: `Residuals (Deleted) - ${selectedDependentVariable.name}`,
                      values: residualValues.map(v => v.deleted)
                    });
                  }
                  
                  if (saveParams.residualStudentizedDeleted) {
                    const sdreNumber = findNextNumber("SDR");
                    newVariables.push({
                      name: `SDR_${sdreNumber}`,
                      label: `Residuals (Studentized Deleted) - ${selectedDependentVariable.name}`,
                      values: residualValues.map(v => v.studentizedDeleted)
                    });
                  }

                  console.log("[Analyze] New residual variables to create:", newVariables);

                  // --------------------------------------------------------------
                  // Bulk-insert all residual variables in a single operation
                  // --------------------------------------------------------------
                  if (newVariables.length > 0) {
                    const currentVarCount = useVariableStore.getState().variables.length;

                    // 1. Build metadata for each new variable
                    const varsForStore: Partial<Variable>[] = newVariables.map((nv, idx) => ({
                      name: nv.name,
                      label: nv.label,
                      type: "NUMERIC",
                      width: 12,
                      decimals: 5,
                      measure: "scale",
                      columnIndex: currentVarCount + idx,
                    }));

                    // 2. Aggregate all cell updates across variables
                    const aggregatedUpdates: CellUpdate[] = [];
                    newVariables.forEach((nv, varIdx) => {
                      const colIdx = currentVarCount + varIdx;
                      nv.values.forEach((value: number, rowIndex: number) => {
                        aggregatedUpdates.push({
                          row: rowIndex,
                          col: colIdx,
                          value: Number(value.toFixed(5)),
                        });
                      });
                    });

                    // 3. Persist variables and data in one shot
                    await useVariableStore.getState().addVariables(varsForStore, aggregatedUpdates);

                    console.log("[Analyze] Residual variables successfully saved (bulk)");
                  } else {
                    console.warn("[Analyze] No residual variables selected, skipping save step.");
                  }

                } catch (error) {
                  console.error("[Analyze] Error saving residual values:", error);
                  alert("Failed to save residual values as new variables");
                }
              }
              residualsWorker.terminate();
              console.log("[Analyze] Residuals worker terminated");
              resolve(); // Resolve the promise
            };

            residualsWorker.onerror = (error: ErrorEvent) => {
              console.error("[Analyze] Residuals worker error:", {
                message: error.message,
                error: error
              });
              alert(`Failed to run Residuals worker: ${error.message}`);
              residualsWorker.terminate();
              reject(error); // Reject the promise
            };
          });
        } else {
          console.error("[Analyze] Missing regression results:", {
            hasResults: !!regressionResults,
            hasCoefficients: regressionResults?.coefficients ? true : false
          });
          alert("Regression results or coefficients not available to calculate residuals.");
        }
      }; // end processResiduals
      // ------------------------------------------------------------------
      // When only residuals are requested (no predicted values), run now.
      // If predicted values are also requested, residuals will be triggered
      // from inside predicted worker after it completes.
      // ------------------------------------------------------------------
      if (!predictedSaveSelected && residualSaveSelected) {
        await processResiduals();
      }

      // 1. Variables & Coefficients (Estimates)
      if (currentStatsParams.estimates) {
        pushVariablesWorker();
      }

      // 2. Model Fit group: variables -> model summary -> anova
      if (currentStatsParams.modelFit) {
        pushVariablesWorker();
        pushModelSummaryWorker();
        pushAnovaWorker();
      }
      
      // 3. Coefficients Worker (needed by estimates, descriptives, casewiseDiagnostics)
      if (currentStatsParams.estimates || currentStatsParams.descriptives || currentStatsParams.casewiseDiagnostics) {
        pushCoefficientsWorker();
      }

      // 4. R-Square Change (Conditional)
      if (currentStatsParams.rSquaredChange) {
        pushVariablesWorker(); // mapping requires variables.js first
        statisticPromises.push(new Promise((resolve, reject) => {
          const worker = new Worker('/workers/Regression/rsquare.js');
          console.log("[Analyze] Mengirim data ke Worker untuk perhitungan regresi (squared changes)...");
          worker.postMessage({
            dependent: filteredDependentData,
            independent: filteredIndependentData
          });
    
          worker.onmessage = async (e: MessageEvent) => {
            const workerResults = e.data;
            console.log("[Analyze] Hasil dari Worker:", workerResults);
            const rSquareStat = {
              title: "Model Summary (R Square Change)",
              output_data: JSON.stringify(workerResults),
              components: "RSquareChange",
              description: "R square change statistics"
            };
            await addStatistic(analyticId, rSquareStat);
            console.log("[Analyze] Statistik R Square Change disimpan.");
            
            worker.terminate();
            resolve(true);
          };
    
          worker.onerror = (error: ErrorEvent) => {
            console.error("[Analyze] Worker error:", error);
            worker.terminate();
            reject(error);
          };
        }));
      } else {
        console.log("[Analyze] Skipping R Square Change calculation (not selected).");
      }
  
      // 5. Confidence Intervals (Conditional)
      if (currentStatsParams.confidenceIntervals) {
        pushVariablesWorker();
        statisticPromises.push(new Promise((resolve, reject) => {
          const confidenceWorker = new Worker('/workers/Regression/confidence_interval.js');
          console.log("[Analyze] Mengirim data ke Worker untuk Confidence Interval...");
          confidenceWorker.postMessage({
            dependent: filteredDependentData,
            independent: filteredIndependentData,
            dependentVariableInfo: { name: selectedDependentVariable.name, label: selectedDependentVariable.label },
            independentVariableInfos: independentVariableInfos,
            confidenceLevel: parseFloat(currentStatsParams.confidenceLevel) || 95, // Pass confidence level
          });
    
          confidenceWorker.onmessage = async (e: MessageEvent) => {
            const confidenceResults = e.data;
            console.log("[Analyze] Hasil Confidence Interval dari Worker:", confidenceResults);

            if (confidenceResults.error) {
                console.error("[Analyze] Worker Confidence Interval error:", confidenceResults.error);
                reject(new Error(confidenceResults.error));
                confidenceWorker.terminate();
                return;
            }

            const confidenceStat = {
              title: "Confidence Interval",
              output_data: JSON.stringify(confidenceResults),
              components: "ConfidenceInterval",
              description: "Confidence interval for regression coefficients"
            };
            await addStatistic(analyticId, confidenceStat);
            console.log("[Analyze] Statistik Confidence Interval disimpan.");
            confidenceWorker.terminate();
            resolve(true);
          };
    
          confidenceWorker.onerror = (error: ErrorEvent) => {
            console.error("[Analyze] Worker Confidence Interval error:", error);
            confidenceWorker.terminate();
            reject(error);
          };
        }));
      } else {
        console.log("[Analyze] Skipping Confidence Interval calculation (not selected).");
      }
  
      // 6. Part and Partial Correlations (Conditional)
      if (currentStatsParams.partAndPartial) {
        // Ensure Variables table precedes part & partial worker
        pushVariablesWorker();
        statisticPromises.push(new Promise((resolve, reject) => {
          const partAndPartialWorker = new Worker('/workers/Regression/coefficients_partandpartial.js');
          console.log("[Analyze] Mengirim data ke Worker untuk Coefficients Part & Partial Correlations...");
          partAndPartialWorker.postMessage({
            dependent: filteredDependentData,
            independents: filteredIndependentData,
            independentVariableInfos: independentVariableInfos
          });
    
          partAndPartialWorker.onmessage = async (e: MessageEvent) => {
            const partAndPartialResults = e.data;
            console.log("[Analyze] Hasil dari Worker Coefficients Part & Partial:", partAndPartialResults);
            const partAndPartialStat = {
              title: "Coefficients (Part & Partial Correlations)",
              output_data: JSON.stringify(partAndPartialResults),
              components: "CoefficientsPartAndPartial",
              description: "Part and partial correlations of regression coefficients"
            };
            await addStatistic(analyticId, partAndPartialStat);
            console.log("[Analyze] Statistik Coefficients Part & Partial disimpan.");
            partAndPartialWorker.terminate();
            resolve(true);
          };
    
          partAndPartialWorker.onerror = (error: ErrorEvent) => {
            console.error("[Analyze] Worker Coefficients Part & Partial error:", error);
            partAndPartialWorker.terminate();
            reject(error);
          };
        }));
      } else {
        console.log("[Analyze] Skipping Part & Partial Correlations (not selected).");
      }
  
      // 7. Collinearity Diagnostics (Conditional)
      if (currentStatsParams.collinearityDiagnostics) {
        pushVariablesWorker();
        // 7a. Coefficients Collinearity
        statisticPromises.push(new Promise((resolve, reject) => {
          const collinearityWorker = new Worker('/workers/Regression/coefficients_collinearity.js');
          console.log("[Analyze] Mengirim data ke Worker untuk Coefficients Collinearity...");
          collinearityWorker.postMessage({
            dependent: filteredDependentData,
            independent: filteredIndependentData,
            independentVariableInfos: independentVariableInfos
          });
    
          collinearityWorker.onmessage = async (e: MessageEvent) => {
            const collinearityResults = e.data;
            console.log("[Analyze] Hasil dari Worker Coefficients Collinearity:", collinearityResults);
            const collinearityStat = {
              title: "Collinearity Statistics",
              output_data: JSON.stringify(collinearityResults),
              components: "CollinearityStatistics",
              description: "Collinearity statistics for regression variables"
            };
            await addStatistic(analyticId, collinearityStat);
            console.log("[Analyze] Statistik Collinearity Diagnostics disimpan.");
            collinearityWorker.terminate();
            resolve(true);
          };
    
          collinearityWorker.onerror = (error: ErrorEvent) => {
            console.error("[Analyze] Worker Coefficients Collinearity error:", error);
            collinearityWorker.terminate();
            reject(error);
          };
        }));
        
        // 7b. Collinearity Diagnostics (Detailed)
        statisticPromises.push(new Promise((resolve, reject) => {
          const collinearityDiagnosticsWorker = new Worker('/workers/Regression/collinearity_diagnostics.js');
          console.log("[Analyze] Mengirim data ke Worker untuk Collinearity Diagnostics...");
          collinearityDiagnosticsWorker.postMessage({
            dependent: filteredDependentData,
            independent: filteredIndependentData,
            dependentVariableInfo: { name: selectedDependentVariable.name, label: selectedDependentVariable.label },
            independentVariableInfos: independentVariableInfos
          });
    
          collinearityDiagnosticsWorker.onmessage = async (e: MessageEvent) => {
            const collinearityDiagnosticsResults = e.data;
            console.log("[Analyze] Hasil dari Worker Collinearity Diagnostics:", collinearityDiagnosticsResults);
            const collinearityDiagnosticsStat = {
              title: "Collinearity Diagnostics",
              output_data: JSON.stringify(collinearityDiagnosticsResults),
              components: "CollinearityDiagnostics",
              description: "Detailed collinearity diagnostics"
            };
            await addStatistic(analyticId, collinearityDiagnosticsStat);
            console.log("[Analyze] Statistik Collinearity Diagnostics disimpan.");
            collinearityDiagnosticsWorker.terminate();
            resolve(true);
          };
    
          collinearityDiagnosticsWorker.onerror = (error: ErrorEvent) => {
            console.error("[Analyze] Worker Collinearity Diagnostics error:", error);
            collinearityDiagnosticsWorker.terminate();
            reject(error);
          };
        }));
      } else {
        console.log("[Analyze] Skipping Collinearity Diagnostics (not selected).");
      }
  
      // 8. Durbin-Watson (Conditional)
      if (currentStatsParams.durbinWatson) {
        pushVariablesWorker();
        statisticPromises.push(new Promise((resolve, reject) => {
          const modelDurbinWorker = new Worker('/workers/Regression/model_durbin.js');
          console.log("[Analyze] Mengirim data ke Worker untuk Model Durbin...");
          modelDurbinWorker.postMessage({
            dependent: filteredDependentData,
            independent: filteredIndependentData
          });
    
          modelDurbinWorker.onmessage = async (e: MessageEvent) => {
            const modelDurbinResults = e.data;
            console.log("[Analyze] Hasil dari Worker Model Durbin:", modelDurbinResults);
            const modelDurbinStat = {
              title: "Model Summary (Durbin-Watson)",
              output_data: JSON.stringify(modelDurbinResults),
              components: "ModelDurbin",
              description: "Durbin-Watson test statistics"
            };
            await addStatistic(analyticId, modelDurbinStat);
            console.log("[Analyze] Statistik Model Durbin disimpan.");
            modelDurbinWorker.terminate();
            resolve(true);
          };
    
          modelDurbinWorker.onerror = (error: ErrorEvent) => {
            console.error("[Analyze] Worker Model Durbin error:", error);
            modelDurbinWorker.terminate();
            reject(error);
          };
        }));

        // After Durbin Worker, queue ANOVA then Coefficients then Residual Statistics will come later
        pushAnovaWorker();
        pushCoefficientsWorker();
      } else {
        console.log("[Analyze] Skipping Durbin-Watson test (not selected).");
      }
  
      // 9. Residuals Statistics (Conditional - Durbin-Watson or Casewise Diagnostics)
      if (currentStatsParams.durbinWatson || currentStatsParams.casewiseDiagnostics) {
        statisticPromises.push(new Promise((resolve, reject) => {
          const residualsStatisticsWorker = new Worker('/workers/Regression/residuals_statistics.js');
          console.log("[Analyze] Mengirim data ke Worker untuk Residuals Statistics...");
          residualsStatisticsWorker.postMessage({
            dependent: filteredDependentData,
            independent: filteredIndependentData
          });
    
          residualsStatisticsWorker.onmessage = async (e: MessageEvent) => {
            const residualsStatisticsResults = e.data;
            console.log("[Analyze] Hasil dari Worker Residuals Statistics:", residualsStatisticsResults);
            const residualsStatisticsStat = {
              title: "Residuals Statistics",
              output_data: JSON.stringify(residualsStatisticsResults),
              components: "ResidualsStatistics",
              description: "Statistics of regression residuals"
            };
            await addStatistic(analyticId, residualsStatisticsStat);
            console.log("[Analyze] Statistik Residuals Statistics disimpan.");
            residualsStatisticsWorker.terminate();
            resolve(true);
          };
    
          residualsStatisticsWorker.onerror = (error: ErrorEvent) => {
            console.error("[Analyze] Worker Residuals Statistics error:", error);
            residualsStatisticsWorker.terminate();
            reject(error);
          };
        }));
      } else {
        console.log("[Analyze] Skipping Residuals Statistics (no residual option selected).");
      }
  
      // 10. Casewise Diagnostics (Conditional)
      if (currentStatsParams.casewiseDiagnostics) {
        // Variables, Model Summary, ANOVA should always precede any casewise diagnostics tables
        pushVariablesWorker();
        pushModelSummaryWorker();
        pushAnovaWorker();

        if (currentStatsParams.selectedResidualOption === 'allCases') {
        statisticPromises.push(new Promise((resolve, reject) => {
          const casewiseDiagnosticsWorker = new Worker('/workers/Regression/casewise_diagnostics.js');
          console.log("[Analyze] Mengirim data ke Worker untuk Casewise Diagnostics (All Cases selected)...");
          casewiseDiagnosticsWorker.postMessage({
            dependent: filteredDependentData,
            independent: filteredIndependentData,
            // Threshold is only relevant if "outliers" was selected, but worker might still use it.
            // For "all cases", threshold isn't directly used for filtering by this component,
            // but the worker itself might have logic based on it, or it might be ignored.
            // We pass it along for now.
            threshold: parseFloat(currentStatsParams.outlierThreshold) || 3,
            dependentVariableInfo: { name: selectedDependentVariable.name, label: selectedDependentVariable.label }
          });

          casewiseDiagnosticsWorker.onmessage = async (e: MessageEvent) => {
            const casewiseDiagnosticsResults = e.data;
            console.log("[Analyze] Hasil dari Worker Casewise Diagnostics:", casewiseDiagnosticsResults);
            const casewiseDiagnosticsStat = {
              title: "Casewise Diagnostics",
              output_data: JSON.stringify(casewiseDiagnosticsResults),
              components: "CasewiseDiagnostics",
              description: "Casewise diagnostics for outlier detection"
            };
            await addStatistic(analyticId, casewiseDiagnosticsStat);
            console.log("[Analyze] Statistik Casewise Diagnostics disimpan.");
            // ANOVA & Coefficients after Casewise Diagnostics
            casewiseDiagnosticsWorker.terminate();
            resolve(true);
          };
    
          casewiseDiagnosticsWorker.onerror = (error: ErrorEvent) => {
            console.error("[Analyze] Worker Casewise Diagnostics error:", error);
            casewiseDiagnosticsWorker.terminate();
            reject(error);
          };
        }));
        } else {
          console.log("[Analyze] Skipping Casewise Diagnostics table (Outliers outside selected). Variables/ModelSummary/ANOVA already queued.");
        }
      } else if (currentStatsParams.casewiseDiagnostics && currentStatsParams.selectedResidualOption === 'outliers') {
        console.log("[Analyze] Skipping Casewise Diagnostics table (Outliers outside selected).");
      } else {
        console.log("[Analyze] Skipping Casewise Diagnostics (not selected or no specific residual option for table).");
      }
  
      // 11. Covariance Matrix (Conditional)
      if (currentStatsParams.covarianceMatrix) {
        pushVariablesWorker();
        statisticPromises.push(new Promise((resolve, reject) => {
          const coefficientCorrelationsWorker = new Worker('/workers/Regression/coefficient_correlations.js');
          console.log("[Analyze] Mengirim data ke Worker untuk Coefficient Correlations...");
          coefficientCorrelationsWorker.postMessage({
            dependent: filteredDependentData,
            independent: filteredIndependentData,
            dependentVariableInfo: { name: selectedDependentVariable.name, label: selectedDependentVariable.label },
            independentVariableInfos: independentVariableInfos
          });
    
          coefficientCorrelationsWorker.onmessage = async (e: MessageEvent) => {
            const correlationsResults = e.data;
            console.log("[Analyze] Hasil dari Worker Coefficient Correlations:", correlationsResults);
            const correlationsStat = {
              title: "Coefficient Correlations",
              output_data: JSON.stringify(correlationsResults),
              components: "CoefficientCorrelations",
              description: "Correlations between regression coefficients"
            };
            await addStatistic(analyticId, correlationsStat);
            console.log("[Analyze] Statistik Coefficient Correlations disimpan.");
            coefficientCorrelationsWorker.terminate();
            resolve(true);
          };
    
          coefficientCorrelationsWorker.onerror = (error: ErrorEvent) => {
            console.error("[Analyze] Worker Coefficient Correlations error:", error);
            coefficientCorrelationsWorker.terminate();
            reject(error);
          };
        }));
      } else {
        console.log("[Analyze] Skipping Correlation calculations (covariance matrix not selected).");
      }
  
      // 12. Descriptive Statistics (Conditional)
      if (currentStatsParams.descriptives) {
        // 12a. Descriptive Statistics
        statisticPromises.push(new Promise((resolve, reject) => {
          const descriptiveWorker = new Worker('/workers/Regression/descriptive_statistics.js');
          console.log("[Analyze] Mengirim data ke Worker untuk Descriptive Statistics...");
          descriptiveWorker.postMessage({
            dependent: filteredDependentData,
            independent: filteredIndependentData,
            dependentVariableInfo: { name: selectedDependentVariable.name, label: selectedDependentVariable.label },
            independentVariableInfos: independentVariableInfos
          });
    
          descriptiveWorker.onmessage = async (e: MessageEvent) => {
            const descriptiveResults = e.data;
            console.log("[Analyze] Hasil Descriptive Statistics dari Worker:", descriptiveResults);
            const descriptiveStat = {
              title: "Descriptive Statistics",
              output_data: JSON.stringify(descriptiveResults),
              components: "DescriptiveStatistics",
              description: "Descriptive statistics for the variables"
            };
            await addStatistic(analyticId, descriptiveStat);
            console.log("[Analyze] Statistik Descriptive Statistics disimpan.");
            descriptiveWorker.terminate();
            resolve(true);
          };
    
          descriptiveWorker.onerror = (error: ErrorEvent) => {
            console.error("[Analyze] Worker Descriptive Statistics error:", error);
            descriptiveWorker.terminate();
            reject(error);
          };
        }));
        
        // 12b. Correlations
        statisticPromises.push(new Promise((resolve, reject) => {
          const correlationsWorker = new Worker('/workers/Regression/correlations.js');
          console.log("[Analyze] Mengirim data ke Worker untuk Correlations...");
          correlationsWorker.postMessage({
            dependent: filteredDependentData,
            independent: filteredIndependentData,
            dependentVariableInfo: { name: selectedDependentVariable.name, label: selectedDependentVariable.label },
            independentVariableInfos: independentVariableInfos
          });
    
          correlationsWorker.onmessage = async (e: MessageEvent) => {
            const correlationsResults = e.data;
            console.log("[Analyze] Hasil dari Worker Correlations:", correlationsResults);
            const correlationsStat = {
              title: "Correlations",
              output_data: JSON.stringify(correlationsResults),
              components: "Correlations",
              description: "Correlation matrix between variables"
            };
            await addStatistic(analyticId, correlationsStat);
            console.log("[Analyze] Statistik Correlations disimpan.");
            correlationsWorker.terminate();
            resolve(true);
          };
    
          correlationsWorker.onerror = (error: ErrorEvent) => {
            console.error("[Analyze] Worker Correlations error:", error);
            correlationsWorker.terminate();
            reject(error);
          };
        }));

        // 12c. Variables Entered/Removed (after correlations)
        pushVariablesWorker();
        // 12d. Model Summary follows variables
        pushModelSummaryWorker();
        // 12e. ANOVA after model summary
        pushAnovaWorker();

      } else {
        console.log("[Analyze] Skipping Descriptive Statistics (not selected).");
      }
  
      // 13. Model Summary fallback (queue only if not already queued)
      if (!modelSummaryQueued && (currentStatsParams.modelFit || currentStatsParams.descriptives || currentStatsParams.casewiseDiagnostics)) {
        pushModelSummaryWorker();
      } else {
        console.log("[Analyze] Skipping Model Summary (model fit not selected).");
      }

      // Wait for all statistical tables to be processed
      await Promise.all(statisticPromises);
      console.log("[Analyze] All statistical tables have been added to the result store.");
 
      // Handle plot generation (MOVED TO THE END)
      if (plotParams.selectedX) {
        console.log("[Analyze] Plotting requested:", plotParams);
        const plotWorker = new Worker('/workers/Regression/plotData.worker.js');

        const plotWorkerData = {
          independentData: independentDataTransposed,
          coefficients: regressionResults.coefficients.map(c => c.coefficient),
          dependentData: filteredDependentData
        };

        plotWorker.postMessage(plotWorkerData);

        plotWorker.onmessage = async (e: MessageEvent) => {
          const plotData = e.data;
          if (!plotData.success) {
            console.error("[Analyze] Plot worker failed:", plotData.error);
            setErrorMsg(`Failed to generate plot data: ${plotData.error}`);
            plotWorker.terminate();
            return;
          }

          console.log("[Analyze] Received plot data from worker:", plotData);
          
          const { addStatistic } = useResultStore.getState();

          // Build a comprehensive map of all available data for plotting
          const comprehensivePlotData: { [key: string]: number[] } = {
            ...plotData,
          };
          // Add independent variables to the map
          independentVarNames.forEach((name, index) => {
            comprehensivePlotData[name] = filteredIndependentData[index];
          });


          // Mapping of special variable names to data keys
          const plotDataMapping: { [key: string]: keyof typeof comprehensivePlotData } = {
            '*ZPRED': 'zpred',
            '*ZRESID': 'zresid',
            '*DRESID': 'dresid',
            '*ADJPRED': 'predicted',
            '*SRESID': 'sresid',
            '*SDRESID': 'sdresid',
            [dependentVarName]: 'dependent'
          };
          
          // 1. Handle Scatter Plot
          if (plotParams.selectedX && plotParams.selectedY) {
            const xVarName = plotParams.selectedX;
            const yVarName = plotParams.selectedY;

            // Find data key, checking the mapping first, then the comprehensive data
            const xDataKey = plotDataMapping[xVarName] || xVarName;
            const yDataKey = plotDataMapping[yVarName] || yVarName;

            const xData = comprehensivePlotData[xDataKey];
            const yData = comprehensivePlotData[yDataKey];

            if (xData && yData) {
                const rawDataForChart = xData.map((xVal: number, i: number) => [xVal, yData[i]]);
                const variablesForChart = [{ name: xVarName }, { name: yVarName }];

                try {
                    const processedData = DataProcessingService.processDataForChart({
                        chartType: 'Scatter Plot',
                        rawData: rawDataForChart,
                        variables: variablesForChart,
                        chartVariables: { x: [xVarName], y: [yVarName] }
                    });

                    const chartJSON = ChartService.createChartJSON({
                        chartType: 'Scatter Plot',
                        chartData: processedData.data,
                        chartVariables: { x: [xVarName], y: [yVarName] },
                        chartMetadata: {
                            title: 'Scatterplot',
                            subtitle: `Dependent Variable: ${selectedDependentVariable.label ? selectedDependentVariable.label : selectedDependentVariable.name}`,
                            axisInfo: processedData.axisInfo
                        },
                        chartConfig: {
                            axisLabels: { x: xVarName, y: yVarName }
                        }
                    });

                    await addStatistic(analyticId, {
                        title: 'Scatterplot',
                        output_data: JSON.stringify(chartJSON),
                        components: 'Chart',
                        description: `Dependent Variable: ${selectedDependentVariable.label ? selectedDependentVariable.label : selectedDependentVariable.name}`
                    });
                } catch(chartError) {
                    console.error("[Analyze] Error creating scatterplot with ChartService:", chartError);
                }
            } else {
               console.warn(`[Analyze] Could not generate scatterplot. Data not available for X=${xVarName} or Y=${yVarName}`);
            }
          }

          // 2. Handle Histogram for X-axis
          if (plotParams.histogramForXChecked && plotParams.selectedX) {
              const histVarName = plotParams.selectedX;
              const histDataKey = plotDataMapping[histVarName] || histVarName;
              const histData = comprehensivePlotData[histDataKey];

              if (histData) {
                  const rawDataForHist = histData.map((val: number) => [val]);
                  const variablesForHist = [{ name: histVarName }];
                  
                  try {
                      const processedData = DataProcessingService.processDataForChart({
                          chartType: 'Histogram',
                          rawData: rawDataForHist,
                          variables: variablesForHist,
                          chartVariables: { y: [histVarName] }
                      });

                      const chartJSON = ChartService.createChartJSON({
                          chartType: 'Histogram',
                          chartData: processedData.data,
                          chartVariables: { y: [histVarName] },
                          chartMetadata: {
                              title: `Histogram of ${histVarName}`,
                              subtitle: `Dependent Variable: ${selectedDependentVariable.label ? selectedDependentVariable.label : selectedDependentVariable.name}`,
                              axisInfo: processedData.axisInfo
                          },
                          chartConfig: {
                              axisLabels: { x: histVarName, y: 'Frequency' }
                          }
                      });

                      await addStatistic(analyticId, {
                          title: 'Histogram',
                          output_data: JSON.stringify(chartJSON),
                          components: 'Chart',
                          description: `Dependent Variable: ${selectedDependentVariable.label ? selectedDependentVariable.label : selectedDependentVariable.name}`
                      });
                  } catch(chartError) {
                      console.error("[Analyze] Error creating histogram with ChartService:", chartError);
                  }
              } else {
                  console.warn(`[Analyze] Could not generate histogram. Data not available for ${histVarName}`);
              }
          }

          plotWorker.terminate();
        };

        plotWorker.onerror = (error: ErrorEvent) => {
            console.error("[Analyze] Plot worker error:", error);
            setErrorMsg(`An error occurred in the plot data worker: ${error.message}`);
            plotWorker.terminate();
        };
      }

      // Tutup modal setelah memulai analisis
      onClose();
  
    } catch (error: unknown) {
      console.error('[Analyze] Failed to perform linear regression:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setErrorMsg(`Failed to perform linear regression: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Feature Tour elements */}
      <AnimatePresence>
        {tourActive && tourSteps.length > 0 && currentStep < tourSteps.length && (
          <TourPopup
            step={tourSteps[currentStep]}
            currentStep={currentStep}
            totalSteps={tourSteps.length}
            onNext={nextStep}
            onPrev={prevStep}
            onClose={endTour}
            targetElement={currentTargetElement}
          />
        )}
      </AnimatePresence>
      <ActiveElementHighlight active={tourActive} />
      <ValidationAlert />
      <div className="px-6 py-4">
        <Separator className="my-2" />
      </div>

      <div className="flex-grow px-6 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger id="linear-variables-tab-trigger" data-testid="linear-variables-tab" value="variables">Variables</TabsTrigger>
            <TabsTrigger id="linear-statistics-tab-trigger" data-testid="linear-statistics-tab" value="statistics">Statistics</TabsTrigger>
            <TabsTrigger id="linear-plots-tab-trigger" data-testid="linear-plots-tab" value="plots">Plots</TabsTrigger>
            <TabsTrigger id="linear-save-tab-trigger" data-testid="linear-save-tab" value="save">Save</TabsTrigger>
            <TabsTrigger data-testid="linear-options-tab" value="options">Options</TabsTrigger>
            <TabsTrigger id="linear-assumption-tab-trigger" data-testid="linear-assumption-tab" value="assumption">Assumption</TabsTrigger>
          </TabsList>

          {/* Variables Tab */}
          <TabsContent value="variables">
            <VariablesLinearTab
              availableVariables={availableVariables}
              selectedDependentVariable={selectedDependentVariable}
              selectedIndependentVariables={selectedIndependentVariables}
              highlightedVariable={highlightedVariable}
              method={method}
              handleSelectAvailableVariable={handleSelectAvailableVariable}
              handleMoveToDependent={handleMoveToDependent}
              handleMoveToIndependent={handleMoveToIndependent}
              handleRemoveFromDependent={handleRemoveFromDependent}
              handleRemoveFromIndependent={handleRemoveFromIndependent}
            />
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics">
            <Statistics params={statsParams} onChange={handleStatsChange} showAlert={showAlert} />
          </TabsContent>

          {/* Plots Tab */}
          <TabsContent value="plots">
            <PlotsLinear
              params={plotParams}
              onChange={handlePlotChange}
              availablePlotVariables={availablePlotVariables} />
          </TabsContent>

          {/* Save Tab */}
          <TabsContent value="save">
             <SaveLinear params={saveParams} onChange={handleSaveChange} />
          </TabsContent>

          {/* Options Tab */}
          <TabsContent value="options">
             <OptionsLinear params={optionsParams} onChange={handleOptionsChange} showAlert={showAlert} />
          </TabsContent>

          {/* Assumption Test Tab */}
          <TabsContent value="assumption">
            <AssumptionTest 
              params={assumptionTestParams} 
              onChange={handleAssumptionTestChange}
              selectedDependentVariable={selectedDependentVariable}
              selectedIndependentVariables={selectedIndependentVariables}
            />
          </TabsContent>
        </Tabs>
        {errorMsg && (
            <div className="mt-4">
                <Alert variant="destructive">
                    <AlertTitle>Analysis Error</AlertTitle>
                    <AlertDescription>{errorMsg}</AlertDescription>
                </Alert>
            </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
        {/* Left: Help button with tooltip */}
        <div className="flex items-center text-muted-foreground">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  data-testid="linear-help-button"
                  variant="ghost"
                  size="icon"
                  onClick={startTour}
                  aria-label="Start feature tour"
                  className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">Start feature tour</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Right: Action buttons */}
        <div className="flex items-center space-x-4">
          <Button onClick={handleAnalyze} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...
              </>
            ) : (
              'OK'
            )}
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={isLoading}>
            Reset
          </Button>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModalLinear;