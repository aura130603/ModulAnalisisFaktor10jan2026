"use client";
import React, { useState, FC, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore, CellUpdate } from "@/stores/useDataStore";
import type { Variable, VariableType } from "@/types/Variable";
import RecodeVariablesTab from "../components/RecodeVariablesTab";
import OldNewValuesSetup from "../components/OldNewValuesSetup";
import { useResultStore } from "@/stores/useResultStore";
import { X } from "lucide-react";
import VariableMappingEditor from "./VariableMappingEditor";
import OutputOptions from "./OutputOptions";
import { RecodeRule, RecodeMapping } from "../Types";
import { BaseModalProps } from "@/types/modalTypes";

export enum RecodeMode {
  DIFFERENT_VARIABLES = "recodeDifferentVariables",
}

export interface RecodeDifferentVariablesModalProps extends BaseModalProps {
  onClose: () => void;
  containerType?: "dialog" | "sidebar";
}

export const RecodeDifferentVariablesModal: FC<
  RecodeDifferentVariablesModalProps
> = ({ onClose, containerType = "dialog" }) => {
  const allVariablesFromStore = useVariableStore.getState().variables;
  const dataStore = useDataStore();

  const resultStore = useResultStore();

  const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
  const [recodeMappings, setRecodeMappings] = useState<RecodeMapping[]>([]);
  const [highlightedVariable, setHighlightedVariable] = useState<{
    tempId: string;
    source: "available" | "recodeList";
  } | null>(null);
  const [recodeListType, setRecodeListType] = useState<
    "NUMERIC" | "STRING" | null
  >(null);

  const [recodeRules, setRecodeRules] = useState<RecodeRule[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<"setup" | "rules">("setup");

  // Alert dialog state
  const [showTypeAlert, setShowTypeAlert] = useState(false);
  const [incompatibleVariable, setIncompatibleVariable] =
    useState<Variable | null>(null);

  const [selectedMappingIndex, setSelectedMappingIndex] = useState<
    number | null
  >(null);

  const [variablesToRecode, setVariablesToRecode] = useState<Variable[]>([]);

  const [outputType, setOutputType] = useState<"NUMERIC" | "STRING">("NUMERIC");
  const [stringWidth, setStringWidth] = useState(8);
  const [convertStringToNumber, setConvertStringToNumber] = useState(false);

  // Tambahkan state untuk error dialog
  const [errorDialog, setErrorDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
  } | null>(null);

  // Helper function untuk mengkonversi VariableType ke tipe yang didukung recode
  const getRecodeType = (
    variableType: VariableType | undefined
  ): "NUMERIC" | "STRING" => {
    if (!variableType) return "STRING";

    // Tipe yang dianggap NUMERIC untuk recode
    const numericTypes: VariableType[] = [
      "NUMERIC",
      "COMMA",
      "DOT",
      "SCIENTIFIC",
      "DOLLAR",
      "RESTRICTED_NUMERIC",
      "DATE",
      "ADATE",
      "EDATE",
      "SDATE",
      "JDATE",
      "QYR",
      "MOYR",
      "WKYR",
      "DATETIME",
      "TIME",
      "DTIME",
      "WKDAY",
      "MONTH",
    ];

    return numericTypes.includes(variableType) ? "NUMERIC" : "STRING";
  };

  useEffect(() => {
    const recodeVarTempIds = new Set(
      recodeMappings.map((m) => m.sourceVariable.tempId)
    );
    const initialAvailable = allVariablesFromStore
      .filter(
        (v) => v.name !== "" && v.tempId && !recodeVarTempIds.has(v.tempId)
      )
      .map((v) => ({ ...v, tempId: v.tempId || `temp_${v.columnIndex}` }));
    setAvailableVariables(initialAvailable);

    if (recodeMappings.length === 0 && recodeListType !== null) {
      setRecodeListType(null);
    }
  }, [allVariablesFromStore, recodeMappings, recodeListType]);

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
      setRecodeMappings((prev) => {
        if (prev.some((m) => m.sourceVariable.tempId === variable.tempId))
          return prev;
        const newList = [...prev];
        const newMapping: RecodeMapping = {
          sourceVariable: variable,
          targetName: `${variable.name}_recoded`,
          targetLabel: `Recoded ${variable.label || variable.name}`,
        };
        if (
          typeof targetIndex === "number" &&
          targetIndex >= 0 &&
          targetIndex <= newList.length
        ) {
          newList.splice(targetIndex, 0, newMapping);
        } else {
          newList.push(newMapping);
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
      setVariablesToRecode((prev) =>
        prev.filter((v) => v.tempId !== variable.tempId)
      );
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
      setRecodeMappings((prev) =>
        prev.filter((m) => m.sourceVariable.tempId !== variable.tempId)
      );
      setHighlightedVariable(null);
      setSelectedMappingIndex(null);
    },
    []
  );

  const updateTargetVariable = (
    tempId: string,
    field: "name" | "label",
    value: string
  ) => {
    setRecodeMappings((prev) =>
      prev.map((mapping) =>
        mapping.sourceVariable.tempId === tempId
          ? { ...mapping, [field]: value }
          : mapping
      )
    );
  };

  const reorderVariables = useCallback(
    (source: "available" | "recodeList", reorderedList: Variable[]) => {
      if (source === "available") {
        setAvailableVariables([...reorderedList]);
      } else if (source === "recodeList") {
        setRecodeMappings((prev) => {
          const newList = prev.map((m) => ({
            ...m,
            sourceVariable:
              reorderedList.find((v) => v.tempId === m.sourceVariable.tempId) ||
              m.sourceVariable,
          }));
          return newList;
        });
      }
    },
    []
  );

  // Fungsi untuk mengevaluasi nilai berdasarkan aturan recode
  const evaluateValueWithRules = (
    value: string | number,
    rules: RecodeRule[],
    sourceVariableType: "NUMERIC" | "STRING",
    variable?: Variable
  ): string | number => {
    // if (value === "") {
    //   return value;
    // }

    const numericValue = typeof value === "string" ? parseFloat(value) : value;
    const isNumericType = sourceVariableType === "NUMERIC";
    const isValidNumber = !isNaN(numericValue);

    const isSystemMissing =
      value === null ||
      value === undefined ||
      (typeof value === "number" && isNaN(value)) ||
      (isNumericType && typeof value === "string" && value.trim() === "");

    const isUserMissing = (() => {
      if (!variable?.missing) return false;

      // Cek nilai diskrit (user-missing values)
      if (
        Array.isArray(variable.missing.discrete) &&
        variable.missing.discrete.includes(value)
      ) {
        return true;
      }

      const range = variable.missing?.range;
      if (
        isNumericType &&
        range?.min !== undefined &&
        range?.max !== undefined
      ) {
        return (
          isValidNumber &&
          numericValue >= range.min &&
          numericValue <= range.max
        );
      }

      return false;
    })();

    const isSystemOrUserMissing = isSystemMissing || isUserMissing;

    for (const rule of rules) {
      switch (rule.oldValueType) {
        case "value":
          if (value == rule.oldValue) {
            return rule.newValue ?? "";
          }
          if (isNumericType && isValidNumber && numericValue == rule.oldValue) {
            return rule.newValue ?? "";
          }
          break;

        case "range":
          if (isNumericType && isValidNumber && Array.isArray(rule.oldValue)) {
            const [min, max] = rule.oldValue;
            if (
              min !== null &&
              max !== null &&
              numericValue >= min &&
              numericValue <= max
            ) {
              return rule.newValue ?? "";
            }
          }
          break;

        case "rangeLowest":
          if (isNumericType && isValidNumber && Array.isArray(rule.oldValue)) {
            const [, max] = rule.oldValue;
            if (max !== null && numericValue <= max) {
              return rule.newValue ?? "";
            }
          }
          break;

        case "rangeHighest":
          if (isNumericType && isValidNumber && Array.isArray(rule.oldValue)) {
            const [min] = rule.oldValue;
            if (min !== null && numericValue >= min) {
              return rule.newValue ?? "";
            }
          }
          break;

        case "systemMissing":
          if (isSystemMissing) {
            return rule.newValue ?? "";
          }
          break;

        case "systemOrUserMissing":
          if (isSystemOrUserMissing) {
            return rule.newValue ?? "";
          }
          break;

        case "else":
          continue;
      }
    }

    const elseRule = rules.find((r) => r.oldValueType === "else");
    if (elseRule) {
      return elseRule.newValue ?? "";
    }

    return value;
  };

  const handleOk = async () => {
    if (recodeMappings.length === 0) {
      toast.error("Please select at least one variable to recode.");
      return;
    }

    if (recodeRules.length === 0) {
      toast.error("Please define at least one rule for recoding.");
      return;
    }

    setIsProcessing(true);
    try {
      const variableStore = useVariableStore.getState();
      let currentColumnIndex = allVariablesFromStore.length;

      // Step 1: Add all variables first
      const newVariablesToAdd: Partial<Variable>[] = [];
      const initialUpdates: CellUpdate[] = [];

      for (const mapping of recodeMappings) {
        // Tentukan tipe output efektif
        let effectiveOutputType = outputType;
        if (outputType !== "STRING" && !convertStringToNumber) {
          // Jika kedua opsi tidak dicentang, ikuti tipe variabel asli, fallback ke STRING jika undefined
          effectiveOutputType =
            mapping.sourceVariable.type === "NUMERIC" ? "NUMERIC" : "STRING";
        }

        const newVariable: Partial<Variable> = {
          name: mapping.targetName,
          label: mapping.targetLabel,
          type: effectiveOutputType,
          columnIndex: currentColumnIndex,
          width: effectiveOutputType === "STRING" ? stringWidth : 8,
          decimals: 2,
          values: [],
          missing: {
            discrete: [],
            range: { min: undefined, max: undefined },
          },
          columns: 100,
          align: effectiveOutputType === "STRING" ? "left" : ("right" as const),
          measure: (effectiveOutputType === "NUMERIC"
            ? "scale"
            : "nominal") as Variable["measure"],
          role: "input" as Variable["role"],
        };
        newVariablesToAdd.push(newVariable);
        currentColumnIndex++;
      }

      // Add variables first - ini akan membuat kolom tersedia
      if (newVariablesToAdd.length > 0) {
        await variableStore.addVariables(newVariablesToAdd, initialUpdates);
      }

      // Step 2: Prepare cell updates
      const bulkUpdates: CellUpdate[] = [];
      let columnOffset = allVariablesFromStore.length;

      for (const mapping of recodeMappings) {
        // Tentukan tipe output efektif
        let effectiveOutputType = outputType;
        if (outputType !== "STRING" && !convertStringToNumber) {
          // Jika kedua opsi tidak dicentang, ikuti tipe variabel asli, fallback ke STRING jika undefined
          effectiveOutputType =
            mapping.sourceVariable.type === "NUMERIC" ? "NUMERIC" : "STRING";
        }

        // Get data from source variable
        const { data } = await dataStore.getVariableData(
          mapping.sourceVariable
        );

        console.log("Data recpde", data); // lihat cell kosong muncul sebagai apa

        // Apply recode rules to create new data
        const newData = data.map((value) => {
          const safeValue = value === null ? "" : value;
          let recodedValue = evaluateValueWithRules(
            safeValue,
            recodeRules,
            getRecodeType(mapping.sourceVariable.type),
            mapping.sourceVariable
          );

          if (effectiveOutputType === "STRING") {
            return recodedValue === "" ? "" : String(recodedValue);
          } else {
            // NUMERIC
            if (convertStringToNumber) {
              if (
                typeof recodedValue === "string" &&
                recodedValue.trim() !== ""
              ) {
                const num = Number(recodedValue);
                return isNaN(num) ? "" : num;
              }
              return recodedValue === "" ? "" : recodedValue;
            } else {
              return recodedValue === "" ? "" : recodedValue;
            }
          }
        });

        // Add to bulk updates
        newData.forEach((value, rowIndex) => {
          bulkUpdates.push({
            row: rowIndex,
            col: columnOffset,
            value: value,
          });
        });

        columnOffset++;
      }

      // Step 3: Apply all updates using updateCells (sama seperti ComputeVariable)
      if (bulkUpdates.length > 0) {
        await useDataStore.getState().updateCells(bulkUpdates);
      }

      // Step 4: Save using pendingUpdates (sama seperti ComputeVariable)
      await useDataStore.getState().saveData();

      // Add log entry
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

      const logMsg = `RECODE VARIABLE ${recodeMappings
        .map((m) => `${m.sourceVariable.name} INTO ${m.targetName}`)
        .join(", ")} WITH RULES: ${recodeRulesText}`;
      const logId = await resultStore.addLog({ log: logMsg });

      // Add analytic
      const analyticId = await resultStore.addAnalytic(logId, {
        title: "Recode into Different Variables",
        note: "",
      });

      // Add statistic
      await resultStore.addStatistic(analyticId, {
        title: "Recode into Different Variables",
        output_data: JSON.stringify({
          text: [
            {
              text: `The following variables were recoded:\n${recodeMappings
                .map(
                  (m) => `- \`${m.sourceVariable.name}\` → \`${m.targetName}\``
                )
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

      toast.success("Variables have been recoded successfully.");

      onClose();
    } catch (error) {
      console.error("Error during recode:", error);
      toast.error("An error occurred while recoding variables.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectMapping = (idx: number) => {
    setSelectedMappingIndex(idx);
  };

  const handleUpdateMapping = (
    idx: number,
    field: "targetName" | "targetLabel",
    value: string
  ) => {
    setRecodeMappings((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m))
    );
  };

  const handleRemoveMapping = (idx: number) => {
    setRecodeMappings((prev) => {
      const removed = prev[idx];
      setAvailableVariables((avail) => [...avail, removed.sourceVariable]);
      return prev.filter((_, i) => i !== idx);
    });
    if (selectedMappingIndex === idx) {
      setSelectedMappingIndex(null);
    }
  };

  const handleReset = () => {
    const allVars = allVariablesFromStore
      .filter((v) => v.name !== "")
      .map((v) => ({ ...v, tempId: v.tempId || `temp_${v.columnIndex}` }))
      .sort((a, b) => (a.columnIndex || 0) - (b.columnIndex || 0));
    setAvailableVariables(allVars);
    setVariablesToRecode([]);
    setRecodeMappings([]);
    setHighlightedVariable(null);
    setRecodeListType(null);
    setRecodeRules([]);
    setSelectedMappingIndex(null);
    setOutputType("NUMERIC");
    setStringWidth(8);
    setConvertStringToNumber(false);
    console.log("Reset clicked");
  };

  const RecodeContent = () => (
    <>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <RecodeVariablesTab
                availableVariables={availableVariables}
                variablesToRecode={variablesToRecode}
                highlightedVariable={highlightedVariable}
                setHighlightedVariable={setHighlightedVariable}
                moveToRightPane={moveToRightPane}
                moveToLeftPane={moveToLeftPane}
                reorderVariables={reorderVariables}
              />
            </div>
            <div>
              <VariableMappingEditor
                recodeMappings={recodeMappings}
                selectedMappingIndex={selectedMappingIndex}
                onSelectMapping={handleSelectMapping}
                onUpdateMapping={handleUpdateMapping}
                onRemoveMapping={moveToLeftPane}
              />
              <OutputOptions
                outputType={outputType}
                setOutputType={setOutputType}
                stringWidth={stringWidth}
                setStringWidth={setStringWidth}
                convertStringToNumber={convertStringToNumber}
                setConvertStringToNumber={setConvertStringToNumber}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="rules" className="p-6 overflow-y-auto flex-grow">
          <OldNewValuesSetup
            recodeListType={recodeListType}
            recodeRules={recodeRules}
            setRecodeRules={setRecodeRules}
            onCloseSetup={() => {}}
            variableCount={variablesToRecode.length}
            outputType={outputType}
          />
        </TabsContent>
      </Tabs>

      <div className="px-6 py-3 border-t border-border flex items-center justify-end bg-secondary flex-shrink-0">
        <Button variant="outline" className="mr-2" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="outline" className="mr-2" onClick={handleReset}>
          Reset
        </Button>
        <Button
          onClick={handleOk}
          disabled={
            isProcessing ||
            recodeMappings.length === 0 ||
            recodeRules.length === 0
          }
        >
          {isProcessing ? "Processing..." : "OK"}
        </Button>
      </div>

      {/* Type Mismatch Alert Dialog */}
      <AlertDialog open={showTypeAlert} onOpenChange={setShowTypeAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Incompatible Variable Type</AlertDialogTitle>
            <AlertDialogDescription>
              {incompatibleVariable && (
                <>
                  The variable &quot;{incompatibleVariable.name}&quot; has a
                  different type than the variables already selected for
                  recoding. All variables must be of the same type (either all
                  NUMERIC or all STRING).
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
    </>
  );

  return (
    <>
      {containerType === "dialog" ? (
        <Dialog open={true} onOpenChange={onClose}>
          <DialogContent className="max-w-4xl p-0 bg-card border border-border shadow-md rounded-md flex flex-col max-h-[85vh]">
            <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
              <DialogTitle className="text-xl font-semibold">
                Recode into Different Variables
              </DialogTitle>
              <DialogDescription>
                Create new variables by recoding existing ones.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-grow flex flex-col overflow-hidden">
              <RecodeContent />
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        // Sidebar mode
        <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground w-[900px]">
          <div className="flex-grow flex flex-col overflow-hidden">
            <RecodeContent />
          </div>
        </div>
      )}
    </>
  );
};

export const isRecodeDifferentVariablesModalType = (type: string): boolean => {
  return type === RecodeMode.DIFFERENT_VARIABLES;
};

export default RecodeDifferentVariablesModal;
