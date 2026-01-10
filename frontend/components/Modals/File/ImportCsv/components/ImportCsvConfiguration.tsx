"use client";

import type { FC} from "react";
import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { InfoIcon, ChevronDownIcon, ArrowLeft, HelpCircle, Loader2, X, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider
} from "@/components/ui/tooltip";
import { useImportCsvProcessor } from "../hooks/useImportCsvProcessor";
import type { 
    DelimiterOption, 
    DecimalOption, 
    TextQualifierOption, 
    SelectOption 
} from "../types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { processCSVContent } from "../importCsvUtils";
import { RefreshCw } from "lucide-react";

// CSS styles for CSV preview table
const csvPreviewStyles = `
.csv-preview-table {
    font-size: 0.875rem;
    border-collapse: separate;
    border-spacing: 0;
    width: 100%;
    min-width: max-content;
}

.csv-preview-table th,
.csv-preview-table td {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 80px;
    max-width: 200px;
    padding: 8px 12px;
    border-right: 1px solid hsl(var(--border));
    border-bottom: 1px solid hsl(var(--border));
    text-align: left;
    background: hsl(var(--background));
}

.csv-preview-table th {
    background-color: hsl(var(--muted));
    font-weight: 600;
    position: sticky;
    top: 0;
    z-index: 2;
    border-bottom: 2px solid hsl(var(--border));
}

.csv-preview-table th:first-child,
.csv-preview-table td:first-child {
    position: sticky;
    left: 0;
    z-index: 1;
    background-color: hsl(var(--muted) / 0.8);
    border-right: 2px solid hsl(var(--border));
}

.csv-preview-table th:first-child {
    z-index: 3;
    background-color: hsl(var(--muted));
}

.csv-preview-table tbody tr:nth-child(even) td {
    background-color: hsl(var(--muted) / 0.2);
}

.csv-preview-table tbody tr:nth-child(even) td:first-child {
    background-color: hsl(var(--muted) / 0.6);
}

.csv-preview-table tbody tr:hover td {
    background-color: hsl(var(--muted) / 0.4);
}

.csv-preview-table tbody tr:hover td:first-child {
    background-color: hsl(var(--muted) / 0.8);
}
`;

// Inject styles
if (typeof document !== 'undefined') {
    const styleId = 'csv-preview-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = csvPreviewStyles;
        document.head.appendChild(style);
    }
}

interface ImportCsvConfigurationProps {
    onClose: () => void;
    onBack: () => void;
    fileName: string;
    fileContent: string;
}

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
        title: "File Preview",
        content: "This area shows the first few lines of your file to help you choose the correct settings.",
        targetId: "csv-config-preview-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "📄",
    },
    {
        title: "Variable Names",
        content: "Enable this if the first row of your data contains the names of the variables or columns.",
        targetId: "csv-config-header-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "🏷️",
    },
    {
        title: "Delimiter",
        content: "Select the character (e.g., comma or semicolon) that separates the data values in your file.",
        targetId: "csv-config-delimiter-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'right',
        icon: "🔣",
    },
    {
        title: "Import Data",
        content: "When you have configured all the options, click here to finalize the import process.",
        targetId: "csv-config-import-button-wrapper",
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


// Custom Select Component
const CustomSelect: FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: SelectOption[]; isTouring?: boolean }> = ({ label, value, onChange, options, isTouring }) => (
    <div className="mb-4 relative">
        <Label htmlFor={`select-${label.toLowerCase().replace(/\s+/g, '-')}`} className={cn("block text-xs font-medium mb-1.5 text-muted-foreground", isTouring && "text-primary")}>{label}:</Label>
        <div className="relative">
            <select
                id={`select-${label.toLowerCase().replace(/\s+/g, '-')}`}
                value={value}
                onChange={onChange}
                className="w-full appearance-none px-3 py-2 pr-8 text-sm rounded-md border border-input focus:border-ring focus:outline-none focus:ring-1 bg-background h-9"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <ChevronDownIcon className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
        <ActiveElementHighlight active={!!isTouring} />
    </div>
);

