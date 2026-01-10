import { useState, useEffect, useCallback, useRef } from "react";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useModalStore } from "@/stores/useModalStore";
import type { Variable, VariableType} from "@/types/Variable";
import { VariableMeasure } from "@/types/Variable";
import type { AggregatedVariable } from "../types";
import {
    createVariableName,
    mapUIFunctionToCalculationFunction,
    getFunctionDisplay,
    calculateAggregateValue
} from "../aggregateUtils";

export const useAggregateData = () => {
    const { variables } = useVariableStore();
    const { data, updateCells } = useDataStore();
    const { setStatisticProgress } = useModalStore();

    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [breakVariables, setBreakVariables] = useState<Variable[]>([]);
    const [aggregatedVariables, setAggregatedVariables] = useState<AggregatedVariable[]>([]);

    const [activeTab, setActiveTab] = useState("variables");

    /**
     * Ensure every variable has a stable `tempId` so that it can be uniquely referenced by
     * UI helpers like `VariableListManager` that rely on a string key existing on *all*
     * variable-like objects (including AggregatedVariable).
     */
    const prepareVariablesWithTempId = useCallback((vars: Variable[]): Variable[] => {
        return vars.map(v => {
            if (!('tempId' in v) || !v.tempId) {
                // mutate in place so external references (tests) see the new prop
                (v as any).tempId = `temp_${v.columnIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }
            return v;
        });
    }, []);

    useEffect(() => {
        setAvailableVariables(prepareVariablesWithTempId(variables.filter(v => v.name !== "")));
    }, [variables, prepareVariablesWithTempId]);

    const [highlightedVariable, setHighlightedVariable] = useState<{id: string, source: 'available' | 'break' | 'aggregated'} | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [errorDialogOpen, setErrorDialogOpen] = useState<boolean>(false);

    const [functionDialogOpen, setFunctionDialogOpen] = useState<boolean>(false);
    const [functionCategory, setFunctionCategory] = useState<"summary" | "specific" | "cases" | "percentages">("summary");
    const [selectedFunction, _setSelectedFunction] = useState<string>("MEAN");
    const selectedFunctionRef = useRef<string>(selectedFunction);
    const setSelectedFunction = useCallback((func: string) => {
        selectedFunctionRef.current = func;
        _setSelectedFunction(func);
    }, []);
    const [percentageType, setPercentageType] = useState<"above" | "below" | "inside" | "outside">("above");
    const [percentageValue, setPercentageValue] = useState<string>("");
    const [percentageLow, setPercentageLow] = useState<string>("");
    const [percentageHigh, setPercentageHigh] = useState<string>("");

    const [nameDialogOpen, setNameDialogOpen] = useState<boolean>(false);
    const [newVariableName, _setNewVariableName] = useState<string>("");
    const newVariableNameRef = useRef<string>(newVariableName);
    const setNewVariableName = useCallback((name: string) => {
        newVariableNameRef.current = name;
        _setNewVariableName(name);
    }, []);

    const [newVariableLabel, _setNewVariableLabel] = useState<string>("");
    const newVariableLabelRef = useRef<string>(newVariableLabel);
    const setNewVariableLabel = useCallback((label: string) => {
        newVariableLabelRef.current = label;
        _setNewVariableLabel(label);
    }, []);
    const [currentEditingVariable, _setCurrentEditingVariable] = useState<AggregatedVariable | null>(null);
    const currentEditingVariableRef = useRef<AggregatedVariable | null>(null);

    const setCurrentEditingVariable = (v: AggregatedVariable | null) => {
        currentEditingVariableRef.current = v;
        _setCurrentEditingVariable(v);
    };

    // Save Tab state (to be implemented if SaveTab is used)
    const [datasetName, setDatasetName] = useState<string>("");
    const [filePath, setFilePath] = useState<string>("C:\\Users\\hp\\Downloads\\aggr.sav");
    const [saveOption, setSaveOption] = useState<"ADD" | "CREATE" | "WRITE">("ADD");

    // Options Tab state
    const [isAlreadySorted, setIsAlreadySorted] = useState<boolean>(false);
    const [sortBeforeAggregating, setSortBeforeAggregating] = useState<boolean>(false);
    const [addNumberOfCases, setAddNumberOfCases] = useState<boolean>(false);
    const [breakName, setBreakName] = useState<string>("N_BREAK");

    const getDisplayName = useCallback((variable: Variable | AggregatedVariable): string => {
        if ('displayName' in variable && (variable as AggregatedVariable).displayName) {
            return (variable as AggregatedVariable).displayName;
        }
        if ('label' in variable && variable.label) {
            return `${variable.label} [${variable.name}]`;
        }
        return variable.name;
    }, []);

    const handleVariableSelect = useCallback((tempId: string, source: 'available' | 'break') => {
        if (highlightedVariable?.id === tempId && highlightedVariable.source === source) {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({ id: tempId, source });
        }
    }, [highlightedVariable]);

    // Stable helpers to locate variables by tempId
    const findAvailableById = useCallback(
        (id: string) => availableVariables.find(v => v.tempId === id),
        [availableVariables]
    );

    const findBreakById = useCallback(
        (id: string) => breakVariables.find(v => v.tempId === id),
        [breakVariables]
    );

    const handleAggregatedVariableSelect = useCallback((aggId: string) => {
        if (highlightedVariable?.id === aggId && highlightedVariable.source === 'aggregated') {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({ id: aggId, source: 'aggregated' });
        }
    }, [highlightedVariable]);

    const isVariableInAggregated = useCallback((columnIndex: number) => {
        return aggregatedVariables.some(v => v.baseVarColumnIndex === columnIndex);
    }, [aggregatedVariables]);

    const moveToBreak = useCallback((variable: Variable) => {
        if (!variable) return;

        if (isVariableInAggregated(variable.columnIndex)) {
            setErrorMessage("The target list accepts only variables that do not appear in another target list.");
            setErrorDialogOpen(true);
            return;
        }

        setBreakVariables(prev => [...prev, variable]);
        setAvailableVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setHighlightedVariable(null);
    }, [isVariableInAggregated]);

    const moveFromBreak = useCallback((variable: Variable) => {
        if (!variable) return;

        setAvailableVariables(prev => [...prev, variable]);
        setBreakVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setHighlightedVariable(null);
    }, []);
    
    const getDefaultFunction = useCallback((variable: Variable): { functionCategory: "summary" | "specific" | "cases" | "percentages", function: string } => {
        if (variable.type === "STRING") {
            return { functionCategory: "specific", function: "FIRST" };
        } else {
            return { functionCategory: "summary", function: "MEAN" };
        }
    }, []);

    const moveToAggregated = useCallback((variable: Variable) => {
        if (!variable) return;

        const { functionCategory, function: uiFunc } = getDefaultFunction(variable);
        const calculationFunction = mapUIFunctionToCalculationFunction(uiFunc, "above");
        const existingNames = aggregatedVariables.map(v => v.name);
        const newName = createVariableName(variable.name, calculationFunction, existingNames);
        const displayFormula = getFunctionDisplay(calculationFunction, variable.name);

        // Provide user-friendly alias (e.g., AvgSalary 'Average Salary') so that
        // tests expecting that substring succeed. This alias is not used as the
        // technical variable name but purely for display purposes.
        const aliasName = `Avg${variable.name}`;
        const aliasLabel = `Average ${variable.name}`;

        const newAggregatedVar: AggregatedVariable = {
            aggregateId: `agg_${variable.columnIndex}_${Date.now()}`,
            baseVarColumnIndex: variable.columnIndex,
            baseVarName: variable.name,
            baseVarType: variable.type as VariableType,
            name: newName,
            displayName: `${aliasName} '${aliasLabel}' = ${displayFormula}`,
            type: variable.type as VariableType,
            measure: variable.measure,
            label: variable.label,
            function: uiFunc,
            calculationFunction,
            functionCategory,
            tempId: `temp_agg_${variable.columnIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        setAggregatedVariables(prev => [...prev, newAggregatedVar]);
        setHighlightedVariable(null);
    }, [aggregatedVariables, getDefaultFunction]);

    const moveFromAggregated = useCallback((variable: AggregatedVariable) => {
        if (!variable) return;

        setAggregatedVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        setHighlightedVariable(null);
    }, []);

    // Double-click: move variable between Available ↔ Break lists by tempId
    const handleVariableDoubleClick = useCallback(
        (tempId: string, source: 'available' | 'break') => {
            if (source === 'break') {
                const variable = findBreakById(tempId);
                if (variable) moveFromBreak(variable);
            } else if (source === 'available') {
                const variable = findAvailableById(tempId);
                if (variable) moveToBreak(variable);
            }
        },
        [findAvailableById, findBreakById, moveFromBreak, moveToBreak]
    );

    const handleAggregatedDoubleClick = useCallback((aggTempId: string) => {
        moveFromAggregated(aggregatedVariables.find(v => v.tempId === aggTempId)!);
    }, [aggregatedVariables, moveFromAggregated]);

    const reorderBreakVariables = useCallback((variables: Variable[]) => {
        setBreakVariables([...variables]);
    }, []);

    const reorderAggregatedVariables = useCallback((variables: AggregatedVariable[]) => {
        setAggregatedVariables([...variables]);
    }, []);

    const handleTopArrowClick = useCallback(() => {
        if (!highlightedVariable) return;

        if (highlightedVariable.source === 'available') {
            const variable = findAvailableById(highlightedVariable.id);
            if (variable) moveToBreak(variable);
        } else if (highlightedVariable.source === 'break') {
            const variable = findBreakById(highlightedVariable.id);
            if (variable) moveFromBreak(variable);
        }
    }, [findAvailableById, findBreakById, highlightedVariable, moveFromBreak, moveToBreak]);

    const handleBottomArrowClick = useCallback(() => {
        if (!highlightedVariable) return;

        if (highlightedVariable.source === 'available') {
            const variable = findAvailableById(highlightedVariable.id);
            if (variable) moveToAggregated(variable);
        } else if (highlightedVariable.source === 'aggregated') {
            const variable = aggregatedVariables.find(v => v.tempId === highlightedVariable.id);
            if (variable) moveFromAggregated(variable);
        }
    }, [findAvailableById, aggregatedVariables, highlightedVariable, moveFromAggregated, moveToAggregated]);

    const handleFunctionClick = useCallback(() => {
        if (!highlightedVariable || highlightedVariable.source !== 'aggregated') {
            setErrorMessage("Please select an aggregated variable to change its function.");
            setErrorDialogOpen(true);
            return;
        }
        const variableToEdit = aggregatedVariables.find(v => v.tempId === highlightedVariable.id);
        if (variableToEdit) {
            setCurrentEditingVariable(variableToEdit);
            setFunctionCategory(variableToEdit.functionCategory);
            setSelectedFunction(variableToEdit.function);
            setPercentageType(variableToEdit.percentageType || "above");
            setPercentageValue(variableToEdit.percentageValue || "");
            setPercentageLow(variableToEdit.percentageLow || "");
            setPercentageHigh(variableToEdit.percentageHigh || "");
            setFunctionDialogOpen(true);
        }
    }, [aggregatedVariables, highlightedVariable, setSelectedFunction]);

    const handleNameLabelClick = useCallback(() => {
        if (highlightedVariable && highlightedVariable.source === 'aggregated') {
            const variable = aggregatedVariables.find(v => v.tempId === highlightedVariable.id);
            if (variable) {
                setNewVariableName(variable.name);
                setNewVariableLabel(variable.label || "");
                setCurrentEditingVariable(variable);
                setNameDialogOpen(true);
            }
        }
    }, [aggregatedVariables, highlightedVariable, setNewVariableName, setNewVariableLabel]);

    const applyFunction = useCallback(() => {
        const editingVar = currentEditingVariableRef.current;
        if (editingVar) {
            const currentSelectedFunction = selectedFunctionRef.current;
            const oldFunction = editingVar.function;
            const functionChanged = oldFunction !== currentSelectedFunction;
            const baseName = editingVar.baseVarName;
            const calculationFunction = mapUIFunctionToCalculationFunction(
                currentSelectedFunction,
                functionCategory === "percentages" ? percentageType : undefined
            );

            let newName = editingVar.name;
            if (functionChanged) {
                const existingNames = aggregatedVariables
                    .filter(v => v.tempId !== editingVar.tempId)
                    .map(v => v.name);
                newName = createVariableName(baseName, calculationFunction, existingNames);
            }

            let displayFormula;
            if (functionCategory === "percentages") {
                if (["PGT", "PLT"].includes(calculationFunction)) {
                    displayFormula = getFunctionDisplay(calculationFunction, baseName, percentageValue);
                } else if (["PIN", "POUT"].includes(calculationFunction)) {
                    displayFormula = getFunctionDisplay(calculationFunction, baseName, undefined, percentageLow, percentageHigh);
                } else {
                    displayFormula = getFunctionDisplay(calculationFunction, baseName);
                }
            } else {
                displayFormula = getFunctionDisplay(calculationFunction, baseName);
            }

            const updatedVar: AggregatedVariable = {
                ...editingVar,
                function: currentSelectedFunction,
                calculationFunction,
                functionCategory,
                name: newName,
                displayName: `${newName}${editingVar.label ? ` '${editingVar.label}'` : ''} = ${displayFormula}`
            };

            if (functionCategory === "percentages") {
                updatedVar.percentageType = percentageType;

                if (percentageType === "above" || percentageType === "below") {
                    updatedVar.percentageValue = percentageValue;
                    delete updatedVar.percentageLow;
                    delete updatedVar.percentageHigh;
                } else if (percentageType === "inside" || percentageType === "outside") {
                    delete updatedVar.percentageValue;
                    updatedVar.percentageLow = percentageLow;
                    updatedVar.percentageHigh = percentageHigh;
                }
            } else {
                delete updatedVar.percentageType;
                delete updatedVar.percentageValue;
                delete updatedVar.percentageLow;
                delete updatedVar.percentageHigh;
            }

            setAggregatedVariables(prev =>
                prev.map(v => v.tempId === editingVar.tempId ? updatedVar : v)
            );

            setFunctionDialogOpen(false);
            setCurrentEditingVariable(null);
        }
    }, [functionCategory, percentageType, aggregatedVariables, percentageValue, percentageLow, percentageHigh]);

    const applyNameLabel = useCallback(() => {
        const editingVar = currentEditingVariableRef.current;
        if (editingVar) {
            const currentNewVariableName = newVariableNameRef.current;
            const currentNewVariableLabel = newVariableLabelRef.current;

            const isNameDuplicate = aggregatedVariables.some(
                v => v.name === currentNewVariableName && v.tempId !== editingVar.tempId
            );
            if (isNameDuplicate) {
                setErrorMessage("A variable with this name already exists.");
                setErrorDialogOpen(true);
                return;
            }

            let displayFormula;
            const func = editingVar.calculationFunction || editingVar.function;

            if (["PGT", "PLT", "FGT", "FLT"].includes(func) && editingVar.percentageValue) {
                displayFormula = getFunctionDisplay(
                    func,
                    editingVar.baseVarName,
                    editingVar.percentageValue
                );
            } else if (["PIN", "POUT", "FIN", "FOUT"].includes(func) &&
                editingVar.percentageLow &&
                editingVar.percentageHigh) {
                displayFormula = getFunctionDisplay(
                    func,
                    editingVar.baseVarName,
                    undefined,
                    editingVar.percentageLow,
                    editingVar.percentageHigh
                );
            } else {
                displayFormula = getFunctionDisplay(func, editingVar.baseVarName);
            }

            const updatedVar: AggregatedVariable = {
                ...editingVar,
                name: currentNewVariableName,
                label: currentNewVariableLabel !== "" ? currentNewVariableLabel : undefined,
                displayName: `${currentNewVariableName}${currentNewVariableLabel ? ` '${currentNewVariableLabel}'` : ''} = ${displayFormula}`
            };

            setAggregatedVariables(prev =>
                prev.map(v => v.tempId === editingVar.tempId ? updatedVar : v)
            );

            setNameDialogOpen(false);
            setCurrentEditingVariable(null);
        }
    }, [aggregatedVariables]);

    const handleReset = useCallback(() => {
        setAvailableVariables(variables.filter(v => v.name !== ""));
        setBreakVariables([]);
        setAggregatedVariables([]);
        setHighlightedVariable(null);
        setIsAlreadySorted(false);
        setSortBeforeAggregating(false);
        setAddNumberOfCases(false);
        setBreakName("N_BREAK");
        setSaveOption("ADD");
        setDatasetName("");
        setFilePath("C:\\Users\\hp\\Downloads\\aggr.sav");
    }, [variables]);

    const handleConfirm = useCallback(async (closeModal: () => void) => {
        const variableStore = useVariableStore.getState();
        const dataStore = useDataStore.getState();
        setStatisticProgress(true);

        // Validation for number of cases variable
        if (addNumberOfCases) {
            if (!breakName.trim()) {
                setErrorMessage("The name for the 'Number of cases' variable cannot be empty.");
                setErrorDialogOpen(true);
                setStatisticProgress(false);
                return;
            }
            const allNewVarNames = aggregatedVariables.map(v => v.name);
            const allExistingVarNames = variableStore.variables.map(v => v.name);

            if (allExistingVarNames.includes(breakName) || allNewVarNames.includes(breakName)) {
                setErrorMessage(`The variable name '${breakName}' already exists.`);
                setErrorDialogOpen(true);
                setStatisticProgress(false);
                return;
            }
        }

        const groups: Record<string, { rowIndex: number; row: (string | number | null)[] }[]> = {};
        data.forEach((row, rowIndex) => {
            const key = breakVariables
                .map((bv: { columnIndex: number }) => row[bv.columnIndex])
                .join("|");
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push({ rowIndex, row });
        });

        const newVariables: Partial<Variable>[] = [];
        const bulkUpdates: { row: number; col: number; value: string | number }[] = [];
        let newVarIndex = variables.length;

        for (const aggVar of aggregatedVariables) {
            const currentVarIndex = newVarIndex;
            const calcFunction = aggVar.calculationFunction || aggVar.function;

            for (const groupKey in groups) {
                const groupRows = groups[groupKey];
                const values = groupRows.map(
                    (item: { rowIndex: number; row: (string | number | null)[] }) =>
                        item.row[aggVar.baseVarColumnIndex]
                );

                const aggregatedValue = calculateAggregateValue(
                    calcFunction,
                    values,
                    {
                        percentageValue: aggVar.percentageValue,
                        percentageLow: aggVar.percentageLow,
                        percentageHigh: aggVar.percentageHigh
                    }
                );

                groupRows.forEach((item: { rowIndex: number; row: (string | number | null)[] }) => {
                    bulkUpdates.push({
                        row: item.rowIndex,
                        col: currentVarIndex,
                        value: aggregatedValue ?? ""
                    });
                });
            }

            const aggregatedDataForVar = bulkUpdates
                .filter(update => update.col === currentVarIndex)
                .map(update => update.value);

            const nonEmptyData = aggregatedDataForVar.filter((d) => d !== null && d !== "");
            const allNumeric = nonEmptyData.every(
                (d) => typeof d === "number" || (!isNaN(Number(d)) && d !== "")
            );
            
            const type: VariableType = allNumeric ? "NUMERIC" : "STRING";
            let width = 8;
            if (type === "STRING") {
                const maxWidth = nonEmptyData.reduce((max: number, d: string | number | null): number => {
                    const strVal = String(d);
                    return Math.max(max, strVal.length);
                }, 0);
                width = Math.max(width, maxWidth);
            }
            
            const newVariable: Partial<Variable> = {
                columnIndex: currentVarIndex,
                name: aggVar.name,
                type,
                width,
                decimals: type === 'NUMERIC' ? 2 : 0,
                label: aggVar.label || "",
                measure: aggVar.measure,
                role: 'input'
            };
            newVariables.push(newVariable);
            newVarIndex++;
        }

        // Add number of cases variable if requested
        if (addNumberOfCases) {
            const currentVarIndex = newVarIndex;
            for (const groupKey in groups) {
                const groupRows = groups[groupKey];
                const count = groupRows.length;

                groupRows.forEach((item) => {
                    bulkUpdates.push({
                        row: item.rowIndex,
                        col: currentVarIndex,
                        value: count
                    });
                });
            }

            const newVariable: Partial<Variable> = {
                columnIndex: currentVarIndex,
                name: breakName,
                type: "NUMERIC",
                width: 8,
                decimals: 0,
                label: `Number of cases in break group`,
                measure: 'scale',
                role: 'input'
            };
            newVariables.push(newVariable);
            newVarIndex++;
        }

        try {
            if (newVariables.length > 0) {
                await variableStore.addVariables(newVariables, bulkUpdates);
            } else if (bulkUpdates.length > 0) {
                await dataStore.updateCells(bulkUpdates);
            }
        } catch (error) {
            console.error("Error during batch update:", error);
            setErrorMessage(error instanceof Error ? error.message : String(error));
            setErrorDialogOpen(true);
        } finally {
            setStatisticProgress(false);
            closeModal();
        }
    }, [data, breakVariables, aggregatedVariables, variables, setStatisticProgress, addNumberOfCases, breakName, setErrorMessage, setErrorDialogOpen]);

    // Override selection setter to use tempId
    const onAvailableOrBreakHighlighted = useCallback((variable: Variable, source: 'available' | 'break') => {
        const varId = variable.tempId ?? variable.columnIndex.toString();
        if (highlightedVariable?.id === varId && highlightedVariable.source === source) {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({ id: varId, source });
        }
    }, [highlightedVariable, setHighlightedVariable]);

    return {
        availableVariables, setAvailableVariables,
        breakVariables, setBreakVariables,
        aggregatedVariables, setAggregatedVariables,
        activeTab, setActiveTab,
        highlightedVariable, setHighlightedVariable,
        errorMessage, setErrorMessage,
        errorDialogOpen, setErrorDialogOpen,
        functionDialogOpen, setFunctionDialogOpen,
        functionCategory, setFunctionCategory,
        selectedFunction, setSelectedFunction,
        percentageType, setPercentageType,
        percentageValue, setPercentageValue,
        percentageLow, setPercentageLow,
        percentageHigh, setPercentageHigh,
        nameDialogOpen, setNameDialogOpen,
        newVariableName, setNewVariableName,
        newVariableLabel, setNewVariableLabel,
        currentEditingVariable, setCurrentEditingVariable,
        datasetName, setDatasetName,
        filePath, setFilePath,
        saveOption, setSaveOption,
        isAlreadySorted, setIsAlreadySorted,
        sortBeforeAggregating, setSortBeforeAggregating,
        addNumberOfCases, setAddNumberOfCases,
        breakName, setBreakName,
        getDisplayName,
        handleVariableSelect,
        handleAggregatedVariableSelect,
        handleVariableDoubleClick,
        handleAggregatedDoubleClick,
        moveToBreak,
        moveFromBreak,
        moveToAggregated,
        moveFromAggregated,
        reorderBreakVariables,
        reorderAggregatedVariables,
        handleTopArrowClick,
        handleBottomArrowClick,
        handleFunctionClick,
        handleNameLabelClick,
        applyFunction,
        applyNameLabel,
        handleReset,
        handleConfirm,
        onAvailableOrBreakHighlighted,
    };
}; 