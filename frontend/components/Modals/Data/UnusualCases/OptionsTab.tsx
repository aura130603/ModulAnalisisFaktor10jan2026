import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ActiveElementHighlight } from "@/components/Common/TourComponents";
import type { OptionsTabProps } from "./types";

const OptionsTab: React.FC<OptionsTabProps> = ({
    identificationCriteria,
    setIdentificationCriteria,
    percentageValue,
    setPercentageValue,
    fixedNumber,
    setFixedNumber,
    useMinimumValue,
    setUseMinimumValue,
    cutoffValue,
    setCutoffValue,
    minPeerGroups,
    setMinPeerGroups,
    maxPeerGroups,
    setMaxPeerGroups,
    maxReasons,
    setMaxReasons,
    tourActive,
    currentStep,
    tourSteps = []
}) => {
    const criteriaStepIndex = tourSteps.findIndex(step => step.targetId === 'unusual-cases-identification-criteria');

    return (
        <div className="space-y-6">
            <div 
                id="unusual-cases-identification-criteria"
                className="w-full min-w-0 border border-border rounded-md p-6 relative"
            >
                <ActiveElementHighlight active={!!(tourActive && currentStep === criteriaStepIndex)} />
                <div className="text-sm font-medium mb-4">Criteria for Identifying Unusual Cases</div>

                <div className="space-y-4">
                    <RadioGroup value={identificationCriteria} onValueChange={setIdentificationCriteria} className="space-y-4">
                        <div>
                            <div className="flex items-center">
                                <RadioGroupItem value="percentage" id="percentageCriteria" className="mr-2" />
                                <Label htmlFor="percentageCriteria" className="text-sm cursor-pointer">
                                    Percentage of cases with highest anomaly index values
                                </Label>
                            </div>
                            <div className="ml-6 mt-2">
                                <div className="flex items-center">
                                    <Label htmlFor="percentageValue" className="text-xs mr-2">
                                        Percentage:
                                    </Label>
                                    <Input
                                        id="percentageValue"
                                        defaultValue={percentageValue}
                                        onChange={(e) => setPercentageValue(e.target.value)}
                                        className="h-8 text-sm w-24"
                                        disabled={identificationCriteria !== "percentage"}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-4">
                            <div className="flex items-center">
                                <RadioGroupItem value="fixed" id="fixedNumberCriteria" className="mr-2" />
                                <Label htmlFor="fixedNumberCriteria" className="text-sm cursor-pointer">
                                    Fixed number of cases with highest anomaly index values
                                </Label>
                            </div>
                            <div className="ml-6 mt-2">
                                <div className="flex items-center">
                                    <Label htmlFor="fixedNumber" className="text-xs mr-2">
                                        Number:
                                    </Label>
                                    <Input
                                        id="fixedNumber"
                                        defaultValue={fixedNumber}
                                        onChange={(e) => setFixedNumber(e.target.value)}
                                        className="h-8 text-sm w-24"
                                        disabled={identificationCriteria !== "fixed"}
                                    />
                                </div>
                            </div>
                        </div>
                    </RadioGroup>

                    <div>
                        <div className="flex items-center">
                            <Checkbox
                                id="useMinimumValue"
                                checked={useMinimumValue}
                                onCheckedChange={(checked) => setUseMinimumValue(!!checked)}
                                className="mr-2"
                            />
                            <Label htmlFor="useMinimumValue" className="text-sm cursor-pointer">
                                Identify only cases whose anomaly index value meets or exceeds a minimum value
                            </Label>
                        </div>
                        <div className="ml-6 mt-2">
                            <div className="flex items-center">
                                <Label htmlFor="cutoffValue" className="text-xs mr-2">
                                    Cutoff:
                                </Label>
                                <Input
                                    id="cutoffValue"
                                    defaultValue={cutoffValue}
                                    onChange={(e) => setCutoffValue(e.target.value)}
                                    className="h-8 text-sm w-24"
                                    disabled={!useMinimumValue}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="border border-border rounded-md p-6">
                 <div className="text-sm font-medium mb-4">Peer Groups</div>
                 <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                     <div className="flex items-center">
                         <Label htmlFor="minPeerGroups" className="text-xs mr-2 whitespace-nowrap">Minimum number:</Label>
                         <Input id="minPeerGroups" value={minPeerGroups} onChange={(e) => setMinPeerGroups(e.target.value)} className="h-8 text-sm w-full"/>
                     </div>
                     <div className="flex items-center">
                         <Label htmlFor="maxPeerGroups" className="text-xs mr-2 whitespace-nowrap">Maximum number:</Label>
                         <Input id="maxPeerGroups" value={maxPeerGroups} onChange={(e) => setMaxPeerGroups(e.target.value)} className="h-8 text-sm w-full"/>
                     </div>
                 </div>
            </div>
            <div className="border border-border rounded-md p-6">
                <div className="text-sm font-medium mb-4">Reasons</div>
                <div className="flex items-center w-1/2">
                    <Label htmlFor="maxReasons" className="text-xs mr-2 whitespace-nowrap">Maximum number per case:</Label>
                    <Input id="maxReasons" value={maxReasons} onChange={(e) => setMaxReasons(e.target.value)} className="h-8 text-sm w-full"/>
                </div>
            </div>
        </div>
    );
};

export default OptionsTab;