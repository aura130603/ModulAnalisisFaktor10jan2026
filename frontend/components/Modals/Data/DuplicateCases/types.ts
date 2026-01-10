import type { Variable } from "@/types/Variable";

export type TabType = 'variables' | 'options';

export type DuplicateCasesSource = 'source' | 'matching' | 'sorting';

export interface DuplicateCasesProps {
    onClose: () => void;
    containerType?: "dialog" | "sidebar";
}

interface TourTabProps {
    tourActive?: boolean;
    currentStep?: number;
    tourSteps?: any[];
}

export interface VariableTabProps extends TourTabProps {
    sourceVariables: Variable[];
    matchingVariables: Variable[];
    sortingVariables: Variable[];
    highlightedVariable: { id: string, source: DuplicateCasesSource } | null;
    setHighlightedVariable: (value: { id: string, source: DuplicateCasesSource } | null) => void;
    sortOrder: 'asc' | 'desc';
    setSortOrder: (order: 'asc' | 'desc') => void;
    handleMoveVariable: (variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => void;
    handleReorderVariable: (listId: string, reorderedList: Variable[]) => void;
    getVariableIcon: (variable: Variable) => React.JSX.Element;
    getDisplayName: (variable: Variable) => string;
    containerType: "dialog" | "sidebar";
}

export interface OptionsTabProps extends TourTabProps {
    primaryCaseIndicator: 'first' | 'last';
    setPrimaryCaseIndicator: (value: 'first' | 'last') => void;
    primaryName: string;
    setPrimaryName: (value: string) => void;
    sequentialCount: boolean;
    setSequentialCount: (value: boolean) => void;
    sequentialName: string;
    setSequentialName: (value: string) => void;
    moveMatchingToTop: boolean;
    setMoveMatchingToTop: (value: boolean) => void;
    displayFrequencies: boolean;
    setDisplayFrequencies: (value: boolean) => void;
    filterByIndicator: boolean;
    setFilterByIndicator: (value: boolean) => void;
    containerType: "dialog" | "sidebar";
} 