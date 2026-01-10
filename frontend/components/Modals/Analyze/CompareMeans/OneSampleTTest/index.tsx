"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { HelpCircle, Loader2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
    DialogContent,
    DialogHeader,
    DialogTitle
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
import { toast } from "sonner";
import {
    useVariableSelection,
    useTestSettings,
    useOneSampleTTestAnalysis,
    useTourGuide,
    baseTourSteps,
} from "./hooks";
import {
    TabControlProps,
    TabType,
} from "./types";

import VariablesTab from "./components/VariablesTab";
// import OptionsTab from "./components/OptionsTab";

const OneSampleTTestContent: FC<BaseModalProps> = ({ onClose, containerType = "dialog" }) => {
    const [activeTab, setActiveTab] = useState<TabType>("variables");
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
        testValue,
        setTestValue,
        estimateEffectSize,
        setEstimateEffectSize,
        resetTestSettings
    } = useTestSettings();

    const { 
        isCalculating,
        errorMsg, 
        runAnalysis,
        cancelAnalysis
    } = useOneSampleTTestAnalysis({
        testVariables,
        testValue,
        estimateEffectSize,
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
        cancelAnalysis();
    }, [resetVariableSelection, resetTestSettings, cancelAnalysis]);

    const handleTabChange = useCallback((value: string) => {
        if (value === 'variables') {
            setActiveTab(value);
        }
    }, [setActiveTab]);

    const handleContinue = useCallback(() => {
        if (testVariables.length === 0) {
            toast.warning("Please select at least one variable for testing.");
            return;
        }
        
        runAnalysis();
    }, [testVariables, runAnalysis]);

    useEffect(() => {
        return () => {
            cancelAnalysis();
        };
    }, [cancelAnalysis]);

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
                        testValue={testValue}
                        setTestValue={setTestValue}
                        estimateEffectSize={estimateEffectSize}
                        setEstimateEffectSize={setEstimateEffectSize}
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
                        id="one-sample-t-test-ok-button"
                        onClick={handleContinue}
                        disabled={isCalculating || testVariables.length < 1}
                    >
                        {isCalculating ? "Processing..." : "OK"}
                    </Button>
                </div>
            </div>
        </>
    );
};

// Komponen OneSampleTTest yang menjadi titik masuk utama
const OneSampleTTest: FC<BaseModalProps> = ({ onClose, containerType = "dialog", ...props }) => {
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <OneSampleTTestContent onClose={onClose} containerType={containerType} {...props} />
                </div>
            </div>
        );
    }

    return (
        <DialogContent className="max-w-[600px] p-0 bg-popover text-popover-foreground border border-border shadow-md rounded-md flex flex-col max-h-[85vh]">
            <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                <DialogTitle className="text-[22px] font-semibold">One-Sample T Test</DialogTitle>
            </DialogHeader>

            <div className="flex-grow flex flex-col overflow-hidden">
                <OneSampleTTestContent onClose={onClose} containerType={containerType} {...props} />
            </div>
        </DialogContent>
    );
}

export default OneSampleTTest;
export { OneSampleTTestContent };