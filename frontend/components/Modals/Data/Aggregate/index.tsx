"use client";

import type { FC} from "react";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    // DialogFooter, // Not used directly if buttons are custom
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
// import { Separator } from "@/components/ui/separator"; // Not used
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { useModal } from "@/hooks/useModal";
import type { AggregateDataProps, TourStep, HorizontalPosition } from "./types";
import { PopupPosition } from "./types"; // AggregatedVariable is used by the hook
import { ErrorDialog } from "./dialogs/ErrorDialog";
import { FunctionDialog } from "./dialogs/FunctionDialog";
import { NameLabelDialog } from "./dialogs/NameLabelDialog";
import VariablesTab from "./VariablesTab";
import OptionsTab from "./OptionsTab";

import { useAggregateData } from "./hooks/useAggregateData";
import { HelpCircle, X, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

// Tour steps definition
const baseTourSteps: TourStep[] = [
    {
        title: "Available Variables",
        content: "This list contains all available variables. Select variables from here to define groups or to summarize.",
        targetId: "aggregate-available-vars-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'right',
        icon: "📋",
        tab: 'variables'
    },
    {
        title: "Move to Break Variables",
        content: "Select a variable and click this button to use it as a grouping (break) variable.",
        targetId: "aggregate-to-break-arrow",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "➡️",
        tab: 'variables'
    },
    {
        title: "Break Variables",
        content: "Variables in this list define the groups. The data will be aggregated for each unique combination of these variables.",
        targetId: "aggregate-break-vars-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "📦",
        tab: 'variables'
    },
    {
        title: "Move to Aggregated Variables",
        content: "Select a variable and click this button to create a summary statistic for it.",
        targetId: "aggregate-to-aggregated-arrow",
        defaultPosition: 'top',
        defaultHorizontalPosition: 'left',
        icon: "➡️",
        tab: 'variables'
    },
    {
        title: "Aggregated Variables",
        content: "These are the variables that will be summarized (e.g., calculating the mean of 'Salary').",
        targetId: "aggregate-aggregated-vars-wrapper",
        defaultPosition: 'top',
        defaultHorizontalPosition: 'left',
        icon: "📊",
        tab: 'variables'
    },
    {
        title: "Change Function",
        content: "Select a variable above and click here to change its summary function (e.g., Mean, Sum, Count).",
        targetId: "aggregate-function-button",
        defaultPosition: 'top',
        defaultHorizontalPosition: 'left',
        icon: "🔧",
        tab: 'variables'
    },
    {
        title: "Name & Label",
        content: "Customize the name and label for the new summary variable that will be created.",
        targetId: "aggregate-name-label-button",
        defaultPosition: 'top',
        defaultHorizontalPosition: 'left',
        icon: "✏️",
        tab: 'variables'
    },
    {
        title: "Number of Cases",
        content: "Optionally, create a variable that counts the number of cases in each group. You can also name it here.",
        targetId: "aggregate-n-cases-wrapper",
        defaultPosition: 'top',
        defaultHorizontalPosition: 'left',
        icon: "🔢",
        tab: 'variables'
    },
    {
        title: "Performance Options",
        content: "Switch to the Options tab to configure settings for large datasets.",
        targetId: "aggregate-options-tab-trigger",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "⚙️",
        tab: 'variables'
    },
    {
        title: "Pre-sorted File",
        content: "If your data is already sorted by the break variable(s), check this to improve performance.",
        targetId: "aggregate-option-sorted-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "✅",
        tab: 'options'
    },
    {
        title: "Sort Before Aggregating",
        content: "Check this to sort the file before aggregating. This is recommended for large, unsorted datasets.",
        targetId: "aggregate-option-sort-before-wrapper",
        defaultPosition: 'top',
        defaultHorizontalPosition: 'left',
        icon: "⏳",
        tab: 'options'
    },
    {
        title: "Execute Aggregation",
        content: "Once you're done, click OK to perform the aggregation and add the new summary variables to your dataset.",
        targetId: "aggregate-ok-button",
        defaultPosition: 'top',
        defaultHorizontalPosition: 'right',
        icon: "🚀",
        tab: 'variables' // User will be on this tab most likely
    }
];

// Portal wrapper to ensure popup is always on top
const TourPopupPortal: FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);
    
    if (!mounted || typeof window === "undefined") return null;
    
    return createPortal(children, document.body);
};

