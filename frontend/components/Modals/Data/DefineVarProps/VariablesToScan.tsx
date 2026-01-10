"use client";

import type { FC } from "react";
import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { AlertCircle, HelpCircle, InfoIcon } from "lucide-react";
import VariableListManager from '@/components/Common/VariableListManager';
import type { VariablesToScanProps } from "./types";
import { useVariablesToScan } from "./hooks/useVariablesToScan";
import { useVariableStore } from "@/stores/useVariableStore";

// Main content component that's agnostic of container type
const VariablesToScanContent: FC<VariablesToScanProps> = ({ onClose, onContinue, containerType = "dialog" }) => {
    const { variables: storeVariables } = useVariableStore();
    const {
        availableVariables,
        managerHighlightedVariable,
        setManagerHighlightedVariable,
        errorMessage,
        errorDialogOpen,
        setErrorDialogOpen,
        limitCases,
        setLimitCases,
        caseLimit,
        setCaseLimit,
        limitValues,
        setLimitValues,
        valueLimit,
        setValueLimit,
        handleContinue,
        targetListsConfig,
        handleMoveVariable,
        handleReorderVariable,
    } = useVariablesToScan({ onContinue, initialAvailableVariables: storeVariables });

    return (
        <>
            <div className="p-6 overflow-y-auto flex-grow">
                {/* Information text */}
                <div className="flex items-center gap-2 py-2 mb-4 bg-accent p-3 rounded border border-border">
                    <InfoIcon className="text-accent-foreground h-4 w-4 flex-shrink-0" />
                    <p className="text-accent-foreground text-xs">
                        Select variables to scan. Categorical variables (nominal/ordinal) work best.
                        You can change measurement level in the next panel.
                    </p>
                </div>

                {/* Variable List Manager */}
                <div className="mb-6">
                    <VariableListManager
                        availableVariables={availableVariables}
                        targetLists={targetListsConfig}
                        variableIdKey="tempId"
                        highlightedVariable={managerHighlightedVariable}
                        setHighlightedVariable={setManagerHighlightedVariable}
                        onMoveVariable={handleMoveVariable}
                        onReorderVariable={handleReorderVariable}
                    />
                </div>

                {/* Limit options */}
                <div className="border border-border rounded-md p-6 mt-6 bg-card">
                    <div className="text-sm font-medium mb-4 text-card-foreground">Scanning Limits</div>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="limit-cases"
                                checked={limitCases}
                                onCheckedChange={(checked) => setLimitCases(checked === true)}
                                className="mr-2"
                            />
                            <Label htmlFor="limit-cases" className="text-sm cursor-pointer text-card-foreground">
                                Limit number of cases scanned to:
                            </Label>
                            <Input
                                value={caseLimit}
                                onChange={(e) => setCaseLimit(e.target.value)}
                                className="w-24 h-8 text-sm"
                                disabled={!limitCases}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="limit-values"
                                checked={limitValues}
                                onCheckedChange={(checked) => setLimitValues(checked === true)}
                                className="mr-2"
                            />
                            <Label htmlFor="limit-values" className="text-sm cursor-pointer text-card-foreground">
                                Limit number of values displayed to:
                            </Label>
                            <Input
                                value={valueLimit}
                                onChange={(e) => setValueLimit(e.target.value)}
                                className="w-24 h-8 text-sm"
                                disabled={!limitValues}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                {/* Left: Help icon (REMOVED) */}
                <div />
                {/* Right: Buttons */}
                <div>
                    <Button
                        variant="outline"
                        className="mr-2"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleContinue}
                    >
                        Continue
                    </Button>
                </div>
            </div>

            {/* Error Dialog */}
            <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
                <DialogContent className="max-w-[400px] p-6 bg-popover border border-border shadow-md rounded-md">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-[18px] font-semibold text-popover-foreground">Statify</DialogTitle>
                    </DialogHeader>
                    <div className="flex gap-4 items-start">
                        <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-popover-foreground">{errorMessage}</p>
                    </div>
                    <DialogFooter className="mt-6">
                        <Button
                            className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4"
                            onClick={() => setErrorDialogOpen(false)}
                        >
                            OK
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

// Main component that handles different container types
const VariablesToScan: FC<VariablesToScanProps> = ({ onClose, onContinue, containerType = "dialog" }) => {
    // If sidebar mode, use a div container
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden">
                <VariablesToScanContent 
                    onClose={onClose} 
                    onContinue={onContinue} 
                    containerType={containerType} 
                />
            </div>
        );
    }

    // For dialog mode, use Dialog and DialogContent
    return (
        <Dialog open={true} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-[650px] p-0 bg-popover border border-border shadow-md rounded-md flex flex-col max-h-[85vh]">
                <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                    <DialogTitle className="text-[22px] font-semibold text-foreground">Define Variable Properties</DialogTitle>
                </DialogHeader>
                
                <VariablesToScanContent 
                    onClose={onClose} 
                    onContinue={onContinue} 
                    containerType={containerType} 
                />
            </DialogContent>
        </Dialog>
    );
};

export default VariablesToScan;