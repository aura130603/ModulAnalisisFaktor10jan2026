import React, { FC, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { OptionsTabProps } from "../types";

const OptionsTab: FC<OptionsTabProps> = ({
    estimateEffectSize,
    setEstimateEffectSize,
    calculateStandardizer,
    setCalculateStandardizer,
    tourActive = false,
    currentStep = 0,
    tourSteps = []
}) => {
    const isTourElementActive = useCallback((elementId: string) => {
        if (!tourActive || currentStep >= tourSteps.length) return false;
        return tourSteps[currentStep]?.targetId === elementId;
    }, [tourActive, currentStep, tourSteps]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 border rounded-md p-4">
                {/* Effect Size Option */}
                <div id="estimate-effect-size-section" className="flex items-center mb-2 relative">
                    <Checkbox
                        id="estimate-effect-size"
                        checked={estimateEffectSize}
                        onCheckedChange={(checked) => setEstimateEffectSize(!!checked)}
                        className="mr-2"
                        disabled
                    />
                    <Label htmlFor="estimate-effect-size">Estimate effect sizes</Label>
                    {tourActive && isTourElementActive("estimate-effect-size-section") && (
                        <div className="absolute inset-0 pointer-events-none border-2 border-primary animate-pulse rounded-md z-10"></div>
                    )}
                </div>

                {/* Standardizer Options */}
                <div id="calculate-standardizer-section" className="relative">
                    <Label className="text-sm font-medium mb-2 block">Calculate standardizer using:</Label>
                    <RadioGroup
                        value={
                            calculateStandardizer.standardDeviation ? "standardDeviation" :
                            calculateStandardizer.correctedStandardDeviation ? "correctedStandardDeviation" :
                            calculateStandardizer.averageOfVariances ? "averageOfVariances" : ""
                        }
                        onValueChange={(value) => {
                            setCalculateStandardizer({
                                standardDeviation: value === "standardDeviation",
                                correctedStandardDeviation: value === "correctedStandardDeviation",
                                averageOfVariances: value === "averageOfVariances"
                            });
                        }}
                        className="space-y-2"
                        disabled={!estimateEffectSize}
                    >
                        <div className="flex items-center">
                            <RadioGroupItem
                                value="standardDeviation"
                                id="standard-deviation-option"
                                className="mr-2"
                                disabled={!estimateEffectSize}
                            />
                            <Label 
                                htmlFor="standard-deviation-option" 
                                className={!estimateEffectSize ? "text-muted-foreground" : ""}
                            >
                                Standard deviation of the difference
                            </Label>
                        </div>
                        <div className="flex items-center">
                            <RadioGroupItem
                                value="correctedStandardDeviation"
                                id="corrected-standard-deviation-option"
                                className="mr-2"
                                disabled={!estimateEffectSize}
                            />
                            <Label 
                                htmlFor="corrected-standard-deviation-option"
                                className={!estimateEffectSize ? "text-muted-foreground" : ""}
                            >
                                Corrected standard deviation of the difference
                            </Label>
                        </div>
                        <div className="flex items-center">
                            <RadioGroupItem
                                value="averageOfVariances"
                                id="average-of-variances-option"
                                className="mr-2"
                                disabled={!estimateEffectSize}
                            />
                            <Label 
                                htmlFor="average-of-variances-option"
                                className={!estimateEffectSize ? "text-muted-foreground" : ""}
                            >
                                Average of variances
                            </Label>
                        </div>
                    </RadioGroup>
                    {tourActive && isTourElementActive("calculate-standardizer-section") && (
                        <div className="absolute inset-0 pointer-events-none border-2 border-primary animate-pulse rounded-md z-10"></div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OptionsTab;