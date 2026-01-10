import React, { FC, useCallback } from "react";
import type { Variable } from "@/types/Variable";
import VariableListManager, {
  TargetListConfig,
} from "@/components/Common/VariableListManager";

interface ComputeVariablesTabProps {
  availableVariables: Variable[];
  targetVariable: Variable | null;
  highlightedVariable: {
    tempId: string;
    source: "available" | "target";
  } | null;
  setHighlightedVariable: React.Dispatch<
    React.SetStateAction<{
      tempId: string;
      source: "available" | "target";
    } | null>
  >;
  onSelectVariable: (variable: Variable) => void;
  onUnselectVariable: (variable: Variable) => void;
}

const ComputeVariablesTab: FC<ComputeVariablesTabProps> = ({
  availableVariables,
  targetVariable,
  highlightedVariable,
  setHighlightedVariable,
  onSelectVariable,
  onUnselectVariable,
}) => {
  const targetLists: TargetListConfig[] = [
    {
      id: "target",
      title: "Target Variable:",
      variables: targetVariable ? [targetVariable] : [],
      height: "min(calc(100vh - 400px), 150px)",
      draggableItems: true,
      droppable: true,
      maxItems: 1,
    },
  ];

  const managerHighlightedVariable = highlightedVariable
    ? { id: highlightedVariable.tempId, source: highlightedVariable.source }
    : null;

  const setManagerHighlightedVariable = useCallback(
    (value: { id: string; source: string } | null) => {
      if (
        value &&
        (value.source === "available" || value.source === "target")
      ) {
        setHighlightedVariable({
          tempId: value.id,
          source: value.source as "available" | "target",
        });
      } else {
        setHighlightedVariable(null);
      }
    },
    [setHighlightedVariable]
  );

  const handleMoveVariable = useCallback(
    (variable: Variable, fromListId: string, toListId: string) => {
      if (toListId === "target") {
        onSelectVariable(variable);
      } else if (toListId === "available") {
        onUnselectVariable(variable);
      }
    },
    [onSelectVariable, onUnselectVariable]
  );

  const handleReorderVariable = useCallback(
    (listId: string, variables: Variable[]) => {
      // For this component, we don't need to handle reordering
      // since we only have one target variable
    },
    []
  );

  return (
    <VariableListManager
      availableVariables={availableVariables}
      targetLists={targetLists}
      variableIdKey="tempId"
      highlightedVariable={managerHighlightedVariable}
      setHighlightedVariable={setManagerHighlightedVariable}
      onMoveVariable={handleMoveVariable}
      onReorderVariable={handleReorderVariable}
    />
  );
};

export default ComputeVariablesTab;
