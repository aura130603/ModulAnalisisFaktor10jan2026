"use client";

import type { FC} from "react";
import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clipboard, Loader2, HelpCircle, X, ChevronLeft, ChevronRight, Info } from "lucide-react";
import type { ImportClipboardPasteStepProps } from "../types"; // Updated path
import { Textarea } from "@/components/ui/textarea";
import { readTextFromClipboard } from "../services/services"; // Import the new service function
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


// Tipe data untuk tour
type PopupPosition = 'top' | 'bottom';
type HorizontalPosition = 'left' | 'right';

// Disesuaikan dengan struktur yang diperbarui
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

// Data langkah tour untuk Paste Step
const baseTourSteps: TourStep[] = [
    {
        title: "Paste from Clipboard",
        content: "Click this button to automatically paste data from your clipboard. You may need to grant permission.",
        targetId: "paste-step-paste-button-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "📋",
    },
    {
        title: "Manual Paste Area",
        content: "Alternatively, you can manually paste your data here using Ctrl+V or Cmd+V.",
        targetId: "paste-step-textarea-wrapper",
        defaultPosition: 'top',
        defaultHorizontalPosition: 'left',
        icon: "✍️",
    },
    {
        title: "Continue",
        content: "Once your data is pasted, click here to proceed to the configuration step.",
        targetId: "paste-step-continue-button-wrapper",
        defaultPosition: 'top',
        defaultHorizontalPosition: 'right',
        icon: "➡️",
    }
];

// Portal wrapper untuk memastikan popup selalu berada di atas elemen lain
const TourPopupPortal: FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);
    
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
    const position = step.position || step.defaultPosition;
    const horizontalPosition = step.horizontalPosition;
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
    const popupRef = useRef<HTMLDivElement>(null);
    
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
                        <div>{currentStep !== 0 && <Button variant="outline" size="sm" onClick={onPrev} className="h-7 px-2 py-0"><ChevronLeft className="mr-1 h-3 w-3" /><span className="text-xs">Prev</span></Button>}</div>
                        <div>
                            {currentStep + 1 !== totalSteps ? (
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


export const ImportClipboardPasteStep: React.FC<ImportClipboardPasteStepProps> = ({
    onClose,
    onTextPaste,
    onContinue,
    isLoading,
    error,
    pastedText,
    isMobile,
    isPortrait
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [clipboardApiError, setClipboardApiError] = useState<string | null>(null);

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
        return targetElements[baseTourSteps[currentStep].targetId] || null;
    }, [tourActive, currentStep, targetElements]);

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text');
        if (text) {
            onTextPaste(text);
            setClipboardApiError(null);
        }
    };

    const handlePasteButtonClick = async () => {
        try {
            const text = await readTextFromClipboard();
            onTextPaste(text);
            setClipboardApiError(null);
        } catch (err: any) {
            setClipboardApiError(err.message || "Clipboard access denied. Please manually paste text (Ctrl+V / Cmd+V).");
            if (textareaRef.current) {
                textareaRef.current.focus();
            }
        }
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        onTextPaste(text);
        setClipboardApiError(null);
    };

    return (
        <div className="flex flex-col h-full" data-testid="import-clipboard-paste-step">
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

            <div className="px-6 py-4 border-b border-border flex items-center flex-shrink-0" data-testid="paste-step-header">
                <Clipboard size={18} className="mr-2.5 flex-shrink-0 text-primary" />
                <div className="flex-grow overflow-hidden">
                    <h3 className="font-semibold text-lg text-popover-foreground" data-testid="paste-step-title">
                        Import from Clipboard
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate" data-testid="paste-step-description">
                        Paste tabular data from clipboard to import into Statify
                    </p>
                </div>
            </div>

            <div className="p-6 flex-grow flex flex-col" data-testid="paste-step-content">
                <div className="mb-4">
                    <div id="paste-step-paste-button-wrapper" className="relative inline-block">
                        <Button 
                            variant="outline" 
                            onClick={handlePasteButtonClick} 
                            className={cn("mb-3", tourActive && currentStep === 0 && "focus:ring-primary")}
                            disabled={isLoading}
                            data-testid="paste-from-clipboard-button"
                        >
                            <Clipboard className="h-4 w-4 mr-2" />
                            Paste from Clipboard
                        </Button>
                        <ActiveElementHighlight active={tourActive && currentStep === 0} />
                    </div>
                    
                    {clipboardApiError && (
                        <div className="flex items-center gap-2 mb-3 text-sm text-amber-500 dark:text-amber-400" data-testid="clipboard-error-message">
                            <AlertCircle size={16} className="flex-shrink-0" />
                            <span>{clipboardApiError}</span>
                        </div>
                    )}
                </div>

                <div id="paste-step-textarea-wrapper" className="flex-grow relative min-h-[200px]">
                    <Textarea
                        ref={textareaRef}
                        className={cn(`w-full h-full min-h-[200px] font-mono text-sm`, error ? 'border-destructive' : '', tourActive && currentStep === 1 && "focus:ring-primary")}
                        placeholder="Paste your tabular data here..."
                        onPaste={handlePaste}
                        onChange={handleTextChange}
                        disabled={isLoading}
                        value={pastedText || ''}
                        data-testid="paste-textarea"
                    />
                    <ActiveElementHighlight active={tourActive && currentStep === 1} />
                </div>

                {error && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-destructive" data-testid="paste-error-message">
                        <AlertCircle size={16} className="flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-border flex items-center justify-end bg-secondary flex-shrink-0" data-testid="paste-step-footer">
                <div>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                        className="mr-2"
                        data-testid="paste-cancel-button"
                    >
                        Cancel
                    </Button>
                    <div id="paste-step-continue-button-wrapper" className="relative inline-block">
                        <Button
                            onClick={onContinue}
                            disabled={isLoading || !pastedText || pastedText.trim() === ''}
                            className={cn(tourActive && currentStep === 2 && "focus:ring-primary")}
                            data-testid="paste-continue-button"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Continue
                        </Button>
                        <ActiveElementHighlight active={tourActive && currentStep === 2} />
                    </div>
                </div>
            </div>
        </div>
    );
};