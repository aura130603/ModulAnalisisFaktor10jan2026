import type { FC} from "react";
import React, { useCallback } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { TargetListConfig } from "@/components/Common/VariableListManager";
import VariableListManager from "@/components/Common/VariableListManager";
import { ActiveElementHighlight } from "@/components/Common/TourComponents";
import { Variable } from "@/types/Variable";
import type { VariableTabProps, DuplicateCasesSource } from "./types";

const VariableTab: FC<VariableTabProps> = ({
    sourceVariables,
    matchingVariables,
    sortingVariables,
    highlightedVariable,
    setHighlightedVariable,
    sortOrder,
    setSortOrder,
    handleMoveVariable,
    handleReorderVariable,
    getVariableIcon,
    getDisplayName,
    tourActive,
    currentStep,
    tourSteps = []
}) => {
    const matchingStepIndex = tourSteps.findIndex(step => step.targetId === 'duplicate-cases-matching-variables');
    const sortingStepIndex = tourSteps.findIndex(step => step.targetId === 'duplicate-cases-sorting-variables');

    const targetLists: TargetListConfig[] = [
        {
            id: 'matching',
            title: 'Define matching cases by:',
            variables: matchingVariables,
            height: '150px',
            droppable: true,
            draggableItems: true,
        },
        {
            id: 'sorting',
            title: 'Sort within matching groups by:',
            variables: sortingVariables,
            height: '100px',
            droppable: true,
            draggableItems: true,
        }
    ];

    const renderListFooter = (listId: string) => {
        if (listId === 'sorting') {
            return (
                <div className="flex items-center mt-2">
                    <div className="ml-auto flex items-center space-x-4">
                        <RadioGroup 
                            value={sortOrder} 
                            onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}
                            className="flex space-x-4"
                        >
                            <div className="flex items-center">
                                <RadioGroupItem value="asc" id="ascending" />
                                <Label htmlFor="ascending" className="text-xs cursor-pointer text-foreground ml-2">
                                    Ascending
                                </Label>
                            </div>
                            <div className="flex items-center">
                                <RadioGroupItem value="desc" id="descending" />
                                <Label htmlFor="descending" className="text-xs cursor-pointer text-foreground ml-2">
                                    Descending
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
            );
        }
        return null;
    };

    const setManagerHighlightedVariable = useCallback((value: { id: string, source: string } | null) => {
        if (value && ['source', 'matching', 'sorting'].includes(value.source)) {
            setHighlightedVariable({ ...value, source: value.source as DuplicateCasesSource });
        } else {
            setHighlightedVariable(null);
        }
    }, [setHighlightedVariable]);


    return (
        <div className="w-full relative">
            <VariableListManager
                availableVariables={sourceVariables}
                targetLists={targetLists}
                variableIdKey="tempId"
                highlightedVariable={highlightedVariable}
                setHighlightedVariable={setManagerHighlightedVariable}
                onMoveVariable={handleMoveVariable}
                onReorderVariable={handleReorderVariable}
                getVariableIcon={getVariableIcon}
                getDisplayName={getDisplayName}
                renderListFooter={renderListFooter}
                showArrowButtons={true}
                availableListHeight="300px"
            />
             {/* Overlays for tour highlighting. Positioned to cover both the title and the list. */}
            <div
                id="duplicate-cases-matching-variables"
                className="absolute top-0 right-0 w-[48%] h-[185px] pointer-events-none rounded-md"
            >
                <ActiveElementHighlight active={!!(tourActive && currentStep === matchingStepIndex)} />
            </div>
            <div
                id="duplicate-cases-sorting-variables"
                className="absolute top-[200px] right-0 w-[48%] h-[160px] pointer-events-none rounded-md"
            >
                <ActiveElementHighlight active={!!(tourActive && currentStep === sortingStepIndex)} />
            </div>
        </div>
    );
};

export default VariableTab;