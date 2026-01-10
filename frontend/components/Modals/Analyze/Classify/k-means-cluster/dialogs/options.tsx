import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    KMeansClusterOptionsProps,
    KMeansClusterOptionsType,
} from "@/components/Modals/Analyze/Classify/k-means-cluster/types/k-means-cluster";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckedState } from "@radix-ui/react-checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { optionsTourSteps } from "../hooks/tourConfig";

export const KMeansClusterOptions = ({
    isOptionsOpen,
    setIsOptionsOpen,
    updateFormData,
    data,
}: KMeansClusterOptionsProps) => {
    const [optionsState, setOptionsState] = useState<KMeansClusterOptionsType>({
        ...data,
    });
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
    } = useTourGuide(optionsTourSteps);

    useEffect(() => {
        if (isOptionsOpen) {
            setOptionsState({ ...data });
        }
    }, [isOptionsOpen, data]);

    const handleChange = (
        field: keyof KMeansClusterOptionsType,
        value: CheckedState | number | boolean | string | null
    ) => {
        setOptionsState((prevState) => ({
            ...prevState,
            [field]: value,
        }));
    };

    const handleMissGrp = (value: string) => {
        setOptionsState((prevState) => ({
            ...prevState,
            ExcludeListWise: value === "ExcludeListWise",
            ExcludePairWise: value === "ExcludePairWise",
        }));
    };

    const handleContinue = () => {
        Object.entries(optionsState).forEach(([key, value]) => {
            updateFormData(key as keyof KMeansClusterOptionsType, value);
        });
        setIsOptionsOpen(false);
    };

    if (!isOptionsOpen) return null;

    return (
        <div className="flex flex-col h-full">
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
            <div className="p-4 flex-grow">
                <ResizablePanelGroup
                    direction="vertical"
                    className="min-h-[200px] rounded-lg border md:min-w-[200px]"
                >
                    <ResizablePanel defaultSize={55}>
                        <div
                            id="kmeans-options-statistics-section"
                            className="flex flex-col gap-1 p-2"
                        >
                            <Label className="font-bold">Statistics</Label>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="InitialCluster"
                                    checked={optionsState.InitialCluster}
                                    onCheckedChange={(checked: CheckedState) =>
                                        handleChange("InitialCluster", checked)
                                    }
                                />
                                <label
                                    htmlFor="InitialCluster"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Initial Cluster Centers
                                </label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="ANOVA"
                                    checked={optionsState.ANOVA}
                                    onCheckedChange={(checked: CheckedState) =>
                                        handleChange("ANOVA", checked)
                                    }
                                />
                                <label
                                    htmlFor="ANOVA"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    ANOVA
                                </label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="ClusterInfo"
                                    checked={optionsState.ClusterInfo}
                                    onCheckedChange={(checked: CheckedState) =>
                                        handleChange("ClusterInfo", checked)
                                    }
                                />
                                <label
                                    htmlFor="ClusterInfo"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Cluster Information
                                </label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="ClusterPlot"
                                    checked={optionsState.ClusterPlot}
                                    onCheckedChange={(checked: CheckedState) =>
                                        handleChange("ClusterPlot", checked)
                                    }
                                />
                                <label
                                    htmlFor="ClusterPlot"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Cluster Plot
                                </label>
                            </div>
                        </div>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={45}>
                        <div
                            id="kmeans-options-missing-values-section"
                            className="flex flex-col h-full gap-2 p-2"
                        >
                            <Label className="font-bold">Missing Values</Label>
                            <RadioGroup
                                value={
                                    optionsState.ExcludeListWise
                                        ? "ExcludeListWise"
                                        : "ExcludePairWise"
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
                                            Exclude Cases Listwise
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                            value="ExcludePairWise"
                                            id="ExcludePairWise"
                                            // disabled={true}
                                        />
                                        <Label htmlFor="ExcludePairWise">
                                            Exclude Cases Pairwise
                                        </Label>
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
                        onClick={() => setIsOptionsOpen(false)}
                        className="mr-2"
                    >
                        Cancel
                    </Button>
                    <Button
                        id="kmeans-options-continue-button"
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
