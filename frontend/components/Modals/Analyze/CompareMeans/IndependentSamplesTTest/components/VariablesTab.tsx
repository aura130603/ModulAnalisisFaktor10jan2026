import React, { FC, useCallback, useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import VariableListManager, { TargetListConfig } from '@/components/Common/VariableListManager';
import { ActiveElementHighlight } from "@/components/Common/TourComponents";
import { Variable } from "@/types/Variable";
import { VariablesTabProps } from "../types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";

const VariablesTab: FC<VariablesTabProps> = ({
    availableVariables,
    testVariables,
    groupingVariable,
    defineGroups,
    setDefineGroups,
    group1,
    setGroup1,
    group2,
    setGroup2,
    cutPointValue,
    setCutPointValue,
    estimateEffectSize,
    setEstimateEffectSize,
    highlightedVariable,
    setHighlightedVariable,
    moveToAvailableVariables,
    moveToTestVariables,
    moveToGroupingVariable,
    reorderVariables,
    tourActive = false,
    currentStep = 0,
    tourSteps = [],
}) => {
    const variableIdKeyToUse: keyof Variable = 'tempId';
    const [allowUnknown, setAllowUnknown] = useState(false);

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
        
        if (sourceListId === 'available' && groupingVariable) {
            moveToTestVariables(variable);
        } else if (sourceListId === 'test' || sourceListId === 'grouping') {
            moveToAvailableVariables(variable);
        }
    };

    const targetLists: TargetListConfig[] = [
        {
            id: 'test',
            title: 'Test Variable(s)',
            variables: testVariables,
            height: '169.5px',
            draggableItems: true,
            droppable: true,
        },
        {
            id: 'grouping',
            title: 'Grouping Variable',
            variables: groupingVariable ? [groupingVariable] : [],
            height: '44px',
            maxItems: 1,
            draggableItems: true,
            droppable: true
        }
    ];

    const managerHighlightedVariable = highlightedVariable
        ? { id: highlightedVariable.tempId, source: highlightedVariable.source }
        : null;

    const setManagerHighlightedVariable = useCallback((value: { id: string, source: string } | null) => {
        if (value && (value.source === 'available' || value.source === 'test' || value.source === 'grouping')) {
            setHighlightedVariable({ tempId: value.id, source: value.source as 'available' | 'test' | 'grouping' });
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
        } else if (toListId === 'grouping') {
            moveToGroupingVariable(variable);
        } else if (toListId === 'available') {
            moveToAvailableVariables(variable);
        }
    }, [moveToTestVariables, moveToGroupingVariable, moveToAvailableVariables, isVariableDisabled]);

    const handleReorderVariables = useCallback((listId: string, variables: Variable[]) => {
        if (listId === 'test') {
            reorderVariables('test', variables);
        }
    }, [reorderVariables]);

    const isTourElementActive = useCallback((elementId: string) => {
        if (!tourActive || currentStep >= tourSteps.length) return false;
        return tourSteps[currentStep]?.targetId === elementId;
    }, [tourActive, currentStep, tourSteps]);

    const groupingFooter = useCallback((listId: string) => {
        if (listId === 'grouping') {
            return (
                <>
                    <div className="mt-2">
                        <div id="define-groups-section" className="bg-card border border-border rounded-md p-5 relative">
                            <div className="text-sm font-medium mb-3 text-gray-900">Define Groups</div>
                            <div className="space-y-3">
                                <RadioGroup
                                    value={defineGroups.useSpecifiedValues ? "specified" : "cutpoint"}
                                    className="space-y-3"
                                    onValueChange={(value) => {
                                        setDefineGroups({
                                            ...defineGroups,
                                            useSpecifiedValues: value === "specified",
                                            cutPoint: value === "cutpoint"
                                        });
                                    }}
                                >
                                    <div id="use-specified-values-section" className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem
                                                value="specified"
                                                id="specified"
                                                className="h-4 w-4 text-blue-600"
                                            />
                                            <Label htmlFor="specified" className="text-sm font-medium text-gray-700">
                                                Use specified values
                                            </Label>  
                                        </div>
                                        <div className="ml-6 space-y-2">
                                            <div className="flex items-center space-x-3">
                                                <Label htmlFor="group1" className={`text-sm text-gray-600 min-w-[60px] ${!defineGroups.useSpecifiedValues ? 'opacity-50' : ''}`}>
                                                    Group 1:
                                                </Label>
                                                <Input
                                                    id="group1"
                                                    type="number"
                                                    disabled={!defineGroups.useSpecifiedValues}
                                                    value={group1 !== null ? group1 : ""}
                                                    onChange={(e) => setGroup1(e.target.value ? Number(e.target.value) : null)}
                                                    className="w-20 h-8 text-sm"
                                                />
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <Label htmlFor="group2" className={`text-sm text-gray-600 min-w-[60px] ${!defineGroups.useSpecifiedValues ? 'opacity-50' : ''}`}>
                                                    Group 2:
                                                </Label>
                                                <Input
                                                    id="group2"
                                                    type="number"
                                                    disabled={!defineGroups.useSpecifiedValues}
                                                    value={group2 !== null ? group2 : ""}
                                                    onChange={(e) => setGroup2(e.target.value ? Number(e.target.value) : null)}
                                                    className="w-20 h-8 text-sm"
                                                />
                                            </div>
                                        </div>
                                        {tourActive && isTourElementActive("use-specified-values-section") && (
                                            // className explanation:
                                            // "absolute" - posisi elemen menjadi absolut terhadap parent terdekat yang posisinya relatif
                                            // "inset-0" - mengatur top, right, bottom, left = 0, sehingga elemen menutupi seluruh parent
                                            // "pointer-events-none" - elemen ini tidak akan menerima interaksi mouse (klik, hover, dsb)
                                            // "border-2" - ketebalan border 2px
                                            // "border-primary" - warna border menggunakan warna utama (primary) dari theme/tailwind config
                                            // "animate-pulse" - menambahkan animasi pulse (berkedip perlahan)
                                            // "rounded-md" - sudut border membulat medium
                                            // "z-10" - z-index 10, agar elemen ini berada di atas konten lain
                                            <div className="absolute top-[16%] left-0 w-full h-[50%] pointer-events-none border-2 border-primary animate-pulse rounded-md z-10"></div>
                                        )}
                                    </div>
                                    
                                    <div id="cut-point-section" className="flex items-center space-x-3">
                                        <RadioGroupItem
                                            value="cutpoint"
                                            id="cutpoint"
                                            className="h-4 w-4 text-blue-600"
                                        />
                                        <Label htmlFor="cutpoint" className="text-sm font-medium text-gray-700">
                                            Cut point:
                                        </Label>
                                        <Input
                                            id="cutPointValue"
                                            type="number"
                                            disabled={defineGroups.useSpecifiedValues}
                                            value={cutPointValue !== null ? cutPointValue : ""}
                                            onChange={(e) => setCutPointValue(e.target.value ? Number(e.target.value) : null)}
                                            className="w-20 h-8 text-sm"
                                        />
                                        {tourActive && isTourElementActive("cut-point-section") && (
                                            <div className="absolute top-[70%] left-0 w-full h-[27%] pointer-events-none border-2 border-primary animate-pulse rounded-md z-10"></div>
                                        )}
                                    </div>
                                </RadioGroup>
                            </div>
                            {tourActive && isTourElementActive("define-groups-section") && (
                                <div className="absolute inset-0 pointer-events-none border-2 border-primary animate-pulse rounded-md z-10"></div>
                            )}
                        </div>
                    </div>
                    <div className="mt-2">
                        <div id="estimate-effect-size-section" className="flex items-center">
                            <Checkbox
                                id="estimate-effect-size"
                                checked={estimateEffectSize}
                                onCheckedChange={(checked) => setEstimateEffectSize(!!checked)}
                                className="mr-2 border-[#CCCCCC]"
                                disabled
                            />
                            <Label htmlFor="estimate-effect-size" className="text-sm">
                                Estimate effect size
                            </Label>
                            {tourActive && isTourElementActive("estimate-effect-size-section") && (
                                <div className="absolute top-[96%] left-0 w-full h-[5%] pointer-events-none border-2 border-primary animate-pulse rounded-md z-10"></div>
                            )}
                        </div>
                    </div>
                </>
            );
        }
        return null;
    }, [defineGroups, group1, group2, cutPointValue, isTourElementActive, tourActive,estimateEffectSize, setDefineGroups, setGroup1, setGroup2, setCutPointValue, setEstimateEffectSize]);

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
                    renderListFooter={groupingFooter}
                    showArrowButtons={true}
                />

                <div id="independent-samples-t-test-available-variables" className="absolute top-0 left-0 w-[48%] h-[70%] pointer-events-none rounded-md">
                    <ActiveElementHighlight active={tourActive && currentStep === tourSteps.findIndex(step => step.targetId === 'independent-samples-t-test-available-variables')} />
                </div>
                <div id="independent-samples-t-test-test-variables" className="absolute top-0 right-0 w-[48%] h-[36%] pointer-events-none rounded-md">
                    <ActiveElementHighlight active={tourActive && currentStep === tourSteps.findIndex(step => step.targetId === 'independent-samples-t-test-test-variables')} />
                </div>
                <div id="independent-samples-t-test-grouping-variable" className="absolute top-[38%] right-0 w-[48%] h-[14%] pointer-events-none rounded-md">
                    <ActiveElementHighlight active={tourActive && currentStep === tourSteps.findIndex(step => step.targetId === 'independent-samples-t-test-grouping-variable')} />
                </div>
            </div>
        </div>
    );
};

export default VariablesTab;