import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useMobile } from '@/hooks/useMobile';

interface NameLabelDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentEditingVariable: any;
    newVariableName: string;
    setNewVariableName: (name: string) => void;
    newVariableLabel: string;
    setNewVariableLabel: (label: string) => void;
    onApply: () => void;
}

const NameLabelDialog: React.FC<NameLabelDialogProps> = ({
    open,
    onOpenChange,
    currentEditingVariable,
    newVariableName,
    setNewVariableName,
    newVariableLabel,
    setNewVariableLabel,
    onApply
}) => {
    const { isMobile } = useMobile();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="w-full p-0 border border-border rounded-md shadow-lg"
                style={{
                    maxWidth: isMobile ? "95vw" : "480px",
                    width: "100%",
                    maxHeight: isMobile ? "100vh" : "65vh",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                }}
            >
                <div className="px-4 py-2 flex-shrink-0 bg-muted/30">
                    <DialogHeader className="p-0">
                        <DialogTitle className="text-base font-semibold">
                            Aggregate Data: Variable Name
                        </DialogTitle>
                    </DialogHeader>
                </div>
                <Separator className="flex-shrink-0" />
                <div className="flex-grow overflow-y-auto p-3">
                    <div className="text-center mb-4 text-xs bg-muted/50 p-2 rounded-md font-mono">
                        {currentEditingVariable && (() => {
                            const func = currentEditingVariable.calculationFunction || currentEditingVariable.function;
                            let displayFormula;

                            if (["PGT", "PLT", "FGT", "FLT"].includes(func) && currentEditingVariable.percentageValue) {
                                displayFormula = `${func}(${currentEditingVariable.baseVarName}, ${currentEditingVariable.percentageValue})`;
                            } else if (["PIN", "POUT", "FIN", "FOUT"].includes(func) &&
                                currentEditingVariable.percentageLow &&
                                currentEditingVariable.percentageHigh) {
                                displayFormula = `${func}(${currentEditingVariable.baseVarName}, ${currentEditingVariable.percentageLow}, ${currentEditingVariable.percentageHigh})`;
                            } else {
                                displayFormula = `${func}(${currentEditingVariable.baseVarName})`;
                            }

                            return displayFormula;
                        })()}
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2">
                            <Label htmlFor="name" className="text-sm text-right">Name:</Label>
                            <Input
                                id="name"
                                value={newVariableName}
                                onChange={(e) => setNewVariableName(e.target.value)}
                                className="h-7 text-sm w-full"
                                placeholder="Enter variable name"
                            />
                            <Label htmlFor="label" className="text-sm text-right">Label:</Label>
                            <Input
                                id="label"
                                value={newVariableLabel}
                                onChange={(e) => setNewVariableLabel(e.target.value)}
                                className="h-7 text-sm w-full"
                                placeholder="Enter variable label (optional)"
                            />
                        </div>
                    </div>
                </div>
                <Separator className="flex-shrink-0" />
                <DialogFooter className="px-4 py-2 flex-shrink-0 bg-muted/30">
                    <div className="flex gap-2 ml-auto">
                        <Button variant="outline" size="sm" className="h-7 text-sm" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button size="sm" className="h-7 text-sm" onClick={onApply}>
                            OK
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export { NameLabelDialog };