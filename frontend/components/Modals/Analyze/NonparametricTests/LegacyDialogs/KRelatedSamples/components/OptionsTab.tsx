import React, { FC } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { OptionsTabProps } from "../types";
import { ActiveElementHighlight } from "@/components/Common/TourComponents";

const OptionsTab: FC<OptionsTabProps> = ({
    displayStatistics,
    setDisplayStatistics,
    testType,
    setTestType,
    tourActive = false,
    currentStep = 0,
    tourSteps = []
}) => {
    const getStepIndex = (targetId: string) => tourSteps.findIndex(step => step.targetId === targetId);

    const displayStatisticsStepIndex = getStepIndex("display-statistics-section");
    const testTypeStepIndex = getStepIndex("test-type-section");

    return (
        <div className="space-y-6">
            <div id="test-type-section" className="bg-card border border-border rounded-md p-5 relative">
                <div className="text-sm font-medium mb-3">Test Type</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <div className="flex items-center">
                        <Checkbox
                            id="friedman"
                            checked={testType.friedman}
                            onCheckedChange={(checked) => 
                                setTestType({ ...testType, friedman: !!checked })
                            }
                            className="mr-2"
                        />
                        <Label htmlFor="friedman" className="text-sm cursor-pointer">Friedman</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox
                            id="kendallsW"
                            checked={testType.kendallsW}
                            onCheckedChange={(checked) => 
                                setTestType({ ...testType, kendallsW: !!checked })
                            }
                            className="mr-2"
                            disabled
                        />
                        <Label htmlFor="kendallsW" className="text-sm cursor-pointer">Kendall&apos;s W</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox
                            id="cochransQ"
                            checked={testType.cochransQ}
                            onCheckedChange={(checked) => 
                                setTestType({ ...testType, cochransQ: !!checked })
                            }
                            className="mr-2"
                            disabled
                        />
                        <Label htmlFor="cochransQ" className="text-sm cursor-pointer">Cochran&apos;s Q</Label>
                    </div>
                </div>
                <ActiveElementHighlight active={tourActive && currentStep === testTypeStepIndex} />
            </div>

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