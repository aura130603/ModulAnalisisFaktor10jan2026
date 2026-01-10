"use client";

import React from "react";
import type { SortVariablesModalProps } from "./types";
import { useSortVariables } from "./hooks/useSortVariables";
import { SortVarsUI } from "./SortVarsUI";

const SortVariablesModal: React.FC<SortVariablesModalProps> = ({ 
    onClose,
    containerType = "dialog" 
}) => {
    const hook = useSortVariables({ onClose });

    return (
        <SortVarsUI
            {...hook}
            onClose={onClose}
            containerType={containerType}
        />
    );
};

export default SortVariablesModal;