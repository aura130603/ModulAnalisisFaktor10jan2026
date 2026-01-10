import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore, CellUpdate } from "@/stores/useDataStore";
import { useResultStore } from "@/stores/useResultStore";
import { Variable } from "@/types/Variable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calculator } from "./Calculator";
import { FunctionsList } from "./FunctionsList";
import { VariablesList } from "./VariablesList";

interface ComputeVariableProps {
  onClose: () => void;
  containerType?: "dialog" | "sidebar";
}

// Content component
const ComputeVariableContent: React.FC<ComputeVariableProps> = ({
  onClose,
  containerType = "dialog",
}) => {

  const [targetName, setTargetName] = useState("");
  const [targetType, setTargetType] = useState<"NUMERIC" | "STRING">("NUMERIC");
  const [targetLabel, setTargetLabel] = useState("");
  const [numericExpression, setNumericExpression] = useState("");
  const [ifCondition, setIfCondition] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const allVariablesFromStore = useVariableStore.getState().variables;
  const addVariable = useVariableStore((state) => state.addVariable);
  const data = useDataStore((state) => state.data);
  const { addLog, addAnalytic, addStatistic } = useResultStore();

  const handleVariableClick = useCallback((variable: Variable) => {
    setNumericExpression((prev) => prev + variable.name);
  }, []);

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, variable: Variable) => {
      e.dataTransfer.setData("text/plain", variable.name);
      e.dataTransfer.effectAllowed = "copy";
    },
    []
  );

  const handleDrop = useCallback((e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const variableName = e.dataTransfer.getData("text/plain");
    if (variableName) {
      setNumericExpression((prev) => prev + variableName);
    }
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setIsDragOver(true);
    },
    []
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
      setIsDragOver(false);
    },
    []
  );

  const handleCompute = useCallback(async () => {
    if (!targetName || !numericExpression) {
      setErrorDialog({
        open: true,
        title: "Missing required fields",
        description:
          "Please fill in both target variable name and numeric expression.",
      });
      return;
    }

    // Check if variable name already exists
    if (allVariablesFromStore.some((v) => v.name === targetName)) {
      setErrorDialog({
        open: true,
        title: "Invalid variable name",
        description: "A variable with this name already exists.",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Initialize worker
      const worker = new Worker("/workers/ComputeVariable/ComputeVariable.js");

      const cleanedData = data.filter(
        (row) =>
          Array.isArray(row) &&
          row.some((cell) => cell !== null && cell !== undefined && cell !== "")
      );

      worker.postMessage({
        data: cleanedData,
        variables: allVariablesFromStore,
        numericExpression,
        variableType: targetType,
        ifCondition,
      });

      worker.onmessage = async (event) => {
        const { success, computedValues, error } = event.data;

        if (success) {
          try {
            // Create new variable first
            const newColumnIndex = allVariablesFromStore.length;
            const newVariable: Partial<Variable> = {
              columnIndex: newColumnIndex,
              name: targetName,
              type: targetType,
              width: 8,
              decimals: targetType === "NUMERIC" ? 2 : 0,
              label: targetLabel,
              values: [],
              missing: null,
              columns: 200,
              align: targetType === "NUMERIC" ? "right" : "left",
              measure: targetType === "NUMERIC" ? "scale" : "nominal",
              role: "input",
            };

            // Add variable first
            await addVariable(newVariable);

            // Then add the computed values to the correct column
            const bulkUpdates: CellUpdate[] = [];
            computedValues.forEach((value: any, rowIndex: number) => {
              if (value !== null) {
                bulkUpdates.push({
                  row: rowIndex,
                  col: newColumnIndex, // Use the same column index as the variable
                  value,
                });
              }
            });

            if (bulkUpdates.length > 0) {
              await useDataStore.getState().updateCells(bulkUpdates);
              await useDataStore.getState().saveData();
            }

            // Add logs
            const logMsg = `COMPUTE VARIABLE ${targetName} WITH EXPRESSION "${numericExpression}"${
              ifCondition ? ` IF ${ifCondition}` : ""
            }`;
            const logId = await addLog({ log: logMsg });
            const analyticId = await addAnalytic(logId, {
              title: "Compute Variable",
              note: "",
            });
            await addStatistic(analyticId, {
              title: "Compute Variable",
              output_data: JSON.stringify({
                text: [
                  {
                    text: `The variable \`${targetName}\` was successfully added as the last variable in the dataset.`,
                  },
                ],
              }),
              components: "Executed",
              description: "",
            });

            setIsProcessing(false);
            onClose();
          } catch (err) {
            console.error("Error during post-compute actions:", err);
            setErrorDialog({
              open: true,
              title: "Error",
              description: "Failed to save computation results.",
            });
            setIsProcessing(false);
          }
        } else {
          setErrorDialog({
            open: true,
            title: "Computation Error",
            description: error || "Failed to compute variable.",
          });
          setIsProcessing(false);
        }
        worker.terminate();
      };

      worker.onerror = (error) => {
        console.error("Worker error:", error);
        setErrorDialog({
          open: true,
          title: "Worker Error",
          description: "An error occurred during computation.",
        });
        setIsProcessing(false);
        worker.terminate();
      };
    } catch (error) {
      console.error("Error during computation:", error);
      setErrorDialog({
        open: true,
        title: "Error",
        description: "Failed to start computation process.",
      });
      setIsProcessing(false);
    }
  }, [
    targetName,
    targetType,
    targetLabel,
    numericExpression,
    ifCondition,
    allVariablesFromStore,
    data,
    addVariable,
    addLog,
    addAnalytic,
    addStatistic,
    onClose,
  ]);

  const handleReset = useCallback(() => {
    setTargetName("");
    setTargetType("NUMERIC");
    setTargetLabel("");
    setNumericExpression("");
    setIfCondition("");
    setIsProcessing(false);
    setErrorDialog(null);
    setIsDragOver(false);
    console.log("Reset clicked");
  }, []);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Main Content */}
      <div className="p-4 md:p-6 flex-grow overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 min-h-0">
          {/* Left side - Target Variable */}
          <div className="flex flex-col min-h-0">
            <div className="space-y-4 flex-shrink-0">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Label className="mb-2 block">Target Variable:</Label>
                  <Input
                    value={targetName}
                    onChange={(e) => setTargetName(e.target.value)}
                    className="bg-white"
                    placeholder="Enter variable name"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Type:</Label>
                  <Select
                    value={targetType}
                    onValueChange={(value: "NUMERIC" | "STRING") =>
                      setTargetType(value)
                    }
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NUMERIC">Numeric</SelectItem>
                      <SelectItem value="STRING">String</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                {/* <Label className="mb-2 block">Label:</Label> */}
                <Input
                  value={targetLabel}
                  onChange={(e) => setTargetLabel(e.target.value)}
                  className="bg-white"
                  placeholder="Enter variable label (optional)"
                />
              </div>
            </div>

            {/* Variables List */}
            <VariablesList
              variables={allVariablesFromStore}
              onVariableClick={handleVariableClick}
              onDragStart={handleDragStart}
            />
          </div>

          {/* Center side - Expression & Calculator */}
          <div className="flex flex-col min-h-0">
            {/* Expression Input */}
            <div className="flex-shrink-0">
              <Label className="mb-2 block">Numeric Expression:</Label>
              <textarea
                value={numericExpression}
                onChange={(e) => setNumericExpression(e.target.value)}
                className={`w-full h-24 md:h-32 p-2 border rounded-md bg-white resize-none text-sm transition-colors ${
                  isDragOver ? "border-blue-500 bg-blue-50" : ""
                }`}
                placeholder="Enter expression (e.g., var1 + var2) or drag variables here"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              />
            </div>

            {/* Calculator */}
            <div className="flex-shrink-0 mt-4">
              {/* <Label className="mb-2 block">Calculator:</Label> */}
              <div className="border rounded-md bg-white p-2">
                <Calculator
                  onButtonClick={(value) => {
                    if (value === "") {
                      // Delete last character
                      setNumericExpression((prev) => prev.slice(0, -1));
                    } else {
                      setNumericExpression((prev) => prev + value);
                    }
                  }}
                />
              </div>
            </div>

            {/* Spacer to fill remaining space */}
            <div className="flex-grow min-h-0"></div>
          </div>

          {/* Right side - Functions */}
          <div className="flex flex-col min-h-0">
            <div className="flex-grow min-h-0">
              <Label className="mb-2 block">Functions:</Label>
              <FunctionsList
                onFunctionSelect={(func) =>
                  setNumericExpression((prev) => prev + func)
                }
              />
            </div>
          </div>
        </div>
        {/* If Condition
        <div className="mt-4 md:mt-6">
          <Label className="mb-2 block">If (Optional):</Label>
          <Input
            value={ifCondition}
            onChange={(e) => setIfCondition(e.target.value)}
            className="bg-white"
            placeholder="Enter condition (e.g., var1 > 10)"
          />
        </div> */}
      </div>

      {/* Footer */}
      <div className="px-4 md:px-6 py-3 md:py-4 border-t border-gray-200 flex-shrink-0 bg-gray-50">
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button
            variant="default"
            onClick={handleCompute}
            disabled={isProcessing || !targetName || !numericExpression}
          >
            {isProcessing ? "Computing..." : "OK"}
          </Button>

          {/* <Button variant="outline">Help</Button> */}
        </div>
      </div>

      {/* Error Alert Dialog (ChartBuilder style) */}
      {errorDialog?.open && (
        <AlertDialog
          open={errorDialog.open}
          onOpenChange={(open) => setErrorDialog(open ? errorDialog : null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{errorDialog.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {errorDialog.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setErrorDialog(null)}>
                OK
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

// Main modal component
const ComputeVariableModal: React.FC<ComputeVariableProps> = ({
  onClose,
  containerType = "dialog",
}) => {
  if (containerType === "dialog") {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Compute Variable</DialogTitle>
          </DialogHeader>
          <ComputeVariableContent
            onClose={onClose}
            containerType={containerType}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <ComputeVariableContent onClose={onClose} containerType={containerType} />
  );
};

export default ComputeVariableModal;
