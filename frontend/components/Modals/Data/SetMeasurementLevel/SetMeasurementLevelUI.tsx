import type { FC } from "react";
import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InfoIcon } from "lucide-react";
import VariableListManager from "@/components/Common/VariableListManager";
import type { TargetListConfig } from "@/components/Common/VariableListManager";
import type { SetMeasurementLevelUIProps } from "./types";

const SetMeasurementLevelUIContent: FC<SetMeasurementLevelUIProps> = ({
    onClose,
    unknownVariables,
    nominalVariables,
    ordinalVariables,
    scaleVariables,
    highlightedVariable,
    setHighlightedVariable,
    handleMoveVariable,
    handleReorderVariable,
    handleSave,
    containerType = "dialog"
}) => {
    const targetLists: TargetListConfig[] = [
        {
            id: 'nominal',
            title: 'Nominal Variables',
            variables: nominalVariables,
            height: '110px',
            draggableItems: false
        },
        {
            id: 'ordinal',
            title: 'Ordinal Variables',
            variables: ordinalVariables,
            height: '110px',
            draggableItems: false
        },
        {
            id: 'scale',
            title: 'Scale/Continuous Variables',
            variables: scaleVariables,
            height: '110px',
            draggableItems: false
        }
    ];

    return (
        <>
            <div className="p-6 overflow-y-auto flex-grow">
                <div className="flex items-center gap-2 py-2 mb-4 bg-accent p-3 rounded border border-border">
                    <InfoIcon className="text-accent-foreground h-4 w-4 flex-shrink-0" />
                    <p className="text-accent-foreground text-xs">
                        This dialog only displays variables for which the measurement level is unknown.
                        Use Variable View in the Data Editor to change the measurement level for other variables.
                    </p>
                </div>
                <VariableListManager
                    availableVariables={unknownVariables}
                    targetLists={targetLists}
                    variableIdKey="tempId"
                    highlightedVariable={highlightedVariable}
                    setHighlightedVariable={setHighlightedVariable}
                    onMoveVariable={handleMoveVariable}
                    onReorderVariable={handleReorderVariable}
                    showArrowButtons={true}
                    availableListHeight={"420px"}
                />
            </div>
            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                <div className="flex items-center text-muted-foreground">
                </div>
                <div>
                    <Button
                        variant="outline"
                        className="mr-2"
                        onClick={onClose}
                        data-testid="setmeasurementlevel-cancel-button"
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSave} data-testid="setmeasurementlevel-ok-button">
                        OK
                    </Button>
                </div>
            </div>
        </>
    );
};

export const SetMeasurementLevelUI: FC<SetMeasurementLevelUIProps> = (props) => {
    const { containerType = "dialog", onClose } = props;

    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <SetMeasurementLevelUIContent {...props} />
                </div>
            </div>
        );
    }

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-[700px] p-0 bg-popover border border-border shadow-md rounded-md flex flex-col max-h-[85vh]" data-testid="setmeasurementlevel-dialog-content">
                <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                    <DialogTitle className="text-[22px] font-semibold text-popover-foreground" data-testid="setmeasurementlevel-dialog-title">Set Measurement Level</DialogTitle>
                </DialogHeader>
                <SetMeasurementLevelUIContent {...props} />
            </DialogContent>
        </Dialog>
    );
};