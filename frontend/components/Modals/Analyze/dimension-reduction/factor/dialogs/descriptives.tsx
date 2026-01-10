"use client";

import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    FactorDescriptivesProps,
    FactorDescriptivesType,
} from "@/components/Modals/Analyze/dimension-reduction/factor/types/factor";
import { CheckedState } from "@radix-ui/react-checkbox";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export const FactorDescriptives = ({
    isDescriptivesOpen,
    setIsDescriptivesOpen,
    updateFormData,
    data,
}: FactorDescriptivesProps) => {
    const [descriptivesState, setDescriptivesState] =
        useState<FactorDescriptivesType>({ ...data });
    const [isContinueDisabled] = useState(false);

    useEffect(() => {
        if (isDescriptivesOpen) {
            setDescriptivesState({ ...data });
        }
    }, [isDescriptivesOpen, data]);

    const handleChange = (
        field: keyof FactorDescriptivesType,
        value: CheckedState | number | string | null
    ) => {
        setDescriptivesState((prevState) => ({
            ...prevState,
            [field]: value,
        }));
    };

    const handleContinue = () => {
        Object.entries(descriptivesState).forEach(([key, value]) => {
            updateFormData(key as keyof FactorDescriptivesType, value);
        });
        setIsDescriptivesOpen(false);
    };

    /* =========================
       SHARED CONTENT
    ========================== */
    const Content = (
        <>
            <Separator />

            <div className="flex-grow overflow-auto px-6 py-4">
                <ResizablePanelGroup
                    direction="vertical"
                    className="min-h-[300px] rounded-lg border"
                >
                    <ResizablePanel defaultSize={35}>
                        <div className="flex flex-col gap-2 p-2">
                            <Label className="font-bold">Statistics</Label>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="UnivarDesc"
                                    checked={descriptivesState.UnivarDesc}
                                    onCheckedChange={(checked) =>
                                        handleChange("UnivarDesc", checked)
                                    }
                                />
                                <label htmlFor="UnivarDesc" className="text-sm">
                                    Univariate Descriptives
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="InitialSol"
                                    checked={descriptivesState.InitialSol}
                                    onCheckedChange={(checked) =>
                                        handleChange("InitialSol", checked)
                                    }
                                />
                                <label htmlFor="InitialSol" className="text-sm">
                                    Initial Solution
                                </label>
                            </div>
                        </div>
                    </ResizablePanel>

                    <ResizableHandle />

                    <ResizablePanel defaultSize={65}>
                        <div className="flex flex-col gap-3 p-2">
                            <Label className="font-bold">
                                Correlation Matrix
                            </Label>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-2">
                                    {[
                                        ["Coefficient", "Coefficients"],
                                        [
                                            "SignificanceLvl",
                                            "Significance Levels",
                                        ],
                                        ["Determinant", "Determinant"],
                                        [
                                            "KMO",
                                            "KMO and Bartlett’s Test",
                                        ],
                                    ].map(([key, label]) => (
                                        <div
                                            key={key}
                                            className="flex items-center space-x-2"
                                        >
                                            <Checkbox
                                                id={key}
                                                checked={
                                                    descriptivesState[
                                                        key as keyof FactorDescriptivesType
                                                    ]
                                                }
                                                onCheckedChange={(checked) =>
                                                    handleChange(
                                                        key as keyof FactorDescriptivesType,
                                                        checked
                                                    )
                                                }
                                            />
                                            <label
                                                htmlFor={key}
                                                className="text-sm"
                                            >
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
                                        <div
                                            key={key}
                                            className="flex items-center space-x-2"
                                        >
                                            <Checkbox
                                                id={key}
                                                checked={
                                                    descriptivesState[
                                                        key as keyof FactorDescriptivesType
                                                    ]
                                                }
                                                onCheckedChange={(checked) =>
                                                    handleChange(
                                                        key as keyof FactorDescriptivesType,
                                                        checked
                                                    )
                                                }
                                            />
                                            <label
                                                htmlFor={key}
                                                className="text-sm"
                                            >
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

            <div className="border-t border-border px-6 py-4 flex gap-2">
                <Button
                    disabled={isContinueDisabled}
                    onClick={handleContinue}
                >
                    Continue
                </Button>
                <Button
                    variant="secondary"
                    onClick={() => setIsDescriptivesOpen(false)}
                >
                    Cancel
                </Button>
                <Button variant="secondary">Help</Button>
            </div>
        </>
    );

    /* =========================
       SIDEBAR MODE
    ========================== */
    if (!isDescriptivesOpen) return null;

    return (
    <div className="h-full flex flex-col bg-popover text-popover-foreground">
        {Content}
    </div>
);
};

