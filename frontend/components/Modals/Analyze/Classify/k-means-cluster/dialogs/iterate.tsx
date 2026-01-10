import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    KMeansClusterIterateProps,
    KMeansClusterIterateType,
} from "@/components/Modals/Analyze/Classify/k-means-cluster/types/k-means-cluster";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CheckedState } from "@radix-ui/react-checkbox";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
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
import { iterateTourSteps } from "../hooks/tourConfig";

export const KMeansClusterIterate = ({
    isIterateOpen,
    setIsIterateOpen,
    updateFormData,
    data,
}: KMeansClusterIterateProps) => {
    const [iterateState, setIterateState] = useState<KMeansClusterIterateType>({
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
    } = useTourGuide(iterateTourSteps);

    useEffect(() => {
        if (isIterateOpen) {
            setIterateState({ ...data });
        }
    }, [isIterateOpen, data]);

    const handleChange = (
        field: keyof KMeansClusterIterateType,
        value: CheckedState | number | boolean | string | null
    ) => {
        setIterateState((prevState) => ({
            ...prevState,
            [field]: value,
        }));
    };

    const handleContinue = () => {
        if (
            iterateState.MaximumIterations == null ||
            iterateState.MaximumIterations < 1 ||
            iterateState.MaximumIterations > 999
        ) {
            toast.warning("Maximum iterations must be between 1 and 1000.");
            return;
        }
        if (
            iterateState.ConvergenceCriterion == null ||
            iterateState.ConvergenceCriterion < 0 ||
            iterateState.ConvergenceCriterion > 1
        ) {
            toast.warning(
                "Convergence criterion must be greater or equal than 0 and less than or equal to 1."
            );
            return;
        }
        Object.entries(iterateState).forEach(([key, value]) => {
            updateFormData(key as keyof KMeansClusterIterateType, value);
        });
        setIsIterateOpen(false);
    };

    if (!isIterateOpen) return null;

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
            <div className="flex flex-col items-start gap-2 p-4 flex-grow">
                <div
                    id="kmeans-iterate-max-iterations"
                    className="flex flex-row items-center gap-2"
                >
                    <Label className="w-[290px]">Maximum Iteration: </Label>
                    <Input
                        id="MaximumIterations"
                        type="number"
                        value={iterateState.MaximumIterations || ""}
                        min={1}
                        max={999}
                        onChange={(e) =>
                            handleChange(
                                "MaximumIterations",
                                Number(e.target.value)
                            )
                        }
                        placeholder=""
                    />
                </div>
                <div
                    id="kmeans-iterate-convergence-criterion"
                    className="flex flex-row items-center gap-2"
                >
                    <Label className="w-[300px]">Convergence Criterion: </Label>
                    <Input
                        id="ConvergenceCriterion"
                        type="number"
                        value={iterateState.ConvergenceCriterion || "0"}
                        min={0}
                        max={1}
                        onChange={(e) =>
                            handleChange(
                                "ConvergenceCriterion",
                                Number(e.target.value)
                            )
                        }
                        placeholder=""
                    />
                </div>
                <div
                    id="kmeans-iterate-use-running-means"
                    className="flex items-center space-x-2"
                >
                    <Checkbox
                        id="UseRunningMeans"
                        checked={iterateState.UseRunningMeans}
                        onCheckedChange={(checked) =>
                            handleChange("UseRunningMeans", checked)
                        }
                    />
                    <label
                        htmlFor="UseRunningMeans"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Use Running Means
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
                        onClick={() => setIsIterateOpen(false)}
                        className="mr-2"
                    >
                        Cancel
                    </Button>
                    <Button
                        id="kmeans-iterate-continue-button"
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
