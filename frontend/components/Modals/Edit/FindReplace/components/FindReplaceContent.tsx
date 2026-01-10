"use client";

import React, { useState, FC, useEffect, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { X, ChevronLeft, ChevronRight, HelpCircle, Info, Replace, ReplaceAll } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FindAndReplaceModalProps } from "../types";
import { FindReplaceMode, TabType } from "../types";
import { useFindReplaceForm } from "../hooks/useFindReplaceForm";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";
import type { TourStep, PopupPosition, HorizontalPosition } from "./Tour";
import { TourPopup, ActiveElementHighlight } from "./Tour";
import { BaseModalProps } from "@/types/modalTypes";

interface FindAndReplaceContentProps extends Omit<FindAndReplaceModalProps, 'containerType' | 'columns'> {
    onClose: () => void;
}


export const FindReplaceContent: React.FC<FindAndReplaceContentProps> = ({
    onClose,
    defaultTab,
}) => {
    const {
        activeTab, setActiveTab, columnNames, selectedColumnName, setSelectedColumnName,
        findText, handleFindChange, replaceText, handleReplaceChange, matchCase, setMatchCase,
        matchTo, setMatchTo, direction, setDirection, findError, replaceError,
        handleFindNext, handleFindPrevious, handleReplace, handleReplaceAll,
        searchResultsCount, currentResultNumber,
    } = useFindReplaceForm({ defaultTab });

    const [tourActive, setTourActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [targetElements, setTargetElements] = useState<Record<string, HTMLElement | null>>({});

    const tourSteps = useMemo((): TourStep[] => {
        const commonPrefix: TourStep[] = [
            { title: "Select Column", content: "First, choose the column you want to search within from this dropdown.", targetId: "fr-column-wrapper", defaultPosition: 'bottom' as PopupPosition, defaultHorizontalPosition: 'left' as HorizontalPosition, icon: "🎯" },
            { title: "Text to Find", content: "Next, type the text you want to find here. Results will appear as you type.", targetId: "fr-find-input-wrapper", defaultPosition: 'bottom' as PopupPosition, defaultHorizontalPosition: 'left' as HorizontalPosition, icon: "🔍" }
        ];
        const replaceStep: TourStep = { title: "Replacement Text", content: "Enter the text that will replace the found text.", targetId: "fr-replace-input-wrapper", defaultPosition: 'bottom' as PopupPosition, defaultHorizontalPosition: 'left' as HorizontalPosition, icon: "✍️" };

        const commonSuffix: TourStep[] = [
            { title: "Match Case", content: "Check this box to make your search case-sensitive (e.g., 'A' will not match 'a').", targetId: "fr-match-case-wrapper", defaultPosition: 'right' as PopupPosition, defaultHorizontalPosition: 'left' as HorizontalPosition, icon: "🔠" },
            { title: "Matching Logic", content: "Define how the search should match text within a cell (e.g., anywhere, entire cell, etc.).", targetId: "fr-match-in-wrapper", defaultPosition: 'right' as PopupPosition, defaultHorizontalPosition: 'left' as HorizontalPosition, icon: "🧩" },
            { title: "Search Direction", content: "Set the direction for the 'Find Next'/'Previous' buttons to search up or down from the current selection.", targetId: "fr-direction-wrapper", defaultPosition: 'right' as PopupPosition, defaultHorizontalPosition: 'left' as HorizontalPosition, icon: "↕️" },
            { title: "Navigation", content: "Use these buttons to jump between the matches found in the selected column.", targetId: "fr-navigation-wrapper", defaultPosition: 'top' as PopupPosition, defaultHorizontalPosition: 'right' as HorizontalPosition, icon: "🧭" }
        ];
        const replaceActionsStep: TourStep = { title: "Replace Actions", content: "Click 'Replace' to change the current highlighted match, or 'Replace All' for every match in the column.", targetId: "fr-replace-actions-wrapper", defaultPosition: 'top' as PopupPosition, defaultHorizontalPosition: 'right' as HorizontalPosition, icon: "🔁" };


        return activeTab === TabType.REPLACE ? [...commonPrefix, replaceStep, ...commonSuffix, replaceActionsStep] : [...commonPrefix, ...commonSuffix];
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

    return (
        <>
            <AnimatePresence>
                {tourActive && (
                    <TourPopup step={tourSteps[currentStep]} currentStep={currentStep} totalSteps={tourSteps.length} onNext={nextStep} onPrev={prevStep} onClose={endTour} targetElement={currentTargetElement} />
                )}
            </AnimatePresence>
            <div className="p-6 overflow-y-auto flex-grow space-y-4">
                {/* Search Settings */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Search Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Tabs value={activeTab} onValueChange={val => setActiveTab(val as TabType)}>
                            <TabsList className="w-full">
                                <TabsTrigger value={TabType.FIND} className="w-1/2">Find</TabsTrigger>
                                <TabsTrigger value={TabType.REPLACE} className="w-1/2">Replace</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div id="fr-column-wrapper" className="space-y-1.5 relative">
                            <Label htmlFor="column-select" className="text-sm font-medium">Column</Label>
                            <Select value={selectedColumnName} onValueChange={setSelectedColumnName}>
                                <SelectTrigger id="column-select"><SelectValue placeholder="Select column" /></SelectTrigger>
                                <SelectContent>
                                    {columnNames?.map((colName: string) => <SelectItem key={colName} value={colName}>{colName}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <ActiveElementHighlight active={tourActive && tourSteps[currentStep]?.targetId === 'fr-column-wrapper'} />
                        </div>

                        <div id="fr-find-input-wrapper" className="space-y-1.5 relative">
                            <div className="flex justify-between items-baseline">
                                <Label htmlFor="find-input" className="text-sm font-medium">Find</Label>
                                {findText && searchResultsCount > 0 && <span className="text-xs text-muted-foreground">{currentResultNumber} of {searchResultsCount}</span>}
                                {findText && searchResultsCount === 0 && !findError && <span className="text-xs text-muted-foreground">No results</span>}
                            </div>
                            <Input id="find-input" type="text" value={findText} onChange={(e) => handleFindChange(e.target.value)} className={cn("text-sm", findError && "border-destructive focus-visible:ring-destructive")} aria-invalid={!!findError} aria-describedby={findError ? "find-error-message" : undefined} />
                            {findError && <p id="find-error-message" className="text-xs text-destructive pt-1">{findError}</p>}
                            <ActiveElementHighlight active={tourActive && tourSteps[currentStep]?.targetId === 'fr-find-input-wrapper'} />
                        </div>

                        {activeTab === TabType.REPLACE && (
                            <div id="fr-replace-input-wrapper" className="space-y-1.5 relative">
                                <Label htmlFor="replace-input" className="text-sm font-medium">Replace with</Label>
                                <Input id="replace-input" type="text" value={replaceText} onChange={(e) => handleReplaceChange(e.target.value)} className={cn("text-sm", replaceError && "border-destructive focus-visible:ring-destructive")} aria-invalid={!!replaceError} aria-describedby={replaceError ? "replace-error-message" : undefined} />
                                {replaceError && <p id="replace-error-message" className="text-xs text-destructive pt-1">{replaceError}</p>}
                                <ActiveElementHighlight active={tourActive && tourSteps[currentStep]?.targetId === 'fr-replace-input-wrapper'} />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Search Options */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Search Options</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div id="fr-match-case-wrapper" className="flex items-center space-x-2 relative">
                            <Checkbox id="match-case" checked={matchCase} onCheckedChange={(checked) => setMatchCase(Boolean(checked))} />
                            <Label htmlFor="match-case" className="text-sm font-normal cursor-pointer flex-1">Match case</Label>
                            <ActiveElementHighlight active={tourActive && tourSteps[currentStep]?.targetId === 'fr-match-case-wrapper'} />
                        </div>

                        <div className="space-y-4">
                            <div id="fr-match-in-wrapper" className="space-y-2 relative">
                                <Label className="text-sm font-medium">Match in</Label>
                                <RadioGroup value={matchTo} onValueChange={(value) => setMatchTo(value as any)} className="space-y-2">
                                    {[{ value: "contains", label: "Any part of cell" }, { value: "entire_cell", label: "Entire cell" }, { value: "begins_with", label: "Beginning of cell" }, { value: "ends_with", label: "End of cell" }].map(o => (
                                        <div key={o.value} className="flex items-center space-x-2"><RadioGroupItem value={o.value} id={`matchTo-${o.value}`} /><Label htmlFor={`matchTo-${o.value}`} className="text-sm font-normal cursor-pointer flex-1">{o.label}</Label></div>
                                    ))}
                                </RadioGroup>
                                <ActiveElementHighlight active={tourActive && tourSteps[currentStep]?.targetId === 'fr-match-in-wrapper'} />
                            </div>
                            
                            <div id="fr-direction-wrapper" className="space-y-2 relative">
                                <Label className="text-sm font-medium">Direction</Label>
                                <RadioGroup value={direction} onValueChange={(value) => setDirection(value as any)} className="space-y-2">
                                    {[{ value: "down", label: "Down" }, { value: "up", label: "Up" }].map(d => (
                                        <div key={d.value} className="flex items-center space-x-2"><RadioGroupItem value={d.value} id={`direction-${d.value}`} /><Label htmlFor={`direction-${d.value}`} className="text-sm font-normal cursor-pointer flex-1">{d.label}</Label></div>
                                    ))}
                                </RadioGroup>
                                <ActiveElementHighlight active={tourActive && tourSteps[currentStep]?.targetId === 'fr-direction-wrapper'} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="px-6 py-3 border-t border-border flex items-center justify-end bg-secondary flex-shrink-0">
                <div className="flex flex-wrap justify-end items-center gap-2">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                    {activeTab === TabType.REPLACE && (
                        <div id="fr-replace-actions-wrapper" className="flex items-center gap-2 relative">
                            <Button variant="destructive" onClick={handleReplaceAll} disabled={!findText || !!findError}><ReplaceAll className="mr-2 h-4 w-4" />Replace All</Button>
                            <Button variant="outline" onClick={handleReplace} disabled={!findText || !!findError}><Replace className="mr-2 h-4 w-4" />Replace</Button>
                            <ActiveElementHighlight active={tourActive && tourSteps[currentStep]?.targetId === 'fr-replace-actions-wrapper'} />

                        </div>
                    )}
                    <div id="fr-navigation-wrapper" className="inline-flex rounded-md shadow-sm border border-input bg-background relative">
                        <Button size="icon" variant="ghost" onClick={handleFindPrevious} disabled={!findText || !!findError} className="rounded-r-none h-9 w-10 border-r bg-primary text-primary-foreground hover:bg-primary/90"><span className="sr-only">Find Previous</span><ChevronLeft className="w-5 h-5" /></Button>
                        <Button size="icon" variant="ghost" onClick={handleFindNext} disabled={!findText || !!findError} className="rounded-l-none h-9 w-10 bg-primary text-primary-foreground hover:bg-primary/90"><span className="sr-only">Find Next</span><ChevronRight className="w-5 h-5" /></Button>
                        <ActiveElementHighlight active={tourActive && tourSteps[currentStep]?.targetId === 'fr-navigation-wrapper'} />
                    </div>
                </div>
            </div>
        </>
    );
};