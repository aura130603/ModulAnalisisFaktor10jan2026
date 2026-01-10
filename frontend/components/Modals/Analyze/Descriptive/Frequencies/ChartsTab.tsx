import React, { FC, useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// Axis label inputs removed
import { TourStep } from "./hooks/useTourGuide";
import { ActiveElementHighlight } from "@/components/Common/TourComponents";
import { ChartsSettingsResult } from "./hooks";

export interface ChartsTabProps {
    settings: ChartsSettingsResult;
    containerType?: "dialog" | "sidebar";
    tourActive?: boolean;
    currentStep?: number;
    tourSteps?: TourStep[];
}

const ChartsTab: FC<ChartsTabProps> = ({
    settings,
    containerType = "dialog",
    tourActive = false,
    currentStep = 0,
    tourSteps = [],
}) => {
    const {
        showCharts,
        setShowCharts,
        chartType,
        setChartType,
        chartValues,
        setChartValues,
        showNormalCurve,
        setShowNormalCurve,
        // axis labels removed
    } = settings;

    // Function to determine text styling based on disabled state
    const getTextClass = (disabled: boolean) => {
        return disabled ? "text-muted-foreground" : "";
    };

    const isChartValuesDisabled = !showCharts || chartType === "none" || chartType === "histograms";
    const getStepIndex = (targetId: string) => tourSteps.findIndex(step => step.targetId === targetId);

    // axis labels removed

    return (
        <div className="grid grid-cols-1 gap-6">
            <div id="chart-type-section" className="border border-border rounded-md p-4 bg-card relative">
                <div className="flex items-center mb-4">
                    <Checkbox
                        data-testid="display-charts-checkbox"
                        id="displayCharts"
                        checked={showCharts}
                        onCheckedChange={(checked) => setShowCharts(!!checked)}
                        className="mr-2"
                    />
                    <Label htmlFor="displayCharts" className="text-sm font-medium cursor-pointer">
                        Display charts
                    </Label>
                </div>

                <div className="text-sm font-medium mb-3">Chart Type</div>
                <RadioGroup
                    value={chartType}
                    onValueChange={(value) => setChartType(value as typeof chartType)}
                    className="space-y-2"
                    disabled={!showCharts}
                >
                    <div className="flex items-center">
                        <RadioGroupItem data-testid="chart-type-none" id="none" value="none" className="mr-2" disabled={!showCharts} />
                        <Label htmlFor="none" className={`text-sm cursor-pointer ${getTextClass(!showCharts)}`}>
                            None
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <RadioGroupItem data-testid="chart-type-bar" id="barCharts" value="barCharts" className="mr-2" disabled={!showCharts} />
                        <Label htmlFor="barCharts" className={`text-sm cursor-pointer ${getTextClass(!showCharts)}`}>
                            Bar charts
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <RadioGroupItem data-testid="chart-type-pie" id="pieCharts" value="pieCharts" className="mr-2" disabled={!showCharts} />
                        <Label htmlFor="pieCharts" className={`text-sm cursor-pointer ${getTextClass(!showCharts)}`}>
                            Pie charts
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <RadioGroupItem data-testid="chart-type-histogram" id="histograms" value="histograms" className="mr-2" disabled={!showCharts} />
                        <Label htmlFor="histograms" className={`text-sm cursor-pointer ${getTextClass(!showCharts)}`}>
                            Histograms
                        </Label>
                    </div>
                </RadioGroup>
                <ActiveElementHighlight active={tourActive && currentStep === getStepIndex("chart-type-section")} />
            </div>

            <div id="chart-values-section" className="border border-border rounded-md p-4 bg-card relative">
                <div className={`text-sm font-medium mb-3 ${getTextClass(isChartValuesDisabled)}`}>Chart Values</div>
                <RadioGroup
                    value={chartValues}
                    onValueChange={(value) => setChartValues(value as typeof chartValues)}
                    className="space-y-2"
                    disabled={isChartValuesDisabled}
                >
                    <div className="flex items-center">
                        <RadioGroupItem
                            data-testid="chart-values-frequencies"
                            id="frequencies"
                            value="frequencies"
                            className="mr-2"
                            disabled={isChartValuesDisabled}
                        />
                        <Label
                            htmlFor="frequencies"
                            className={`text-sm cursor-pointer ${getTextClass(isChartValuesDisabled)}`}
                        >
                            Frequencies
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <RadioGroupItem
                            data-testid="chart-values-percentages"
                            id="percentages"
                            value="percentages"
                            className="mr-2"
                            disabled={isChartValuesDisabled}
                        />
                        <Label
                            htmlFor="percentages"
                            className={`text-sm cursor-pointer ${getTextClass(isChartValuesDisabled)}`}
                        >
                            Percentages
                        </Label>
                    </div>
                </RadioGroup>
                <ActiveElementHighlight active={tourActive && currentStep === getStepIndex("chart-values-section")} />
            </div>

            {/* Axis labels inputs removed */}
        </div>
    );
};

export default ChartsTab;