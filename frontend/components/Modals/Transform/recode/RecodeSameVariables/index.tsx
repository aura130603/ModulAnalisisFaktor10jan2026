"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useResultStore } from "@/stores/useResultStore";
import type { Variable, VariableType } from "@/types/Variable";
import { BaseModalProps } from "@/types/modalTypes";
import RecodeVariablesTab from "../components/RecodeVariablesTab";
import OldNewValuesSetup from "../components/OldNewValuesSetup";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecodeRule } from "../Types";

export enum RecodeMode {
  SAME_VARIABLES = "recodeSameVariables",
}

// Type alias to BaseModalProps (avoid empty interface rule)
export type RecodeSameVariablesModalProps = BaseModalProps;

// Interface for the content component
interface RecodeSameVariablesContentProps {
  onClose: () => void;
  containerType?: "dialog" | "sidebar";
  availableVariables: Variable[];
  variablesToRecode: Variable[];
  highlightedVariable: {
    tempId: string;
    source: "available" | "recodeList";
  } | null;
  recodeListType: "NUMERIC" | "STRING" | null;
  showOldNewSetup: boolean;
  recodeRules: RecodeRule[];
  isProcessing: boolean;
  setHighlightedVariable: React.Dispatch<
    React.SetStateAction<{
      tempId: string;
      source: "available" | "recodeList";
    } | null>
  >;
  moveToRightPane: (variable: Variable, targetIndex?: number) => void;
  moveToLeftPane: (variable: Variable, targetIndex?: number) => void;
  reorderVariables: (
    source: "available" | "recodeList",
    reorderedList: Variable[]
  ) => void;
  handleShowOldNewSetup: () => void;
  handleHideOldNewSetup: () => void;
  setRecodeRules: React.Dispatch<React.SetStateAction<RecodeRule[]>>;
  handleOk: () => Promise<void>;
  handlePaste: () => void;
  handleReset: () => void;
}

// Content component
const RecodeSameVariablesContent: React.FC<RecodeSameVariablesContentProps> = ({
  onClose,
  containerType = "dialog",
  availableVariables,
  variablesToRecode,
  highlightedVariable,
  recodeListType,
  showOldNewSetup,
  recodeRules,
  isProcessing,
  setHighlightedVariable,
  moveToRightPane,
  moveToLeftPane,
  reorderVariables,
  handleShowOldNewSetup,
  handleHideOldNewSetup,
  setRecodeRules,
  handleOk,
  handlePaste,
  handleReset,
}) => {


  return (
    <div className="flex flex-col h-full">
      {/* Main Content */}
      <div className="p-6 flex-grow overflow-y-auto">
        {recodeListType && containerType === "dialog" && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Current variable type:{" "}
              <span className="font-medium">{recodeListType}</span>
              {recodeListType && (
                <span className="text-muted-foreground">
                  {" "}
                  (Output will remain {recodeListType.toLowerCase()})
                </span>
              )}
            </p>
          </div>
        )}

        {showOldNewSetup ? (
          <OldNewValuesSetup
            recodeListType={recodeListType}
            recodeRules={recodeRules}
            setRecodeRules={setRecodeRules}
            onCloseSetup={handleHideOldNewSetup}
            variableCount={variablesToRecode.length}
            outputType={recodeListType || undefined} // Di recode same variables, output type sama dengan recodeListType
          />
        ) : (
          <RecodeVariablesTab
            availableVariables={availableVariables}
            variablesToRecode={variablesToRecode}
            highlightedVariable={highlightedVariable}
            setHighlightedVariable={setHighlightedVariable}
            moveToRightPane={moveToRightPane}
            moveToLeftPane={moveToLeftPane}
            reorderVariables={reorderVariables}
          />
        )}
      </div>

      {/* Additional Controls */}
      <div className="px-6 py-4 border-t border-[#E6E6E6] flex-shrink-0 flex flex-col space-y-3">
        {!showOldNewSetup && (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                if (variablesToRecode.length === 0) {
                  toast.error("Please select at least one variable to recode.");
                  return;
                }
                handleShowOldNewSetup();
              }}
            >
              Old and New Values...
            </Button>
            <Button variant="outline" className="flex-1">
              If... (optional case selection condition)
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[#E6E6E6] flex-shrink-0 bg-muted">
        <div className="flex justify-end space-x-2 w-full">
          {showOldNewSetup ? (
            <>
              <Button variant="outline" onClick={handleHideOldNewSetup}>
                Back to Variables
              </Button>
            </>
          ) : null}

          {/* <Button variant="outline" onClick={handlePaste}>
            Paste
          </Button> */}
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleOk}
            disabled={
              isProcessing ||
              variablesToRecode.length === 0 ||
              recodeRules.length === 0
            }
          >
            {isProcessing ? "Processing..." : "OK"}
          </Button>
          {/* <Button variant="outline">Help</Button> */}
        </div>
      </div>
    </div>
  );
};

