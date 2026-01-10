/*
 * New simplified VariablesTab (2025-07) – leverages VariableListManager for all drag-and-drop & selection.
 */

import type { FC} from "react";
import React, { useCallback } from "react";
import type { Variable } from "@/types/Variable";
import type { AggregatedVariable, TourStep } from "./types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { TargetListConfig } from "@/components/Common/VariableListManager";
import VariableListManager from "@/components/Common/VariableListManager";
import { Shapes, Ruler, BarChartHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface VariablesTabProps {
    availableVariables: Variable[];
    breakVariables: Variable[];
    aggregatedVariables: AggregatedVariable[];
    highlightedVariable: { id: string; source: "available" | "break" | "aggregated" } | null;
    addNumberOfCases: boolean;
    setAddNumberOfCases: (value: boolean) => void;
    breakName: string;
    setBreakName: (value: string) => void;
    handleVariableSelect: (tempId: string, source: "available" | "break") => void;
    handleAggregatedVariableSelect: (aggregateTempId: string) => void;
    handleFunctionClick: () => void;
    handleNameLabelClick: () => void;
    getDisplayName: (variable: Variable | AggregatedVariable) => string;
    moveToBreak: (variable: Variable) => void;
    moveFromBreak: (variable: Variable) => void;
    moveToAggregated: (variable: Variable) => void;
    moveFromAggregated: (variable: AggregatedVariable) => void;
    reorderBreakVariables: (variables: Variable[]) => void;
    reorderAggregatedVariables: (variables: AggregatedVariable[]) => void;
    containerType?: "dialog" | "sidebar" | "panel";
    tourActive: boolean;
    currentStep: number;
    tourSteps: TourStep[];
    handleVariableDoubleClick?: (tempId: string, source: "available" | "break") => void;
    handleAggregatedDoubleClick?: (tempId: string) => void;
    handleTopArrowClick?: () => void;
    handleBottomArrowClick?: () => void;
}

const VariablesTab: FC<VariablesTabProps> = ({
    availableVariables,
    breakVariables,
    aggregatedVariables,
    highlightedVariable,
    addNumberOfCases,
    setAddNumberOfCases,
    breakName,
    setBreakName,
    handleVariableSelect,
    handleAggregatedVariableSelect,
    handleFunctionClick,
    handleNameLabelClick,
    getDisplayName,
    moveToBreak,
    moveFromBreak,
    moveToAggregated,
    moveFromAggregated,
    reorderBreakVariables,
    reorderAggregatedVariables,
    handleVariableDoubleClick: _hvd = undefined,
    handleAggregatedDoubleClick: _had = undefined,
    handleTopArrowClick: _htu = undefined,
    handleBottomArrowClick: _hbd = undefined,
}) => {
    /* ------------ Icon helper ------------ */
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

    /* ------------ VariableListManager callbacks ------------ */
    const onMoveVariable = useCallback(
        (variable: Variable | AggregatedVariable, from: string, to: string) => {
            if (from === "available" && to === "break") moveToBreak(variable as Variable);
            if (from === "break" && to === "available") moveFromBreak(variable as Variable);
            if (from === "available" && to === "aggregated") moveToAggregated(variable as Variable);
            if (from === "aggregated" && to === "available") moveFromAggregated(variable as AggregatedVariable);
        },
        [moveToBreak, moveFromBreak, moveToAggregated, moveFromAggregated]
    );

    const onReorderVariable = useCallback(
        (listId: string, vars: (Variable | AggregatedVariable)[]) => {
            if (listId === "break") reorderBreakVariables(vars as Variable[]);
            if (listId === "aggregated") reorderAggregatedVariables(vars as AggregatedVariable[]);
        },
        [reorderBreakVariables, reorderAggregatedVariables]
    );

    const handleVariableItemDoubleClick = useCallback(
        (variable: Variable | AggregatedVariable, sourceListId: string) => {
            if (sourceListId === 'available' || sourceListId === 'break') {
                const id = (variable as any).columnIndex ?? (variable as any).tempId;
                if (_hvd && id !== undefined) {
                    _hvd(id as any, sourceListId as any);
                }
            } else if (sourceListId === 'aggregated') {
                const id = (variable as any).tempId ?? (variable as any).aggregateId;
                if (_had && id) {
                    _had(id as any);
                }
            }
        },
        [_hvd, _had]
    );

    /* ------------ Highlight bridge ------------ */
    const bridgeSetHighlightedVariable = useCallback(
        (info: { id: string; source: string } | null) => {
            if (!info) {
                handleAggregatedVariableSelect("");
                return;
            }
            if (info.source === "aggregated") {
                handleAggregatedVariableSelect(info.id);
            } else if (info.source === "available" || info.source === "break") {
                const searchList = info.source === "available" ? availableVariables : breakVariables;
                const variable = searchList.find(v => v.tempId === info.id);
                if (variable?.tempId) handleVariableSelect(variable.tempId, info.source);
            }
        },
        [availableVariables, breakVariables, handleVariableSelect, handleAggregatedVariableSelect]
    );

    /* ------------ Target lists ------------ */
    const breakListConfig: TargetListConfig = {
        id: "break",
        title: "Break Variable(s)",
        variables: breakVariables,
        height: "80px",
        droppable: true,
        draggableItems: true,
    };

    const aggregatedListConfig: TargetListConfig = {
        id: "aggregated",
        title: "Aggregated Variables",
        variables: aggregatedVariables as unknown as Variable[],
        height: "110px",
        droppable: true,
        draggableItems: true,
    };

    /* ------------ Footer & Extra UI ------------ */
    const renderListFooter = (listId: string) => {
        if (listId !== "aggregated") return null;
                    return (
            <div className="flex gap-1 mt-1" id="aggregate-footer-function-btns">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-sm"
                                onClick={handleFunctionClick}
                    disabled={highlightedVariable?.source !== "aggregated"}
                    id="aggregate-function-button"
                            >
                                Function...
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-sm"
                                onClick={handleNameLabelClick}
                    disabled={highlightedVariable?.source !== "aggregated"}
                    id="aggregate-name-label-button"
                            >
                                Name & Label...
                            </Button>
                        </div>
        );
    };

    const renderExtraInfoContent = () => null;

    const renderRightColumnFooter = () => (
        <div className="flex items-center mt-2 gap-2" id="aggregate-n-cases-wrapper">
                        <div className="flex items-center gap-1">
                            <Checkbox 
                                id="number-cases" 
                                className="mr-2"
                                checked={addNumberOfCases}
                                onCheckedChange={(checked) => setAddNumberOfCases(!!checked)}
                            />
                <Label htmlFor="number-cases" className="text-sm">Number of cases</Label>
                        </div>
                        <div className="flex items-center gap-1">
                <Label className={cn("text-sm", !addNumberOfCases && "text-muted-foreground/50")}>Name:</Label>
                            <Input
                                value={breakName}
                                onChange={(e) => setBreakName(e.target.value)}
                                className="h-6 text-sm w-24"
                                disabled={!addNumberOfCases}
                            />
                        </div>
                    </div>
    );

    const getDisplayNameWrapped = useCallback((variable: any) => {
        if (variable && typeof variable === 'object' && 'displayName' in variable && variable.displayName) {
            return variable.displayName as string;
        }
        return getDisplayName(variable as any);
    }, [getDisplayName]);

    /* ------------ Render ------------ */
    return (
        <div className="flex flex-col gap-4 py-2">
            <VariableListManager
                availableVariables={availableVariables}
                targetLists={[breakListConfig, aggregatedListConfig]}
                variableIdKey="tempId"
                highlightedVariable={highlightedVariable as any}
                setHighlightedVariable={bridgeSetHighlightedVariable}
                onMoveVariable={onMoveVariable as any}
                onReorderVariable={onReorderVariable as any}
                onVariableDoubleClick={handleVariableItemDoubleClick as any}
                getVariableIcon={getVariableIcon}
                getDisplayName={getDisplayNameWrapped as any}
                renderListFooter={renderListFooter}
                renderExtraInfoContent={renderExtraInfoContent}
                renderRightColumnFooter={renderRightColumnFooter}
                showArrowButtons={true}
                availableListHeight="250px"
            />
        </div>
    );
};

export default VariablesTab;