import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    UnivariatePostHocProps,
    UnivariatePostHocType,
} from "@/components/Modals/Analyze/general-linear-model/univariate/types/univariate";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DUNNETMETHOD } from "@/components/Modals/Analyze/general-linear-model/multivariate/constants/multivariate-method";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckedState } from "@radix-ui/react-checkbox";
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
import { posthocTourSteps } from "../hooks/tourConfig";

export const UnivariatePostHoc = ({
    isPostHocOpen,
    setIsPostHocOpen,
    updateFormData,
    data,
}: UnivariatePostHocProps) => {
    const [postHocState, setPostHocState] = useState<UnivariatePostHocType>({
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
    } = useTourGuide(posthocTourSteps);

    const [availableVars, setAvailableVars] = useState<Variable[]>([]);
    const [postHocTestVars, setPostHocTestVars] = useState<Variable[]>([]);
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
        if (isPostHocOpen) {
            setPostHocState({ ...data });

            const allVariables = (data.SrcList || []).map(createDummyVariable);
            const varsMap = new Map(allVariables.map((v) => [v.name, v]));

            const initialPostHocVars = (data.FixFactorVars || [])
                .map((name) => varsMap.get(name))
                .filter(Boolean) as Variable[];
            setPostHocTestVars(initialPostHocVars);

            const usedNames = new Set(data.FixFactorVars || []);
            setAvailableVars(
                allVariables.filter((v) => !usedNames.has(v.name))
            );
        }
    }, [isPostHocOpen, data]);

    useEffect(() => {
        setPostHocState((prev) => ({
            ...prev,
            FixFactorVars: postHocTestVars.map((v) => v.name),
        }));
    }, [postHocTestVars]);

    const handleChange = (
        field: keyof UnivariatePostHocType,
        value: CheckedState | number | string | null
    ) => {
        setPostHocState((prevState) => ({
            ...prevState,
            [field]: value,
        }));
    };

    const handleMoveVariable = useCallback(
        (variable: Variable, fromListId: string, toListId: string) => {
            if (fromListId === "available" && toListId === "PostHocTests") {
                setAvailableVars((prev) =>
                    prev.filter((v) => v.name !== variable.name)
                );
                setPostHocTestVars((prev) => [...prev, variable]);
            } else if (
                fromListId === "PostHocTests" &&
                toListId === "available"
            ) {
                setPostHocTestVars((prev) =>
                    prev.filter((v) => v.name !== variable.name)
                );
                setAvailableVars((prev) => [...prev, variable]);
            }
        },
        []
    );

    const handleReorderVariable = useCallback(
        (listId: string, newVariables: Variable[]) => {
            if (listId === "PostHocTests") {
                setPostHocTestVars(newVariables);
            }
        },
        []
    );

    const handleDunnetGrp = (value: string) => {
        setPostHocState((prev) => ({
            ...prev,
            LtControl: value === "LtControl",
            GtControl: value === "GtControl",
            Twosided: value === "Twosided",
        }));
    };

    const handleContinue = () => {
        if (postHocState.Dunnett && !postHocState.CategoryMethod) {
            toast.warning(
                "Please select a control category for the Dunnett test."
            );
            return;
        }
        Object.entries(postHocState).forEach(([key, value]) => {
            updateFormData(key as keyof UnivariatePostHocType, value);
        });
        setIsPostHocOpen(false);
    };

    const targetListsConfig: TargetListConfig[] = [
        {
            id: "PostHocTests",
            title: "Post Hoc Tests for:",
            variables: postHocTestVars,
            height: "220px",
        },
    ];

    if (!isPostHocOpen) return null;

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
                    className="w-full min-h-[650px] rounded-lg border md:min-w-[200px]"
                >
                    <ResizablePanel defaultSize={50}>
                        <div className="p-2 h-full">
                            <VariableListManager
                                availableVariables={availableVars}
                                targetLists={targetListsConfig}
                                variableIdKey="name"
                                onMoveVariable={handleMoveVariable}
                                onReorderVariable={handleReorderVariable}
                                highlightedVariable={highlightedVariable}
                                setHighlightedVariable={setHighlightedVariable}
                                availableListHeight="200px"
                                showArrowButtons
                            />
                        </div>
                    </ResizablePanel>
                    <ResizableHandle />
                    <ResizablePanel defaultSize={45}>
                        <div
                            id="univariate-posthoc-equal-variances-assumed"
                            className="flex flex-col gap-2 p-2"
                        >
                            <Label className="font-bold">
                                Equal Variances Assumed
                            </Label>
                            <ResizablePanelGroup direction="horizontal">
                                <ResizablePanel defaultSize={50}>
                                    <div className="grid grid-cols-2 gap-2 p-2">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="Lsd"
                                                    checked={postHocState.Lsd}
                                                    onCheckedChange={(
                                                        checked
                                                    ) =>
                                                        handleChange(
                                                            "Lsd",
                                                            checked
                                                        )
                                                    }
                                                />
                                                <label
                                                    htmlFor="Lsd"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    LSD
                                                </label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="Bonfe"
                                                    checked={postHocState.Bonfe}
                                                    onCheckedChange={(
                                                        checked
                                                    ) =>
                                                        handleChange(
                                                            "Bonfe",
                                                            checked
                                                        )
                                                    }
                                                />
                                                <label
                                                    htmlFor="Bonfe"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    Bonferroni
                                                </label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="Sidak"
                                                    checked={postHocState.Sidak}
                                                    onCheckedChange={(
                                                        checked
                                                    ) =>
                                                        handleChange(
                                                            "Sidak",
                                                            checked
                                                        )
                                                    }
                                                />
                                                <label
                                                    htmlFor="Sidak"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    Sidak
                                                </label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="Scheffe"
                                                    checked={
                                                        postHocState.Scheffe
                                                    }
                                                    onCheckedChange={(
                                                        checked
                                                    ) =>
                                                        handleChange(
                                                            "Scheffe",
                                                            checked
                                                        )
                                                    }
                                                />
                                                <label
                                                    htmlFor="Scheffe"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    Scheffe
                                                </label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="Regwf"
                                                    checked={postHocState.Regwf}
                                                    onCheckedChange={(
                                                        checked
                                                    ) =>
                                                        handleChange(
                                                            "Regwf",
                                                            checked
                                                        )
                                                    }
                                                />
                                                <label
                                                    htmlFor="Regwf"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    R-E-G-W-F
                                                </label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="Regwq"
                                                    checked={postHocState.Regwq}
                                                    onCheckedChange={(
                                                        checked
                                                    ) =>
                                                        handleChange(
                                                            "Regwq",
                                                            checked
                                                        )
                                                    }
                                                />
                                                <label
                                                    htmlFor="Regwq"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    R-E-G-W-Q
                                                </label>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="Snk"
                                                    checked={postHocState.Snk}
                                                    onCheckedChange={(
                                                        checked
                                                    ) =>
                                                        handleChange(
                                                            "Snk",
                                                            checked
                                                        )
                                                    }
                                                />
                                                <label
                                                    htmlFor="Snk"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    SNK
                                                </label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="Tu"
                                                    checked={postHocState.Tu}
                                                    onCheckedChange={(
                                                        checked
                                                    ) =>
                                                        handleChange(
                                                            "Tu",
                                                            checked
                                                        )
                                                    }
                                                />
                                                <label
                                                    htmlFor="Tu"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    Tukey
                                                </label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="Tub"
                                                    checked={postHocState.Tub}
                                                    onCheckedChange={(
                                                        checked
                                                    ) =>
                                                        handleChange(
                                                            "Tub",
                                                            checked
                                                        )
                                                    }
                                                />
                                                <label
                                                    htmlFor="Tub"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    Tukey&apos;s B
                                                </label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="Dun"
                                                    checked={postHocState.Dun}
                                                    onCheckedChange={(
                                                        checked
                                                    ) =>
                                                        handleChange(
                                                            "Dun",
                                                            checked
                                                        )
                                                    }
                                                />
                                                <label
                                                    htmlFor="Dun"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    Duncan
                                                </label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="Hoc"
                                                    checked={postHocState.Hoc}
                                                    onCheckedChange={(
                                                        checked
                                                    ) =>
                                                        handleChange(
                                                            "Hoc",
                                                            checked
                                                        )
                                                    }
                                                />
                                                <label
                                                    htmlFor="Hoc"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    Hochberg&apos;s GT2
                                                </label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="Gabriel"
                                                    checked={
                                                        postHocState.Gabriel
                                                    }
                                                    onCheckedChange={(
                                                        checked
                                                    ) =>
                                                        handleChange(
                                                            "Gabriel",
                                                            checked
                                                        )
                                                    }
                                                />
                                                <label
                                                    htmlFor="Gabriel"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    Gabriel
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </ResizablePanel>
                                <ResizableHandle />
                                <ResizablePanel defaultSize={50}>
                                    <div className="flex flex-col gap-2 p-2">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="Waller"
                                                checked={postHocState.Waller}
                                                onCheckedChange={(checked) =>
                                                    handleChange(
                                                        "Waller",
                                                        checked
                                                    )
                                                }
                                            />
                                            <label
                                                htmlFor="Waller"
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                Waller-Duncan
                                            </label>
                                        </div>
                                        <div className="flex items-center space-x-2 pl-6">
                                            <Label className="w-[150px]">
                                                Type I/Type II Error Ratio:
                                            </Label>
                                            <div className="w-[75px]">
                                                <Input
                                                    id="ErrorRatio"
                                                    type="number"
                                                    placeholder=""
                                                    value={
                                                        postHocState.ErrorRatio ??
                                                        ""
                                                    }
                                                    disabled={
                                                        !postHocState.Waller
                                                    }
                                                    onChange={(e) =>
                                                        handleChange(
                                                            "ErrorRatio",
                                                            Number(
                                                                e.target.value
                                                            )
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="Dunnett"
                                                checked={postHocState.Dunnett}
                                                onCheckedChange={(checked) =>
                                                    handleChange(
                                                        "Dunnett",
                                                        checked
                                                    )
                                                }
                                            />
                                            <label
                                                htmlFor="Dunnett"
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                Dunnett
                                            </label>
                                        </div>
                                        <div className="flex items-center space-x-2 pl-6">
                                            <Label className="w-[150px]">
                                                Category Control:
                                            </Label>
                                            <Select
                                                value={
                                                    postHocState.CategoryMethod ??
                                                    ""
                                                }
                                                disabled={!postHocState.Dunnett}
                                                onValueChange={(value) =>
                                                    handleChange(
                                                        "CategoryMethod",
                                                        value
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="w-[150px]">
                                                    <SelectGroup>
                                                        {DUNNETMETHOD.map(
                                                            (method, index) => (
                                                                <SelectItem
                                                                    key={index}
                                                                    value={
                                                                        method.value
                                                                    }
                                                                >
                                                                    {
                                                                        method.name
                                                                    }
                                                                </SelectItem>
                                                            )
                                                        )}
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Label className="font-bold">
                                            Test
                                        </Label>
                                        <RadioGroup
                                            value={
                                                postHocState.LtControl
                                                    ? "LtControl"
                                                    : postHocState.GtControl
                                                    ? "GtControl"
                                                    : postHocState.Twosided
                                                    ? "Twosided"
                                                    : "Twosided"
                                            }
                                            disabled={!postHocState.Dunnett}
                                            onValueChange={handleDunnetGrp}
                                        >
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem
                                                        value="Twosided"
                                                        id="Twosided"
                                                    />
                                                    <Label htmlFor="Twosided">
                                                        2-Sided
                                                    </Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem
                                                        value="LtControl"
                                                        id="LtControl"
                                                    />
                                                    <Label htmlFor="LtControl">
                                                        &lt; Control
                                                    </Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem
                                                        value="GtControl"
                                                        id="GtControl"
                                                    />
                                                    <Label htmlFor="GtControl">
                                                        &gt; Control
                                                    </Label>
                                                </div>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                </ResizablePanel>
                            </ResizablePanelGroup>
                        </div>
                    </ResizablePanel>
                    <ResizableHandle />
                    <ResizablePanel defaultSize={10}>
                        <div
                            id="univariate-posthoc-equal-variances-not-assumed"
                            className="flex flex-col gap-2 p-2"
                        >
                            <Label className="font-bold">
                                Equal Variances Not Assumed
                            </Label>
                            <div className="grid grid-cols-4 gap-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="Tam"
                                        checked={postHocState.Tam}
                                        onCheckedChange={(checked) =>
                                            handleChange("Tam", checked)
                                        }
                                    />
                                    <label
                                        htmlFor="Tam"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Tamhane&apos;s T2
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="Dunt"
                                        checked={postHocState.Dunt}
                                        onCheckedChange={(checked) =>
                                            handleChange("Dunt", checked)
                                        }
                                    />
                                    <label
                                        htmlFor="Dunt"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Dunnett&apos;s T3
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="Games"
                                        checked={postHocState.Games}
                                        onCheckedChange={(checked) =>
                                            handleChange("Games", checked)
                                        }
                                    />
                                    <label
                                        htmlFor="Games"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Games-Howell
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="Dunc"
                                        checked={postHocState.Dunc}
                                        onCheckedChange={(checked) =>
                                            handleChange("Dunc", checked)
                                        }
                                    />
                                    <label
                                        htmlFor="Dunc"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Dunnett&apos;s C
                                    </label>
                                </div>
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
                        onClick={() => setIsPostHocOpen(false)}
                        className="mr-2"
                    >
                        Cancel
                    </Button>
                    <Button
                        id="univariate-posthoc-continue-button"
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
