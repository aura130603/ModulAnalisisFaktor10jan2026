"use client";

import React, { FC } from "react";
import type { SortCasesModalProps } from "./types";
import { useSortCases } from "./hooks/useSortCases";
import { SortCasesUI } from "./SortCasesUI";

const SortCasesModal: React.FC<SortCasesModalProps> = ({ 
    onClose,
    containerType = "dialog" 
}) => {
    const hook = useSortCases({ onClose });

    return (
        <SortCasesUI
            {...hook}
            onClose={onClose}
            containerType={containerType}
        />
    );
};

export default SortCasesModal;