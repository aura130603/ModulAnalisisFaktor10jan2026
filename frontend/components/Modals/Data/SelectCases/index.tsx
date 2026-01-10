"use client";

import type { FC } from "react";
import React from "react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, CornerDownRight, Info } from "lucide-react";
import { useSelectCases } from "./hooks/useSelectCases";
import { getVariableIcon, getDisplayName } from "./utils/variableUtils";

// Import dialogs from the dialogs folder
import SelectCasesIfCondition from "./dialogs/SelectCasesIfCondition";
import SelectCasesRandomSample from "./dialogs/SelectCasesRandomSample";
import SelectCasesRange from "./dialogs/SelectCasesRange";

const SelectCasesContent: FC<{ 
    onClose: () => void;
    containerType?: "dialog" | "sidebar";
}> = ({ onClose, containerType = "dialog" }) => {
    const {
        storeVariables,
        highlightedVariable,
        selectOption,
        filterVariable,
        outputOption,
        currentStatus,
        errorMessage,
        errorDialogOpen,
        ifConditionDialogOpen,
        randomSampleDialogOpen,
        rangeDialogOpen,
        conditionExpression,
        randomSampleConfig,
        rangeConfig,
        setErrorDialogOpen,
        setIfConditionDialogOpen,
        setRandomSampleDialogOpen,
        setRangeDialogOpen,
        handleVariableSelect,
        handleVariableDoubleClick,
        handleTransferClick,
        handleIfButtonClick,
        handleSampleButtonClick,
        handleRangeButtonClick,
        handleIfConditionContinue,
        handleRandomSampleContinue,
        handleRangeContinue,
        handleConfirm,
        handleReset,
        setOutputOption,
        setSelectOption,
        isProcessing
    } = useSelectCases();

    // Side-effect: listen to custom events for sidebar footer buttons
    React.useEffect(() => {
        const handleOk = () => {
            if (!isProcessing) handleConfirm();
        };
        const handleResetEvent = () => {
            if (!isProcessing) handleReset();
        };
        document.addEventListener('selectCasesOk', handleOk);
        document.addEventListener('selectCasesReset', handleResetEvent);
        return () => {
            document.removeEventListener('selectCasesOk', handleOk);
            document.removeEventListener('selectCasesReset', handleResetEvent);
        };
    }, [isProcessing, handleConfirm, handleReset]);

    const handleHelp = () => {
        console.log("Help requested");
    };

    const handlePaste = () => {
        console.log("Paste syntax requested");
    };

    return (
        <>
            <div className="overflow-y-auto overflow-x-hidden flex-grow p-2 sm:p-4 md:p-6">
                {/* Row 1: Variables List and Select - Stack on mobile, side by side on larger screens */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-6 mb-3 md:mb-6">
                    {/* Variables List */}
                    <div className="col-span-1 md:col-span-4">
                        <Label className="text-sm font-medium mb-2 block text-popover-foreground">Variables:</Label>
                        <div className="border border-border rounded-md h-[200px] sm:h-[240px] md:h-[280px] overflow-y-auto overflow-x-hidden bg-card">
                            <div className="p-2 space-y-1">
                                {storeVariables.map((variable) => (
                                    <TooltipProvider key={variable.columnIndex}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div
                                                    className={`flex items-center p-1.5 cursor-pointer border rounded-md ${highlightedVariable?.id === variable.columnIndex.toString() && highlightedVariable.source === 'available' ? "bg-primary border-primary text-primary-foreground" : "border-border hover:bg-accent text-card-foreground"}`}
                                                    onClick={() => handleVariableSelect(variable.columnIndex, 'available')}
                                                    onDoubleClick={() => handleVariableDoubleClick(variable.columnIndex, 'available')}
                                                >
                                                    <div className="flex items-center w-full">
                                                        {getVariableIcon(variable)}
                                                        <span className="text-sm truncate">{getDisplayName(variable)}</span>
                                                    </div>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="right">
                                                <p className="text-sm">{getDisplayName(variable)}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Select Section */}
                    <div className="col-span-1 md:col-span-8 mt-3 md:mt-0">
                        <div className="border border-border rounded-md p-3 sm:p-4 h-full bg-card">
                            <div className="text-sm font-medium mb-3 text-card-foreground">Select</div>

                            <div className="space-y-2 sm:space-y-3">
                                <label className="flex items-center space-x-2 text-card-foreground text-sm">
                                    <input
                                        type="radio"
                                        name="selectCasesOption"
                                        className="accent-primary"
                                        checked={selectOption === "all"}
                                        onChange={() => setSelectOption("all")}
                                    />
                                    <span>All cases</span>
                                </label>

                                <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
                                    <label className="flex items-center space-x-2 text-card-foreground text-sm flex-grow">
                                        <input
                                            type="radio"
                                            name="selectCasesOption"
                                            className="accent-primary"
                                            checked={selectOption === "condition"}
                                            onChange={() => setSelectOption("condition")}
                                        />
                                        <span>If condition is satisfied</span>
                                    </label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 mt-1 md:mt-0"
                                        onClick={handleIfButtonClick}
                                        disabled={selectOption !== "condition"}
                                    >
                                        If...
                                    </Button>
                                </div>
                                {selectOption === "condition" && conditionExpression && (
                                    <p className="text-sm ml-6 text-muted-foreground">
                                        Condition: <span className="font-semibold text-primary">{conditionExpression}</span>
                                    </p>
                                )}

                                <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
                                    <label className="flex items-center space-x-2 text-card-foreground text-sm flex-grow">
                                        <input
                                            type="radio"
                                            name="selectCasesOption"
                                            className="accent-primary"
                                            checked={selectOption === "random"}
                                            onChange={() => setSelectOption("random")}
                                        />
                                        <span>Random sample of cases</span>
                                    </label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 mt-1 md:mt-0"
                                        onClick={handleSampleButtonClick}
                                        disabled={selectOption !== "random"}
                                    >
                                        Sample...
                                    </Button>
                                </div>
                                {selectOption === "random" && randomSampleConfig && (
                                    <p className="text-sm ml-6 text-muted-foreground">
                                        Sample: {randomSampleConfig.sampleType === "approximate" ? `Approx. ${randomSampleConfig.percentage}%` : `Exactly ${randomSampleConfig.exactCount} from first ${randomSampleConfig.fromFirstCount || 'all'}`}
                                    </p>
                                )}

                                <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
                                    <label className="flex items-center space-x-2 text-card-foreground text-sm flex-grow">
                                        <input
                                            type="radio"
                                            name="selectCasesOption"
                                            className="accent-primary"
                                            checked={selectOption === "time"}
                                            onChange={() => setSelectOption("time")}
                                        />
                                        <span>Based on time or case range</span>
                                    </label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 mt-1 md:mt-0"
                                        onClick={handleRangeButtonClick}
                                        disabled={selectOption !== "time"}
                                    >
                                        Range...
                                    </Button>
                                </div>
                                {selectOption === "time" && rangeConfig && (
                                    <p className="text-sm ml-6 text-muted-foreground">
                                        Range: {rangeConfig.firstCase || 'Start'} to {rangeConfig.lastCase || 'End'}
                                    </p>
                                )}

                                <label className="flex items-center space-x-2 text-card-foreground text-sm">
                                    <input
                                        type="radio"
                                        name="selectCasesOption"
                                        className="accent-primary"
                                        checked={selectOption === "variable"}
                                        onChange={() => setSelectOption("variable")}
                                    />
                                    <span>Use filter variable:</span>
                                    <span className={`font-semibold truncate max-w-[100px] sm:max-w-[150px] md:max-w-none ${filterVariable ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {filterVariable ? getDisplayName(filterVariable) : "(None selected)"}
                                    </span>
                                </label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 ml-6 w-28 flex items-center justify-center"
                                    onClick={handleTransferClick}
                                    disabled={selectOption !== "variable" || !highlightedVariable}
                                >
                                    <CornerDownRight size={14} className="mr-1" /> Transfer
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Row 2: Output */}
                <div className="grid grid-cols-1 gap-3 md:gap-6">
                    <div className="border border-border rounded-md p-3 sm:p-4 bg-card">
                        <div className="text-sm font-medium mb-3 text-card-foreground">Output</div>
                        <div className="space-y-2 sm:space-y-3">
                            <label className="flex items-center space-x-2 text-card-foreground text-sm">
                                <input
                                    type="radio"
                                    name="outputOption"
                                    className="accent-primary"
                                    value="filter"
                                    checked={outputOption === "filter"}
                                    onChange={() => setOutputOption("filter")}
                                />
                                <span>Filter out unselected cases</span>
                            </label>
                            <label className="flex items-center space-x-2 text-card-foreground text-sm">
                                <input
                                    type="radio"
                                    name="outputOption"
                                    className="accent-primary"
                                    value="delete"
                                    checked={outputOption === "delete"}
                                    onChange={() => setOutputOption("delete")}
                                />
                                <span>Delete unselected cases</span>
                            </label>
                        </div>
                    </div>

                    <p className="text-sm text-muted-foreground px-1">
                        Current Status: <span className="font-semibold text-popover-foreground">{currentStatus}</span>
                    </p>
                </div>
            </div>

            {containerType === 'dialog' && (
                <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                    {/* Left section removed help icon */}
                    <div></div>
                    {/* Right: Buttons */}
                    <div className="flex items-center gap-2">
                        {isProcessing && <span className="text-sm text-muted-foreground mr-2">Processing...</span>}
                        <Button variant="outline" className="mr-2" onClick={handleReset} disabled={isProcessing}>Reset</Button>
                        <Button variant="outline" className="mr-2" onClick={onClose} disabled={isProcessing}>Cancel</Button>
                        <Button onClick={handleConfirm} disabled={isProcessing}>
                            {isProcessing ? "Processing..." : "OK"}
                        </Button>
                    </div>
                </div>
            )}

            {/* Error Dialog */}
            <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
                <DialogContent className="max-w-[400px] p-6 bg-popover border border-border shadow-md rounded-md">
                    <DialogHeader>
                        <DialogTitle>Action Cannot Be Completed</DialogTitle>
                    </DialogHeader>
                    <div className="flex gap-4 items-start">
                        <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-popover-foreground">{errorMessage}</p>
                    </div>
                    <DialogFooter className="mt-6">
                        <Button
                            className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4"
                            onClick={() => setErrorDialogOpen(false)}
                            data-testid="selectcases-error-ok-button"
                        >
                            OK
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Sub-dialogs for If, Random Sample, Range */}
            {ifConditionDialogOpen && (
                <Dialog open={ifConditionDialogOpen} onOpenChange={setIfConditionDialogOpen}>
                    <SelectCasesIfCondition
                        variables={storeVariables}
                        onClose={() => setIfConditionDialogOpen(false)}
                        onContinue={handleIfConditionContinue}
                        initialExpression={conditionExpression}
                    />
                </Dialog>
            )}

            {randomSampleDialogOpen && (
                <Dialog open={randomSampleDialogOpen} onOpenChange={setRandomSampleDialogOpen}>
                    <SelectCasesRandomSample
                        onClose={() => setRandomSampleDialogOpen(false)}
                        onContinue={handleRandomSampleContinue}
                        initialConfig={randomSampleConfig}
                    />
                </Dialog>
            )}

            {rangeDialogOpen && (
                <Dialog open={rangeDialogOpen} onOpenChange={setRangeDialogOpen}>
                    <SelectCasesRange
                        onClose={() => setRangeDialogOpen(false)}
                        onContinue={handleRangeContinue}
                        initialConfig={rangeConfig}
                    />
                </Dialog>
            )}
        </>
    );
};

// Main component that handles different container types
const SelectCases: FC<{ 
    onClose: () => void;
    containerType?: "dialog" | "sidebar";
}> = ({ onClose, containerType = "dialog" }) => {
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow overflow-auto">
                    <SelectCasesContent onClose={onClose} containerType={containerType} />
                </div>
                {/* Footer for sidebar */}
                <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary shrink-0">
                    <div></div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="mr-2"
                            onClick={() => document.dispatchEvent(new CustomEvent('selectCasesReset'))}
                            data-testid="selectcases-reset-button">
                            Reset
                        </Button>
                        <Button variant="outline" className="mr-2" onClick={onClose} data-testid="selectcases-cancel-button">
                            Cancel
                        </Button>
                        <Button onClick={() => document.dispatchEvent(new CustomEvent('selectCasesOk'))} data-testid="selectcases-ok-button">
                            OK
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // For dialog mode, use Dialog and DialogContent
    return (
        <Dialog open={true} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-xl p-0 bg-popover border border-border shadow-md rounded-md flex flex-col max-h-[90vh]" data-testid="selectcases-dialog-content">
                <SelectCasesContent onClose={onClose} containerType={containerType} />
            </DialogContent>
        </Dialog>
    );
};

export default SelectCases;