// Tour Popup Component
const TourPopup: FC<{
    step: TourStep;
    currentStep: number;
    totalSteps: number;
    onNext: () => void;
    onPrev: () => void;
    onClose: () => void;
    targetElement: HTMLElement | null;
}> = ({ step, currentStep, totalSteps, onNext, onPrev, onClose, targetElement }) => {
    const position = step.position || step.defaultPosition;
    const horizontalPosition = step.horizontalPosition;
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
    const popupRef = useRef<HTMLDivElement>(null);
    
    // Dynamically calculate position
    useEffect(() => {
        if (!targetElement) return;
        
        const updatePosition = () => {
            const rect = targetElement.getBoundingClientRect();
            const popupHeight = popupRef.current?.offsetHeight || 170;
            const popupWidth = 280;
            const popupBuffer = 20;
            let top: number, left: number;
            
            if (horizontalPosition === 'left') {
                left = Math.max(10, rect.left - 300);
                top = rect.top + (rect.height / 2) - 100;
            } else {
                if (position === 'top') {
                    top = rect.top - (popupHeight + popupBuffer);
                    if (top < 20) {
                        top = rect.bottom + popupBuffer;
                        step.position = 'bottom';
                    }
                } else {
                    top = rect.bottom + popupBuffer;
                }
                
                const elementWidth = rect.width;
                left = rect.left + (elementWidth / 2) - (popupWidth / 2);
                
                if (elementWidth < 100) {
                    const rightSpace = window.innerWidth - rect.right;
                    const leftSpace = rect.left;
                    if (rightSpace >= popupWidth + popupBuffer) {
                        left = rect.right + popupBuffer;
                    } else if (leftSpace >= popupWidth + popupBuffer) {
                        left = rect.left - (popupWidth + popupBuffer);
                    }
                }

                if (horizontalPosition === 'right') {
                    left = rect.right - popupWidth;
                }
                
                if (left < 10) left = 10;
                if (left + popupWidth > window.innerWidth - 10) {
                    left = window.innerWidth - (popupWidth + 10);
                }
            }
            
            setPopupPosition({ top, left });
        };
        
        updatePosition();
        const timer = setTimeout(updatePosition, 100);
        
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        
        return () => {
            clearTimeout(timer);
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [targetElement, position, horizontalPosition, step]);

    // Arrow styling
    const getArrowStyles = () => {
        const arrowClasses = "w-3 h-3 bg-white dark:bg-gray-800";
        const borderClasses = "border-primary/10 dark:border-primary/20";
        
        if (horizontalPosition !== 'left') {
            if (position === 'top') {
                return <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 ${arrowClasses} border-b border-r ${borderClasses}`} />;
            }
            if (position === 'bottom') {
                return <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 ${arrowClasses} border-t border-l ${borderClasses}`} />;
            }
        } else if (horizontalPosition === 'left') {
            return <div className={`absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 rotate-45 ${arrowClasses} border-t border-r ${borderClasses}`} />;
        }
        return null;
    };

    return (
        <TourPopupPortal>
            <motion.div
                initial={{ opacity: 0, y: position === 'top' ? 10 : -10, x: horizontalPosition === 'left' ? -10 : 0 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ position: 'fixed', top: `${popupPosition.top}px`, left: `${popupPosition.left}px`, width: '280px', zIndex: 99999, pointerEvents: 'auto' }}
                className="popup-tour-fixed"
            >
                <Card ref={popupRef} className={cn("shadow-lg border-primary/10 dark:border-primary/20 rounded-lg", "relative backdrop-blur-sm bg-white/90 dark:bg-gray-800/90")}>
                    {getArrowStyles()}
                    <CardHeader className="p-3 pb-2 border-b border-primary/10 dark:border-primary/20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {step.icon && <span className="text-lg">{step.icon}</span>}
                                <CardTitle className="text-base font-medium">{step.title}</CardTitle>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 rounded-full hover:bg-primary/10">
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Langkah {currentStep + 1} dari {totalSteps}</div>
                    </CardHeader>
                    <CardContent className="p-3 text-sm">
                        <div className="flex space-x-2">
                            <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            <p>{step.content}</p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between p-3 pt-2 border-t border-primary/10 dark:border-primary/20">
                        <div>
                            {currentStep !== 0 && (
                                <Button variant="outline" size="sm" onClick={onPrev} className="h-7 px-2 py-0">
                                    <ChevronLeft className="mr-1 h-3 w-3" />
                                    <span className="text-xs">Sebelumnya</span>
                                </Button>
                            )}
                        </div>
                        <div>
                            {currentStep + 1 !== totalSteps ? (
                                <Button size="sm" onClick={onNext} className="h-7 px-2 py-0">
                                    <span className="text-xs">Lanjut</span>
                                    <ChevronRight className="ml-1 h-3 w-3" />
                                </Button>
                            ) : (
                                <Button size="sm" onClick={onClose} className="h-7 px-2 py-0 bg-green-600 hover:bg-green-700">
                                    <span className="text-xs">Selesai</span>
                                </Button>
                            )}
                        </div>
                    </CardFooter>
                </Card>
            </motion.div>
        </TourPopupPortal>
    );
};

// Main content component that's agnostic of container type
const AggregateContent: FC<AggregateDataProps> = ({ onClose, containerType = "dialog" }) => {
    const { closeModal } = useModal();

    const {
        availableVariables,
        breakVariables,
        aggregatedVariables,
        activeTab, setActiveTab,
        highlightedVariable,
        errorMessage,
        errorDialogOpen, setErrorDialogOpen,
        functionDialogOpen, setFunctionDialogOpen,
        functionCategory, setFunctionCategory,
        selectedFunction, setSelectedFunction,
        percentageType, setPercentageType,
        percentageValue, setPercentageValue,
        percentageLow, setPercentageLow,
        percentageHigh, setPercentageHigh,
        nameDialogOpen, setNameDialogOpen,
        newVariableName, setNewVariableName,
        newVariableLabel, setNewVariableLabel,
        currentEditingVariable,
        isAlreadySorted, setIsAlreadySorted,
        sortBeforeAggregating, setSortBeforeAggregating,
        breakName, setBreakName,
        getDisplayName,
        handleVariableSelect,
        handleAggregatedVariableSelect,
        handleVariableDoubleClick,
        handleAggregatedDoubleClick,
        moveToBreak,
        moveFromBreak,
        moveToAggregated,
        moveFromAggregated,
        reorderBreakVariables,
        reorderAggregatedVariables,
        handleTopArrowClick,
        handleBottomArrowClick,
        handleFunctionClick,
        handleNameLabelClick,
        applyFunction,
        applyNameLabel,
        handleReset,
        handleConfirm,
        addNumberOfCases,
        setAddNumberOfCases,
    } = useAggregateData();

    // Tour state
    const [tourActive, setTourActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [tourSteps, setTourSteps] = useState<TourStep[]>([]);
    const [targetElements, setTargetElements] = useState<Record<string, HTMLElement | null>>({});

    // Tour control functions
    const startTour = useCallback(() => {
        setCurrentStep(0);
        // If the first step is not on the current tab, switch to it
        if (baseTourSteps[0]?.tab && baseTourSteps[0].tab !== activeTab) {
            setActiveTab(baseTourSteps[0].tab);
        }
        setTourActive(true);
    }, [activeTab, setActiveTab]);
    
    const nextStep = useCallback(() => {
        if (currentStep < tourSteps.length - 1) {
            const nextStepIndex = currentStep + 1;
            const nextStepData = tourSteps[nextStepIndex];
            if (nextStepData.tab && nextStepData.tab !== activeTab) {
                setActiveTab(nextStepData.tab);
            }
            setCurrentStep(nextStepIndex);
        }
    }, [currentStep, tourSteps, activeTab, setActiveTab]);
    
    const prevStep = useCallback(() => {
        if (currentStep > 0) {
            const prevStepIndex = currentStep - 1;
            const prevStepData = tourSteps[prevStepIndex];
            if (prevStepData.tab && prevStepData.tab !== activeTab) {
                setActiveTab(prevStepData.tab);
            }
            setCurrentStep(prevStepIndex);
        }
    }, [currentStep, tourSteps, activeTab, setActiveTab]);
    
    const endTour = useCallback(() => {
        setTourActive(false);
    }, []);
    
    // Adjust tour steps based on container type
    useEffect(() => {
        const adjustedSteps = baseTourSteps.map(step => {
            if (containerType === "sidebar" || containerType === "panel") {
                return { ...step, horizontalPosition: "left" as HorizontalPosition, position: undefined };
            } else {
                return { ...step, horizontalPosition: null, position: step.defaultPosition };
            }
        });
        setTourSteps(adjustedSteps);
    }, [containerType]);
    
    // Get DOM element references when tour is active
    useEffect(() => {
        if (!tourActive) return;
        
        const elements: Record<string, HTMLElement | null> = {};
        baseTourSteps.forEach(step => {
            elements[step.targetId] = document.getElementById(step.targetId);
        });
        
        setTargetElements(elements);
    }, [tourActive, activeTab]); // Re-check elements if tab changes
    
    // Get current target element
    const currentTargetElement = useMemo(() => {
        if (!tourActive || !tourSteps.length || currentStep >= tourSteps.length) return null;
        return targetElements[tourSteps[currentStep].targetId] || null;
    }, [tourActive, tourSteps, currentStep, targetElements]);

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

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-grow overflow-hidden">
                <div className="border-b border-border flex-shrink-0">
                    <TabsList>
                        <TabsTrigger data-testid="aggregate-variables-tab" value="variables">Variables</TabsTrigger>
                        <TabsTrigger data-testid="aggregate-options-tab" id="aggregate-options-tab-trigger" value="options">Options</TabsTrigger>
                        {/* <TabsTrigger
                            value="save"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'save' ? 'bg-background border-t border-l border-r border-border text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
                        >
                            Save
                        </TabsTrigger> */}
                    </TabsList>
                </div>

                <TabsContent value="variables" className="p-6 overflow-y-auto flex-grow">
                    <VariablesTab
                        availableVariables={availableVariables}
                        breakVariables={breakVariables}
                        aggregatedVariables={aggregatedVariables}
                        highlightedVariable={highlightedVariable}
                        breakName={breakName}
                        setBreakName={setBreakName}
                        addNumberOfCases={addNumberOfCases}
                        setAddNumberOfCases={setAddNumberOfCases}
                        handleVariableSelect={handleVariableSelect}
                        handleVariableDoubleClick={handleVariableDoubleClick}
                        handleAggregatedVariableSelect={handleAggregatedVariableSelect}
                        handleAggregatedDoubleClick={handleAggregatedDoubleClick}
                        handleTopArrowClick={handleTopArrowClick}
                        handleBottomArrowClick={handleBottomArrowClick}
                        handleFunctionClick={handleFunctionClick}
                        handleNameLabelClick={handleNameLabelClick}
                        getDisplayName={getDisplayName}
                        moveToBreak={moveToBreak}
                        moveFromBreak={moveFromBreak}
                        moveToAggregated={moveToAggregated}
                        moveFromAggregated={moveFromAggregated}
                        reorderBreakVariables={reorderBreakVariables}
                        reorderAggregatedVariables={reorderAggregatedVariables}
                        containerType={containerType}
                        tourActive={tourActive}
                        currentStep={currentStep}
                        tourSteps={tourSteps}
                    />
                </TabsContent>

                <TabsContent value="options" className="p-6 overflow-y-auto flex-grow">
                    <OptionsTab
                        isAlreadySorted={isAlreadySorted}
                        setIsAlreadySorted={setIsAlreadySorted}
                        sortBeforeAggregating={sortBeforeAggregating}
                        setSortBeforeAggregating={setSortBeforeAggregating}
                        containerType={containerType}
                        tourActive={tourActive}
                        currentStep={currentStep}
                        tourSteps={tourSteps}
                    />
                </TabsContent>
                {/* <TabsContent value="save" className="p-6 overflow-y-auto flex-grow">
                    <SaveTab 
                        saveOption={saveOption} 
                        setSaveOption={setSaveOption} 
                        datasetName={datasetName} 
                        setDatasetName={setDatasetName} 
                        filePath={filePath} 
                        setFilePath={setFilePath} 
                    />
                </TabsContent> */}
            </Tabs>

            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                {/* Left: Help icon */}
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
                {/* Right: Buttons */}
                <div>
                    <Button
                        variant="outline"
                        className="mr-2"
                        onClick={handleReset}
                        data-testid="aggregate-reset-button"
                    >
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        className="mr-2"
                        onClick={onClose}
                        data-testid="aggregate-cancel-button"
                    >
                        Cancel
                    </Button>
                    <Button
                        id="aggregate-ok-button"
                        data-testid="aggregate-ok-button"
                        onClick={() => handleConfirm(closeModal)}
                    >
                        OK
                    </Button>
                </div>
            </div>

            <FunctionDialog
                open={functionDialogOpen}
                onOpenChange={setFunctionDialogOpen}
                currentEditingVariable={currentEditingVariable}
                functionCategory={functionCategory}
                setFunctionCategory={setFunctionCategory}
                selectedFunction={selectedFunction}
                setSelectedFunction={setSelectedFunction}
                percentageType={percentageType}
                setPercentageType={setPercentageType}
                percentageValue={percentageValue}
                setPercentageValue={setPercentageValue}
                percentageLow={percentageLow}
                setPercentageLow={setPercentageLow}
                percentageHigh={percentageHigh}
                setPercentageHigh={setPercentageHigh}
                onApply={applyFunction}
            />

            <NameLabelDialog
                open={nameDialogOpen}
                onOpenChange={setNameDialogOpen}
                currentEditingVariable={currentEditingVariable}
                newVariableName={newVariableName}
                setNewVariableName={setNewVariableName}
                newVariableLabel={newVariableLabel}
                setNewVariableLabel={setNewVariableLabel}
                onApply={applyNameLabel}
            />

            <ErrorDialog
                open={errorDialogOpen}
                onOpenChange={setErrorDialogOpen}
                errorMessage={errorMessage}
            />
        </>
    );
};

// Main component that handles different container types
const Aggregate: FC<AggregateDataProps> = ({ onClose, containerType = "dialog" }) => {
    // If sidebar mode, use a div container without header (header is provided by SidebarContainer)
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <AggregateContent onClose={onClose} containerType={containerType} />
                </div>
            </div>
        );
    }

    // For dialog mode, use Dialog and DialogContent
    return (
        <Dialog open={true} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-[650px] p-0" data-testid="aggregate-dialog-content">
                <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0" data-testid="aggregate-dialog-header">
                    <DialogTitle className="text-[22px] font-semibold text-foreground" data-testid="aggregate-dialog-title">Aggregate Data</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground" data-testid="aggregate-dialog-description">
                        Create summary statistics for variables, grouped by one or more break variables.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-grow flex flex-col overflow-hidden">
                    <AggregateContent onClose={onClose} containerType={containerType} />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default Aggregate;