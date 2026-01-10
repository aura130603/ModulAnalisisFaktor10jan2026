"use client";

import React, { FC, useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { Variable } from "@/types/Variable";
import { useAnalyzeHook } from "@/components/Modals/Analyze/TimeSeries/UnitRootTest/hooks/analyzeHook";
import { useOptionHook } from "@/components/Modals/Analyze/TimeSeries/UnitRootTest/hooks/optionHook";
import VariablesTab from "@/components/Modals/Analyze/TimeSeries/UnitRootTest/VariablesTab";
import OptionTab from "@/components/Modals/Analyze/TimeSeries/UnitRootTest/OptionTab";
import { getFormData, saveFormData, clearFormData } from "@/hooks/useIndexedDB";
import { DataRow } from "@/types/Data";
import { toast } from "sonner";

interface UnitRootTestProps {
    onClose: () => void;
    containerType?: string;
}

interface VariableState {
    availableVariables: Variable[];
    selectedVariables: Variable[];
}

const UnitRootTest: FC<UnitRootTestProps> = ({ onClose, containerType }) => {
    const { variables } = useVariableStore();
    const { data } = useDataStore();
        
    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [selectedVariables, setSelectedVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{columnIndex: number, source: 'available' | 'selected'} | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [prevDataRef, setPrevDataRef] = useState<DataRow[] | null>(null);
    const [activeTab, setActiveTab] = useState("variables");

    const {
        methods,
        equations,
        differences,
        selectedMethod,
        selectedEquation,
        selectedDifference,
        lengthLag,
        handleMethodChange,
        handleEquationChange,
        handleDifferenceChange,
        handleLengthLag,
        resetOptions,
    } = useOptionHook();

    const { errorMsg: analysisError, isCalculating, handleAnalyzes } = useAnalyzeHook(
        selectedVariables,
        data,
        selectedMethod,
        selectedEquation,
        selectedDifference,
        lengthLag,
        onClose
    );
    const combinedError = errorMsg || analysisError;
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (combinedError) {
            toast.error("Error: " + String(combinedError));
        }
    }, [combinedError]);

    // Load saved state from IndexedDB on component mount
    useEffect(() => {
        const loadSavedState = async () => {
            try {
                const savedData = await getFormData("UnitRootTest", "variables");
                const filteredVariables = variables.filter(v => v.name !== "");
                
                if (savedData && savedData.prevDataRef) {
                    // If previous data reference exists, check if it matches current data
                    setPrevDataRef(savedData.prevDataRef);
                    if (JSON.stringify(savedData.prevDataRef) !== JSON.stringify(data)) {
                        // Clear saved state if previous data doesn't match current
                        await clearFormData("Autocorrelation");
                        setAvailableVariables(filteredVariables);
                        setSelectedVariables([]);
                        return;
                    }
                }

                if (savedData && savedData.availableVariables && savedData.selectedVariables) {
                    // Validate that saved variables still exist in current variable store
                    const validAvailableVars = savedData.availableVariables.filter((savedVar: Variable) =>
                        filteredVariables.some(v => v.columnIndex === savedVar.columnIndex)
                    );
                    const validSelectedVars = savedData.selectedVariables.filter((savedVar: Variable) =>
                        filteredVariables.some(v => v.columnIndex === savedVar.columnIndex)
                    );
                    
                    // Get variables that weren't in saved state
                    const savedColumnIndexes = [...validAvailableVars, ...validSelectedVars].map(v => v.columnIndex);
                    const newVariables = filteredVariables.filter(v => 
                        !savedColumnIndexes.includes(v.columnIndex)
                    );
                    
                    setAvailableVariables([...validAvailableVars, ...newVariables]);
                    setSelectedVariables(validSelectedVars);
                } else {
                    // No saved state, use all variables as available
                    setAvailableVariables(filteredVariables);
                    setSelectedVariables([]);
                }
            } catch (error) {
                console.error("Failed to load saved variable state:", error);
                // Fallback to default state
                setAvailableVariables(variables.filter(v => v.name !== ""));
                setSelectedVariables([]);
            } finally {
                setIsLoaded(true);
            }
        };

        loadSavedState();
    }, [variables, data]);

    // Save state to IndexedDB whenever variables change
    useEffect(() => {
        if (!isLoaded) return; // Don't save during initial load
        
        const saveState = async () => {
            try {
                const variableToSave: VariableState = {
                    availableVariables,
                    selectedVariables,
                };
                const stateToSave = {
                    ...variableToSave,
                    prevDataRef: data, // Save current data as previous reference
                };
                await saveFormData("UnitRootTest", stateToSave, "variables");
            } catch (error) {
                console.error("Failed to save variable state:", error);
            }
        };

        saveState();
    }, [availableVariables, selectedVariables, data, isLoaded]);

    const moveToSelectedVariables = (variable: Variable, targetIndex?: number) => {
        setAvailableVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setSelectedVariables(prev => {
            if (prev.some(v => v.columnIndex === variable.columnIndex)) {
                return prev;
            }
            const newList = [...prev];
            if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= newList.length) {
                newList.splice(targetIndex, 0, variable);
            } else {
                newList.push(variable);
            }
            return newList;
        });
        setHighlightedVariable(null);
    };

    const moveToAvailableVariables = (variable: Variable, targetIndex?: number) => {
        setSelectedVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setAvailableVariables(prev => {
            if (prev.some(v => v.columnIndex === variable.columnIndex)) {
                return prev;
            }
            const newList = [...prev];
            if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= newList.length) {
                newList.splice(targetIndex, 0, variable);
            } else {
                newList.push(variable);
            }
            return newList;
        });
        setHighlightedVariable(null);
    };

    const reorderVariables = (source: 'available' | 'selected', variablesToReorder: Variable[]) => {
        if (source === 'available') {
            setAvailableVariables([...variablesToReorder]);
        } else {
            setSelectedVariables([...variablesToReorder]);
        }
    };

    const handleReset = () => {
        clearFormData("UnitRootTest")
        .then(() => {
            resetOptions();
            reorderVariables('available', variables.filter(v => v.name !== ""));
            setSelectedVariables([]);
        })
        .catch((e) => console.error("Failed to clear time data:", e));
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-grow overflow-hidden">
                <div className="border-b border-[#E6E6E6] flex-shrink-0">
                    <TabsList className="bg-[#F7F7F7] rounded-none h-9 p-0">
                        <TabsTrigger
                            value="variables"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'variables' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                        >
                            Variables
                        </TabsTrigger>
                        <TabsTrigger
                            value="option"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'option' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                        >
                            Unit Root Test Option
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="variables" className="p-6 overflow-y-auto flex-grow">
                    <VariablesTab
                        availableVariables={availableVariables}
                        selectedVariables={selectedVariables}
                        highlightedVariable={highlightedVariable}
                        setHighlightedVariable={setHighlightedVariable}
                        moveToSelectedVariables={moveToSelectedVariables}
                        moveToAvailableVariables={moveToAvailableVariables}
                        reorderVariables={reorderVariables}
                    />
                </TabsContent>

                <TabsContent value="option" className="p-6 overflow-y-auto flex-grow">
                    <OptionTab
                        methods={methods}
                        differences={differences}
                        equations={equations}
                        selectedMethod={selectedMethod}
                        selectedEquation={selectedEquation}
                        selectedDifference={selectedDifference}
                        lengthLag={lengthLag}
                        handleMethodChange={handleMethodChange}
                        handleEquationChange={handleEquationChange}
                        handleDifferenceChange={handleDifferenceChange}
                        handleLengthLag={handleLengthLag}
                    />
                </TabsContent>
            </Tabs>

            <div className="px-6 py-4 border-t border-[#E6E6E6] bg-[#F7F7F7] flex-shrink-0">
                <div className="flex justify-end space-x-3">
                    <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                        onClick={handleReset}
                        disabled={isCalculating}
                    >
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                        onClick={onClose}
                        disabled={isCalculating}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="text-white hover:bg-[#444444] h-8 px-4"
                        onClick={handleAnalyzes}
                        disabled={isCalculating}
                    >
                        {isCalculating ? "Processing..." : "OK"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default UnitRootTest;