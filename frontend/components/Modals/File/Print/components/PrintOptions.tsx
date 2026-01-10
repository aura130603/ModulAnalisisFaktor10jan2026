"use client";

import type { FC} from "react";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Printer, HelpCircle, X, Info, ChevronLeft, ChevronRight } from "lucide-react";
import type { PrintOptionsProps, PaperSize, SelectedOptions } from "../types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

// Tipe data untuk tour
type PopupPosition = 'top' | 'bottom';
type HorizontalPosition = 'left' | 'right';

type TourStep = {
    title: string;
    content: string;
    targetId: string;
    defaultPosition: PopupPosition;
    defaultHorizontalPosition: HorizontalPosition;
    position?: PopupPosition;
    horizontalPosition?: HorizontalPosition | null;
    icon: string;
};

// Data langkah tour
const baseTourSteps: TourStep[] = [
    {
        title: "File Name",
        content: "Specify the name of the PDF file that will be generated.",
        targetId: "print-filename-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "📝",
    },
    {
        title: "Content to Print",
        content: "Select which parts of your project to include: Data View, Variable View, or analysis results.",
        targetId: "print-content-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "✅",
    },
    {
        title: "Paper Size",
        content: "Choose the paper size for your PDF document, such as A4 or Letter.",
        targetId: "print-paper-size-wrapper",
        defaultPosition: 'top',
        defaultHorizontalPosition: 'left',
        icon: "📄",
    },
    {
        title: "Generate PDF",
        content: "Click here to generate and download the PDF file with your selected options.",
        targetId: "print-button-wrapper",
        defaultPosition: 'top',
        defaultHorizontalPosition: 'right',
        icon: "🖨️",
    }
];

// Portal wrapper
const TourPopupPortal: FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); return () => setMounted(false); }, []);
    if (!mounted || typeof window === "undefined") return null;
    return createPortal(children, document.body);
};

// Komponen Tour Popup
const TourPopup: FC<{
    step: TourStep;
    currentStep: number;
    totalSteps: number;
    onNext: () => void;
    onPrev: () => void;
    onClose: () => void;
    targetElement: HTMLElement | null;
}> = ({ step, currentStep, totalSteps, onNext, onPrev, onClose, targetElement }) => {
    const position = step.position ?? step.defaultPosition;
    const horizontalPosition = step.horizontalPosition;
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
    const popupRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (!targetElement) return;
        const updatePosition = () => {
            const rect = targetElement.getBoundingClientRect();
            const popupHeight = popupRef.current?.offsetHeight ?? 170;
            const popupWidth = 280;
            const popupBuffer = 20;
            let top: number, left: number;
            
            if (horizontalPosition === 'left') {
                left = Math.max(10, rect.left - 300);
                top = rect.top + (rect.height / 2) - 100;
            } else {
                if (position === 'top') {
                    top = rect.top - (popupHeight + popupBuffer);
                    if (top < 20) { top = rect.bottom + popupBuffer; step.position = 'bottom'; }
                } else {
                    top = rect.bottom + popupBuffer;
                }
                const elementWidth = rect.width;
                left = rect.left + (elementWidth / 2) - (popupWidth / 2);
                if (elementWidth < 100) {
                    const rightSpace = window.innerWidth - rect.right;
                    const leftSpace = rect.left;
                    if (rightSpace >= popupWidth + popupBuffer) left = rect.right + popupBuffer;
                    else if (leftSpace >= popupWidth + popupBuffer) left = rect.left - (popupWidth + popupBuffer);
                }
                if (horizontalPosition === 'right') left = rect.right - popupWidth;
                if (left < 10) left = 10;
                if (left + popupWidth > window.innerWidth - 10) left = window.innerWidth - (popupWidth + 10);
            }
            setPopupPosition({ top, left });
        };
        updatePosition();
        const timer = setTimeout(updatePosition, 100);
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        return () => { clearTimeout(timer); window.removeEventListener('scroll', updatePosition, true); window.removeEventListener('resize', updatePosition); };
    }, [targetElement, position, horizontalPosition, step]);

    const getArrowStyles = () => {
        const arrowClasses = "w-3 h-3 bg-white dark:bg-gray-800";
        const borderClasses = "border-primary/10 dark:border-primary/20";
        if (horizontalPosition !== 'left') {
            if (position === 'top') return <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 ${arrowClasses} border-b border-r ${borderClasses}`} />;
            if (position === 'bottom') return <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 ${arrowClasses} border-t border-l ${borderClasses}`} />;
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
                <Card ref={popupRef} className="shadow-lg border-primary/10 dark:border-primary/20 rounded-lg relative backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
                    {getArrowStyles()}
                    <CardHeader className="p-3 pb-2 border-b border-primary/10 dark:border-primary/20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {step.icon && <span className="text-lg">{step.icon}</span>}
                                <CardTitle className="text-base font-medium">{step.title}</CardTitle>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 rounded-full hover:bg-primary/10"><X className="h-3 w-3" /></Button>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Step {currentStep + 1} of {totalSteps}</div>
                    </CardHeader>
                    <CardContent className="p-3 text-sm">
                        <div className="flex space-x-2">
                            <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            <p>{step.content}</p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between p-3 pt-2 border-t border-primary/10 dark:border-primary/20">
                        <div>{currentStep > 0 && <Button variant="outline" size="sm" onClick={onPrev} className="h-7 px-2 py-0"><ChevronLeft className="mr-1 h-3 w-3" /><span className="text-xs">Prev</span></Button>}</div>
                        <div>
                            {currentStep < totalSteps - 1 ? (
                                <Button size="sm" onClick={onNext} className="h-7 px-2 py-0"><span className="text-xs">Next</span><ChevronRight className="ml-1 h-3 w-3" /></Button>
                            ) : (
                                <Button size="sm" onClick={onClose} className="h-7 px-2 py-0 bg-green-600 hover:bg-green-700"><span className="text-xs">Finish</span></Button>
                            )}
                        </div>
                    </CardFooter>
                </Card>
            </motion.div>
        </TourPopupPortal>
    );
};

