"use client";

import type { FC} from "react";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, FileText, X, AlertCircle, FolderOpen, HelpCircle, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { useOpenSavFileLogic } from "./hooks/useOpenSavFileLogic";
import type { OpenSavFileProps, OpenSavFileStepProps } from "./types";
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
        title: "Select .sav File",
        content: "Click this area or drag and drop a .sav file to select it for opening.",
        targetId: "opensav-dropzone-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "📂",
    },
    {
        title: "Open File",
        content: "Once a file is selected, click this button to open it and load the data into the application.",
        targetId: "opensav-open-button-wrapper",
        defaultPosition: 'top',
        defaultHorizontalPosition: 'right',
        icon: "✅",
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


// Step component
const OpenSavFileStep: React.FC<OpenSavFileStepProps> = ({
    onClose,
    onFileSelect,
    onSubmit,
    isLoading,
    error,
    selectedFile,
    isMobile,
    isPortrait,
    clearError
}) => {
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

    const handleFileSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        onFileSelect(file);
        if (file?.name.endsWith('.sav')) clearError(); 
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            onFileSelect(droppedFile);
            if (droppedFile?.name.endsWith('.sav')) clearError();
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };
    
    const handleRemoveFile = () => {
        onFileSelect(null);
        clearError();
    }

    return (
        <div className="flex flex-col h-full">
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
            <div data-testid="open-sav-header" className="px-6 py-4 border-b border-border flex items-center flex-shrink-0">
                <FolderOpen size={18} className="mr-2.5 flex-shrink-0 text-primary" />
                <div className="flex-grow overflow-hidden">
                    <h3 data-testid="open-sav-title" className="font-semibold text-lg text-popover-foreground">
                        Open SAV File
                    </h3>
                    <p data-testid="open-sav-description" className="text-xs text-muted-foreground mt-0.5 truncate">
                        Open an SPSS statistics file (.sav) to load it into the application.
                    </p>
                </div>
            </div>
            <div data-testid="open-sav-content" className="p-6 flex-grow flex flex-col">
                <label
                    htmlFor="sav-file-upload-step"
                    id="opensav-dropzone-wrapper"
                    data-testid="open-sav-dropzone"
                    className={cn(`
                        border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors flex-1 mb-4 relative`,
                        isMobile && isPortrait ? 'min-h-[150px] p-6' : 'min-h-[200px] p-8',
                        error && !selectedFile ? "border-destructive bg-destructive/5 hover:border-destructive/60" : "border-input hover:border-primary/80 hover:bg-muted/50"
                    )}
                    style={{ width: "100%" }}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                >
                    <Upload size={isMobile ? 28 : 32} className={`mb-3 text-muted-foreground ${error && !selectedFile ? 'text-destructive/80' : ''}`} />
                    <p className={`text-center font-medium mb-1 ${isMobile ? 'text-sm' : 'text-base'} text-popover-foreground`}>
                        {selectedFile ? selectedFile.name : "Click to select a .sav file"}
                    </p>
                    <p className={`text-xs text-muted-foreground ${error && !selectedFile ? 'text-destructive/70' : ''}`}>
                        {selectedFile
                            ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                            : "or drag and drop here (.sav)"}
                    </p>
                    <input
                        id="sav-file-upload-step"
                        name="sav-file-upload-step"
                        data-testid="open-sav-file-input"
                        type="file"
                        accept=".sav"
                        onChange={handleFileSelectChange}
                        className="hidden"
                    />
                    <ActiveElementHighlight active={tourActive && currentStep === 0} />
                </label>

                {selectedFile && !error && ( 
                    <div data-testid="selected-file-info" className="mb-4 p-3 bg-muted/50 border border-border rounded-md flex items-center justify-between">
                        <div className="flex items-center overflow-hidden">
                            <FileText size={20} className="mr-2.5 text-primary flex-shrink-0" />
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {(selectedFile.size / 1024).toFixed(1)} KB
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleRemoveFile} className="text-muted-foreground hover:text-destructive h-7 w-7 flex-shrink-0">
                            <X size={16} />
                        </Button>
                    </div>
                )}

                {error && ( 
                    <Alert data-testid="open-sav-error" variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </div>
            
            <div data-testid="open-sav-footer" className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                <div className="flex items-center text-muted-foreground">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                            data-testid="open-sav-help-button"
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
                    <Button data-testid="open-sav-cancel-button" variant="outline" onClick={onClose} disabled={isLoading} className="mr-2">
                        Cancel
                    </Button>
                    <div id="opensav-open-button-wrapper" className="relative inline-block">
                        <Button
                            data-testid="open-sav-open-button"
                            onClick={onSubmit}
                            disabled={isLoading || !selectedFile}
                            className={cn(tourActive && currentStep === 1 && "focus:ring-primary")}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? "Processing..." : "Open"}
                        </Button>
                        <ActiveElementHighlight active={tourActive && currentStep === 1} />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main component following ImportExcelModal pattern
export const OpenSavFileModal: React.FC<OpenSavFileProps> = ({
    onClose,
    containerType: _containerType,
}) => {
    const {
        file,
        isLoading,
        error,
        isMobile,
        isPortrait,
        handleFileChange,
        clearError,
        handleSubmit,
        handleModalClose,
    } = useOpenSavFileLogic({ onClose });

    return (
        <div className="flex-grow overflow-y-auto flex flex-col h-full" data-testid="open-sav-file-modal">
            <OpenSavFileStep
                onClose={handleModalClose}
                onFileSelect={handleFileChange}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                error={error}
                selectedFile={file}
                isMobile={isMobile}
                isPortrait={isPortrait}
                clearError={clearError}
            />
        </div>
    );
};

// Export the component with both names for backward compatibility
export default OpenSavFileModal;