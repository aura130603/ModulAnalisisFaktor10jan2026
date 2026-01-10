"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    FactorOptionsProps,
    FactorOptionsType,
} from "@/components/Modals/Analyze/dimension-reduction/factor/types/factor";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CheckedState } from "@radix-ui/react-checkbox";

export const FactorOptions = ({
    isOptionsOpen,
    setIsOptionsOpen,
    updateFormData,
    data,
}: FactorOptionsProps) => {
    const [optionsState, setOptionsState] = useState<FactorOptionsType>({
        ...data,
    });
    const [isContinueDisabled] = useState(false);

    useEffect(() => {
        if (isOptionsOpen) {
            setOptionsState({ ...data });
        }
    }, [isOptionsOpen, data]);

    const handleChange = (
        field: keyof FactorOptionsType,
        value: CheckedState | number | string | null
    ) => {
        setOptionsState((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleMissGrp = (value: string) => {
        setOptionsState((prev) => ({
            ...prev,
            ExcludeListWise: value === "ExcludeListWise",
            ExcludePairWise: value === "ExcludePairWise",
            ReplaceMean: value === "ReplaceMean",
        }));
    };

    const handleContinue = () => {
        Object.entries(optionsState).forEach(([key, value]) => {
            updateFormData(key as keyof FactorOptionsType, value);
        });
        setIsOptionsOpen(false);
    };

    /* =========================
       SIDEBAR GUARD
    ========================== */
    if (!isOptionsOpen) return null;

    return (
        <div className="h-full flex flex-col bg-popover text-popover-foreground">

            {/* CONTENT – tanpa header */}
            <div className="flex-grow overflow-auto px-6 py-4">
                <ResizablePanelGroup
                    direction="vertical"
                    className="min-h-[240px] rounded-lg border"
                >
                    <ResizablePanel defaultSize={45}>
                        <div className="flex flex-col gap-2 p-2">
                            <Label className="font-bold">Missing Values</Label>

                            <RadioGroup
                                value={
                                    optionsState.ExcludeListWise
                                        ? "ExcludeListWise"
                                        : optionsState.ExcludePairWise
                                        ? "ExcludePairWise"
                                        : "ReplaceMean"
                                }
                                onValueChange={handleMissGrp}
                            >
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                            value="ExcludeListWise"
                                            id="ExcludeListWise"
                                        />
                                        <Label htmlFor="ExcludeListWise">
                                            Exclude Cases List-wise
                                        </Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                            value="ExcludePairWise"
                                            id="ExcludePairWise"
                                        />
                                        <Label htmlFor="ExcludePairWise">
                                            Exclude Cases Pair-wise
                                        </Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                            value="ReplaceMean"
                                            id="ReplaceMean"
                                        />
                                        <Label htmlFor="ReplaceMean">
                                            Replace with Mean
                                        </Label>
                                    </div>
                                </div>
                            </RadioGroup>
                        </div>
                    </ResizablePanel>

                    <ResizableHandle />

                    <ResizablePanel defaultSize={55}>
                        <div className="flex flex-col gap-2 p-2">
                            <Label className="font-bold">
                                Coefficient Display Format
                            </Label>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="SortSize"
                                    checked={optionsState.SortSize}
                                    onCheckedChange={(checked) =>
                                        handleChange("SortSize", checked)
                                    }
                                />
                                <label htmlFor="SortSize" className="text-sm">
                                    Sorted by Size
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="SuppressValues"
                                    checked={optionsState.SuppressValues}
                                    onCheckedChange={(checked) =>
                                        handleChange(
                                            "SuppressValues",
                                            checked
                                        )
                                    }
                                />
                                <label
                                    htmlFor="SuppressValues"
                                    className="text-sm"
                                >
                                    Suppress Small Coefficients
                                </label>
                            </div>

                            <div className="flex items-center space-x-2 pl-6">
                                <Label className="w-[150px]">
                                    Absolute Value below:
                                </Label>
                                <Input
                                    id="SuppressValuesNum"
                                    type="number"
                                    className="w-[75px]"
                                    value={
                                        optionsState.SuppressValuesNum ?? ""
                                    }
                                    disabled={!optionsState.SuppressValues}
                                    onChange={(e) =>
                                        handleChange(
                                            "SuppressValuesNum",
                                            Number(e.target.value)
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>

            {/* FOOTER */}
            <div className="border-t border-border px-6 py-4 flex gap-2">
                <Button
                    disabled={isContinueDisabled}
                    onClick={handleContinue}
                >
                    Continue
                </Button>
                <Button
                    variant="secondary"
                    onClick={() => setIsOptionsOpen(false)}
                >
                    Cancel
                </Button>
                <Button variant="secondary">Help</Button>
            </div>
        </div>
    );
};
