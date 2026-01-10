import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ActiveElementHighlight } from "@/components/Common/TourComponents";
import type { OutputTabProps } from "./types";

const OutputTab: React.FC<OutputTabProps> = ({
    showUnusualCasesList,
    setShowUnusualCasesList,
    peerGroupNorms,
    setPeerGroupNorms,
    anomalyIndices,
    setAnomalyIndices,
    reasonOccurrence,
    setReasonOccurrence,
    caseProcessed,
    setCaseProcessed,
    tourActive,
    currentStep,
    tourSteps = []
}) => {
    const listStepIndex = tourSteps.findIndex(step => step.targetId === 'unusual-cases-unusual-list');
    const peerStepIndex = tourSteps.findIndex(step => step.targetId === 'unusual-cases-peer-group-table');
    const summaryStepIndex = tourSteps.findIndex(step => step.targetId === 'unusual-cases-case-summary');

    return (
        <>
            <div id="unusual-cases-unusual-list" className="relative p-1">
                <ActiveElementHighlight active={!!(tourActive && currentStep === listStepIndex)} />
                <div className="flex items-center">
                    <Checkbox
                        id="unusualCasesList"
                        checked={showUnusualCasesList}
                        onCheckedChange={(checked) => setShowUnusualCasesList(!!checked)}
                        className="mr-2"
                    />
                    <Label htmlFor="unusualCasesList" className="text-sm cursor-pointer">
                        List of unusual cases and reasons why they are considered unusual
                    </Label>
                </div>
            </div>

            <div className="border border-border rounded-md p-6 mt-4">
                <div className="text-sm font-medium mb-4">Summaries</div>

                <div className="space-y-6">
                    <div id="unusual-cases-peer-group-table" className="relative p-1">
                        <ActiveElementHighlight active={!!(tourActive && currentStep === peerStepIndex)} />
                        <div className="flex items-center">
                            <Checkbox
                                id="peerGroupNorms"
                                checked={peerGroupNorms}
                                onCheckedChange={(checked) => setPeerGroupNorms(!!checked)}
                                className="mr-2"
                            />
                            <Label htmlFor="peerGroupNorms" className="text-sm font-medium cursor-pointer">
                                Peer group norms
                            </Label>
                        </div>
                        <p className="text-xs mt-2 ml-6 text-muted-foreground">
                            Peer groups are groups of cases that have similar values for analysis variables. This option displays the
                            distributions of analysis variables by peer group.
                        </p>
                    </div>

                    <div>
                        <div className="flex items-center">
                            <Checkbox
                                id="anomalyIndices"
                                checked={anomalyIndices}
                                onCheckedChange={(checked) => setAnomalyIndices(!!checked)}
                                className="mr-2"
                            />
                            <Label htmlFor="anomalyIndices" className="text-sm font-medium cursor-pointer">
                                Anomaly indices
                            </Label>
                        </div>
                        <p className="text-xs mt-2 ml-6 text-muted-foreground">
                            The anomaly index measures how unusual a case is with respect to its peer group. This option displays the
                            distribution of anomaly index values among unusual cases.
                        </p>
                    </div>

                    <div>
                        <div className="flex items-center">
                            <Checkbox
                                id="reasonOccurrence"
                                checked={reasonOccurrence}
                                onCheckedChange={(checked) => setReasonOccurrence(!!checked)}
                                className="mr-2"
                            />
                            <Label htmlFor="reasonOccurrence" className="text-sm font-medium cursor-pointer">
                                Reason occurrence by analysis variable
                            </Label>
                        </div>
                        <p className="text-xs mt-2 ml-6 text-muted-foreground">
                            Reports how often each analysis variable was responsible for a case being considered unusual.
                        </p>
                    </div>

                    <div id="unusual-cases-case-summary" className="relative p-1">
                        <ActiveElementHighlight active={!!(tourActive && currentStep === summaryStepIndex)} />
                        <div className="flex items-center">
                            <Checkbox
                                id="caseProcessed"
                                checked={caseProcessed}
                                onCheckedChange={(checked) => setCaseProcessed(!!checked)}
                                className="mr-2"
                            />
                            <Label htmlFor="caseProcessed" className="text-sm font-medium cursor-pointer">
                                Case processed
                            </Label>
                        </div>
                        <p className="text-xs mt-2 ml-6 text-muted-foreground">
                            Summarizes the distribution of cases included and excluded from the analysis.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default OutputTab;