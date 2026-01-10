"use client";

import type { FC} from "react";
import React, { useMemo, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import type { Variable } from "@/types/Variable";
import {
    Shapes,
    Ruler,
    BarChartHorizontal,
    AlertCircle,
    HelpCircle
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { TourPopup } from "@/components/Common/TourComponents";
import VariableTab from "./VariableTab";
import OptionsTab from "./OptionsTab";
import type { DuplicateCasesProps, TabType, VariableTabProps, OptionsTabProps, DuplicateCasesSource } from "./types";
import { useDuplicateCases } from "./hooks/useDuplicateCases";
import type { TabControlProps } from "./hooks/useTourGuide";
import { useTourGuide } from "./hooks/useTourGuide";

// Main content component separated from container logic
const DuplicateCasesContent: FC<DuplicateCasesProps> = ({ onClose, containerType = "dialog" }) => {
    const [activeTab, setActiveTab] = useState<TabType>("variables");
    const {
        sourceVariables,
        matchingVariables,
        sortingVariables,
        highlightedVariable, setHighlightedVariable,
        sortOrder, setSortOrder,
        primaryCaseIndicator, setPrimaryCaseIndicator,
        primaryName, setPrimaryName,
        sequentialCount, setSequentialCount,
        sequentialName, setSequentialName,
        moveMatchingToTop, setMoveMatchingToTop,
        errorMessage, errorDialogOpen, setErrorDialogOpen,
        isProcessing,
        handleMoveVariable,
        handleReorderVariable,
        handleReset,
        handleConfirm,
        displayFrequencies,
        setDisplayFrequencies,
        filterByIndicator,
        setFilterByIndicator,
    } = useDuplicateCases({ onClose });

    const handleResetClick = () => {
        handleReset();
        setActiveTab("variables");
    };

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

    const getVariableIcon = (variable: Variable) => {
        switch (variable.measure) {
            case "scale":
                return <Ruler size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
            case "nominal":
                return <Shapes size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
            case "ordinal":
                return <BarChartHorizontal size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
            default:
                return variable.type === "STRING"
                    ? <Shapes size={14} className="text-muted-foreground mr-1 flex-shrink-0" />
                    : <Ruler size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
        }
    };

    const getDisplayName = (variable: Variable): string => {
        if (variable.label) {
            return `${variable.label} [${variable.name}]`;
        }
        return variable.name;
    };

    // Adapt the props from the hook to match what the child components expect
    const variableTabProps: VariableTabProps = {
        sourceVariables,
        matchingVariables,
        sortingVariables,
        highlightedVariable: highlightedVariable as { id: string, source: DuplicateCasesSource } | null,
        setHighlightedVariable: setHighlightedVariable as (value: { id: string, source: DuplicateCasesSource } | null) => void,
        sortOrder: sortOrder === "ascending" ? 'asc' : 'desc',
        setSortOrder: (order: 'asc' | 'desc') => setSortOrder(order === 'asc' ? 'ascending' : 'descending'),
        handleMoveVariable,
        handleReorderVariable,
        getVariableIcon,
        getDisplayName,
        containerType,
        tourActive,
        currentStep,
        tourSteps,
    };

    const optionsTabProps: OptionsTabProps = {
        primaryCaseIndicator,
        setPrimaryCaseIndicator,
        primaryName,
        setPrimaryName,
        sequentialCount,
        setSequentialCount,
        sequentialName,
        setSequentialName,
        moveMatchingToTop,
        setMoveMatchingToTop,
        displayFrequencies,
        setDisplayFrequencies,
        filterByIndicator,
        setFilterByIndicator,
        containerType,
        tourActive,
        currentStep,
        tourSteps
    };

    return (
        <>
            <div className={`flex flex-col ${containerType === "sidebar" ? "h-full overflow-hidden" : "max-h-[85vh]"}`}>
                {containerType === "dialog" && (
                    <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                        <DialogTitle className="text-[22px] font-semibold text-foreground">Identify Duplicate Cases</DialogTitle>
                    </DialogHeader>
                )}

                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="w-full flex flex-col flex-grow overflow-hidden">
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

                    <TabsContent value="variables" className="p-6 overflow-y-auto flex-grow">
                        <VariableTab {...variableTabProps} />
                    </TabsContent>

                    <TabsContent value="options" className="p-6 overflow-y-auto flex-grow">
                        <OptionsTab {...optionsTabProps} />
                    </TabsContent>
                </Tabs>

                <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                    <Button variant="ghost" size="icon" onClick={startTour} className="text-muted-foreground hover:text-foreground">
                        <HelpCircle size={20} />
                    </Button>
                    
                    <div>
                        <Button
                            variant="outline"
                            className="mr-2"
                            onClick={handleResetClick}
                            disabled={isProcessing}
                            data-testid="duplicatecases-reset-button"
                        >
                            Reset
                        </Button>
                        <Button
                            variant="outline"
                            className="mr-2"
                            onClick={onClose}
                            disabled={isProcessing}
                            data-testid="duplicatecases-cancel-button"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={isProcessing}
                            data-testid="duplicatecases-ok-button"
                        >
                            {isProcessing ? "Processing..." : "OK"}
                        </Button>
                    </div>
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

            {errorDialogOpen && (
                <Dialog open={true} onOpenChange={setErrorDialogOpen}>
                    <DialogContent role="dialog" aria-label="IBM SPSS Statistics" className="max-w-[400px] p-6 bg-popover border border-border shadow-md rounded-md">
                        <DialogHeader className="mb-4">
                            <DialogTitle className="text-[18px] font-semibold text-popover-foreground">IBM SPSS Statistics</DialogTitle>
                        </DialogHeader>
                        <div className="flex gap-4 items-start">
                            <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-popover-foreground">{errorMessage}</p>
                        </div>
                        <DialogFooter className="mt-6">
                            <Button
                                className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4"
                                onClick={() => setErrorDialogOpen(false)}
                                data-testid="duplicatecases-error-ok-button"
                            >
                                OK
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
};

// Main component that handles different container types
const DuplicateCases: FC<DuplicateCasesProps> = ({ onClose, containerType = "dialog" }) => {
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <DuplicateCasesContent onClose={onClose} containerType={containerType} />
                </div>
            </div>
        );
    }

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl w-full p-0 flex flex-col" data-testid="duplicatecases-dialog-content">
                <DuplicateCasesContent onClose={onClose} containerType={containerType} />
            </DialogContent>
        </Dialog>
    );
};

export default DuplicateCases;