import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    UnivariatePlotsProps,
    UnivariatePlotsType,
} from "@/components/Modals/Analyze/general-linear-model/univariate/types/univariate";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckedState } from "@radix-ui/react-checkbox";
import { Badge } from "@/components/ui/badge";
import VariableListManager, {
    TargetListConfig,
} from "@/components/Common/VariableListManager";
import type { Variable } from "@/types/Variable";
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
import { plotsTourSteps } from "../hooks/tourConfig";

export const UnivariatePlots = ({
    isPlotsOpen,
    setIsPlotsOpen,
    updateFormData,
    data,
}: UnivariatePlotsProps) => {
    const [plotsState, setPlotsState] = useState<UnivariatePlotsType>({
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
    } = useTourGuide(plotsTourSteps);

    const [availableVars, setAvailableVars] = useState<Variable[]>([]);
    const [horizontalAxisVars, setHorizontalAxisVars] = useState<Variable[]>(
        []
    );
    const [separateLinesVars, setSeparateLinesVars] = useState<Variable[]>([]);
    const [separatePlotsVars, setSeparatePlotsVars] = useState<Variable[]>([]);
    const [selectedPlot, setSelectedPlot] = useState<string | null>(null);
    const [plotsList, setPlotsList] = useState<string[]>([]);
    const [allPlotVariables, setAllPlotVariables] = useState<Variable[]>([]);
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
            HorizontalAxis: setHorizontalAxisVars,
            SeparateLines: setSeparateLinesVars,
            SeparatePlots: setSeparatePlotsVars,
        }),
        [
            setAvailableVars,
            setHorizontalAxisVars,
            setSeparateLinesVars,
            setSeparatePlotsVars,
        ]
    );

    useEffect(() => {
        if (isPlotsOpen) {
            setPlotsState({ ...data });
            const allVariables: Variable[] = (data.SrcList || []).map(
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
            setAllPlotVariables(allVariables);

            const varsMap = new Map(allVariables.map((v) => [v.name, v]));
            const initialHorizontal = data.AxisList
                ? ([varsMap.get(data.AxisList)].filter(Boolean) as Variable[])
                : [];
            const initialLines = data.LineList
                ? ([varsMap.get(data.LineList)].filter(Boolean) as Variable[])
                : [];
            const initialPlots = data.PlotList
                ? ([varsMap.get(data.PlotList)].filter(Boolean) as Variable[])
                : [];

            setHorizontalAxisVars(initialHorizontal);
            setSeparateLinesVars(initialLines);
            setSeparatePlotsVars(initialPlots);

            const usedVarNames = new Set([
                data.AxisList,
                data.LineList,
                data.PlotList,
            ]);
            setAvailableVars(
                allVariables.filter((v) => !usedVarNames.has(v.name))
            );
            setPlotsList(data.FixFactorVars || []);
        }
    }, [isPlotsOpen, data]);

    useEffect(() => {
        setPlotsState((prev) => ({
            ...prev,
            AxisList: horizontalAxisVars[0]?.name || null,
            LineList: separateLinesVars[0]?.name || null,
            PlotList: separatePlotsVars[0]?.name || null,
        }));
    }, [horizontalAxisVars, separateLinesVars, separatePlotsVars]);

    const handleChange = (
        field: keyof UnivariatePlotsType,
        value: CheckedState | number | string | null
    ) => {
        setPlotsState((prevState) => ({
            ...prevState,
            [field]: value,
        }));
    };

    const handleChartGrp = (value: string) => {
        setPlotsState((prevState) => ({
            ...prevState,
            LineChartType: value === "LineChartType",
            BarChartType: value === "BarChartType",
        }));
    };

    const handleErrorBarsGrp = (value: string) => {
        setPlotsState((prevState) => ({
            ...prevState,
            ConfidenceInterval: value === "ConfidenceInterval",
            StandardError: value === "StandardError",
        }));
    };

    const targetListsConfig: TargetListConfig[] = useMemo(
        () => [
            {
                id: "HorizontalAxis",
                title: "Horizontal Axis:",
                variables: horizontalAxisVars,
                height: "auto",
                maxItems: 1,
                containerId: "univariate-plots-factors",
            },
            {
                id: "SeparateLines",
                title: "Separate Lines:",
                variables: separateLinesVars,
                height: "auto",
                maxItems: 1,
            },
            {
                id: "SeparatePlots",
                title: "Separate Plots:",
                variables: separatePlotsVars,
                height: "auto",
                maxItems: 1,
            },
        ],
        [horizontalAxisVars, separateLinesVars, separatePlotsVars]
    );

    const handleMoveVariable = useCallback(
        (variable: Variable, fromListId: string, toListId: string) => {
            const fromSetter = listStateSetters[fromListId];
            const toSetter = listStateSetters[toListId];

            if (fromSetter) {
                fromSetter((prev) =>
                    prev.filter((v) => v.name !== variable.name)
                );
            }

            if (toSetter) {
                if (
                    targetListsConfig.find((l) => l.id === toListId)
                        ?.maxItems === 1
                ) {
                    toSetter((prev) => {
                        if (prev.length > 0) {
                            setAvailableVars((avail) => [...avail, prev[0]]);
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

    const handlePlotClick = (plot: string) => {
        setSelectedPlot(plot);
        const plotVarNames = plot.split("*");
        const [hAxis, sLines, sPlots] = plotVarNames;

        const currentTargetVars = [
            ...horizontalAxisVars,
            ...separateLinesVars,
            ...separatePlotsVars,
        ];
        setAvailableVars((prev) => [...prev, ...currentTargetVars]);

        const varsMap = new Map(allPlotVariables.map((v) => [v.name, v]));

        const newHorizontal = hAxis
            ? ([varsMap.get(hAxis)].filter(Boolean) as Variable[])
            : [];
        const newLines = sLines
            ? ([varsMap.get(sLines)].filter(Boolean) as Variable[])
            : [];
        const newPlots = sPlots
            ? ([varsMap.get(sPlots)].filter(Boolean) as Variable[])
            : [];

        setHorizontalAxisVars(newHorizontal);
        setSeparateLinesVars(newLines);
        setSeparatePlotsVars(newPlots);

        const usedVarNames = new Set(plotVarNames);
        setAvailableVars((prev) =>
            prev.filter((v) => !usedVarNames.has(v.name))
        );
    };

    const isAddButtonDisabled = () => {
        const hAxis = horizontalAxisVars.length > 0;
        const sLines = separateLinesVars.length > 0;
        const sPlots = separatePlotsVars.length > 0;

        if (hAxis && !sLines && !sPlots) return false;
        if (hAxis && sLines) return false;
        return true;
    };

    const handleAddPlot = () => {
        const hAxis = horizontalAxisVars[0]?.name;
        const sLines = separateLinesVars[0]?.name;
        const sPlots = separatePlotsVars[0]?.name;

        if (!hAxis) {
            toast.warning(
                "A horizontal axis variable is required to add a plot."
            );
            return;
        }

        let newPlot = hAxis;
        if (sLines) newPlot += `*${sLines}`;
        if (sLines && sPlots) newPlot += `*${sPlots}`;

        if (!plotsList.includes(newPlot)) {
            const updatedPlots = [...plotsList, newPlot];
            setPlotsList(updatedPlots);
            setPlotsState((prev) => ({ ...prev, FixFactorVars: updatedPlots }));
        }
    };

    const handleChangePlot = () => {
        if (!selectedPlot) return;
        const hAxis = horizontalAxisVars[0]?.name;
        const sLines = separateLinesVars[0]?.name;
        const sPlots = separatePlotsVars[0]?.name;

        if (!hAxis) {
            toast.warning(
                "A horizontal axis variable is required to change a plot."
            );
            return;
        }

        let newPlot = hAxis;
        if (sLines) newPlot += `*${sLines}`;
        if (sLines && sPlots) newPlot += `*${sPlots}`;

        const updatedPlots = plotsList.map((p) =>
            p === selectedPlot ? newPlot : p
        );
        setPlotsList(updatedPlots);
        setSelectedPlot(newPlot);
        setPlotsState((prev) => ({ ...prev, FixFactorVars: updatedPlots }));
    };

    const handleRemovePlot = () => {
        if (!selectedPlot) return;
        const updatedPlots = plotsList.filter((p) => p !== selectedPlot);
        setPlotsList(updatedPlots);
        setSelectedPlot(null);
        setPlotsState((prev) => ({ ...prev, FixFactorVars: updatedPlots }));
    };

    const handleContinue = () => {
        const updatedState = {
            ...plotsState,
            FixFactorVars: plotsList,
        };

        Object.entries(updatedState).forEach(([key, value]) => {
            updateFormData(key as keyof UnivariatePlotsType, value);
        });
        setIsPlotsOpen(false);
    };

    if (!isPlotsOpen) return null;

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
            <div className="flex flex-col gap-2 p-4 flex-grow">
                <ResizablePanelGroup
                    direction="vertical"
                    className="w-full min-h-[775px] rounded-lg border md:min-w-[200px]"
                >
                    <ResizablePanel defaultSize={55}>
                        <div
                            id="univariate-plots-factors"
                            className="p-2 h-full"
                        >
                            <VariableListManager
                                availableVariables={availableVars}
                                targetLists={targetListsConfig}
                                variableIdKey="name"
                                onMoveVariable={handleMoveVariable}
                                onReorderVariable={handleReorderVariable}
                                highlightedVariable={highlightedVariable}
                                setHighlightedVariable={setHighlightedVariable}
                                availableListHeight="225px"
                                showArrowButtons
                            />
                        </div>
                    </ResizablePanel>
                    <ResizableHandle />
                    <ResizablePanel defaultSize={25}>
                        <div
                            id="univariate-plots-plots-list"
                            className="flex flex-col gap-2 p-2"
                        >
                            <div className="flex justify-between items-center">
                                <Label>Plots: </Label>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleAddPlot}
                                        disabled={isAddButtonDisabled()}
                                    >
                                        Add
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleChangePlot}
                                        disabled={!selectedPlot}
                                    >
                                        Change
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleRemovePlot}
                                        disabled={!selectedPlot}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            </div>
                            <div className="h-[75px] border rounded p-2 overflow-auto">
                                <div className="flex flex-col gap-1 p-2">
                                    {plotsList.map((plot, index) => (
                                        <Badge
                                            key={index}
                                            className="w-full text-start text-sm font-light p-2 cursor-pointer"
                                            variant={
                                                selectedPlot === plot
                                                    ? "default"
                                                    : "outline"
                                            }
                                            onClick={() =>
                                                handlePlotClick(plot)
                                            }
                                        >
                                            {plot}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </ResizablePanel>
                    <ResizableHandle />
                    <ResizablePanel defaultSize={15}>
                        <div
                            id="univariate-plots-chart-options"
                            className="flex flex-col gap-2 p-2"
                        >
                            <Label className="font-bold">Chart Type</Label>
                            <RadioGroup
                                value={
                                    plotsState.LineChartType
                                        ? "LineChartType"
                                        : "BarChartType"
                                }
                                onValueChange={handleChartGrp}
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                        value="LineChartType"
                                        id="LineChartType"
                                    />
                                    <Label htmlFor="LineChartType">
                                        Line Chart
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                        value="BarChartType"
                                        id="BarChartType"
                                    />
                                    <Label htmlFor="BarChartType">
                                        Bar Chart
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </ResizablePanel>
                    <ResizableHandle />
                    <ResizablePanel defaultSize={20}>
                        <div className="flex flex-col gap-2 p-2">
                            <Label className="font-bold">Error Bars</Label>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="IncludeErrorBars"
                                    checked={plotsState.IncludeErrorBars}
                                    onCheckedChange={(checked) =>
                                        handleChange(
                                            "IncludeErrorBars",
                                            checked
                                        )
                                    }
                                />
                                <label
                                    htmlFor="IncludeErrorBars"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Include Error Bars
                                </label>
                            </div>
                            <RadioGroup
                                value={
                                    plotsState.ConfidenceInterval
                                        ? "ConfidenceInterval"
                                        : "StandardError"
                                }
                                disabled={!plotsState.IncludeErrorBars}
                                onValueChange={handleErrorBarsGrp}
                            >
                                <div className="flex items-center space-x-2 pl-6">
                                    <RadioGroupItem
                                        value="ConfidenceInterval"
                                        id="ConfidenceInterval"
                                    />
                                    <Label htmlFor="ConfidenceInterval">
                                        Confidence Interval (95.0%)
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2 pl-6">
                                    <RadioGroupItem
                                        value="StandardError"
                                        id="StandardError"
                                    />
                                    <Label htmlFor="StandardError">
                                        Standard Error
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2 pl-6">
                                    <Label className="w-[75px]">
                                        Multiplier:
                                    </Label>
                                    <div className="w-[75px]">
                                        <Input
                                            id="Multiplier"
                                            type="number"
                                            placeholder=""
                                            value={plotsState.Multiplier ?? ""}
                                            disabled={!plotsState.StandardError}
                                            onChange={(e) =>
                                                handleChange(
                                                    "Multiplier",
                                                    Number(e.target.value)
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                            </RadioGroup>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="IncludeRefLineForGrandMean"
                        checked={plotsState.IncludeRefLineForGrandMean}
                        onCheckedChange={(checked) =>
                            handleChange("IncludeRefLineForGrandMean", checked)
                        }
                    />
                    <label
                        htmlFor="IncludeRefLineForGrandMean"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Include Reference Line for Grand Mean
                    </label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="YAxisStart0"
                        checked={plotsState.YAxisStart0}
                        onCheckedChange={(checked) =>
                            handleChange("YAxisStart0", checked)
                        }
                    />
                    <label
                        htmlFor="YAxisStart0"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Y Axis Start at 0
                    </label>
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
                        onClick={() => setIsPlotsOpen(false)}
                        className="mr-2"
                    >
                        Cancel
                    </Button>
                    <Button
                        id="univariate-plots-continue-button"
                        disabled={!selectedPlot}
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
