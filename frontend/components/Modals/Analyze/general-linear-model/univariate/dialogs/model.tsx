import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    UnivariateModelProps,
    UnivariateModelType,
} from "@/components/Modals/Analyze/general-linear-model/univariate/types/univariate";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    BUILDTERMMETHOD,
    SUMSQUARESMETHOD,
} from "@/components/Modals/Analyze/general-linear-model/univariate/constants/univariate-method";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckedState } from "@radix-ui/react-checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { modelTourSteps } from "../hooks/tourConfig";

export const UnivariateModel = ({
    isModelOpen,
    setIsModelOpen,
    updateFormData,
    data,
    covariates,
}: UnivariateModelProps) => {
    const [modelState, setModelState] = useState<UnivariateModelType>({
        ...data,
    });
    const [isContinueDisabled, setIsContinueDisabled] = useState(false);
    const [availableVariables, setAvailableVariables] = useState<string[]>([]);

    const {
        tourActive,
        currentStep,
        tourSteps,
        currentTargetElement,
        startTour,
        nextStep,
        prevStep,
        endTour,
    } = useTourGuide(modelTourSteps);

    // Add state for selected variable
    const [selectedVariable, setSelectedVariable] = useState<string | null>(
        null
    );
    // Tambahan: Multi-select support
    const [selectedVariables, setSelectedVariables] = useState<string[]>([]);

    // Add state for current build term
    const [currentBuildTerm, setCurrentBuildTerm] = useState<string>("");

    // Add state to track if a variable is within parentheses
    const [withinParentheses, setWithinParentheses] = useState<boolean>(false);
    const [parenthesesDepth, setParenthesesDepth] = useState<number>(0);

    useEffect(() => {
        if (isModelOpen) {
            setModelState({ ...data });
            setAvailableVariables(data.FactorsVar ?? []);
            setCurrentBuildTerm("");
            setSelectedVariable(null);
            setSelectedVariables([]);
            setWithinParentheses(false);
            setParenthesesDepth(0);
        }
    }, [isModelOpen, data]);

    const handleChange = (
        field: keyof UnivariateModelType,
        value: CheckedState | number | string | null
    ) => {
        setModelState((prevState) => ({
            ...prevState,
            [field]: value,
        }));
    };

    const handleSpecifyGrp = (value: string) => {
        setModelState((prevState) => ({
            ...prevState,
            NonCust: value === "NonCust",
            Custom: value === "Custom",
            BuildCustomTerm: value === "BuildCustomTerm",
        }));

        // Reset build term when changing modes
        setCurrentBuildTerm("");
    };

    const handleDrop = (target: string, variable: string) => {
        setModelState((prev) => {
            const updatedState = { ...prev };
            if (target === "FactorsModel") {
                const currentArray = Array.isArray(updatedState.FactorsModel)
                    ? updatedState.FactorsModel
                    : updatedState.FactorsModel
                    ? [updatedState.FactorsModel]
                    : [];

                if (!currentArray.includes(variable)) {
                    updatedState.FactorsModel = [...currentArray, variable];
                }
            }
            return updatedState;
        });
    };

    const handleRemoveVariable = (target: string, variable?: string) => {
        setModelState((prev) => {
            const updatedState = { ...prev };
            if (target === "FactorsModel") {
                updatedState.FactorsModel = (
                    updatedState.FactorsModel || []
                ).filter((item) => item !== variable);
            }
            return updatedState;
        });
    };

    // Handle variable selection (support Ctrl/Shift for multi-select)
    const handleVariableClick = (
        variable: string,
        event?: React.MouseEvent<HTMLDivElement | HTMLButtonElement, MouseEvent>
    ) => {
        if (!modelState.Custom) {
            setSelectedVariable(variable);
            setSelectedVariables([variable]);
            return;
        }
        if (event?.ctrlKey || event?.metaKey) {
            setSelectedVariables((prev) =>
                prev.includes(variable)
                    ? prev.filter((v) => v !== variable)
                    : [...prev, variable]
            );
        } else if (event?.shiftKey && selectedVariables.length > 0) {
            const lastIndex = availableVariables.findIndex(
                (v) => v === selectedVariables[selectedVariables.length - 1]
            );
            const currIndex = availableVariables.findIndex(
                (v) => v === variable
            );
            if (lastIndex !== -1 && currIndex !== -1) {
                const [start, end] =
                    lastIndex < currIndex
                        ? [lastIndex, currIndex]
                        : [currIndex, lastIndex];
                const range = availableVariables.slice(start, end + 1);
                setSelectedVariables((prev) =>
                    Array.from(new Set([...prev, ...range]))
                );
            }
        } else {
            setSelectedVariables([variable]);
        }
        setSelectedVariable(variable);
    };

    // Perbaikan fungsi handleArrowClick untuk menangani placeholder {variable} dan mencegah nested variable yang sama
    const handleArrowClick = () => {
        if (selectedVariable) {
            // Jika term mengandung placeholder {variable}, periksa apakah kita mencoba menambahkan variabel yang sama
            if (currentBuildTerm.includes("{variable}")) {
                // Ekstrak variabel yang melakukan "wrap" (yang muncul sebelum placeholder)
                // Mencari pola seperti Name({variable}) atau Name(Other({variable}))
                const matches = currentBuildTerm.match(
                    /([^()\s]+)\((?:[^()\s]+\()*\{variable\}/
                );
                if (matches && matches[1] === selectedVariable) {
                    toast.warning("Each factor must be unique.");
                    return; // Mencegah nested variable yang sama (misalnya Age(Age) atau Age(Year(Age)))
                }

                // Jika tidak sama, ganti placeholder dengan variabel yang dipilih
                const newTerm = currentBuildTerm.replace(
                    "{variable}",
                    selectedVariable
                );
                setCurrentBuildTerm(newTerm);
            }
            // Jika term kosong, tambahkan variabel saja
            else if (currentBuildTerm.trim() === "") {
                setCurrentBuildTerm(selectedVariable);
            }
            // Jika term berakhir dengan "(" atau " * ", tambahkan variabel tanpa spasi tambahan
            else if (
                currentBuildTerm.endsWith("(") ||
                currentBuildTerm.endsWith("*")
            ) {
                const isCovariate =
                    covariates && covariates.includes(selectedVariable);

                // Helper function to recursively find all unique factors
                const getUniqueFactors = (term: string): Set<string> => {
                    const factors = new Set<string>();
                    const parts = term.split(/\s*\*\s*/); // Split by " * "
                    parts.forEach((part) => {
                        const match = part.match(/(\w+)\((.*)\)/); // Check for nesting like factor(nested)
                        if (match) {
                            const mainFactor = match[1];
                            const nestedTerm = match[2];
                            if (
                                !covariates ||
                                !covariates.includes(mainFactor)
                            ) {
                                factors.add(mainFactor);
                            }
                            // Recurse on the nested part
                            getUniqueFactors(nestedTerm).forEach((f) =>
                                factors.add(f)
                            );
                        } else {
                            // It's a simple term
                            if (!covariates || !covariates.includes(part)) {
                                factors.add(part.trim());
                            }
                        }
                    });
                    return factors;
                };

                const existingFactors = getUniqueFactors(currentBuildTerm);

                if (!isCovariate && existingFactors.has(selectedVariable)) {
                    toast.warning("Each factor must be unique within a term.");
                    return;
                }
                setCurrentBuildTerm((prev) => prev + selectedVariable);
            }
            // Jika tidak, tambahkan spasi dan variabel
            else {
                setCurrentBuildTerm((prev) => prev + " " + selectedVariable);
            }
        }
    };

    // Perbaikan handleByClick untuk menangani term yang berisi placeholder {variable}
    const handleByClick = () => {
        // Jika term mengandung placeholder {variable}, tombol By tidak perlu diaktifkan
        if (currentBuildTerm.includes("{variable}")) {
            return;
        }

        // Pastikan term tidak kosong
        if (currentBuildTerm.trim() === "") {
            return;
        }

        // Hanya tambahkan "*" jika term tidak berakhir dengan * atau (
        if (
            !currentBuildTerm.endsWith("*") &&
            !currentBuildTerm.endsWith("(")
        ) {
            setCurrentBuildTerm((prev) => prev + "*");
        }
    };

    // Perbaikan fungsi handleWithinClick untuk mendukung nested structures bertingkat
    const handleWithinClick = () => {
        // Pastikan term tidak kosong dan tidak mengandung placeholder
        if (
            currentBuildTerm.trim() === "" ||
            currentBuildTerm.includes("{variable}")
        ) {
            return;
        }

        // Jika term tidak berakhir dengan * atau (
        if (
            !currentBuildTerm.endsWith("*") &&
            !currentBuildTerm.endsWith("(")
        ) {
            let newTerm = currentBuildTerm;

            // Cek apakah term berakhir dengan kurung tutup
            if (newTerm.endsWith(")")) {
                // Kasus: term berakhir dengan ")" - seperti "Age(Year)" atau "Age(Year(Month))"
                // Kita ingin mengubahnya menjadi "Age(Year({variable}))" atau "Age(Year(Month({variable})))"

                // Temukan kurung tutup terakhir
                const lastClosingIndex = newTerm.lastIndexOf(")");

                // Sisipkan "({variable})" sebelum kurung tutup terakhir
                newTerm =
                    newTerm.substring(0, lastClosingIndex) +
                    "({variable})" +
                    newTerm.substring(lastClosingIndex);
            } else {
                // Kasus: term tidak berakhir dengan ")" - seperti "Age"
                // Kita ingin mengubahnya menjadi "Age({variable})"
                newTerm += "({variable})";
            }

            setCurrentBuildTerm(newTerm);
            setWithinParentheses(true);
            setParenthesesDepth((prev) => prev + 1);
            setSelectedVariable(null);
        }
    };

    // Perbaikan handleClearTermClick untuk me-reset state
    const handleClearTermClick = () => {
        setCurrentBuildTerm("");
        setWithinParentheses(false);
        setParenthesesDepth(0);
        setSelectedVariable(null);
    };

    // Handle Add button click - add the current build term to FactorsModel
    const handleAddTermClick = () => {
        if (currentBuildTerm.length > 0) {
            if (currentBuildTerm.includes("{variable}")) {
                toast.warning("Please select a variable to complete the term.");
                return;
            }
            if (
                currentBuildTerm.endsWith("*") ||
                currentBuildTerm.endsWith("(")
            ) {
                toast.warning(
                    "Please complete the term before adding it to the model."
                );
                return;
            }
            // Balance any open parentheses
            let term = currentBuildTerm;
            for (let i = 0; i < parenthesesDepth; i++) {
                term += ")";
            }

            // Add the term to FactorsModel
            setModelState((prev) => {
                const updatedState = { ...prev };
                updatedState.FactorsModel = [
                    ...(updatedState.FactorsModel || []),
                    term,
                ];
                return updatedState;
            });

            // Reset the current build term
            setCurrentBuildTerm("");
            setWithinParentheses(false);
            setParenthesesDepth(0);
        }
    };

    // Handle Remove button click - remove selected variable from FactorsModel
    const handleRemoveTermClick = () => {
        if (selectedVariable) {
            handleRemoveVariable("FactorsModel", selectedVariable);
        }
    };

    // Helper: Generate combinations for All N-Way
    function getCombinations(arr: string[], k: number): string[][] {
        const results: string[][] = [];
        function combine(start: number, path: string[]) {
            if (path.length === k) {
                results.push([...path]);
                return;
            }
            for (let i = start; i < arr.length; i++) {
                combine(i + 1, [...path, arr[i]]);
            }
        }
        combine(0, []);
        return results;
    }

    // Helper: Add variables to FactorsModel based on BuildTermMethod
    const handleAddByBuildTermMethod = () => {
        if (!selectedVariables.length) return;
        let terms: string[] = [];
        const method = modelState.BuildTermMethod;
        if (method === "interaction") {
            if (selectedVariables.length > 1) {
                terms.push(selectedVariables.join("*"));
            } else {
                terms.push(selectedVariables[0]);
            }
        } else if (method === "mainEffects") {
            terms = [...selectedVariables];
        } else if (method && method.startsWith("all")) {
            // e.g. all2Way, all3Way, all4Way
            const nWayMatch = method.match(/^all(\d+)Way$/);
            if (nWayMatch) {
                const nWay = parseInt(nWayMatch[1]);
                if (!isNaN(nWay) && nWay > 1) {
                    const combos = getCombinations(selectedVariables, nWay);
                    terms = combos.map((combo) => combo.join("*"));
                }
            }
        }
        // Add terms to FactorsModel, avoiding duplicates
        setModelState((prev) => {
            const updatedState = { ...prev };
            const current = Array.isArray(updatedState.FactorsModel)
                ? updatedState.FactorsModel
                : updatedState.FactorsModel
                ? [updatedState.FactorsModel]
                : [];
            const newTerms = terms.filter((t) => !current.includes(t));
            updatedState.FactorsModel = [...current, ...newTerms];
            return updatedState;
        });
        setSelectedVariables([]);
        setSelectedVariable(null);
    };

    const handleContinue = () => {
        if (
            (modelState.Custom || modelState.BuildCustomTerm) &&
            (!modelState.FactorsModel || modelState.FactorsModel.length === 0)
        ) {
            toast.warning(
                "When specifying a custom model, you must include at least one model term."
            );
            return;
        }

        Object.entries(modelState).forEach(([key, value]) => {
            updateFormData(key as keyof UnivariateModelType, value);
        });
        setIsModelOpen(false);
    };

    if (!isModelOpen) return null;

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
                <ResizablePanelGroup
                    direction="vertical"
                    className="w-full min-h-[550px] rounded-lg border md:min-w-[300px]"
                >
                    <ResizablePanel defaultSize={15}>
                        <div
                            id="univariate-model-specify-model"
                            className="flex flex-col gap-2 p-2"
                        >
                            <Label className="font-bold">Specify Model</Label>
                            <RadioGroup
                                value={
                                    modelState.NonCust
                                        ? "NonCust"
                                        : modelState.Custom
                                        ? "Custom"
                                        : "BuildCustomTerm"
                                }
                                onValueChange={handleSpecifyGrp}
                            >
                                <div className="grid grid-cols-3">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                            value="NonCust"
                                            id="NonCust"
                                        />
                                        <Label htmlFor="NonCust">
                                            Full Factorial
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                            value="Custom"
                                            id="Custom"
                                        />
                                        <Label htmlFor="Custom">
                                            Build Terms
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                            value="BuildCustomTerm"
                                            id="BuildCustomTerm"
                                        />
                                        <Label htmlFor="BuildCustomTerm">
                                            Build Custom Terms
                                        </Label>
                                    </div>
                                </div>
                            </RadioGroup>
                        </div>
                    </ResizablePanel>
                    <ResizableHandle />
                    <ResizablePanel defaultSize={55}>
                        <ResizablePanelGroup direction="horizontal">
                            <ResizablePanel defaultSize={30}>
                                <div
                                    id="univariate-model-factors-covariates"
                                    className="w-full p-2"
                                >
                                    <Label>Factor & Covariates: </Label>
                                    <ScrollArea className="h-[200px] p-2 border rounded overflow-hidden">
                                        <div className="flex flex-col gap-1 justify-start items-start">
                                            {availableVariables.map(
                                                (
                                                    variable: string,
                                                    index: number
                                                ) => (
                                                    <Badge
                                                        key={index}
                                                        className={`w-full text-start text-sm font-light p-2 cursor-pointer ${
                                                            selectedVariables.includes(
                                                                variable
                                                            )
                                                                ? "bg-blue-500 text-white"
                                                                : ""
                                                        }`}
                                                        variant={
                                                            selectedVariables.includes(
                                                                variable
                                                            )
                                                                ? "default"
                                                                : "outline"
                                                        }
                                                        draggable={
                                                            !modelState.NonCust &&
                                                            !modelState.BuildCustomTerm
                                                        }
                                                        onDragStart={(e) =>
                                                            e.dataTransfer.setData(
                                                                "text",
                                                                variable
                                                            )
                                                        }
                                                        onClick={(e) =>
                                                            handleVariableClick(
                                                                variable,
                                                                e as any
                                                            )
                                                        }
                                                    >
                                                        {variable}
                                                    </Badge>
                                                )
                                            )}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </ResizablePanel>
                            <ResizableHandle />
                            <ResizablePanel defaultSize={30}>
                                <div
                                    id="univariate-model-build-terms"
                                    className="flex flex-col gap-2 p-2"
                                >
                                    <Label className="font-bold">
                                        Build Term(s):
                                    </Label>
                                    <div className="flex items-center space-x-2">
                                        <Label className="w-[75px]">
                                            Type:
                                        </Label>
                                        <Select
                                            value={
                                                modelState.BuildTermMethod ?? ""
                                            }
                                            onValueChange={(value) =>
                                                handleChange(
                                                    "BuildTermMethod",
                                                    value
                                                )
                                            }
                                            disabled={
                                                modelState.NonCust ||
                                                modelState.BuildCustomTerm
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="w-[150px]">
                                                <SelectGroup>
                                                    {BUILDTERMMETHOD.map(
                                                        (method, index) => (
                                                            <SelectItem
                                                                key={index}
                                                                value={
                                                                    method.value
                                                                }
                                                            >
                                                                {method.name}
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        {/* Tambahkan tombol Add di bawah Select untuk mode Custom */}
                                    </div>
                                    {modelState.Custom && (
                                        <div className="mt-2 flex justify-end">
                                            <Button
                                                id="univariate-model-add-build-terms-btn"
                                                size="sm"
                                                variant="default"
                                                disabled={
                                                    selectedVariables.length ===
                                                        0 ||
                                                    !modelState.BuildTermMethod
                                                }
                                                onClick={
                                                    handleAddByBuildTermMethod
                                                }
                                            >
                                                Add
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </ResizablePanel>
                            <ResizableHandle />
                            <ResizablePanel defaultSize={40}>
                                <div
                                    id="univariate-model-terms"
                                    className="w-full p-2"
                                >
                                    <div
                                        className="flex flex-col w-full gap-2"
                                        onDragOver={(e) =>
                                            modelState.Custom
                                                ? e.preventDefault()
                                                : null
                                        }
                                        onDrop={(e) => {
                                            if (modelState.Custom) {
                                                const variable =
                                                    e.dataTransfer.getData(
                                                        "text"
                                                    );
                                                handleDrop(
                                                    "FactorsModel",
                                                    variable
                                                );
                                            }
                                        }}
                                    >
                                        <Label>Model: </Label>
                                        <div className="w-full h-[200px] p-2 border rounded overflow-hidden">
                                            <ScrollArea>
                                                <div className="w-full h-[180px]">
                                                    {modelState.FactorsModel &&
                                                    modelState.FactorsModel
                                                        .length > 0 ? (
                                                        <div className="flex flex-col gap-1">
                                                            {modelState.FactorsModel.map(
                                                                (
                                                                    variable,
                                                                    index
                                                                ) => (
                                                                    <Badge
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="text-start text-sm font-light p-2 cursor-pointer"
                                                                        variant={
                                                                            selectedVariable ===
                                                                            variable
                                                                                ? "default"
                                                                                : "outline"
                                                                        }
                                                                        onClick={() =>
                                                                            handleVariableClick(
                                                                                variable
                                                                            )
                                                                        }
                                                                    >
                                                                        {
                                                                            variable
                                                                        }
                                                                    </Badge>
                                                                )
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm font-light text-gray-500">
                                                            {modelState.Custom
                                                                ? "Drop variables here."
                                                                : modelState.BuildCustomTerm
                                                                ? "Use the buttons below to build and add terms."
                                                                : "Select a model specification method."}
                                                        </span>
                                                    )}
                                                </div>
                                            </ScrollArea>
                                        </div>
                                        <input
                                            type="hidden"
                                            value={
                                                modelState.FactorsModel ?? ""
                                            }
                                            name="Independents"
                                        />
                                    </div>
                                </div>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </ResizablePanel>
                    <ResizableHandle />
                    <ResizablePanel defaultSize={30}>
                        <div
                            id="univariate-model-build-custom-term"
                            className="flex flex-col gap-2 p-2"
                        >
                            <Label>Build Term:</Label>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[150px]">
                                            <Button
                                                id="univariate-model-insert-variable-btn"
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    !modelState.BuildCustomTerm ||
                                                    !selectedVariable ||
                                                    (currentBuildTerm.length >
                                                        0 &&
                                                        !currentBuildTerm.includes(
                                                            "{variable}"
                                                        ) && // Aktif jika ada placeholder
                                                        !currentBuildTerm.endsWith(
                                                            "*"
                                                        ) &&
                                                        !currentBuildTerm.endsWith(
                                                            "("
                                                        )) ||
                                                    !!(
                                                        withinParentheses &&
                                                        selectedVariable &&
                                                        covariates?.includes(
                                                            selectedVariable
                                                        )
                                                    )
                                                }
                                                onClick={handleArrowClick}
                                                title="Insert Variable"
                                            >
                                                →
                                            </Button>
                                        </TableHead>
                                        <TableHead>
                                            <Button
                                                id="univariate-model-by-btn"
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    !modelState.BuildCustomTerm ||
                                                    currentBuildTerm.trim() ===
                                                        "" || // Periksa apakah term kosong
                                                    currentBuildTerm.includes(
                                                        "{variable}"
                                                    ) || // Tidak aktif jika ada placeholder
                                                    currentBuildTerm.endsWith(
                                                        "*"
                                                    ) ||
                                                    currentBuildTerm.endsWith(
                                                        "("
                                                    )
                                                }
                                                onClick={handleByClick}
                                                title="By *"
                                            >
                                                By *
                                            </Button>
                                        </TableHead>
                                        <TableHead>
                                            <Button
                                                id="univariate-model-within-btn"
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    true ||
                                                    !modelState.BuildCustomTerm ||
                                                    currentBuildTerm.trim() ===
                                                        "" || // Periksa apakah term kosong
                                                    currentBuildTerm.includes(
                                                        "{variable}"
                                                    ) || // Tidak aktif jika ada placeholder
                                                    currentBuildTerm.endsWith(
                                                        "*"
                                                    ) ||
                                                    currentBuildTerm.endsWith(
                                                        "("
                                                    )
                                                }
                                                onClick={handleWithinClick}
                                                title="Within"
                                            >
                                                (Within)
                                            </Button>
                                        </TableHead>
                                        <TableHead>
                                            <Button
                                                id="univariate-model-clear-term-btn"
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    !modelState.BuildCustomTerm ||
                                                    currentBuildTerm.length ===
                                                        0
                                                }
                                                onClick={handleClearTermClick}
                                                title="Clear Term"
                                            >
                                                Clear Term
                                            </Button>
                                        </TableHead>
                                        <TableHead>
                                            <Button
                                                id="univariate-model-add-btn"
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    !modelState.BuildCustomTerm ||
                                                    currentBuildTerm.length ===
                                                        0 ||
                                                    currentBuildTerm.includes(
                                                        "{variable}"
                                                    ) || // Tidak aktif jika ada placeholder
                                                    currentBuildTerm.endsWith(
                                                        "*"
                                                    ) ||
                                                    currentBuildTerm.endsWith(
                                                        "("
                                                    )
                                                }
                                                onClick={handleAddTermClick}
                                                title="Add"
                                            >
                                                Add
                                            </Button>
                                        </TableHead>
                                        <TableHead>
                                            <Button
                                                id="univariate-model-remove-btn"
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    !selectedVariable ||
                                                    !(
                                                        modelState.FactorsModel ||
                                                        []
                                                    ).includes(selectedVariable)
                                                }
                                                onClick={handleRemoveTermClick}
                                                title="Remove"
                                            >
                                                Remove
                                            </Button>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="p-2 border"
                                        >
                                            <div className="p-2 rounded-md min-h-[30px]">
                                                {currentBuildTerm || "(Empty)"}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
                <div
                    id="univariate-model-sum-of-squares"
                    className="grid grid-cols-2 gap-2"
                >
                    <div className="flex items-center space-x-2">
                        <Label className="w-[200px]">Sum of Squares:</Label>
                        <Select
                            value={modelState.SumOfSquareMethod ?? ""}
                            onValueChange={(value) =>
                                handleChange("SumOfSquareMethod", value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="w-full">
                                <SelectGroup>
                                    {SUMSQUARESMETHOD.map((method, index) => (
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
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="Intercept"
                            checked={modelState.Intercept}
                            disabled={true}
                            onCheckedChange={(checked) =>
                                handleChange("Intercept", checked)
                            }
                        />
                        <label
                            htmlFor="Intercept"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Include Intercept in Model
                        </label>
                    </div>
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
                        onClick={() => setIsModelOpen(false)}
                        className="mr-2"
                    >
                        Cancel
                    </Button>
                    <Button
                        id="univariate-model-continue-button"
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
