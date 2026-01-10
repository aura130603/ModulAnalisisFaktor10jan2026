"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export type TieHandling = "mean" | "low" | "high" | "sequential";

interface TiesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: TieHandling;
  onChange: (value: TieHandling) => void;
}

const TiesDialog: React.FC<TiesDialogProps> = ({
  open,
  onOpenChange,
  value,
  onChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rank Cases: Ties</DialogTitle>
        </DialogHeader>

        <div className="py-6 px-2">
          <Label className="text-sm font-medium mb-4 block">
            Rank Assigned to Ties
          </Label>
          
          <RadioGroup value={value} onValueChange={(v) => onChange(v as TieHandling)}>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mean" id="mean" />
                <Label htmlFor="mean" className="font-medium cursor-pointer text-base">
                  Mean
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="low" id="low" />
                <Label htmlFor="low" className="font-medium cursor-pointer text-base">
                  Low
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="high" id="high" />
                <Label htmlFor="high" className="font-medium cursor-pointer text-base">
                  High
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sequential" id="sequential" />
                <Label htmlFor="sequential" className="font-medium cursor-pointer text-base">
                  Sequential ranks to unique values
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter className="flex gap-2 justify-center border-t pt-4">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6"
          >
            Continue
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-blue-500 text-blue-600 hover:bg-blue-50 px-6"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            className="border-blue-500 text-blue-600 hover:bg-blue-50 px-6"
          >
            Help
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TiesDialog;
