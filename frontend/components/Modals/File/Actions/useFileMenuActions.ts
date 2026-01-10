import { useModal } from "@/hooks/useModal";
import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import {useResultStore} from "@/stores/useResultStore";
import { useMetaStore } from "@/stores/useMetaStore";
import { useRouter } from 'next/navigation';
import { createSavFile, downloadBlobAsFile } from '@/services/api';

export type FileMenuActionType =
    | "New"
    | "Save"
    | "SaveAs"
    | "Exit";

interface FileActionPayload {
    actionType: FileMenuActionType;
    data?: any;
}

export const useFileMenuActions = () => {
    const { openModal } = useModal();
    const router = useRouter();

    const handleAction = async ({ actionType, data }: FileActionPayload) => {
        switch (actionType) {
            case "New":
                await useDataStore.getState().resetData();
                await useVariableStore.getState().resetVariables();
                await useMetaStore.getState().resetMeta();
                useResultStore.getState().clearAll();
                console.log("New session started. Data, variables, and metadata reset.");
                break;
            case "Save":
                // Explicitly save the current state of all relevant stores
                try {
                    console.log("Explicit save action triggered.");
                    // Assuming existence of explicit save functions in stores
                    await useMetaStore.getState().saveMeta();
                    await useVariableStore.getState().saveVariables();
                    await useDataStore.getState().saveData();
                    console.log("All stores saved successfully.");
                    // Add user feedback (e.g., toast notification)
                } catch (error) {
                    console.error("Error during explicit save action:", error);
                    alert("An error occurred while saving data. Please check the console.");
                }
                break;
            case "SaveAs":
                try {
                    // Sync with server before proceeding
                    await useVariableStore.getState().loadVariables();
                    await useDataStore.getState().loadData();

                    const dataMatrix = useDataStore.getState().data;
                    const variablesStore = useVariableStore.getState().variables;

                    const actualRowCount = dataMatrix.reduce((max, row, index) => {
                        return row.some(cell => String(cell).trim() !== "") ? index + 1 : max;
                    }, 0);

                    const actualColCount = dataMatrix.reduce((max, row) => {
                        const lastFilledIndex = row.reduce((last: number, cell, index) => {
                            return String(cell).trim() !== "" ? index : last;
                        }, -1);
                        return Math.max(max, lastFilledIndex + 1);
                    }, 0);

                    const trimmedDataMatrix = dataMatrix
                        .slice(0, actualRowCount)
                        .map(row => row.slice(0, actualColCount));

                    const filteredVariables = variablesStore.filter(
                        variable =>
                            (String(variable.name).trim() !== "" ||
                            (variable.label && String(variable.label).trim() !== "")) &&
                            typeof variable.type === 'string' // Ensure type is defined
                    );

                    const sanitizeVariableName = (name: string) => {
                        let sanitized = name.trim();

                        if (!/^[a-zA-Z]/.test(sanitized)) {
                            sanitized = `V${  sanitized}`;
                        }

                        sanitized = sanitized.replace(/[^a-zA-Z0-9_]/g, "_");

                        if (sanitized.length > 64) {
                            sanitized = sanitized.substring(0, 64);
                        }

                        return sanitized;
                    };

                    // Map frontend measure to backend create payload
                    // Frontend uses: 'scale' | 'ordinal' | 'nominal' | 'unknown'
                    // Backend expects: 'continuous' | 'ordinal' | 'nominal'
                    const toCreateMeasure = (m: string | undefined): 'continuous' | 'ordinal' | 'nominal' => {
                        const lower = (m || '').toLowerCase();
                        if (lower === 'scale') return 'continuous';
                        if (lower === 'ordinal') return 'ordinal';
                        if (lower === 'nominal') return 'nominal';
                        // Fallback for 'unknown' or empty
                        return 'nominal';
                    };

                    const transformedVariables = filteredVariables.map(variable => {
                        const name = sanitizeVariableName(variable.name || `VAR${variable.columnIndex}`);

                        const valueLabels = Array.isArray(variable.values) ?
                            variable.values.map(vl => ({
                                value: vl.value,
                                label: vl.label || ""
                            })) : [];

                        return {
                            name,
                            label: variable.label || "",
                            type: variable.type!, // We filtered for string types, so this is safe
                            width: variable.width,
                            decimal: variable.decimals,
                            alignment: variable.align.toLowerCase(),
                            measure: toCreateMeasure(variable.measure as unknown as string),
                            columns: variable.columns,
                            valueLabels
                        };
                    });

                    const transformedData = trimmedDataMatrix.map(row => {
                        const record: Record<string, any> = {};
                        filteredVariables.forEach(variable => {
                            if (variable.columnIndex !== undefined && variable.columnIndex < actualColCount) {
                                const name = sanitizeVariableName(variable.name || `VAR${variable.columnIndex}`);
                                const cellValue = row[variable.columnIndex];
                                record[name] = cellValue;
                            }
                        });
                        return record;
                    });
                    
                    const savFileData = { data: transformedData, variables: transformedVariables };
                    const blob = await createSavFile(savFileData);
                    downloadBlobAsFile(blob, "data.sav");
                } catch (error) {
                    console.error(`Error during ${actionType} action:`, error);
                    alert(`Terjadi kesalahan saat menyimpan file .sav (${actionType}). Error: ${error instanceof Error ? error.message : String(error)}`);
                }
                break;

            case "Exit":
                try {
                    await useDataStore.getState().resetData();
                    await useVariableStore.getState().resetVariables();
                    await useMetaStore.getState().resetMeta();
                    await useResultStore.getState().clearAll();
                    console.log("Exiting application. All data cleared.");
                    router.push('/');
                } catch (error) {
                    console.error("Error during Exit action while resetting stores:", error);
                    alert("An error occurred while clearing data before exiting. Please try again.");
                }
                break;
            default:
                console.warn("Unknown file action:", actionType);
        }
    };

    return { handleAction };
}; 