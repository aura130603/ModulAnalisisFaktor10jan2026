"use client";

import type { FC } from "react";
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useVariableStore } from "@/stores/useVariableStore";
import * as XLSX from "xlsx"; 
import { InfoIcon, RefreshCw, ArrowLeft, FileSpreadsheet, Loader2, X, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ImportExcelConfigurationStepProps, ParseSheetOptions, SheetData } from "../types";
import {
    parseSheetForPreview,
    processSheetForImport,
    generateVariablesFromData
} from "../importExcel.utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

// Komponen tabel dasar untuk preview data Excel

// CSS untuk tabel preview Excel
const excelPreviewStyles = `
.excel-preview-table {
    font-size: 0.875rem;
    border-collapse: separate;
    border-spacing: 0;
    width: 100%;
    min-width: max-content;
}

.excel-preview-table th,
.excel-preview-table td {
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

.excel-preview-table th {
    background-color: hsl(var(--muted));
    font-weight: 600;
    position: sticky;
    top: 0;
    z-index: 2;
    border-bottom: 2px solid hsl(var(--border));
}

.excel-preview-table th:first-child,
.excel-preview-table td:first-child {
    position: sticky;
    left: 0;
    z-index: 1;
    background-color: hsl(var(--muted) / 0.8);
    border-right: 2px solid hsl(var(--border));
}

.excel-preview-table th:first-child {
    z-index: 3;
    background-color: hsl(var(--muted));
}

.excel-preview-table tbody tr:nth-child(even) td {
    background-color: hsl(var(--muted) / 0.2);
}

.excel-preview-table tbody tr:nth-child(even) td:first-child {
    background-color: hsl(var(--muted) / 0.6);
}

.excel-preview-table tbody tr:hover td {
    background-color: hsl(var(--muted) / 0.4);
}

.excel-preview-table tbody tr:hover td:first-child {
    background-color: hsl(var(--muted) / 0.8);
}
`;

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
        title: "Select Worksheet",
        content: "Choose the specific worksheet from your Excel file that you want to import.",
        targetId: "excel-config-worksheet-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "",
    },
    {
        title: "Import Options",
        content: "Configure settings like whether the first row contains variable names.",
        targetId: "excel-config-options-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "",
    },
    {
        title: "Data Preview",
        content: "This table shows a preview of your data based on the selected worksheet and options.",
        targetId: "excel-config-preview-wrapper",
        defaultPosition: 'top',
        defaultHorizontalPosition: 'left',
        icon: "",
    },
    {
        title: "Import Data",
        content: "When you are satisfied with the preview and settings, click here to finalize the import.",
        targetId: "excel-config-import-button-wrapper",
        defaultPosition: 'top',
        defaultHorizontalPosition: 'right',
        icon: "",
    }
];

// Portal wrapper
const TourPopupPortal: FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); return () => setMounted(false); }, []);
    if (typeof window === "undefined" || !mounted) return null;
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

// Helper to convert SheetData back into a minimal workbook structure expected by util helpers
const buildWorkbookFromSheetData = (sheet: SheetData): XLSX.WorkBook => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sheet.data);
    XLSX.utils.book_append_sheet(wb, ws, sheet.sheetName);
    return wb;
};

