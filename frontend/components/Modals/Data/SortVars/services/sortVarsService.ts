import type { Variable } from "@/types/Variable";
import type { DataRow } from "@/types/Data";

/**
 * Reorders the columns of the dataset based on the new variable order.
 * @param data The original dataset.
 * @param originalVariables The order of variables before sorting.
 * @param sortedVariables The order of variables after sorting.
 * @returns The dataset with columns reordered.
 */
export function sortDataColumns(
    data: DataRow[],
    originalVariables: Variable[],
    sortedVariables: Variable[]
): DataRow[] {
    if (data.length === 0) {
        return [];
    }

    // Create a map from the original column index to the new column index.
    const columnMapping = new Map<number, number>();
    sortedVariables.forEach((newVar, newIndex) => {
        const originalVar = originalVariables.find(oldVar => oldVar.tempId === newVar.tempId);
        if (originalVar) {
            columnMapping.set(originalVar.columnIndex, newIndex);
        }
    });

    // If the mapping is incomplete, something went wrong.
    if (columnMapping.size !== originalVariables.length) {
        console.error("Column mapping is incomplete. Aborting data resort.");
        throw new Error("Failed to create a complete column mapping.");
    }

    // Reorder the data for each row.
    const newData = data.map(row => {
        const newRow: DataRow = Array(row.length).fill(null);
        originalVariables.forEach(oldVar => {
            const oldIndex = oldVar.columnIndex;
            const newIndex = columnMapping.get(oldIndex);

            if (newIndex !== undefined && oldIndex < row.length) {
                newRow[newIndex] = row[oldIndex];
            }
        });
        return newRow;
    });

    return newData;
} 