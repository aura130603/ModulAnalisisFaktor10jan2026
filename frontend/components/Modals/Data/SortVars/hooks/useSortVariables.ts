import { useState } from "react";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import type { Variable } from "@/types/Variable";
import { sortDataColumns } from "../services/sortVarsService";

// Map UI column names to variable field names
const columnToFieldMap: Record<string, keyof Variable> = {
    "Name": "name",
    "Type": "type",
    "Width": "width",
    "Decimals": "decimals",
    "Label": "label",
    "Values": "values",
    "Missing": "missing",
    "Columns": "columns",
    "Align": "align",
    "Measure": "measure"
};

// This maps to the indices used in getFieldNameByColumnIndex in useVariableStore.ts
const fieldToColumnIndex: Record<string, number> = {
    "name": 0,
    "type": 1,
    "width": 2,
    "decimals": 3,
    "label": 4,
    "values": 5,
    "missing": 6,
    "columns": 7,
    "align": 8,
    "measure": 9,
    "role": 10
};

interface UseSortVariablesProps {
    onClose: () => void;
}

export const useSortVariables = ({ onClose }: UseSortVariablesProps) => {
    const { variables, overwriteAll } = useVariableStore();
    const { data } = useDataStore();

    const [columns] = useState<string[]>([
        "Name", "Type", "Width", "Decimals", "Label", 
        "Values", "Missing", "Columns", "Align", "Measure",
    ]);

    const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    
    const handleSelectColumn = (column: string) => {
        setSelectedColumn(column);
    };

    const handleOk = async () => {
        if (!selectedColumn) {
            alert("Please select a column to sort by.");
            return;
        }

        try {
            const fieldName = columnToFieldMap[selectedColumn];
            if (!fieldName) throw new Error(`Column ${selectedColumn} not found in mapping.`);
            
            const columnIndex = fieldToColumnIndex[fieldName as string];
            if (columnIndex === undefined) throw new Error(`Field ${fieldName} not found.`);

            const originalVariables = [...variables];
            
            const sortedVariables = [...variables].sort((a, b) => {
                const valA = a[fieldName];
                const valB = b[fieldName];

                // Handle null/undefined values to be treated as "less than"
                if (valA == null && valB == null) return 0; // Both are null, treat as equal
                if (valA == null) return -1; // Nulls come first
                if (valB == null) return 1;  // Nulls come first

                if (valA < valB) return sortOrder === "asc" ? -1 : 1;
                if (valA > valB) return sortOrder === "asc" ? 1 : -1;
                return 0;
            }).map((v, index) => ({ ...v, columnIndex: index }));
            
            let newData = data;
            if (data.length > 0) {
                newData = sortDataColumns(data, originalVariables, sortedVariables);
            }

            await overwriteAll(sortedVariables, newData);

            onClose();
        } catch (error) {
            console.error("Error sorting variables:", error);
            alert("An error occurred while sorting variables.");
        }
    };

    const handleReset = () => {
        setSelectedColumn(null);
        setSortOrder("asc");
    };

    return {
        columns,
        selectedColumn,
        sortOrder,
        handleSelectColumn,
        setSortOrder,
        handleOk,
        handleReset,
    };
}; 