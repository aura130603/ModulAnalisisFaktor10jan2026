import React, { useCallback, useEffect, useMemo, useState } from "react";
import { HelpCircle } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
    KMeansClusterDialogProps,
    KMeansClusterMainType,
} from "@/components/Modals/Analyze/Classify/k-means-cluster/types/k-means-cluster";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckedState } from "@radix-ui/react-checkbox";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    TooltipProvider,
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";
import { useModal } from "@/hooks/useModal";
import { toast } from "sonner";
import VariableListManager, {
    TargetListConfig,
} from "@/components/Common/VariableListManager";
import { TourPopup } from "@/components/Common/TourComponents";
import type { Variable } from "@/types/Variable";
import { useTourGuide } from "../hooks/useTourGuide";
import { dialogTourSteps } from "../hooks/tourConfig";

export const KMeansClusterDialog = ({
    isMainOpen,
    setIsMainOpen,
    setIsIterateOpen,
    setIsSaveOpen,
    setIsOptionsOpen,
    updateFormData,
    data,
    globalVariables,
    onContinue,
    onReset,
}: KMeansClusterDialogProps) => {
    const [mainState, setMainState] = useState<KMeansClusterMainType>({
        ...data,
    });
    const [availableVars, setAvailableVars] = useState<Variable[]>([]);
    const [targetVars, setTargetVars] = useState<Variable[]>([]);
    const [caseVars, setCaseVars] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{
        id: string;
        source: string;
    } | null>(null);
    const [openAccordion, setOpenAccordion] = useState<string | undefined>(
        undefined
    );

    const {
        tourActive,
        currentStep,
        tourSteps,
        currentTargetElement,
        startTour,
        nextStep,
        prevStep,
        endTour,
    } = useTourGuide(dialogTourSteps);

    useEffect(() => {
        if (tourActive) {
            const currentTourStep = tourSteps[currentStep];
            if (currentTourStep.targetId === "kmeans-number-of-clusters") {
                setOpenAccordion("item-1");
            }
        }
    }, [tourActive, currentStep, tourSteps]);

    const { closeModal } = useModal();

    const listStateSetters: Record<
        string,
        React.Dispatch<React.SetStateAction<Variable[]>>
    > = useMemo(
        () => ({
            available: setAvailableVars,
            TargetVar: setTargetVars,
            CaseTarget: setCaseVars,
        }),
        [setAvailableVars, setTargetVars, setCaseVars]
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
            [...(data.TargetVar || []), data.CaseTarget].filter(Boolean)
        );

        const varsMap = new Map(allVariables.map((v) => [v.name, v]));

        setTargetVars(
            (data.TargetVar || [])
                .map((name) => varsMap.get(name))
                .filter(Boolean) as Variable[]
        );

        setCaseVars(
            data.CaseTarget
                ? ([varsMap.get(data.CaseTarget)].filter(Boolean) as Variable[])
                : []
        );

        setAvailableVars(
            allVariables.filter((v) => !initialUsedNames.has(v.name))
        );
    }, [data, globalVariables]);

    useEffect(() => {
        setMainState((prevState) => ({
            ...prevState,
            TargetVar: targetVars.map((v) => v.name),
            CaseTarget: caseVars[0]?.name || null,
        }));
    }, [targetVars, caseVars]);

    const handleChange = (
        field: keyof KMeansClusterMainType,
        value: CheckedState | number | boolean | string | string[] | null
    ) => {
        setMainState((prevState) => ({
            ...prevState,
            [field]: value,
        }));
    };

    const targetListsConfig: TargetListConfig[] = useMemo(
        () => [
            {
                id: "TargetVar",
                title: "Variables:",
                variables: targetVars,
                height: "225px",
                containerId: "kmeans-analysis-variables",
            },
            {
                id: "CaseTarget",
                title: "Label Cases by:",
                variables: caseVars,
                height: "auto",
                maxItems: 1,
                containerId: "kmeans-label-cases-by",
            },
        ],
        [targetVars, caseVars]
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
                    prev.filter((v) => v.name !== variable.name)
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

    const handleMethodGrp = (value: string) => {
        setMainState((prevState) => ({
            ...prevState,
            IterateClassify: value === "IterateClassify",
            ClassifyOnly: value === "ClassifyOnly",
        }));
    };

    const handleReadGrp = (value: string) => {
        setMainState((prevState) => ({
            ...prevState,
            OpenDataset: value === "OpenDataset",
            ExternalDatafile: value === "ExternalDatafile",
        }));
    };

    const handleWriteGrp = (value: string) => {
        setMainState((prevState) => ({
            ...prevState,
            NewDataset: value === "NewDataset",
            DataFile: value === "DataFile",
        }));
    };

    const handleContinue = () => {
        if (targetVars.length === 0) {
            toast.warning(
                "Please select at least one variable for clustering."
            );
            return;
        }
        if (!mainState.Cluster || mainState.Cluster < 2) {
            toast.warning("Number of clusters must be at least 2.");
            return;
        }
        Object.entries(mainState).forEach(([key, value]) => {
            updateFormData(key as keyof KMeansClusterMainType, value);
        });

        setIsMainOpen(false);
        onContinue(mainState);
    };

    const openDialog =
        (setter: React.Dispatch<React.SetStateAction<boolean>>) => () => {
            Object.entries(mainState).forEach(([key, value]) => {
                updateFormData(key as keyof KMeansClusterMainType, value);
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
            <div className="flex flex-col items-center gap-2 p-4 flex-grow">
                <ResizablePanelGroup
                    direction="horizontal"
                    className="min-h-[350px] rounded-lg border md:min-w-[200px]"
                >
                    <ResizablePanel defaultSize={75}>
                        <div
                            id="kmeans-available-variables"
                            className="p-2 h-full"
                        >
                            <VariableListManager
                                availableVariables={availableVars}
                                targetLists={targetListsConfig}
                                variableIdKey="name"
                                highlightedVariable={highlightedVariable}
                                setHighlightedVariable={setHighlightedVariable}
                                onMoveVariable={handleMoveVariable}
                                onReorderVariable={handleReorderVariable}
                                showArrowButtons={true}
                                availableListHeight="310px"
                            />
                        </div>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={25}>
                        <div className="flex flex-col h-full w-full items-center justify-start gap-1 p-2">
                            <Button
                                className="w-full"
                                type="button"
                                variant="outline"
                                onClick={openDialog(setIsIterateOpen)}
                            >
                                Iterate
                            </Button>
                            <Button
                                className="w-full"
                                type="button"
                                variant="outline"
                                onClick={openDialog(setIsSaveOpen)}
                            >
                                Save
                            </Button>
                            <Button
                                className="w-full"
                                type="button"
                                variant="outline"
                                onClick={openDialog(setIsOptionsOpen)}
                            >
                                Options
                            </Button>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
                <Accordion
                    type="single"
                    collapsible
                    className="w-full"
                    value={openAccordion}
                    onValueChange={setOpenAccordion}
                >
                    <AccordionItem value="item-1">
                        <AccordionTrigger className="font-bold">
                            Cluster Centers
                        </AccordionTrigger>
                        <AccordionContent>
                            <ResizablePanelGroup
                                direction="vertical"
                                className="rounded-lg border md:min-w-[200px] min-h-[300px]"
                            >
                                {/* Cluster Centers */}
                                <ResizablePanel defaultSize={100}>
                                    <div className="flex flex-col gap-1 p-2">
                                        <div className="flex flex-row gap-2 items-center">
                                            <Label className="w-[300px]">
                                                Number of Clusters:
                                            </Label>
                                            <Input
                                                id="kmeans-number-of-clusters"
                                                type="number"
                                                placeholder=""
                                                value={mainState.Cluster || ""}
                                                min={2}
                                                onChange={(e) =>
                                                    handleChange(
                                                        "Cluster",
                                                        Number(e.target.value)
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="ReadInitial"
                                                    checked={
                                                        mainState.ReadInitial
                                                    }
                                                    disabled={true}
                                                    onCheckedChange={(
                                                        checked
                                                    ) =>
                                                        handleChange(
                                                            "ReadInitial",
                                                            checked
                                                        )
                                                    }
                                                />
                                                <label
                                                    htmlFor="ReadInitial"
                                                    className="text-sm font-medium leading-none cursor-not-allowed opacity-50"
                                                >
                                                    Read Initial
                                                </label>
                                            </div>
                                            <div className="pl-6">
                                                <RadioGroup
                                                    value={
                                                        mainState.OpenDataset
                                                            ? "OpenDataset"
                                                            : "ExternalDatafile"
                                                    }
                                                    disabled={
                                                        true ||
                                                        !mainState.ReadInitial
                                                    }
                                                    onValueChange={
                                                        handleReadGrp
                                                    }
                                                >
                                                    <div className="flex flex-row gap-2">
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem
                                                                value="OpenDataset"
                                                                id="OpenDataset"
                                                                disabled={true}
                                                            />
                                                            <Label
                                                                className="w-[175px] text-sm font-medium leading-none cursor-not-allowed opacity-50"
                                                                htmlFor="OpenDataset"
                                                            >
                                                                Open Dataset
                                                            </Label>
                                                            <Input
                                                                id="OpenDatasetMethod"
                                                                type="text"
                                                                className="min-w-2xl w-full"
                                                                placeholder=""
                                                                value={
                                                                    mainState.OpenDatasetMethod ??
                                                                    ""
                                                                }
                                                                disabled={
                                                                    true ||
                                                                    !mainState.OpenDataset
                                                                }
                                                                onChange={(e) =>
                                                                    handleChange(
                                                                        "OpenDatasetMethod",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-row gap-2">
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem
                                                                value="ExternalDatafile"
                                                                id="ExternalDatafile"
                                                                disabled={true}
                                                            />
                                                            <Label
                                                                className="w-[175px] text-sm font-medium leading-none cursor-not-allowed opacity-50"
                                                                htmlFor="ExternalDatafile"
                                                            >
                                                                External
                                                                Datafile
                                                            </Label>
                                                            <Input
                                                                id="InitialData"
                                                                type="file"
                                                                className="min-w-2xl w-full"
                                                                placeholder=""
                                                                value={
                                                                    mainState.InitialData ??
                                                                    ""
                                                                }
                                                                disabled={
                                                                    true ||
                                                                    !mainState.ExternalDatafile
                                                                }
                                                                onChange={(e) =>
                                                                    handleChange(
                                                                        "InitialData",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                </RadioGroup>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="WriteFinal"
                                                    disabled={true}
                                                    checked={
                                                        mainState.WriteFinal
                                                    }
                                                    onCheckedChange={(
                                                        checked
                                                    ) =>
                                                        handleChange(
                                                            "WriteFinal",
                                                            checked
                                                        )
                                                    }
                                                />
                                                <label
                                                    htmlFor="WriteFinal"
                                                    className="text-sm font-medium leading-none cursor-not-allowed opacity-50"
                                                >
                                                    Write Final
                                                </label>
                                            </div>
                                            <div className="pl-6">
                                                <RadioGroup
                                                    value={
                                                        mainState.NewDataset
                                                            ? "NewDataset"
                                                            : "DataFile"
                                                    }
                                                    disabled={
                                                        true ||
                                                        !mainState.WriteFinal
                                                    }
                                                    onValueChange={
                                                        handleWriteGrp
                                                    }
                                                >
                                                    <div className="flex flex-row gap-2">
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem
                                                                value="NewDataset"
                                                                id="NewDataset"
                                                                disabled={true}
                                                            />
                                                            <Label
                                                                className="w-[175px] text-sm font-medium leading-none cursor-not-allowed opacity-50"
                                                                htmlFor="NewDataset"
                                                            >
                                                                New Dataset
                                                            </Label>
                                                            <Input
                                                                id="NewData"
                                                                type="text"
                                                                className="min-w-2xl w-full"
                                                                placeholder=""
                                                                value={
                                                                    mainState.NewData ??
                                                                    ""
                                                                }
                                                                disabled={
                                                                    true ||
                                                                    !mainState.NewDataset
                                                                }
                                                                onChange={(e) =>
                                                                    handleChange(
                                                                        "NewData",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-row gap-1">
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem
                                                                value="DataFile"
                                                                id="DataFile"
                                                                disabled={true}
                                                            />
                                                            <Label
                                                                className="w-[175px] text-sm font-medium leading-none cursor-not-allowed opacity-50"
                                                                htmlFor="DataFile"
                                                            >
                                                                Data File
                                                            </Label>
                                                            <Input
                                                                id="FinalData"
                                                                type="file"
                                                                className="min-w-2xl w-full"
                                                                placeholder=""
                                                                value={
                                                                    mainState.FinalData ??
                                                                    ""
                                                                }
                                                                disabled={
                                                                    true ||
                                                                    !mainState.DataFile
                                                                }
                                                                onChange={(e) =>
                                                                    handleChange(
                                                                        "FinalData",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                </RadioGroup>
                                            </div>
                                        </div>
                                    </div>
                                </ResizablePanel>
                            </ResizablePanelGroup>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
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
                        id="kmeans-ok-button"
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
