"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { FactorOptionsType } from "@/components/Modals/Analyze/dimension-reduction/factor/types/factor";
import { CheckedState } from "@radix-ui/react-checkbox";

interface OptionsTabProps {
    data: FactorOptionsType;
    onChange: (field: keyof FactorOptionsType, value: CheckedState | number | null) => void;
}

export const OptionsTab: React.FC<OptionsTabProps> = ({
    data,
    onChange,
}) => {
    const handleMissGrp = (value: string) => {
        onChange("ExcludeListWise", value === "ExcludeListWise");
        onChange("ExcludePairWise", value === "ExcludePairWise");
        onChange("ReplaceMean", value === "ReplaceMean");
    };

    const getCurrentMissingMethod = () => {
        if (data.ExcludeListWise) return "ExcludeListWise";
        if (data.ExcludePairWise) return "ExcludePairWise";
        if (data.ReplaceMean) return "ReplaceMean";
        return "ExcludeListWise";
    };

    return (
        <div className="py-4">
            <ResizablePanelGroup
                direction="vertical"
                className="min-h-[260px] rounded-lg border"
            >
                <ResizablePanel defaultSize={45}>
                    <div className="flex flex-col gap-2 p-3">
                        <Label className="font-bold">Missing Values</Label>

                        <RadioGroup
                            value={getCurrentMissingMethod()}
                            onValueChange={handleMissGrp}
                        >
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="ExcludeListWise" id="ExcludeListWise" />
                                    <Label htmlFor="ExcludeListWise">Exclude Cases List-wise</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="ExcludePairWise" id="ExcludePairWise" />
                                    <Label htmlFor="ExcludePairWise">Exclude Cases Pair-wise</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="ReplaceMean" id="ReplaceMean" />
                                    <Label htmlFor="ReplaceMean">Replace with Mean</Label>
                                </div>
                            </div>
                        </RadioGroup>
                    </div>
                </ResizablePanel>

                <ResizableHandle />

                <ResizablePanel defaultSize={55}>
                    <div className="flex flex-col gap-2 p-3">
                        <Label className="font-bold">Coefficient Display Format</Label>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="SortSize"
                                checked={data.SortSize}
                                onCheckedChange={(checked) => onChange("SortSize", checked)}
                            />
                            <label htmlFor="SortSize" className="text-sm">
                                Sorted by Size
                            </label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="SuppressValues"
                                checked={data.SuppressValues}
                                onCheckedChange={(checked) => onChange("SuppressValues", checked)}
                            />
                            <label htmlFor="SuppressValues" className="text-sm">
                                Suppress Small Coefficients
                            </label>
                        </div>

                        <div className="flex items-center space-x-2 pl-6">
                            <Label className="w-[150px]">Absolute Value below:</Label>
                            <Input
                                id="SuppressValuesNum"
                                type="number"
                                className="w-[75px]"
                                value={data.SuppressValuesNum ?? ""}
                                disabled={!data.SuppressValues}
                                onChange={(e) => onChange("SuppressValuesNum", Number(e.target.value))}
                            />
                        </div>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
};
