"use client";

import type { FC} from "react";
import React, { useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
    Ruler, 
    Shapes, 
    BarChartHorizontal, 
    ChevronUp, 
    ChevronDown, 
    HelpCircle,
    AlertTriangle,
} from "lucide-react";
import type { Variable } from "@/types/Variable";
import type { TargetListConfig } from "@/components/Common/VariableListManager";
import VariableListManager from "@/components/Common/VariableListManager";
import type { SortCasesUIProps, SortVariableConfig } from "./types";

const SortCasesUIContent: React.FC<SortCasesUIProps> = ({ 
    onClose,
    containerType = "dialog",
    availableVariables,
    sortByConfigs,
    defaultSortOrder, 
    setDefaultSortOrder,
    highlightedVariable, 
    setHighlightedVariable,
    error,
    getSortByVariables,
    handleMoveVariable,
    handleReorderVariable,
    changeSortDirection,
    moveVariableUp,
    moveVariableDown,
    handleOk,
    handleReset,
}) => {
    const getVariableIcon = (variable: Variable) => {
        switch (variable.measure) {
            case "scale": return <Ruler size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
            case "nominal": return <Shapes size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
            case "ordinal": return <BarChartHorizontal size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
            default:
                return variable.type === "STRING"
                    ? <Shapes size={14} className="text-muted-foreground mr-1 flex-shrink-0" />
                    : <Ruler size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
        }
    };

    const getDisplayName = (variable: Variable): string => {
        return variable.label ? `${variable.label} [${variable.name}]` : variable.name;
    };

    // Display helper that adds ▲ / ▼ **hanya** untuk variabel yang sudah berada di daftar "Sort By".
    const getEnhancedDisplayName = useCallback((variable: Variable): string => {
        const config = sortByConfigs.find((c: SortVariableConfig) => c.variable.tempId === variable.tempId);
        if (!config) {
            // Variabel belum ada di daftar Sort By → tampilkan nama biasa tanpa simbol arah
            return getDisplayName(variable);
        }

        const directionSymbol = config.direction === "asc" ? "▲" : "▼";
        return `${directionSymbol} ${getDisplayName(variable)}`;
    }, [sortByConfigs]);

    const renderSortByListFooter = useCallback((listId?: string) => {
        if (listId && listId !== 'sortBy') return null;

        const isActive = highlightedVariable?.source === 'sortBy';
        const selectedTempId = highlightedVariable?.id;
        const selectedConfig = sortByConfigs.find((c: SortVariableConfig) => c.variable.tempId === selectedTempId);
        // When nothing selected, fall back to first item just to keep component controlled (but disabled).
        const currentDir = selectedConfig?.direction ?? 'asc';

        return (
            <div className="mt-2 space-y-4">
                <div>
                    <div className="flex items-center mb-3 space-x-3">
                        <div className="flex space-x-1">
                            <Button
                                variant="outline" size="sm" className="h-7 w-7 p-0 flex items-center justify-center"
                                aria-label="Move Up"
                                onClick={() => selectedTempId && moveVariableUp(selectedTempId)}
                                disabled={!isActive || sortByConfigs.findIndex((c: SortVariableConfig) => c.variable.tempId === selectedTempId) === 0}
                            >
                                <ChevronUp size={14} />
                            </Button>
                            <Button
                                variant="outline" size="sm" className="h-7 w-7 p-0 flex items-center justify-center"
                                aria-label="Move Down"
                                onClick={() => selectedTempId && moveVariableDown(selectedTempId)}
                                disabled={!isActive || sortByConfigs.findIndex((c: SortVariableConfig) => c.variable.tempId === selectedTempId) === sortByConfigs.length - 1}
                            >
                                <ChevronDown size={14} />
                            </Button>
                        </div>
                        <div className="text-sm font-medium">Direction for selected variable:</div>
                    </div>
                    <RadioGroup
                        value={currentDir}
                        onValueChange={(value) => isActive && selectedTempId && changeSortDirection(selectedTempId, value as 'asc' | 'desc')}
                        className="flex flex-col space-y-2"
                    >
                        <Label className="flex items-center gap-2 cursor-pointer">
                            <RadioGroupItem value="asc" disabled={!isActive} />
                            <span className="text-sm">Ascending</span>
                        </Label>
                        <Label className="flex items-center gap-2 cursor-pointer">
                            <RadioGroupItem value="desc" disabled={!isActive} />
                            <span className="text-sm">Descending</span>
                        </Label>
                    </RadioGroup>
                </div>
            </div>
        );
    }, [highlightedVariable, sortByConfigs, changeSortDirection, moveVariableUp, moveVariableDown]);

    const sortByListConfig: TargetListConfig = {
        id: 'sortBy',
        title: 'Sort By:',
        variables: getSortByVariables(),
        height: '16rem',
        droppable: true,
        draggableItems: true
    };
    
    // Kontrol default direction tidak lagi ditampilkan.
    const renderDefaultSortOrderControls = useCallback(() => null, []);

    return (
        <>
            {containerType === "dialog" && (
                <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                    <DialogTitle className="text-xl font-semibold" data-testid="sortcases-dialog-title">Sort Cases</DialogTitle>
                </DialogHeader>
            )}
            <div className="p-6 overflow-y-auto flex-grow">
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <div className="grid grid-cols-1 gap-6">
                    <VariableListManager
                        availableVariables={availableVariables}
                        targetLists={[sortByListConfig]}
                        variableIdKey="tempId"
                        highlightedVariable={highlightedVariable}
                        setHighlightedVariable={setHighlightedVariable}
                        onMoveVariable={handleMoveVariable}
                        onReorderVariable={handleReorderVariable}
                        getVariableIcon={getVariableIcon}
                        getDisplayName={getEnhancedDisplayName}
                        renderListFooter={renderSortByListFooter}
                        showArrowButtons={true}
                        availableListHeight="16rem"
                        renderExtraInfoContent={renderDefaultSortOrderControls}
                    />
                </div>
            </div>
            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                <div className="flex items-center text-muted-foreground cursor-pointer hover:text-primary transition-colors">
                    <HelpCircle size={18} className="mr-1" />
                </div>
                <div>
                    <Button variant="outline" className="mr-2" onClick={handleReset} data-testid="sortcases-reset-button">Reset</Button>
                    <Button variant="outline" className="mr-2" onClick={onClose} data-testid="sortcases-cancel-button">Cancel</Button>
                    <Button onClick={handleOk} data-testid="sortcases-ok-button">OK</Button>
                </div>
            </div>
        </>
    );
};

export const SortCasesUI: FC<SortCasesUIProps> = (props) => {
    const { containerType = "dialog", onClose } = props;

    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <SortCasesUIContent {...props} />
                </div>
            </div>
        );
    }

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-lg p-0 bg-card border border-border shadow-md rounded-md flex flex-col max-h-[85vh]" data-testid="sortcases-dialog-content">
                <SortCasesUIContent {...props} />
            </DialogContent>
        </Dialog>
    );
}; 