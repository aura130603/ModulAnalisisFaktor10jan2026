"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export interface RankTypesState {
  rank: boolean;
  savageScore: boolean;
  fractionalRank: boolean;
  fractionalRankPercent: boolean;
  sumCaseWeights: boolean;
  ntiles: boolean;
  ntilesValue: string;
  proportionEstimates: boolean;
  normalScores: boolean;
  proportionFormula: "blom" | "tukey" | "rankit" | "vanDerWaerden";
}

interface RankTypesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: RankTypesState;
  onChange: (newState: RankTypesState) => void;
}

const RankTypesDialog: React.FC<RankTypesDialogProps> = ({
  open,
  onOpenChange,
  state,
  onChange,
}) => {
  const handleCheckboxChange = (field: keyof RankTypesState, value: boolean) => {
    onChange({ ...state, [field]: value });
  };

  const handleNtilesChange = (value: string) => {
    onChange({ ...state, ntilesValue: value });
  };

  const handleFormulaChange = (value: string) => {
    onChange({
      ...state,
      proportionFormula: value as "blom" | "tukey" | "rankit" | "vanDerWaerden",
    });
  };

  const showProportionFormula = state.proportionEstimates || state.normalScores;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-96">
        <DialogHeader>
          <DialogTitle>Rank Cases: Types</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-4 px-2">
          {/* Left Column */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rank"
                checked={state.rank}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("rank", checked === true)
                }
              />
              <Label htmlFor="rank" className="font-medium cursor-pointer">
                Rank
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="savageScore"
                checked={state.savageScore}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("savageScore", checked === true)
                }
              />
              <Label htmlFor="savageScore" className="font-medium cursor-pointer">
                Savage score
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="fractionalRank"
                checked={state.fractionalRank}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("fractionalRank", checked === true)
                }
              />
              <Label
                htmlFor="fractionalRank"
                className="font-medium cursor-pointer"
              >
                Fractional rank
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="proportionEstimates"
                checked={state.proportionEstimates}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("proportionEstimates", checked === true)
                }
              />
              <Label
                htmlFor="proportionEstimates"
                className="font-medium cursor-pointer"
              >
                Proportion estimates
              </Label>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="fractionalRankPercent"
                checked={state.fractionalRankPercent}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("fractionalRankPercent", checked === true)
                }
              />
              <Label
                htmlFor="fractionalRankPercent"
                className="font-medium cursor-pointer"
              >
                Fractional rank as %
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="sumCaseWeights"
                checked={state.sumCaseWeights}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("sumCaseWeights", checked === true)
                }
              />
              <Label
                htmlFor="sumCaseWeights"
                className="font-medium cursor-pointer"
              >
                Sum of case weights
              </Label>
            </div>

            <div className="flex items-center space-x-2 gap-2">
              <Checkbox
                id="ntiles"
                checked={state.ntiles}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("ntiles", checked === true)
                }
              />
              <Label htmlFor="ntiles" className="font-medium cursor-pointer">
                Ntiles:
              </Label>
              <Input
                type="number"
                value={state.ntilesValue}
                onChange={(e) => handleNtilesChange(e.target.value)}
                disabled={!state.ntiles}
                className="w-16 h-8"
                min="1"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="normalScores"
                checked={state.normalScores}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("normalScores", checked === true)
                }
              />
              <Label
                htmlFor="normalScores"
                className="font-medium cursor-pointer"
              >
                Normal scores
              </Label>
            </div>
          </div>
        </div>

        {/* Proportion Estimation Formula Section */}
        {showProportionFormula && (
          <div className="border-t pt-4 px-2">
            <Label className="text-sm font-medium mb-3 block">
              Proportion Estimation Formula
            </Label>
            <div className="bg-gray-50 p-3 rounded border border-gray-200">
              <RadioGroup
                value={state.proportionFormula}
                onValueChange={handleFormulaChange}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="blom" id="blom" />
                  <Label htmlFor="blom" className="font-normal cursor-pointer">
                    Blom
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="tukey" id="tukey" />
                  <Label htmlFor="tukey" className="font-normal cursor-pointer">
                    Tukey
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rankit" id="rankit" />
                  <Label htmlFor="rankit" className="font-normal cursor-pointer">
                    Rankit
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="vanDerWaerden" id="vanderwarden" />
                  <Label
                    htmlFor="vanderwarden"
                    className="font-normal cursor-pointer"
                  >
                    Van der Waerden
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2 justify-end border-t pt-4">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            Continue
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            className="border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            Help
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RankTypesDialog;
