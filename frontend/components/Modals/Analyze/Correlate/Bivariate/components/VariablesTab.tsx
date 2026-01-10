import React, { FC, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import VariableListManager, { TargetListConfig } from '@/components/Common/VariableListManager';
import { ActiveElementHighlight } from "@/components/Common/TourComponents";
import { Variable } from "@/types/Variable";
import { VariablesTabProps } from "../types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const VariablesTab: FC<VariablesTabProps> = ({
    availableVariables,
    testVariables,
    highlightedVariable,
    setHighlightedVariable,
    moveToAvailableVariables,
    moveToTestVariables,
    reorderVariables,
    // Moved from OptionsTab
    correlationCoefficient,
    setCorrelationCoefficient,
    testOfSignificance,
    setTestOfSignificance,
    flagSignificantCorrelations,
    setFlagSignificantCorrelations,
    showOnlyTheLowerTriangle,
    setShowOnlyTheLowerTriangle,
    showDiagonal,
    setShowDiagonal,
    tourActive = false,
    currentStep = 0,
    tourSteps = [],
}) => {
    const variableIdKeyToUse: keyof Variable = 'tempId';
    
    const getDisplayName = (variable: Variable) => {
        if (!variable.label) return variable.name;
        return `${variable.label} [${variable.name}]`;
    };

    const isVariableDisabled = useCallback((variable: Variable): boolean => {   
        return variable.type !== 'NUMERIC';
    }, []);

    const handleDoubleClick = (variable: Variable, sourceListId: string) => {
        if (sourceListId === 'available' && isVariableDisabled(variable)) {
            return;
        }
        
        if (sourceListId === 'available') {
            moveToTestVariables(variable);
        } else if (sourceListId === 'test') {
            moveToAvailableVariables(variable);
        }
    };

    const targetLists: TargetListConfig[] = [
        {
            id: 'test',
            title: 'Test Variable(s):',
            variables: testVariables,
            height: '300px'
        }
    ];

    const managerHighlightedVariable = highlightedVariable
        ? { id: highlightedVariable.tempId, source: highlightedVariable.source }
        : null;

    const setManagerHighlightedVariable = useCallback((value: { id: string, source: string } | null) => {
        if (value && (value.source === 'available' || value.source === 'test')) {
            setHighlightedVariable({ tempId: value.id, source: value.source as 'available' | 'test' });
        } else {
            setHighlightedVariable(null);
        }
    }, [setHighlightedVariable]);

    const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => {
        if (toListId === 'test' && isVariableDisabled(variable)) {
            return;
        }
        
        if (toListId === 'test') {
            moveToTestVariables(variable, targetIndex);
        } else if (toListId === 'available') {
            moveToAvailableVariables(variable);
        }
    }, [moveToTestVariables, moveToAvailableVariables, isVariableDisabled]);

    const handleReorderVariables = useCallback((listId: string, variables: Variable[]) => {
        if (listId === 'test') {
            reorderVariables('test', variables);
        }
    }, [reorderVariables]);

    const isTourElementActive = useCallback((elementId: string) => {
        if (!tourActive || currentStep >= tourSteps.length) return false;
        return tourSteps[currentStep]?.targetId === elementId;
    }, [tourActive, currentStep, tourSteps]);

    const getStepIndex = (targetId: string) => tourSteps.findIndex(step => step.targetId === targetId);

    const correlationCoefficientStepIndex = getStepIndex("correlation-coefficient-section");
    const testOfSignificanceStepIndex = getStepIndex("test-of-significance-section");
    const flagSignificantCorrelationsStepIndex = getStepIndex("flag-significant-correlations-section");
    const showOnlyTheLowerTriangleStepIndex = getStepIndex("show-only-the-lower-triangle-section");
    const showDiagonalStepIndex = getStepIndex("show-diagonal-section");

    // --- Render the manager component and error message ---
    return (
        <div className="space-y-4">
            <div className="relative">
                <VariableListManager
                    availableVariables={availableVariables}
                    targetLists={targetLists}
                    variableIdKey={variableIdKeyToUse}
                    highlightedVariable={managerHighlightedVariable}
                    setHighlightedVariable={setManagerHighlightedVariable}
                    onMoveVariable={handleMoveVariable}
                    onReorderVariable={handleReorderVariables}
                    onVariableDoubleClick={handleDoubleClick}
                    availableListHeight={'273.5px'}
                    getDisplayName={getDisplayName}
                    isVariableDisabled={isVariableDisabled}
                    showArrowButtons={true}
                />

                <div id="bivariate-available-variables" className="absolute top-0 left-0 w-[48%] h-full pointer-events-none rounded-md">
                    <ActiveElementHighlight active={tourActive && currentStep === tourSteps.findIndex(step => step.targetId === 'bivariate-available-variables')} />
                </div>
                <div id="bivariate-test-variables" className="absolute top-0 right-0 w-[48%] h-[75%] pointer-events-none rounded-md">
                    <ActiveElementHighlight active={tourActive && currentStep === tourSteps.findIndex(step => step.targetId === 'bivariate-test-variables')} />
                </div>
            </div>

            {/* Moved from OptionsTab */}
            <div id="correlation-coefficient-section" className="bg-card border border-border rounded-md p-5 relative">
                <div className="text-sm font-medium mb-3">Correlation Coefficient</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <div className="flex items-center">
                        <Checkbox
                            id="pearson"
                            checked={correlationCoefficient.pearson}
                            onCheckedChange={(checked) => 
                                setCorrelationCoefficient({ ...correlationCoefficient, pearson: !!checked })
                            }
                            className="mr-2"
                        />
                        <Label htmlFor="pearson" className="text-sm cursor-pointer">Pearson</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox
                            id="kendalls-tau-b"
                            checked={correlationCoefficient.kendallsTauB}
                            onCheckedChange={(checked) => 
                                setCorrelationCoefficient({ ...correlationCoefficient, kendallsTauB: !!checked })
                            }
                            className="mr-2"
                        />
                        <Label htmlFor="kendalls-tau-b" className="text-sm cursor-pointer">Kendalls Tau-b</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox
                            id="spearman"
                            checked={correlationCoefficient.spearman}
                            onCheckedChange={(checked) => 
                                setCorrelationCoefficient({ ...correlationCoefficient, spearman: !!checked })
                            }
                            className="mr-2"
                        />
                        <Label htmlFor="spearman" className="text-sm cursor-pointer">Spearman</Label>
                    </div>
                </div>
                <ActiveElementHighlight active={tourActive && currentStep === correlationCoefficientStepIndex} />
            </div>

            <div id="test-of-significance-section" className="bg-card border border-border rounded-md p-5 relative">
                <div className="text-sm font-medium mb-3">Test of Significance</div>    
                    <RadioGroup
                        value={testOfSignificance.twoTailed ? "twoTailed" : "oneTailed"}
                        className="grid grid-cols-2 gap-x-6 gap-y-3"
                        onValueChange={(value) => {
                            setTestOfSignificance({
                                ...testOfSignificance,
                                twoTailed: value === "twoTailed",
                                oneTailed: value === "oneTailed"
                            });
                        }}
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem
                                value="twoTailed"
                                id="twoTailed"
                                className="h-4 w-4 text-blue-600"
                            />
                            <Label htmlFor="twoTailed" className="text-sm font-medium text-gray-700">
                                Two-tailed
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem
                                value="oneTailed"
                                id="oneTailed"
                                className="h-4 w-4 text-blue-600"
                            />
                            <Label htmlFor="oneTailed" className="text-sm font-medium text-gray-700">
                                One-tailed
                            </Label>
                        </div>
                    </RadioGroup>
                <ActiveElementHighlight active={tourActive && currentStep === testOfSignificanceStepIndex} />
            </div>

            <div className="bg-card border border-border rounded-md p-5 relative">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <div id="flag-significant-correlations-section" className="flex items-center">
                        <Checkbox
                            id="flag-significant-correlations"
                            checked={flagSignificantCorrelations}
                            onCheckedChange={(checked) => 
                                setFlagSignificantCorrelations(!!checked)
                            }
                            className="mr-2"
                            disabled
                        />
                        <Label htmlFor="flag-significant-correlations" className="text-sm cursor-pointer">Flag Significant Correlations</Label>
                        <ActiveElementHighlight active={tourActive && currentStep === flagSignificantCorrelationsStepIndex} />
                    </div>
                    <div id="show-only-the-lower-triangle-section" className="flex items-center">
                        <Checkbox
                            id="show-only-the-lower-triangle"
                            checked={showOnlyTheLowerTriangle}
                            onCheckedChange={(checked) => 
                                setShowOnlyTheLowerTriangle(!!checked)
                            }
                            className="mr-2"
                        />
                        <Label htmlFor="show-only-the-lower-triangle" className="text-sm cursor-pointer">Show Only the Lower Triangle</Label>
                        <ActiveElementHighlight active={tourActive && currentStep === showOnlyTheLowerTriangleStepIndex} />
                    </div>
                    <div id="show-diagonal-section" className="flex items-center">
                        <Checkbox
                            id="show-diagonal"
                            checked={showDiagonal}
                            onCheckedChange={(checked) => 
                                setShowDiagonal(!!checked)
                            }
                            className="mr-2"
                            disabled={!showOnlyTheLowerTriangle}
                        />
                        <Label htmlFor="show-diagonal" className="text-sm cursor-pointer">Show Diagonal</Label>
                        <ActiveElementHighlight active={tourActive && currentStep === showDiagonalStepIndex} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VariablesTab;