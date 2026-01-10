import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    ChevronRight,
    InfoIcon,
    Ruler,
    Shapes,
    BarChartHorizontal
} from 'lucide-react';
import { Variable } from '@/types/Variable';
import { ScrollArea } from '@/components/ui/scroll-area';

interface VariablesTabProps {
    availableVariables: Variable[];
    highlightedVariable: string | null;
    setHighlightedVariable: (id: string | null) => void;
    selectedDependentVariable: Variable | null;
    selectedIndependentVariables: Variable | null;
    handleDependentDoubleClick: (variable: Variable) => void;
    handleIndependentDoubleClick: (variable: Variable) => void;
    moveToDependent: () => void;
    moveToIndependent: () => void;
    removeDependent: () => void;
    removeIndependent: () => void;
    isProcessing: boolean;
}

const VariablesTab: React.FC<VariablesTabProps> = ({
                                                       availableVariables,
                                                       highlightedVariable,
                                                       setHighlightedVariable,
                                                       selectedDependentVariable,
                                                       selectedIndependentVariables,
                                                       handleDependentDoubleClick,
                                                       handleIndependentDoubleClick,
                                                       moveToDependent,
                                                       moveToIndependent,
                                                       removeDependent,
                                                       removeIndependent,
                                                       isProcessing
                                                   }) => {
    const getVariableIcon = (variable: Variable) => {
        switch (variable.measure) {
            case "scale":
                return <Ruler size={14} className="text-[#888888] mr-1 flex-shrink-0" />;
            case "nominal":
                return <Shapes size={14} className="text-[#888888] mr-1 flex-shrink-0" />;
            case "ordinal":
                return <BarChartHorizontal size={14} className="text-[#888888] mr-1 flex-shrink-0" />;
            default:
                return variable.type === "STRING"
                    ? <Shapes size={14} className="text-[#888888] mr-1 flex-shrink-0" />
                    : <Ruler size={14} className="text-[#888888] mr-1 flex-shrink-0" />;
        }
    };

    const getDisplayName = (variable: Variable): string => {
        if (variable.label) {
            return `${variable.label} [${variable.name}]`;
        }
        return variable.name;
    };

    const handleVariableClick = (variableId: string) => {
        setHighlightedVariable(highlightedVariable === variableId ? null : variableId);
    };

    return (
        <div className="grid grid-cols-2 gap-6 py-4">
            {/* Left side - Available Variables */}
            <div className="col-span-1">
                <label className="font-semibold block mb-2">Variables:</label>
                <div className="border border-[#E6E6E6] rounded-md p-2 h-[480px] overflow-y-auto">
                    <ScrollArea className="h-full pr-2">
                        {availableVariables.map((variable) => (
                            <TooltipProvider key={variable.columnIndex}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className={`flex items-center p-1.5 mb-1 cursor-pointer border rounded-md hover:bg-[#F7F7F7] ${
                                                highlightedVariable === variable.columnIndex.toString()
                                                    ? "bg-[#E6E6E6] border-[#888888]"
                                                    : "border-[#CCCCCC]"
                                            }`}
                                            onClick={() => handleVariableClick(variable.columnIndex.toString())}
                                            onDoubleClick={() => handleDependentDoubleClick(variable)}
                                        >
                                            <div className="flex items-center w-full">
                                                {getVariableIcon(variable)}
                                                <span className="text-sm truncate">{getDisplayName(variable)}</span>
                                            </div>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">
                                        <p className="text-xs">{getDisplayName(variable)}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ))}
                        {availableVariables.length === 0 && (
                            <div className="flex items-center justify-center h-full text-sm text-gray-400">
                                No variables available
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </div>

            {/* Right side - Variable Assignments */}
            <div className="col-span-1 space-y-4">
                {/* Dependent Variable */}
                <div className="flex items-start">
                    <Button
                        variant="outline"
                        size="sm"
                        className="mr-2 p-0 h-8 w-8 flex items-center justify-center shrink-0 mt-[26px]"
                        onClick={moveToDependent}
                        disabled={!highlightedVariable || isProcessing}
                    >
                        <ChevronRight size={16} />
                    </Button>
                    <div className="flex-1">
                        <label className="font-semibold block mb-2">Dependent Variable:</label>
                        <div
                            className="mt-1 p-2 border rounded-md min-h-[40px] cursor-pointer bg-white hover:border-red-500"
                            onClick={removeDependent}
                            title={selectedDependentVariable ? `Click to remove ${getDisplayName(selectedDependentVariable)}` : ""}
                        >
                            {selectedDependentVariable ? (
                                <div className="flex items-center text-sm">
                                    {getVariableIcon(selectedDependentVariable)}
                                    <span className="truncate">{getDisplayName(selectedDependentVariable)}</span>
                                </div>
                            ) : (
                                <span className="text-gray-400 text-sm">[Select a variable]</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Independent Variables */}
                <div className="flex items-start">
                    <Button
                        variant="outline"
                        size="sm"
                        className="mr-2 p-0 h-8 w-8 flex items-center justify-center shrink-0 mt-[26px]"
                        onClick={moveToIndependent}
                        disabled={!highlightedVariable || isProcessing || selectedIndependentVariables !== null}
                    >
                        <ChevronRight size={16} />
                    </Button>
                    <div className="flex-1">
                        <label className="font-semibold block mb-2">Independent Variable:</label>
                        <div
                            className="mt-1 p-2 border rounded-md min-h-[40px] cursor-pointer bg-white hover:border-red-500"
                            onClick={removeIndependent}
                            title={selectedIndependentVariables ? `Click to remove ${getDisplayName(selectedIndependentVariables)}` : ""}
                        >
                            {selectedIndependentVariables ? (
                                <div className="flex items-center text-sm">
                                    {getVariableIcon(selectedIndependentVariables)}
                                    <span className="truncate">{getDisplayName(selectedIndependentVariables)}</span>
                                </div>
                            ) : (
                                <span className="text-gray-400 text-sm">[Select a variable]</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Case Labels */}
                
            </div>
        </div>
    );
};

export default VariablesTab;