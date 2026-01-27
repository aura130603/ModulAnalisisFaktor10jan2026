"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    FactorValueProps,
    FactorValueType,
} from "@/components/Modals/Analyze/dimension-reduction/factor/types/factor";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { HelpCircle } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export const FactorValue = ({
    isValueOpen,
    setIsValueOpen,
    updateFormData,
    data,
}: FactorValueProps) => {
    const [valueState, setValueState] = useState<FactorValueType>({ ...data });

    useEffect(() => {
        if (isValueOpen) {
            setValueState({ ...data });
        }
    }, [isValueOpen, data]);

    const handleChange = (
        field: keyof FactorValueType,
        value: string | null
    ) => {
        setValueState((prevState) => ({
            ...prevState,
            [field]: value,
        }));
    };

    const handleContinue = () => {
        Object.entries(valueState).forEach(([key, value]) => {
            updateFormData(key as keyof FactorValueType, value);
        });
        setIsValueOpen(false);
    };

    // Don't render if not open
    if (!isValueOpen) return null;

    return (
        <div className="h-full flex flex-col bg-popover text-popover-foreground">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex-shrink-0">
                <h2 className="text-lg font-semibold">Factor Analysis: Value</h2>
            </div>

            <Separator />

            {/* Content */}
            <div className="flex-grow overflow-auto px-6 py-4">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <Label className="font-bold">Value:</Label>
                        <Input
                            id="Selection"
                            className="w-full"
                            type="text"
                            placeholder="Enter selection value"
                            value={valueState.Selection ?? ""}
                            onChange={(e) =>
                                handleChange("Selection", e.target.value)
                            }
                        />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Specify a value for the selection variable. Only cases with this value will be included in the analysis.
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                {/* Left: Help button */}
                <div className="flex items-center text-muted-foreground">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    data-testid="factor-value-help-button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Help"
                                    className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                                >
                                    <HelpCircle className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                <p className="text-xs">Help</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                {/* Right: Action buttons */}
                <div className="flex items-center space-x-4">
                    <Button onClick={handleContinue}>
                        Continue
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setIsValueOpen(false)}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
};
