import React, { FC, useState, useEffect, Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useMobile } from '@/hooks/useMobile';
import { TourStep } from "./hooks/useTourGuide";
import { ActiveElementHighlight } from "@/components/Common/TourComponents";
import { StatisticsSettingsResult } from "./hooks";

export interface StatisticsTabProps {
    settings: StatisticsSettingsResult;
    containerType?: "dialog" | "sidebar";
    tourActive?: boolean;
    currentStep?: number;
    tourSteps?: TourStep[];
}

const StatisticsTab: FC<StatisticsTabProps> = ({
    settings,
    containerType = "dialog",
    tourActive = false,
    currentStep = 0,
    tourSteps = [],
}) => {
    // Destructure all required state and setters from the settings object
    const {
        showStatistics, setShowStatistics,
        quartilesChecked, setQuartilesChecked,
        cutPointsChecked, setCutPointsChecked,
        cutPointsValue, setCutPointsValue,
        enablePercentiles, setEnablePercentiles,
        percentileValues, setPercentileValues,
        currentPercentileInput, setCurrentPercentileInput,
        selectedPercentileItem, setSelectedPercentileItem,
        meanChecked, setMeanChecked,
        medianChecked, setMedianChecked,
        modeChecked, setModeChecked,
        sumChecked, setSumChecked,
        stdDevChecked, setStdDevChecked,
        varianceChecked, setVarianceChecked,
        rangeChecked, setRangeChecked,
        minChecked, setMinChecked,
        maxChecked, setMaxChecked,
        seMeanChecked, setSeMeanChecked,
        skewnessChecked, setSkewnessChecked,
        kurtosisChecked, setKurtosisChecked
    } = settings;

    // No longer need alert state since we're using toast

    const { isMobile, isPortrait } = useMobile();

    const getTextClass = (disabled: boolean) => {
        return disabled ? "text-muted-foreground" : "";
    };

    // Helper function to validate percentile value
    const validatePercentileValue = (value: string): boolean => {
        const numValue = Number(value);
        if (isNaN(numValue)) return false;
        if (numValue < 0 || numValue > 100) return false;
        return true;
    };

    const showAlert = (title: string, description: string) => {
        toast.error(title, {
            description: description,
        });
    };

    // Update percentile handlers to use props
    const handleAddPercentile = () => {
        if (!currentPercentileInput) return; // Use prop state

        // Validate the percentile value is between 0-100
        if (!validatePercentileValue(currentPercentileInput)) { // Use prop state
            showAlert(
                "Invalid percentile",
                "Percentile must be a number between 0 and 100"
            );
            return;
        }

        // Check for duplicates
        if (percentileValues.includes(currentPercentileInput)) { // Use prop state
            showAlert(
                "Duplicate percentile",
                "This percentile value already exists"
            );
            return;
        }

        setPercentileValues([...percentileValues, currentPercentileInput]); // Use prop setter & state
        setCurrentPercentileInput(""); // Use prop setter
    };

    const handleChangePercentile = () => {
        if (!selectedPercentileItem || !currentPercentileInput) return; // Use prop states

        // Skip if no actual change
        if (selectedPercentileItem === currentPercentileInput) { // Use prop states
            setSelectedPercentileItem(null); // Use prop setter
            setCurrentPercentileInput(""); // Use prop setter
            return;
        }

        // Validate the percentile value is between 0-100
        if (!validatePercentileValue(currentPercentileInput)) { // Use prop state
            showAlert(
                "Invalid percentile",
                "Percentile must be a number between 0 and 100"
            );
            return;
        }

        // Check if the new value would create a duplicate
        if (percentileValues.includes(currentPercentileInput)) { // Use prop state
            showAlert(
                "Duplicate percentile",
                "This percentile value already exists"
            );
            return;
        }

        const newValues = percentileValues.map(p =>
            p === selectedPercentileItem ? currentPercentileInput : p // Use prop states
        );

        setPercentileValues(newValues); // Use prop setter
        setSelectedPercentileItem(null); // Use prop setter
        setCurrentPercentileInput(""); // Use prop setter
    };

    const handleRemovePercentile = () => {
        if (selectedPercentileItem) { // Use prop state
            setPercentileValues(percentileValues.filter(p => p !== selectedPercentileItem)); // Use prop setter & state
            setSelectedPercentileItem(null); // Use prop setter
            setCurrentPercentileInput(""); // Use prop setter
        }
    };

    const getStepIndex = (targetId: string) => tourSteps.findIndex(step => step.targetId === targetId);

    return (
        <div className={`grid ${isMobile && isPortrait ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>

            <div id="percentile-values-section" className="border border-border rounded-md p-4 space-y-3 bg-card relative">
                <div className={`text-sm font-medium ${getTextClass(!showStatistics)}`}>Percentile Values</div>
                <div className="flex items-center">
                    <Checkbox
                        id="quartiles"
                        className="mr-2"
                        disabled={!showStatistics}
                        checked={quartilesChecked}
                        onCheckedChange={(checked) => setQuartilesChecked(!!checked)}
                    />
                    <Label htmlFor="quartiles" className={`text-sm cursor-pointer ${getTextClass(!showStatistics)}`}>
                        Quartiles
                    </Label>
                </div>

                <div>
                    <div className="flex items-start mb-2">
                        <Checkbox
                            id="cutPoints"
                            className="mr-2 mt-1"
                            disabled={!showStatistics}
                            checked={cutPointsChecked}
                            onCheckedChange={(checked) => setCutPointsChecked(!!checked)}
                        />
                        <div className="flex flex-wrap items-center">
                            <Label htmlFor="cutPoints" className={`text-sm mr-2 cursor-pointer ${getTextClass(!showStatistics)}`}>
                                Cut points for
                            </Label>
                            <Input
                                type="number"
                                id="cutPointsValue"
                                value={cutPointsValue}
                                onChange={(e) => setCutPointsValue(e.target.value)}
                                className={`w-20 h-8 mr-2 ${getTextClass(!showStatistics || !cutPointsChecked)}`}
                                disabled={!showStatistics || !cutPointsChecked}
                            />
                            <Label htmlFor="cutPointsValue" className={`text-sm cursor-pointer ${getTextClass(!showStatistics || !cutPointsChecked)}`}>
                                equal groups
                            </Label>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="flex items-start mb-2">
                        <Checkbox
                            id="percentiles"
                            className="mr-2 mt-1"
                            disabled={!showStatistics}
                            checked={enablePercentiles}
                            onCheckedChange={(checked) => setEnablePercentiles(!!checked)}
                        />
                        <div className="flex flex-wrap items-center">
                            <Label htmlFor="percentiles" className={`text-sm mr-2 cursor-pointer ${getTextClass(!showStatistics)}`}>
                                Percentiles
                            </Label>
                            {enablePercentiles && showStatistics && (
                                <Input
                                    type="number"
                                    placeholder="0-100"
                                    value={currentPercentileInput}
                                    onChange={(e) => setCurrentPercentileInput(e.target.value)}
                                    className="w-24 h-8"
                                />
                            )}
                        </div>
                    </div>
                    {enablePercentiles && showStatistics && (
                        <div className="flex space-x-4 pl-6">
                            <div className="flex flex-col space-y-2 w-1/3">
                                <Button onClick={handleAddPercentile} size="sm" variant="outline" className="h-8 w-full">Add</Button>
                                <Button onClick={handleChangePercentile} size="sm" variant="outline" className="h-8 w-full" disabled={!selectedPercentileItem}>Change</Button>
                                <Button onClick={handleRemovePercentile} size="sm" variant="destructive" className="h-8 w-full" disabled={!selectedPercentileItem}>Remove</Button>
                            </div>
                            <div className="w-2/3">
                                <div className="h-full min-h-[70px] max-h-28 overflow-y-auto border border-border rounded-md p-2 space-y-1">
                                    {percentileValues.map((p) => (
                                        <div
                                            key={p}
                                            onClick={() => {
                                                setSelectedPercentileItem(p);
                                                setCurrentPercentileInput(p);
                                            }}
                                            className={`p-1 rounded-md cursor-pointer text-sm ${selectedPercentileItem === p ? "bg-muted text-muted-foreground" : "hover:bg-muted/50"
                                                }`}
                                        >
                                            {p}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <ActiveElementHighlight active={tourActive && currentStep === getStepIndex("percentile-values-section")} />
            </div>

            <div id="central-tendency-section" className="border border-border rounded-md p-4 space-y-2 bg-card relative">
                <div className={`text-sm font-medium mb-2 ${getTextClass(!showStatistics)}`}>Central Tendency</div>
                {[
                    { id: "mean", label: "Mean", checked: meanChecked, setter: setMeanChecked, testId: "frequencies-mean" },
                    { id: "median", label: "Median", checked: medianChecked, setter: setMedianChecked, testId: "frequencies-median" },
                    { id: "mode", label: "Mode", checked: modeChecked, setter: setModeChecked, testId: "frequencies-mode" },
                    { id: "sum", label: "Sum", checked: sumChecked, setter: setSumChecked, testId: "frequencies-sum" },
                ].map(({ id, label, checked, setter, testId }) => (
                    <div key={id} className="flex items-center">
                        <Checkbox
                            data-testid={testId}
                            id={id}
                            className="mr-2"
                            disabled={!showStatistics}
                            checked={checked}
                            onCheckedChange={(val) => setter(!!val)}
                        />
                        <Label htmlFor={id} className={`text-sm cursor-pointer ${getTextClass(!showStatistics)}`}>{label}</Label>
                    </div>
                ))}
                <ActiveElementHighlight active={tourActive && currentStep === getStepIndex("central-tendency-section")} />
            </div>

            <div id="dispersion-section" className="border border-border rounded-md p-4 space-y-2 bg-card relative">
                <div className={`text-sm font-medium mb-2 ${getTextClass(!showStatistics)}`}>Dispersion</div>
                {[
                    { id: "stddev", label: "Std. deviation", checked: stdDevChecked, setter: setStdDevChecked, testId: "frequencies-stddev" },
                    { id: "variance", label: "Variance", checked: varianceChecked, setter: setVarianceChecked, testId: "frequencies-variance" },
                    { id: "range", label: "Range", checked: rangeChecked, setter: setRangeChecked, testId: "frequencies-range" },
                    { id: "minimum", label: "Minimum", checked: minChecked, setter: setMinChecked, testId: "frequencies-minimum" },
                    { id: "maximum", label: "Maximum", checked: maxChecked, setter: setMaxChecked, testId: "frequencies-maximum" },
                    { id: "semean", label: "S. E. mean", checked: seMeanChecked, setter: setSeMeanChecked, testId: "frequencies-semean" },
                ].map(({ id, label, checked, setter, testId }) => (
                    <div key={id} className="flex items-center">
                        <Checkbox
                            data-testid={testId}
                            id={id}
                            className="mr-2"
                            disabled={!showStatistics}
                            checked={checked}
                            onCheckedChange={(val) => setter(!!val)}
                        />
                        <Label htmlFor={id} className={`text-sm cursor-pointer ${getTextClass(!showStatistics)}`}>{label}</Label>
                    </div>
                ))}
                <ActiveElementHighlight active={tourActive && currentStep === getStepIndex("dispersion-section")} />
            </div>

            <div id="distribution-section" className="border border-border rounded-md p-4 space-y-2 bg-card relative">
                <div className={`text-sm font-medium mb-2 ${getTextClass(!showStatistics)}`}>Distribution</div>
                {[
                    { id: "skewness", label: "Skewness", checked: skewnessChecked, setter: setSkewnessChecked, testId: "frequencies-skewness" },
                    { id: "kurtosis", label: "Kurtosis", checked: kurtosisChecked, setter: setKurtosisChecked, testId: "frequencies-kurtosis" },
                ].map(({ id, label, checked, setter, testId }) => (
                    <div key={id} className="flex items-center">
                        <Checkbox
                            data-testid={testId}
                            id={id}
                            className="mr-2"
                            disabled={!showStatistics}
                            checked={checked}
                            onCheckedChange={(val) => setter(!!val)}
                        />
                        <Label htmlFor={id} className={`text-sm cursor-pointer ${getTextClass(!showStatistics)}`}>{label}</Label>
                    </div>
                ))}
                <ActiveElementHighlight active={tourActive && currentStep === getStepIndex("distribution-section")} />
            </div>
        </div>
    );
};

export default StatisticsTab;