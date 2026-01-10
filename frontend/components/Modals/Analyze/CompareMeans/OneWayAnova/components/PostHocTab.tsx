import React, { FC } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PostHocTabProps } from "../types";
import { ActiveElementHighlight } from "@/components/Common/TourComponents";

const PostHocTab: FC<PostHocTabProps> = ({
    equalVariancesAssumed,
    setEqualVariancesAssumed,
    tourActive = false,
    currentStep = 0,
    tourSteps = []
}) => {
    const getStepIndex = (targetId: string) => tourSteps.findIndex(step => step.targetId === targetId);

    const equalVariancesAssumedStepIndex = getStepIndex("equal-variances-assumed-section");

    return (
        <div className="space-y-6">
            <div id="equal-variances-assumed-section" className="bg-card border border-border rounded-md p-5 relative">
                <div className="text-sm font-medium mb-3">Equal Variances Assumed</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <div className="flex items-center">
                        <Checkbox
                            id="tukey"
                            checked={equalVariancesAssumed.tukey}
                            onCheckedChange={(checked) => 
                                setEqualVariancesAssumed({ ...equalVariancesAssumed, tukey: !!checked })
                            }
                            className="mr-2"
                        />
                        <Label htmlFor="tukey" className="text-sm cursor-pointer">Tukey</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox
                            id="duncan"
                            checked={equalVariancesAssumed.duncan}
                            onCheckedChange={(checked) => 
                                setEqualVariancesAssumed({ ...equalVariancesAssumed, duncan: !!checked })
                            }
                            className="mr-2"
                        />
                        <Label htmlFor="duncan" className="text-sm cursor-pointer">Duncan</Label>
                    </div>
                </div>
                <ActiveElementHighlight active={tourActive && currentStep === equalVariancesAssumedStepIndex} />
            </div>
        </div>
    );
};

export default PostHocTab;