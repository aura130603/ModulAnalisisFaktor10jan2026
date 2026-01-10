"use client";

import type { FC} from "react";
import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, HelpCircle } from "lucide-react";
import { useExportCsv } from "./hooks/useExportCsv";
import type { ExportCsvProps } from "./types";
import { useTourGuide } from "./hooks/useTourGuide";
import { TourPopup, ActiveElementHighlight } from "@/components/Common/TourComponents";
import { AnimatePresence } from "framer-motion";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

// Komponen utama ExportCsv
export const ExportCsv: FC<ExportCsvProps> = ({ 
    onClose,
    containerType = "dialog",
    ...hookOptions 
}) => {
    const {
        exportOptions,
        isExporting,
        handleChange,
        handleFilenameChange,
        handleExport,
    } = useExportCsv(hookOptions);

    // Add tour hook
    const { 
        tourActive, 
        currentStep, 
        tourSteps, 
        currentTargetElement,
        startTour, 
        nextStep, 
        prevStep, 
        endTour 
    } = useTourGuide(containerType);

    // Helper function untuk mencari step index berdasarkan targetId (sesuai panduan)
    const getStepIndex = useCallback((targetId: string): number => {
        return tourSteps.findIndex(step => step.targetId === targetId);
    }, [tourSteps]);

    // Helper function untuk mengecek apakah step sedang aktif (sesuai panduan)
    const isStepActive = useCallback((targetId: string): boolean => {
        return tourActive && tourSteps[currentStep]?.targetId === targetId;
    }, [tourActive, tourSteps, currentStep]);

    return (
        <div className="flex flex-col h-full" id="export-csv-modal" data-testid="export-csv-modal">
            {/* Add tour popup */}
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

            <div className="p-6 flex-grow overflow-y-auto space-y-6" data-testid="export-csv-content">
                {/* 1. File Settings */}
                <Card className="border-border" data-testid="file-settings-card">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2" data-testid="file-settings-title">
                            <span className="text-lg">📄</span>
                            File Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* File Name */}
                        <div id="csv-filename-wrapper" className="space-y-2 relative">
                            <Label htmlFor="export-csv-filename" className="text-xs font-medium text-muted-foreground">
                                File Name
                            </Label>
                            <div className="relative">
                                <Input
                                    id="export-csv-filename"
                                    data-testid="export-csv-filename"
                                    value={exportOptions.filename}
                                    onChange={(e) => handleFilenameChange(e.target.value)}
                                    placeholder="Enter file name (e.g., dataset_export)"
                                    disabled={isExporting}
                                    className="h-9"
                                />
                                <ActiveElementHighlight 
                                    active={isStepActive("csv-filename-wrapper")} 
                                />
                            </div>
                        </div>

                        {/* Delimiter and Encoding */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div id="csv-delimiter-wrapper" className="space-y-2 relative">
                                <Label htmlFor="export-csv-delimiter" className="text-xs font-medium text-muted-foreground">
                                    Delimiter
                                </Label>
                                <div className="relative">
                                    <Select
                                        value={exportOptions.delimiter}
                                        onValueChange={(value) => handleChange("delimiter", value)}
                                        disabled={isExporting}
                                        data-testid="export-csv-delimiter"
                                    >
                                        <SelectTrigger id="export-csv-delimiter" className="h-9">
                                            <SelectValue placeholder="Select delimiter" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value=",">Comma (,)</SelectItem>
                                            <SelectItem value=";">Semicolon (;)</SelectItem>
                                            <SelectItem value="|">Pipe (|)</SelectItem>
                                            <SelectItem value="\t">Tab</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <ActiveElementHighlight 
                                        active={isStepActive("csv-delimiter-wrapper")} 
                                    />
                                </div>
                            </div>

                            <div id="csv-encoding-wrapper" className="space-y-2 relative">
                                <Label htmlFor="export-csv-encoding" className="text-xs font-medium text-muted-foreground">
                                    Encoding
                                </Label>
                                <div className="relative">
                                    <Select
                                        value={exportOptions.encoding}
                                        onValueChange={(value) => handleChange("encoding", value)}
                                        disabled={isExporting}
                                        data-testid="export-csv-encoding"
                                    >
                                        <SelectTrigger id="export-csv-encoding" className="h-9">
                                            <SelectValue placeholder="Select encoding" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="utf-8">UTF-8</SelectItem>
                                            <SelectItem value="utf-16le">UTF-16 LE</SelectItem>
                                            <SelectItem value="windows-1252">Windows-1252</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <ActiveElementHighlight 
                                        active={isStepActive("csv-encoding-wrapper")} 
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Export Options */}
                <Card className="border-border" data-testid="export-options-card">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2" data-testid="export-options-title">
                            <span className="text-lg">⚙️</span>
                            Export Options
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Header options */}
                        <div className="grid grid-cols-1 gap-3">
                            <div id="csv-headers-wrapper" className="flex items-center space-x-2 relative">
                                <Checkbox
                                    id="export-csv-includeHeaders"
                                    data-testid="export-csv-include-headers"
                                    checked={exportOptions.includeHeaders}
                                    onCheckedChange={(checked) => handleChange("includeHeaders", !!checked)}
                                    disabled={isExporting}
                                />
                                <Label 
                                    htmlFor="export-csv-includeHeaders"
                                    className="text-sm font-normal cursor-pointer"
                                >
                                    Include variable names as header row
                                </Label>
                                <ActiveElementHighlight 
                                    active={isStepActive("csv-headers-wrapper")} 
                                />
                            </div>

                            <div id="csv-properties-wrapper" className="flex items-center space-x-2 relative">
                                <Checkbox
                                    id="export-csv-includeVarProps"
                                    data-testid="export-csv-include-var-props"
                                    checked={exportOptions.includeVariableProperties}
                                    onCheckedChange={(checked) => handleChange("includeVariableProperties", !!checked)}
                                    disabled={isExporting}
                                />
                                <Label 
                                    htmlFor="export-csv-includeVarProps"
                                    className="text-sm font-normal cursor-pointer"
                                >
                                    Include variable properties as first row
                                </Label>
                                <ActiveElementHighlight 
                                    active={isStepActive("csv-properties-wrapper")} 
                                />
                            </div>

                            <div id="csv-quotes-wrapper" className="flex items-center space-x-2 relative">
                                <Checkbox
                                    id="export-csv-quoteStrings"
                                    data-testid="export-csv-quote-strings"
                                    checked={exportOptions.quoteStrings}
                                    onCheckedChange={(checked) => handleChange("quoteStrings", !!checked)}
                                    disabled={isExporting}
                                />
                                <Label 
                                    htmlFor="export-csv-quoteStrings"
                                    className="text-sm font-normal cursor-pointer"
                                >
                                    Quote all string values
                                </Label>
                                <ActiveElementHighlight 
                                    active={isStepActive("csv-quotes-wrapper")} 
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            {/* Footer */}
            <div id="csv-buttons-wrapper" className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0 relative" data-testid="export-csv-footer">
                {/* Left: Help/Tour button with tooltip */}
                <div className="flex items-center text-muted-foreground">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={startTour}
                                    className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                                    aria-label="Start feature tour"
                                    data-testid="export-csv-help-button"
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
                {/* Right: Action buttons */}
                <div>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isExporting}
                        className="mr-2"
                        data-testid="export-csv-cancel-button"
                    >
                        Cancel
                    </Button>
                    <Button
                        id="export-csv-button"
                        data-testid="export-csv-export-button"
                        onClick={handleExport}
                        disabled={isExporting || !exportOptions.filename.trim()}
                        className="relative"
                    >
                        {isExporting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Exporting...
                            </>
                        ) : (
                            "Export"
                        )}
                    </Button>
                </div>
                <ActiveElementHighlight 
                    active={isStepActive("csv-buttons-wrapper")} 
                />
            </div>
        </div>
    );
};

export default ExportCsv;