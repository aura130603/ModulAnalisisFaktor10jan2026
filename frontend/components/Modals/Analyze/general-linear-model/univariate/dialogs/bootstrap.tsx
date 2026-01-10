import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    UnivariateBootstrapProps,
    UnivariateBootstrapType,
} from "@/components/Modals/Analyze/general-linear-model/univariate/types/univariate";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckedState } from "@radix-ui/react-checkbox";
import { toast } from "sonner";
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
import { bootstrapTourSteps } from "../hooks/tourConfig";

export const UnivariateBootstrap = ({
    isBootstrapOpen,
    setIsBootstrapOpen,
    updateFormData,
    data,
}: UnivariateBootstrapProps) => {
    const [bootstrapState, setBootstrapState] =
        useState<UnivariateBootstrapType>({ ...data });
    const [isContinueDisabled, setIsContinueDisabled] = useState(false);

    const {
        tourActive,
        currentStep,
        tourSteps,
        currentTargetElement,
        startTour,
        nextStep,
        prevStep,
        endTour,
    } = useTourGuide(bootstrapTourSteps);

    const [availableVars, setAvailableVars] = useState<Variable[]>([]);
    const [strataVars, setStrataVars] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{
        id: string;
        source: string;
    } | null>(null);

    const listStateSetters: Record<
        string,
        React.Dispatch<React.SetStateAction<Variable[]>>
    > = useMemo(
        () => ({
            available: setAvailableVars,
            StrataVars: setStrataVars,
        }),
        [setAvailableVars, setStrataVars]
    );

    useEffect(() => {
        if (isBootstrapOpen) {
            setBootstrapState({ ...data });

            const allVariables: Variable[] = (data.Variables || []).map(
                (name, index) => ({
                    name,
                    tempId: name,
                    label: name,
                    columnIndex: index,
                    type: "NUMERIC",
                    width: 8,
                    decimals: 2,
                    align: "left",
                    missing: null,
                    measure: "unknown",
                    role: "input",
                    values: [],
                    columns: 0,
                })
            );

            const initialUsedNames = new Set(data.StrataVariables || []);
            const varsMap = new Map(allVariables.map((v) => [v.name, v]));

            setStrataVars(
                (data.StrataVariables || [])
                    .map((name) => varsMap.get(name))
                    .filter(Boolean) as Variable[]
            );

            setAvailableVars(
                allVariables.filter((v) => !initialUsedNames.has(v.name))
            );
        }
    }, [isBootstrapOpen, data]);

    useEffect(() => {
        setBootstrapState((prevState) => ({
            ...prevState,
            StrataVariables: strataVars.map((v) => v.name),
        }));
    }, [strataVars]);

    const handleChange = (
        field: keyof UnivariateBootstrapType,
        value: CheckedState | number | string | null
    ) => {
        setBootstrapState((prevState) => ({
            ...prevState,
            [field]: value,
        }));
    };

    const handleCIGrp = (value: string) => {
        setBootstrapState((prev) => ({
            ...prev,
            Percentile: value === "Percentile",
            BCa: value === "BCa",
        }));
    };

    const handleSamplingGrp = (value: string) => {
        setBootstrapState((prev) => ({
            ...prev,
            Simple: value === "Simple",
            Stratified: value === "Stratified",
        }));
    };

    const handleMoveVariable = useCallback(
        (variable: Variable, fromListId: string, toListId: string) => {
            const fromSetter = listStateSetters[fromListId];
            const toSetter = listStateSetters[toListId];

            if (fromSetter) {
                fromSetter((prev) =>
                    prev.filter((v) => v.tempId !== variable.tempId)
                );
            }

            if (toSetter) {
                toSetter((prev) => [...prev, variable]);
            }
        },
        [listStateSetters]
    );

    const handleReorderVariable = useCallback(
        (listId: string, newVariables: Variable[]) => {
            const setter = listStateSetters[listId];
            if (setter) {
                setter(newVariables);
            }
        },
        [listStateSetters]
    );

    const targetListsConfig: TargetListConfig[] = useMemo(
        () => [
            {
                id: "StrataVars",
                title: "Strata Variables:",
                variables: strataVars,
                height: "150px",
            },
        ],
        [strataVars]
    );

    const handleContinue = () => {
        if (bootstrapState.PerformBootStrapping) {
            if (
                !bootstrapState.NumOfSamples ||
                bootstrapState.NumOfSamples <= 0
            ) {
                toast.warning("Number of samples must be a positive number.");
                return;
            }
            if (
                !bootstrapState.Level ||
                bootstrapState.Level <= 0 ||
                bootstrapState.Level >= 100
            ) {
                toast.warning("Confidence level must be between 0 and 100.");
                return;
            }
            if (
                bootstrapState.Stratified &&
                (!bootstrapState.StrataVariables ||
                    bootstrapState.StrataVariables.length === 0)
            ) {
                toast.warning(
                    "Please select at least one strata variable for stratified sampling."
                );
                return;
            }
        }
        Object.entries(bootstrapState).forEach(([key, value]) => {
            updateFormData(key as keyof UnivariateBootstrapType, value);
        });
        setIsBootstrapOpen(false);
    };

    if (!isBootstrapOpen) return null;

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
            <div className="flex flex-col items-start gap-2 p-4 flex-grow">
                <div
                    id="univariate-bootstrap-perform"
                    className="flex flex-col gap-2"
                >
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="PerformBootStrapping"
                            checked={bootstrapState.PerformBootStrapping}
                            onCheckedChange={(checked) =>
                                handleChange("PerformBootStrapping", checked)
                            }
                        />
                        <label
                            htmlFor="PerformBootStrapping"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Perform Bootstrapping
                        </label>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2 pl-6 gap-2">
                            <Label>Number of Samples:</Label>
                            <div className="w-[100px]">
                                <Input
                                    type="number"
                                    id="NumOfSamples"
                                    placeholder=""
                                    value={bootstrapState.NumOfSamples ?? ""}
                                    disabled={
                                        !bootstrapState.PerformBootStrapping
                                    }
                                    onChange={(e) =>
                                        handleChange(
                                            "NumOfSamples",
                                            Number(e.target.value)
                                        )
                                    }
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 pl-6">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="Seed"
                                    checked={bootstrapState.Seed}
                                    disabled={
                                        !bootstrapState.PerformBootStrapping
                                    }
                                    onCheckedChange={(checked) =>
                                        handleChange("Seed", checked)
                                    }
                                />
                                <label
                                    htmlFor="Seed"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Set Seed for Mersenne Twister
                                </label>
                            </div>
                            <div className="flex items-center space-x-2 pl-6 gap-2">
                                <Label>Seed:</Label>
                                <div className="w-[200px]">
                                    <Input
                                        id="SeedValue"
                                        type="number"
                                        placeholder=""
                                        value={bootstrapState.SeedValue ?? ""}
                                        disabled={!bootstrapState.Seed}
                                        onChange={(e) =>
                                            handleChange(
                                                "SeedValue",
                                                Number(e.target.value)
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <ResizablePanelGroup
                    direction="vertical"
                    className="w-full min-h-[500px] rounded-lg border md:min-w-[200px]"
                >
                    <ResizablePanel defaultSize={25}>
                        <div
                            id="univariate-bootstrap-confidence-intervals"
                            className="flex flex-col h-full gap-2 p-2"
                        >
                            <Label className="font-bold">
                                Confidence Intervals
                            </Label>
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center space-x-2">
                                    <Label className="w-[100px]">
                                        Level (%):
                                    </Label>
                                    <div className="w-[100px]">
                                        <Input
                                            id="Level"
                                            type="number"
                                            placeholder=""
                                            value={bootstrapState.Level ?? ""}
                                            min={0}
                                            max={100}
                                            disabled={
                                                !bootstrapState.PerformBootStrapping
                                            }
                                            onChange={(e) =>
                                                handleChange(
                                                    "Level",
                                                    Number(e.target.value)
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                                <RadioGroup
                                    defaultValue="Percentile"
                                    value={
                                        bootstrapState.Percentile
                                            ? "Percentile"
                                            : "BCa"
                                    }
                                    disabled={
                                        !bootstrapState.PerformBootStrapping
                                    }
                                    onValueChange={handleCIGrp}
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                            value="Percentile"
                                            id="Percentile"
                                        />
                                        <Label htmlFor="Percentile">
                                            Percentile
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="BCa" id="BCa" />
                                        <Label htmlFor="BCa">
                                            Bias Corrected Accelerated (BCa)
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </div>
                    </ResizablePanel>
                    <ResizableHandle />
                    <ResizablePanel defaultSize={75}>
                        <div
                            id="univariate-bootstrap-sampling"
                            className="flex flex-col h-full gap-2 p-2"
                        >
                            <Label className="font-bold">Sampling</Label>
                            <RadioGroup
                                defaultValue="Simple"
                                value={
                                    bootstrapState.Simple
                                        ? "Simple"
                                        : "Stratified"
                                }
                                disabled={!bootstrapState.PerformBootStrapping}
                                onValueChange={handleSamplingGrp}
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                        value="Simple"
                                        id="Simple"
                                    />
                                    <Label htmlFor="Simple">Simple</Label>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                            value="Stratified"
                                            id="Stratified"
                                        />
                                        <Label htmlFor="Stratified">
                                            Stratified
                                        </Label>
                                    </div>
                                    <VariableListManager
                                        availableVariables={availableVars}
                                        targetLists={targetListsConfig}
                                        variableIdKey="tempId"
                                        highlightedVariable={
                                            highlightedVariable
                                        }
                                        setHighlightedVariable={
                                            setHighlightedVariable
                                        }
                                        onMoveVariable={handleMoveVariable}
                                        onReorderVariable={
                                            handleReorderVariable
                                        }
                                        showArrowButtons={true}
                                        availableListHeight="200px"
                                    />
                                </div>
                            </RadioGroup>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
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
                        onClick={() => setIsBootstrapOpen(false)}
                        className="mr-2"
                    >
                        Cancel
                    </Button>
                    <Button
                        id="univariate-bootstrap-continue-button"
                        disabled={isContinueDisabled}
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