// Main component that manages state and renders the content
export const RecodeSameVariablesModal: React.FC<
  RecodeSameVariablesModalProps
> = ({ onClose, containerType = "dialog", ...props }) => {
  const allVariablesFromStore = useVariableStore.getState().variables;
  const dataStore = useDataStore();

  const resultStore = useResultStore();

  // State management
  const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
  const [variablesToRecode, setVariablesToRecode] = useState<Variable[]>([]);
  const [highlightedVariable, setHighlightedVariable] = useState<{
    tempId: string;
    source: "available" | "recodeList";
  } | null>(null);
  const [recodeListType, setRecodeListType] = useState<
    "NUMERIC" | "STRING" | null
  >(null);
  const [recodeRules, setRecodeRules] = useState<RecodeRule[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Alert dialog state
  const [showTypeAlert, setShowTypeAlert] = useState(false);
  const [incompatibleVariable, setIncompatibleVariable] =
    useState<Variable | null>(null);

  const [activeTab, setActiveTab] = useState<"setup" | "rules">("setup");

  useEffect(() => {
    const recodeVarTempIds = new Set(variablesToRecode.map((v) => v.tempId));
    const initialAvailable = allVariablesFromStore
      .filter(
        (v) => v.name !== "" && v.tempId && !recodeVarTempIds.has(v.tempId)
      )
      .map((v) => ({ ...v, tempId: v.tempId || `temp_${v.columnIndex}` }));
    setAvailableVariables(initialAvailable);

    if (variablesToRecode.length === 0 && recodeListType !== null) {
      setRecodeListType(null);
    }
  }, [allVariablesFromStore, variablesToRecode, recodeListType]);

  // Handler functions
  const moveToRightPane = useCallback(
    (variable: Variable, targetIndex?: number) => {
      if (!variable.tempId) return;
      const varType = variable.type;
      if (variablesToRecode.length === 0) {
        if (varType === "NUMERIC" || varType === "STRING") {
          setRecodeListType(varType);
        } else {
          console.warn(
            `Variable ${variable.name} is not NUMERIC or STRING and cannot be recoded.`
          );
          return;
        }
      } else {
        if (varType !== recodeListType) {
          // Instead of console warning, show alert dialog
          setIncompatibleVariable(variable);
          setShowTypeAlert(true);
          return;
        }
      }
      setAvailableVariables((prev) =>
        prev.filter((v) => v.tempId !== variable.tempId)
      );
      setVariablesToRecode((prev) => {
        if (prev.some((v) => v.tempId === variable.tempId)) return prev;
        const newList = [...prev];
        if (
          typeof targetIndex === "number" &&
          targetIndex >= 0 &&
          targetIndex <= newList.length
        ) {
          newList.splice(targetIndex, 0, variable);
        } else {
          newList.push(variable);
        }
        return newList;
      });
      setHighlightedVariable(null);
    },
    [variablesToRecode, recodeListType]
  );

  const moveToLeftPane = useCallback(
    (variable: Variable, targetIndex?: number) => {
      if (!variable.tempId) return;
      setVariablesToRecode((prev) => {
        const newList = prev.filter((v) => v.tempId !== variable.tempId);
        if (newList.length === 0) {
          setRecodeListType(null);
        }
        return newList;
      });
      setAvailableVariables((prev) => {
        if (prev.some((v) => v.tempId === variable.tempId)) return prev;
        const newList = [...prev];
        if (
          typeof targetIndex === "number" &&
          targetIndex >= 0 &&
          targetIndex <= newList.length
        ) {
          newList.splice(targetIndex, 0, variable);
        } else {
          newList.push(variable);
        }
        newList.sort((a, b) => (a.columnIndex || 0) - (b.columnIndex || 0));
        return newList;
      });
      setHighlightedVariable(null);
    },
    []
  );

  const reorderVariables = useCallback(
    (source: "available" | "recodeList", reorderedList: Variable[]) => {
      if (source === "available") {
        setAvailableVariables([...reorderedList]);
      } else if (source === "recodeList") {
        setVariablesToRecode([...reorderedList]);
      }
    },
    []
  );

  // Helper function to evaluate rules
  const evaluateValueWithRules = (
    value: string | number | null,
    rules: RecodeRule[],
    sourceVariableType: "NUMERIC" | "STRING",
    variable?: Variable
  ): string | number | null => {
    // Tangani null atau undefined di awal
    if (value === null || value === undefined) {
      const missingRule = rules.find(
        (r) =>
          r.oldValueType === "systemMissing" ||
          r.oldValueType === "systemOrUserMissing"
      );
      if (missingRule) return missingRule.newValue ?? "";

      const elseRule = rules.find((r) => r.oldValueType === "else");
      if (elseRule) return elseRule.newValue ?? "";

      return value; // Kembalikan null jika tidak ada aturan yang cocok
    }

    // Konversi nilai ke numeric jika perlu
    const numericValue = typeof value === "string" ? parseFloat(value) : value;
    const isNumericType = sourceVariableType === "NUMERIC";
    const isValidNumber = !isNaN(numericValue as number);

    // Cek System Missing
    const isSystemMissing =
      value === null ||
      value === undefined ||
      (typeof value === "number" && isNaN(value)) ||
      (isNumericType && typeof value === "string" && value.trim() === "");

    // Cek User Missing
    const isUserMissing = (() => {
      if (!variable?.missing) return false;

      // Diskrit
      if (
        Array.isArray(variable.missing.discrete) &&
        variable.missing.discrete.includes(value)
      ) {
        return true;
      }

      // Range
      const range = variable.missing?.range;
      if (
        isNumericType &&
        range?.min !== undefined &&
        range?.max !== undefined
      ) {
        return (
          isValidNumber &&
          (numericValue as number) >= range.min &&
          (numericValue as number) <= range.max
        );
      }

      return false;
    })();

    const isSystemOrUserMissing = isSystemMissing || isUserMissing;

    // Evaluasi berdasarkan aturan recode
    for (const rule of rules) {
      switch (rule.oldValueType) {
        case "value":
          if (value == rule.oldValue) return rule.newValue ?? "";
          if (isNumericType && isValidNumber && numericValue == rule.oldValue)
            return rule.newValue ?? "";
          break;

        case "range":
          if (isNumericType && isValidNumber && Array.isArray(rule.oldValue)) {
            const [min, max] = rule.oldValue;
            if (
              min !== null &&
              max !== null &&
              (numericValue as number) >= min &&
              (numericValue as number) <= max
            ) {
              return rule.newValue ?? "";
            }
          }
          break;

        case "rangeLowest":
          if (isNumericType && isValidNumber && Array.isArray(rule.oldValue)) {
            const [, max] = rule.oldValue;
            if (max !== null && (numericValue as number) <= max) {
              return rule.newValue ?? "";
            }
          }
          break;

        case "rangeHighest":
          if (isNumericType && isValidNumber && Array.isArray(rule.oldValue)) {
            const [min] = rule.oldValue;
            if (min !== null && (numericValue as number) >= min) {
              return rule.newValue ?? "";
            }
          }
          break;

        case "systemMissing":
          if (isSystemMissing) return rule.newValue ?? "";
          break;

        case "systemOrUserMissing":
          if (isSystemOrUserMissing) return rule.newValue ?? "";
          break;

        case "else":
          continue;
      }
    }

    // Aturan ELSE di akhir
    const elseRule = rules.find((r) => r.oldValueType === "else");
    if (elseRule) return elseRule.newValue ?? "";

    // Kembalikan nilai asli jika tidak ada aturan cocok
    return value;
  };

  const handleOk = async () => {
    if (variablesToRecode.length === 0) {
      toast.error("Please select at least one variable to recode.");
      return;
    }

    if (recodeRules.length === 0) {
      toast.error("Please define at least one rule for recoding.");
      return;
    }

    setIsProcessing(true);
    try {
      // Untuk setiap variabel yang dipilih
      for (const variable of variablesToRecode) {
        // Dapatkan data variabel
        const { data } = await dataStore.getVariableData(variable);
        const columnIndex = variable.columnIndex;

        if (columnIndex === undefined || columnIndex < 0) {
          console.error(`Invalid column index for variable ${variable.name}`);
          continue;
        }

        const updates = data
          .map((value, rowIndex) => {
            const safeValue = value === null ? "" : value;
            const newValue = evaluateValueWithRules(
              safeValue,
              recodeRules,
              variable.type === "NUMERIC" ? "NUMERIC" : "STRING",
              variable
            );

            // Jika nilai berubah, tambahkan ke daftar perubahan
            if (newValue !== value) {
              return {
                row: rowIndex,
                col: columnIndex,
                value: newValue === null ? "" : newValue,
              };
            }
            return null;
          })
          .filter((update) => update !== null);

        // Jika ada perubahan, terapkan ke datastore
        if (updates.length > 0) {
          await dataStore.updateCells(updates);
        }
      }
      // Simpan data ke backend/file agar tidak hilang saat refresh
      await dataStore.saveData();

      // Add log entry (like recodeDifferentVariables)
      const recodeRulesText = recodeRules
        .map((rule) => {
          switch (rule.oldValueType) {
            case "value":
              return `${rule.oldValueDisplay} → ${rule.newValueDisplay}`;
            case "range":
              return `${rule.oldValueDisplay} → ${rule.newValueDisplay}`;
            case "rangeLowest":
              return `${rule.oldValueDisplay} → ${rule.newValueDisplay}`;
            case "rangeHighest":
              return `${rule.oldValueDisplay} → ${rule.newValueDisplay}`;
            case "systemMissing":
              return "System Missing → " + rule.newValueDisplay;
            case "systemOrUserMissing":
              return "System or User Missing → " + rule.newValueDisplay;
            case "else":
              return "Else → " + rule.newValueDisplay;
            default:
              return "";
          }
        })
        .join(", ");

      const logMsg = `RECODE SAME VARIABLES ${variablesToRecode
        .map((v) => v.name)
        .join(", ")} WITH RULES: ${recodeRulesText}`;
      const logId = await resultStore.addLog({ log: logMsg });

      // Add analytic
      const analyticId = await resultStore.addAnalytic(logId, {
        title: "Recode Same Variables",
        note: "",
      });

      // Add statistic
      await resultStore.addStatistic(analyticId, {
        title: "Recode Same Variables",
        output_data: JSON.stringify({
          text: [
            {
              text: `The following variables were recoded (in place):\n${variablesToRecode
                .map((v) => `- \`${v.name}\``)
                .join("\n")}\n\nWith the rules:\n${recodeRules
                .map(
                  (rule) =>
                    `- ${rule.oldValueDisplay} → ${rule.newValueDisplay}`
                )
                .join("\n")}`,
            },
          ],
        }),
        components: "Executed",
        description: "",
      });

      toast.success(`Successfully recoded ${variablesToRecode.length} variable(s).`);

      onClose();
    } catch (error) {
      console.error("Error applying recode rules:", error);
      toast.error("An error occurred while applying recode rules.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaste = () => {
    console.log("Paste clicked");
  };

  const handleReset = () => {
    const allVars = allVariablesFromStore
      .filter((v) => v.name !== "")
      .map((v) => ({ ...v, tempId: v.tempId || `temp_${v.columnIndex}` }))
      .sort((a, b) => (a.columnIndex || 0) - (b.columnIndex || 0));
    setAvailableVariables(allVars);
    setVariablesToRecode([]);
    setHighlightedVariable(null);
    setRecodeListType(null);
    setRecodeRules([]);
    console.log("Reset clicked");
  };

  return (
    <div className="flex-grow overflow-y-auto flex flex-col h-full bg-background text-foreground">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "setup" | "rules")}
        className="w-full flex flex-col flex-grow overflow-hidden"
      >
        <div className="border-b border-border flex-shrink-0">
          <TabsList className="bg-muted rounded-none h-9 p-0">
            <TabsTrigger
              value="setup"
              className={`px-4 h-8 rounded-none text-sm ${
                activeTab === "setup"
                  ? "bg-card border-t border-l border-r border-border"
                  : ""
              }`}
            >
              Setup
            </TabsTrigger>
            <TabsTrigger
              value="rules"
              className={`px-4 h-8 rounded-none text-sm ${
                activeTab === "rules"
                  ? "bg-card border-t border-l border-r border-border"
                  : ""
              }`}
            >
              Rules
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="setup" className="p-6 overflow-y-auto flex-grow">
          <RecodeVariablesTab
            availableVariables={availableVariables}
            variablesToRecode={variablesToRecode}
            highlightedVariable={highlightedVariable}
            setHighlightedVariable={setHighlightedVariable}
            moveToRightPane={moveToRightPane}
            moveToLeftPane={moveToLeftPane}
            reorderVariables={reorderVariables}
          />
        </TabsContent>

        <TabsContent value="rules" className="p-6 overflow-y-auto flex-grow">
          <OldNewValuesSetup
            recodeListType={recodeListType}
            recodeRules={recodeRules}
            setRecodeRules={setRecodeRules}
            onCloseSetup={() => {}}
            variableCount={variablesToRecode.length}
            outputType={recodeListType || undefined} // Di recode same variables, output type sama dengan recodeListType
          />
        </TabsContent>
      </Tabs>

      <div className="px-6 py-4 border-t border-[#E6E6E6] flex-shrink-0 bg-muted flex justify-end space-x-2 w-full">
        {/* <Button variant="outline" onClick={handlePaste}>
          Paste
        </Button> */}
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
        <Button
          variant="default"
          onClick={handleOk}
          disabled={
            isProcessing ||
            variablesToRecode.length === 0 ||
            recodeRules.length === 0
          }
        >
          {isProcessing ? "Processing..." : "OK"}
        </Button>

        {/* <Button variant="outline">Help</Button> */}
      </div>

      {/* Type Mismatch Alert Dialog */}
      <AlertDialog open={showTypeAlert} onOpenChange={setShowTypeAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Variable Type Mismatch</AlertDialogTitle>
            <AlertDialogDescription>
              Cannot add {incompatibleVariable?.name} (
              {incompatibleVariable?.type}) to the list. Currently selected
              variables are of type {recodeListType}. Variables to recode must
              be of the same type (either all NUMERIC or all STRING).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowTypeAlert(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export const isRecodeSameVariablesModalType = (type: string): boolean => {
  return type === RecodeMode.SAME_VARIABLES;
};

export default RecodeSameVariablesModal;
