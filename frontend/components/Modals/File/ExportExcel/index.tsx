"use client";

import type { FC} from "react";
import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ExportExcelProps } from "./types";
import { EXCEL_FORMATS, EXCEL_OPTIONS_CONFIG } from "./utils/constants";
import { useExportExcelLogic } from "./hooks/useExportExcelLogic";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";
import { useTourGuide } from "./hooks/useTourGuide";
import { TourPopup, ActiveElementHighlight } from "@/components/Common/TourComponents";

export const ExportExcel: FC<ExportExcelProps> = ({ 
    onClose,
    containerType
}) => {
    const {
        exportOptions,
        isExporting,
        handleChange,
        handleFilenameChange,
        handleExport,
    } = useExportExcelLogic({ onClose });
    
    // Tour guide hook
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
    
    // Helper function to check if a tour step is active
    const isStepActive = useCallback((targetId: string): boolean => {
        return tourActive && tourSteps[currentStep]?.targetId === targetId;
    }, [tourActive, tourSteps, currentStep]);

    return (
        <div data-testid="export-excel-modal" className="flex flex-col h-full">
            {/* Tour popup */}
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
            
            <div data-testid="export-excel-content" className="p-6 space-y-5 flex-grow overflow-y-auto">
                {/* File Settings */}
                <Card data-testid="file-settings-card">
                    <CardHeader className="pb-3">
                        <CardTitle data-testid="file-settings-title" className="text-base">File Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* File Name */}
                        <div className="space-y-1.5 relative" id="excel-filename-wrapper">
                            <Label htmlFor="excel-filename" className={cn("text-sm font-medium", isStepActive("excel-filename-wrapper") && "text-primary")}>File Name</Label>
                            <div className="relative">
                                <Input
                                    id="excel-filename"
                                    data-testid="export-excel-filename"
                                    value={exportOptions.filename}
                                    onChange={(e) => handleFilenameChange(e.target.value)}
                                    placeholder="Enter file name (e.g., excel_export)"
                                    disabled={isExporting}
                                    className={cn("pr-12", isStepActive("excel-filename-wrapper") && "focus:ring-primary")}
                                />
                                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                                    .xlsx
                                </span>
                                <ActiveElementHighlight active={isStepActive("excel-filename-wrapper")} />
                            </div>
                        </div>

                        {/* Format */}
                        <div className="space-y-1.5 relative" id="excel-format-wrapper">
                            <Label htmlFor="excel-format" className={cn("text-sm font-medium", isStepActive("excel-format-wrapper") && "text-primary")}>Format</Label>
                            <div className="relative">
                                <Select
                                    data-testid="export-excel-format"
                                    value={exportOptions.format}
                                    onValueChange={(value) => handleChange("format", value)}
                                    disabled={isExporting}
                                >
                                    <SelectTrigger id="excel-format">
                                        <SelectValue placeholder="Select format" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {EXCEL_FORMATS.map((format) => (
                                            <SelectItem key={format.value} value={format.value}>
                                                {format.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <ActiveElementHighlight active={isStepActive("excel-format-wrapper")} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Export Options */}
                <Card data-testid="export-options-card">
                    <CardHeader className="pb-3">
                        <CardTitle data-testid="export-options-title" className="text-base">Export Options</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {EXCEL_OPTIONS_CONFIG.map((option) => (
                            <div key={option.id} id={`excel-${option.name}-wrapper`} className="flex items-center space-x-2 relative">
                                <div className="relative">
                                    <Checkbox
                                        id={option.id}
                                        data-testid={`export-excel-${option.name}`}
                                        checked={exportOptions[option.name as keyof typeof exportOptions] as boolean}
                                        onCheckedChange={(checked) => 
                                            handleChange(option.name as keyof typeof exportOptions, Boolean(checked))
                                        }
                                        disabled={isExporting}
                                    />
                                    <ActiveElementHighlight active={isStepActive(`excel-${option.name}-wrapper`)} />
                                </div>
                                <Label 
                                    htmlFor={option.id} 
                                    className={cn("text-sm font-normal cursor-pointer flex-1", isStepActive(`excel-${option.name}-wrapper`) && "text-primary font-medium")}
                                >
                                    {option.label}
                                </Label>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
            
            {/* Footer */}
            {/* Footer */}
            <div id="excel-buttons-wrapper" data-testid="export-excel-footer" className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0 relative">
                {/* Left: Help/Tour button with tooltip */}
                <div className="flex items-center text-muted-foreground">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    data-testid="export-excel-help-button"
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={startTour}
                                    className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                                    aria-label="Start feature tour"
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
                        data-testid="export-excel-cancel-button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isExporting}
                        className="mr-2"
                    >
                        Cancel
                    </Button>
                    <Button
                        data-testid="export-excel-export-button"
                        onClick={handleExport}
                        disabled={isExporting || !exportOptions.filename.trim()}
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
                    active={isStepActive("excel-buttons-wrapper")} 
                />
            </div>
        </div>
    );
};

export default ExportExcel;