export const ImportExcelConfigurationStep: FC<ImportExcelConfigurationStepProps> = ({
    onClose,
    onBack,
    fileName,
    parsedSheets,
}) => {
    const { overwriteAll } = useVariableStore();

    const [sheetNames, setSheetNames] = useState<string[]>([]);
    const [parsedSheetsState] = useState<SheetData[]>(parsedSheets);
    const [selectedSheet, setSelectedSheet] = useState<string>(parsedSheets[0]?.sheetName ?? "");

    const [range, setRange] = useState<string>("");
    const [parsedPreviewData, setParsedPreviewData] = useState<unknown[][]>([]);

    const [previewColumnHeaders, setPreviewColumnHeaders] = useState<string[] | false>(false);
    
    const [firstLineContains, setFirstLineContains] = useState<boolean>(true);
    const [readHiddenRowsCols, setReadHiddenRowsCols] = useState<boolean>(false);
    const [readEmptyCellsAs, setReadEmptyCellsAs] = useState<"empty" | "missing">("empty");

    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Tour state and logic
    const [tourActive, setTourActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [targetElements, setTargetElements] = useState<Record<string, HTMLElement | null>>({});

    const _startTour = useCallback(() => { setCurrentStep(0); setTourActive(true); }, []);
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

    useEffect(() => {
        if (!parsedSheetsState || parsedSheetsState.length === 0) {
            setError("No sheets parsed from Excel file.");
            setIsLoadingPreview(false);
            return;
        }
        const names = parsedSheetsState.map((s: SheetData) => s.sheetName);
        if (names.length === 0) {
            setError("No worksheets found in the Excel file.");
        }
        setSheetNames(names);
        setSelectedSheet(names[0] ?? "");
        setIsLoadingPreview(false);
    }, [parsedSheetsState]);

    const currentParseOptions = useCallback((): ParseSheetOptions => ({
        range,
        firstLineContains,
        readHiddenRowsCols,
        readEmptyCellsAs,
    }), [range, firstLineContains, readHiddenRowsCols, readEmptyCellsAs]);

    const updatePreview = useCallback(() => {
        if (!parsedSheetsState || !selectedSheet) {
            setParsedPreviewData([]);
            setPreviewColumnHeaders(false);
            setIsLoadingPreview(false);
            return;
        }
        setIsLoadingPreview(true);
        setError(null);

        const options = currentParseOptions();
        const sheet = parsedSheetsState.find((s: SheetData) => s.sheetName === selectedSheet);
        if (!sheet) {
            setError("Sheet not found.");
            setParsedPreviewData([]);
            setPreviewColumnHeaders(false);
            setIsLoadingPreview(false);
            return;
        }
        const workbook = buildWorkbookFromSheetData(sheet);
        const result = parseSheetForPreview(workbook, sheet.sheetName, options);

        if (result.error) {
            setError(result.error);
            setParsedPreviewData([]);
            setPreviewColumnHeaders(false);
        } else {
            setParsedPreviewData(result.data);
            setPreviewColumnHeaders(result.headers);
        }
        setIsLoadingPreview(false);
    }, [selectedSheet, parsedSheetsState, currentParseOptions]);

    useEffect(() => {
        updatePreview();
    }, [updatePreview]);

    const handleImport = async () => {
        if (!parsedSheetsState || !selectedSheet) {
            setError("No data to import. Check sheet selection and options.");
            return;
        }
        if (parsedPreviewData.length === 0 && !previewColumnHeaders) {
             setError("No data parsed for preview. Cannot import empty sheet or invalid configuration.");
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const options = currentParseOptions();
            const sheet = parsedSheetsState.find((s: SheetData) => s.sheetName === selectedSheet);
            if (!sheet) {
                setError("Sheet not found.");
                setIsProcessing(false);
                return;
            }
            const workbook = buildWorkbookFromSheetData(sheet);
            const importResult = processSheetForImport(workbook, sheet.sheetName, options);

            if (importResult.error) {
                setError(importResult.error);
                setIsProcessing(false);
                return;
            }
            
            const { processedFullData, actualHeaders } = importResult;

            if (processedFullData.length === 0 && actualHeaders.length === 0) {
                 setError("The sheet appears to be empty or no data was found with the current settings.");
                 setIsProcessing(false);
                 return;
            }

            const variables = generateVariablesFromData(processedFullData, actualHeaders, readEmptyCellsAs);

            // Atomically overwrite and persist data and variables
            await overwriteAll(variables, processedFullData);

            onClose();
        } catch (e: unknown) {
            console.error("Error processing Excel import: ", e);
            const message = e instanceof Error ? e.message : String(e);
            setError(`Import failed: ${message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setRange("");
        setFirstLineContains(true);
        setReadHiddenRowsCols(false);
        setReadEmptyCellsAs("empty");
        if (sheetNames.length > 0) {
             setSelectedSheet(sheetNames[0] ?? "");
        } else {
            setSelectedSheet("");
        }
        setError(null);
    };
    
    // Fungsi untuk mendapatkan header kolom tabel
    const getTableHeaders = () => {
        if (previewColumnHeaders === false || (Array.isArray(previewColumnHeaders) && previewColumnHeaders.length === 0 && parsedPreviewData[0]?.length > 0)) {
            return parsedPreviewData[0]?.length > 0 ? Array.from({length: parsedPreviewData[0].length}, (_,i)=> XLSX.utils.encode_col(i)) : [];
        }
        return Array.isArray(previewColumnHeaders) ? previewColumnHeaders : [];
    };
        
    return (
        <div className="flex flex-col h-full"> 
            <style dangerouslySetInnerHTML={{ __html: excelPreviewStyles }} />
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
            {/* Header - Responsive */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border flex-shrink-0">
                <div className="flex items-center flex-1 min-w-0">
                    <Button variant="ghost" size="icon" onClick={onBack} className="mr-2 sm:mr-3 -ml-1 sm:-ml-2 h-8 w-8 text-muted-foreground hover:text-foreground">
                        <ArrowLeft size={18} />
                    </Button>
                    <FileSpreadsheet size={18} className="mr-2 sm:mr-2.5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <h2 className="text-base sm:text-lg font-semibold truncate text-popover-foreground" title={`Configure Import: ${fileName}`}>
                            <span className="hidden sm:inline">Configure: </span>{fileName}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate hidden sm:block">
                            Review and configure options for your Excel file.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content - Responsive */}
            <div className="p-4 sm:p-6 flex-grow overflow-y-auto space-y-4 sm:space-y-6">
                {/* 1. Worksheet and Range Selection - Improved Layout */}
                <div id="excel-config-worksheet-wrapper" className="relative">
                    <Card className="border-border">
                        <CardHeader className="pb-3">
                            <CardTitle className={cn("text-sm font-medium", tourActive && currentStep === 0 && "text-primary")}>
                                Worksheet and Range Selection
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="worksheet-select" className="text-xs font-medium text-muted-foreground">
                                        Worksheet
                                    </Label>
                                    <Select 
                                        value={selectedSheet} 
                                        onValueChange={setSelectedSheet} 
                                        disabled={isLoadingPreview || isProcessing || sheetNames.length === 0}
                                    >
                                        <SelectTrigger className="w-full h-9" data-testid="worksheet-select-trigger">
                                            <SelectValue placeholder={sheetNames.length === 0 ? "No sheets found" : "Select a sheet"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sheetNames.map(name => (
                                                <SelectItem key={name} value={name}>{name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="range-input" className="text-xs font-medium text-muted-foreground">
                                            Read range (optional)
                                        </Label>
                                        <TooltipProvider delayDuration={100}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <InfoIcon size={13} className="text-muted-foreground cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs z-50">
                                                    <p>E.g., A1, A1:G10. If blank, reads entire used range.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <Input 
                                        id="range-input" 
                                        value={range} 
                                        onChange={(e) => setRange(e.target.value)} 
                                        placeholder="e.g., A1:G10"
                                        className="w-full h-9 text-sm"
                                        disabled={isLoadingPreview || isProcessing || !selectedSheet}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <ActiveElementHighlight active={tourActive && currentStep === 0} />
                </div>

                {/* 2. Import Options - Improved Layout */}
                <div id="excel-config-options-wrapper" className="relative">
                    <Card className="border-border">
                        <CardHeader className="pb-3">
                            <CardTitle className={cn("text-sm font-medium", tourActive && currentStep === 1 && "text-primary")}>
                                Import Options
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Row 1: Checkboxes */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id="firstLineContainsExcelConfig" 
                                        checked={firstLineContains} 
                                        onCheckedChange={(checked) => setFirstLineContains(Boolean(checked))} 
                                        disabled={isLoadingPreview || isProcessing || !selectedSheet}
                                    />
                                    <Label htmlFor="firstLineContainsExcelConfig" className="text-sm font-normal cursor-pointer select-none">
                                        First row as variable names
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id="readHiddenRowsColsConfig" 
                                        checked={readHiddenRowsCols} 
                                        onCheckedChange={(checked) => setReadHiddenRowsCols(Boolean(checked))} 
                                        disabled={isLoadingPreview || isProcessing || !selectedSheet}
                                    />
                                    <Label htmlFor="readHiddenRowsColsConfig" className="text-sm font-normal cursor-pointer select-none">
                                        Read hidden rows & columns
                                    </Label>
                                </div>
                            </div>
                            
                            {/* Row 2: Select and Button */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="empty-cells-select" className="text-xs font-medium text-muted-foreground">
                                        Read empty cells as
                                    </Label>
                                    <Select 
                                        value={readEmptyCellsAs} 
                                        onValueChange={(val) => setReadEmptyCellsAs(val as "empty" | "missing")} 
                                        disabled={isLoadingPreview || isProcessing || !selectedSheet}
                                    >
                                        <SelectTrigger id="empty-cells-select" className="w-full h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="empty">Empty string (treat as valid)</SelectItem>
                                            <SelectItem value="missing">System missing (SYSMIS)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-muted-foreground">
                                        Actions
                                    </Label>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={updatePreview} 
                                        disabled={isLoadingPreview || isProcessing || !selectedSheet} 
                                        className="w-full h-9"
                                    >
                                        <RefreshCw size={14} className={`mr-1.5 ${isLoadingPreview ? 'animate-spin' : ''}`} />
                                        Refresh Preview
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <ActiveElementHighlight active={tourActive && currentStep === 1} />
                </div>

                {/* 3. Data Preview - Improved Layout */}
                <div id="excel-config-preview-wrapper" className="relative">
                    <Card className="border-border">
                        <CardHeader className="pb-3">
                            <CardTitle className={cn("text-sm font-medium flex items-center justify-between", tourActive && currentStep === 2 && "text-primary")}>
                                Data Preview
                                <span className="text-xs font-normal text-muted-foreground">(max 100 rows shown)</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="border-t border-border bg-background hot-container-excel relative" 
                                 style={{
                                     zIndex: 0,
                                     minHeight: 'clamp(200px, 30vh, 300px)',
                                     maxHeight: 'clamp(300px, 50vh, 500px)',
                                     overflow: 'auto',
                                     scrollbarWidth: 'thin',
                                     scrollbarColor: 'hsl(var(--muted-foreground) / 0.5) hsl(var(--muted) / 0.3)'
                                 }}>
                                {(isLoadingPreview && !isProcessing) ? (
                                    <div className="absolute inset-0 flex items-center justify-center h-full text-muted-foreground bg-background/80 z-10">
                                        <RefreshCw size={18} className="animate-spin mr-2" /> Loading preview...
                                    </div>
                                ) : null}
                                {(!isLoadingPreview && error && (!parsedPreviewData || parsedPreviewData.length === 0)) ? (
                                     <div className="flex flex-col items-center justify-center h-full text-destructive p-4 text-center">
                                        <InfoIcon size={20} className="mb-2" /> 
                                        <span className="font-medium">Preview Error</span>
                                        <span className="text-xs max-w-sm mx-auto">{error}</span>
                                    </div>
                                ) : (!isLoadingPreview && (!parsedPreviewData || parsedPreviewData.length === 0) && !error) ? (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
                                        <InfoIcon size={20} className="mb-2" /> 
                                        { !selectedSheet ? "Please select a worksheet to see a preview." : "No data to preview. Try adjusting options."}
                                    </div>
                                ) : (parsedPreviewData && parsedPreviewData.length > 0) ? (
                                    <>
                                            <table className="excel-preview-table">
                                                <thead>
                                                    <tr>
                                                        <th className="w-12 text-center">#</th>
                                                        {getTableHeaders().map((header, index) => (
                                                            <th key={index} title={String(header)}>
                                                                {String(header)}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {parsedPreviewData.slice(0, 100).map((row, rowIndex) => (
                                                        <tr key={rowIndex}>
                                                            <td className="w-12 text-center text-muted-foreground font-mono text-xs">
                                                                {rowIndex + 1}
                                                            </td>
                                                            {Array.isArray(row) ? row.map((cell, cellIndex) => (
                                                                <td key={cellIndex} title={String(cell ?? '')}>
                                                                    {String(cell ?? '')}
                                                                </td>
                                                            )) : (
                                                                <td colSpan={getTableHeaders().length}>
                                                                    {String(row ?? '')}
                                                                </td>
                                                            )}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                    </>
                                ) : null }
                            </div>
                            {error && parsedPreviewData && parsedPreviewData.length > 0 && (
                                <div className="p-3 border-t border-border bg-destructive/5">
                                    <p className="text-xs text-destructive">Error while previewing: {error}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <ActiveElementHighlight active={tourActive && currentStep === 2} />
                </div>
            </div>

            {/* Footer - Responsive */}
            <div className="px-4 sm:px-6 py-3 border-t border-border flex flex-col sm:flex-row items-center justify-end bg-secondary flex-shrink-0 gap-3 sm:gap-0">
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={onBack} disabled={isProcessing} className="text-sm px-3 py-1.5 h-8">Back</Button>
                    <Button variant="outline" onClick={handleReset} disabled={isProcessing} className="text-sm px-3 py-1.5 h-8">Reset</Button>
                    <div id="excel-config-import-button-wrapper" className="relative">
                        <Button
                            onClick={handleImport}
                            disabled={isProcessing || !!error || (parsedPreviewData.length === 0 && !previewColumnHeaders) || !selectedSheet || isLoadingPreview}
                            className={cn("text-sm px-4 py-1.5 h-8", tourActive && currentStep === 3 && "focus:ring-primary")}
                            {...(isProcessing ? { loading: true } : {})}
                        >
                            {isProcessing && <Loader2 className="mr-2 animate-spin" size={14} />}
                            Import Data
                        </Button>
                        <ActiveElementHighlight active={tourActive && currentStep === 3} />
                    </div>
                </div>
            </div>
        </div>
    );
};