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
                            id="kruskal-wallis-h"
                            checked={testType.kruskalWallisH}
                            onCheckedChange={(checked) => 
                                setTestType({ ...testType, kruskalWallisH: !!checked })
                            }
                            className="mr-2"
                        />
                        <Label htmlFor="kruskal-wallis-h" className="text-sm cursor-pointer">Kruskal-Wallis H</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox
                            id="median"
                            checked={testType.median}
                            onCheckedChange={(checked) => 
                                setTestType({ ...testType, median: !!checked })
                            }
                            className="mr-2"
                            disabled
                        />
                        <Label htmlFor="median" className="text-sm cursor-pointer">Median</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox
                            id="jonckheere-terpstra"
                            checked={testType.jonckheereTerpstra}
                            onCheckedChange={(checked) => 
                                setTestType({ ...testType, jonckheereTerpstra: !!checked })
                            }
                            className="mr-2"
                            disabled
                        />
                        <Label htmlFor="jonckheere-terpstra" className="text-sm cursor-pointer">Jonckheere-Terpstra</Label>
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