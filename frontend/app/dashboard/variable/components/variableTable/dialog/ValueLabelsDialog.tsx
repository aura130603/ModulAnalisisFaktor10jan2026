"use client"

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ValueLabel } from "@/types/Variable";
import { useMobile } from '@/hooks/useMobile';
import { cn } from '@/lib/utils';
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
// Help icon and tooltip imports removed

interface ValueLabelsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (values: ValueLabel[]) => void;
    initialValues: ValueLabel[];
    variableId?: number;
    variableType?: string;
}

export const ValueLabelsDialog = ({
    open,
    onOpenChange,
    onSave,
    initialValues,
    variableId,
    variableType = "NUMERIC" // Default to NUMERIC if not specified
}: ValueLabelsDialogProps) => {
    const { isMobile } = useMobile();
    const [values, setValues] = useState<ValueLabel[]>([]);
    const [currentValue, setCurrentValue] = useState("");
    const [currentLabel, setCurrentLabel] = useState("");
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [originalValue, setOriginalValue] = useState<string | null>(null);
    const [originalLabel, setOriginalLabel] = useState<string | null>(null);

    const isStringType = variableType === "STRING";

    useEffect(() => {
        setValues(initialValues ?? []);
    }, [initialValues]);

    const validateValue = (value: string): boolean => {
        // Empty string is not valid, but a single space is valid for string variables
        const isSpace = value === " ";
        const isEmpty = value === "" || value === undefined;

        if (isEmpty) {
            setError("Value cannot be empty");
            return false;
        }

        // For non-string types, ensure value is numeric (but allow space for string type)
        if (!isStringType && !isSpace && isNaN(Number(value))) {
            setError("Value must be numeric for this variable type");
            return false;
        }

        // Check for duplicates (if not in editing mode or if editing with a different value)
        const valueToCompare = isStringType ? value : Number(value); // Compare with correct type
        const isDuplicate = values.some((v, index) => {
            // Skip comparing with the value being edited
            if (selectedIndex !== null && index === selectedIndex) {
                return false;
            }
            // Handle comparison carefully for numbers and strings (including space)
            if (isStringType) {
                return v.value === valueToCompare;
            } else {
                // Ensure we compare numbers with numbers
                return typeof v.value === 'number' && v.value === valueToCompare;
            }
        });

        if (isDuplicate) {
            setError("This value already exists");
            return false;
        }

        setError(null);
        return true;
    };

    const processAndValidateLabel = (value: string, label: string): ValueLabel | null => {
        if (!validateValue(value)) return null;

        const processedValue = isStringType ? value : Number(value);
        let valueLabel = label;
        if (valueLabel === "") {
            valueLabel = value === " " ? "[Space]" : value;
        }

        const newValue: ValueLabel = {
            variableId: variableId ?? 0, // Use 0 as a placeholder if ID is not available yet
            value: processedValue,
            label: valueLabel
        };

        if (new TextEncoder().encode(newValue.label).length > 120) {
            setError("Label cannot exceed 120 bytes");
            return null;
        }

        return newValue;
    };

    const handleAdd = () => {
        const newValue = processAndValidateLabel(currentValue, currentLabel);
        if (!newValue) return;

        setValues([...values, newValue]);
        setCurrentValue("");
        setCurrentLabel("");
    };

    const handleChange = () => {
        if (selectedIndex === null) return;
        if (originalValue === currentValue && originalLabel === currentLabel) {
            setError("No changes were made");
            return;
        }
        
        const updatedValue = processAndValidateLabel(currentValue, currentLabel);
        if (!updatedValue) return;

        const updatedValues = [...values];
        updatedValues[selectedIndex] = updatedValue;

        setValues(updatedValues);
        setCurrentValue("");
        setCurrentLabel("");
        setSelectedIndex(null);
        setOriginalValue(null);
        setOriginalLabel(null);
    };

    const handleRemove = () => {
        if (selectedIndex === null) return;

        const updatedValues = [...values];
        updatedValues.splice(selectedIndex, 1);

        setValues(updatedValues);
        setCurrentValue("");
        setCurrentLabel("");
        setSelectedIndex(null);
    };

    const handleSelect = (index: number) => {
        const selected = values[index];
        setSelectedIndex(index);
        setCurrentValue(selected.value.toString());
        setCurrentLabel(selected.label);
        // Store original values to detect changes
        setOriginalValue(selected.value.toString());
        setOriginalLabel(selected.label);
        setError(null);
    };

    const handleSave = () => {
        onSave(values);
        onOpenChange(false);
    };

    const isValueChanged = () => {
        if (selectedIndex === null) return false;
        return isStringType ? (originalValue !== currentValue || originalLabel !== currentLabel) : (Number(originalValue ?? "") !== Number(currentValue ?? "") || originalLabel !== currentLabel);
    };

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setError(null); // Clear error on change

        // Allow space for string type always
        if (isStringType) {
             setCurrentValue(newValue);
             return;
        }

        // For numeric type: allow empty, minus, decimal point, and numbers
        if (newValue === '' || newValue === '-' || (!isNaN(Number(newValue)) || (newValue.endsWith('.') && !newValue.slice(0, -1).includes('.')))) {
            setCurrentValue(newValue);
        } else {
            // Optionally provide feedback or prevent invalid input more strictly here
            // For now, we just don't update the state for invalid numeric chars
             setError("Invalid numeric input."); // Set error for invalid chars
        }

    };

    const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newLabel = e.target.value;
        setError(null); // Clear error on change

        // Check byte length immediately
        if (new TextEncoder().encode(newLabel).length > 120) {
            setError("Label cannot exceed 120 bytes");
            // Optionally truncate or prevent further input
        } else {
            setCurrentLabel(newLabel);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="w-full p-0 border border-border rounded-md shadow-lg"
                style={{ 
                    maxWidth: isMobile ? "95vw" : "480px",
                    width: "100%",
                    maxHeight: isMobile ? "100vh" : "65vh",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                }}
            >
                <div className="px-4 py-2 flex-shrink-0 bg-muted/30">
                    <DialogHeader className="p-0">
                        <DialogTitle className="text/base font-semibold">
                            Value Labels
                        </DialogTitle>
                    </DialogHeader>
                </div>
                <Separator className="flex-shrink-0" />

                <div className="flex-grow overflow-y-auto p-3">
                    <div className="space-y-4">
                        <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2">
                            <Label htmlFor="value" className="text-sm text-right">
                                Value:
                            </Label>
                            <div className="flex-1 relative">
                                <Input
                                    id="value"
                                    value={currentValue}
                                    onChange={handleValueChange}
                                    className="h-7 text-sm w-full"
                                    placeholder={isStringType ? "Any text or space" : "Numeric value"}
                                />
                                {currentValue === " " && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-primary/20 px-1.5 py-0.5 rounded text-primary">
                                        Space
                                    </div>
                                )}
                            </div>

                            <Label htmlFor="label" className="text-sm text-right">
                                Label:
                            </Label>
                            <Input
                                id="label"
                                value={currentLabel}
                                onChange={handleLabelChange}
                                className="h-7 text-sm w-full"
                                placeholder="Enter label (max 120 bytes)"
                            />
                        </div>

                        <div className="flex justify-end items-center gap-2">
                            <Button
                                size="sm"
                                variant="default"
                                onClick={selectedIndex === null ? handleAdd : handleChange}
                                disabled={!currentValue.trim() && currentValue !== " "}
                                className="h-7 text-sm bg-primary hover:bg-primary/90"
                            >
                                {selectedIndex === null ? "Add" : (isValueChanged() ? "Change" : "Change")}
                            </Button>
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={handleRemove}
                                disabled={selectedIndex === null}
                                className="h-7 text-sm"
                            >
                                Remove
                            </Button>
                        </div>

                        {error && (
                            <Alert variant="destructive" className="mt-2 py-2">
                                <AlertDescription className="text-xs">{error}</AlertDescription>
                            </Alert>
                        )}

                        <Label className="block pt-1 pb-1 text-sm font-medium">Defined Labels:</Label>
                        <div className={cn(
                            "border rounded-md overflow-y-auto bg-card/50",
                            isMobile ? "h-36" : "h-44"
                        )}>
                            {values.length === 0 && (
                                <div className="p-3 text-center text-muted-foreground text-sm">
                                    No value labels defined.
                                </div>
                            )}
                            {values.map((item, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "py-1.5 px-2 cursor-pointer border-b last:border-b-0 text-sm",
                                        selectedIndex === index
                                            ? 'bg-primary/10 text-primary-foreground'
                                            : 'hover:bg-muted/50',
                                        "flex justify-between items-center"
                                    )}
                                    onClick={() => handleSelect(index)}
                                >
                                    <span className="font-mono break-all pr-2">
                                        {item.value === " " ? "[Space]" : item.value.toString()}
                                    </span>
                                    <span className="text-muted-foreground break-all text-right">
                                        = &quot;{item.label}&quot;
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <Separator className="flex-shrink-0" />
                <DialogFooter className="px-4 py-2 flex-shrink-0 bg-muted/30">
                    <div className="flex gap-2 ml-auto">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-sm" 
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            size="sm" 
                            className="h-7 text-sm" 
                            onClick={handleSave}
                        >
                            OK
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};