import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    UnivariateEMMeansProps,
    UnivariateEMMeansType,
} from "@/components/Modals/Analyze/general-linear-model/univariate/types/univariate";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CIADJUSTMENTMETHOD } from "@/components/Modals/Analyze/general-linear-model/multivariate/constants/multivariate-method";
import { CheckedState } from "@radix-ui/react-checkbox";
import VariableListManager, {
    TargetListConfig,
} from "@/components/Common/VariableListManager";
import type { Variable } from "@/types/Variable";
import { HelpCircle } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import {
    TooltipProvider,
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";
import { TourPopup } from "@/components/Common/TourComponents";
import { useTourGuide } from "../hooks/useTourGuide";
import { emmeansTourSteps } from "../hooks/tourConfig";

export const UnivariateEMMeans = ({
    isEMMeansOpen,
    setIsEMMeansOpen,
    updateFormData,
    data,
}: UnivariateEMMeansProps) => {
    const [EMMeansState, setEMMeansState] = useState<UnivariateEMMeansType>({
        ...data,
    });

    const {
        tourActive,
        currentStep,
        tourSteps,
        currentTargetElement,
        startTour,
        nextStep,
        prevStep,
        endTour,
    } = useTourGuide(emmeansTourSteps);

    const [availableVars, setAvailableVars] = useState<Variable[]>([]);
    const [displayMeansVars, setDisplayMeansVars] = useState<Variable[]>([]);
    const [compareMainEffectsDisabled, setCompareMainEffectsDisabled] =
        useState(true);
    const [highlightedVariable, setHighlightedVariable] = useState<{
        id: string;
        source: string;
    } | null>(null);

    const createDummyVariable = (name: string): Variable => ({
        name,
        tempId: name,
        label: name,
        columnIndex: -1,
        type: "STRING",
        width: 8,
        decimals: 2,
        align: "left",
        missing: null,
        measure: "unknown",
        role: "input",
        values: [],
        columns: 0,
    });

    useEffect(() => {
        if (isEMMeansOpen) {
            setEMMeansState({ ...data });

            const uniqueVariables = Array.from(new Set(data.SrcList ?? []));

            const generatePermutations = (variables: string[]) => {
                const result: string[] = [];
                for (let i = 0; i < variables.length; i++) {
                    for (let j = i + 1; j < variables.length; j++) {
                        result.push(`${variables[i]}*${variables[j]}`);
                        for (let k = j + 1; k < variables.length; k++) {
                            result.push(
                                `${variables[i]}*${variables[j]}*${variables[k]}`
                            );
                        }
                    }
                }
                return result;
            };

            const allPossibleNames = [
                "(OVERALL)",
                ...uniqueVariables,
                ...generatePermutations(uniqueVariables),
            ];
            const allPossibleVars = allPossibleNames.map(createDummyVariable);
            const varsMap = new Map(allPossibleVars.map((v) => [v.name, v]));

            const initialDisplayMeans = (data.TargetList || [])
                .map((name) => varsMap.get(name))
                .filter(Boolean) as Variable[];
            setDisplayMeansVars(initialDisplayMeans);

            const usedNames = new Set(data.TargetList || []);
            setAvailableVars(
                allPossibleVars.filter((v) => !usedNames.has(v.name))
            );
        }
    }, [isEMMeansOpen, data]);

    useEffect(() => {
        const hasNormalVariable = displayMeansVars.some(
            (v) => v.name !== "(OVERALL)" && !v.name.includes("*")
        );
        setCompareMainEffectsDisabled(!hasNormalVariable);

        setEMMeansState((prev) => ({
            ...prev,
            TargetList: displayMeansVars.map((v) => v.name),
            CompMainEffect: !hasNormalVariable ? false : prev.CompMainEffect,
        }));
    }, [displayMeansVars]);

    const handleChange = (
        field: keyof UnivariateEMMeansType,
        value: CheckedState | number | string | null
    ) => {
        setEMMeansState((prevState) => ({
            ...prevState,
            [field]: value,
        }));
    };

    const handleMoveVariable = useCallback(
        (variable: Variable, fromListId: string, toListId: string) => {
            if (fromListId === "available" && toListId === "DisplayMeans") {
                setAvailableVars((prev) =>
                    prev.filter((v) => v.name !== variable.name)
                );
                setDisplayMeansVars((prev) => [...prev, variable]);
            } else if (
                fromListId === "DisplayMeans" &&
                toListId === "available"
            ) {
                setDisplayMeansVars((prev) =>
                    prev.filter((v) => v.name !== variable.name)
                );
                setAvailableVars((prev) => [...prev, variable]);
            }
        },
        []
    );

    const handleReorderVariable = useCallback(
        (listId: string, newVariables: Variable[]) => {
            if (listId === "DisplayMeans") {
                setDisplayMeansVars(newVariables);
            }
        },
        []
    );

    const handleContinue = () => {
        Object.entries(EMMeansState).forEach(([key, value]) => {
            updateFormData(key as keyof UnivariateEMMeansType, value);
        });
        setIsEMMeansOpen(false);
    };

    const targetListsConfig: TargetListConfig[] = [
        {
            id: "DisplayMeans",
            title: "Display Means for:",
            variables: displayMeansVars,
            height: "280px",
        },
    ];

    if (!isEMMeansOpen) return null;

    return (
        <div className="flex flex-col h-full">
            <AnimatePresence>
                {tourActive &&
                    tourSteps.length > 0 &&
                    currentStep < tourSteps.length && (
                        <TourPopup
                            step={tourSteps[currentStep]}
                            currentStep={currentStep}
                            totalSteps={tourSteps.length}
                            onNext={nextStep}
                            onPrev={prevStep}
                            onClose={endTour}
                            targetElement={currentTargetElement}
                        />
                    )}
            </AnimatePresence>
            <div className="p-4 flex-grow">
                <Label className="font-bold text-lg">
                    Estimated Marginal Means
                </Label>
                <div
                    id="univariate-emmeans-factors-interactions"
                    className="mt-4"
                >
                    <VariableListManager
                        availableVariables={availableVars}
                        targetLists={targetListsConfig}
                        variableIdKey="name"
                        onMoveVariable={handleMoveVariable}
                        onReorderVariable={handleReorderVariable}
                        highlightedVariable={highlightedVariable}
                        setHighlightedVariable={setHighlightedVariable}
                        availableListHeight="350px"
                        showArrowButtons
                    />
                </div>
                <div
                    id="univariate-emmeans-compare-main-effects"
                    className="flex items-center space-x-2 mt-4"
                >
                    <Checkbox
                        id="CompMainEffect"
                        checked={EMMeansState.CompMainEffect}
                        disabled={compareMainEffectsDisabled}
                        onCheckedChange={(checked) =>
                            handleChange("CompMainEffect", checked)
                        }
                    />
                    <label
                        htmlFor="CompMainEffect"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Compare Main Effects
                    </label>
                </div>
                <div className="flex flex-col gap-2 mt-4">
                    <Label>Confidence Interval Adjustment:</Label>
                    <Select
                        value={EMMeansState.ConfiIntervalMethod ?? ""}
                        disabled={
                            !EMMeansState.CompMainEffect ||
                            compareMainEffectsDisabled
                        }
                        onValueChange={(value) =>
                            handleChange("ConfiIntervalMethod", value)
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {CIADJUSTMENTMETHOD.map((method, index) => (
                                    <SelectItem
                                        key={index}
                                        value={method.value}
                                    >
                                        {method.name}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                <div>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={startTour}
                                    className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                                >
                                    <HelpCircle className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                <p className="text-xs">Start feature tour</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <div>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEMMeansOpen(false)}
                        className="mr-2"
                    >
                        Cancel
                    </Button>
                    <Button
                        id="univariate-emmeans-continue-button"
                        type="button"
                        onClick={handleContinue}
                    >
                        Continue
                    </Button>
                </div>
            </div>
        </div>
    );
};
