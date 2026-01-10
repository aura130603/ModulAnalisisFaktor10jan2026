import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { AggregatedVariable } from "../types";
import { Separator } from "@/components/ui/separator";
import { useMobile } from '@/hooks/useMobile';

interface FunctionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentEditingVariable: AggregatedVariable | null;
    functionCategory: "summary" | "specific" | "cases" | "percentages";
    setFunctionCategory: (category: "summary" | "specific" | "cases" | "percentages") => void;
    selectedFunction: string;
    setSelectedFunction: (func: string) => void;
    percentageType: "above" | "below" | "inside" | "outside";
    setPercentageType: (type: "above" | "below" | "inside" | "outside") => void;
    percentageValue: string;
    setPercentageValue: (value: string) => void;
    percentageLow: string;
    setPercentageLow: (value: string) => void;
    percentageHigh: string;
    setPercentageHigh: (value: string) => void;
    onApply: () => void;
}

const FunctionDialog: React.FC<FunctionDialogProps> = ({
    open,
    onOpenChange,
    currentEditingVariable,
    functionCategory,
    setFunctionCategory,
    selectedFunction,
    setSelectedFunction,
    percentageType,
    setPercentageType,
    percentageValue,
    setPercentageValue,
    percentageLow,
    setPercentageLow,
    percentageHigh,
    setPercentageHigh,
    onApply
}) => {
    const { isMobile } = useMobile();
    const isBaseStringType = currentEditingVariable?.baseVarType === "STRING";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="w-full p-0 border border-border rounded-md shadow-lg"
                style={{
                    maxWidth: isMobile ? "95vw" : "500px",
                    width: "100%",
                    maxHeight: isMobile ? "100vh" : "80vh",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                }}
            >
                <div className="px-4 py-2 flex-shrink-0 bg-muted/30">
                    <DialogHeader className="p-0">
                        <DialogTitle className="text-base font-semibold">
                            Aggregate Data: Aggregate Function
                        </DialogTitle>
                    </DialogHeader>
                </div>
                <Separator className="flex-shrink-0" />
                <div className="flex-grow overflow-y-auto p-3">
                    <div className="space-y-3">
                        <fieldset className="border border-border rounded-md p-3 bg-card/50">
                            <legend className="text-sm font-semibold px-1">Summary Statistics</legend>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <div className="flex items-center space-x-1">
                                    <input
                                        type="radio"
                                        id="mean"
                                        name="functionType"
                                        value="MEAN"
                                        className="w-3 h-3"
                                        checked={functionCategory === "summary" && selectedFunction === "MEAN"}
                                        onChange={() => {
                                            setFunctionCategory("summary");
                                            setSelectedFunction("MEAN");
                                        }}
                                        disabled={isBaseStringType}
                                    />
                                    <Label
                                        htmlFor="mean"
                                        className={`text-sm ${isBaseStringType ? 'text-muted-foreground/70 cursor-not-allowed' : ''}`}
                                    >
                                        Mean
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <input
                                        type="radio"
                                        id="median"
                                        name="functionType"
                                        value="MEDIAN"
                                        className="w-3 h-3"
                                        checked={functionCategory === "summary" && selectedFunction === "MEDIAN"}
                                        onChange={() => {
                                            setFunctionCategory("summary");
                                            setSelectedFunction("MEDIAN");
                                        }}
                                        disabled={isBaseStringType}
                                    />
                                    <Label
                                        htmlFor="median"
                                        className={`text-sm ${isBaseStringType ? 'text-muted-foreground/70 cursor-not-allowed' : ''}`}
                                    >
                                        Median
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <input
                                        type="radio"
                                        id="sum"
                                        name="functionType"
                                        value="SUM"
                                        className="w-3 h-3"
                                        checked={functionCategory === "summary" && selectedFunction === "SUM"}
                                        onChange={() => {
                                            setFunctionCategory("summary");
                                            setSelectedFunction("SUM");
                                        }}
                                        disabled={isBaseStringType}
                                    />
                                    <Label
                                        htmlFor="sum"
                                        className={`text-sm ${isBaseStringType ? 'text-muted-foreground/70 cursor-not-allowed' : ''}`}
                                    >
                                        Sum
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <input
                                        type="radio"
                                        id="stddev"
                                        name="functionType"
                                        value="STDDEV"
                                        className="w-3 h-3"
                                        checked={functionCategory === "summary" && selectedFunction === "STDDEV"}
                                        onChange={() => {
                                            setFunctionCategory("summary");
                                            setSelectedFunction("STDDEV");
                                        }}
                                        disabled={isBaseStringType}
                                    />
                                    <Label
                                        htmlFor="stddev"
                                        className={`text-sm ${isBaseStringType ? 'text-muted-foreground/70 cursor-not-allowed' : ''}`}
                                    >
                                        Standard Deviation
                                    </Label>
                                </div>
                            </div>
                        </fieldset>

                        <fieldset className="border border-border rounded-md p-3 bg-card/50">
                            <legend className="text-sm font-semibold px-1">Specific Values</legend>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <div className="flex items-center space-x-1">
                                    <input
                                        type="radio"
                                        id="first"
                                        name="functionType"
                                        value="FIRST"
                                        className="w-3 h-3"
                                        checked={functionCategory === "specific" && selectedFunction === "FIRST"}
                                        onChange={() => {
                                            setFunctionCategory("specific");
                                            setSelectedFunction("FIRST");
                                        }}
                                    />
                                    <Label htmlFor="first" className="text-sm">First</Label>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <input
                                        type="radio"
                                        id="last"
                                        name="functionType"
                                        value="LAST"
                                        className="w-3 h-3"
                                        checked={functionCategory === "specific" && selectedFunction === "LAST"}
                                        onChange={() => {
                                            setFunctionCategory("specific");
                                            setSelectedFunction("LAST");
                                        }}
                                    />
                                    <Label htmlFor="last" className="text-sm">Last</Label>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <input
                                        type="radio"
                                        id="min"
                                        name="functionType"
                                        value="MIN"
                                        className="w-3 h-3"
                                        checked={functionCategory === "specific" && selectedFunction === "MIN"}
                                        onChange={() => {
                                            setFunctionCategory("specific");
                                            setSelectedFunction("MIN");
                                        }}
                                        disabled={isBaseStringType}
                                    />
                                    <Label
                                        htmlFor="min"
                                        className={`text-sm ${isBaseStringType ? 'text-muted-foreground/70 cursor-not-allowed' : ''}`}
                                    >
                                        Minimum
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <input
                                        type="radio"
                                        id="max"
                                        name="functionType"
                                        value="MAX"
                                        className="w-3 h-3"
                                        checked={functionCategory === "specific" && selectedFunction === "MAX"}
                                        onChange={() => {
                                            setFunctionCategory("specific");
                                            setSelectedFunction("MAX");
                                        }}
                                        disabled={isBaseStringType}
                                    />
                                    <Label
                                        htmlFor="max"
                                        className={`text-sm ${isBaseStringType ? 'text-muted-foreground/70 cursor-not-allowed' : ''}`}
                                    >
                                        Maximum
                                    </Label>
                                </div>
                            </div>
                        </fieldset>

                        <fieldset className="border border-border rounded-md p-3 bg-card/50">
                            <legend className="text-sm font-semibold px-1">Number of cases</legend>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <div className="flex items-center space-x-1">
                                    <input
                                        type="radio"
                                        id="weighted"
                                        name="functionType"
                                        value="WEIGHTED"
                                        className="w-3 h-3"
                                        checked={functionCategory === "cases" && selectedFunction === "WEIGHTED"}
                                        onChange={() => {
                                            setFunctionCategory("cases");
                                            setSelectedFunction("WEIGHTED");
                                        }}
                                    />
                                    <Label htmlFor="weighted" className="text-sm">Weighted</Label>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <input
                                        type="radio"
                                        id="weighted-missing"
                                        name="functionType"
                                        value="WEIGHTED_MISSING"
                                        className="w-3 h-3"
                                        checked={functionCategory === "cases" && selectedFunction === "WEIGHTED_MISSING"}
                                        onChange={() => {
                                            setFunctionCategory("cases");
                                            setSelectedFunction("WEIGHTED_MISSING");
                                        }}
                                    />
                                    <Label htmlFor="weighted-missing" className="text-sm">Weighted missing</Label>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <input
                                        type="radio"
                                        id="unweighted"
                                        name="functionType"
                                        value="UNWEIGHTED"
                                        className="w-3 h-3"
                                        checked={functionCategory === "cases" && selectedFunction === "UNWEIGHTED"}
                                        onChange={() => {
                                            setFunctionCategory("cases");
                                            setSelectedFunction("UNWEIGHTED");
                                        }}
                                    />
                                    <Label htmlFor="unweighted" className="text-sm">Unweighted</Label>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <input
                                        type="radio"
                                        id="unweighted-missing"
                                        name="functionType"
                                        value="UNWEIGHTED_MISSING"
                                        className="w-3 h-3"
                                        checked={functionCategory === "cases" && selectedFunction === "UNWEIGHTED_MISSING"}
                                        onChange={() => {
                                            setFunctionCategory("cases");
                                            setSelectedFunction("UNWEIGHTED_MISSING");
                                        }}
                                    />
                                    <Label htmlFor="unweighted-missing" className="text-sm">Unweighted missing</Label>
                                </div>
                            </div>
                        </fieldset>

                        <fieldset className="border border-border rounded-md p-3 bg-card/50">
                            <legend className="text-sm font-semibold px-1">Percentages, Fractions, Counts</legend>
                            <div className="flex gap-4 mb-3 mt-2">
                                <div className="flex items-center space-x-1">
                                    <input
                                        type="radio"
                                        id="percentages"
                                        name="functionType"
                                        value="PERCENTAGE"
                                        className="w-3 h-3"
                                        checked={functionCategory === "percentages" && selectedFunction === "PERCENTAGE"}
                                        onChange={() => {
                                            setFunctionCategory("percentages");
                                            setSelectedFunction("PERCENTAGE");
                                        }}
                                        disabled={isBaseStringType}
                                    />
                                    <Label
                                        htmlFor="percentages"
                                        className={`text-sm ${isBaseStringType ? 'text-muted-foreground/70 cursor-not-allowed' : ''}`}
                                    >
                                        Percentages
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <input
                                        type="radio"
                                        id="fractions"
                                        name="functionType"
                                        value="FRACTION"
                                        className="w-3 h-3"
                                        checked={functionCategory === "percentages" && selectedFunction === "FRACTION"}
                                        onChange={() => {
                                            setFunctionCategory("percentages");
                                            setSelectedFunction("FRACTION");
                                        }}
                                        disabled={isBaseStringType}
                                    />
                                    <Label
                                        htmlFor="fractions"
                                        className={`text-sm ${isBaseStringType ? 'text-muted-foreground/70 cursor-not-allowed' : ''}`}
                                    >
                                        Fractions
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <input
                                        type="radio"
                                        id="counts"
                                        name="functionType"
                                        value="COUNT"
                                        className="w-3 h-3"
                                        checked={functionCategory === "percentages" && selectedFunction === "COUNT"}
                                        onChange={() => {
                                            setFunctionCategory("percentages");
                                            setSelectedFunction("COUNT");
                                        }}
                                    />
                                    <Label htmlFor="counts" className="text-sm">Counts</Label>
                                </div>
                            </div>

                            {functionCategory === "percentages" && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex items-center space-x-1">
                                            <input
                                                type="radio"
                                                id="above"
                                                name="percentageType"
                                                value="above"
                                                className="w-3 h-3"
                                                checked={percentageType === "above"}
                                                onChange={() => setPercentageType("above")}
                                                disabled={functionCategory !== "percentages"}
                                            />
                                            <Label htmlFor="above" className="text-sm">Above</Label>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <input
                                                type="radio"
                                                id="below"
                                                name="percentageType"
                                                value="below"
                                                className="w-3 h-3"
                                                checked={percentageType === "below"}
                                                onChange={() => setPercentageType("below")}
                                                disabled={functionCategory !== "percentages"}
                                            />
                                            <Label htmlFor="below" className="text-sm">Below</Label>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <input
                                                type="radio"
                                                id="inside"
                                                name="percentageType"
                                                value="inside"
                                                className="w-3 h-3"
                                                checked={percentageType === "inside"}
                                                onChange={() => setPercentageType("inside")}
                                                disabled={functionCategory !== "percentages"}
                                            />
                                            <Label htmlFor="inside" className="text-sm">Inside</Label>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <input
                                                type="radio"
                                                id="outside"
                                                name="percentageType"
                                                value="outside"
                                                className="w-3 h-3"
                                                checked={percentageType === "outside"}
                                                onChange={() => setPercentageType("outside")}
                                                disabled={functionCategory !== "percentages"}
                                            />
                                            <Label htmlFor="outside" className="text-sm">Outside</Label>
                                        </div>
                                    </div>

                                    {(percentageType === "above" || percentageType === "below") && (
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor="value" className="text-sm whitespace-nowrap">Value:</Label>
                                            <Input
                                                id="value"
                                                value={percentageValue}
                                                onChange={(e) => setPercentageValue(e.target.value)}
                                                className="h-7 text-sm"
                                                disabled={functionCategory !== "percentages"}
                                            />
                                        </div>
                                    )}

                                    {(percentageType === "inside" || percentageType === "outside") && (
                                        <div className="grid grid-cols-[auto_1fr_auto_1fr] items-center gap-x-2 gap-y-2">
                                            <Label htmlFor="low" className="text-sm whitespace-nowrap">Low:</Label>
                                            <Input
                                                id="low"
                                                value={percentageLow}
                                                onChange={(e) => setPercentageLow(e.target.value)}
                                                className="h-7 text-sm"
                                                disabled={functionCategory !== "percentages"}
                                            />

                                            <Label htmlFor="high" className="text-sm whitespace-nowrap">High:</Label>
                                            <Input
                                                id="high"
                                                value={percentageHigh}
                                                onChange={(e) => setPercentageHigh(e.target.value)}
                                                className="h-7 text-sm"
                                                disabled={functionCategory !== "percentages"}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </fieldset>
                    </div>
                </div>
                <Separator className="flex-shrink-0" />
                <DialogFooter className="px-4 py-2 flex-shrink-0 bg-muted/30">
                    <div className="flex gap-2 ml-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-sm"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            className="h-7 text-sm"
                            onClick={onApply}
                        >
                            OK
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export { FunctionDialog };