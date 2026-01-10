"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronsRight } from "lucide-react";
import { Variable } from "@/types/Variable";

export interface PlotsLinearParams {
  selectedY: string | null;
  selectedX: string | null;
  histogramForXChecked: boolean;
  histogramVariable?: string | null;
}

interface PlotVariable {
  name: string;
}

interface PlotsLinearProps {
  params: PlotsLinearParams;
  onChange: (newParams: Partial<PlotsLinearParams>) => void;
  availablePlotVariables: PlotVariable[];
}

const PlotsLinear: React.FC<PlotsLinearProps> = ({ params, onChange, availablePlotVariables }) => {
  const [currentAvailableVariables, setCurrentAvailableVariables] = useState<PlotVariable[]>([]);
  const [highlightedVariable, setHighlightedVariable] = useState<PlotVariable | null>(null);

  useEffect(() => {
    const available = availablePlotVariables.filter(v =>
      v.name !== params.selectedY && v.name !== params.selectedX
    );
    setCurrentAvailableVariables(available);
    setHighlightedVariable(null);
  }, [params.selectedY, params.selectedX, availablePlotVariables]);

  const handleSelectAvailableVariable = (variable: PlotVariable) => {
    setHighlightedVariable(variable);
  };

  const handleChange = (field: keyof PlotsLinearParams, value: any) => {
    onChange({ [field]: value });
  };

  const handleMoveToY = () => {
    if (highlightedVariable) {
      onChange({ selectedY: highlightedVariable.name });
      setHighlightedVariable(null);
    }
  };

  const handleMoveToX = () => {
    if (highlightedVariable) {
      onChange({ selectedX: highlightedVariable.name });
      setHighlightedVariable(null);
    }
  };

  const handleRemoveY = () => {
    if (params.selectedY) {
      onChange({ selectedY: null });
    }
  };

  const handleRemoveX = () => {
    if (params.selectedX) {
      onChange({ selectedX: null });
    }
  };

  const handleMoveToHistogram = () => {
    if (highlightedVariable) {
      onChange({ histogramVariable: highlightedVariable.name });
      setHighlightedVariable(null);
    }
  };

  const handleRemoveHistogram = () => {
    if (params.histogramVariable) {
      onChange({ histogramVariable: null });
    }
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-4 py-4">
        <div className="border p-4 rounded-md max-h-[500px] overflow-y-auto">
          <Label className="font-semibold">Plot Variables</Label>
          <ScrollArea className="mt-2 h-[450px]">
            {currentAvailableVariables.map((variable) => (
              <div
                key={variable.name}
                onClick={() => handleSelectAvailableVariable(variable)}
                className={`p-2 border-b cursor-pointer hover:bg-gray-100 ${
                  highlightedVariable?.name === variable.name
                    ? "bg-blue-100 border-blue-500"
                    : "border-gray-300"
                }`}
              >
                {variable.name}
              </div>
            ))}
            {currentAvailableVariables.length === 0 && (
              <div className="flex items-center justify-center h-full text-sm text-gray-400">
                No variables available for plotting
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="flex flex-col space-y-4">
          <div className="border p-4 rounded-md">
            <span className="font-semibold mb-4 block">Scatterplot</span>

            <div className="flex items-center mb-3">
              <Label className="w-10">Y:</Label>
              <Input
                type="text"
                className="flex-1 cursor-pointer"
                placeholder="Select Y variable"
                value={params.selectedY ?? ""}
                readOnly
                onClick={handleRemoveY}
              />
              <Button
                variant="outline"
                className="ml-2"
                onClick={handleMoveToY}
                disabled={!highlightedVariable}
              >
                <ChevronsRight className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center">
              <Label className="w-10">X:</Label>
              <Input
                type="text"
                className="flex-1 cursor-pointer"
                placeholder="Select X variable"
                value={params.selectedX ?? ""}
                readOnly
                onClick={handleRemoveX}
              />
              <Button
                variant="outline"
                className="ml-2"
                onClick={handleMoveToX}
                disabled={!highlightedVariable}
              >
                <ChevronsRight className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center mt-4">
              <Checkbox
                id="histogramForX"
                checked={params.histogramForXChecked}
                onCheckedChange={(checked) => handleChange('histogramForXChecked', Boolean(checked))}
                disabled={!params.selectedX}
              />
              <Label htmlFor="histogramForX" className="ml-2 text-sm">
                Generate histogram for X-axis variable
              </Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlotsLinear;
