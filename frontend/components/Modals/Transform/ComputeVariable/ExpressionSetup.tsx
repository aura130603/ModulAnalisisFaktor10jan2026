import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Variable } from "@/types/Variable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface ExpressionSetupProps {
  targetVariable: Variable | null;
  numericExpression: string;
  onExpressionChange: (expression: string) => void;
  availableVariables: Variable[];
  onClose: () => void;
}

// Calculator component
const Calculator = React.memo(
  ({ onButtonClick }: { onButtonClick: (text: string) => void }) => (
    <div className="grid grid-cols-6 gap-1">
      {[
        ["+", "<", ">", "7", "8", "9"],
        ["-", "<=", ">=", "4", "5", "6"],
        ["*", "==", "!=", "1", "2", "3"],
        ["/", "&", "|", "0", "0", "."],
        ["^", "~", "(", ")", "Delete", "Delete"],
      ].map((row, rowIndex) => (
        <React.Fragment key={rowIndex}>
          {row.map((symbol, colIndex) => (
            <Button
              key={`${rowIndex}-${colIndex}`}
              variant="outline"
              size="sm"
              className={
                symbol === "Delete" && colIndex === 4 ? "col-span-2" : ""
              }
              onClick={() => {
                if (symbol === "Delete") {
                  onButtonClick("");
                } else if (symbol === "~") {
                  onButtonClick("not(");
                } else if (symbol === "^") {
                  onButtonClick("**");
                } else {
                  onButtonClick(symbol);
                }
              }}
            >
              {symbol}
            </Button>
          ))}
        </React.Fragment>
      ))}
    </div>
  )
);
Calculator.displayName = "Calculator";

// Functions list component
const FunctionsList = React.memo(
  ({
    functionGroup,
    onDoubleClick,
  }: {
    functionGroup: string;
    onDoubleClick: (func: string) => void;
  }) => {
    const functionsByGroup = {
      Arithmetic: [
        "abs",
        "sqrt",
        "cbrt",
        "exp",
        "ln",
        "log",
        "log2",
        "log10",
        "square",
        "cube",
        "mod",
        "round",
        "pow",
      ],
      Statistical: [
        "mean",
        "median",
        "mode",
        "std",
        "var",
        "min",
        "max",
        "sum",
        "corr",
      ],
      Trigonometry: [
        "sin",
        "cos",
        "tan",
        "arcsin",
        "arccos",
        "arctan",
        "sinh",
        "cosh",
        "tanh",
      ],
    };

    const renderFunctionGroup = (groupName: string) => {
      if (functionGroup !== groupName && functionGroup !== "All") return null;

      return (
        <div className="space-y-1" key={groupName}>
          <div className="text-xs font-medium text-muted-foreground mb-2">
            {groupName}
          </div>
          {functionsByGroup[groupName as keyof typeof functionsByGroup].map(
            (func) => (
              <div
                key={func}
                className="text-sm p-1 hover:bg-muted rounded cursor-pointer"
                onDoubleClick={() => onDoubleClick(func)}
              >
                {func}(
              </div>
            )
          )}
        </div>
      );
    };

    return (
      <div className="border rounded-md flex-grow overflow-hidden">
        <div className="h-full overflow-y-auto p-2">
          {renderFunctionGroup("Arithmetic")}
          {renderFunctionGroup("Statistical")}
          {renderFunctionGroup("Trigonometry")}
        </div>
      </div>
    );
  }
);
FunctionsList.displayName = "FunctionsList";

const ExpressionSetup: React.FC<ExpressionSetupProps> = ({
  targetVariable,
  numericExpression,
  onExpressionChange,
  availableVariables,
  onClose,
}) => {
  const [functionGroup, setFunctionGroup] = useState("All");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddToExpression = useCallback(
    (text: string) => {
      if (text === "") {
        onExpressionChange("");
      } else {
        const newExpression = numericExpression + text;
        onExpressionChange(newExpression);
      }
    },
    [numericExpression, onExpressionChange]
  );

  const handleVariableDoubleClick = useCallback(
    (variableName: string) => {
      handleAddToExpression(variableName);
    },
    [handleAddToExpression]
  );

  const handleFunctionDoubleClick = useCallback(
    (func: string) => {
      handleAddToExpression(`${func}(`);
    },
    [handleAddToExpression]
  );

  const handleTextareaDrop = useCallback(
    (e: React.DragEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
      const textarea = e.target as HTMLTextAreaElement;
      const cursorPos = textarea.selectionStart;

      try {
        const dataString = e.dataTransfer.getData("application/json");
        if (!dataString) return;

        const { variableId } = JSON.parse(dataString);
        const variable = availableVariables.find(
          (v) => v.tempId === variableId
        );
        if (!variable) return;

        const textBefore = numericExpression.substring(0, cursorPos);
        const textAfter = numericExpression.substring(cursorPos);
        const newExpression = textBefore + variable.name + textAfter;

        onExpressionChange(newExpression);

        requestAnimationFrame(() => {
          const newCursorPos = cursorPos + variable.name.length;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
          textarea.focus();
        });
      } catch (error) {
        console.error("Error handling drop:", error);
      }
    },
    [availableVariables, numericExpression, onExpressionChange]
  );

  return (
    <>
      {errorMsg && (
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 h-full">
        {/* Left Column - Variables */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Available Variables:</Label>
            <ScrollArea className="h-[200px] md:h-[300px] border rounded-md p-2">
              {availableVariables.map((variable) => (
                <div
                  key={variable.tempId}
                  className="flex items-center space-x-2 p-1 hover:bg-muted rounded cursor-pointer text-sm"
                  onDoubleClick={() => handleVariableDoubleClick(variable.name)}
                  draggable
                >
                  <div className="w-4 h-4 flex-shrink-0">
                    {variable.type === "NUMERIC"
                      ? "🔢"
                      : variable.type === "STRING"
                      ? "📝"
                      : "📅"}
                  </div>
                  <span className="truncate">
                    {variable.label
                      ? `${variable.label} [${variable.name}]`
                      : variable.name}
                  </span>
                </div>
              ))}
            </ScrollArea>
          </div>
        </div>

        {/* Middle Column - Expression & Calculator */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Expression Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Numeric Expression:</Label>
            <textarea
              value={numericExpression}
              onChange={(e) => onExpressionChange(e.target.value)}
              onDrop={handleTextareaDrop}
              onDragOver={(e) => e.preventDefault()}
              className="w-full h-24 md:h-32 p-2 border rounded-md bg-white resize-none text-sm"
              placeholder="Enter expression or drag variables here"
            />
          </div>

          {/* Calculator */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Calculator:</Label>
            <Calculator onButtonClick={handleAddToExpression} />
          </div>
        </div>

        {/* Right Column - Functions */}
        <div className="lg:col-span-3 flex flex-col space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Functions:</Label>
            <Select value={functionGroup} onValueChange={setFunctionGroup}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select function group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Functions</SelectItem>
                <SelectItem value="Arithmetic">Arithmetic</SelectItem>
                <SelectItem value="Statistical">Statistical</SelectItem>
                <SelectItem value="Trigonometry">Trigonometry</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <FunctionsList
            functionGroup={functionGroup}
            onDoubleClick={handleFunctionDoubleClick}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 md:mt-6 flex flex-wrap gap-2 justify-end">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="outline">Help</Button>
      </div>
    </>
  );
};

export default ExpressionSetup;
