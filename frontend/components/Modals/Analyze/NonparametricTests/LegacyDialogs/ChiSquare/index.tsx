"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { HelpCircle, Loader2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
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
import {
    TooltipProvider,
    Tooltip,
    TooltipTrigger,
    TooltipContent
} from "@/components/ui/tooltip";
import { TourPopup } from "@/components/Common/TourComponents";
import { useVariableStore } from "@/stores/useVariableStore";
import { BaseModalProps } from "@/types/modalTypes";
import {
    useVariableSelection,
    useTestSettings,
    useChiSquareAnalysis,
    useTourGuide,
    baseTourSteps,
} from "./hooks";
import {
    TabControlProps,
    TabType,
} from "./types";

import VariablesTab from "./components/VariablesTab";
import OptionsTab from "./components/OptionsTab";

const ChiSquareContent: FC<BaseModalProps> = ({ onClose, containerType = "dialog" }) => {
    const [activeTab, setActiveTab] = useState<"variables" | "options">("variables");
    const isVariablesLoading = useVariableStore((state: any) => state.isLoading);
    const variablesError = useVariableStore((state: any) => state.error);
    
    const {
        availableVariables,
        testVariables,
        highlightedVariable,
        setHighlightedVariable,
        moveToTestVariables,
        moveToAvailableVariables,
        reorderVariables,
        resetVariableSelection
    } = useVariableSelection();

    const {
        expectedRange,
        setExpectedRange,
        rangeValue,
        setRangeValue,
        expectedValue,
        setExpectedValue,
        expectedValueList,
        setExpectedValueList,
        highlightedExpectedValueIndex,
        setHighlightedExpectedValueIndex,
        displayStatistics,
        setDisplayStatistics,
        addExpectedValue,
        removeExpectedValue,
        changeExpectedValue,
        resetTestSettings
    } = useTestSettings();

    const { 
        isCalculating,
        errorMsg, 
        runAnalysis,
        cancelCalculation
    } = useChiSquareAnalysis({
        testVariables,
        expectedRange,
        rangeValue,
        expectedValue,
        expectedValueList,
        displayStatistics,
        onClose
    });

    const tabControl = useMemo((): TabControlProps => ({
        setActiveTab: (tab: string) => {
            setActiveTab(tab as TabType);
        },
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
    } = useTourGuide(baseTourSteps, containerType, tabControl);

    const handleReset = useCallback(() => {
        resetVariableSelection();
        resetTestSettings();
        cancelCalculation();
    }, [resetVariableSelection, resetTestSettings, cancelCalculation]);

    const handleTabChange = useCallback((value: string) => {
        if (value === 'variables' || value === 'options') {
            setActiveTab(value);
        }
    }, [setActiveTab]);

    useEffect(() => {
        return () => {
            cancelCalculation();
        };
    }, [cancelCalculation]);

    const renderContent = () => {
        if (isVariablesLoading) {
            return (
                <div className="flex items-center justify-center p-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Loading variables...</span>
                </div>
            );
        }

        if (variablesError) {
            return (
                <div className="p-10 text-destructive text-center">
                    <p>Error loading variables:</p>
                    <p className="text-sm">{variablesError.message}</p>
                </div>
            )
        }

        return (
            <>
                <TabsContent value="variables" className="p-6 overflow-y-auto flex-grow">
                    <VariablesTab
                        availableVariables={availableVariables}
                        testVariables={testVariables}
                        highlightedVariable={highlightedVariable}
                        setHighlightedVariable={setHighlightedVariable}
                        moveToTestVariables={moveToTestVariables}
                        moveToAvailableVariables={moveToAvailableVariables}
                        reorderVariables={reorderVariables}
                        tourActive={tourActive}
                        currentStep={currentStep}
                        tourSteps={tourSteps}
                    />
                </TabsContent>

                <TabsContent value="options" className="p-6 overflow-y-auto flex-grow">
                    <OptionsTab
                        displayStatistics={displayStatistics}
                        setDisplayStatistics={setDisplayStatistics}
                        expectedRange={expectedRange}
                        setExpectedRange={setExpectedRange}
                        rangeValue={rangeValue}
                        setRangeValue={setRangeValue}
                        expectedValue={expectedValue}
                        setExpectedValue={setExpectedValue}
                        expectedValueList={expectedValueList}
                        setExpectedValueList={setExpectedValueList}
                        highlightedExpectedValueIndex={highlightedExpectedValueIndex}
                        setHighlightedExpectedValueIndex={setHighlightedExpectedValueIndex}
                        addExpectedValue={addExpectedValue}
                        removeExpectedValue={removeExpectedValue}
                        changeExpectedValue={changeExpectedValue}
                        tourActive={tourActive}
                        currentStep={currentStep}
                        tourSteps={tourSteps}
                    />
                </TabsContent>
            </>
        );
    }

    return (
        <>
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

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full flex flex-col flex-grow overflow-hidden">
                <div className="border-b border-border flex-shrink-0">
                    <TabsList>
                        <TabsTrigger
                            id="variables-tab-trigger"
                            value="variables"
                        >
                            Variables
                        </TabsTrigger>
                        <TabsTrigger
                            id="options-tab-trigger"
                            value="options"
                        >
                            Options
                        </TabsTrigger>
                    </TabsList>
                </div>

                {renderContent()}
            </Tabs>

            {errorMsg && <div className="px-6 py-2 text-destructive">{errorMsg}</div>}

            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                <div className="flex items-center text-muted-foreground">
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
                        variant="outline"
                        className="mr-2"
                        onClick={handleReset}
                        disabled={isCalculating}
                    >
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        className="mr-2"
                        onClick={onClose}
                        disabled={isCalculating}
                    >
                        Cancel
                    </Button>
                    <Button
                        id="chi-square-ok-button"
                        onClick={runAnalysis}
                        disabled={
                            isCalculating ||
                            testVariables.length < 1 ||
                            (!expectedRange.getFromData && (!rangeValue.lowerValue || !rangeValue.upperValue)) ||
                            (!expectedValue.allCategoriesEqual && expectedValueList.length < 2)
                        }
                    >
                        {isCalculating ? "Processing..." : "OK"}
                    </Button>
                </div>
            </div>
        </>
    );
};

const ChiSquare: FC<BaseModalProps> = ({ onClose, containerType = "dialog", ...props }) => {
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <ChiSquareContent onClose={onClose} containerType={containerType} {...props} />
                </div>
            </div>
        );
    }

    return (
        <DialogContent className="max-w-[600px] p-0 bg-popover text-popover-foreground border border-border shadow-md rounded-md flex flex-col max-h-[85vh]">
            <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                <DialogTitle className="text-[22px] font-semibold">Chi-Square Test</DialogTitle>
            </DialogHeader>

            <div className="flex-grow flex flex-col overflow-hidden">
                <ChiSquareContent onClose={onClose} containerType={containerType} {...props} />
            </div>
        </DialogContent>
    );
};

export default ChiSquare;
export { ChiSquareContent };