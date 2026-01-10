"use client";
import React, { FC, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { saveFormData, clearFormData, getFormData } from "@/hooks/useIndexedDB";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { HelpCircle } from "lucide-react";
import { BaseModalProps } from "@/types/modalTypes";
import { useTourGuide, TabControlProps } from "./hooks";
import { TourPopup } from "@/components/Common/TourComponents";
import { AnimatePresence } from "framer-motion";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
    useVariableSelection,
    useStatisticsSettings,
    useChartsSettings,
    useDisplaySettings,
    useFrequenciesAnalysis
} from './hooks';

import VariablesTab from "./VariablesTab";
import StatisticsTab from "./StatisticsTab";
import ChartsTab from "./ChartsTab";

const FrequenciesContent = ({
    onClose,
    containerType = "dialog",
}: BaseModalProps) => {
    // State management via custom hooks
    const [activeTab, setActiveTab] = React.useState<'variables' | 'statistics' | 'charts'>("variables");
    
    const variableSelection = useVariableSelection();
    const statisticsSettings = useStatisticsSettings();
    const chartsSettings = useChartsSettings();
    const displaySettings = useDisplaySettings();

    // Tour guide setup
    const tabControl = useMemo((): TabControlProps => ({
        setActiveTab,
        currentActiveTab: activeTab
    }), [activeTab]);

    const {
        tourActive,
        currentStep,
        tourSteps,
        currentTargetElement,
        startTour,
        nextStep,
        prevStep,
        endTour
    } = useTourGuide(containerType, tabControl);

    // Analysis hook
    const { isLoading, errorMsg, runAnalysis, cancelAnalysis } = useFrequenciesAnalysis({
        selectedVariables: variableSelection.selectedVariables,
        showFrequencyTables: displaySettings.showFrequencyTables,
        showStatistics: statisticsSettings.showStatistics,
        showCharts: chartsSettings.showCharts,
        statisticsOptions: statisticsSettings.getCurrentStatisticsOptions(),
        chartOptions: chartsSettings.getCurrentChartOptions(),
        onClose
    });

    // Load persisted form data on initial mount
    React.useEffect(() => {
        (async () => {
            const saved = await getFormData("Frequencies");
            if (!saved) return;

            // Restore variable selection
            variableSelection.resetVariableSelection();
            if (Array.isArray(saved.selectedVariables)) {
                saved.selectedVariables.forEach((v: any, idx: number) => {
                    variableSelection.moveToSelectedVariables(v, idx);
                });
            }

            // Display settings
            if (typeof saved.showFrequencyTables === "boolean") {
                displaySettings.setShowFrequencyTables(saved.showFrequencyTables);
            }

            // Statistics settings
            if (typeof saved.showStatistics === "boolean") {
                statisticsSettings.setShowStatistics(saved.showStatistics);
            }
            if (saved.statisticsOptions) {
                const opts = saved.statisticsOptions;

                // Percentiles
                if (opts.percentileValues) {
                    statisticsSettings.setQuartilesChecked(opts.percentileValues.quartiles);
                    statisticsSettings.setCutPointsChecked(opts.percentileValues.cutPoints);
                    statisticsSettings.setCutPointsValue(String(opts.percentileValues.cutPointsN));
                    statisticsSettings.setEnablePercentiles(opts.percentileValues.enablePercentiles);
                    statisticsSettings.setPercentileValues(opts.percentileValues.percentilesList);
                }

                // Central Tendency
                if (opts.centralTendency) {
                    statisticsSettings.setMeanChecked(opts.centralTendency.mean);
                    statisticsSettings.setMedianChecked(opts.centralTendency.median);
                    statisticsSettings.setModeChecked(opts.centralTendency.mode);
                    statisticsSettings.setSumChecked(opts.centralTendency.sum);
                }

                // Dispersion
                if (opts.dispersion) {
                    statisticsSettings.setStdDevChecked(opts.dispersion.stddev);
                    statisticsSettings.setVarianceChecked(opts.dispersion.variance);
                    statisticsSettings.setRangeChecked(opts.dispersion.range);
                    statisticsSettings.setMinChecked(opts.dispersion.minimum);
                    statisticsSettings.setMaxChecked(opts.dispersion.maximum);
                    statisticsSettings.setSeMeanChecked(opts.dispersion.stdErrorMean);
                }

                // Distribution
                if (opts.distribution) {
                    statisticsSettings.setSkewnessChecked(opts.distribution.skewness);
                    statisticsSettings.setKurtosisChecked(opts.distribution.kurtosis);
                }
            }

            // Charts settings
            if (typeof saved.showCharts === "boolean") {
                chartsSettings.setShowCharts(saved.showCharts);
            }
            if (saved.chartOptions) {
                chartsSettings.setChartType(saved.chartOptions.type ?? "none");
                chartsSettings.setChartValues(saved.chartOptions.values ?? "frequencies");
                chartsSettings.setShowNormalCurve(saved.chartOptions.showNormalCurveOnHistogram ?? false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Reset all settings
    const handleReset = useCallback(() => {
        variableSelection.resetVariableSelection();
        statisticsSettings.resetStatisticsSettings();
        chartsSettings.resetChartsSettings();
        displaySettings.resetDisplaySettings();

        // Clear persisted data for Frequencies
        clearFormData("Frequencies").catch(console.error);

        if (cancelAnalysis) {
            cancelAnalysis();
        }
    }, [variableSelection, statisticsSettings, chartsSettings, displaySettings, cancelAnalysis]);

    // Persist Frequencies form state whenever relevant settings change
    React.useEffect(() => {
        const stateToSave = {
            selectedVariables: variableSelection.selectedVariables,
            // Display Settings
            showFrequencyTables: displaySettings.showFrequencyTables,
            // Statistics settings
            showStatistics: statisticsSettings.showStatistics,
            statisticsOptions: statisticsSettings.getCurrentStatisticsOptions(),
            // Chart settings
            showCharts: chartsSettings.showCharts,
            chartOptions: chartsSettings.getCurrentChartOptions(),
        };

        // Persist current state. If no variables are selected we remove any previously
        // saved data to avoid showing stale selections the next time the form opens.
        if (variableSelection.selectedVariables.length > 0) {
            saveFormData("Frequencies", stateToSave).catch(console.error);
        } else {
            clearFormData("Frequencies").catch(console.error);
        }
    }, [variableSelection.selectedVariables, displaySettings.showFrequencyTables, statisticsSettings, statisticsSettings.showStatistics, statisticsSettings.getCurrentStatisticsOptions, chartsSettings, chartsSettings.showCharts, chartsSettings.getCurrentChartOptions]);

    return (
        <>
            {/* Tour popup */}
            <AnimatePresence>
                {tourActive && tourSteps.length > 0 && currentStep < tourSteps.length && (
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

            <Tabs 
                data-testid="frequencies-tabs"
                value={activeTab} 
                onValueChange={(value) => setActiveTab(value as 'variables' | 'statistics' | 'charts')} 
                className="w-full flex flex-col flex-grow overflow-hidden"
            >
                <div className="border-b border-border flex-shrink-0">
                    <TabsList data-testid="frequencies-tabs-list">
                        <TabsTrigger data-testid="frequencies-variables-tab" value="variables">Variables</TabsTrigger>
                        <TabsTrigger data-testid="frequencies-statistics-tab" id="statistics-tab-trigger" value="statistics">Statistics</TabsTrigger>
                        <TabsTrigger data-testid="frequencies-charts-tab" id="charts-tab-trigger" value="charts">Charts</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="variables" className="p-6 overflow-y-auto flex-grow">
                    <VariablesTab
                        variableSelection={variableSelection}
                        displaySettings={displaySettings}
                        containerType={containerType}
                        tourActive={tourActive}
                        currentStep={currentStep}
                        tourSteps={tourSteps}
                    />
                </TabsContent>

                <TabsContent value="statistics" className="p-6 overflow-y-auto flex-grow">
                    <StatisticsTab
                        settings={statisticsSettings}
                        containerType={containerType}
                        tourActive={tourActive}
                        currentStep={currentStep}
                        tourSteps={tourSteps}
                    />
                </TabsContent>

                <TabsContent value="charts" className="p-6 overflow-y-auto flex-grow">
                    {activeTab === "charts" && (
                        <ChartsTab
                            settings={chartsSettings}
                            containerType={containerType}
                            tourActive={tourActive}
                            currentStep={currentStep}
                            tourSteps={tourSteps}
                        />
                    )}
                </TabsContent>
            </Tabs>

            {errorMsg && <div className="px-6 py-2 text-destructive">{errorMsg}</div>}

            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                <div className="flex items-center text-muted-foreground">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    data-testid="frequencies-help-button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={startTour}
                                    aria-label="Start feature tour"
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
                        data-testid="frequencies-reset-button"
                        variant="outline"
                        className="mr-2"
                        onClick={handleReset}
                    >
                        Reset
                    </Button>
                    <Button
                        data-testid="frequencies-cancel-button"
                        variant="outline"
                        className="mr-2"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        data-testid="frequencies-ok-button"
                        id="frequencies-ok-button"
                        onClick={runAnalysis}
                        disabled={isLoading || variableSelection.selectedVariables.length === 0}
                    >
                        {isLoading ? "Calculating..." : "OK"}
                    </Button>
                </div>
            </div>
        </>
    );
};

const Frequencies: FC<BaseModalProps> = ({ onClose, containerType = "dialog", ...props }) => {
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <FrequenciesContent onClose={onClose} containerType={containerType} {...props} />
                </div>
            </div>
        );
    }

    return (
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent 
                data-testid="frequencies-dialog"
                className="max-w-xl p-0 bg-card border border-border shadow-md rounded-md flex flex-col max-h-[85vh]"
            >
                <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                    <DialogTitle className="text-xl font-semibold">Frequencies</DialogTitle>
                </DialogHeader>
                <div className="flex-grow flex flex-col overflow-hidden">
                    <FrequenciesContent onClose={onClose} containerType={containerType} {...props} />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default Frequencies;