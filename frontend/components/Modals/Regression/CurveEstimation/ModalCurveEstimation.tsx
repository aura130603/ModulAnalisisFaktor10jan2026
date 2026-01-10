// components/Modals/CurveEstimation/ModalCurveEstimation.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, HelpCircle } from 'lucide-react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { TourPopup, ActiveElementHighlight } from '@/components/Common/TourComponents';
import { useTourGuide, TabControlProps } from '@/components/Modals/Analyze/Descriptive/Descriptive/hooks/useTourGuide';
import { baseTourSteps } from './hooks/tourConfig';
import { AnimatePresence } from 'framer-motion';
import { useVariableStore } from '@/stores/useVariableStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useResultStore } from '@/stores/useResultStore';
import { Variable, VariableType } from '@/types/Variable';
import { Chart, registerables } from 'chart.js';
// Import ChartService for generating scatter plot JSON with multiple fit lines
import { ChartService } from '@/services/chart/ChartService';
import { Separator } from '@/components/ui/separator';

// Import our custom tab components (menggunakan struktur baru)
import VariablesTab from './VariablesTab';
import ModelsTab from './ModelsTab';

// Register Chart.js components (must run after all imports)
Chart.register(...registerables);

// Updated to match OpenSavFile pattern
export interface ModalCurveEstimationProps {
  onClose: () => void;
  containerType?: string;
}

