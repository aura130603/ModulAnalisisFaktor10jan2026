import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    UnivariateContrastProps,
    UnivariateContrastType,
} from "@/components/Modals/Analyze/general-linear-model/univariate/types/univariate";
import { Label } from "@/components/ui/label";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CONTRASTMETHOD } from "@/components/Modals/Analyze/general-linear-model/multivariate/constants/multivariate-method";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { contrastTourSteps } from "../hooks/tourConfig";

export const UnivariateContrast = ({
    isContrastOpen,
    setIsContrastOpen,
    updateFormData,
    data,
}: UnivariateContrastProps) => {
    const [contrastState, setContrastState] = useState<UnivariateContrastType>({
        ...data,
    });
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
    } = useTourGuide(contrastTourSteps);

    // Add state for variables management
    const [availableVariables, setAvailableVariables] = useState<string[]>([]);
    const [selectedVariable, setSelectedVariable] = useState<string | null>(
        null
    );
    const [formattedVariables, setFormattedVariables] = useState<{
        [key: string]: string;
    }>({});
    const [originalVariables, setOriginalVariables] = useState<string[]>([]);

    useEffect(() => {
        if (isContrastOpen) {
            setContrastState({ ...data });

            // Extract original variable names and create mapping of current formatting
            const originals: string[] = [];
            const currentFormatting: { [key: string]: string } = {};

            data.FactorList?.forEach((variable) => {
                // Extract original name from possibly formatted variable
                const originalName = variable.split(" (")[0];
                originals.push(originalName);

                // If the variable is formatted, store the formatting
                if (variable !== originalName) {
                    currentFormatting[originalName] = variable;
                }
            });

            setAvailableVariables(originals);
            setOriginalVariables(originals);

            // Initialize with current formatting
            setFormattedVariables(currentFormatting);
        }
    }, [isContrastOpen, data]);

    const handleChange = (
        field: keyof UnivariateContrastType,
        value: number | string | null
    ) => {
        setContrastState((prevState) => ({
            ...prevState,
            [field]: value,
        }));
    };

    const handleRefGrp = (value: string) => {
        setContrastState((prevState) => ({
            ...prevState,
            Last: value === "Last",
            First: value === "First",
        }));
    };

    // Handle variable selection
    const handleVariableClick = (variable: string) => {
        setSelectedVariable(variable);
    };

    // Format variable based on current contrast settings
    const formatVariable = (variable: string) => {
        const uiMethod = contrastState.ContrastMethod; // Method chosen in the dropdown by the user
        const originalName = variable.split(" (")[0];

        if (!uiMethod || uiMethod === "" || uiMethod.toLowerCase() === "none") {
            return originalName;
        }

        const lowerUiMethod = uiMethod.toLowerCase();
        if (lowerUiMethod === "deviation" || lowerUiMethod === "simple") {
            // For these methods, "Ref:" is applicable.
            const reference = contrastState.Last ? "Last" : "First";
            // Use the original casing of uiMethod for display if it's not "None"
            return `${originalName} (${uiMethod}, Ref: ${reference})`;
        } else {
            // For other methods (Polynomial, Helmert, etc.), "Ref:" is not applicable.
            // Use the original casing of uiMethod for display
            return `${originalName} (${uiMethod})`;
        }
    };

    // Handle the Change button click
    const handleChangeClick = () => {
        if (selectedVariable) {
            const formatted = formatVariable(selectedVariable);

            // Update formatted variables
            setFormattedVariables((prev) => ({
                ...prev,
                [selectedVariable]: formatted,
            }));
        }
    };

    const handleContinue = () => {
        // Create the updated variable list by applying formatting
        const updatedVariablesList = availableVariables.map((variable) => {
            return formattedVariables[variable] || variable;
        });

        // Update the contrast state with formatted variables
        const updatedState = {
            ...contrastState,
            // Set the updated variable list
            FactorList: updatedVariablesList,
        };

        // Update parent component's form data
        Object.entries(updatedState).forEach(([key, value]) => {
            updateFormData(key as keyof UnivariateContrastType, value);
        });

        // Close the dialog
        setIsContrastOpen(false);
    };

    if (!isContrastOpen) return null;

    return (
        <div className="flex flex-col w-full h-full">
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
            <div className="w-full flex flex-col items-start gap-2 p-4 flex-grow">
                <div className="w-full flex flex-col gap-2">
                    <div id="univariate-contrast-factors" className="w-full">
                        <Label className="font-bold">Factors: </Label>
                        <ScrollArea className="h-[150px] w-full p-2 border rounded">
                            <div className="flex flex-col gap-1 justify-start items-start">
                                {availableVariables.map(
                                    (variable: string, index: number) => (
                                        <Badge
                                            key={index}
                                            className="w-full text-start text-sm font-light p-2 cursor-pointer"
                                            variant={
                                                selectedVariable === variable
                                                    ? "default"
                                                    : "outline"
                                            }
                                            onClick={() =>
                                                handleVariableClick(variable)
                                            }
                                        >
                                            {formattedVariables[variable] ||
                                                variable}
                                        </Badge>
                                    )
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                    <ResizablePanelGroup
                        direction="vertical"
                        className="w-full min-h-[150px] rounded-lg border md:min-w-[200px]"
                    >
                        <ResizablePanel defaultSize={100}>
                            <div
                                id="univariate-contrast-change-contrast"
                                className="flex flex-col gap-2 p-2"
                            >
                                <Label className="font-bold">
                                    Change Contrast
                                </Label>
                                <div className="flex items-center space-x-2">
                                    <Label className="w-[250px]">
                                        Contrast:{" "}
                                    </Label>
                                    <Select
                                        value={
                                            contrastState.ContrastMethod ?? ""
                                        }
                                        onValueChange={(value) =>
                                            handleChange(
                                                "ContrastMethod",
                                                value
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="w-[150px]">
                                            <SelectGroup>
                                                {CONTRASTMETHOD.map(
                                                    (method, index) => (
                                                        <SelectItem
                                                            key={index}
                                                            value={method.value}
                                                        >
                                                            {method.name}
                                                        </SelectItem>
                                                    )
                                                )}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <RadioGroup
                                    value={
                                        contrastState.Last ? "Last" : "First"
                                    }
                                    disabled={
                                        contrastState.ContrastMethod?.toLowerCase() !==
                                            "deviation" &&
                                        contrastState.ContrastMethod?.toLowerCase() !==
                                            "simple"
                                    }
                                    onValueChange={handleRefGrp}
                                >
                                    <div className="flex items-center justify between space-x-2">
                                        <Label>References: </Label>
                                        <div className="flex items-center space-x-2">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem
                                                    value="Last"
                                                    id="Last"
                                                />
                                                <Label htmlFor="Last">
                                                    Last
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem
                                                    value="First"
                                                    id="First"
                                                />
                                                <Label htmlFor="First">
                                                    First
                                                </Label>
                                            </div>
                                        </div>
                                    </div>
                                </RadioGroup>
                                <div className="flex justify-end pt-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={handleChangeClick}
                                        disabled={!selectedVariable}
                                    >
                                        Change
                                    </Button>
                                </div>
                            </div>
                        </ResizablePanel>
                    </ResizablePanelGroup>
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
                        onClick={() => setIsContrastOpen(false)}
                        className="mr-2"
                    >
                        Cancel
                    </Button>
                    <Button
                        id="univariate-contrast-continue-button"
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
