import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    UnivariateSaveProps,
    UnivariateSaveType,
} from "@/components/Modals/Analyze/general-linear-model/univariate/types/univariate";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { CheckedState } from "@radix-ui/react-checkbox";
import { HelpCircle } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import {
    TooltipProvider,
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";
import { TourPopup } from "@/components/Common/TourComponents";
import { useTourGuide } from "../hooks/useTourGuide";
import { saveTourSteps } from "../hooks/tourConfig";

export const UnivariateSave = ({
    isSaveOpen,
    setIsSaveOpen,
    updateFormData,
    data,
}: UnivariateSaveProps) => {
    const [saveState, setSaveState] = useState<UnivariateSaveType>({ ...data });
    const [isContinueDisabled, setIsContinueDisabled] = useState(false);

    const {
        tourActive,
        currentStep,
        tourSteps,
        currentTargetElement,
        startTour,
        nextStep,
        prevStep,
        endTour,
    } = useTourGuide(saveTourSteps);

    useEffect(() => {
        if (isSaveOpen) {
            setSaveState({ ...data });
        }
    }, [isSaveOpen, data]);

    const handleChange = (
        field: keyof UnivariateSaveType,
        value: CheckedState | number | string | null
    ) => {
        setSaveState((prevState) => ({
            ...prevState,
            [field]: value,
        }));
    };

    const handleTypeGrp = (value: string) => {
        setSaveState((prevState) => ({
            ...prevState,
            StandardStats: value === "StandardStats",
            Heteroscedasticity: value === "Heteroscedasticity",
        }));
    };

    const handleDestGrp = (value: string) => {
        setSaveState((prevState) => ({
            ...prevState,
            NewDataSet: value === "NewDataSet",
            WriteNewDataSet: value === "WriteNewDataSet",
        }));
    };

    const handleContinue = () => {
        Object.entries(saveState).forEach(([key, value]) => {
            updateFormData(key as keyof UnivariateSaveType, value);
        });
        setIsSaveOpen(false);
    };

    if (!isSaveOpen) return null;

    return (
        <div className="flex flex-col h-full flex-grow">
            <AnimatePresence>
                {tourActive &&
                    tourSteps.length > 0 &&
                    currentStep < tourSteps.length && (
                        <TourPopup
                            step={tourSteps[currentStep]}
                            currentStep={currentStep}
                            totalSteps={tourSteps.length}
                            onNext={nextStep}
                            onPrev={prevStep}
                            onClose={endTour}
                            targetElement={currentTargetElement}
                        />
                    )}
            </AnimatePresence>
            <div className="flex flex-col gap-2 p-4 flex-grow">
                <ResizablePanelGroup
                    direction="vertical"
                    className="w-full min-h-[550px] rounded-lg border md:min-w-[200px]"
                >
                    <ResizablePanel defaultSize={40}>
                        <ResizablePanelGroup direction="horizontal">
                            <ResizablePanel>
                                <ResizablePanelGroup direction="vertical">
                                    <ResizablePanel defaultSize={60}>
                                        <div
                                            id="univariate-save-variables"
                                            className="flex flex-col gap-2 p-2"
                                        >
                                            <Label className="font-bold">
                                                Predicted Values
                                            </Label>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="UnstandardizedPre"
                                                    checked={
                                                        saveState.UnstandardizedPre
                                                    }
                                                    onCheckedChange={(
                                                        checked
                                                    ) =>
                                                        handleChange(
                                                            "UnstandardizedPre",
                                                            checked
                                                        )
                                                    }
                                                />
                                                <label
                                                    htmlFor="UnstandardizedPre"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    Unstandardized
                                                </label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="WeightedPre"
                                                    checked={
                                                        saveState.WeightedPre
                                                    }
                                                    onCheckedChange={(
                                                        checked
                                                    ) =>
                                                        handleChange(
                                                            "WeightedPre",
                                                            checked
                                                        )
                                                    }
                                                />
                                                <label
                                                    htmlFor="WeightedPre"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    Weighted
                                                </label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="StdStatistics"
                                                    checked={
                                                        saveState.StdStatistics
                                                    }
                                                    onCheckedChange={(
                                                        checked
                                                    ) =>
                                                        handleChange(
                                                            "StdStatistics",
                                                            checked
                                                        )
                                                    }
                                                />
                                                <label
                                                    htmlFor="StdStatistics"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    Standard Errors
                                                </label>
                                            </div>
                                        </div>
                                    </ResizablePanel>
                                    <ResizableHandle />
                                    <ResizablePanel defaultSize={40}>
                                        <div className="flex flex-col gap-2 p-2">
                                            <Label className="font-bold">
                                                Diagnostics
                                            </Label>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="CooksD"
                                                    checked={saveState.CooksD}
                                                    onCheckedChange={(
                                                        checked
                                                    ) =>
                                                        handleChange(
                                                            "CooksD",
                                                            checked
                                                        )
                                                    }
                                                />
                                                <label
                                                    htmlFor="CooksD"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    Cook&apos;s Distances
                                                </label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="Leverage"
                                                    checked={saveState.Leverage}
                                                    onCheckedChange={(
                                                        checked
                                                    ) =>
                                                        handleChange(
                                                            "Leverage",
                                                            checked
                                                        )
                                                    }
                                                />
                                                <label
                                                    htmlFor="Leverage"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    Leverage Values
                                                </label>
                                            </div>
                                        </div>
                                    </ResizablePanel>
                                </ResizablePanelGroup>
                            </ResizablePanel>
                            <ResizableHandle />
                            <ResizablePanel defaultSize={50}>
                                <div className="flex flex-col gap-2 p-2">
                                    <Label className="font-bold">
                                        Residuals
                                    </Label>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="UnstandardizedRes"
                                            checked={
                                                saveState.UnstandardizedRes
                                            }
                                            onCheckedChange={(checked) =>
                                                handleChange(
                                                    "UnstandardizedRes",
                                                    checked
                                                )
                                            }
                                        />
                                        <label
                                            htmlFor="UnstandardizedRes"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Unstandardized
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="WeightedRes"
                                            checked={saveState.WeightedRes}
                                            onCheckedChange={(checked) =>
                                                handleChange(
                                                    "WeightedRes",
                                                    checked
                                                )
                                            }
                                        />
                                        <label
                                            htmlFor="WeightedRes"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Weighted
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="StandardizedRes"
                                            checked={saveState.StandardizedRes}
                                            onCheckedChange={(checked) =>
                                                handleChange(
                                                    "StandardizedRes",
                                                    checked
                                                )
                                            }
                                        />
                                        <label
                                            htmlFor="StandardizedRes"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Standardized
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="StudentizedRes"
                                            checked={saveState.StudentizedRes}
                                            onCheckedChange={(checked) =>
                                                handleChange(
                                                    "StudentizedRes",
                                                    checked
                                                )
                                            }
                                        />
                                        <label
                                            htmlFor="StudentizedRes"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Studentized
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="DeletedRes"
                                            checked={saveState.DeletedRes}
                                            onCheckedChange={(checked) =>
                                                handleChange(
                                                    "DeletedRes",
                                                    checked
                                                )
                                            }
                                        />
                                        <label
                                            htmlFor="DeletedRes"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Deleted
                                        </label>
                                    </div>
                                </div>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </ResizablePanel>
                    <ResizableHandle />
                    <ResizablePanel defaultSize={60}>
                        <div
                            id="univariate-save-coeff-stats"
                            className="flex flex-col gap-4 p-2"
                        >
                            <Label className="font-bold">
                                Coefficient Statistics
                            </Label>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="CoeffStats"
                                    checked={saveState.CoeffStats}
                                    disabled={true}
                                    onCheckedChange={(checked) =>
                                        handleChange("CoeffStats", checked)
                                    }
                                />
                                <label
                                    htmlFor="CoeffStats"
                                    className="text-sm font-medium leading-none cursor-not-allowed opacity-50"
                                >
                                    Create Coefficient Statistics
                                </label>
                            </div>
                            <Label className="font-bold cursor-not-allowed opacity-50">Type</Label>
                            <RadioGroup
                                value={
                                    saveState.StandardStats
                                        ? "StandardStats"
                                        : saveState.Heteroscedasticity
                                        ? "Heteroscedasticity"
                                        : ""
                                }
                                disabled={!saveState.CoeffStats}
                                onValueChange={handleTypeGrp}
                            >
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                            value="StandardStats"
                                            id="StandardStats"
                                        />
                                        <Label htmlFor="StandardStats" className="cursor-not-allowed opacity-50">
                                            Standard Statistics
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                            value="Heteroscedasticity"
                                            id="Heteroscedasticity"
                                        />
                                        <Label htmlFor="Heteroscedasticity" className="cursor-not-allowed opacity-50">
                                            Heteroscedasticity-consistent
                                            Statistics
                                        </Label>
                                    </div>
                                </div>
                            </RadioGroup>
                            <Label className="font-bold cursor-not-allowed opacity-50">Destination</Label>
                            <RadioGroup
                                value={
                                    saveState.NewDataSet
                                        ? "NewDataSet"
                                        : saveState.WriteNewDataSet
                                        ? "WriteNewDataSet"
                                        : ""
                                }
                                disabled={true}
                                onValueChange={handleDestGrp}
                            >
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                            value="NewDataSet"
                                            id="NewDataSet"
                                        />
                                        <Label htmlFor="NewDataSet" className="cursor-not-allowed opacity-50">
                                            Create a New Dataset
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2 pl-6">
                                        <Label className="w-[150px] cursor-not-allowed opacity-50">
                                            Dataset Name:
                                        </Label>
                                        <div className="w-[150px]">
                                            <Input
                                                id="DatasetName"
                                                type="text"
                                                placeholder=""
                                                value={
                                                    saveState.DatasetName ?? ""
                                                }
                                                disabled={
                                                    true ||
                                                    !saveState.NewDataSet
                                                }
                                                onChange={(e) =>
                                                    handleChange(
                                                        "DatasetName",
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                            value="WriteNewDataSet"
                                            id="WriteNewDataSet"
                                        />
                                        <Label htmlFor="WriteNewDataSet" className="cursor-not-allowed opacity-50">
                                            Write New Dataset File
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2 pl-6">
                                        <Input
                                            id="FilePath"
                                            type="file"
                                            placeholder=""
                                            disabled={
                                                !saveState.WriteNewDataSet
                                            }
                                            onChange={(e) =>
                                                handleChange(
                                                    "FilePath",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                            </RadioGroup>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                <div>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={startTour}
                                    className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                                >
                                    <HelpCircle className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                <p className="text-xs">Start feature tour</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <div>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsSaveOpen(false)}
                        className="mr-2"
                    >
                        Cancel
                    </Button>
                    <Button
                        id="univariate-save-continue-button"
                        disabled={isContinueDisabled}
                        type="button"
                        onClick={handleContinue}
                    >
                        Continue
                    </Button>
                </div>
            </div>
        </div>
    );
};
