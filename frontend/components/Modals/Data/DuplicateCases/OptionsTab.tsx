import type { FC } from "react";
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ActiveElementHighlight } from "@/components/Common/TourComponents";
import type { OptionsTabProps } from "./types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const OptionsTab: FC<OptionsTabProps> = ({
    primaryCaseIndicator,
    setPrimaryCaseIndicator,
    primaryName,
    setPrimaryName,
    sequentialCount,
    setSequentialCount,
    sequentialName,
    setSequentialName,
    moveMatchingToTop,
    setMoveMatchingToTop,
    displayFrequencies,
    setDisplayFrequencies,
    filterByIndicator,
    setFilterByIndicator,
    tourActive,
    currentStep,
    tourSteps = []
}) => {
    const indicatorStepIndex = tourSteps.findIndex(step => step.targetId === 'duplicate-cases-indicator-variables');
    const moveStepIndex = tourSteps.findIndex(step => step.targetId === 'duplicate-cases-move-duplicates');

    return (
        <>
            <div 
                id="duplicate-cases-indicator-variables"
                className="border border-border rounded-md p-6 mb-6 bg-card relative"
            >
                <ActiveElementHighlight active={!!(tourActive && currentStep === indicatorStepIndex)} />
                <div className="text-sm font-medium mb-4 text-card-foreground">Variables to Create</div>

                <div className="space-y-6">
                    {/* Primary Case Indicator Name */}
                    <div className="grid grid-cols-2 gap-6 items-center">
                        <p className="text-sm font-medium text-card-foreground">
                            Indicator of primary cases
                        </p>
                        <div className="flex items-center">
                            <Label htmlFor="primaryName" className="text-xs whitespace-nowrap mr-2 text-card-foreground">
                                Name:
                            </Label>
                            <Input
                                id="primaryName"
                                value={primaryName}
                                onChange={(e) => setPrimaryName(e.target.value)}
                                className="h-8 text-sm"
                            />
                        </div>
                    </div>

                    {/* Primary Case Selection */}
                    <div className="pl-4">
                         <RadioGroup 
                            value={primaryCaseIndicator} 
                            onValueChange={(value) => setPrimaryCaseIndicator(value as 'first' | 'last')}
                            className="space-y-2"
                        >
                            <div className="flex items-center">
                                <RadioGroupItem value="last" id="primary-last" />
                                <Label htmlFor="primary-last" className="text-sm font-normal cursor-pointer text-foreground ml-2">
                                    Last case in each group is primary
                                </Label>
                            </div>
                            <div className="flex items-center">
                                <RadioGroupItem value="first" id="primary-first" />
                                <Label htmlFor="primary-first" className="text-sm font-normal cursor-pointer text-foreground ml-2">
                                    First case in each group is primary
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <Separator className="my-4" />

                    {/* Sequential Count */}
                    <div className="grid grid-cols-2 gap-6 items-center">
                        <div>
                            <div className="flex items-center">
                                <Checkbox
                                    id="sequentialCount"
                                    checked={sequentialCount}
                                    onCheckedChange={(checked) => setSequentialCount(!!checked)}
                                    className="mr-2"
                                />
                                <Label htmlFor="sequentialCount" className="text-sm font-medium cursor-pointer text-card-foreground">
                                    Sequential count of matching cases
                                </Label>
                            </div>
                            <p className="text-xs mt-2 ml-6 text-muted-foreground">
                                Creates a variable with a sequential count of cases within each matching group.
                            </p>
                        </div>

                        <div className="flex items-center">
                            <Label htmlFor="sequentialName" className="text-xs whitespace-nowrap mr-2 text-card-foreground">
                                Name:
                            </Label>
                            <Input
                                id="sequentialName"
                                value={sequentialName}
                                onChange={(e) => setSequentialName(e.target.value)}
                                className="h-8 text-sm"
                                disabled={!sequentialCount}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div 
                id="duplicate-cases-move-duplicates"
                className="border border-border rounded-md p-6 bg-card relative"
            >
                <ActiveElementHighlight active={!!(tourActive && currentStep === moveStepIndex)} />
                <div className="text-sm font-medium mb-4 text-card-foreground">File Management & Output</div>
                <div className="space-y-3">
                    <div className="flex items-center">
                        <Checkbox
                            id="moveToTop"
                            checked={moveMatchingToTop}
                            onCheckedChange={(checked) => setMoveMatchingToTop(!!checked)}
                            className="mr-2"
                        />
                        <Label htmlFor="moveToTop" className="text-sm cursor-pointer text-card-foreground">
                            Move matching cases to the top of the file
                        </Label>
                    </div>
                     <div className="flex items-center">
                        <Checkbox
                            id="filterByIndicator"
                            checked={filterByIndicator}
                            onCheckedChange={(checked) => setFilterByIndicator(!!checked)}
                            className="mr-2"
                        />
                        <Label htmlFor="filterByIndicator" className="text-sm cursor-pointer text-card-foreground">
                            Filter out duplicate cases after processing
                        </Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox
                            id="displayFrequencies"
                            checked={displayFrequencies}
                            onCheckedChange={(checked) => setDisplayFrequencies(!!checked)}
                            className="mr-2"
                        />
                        <Label htmlFor="displayFrequencies" className="text-sm cursor-pointer text-card-foreground">
                            Display frequencies for created variables
                        </Label>
                    </div>
                </div>
            </div>
        </>
    );
};

export default OptionsTab;