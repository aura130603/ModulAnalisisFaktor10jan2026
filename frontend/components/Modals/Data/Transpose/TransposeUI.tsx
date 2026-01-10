"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Shapes,
    Ruler,
    BarChartHorizontal,
    InfoIcon,
} from "lucide-react";
import type { Variable } from "@/types/Variable";
import type { TargetListConfig } from "@/components/Common/VariableListManager";
import VariableListManager from "@/components/Common/VariableListManager";
import type { TransposeUIProps } from "./types";

const getVariableIcon = (variable: Variable) => {
    switch (variable.measure) {
        case "scale":
            return <Ruler size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
        case "nominal":
            return <Shapes size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
        case "ordinal":
            return <BarChartHorizontal size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
        default:
            return variable.type === "STRING"
                ? <Shapes size={14} className="text-muted-foreground mr-1 flex-shrink-0" />
                : <Ruler size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
    }
};

const TransposeContent: React.FC<Omit<TransposeUIProps, 'containerType'>> = ({
    onClose,
    availableVariables,
    selectedVariables,
    nameVariables,
    highlightedVariable,
    setHighlightedVariable,
    getDisplayName,
    handleMoveVariable,
    handleReorderVariable,
    handleOk,
    handleReset,
}) => {
    const selectedListConfig: TargetListConfig = {
        id: 'selected',
        title: 'Variable(s):',
        variables: selectedVariables,
        height: '11.5rem',
        droppable: true,
        draggableItems: true,
    };

    const nameListConfig: TargetListConfig = {
        id: 'name',
        title: 'Name Variable:',
        variables: nameVariables,
        height: '3rem',
        maxItems: 1,
        droppable: true,
        draggableItems: false,
    };

    return (
        <>
            <div className="p-6 overflow-y-auto flex-grow">
                <div className="space-y-6">
                    <div className="flex items-center gap-2 py-2 mb-4 bg-accent p-3 rounded border border-border">
                        <InfoIcon className="text-accent-foreground h-4 w-4 flex-shrink-0" />
                        <p className="text-accent-foreground text-xs">
                            Variables become cases and cases become variables. The name variable (optional) provides names for the new variables.
                        </p>
                    </div>
                    <VariableListManager
                        availableVariables={availableVariables}
                        targetLists={[selectedListConfig, nameListConfig]}
                        variableIdKey="tempId"
                        highlightedVariable={highlightedVariable}
                        setHighlightedVariable={setHighlightedVariable}
                        onMoveVariable={handleMoveVariable}
                        onReorderVariable={handleReorderVariable}
                        getVariableIcon={getVariableIcon}
                        getDisplayName={getDisplayName}
                        showArrowButtons={true}
                        availableListHeight="14.5rem"
                    />
                </div>
            </div>

            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                <div className="flex items-center text-muted-foreground">
                    {/* Help icon or other elements can go here */}
                </div>
                <div>
                    <Button variant="outline" className="mr-2" onClick={handleReset} data-testid="transpose-reset-button">Reset</Button>
                    <Button variant="outline" className="mr-2" onClick={onClose} data-testid="transpose-cancel-button">Cancel</Button>
                    <Button onClick={handleOk} data-testid="transpose-ok-button">OK</Button>
                </div>
            </div>
        </>
    );
};

export const TransposeUI: React.FC<TransposeUIProps> = ({
    onClose,
    containerType = "dialog",
    ...props
}) => {
    const content = <TransposeContent onClose={onClose} {...props} />;

    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    {content}
                </div>
            </div>
        );
    }

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-md p-0 bg-card border border-border shadow-md rounded-md flex flex-col max-h-[85vh]" data-testid="transpose-dialog-content">
                <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                    <DialogTitle className="text-xl font-semibold" data-testid="transpose-dialog-title">Transpose</DialogTitle>
                </DialogHeader>
                <div className="flex-grow flex flex-col overflow-hidden">
                    {content}
                </div>
            </DialogContent>
        </Dialog>
    );
}; 