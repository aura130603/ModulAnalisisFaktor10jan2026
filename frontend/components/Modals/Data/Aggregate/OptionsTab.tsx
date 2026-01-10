import type { FC } from "react";
import React from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { TourStep } from "./types";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const ActiveElementHighlight: FC<{active: boolean}> = ({active}) => {
    if (!active) return null;
    
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 rounded-md ring-2 ring-primary ring-offset-2 pointer-events-none"
        />
    );
};

interface OptionsTabProps {
    isAlreadySorted: boolean;
    setIsAlreadySorted: (value: boolean) => void;
    sortBeforeAggregating: boolean;
    setSortBeforeAggregating: (value: boolean) => void;
    containerType?: "dialog" | "sidebar" | "panel";
    tourActive: boolean;
    currentStep: number;
    tourSteps: TourStep[];
}

const OptionsTab: FC<OptionsTabProps> = ({
    isAlreadySorted,
    setIsAlreadySorted,
    sortBeforeAggregating,
    setSortBeforeAggregating,
    containerType = "dialog",
    tourActive,
    currentStep,
    tourSteps,
}) => {
    const isStepActive = (targetId: string) => {
        return tourActive && tourSteps[currentStep]?.targetId === targetId;
    };

    return (
        <div className="border border-border p-2 rounded-md bg-card">
            <div className="text-sm font-medium mb-2 text-foreground">Options for Very Large Datasets</div>
            <div className="space-y-3">
                <div className="flex items-center space-x-2 relative" id="aggregate-option-sorted-wrapper">
                    <div className="relative mt-0.5">
                        <Checkbox
                            id="already-sorted"
                            className="mr-2"
                            checked={isAlreadySorted}
                            onCheckedChange={(checked) => setIsAlreadySorted(!!checked)}
                        />
                         <ActiveElementHighlight active={isStepActive("aggregate-option-sorted-wrapper")} />
                    </div>
                    <Label htmlFor="already-sorted" className={cn("text-sm cursor-pointer text-foreground", isStepActive("aggregate-option-sorted-wrapper") && "text-primary font-medium")}>
                        File is already sorted on break variable(s)
                    </Label>
                </div>

                <div className="flex items-center space-x-2 relative" id="aggregate-option-sort-before-wrapper">
                    <div className="relative mt-0.5">
                        <Checkbox
                            id="sort-before"
                            className="mr-2"
                            checked={sortBeforeAggregating}
                            onCheckedChange={(checked) => setSortBeforeAggregating(!!checked)}
                        />
                        <ActiveElementHighlight active={isStepActive("aggregate-option-sort-before-wrapper")} />
                    </div>
                    <Label htmlFor="sort-before" className={cn("text-sm cursor-pointer text-foreground", isStepActive("aggregate-option-sort-before-wrapper") && "text-primary font-medium")}>
                        Sort file before aggregating
                    </Label>
                </div>

                <div className="text-sm text-muted-foreground mt-2">
                    <p>For very large datasets, sorting can improve performance significantly.</p>
                    <p className="mt-1">
                        If your data is already sorted by the break variables, check the first option to skip the sorting step.
                        Otherwise, checking the second option will sort your data before aggregating.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OptionsTab;