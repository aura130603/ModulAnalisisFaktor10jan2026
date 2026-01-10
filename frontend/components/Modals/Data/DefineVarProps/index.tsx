"use client";

import type { FC } from "react";
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import VariablesToScan from "./VariablesToScan";
import PropertiesEditor from "./PropertiesEditor";
import { Variable } from "@/types/Variable";
import type { DefineVariablePropsProps } from "./types";
import { useDefineVarProps } from "./hooks/useDefineVarProps";

// Main content component that's agnostic of container type
const DefineVariablePropsContent: FC<DefineVariablePropsProps> = ({ 
    onClose, 
    variables: initialVariables,
    caseLimit: initialCaseLimit,
    valueLimit: initialValueLimit,
    containerType = "dialog"
}) => {
    const {
        currentStep,
        selectedVariables,
        limits,
        handleContinueToEditor
    } = useDefineVarProps(initialVariables, initialCaseLimit, initialValueLimit);

    // Render the appropriate component based on the current step
    return (
        <>
            {currentStep === "scan" ? (
                <VariablesToScan
                    onClose={onClose}
                    onContinue={handleContinueToEditor}
                    containerType={containerType}
                />
            ) : (
                <PropertiesEditor
                    onClose={onClose}
                    variables={selectedVariables}
                    caseLimit={limits.caseLimit}
                    valueLimit={limits.valueLimit}
                    onSave={() => onClose()}
                    containerType={containerType}
                />
            )}
        </>
    );
};

// Main component that handles different container types
const DefineVariableProps: FC<DefineVariablePropsProps> = ({ 
    onClose, 
    variables, 
    caseLimit, 
    valueLimit,
    containerType = "dialog" 
}) => {
    // If sidebar mode, use a div container without header (header is provided by SidebarContainer)
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <DefineVariablePropsContent 
                        onClose={onClose} 
                        variables={variables} 
                        caseLimit={caseLimit} 
                        valueLimit={valueLimit}
                        containerType={containerType}
                    />
                </div>
            </div>
        );
    }

    // For dialog mode, the individual components will handle their own dialogs
    return (
        <DefineVariablePropsContent 
            onClose={onClose} 
            variables={variables} 
            caseLimit={caseLimit} 
            valueLimit={valueLimit}
            containerType={containerType}
        />
    );
};

export default DefineVariableProps;