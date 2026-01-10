"use client";

import React from "react";
import type { BaseModalProps } from "@/types/modalTypes";
import { useRestructure } from "./hooks/useRestructure";
import { RestructureUI } from "./RestructureUI";

// Content component separated from container logic
const RestructureDataWizardContent: React.FC<BaseModalProps> = ({ 
    onClose,
    containerType = "dialog" 
}) => {
    const restructureHook = useRestructure();

    return <RestructureUI hook={restructureHook} onClose={onClose} />;
};

// Main component that handles different container types
const RestructureDataWizard: React.FC<BaseModalProps> = ({ 
    onClose,
    containerType = "dialog" 
}) => {
    // Since ModalRenderer handles container logic, just return the content
    return <RestructureDataWizardContent onClose={onClose} containerType={containerType} />;
};

export default RestructureDataWizard;
