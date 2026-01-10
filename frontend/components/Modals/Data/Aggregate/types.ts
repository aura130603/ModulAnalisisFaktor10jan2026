import type { Variable, VariableType, VariableMeasure } from "@/types/Variable";

export interface AggregatedVariable extends Omit<Variable, 'id' | 'tempId' | 'values' | 'missing' | 'align' | 'role' | 'width' | 'decimals' | 'columns' | 'columnIndex'> {
    aggregateId: string;
    baseVarColumnIndex: number;
    baseVarName: string;
    baseVarType: VariableType;
    name: string;
    displayName: string;
    type: VariableType;
    measure: VariableMeasure;
    label?: string;
    function: string;
    functionCategory: "summary" | "specific" | "cases" | "percentages";
    calculationFunction?: string;
    percentageType?: "above" | "below" | "inside" | "outside";
    percentageValue?: string;
    percentageLow?: string;
    percentageHigh?: string;
    tempId?: string;
}

// It's good practice to also move other related types here if they are specific to this modal.
// For example, if AggregateDataProps is only used by Aggregate modal, it could go here.
// However, if it's used by other components that consume Aggregate, it might stay or go to a more shared location.
// For now, let's keep it simple and only move AggregatedVariable.

export interface AggregateDataProps {
    onClose: () => void;
    containerType?: "dialog" | "sidebar" | "panel";
}

// Tour-related types
export type PopupPosition = 'top' | 'bottom';
export type HorizontalPosition = 'left' | 'right';

export type TourStep = {
    title: string;
    content: string;
    targetId: string;
    defaultPosition: PopupPosition;
    defaultHorizontalPosition: HorizontalPosition;
    position?: PopupPosition;
    horizontalPosition?: HorizontalPosition | null;
    icon: string;
    tab?: 'variables' | 'options';
}; 