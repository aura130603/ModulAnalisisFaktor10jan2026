import React, { FC, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowBigLeft, ArrowBigRight, Ruler, Shapes, BarChartHorizontal, InfoIcon, ArrowBigUp, ArrowBigDown, MoveHorizontal, FileQuestion } from "lucide-react";
import { Variable } from "@/types/Variable";
import { VariablesTabProps } from "../types";
import { ActiveElementHighlight } from "@/components/Common/TourComponents";

const VariablesTab: FC<VariablesTabProps> = ({
    availableVariables,
    testVariables1,
    testVariables2,
    pairNumbers,
    highlightedVariable,
    setHighlightedVariable,
    highlightedPair,
    setHighlightedPair,
    moveToTestVariables,
    removeVariable,
    moveVariableBetweenLists,
    moveUpPair,
    moveDownPair,
    removePair,
    tourActive = false,
    currentStep = 0,
    tourSteps = []
}) => {
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

    const isVariableDisabled = useCallback((variable: Variable): boolean => {   
        return variable.type !== "NUMERIC";
    }, []);

    const handleVariableSelect = (variable: Variable, source: 'available' | 'test1' | 'test2', rowIndex?: number) => {
        if (source === 'available') {
            if (highlightedVariable && highlightedVariable.tempId === variable.tempId && highlightedVariable.source === source) {
                setHighlightedVariable(null);
            } else {
                setHighlightedVariable({ 
                    tempId: variable.tempId || `temp_id_${variable.columnIndex}`, 
                    source, 
                    rowIndex: undefined 
                });
                setHighlightedPair(null);
            }
        } else {
            if (highlightedVariable && 
                highlightedVariable.tempId === variable.tempId && 
                highlightedVariable.source === source && 
                highlightedVariable.rowIndex === rowIndex) {
                setHighlightedVariable(null);
            } else {
                setHighlightedVariable({ 
                    tempId: variable.tempId || `temp_id_${variable.columnIndex}`, 
                    source, 
                    rowIndex 
                });
                setHighlightedPair(null);
            }
        }
    };

    const handleVariableDoubleClick = useCallback((variable: Variable, sourceListId: string, rowIndex?: number) => {
        if (sourceListId === 'available' && !isVariableDisabled(variable)) {
            moveToTestVariables(variable);
        } else if (sourceListId === 'test1' && rowIndex !== undefined) {
            removeVariable('test1', rowIndex);
        } else if (sourceListId === 'test2' && rowIndex !== undefined) {
            removeVariable('test2', rowIndex);
        }
    }, [moveToTestVariables, removeVariable, isVariableDisabled]);

    const handlePairClick = (index: number) => {
        setHighlightedPair(highlightedPair?.id === index ? null : { id: index });
        setHighlightedVariable(null);
    };

    const handleMoveButton = () => {
        if (highlightedVariable) {
            if (highlightedVariable.source === 'available') {
                const variable = availableVariables.find(v => v.tempId === highlightedVariable.tempId);
                if (variable && !isVariableDisabled(variable)) {
                    moveToTestVariables(variable);
                }
            } else if (highlightedVariable.source === 'test1' && highlightedVariable.rowIndex !== undefined) {
                removeVariable('test1', highlightedVariable.rowIndex);
            } else if (highlightedVariable.source === 'test2' && highlightedVariable.rowIndex !== undefined) {
                removeVariable('test2', highlightedVariable.rowIndex);
            }
        }
    };

    const renderVariableList = (variables: Variable[], height: string) => (
        <div className="border border-border p-1 rounded-md w-full transition-colors relative bg-background overflow-y-auto overflow-x-hidden" style={{ height }}>
            <div className={`space-y-0.5 p-0.5 transition-all duration-150`}>
                {variables.map((variable) => (
                    <TooltipProvider key={variable.tempId || variable.columnIndex}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    className={`flex items-center p-1 border rounded-md cursor-pointer group relative transition-all duration-150 ease-in-out text-sm hover:bg-accent
                                        ${
                                            highlightedVariable &&
                                            highlightedVariable.tempId === variable.tempId &&
                                            highlightedVariable.source === 'available'
                                            ? "bg-accent border-primary"
                                            : "border-border"
                                        }
                                        ${isVariableDisabled(variable) ? "opacity-50 cursor-not-allowed" : ""}`}
                                    style={{
                                        // Border styling
                                        borderTopStyle: 'solid',
                                        borderTopWidth: '1px',
                                        borderTopColor: (
                                            highlightedVariable &&
                                            highlightedVariable.tempId === variable.tempId &&
                                            highlightedVariable.source === 'available'
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
                                            highlightedVariable.source === 'available'
                                            ? 'hsl(var(--primary))'
                                            : 'hsl(var(--border))'),
                                        borderRightColor: (
                                            highlightedVariable &&
                                            highlightedVariable.tempId === variable.tempId &&
                                            highlightedVariable.source === 'available'
                                            ? 'hsl(var(--primary))'
                                            : 'hsl(var(--border))'),
                                        borderBottomColor: (
                                            highlightedVariable &&
                                            highlightedVariable.tempId === variable.tempId &&
                                            highlightedVariable.source === 'available'
                                            ? 'hsl(var(--primary))'
                                            : 'hsl(var(--border))'),
                                    }}
                                    onClick={() => handleVariableSelect(variable, 'available')}
                                    onDoubleClick={() => handleVariableDoubleClick(variable, 'available')}
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
                ))}
            </div>
        </div>
    );

    const isTourElementActive = useCallback((elementId: string) => {
        if (!tourActive || currentStep >= tourSteps.length) return false;
        return tourSteps[currentStep]?.targetId === elementId;
    }, [tourActive, currentStep, tourSteps]);

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

    // Move button for paired variables
    const renderMoveButtonToLeft = () => {
        if (!highlightedVariable || highlightedVariable.source === 'available') {
            // If a pair is highlighted but no variable, show remove button for the pair
            if (highlightedPair) {
                return (
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-shrink-0 flex items-center justify-center p-0 w-6 h-6 rounded-full border-border hover:bg-accent hover:border-primary transition-all duration-150 ease-in-out"
                        onClick={() => removePair(highlightedPair.id || 0)}
                    >
                        <ArrowBigLeft size={16} />
                    </Button>
                );
            }
            return null;
        }
        
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

    return (
        <div className="flex gap-8 items-start relative">
            {/* Left column - Available Variables */}
            <div className="w-[30%] flex flex-col">
                <div className="text-sm font-medium mb-1.5 px-1 flex items-center h-6">
                    <span className="truncate">Available Variables</span>
                </div>
                {renderVariableList(availableVariables, '300px')}
                <div className="flex flex-col mt-2 space-y-2">
                    <div className="text-xs text-muted-foreground flex items-center p-1.5 rounded bg-accent border border-border">
                        <InfoIcon size={14} className="mr-1.5 flex-shrink-0 text-muted-foreground" />
                        <span>Double-click to move variables between lists.</span>
                    </div>
                </div>
            </div>

            {/* Right column - Paired Variables */}
            <div className="w-[60%] flex flex-col">
                <div className="text-sm font-medium mb-1.5 px-1 flex items-center h-6">
                    {renderMoveButtonToLeft()}
                    {renderMoveButtonToRight()}
                    <span className="truncate ml-1">Test Pairs</span>
                </div>
                <div className="mb-2 border border-border rounded-md overflow-auto" style={{height: "300px"}}>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">Pair</TableHead>
                                <TableHead>Variable 1</TableHead>
                                <TableHead>Variable 2</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {testVariables1.length === 0 && testVariables2.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                        No variables selected for testing
                                    </TableCell>
                                </TableRow>
                            ) : (
                                Array.from({ length: Math.max(testVariables1.length, testVariables2.length) }).map((_, index) => (
                                    <TableRow 
                                        key={index}
                                        className={highlightedPair?.id === index ? "bg-accent" : ""}
                                    >
                                        <TableCell 
                                            className={`text-center cursor-pointer hover:bg-accent ${
                                                highlightedPair?.id === index 
                                                ? "bg-accent" 
                                                : ""
                                            }`}
                                            onClick={() => handlePairClick(index)}
                                            style={{
                                                boxSizing: 'content-box',
                                                borderTopWidth: highlightedPair?.id === index
                                                    ? '1px' : '',
                                                borderBottomWidth: highlightedPair?.id === index
                                                    ? '1px' : '',
                                                borderLeftWidth: highlightedPair?.id === index
                                                    ? '1px' : '',
                                                borderColor: highlightedPair?.id === index 
                                                    ? 'hsl(var(--primary))' 
                                                    : 'hsl(var(--border))',
                                            }}
                                        >
                                            <span className="text-sm">{pairNumbers[index] || index + 1}</span>
                                        </TableCell>
                                        <TableCell 
                                            className={`cursor-pointer hover:bg-accent ${
                                                (
                                                    (highlightedVariable &&
                                                    testVariables1[index] &&
                                                    highlightedVariable.tempId === testVariables1[index].tempId &&
                                                    highlightedVariable.source === 'test1' &&
                                                    highlightedVariable.rowIndex === index)
                                                    ||
                                                    (highlightedPair?.id === index)
                                                )
                                                ? "bg-accent"
                                                : ""
                                            }`} 
                                            style={{
                                                // Border styling
                                                boxSizing: 'content-box',
                                                borderTopWidth:
                                                    (
                                                        (highlightedVariable &&
                                                        testVariables1[index] &&
                                                        highlightedVariable.tempId === testVariables1[index].tempId &&
                                                        highlightedVariable.source === 'test1' &&
                                                        highlightedVariable.rowIndex === index)
                                                        ||
                                                        (highlightedPair?.id === index)
                                                    )
                                                    ? '1px'
                                                    : '0px',
                                                borderBottomWidth:
                                                    (
                                                        (highlightedVariable &&
                                                        testVariables1[index] &&
                                                        highlightedVariable.tempId === testVariables1[index].tempId &&
                                                        highlightedVariable.source === 'test1' &&
                                                        highlightedVariable.rowIndex === index)
                                                        ||
                                                        (highlightedPair?.id === index)
                                                    )
                                                    ? '1px'
                                                    : '0px',
                                                borderLeftWidth:
                                                    highlightedVariable &&
                                                    testVariables1[index] &&
                                                    highlightedVariable.tempId === testVariables1[index].tempId &&
                                                    highlightedVariable.source === 'test1' &&
                                                    highlightedVariable.rowIndex === index
                                                    ? '1px'
                                                    : '0px',
                                                borderRightWidth:
                                                    highlightedVariable &&
                                                    testVariables1[index] &&
                                                    highlightedVariable.tempId === testVariables1[index].tempId &&
                                                    highlightedVariable.source === 'test1' &&
                                                    highlightedVariable.rowIndex === index
                                                    ? '1px'
                                                    : '0px',
                                                borderTopColor: (
                                                    (
                                                        (highlightedVariable &&
                                                        testVariables1[index] &&
                                                        highlightedVariable.tempId === testVariables1[index].tempId &&
                                                        highlightedVariable.source === 'test1' &&
                                                        highlightedVariable.rowIndex === index)
                                                        ||
                                                        (highlightedPair?.id === index)
                                                    )
                                                    ? 'hsl(var(--primary))'
                                                    : 'hsl(var(--border))'),
                                                borderBottomColor: (
                                                    (
                                                        (highlightedVariable &&
                                                        testVariables1[index] &&
                                                        highlightedVariable.tempId === testVariables1[index].tempId &&
                                                        highlightedVariable.source === 'test1' &&
                                                        highlightedVariable.rowIndex === index)
                                                        ||
                                                        (highlightedPair?.id === index)
                                                    )
                                                    ? 'hsl(var(--primary))'
                                                    : 'hsl(var(--border))'),
                                                borderLeftColor: (
                                                    highlightedVariable &&
                                                    testVariables1[index] &&
                                                    highlightedVariable.tempId === testVariables1[index].tempId &&
                                                    highlightedVariable.source === 'test1' &&
                                                    highlightedVariable.rowIndex === index
                                                    ? 'hsl(var(--primary))'
                                                    : 'hsl(var(--border))'),
                                                borderRightColor: (
                                                    highlightedVariable &&
                                                    testVariables1[index] &&
                                                    highlightedVariable.tempId === testVariables1[index].tempId &&
                                                    highlightedVariable.source === 'test1' &&
                                                    highlightedVariable.rowIndex === index
                                                    ? 'hsl(var(--primary))'
                                                    : 'hsl(var(--border))'),
                                            }}
                                            onClick={() => {
                                                if (testVariables1[index]) {
                                                    handleVariableSelect(testVariables1[index], 'test1', index);
                                                }
                                            }}
                                            onDoubleClick={() => {
                                                if (testVariables1[index]) {
                                                    handleVariableDoubleClick(testVariables1[index], 'test1', index);
                                                }
                                            }}
                                        >
                                            {testVariables1[index] ? (
                                                <div className="flex items-center">
                                                    {getVariableIcon(testVariables1[index])}
                                                    <span className="text-sm">{getDisplayName(testVariables1[index])}</span>
                                                </div>
                                            ) : ""}
                                        </TableCell>
                                        <TableCell 
                                            className={`cursor-pointer hover:bg-accent ${
                                                (
                                                    (highlightedVariable &&
                                                    testVariables2[index] &&
                                                    highlightedVariable.tempId === testVariables2[index].tempId &&
                                                    highlightedVariable.source === 'test2' &&
                                                    highlightedVariable.rowIndex === index)
                                                    ||
                                                    (highlightedPair?.id === index)
                                                )
                                                ? "bg-accent"
                                                : ""
                                            }`}
                                            style={{
                                                boxSizing: 'content-box',
                                                // Border styling
                                                borderTopStyle: 'solid',
                                                borderTopWidth:
                                                    (
                                                        (highlightedVariable &&
                                                        testVariables2[index] &&
                                                        highlightedVariable.tempId === testVariables2[index].tempId &&
                                                        highlightedVariable.source === 'test2' &&
                                                        highlightedVariable.rowIndex === index)
                                                        ||
                                                        (highlightedPair?.id === index)
                                                    )
                                                    ? '1px'
                                                    : '0px',
                                                borderBottomWidth:
                                                    (
                                                        (highlightedVariable &&
                                                        testVariables2[index] &&
                                                        highlightedVariable.tempId === testVariables2[index].tempId &&
                                                        highlightedVariable.source === 'test2' &&
                                                        highlightedVariable.rowIndex === index)
                                                        ||
                                                        (highlightedPair?.id === index)
                                                    )
                                                    ? '1px'
                                                    : '0px',
                                                borderLeftWidth:
                                                    highlightedVariable &&
                                                    testVariables2[index] &&
                                                    highlightedVariable.tempId === testVariables2[index].tempId &&
                                                    highlightedVariable.source === 'test2' &&
                                                    highlightedVariable.rowIndex === index
                                                    ? '1px'
                                                    : '0px',
                                                borderRightWidth:
                                                    (
                                                        (highlightedVariable &&
                                                        testVariables2[index] &&
                                                        highlightedVariable.tempId === testVariables2[index].tempId &&
                                                        highlightedVariable.source === 'test2' &&
                                                        highlightedVariable.rowIndex === index)
                                                        ||
                                                        (highlightedPair?.id === index)
                                                    )
                                                    ? '1px'
                                                    : '0px',
                                                borderTopColor: (
                                                    (
                                                        (highlightedVariable &&
                                                        testVariables2[index] &&
                                                        highlightedVariable.tempId === testVariables2[index].tempId &&
                                                        highlightedVariable.source === 'test2' &&
                                                        highlightedVariable.rowIndex === index)
                                                        ||
                                                        (highlightedPair?.id === index)
                                                    )
                                                    ? 'hsl(var(--primary))'
                                                    : 'hsl(var(--border))'),
                                                borderBottomColor: (
                                                    (
                                                        (highlightedVariable &&
                                                        testVariables2[index] &&
                                                        highlightedVariable.tempId === testVariables2[index].tempId &&
                                                        highlightedVariable.source === 'test2' &&
                                                        highlightedVariable.rowIndex === index)
                                                        ||
                                                        (highlightedPair?.id === index)
                                                    )
                                                    ? 'hsl(var(--primary))'
                                                    : 'hsl(var(--border))'),
                                                borderLeftColor: (
                                                    highlightedVariable &&
                                                    testVariables2[index] &&
                                                    highlightedVariable.tempId === testVariables2[index].tempId &&
                                                    highlightedVariable.source === 'test2' &&
                                                    highlightedVariable.rowIndex === index
                                                    ? 'hsl(var(--primary))'
                                                    : 'hsl(var(--border))'),
                                                borderRightColor: (
                                                    (
                                                        (highlightedVariable &&
                                                        testVariables2[index] &&
                                                        highlightedVariable.tempId === testVariables2[index].tempId &&
                                                        highlightedVariable.source === 'test2' &&
                                                        highlightedVariable.rowIndex === index)
                                                        ||
                                                        (highlightedPair?.id === index)
                                                    )
                                                    ? 'hsl(var(--primary))'
                                                    : 'hsl(var(--border))'),
                                            }}
                                            onClick={() => {
                                                if (testVariables2[index]) {
                                                    handleVariableSelect(testVariables2[index], 'test2', index);
                                                }
                                            }}
                                            onDoubleClick={() => {
                                                if (testVariables2[index]) {
                                                    handleVariableDoubleClick(testVariables2[index], 'test2', index);
                                                }
                                            }}
                                        >
                                            {testVariables2[index] ? (
                                                <div className="flex items-center">
                                                    {getVariableIcon(testVariables2[index])}
                                                    <span className="text-sm">{getDisplayName(testVariables2[index])}</span>
                                                </div>
                                            ) : ""}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex flex-row gap-1 justify-end">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveUpPair(highlightedPair?.id || 0)}
                        disabled={highlightedPair?.id === 0 || highlightedPair?.id === undefined}
                    >
                        <ArrowBigUp size={16} />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveDownPair(highlightedPair?.id || 0)}
                        disabled={highlightedPair?.id === Math.max(testVariables1.length, testVariables2.length) - 1 || highlightedPair?.id === undefined}
                    >
                        <ArrowBigDown size={16} />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveVariableBetweenLists(highlightedPair?.id || 0)}
                        disabled={highlightedPair?.id === undefined}
                    >
                        <MoveHorizontal size={16} />
                    </Button>
                </div>
            </div>
            
            <div id="two-related-samples-available-variables" className="absolute top-0 left-0 w-[48%] h-full pointer-events-none rounded-md">
                <ActiveElementHighlight active={isTourElementActive('two-related-samples-available-variables')} />
            </div>
            <div id="two-related-samples-test-variables" className="absolute top-0 right-0 w-[48%] h-full pointer-events-none rounded-md">
                <ActiveElementHighlight active={isTourElementActive('two-related-samples-test-variables')} />
            </div>
        </div>
    );
};

export default VariablesTab;