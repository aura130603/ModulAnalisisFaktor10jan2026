"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { FactorScoresType } from "@/components/Modals/Analyze/dimension-reduction/factor/types/factor";
import { CheckedState } from "@radix-ui/react-checkbox";

interface ScoresTabProps {
    data: FactorScoresType;
    onChange: (field: keyof FactorScoresType, value: CheckedState | null) => void;
}

export const ScoresTab: React.FC<ScoresTabProps> = ({
    data,
    onChange,
}) => {
    const handleMethodGrp = (value: string) => {
        onChange("Regression", value === "Regression");
        onChange("Bartlett", value === "Bartlett");
        onChange("Anderson", value === "Anderson");
    };

    const getCurrentMethod = () => {
        if (data.Regression) return "Regression";
        if (data.Bartlett) return "Bartlett";
        if (data.Anderson) return "Anderson";
        return "Regression";
    };

    return (
        <div className="py-4">
            <div className="flex flex-col gap-4">
                {/* Checkbox: Save as variables */}
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="SaveVar"
                        checked={data.SaveVar}
                        onCheckedChange={(checked) => onChange("SaveVar", checked)}
                    />
                    <Label
                        htmlFor="SaveVar"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Save as variables
                    </Label>
                </div>

                {/* Method Box */}
                <div className="pl-6">
                    <ResizablePanelGroup
                        direction="vertical"
                        className="min-h-[160px] w-full rounded-lg border"
                    >
                        <ResizablePanel defaultSize={100}>
                            <div className="flex flex-col gap-3 p-4">
                                <Label className="font-bold">Method</Label>

                                <RadioGroup
                                    value={getCurrentMethod()}
                                    disabled={!data.SaveVar}
                                    onValueChange={handleMethodGrp}
                                    className="flex flex-col gap-2"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Regression" id="Regression" />
                                        <Label htmlFor="Regression" className="font-normal">
                                            Regression
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Bartlett" id="Bartlett" />
                                        <Label htmlFor="Bartlett" className="font-normal">
                                            Bartlett
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Anderson" id="Anderson" />
                                        <Label htmlFor="Anderson" className="font-normal">
                                            Anderson
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </div>

                {/* Checkbox: Display factor score */}
                <div className="flex items-center space-x-2 mt-2">
                    <Checkbox
                        id="DisplayFactor"
                        checked={data.DisplayFactor}
                        onCheckedChange={(checked) => onChange("DisplayFactor", checked)}
                    />
                    <Label
                        htmlFor="DisplayFactor"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Display factor score coefficient matrix
                    </Label>
                </div>
            </div>
        </div>
    );
};
