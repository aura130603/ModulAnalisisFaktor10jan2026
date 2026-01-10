"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    FactorRotationProps,
    FactorRotationType,
} from "@/components/Modals/Analyze/dimension-reduction/factor/types/factor";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckedState } from "@radix-ui/react-checkbox";

export const FactorRotation = ({
    isRotationOpen,
    setIsRotationOpen,
    updateFormData,
    data,
}: FactorRotationProps) => {
    const [rotationState, setRotationState] = useState<FactorRotationType>({
        ...data,
    });
    const [isContinueDisabled] = useState(false);

    useEffect(() => {
        if (isRotationOpen) {
            setRotationState({ ...data });
        }
    }, [isRotationOpen, data]);

    const handleChange = (
        field: keyof FactorRotationType,
        value: CheckedState | number | string | null
    ) => {
        setRotationState((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleMethodGrp = (value: string) => {
        setRotationState((prev) => ({
            ...prev,
            None: value === "None",
            Quartimax: value === "Quartimax",
            Varimax: value === "Varimax",
            Equimax: value === "Equimax",
            Oblimin: value === "Oblimin",
            Promax: value === "Promax",
        }));
    };

    const handleContinue = () => {
        Object.entries(rotationState).forEach(([key, value]) => {
            updateFormData(key as keyof FactorRotationType, value);
        });
        setIsRotationOpen(false);
    };

    if (!isRotationOpen) return null;

    return (
        <div className="h-full flex flex-col bg-popover text-popover-foreground">

            {/* CONTENT – langsung tanpa header */}
            <div className="flex-grow overflow-auto px-6 py-4 flex flex-col gap-4">
                <Separator />

                <ResizablePanelGroup
                    direction="vertical"
                    className="min-h-[260px] rounded-lg border"
                >
                    <ResizablePanel defaultSize={75}>
                        <div className="flex flex-col gap-2 p-2">
                            <Label className="font-bold">Method</Label>

                            <RadioGroup
                                value={
                                    rotationState.None
                                        ? "None"
                                        : rotationState.Quartimax
                                        ? "Quartimax"
                                        : rotationState.Varimax
                                        ? "Varimax"
                                        : rotationState.Equimax
                                        ? "Equimax"
                                        : rotationState.Oblimin
                                        ? "Oblimin"
                                        : rotationState.Promax
                                        ? "Promax"
                                        : "None"
                                }
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
                                            <Label htmlFor="Oblimin">
                                                Direct Oblimin
                                            </Label>
                                        </div>

                                        <div className="flex items-center space-x-2 pl-6">
                                            <Label className="w-[80px]">Delta:</Label>
                                            <Input
                                                type="number"
                                                className="w-[80px]"
                                                value={rotationState.Delta ?? ""}
                                                disabled={!rotationState.Oblimin}
                                                onChange={(e) =>
                                                    handleChange(
                                                        "Delta",
                                                        Number(e.target.value)
                                                    )
                                                }
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
                                                value={rotationState.Kappa ?? ""}
                                                disabled={!rotationState.Promax}
                                                onChange={(e) =>
                                                    handleChange(
                                                        "Kappa",
                                                        Number(e.target.value)
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            </RadioGroup>
                        </div>
                    </ResizablePanel>

                    <ResizableHandle />

                    <ResizablePanel defaultSize={25}>
                        <div className="flex flex-col gap-2 p-2">
                            <Label className="font-bold">Display</Label>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="RotatedSol"
                                        checked={rotationState.RotatedSol}
                                        disabled={rotationState.None}
                                        onCheckedChange={(checked) =>
                                            handleChange("RotatedSol", checked)
                                        }
                                    />
                                    <Label htmlFor="RotatedSol">
                                        Rotated Solution
                                    </Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="LoadingPlot"
                                        checked={rotationState.LoadingPlot}
                                        onCheckedChange={(checked) =>
                                            handleChange("LoadingPlot", checked)
                                        }
                                    />
                                    <Label htmlFor="LoadingPlot">
                                        Loading Plot(s)
                                    </Label>
                                </div>
                            </div>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>

                <div className="flex items-center gap-4">
                    <Label className="w-[260px]">
                        Maximum Iterations for Convergence:
                    </Label>
                    <Input
                        type="number"
                        className="w-[80px]"
                        value={rotationState.MaxIter ?? ""}
                        onChange={(e) =>
                            handleChange("MaxIter", Number(e.target.value))
                        }
                    />
                </div>
            </div>

            {/* FOOTER tetap */}
            <div className="border-t border-border px-6 py-4 flex gap-2">
                <Button disabled={isContinueDisabled} onClick={handleContinue}>
                    Continue
                </Button>
                <Button
                    variant="secondary"
                    onClick={() => setIsRotationOpen(false)}
                >
                    Cancel
                </Button>
                <Button variant="secondary">Help</Button>
            </div>
        </div>
    );
};
