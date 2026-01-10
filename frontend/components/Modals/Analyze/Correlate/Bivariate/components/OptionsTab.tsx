import React, { FC, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { OptionsTabProps } from "../types";
import { ActiveElementHighlight } from "@/components/Common/TourComponents";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Variable } from "@/types/Variable";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Ruler, Shapes, BarChartHorizontal, FileQuestion, ArrowBigLeft, ArrowBigRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const OptionsTab: FC<OptionsTabProps> = ({
    partialCorrelationKendallsTauB,
    setPartialCorrelationKendallsTauB,
    statisticsOptions,
    setStatisticsOptions,
    missingValuesOptions,
    setMissingValuesOptions,
    tourActive = false,
    currentStep = 0,
    tourSteps = [],
    testVariables,
    correlationCoefficient,
    highlightedVariable,
    setHighlightedVariable,
    moveToKendallsTauBControlVariables,
    moveToKendallsTauBAvailableVariables,
    controlVariables,
    reorderVariables,
}) => {
    const getStepIndex = (targetId: string) => tourSteps.findIndex(step => step.targetId === targetId);

    const partialCorrelationKendallsTauBStepIndex = getStepIndex("partial-correlation-kendalls-tau-b-section");
    const statisticsOptionsStepIndex = getStepIndex("statistics-options-section");
    const missingValuesOptionsStepIndex = getStepIndex("missing-values-options-section");
    const controlVariablesStepIndex = getStepIndex("control-variables-section");

    const getDisplayName = (variable: Variable) => {
        if (!variable.label) return variable.name;
        return `${variable.label} [${variable.name}]`;
    };

    const getVariableIcon = (variable: Variable) => {
        switch (variable.measure) {
            case "scale":
                return <Ruler size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
            case "nominal":
                return <Shapes size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
            case "ordinal":
                return <BarChartHorizontal size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
            case "unknown":
                return <FileQuestion size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
            default:
                return variable.type === "STRING"
                    ? <Shapes size={14} className="text-muted-foreground mr-1 flex-shrink-0" />
                    : <Ruler size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
        }
    };

    const isTourElementActive = useCallback((elementId: string) => {
        if (!tourActive || currentStep >= tourSteps.length) return false;
        return tourSteps[currentStep]?.targetId === elementId;
    }, [tourActive, currentStep, tourSteps]);

    // Filter testVariables to exclude those already in controlVariables
    const availableVariablesForControl = testVariables.filter(testVar => 
        !controlVariables.some(controlVar => controlVar.tempId === testVar.tempId)
    );

    const handleVariableSelect = (variable: Variable, source: 'available' | 'control') => {
        if (highlightedVariable && 
            highlightedVariable.tempId === variable.tempId && 
            highlightedVariable.source === source) {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({ 
                tempId: variable.tempId || `temp_id_${variable.columnIndex}`, 
                source
            });
        }
    };

    const handleVariableDoubleClick = useCallback((variable: Variable, sourceListId: string) => {
        if (sourceListId === 'available') {
            moveToKendallsTauBControlVariables(variable);
        } else if (sourceListId === 'control') {
            moveToKendallsTauBAvailableVariables(variable);
        }
    }, [moveToKendallsTauBControlVariables, moveToKendallsTauBAvailableVariables]);

    const handleMoveButton = () => {
        if (highlightedVariable) {
            if (highlightedVariable.source === 'available') {
                const variable = availableVariablesForControl.find(v => v.tempId === highlightedVariable.tempId);
                if (variable) {
                    moveToKendallsTauBControlVariables(variable);
                }
            } else if (highlightedVariable.source === 'control') {
                const variable = controlVariables.find(v => v.tempId === highlightedVariable.tempId);
                if (variable) {
                    moveToKendallsTauBAvailableVariables(variable);
                }
            }
        }
    };

    // Move button for available variables
    const renderMoveButtonToRight = () => {
        if (!highlightedVariable || highlightedVariable.source !== 'available') return null;
        
        return (
            <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0 flex items-center justify-center p-0 w-6 h-6 rounded-full border-border hover:bg-accent hover:border-primary transition-all duration-150 ease-in-out"
                onClick={handleMoveButton}
            >
                <ArrowBigRight size={16} />
            </Button>
        );
    };

    // Move button for control variables
    const renderMoveButtonToLeft = () => {
        if (!highlightedVariable || highlightedVariable.source !== 'control') return null;
        
        return (
            <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0 flex items-center justify-center p-0 w-6 h-6 rounded-full border-border hover:bg-accent hover:border-primary transition-all duration-150 ease-in-out"
                onClick={handleMoveButton}
            >
                <ArrowBigLeft size={16} />
            </Button>
        );
    };

    const renderVariableList = (variables: Variable[], title: string, height: string, isAvailable: boolean) => (
        <div className="flex flex-col relative">
            <div className="text-sm font-medium mb-1.5 px-1 flex items-center h-6">
                <span className="truncate">{title}</span>
            </div>
            <div className="border border-border p-1 rounded-md w-full transition-colors relative bg-background overflow-y-auto overflow-x-hidden" style={{ height }}>
                <div className="space-y-0.5 p-0.5 transition-all duration-150">
                    {variables.length === 0 ? (
                        <div className="text-center text-muted-foreground py-4 text-sm">
                            {isAvailable ? "No variables available" : "No control variables selected"}
                        </div>
                    ) : (
                        variables.map((variable) => (
                            <TooltipProvider key={variable.tempId || variable.columnIndex}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className={`flex items-center p-1 border rounded-md cursor-pointer group relative transition-all duration-150 ease-in-out text-sm hover:bg-accent
                                                ${
                                                    highlightedVariable &&
                                                    highlightedVariable.tempId === variable.tempId &&
                                                    highlightedVariable.source === (isAvailable ? 'available' : 'control')
                                                    ? "bg-accent border-primary"
                                                    : "border-border"
                                                }
                                                ${!partialCorrelationKendallsTauB ? "opacity-50 cursor-not-allowed" : ""}`}
                                            style={{
                                                // Border styling
                                                borderTopStyle: 'solid',
                                                borderTopWidth: '1px',
                                                borderTopColor: (
                                                    highlightedVariable &&
                                                    highlightedVariable.tempId === variable.tempId &&
                                                    highlightedVariable.source === (isAvailable ? 'available' : 'control')
                                                    ? 'hsl(var(--primary))'
                                                    : 'hsl(var(--border))'),
                                                paddingTop: '4px',
                                                paddingBottom: '4px',
                                                
                                                // Consistent side/bottom borders
                                                borderLeftWidth: '1px', 
                                                borderRightWidth: '1px', 
                                                borderBottomWidth: '1px',
                                                borderLeftColor: (
                                                    highlightedVariable &&
                                                    highlightedVariable.tempId === variable.tempId &&
                                                    highlightedVariable.source === (isAvailable ? 'available' : 'control')
                                                    ? 'hsl(var(--primary))'
                                                    : 'hsl(var(--border))'),
                                                borderRightColor: (
                                                    highlightedVariable &&
                                                    highlightedVariable.tempId === variable.tempId &&
                                                    highlightedVariable.source === (isAvailable ? 'available' : 'control')
                                                    ? 'hsl(var(--primary))'
                                                    : 'hsl(var(--border))'),
                                                borderBottomColor: (
                                                    highlightedVariable &&
                                                    highlightedVariable.tempId === variable.tempId &&
                                                    highlightedVariable.source === (isAvailable ? 'available' : 'control')
                                                    ? 'hsl(var(--primary))'
                                                    : 'hsl(var(--border))'),
                                            }}
                                            onClick={() => {
                                                if (partialCorrelationKendallsTauB) {
                                                    handleVariableSelect(variable, isAvailable ? 'available' : 'control');
                                                }
                                            }}
                                            onDoubleClick={() => {
                                                if (partialCorrelationKendallsTauB) {
                                                    handleVariableDoubleClick(variable, isAvailable ? 'available' : 'control');
                                                }
                                            }}
                                        >
                                            <div className="flex items-center w-full truncate">
                                                <div className="w-[14px] mr-1 flex-shrink-0"></div>
                                                {getVariableIcon(variable)}
                                                <span className="truncate">{getDisplayName(variable)}</span>
                                            </div>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">
                                        <p className="text-xs">{getDisplayName(variable)}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ))
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div id="statistics-options-section" className="bg-card border border-border rounded-md p-5 relative">
                <div className="text-sm font-medium mb-3">Statistics</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <div className="flex items-center">
                        <Checkbox
                            id="means-and-standard-deviations"
                            checked={statisticsOptions.meansAndStandardDeviations}
                            onCheckedChange={(checked) => 
                                setStatisticsOptions({ ...statisticsOptions, meansAndStandardDeviations: !!checked })
                            }
                            disabled={!correlationCoefficient.pearson}
                            className="mr-2"
                        />
                        <Label htmlFor="means-and-standard-deviations" className="text-sm cursor-pointer">Means and Standard Deviations</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox
                            id="cross-product-deviations-and-covariances"
                            checked={statisticsOptions.crossProductDeviationsAndCovariances}
                            onCheckedChange={(checked) => 
                                setStatisticsOptions({ ...statisticsOptions, crossProductDeviationsAndCovariances: !!checked })
                            }
                            disabled={!correlationCoefficient.pearson}
                            className="mr-2"
                        />
                        <Label htmlFor="cross-product-deviations-and-covariances" className="text-sm cursor-pointer">Cross Product Deviations and Covariances</Label>
                    </div>
                </div>
                <ActiveElementHighlight active={tourActive && currentStep === statisticsOptionsStepIndex} />
            </div>

            <div id="missing-values-options-section" className="bg-card border border-border rounded-md p-5 relative">
                <div className="text-sm font-medium mb-3">Missing Values</div>
                <div>
                    <RadioGroup
                        value={
                            missingValuesOptions.excludeCasesPairwise
                                ? "excludeCasesPairwise"
                                : missingValuesOptions.excludeCasesListwise
                                ? "excludeCasesListwise"
                                : ""
                        }
                        onValueChange={(value) => {
                            if (value === "excludeCasesPairwise") {
                                setMissingValuesOptions({
                                    excludeCasesPairwise: true,
                                    excludeCasesListwise: false,
                                });
                            } else if (value === "excludeCasesListwise") {
                                setMissingValuesOptions({
                                    excludeCasesPairwise: false,
                                    excludeCasesListwise: true,
                                });
                            }
                        }}
                        disabled={!correlationCoefficient.pearson}
                        className="grid grid-cols-2 gap-x-6 gap-y-3"
                    >
                        <div className="flex items-center">
                            <RadioGroupItem
                                value="excludeCasesPairwise"
                                id="exclude-cases-pairwise"
                                className="mr-2"
                            />
                            <Label htmlFor="exclude-cases-pairwise" className="text-sm cursor-pointer">
                                Exclude cases pairwise
                            </Label>
                        </div>
                        <div className="flex items-center">
                            <RadioGroupItem
                                value="excludeCasesListwise"
                                id="exclude-cases-listwise"
                                className="mr-2"
                            />
                            <Label htmlFor="exclude-cases-listwise" className="text-sm cursor-pointer">
                                Exclude cases listwise
                            </Label>
                        </div>
                    </RadioGroup>
                </div>
                <ActiveElementHighlight active={tourActive && currentStep === missingValuesOptionsStepIndex} />
            </div>

            <div id="partial-correlation-kendalls-tau-b-section" className="bg-card border border-border rounded-md p-5 relative">
                <div className="space-y-4">
                    <div id="partial-correlation-section" className="flex items-center">
                        <Checkbox
                            id="partial-correlation-kendalls-tau-b"
                            checked={partialCorrelationKendallsTauB}
                            onCheckedChange={(checked) => setPartialCorrelationKendallsTauB(!!checked)}
                            className="mr-2"
                            disabled={!correlationCoefficient.kendallsTauB || testVariables.length < 3 || !missingValuesOptions.excludeCasesListwise}
                        />
                        <Label htmlFor="partial-correlation-kendalls-tau-b" className="text-sm cursor-pointer">Partial Correlation (Kendalls Tau-b)</Label>
                        <ActiveElementHighlight active={tourActive && currentStep === partialCorrelationKendallsTauBStepIndex} />
                    </div>
                    
                    <div id="control-variables-section" className={`flex gap-8 items-start relative ${!partialCorrelationKendallsTauB || !missingValuesOptions.excludeCasesListwise ? 'opacity-50 pointer-events-none' : ''}`}>
                        {/* Left column - Available Variables */}
                        <div className="w-[50%] flex flex-col relative">
                            {renderVariableList(availableVariablesForControl, "Available Variables", "300px", true)}
                        </div>

                        {/* Right column - Control Variables */}
                        <div className="w-[50%] flex flex-col relative">
                            <div className="text-sm font-medium mb-1.5 px-1 flex items-center h-6">
                                {renderMoveButtonToLeft()}
                                {renderMoveButtonToRight()}
                                <span className="truncate ml-1">Control Variable(s)</span>
                            </div>
                            <div className="border border-border p-1 rounded-md w-full transition-colors relative bg-background overflow-y-auto overflow-x-hidden" style={{ height: "300px" }}>
                                <div className="space-y-0.5 p-0.5 transition-all duration-150">
                                    {controlVariables.length === 0 ? (
                                        <div className="text-center text-muted-foreground py-4 text-sm">
                                            No control variables selected
                                        </div>
                                    ) : (
                                        controlVariables.map((variable) => (
                                            <TooltipProvider key={variable.tempId || variable.columnIndex}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            className={`flex items-center p-1 border rounded-md cursor-pointer group relative transition-all duration-150 ease-in-out text-sm hover:bg-accent
                                                                ${
                                                                    highlightedVariable &&
                                                                    highlightedVariable.tempId === variable.tempId &&
                                                                    highlightedVariable.source === 'control'
                                                                    ? "bg-accent border-primary"
                                                                    : "border-border"
                                                                }
                                                                ${!partialCorrelationKendallsTauB ? "opacity-50 cursor-not-allowed" : ""}`}
                                                            style={{
                                                                // Border styling
                                                                borderTopStyle: 'solid',
                                                                borderTopWidth: '1px',
                                                                borderTopColor: (
                                                                    highlightedVariable &&
                                                                    highlightedVariable.tempId === variable.tempId &&
                                                                    highlightedVariable.source === 'control'
                                                                    ? 'hsl(var(--primary))'
                                                                    : 'hsl(var(--border))'),
                                                                paddingTop: '4px',
                                                                paddingBottom: '4px',
                                                                
                                                                // Consistent side/bottom borders
                                                                borderLeftWidth: '1px', 
                                                                borderRightWidth: '1px', 
                                                                borderBottomWidth: '1px',
                                                                borderLeftColor: (
                                                                    highlightedVariable &&
                                                                    highlightedVariable.tempId === variable.tempId &&
                                                                    highlightedVariable.source === 'control'
                                                                    ? 'hsl(var(--primary))'
                                                                    : 'hsl(var(--border))'),
                                                                borderRightColor: (
                                                                    highlightedVariable &&
                                                                    highlightedVariable.tempId === variable.tempId &&
                                                                    highlightedVariable.source === 'control'
                                                                    ? 'hsl(var(--primary))'
                                                                    : 'hsl(var(--border))'),
                                                                borderBottomColor: (
                                                                    highlightedVariable &&
                                                                    highlightedVariable.tempId === variable.tempId &&
                                                                    highlightedVariable.source === 'control'
                                                                    ? 'hsl(var(--primary))'
                                                                    : 'hsl(var(--border))'),
                                                            }}
                                                            onClick={() => {
                                                                if (partialCorrelationKendallsTauB) {
                                                                    handleVariableSelect(variable, 'control');
                                                                }
                                                            }}
                                                            onDoubleClick={() => {
                                                                if (partialCorrelationKendallsTauB) {
                                                                    handleVariableDoubleClick(variable, 'control');
                                                                }
                                                            }}
                                                        >
                                                            <div className="flex items-center w-full truncate">
                                                                <div className="w-[14px] mr-1 flex-shrink-0"></div>
                                                                {getVariableIcon(variable)}
                                                                <span className="truncate">{getDisplayName(variable)}</span>
                                                            </div>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="right">
                                                        <p className="text-xs">{getDisplayName(variable)}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                        <ActiveElementHighlight active={tourActive && currentStep === controlVariablesStepIndex} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OptionsTab; 