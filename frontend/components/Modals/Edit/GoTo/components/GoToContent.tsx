"use client";

import React, { useState, FC, useEffect, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BaseModalProps } from "@/types/modalTypes";
import { X, HelpCircle, CheckCircle, AlertCircle, Info, ChevronLeft, ChevronRight } from "lucide-react";
import type { GoToModalProps } from "../types";
import { GoToMode } from "../types";
import { useGoToForm } from "../hooks/useGoToForm";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";
import type { TourStep, PopupPosition, HorizontalPosition } from "./Tour";
import { TourPopup, ActiveElementHighlight } from "./Tour";

export const GoToContent: React.FC<GoToModalProps & { onClose: () => void }> = ({
    onClose,
    defaultMode = GoToMode.CASE,
    initialMode,
}) => {
    const activeMode = initialMode || defaultMode;
    
    const {
        activeTab, setActiveTab, caseNumberInput, handleCaseNumberChange, caseError,
        variableNames, selectedVariableName, handleSelectedVariableChange, variableError,
        totalCases, handleGo, handleClose, lastNavigationSuccess
    } = useGoToForm({ defaultMode: activeMode, onClose });

    const [tourActive, setTourActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [targetElements, setTargetElements] = useState<Record<string, HTMLElement | null>>({});

    const tourSteps = useMemo((): TourStep[] => {
        const commonPrefix: TourStep[] = [
            { title: "Select Mode", content: "First, choose whether you want to navigate to a specific Case (row) or a Variable (column).", targetId: "goto-tabs-wrapper", defaultPosition: 'bottom' as PopupPosition, defaultHorizontalPosition: 'left' as HorizontalPosition, icon: "🎯" },
        ];
        const caseSteps: TourStep[] = [
            { title: "Case Number", content: "Enter the case number (i.e., row number) you want to jump to in the data grid.", targetId: "goto-case-input-wrapper", defaultPosition: 'bottom' as PopupPosition, defaultHorizontalPosition: 'left' as HorizontalPosition, icon: "🔢" },
        ];
        const variableSteps: TourStep[] = [
            { title: "Select Variable", content: "Select the variable (i.e., column) you want to jump to from this list.", targetId: "goto-variable-select-wrapper", defaultPosition: 'bottom' as PopupPosition, defaultHorizontalPosition: 'left' as HorizontalPosition, icon: "📊" },
        ];
        const commonSuffix: TourStep[] = [
            { title: "Navigate", content: "Click 'Go' to instantly move to your selected case or variable in the table.", targetId: "goto-go-button-wrapper", defaultPosition: 'top' as PopupPosition, defaultHorizontalPosition: 'right' as HorizontalPosition, icon: "🚀" },
        ];
        
        return activeTab === GoToMode.CASE 
            ? [...commonPrefix, ...caseSteps, ...commonSuffix]
            : [...commonPrefix, ...variableSteps, ...commonSuffix];
    }, [activeTab]);

    const startTour = useCallback(() => { setCurrentStep(0); setTourActive(true); }, []);
    const nextStep = useCallback(() => { if (currentStep < tourSteps.length - 1) setCurrentStep(prev => prev + 1); }, [currentStep, tourSteps.length]);
    const prevStep = useCallback(() => { if (currentStep > 0) setCurrentStep(prev => prev - 1); }, [currentStep]);
    const endTour = useCallback(() => { setTourActive(false); }, []);

    useEffect(() => {
        if (!tourActive) return;
        const elements: Record<string, HTMLElement | null> = {};
        tourSteps.forEach(step => { elements[step.targetId] = document.getElementById(step.targetId); });
        setTargetElements(elements);
    }, [tourActive, tourSteps]);

    const currentTargetElement = useMemo(() => tourActive ? targetElements[tourSteps[currentStep].targetId] || null : null, [tourActive, currentStep, targetElements, tourSteps]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
            const targetElement = e.target as HTMLElement;
            if (targetElement.tagName === 'INPUT' || targetElement.tagName === 'SELECT' || targetElement.closest('[role="tabpanel"]')) {
                handleGo();
            }
        }
    };

    return (
        <>
            <AnimatePresence>
                {tourActive && (
                    <TourPopup step={tourSteps[currentStep]} currentStep={currentStep} totalSteps={tourSteps.length} onNext={nextStep} onPrev={prevStep} onClose={endTour} targetElement={currentTargetElement} />
                )}
            </AnimatePresence>
            <div className="p-6 overflow-y-auto flex-grow">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Navigation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <div id="goto-tabs-wrapper" className="relative">
                                <TabsList className="w-full mb-6">
                                    <TabsTrigger value={GoToMode.CASE} className="w-1/2">Case</TabsTrigger>
                                    <TabsTrigger value={GoToMode.VARIABLE} className="w-1/2">Variable</TabsTrigger>
                                </TabsList>
                                <ActiveElementHighlight active={tourActive && tourSteps[currentStep]?.targetId === 'goto-tabs-wrapper'} />
                            </div>

                            <TabsContent value={GoToMode.CASE} className="mt-0 space-y-4" onKeyDown={handleKeyDown}>
                                <div id="goto-case-input-wrapper" className="space-y-1 relative">
                                    <div className="flex justify-between items-baseline">
                                        <Label htmlFor="case-number" className="text-xs font-medium text-muted-foreground">Go to case number:</Label>
                                        <span className="text-xs text-muted-foreground">Total: {totalCases}</span>
                                    </div>
                                    <Input id="case-number" type="number" min="1" max={totalCases} value={caseNumberInput} onChange={(e) => handleCaseNumberChange(e.target.value)} className={cn("h-9 text-sm", caseError && "border-destructive focus-visible:ring-destructive")} aria-invalid={!!caseError} aria-describedby={caseError ? "case-error-message" : undefined} />
                                    {caseError && <p id="case-error-message" className="text-xs text-destructive pt-1">{caseError}</p>}
                                    {lastNavigationSuccess !== null && activeTab === GoToMode.CASE && (
                                        <div className={cn("mt-2 p-2 text-xs rounded flex items-center", lastNavigationSuccess ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
                                            {lastNavigationSuccess ? <><CheckCircle className="w-3.5 h-3.5 mr-1.5" />Successfully navigated to case {caseNumberInput}</> : <><AlertCircle className="w-3.5 h-3.5 mr-1.5" />Failed to navigate to case {caseNumberInput}</>}
                                        </div>
                                    )}
                                    <ActiveElementHighlight active={tourActive && tourSteps[currentStep]?.targetId === 'goto-case-input-wrapper'} />
                                </div>
                            </TabsContent>

                            <TabsContent value={GoToMode.VARIABLE} className="mt-0 space-y-4" onKeyDown={handleKeyDown}>
                                <div id="goto-variable-select-wrapper" className="space-y-1 relative">
                                    <div className="flex justify-between items-baseline">
                                        <Label htmlFor="variable-select" className="text-xs font-medium text-muted-foreground">Go to variable:</Label>
                                        <span className="text-xs text-muted-foreground">Total: {variableNames.length}</span>
                                    </div>
                                    <Select value={selectedVariableName} onValueChange={handleSelectedVariableChange}>
                                        <SelectTrigger id="variable-select" className={cn("h-9 text-sm w-full", variableError && "border-destructive focus-visible:ring-destructive")} aria-invalid={!!variableError} aria-describedby={variableError ? "variable-error-message" : undefined}>
                                            <SelectValue placeholder="Select a variable" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[200px]">
                                            {variableNames.map((variable: string) => <SelectItem key={variable} value={variable}>{variable}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    {variableError && <p id="variable-error-message" className="text-xs text-destructive pt-1">{variableError}</p>}
                                    {lastNavigationSuccess !== null && activeTab === GoToMode.VARIABLE && (
                                        <div className={cn("mt-2 p-2 text-xs rounded flex items-center", lastNavigationSuccess ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
                                            {lastNavigationSuccess ? <><CheckCircle className="w-3.5 h-3.5 mr-1.5" />Successfully navigated to variable {selectedVariableName}</> : <><AlertCircle className="w-3.5 h-3.5 mr-1.5" />Failed to navigate to variable {selectedVariableName}</>}
                                        </div>
                                    )}
                                    <ActiveElementHighlight active={tourActive && tourSteps[currentStep]?.targetId === 'goto-variable-select-wrapper'} />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>

            <div className="px-6 py-3 border-t border-border flex items-center justify-end bg-secondary flex-shrink-0">
                <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={handleClose}>Close</Button>
                    <div id="goto-go-button-wrapper" className="relative inline-block">
                        <Button onClick={handleGo} disabled={
                            (activeTab === GoToMode.CASE && (!!caseError || !caseNumberInput)) ||
                            (activeTab === GoToMode.VARIABLE && (!!variableError || !selectedVariableName))
                        }>Go</Button>
                        <ActiveElementHighlight active={tourActive && tourSteps[currentStep]?.targetId === 'goto-go-button-wrapper'} />
                    </div>
                </div>
            </div>
        </>
    );
};