// Using named export like OpenSavFile
export const ModalCurveEstimation: React.FC<ModalCurveEstimationProps> = ({ onClose, containerType = "dialog" }) => {
  // State for variables
  const [activeTab, setActiveTab] = useState<'variables' | 'models'>('variables');

  // ------------------ Help Tour ------------------
  const tabControl = React.useMemo<TabControlProps>(() => ({
    setActiveTab: (tab: string) => setActiveTab(tab as any),
    currentActiveTab: activeTab,
  }), [activeTab]);

  const {
    tourActive,
    currentStep,
    tourSteps,
    currentTargetElement,
    startTour,
    nextStep,
    prevStep,
    endTour,
  } = useTourGuide(baseTourSteps, containerType as any, tabControl);
  const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
  const [highlightedVariable, setHighlightedVariable] = useState<string | null>(null);
  const [selectedDependentVariable, setSelectedDependentVariable] = useState<Variable | null>(null);
  const [selectedIndependentVariables, setSelectedIndependentVariables] = useState<Variable | null>(null);

  // State for models
  const [selectedModels, setSelectedModels] = useState<string[]>(['Linear']);
  const [includeConstant, setIncludeConstant] = useState<boolean>(true); // State ini ada, tapi tidak dikirim ke worker oleh handleRunRegression versi lama
  const [plotModels, setPlotModels] = useState<boolean>(true);
  const [displayANOVA, setDisplayANOVA] = useState<boolean>(false); // State ini ada, tapi tidak dikirim ke worker oleh handleRunRegression versi lama
  const [upperBound, setUpperBound] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ title: "", description: "" });
  const [inlineAlertMessage, setInlineAlertMessage] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);

  const variablesFromStore = useVariableStore((state) => state.variables);
  const { data } = useAnalysisData();
  const { addLog, addAnalytic, addStatistic } = useResultStore();

  // useEffect untuk memfilter availableVariables (dari kode baru)
  useEffect(() => {
    // Initial population of available variables
    const initialVars = variablesFromStore.filter(
      (v) =>
        v.type !== 'STRING' &&
        v.columnIndex !== selectedDependentVariable?.columnIndex &&
        v.columnIndex !== selectedIndependentVariables?.columnIndex
    );
    setAvailableVariables(initialVars);
  }, [variablesFromStore, selectedDependentVariable?.columnIndex, selectedIndependentVariables?.columnIndex]);

  const showAlert = (title: string, description: string) => {
    if (containerType === "sidebar") {
        setInlineAlertMessage(`${title}: ${description}`);
    } else {
        setAlertMessage({ title, description });
        setAlertOpen(true);
    }
  };

  // Handlers untuk VariablesTab (dari kode baru)
  const handleDependentDoubleClick = (variable: Variable) => {
    if (isProcessing) return;
    if (!variable) return;

    if (selectedDependentVariable) {
        setAvailableVariables(prev => [...prev, selectedDependentVariable]);
    }

    setSelectedDependentVariable(variable);
    setAvailableVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
    setHighlightedVariable(null);
  };

  const handleIndependentDoubleClick = (variable: Variable) => {
    if (isProcessing) return;

    if (selectedIndependentVariables) {
        setAvailableVariables(prev => [...prev, selectedIndependentVariables]);
    }
    
    setSelectedIndependentVariables(variable);
    setAvailableVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
    setHighlightedVariable(null);
  };

  const moveToDependent = () => {
    if (isProcessing || !highlightedVariable) return;
    const variable = availableVariables.find(v => v.columnIndex.toString() === highlightedVariable);
    if (variable) {
        handleDependentDoubleClick(variable);
    }
  };

  const moveToIndependent = () => {
    if (isProcessing || !highlightedVariable) return;
    const variable = availableVariables.find(v => v.columnIndex.toString() === highlightedVariable);
    if (variable) {
        handleIndependentDoubleClick(variable);
    }
  };

  const removeDependent = () => {
    if (isProcessing || !selectedDependentVariable) return;
    setAvailableVariables(prev => [...prev, selectedDependentVariable]);
    setSelectedDependentVariable(null);
  };

  const removeIndependent = () => {
    if (isProcessing || !selectedIndependentVariables) return;
    setAvailableVariables(prev => [...prev, selectedIndependentVariables]);
    setSelectedIndependentVariables(null);
  };

  // Handler untuk ModelsTab (dari kode baru)
  const handleModelChange = (model: string) => {
    setSelectedModels((prev) =>
        prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]
    );
  };

  // Handler Close (dari kode baru)
  const handleClose = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    onClose();
  };

  // Handler Reset (dari kode baru)
  const handleReset = () => {
    if (selectedDependentVariable) {
      setAvailableVariables(prev => [...prev, selectedDependentVariable]);
    }
    if (selectedIndependentVariables) {
      setAvailableVariables(prev => [...prev, selectedIndependentVariables]);
    }
    setSelectedDependentVariable(null);
    setSelectedIndependentVariables(null);
    setHighlightedVariable(null);
    setSelectedModels(['Linear']);
    setIncludeConstant(true);
    setPlotModels(true);
    setDisplayANOVA(false);
    setUpperBound('');
    setErrorMessage(null);
  };

  // ========================================================================
  // <<< INI ADALAH FUNGSI handleRunRegression DARI KODE LAMA >>>
  // Menggunakan filtering data lama dan payload postMessage lama
  // ========================================================================
  const handleRunRegression = async () => {
    setInlineAlertMessage(null);
    if (!selectedDependentVariable || !selectedIndependentVariables) {
      showAlert('Input Error', 'Please select both a dependent and an independent variable.');
      setIsProcessing(false);
      return;
    }

    // Validate upper bound for Logistic model only if the user provided a value.
    // Allow empty input (""), which will trigger automatic upper-bound estimation in the worker—
    // mimicking SPSS behaviour.
    if (selectedModels.includes('Logistic') && upperBound !== '' && isNaN(parseFloat(upperBound))) {
        showAlert("Invalid Input", "Upper bound must be a valid numeric value.");
        return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const depCol = selectedDependentVariable.columnIndex;
      const indepColX = selectedIndependentVariables.columnIndex;
      const independentVarNames = [selectedIndependentVariables.name];
      const dependentVarName = selectedDependentVariable.name;

      // New data filtering: Perform listwise deletion on the data from useAnalysisData
      const X_data: number[] = [];
      const Y_data: number[] = [];

      data.forEach(row => {
        // Ensure column indices are valid for the row
        if (depCol < row.length && indepColX < row.length) {
          const yVal = Number(row[depCol]);
          const xVal = Number(row[indepColX]);

          // Include row only if both values are valid numbers
          if (!isNaN(yVal) && !isNaN(xVal)) {
            Y_data.push(yVal);
            X_data.push(xVal);
          }
        }
      });

      if (X_data.length === 0) {
        setErrorMessage("No valid data pairs found after listwise deletion.");
        setIsProcessing(false);
        return;
      }

      const method = selectedModels.join(', ');

      // Log message LAMA (selalu /NOORIGIN)
      const logMessage = `REGRESSION
/MISSING LISTWISE
/STATISTICS COEFF OUTS R ANOVA
/CRITERIA=PIN(.05) POUT(.10)
/NOORIGIN
/DEPENDENT ${dependentVarName}
/METHOD=${method.toUpperCase()} ${independentVarNames.join(' ')}.`;

      const log = { log: logMessage };
      const logId = await addLog(log);
      console.log("[CurveEstimation OLD CALC] Log created with ID:", logId);

      const analytic = {
        title: "Curve Estimation",
        note: "",
      };
      const analyticId = await addAnalytic(logId, analytic);
      console.log("[CurveEstimation OLD CALC] Analytic created with ID:", analyticId);

      if (workerRef.current) {
        workerRef.current.terminate();
      }

      workerRef.current = new Worker('/workers/CurveEstimation/curve_estimation.js');

      workerRef.current.onmessage = async (event) => {
        const { action, data: workerData } = event.data; // Ganti nama variabel data

        if (action === 'regressionResults') {
          console.log("[CurveEstimation OLD CALC] Received regression results:", workerData);

          if (workerData.success) {
            // Deskripsi statistik LAMA (generik)
            const regressionSummaryStat = {
              title: "Curve Estimation",
              output_data: JSON.stringify(workerData.result),
              components: "CurveEstimationSummary",
              description: "Curve estimation analysis results" // Deskripsi generik lama
            };

            try {
              await addStatistic(analyticId, regressionSummaryStat);
              console.log("[CurveEstimation OLD CALC] Statistics saved successfully");

              // ============================================================
              // Generate Scatter Plot With Multiple Fit Line (NEW)
              // ============================================================

              // 1. Prepare scatter data [{x, y}]
              const scatterData = X_data.map((xVal, idx) => ({ x: xVal, y: Y_data[idx] }));

              // 2. Build fitFunctions array based on worker results
              const buildFitFunctions = (rows: any[]) => {
                  const colors = [
                      "#ff6b6b",
                      "#6a4c93",
                      "#4ecdc4",
                      "#f9c74f",
                      "#90be6d",
                      "#577590",
                      "#ffbe0b",
                      "#8338ec",
                      "#3a86ff",
                      "#ff006e",
                  ];
                  let colorIdx = 0;
                  const fits: any[] = [];

                  // Helper to retrieve numeric value, prioritising raw (unrounded) fields
                  const getNum = (row: any, key: string): number | undefined => {
                      const rawKey = `${key}_raw`;
                      const val = row.hasOwnProperty(rawKey) && row[rawKey] !== "" && row[rawKey] !== null && row[rawKey] !== undefined
                          ? row[rawKey]
                          : row[key];
                      if (val === "" || val === null || val === undefined) return undefined;
                      return typeof val === "number" ? val : parseFloat(val);
                  };

                  rows.forEach((row: any) => {
                      const model = row.rowHeader?.[0] || row["Equation"] || "Unknown";
                      // Retrieve constant (a) and ensure it exists; skip if missing
                      const a = getNum(row, "Constant");
                      if (a === undefined || isNaN(a)) return; // failed fit

                      const b1 = getNum(row, "b1");
                      const b2 = getNum(row, "b2");
                      const b3 = getNum(row, "b3");

                      let fn = "x => x"; // default placeholder
                      let parameters: Record<string, number> = { a };

                      switch (model) {
                          case "Linear":
                              fn = "x => parameters.a + parameters.b * x";
                              parameters = { a, b: b1 as number };
                              break;
                          case "Logarithmic":
                              fn = "x => parameters.a + parameters.b * Math.log(x)";
                              parameters = { a, b: b1 as number };
                              break;
                          case "Inverse":
                              fn = "x => parameters.a + parameters.b / x";
                              parameters = { a, b: b1 as number };
                              break;
                          case "Quadratic":
                              fn = "x => parameters.a + parameters.b * x + parameters.c * Math.pow(x, 2)";
                              parameters = { a, b: b1 as number, c: b2 as number };
                              break;
                          case "Cubic":
                              fn = "x => parameters.a + parameters.b * x + parameters.c * Math.pow(x, 2) + parameters.d * Math.pow(x, 3)";
                              parameters = { a, b: b1 as number, c: b2 as number, d: b3 as number };
                              break;
                          case "Compound":
                              fn = "x => parameters.a * Math.pow(parameters.b, x)";
                              parameters = { a, b: b1 as number };
                              break;
                          case "Power":
                              fn = "x => parameters.a * Math.pow(x, parameters.b)";
                              parameters = { a, b: b1 as number };
                              break;
                          case "S":
                              fn = "x => parameters.a / (1 + Math.exp(parameters.b + parameters.c * x))";
                              parameters = { a, b: b1 as number, c: b2 as number };
                              break;
                          case "Growth":
                          case "Exponential":
                              fn = "x => parameters.a * Math.exp(parameters.b * x)";
                              parameters = { a, b: b1 as number };
                              break;
                          case "Logistic":
                              fn = "x => parameters.c / (1 + parameters.a * Math.pow(parameters.b, x))";
                              parameters = { a: a, b: b1 as number, c: b2 as number };
                              break;
                          default:
                              fn = "x => 0";
                              parameters = { a: 0, b: 0 };
                      }

                      fits.push({
                          fn,
                          equation: model,
                          color: colors[colorIdx % colors.length],
                          parameters,
                      });
                      colorIdx += 1;
                  });

                  return fits;
              };

              const regressionRows = workerData.result?.tables?.[0]?.rows || [];
              const fitFunctions = buildFitFunctions(regressionRows);

              const chartJSON = ChartService.createChartJSON({
                  chartType: "Scatter Plot With Multiple Fit Line",
                  chartData: scatterData,
                  chartVariables: {
                      x: independentVarNames,
                      y: [dependentVarName],
                  },
                  chartMetadata: {
                      title: `Scatter Plot: ${dependentVarName} vs ${independentVarNames[0]}`,
                      subtitle: "With Multiple Regression Fit Lines",
                      description: "Scatter plot showing data points with regression fit lines for each selected model",
                  },
                  chartConfig: {
                      fitFunctions,
                      axisLabels: {
                          x: independentVarNames[0],
                          y: dependentVarName,
                      },
                  },
              });

              const scatterStat = {
                  title: "Scatter Plot With Multiple Fit Lines",
                  output_data: JSON.stringify(chartJSON),
                  components: "ScatterPlotWithMultipleFitLine",
                  description: "Scatter plot with multiple regression fit lines",
              };

              try {
                  await addStatistic(analyticId, scatterStat);
                  console.log("[CurveEstimation OLD CALC] Scatter plot statistic saved successfully");
              } catch (error) {
                  console.error("[CurveEstimation OLD CALC] Failed to save scatter plot statistic:", error);
              }

              onClose(); // Close modal after saving statistics
            } catch (error) {
              console.error("[CurveEstimation OLD CALC] Failed to save statistics:", error);
              setErrorMessage("Failed to save regression results.");
            }
          } else {
            console.error("[CurveEstimation OLD CALC] Worker returned an error:", workerData.message);
            setErrorMessage(workerData.message || "An error occurred during regression analysis.");
          }

          setIsProcessing(false);
        } else if (action === 'error') {
          console.error("[CurveEstimation OLD CALC] Worker error:", workerData.message);
          setErrorMessage(workerData.message || "An error occurred during calculation.");
          setIsProcessing(false);
        }
      };

      workerRef.current.onerror = (error) => {
        console.error("[CurveEstimation OLD CALC] Worker error:", error.message);
        setErrorMessage(`Worker error: ${error.message}`);
        setIsProcessing(false);

        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }
      };

      console.log("[CurveEstimation OLD CALC] Sending data to worker:", { models: selectedModels, X_length: X_data.length, Y_length: Y_data.length, upperBound: upperBound });
      // Payload postMessage LAMA (tidak mengirim includeConstant/displayANOVA)
      workerRef.current.postMessage({
        action: 'runRegression',
        data: {
          models: selectedModels,
          X: X_data, // Data X dari metode baru
          Y: Y_data, // Data Y dari metode baru
          dependentName: dependentVarName,
          independentNames: independentVarNames, // Nama tetap dikirim semua
          upperBound: selectedModels.includes('Logistic') ? parseFloat(upperBound) : undefined
          // TIDAK ADA includeConstant
          // TIDAK ADA displayANOVA
        }
      });

    } catch (error: unknown) {
      console.error("[CurveEstimation OLD CALC] Error in regression processing:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error occurred";
      setErrorMessage(`Error: ${errorMsg}`);
      setIsProcessing(false);
    }
  };
  // ========================================================================
  // <<< AKHIR DARI FUNGSI handleRunRegression KODE LAMA >>>
  // ========================================================================


  // Render function (JSX) modified to work with ModalRenderer
  return (
    <div className="flex flex-col h-full">
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
      
      <div className="px-6 py-4">
        <Separator className="my-2" />
      </div>

      <div className="flex-grow px-6 overflow-y-auto">
        {/* Error and Warning Messages */}
        {errorMessage && (
          <div className="px-6 py-2 text-destructive">{errorMessage}</div>
        )}
        {containerType === "sidebar" && inlineAlertMessage && (
            <div className="p-2 mb-2 mx-6 text-sm text-destructive-foreground bg-destructive rounded-md">
                {inlineAlertMessage}
                <Button variant="ghost" size="sm" onClick={() => setInlineAlertMessage(null)} className="ml-2 text-destructive-foreground hover:bg-destructive/80">Dismiss</Button>
            </div>
        )}

        {/* Main content */}
        <Tabs value={activeTab} onValueChange={(v)=>setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                id="curve-variables-tab-trigger"
                value="variables"
                >
                Variables
                </TabsTrigger>
                <TabsTrigger
                id="curve-models-tab-trigger"
                value="models"
                >
                Models
                </TabsTrigger>
            </TabsList>

            {/* Variables Tab Content */}
            <TabsContent value="variables" className="mt-4">
            <VariablesTab
                availableVariables={availableVariables}
                highlightedVariable={highlightedVariable}
                setHighlightedVariable={setHighlightedVariable}
                selectedDependentVariable={selectedDependentVariable}
                selectedIndependentVariables={selectedIndependentVariables}
                handleDependentDoubleClick={handleDependentDoubleClick}
                handleIndependentDoubleClick={handleIndependentDoubleClick}
                moveToDependent={moveToDependent}
                moveToIndependent={moveToIndependent}
                removeDependent={removeDependent}
                removeIndependent={removeIndependent}
                isProcessing={isProcessing}
            />
            </TabsContent>

            {/* Models Tab Content */}
            <TabsContent value="models" className="mt-4">
            <ModelsTab
                selectedModels={selectedModels}
                handleModelChange={handleModelChange}
                includeConstant={includeConstant}
                setIncludeConstant={setIncludeConstant}
                plotModels={plotModels}
                setPlotModels={setPlotModels}
                upperBound={upperBound}
                setUpperBound={setUpperBound}
                isProcessing={isProcessing}
            />
            </TabsContent>
        </Tabs>
      </div>


      {/* Feature tour overlay */}
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

      {/* Footer section */}
      <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary mt-auto">
          {/* Left: Help button with tooltip */}
          <div className="flex items-center text-muted-foreground">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    data-testid="curve-help-button"
                    variant="ghost"
                    size="icon"
                    onClick={startTour}
                    aria-label="Start feature tour"
                    className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                    disabled={isProcessing}
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
            <Button onClick={handleRunRegression} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "OK"
              )}
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={isProcessing}>
              Reset
            </Button>
            <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
              Cancel
            </Button>
          </div>
                </div>
      </div>
  );
};

// Add default export to match OpenSavFile pattern
export default ModalCurveEstimation;