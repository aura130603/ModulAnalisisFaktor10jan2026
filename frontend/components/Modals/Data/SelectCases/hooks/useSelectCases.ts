import { useState, useEffect } from "react";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useModalStore } from "@/stores/useModalStore";
import { useMetaStore } from "@/stores/useMetaStore";
import type { Variable } from "@/types/Variable";
import { v4 as uuidv4 } from "uuid";
import { 
  selectByCondition, 
  selectByFilterVariable, 
  selectByRange, 
  selectRandomSample,
  type RandomSampleConfig,
  type RangeConfig 
} from "../services";

/**
 * Hook for managing SelectCases state and operations
 */
export const useSelectCases = () => {
    const { closeModal } = useModalStore();
    const { variables, addVariables, updateVariable } = useVariableStore();
    const { data, updateCells } = useDataStore();
    const { meta, setFilter } = useMetaStore();

    const [storeVariables, setStoreVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{id: string, source: 'available'} | null>(null);
    const [selectOption, setSelectOption] = useState<string>("all");
    const [filterVariable, setFilterVariable] = useState<Variable | null>(null);
    const [outputOption, setOutputOption] = useState<string>("filter");
    const [currentStatus, setCurrentStatus] = useState<string>("Do not filter cases");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [errorDialogOpen, setErrorDialogOpen] = useState<boolean>(false);
    const [ifConditionDialogOpen, setIfConditionDialogOpen] = useState<boolean>(false);
    const [randomSampleDialogOpen, setRandomSampleDialogOpen] = useState<boolean>(false);
    const [rangeDialogOpen, setRangeDialogOpen] = useState<boolean>(false);
    const [conditionExpression, setConditionExpression] = useState<string>("");
    const [randomSampleConfig, setRandomSampleConfig] = useState<RandomSampleConfig | null>(null);
    const [rangeConfig, setRangeConfig] = useState<RangeConfig | null>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    // Load variables from store
    useEffect(() => {
        setStoreVariables(variables.filter(v => v.name !== ""));
    }, [variables]);
    
    const handleVariableSelect = (columnIndex: number, source: 'available') => {
        if (highlightedVariable?.id === columnIndex.toString() && highlightedVariable.source === source) {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({ id: columnIndex.toString(), source });
        }
    };

    const handleVariableDoubleClick = (columnIndex: number, source: 'available') => {
        if (source === 'available') {
            const variable = storeVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                setFilterVariable(variable);
                setSelectOption("variable");
            }
        }
    };

    const handleTransferClick = () => {
        if (highlightedVariable && highlightedVariable.source === 'available') {
            const columnIndex = parseInt(highlightedVariable.id);
            const variable = storeVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                setFilterVariable(variable);
                setSelectOption("variable");
                setHighlightedVariable(null);
            }
        }
    };

    const getDisplayName = (variable: Variable): string => {
        if (variable.label) {
            return `${variable.label} [${variable.name}]`;
        }
        return variable.name;
    };

    const handleIfButtonClick = () => {
        setIfConditionDialogOpen(true);
    };

    const handleSampleButtonClick = () => {
        setRandomSampleDialogOpen(true);
    };

    const handleRangeButtonClick = () => {
        setRangeDialogOpen(true);
    };

    const handleIfConditionContinue = (condition: string) => {
        setConditionExpression(condition);
        setIfConditionDialogOpen(false);
        if (condition.trim()) {
            setCurrentStatus(`Condition: ${condition}`);
        }
    };

    const handleRandomSampleContinue = (result: RandomSampleConfig) => {
        setRandomSampleConfig(result);
        setRandomSampleDialogOpen(false);

        if (result.sampleType === "approximate" && result.percentage) {
            // Validate percentage is within valid range
            if (result.percentage <= 0 || result.percentage > 100) {
                setErrorMessage("Percentage must be between 0 and 100");
                setErrorDialogOpen(true);
                return;
            }
            setCurrentStatus(`Random sample: Approximately ${result.percentage}% of all cases`);
        } else if (result.sampleType === "exact" && result.exactCount) {
            // Validate exactCount is positive
            if (result.exactCount <= 0) {
                setErrorMessage("Sample count must be positive");
                setErrorDialogOpen(true);
                return;
            }
            setCurrentStatus(`Random sample: Exactly ${result.exactCount} cases from the first ${result.fromFirstCount || "all"} cases`);
        }
    };

    const handleRangeContinue = (result: RangeConfig) => {
        setRangeConfig(result);
        setRangeDialogOpen(false);

        if (result.firstCase || result.lastCase) {
            // Validate firstCase and lastCase are valid numbers
            if ((result.firstCase && parseInt(result.firstCase) <= 0) || 
                (result.lastCase && parseInt(result.lastCase) <= 0)) {
                setErrorMessage("Case indices must be positive");
                setErrorDialogOpen(true);
                return;
            }
            
            // Validate firstCase <= lastCase if both are provided
            if (result.firstCase && result.lastCase && 
                parseInt(result.firstCase) > parseInt(result.lastCase)) {
                setErrorMessage("First case must be less than or equal to last case");
                setErrorDialogOpen(true);
                return;
            }
            
            setCurrentStatus(`Range: Cases from ${result.firstCase || "start"} to ${result.lastCase || "end"}`);
        }
    };

    const createFilterVariable = async (selectedIndices: number[]) => {
        try {
            setIsProcessing(true);
            
            if (!selectedIndices.length) {
                throw new Error("No cases selected");
            }

            const filterValues = data.map((_, index) =>
                selectedIndices.includes(index) ? 1 : 0
            );

            const existingFilterVar = variables.find(v => v.name === "filter_$");
            const updates = filterValues.map((value, row) => ({
                row,
                col: existingFilterVar?.columnIndex || variables.length,
                value
            }));

            if (existingFilterVar) {
                await updateCells(updates);
            } else {
                const newVarIndex = variables.length;
                const newVar: Partial<Variable> = {
                    name: "filter_$",
                    type: "NUMERIC",
                    width: 8,
                    decimals: 0,
                    label: "Filter Variable",
                    measure: "nominal",
                    role: "input",
                    columnIndex: newVarIndex,
                };
                await addVariables([newVar], updates);
            }
            
            return true;
        } catch (error) {
            console.error("Error creating filter variable:", error);
            setErrorMessage(error instanceof Error ? error.message : "Failed to create filter variable");
            setErrorDialogOpen(true);
            return false;
        } finally {
            setIsProcessing(false);
        }
    };

    const applyRandomSampleFilter = async () => {
        try {
            setIsProcessing(true);
            
            if (!randomSampleConfig) {
                throw new Error("Random sample configuration is missing");
            }

            const totalCases = data.length;
            if (totalCases === 0) {
                throw new Error("Dataset is empty");
            }

            // Use the service function for consistent logic
            const selectedIndices = selectRandomSample(data, randomSampleConfig);
            
            if (!selectedIndices.length) {
                throw new Error("No cases were selected in random sample");
            }

            return await createFilterVariable(selectedIndices);
        } catch (error) {
            console.error("Error applying random sample filter:", error);
            setErrorMessage(error instanceof Error ? error.message : "Failed to apply random sample filter");
            setErrorDialogOpen(true);
            return false;
        } finally {
            setIsProcessing(false);
        }
    };

    const applyRangeFilter = async () => {
        try {
            setIsProcessing(true);
            
            if (!rangeConfig) {
                throw new Error("Range configuration is missing");
            }

            const totalCases = data.length;
            if (totalCases === 0) {
                throw new Error("Dataset is empty");
            }

            // Use the service function for consistent logic
            const selectedIndices = selectByRange(data, rangeConfig);
            
            if (!selectedIndices.length) {
                throw new Error("No cases were selected in the specified range");
            }

            return await createFilterVariable(selectedIndices);
        } catch (error) {
            console.error("Error applying range filter:", error);
            setErrorMessage(error instanceof Error ? error.message : "Failed to apply range filter");
            setErrorDialogOpen(true);
            return false;
        } finally {
            setIsProcessing(false);
        }
    };

    const applyVariableFilter = async () => {
        try {
            setIsProcessing(true);
            
            if (!filterVariable) {
                throw new Error("Filter variable is not selected");
            }

            const totalCases = data.length;
            if (totalCases === 0) {
                throw new Error("Dataset is empty");
            }

            // Use the service function for consistent logic
            const selectedIndices = selectByFilterVariable(data, variables, filterVariable);
            
            if (!selectedIndices.length) {
                throw new Error("No cases match the filter variable criteria");
            }

            return await createFilterVariable(selectedIndices);
        } catch (error) {
            console.error("Error applying variable filter:", error);
            setErrorMessage(error instanceof Error ? error.message : "Failed to apply variable filter");
            setErrorDialogOpen(true);
            return false;
        } finally {
            setIsProcessing(false);
        }
    };

    const applyConditionFilter = async () => {
        try {
            setIsProcessing(true);
            
            if (!conditionExpression.trim()) {
                throw new Error("Condition expression is empty");
            }

            const totalCases = data.length;
            if (totalCases === 0) {
                throw new Error("Dataset is empty");
            }

            // Use the service function for consistent logic
            const selectedIndices = selectByCondition(data, storeVariables, conditionExpression);
            
            if (!selectedIndices.length) {
                throw new Error("No cases match the specified condition");
            }

            return await createFilterVariable(selectedIndices);
        } catch (error) {
            console.error("Error applying condition filter:", error);
            setErrorMessage(error instanceof Error ? error.message : "Failed to apply condition filter");
            setErrorDialogOpen(true);
            return false;
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirm = async () => {
        try {
            setIsProcessing(true);
            
            if (selectOption === "variable" && !filterVariable) {
                throw new Error("Please select a filter variable");
            }

            // Save filter variable name to meta store
            await setFilter("filter_$");

            let success = false;

            if (selectOption === "all") {
                // Select all cases
                const allIndices = Array.from({ length: data.length }, (_, i) => i);
                success = await createFilterVariable(allIndices);
            } else if (selectOption === "condition") {
                success = await applyConditionFilter();
            } else if (selectOption === "random") {
                success = await applyRandomSampleFilter();
            } else if (selectOption === "time") {
                success = await applyRangeFilter();
            } else if (selectOption === "variable") {
                success = await applyVariableFilter();
            }

            if (success) {
                if (outputOption === "delete") {
                    // Actually delete unselected cases
                    const filterVarIndex = variables.find(v => v.name === "filter_$")?.columnIndex;

                    if (filterVarIndex !== undefined) {
                        // Find rows with filter_$ value of 0 (unselected)
                        const rowsToDelete: number[] = [];

                        for (let i = 0; i < data.length; i++) {
                            if (filterVarIndex < data[i].length && data[i][filterVarIndex] === 0) {
                                rowsToDelete.push(i);
                            }
                        }

                        // Safety check - prevent deleting all rows
                        if (rowsToDelete.length === data.length) {
                            throw new Error("Cannot delete all cases. At least one case must remain.");
                        }
                        
                        // Safety check - warn if deleting >80% of cases
                        if (rowsToDelete.length > data.length * 0.8) {
                            const deletePercentage = Math.round((rowsToDelete.length / data.length) * 100);
                            const warningMessage = `Warning: You are about to delete ${deletePercentage}% of your data (${rowsToDelete.length} out of ${data.length} cases). Are you sure?`;
                            
                            if (!window.confirm(warningMessage)) {
                                setCurrentStatus("Operation canceled by user");
                                return;
                            }
                        }

                        // Delete rows from highest index to lowest to avoid index shifting problems
                        if (rowsToDelete.length > 0) {
                            // Sort in descending order
                            rowsToDelete.sort((a, b) => b - a);
                            
                            // Use deleteRows instead of looping through each row
                            await useDataStore.getState().deleteRows(rowsToDelete);
                            setCurrentStatus(`Deleted ${rowsToDelete.length} unselected cases`);
                        } else {
                            setCurrentStatus("No unselected cases to delete");
                        }
                    } else {
                        throw new Error("Filter variable not found");
                    }
                } else {
                    setCurrentStatus("Filter applied: Unselected cases will be filtered out");
                }
                
                closeModal();
            }
        } catch (error) {
            console.error("Error in handleConfirm:", error);
            setErrorMessage(error instanceof Error ? error.message : "An error occurred during operation");
            setErrorDialogOpen(true);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setSelectOption("all");
        setFilterVariable(null);
        setOutputOption("filter");
        setCurrentStatus("Do not filter cases");
        setConditionExpression("");
        setRandomSampleConfig(null);
        setRangeConfig(null);
        
        // Clear saved filter in meta store
        setFilter('');
    };

    return {
        storeVariables,
        highlightedVariable,
        selectOption,
        filterVariable,
        outputOption,
        currentStatus,
        errorMessage,
        errorDialogOpen,
        ifConditionDialogOpen,
        randomSampleDialogOpen,
        rangeDialogOpen,
        conditionExpression,
        randomSampleConfig,
        rangeConfig,
        isProcessing,
        setErrorDialogOpen,
        setIfConditionDialogOpen,
        setRandomSampleDialogOpen,
        setRangeDialogOpen,
        handleVariableSelect,
        handleVariableDoubleClick,
        handleTransferClick,
        getDisplayName,
        handleIfButtonClick,
        handleSampleButtonClick,
        handleRangeButtonClick,
        handleIfConditionContinue,
        handleRandomSampleContinue,
        handleRangeContinue,
        handleConfirm,
        handleReset,
        setOutputOption,
        setSelectOption
    };
}; 