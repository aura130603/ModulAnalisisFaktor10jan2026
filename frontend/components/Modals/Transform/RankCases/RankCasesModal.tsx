"use client";

import React, { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { Variable } from "@/types/Variable";
import { ArrowRightIcon } from "lucide-react";
import createWorkerClient from "@/utils/workerClient";
import RankTypesDialog, { RankTypesState } from "./RankTypesDialog";
import TiesDialog, { TieHandling } from "./TiesDialog";

interface RankCasesModalProps {
  onClose: () => void;
  containerType?: "dialog" | "sidebar";
}

const RankCasesModal: React.FC<RankCasesModalProps> = ({
  onClose,
  containerType = "dialog",
}) => {
  const variables = useVariableStore((state) => state.variables);
  const setVariables = useVariableStore((state) => state.setVariables);
  const data = useDataStore((state) => state.data);
  const setData = useDataStore((state) => state.setData);
  const saveData = useDataStore((state) => state.saveData);

  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);
  const [byVariables, setByVariables] = useState<string[]>([]);
  const [assignRankTo, setAssignRankTo] = useState<"smallest" | "largest">(
    "largest"
  );
  const [displaySummary, setDisplaySummary] = useState(true);
  const [draggedVariable, setDraggedVariable] = useState<string | null>(null);
  const [dragSource, setDragSource] = useState<"list" | "selected" | "by" | null>(null);
  const [rankTypesOpen, setRankTypesOpen] = useState(false);
  const [rankTypesState, setRankTypesState] = useState<RankTypesState>({
    rank: true,
    savageScore: false,
    fractionalRank: false,
    fractionalRankPercent: false,
    sumCaseWeights: false,
    ntiles: false,
    ntilesValue: "4",
    proportionEstimates: false,
    normalScores: false,
    proportionFormula: "blom",
  });
  const [tiesOpen, setTiesOpen] = useState(false);
  const [tieHandling, setTieHandling] = useState<TieHandling>("mean");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, variable: string, source: "list" | "selected" | "by") => {
      setDraggedVariable(variable);
      setDragSource(source);
      e.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDropVariable = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!draggedVariable) return;

      // Remove from source
      if (dragSource === "selected") {
        setSelectedVariables((prev) =>
          prev.filter((v) => v !== draggedVariable)
        );
      } else if (dragSource === "by") {
        setByVariables((prev) => prev.filter((v) => v !== draggedVariable));
      }

      // Add to Variable(s) box
      setSelectedVariables((prev) =>
        prev.includes(draggedVariable) ? prev : [...prev, draggedVariable]
      );

      setDraggedVariable(null);
      setDragSource(null);
    },
    [draggedVariable, dragSource]
  );

  const handleDropBy = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!draggedVariable) return;

      // Remove from source
      if (dragSource === "selected") {
        setSelectedVariables((prev) =>
          prev.filter((v) => v !== draggedVariable)
        );
      } else if (dragSource === "by") {
        setByVariables((prev) => prev.filter((v) => v !== draggedVariable));
      }

      // Add to By box
      setByVariables((prev) =>
        prev.includes(draggedVariable) ? prev : [...prev, draggedVariable]
      );

      setDraggedVariable(null);
      setDragSource(null);
    },
    [draggedVariable, dragSource]
  );

  const handleRemoveVariable = (variable: string) => {
    setSelectedVariables((prev) => prev.filter((v) => v !== variable));
  };

  const handleRemoveByVariable = (variable: string) => {
    setByVariables((prev) => prev.filter((v) => v !== variable));
  };

  const numericVariables = variables.filter(
    (v) => v.type === "NUMERIC" || v.type === "COMMA" || v.type === "DOT"
  );

  const availableVariables = numericVariables.filter(
    (v) => !selectedVariables.includes(v.name) && !byVariables.includes(v.name)
  );

  const isOKEnabled = selectedVariables.length > 0;

  const processRanking = async () => {
    if (!isOKEnabled) {
      toast.error("Please select at least one variable");
      return;
    }

    setIsProcessing(true);
    try {
      // Only process if "Rank" type is selected
      if (!rankTypesState.rank) {
        toast.error("Please select 'Rank' option in Rank Types");
        setIsProcessing(false);
        return;
      }

      // Create a copy of data to modify - treat all rows as data, no header row
      let updatedData = data.map(row => [...row]);
      const newVariables: Variable[] = [];
      let nextColumnIndex = updatedData.length > 0 ? updatedData[0].length : 0;

      // Process each selected variable
      for (const varName of selectedVariables) {
        const variable = variables.find(v => v.name === varName);
        if (!variable) continue;

        // Prepare data for worker - no header row, all rows are data
        const dataForWorker = updatedData.map(row => [...row]);

        // Calculate ranks using worker
        const rankedValues = await calculateRanksWithWorker(
          dataForWorker,
          variable.columnIndex,
          assignRankTo,
          tieHandling
        );

        // Create new variable for ranked values
        const newVarName = `R${varName}`;

        // Add ranking values to ALL data rows (starting from row 0)
        for (let i = 0; i < updatedData.length; i++) {
          updatedData[i].push(rankedValues[i]);
        }

        // Create new variable metadata
        const newVariable: Variable = {
          tempId: uuidv4(),
          columnIndex: nextColumnIndex,
          name: newVarName,
          type: "NUMERIC",
          width: 8,
          decimals: 2,
          label: `Rank of ${varName}`,
          values: [],
          missing: null,
          columns: 64,
          align: "right",
          measure: "ordinal",
          role: "output"
        };

        newVariables.push(newVariable);
        nextColumnIndex++;
      }

      // Update data store with all new columns
      setData(updatedData);

      // Add new variables to the variable store
      const updatedVariables = [...variables, ...newVariables];
      setVariables(updatedVariables);

      // Save the data changes
      await saveData();

      toast.success(
        `Ranking completed for ${selectedVariables.length} variable(s). New variable(s): ${newVariables.map(v => v.name).join(", ")}`
      );
      onClose();
    } catch (error: any) {
      console.error("Ranking error:", error);
      toast.error(`Ranking failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateRanksWithWorker = (
    data: any[][],
    columnIndex: number,
    rankDirection: "largest" | "smallest",
    tieHandling: TieHandling
  ): Promise<(number | null)[]> => {
    return new Promise((resolve, reject) => {
      try {
        const worker = createWorkerClient<
          {
            data: any[][];
            variableColumnIndex: number;
            rankDirection: "largest" | "smallest";
            tieHandling: TieHandling;
            variableName: string;
          },
          {
            success: boolean;
            rankedValues?: (number | null)[];
            error?: string;
          }
        >("/workers/rankCases.worker.js");

        worker.onMessage((result) => {
          worker.terminate();
          if (result.success && result.rankedValues) {
            resolve(result.rankedValues);
          } else {
            reject(new Error(result.error || "Worker returned error"));
          }
        });

        worker.onError((error) => {
          worker.terminate();
          reject(new Error(`Worker error: ${error.message}`));
        });

        worker.post({
          data,
          variableColumnIndex: columnIndex,
          rankDirection,
          tieHandling,
          variableName: "temp"
        });
      } catch (error: any) {
        reject(error);
      }
    });
  };

  const handleOK = () => {
    processRanking();
  };

  const handleReset = () => {
    setSelectedVariables([]);
    setByVariables([]);
    setAssignRankTo("largest");
    setDisplaySummary(true);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rank Cases</DialogTitle>
        </DialogHeader>

        <div className="flex gap-6 py-4">
          {/* Left: Available Variables List */}
          <div className="flex-1 min-w-0">
            <div className="border-2 border-blue-400 rounded p-3 h-80 flex flex-col">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                <div className="w-5 h-5 bg-blue-200 rounded flex items-center justify-center text-xs">
                  📋
                </div>
                <span className="text-sm font-medium">nilai</span>
              </div>
              <ScrollArea className="flex-1">
                <div className="space-y-1 pr-4">
                  {availableVariables.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2">
                      All variables assigned
                    </p>
                  ) : (
                    availableVariables.map((variable) => (
                      <div
                        key={variable.name}
                        draggable
                        onDragStart={(e) =>
                          handleDragStart(e, variable.name, "list")
                        }
                        className="p-2 bg-blue-50 rounded border border-blue-200 text-sm cursor-move hover:bg-blue-100 truncate"
                      >
                        {variable.name}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Center: Target Boxes and Controls */}
          <div className="flex flex-col gap-4 justify-start">
            {/* Variable(s) Box */}
            <div className="flex gap-3 items-start">
              <div className="flex-1 min-w-0">
                <Label className="text-sm font-medium mb-2 block">
                  Variable(s):
                </Label>
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDropVariable}
                  className="border-2 border-gray-300 rounded p-3 bg-white h-32 min-w-xs"
                >
                  <div className="space-y-1 text-sm">
                    {selectedVariables.map((variable) => (
                      <div
                        key={variable}
                        draggable
                        onDragStart={(e) =>
                          handleDragStart(e, variable, "selected")
                        }
                        className="p-1.5 bg-blue-50 rounded border border-blue-200 flex justify-between items-center cursor-move hover:bg-blue-100 group"
                      >
                        <span>{variable}</span>
                        <button
                          onClick={() => handleRemoveVariable(variable)}
                          className="text-xs opacity-0 group-hover:opacity-100 text-red-500"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Arrow Button */}
              <div className="flex flex-col items-center justify-center pt-8">
                <button className="border-2 border-blue-400 rounded p-2 hover:bg-blue-50 transition">
                  <ArrowRightIcon className="w-5 h-5 text-blue-500" />
                </button>
              </div>
            </div>

            {/* By Box */}
            <div className="flex gap-3 items-start">
              <div className="flex-1 min-w-0">
                <Label className="text-sm font-medium mb-2 block">By:</Label>
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDropBy}
                  className="border-2 border-gray-300 rounded p-3 bg-white h-24 min-w-xs"
                >
                  <div className="space-y-1 text-sm">
                    {byVariables.map((variable) => (
                      <div
                        key={variable}
                        draggable
                        onDragStart={(e) =>
                          handleDragStart(e, variable, "by")
                        }
                        className="p-1.5 bg-blue-50 rounded border border-blue-200 flex justify-between items-center cursor-move hover:bg-blue-100 group"
                      >
                        <span>{variable}</span>
                        <button
                          onClick={() => handleRemoveByVariable(variable)}
                          className="text-xs opacity-0 group-hover:opacity-100 text-red-500"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Arrow Button */}
              <div className="flex flex-col items-center justify-center pt-8">
                <button className="border-2 border-blue-400 rounded p-2 hover:bg-blue-50 transition">
                  <ArrowRightIcon className="w-5 h-5 text-blue-500" />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Options Buttons */}
          <div className="flex flex-col gap-3 justify-start">
            <Button
              variant="outline"
              onClick={() => setRankTypesOpen(true)}
              className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-medium"
            >
              Rank Types...
            </Button>
            <Button
              variant="outline"
              onClick={() => setTiesOpen(true)}
              className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-medium"
            >
              Ties...
            </Button>
          </div>
        </div>

        {/* Rank Types Dialog */}
        <RankTypesDialog
          open={rankTypesOpen}
          onOpenChange={setRankTypesOpen}
          state={rankTypesState}
          onChange={setRankTypesState}
        />

        {/* Ties Dialog */}
        <TiesDialog
          open={tiesOpen}
          onOpenChange={setTiesOpen}
          value={tieHandling}
          onChange={setTieHandling}
        />

        {/* Bottom Options */}
        <div className="flex gap-8 py-4 border-t">
          {/* Left: Assign Rank 1 to */}
          <div className="flex-1">
            <Label className="text-sm font-medium mb-3 block">
              Assign Rank 1 to
            </Label>
            <RadioGroup value={assignRankTo} onValueChange={(v) => setAssignRankTo(v as "smallest" | "largest")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="smallest" id="smallest" />
                <Label htmlFor="smallest" className="font-normal cursor-pointer">
                  Smallest value
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="largest" id="largest" />
                <Label htmlFor="largest" className="font-normal cursor-pointer">
                  Largest value
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Right: Display Summary */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="display-summary"
              checked={displaySummary}
              onCheckedChange={(checked) =>
                setDisplaySummary(checked === true)
              }
            />
            <Label
              htmlFor="display-summary"
              className="font-normal cursor-pointer"
            >
              Display summary tables
            </Label>
          </div>
        </div>

        {/* Buttons */}
        <DialogFooter className="flex gap-2 justify-end border-t pt-4">
          <Button
            onClick={handleOK}
            disabled={!isOKEnabled || isProcessing}
            className={
              isOKEnabled && !isProcessing
                ? "bg-gray-400 hover:bg-gray-500"
                : "bg-gray-300 cursor-not-allowed"
            }
          >
            {isProcessing ? "Processing..." : "OK"}
          </Button>
          <Button
            variant="outline"
            className="border-gray-400 text-gray-700 hover:bg-gray-50"
          >
            Paste
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            className="border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            Reset
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            className="border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            Help
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RankCasesModal;
