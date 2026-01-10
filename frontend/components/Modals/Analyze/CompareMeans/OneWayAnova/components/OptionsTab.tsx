import React, { FC } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { OptionsTabProps } from "../types";
import { ActiveElementHighlight } from "@/components/Common/TourComponents";

const OptionsTab: FC<OptionsTabProps> = ({
    statisticsOptions,
    setStatisticsOptions,
    tourActive = false,
    currentStep = 0,
    tourSteps = []
}) => {
    const getStepIndex = (targetId: string) => tourSteps.findIndex(step => step.targetId === targetId);

    const statisticsStepIndex = getStepIndex("statistics-section");

    return (
        <div className="space-y-6">
            <div id="statistics-section" className="bg-card border border-border rounded-md p-5 relative">
                <div className="text-sm font-medium mb-3">Statistics</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <div className="flex items-center">
                        <Checkbox
                            id="descriptive"
                            checked={statisticsOptions.descriptive}
                            onCheckedChange={(checked) => 
                                setStatisticsOptions({ ...statisticsOptions, descriptive: !!checked })
                            }
                            className="mr-2"
                        />
                        <Label htmlFor="descriptive" className="text-sm cursor-pointer">Descriptive</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox
                            id="homogeneity-of-variance"
                            checked={statisticsOptions.homogeneityOfVariance}
                            onCheckedChange={(checked) => 
                                setStatisticsOptions({ ...statisticsOptions, homogeneityOfVariance: !!checked })
                            }
                            className="mr-2"
                        />
                        <Label htmlFor="homogeneity-of-variance" className="text-sm cursor-pointer">Homogeneity of variance test</Label>
                    </div>
                </div>
                <ActiveElementHighlight active={tourActive && currentStep === statisticsStepIndex} />
            </div>
        </div>
    );
};

export default OptionsTab;