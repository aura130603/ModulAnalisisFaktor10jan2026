import React, { FC } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { OptionsTabProps } from "../types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ActiveElementHighlight } from "@/components/Common/TourComponents";

const OptionsTab: FC<OptionsTabProps> = ({
    expectedRange,
    setExpectedRange,
    rangeValue,
    setRangeValue,
    expectedValue,
    setExpectedValue,
    expectedValueList,
    setExpectedValueList,
    displayStatistics,
    setDisplayStatistics,
    highlightedExpectedValueIndex,
    setHighlightedExpectedValueIndex,
    addExpectedValue,
    removeExpectedValue,
    changeExpectedValue,
    tourActive = false,
    currentStep = 0,
    tourSteps = []
}) => {
    const getStepIndex = (targetId: string) => tourSteps.findIndex(step => step.targetId === targetId);

    const displayStatisticsStepIndex = getStepIndex("display-statistics-section");
    const expectedRangeStepIndex = getStepIndex("expected-range-section");
    const expectedValueStepIndex = getStepIndex("expected-value-section");

    return (
        <div className="space-y-6">
            <div id="display-statistics-section" className="bg-card border border-border rounded-md p-5 relative">
                <div className="text-sm font-medium mb-3">Statistics</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <div className="flex items-center">
                        <Checkbox
                            id="descriptive"
                            checked={displayStatistics.descriptive}
                            onCheckedChange={(checked) => 
                                setDisplayStatistics({ ...displayStatistics, descriptive: !!checked })
                            }
                            className="mr-2"
                        />
                        <Label htmlFor="descriptive" className="text-sm cursor-pointer">Descriptive</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox
                            id="quartiles"
                            checked={displayStatistics.quartiles}
                            onCheckedChange={(checked) => 
                                setDisplayStatistics({ ...displayStatistics, quartiles: !!checked })
                            }
                            className="mr-2"
                        />
                        <Label htmlFor="quartiles" className="text-sm cursor-pointer">Quartiles</Label>
                    </div>
                </div>
                <ActiveElementHighlight active={tourActive && currentStep === displayStatisticsStepIndex} />
            </div>

            <div id="expected-range-section" className="bg-card border border-border rounded-md p-5 relative">
                <div className="text-sm font-medium mb-2">Expected Range</div>
                <div className="flex items-center gap-2 mb-2">
                    <RadioGroup
                        value={expectedRange.getFromData ? "getFromData" : "useSpecifiedRange"}
                        className="gap-2"
                        onValueChange={(value) => {
                            setExpectedRange({
                                ...expectedRange,
                                getFromData: value === "getFromData",
                                useSpecifiedRange: value === "useSpecifiedRange"
                            });
                        }}
                    >
                        <div className="flex items-center">
                            <RadioGroupItem
                                value="getFromData"
                                id="getFromData"
                                className="mr-2 h-4 w-4"
                            />
                            <Label htmlFor="getFromData" className="text-sm">Get from data</Label>  
                        </div>
                        <div className="flex items-center">
                            <RadioGroupItem
                                value="useSpecifiedRange"
                                id="useSpecifiedRange"
                                className="mr-2 h-4 w-4"
                            />
                            <Label htmlFor="useSpecifiedRange" className="text-sm">Use specified range</Label>
                        </div>
                    </RadioGroup>
                </div>
                <div className="grid gap-1 mt-1 ml-6">
                    <div className="grid grid-cols-[50px_1fr] gap-1 flex items-center space-x-2">
                        <Label htmlFor="lowerValue" className={`col-span-1 text-sm ${!expectedRange.useSpecifiedRange ? 'opacity-50' : ''}`}>Lower:</Label>
                        <Input
                            id="lowerValue"
                            type="number"
                            disabled={!expectedRange.useSpecifiedRange}
                            value={rangeValue.lowerValue || ""}
                            onChange={(e) => setRangeValue({
                                ...rangeValue,
                                lowerValue: e.target.value ? Number(e.target.value) : null
                            })}
                            className="w-20 h-8 text-sm"
                        />
                    </div>
                    <div className="grid grid-cols-[50px_1fr] gap-1 flex items-center space-x-2">
                        <Label htmlFor="upperValue" className={`col-span-1 text-sm ${!expectedRange.useSpecifiedRange ? 'opacity-50' : ''}`}>Upper:</Label>
                        <Input
                            id="upperValue"
                            type="number"
                            disabled={!expectedRange.useSpecifiedRange}
                            value={rangeValue.upperValue || ""}
                            onChange={(e) => setRangeValue({
                                ...rangeValue,
                                upperValue: e.target.value ? Number(e.target.value) : null
                            })}
                            className="w-20 h-8 text-sm"
                        />
                    </div>
                </div>
                <ActiveElementHighlight active={tourActive && currentStep === expectedRangeStepIndex} />
            </div>

            <div id="expected-value-section" className="bg-card border border-border rounded-md p-5 relative">
                <div className="text-sm font-medium mb-2">Expected Value</div>
                <div className="flex items-center gap-2 mb-2">
                    <RadioGroup
                        value={expectedValue.allCategoriesEqual ? "allCategoriesEqual" : "values"}
                        className="gap-2"
                        onValueChange={(value) => setExpectedValue({
                            ...expectedValue,
                            allCategoriesEqual: value === "allCategoriesEqual",
                            values: value === "values"
                        })}
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem
                                value="allCategoriesEqual"
                                id="allCategoriesEqual"
                                className="h-4 w-4"
                            />
                            <Label htmlFor="allCategoriesEqual" className="text-sm">All categories equal</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem
                                value="values"
                                id="values"
                                className="h-4 w-4"
                            />
                            <Label htmlFor="values" className="text-sm">Values:</Label>
                            <Input
                                id="values"
                                type="number"
                                disabled={!expectedValue.values}
                                value={expectedValue.inputValue ?? ""}
                                onChange={(e) => setExpectedValue({
                                    ...expectedValue,
                                    inputValue: e.target.value !== "" ? Number(e.target.value) : null
                                })}
                                className="w-20 h-8 text-sm"
                            />
                        </div>
                    </RadioGroup>
                </div>
                <div className="grid grid-cols-[auto_auto_1fr] gap-1 mt-1 ml-6">
                    <div className="flex flex-col justify-center space-y-1 w-max">
                        <Button
                            variant="outline"
                            className="h-8 text-xs"
                            disabled={
                                expectedValue.allCategoriesEqual ||
                                expectedValue.inputValue === null || 
                                expectedValue.inputValue === 0
                            }
                            onClick={addExpectedValue}
                        >
                            Add
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 text-xs"
                            disabled={highlightedExpectedValueIndex === null || expectedValue.allCategoriesEqual || expectedValue.inputValue === null}
                            onClick={() => {
                                if (highlightedExpectedValueIndex !== null && expectedValueList[highlightedExpectedValueIndex] !== undefined) {
                                    changeExpectedValue(expectedValueList[highlightedExpectedValueIndex]);
                                    setHighlightedExpectedValueIndex(null);
                                }
                            }}
                        >
                            Change
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 text-xs"
                            disabled={highlightedExpectedValueIndex === null || expectedValue.allCategoriesEqual}
                            onClick={() => {
                                if (highlightedExpectedValueIndex !== null && expectedValueList[highlightedExpectedValueIndex] !== undefined) {
                                    removeExpectedValue(expectedValueList[highlightedExpectedValueIndex]);
                                    setHighlightedExpectedValueIndex(null);
                                }
                            }}
                        >
                            Remove
                        </Button>
                    </div>
                    <div
                        className={`
                            border p-1 rounded-md w-full transition-colors relative bg-background overflow-y-auto overflow-x-hidden
                            ${expectedValue.allCategoriesEqual ? 'opacity-50' : ''}
                        `}
                        style={{ height: "172px", minWidth: "62px"}}
                    >
                        <div className="space-y-0.5 p-0.5 transition-all duration-150">
                            {expectedValueList.map((value, index) => (
                                <div
                                    key={`${value}-${index}`}
                                    className={`
                                        items-center p-1 border rounded-md group relative transition-all duration-150 ease-in-out text-sm w-12
                                        ${expectedValue.allCategoriesEqual ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                        ${highlightedExpectedValueIndex === index ? "bg-accent border-primary" : "border-border"}
                                        ${highlightedExpectedValueIndex === index ? "" : "hover:bg-accent"}
                                    `}
                                    style={{
                                        borderTopStyle: 'solid',
                                        borderTopWidth: '1px',
                                        borderTopColor: highlightedExpectedValueIndex === index ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                                        paddingTop: '4px',
                                        paddingBottom: '4px',
                                        borderLeftWidth: '1px',
                                        borderRightWidth: '1px',
                                        borderBottomWidth: '1px',
                                        borderLeftColor: highlightedExpectedValueIndex === index ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                                        borderRightColor: highlightedExpectedValueIndex === index ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                                        borderBottomColor: highlightedExpectedValueIndex === index ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                                    }}
                                    onClick={() => !expectedValue.allCategoriesEqual && setHighlightedExpectedValueIndex(index)}
                                >
                                    <div className="flex items-center w-full truncate">
                                        <span className="truncate">{value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <ActiveElementHighlight active={tourActive && currentStep === expectedValueStepIndex} />
            </div>

            
            {/* <div className="mb-4">
                <div className="text-sm font-medium mb-2">Missing Values</div>
                <div className="border p-4 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                        <input
                            type="radio"
                            id="exclude-cases"
                            name="missing-values"
                            checked={true}
                            readOnly
                            className="h-4 w-4 text-black border-[#CCCCCC]"
                        />
                        <Label htmlFor="exclude-cases" className="text-sm">Exclude cases test-by-test</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="radio"
                            id="exclude-listwise"
                            name="missing-values"
                            checked={false}
                            readOnly
                            className="h-4 w-4 text-black border-[#CCCCCC]"
                        />
                        <Label htmlFor="exclude-listwise" className="text-sm">Exclude cases listwise</Label>
                    </div>
                </div>
            </div> */}
        </div>
    );
};

export default OptionsTab;