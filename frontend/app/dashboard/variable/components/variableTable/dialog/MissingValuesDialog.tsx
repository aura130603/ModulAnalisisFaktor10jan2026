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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { MissingValuesSpec, VariableType } from '@/types/Variable';
import { useMobile } from '@/hooks/useMobile';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
// Help icon and tooltip imports removed

interface MissingValuesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (missingValues: MissingValuesSpec | null) => void;
    initialMissingValues: MissingValuesSpec | null;
    variableType?: VariableType;
}

export const MissingValuesDialog: React.FC<MissingValuesDialogProps> = ({
    open,
    onOpenChange,
    onSave,
    initialMissingValues,
    variableType = "NUMERIC"
}) => {
    const { isMobile } = useMobile();
    const [option, setOption] = useState<"none" | "discrete" | "range">("none");
    const [discreteValues, setDiscreteValues] = useState<string[]>(["", "", ""]);
    const [rangeMin, setRangeMin] = useState<string>("");
    const [rangeMax, setRangeMax] = useState<string>("");
    const [rangeDiscreteValue, setRangeDiscreteValue] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);

    const isStringType = variableType === "STRING";

    useEffect(() => {
        setError(null);
        setValidationError(null);

        if (!initialMissingValues) {
            setOption("none");
            setDiscreteValues(["", "", ""]);
            setRangeMin("");
            setRangeMax("");
            setRangeDiscreteValue("");
            return;
        }

        if (initialMissingValues.discrete && initialMissingValues.discrete.length > 0) {
            setOption("discrete");
            const initialDiscrete = initialMissingValues.discrete.map(String);
            while (initialDiscrete.length < 3) {
                initialDiscrete.push("");
            }
            setDiscreteValues(initialDiscrete.slice(0, 3));
            setRangeMin("");
            setRangeMax("");
            setRangeDiscreteValue("");
        } else if (initialMissingValues.range) {
            setOption("range");
            setRangeMin(initialMissingValues.range.min !== undefined ? String(initialMissingValues.range.min) : "");
            setRangeMax(initialMissingValues.range.max !== undefined ? String(initialMissingValues.range.max) : "");
            setDiscreteValues(["", "", ""]);
            setRangeDiscreteValue("");
        } else {
            setOption("none");
            setDiscreteValues(["", "", ""]);
            setRangeMin("");
            setRangeMax("");
            setRangeDiscreteValue("");
        }

    }, [initialMissingValues, open]);

    const handleDiscreteValueChange = (index: number, value: string) => {
        const rawValue = value;
        setValidationError(null);

        if (isStringType && new TextEncoder().encode(rawValue).length > 8) {
            setValidationError("String missing values cannot exceed 8 bytes");
            return;
        }

        if (!isStringType && rawValue.trim() !== "" && isNaN(Number(rawValue))) {
            setValidationError(`Value "${rawValue}" is not a valid number.`);
            return;
        }

        const newValues = [...discreteValues];
        newValues[index] = rawValue;
        setDiscreteValues(newValues);
    };

    const validateRangeOption = (): { valid: boolean; range?: { min?: number; max?: number }; discrete?: (number | string)[] } => {
        const rangeSpec: { min?: number; max?: number } = {};
        const discreteSpec: (number | string)[] = [];
        let isValid = true;
        let errorMsg: string | null = null;

        const hasMin = rangeMin.trim() !== "";
        const hasMax = rangeMax.trim() !== "";
        const hasDiscrete = rangeDiscreteValue.trim() !== "";

        let numMin: number | undefined = undefined;
        let numMax: number | undefined = undefined;
        let numDiscrete: number | undefined = undefined;

        if (!hasMin && !hasMax) {
            errorMsg = "At least one range value (Low or High) must be provided for the range option.";
            isValid = false;
        }

        if (isValid && hasMin) {
            numMin = Number(rangeMin);
            if (isNaN(numMin)) {
                errorMsg = `Low range value "${rangeMin}" is not a valid number.`;
                isValid = false;
            } else {
                rangeSpec.min = numMin;
            }
        }

        if (isValid && hasMax) {
            numMax = Number(rangeMax);
            if (isNaN(numMax)) {
                errorMsg = `High range value "${rangeMax}" is not a valid number.`;
                isValid = false;
            } else {
                rangeSpec.max = numMax;
            }
        }

        if (isValid && numMin !== undefined && numMax !== undefined && numMin > numMax) {
            errorMsg = "Low range value must be less than or equal to High range value.";
            isValid = false;
        }

        if (isValid && hasDiscrete) {
            numDiscrete = Number(rangeDiscreteValue);
            if (isNaN(numDiscrete)) {
                errorMsg = `Discrete value "${rangeDiscreteValue}" is not a valid number.`;
                isValid = false;
            } else {
                const isWithinRange = (numMin !== undefined && numDiscrete >= numMin) && (numMax !== undefined && numDiscrete <= numMax);
                if (isWithinRange) {
                }
                discreteSpec.push(numDiscrete);
            }
        }

        setValidationError(errorMsg);
        return { valid: isValid, range: Object.keys(rangeSpec).length > 0 ? rangeSpec : undefined, discrete: discreteSpec.length > 0 ? discreteSpec : undefined };
    };

    const validateDiscreteOption = (): { valid: boolean; discrete?: (number | string)[] } => {
        const finalDiscreteValues: (number | string)[] = [];
        let isValid = true;
        let errorMsg: string | null = null;

        const processedValues = discreteValues
            .map(v => v)
            .filter(v => v !== "");

        if (processedValues.length === 0) {
        } else if (processedValues.length > 3) {
            errorMsg = "A maximum of 3 discrete missing values are allowed.";
            isValid = false;
        } else {
            for (const val of processedValues) {
                if (isStringType) {
                    if (new TextEncoder().encode(val).length > 8) {
                        errorMsg = `String value "${val}" exceeds 8 bytes.`;
                        isValid = false;
                        break;
                    }
                    finalDiscreteValues.push(val);
                } else {
                    const numVal = Number(val);
                    if (isNaN(numVal)) {
                        if (val.trim() === '') {
                           finalDiscreteValues.push(val);
                        } else {
                            errorMsg = `Value "${val}" is not a valid number.`;
                            isValid = false;
                            break;
                        }
                    } else {
                        finalDiscreteValues.push(numVal);
                    }
                }
            }
        }

        if (isValid && finalDiscreteValues.length > 0) {
            const uniqueValues = new Set(finalDiscreteValues.map(v => typeof v === 'number' ? v : v.toLowerCase()));
             if (uniqueValues.size !== finalDiscreteValues.length) {
                errorMsg = "Duplicate discrete missing values are not allowed.";
                isValid = false;
            }
        }

        setValidationError(errorMsg);
        return { valid: isValid, discrete: finalDiscreteValues.length > 0 ? finalDiscreteValues : undefined };
    };

    const handleSave = () => {
        setError(null);
        setValidationError(null);
        let finalMissingSpec: MissingValuesSpec | null = null;

        if (option === "none") {
            finalMissingSpec = null;
        } else if (option === "discrete") {
            const validationResult = validateDiscreteOption();
            if (validationResult.valid) {
                if (validationResult.discrete && validationResult.discrete.length > 0) {
                    finalMissingSpec = { discrete: validationResult.discrete };
                } else {
                    finalMissingSpec = null;
                }
            } else {
                return;
            }
        } else if (option === "range") {
            if (isStringType) {
                setError("Range missing values are only applicable for numeric variables.");
                return;
            }
            const validationResult = validateRangeOption();
            if (!validationResult.valid) {
                return;
            }

            const hasRange = validationResult.range && Object.keys(validationResult.range).length > 0;
            const hasDiscrete = validationResult.discrete && validationResult.discrete.length > 0;

            if (hasRange || hasDiscrete) {
                finalMissingSpec = {
                    ...(hasRange && { range: validationResult.range }),
                    ...(hasDiscrete && { discrete: validationResult.discrete }),
                };
            } else {
                finalMissingSpec = null;
            }
        }

        onSave(finalMissingSpec);
        onOpenChange(false);
    };

    // Input handlers for range/discrete values (prevent non-numeric if applicable)
    const handleNumericInputChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setValidationError(null);
        // Allow empty string, minus sign, decimal point, and numbers
        if (value === '' || value === '-' || (!isNaN(Number(value)) || (value.endsWith('.') && !value.slice(0, -1).includes('.')))) {
            setter(value);
        } else {
            setValidationError("Only numeric input allowed for this field.");
        }
    };

    const handleStringInputChange = (setter: (value: string) => void, index?: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setValidationError(null);
        if (new TextEncoder().encode(value).length <= 8) {
            if (index !== undefined) {
                handleDiscreteValueChange(index, value);
            } else {
                setter(value);
            }
        } else {
            setValidationError("String missing values cannot exceed 8 bytes.");
        }
    };

    const handleRangeMinChange = isStringType ? handleStringInputChange(setRangeMin) : handleNumericInputChange(setRangeMin);
    const handleRangeMaxChange = isStringType ? handleStringInputChange(setRangeMax) : handleNumericInputChange(setRangeMax);
    const handleRangeDiscreteChange = isStringType ? handleStringInputChange(setRangeDiscreteValue) : handleNumericInputChange(setRangeDiscreteValue);

    // Create a specific handler for the discrete input array
    const getDiscreteInputHandler = (index: number) => {
        return isStringType
            ? handleStringInputChange((val) => handleDiscreteValueChange(index, val), index)
            : (e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value;
                setValidationError(null);
                // Allow empty string, minus sign, decimal point, and numbers for discrete numeric
                if (value === '' || value === '-' || (!isNaN(Number(value)) || (value.endsWith('.') && !value.slice(0, -1).includes('.')))) {
                    handleDiscreteValueChange(index, value);
                } else {
                    setValidationError("Only numeric input allowed for this field.");
                }
              };
    };

    // Handler for RadioGroup to ensure type safety
    const handleOptionChange = (value: string) => {
        if (value === "none" || value === "discrete" || value === "range") {
            setOption(value);
            setError(null);
            setValidationError(null);
        } else {
            // Handle unexpected value if necessary, though UI should prevent this
            setError("An unexpected error occurred selecting an option.");
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
                        <DialogTitle className="text-base font-semibold">
                            Missing Values
                        </DialogTitle>
                    </DialogHeader>
                </div>
                <Separator className="flex-shrink-0" />

                <div className="flex-grow overflow-y-auto p-3">
                    <RadioGroup value={option} onValueChange={handleOptionChange} className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="none" id="none" />
                            <Label htmlFor="none" className="text-sm">No missing values</Label>
                        </div>

                        <div className="flex items-start space-x-3">
                            <RadioGroupItem value="discrete" id="discrete" className="mt-1 flex-shrink-0"/>
                            <Label htmlFor="discrete" className="flex-1 space-y-1.5 text-sm">
                                Discrete missing values
                                <div className={cn(
                                    "gap-2 mt-1.5",
                                    isMobile ? "grid grid-cols-1" : "flex space-x-2",
                                    option !== 'discrete' ? 'opacity-50' : ''
                                )}>
                                    {discreteValues.map((value, index) => (
                                        <Input
                                            key={index}
                                            type={"text"}
                                            value={value}
                                            onChange={getDiscreteInputHandler(index)}
                                            placeholder={`Value ${index + 1}`}
                                            disabled={option !== 'discrete'}
                                            className="h-7 text-sm flex-1"
                                            maxLength={isStringType ? 8 : undefined}
                                        />
                                    ))}
                                </div>
                                {isStringType && option === 'discrete' && (
                                    <p className="text-xs text-muted-foreground pt-0.5">Maximum 8 bytes per value.</p>
                                )}
                            </Label>
                        </div>

                        <div className="flex items-start space-x-3">
                            <RadioGroupItem value="range" id="range" disabled={isStringType} className="mt-1 flex-shrink-0" />
                            <Label
                                htmlFor="range"
                                className={cn(
                                    "flex-1 space-y-1.5 text-sm",
                                    isStringType && 'text-muted-foreground cursor-not-allowed'
                                )}
                            >
                                Range plus one optional discrete missing value
                                {isStringType && <span className="text-xs text-muted-foreground ml-1">(Numeric only)</span>}
                                <div className={cn(
                                    "gap-2 mt-1.5",
                                    isMobile ? "grid grid-cols-1" : "flex space-x-2",
                                    option !== 'range' || isStringType ? 'opacity-50' : ''
                                )}>
                                    <Input
                                        type="text"
                                        value={rangeMin}
                                        onChange={handleRangeMinChange}
                                        placeholder="Low"
                                        disabled={option !== 'range' || isStringType}
                                        className="h-7 text-sm flex-1"
                                    />
                                    <Input
                                        type="text"
                                        value={rangeMax}
                                        onChange={handleRangeMaxChange}
                                        placeholder="High"
                                        disabled={option !== 'range' || isStringType}
                                        className="h-7 text-sm flex-1"
                                    />
                                    <Input
                                        type="text"
                                        value={rangeDiscreteValue}
                                        onChange={handleRangeDiscreteChange}
                                        placeholder="Discrete value"
                                        disabled={option !== 'range' || isStringType}
                                        className="h-7 text-sm flex-1"
                                    />
                                </div>
                            </Label>
                        </div>
                    </RadioGroup>
                    {(error ?? validationError) && (
                        <Alert variant="destructive" className="mt-3 py-2 border-l-2 border-destructive">
                            <AlertDescription className="text-sm">
                                {error ?? validationError}
                            </AlertDescription>
                        </Alert>
                    )}
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
                            className="h-7 text-sm bg-primary hover:bg-primary/90" 
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