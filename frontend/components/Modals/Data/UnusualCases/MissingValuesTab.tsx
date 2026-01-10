import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ActiveElementHighlight } from "@/components/Common/TourComponents";
import type { MissingValuesTabProps } from "./types";

const MissingValuesTab: React.FC<MissingValuesTabProps> = ({
    missingValuesOption,
    setMissingValuesOption,
    useProportionMissing,
    setUseProportionMissing,
    tourActive,
    currentStep,
    tourSteps = []
}) => {
    const missingStepIndex = tourSteps.findIndex(step => step.targetId === 'unusual-cases-missing-values');

    return (
        <>
            <div id="unusual-cases-missing-values" className="relative">
                <ActiveElementHighlight active={!!(tourActive && currentStep === missingStepIndex)} />
                <RadioGroup value={missingValuesOption} onValueChange={setMissingValuesOption} className="space-y-6">
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center">
                                <RadioGroupItem value="exclude" id="excludeMissing" className="mr-2" />
                                <Label htmlFor="excludeMissing" className="text-sm font-medium cursor-pointer">
                                    Exclude missing values from analysis
                                </Label>
                            </div>
                            <p className="text-xs mt-2 ml-6 text-muted-foreground">
                                User- and system-missing values are excluded.
                            </p>
                        </div>

                        <div>
                            <div className="flex items-center">
                                <RadioGroupItem value="include" id="includeMissing" className="mr-2" />
                                <Label htmlFor="includeMissing" className="text-sm font-medium cursor-pointer">
                                    Include missing values in analysis
                                </Label>
                            </div>
                            <p className="text-xs mt-2 ml-6 text-muted-foreground">
                                For scale variables, user- and system-missing values are replaced with the variable&apos;s grand mean. For categorical
                                variables, user- and system-missing values are combined and included in the analysis as a category.
                            </p>
                        </div>
                    </div>
                </RadioGroup>
            </div>

            <div className="mt-4">
                <div className="flex items-center">
                    <Checkbox
                        id="useProportionMissing"
                        checked={useProportionMissing}
                        onCheckedChange={(checked) => setUseProportionMissing(!!checked)}
                        className="mr-2"
                        disabled={missingValuesOption !== "include"}
                    />
                    <Label htmlFor="useProportionMissing" className="text-sm cursor-pointer">
                        Use proportion of missing values per case as analysis variable
                    </Label>
                </div>
            </div>
        </>
    );
};

export default MissingValuesTab;