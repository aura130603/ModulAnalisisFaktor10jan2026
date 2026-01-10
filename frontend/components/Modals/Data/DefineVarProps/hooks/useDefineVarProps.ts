import { useState, useCallback } from 'react';
import type { Variable } from '@/types/Variable';

export const useDefineVarProps = (initialVariables?: Variable[], initialCaseLimit?: string, initialValueLimit?: string) => {
    const [currentStep, setCurrentStep] = useState<"scan" | "editor">(
        initialVariables ? "editor" : "scan"
    );

    // Ensure all initial variables have tempId
    const [selectedVariables, setSelectedVariables] = useState<Variable[]>(
        initialVariables?.map(v => ({
            ...v,
            tempId: v.tempId || `temp_${v.columnIndex}` // Ensure tempId exists
        })) || []
    );

    const [limits, setLimits] = useState({
        caseLimit: initialCaseLimit || "50",
        valueLimit: initialValueLimit || "200"
    });

    const handleContinueToEditor = useCallback((vars: Variable[], caseLim: string | null, valLim: string | null) => {
        // Ensure all variables have tempId before setting them
        const varsWithTempId = vars.map(v => ({
            ...v,
            tempId: v.tempId || `temp_${v.columnIndex}` // Ensure tempId exists
        }));

        setSelectedVariables(varsWithTempId);
        if (caseLim) setLimits(prev => ({ ...prev, caseLimit: caseLim }));
        if (valLim) setLimits(prev => ({ ...prev, valueLimit: valLim }));
        setCurrentStep("editor");
    }, []);

    return {
        currentStep,
        setCurrentStep, // May not be needed if only handleContinueToEditor changes it
        selectedVariables,
        // setSelectedVariables, // Only set through handleContinueToEditor
        limits,
        // setLimits, // Only set through handleContinueToEditor
        handleContinueToEditor
    };
}; 