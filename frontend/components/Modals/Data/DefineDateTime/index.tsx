"use client";

import type { FC } from "react";
import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar, Clock, Info } from "lucide-react";
import type { DefineDateTimeProps } from "./types";
import { useDefineDateTime } from "./hooks/useDefineDateTime";

// Main content component that's agnostic of container type
const DefineDateTimeContent: FC<DefineDateTimeProps> = ({ onClose }) => {
    const {
        casesAreOptions,
        selectedCase,
        setSelectedCase,
        timeComponents,
        handleInputChange,
        handleOk,
        handleReset,
        currentDatesFormatted
    } = useDefineDateTime(onClose);

    return (
        <>
            {/* Main container for content, behaves like Tabs in Descriptives */}
            <div className="w-full flex flex-col flex-grow overflow-hidden">
                {/* Scrollable area for the grid */}
                <div className="flex-grow p-6 overflow-y-auto">
                    <div className="flex items-center gap-2 py-2 mb-4 bg-accent p-3 rounded border border-border">
                        <Info size={14} className="text-accent-foreground h-4 w-4 flex-shrink-0" />
                        <p className="text-accent-foreground text-xs">
                            Define date and time formats for your variables. Variables with successfully defined formats will be moved to the &apos;Dated&apos; list.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 h-full"> {/* Grid takes full height of scrollable parent */}
                        {/* Left Column */}
                        <div className="flex flex-col space-y-2 h-full"> {/* Takes full height of grid cell */}
                            <Label className="text-xs font-semibold text-foreground flex-shrink-0">Cases Are:</Label>
                            <div 
                                className="border border-border p-2 rounded-md overflow-y-auto overflow-x-hidden"
                                style={{ height: '350px' }}
                            >
                                <div className="space-y-1">
                                    {casesAreOptions.map((option) => (
                                        <TooltipProvider key={option}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div
                                                        className={`flex items-center p-1 cursor-pointer border rounded-md hover:bg-accent ${selectedCase === option ? 'bg-accent border-primary text-accent-foreground' : 'border-border text-foreground'}`}
                                                        onClick={() => setSelectedCase(option)}
                                                    >
                                                        <div className="flex items-center w-full">
                                                            <Calendar size={14} className="text-muted-foreground mr-1 flex-shrink-0" />
                                                            <span className="text-xs truncate">{option}</span>
                                                        </div>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="right">
                                                    <p className="text-xs">{option}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ))}
                                </div>
                            </div>

                            <div className="border border-border p-2 rounded-md bg-card">
                                <Label className="text-xs font-semibold mb-1 block text-foreground">Current Dates:</Label>
                                <div className="flex items-center">
                                    <Clock size={14} className="text-muted-foreground mr-1 flex-shrink-0" />
                                    <span className="text-xs text-foreground">{currentDatesFormatted}</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="flex flex-col space-y-2 h-full"> {/* Takes full height of grid cell */}
                            <Label className="text-xs font-semibold text-foreground flex-shrink-0">First Case Is:</Label>
                            {/* Inner scrollable area for right column content */}
                            <div className="flex-grow overflow-y-auto min-h-0 space-y-2">
                                <div className="border border-border p-2 rounded-md space-y-3 bg-card">
                                    {timeComponents.map((component, index) => (
                                        <div key={index} className="space-y-1">
                                            <div className="flex justify-between items-center">
                                                <Label htmlFor={`component-${index}`} className="text-xs block text-foreground">
                                                    {component.name}:
                                                </Label>

                                                {component.periodicity && (
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Info size={12} />
                                                        <span>Periodicity: {component.periodicity}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <Input
                                                id={`component-${index}`}
                                                type="number"
                                                value={component.value}
                                                onChange={(e) => handleInputChange(index, Number(e.target.value))}
                                                className="h-7 text-xs"
                                            />
                                        </div>
                                    ))}

                                    {timeComponents.length === 0 && (
                                        <div className="text-xs text-muted-foreground text-center py-2">
                                            No date components to configure
                                        </div>
                                    )}
                                </div>

                                <div className="border border-border p-2 rounded-md bg-muted">
                                    <div className="flex items-start gap-2">
                                        <Info size={14} className="text-primary mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-muted-foreground">
                                            Periodicity values show how many units exist in the next higher level.
                                            For example, there are 4 quarters in a year, 12 months in a year,
                                            7 days in a week, etc.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer (OK, Reset, Cancel, Help buttons) */}
            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                {/* Left: Help icon */}
                <div />
                {/* Right: Buttons */}
                <div>
                    <Button
                        variant="outline"
                        onClick={handleReset}
                        className="mr-2"
                        data-testid="define-datetime-reset-button"
                    >
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="mr-2"
                        data-testid="define-datetime-cancel-button"
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleOk} data-testid="define-datetime-ok-button">
                        OK
                    </Button>
                </div>
            </div>
        </>
    );
};

// Main component that handles different container types
const DefineDateTime: FC<DefineDateTimeProps> = ({ onClose, containerType = "dialog" }) => {
    // If sidebar mode, use a div container without header (header is provided by SidebarContainer)
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <DefineDateTimeContent onClose={onClose} />
                </div>
            </div>
        );
    }

    // For dialog mode, use Dialog and DialogContent
    return (
        <Dialog open={true} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-[600px] p-0 bg-popover text-popover-foreground border border-border shadow-md rounded-md flex flex-col max-h-[85vh]" data-testid="define-datetime-dialog-content">
                <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0" data-testid="define-datetime-dialog-header">
                    <DialogTitle className="text-[22px] font-semibold" data-testid="define-datetime-dialog-title">Define Dates</DialogTitle>
                </DialogHeader>
                
                <div className="flex-grow flex flex-col overflow-hidden">
                    <DefineDateTimeContent onClose={onClose} />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default DefineDateTime;