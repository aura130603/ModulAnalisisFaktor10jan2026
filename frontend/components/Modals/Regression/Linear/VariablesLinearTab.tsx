import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ChevronRight } from 'lucide-react';
import { Variable } from '@/types/Variable'; // Assuming Variable type is defined here or adjust import
import { Ruler, Shapes, BarChartHorizontal, InfoIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface VariablesLinearTabProps {
  availableVariables: Variable[];
  selectedDependentVariable: Variable | null;
  selectedIndependentVariables: Variable[];
  highlightedVariable: Variable | null;
  method: string;
  handleSelectAvailableVariable: (variable: Variable | null) => void;
  handleMoveToDependent: () => void;
  handleMoveToIndependent: () => void;
  handleRemoveFromDependent: () => void;
  handleRemoveFromIndependent: (variable: Variable) => void;
}

const VariablesLinearTab: React.FC<VariablesLinearTabProps> = ({
  availableVariables,
  selectedDependentVariable,
  selectedIndependentVariables,
  highlightedVariable,
  method,
  handleSelectAvailableVariable,
  handleMoveToDependent,
  handleMoveToIndependent,
  handleRemoveFromDependent,
  handleRemoveFromIndependent,
}) => {

  // Helper function to get display name (label or name)
  const getDisplayName = (variable: Variable): string => {
    return variable.label ? `${variable.label} [${variable.name}]` : variable.name;
  };

  // Helper function to get variable icon (like in CurveEstimation)
  const getVariableIcon = (variable: Variable) => {
      switch (variable.measure) {
          case "scale":
              return <Ruler size={14} className="text-[#888888] mr-1.5 flex-shrink-0" />;
          case "nominal":
              return <Shapes size={14} className="text-[#888888] mr-1.5 flex-shrink-0" />;
          case "ordinal":
              return <BarChartHorizontal size={14} className="text-[#888888] mr-1.5 flex-shrink-0" />;
          default:
              return variable.type === "STRING"
                  ? <Shapes size={14} className="text-[#888888] mr-1.5 flex-shrink-0" />
                  : <Ruler size={14} className="text-[#888888] mr-1.5 flex-shrink-0" />;
      }
  };

  // Handler for single click
   const handleVariableClick = (variable: Variable) => {
        handleSelectAvailableVariable(highlightedVariable?.columnIndex === variable.columnIndex ? null : variable);
    };


  return (
    // Change to 2-column grid with gap
    <div className="grid grid-cols-2 gap-6 py-4">

      {/* Column 1: Available Variables List */}
      <div className="col-span-1">
        <label className="font-semibold block mb-2">Variables:</label>
        <div className="border border-[#E6E6E6] rounded-md p-2 h-[480px] overflow-y-auto"> {/* Adjusted height */}
          <ScrollArea className="h-full pr-2"> {/* Use ScrollArea component if preferred */}
            {availableVariables.map((variable) => (
                 <TooltipProvider key={variable.columnIndex}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                className={`flex items-center p-1.5 mb-1 cursor-pointer border rounded-md hover:bg-[#F7F7F7] ${
                                    highlightedVariable?.columnIndex === variable.columnIndex
                                        ? "bg-[#E6E6E6] border-[#888888]"
                                        : "border-[#CCCCCC]"
                                }`}
                                onClick={() => handleVariableClick(variable)} // Use single click for highlight
                                // Consider adding double-click handlers for faster moves if desired
                                // onDoubleClick={() => handleMoveToDependent()} // Example
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
          {/* Optional: Add info text like CurveEstimation */}
          {/* <div className="text-xs mt-2 text-[#888888] flex items-center">
              <InfoIcon size={14} className="mr-1 flex-shrink-0" />
              <span>Double-click to move variables. Single-click to select.</span>
          </div> */} 
      </div>

      {/* Column 2: Selection Boxes and Buttons */}
      <div className="col-span-1 space-y-4">
        {/* Dependent Variable */}
        <div className="flex items-start"> {/* Use items-start for alignment */}
          <Button
            variant="outline"
            size="sm"
            className="mr-2 p-0 h-8 w-8 flex items-center justify-center shrink-0 mt-[26px]" // Added mt to align with box
            onClick={handleMoveToDependent}
            disabled={!highlightedVariable || (selectedDependentVariable !== null) || !availableVariables.some(v => v.columnIndex === highlightedVariable?.columnIndex)} // Disable if box full or invalid selection
          >
            <ChevronRight size={16} />
          </Button>
          <div className="flex-1">
            <label className="font-semibold block mb-2">Dependent Variable:</label>
            <div
              className="mt-1 p-2 border rounded-md min-h-[40px] cursor-pointer bg-white hover:border-red-500" // Adjusted height/padding
              onClick={handleRemoveFromDependent}
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
            onClick={handleMoveToIndependent}
            disabled={!highlightedVariable || !availableVariables.some(v => v.columnIndex === highlightedVariable?.columnIndex)}
          >
            <ChevronRight size={16} />
          </Button>
          <div className="flex-1">
            <label className="font-semibold block mb-2">Independent Variable(s):</label>
            <div className="mt-1 p-2 border rounded-md min-h-[120px] bg-white"> {/* Adjusted height */}
              <ScrollArea className="h-[100px] pr-2"> {/* Wrap list in ScrollArea */}
                  {selectedIndependentVariables.length > 0 ? (
                    selectedIndependentVariables.map((variable) => (
                      <div
                        key={variable.columnIndex}
                        className="flex items-center p-1.5 mb-1 border rounded-md cursor-pointer hover:bg-[#F7F7F7] hover:border-red-500 text-sm"
                        onClick={() => handleRemoveFromIndependent(variable)}
                        title={`Click to remove ${getDisplayName(variable)}`}
                      >
                         {getVariableIcon(variable)}
                         <span className="truncate">{getDisplayName(variable)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-gray-400">
                        [Select variable(s)]
                    </div>
                  )}
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Method Display (Positioned below Independents) */}
         <div className="ml-[40px]"> {/* Indent to align roughly under the boxes */}
            <label className="font-semibold block mb-2">Method:</label>
            <div className="flex items-center mt-1">
              <div className="bg-muted/50 text-sm border rounded-md px-3 py-2 flex items-center min-h-[40px] w-full">
                <span className="font-medium text-foreground">Enter</span>
                <div className="ml-auto">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <InfoIcon size={14} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-[220px]">All selected independent variables will be entered in a single step</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
         </div>

      </div>
    </div>
  );
};

export default VariablesLinearTab; 