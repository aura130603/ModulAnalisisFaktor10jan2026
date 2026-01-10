import React from "react";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GripVertical } from "lucide-react";
import { getVariableIcon } from "@/components/Common/iconHelper";
import type { Variable } from "@/types/Variable";

interface VariableSelectionProps {
  variables: Variable[];
  onDragStart: (
    e: React.DragEvent<HTMLDivElement>,
    variableName: string
  ) => void;
}

const VariableSelection: React.FC<VariableSelectionProps> = ({
  variables,
  onDragStart,
}) => {
  return (
    <div className="border p-4 rounded-lg shadow-sm h-[250px]">
      <Label className="font-semibold">Choose Variables</Label>
      <div className="space-y-1 mt-4 overflow-y-auto max-h-[190px] p-1">
        {variables.map((variable, index) => (
          <TooltipProvider key={variable.columnIndex}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="flex items-center p-1 border rounded-md group relative transition-all duration-150 ease-in-out text-sm cursor-grab hover:bg-accent border-border"
                  draggable="true"
                  onDragStart={(e) => onDragStart(e, variable.name)}
                >
                  <div className="flex items-center w-full truncate">
                    <GripVertical
                      size={14}
                      className="text-muted-foreground mr-1 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity"
                    />
                    {getVariableIcon(variable)}
                    <span className="truncate text-xs">
                      {variable.label
                        ? `${variable.name} [${variable.label}]`
                        : variable.name}
                    </span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-sm">
                  {variable.label
                    ? `${variable.name} [${variable.label}]`
                    : variable.name}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
};

export default VariableSelection;
