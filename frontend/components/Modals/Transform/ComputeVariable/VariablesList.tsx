import React, { useCallback } from "react";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Variable } from "@/types/Variable";
import { getVariableIcon } from "@/components/Common/iconHelper";

interface VariablesListProps {
  variables: Variable[];
  onVariableClick: (variable: Variable) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, variable: Variable) => void;
}

export const VariablesList: React.FC<VariablesListProps> = ({
  variables,
  onVariableClick,
  onDragStart,
}) => {
  return (
    <div className="flex-grow min-h-0 mt-4">
      <Label className="mb-2 block">Variables:</Label>
      <div className="border rounded-md bg-white h-[150px] md:h-[200px] lg:h-[270px]">
        <ScrollArea className="h-full p-1">
          <div className="space-y-1 p-1">
            {variables.map((variable) => (
              <div
                key={variable.tempId}
                className="flex items-center p-1 border rounded-md group relative transition-all duration-150 ease-in-out text-sm cursor-pointer hover:bg-accent border-border"
                onClick={() => onVariableClick(variable)}
                draggable="true"
                onDragStart={(e) => onDragStart(e, variable)}
              >
                <div className="flex items-center w-full truncate">
                  <div className="w-[14px] mr-1 flex-shrink-0"></div>
                  {getVariableIcon(variable)}
                  <span className="truncate text-xs">
                    {variable.label
                      ? `${variable.name} [${variable.label}]`
                      : variable.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
