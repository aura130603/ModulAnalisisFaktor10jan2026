"use client";
import React, { useState, FC, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Info } from "lucide-react";
import type { RecodeRule } from "../Types"; // Import RecodeRule from the main modal component
import type { VariableType } from "@/types/Variable";

interface OldNewValuesSetupProps {
  recodeListType: "NUMERIC" | "STRING" | null;
  recodeRules: RecodeRule[];
  setRecodeRules: React.Dispatch<React.SetStateAction<RecodeRule[]>>;
  onCloseSetup: () => void; // To go back to the variable selection view
  variableCount?: number; // Jumlah variabel yang akan direkode
  outputType?: "NUMERIC" | "STRING"; // Tipe output untuk menentukan konversi nilai baru
}

const OldNewValuesSetup: FC<OldNewValuesSetupProps> = ({
  recodeListType,
  recodeRules,
  setRecodeRules,
  onCloseSetup,
  variableCount = 0,
  outputType,
}) => {
  // --- State for Old Value inputs ---
  const [oldValueSelectionType, setOldValueSelectionType] = useState<
    | "value"
    | "systemMissing"
    | "systemOrUserMissing"
    | "range"
    | "rangeLowest"
    | "rangeHighest"
    | "else"
  >("value");
  const [oldSingleValue, setOldSingleValue] = useState<string>("");
  const [oldRangeMin, setOldRangeMin] = useState<string>("");
  const [oldRangeMax, setOldRangeMax] = useState<string>("");
  const [oldRangeLowestMax, setOldRangeLowestMax] = useState<string>(""); // For LOWEST through value
  const [oldRangeHighestMin, setOldRangeHighestMin] = useState<string>(""); // For value through HIGHEST

  // --- State for New Value inputs ---
  const [newValueSelectionType, setNewValueSelectionType] = useState<
    "value" | "systemMissing"
  >("value");
  const [newSingleValue, setNewSingleValue] = useState<string>("");

  // --- State for managing the list of rules ---
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

  // State untuk error dialog
  const [errorDialog, setErrorDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
  } | null>(null);

  const isNumeric = recodeListType === "NUMERIC";
  const isString = recodeListType === "STRING";

  // Helper functions untuk validasi input berdasarkan tipe output
  const isOutputNumeric = outputType === "NUMERIC";
  const isOutputString = outputType === "STRING";

  // Validasi input untuk nilai baru berdasarkan tipe output
  const validateNewValueInput = (value: string): boolean => {
    if (isOutputNumeric) {
      // Jika output numeric, hanya terima angka, titik desimal, dan tanda minus
      return /^-?\d*\.?\d*$/.test(value);
    }
    // Jika output string, terima semua karakter
    return true;
  };

  // Handler untuk input nilai baru dengan validasi
  const handleNewValueChange = (value: string) => {
    if (validateNewValueInput(value)) {
      setNewSingleValue(value);
    }
  };

  // Effect to reset specific range inputs when main range type changes
  useEffect(() => {
    if (oldValueSelectionType !== "range") {
      setOldRangeMin("");
      setOldRangeMax("");
    }
    if (oldValueSelectionType !== "rangeLowest") {
      setOldRangeLowestMax("");
    }
    if (oldValueSelectionType !== "rangeHighest") {
      setOldRangeHighestMin("");
    }
    if (oldValueSelectionType !== "value") {
      setOldSingleValue("");
    }
  }, [oldValueSelectionType]);

  const populateFieldsFromSelectedRule = useCallback(() => {
    if (!selectedRuleId) return;
    const rule = recodeRules.find((r) => r.id === selectedRuleId);
    if (!rule) return;

    setOldValueSelectionType(rule.oldValueType);
    setNewValueSelectionType(rule.newValueType);

    // Populate Old Value fields
    switch (rule.oldValueType) {
      case "value":
        setOldSingleValue(String(rule.oldValue ?? ""));
        break;
      case "range":
        if (Array.isArray(rule.oldValue) && rule.oldValue.length === 2) {
          setOldRangeMin(String(rule.oldValue[0] ?? ""));
          setOldRangeMax(String(rule.oldValue[1] ?? ""));
        }
        break;
      case "rangeLowest":
        if (Array.isArray(rule.oldValue) && rule.oldValue.length === 2) {
          setOldRangeLowestMax(String(rule.oldValue[1] ?? ""));
        }
        break;
      case "rangeHighest":
        if (Array.isArray(rule.oldValue) && rule.oldValue.length === 2) {
          setOldRangeHighestMin(String(rule.oldValue[0] ?? ""));
        }
        break;
      case "systemMissing":
      case "systemOrUserMissing":
      case "else":
        // No specific input fields for these beyond the radio button
        break;
    }

    // Populate New Value fields
    if (rule.newValueType === "value") {
      setNewSingleValue(String(rule.newValue ?? ""));
    } else {
      setNewSingleValue(""); // Clear if new value is systemMissing
    }
  }, [selectedRuleId, recodeRules]);

  useEffect(() => {
    populateFieldsFromSelectedRule();
  }, [selectedRuleId, populateFieldsFromSelectedRule]);

  // Function to check if rules overlap
  const checkRulesOverlap = (
    rule: RecodeRule,
    existingRules: RecodeRule[],
    currentRuleId?: string
  ): { overlaps: boolean; message: string } => {
    // Skip checking against the rule being edited
    const rulesToCheck = existingRules.filter((r) => r.id !== currentRuleId);

    // For non-numeric types, only check exact value matches (case-insensitive)
    if (!isNumeric && rule.oldValueType === "value") {
      const duplicate = rulesToCheck.find(
        (r) =>
          r.oldValueType === "value" &&
          String(r.oldValue).toLowerCase() ===
            String(rule.oldValue).toLowerCase()
      );
      if (duplicate) {
        return {
          overlaps: true,
          message: `Duplicate value: "${rule.oldValueDisplay}" already exists in another rule.`,
        };
      }
    }

    // For numeric types, check various overlap scenarios
    if (isNumeric) {
      // Check value overlap
      if (rule.oldValueType === "value") {
        const numValue =
          typeof rule.oldValue === "number"
            ? rule.oldValue
            : parseFloat(String(rule.oldValue));

        for (const existingRule of rulesToCheck) {
          if (
            existingRule.oldValueType === "range" &&
            Array.isArray(existingRule.oldValue)
          ) {
            const [min, max] = existingRule.oldValue;
            if (
              min !== null &&
              max !== null &&
              numValue >= min &&
              numValue <= max
            ) {
              return {
                overlaps: true,
                message: `Value ${numValue} overlaps with range ${min}-${max} in another rule.`,
              };
            }
          } else if (
            existingRule.oldValueType === "rangeLowest" &&
            Array.isArray(existingRule.oldValue)
          ) {
            const [, max] = existingRule.oldValue;
            if (max !== null && numValue <= max) {
              return {
                overlaps: true,
                message: `Value ${numValue} overlaps with range LOWEST-${max} in another rule.`,
              };
            }
          } else if (
            existingRule.oldValueType === "rangeHighest" &&
            Array.isArray(existingRule.oldValue)
          ) {
            const [min] = existingRule.oldValue;
            if (min !== null && numValue >= min) {
              return {
                overlaps: true,
                message: `Value ${numValue} overlaps with range ${min}-HIGHEST in another rule.`,
              };
            }
          } else if (
            existingRule.oldValueType === "value" &&
            existingRule.oldValue === numValue
          ) {
            return {
              overlaps: true,
              message: `Duplicate value: ${numValue} already exists in another rule.`,
            };
          }
        }
      }

      // Check range overlap
      else if (rule.oldValueType === "range" && Array.isArray(rule.oldValue)) {
        const [ruleMin, ruleMax] = rule.oldValue;
        if (ruleMin === null || ruleMax === null)
          return { overlaps: false, message: "" };

        for (const existingRule of rulesToCheck) {
          if (
            existingRule.oldValueType === "range" &&
            Array.isArray(existingRule.oldValue)
          ) {
            const [existingMin, existingMax] = existingRule.oldValue;
            if (existingMin === null || existingMax === null) continue;

            // Overlap only if they intersect beyond touching boundaries
            if (ruleMin < existingMax && ruleMax > existingMin) {
              return {
                overlaps: true,
                message: `Range ${ruleMin}-${ruleMax} overlaps with range ${existingMin}-${existingMax} in another rule.`,
              };
            }
          }
          // Range vs LOWEST
          else if (
            existingRule.oldValueType === "rangeLowest" &&
            Array.isArray(existingRule.oldValue)
          ) {
            const [, existingMax] = existingRule.oldValue;
            if (existingMax !== null && ruleMin < existingMax) {
              return {
                overlaps: true,
                message: `Range ${ruleMin}-${ruleMax} overlaps with range LOWEST-${existingMax} in another rule.`,
              };
            }
          }
          // Range vs HIGHEST
          else if (
            existingRule.oldValueType === "rangeHighest" &&
            Array.isArray(existingRule.oldValue)
          ) {
            const [existingMin] = existingRule.oldValue;
            if (existingMin !== null && ruleMax > existingMin) {
              return {
                overlaps: true,
                message: `Range ${ruleMin}-${ruleMax} overlaps with range ${existingMin}-HIGHEST in another rule.`,
              };
            }
          }
          // Range vs value
          else if (existingRule.oldValueType === "value") {
            const existingValue =
              typeof existingRule.oldValue === "number"
                ? existingRule.oldValue
                : parseFloat(String(existingRule.oldValue));

            if (
              !isNaN(existingValue) &&
              existingValue > ruleMin &&
              existingValue < ruleMax
            ) {
              return {
                overlaps: true,
                message: `Range ${ruleMin}-${ruleMax} overlaps with value ${existingValue} in another rule.`,
              };
            }
          }
        }
      }

      // Check rangeLowest overlap
      else if (
        rule.oldValueType === "rangeLowest" &&
        Array.isArray(rule.oldValue)
      ) {
        const [, ruleMax] = rule.oldValue;
        if (ruleMax === null) return { overlaps: false, message: "" };

        for (const existingRule of rulesToCheck) {
          if (
            existingRule.oldValueType === "range" &&
            Array.isArray(existingRule.oldValue)
          ) {
            const [existingMin] = existingRule.oldValue;
            if (existingMin !== null && ruleMax > existingMin) {
              return {
                overlaps: true,
                message: `Range LOWEST-${ruleMax} overlaps with range ${existingMin}-${existingRule.oldValue[1]} in another rule.`,
              };
            }
          } else if (
            existingRule.oldValueType === "rangeLowest" &&
            Array.isArray(existingRule.oldValue)
          ) {
            const [, existingMax] = existingRule.oldValue;
            if (existingMax !== null && ruleMax === existingMax) {
              return {
                overlaps: true,
                message: `Duplicate range: LOWEST-${ruleMax} already exists in another rule.`,
              };
            }
          } else if (existingRule.oldValueType === "value") {
            const existingValue =
              typeof existingRule.oldValue === "number"
                ? existingRule.oldValue
                : parseFloat(String(existingRule.oldValue));

            if (!isNaN(existingValue) && existingValue < ruleMax) {
              return {
                overlaps: true,
                message: `Range LOWEST-${ruleMax} overlaps with value ${existingValue} in another rule.`,
              };
            }
          }
        }
      }

      // Check rangeHighest overlap
      else if (
        rule.oldValueType === "rangeHighest" &&
        Array.isArray(rule.oldValue)
      ) {
        const [ruleMin] = rule.oldValue;
        if (ruleMin === null) return { overlaps: false, message: "" };

        for (const existingRule of rulesToCheck) {
          if (
            existingRule.oldValueType === "range" &&
            Array.isArray(existingRule.oldValue)
          ) {
            const [, existingMax] = existingRule.oldValue;
            if (existingMax !== null && ruleMin < existingMax) {
              return {
                overlaps: true,
                message: `Range ${ruleMin}-HIGHEST overlaps with range ${existingRule.oldValue[0]}-${existingMax} in another rule.`,
              };
            }
          } else if (
            existingRule.oldValueType === "rangeHighest" &&
            Array.isArray(existingRule.oldValue)
          ) {
            const [existingMin] = existingRule.oldValue;
            if (existingMin !== null && ruleMin === existingMin) {
              return {
                overlaps: true,
                message: `Duplicate range: ${ruleMin}-HIGHEST already exists in another rule.`,
              };
            }
          } else if (existingRule.oldValueType === "value") {
            const existingValue =
              typeof existingRule.oldValue === "number"
                ? existingRule.oldValue
                : parseFloat(String(existingRule.oldValue));

            if (!isNaN(existingValue) && existingValue > ruleMin) {
              return {
                overlaps: true,
                message: `Range ${ruleMin}-HIGHEST overlaps with value ${existingValue} in another rule.`,
              };
            }
          }
        }
      }
    }

    // Special types duplicate checks
    if (rule.oldValueType === "systemMissing") {
      const duplicate = rulesToCheck.find(
        (r) => r.oldValueType === "systemMissing"
      );
      if (duplicate) {
        return {
          overlaps: true,
          message: "A rule for System Missing values already exists.",
        };
      }
    }

    if (rule.oldValueType === "systemOrUserMissing") {
      const duplicate = rulesToCheck.find(
        (r) => r.oldValueType === "systemOrUserMissing"
      );
      if (duplicate) {
        return {
          overlaps: true,
          message: "A rule for System or User Missing values already exists.",
        };
      }
    }

    if (rule.oldValueType === "else") {
      const duplicate = rulesToCheck.find((r) => r.oldValueType === "else");
      if (duplicate) {
        return {
          overlaps: true,
          message: "An ELSE rule already exists.",
        };
      }
    }

    return { overlaps: false, message: "" };
  };

  const handleRuleAction = (action: "add" | "change") => {
    const newId = action === "add" ? Date.now().toString() : selectedRuleId;
    if (!newId) return;

    let tempOldValueDisplay = "";
    let tempOldValueActual:
      | string
      | number
      | [number | null, number | null]
      | null = null;

    switch (oldValueSelectionType) {
      case "value":
        if (oldSingleValue.trim() === "") {
          setErrorDialog({
            open: true,
            title: "Validation Error",
            description: "Old value cannot be empty.",
          });
          return;
        }
        tempOldValueDisplay = oldSingleValue;
        tempOldValueActual = isNumeric
          ? parseFloat(oldSingleValue)
          : oldSingleValue;
        break;
      case "range":
        if (oldRangeMin.trim() === "" || oldRangeMax.trim() === "") {
          setErrorDialog({
            open: true,
            title: "Validation Error",
            description: "Both min and max range values must be provided.",
          });
          return;
        }
        const min = parseFloat(oldRangeMin);
        const max = parseFloat(oldRangeMax);
        if (isNaN(min) || isNaN(max)) {
          setErrorDialog({
            open: true,
            title: "Validation Error",
            description: "Range values must be numeric.",
          });
          return;
        }
        if (min > max) {
          setErrorDialog({
            open: true,
            title: "Validation Error",
            description: "Min range value cannot be greater than Max.",
          });
          return;
        }
        tempOldValueDisplay = `${oldRangeMin}-${oldRangeMax}`;
        tempOldValueActual = [min, max];
        break;
      case "rangeLowest":
        if (oldRangeLowestMax.trim() === "") {
          setErrorDialog({
            open: true,
            title: "Validation Error",
            description: "Max value for LOWEST range must be provided.",
          });
          return;
        }
        const lowestMax = parseFloat(oldRangeLowestMax);
        if (isNaN(lowestMax)) {
          setErrorDialog({
            open: true,
            title: "Validation Error",
            description: "Range value must be numeric.",
          });
          return;
        }
        tempOldValueDisplay = `LOWEST-${oldRangeLowestMax}`;
        tempOldValueActual = [null, lowestMax];
        break;
      case "rangeHighest":
        if (oldRangeHighestMin.trim() === "") {
          setErrorDialog({
            open: true,
            title: "Validation Error",
            description: "Min value for HIGHEST range must be provided.",
          });
          return;
        }
        const highestMin = parseFloat(oldRangeHighestMin);
        if (isNaN(highestMin)) {
          setErrorDialog({
            open: true,
            title: "Validation Error",
            description: "Range value must be numeric.",
          });
          return;
        }
        tempOldValueDisplay = `${oldRangeHighestMin}-HIGHEST`;
        tempOldValueActual = [highestMin, null];
        break;
      case "systemMissing":
        tempOldValueDisplay = "SYSMIS";
        tempOldValueActual = null;
        break;
      case "systemOrUserMissing":
        tempOldValueDisplay = "MISSING";
        tempOldValueActual = null;
        break;
      case "else":
        tempOldValueDisplay = "ELSE";
        tempOldValueActual = null;
        break;
    }

    let tempNewValueDisplay = "";
    let tempNewValueActual: string | number | null = null;

    if (newValueSelectionType === "value") {
      if (newSingleValue.trim() === "") {
        setErrorDialog({
          open: true,
          title: "Validation Error",
          description: "New value cannot be empty if type is 'Value'.",
        });
        return;
      }

      // Validasi tambahan berdasarkan tipe output
      if (isOutputNumeric) {
        const numValue = parseFloat(newSingleValue);
        if (isNaN(numValue)) {
          setErrorDialog({
            open: true,
            title: "Validation Error",
            description:
              "New value must be a valid number since output type is NUMERIC.",
          });
          return;
        }
      }

      tempNewValueDisplay = newSingleValue;
      // Gunakan outputType untuk menentukan konversi, fallback ke isNumeric jika outputType tidak tersedia
      const shouldConvertToNumeric =
        outputType === "NUMERIC" || (outputType === undefined && isNumeric);
      tempNewValueActual = shouldConvertToNumeric
        ? parseFloat(newSingleValue)
        : newSingleValue;
    } else {
      tempNewValueDisplay = "SYSMIS";
      tempNewValueActual = null;
    }

    const rule: RecodeRule = {
      id: newId,
      oldValueType: oldValueSelectionType,
      oldValue: tempOldValueActual,
      oldValueDisplay: tempOldValueDisplay,
      newValueType: newValueSelectionType,
      newValue: tempNewValueActual,
      newValueDisplay: tempNewValueDisplay,
    };

    // Check for overlapping rules
    const { overlaps, message } = checkRulesOverlap(
      rule,
      recodeRules,
      action === "change" ? newId : undefined
    );

    if (overlaps) {
      setErrorDialog({
        open: true,
        title: "Overlapping Rules",
        description: message,
      });
      return;
    }

    if (action === "add") {
      setRecodeRules((prev) => [...prev, rule].sort(sortRules));
    } else {
      setRecodeRules((prev) =>
        prev.map((r) => (r.id === newId ? rule : r)).sort(sortRules)
      );
    }

    // Reset input fields only on add
    if (action === "add") {
      setOldSingleValue("");
      setOldRangeMin("");
      setOldRangeMax("");
      setOldRangeLowestMax("");
      setOldRangeHighestMin("");
      setNewSingleValue("");
      // setOldValueSelectionType('value'); // Optionally reset radio selections
      // setNewValueSelectionType('value');
    }
    setSelectedRuleId(null); // Deselect after add/change
  };

  const handleRemoveRule = () => {
    if (selectedRuleId) {
      setRecodeRules((prev) =>
        prev.filter((rule) => rule.id !== selectedRuleId)
      );
      setSelectedRuleId(null);
    }
  };

  const sortRules = (a: RecodeRule, b: RecodeRule): number => {
    const typeOrder: RecodeRule["oldValueType"][] = [
      "systemMissing",
      "systemOrUserMissing",
      "value",
      "rangeLowest",
      "range",
      "rangeHighest",
      "else",
    ];
    const typeAIndex = typeOrder.indexOf(a.oldValueType);
    const typeBIndex = typeOrder.indexOf(b.oldValueType);

    if (typeAIndex !== typeBIndex) {
      return typeAIndex - typeBIndex;
    }

    // Secondary sorting for rules of the same type
    switch (a.oldValueType) {
      case "value":
        if (typeof a.oldValue === "number" && typeof b.oldValue === "number") {
          return a.oldValue - b.oldValue;
        }
        return String(a.oldValue ?? "").localeCompare(String(b.oldValue ?? ""));
      case "range":
        // Assuming oldValue is [min, max] and both are numbers for numeric recode
        if (
          Array.isArray(a.oldValue) &&
          Array.isArray(b.oldValue) &&
          isNumeric
        ) {
          const aMin = a.oldValue[0] as number;
          const bMin = b.oldValue[0] as number;
          if (aMin !== bMin) return aMin - bMin;
          const aMax = a.oldValue[1] as number;
          const bMax = b.oldValue[1] as number;
          return aMax - bMax;
        }
        break;
      case "rangeLowest":
        // Sort by the max value (oldValue[1])
        if (
          Array.isArray(a.oldValue) &&
          Array.isArray(b.oldValue) &&
          isNumeric
        ) {
          const aMax = a.oldValue[1] as number;
          const bMax = b.oldValue[1] as number;
          return aMax - bMax;
        }
        break;
      case "rangeHighest":
        // Sort by the min value (oldValue[0])
        if (
          Array.isArray(a.oldValue) &&
          Array.isArray(b.oldValue) &&
          isNumeric
        ) {
          const aMin = a.oldValue[0] as number;
          const bMin = b.oldValue[0] as number;
          return aMin - bMin;
        }
        break;
      // systemMissing, systemOrUserMissing, else usually don't have multiple distinct entries to sort among themselves in complex ways
      // but if they did, further logic could be added here.
    }
    return 0; // Default if no other sorting applies
  };

  return (
    <>
      {/* Error Alert Dialog */}
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

      {/* Info Alert - rules apply to all variables */}
      <Alert className="mb-4 bg-blue-50 border border-blue-200">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertDescription>
          The recode rules defined here will apply to all {variableCount}{" "}
          selected {recodeListType?.toLowerCase()} variable
          {variableCount !== 1 ? "s" : ""}.
          {outputType && (
            <span className="font-semibold">
              {" "}
              Output will be {outputType.toLowerCase()}.
            </span>
          )}
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-3 gap-4">
        {/* Old Value Section (Column 1) */}
        <div className="border rounded-md p-3 bg-[#FAFAFA]">
          <h3 className="font-semibold mb-2">Old Value</h3>
          <RadioGroup
            value={oldValueSelectionType}
            onValueChange={(v) => setOldValueSelectionType(v as any)}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="value" id="old-value" />
              <Label htmlFor="old-value" className="text-sm cursor-pointer">
                Value
              </Label>
              {oldValueSelectionType === "value" && (
                <div className="ml-2 flex-1">
                  <Input
                    className="h-7"
                    value={oldSingleValue}
                    onChange={(e) => setOldSingleValue(e.target.value)}
                    placeholder={isNumeric ? "e.g. 42" : "e.g. Male"}
                  />
                </div>
              )}
            </div>

            {isNumeric && (
              <>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="systemMissing" id="old-sysmis" />
                  <Label
                    htmlFor="old-sysmis"
                    className="text-sm cursor-pointer"
                  >
                    System-missing
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="systemOrUserMissing"
                    id="old-missing"
                  />
                  <Label
                    htmlFor="old-missing"
                    className="text-sm cursor-pointer"
                  >
                    System- or user-missing
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="range" id="old-range" />
                  <Label htmlFor="old-range" className="text-sm cursor-pointer">
                    Range
                  </Label>
                </div>

                {oldValueSelectionType === "range" && (
                  <div className="ml-6 grid grid-cols-2 gap-2 items-center">
                    <Input
                      className="h-7"
                      value={oldRangeMin}
                      onChange={(e) => setOldRangeMin(e.target.value)}
                      placeholder="Min"
                    />
                    <span className="text-center">through</span>
                    <Input
                      className="h-7"
                      value={oldRangeMax}
                      onChange={(e) => setOldRangeMax(e.target.value)}
                      placeholder="Max"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rangeLowest" id="old-range-lowest" />
                  <Label
                    htmlFor="old-range-lowest"
                    className="text-sm cursor-pointer"
                  >
                    Range LOWEST through
                  </Label>
                </div>

                {oldValueSelectionType === "rangeLowest" && (
                  <div className="ml-6">
                    <Input
                      className="h-7"
                      value={oldRangeLowestMax}
                      onChange={(e) => setOldRangeLowestMax(e.target.value)}
                      placeholder="Max value"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rangeHighest" id="old-range-highest" />
                  <Label
                    htmlFor="old-range-highest"
                    className="text-sm cursor-pointer"
                  >
                    Range through HIGHEST
                  </Label>
                </div>

                {oldValueSelectionType === "rangeHighest" && (
                  <div className="ml-6">
                    <Input
                      className="h-7"
                      value={oldRangeHighestMin}
                      onChange={(e) => setOldRangeHighestMin(e.target.value)}
                      placeholder="Min value"
                    />
                  </div>
                )}
              </>
            )}

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="else" id="old-else" />
              <Label htmlFor="old-else" className="text-sm cursor-pointer">
                All other values
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* New Value Section (Column 2) */}
        <div className="border rounded-md p-3 bg-[#FAFAFA]">
          <h3 className="font-semibold mb-2">
            New Value
            {outputType && (
              <span className="text-sm font-normal text-gray-600 ml-2">
                (Output: {outputType})
              </span>
            )}
          </h3>
          <RadioGroup
            value={newValueSelectionType}
            onValueChange={(v) => setNewValueSelectionType(v as any)}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="value" id="new-value" />
              <Label htmlFor="new-value" className="text-sm cursor-pointer">
                Value
              </Label>
              {newValueSelectionType === "value" && (
                <div className="ml-2 flex-1">
                  <Input
                    className="h-7"
                    value={newSingleValue}
                    onChange={(e) => handleNewValueChange(e.target.value)}
                    placeholder={
                      isOutputNumeric
                        ? "e.g. 99 (numeric only)"
                        : "e.g. Unknown (any text)"
                    }
                  />
                </div>
              )}
            </div>

            {isNumeric && (
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="systemMissing" id="new-sysmis" />
                <Label htmlFor="new-sysmis" className="text-sm cursor-pointer">
                  System-missing
                </Label>
              </div>
            )}
          </RadioGroup>

          <div className="mt-4 space-y-2">
            <Button
              type="button"
              size="sm"
              onClick={() => handleRuleAction("add")}
              className="w-full"
            >
              Add
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleRuleAction("change")}
              disabled={!selectedRuleId}
              className="w-full"
              variant="outline"
            >
              Change
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleRemoveRule}
              disabled={!selectedRuleId}
              className="w-full"
              variant="outline"
            >
              Remove
            </Button>
          </div>
        </div>

        {/* Old -&gt; New Rules Display (Column 3) */}
        <div className="border rounded-md p-3 bg-[#FAFAFA]">
          <h3 className="font-semibold mb-2">Old -&gt; New</h3>
          <div className="h-[300px]">
            <ScrollArea className="h-full pr-2">
              {recodeRules.length === 0 ? (
                <div className="text-sm text-gray-500 italic">
                  No rules defined.
                </div>
              ) : (
                recodeRules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`mb-1 p-1.5 rounded-md text-sm cursor-pointer hover:bg-gray-100 ${
                      selectedRuleId === rule.id
                        ? "bg-blue-100 hover:bg-blue-100"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedRuleId(
                        rule.id === selectedRuleId ? null : rule.id
                      )
                    }
                  >
                    <div>
                      {rule.oldValueDisplay} to {rule.newValueDisplay}
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </div>
        </div>
      </div>
    </>
  );
};

export default OldNewValuesSetup;
