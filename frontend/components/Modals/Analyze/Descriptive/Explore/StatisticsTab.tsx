"use client";
import React, { FC } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { StatisticsTabProps } from "./types";
import { ActiveElementHighlight } from "@/components/Common/TourComponents";

const StatisticsTab: FC<StatisticsTabProps> = ({
    showDescriptives,
    setShowDescriptives,
    confidenceInterval,
    setConfidenceInterval,
    showMEstimators,
    setShowMEstimators,
    showOutliers,
    setShowOutliers,
    showPercentiles,
    setShowPercentiles,
    containerType = "dialog",
    tourActive = false,
    currentStep = 0,
    tourSteps = [],
}) => {
    const getStepIndex = (targetId: string) => tourSteps.findIndex(step => step.targetId === targetId);
    const descriptivesStep = getStepIndex('explore-descriptives-section');
    const additionalStatsStep = getStepIndex('explore-additional-stats-section');
    
    return (
        <div data-testid="explore-statistics-tab-content" className="space-y-4">
            <div id="explore-descriptives-section" data-testid="explore-descriptives-section" className="p-4 border rounded-md relative">
                {/* Descriptives Checkbox */}
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="descriptives"
                        data-testid="explore-descriptives-checkbox"
                        checked={showDescriptives}
                        onCheckedChange={(checked) => setShowDescriptives(checked as boolean)}
                        className="h-4 w-4"
                    />
                    <Label htmlFor="descriptives" className="text-sm font-medium cursor-pointer">
                        Descriptives
                    </Label>
                </div>

                {/* Confidence Interval Input - Conditionally enabled */}
                <div className={`flex items-center ml-8 mt-2 space-x-2 ${!showDescriptives ? 'opacity-50 pointer-events-none' : ''}`}>
                    <Label htmlFor="confidenceInterval" className="text-sm">
                        Confidence Interval for Mean:
                    </Label>
                    <div className="flex items-center">
                        <Input
                            id="confidenceInterval"
                            data-testid="explore-confidence-interval-input"
                            value={confidenceInterval}
                            onChange={(e) => setConfidenceInterval(e.target.value)}
                            className="h-8 text-sm w-16"
                            disabled={!showDescriptives}
                        />
                        <span className="ml-1 text-sm">%</span>
                    </div>
                </div>
                <ActiveElementHighlight active={tourActive && currentStep === descriptivesStep} />
            </div>

            <div id="explore-additional-stats-section" data-testid="explore-additional-stats-section" className="p-4 border rounded-md space-y-2 relative">
                {/* M-estimators Checkbox - COMMENTED OUT */}
                {/* <div className="flex items-center space-x-2">
                    <Checkbox
                        id="mEstimators"
                        checked={showMEstimators}
                        onCheckedChange={(checked) => setShowMEstimators(checked as boolean)}
                        className="h-4 w-4"
                    />
                    <Label htmlFor="mEstimators" className="text-sm font-medium cursor-pointer">
                        M-estimators
                    </Label>
                </div> */}

                {/* Outliers Checkbox */}
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="outliers"
                        data-testid="explore-outliers-checkbox"
                        checked={showOutliers}
                        onCheckedChange={(checked) => setShowOutliers(checked as boolean)}
                        className="h-4 w-4"
                    />
                    <Label htmlFor="outliers" className="text-sm font-medium cursor-pointer">
                        Outliers
                    </Label>
                </div>

                {/* Percentiles Checkbox - COMMENTED OUT */}
                {/* <div className="flex items-center space-x-2">
                    <Checkbox
                        id="percentiles"
                        checked={showPercentiles}
                        onCheckedChange={(checked) => setShowPercentiles(checked as boolean)}
                        className="h-4 w-4"
                    />
                    <Label htmlFor="percentiles" className="text-sm font-medium cursor-pointer">
                        Percentiles
                    </Label>
                </div> */}
                <ActiveElementHighlight active={tourActive && currentStep === additionalStatsStep} />
            </div>
        </div>
    );
};

export default StatisticsTab;