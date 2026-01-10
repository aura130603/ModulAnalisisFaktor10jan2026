"use client";

import type { FC} from "react";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, RefreshCw, HelpCircle, Clipboard, X, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import type { ImportClipboardConfigurationStepProps, ClipboardProcessingOptions } from "../types";
import { useImportClipboardProcessor } from "../hooks/useImportClipboardProcessor";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

const PREVIEW_ROW_LIMIT = 100;
const PREVIEW_COL_LIMIT = 25;

// CSS styles for clipboard preview table
const clipboardPreviewStyles = `
.clipboard-preview-table {
    font-size: 0.875rem;
    border-collapse: separate;
    border-spacing: 0;
    width: 100%;
    min-width: max-content;
}

.clipboard-preview-table th,
.clipboard-preview-table td {
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

.clipboard-preview-table th {
    background-color: hsl(var(--muted));
    font-weight: 600;
    position: sticky;
    top: 0;
    z-index: 2;
    border-bottom: 2px solid hsl(var(--border));
}

.clipboard-preview-table th:first-child,
.clipboard-preview-table td:first-child {
    position: sticky;
    left: 0;
    z-index: 1;
    background-color: hsl(var(--muted) / 0.8);
    border-right: 2px solid hsl(var(--border));
}

.clipboard-preview-table th:first-child {
    z-index: 3;
    background-color: hsl(var(--muted));
}

.clipboard-preview-table tbody tr:nth-child(even) td {
    background-color: hsl(var(--muted) / 0.2);
}

.clipboard-preview-table tbody tr:nth-child(even) td:first-child {
    background-color: hsl(var(--muted) / 0.6);
}

.clipboard-preview-table tbody tr:hover td {
    background-color: hsl(var(--muted) / 0.4);
}

.clipboard-preview-table tbody tr:hover td:first-child {
    background-color: hsl(var(--muted) / 0.8);
}
`;

// Inject styles
if (typeof document !== 'undefined') {
    const styleId = 'clipboard-preview-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = clipboardPreviewStyles;
        document.head.appendChild(style);
    }
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

