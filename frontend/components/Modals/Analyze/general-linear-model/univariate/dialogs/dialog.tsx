import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import VariableListManager, {
    TargetListConfig,
} from "@/components/Common/VariableListManager";
import type { Variable } from "@/types/Variable";
import {
    UnivariateDialogProps,
    UnivariateMainType,
} from "@/components/Modals/Analyze/general-linear-model/univariate/types/univariate";
import { useModal } from "@/hooks/useModal";
import { toast } from "sonner";
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
import { univariateTourSteps } from "../hooks/tourConfig";

export const UnivariateDialog = ({
    isMainOpen,
    setIsMainOpen,
    setIsModelOpen,
    setIsContrastOpen,
    setIsPlotsOpen,
    setIsPostHocOpen,
    setIsEMMeansOpen,
    setIsSaveOpen,
    setIsOptionsOpen,
    setIsBootstrapOpen,
    updateFormData,
    data,
    globalVariables,
    onContinue,
    onReset,
}: UnivariateDialogProps) => {
    const [mainState, setMainState] = useState<UnivariateMainType>({ ...data });
    const { closeModal } = useModal();

    const {
        tourActive,
        currentStep,
        tourSteps,
        currentTargetElement,
        startTour,
        nextStep,
        prevStep,
        endTour,
    } = useTourGuide(univariateTourSteps);

    const [availableVars, setAvailableVars] = useState<Variable[]>([]);
    const [depVar, setDepVar] = useState<Variable[]>([]);
    const [fixFactor, setFixFactor] = useState<Variable[]>([]);
    const [randFactor, setRandFactor] = useState<Variable[]>([]);
    const [covar, setCovar] = useState<Variable[]>([]);
    const [wlsWeight, setWlsWeight] = useState<Variable[]>([]);
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
            DepVar: setDepVar,
            FixFactor: setFixFactor,
            RandFactor: setRandFactor,
            Covar: setCovar,
            WlsWeight: setWlsWeight,
        }),
        [
            setAvailableVars,
            setDepVar,
            setFixFactor,
            setRandFactor,
            setCovar,
            setWlsWeight,
        ]
    );

    useEffect(() => {
        setMainState({ ...data });

        const allVariables: Variable[] = globalVariables.map((name, index) => ({
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
        }));

        const initialUsedNames = new Set(
            [
                data.DepVar,
                ...(data.FixFactor || []),
                ...(data.RandFactor || []),
                ...(data.Covar || []),
                data.WlsWeight,
            ].filter(Boolean)
        );

        const varsMap = new Map(allVariables.map((v) => [v.name, v]));

        setDepVar(
            data.DepVar
                ? ([varsMap.get(data.DepVar)].filter(Boolean) as Variable[])
                : []
        );
        setFixFactor(
            (data.FixFactor || [])
                .map((name) => varsMap.get(name))
                .filter(Boolean) as Variable[]
        );
        setRandFactor(
            (data.RandFactor || [])
                .map((name) => varsMap.get(name))
                .filter(Boolean) as Variable[]
        );
        setCovar(
            (data.Covar || [])
                .map((name) => varsMap.get(name))
                .filter(Boolean) as Variable[]
        );
        setWlsWeight(
            data.WlsWeight
                ? ([varsMap.get(data.WlsWeight)].filter(Boolean) as Variable[])
                : []
        );
        setAvailableVars(
            allVariables.filter((v) => !initialUsedNames.has(v.name))
        );
    }, [data, globalVariables]);

    useEffect(() => {
        setMainState((prevState) => ({
            ...prevState,
            DepVar: depVar[0]?.name || null,
            FixFactor: fixFactor.map((v) => v.name),
            RandFactor: randFactor.map((v) => v.name),
            Covar: covar.map((v) => v.name),
            WlsWeight: wlsWeight[0]?.name || null,
        }));
    }, [depVar, fixFactor, randFactor, covar, wlsWeight]);

    const targetListsConfig: TargetListConfig[] = useMemo(
        () => [
            {
                id: "DepVar",
                title: "Dependent Variable:",
                variables: depVar,
                height: "auto",
                maxItems: 1,
                containerId: "univariate-dependent-variable",
            },
            {
                id: "FixFactor",
                title: "Fixed Factor(s):",
                variables: fixFactor,
                height: "100px",
                containerId: "univariate-fixed-factors",
            },
            {
                id: "RandFactor",
                title: "Random Factor(s):",
                variables: randFactor,
                height: "100px",
                containerId: "univariate-random-factors",
            },
            {
                id: "Covar",
                title: "Covariate(s):",
                variables: covar,
                height: "100px",
                containerId: "univariate-covariates",
            },
            {
                id: "WlsWeight",
                title: "WLS Weight:",
                variables: wlsWeight,
                height: "auto",
                maxItems: 1,
                containerId: "univariate-wls-weight",
                droppable: false,
                draggableItems: false,
                disabled: true,
            },
        ],
        [depVar, fixFactor, randFactor, covar, wlsWeight]
    );

    const handleMoveVariable = useCallback(
        (variable: Variable, fromListId: string, toListId: string) => {
            const fromSetter = listStateSetters[fromListId];
            const toSetter = listStateSetters[toListId];
            const toListConfig = targetListsConfig.find(
                (l) => l.id === toListId
            );

            if (fromSetter) {
                fromSetter((prev) =>
                    prev.filter((v) => v.tempId !== variable.tempId)
                );
            }

            if (toSetter) {
                if (toListConfig?.maxItems === 1) {
                    toSetter((prev) => {
                        if (prev.length > 0) {
                            const existingVar = prev[0];
                            setAvailableVars((avail) => [
                                ...avail,
                                existingVar,
                            ]);
                        }
                        return [variable];
                    });
                } else {
                    toSetter((prev) => [...prev, variable]);
                }
            }
        },
        [listStateSetters, targetListsConfig, setAvailableVars]
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

    const handleContinue = () => {
        if (depVar.length === 0) {
            toast.warning("Please select a dependent variable.");
            return;
        }

        if (
            fixFactor.length === 0 &&
            randFactor.length === 0 &&
            covar.length === 0
        ) {
            toast.warning(
                "Please select at least one fixed factor, random factor, or covariate."
            );
            return;
        }

        Object.entries(mainState).forEach(([key, value]) => {
            updateFormData(key as keyof UnivariateMainType, value);
        });

        setIsMainOpen(false);
        onContinue(mainState);
    };

    const openDialog =
        (setter: React.Dispatch<React.SetStateAction<boolean>>) => () => {
            Object.entries(mainState).forEach(([key, value]) => {
                updateFormData(key as keyof UnivariateMainType, value);
            });
            setter(true);
        };

    const handleDialog = () => {
        setIsMainOpen(false);
        closeModal();
    };

    if (!isMainOpen) return null;

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
                <ResizablePanelGroup
                    direction="horizontal"
                    className="min-h-[400px] rounded-lg border md:min-w-[200px]"
                >
                    <ResizablePanel defaultSize={75}>
                        <div
                            id="univariate-available-variables"
                            className="p-2 h-full"
                        >
                            <VariableListManager
                                availableVariables={availableVars}
                                targetLists={targetListsConfig}
                                variableIdKey="tempId"
                                highlightedVariable={highlightedVariable}
                                setHighlightedVariable={setHighlightedVariable}
                                onMoveVariable={handleMoveVariable}
                                onReorderVariable={handleReorderVariable}
                                showArrowButtons={true}
                                availableListHeight="450px"
                            />
                        </div>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={25}>
                        <div className="flex flex-col w-full h-full items-center justify-between p-2">
                            <div className="flex flex-col gap-2 w-full">
                                <Button
                                    className="w-full"
                                    variant="outline"
                                    onClick={openDialog(setIsModelOpen)}
                                >
                                    Model
                                </Button>
                                <Button
                                    className="w-full"
                                    variant="outline"
                                    onClick={openDialog(setIsContrastOpen)}
                                >
                                    Contrasts
                                </Button>
                                <Button
                                    className="w-full"
                                    variant="outline"
                                    disabled={true}
                                    onClick={openDialog(setIsPlotsOpen)}
                                >
                                    Plots
                                </Button>
                                <Button
                                    className="w-full"
                                    variant="outline"
                                    disabled={true}
                                    onClick={openDialog(setIsPostHocOpen)}
                                >
                                    Post Hoc
                                </Button>
                                <Button
                                    className="w-full"
                                    variant="outline"
                                    onClick={openDialog(setIsEMMeansOpen)}
                                >
                                    EM Means
                                </Button>
                                <Button
                                    className="w-full"
                                    variant="outline"
                                    onClick={openDialog(setIsSaveOpen)}
                                >
                                    Save
                                </Button>
                                <Button
                                    className="w-full"
                                    variant="outline"
                                    onClick={openDialog(setIsOptionsOpen)}
                                >
                                    Options
                                </Button>
                                <Button
                                    className="w-full"
                                    variant="outline"
                                    disabled={true}
                                    onClick={openDialog(setIsBootstrapOpen)}
                                >
                                    Bootstrap
                                </Button>
                            </div>
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
                        onClick={onReset}
                        className="mr-2"
                    >
                        Reset
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleDialog}
                        className="mr-2"
                    >
                        Cancel
                    </Button>
                    <Button
                        id="univariate-ok-button"
                        type="button"
                        onClick={handleContinue}
                    >
                        OK
                    </Button>
                </div>
            </div>
        </div>
    );
};