const ActiveElementHighlight: FC<{active: boolean}> = ({active}) => {
    if (!active) return null;
    return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 rounded-md ring-2 ring-primary ring-offset-2 pointer-events-none" />;
};


export const PrintOptions: React.FC<PrintOptionsProps> = ({
    fileName,
    onFileNameChange,
    selectedOptions,
    onOptionChange,
    paperSize,
    onPaperSizeChange,
    onPrint,
    onCancel,
    isGenerating,
    isMobile: _isMobile,
    isPortrait: _isPortrait,
    onReset
}) => {
    const isPrintDisabled = !Object.values(selectedOptions).some(Boolean) || isGenerating;
    
    // Tour state and logic
    const [tourActive, setTourActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [targetElements, setTargetElements] = useState<Record<string, HTMLElement | null>>({});

    const startTour = useCallback(() => { setCurrentStep(0); setTourActive(true); }, []);
    const nextStep = useCallback(() => { if (currentStep < baseTourSteps.length - 1) setCurrentStep(prev => prev + 1); }, [currentStep]);
    const prevStep = useCallback(() => { if (currentStep > 0) setCurrentStep(prev => prev - 1); }, [currentStep]);
    const endTour = useCallback(() => { setTourActive(false); }, []);
    
    useEffect(() => {
        if (!tourActive) return;
        const elements: Record<string, HTMLElement | null> = {};
        baseTourSteps.forEach(step => {
            elements[step.targetId] = document.getElementById(step.targetId);
        });
        setTargetElements(elements);
    }, [tourActive]);

    const currentTargetElement = useMemo(() => {
        if (!tourActive) return null;
        return targetElements[baseTourSteps[currentStep].targetId] ?? null;
    }, [tourActive, currentStep, targetElements]);

    return (
        <div data-testid="print-modal" className="flex flex-col h-full">
            <AnimatePresence>
                {tourActive && (
                    <TourPopup
                        step={baseTourSteps[currentStep]}
                        currentStep={currentStep}
                        totalSteps={baseTourSteps.length}
                        onNext={nextStep}
                        onPrev={prevStep}
                        onClose={endTour}
                        targetElement={currentTargetElement}
                    />
                )}
            </AnimatePresence>

            <div data-testid="print-header" className="px-6 py-4 border-b border-border flex items-center flex-shrink-0">
                <Printer size={18} className="mr-2.5 flex-shrink-0 text-primary" />
                <div className="flex-grow overflow-hidden">
                    <h3 data-testid="print-title" className="font-semibold text-lg text-popover-foreground">Print Options</h3>
                    <p data-testid="print-description" className="text-xs text-muted-foreground mt-0.5 truncate">Configure options and select content to include in the PDF export.</p>
                </div>
            </div>

            <div data-testid="print-content" className="p-6 flex-grow overflow-y-auto space-y-4">
                {/* File Settings */}
                <Card data-testid="file-settings-card">
                    <CardHeader className="pb-3">
                        <CardTitle data-testid="file-settings-title" className="text-base">File Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div id="print-filename-wrapper" className="space-y-1.5 relative">
                            <Label htmlFor="print-filename" className={cn("text-sm font-medium", tourActive && currentStep === 0 && "text-primary")}>File Name</Label>
                            <div className="relative">
                                <Input 
                                    id="print-filename" 
                                    data-testid="print-filename"
                                    value={fileName} 
                                    onChange={(e) => onFileNameChange(e.target.value)} 
                                    className="pr-12" 
                                    placeholder="Enter file name" 
                                    disabled={isGenerating} 
                                />
                                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                                    .pdf
                                </span>
                            </div>
                            <ActiveElementHighlight active={tourActive && currentStep === 0} />
                        </div>

                        <div id="print-paper-size-wrapper" className="space-y-1.5 relative">
                            <Label htmlFor="print-paperSize" className={cn("text-sm font-medium", tourActive && currentStep === 2 && "text-primary")}>Paper Size</Label>
                            <Select data-testid="print-paper-size" value={paperSize} onValueChange={(value) => onPaperSizeChange(value as PaperSize)} disabled={isGenerating}>
                                <SelectTrigger id="print-paperSize">
                                    <SelectValue placeholder="Select paper size" />
                                </SelectTrigger>
                                <SelectContent>
                                    {["a4", "a3", "letter", "legal"].map((size) => (
                                        <SelectItem key={size} value={size}>{size.toUpperCase()}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <ActiveElementHighlight active={tourActive && currentStep === 2} />
                        </div>
                    </CardContent>
                </Card>

                {/* Print Options */}
                <Card data-testid="print-options-card">
                    <CardHeader className="pb-3">
                        <CardTitle data-testid="print-options-title" className="text-base">Print Options</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div id="print-content-wrapper" className="space-y-3 relative">
                            {(Object.keys(selectedOptions) as Array<keyof SelectedOptions>).map((option) => (
                                <div key={option} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`print-option-${option}`} 
                                        data-testid={`print-option-${option}`}
                                        checked={selectedOptions[option]} 
                                        onCheckedChange={() => onOptionChange(option)} 
                                        disabled={isGenerating} 
                                    />
                                    <Label htmlFor={`print-option-${option}`} className="text-sm font-normal cursor-pointer flex-1">
                                        {option === 'data' ? 'Data View' : option === 'variable' ? 'Variable View' : 'Output Viewer (Results)'}
                                    </Label>
                                </div>
                            ))}
                            <ActiveElementHighlight active={tourActive && currentStep === 1} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div data-testid="print-footer" className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary">
                <div className="flex items-center text-muted-foreground">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button data-testid="print-help-button" variant="ghost" size="icon" onClick={startTour} className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"><HelpCircle className="h-4 w-4" /></Button>
                            </TooltipTrigger>
                            <TooltipContent side="top"><p className="text-xs">Start feature tour</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <div>
                    <Button data-testid="print-cancel-button" variant="outline" onClick={onCancel} disabled={isGenerating} className="mr-2">Cancel</Button>
                    <Button data-testid="print-reset-button" variant="outline" onClick={onReset} disabled={isGenerating} className="mr-2">Reset</Button>
                    <div id="print-button-wrapper" className="relative inline-block">
                        <Button data-testid="print-print-button" onClick={onPrint} disabled={isPrintDisabled} className={cn(tourActive && currentStep === 3 && "focus:ring-primary")}>
                            {isGenerating && <Loader2 className="mr-2 animate-spin" size={16} />}
                            {isGenerating ? "Printing..." : "Print"}
                        </Button>
                        <ActiveElementHighlight active={tourActive && currentStep === 3} />
                    </div>
                </div>
            </div>
        </div>
    );
};