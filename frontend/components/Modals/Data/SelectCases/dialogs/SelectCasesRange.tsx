"use client";

import type { FC} from "react";
import React, { useState } from "react";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
// Help icon removed

interface RangeResult {
    firstCase?: string;
    lastCase?: string;
}

interface SelectCasesRangeProps {
    onClose: () => void;
    onContinue: (result: RangeResult) => void;
    initialConfig?: RangeResult | null;
}

const SelectCasesRange: FC<SelectCasesRangeProps> = ({
    onClose,
    onContinue,
    initialConfig
}) => {
    const [firstCase, setFirstCase] = useState<string>(initialConfig?.firstCase || "");
    const [lastCase, setLastCase] = useState<string>(initialConfig?.lastCase || "");
    const [validationError, setValidationError] = useState<string | null>(null);

    const handleContinue = () => {
        // Validate range if both values are provided
        if (firstCase && lastCase) {
            const first = parseInt(firstCase);
            const last = parseInt(lastCase);
            
            if (first <= 0 || last <= 0) {
                setValidationError("Case numbers must be positive");
                return;
            }
            
            if (first > last) {
                setValidationError("First case must be less than or equal to last case");
                return;
            }
        }
        
        const result: RangeResult = {};

        if (firstCase) {
            result.firstCase = firstCase;
        }

        if (lastCase) {
            result.lastCase = lastCase;
        }

        setValidationError(null);
        onContinue(result);
    };

    return (
        <DialogContent
            className="w-full p-0 border border-border rounded-md"
            style={{ 
                maxWidth: "450px",
                width: "100%",
                maxHeight: "400px",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
            }}
        >
            <div className="px-3 py-2 flex-shrink-0">
                <DialogHeader className="p-0">
                    <DialogTitle className="text-base font-semibold flex items-center">
                        <span>Select Cases: Range</span>
                    </DialogTitle>
                </DialogHeader>
            </div>
            <Separator className="flex-shrink-0" />
            <div className="p-3 flex-grow overflow-y-auto">
                <div className="border rounded-md p-3 bg-card/50">
                    <Label className="text-sm font-medium mb-2 block">Case Range</Label>

                    <div className="space-y-3 pl-1">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="first-case" className="text-sm min-w-16">First Case:</Label>
                            <Input
                                id="first-case"
                                className="w-24 h-7 text-sm"
                                value={firstCase}
                                onChange={(e) => setFirstCase(e.target.value)}
                                placeholder="1"
                                type="number"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Label htmlFor="last-case" className="text-sm min-w-16">Last Case:</Label>
                            <Input
                                id="last-case"
                                className="w-24 h-7 text-sm"
                                value={lastCase}
                                onChange={(e) => setLastCase(e.target.value)}
                                placeholder="Last"
                                type="number"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <Separator className="flex-shrink-0" />
            <DialogFooter className="px-3 py-2 flex-shrink-0">
                {validationError && (
                    <div className="w-full mb-1">
                        <p className="text-sm text-destructive">{validationError}</p>
                    </div>
                )}
                <div className="flex gap-2 ml-auto">
                    <Button variant="outline" size="sm" className="h-7 text-sm" onClick={onClose}>Cancel</Button>
                    <Button size="sm" className="h-7 text-sm" onClick={handleContinue}>Continue</Button>
                </div>
            </DialogFooter>
        </DialogContent>
    );
};

export default SelectCasesRange; 