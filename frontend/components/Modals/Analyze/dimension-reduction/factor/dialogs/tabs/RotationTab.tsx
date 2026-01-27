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
import { FactorRotationType } from "@/components/Modals/Analyze/dimension-reduction/factor/types/factor";
import { CheckedState } from "@radix-ui/react-checkbox";

interface RotationTabProps {
    data: FactorRotationType;
    onChange: (field: keyof FactorRotationType, value: CheckedState | number | null) => void;
}

export const RotationTab: React.FC<RotationTabProps> = ({
    data,
    onChange,
}) => {
    const handleMethodGrp = (value: string) => {
        onChange("None", value === "None");
        onChange("Quartimax", value === "Quartimax");
        onChange("Varimax", value === "Varimax");
        onChange("Equimax", value === "Equimax");
        onChange("Oblimin", value === "Oblimin");
        onChange("Promax", value === "Promax");
    };

    const getCurrentMethod = () => {
        if (data.None) return "None";
        if (data.Quartimax) return "Quartimax";
        if (data.Varimax) return "Varimax";
        if (data.Equimax) return "Equimax";
        if (data.Oblimin) return "Oblimin";
        if (data.Promax) return "Promax";
        return "None";
    };

    return (
        <div className="py-4">
            <ResizablePanelGroup
                direction="vertical"
                className="min-h-[300px] rounded-lg border"
            >
                <ResizablePanel defaultSize={75}>
                    <div className="flex flex-col gap-2 p-3">
                        <Label className="font-bold">Method</Label>

                        <RadioGroup
                            value={getCurrentMethod()}
                            onValueChange={handleMethodGrp}
                        >
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="None" id="None" />
                                        <Label htmlFor="None">None</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Varimax" id="Varimax" />
                                        <Label htmlFor="Varimax">Varimax</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Oblimin" id="Oblimin" />
                                        <Label htmlFor="Oblimin">Direct Oblimin</Label>
                                    </div>

                                    <div className="flex items-center space-x-2 pl-6">
                                        <Label className="w-[80px]">Delta:</Label>
                                        <Input
                                            type="number"
                                            className="w-[80px]"
                                            value={data.Delta ?? ""}
                                            disabled={!data.Oblimin}
                                            onChange={(e) => onChange("Delta", Number(e.target.value))}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Quartimax" id="Quartimax" />
                                        <Label htmlFor="Quartimax">Quartimax</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Equimax" id="Equimax" />
                                        <Label htmlFor="Equimax">Equimax</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Promax" id="Promax" />
                                        <Label htmlFor="Promax">Promax</Label>
                                    </div>

                                    <div className="flex items-center space-x-2 pl-6">
                                        <Label className="w-[80px]">Kappa:</Label>
                                        <Input
                                            type="number"
                                            className="w-[80px]"
                                            value={data.Kappa ?? ""}
                                            disabled={!data.Promax}
                                            onChange={(e) => onChange("Kappa", Number(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </RadioGroup>
                    </div>
                </ResizablePanel>

                <ResizableHandle />

                <ResizablePanel defaultSize={25}>
                    <div className="flex flex-col gap-2 p-3">
                        <Label className="font-bold">Display</Label>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="RotatedSol"
                                    checked={data.RotatedSol}
                                    disabled={data.None}
                                    onCheckedChange={(checked) => onChange("RotatedSol", checked)}
                                />
                                <Label htmlFor="RotatedSol">Rotated Solution</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="LoadingPlot"
                                    checked={data.LoadingPlot}
                                    onCheckedChange={(checked) => onChange("LoadingPlot", checked)}
                                />
                                <Label htmlFor="LoadingPlot">Loading Plots</Label>
                            </div>
                        </div>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>

            <div className="flex items-center gap-4 mt-4">
                <Label className="w-[260px]">Maximum Iterations for Convergence:</Label>
                <Input
                    type="number"
                    className="w-[80px]"
                    value={data.MaxIter ?? ""}
                    onChange={(e) => onChange("MaxIter", Number(e.target.value))}
                />
            </div>
        </div>
    );
};
