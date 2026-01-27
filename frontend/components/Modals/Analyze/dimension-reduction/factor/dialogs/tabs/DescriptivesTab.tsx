"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { FactorDescriptivesType } from "@/components/Modals/Analyze/dimension-reduction/factor/types/factor";
import { CheckedState } from "@radix-ui/react-checkbox";

interface DescriptivesTabProps {
    data: FactorDescriptivesType;
    onChange: (field: keyof FactorDescriptivesType, value: CheckedState) => void;
}

export const DescriptivesTab: React.FC<DescriptivesTabProps> = ({
    data,
    onChange,
}) => {
    return (
        <div className="py-4">
            <ResizablePanelGroup
                direction="vertical"
                className="min-h-[300px] rounded-lg border"
            >
                <ResizablePanel defaultSize={35}>
                    <div className="flex flex-col gap-2 p-3">
                        <Label className="font-bold">Statistics</Label>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="UnivarDesc"
                                checked={data.UnivarDesc}
                                onCheckedChange={(checked) => onChange("UnivarDesc", checked)}
                            />
                            <label htmlFor="UnivarDesc" className="text-sm">
                                Univariate Descriptives
                            </label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="InitialSol"
                                checked={data.InitialSol}
                                onCheckedChange={(checked) => onChange("InitialSol", checked)}
                            />
                            <label htmlFor="InitialSol" className="text-sm">
                                Initial Solution
                            </label>
                        </div>
                    </div>
                </ResizablePanel>

                <ResizableHandle />

                <ResizablePanel defaultSize={65}>
                    <div className="flex flex-col gap-3 p-3">
                        <Label className="font-bold">Correlation Matrix</Label>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-2">
                                {[
                                    ["Coefficient", "Coefficients"],
                                    ["SignificanceLvl", "Significance Levels"],
                                    ["Determinant", "Determinant"],
                                    ["KMO", "KMO and Bartlett's Test"],
                                ].map(([key, label]) => (
                                    <div key={key} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={key}
                                            checked={data[key as keyof FactorDescriptivesType]}
                                            onCheckedChange={(checked) =>
                                                onChange(key as keyof FactorDescriptivesType, checked)
                                            }
                                        />
                                        <label htmlFor={key} className="text-sm">
                                            {label}
                                        </label>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col gap-2">
                                {[
                                    ["Inverse", "Inverse"],
                                    ["Reproduced", "Reproduced"],
                                    ["AntiImage", "Anti-Image"],
                                ].map(([key, label]) => (
                                    <div key={key} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={key}
                                            checked={data[key as keyof FactorDescriptivesType]}
                                            onCheckedChange={(checked) =>
                                                onChange(key as keyof FactorDescriptivesType, checked)
                                            }
                                        />
                                        <label htmlFor={key} className="text-sm">
                                            {label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
};
