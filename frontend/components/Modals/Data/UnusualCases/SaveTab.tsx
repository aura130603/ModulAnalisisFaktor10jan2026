import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ActiveElementHighlight } from "@/components/Common/TourComponents";
import type { SaveTabProps } from "./types";

const SaveTab: React.FC<SaveTabProps> = ({
    saveAnomalyIndex,
    setSaveAnomalyIndex,
    anomalyIndexName,
    setAnomalyIndexName,
    savePeerGroups,
    setSavePeerGroups,
    saveReasons,
    setSaveReasons,
    replaceExisting,
    setReplaceExisting,
    tourActive,
    currentStep,
    tourSteps = []
}) => {
    const anomalyIndexStepIndex = tourSteps.findIndex(step => step.targetId === 'unusual-cases-save-anomaly-index');

    return (
        <div className="border border-border rounded-md p-6">
            <div className="text-sm font-medium mb-4">Save Variables</div>

            <div className="space-y-6">
                <div id="unusual-cases-save-anomaly-index" className="grid grid-cols-2 gap-6 relative p-1">
                    <ActiveElementHighlight active={!!(tourActive && currentStep === anomalyIndexStepIndex)} />
                    <div>
                        <div className="flex items-center">
                            <Checkbox
                                id="saveAnomalyIndex"
                                checked={saveAnomalyIndex}
                                onCheckedChange={(checked) => setSaveAnomalyIndex(!!checked)}
                                className="mr-2"
                            />
                            <Label htmlFor="saveAnomalyIndex" className="text-sm font-medium cursor-pointer">
                                Anomaly index
                            </Label>
                        </div>
                        <p className="text-xs mt-2 ml-6 text-muted-foreground">
                            Measures the unusualness of each case with respect to its peer.
                        </p>
                    </div>

                    <div className="flex items-center">
                        <Label htmlFor="anomalyIndexName" className="text-xs whitespace-nowrap mr-2">
                            Name:
                        </Label>
                        <Input
                            id="anomalyIndexName"
                            value={anomalyIndexName}
                            onChange={(e) => setAnomalyIndexName(e.target.value)}
                            className="h-8 text-sm"
                            disabled={!saveAnomalyIndex}
                        />
                    </div>
                </div>

                <div className="p-1">
                    <div className="flex items-center">
                        <Checkbox
                            id="savePeerGroups"
                            checked={savePeerGroups}
                            onCheckedChange={(checked) => setSavePeerGroups(!!checked)}
                            className="mr-2"
                        />
                        <Label htmlFor="savePeerGroups" className="text-sm font-medium cursor-pointer">
                            Peer group membership
                        </Label>
                    </div>
                    <p className="text-xs mt-2 ml-6 text-muted-foreground">
                        Saves peer group ID, size, and percentage size for each case.
                    </p>
                </div>

                <div className="p-1">
                     <div className="flex items-center">
                        <Checkbox
                            id="saveReasons"
                            checked={saveReasons}
                            onCheckedChange={(checked) => setSaveReasons(!!checked)}
                            className="mr-2"
                        />
                        <Label htmlFor="saveReasons" className="text-sm font-medium cursor-pointer">
                            Reasons for unusualness
                        </Label>
                    </div>
                    <p className="text-xs mt-2 ml-6 text-muted-foreground">
                        Saves the variable, its value, and its deviation from the peer norm for each reason.
                    </p>
                </div>

                <div className="border-t border-border pt-4 mt-6">
                    <div className="flex items-center">
                        <Checkbox
                            id="replaceExisting"
                            checked={replaceExisting}
                            onCheckedChange={(checked) => setReplaceExisting(!!checked)}
                            className="mr-2"
                        />
                        <Label htmlFor="replaceExisting" className="text-sm cursor-pointer">
                            Replace existing variables that have the same name or root name
                        </Label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SaveTab;