export const ImportCsvConfiguration: FC<ImportCsvConfigurationProps> = ({
    onClose,
    onBack,
    fileName,
    fileContent,
}) => {
    const [firstLineContains, setFirstLineContains] = useState<boolean>(true);
    const [removeLeading, setRemoveLeading] = useState<boolean>(false);
    const [removeTrailing, setRemoveTrailing] = useState<boolean>(false);
    const [delimiter, setDelimiter] = useState<DelimiterOption>("comma");
    const [decimal, setDecimal] = useState<DecimalOption>("period");
    const [textQualifier, setTextQualifier] = useState<TextQualifierOption>("doubleQuote");
    
    const { processCSV, isProcessing: hookIsProcessing } = useImportCsvProcessor();
    const [submissionError, setSubmissionError] = useState<string | null>(null);

    
    // Preview data state
    const [parsedData, setParsedData] = useState<{variables: any[], data: string[][]} | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
    const [previewError, setPreviewError] = useState<string | null>(null);

    // Update tour step for data preview
    const updatedTourSteps = useMemo(() => {
        return baseTourSteps.map(step => {
            if (step.targetId === 'csv-config-preview-wrapper') {
                return {
                    ...step,
                    title: "Data Preview",
                    content: "This table shows a preview of your data based on the selected options and delimiter."
                };
            }
            return step;
        });
    }, []);

    // Tour state and logic
    const [tourActive, setTourActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [targetElements, setTargetElements] = useState<Record<string, HTMLElement | null>>({});

    const startTour = useCallback(() => { setCurrentStep(0); setTourActive(true); }, []);
    const nextStep = useCallback(() => { if (currentStep < updatedTourSteps.length - 1) setCurrentStep(prev => prev + 1); }, [currentStep, updatedTourSteps.length]);
    const prevStep = useCallback(() => { if (currentStep > 0) setCurrentStep(prev => prev - 1); }, [currentStep]);
    const endTour = useCallback(() => { setTourActive(false); }, []);
    
    useEffect(() => {
        if (!tourActive) return;
        const elements: Record<string, HTMLElement | null> = {};
        updatedTourSteps.forEach(step => {
            elements[step.targetId] = document.getElementById(step.targetId);
        });
        setTargetElements(elements);
    }, [tourActive, updatedTourSteps]);

    const currentTargetElement = useMemo(() => {
        if (!tourActive) return null;
        return targetElements[updatedTourSteps[currentStep].targetId] || null;
    }, [tourActive, currentStep, targetElements, updatedTourSteps]);

    // Process CSV data for preview when options change
    useEffect(() => {
        const processPreview = async () => {
            if (!fileContent) return;
            
            setIsLoadingPreview(true);
            setPreviewError(null);
            
            try {
                const result = processCSVContent(fileContent, {
                    firstLineContains,
                    removeLeading,
                    removeTrailing,
                    delimiter,
                    decimal,
                    textQualifier
                });
                setParsedData(result);
            } catch (error: any) {
                setPreviewError(error.message || 'Failed to process CSV');
                setParsedData(null);
            } finally {
                setIsLoadingPreview(false);
            }
        };
        
        processPreview();
    }, [fileContent, firstLineContains, removeLeading, removeTrailing, delimiter, decimal, textQualifier]);


    const handleOk = async () => {
        setSubmissionError(null);
        try {
            await processCSV({
                fileContent,
                options: { firstLineContains, removeLeading, removeTrailing, delimiter, decimal, textQualifier }
            });
            
            // Tampilkan toast sukses
            toast.success(`Import Berhasil: File ${fileName} berhasil diimpor ke dalam sistem.`);
            
            onClose();
        } catch (err: any) {
            const errorMessage = err?.message || "Failed to process CSV.";
            setSubmissionError(errorMessage);
            
            // Tampilkan toast error
            toast.error(`Import Gagal: ${errorMessage}`);
        }
    };

    const handleReset = () => {
        setFirstLineContains(true);
        setRemoveLeading(false);
        setRemoveTrailing(false);
        setDelimiter("comma");
        setDecimal("period");
        setTextQualifier("doubleQuote");
        setSubmissionError(null);
    };

    return (
        <div className="flex flex-col h-full">

            <AnimatePresence>
                {tourActive && (
                    <TourPopup 
                        step={updatedTourSteps[currentStep]} 
                        currentStep={currentStep} 
                        totalSteps={updatedTourSteps.length} 
                        onNext={nextStep} 
                        onPrev={prevStep} 
                        onClose={endTour} 
                        targetElement={currentTargetElement} 
                    />
                )}
            </AnimatePresence>
            <div className="flex items-center justify-between px-6 py-3 border-b border-border flex-shrink-0">
                <div className="flex items-center flex-1 min-w-0">
                    <Button variant="ghost" size="sm" onClick={onBack} className="mr-2 -ml-2 h-8 w-8 p-0">
                        <ArrowLeft size={16} />
                    </Button>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-semibold truncate" title={`Configure Import: ${fileName}`}>Configure Import: {fileName}</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Adjust settings for how the CSV data should be read.</p>
                    </div>
                </div>
                 <div className="w-8"></div>
            </div>

            <div className="p-6 flex-grow overflow-y-auto space-y-6">
                {/* 1. Import Options */}
                <Card className="border-border mb-6">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">
                            Import Options
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* First row: Variable names checkbox */}
                        <div className="grid grid-cols-1">
                            <div id="csv-config-header-wrapper" className="flex items-center space-x-2 relative">
                                <Checkbox id="firstLineContains" checked={firstLineContains} onCheckedChange={(checked) => setFirstLineContains(Boolean(checked))} />
                                <Label htmlFor="firstLineContains" className={cn("text-sm font-normal cursor-pointer", tourActive && currentStep === 1 && "text-primary")}>First line contains variable names</Label>
                                <ActiveElementHighlight active={tourActive && currentStep === 1} />
                            </div>
                        </div>
                        
                        {/* Second row: Space handling checkboxes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="removeLeadingSpaces" checked={removeLeading} onCheckedChange={(checked) => setRemoveLeading(Boolean(checked))} />
                                <Label htmlFor="removeLeadingSpaces" className="text-sm font-normal cursor-pointer">Remove leading spaces</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="removeTrailingSpaces" checked={removeTrailing} onCheckedChange={(checked) => setRemoveTrailing(Boolean(checked))} />
                                <Label htmlFor="removeTrailingSpaces" className="text-sm font-normal cursor-pointer">Remove trailing spaces</Label>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Format Settings */}
                <Card className="border-border mb-6">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">
                            Format Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* First row: Delimiter and Decimal */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div id="csv-config-delimiter-wrapper">
                                <CustomSelect label="Delimiter" value={delimiter} onChange={(e) => setDelimiter(e.target.value as DelimiterOption)} options={[{ value: "comma", label: "Comma (,)" }, { value: "semicolon", label: "Semicolon (;)" }, { value: "tab", label: "Tab (\t)" }]} isTouring={tourActive && currentStep === 2} />
                            </div>
                            <div id="csv-config-decimal-wrapper">
                                <CustomSelect label="Decimal Symbol for Numerics" value={decimal} onChange={(e) => setDecimal(e.target.value as DecimalOption)} options={[{ value: "period", label: "Period (.)" }, { value: "comma", label: "Comma (,)" }]} />
                            </div>
                        </div>
                        
                        {/* Second row: Text Qualifier */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div id="csv-config-qualifier-wrapper">
                                <div className="mb-4 relative">
                                    <div className="flex items-center mb-1.5">
                                        <Label htmlFor="textQualifierSelect" className="block text-xs font-medium text-muted-foreground">Text Qualifier:</Label>
                                        <TooltipProvider delayDuration={100}><Tooltip><TooltipTrigger asChild><InfoIcon size={13} className="ml-1.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent className="max-w-xs"><p>Character used to enclose string values.</p></TooltipContent></Tooltip></TooltipProvider>
                                    </div>
                                    <div className="relative">
                                        <select id="textQualifierSelect" value={textQualifier} onChange={(e) => setTextQualifier(e.target.value as TextQualifierOption)} className="w-full appearance-none px-3 py-2 pr-8 text-sm rounded-md border border-input focus:border-ring focus:outline-none focus:ring-1 bg-background h-9">
                                            <option value="doubleQuote">Double Quote (&quot;)</option>
                                            <option value="singleQuote">Single Quote (&apos;)</option>
                                            <option value="none">None</option>
                                        </select>
                                        <ChevronDownIcon className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Data Preview */}
                <div id="csv-config-preview-wrapper" className="relative">
                    <Card className="border-border">
                        <CardHeader className="pb-3">
                            <CardTitle className={cn("text-sm font-medium flex items-center justify-between", tourActive && currentStep === 0 && "text-primary")}>
                                Data Preview
                                <span className="text-xs font-normal text-muted-foreground">(max 100 rows shown)</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="border-t border-border bg-background hot-container-csv relative" 
                                 style={{
                                     zIndex: 0,
                                     minHeight: 'clamp(200px, 30vh, 300px)',
                                     maxHeight: 'clamp(300px, 50vh, 500px)',
                                     overflow: 'auto',
                                     scrollbarWidth: 'thin',
                                     scrollbarColor: 'hsl(var(--muted-foreground) / 0.5) hsl(var(--muted) / 0.3)'
                                 }}>
                                {isLoadingPreview ? (
                                    <div className="absolute inset-0 flex items-center justify-center h-full text-muted-foreground bg-background/80 z-10">
                                        <RefreshCw size={18} className="animate-spin mr-2" /> Loading preview...
                                    </div>
                                ) : previewError ? (
                                    <div className="flex flex-col items-center justify-center h-full text-destructive p-4 text-center">
                                        <InfoIcon size={20} className="mb-2" /> 
                                        <span className="font-medium">Preview Error</span>
                                        <span className="text-xs max-w-sm mx-auto">{previewError}</span>
                                    </div>
                                ) : (!isLoadingPreview && (!parsedData || parsedData.data.length === 0) && !previewError) ? (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
                                        <InfoIcon size={20} className="mb-2" /> 
                                        No data to preview. Try adjusting options.
                                    </div>
                                ) : (parsedData && parsedData.data.length > 0) ? (
                                    <>
                                        <table className="csv-preview-table">
                                            <thead>
                                                <tr>
                                                    <th className="w-12 text-center">#</th>
                                                    {parsedData.variables.map((variable, index) => (
                                                        <th key={index} title={variable.name}>
                                                            {variable.name}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {parsedData.data.slice(0, 100).map((row, rowIndex) => (
                                                    <tr key={rowIndex}>
                                                        <td className="w-12 text-center text-muted-foreground font-mono text-xs">
                                                            {rowIndex + 1}
                                                        </td>
                                                        {row.map((cell, cellIndex) => (
                                                            <td key={cellIndex} title={String(cell || '')}>
                                                                {String(cell || '')}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                                        <InfoIcon size={16} className="mr-2" /> No data to preview
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    <ActiveElementHighlight active={tourActive && currentStep === 0} />
                </div>

                {submissionError && (
                    <div className="px-6 pb-2">
                        <div className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-md p-3">
                            {submissionError}
                        </div>
                    </div>
                )}
            </div>

            <div className="px-6 py-3 border-t border-border flex items-center justify-end bg-secondary flex-shrink-0">
                <div>
                    <Button variant="outline" onClick={onBack} disabled={hookIsProcessing} className="mr-2">Back</Button>
                    <Button variant="outline" onClick={handleReset} disabled={hookIsProcessing} className="mr-2">Reset</Button>
                    <div id="csv-config-import-button-wrapper" className="relative inline-block">
                        <Button onClick={handleOk} disabled={hookIsProcessing || !!submissionError} {...(hookIsProcessing ? { loading: true } : {})} className={cn(tourActive && currentStep === 3 && "focus:ring-primary")}>
                            {hookIsProcessing && <Loader2 className="mr-2 animate-spin" size={16} />}
                            Import
                        </Button>
                        <ActiveElementHighlight active={tourActive && currentStep === 3} />
                    </div>
                </div>
            </div>
        </div>
    );
};