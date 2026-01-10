"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import RestructureDataWizard from "./index";
import type { BaseModalProps } from "@/types/modalTypes";

/**
 * Test component for the Restructure Data Wizard
 * This component helps verify the functionality of the improved restructure modal
 */
const RestructureTest: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [containerType, setContainerType] = useState<"dialog" | "sidebar">("dialog");

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const modalProps: BaseModalProps = {
        onClose: handleCloseModal,
        containerType
    };

    return (
        <div className="p-6 space-y-4">
            <h1 className="text-2xl font-bold">Restructure Data Wizard Test</h1>
            
            <div className="space-y-4">
                <div className="flex gap-4 items-center">
                    <label className="text-sm font-medium">Container Type:</label>
                    <select 
                        value={containerType} 
                        onChange={(e) => setContainerType(e.target.value as "dialog" | "sidebar")}
                        className="px-3 py-1 border rounded"
                    >
                        <option value="dialog">Dialog</option>
                        <option value="sidebar">Sidebar</option>
                    </select>
                </div>

                <Button onClick={handleOpenModal} disabled={isModalOpen}>
                    Open Restructure Data Wizard
                </Button>

                {isModalOpen && <RestructureDataWizard {...modalProps} />}
            </div>

            <div className="mt-8 p-4 bg-muted rounded-lg">
                <h2 className="text-lg font-semibold mb-2">Test Features:</h2>
                <ul className="space-y-1 text-sm">
                    <li>• Tab-based navigation with step validation</li>
                    <li>• Method selection with detailed descriptions</li>
                    <li>• Variable selection using VariableListManager</li>
                    <li>• Comprehensive validation and error display</li>
                    <li>• Options configuration with dynamic controls</li>
                    <li>• Both dialog and sidebar container support</li>
                    <li>• SPSS-style interface with wizard progression</li>
                </ul>
            </div>
        </div>
    );
};

export default RestructureTest;
