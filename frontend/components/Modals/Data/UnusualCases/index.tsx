"use client";

import type { FC} from "react";
import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import type { Variable } from "@/types/Variable";
import { Shapes, Ruler, BarChartHorizontal, HelpCircle } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TourPopup } from "@/components/Common/TourComponents";

import type { TabControlProps } from './hooks/useTourGuide';
import { useTourGuide } from './hooks/useTourGuide';
import { useUnusualCases } from "./hooks/useUnusualCases";
import { baseTourSteps } from './tourConfig';
import type { IdentifyUnusualCasesProps, TabType, VariablesTabProps, OptionsTabProps } from "./types";

import VariablesTab from "./VariablesTab";
import OptionsTab from "./OptionsTab";

const getVariableIcon = (variable: Variable) => {
    switch (variable.measure) {
        case "scale": return <Ruler size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
        case "nominal": return <Shapes size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
        case "ordinal": return <BarChartHorizontal size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
        default: return variable.type === "STRING"
            ? <Shapes size={14} className="text-muted-foreground mr-1 flex-shrink-0" />
            : <Ruler size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
    }
};

const getDisplayName = (variable: Variable): string => {
    return variable.label ? `${variable.label} [${variable.name}]` : variable.name;
};

const UnusualCasesContent: FC<IdentifyUnusualCasesProps> = ({ 
    onClose,
    containerType = "dialog" 
}) => {
    const [activeTab, setActiveTab] = useState<TabType>("variables");
    const hookProps = useUnusualCases({ onClose });

    const tabControl = useMemo((): TabControlProps => ({
        setActiveTab: (newTab) => setActiveTab(newTab as TabType),
        currentActiveTab: activeTab,
    }), [activeTab]);

    const { 
        tourActive, currentStep, tourSteps, currentTargetElement, 
        startTour, nextStep, prevStep, endTour 
    } = useTourGuide(baseTourSteps, containerType, tabControl);

    const variablesTabProps: VariablesTabProps = { ...hookProps, getVariableIcon, getDisplayName, tourActive, currentStep, tourSteps };
    const optionsTabProps: OptionsTabProps = { ...hookProps, tourActive, currentStep, tourSteps };

    return (
        <>
            <div className={`flex flex-col ${containerType === "sidebar" ? "h-full" : "max-h-[85vh]"} overflow-hidden`}>
                {containerType === "dialog" && (
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle className="text-xl font-semibold" data-testid="unusualcases-dialog-title">Identify Unusual Cases</DialogTitle>
                    </DialogHeader>
                )}

                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="flex-grow flex flex-col">
                    <div className="border-b">
                        <TabsList className="bg-muted rounded-none h-9 p-0">
                            <TabsTrigger data-testid="unusual-cases-variables-tab" id="variables-tab-trigger" value="variables" className="px-3 h-8 rounded-none text-xs">Variables</TabsTrigger>
                            <TabsTrigger data-testid="unusual-cases-options-tab" id="options-tab-trigger" value="options" className="px-3 h-8 rounded-none text-xs">Options</TabsTrigger>
                        </TabsList>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto">
                        <TabsContent value="variables" className="p-4"><VariablesTab {...variablesTabProps} /></TabsContent>
                        <TabsContent value="options" className="p-4"><OptionsTab {...optionsTabProps} /></TabsContent>
                    </div>
                </Tabs>

                <DialogFooter className="px-6 py-3 border-t flex items-center justify-between bg-secondary flex-shrink-0">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={startTour} className="text-muted-foreground hover:text-foreground">
                                    <HelpCircle size={18} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Start Guided Tour</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <div>
                        <Button variant="outline" className="mr-2" onClick={hookProps.handleReset} data-testid="unusualcases-reset-button">Reset</Button>
                        <Button variant="outline" className="mr-2" onClick={onClose} data-testid="unusualcases-cancel-button">Cancel</Button>
                        <Button onClick={hookProps.handleConfirm} data-testid="unusualcases-ok-button">OK</Button>
                    </div>
                </DialogFooter>
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

const IdentifyUnusualCases: FC<IdentifyUnusualCasesProps> = ({ 
    onClose,
    containerType = "dialog" 
}) => {
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <UnusualCasesContent onClose={onClose} containerType={containerType} />
                </div>
            </div>
        );
    }

    return (
        <Dialog open={true} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-4xl w-full p-0 flex flex-col" data-testid="unusualcases-dialog-content">
                <UnusualCasesContent onClose={onClose} containerType={containerType} />
            </DialogContent>
        </Dialog>
    );
};

export default IdentifyUnusualCases;