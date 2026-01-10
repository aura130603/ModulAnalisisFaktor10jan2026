import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    KMeansClusterSaveProps,
    KMeansClusterSaveType,
} from "@/components/Modals/Analyze/Classify/k-means-cluster/types/k-means-cluster";
import { Checkbox } from "@/components/ui/checkbox";
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

export const KMeansClusterSave = ({
    isSaveOpen,
    setIsSaveOpen,
    updateFormData,
    data,
}: KMeansClusterSaveProps) => {
    const [saveState, setSaveState] = useState<KMeansClusterSaveType>({
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
    } = useTourGuide(saveTourSteps);

    useEffect(() => {
        if (isSaveOpen) {
            setSaveState({ ...data });
        }
    }, [isSaveOpen, data]);

    const handleChange = (
        field: keyof KMeansClusterSaveType,
        value: CheckedState | number | boolean | string | null
    ) => {
        setSaveState((prevState) => ({
            ...prevState,
            [field]: value,
        }));
    };

    const handleContinue = () => {
        Object.entries(saveState).forEach(([key, value]) => {
            updateFormData(key as keyof KMeansClusterSaveType, value);
        });
        setIsSaveOpen(false);
    };

    if (!isSaveOpen) return null;

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
            <div
                id="kmeans-save-variables-section"
                className="flex flex-col items-start gap-2 p-4 flex-grow"
            >
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="ClusterMembership"
                        checked={saveState.ClusterMembership}
                        onCheckedChange={(checked) =>
                            handleChange("ClusterMembership", checked)
                        }
                    />
                    <label
                        htmlFor="ClusterMembership"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Cluster Membership
                    </label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="DistanceClusterCenter"
                        checked={saveState.DistanceClusterCenter}
                        onCheckedChange={(checked) =>
                            handleChange("DistanceClusterCenter", checked)
                        }
                    />
                    <label
                        htmlFor="DistanceClusterCenter"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Distance from Cluster Center
                    </label>
                </div>
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
                        id="kmeans-save-continue-button"
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