// Data langkah tour untuk Configuration Step
const baseTourSteps: TourStep[] = [
    {
        title: "Delimiter",
        content: "Select the character that separates values in your data (e.g., comma, tab).",
        targetId: "config-step-delimiter-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "🔣",
    },
    {
        title: "Text Qualifier",
        content: "Select the character used to enclose text values, especially those containing delimiters.",
        targetId: "config-step-qualifier-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "🔠",
    },
    {
        title: "Header Row",
        content: "Enable if the first row of your data contains variable names.",
        targetId: "config-step-header-row-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "🏷️",
    },
    {
        title: "Data Preview",
        content: "This table shows a preview of how your data will be imported with the current settings.",
        targetId: "config-step-preview-wrapper",
        defaultPosition: 'top',
        defaultHorizontalPosition: 'left',
        icon: "📊",
    },
    {
        title: "Import Data",
        content: "When you're satisfied with the preview, click here to finalize the import.",
        targetId: "config-step-import-button-wrapper",
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

// Komponen highlight
const ActiveElementHighlight: FC<{active: boolean}> = ({active}) => {
    if (!active) return null;
    return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 rounded-md ring-2 ring-primary ring-offset-2 pointer-events-none" />;
};


export const ImportClipboardConfigurationStep: FC<ImportClipboardConfigurationStepProps> = ({
    onClose,
    onBack,
    pastedText,
    parsedData,
}) => {
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
    const [previewData, setPreviewData] = useState<string[][]>(parsedData);
    const [textQualifierOption, setTextQualifierOption] = useState<string>('"');
    const [originalRowCount, setOriginalRowCount] = useState(0);
    const [originalColCount, setOriginalColCount] = useState(0);
    const [isPreviewTruncated, setIsPreviewTruncated] = useState(false);

    const [options, setOptions] = useState<ClipboardProcessingOptions>({
        delimiter: "tab",
        firstRowAsHeader: false,
        trimWhitespace: true,
        skipEmptyRows: true,
        detectDataTypes: true,
    });

    const [customDelimiter, setCustomDelimiter] = useState<string>("");

    const { excelStyleTextToColumns, processClipboardData } = useImportClipboardProcessor();

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

    const getDelimiterCharacter = useCallback((): string => {
        switch (options.delimiter) {
            case "tab": return "\t";
            case "comma": return ",";
            case "semicolon": return ";";
            case "space": return " ";
            case "custom": return customDelimiter || "\t";
            default: return "\t";
        }
    }, [options.delimiter, customDelimiter]);

    useEffect(() => {
        const updatePreview = async () => {
            if (!pastedText) {
                setPreviewData([]);
                return;
            }
            setIsPreviewLoading(true);
            setError(null);
            try {
                let result;
                const currentDelimiter = getDelimiterCharacter();
                result = excelStyleTextToColumns(pastedText, {
                    delimiterType: 'delimited',
                    delimiter: currentDelimiter,
                    textQualifier: textQualifierOption === "NO_QUALIFIER" ? "" : textQualifierOption,
                    treatConsecutiveDelimitersAsOne: options.skipEmptyRows,
                    trimWhitespace: options.trimWhitespace,
                    detectDataTypes: options.detectDataTypes,
                    hasHeaderRow: options.firstRowAsHeader
                });
                setPreviewData(result);
            } catch (err: any) {
                setError(err?.message || "Failed to update preview");
                setPreviewData([]);
            } finally {
                setIsPreviewLoading(false);
            }
        };
        
        if (pastedText) {
            updatePreview();
        }

    }, [options, customDelimiter, pastedText, excelStyleTextToColumns, textQualifierOption, getDelimiterCharacter]);

    const { dataForTable, columnHeaders, variables } = useMemo(() => {
        if (!previewData || previewData.length === 0) {
            setOriginalRowCount(0);
            setOriginalColCount(0);
            setIsPreviewTruncated(false);
            return { dataForTable: [], columnHeaders: [], variables: [] };
        }

        let fullHeaders: string[];
        let fullData: string[][];

        if (options.firstRowAsHeader) {
            if (previewData.length > 1) {
                fullHeaders = previewData[0];
                fullData = previewData.slice(1);
            } else { 
                fullHeaders = previewData[0].map((_, i) => `Column ${i + 1}`);
                fullData = previewData; 
            }
        } else {
            fullHeaders = previewData.length > 0 && previewData[0] ? previewData[0].map((_, i) => `Column ${i + 1}`) : [];
            fullData = previewData;
        }
        
        setOriginalRowCount(fullData.length);
        setOriginalColCount(fullHeaders.length);

        const slicedHeaders = fullHeaders.slice(0, PREVIEW_COL_LIMIT);
        const slicedData = fullData.slice(0, PREVIEW_ROW_LIMIT).map(row => row.slice(0, PREVIEW_COL_LIMIT));
        
        setIsPreviewTruncated(fullData.length > PREVIEW_ROW_LIMIT || fullHeaders.length > PREVIEW_COL_LIMIT);
        
        const variables = slicedHeaders.map((header, index) => ({
            name: header,
            type: 'string' as const,
            index
        }));

        return { dataForTable: slicedData, columnHeaders: slicedHeaders, variables };
    }, [previewData, options.firstRowAsHeader]);

    const handleOptionChange = (key: keyof ClipboardProcessingOptions, value: any) => {
        setOptions((prevOptions: ClipboardProcessingOptions) => ({ ...prevOptions, [key]: value }));
    };

    const handleImport = async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        setError(null);
        try {
            const dataToProcess = excelStyleTextToColumns(pastedText, {
                delimiterType: 'delimited',
                delimiter: getDelimiterCharacter(),
                textQualifier: textQualifierOption === "NO_QUALIFIER" ? "" : textQualifierOption,
                treatConsecutiveDelimitersAsOne: options.skipEmptyRows,
                trimWhitespace: options.trimWhitespace,
                detectDataTypes: options.detectDataTypes,
                hasHeaderRow: options.firstRowAsHeader
            });
            await processClipboardData(pastedText, {
                ...options,
                customDelimiter: options.delimiter === "custom" ? customDelimiter : undefined,
                excelProcessedData: dataToProcess
            });
            onClose();
        } catch (err: any) {
            setError(err?.message || "Failed to import data");
        } finally {
            setIsProcessing(false);
        }
    };





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
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
                <div className="flex items-center flex-1 min-w-0">
                    <Button variant="ghost" size="icon" onClick={onBack} className="mr-3 -ml-2 h-8 w-8 text-muted-foreground hover:text-foreground">
                        <ArrowLeft size={18} />
                    </Button>
                    <Clipboard size={20} className="mr-2.5 text-primary flex-shrink-0 relative top-[-1px]" />
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-semibold truncate text-popover-foreground">
                            Configure Clipboard Import
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            Configure how the pasted data should be processed
                        </p>
                    </div>
                </div>
                <div className="w-8"></div>
            </div>

            {/* Main Content Area */}
            <div className="p-6 flex-grow overflow-y-auto space-y-6">
                {/* 1. Format Settings */}
                <Card className="border-border">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <span className="text-lg">🔧</span>
                            Format Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* First row: Delimiter and Text Qualifier */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div id="config-step-delimiter-wrapper" className="space-y-2 relative">
                                <Label className={cn("text-xs font-medium text-muted-foreground", tourActive && currentStep === 0 && "text-primary")}>Delimiter</Label>
                                <div className="relative">
                                    <Select
                                        value={options.delimiter}
                                        onValueChange={(value) => handleOptionChange("delimiter", value)}
                                        disabled={isProcessing}
                                    >
                                        <SelectTrigger className="w-full h-9">
                                            <SelectValue placeholder="Select delimiter" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="tab">Tab</SelectItem>
                                            <SelectItem value="comma">Comma (,)</SelectItem>
                                            <SelectItem value="semicolon">Semicolon (;)</SelectItem>
                                            <SelectItem value="space">Space</SelectItem>
                                            <SelectItem value="custom">Custom</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <ActiveElementHighlight active={tourActive && currentStep === 0} />
                                </div>
                                {options.delimiter === "custom" && (
                                    <div className="pt-2">
                                        <Label htmlFor="custom-delimiter" className="text-xs font-medium text-muted-foreground">
                                            Custom Delimiter
                                        </Label>
                                        <Input
                                            id="custom-delimiter"
                                            value={customDelimiter}
                                            onChange={(e) => setCustomDelimiter(e.target.value)}
                                            placeholder="Enter custom delimiter"
                                            className="mt-1 h-9"
                                            disabled={isProcessing}
                                        />
                                    </div>
                                )}
                            </div>
                            
                            <div id="config-step-qualifier-wrapper" className="space-y-2 relative">
                                <Label className={cn("text-xs font-medium text-muted-foreground", tourActive && currentStep === 1 && "text-primary")}>Text Qualifier</Label>
                                <div className="relative">
                                    <Select
                                        value={textQualifierOption}
                                        onValueChange={setTextQualifierOption}
                                        disabled={isProcessing}
                                    >
                                        <SelectTrigger className="w-full h-9">
                                            <SelectValue placeholder="Select text qualifier" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value='"'>Double Quote (&quot;)</SelectItem>
                                            <SelectItem value="'">Single Quote (&apos;)</SelectItem>
                                            <SelectItem value="NO_QUALIFIER">None</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <ActiveElementHighlight active={tourActive && currentStep === 1} />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Import Options */}
                <Card className="border-border">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">
                            Import Options
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* First row: Header row option */}
                        <div className="grid grid-cols-1">
                            <div id="config-step-header-row-wrapper" className="flex items-center space-x-2 relative">
                                <Checkbox
                                    id="firstRowAsHeader"
                                    checked={options.firstRowAsHeader}
                                    onCheckedChange={(checked) => handleOptionChange("firstRowAsHeader", Boolean(checked))}
                                    disabled={isProcessing}
                                />
                                <Label htmlFor="firstRowAsHeader" className={cn("text-sm font-normal cursor-pointer flex items-center", tourActive && currentStep === 2 && "text-primary")}>
                                    First row as headers
                                    <TooltipProvider><Tooltip><TooltipTrigger asChild><HelpCircle className="h-4 w-4 ml-1.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent>Use the first row as variable names</TooltipContent></Tooltip></TooltipProvider>
                                </Label>
                                <ActiveElementHighlight active={tourActive && currentStep === 2} />
                            </div>
                        </div>
                        
                        {/* Second row: Data processing options */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="trimWhitespace" checked={options.trimWhitespace} onCheckedChange={(checked) => handleOptionChange("trimWhitespace", Boolean(checked))} disabled={isProcessing} />
                                <Label htmlFor="trimWhitespace" className="text-sm font-normal cursor-pointer flex items-center">Trim whitespace<TooltipProvider><Tooltip><TooltipTrigger asChild><HelpCircle className="h-4 w-4 ml-1.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent>Remove leading and trailing whitespace</TooltipContent></Tooltip></TooltipProvider></Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="skipEmptyRows" checked={options.skipEmptyRows} onCheckedChange={(checked) => handleOptionChange("skipEmptyRows", Boolean(checked))} disabled={isProcessing} />
                                <Label htmlFor="skipEmptyRows" className="text-sm font-normal cursor-pointer flex items-center">Skip empty rows<TooltipProvider><Tooltip><TooltipTrigger asChild><HelpCircle className="h-4 w-4 ml-1.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent>Ignore rows with no data</TooltipContent></Tooltip></TooltipProvider></Label>
                            </div>
                        </div>
                        
                        {/* Third row: Data type detection */}
                        <div className="grid grid-cols-1">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="detectDataTypes" checked={options.detectDataTypes} onCheckedChange={(checked) => handleOptionChange("detectDataTypes", Boolean(checked))} disabled={isProcessing} />
                                <Label htmlFor="detectDataTypes" className="text-sm font-normal cursor-pointer flex items-center">Detect data types<TooltipProvider><Tooltip><TooltipTrigger asChild><HelpCircle className="h-4 w-4 ml-1.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent>Automatically detect numeric values</TooltipContent></Tooltip></TooltipProvider></Label>
                            </div>
                        </div>
                        
                        {/* Reset button */}
                        <div className="pt-2">
                            <Button variant="outline" size="sm" onClick={() => { setOptions({ delimiter: "tab", firstRowAsHeader: true, trimWhitespace: true, skipEmptyRows: true, detectDataTypes: true }); setTextQualifierOption('"'); }} disabled={isProcessing || isPreviewLoading} className="w-full h-9">
                                <RefreshCw size={14} className="mr-1.5" />
                                Reset Options
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Data Preview Panel */}
                <div id="config-step-preview-wrapper" className="relative">
                    <Card className="border-border">
                        <CardHeader className="pb-3">
                            <CardTitle className={cn("text-sm font-medium flex items-center justify-between", tourActive && currentStep === 3 && "text-primary")}>
                                Data Preview
                                <span className="text-xs font-normal text-muted-foreground">(max 100 rows shown)</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="border-t border-border bg-background hot-container-clipboard relative" 
                                 style={{
                                     zIndex: 0,
                                     minHeight: 'clamp(200px, 30vh, 300px)',
                                     maxHeight: 'clamp(300px, 50vh, 500px)',
                                     overflow: 'auto',
                                     scrollbarWidth: 'thin',
                                     scrollbarColor: 'hsl(var(--muted-foreground) / 0.5) hsl(var(--muted) / 0.3)'
                                 }}>
                        {isPreviewLoading ? (
                            <div className="absolute inset-0 flex items-center justify-center h-full text-muted-foreground bg-background/80 z-10">
                                <RefreshCw size={18} className="animate-spin mr-2" /> Loading preview...
                            </div>
                        ) : previewData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
                                <span>No data to preview. Try adjusting options.</span>
                            </div>
                        ) : (
                            <table className="clipboard-preview-table">
                                <thead>
                                    <tr>
                                        <th className="w-12 text-center">#</th>
                                        {columnHeaders.map((header, index) => (
                                            <th key={index} title={String(header)}>
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {dataForTable.map((row, rowIndex) => (
                                        <tr key={rowIndex}>
                                            <td className="w-12 text-center text-muted-foreground font-mono text-xs">
                                                {rowIndex + 1}
                                            </td>
                                            {row.map((cell, cellIndex) => (
                                                <td key={cellIndex} title={String(cell || '')}>
                                                    {cell || ''}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                            </div>
                            {error && (
                                <div className="p-3 border-t border-border bg-destructive/5">
                                    <p className="text-xs text-destructive">Error while previewing: {error}</p>
                                </div>
                            )}
                            <div className="p-3 border-t border-border bg-muted/20">
                                <div className="text-xs text-muted-foreground">
                                    {dataForTable.length > 0 && (
                                        <span>
                                            {isPreviewTruncated ? `Showing first ${dataForTable.length} of ${originalRowCount} rows × ${columnHeaders.length} of ${originalColCount} columns` : `${originalRowCount} rows × ${originalColCount} columns`}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <ActiveElementHighlight active={tourActive && currentStep === 3} />
                </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-border flex items-center justify-end bg-secondary flex-shrink-0">
                <div>
                    <Button variant="outline" onClick={onBack} disabled={isProcessing} className="mr-2">Back</Button>
                    <div id="config-step-import-button-wrapper" className="relative inline-block">
                        <Button onClick={handleImport} disabled={isProcessing || isPreviewLoading || previewData.length === 0} className={cn(tourActive && currentStep === 4 && "focus:ring-primary")}>
                            {isProcessing && <RefreshCw size={16} className="animate-spin mr-1.5" />}
                            {isProcessing ? "Importing..." : "Import"}
                        </Button>
                        <ActiveElementHighlight active={tourActive && currentStep === 4} />
                    </div>
                </div>
            </div>
        </div>
    );
};