import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Variable } from "@/types/Variable";
import { RecodeMapping } from "../Types";

interface VariableMappingEditorProps {
  recodeMappings: RecodeMapping[];
  selectedMappingIndex: number | null;
  onSelectMapping: (idx: number) => void;
  onUpdateMapping: (
    idx: number,
    field: "targetName" | "targetLabel",
    value: string
  ) => void;
  onRemoveMapping: (variable: Variable) => void;
}

const VariableMappingEditor: React.FC<VariableMappingEditorProps> = React.memo(
  ({
    recodeMappings,
    selectedMappingIndex,
    onSelectMapping,
    onUpdateMapping,
    onRemoveMapping,
  }) => {
    const [editName, setEditName] = useState("");
    const [editLabel, setEditLabel] = useState("");

    // Sync ke mapping terpilih
    useEffect(() => {
      if (selectedMappingIndex !== null) {
        setEditName(recodeMappings[selectedMappingIndex]?.targetName || "");
        setEditLabel(recodeMappings[selectedMappingIndex]?.targetLabel || "");
      }
    }, [selectedMappingIndex, recodeMappings]);

    // Saat user mengetik, hanya update state lokal
    const handleBlur = () => {
      if (selectedMappingIndex !== null) {
        onUpdateMapping(selectedMappingIndex, "targetName", editName);
        onUpdateMapping(selectedMappingIndex, "targetLabel", editLabel);
      }
    };

    return (
      <div>
        <ul className="border rounded p-2 h-48 overflow-y-auto">
          {recodeMappings.map((m, i) => (
            <li
              key={m.sourceVariable.tempId}
              className={`p-2 flex items-center gap-2 cursor-pointer rounded ${
                selectedMappingIndex === i ? "bg-blue-100" : ""
              }`}
              onClick={() => onSelectMapping(i)}
            >
              <span>
                {m.sourceVariable.name} --&gt; {m.targetName || "?"}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveMapping(m.sourceVariable);
                }}
              >
                🗑️
              </Button>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-col gap-2 border rounded p-2">
          {selectedMappingIndex !== null && (
            <>
              <label className="text-sm font-medium">Name:</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleBlur}
                className="bg-white"
                placeholder="Enter target variable name"
              />
              <label className="text-sm font-medium">Label:</label>
              <Input
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onBlur={handleBlur}
                className="bg-white"
                placeholder="Enter target variable label"
              />
            </>
          )}
          {selectedMappingIndex === null && (
            <div className="text-gray-400 text-sm">
              Select a variable to edit output name/label
            </div>
          )}
        </div>
      </div>
    );
  }
);
VariableMappingEditor.displayName = "VariableMappingEditor";

export default VariableMappingEditor;
