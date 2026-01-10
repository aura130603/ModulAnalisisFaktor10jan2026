import { useState, useEffect, useCallback } from "react";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import type { Variable } from "@/types/Variable";
import { restructureData } from "../services/restructureService";
import type { RestructureConfig } from "../types";

export enum RestructureMethod {
    VariablesToCases = "variables_to_cases",
    CasesToVariables = "cases_to_variables",
    TransposeAllData = "transpose_all_data",
}

export interface UseRestructureReturn {
    // State
    currentStep: number;
    activeTab: string;
    method: RestructureMethod;
    availableVariables: Variable[];
    selectedVariables: Variable[];
    indexVariables: Variable[];
    identifierVariables: Variable[];
    highlightedVariable: { id: string; source: string } | null;
    createCount: boolean;
    createIndex: boolean;
    dropEmptyVariables: boolean;
    validationErrors: string[];
    
    // Actions
    setCurrentStep: (step: number) => void;
    setActiveTab: (tab: string) => void;
    setMethod: (method: RestructureMethod) => void;
    setHighlightedVariable: (variable: { id: string; source: string } | null) => void;
    setCreateCount: (value: boolean) => void;
    setCreateIndex: (value: boolean) => void;
    setDropEmptyVariables: (value: boolean) => void;
    
    // Handlers
    handleNext: () => void;
    handleBack: () => void;
    handleFinish: (onClose: () => void) => Promise<void>;
    handleMoveVariable: (variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => void;
    handleReorderVariable: (listId: string, variables: Variable[]) => void;
    
    // Utilities
    validateCurrentStep: () => string[];
    prepareVariablesWithTempId: (vars: Variable[]) => Variable[];
}

/**
 * Custom hook for managing Restructure Data Wizard state and logic
 */
export const useRestructure = (): UseRestructureReturn => {
    // Get stores
    const { variables } = useVariableStore();
    const { data } = useDataStore();

    // State to manage wizard steps and tabs
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [activeTab, setActiveTab] = useState<string>("type");

    // State to store the selected restructure method
    const [method, setMethod] = useState<RestructureMethod>(
        RestructureMethod.VariablesToCases
    );

    // Variable selection states for different methods
    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [selectedVariables, setSelectedVariables] = useState<Variable[]>([]);
    const [indexVariables, setIndexVariables] = useState<Variable[]>([]);
    const [identifierVariables, setIdentifierVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{ id: string, source: string } | null>(null);

    // Options state
    const [createCount, setCreateCount] = useState(false);
    const [createIndex, setCreateIndex] = useState(true);
    const [dropEmptyVariables, setDropEmptyVariables] = useState(false);

    // Validation and error state
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    // Prepare variables with tempId for VariableListManager
    const prepareVariablesWithTempId = useCallback((vars: Variable[]) => {
        return vars.map(variable => ({
            ...variable,
            tempId: variable.columnIndex.toString()
        }));
    }, []);

    // Initialize available variables
    useEffect(() => {
        if (variables.length > 0) {
            const varsWithTempId = prepareVariablesWithTempId(variables);
            setAvailableVariables(varsWithTempId);
        }
    }, [variables, prepareVariablesWithTempId]);

    // Clear validation errors when method changes
    useEffect(() => {
        setValidationErrors([]);
    }, [method]);

    // Validation function
    const validateCurrentStep = useCallback((): string[] => {
        const errors: string[] = [];
        
        if (currentStep === 1) {
            if (!method) {
                errors.push("Please select a restructure method.");
            }
        } else if (currentStep === 2) {
            if (method !== RestructureMethod.TransposeAllData && selectedVariables.length === 0) {
                errors.push("Please select at least one variable to restructure.");
            }
            
            if (method === RestructureMethod.VariablesToCases && indexVariables.length === 0) {
                errors.push("Please select at least one index variable for variables-to-cases restructuring.");
            }
            
            if (method === RestructureMethod.CasesToVariables && identifierVariables.length === 0) {
                errors.push("Please select at least one identifier variable for cases-to-variables restructuring.");
            }
            
            // Check for duplicate variables across different lists
            const allSelectedIds = [
                ...selectedVariables.map(v => v.tempId),
                ...indexVariables.map(v => v.tempId),
                ...identifierVariables.map(v => v.tempId)
            ];
            const uniqueIds = new Set(allSelectedIds);
            if (allSelectedIds.length !== uniqueIds.size) {
                errors.push("A variable cannot be selected in multiple lists. Please review your selections.");
            }
        }
        
        return errors;
    }, [currentStep, method, selectedVariables, indexVariables, identifierVariables]);

    // Navigation handlers
    const handleNext = useCallback(() => {
        const errors = validateCurrentStep();
        setValidationErrors(errors);
        
        if (errors.length > 0) {
            return;
        }
        
        if (currentStep === 1) {
            // Clear any previous variable selections when method changes
            setSelectedVariables([]);
            setIndexVariables([]);
            setIdentifierVariables([]);
            setValidationErrors([]);
            
            // Move to variable selection
            if (method === RestructureMethod.TransposeAllData) {
                setCurrentStep(3);
                setActiveTab("options");
            } else {
                setCurrentStep(2);
                setActiveTab("variables");
            }
        } else if (currentStep === 2) {
            // Move to options
            setCurrentStep(3);
            setActiveTab("options");
        }
    }, [currentStep, validateCurrentStep, method]);

    const handleBack = useCallback(() => {
        setValidationErrors([]);
        
        if (currentStep === 3) {
             if (method === RestructureMethod.TransposeAllData) {
                setCurrentStep(1);
                setActiveTab("type");
            } else {
                setCurrentStep(2);
                setActiveTab("variables");
            }
        } else if (currentStep === 2) {
            setCurrentStep(1);
            setActiveTab("type");
        }
    }, [currentStep, method]);

    // Finish handler
    const handleFinish = useCallback(async (onClose: () => void) => {
        // Final validation before processing
        const errors = validateCurrentStep();
        setValidationErrors(errors);
        
        if (errors.length > 0) {
            return;
        }
        
        try {
            // Prepare restructuring configuration
            const config: RestructureConfig = {
                method,
                selectedVariables: selectedVariables.map(v => ({
                    name: v.name,
                    columnIndex: v.columnIndex,
                    type: v.type ?? 'STRING',
                    measure: v.measure
                })),
                indexVariables: indexVariables.map(v => ({
                    name: v.name,
                    columnIndex: v.columnIndex,
                    type: v.type ?? 'STRING',
                    measure: v.measure
                })),
                identifierVariables: identifierVariables.map(v => ({
                    name: v.name,
                    columnIndex: v.columnIndex,
                    type: v.type ?? 'STRING',
                    measure: v.measure
                })),
                options: {
                    createCount,
                    createIndex,
                    dropEmptyVariables
                }
            };

            const { data: newData, variables: newVars } = restructureData(data, variables, config);
            await useVariableStore.getState().overwriteAll(newVars, newData);
            onClose();
        } catch (error) {
            console.error("Error during data restructuring:", error);
            setValidationErrors(["An error occurred while restructuring the data. Please try again."]);
        }
    }, [
        validateCurrentStep, 
        method, 
        selectedVariables, 
        indexVariables, 
        identifierVariables,
        createCount,
        createIndex,
        dropEmptyVariables,
        data,
        variables
    ]);

    // Variable movement handlers
    const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => {
        // Remove from source list
        const sourceSetter = fromListId === 'available' ? setAvailableVariables :
                             fromListId === 'selected' ? setSelectedVariables :
                             fromListId === 'index' ? setIndexVariables :
                             fromListId === 'identifier' ? setIdentifierVariables : null;
        sourceSetter?.(prev => prev.filter(v => v.tempId !== variable.tempId));

        // Add to target list
        const targetSetter = toListId === 'available' ? setAvailableVariables :
                             toListId === 'selected' ? setSelectedVariables :
                             toListId === 'index' ? setIndexVariables :
                             toListId === 'identifier' ? setIdentifierVariables : null;
        targetSetter?.(prev => {
            const newList = [...prev];
            if (targetIndex !== undefined) {
                newList.splice(targetIndex, 0, variable);
            } else {
                newList.push(variable);
            }
            if(toListId === 'available') newList.sort((a,b) => a.columnIndex - b.columnIndex);
            return newList;
        });

        setHighlightedVariable(null);
    }, []);

    const handleReorderVariable = useCallback((listId: string, variables: Variable[]) => {
        if (listId === 'selected') {
            setSelectedVariables(variables);
        } else if (listId === 'index') {
            setIndexVariables(variables);
        } else if (listId === 'identifier') {
            setIdentifierVariables(variables);
        }
    }, []);

    return {
        // State
        currentStep,
        activeTab,
        method,
        availableVariables,
        selectedVariables,
        indexVariables,
        identifierVariables,
        highlightedVariable,
        createCount,
        createIndex,
        dropEmptyVariables,
        validationErrors,
        
        // Actions
        setCurrentStep,
        setActiveTab,
        setMethod,
        setHighlightedVariable,
        setCreateCount,
        setCreateIndex,
        setDropEmptyVariables,
        
        // Handlers
        handleNext,
        handleBack,
        handleFinish,
        handleMoveVariable,
        handleReorderVariable,
        
        // Utilities
        validateCurrentStep,
        prepareVariablesWithTempId,
    };
}; 