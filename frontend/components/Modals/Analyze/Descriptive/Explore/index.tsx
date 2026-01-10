"use client";
import React, { useState, FC, useMemo, useEffect } from "react";
import { saveFormData, clearFormData, getFormData } from "@/hooks/useIndexedDB";
import { Button } from "@/components/ui/button";
import {
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
import { BaseModalProps } from "@/types/modalTypes";
import { HelpCircle } from "lucide-react";
import { AnimatePresence } from "framer-motion";

// Tour guide
import {
    useTourGuide,
    TabType,
    TabControlProps,
    useVariableManagement,
    useStatisticsSettings,
    usePlotsSettings,
    useExploreAnalysis,
} from "./hooks";
import { TourPopup } from "@/components/Common/TourComponents";

// Child Components
import VariablesTab from "./VariablesTab";
import StatisticsTab from "./StatisticsTab";
import PlotsTab from "./PlotsTab";

// Main content component that's agnostic of container type
const ExploreContent: FC<BaseModalProps> = ({ onClose, containerType = "dialog" }) => {
    const [activeTab, setActiveTab] = useState<TabType>("variables");

    // State Hooks
    const variableManager = useVariableManagement();
    const statisticsSettings = useStatisticsSettings();
    const plotsSettings = usePlotsSettings() || {
        boxplotType: 'none',
        setBoxplotType: () => {},
        showStemAndLeaf: false,
        setShowStemAndLeaf: () => {},
        showHistogram: false,
        setShowHistogram: () => {},
        showNormalityPlots: false,
        setShowNormalityPlots: () => {},
        resetPlotsSettings: () => {},
    } as ReturnType<typeof usePlotsSettings>;

    // Load persisted form data on mount
    useEffect(() => {
        (async () => {
            const saved = await getFormData("Explore");
            if (!saved) return;

            // Restore variable selections
            variableManager.resetVariableSelections?.();
            if (Array.isArray(saved.dependentVariables)) {
                saved.dependentVariables.forEach((v: any, idx: number) => {
                    variableManager.moveToDependentVariables(v, idx);
                });
            }
            if (Array.isArray(saved.factorVariables)) {
                saved.factorVariables.forEach((v: any, idx: number) => {
                    variableManager.moveToFactorVariables(v, idx);
                });
            }
            if (saved.labelVariable) {
                variableManager.moveToLabelVariable(saved.labelVariable);
            }

            // Restore statistics settings
            if (typeof saved.showDescriptives === "boolean") {
                statisticsSettings.setShowDescriptives(saved.showDescriptives);
            }
            if (typeof saved.confidenceInterval === "string") {
                statisticsSettings.setConfidenceInterval(saved.confidenceInterval);
            }
            if (typeof saved.showMEstimators === "boolean") {
                statisticsSettings.setShowMEstimators(saved.showMEstimators);
            }
            if (typeof saved.showOutliers === "boolean") {
                statisticsSettings.setShowOutliers(saved.showOutliers);
            }
            if (typeof saved.showPercentiles === "boolean") {
                statisticsSettings.setShowPercentiles(saved.showPercentiles);
            }

            // Restore plots settings
            if (saved.boxplotType) {
                plotsSettings.setBoxplotType(saved.boxplotType);
            }
            if (typeof saved.showStemAndLeaf === "boolean") {
                plotsSettings.setShowStemAndLeaf(saved.showStemAndLeaf);
            }
            if (typeof saved.showHistogram === "boolean") {
                plotsSettings.setShowHistogram(saved.showHistogram);
            }
            if (typeof saved.showNormalityPlots === "boolean") {
                plotsSettings.setShowNormalityPlots(saved.showNormalityPlots);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Analysis Hook
    const analysisParams = {
        dependentVariables: variableManager.dependentVariables,
        factorVariables: variableManager.factorVariables,
        labelVariable: variableManager.labelVariable,
        ...statisticsSettings,
        ...plotsSettings,
    };
    const { runAnalysis, isCalculating, error } = useExploreAnalysis(analysisParams, onClose);

    // Tour guide setup
    const tabControl = useMemo((): TabControlProps => ({
        setActiveTab,
        currentActiveTab: activeTab,
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

    const handleExplore = async () => {
        // Validation is now inside the hook, but we can keep a client-side check
        if (variableManager.dependentVariables.length === 0) {
            // The hook will set its own error, but this provides immediate feedback
            // by switching the tab.
            setActiveTab("variables");
        }
        await runAnalysis();
    };
    
    const handleReset = () => {
        variableManager.resetVariableSelections?.();
        statisticsSettings.resetStatisticsSettings?.();
        plotsSettings.resetPlotsSettings?.();

        // Remove persisted data
        clearFormData("Explore").catch(console.error);

        // error state is managed by analysis hook, might need a resetter there too
        setActiveTab("variables");
    };

    // Persist Explore dialog state
    useEffect(() => {
        const stateToSave = {
            dependentVariables: variableManager.dependentVariables,
            factorVariables: variableManager.factorVariables,
            labelVariable: variableManager.labelVariable,
            // statistics settings
            showDescriptives: statisticsSettings.showDescriptives,
            confidenceInterval: statisticsSettings.confidenceInterval,
            showMEstimators: statisticsSettings.showMEstimators,
            showOutliers: statisticsSettings.showOutliers,
            showPercentiles: statisticsSettings.showPercentiles,
            // plots settings
            boxplotType: plotsSettings.boxplotType,
            showStemAndLeaf: plotsSettings.showStemAndLeaf,
            showHistogram: plotsSettings.showHistogram,
            showNormalityPlots: plotsSettings.showNormalityPlots,
        };

        const hasSelections =
            stateToSave.dependentVariables.length > 0 ||
            stateToSave.factorVariables.length > 0 ||
            stateToSave.labelVariable !== null;

        if (hasSelections) {
            saveFormData("Explore", stateToSave).catch(console.error);
        } else {
            // Clear stored state so removed variables don't linger.
            clearFormData("Explore").catch(console.error);
        }
    }, [
        variableManager.dependentVariables,
        variableManager.factorVariables,
        variableManager.labelVariable,
        statisticsSettings.showDescriptives,
        statisticsSettings.confidenceInterval,
        statisticsSettings.showMEstimators,
        statisticsSettings.showOutliers,
        statisticsSettings.showPercentiles,
        plotsSettings.boxplotType,
        plotsSettings.showStemAndLeaf,
        plotsSettings.showHistogram,
        plotsSettings.showNormalityPlots,
    ]);

    const displayError = useMemo(() => {
        if (error) return error;
        if (variableManager.dependentVariables.length === 0 && isCalculating) {
             return "Please select at least one dependent variable.";
        }
        return null;
    }, [error, isCalculating, variableManager.dependentVariables]);

    return (
        <>
            <Tabs data-testid="explore-tabs" value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="w-full flex flex-col flex-grow overflow-hidden">
                <div className="border-b border-border flex-shrink-0">
                    <TabsList data-testid="explore-tabs-list">
                        <TabsTrigger data-testid="explore-variables-tab" value="variables" id="explore-variables-tab-trigger">Variables</TabsTrigger>
                        <TabsTrigger data-testid="explore-statistics-tab" value="statistics" id="explore-statistics-tab-trigger">Statistics</TabsTrigger>
                        <TabsTrigger data-testid="explore-plots-tab" value="plots" id="explore-plots-tab-trigger">Plots</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="variables" className="p-6 overflow-y-auto flex-grow">
                    <VariablesTab
                        {...variableManager}
                        errorMsg={displayError}
                        containerType={containerType}
                        tourActive={tourActive}
                        currentStep={currentStep}
                        tourSteps={tourSteps}
                    />
                </TabsContent>

                <TabsContent value="statistics" className="p-6 overflow-y-auto flex-grow">
                    <StatisticsTab
                        {...statisticsSettings}
                        containerType={containerType}
                        tourActive={tourActive}
                        currentStep={currentStep}
                        tourSteps={tourSteps}
                    />
                </TabsContent>

                <TabsContent value="plots" className="p-6 overflow-y-auto flex-grow">
                    <PlotsTab
                        {...plotsSettings}
                        factorVariablesCount={variableManager.factorVariables.length}
                        containerType={containerType}
                        tourActive={tourActive}
                        currentStep={currentStep}
                        tourSteps={tourSteps}
                    />
                </TabsContent>
            </Tabs>

            {displayError && (
                <div data-testid="explore-error-message" className="px-6 py-2 text-sm text-destructive bg-destructive/10 border-t border-destructive/20">
                    {displayError}
                </div>
            )}

            <div data-testid="explore-footer" className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                <div className="flex items-center text-muted-foreground cursor-pointer hover:text-primary transition-colors">
                    <Button data-testid="explore-help-button" variant="ghost" size="icon" onClick={startTour} aria-label="Help" className="h-8 w-8">
                        <HelpCircle size={18} />
                    </Button>
                </div>
                <div>
                    <Button data-testid="explore-reset-button" variant="outline" className="mr-2" onClick={handleReset} disabled={isCalculating}>
                        Reset
                    </Button>
                    <Button data-testid="explore-cancel-button" variant="outline" className="mr-2" onClick={onClose} disabled={isCalculating}>
                        Cancel
                    </Button>
                    <Button data-testid="explore-ok-button" onClick={handleExplore} disabled={isCalculating || variableManager.dependentVariables.length === 0}>
                        {isCalculating ? "Processing..." : "OK"}
                    </Button>
                </div>
            </div>
            <AnimatePresence>
                {tourActive && currentTargetElement && (
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
        </>
    );
};

// Main component that handles different container types
const Explore: FC<BaseModalProps> = ({ onClose, containerType = "dialog", ...props }) => {
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <ExploreContent onClose={onClose} containerType={containerType} {...props} />
                </div>
            </div>
        );
    }

    return (
        <DialogContent data-testid="explore-dialog" className="max-w-3xl p-0 bg-popover text-popover-foreground border border-border shadow-md rounded-md flex flex-col max-h-[90vh]">
            <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                <DialogTitle className="text-xl font-semibold">Explore</DialogTitle>
            </DialogHeader>

            <div className="flex-grow flex flex-col overflow-hidden">
                <ExploreContent onClose={onClose} containerType={containerType} {...props} />
            </div>
        </DialogContent>
    );
};

export default Explore;