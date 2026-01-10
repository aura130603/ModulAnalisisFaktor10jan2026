"use client";

import React from "react";
import type { ImportExcelProps } from "./types";
import { useImportExcelLogic } from "./hooks/useImportExcelLogic";
import { ImportExcelSelectionStep } from "./components/ImportExcelSelectionStep";
import { ImportExcelConfigurationStep } from "./components/ImportExcelConfigurationStep";

export const ImportExcelModal: React.FC<ImportExcelProps> = ({
    onClose,
    containerType: _containerType,
}) => {
    const {
        file,
        parsedSheets,
        fileName,
        isLoading,
        error,
        stage,
        isMobile,
        isPortrait,
        handleFileSelect,
        handleContinueToConfigure,
        handleBackToSelect,
        handleModalClose,
    } = useImportExcelLogic({ onClose });

    const renderContent = () => {
        if (stage === "select") {
            return (
                <ImportExcelSelectionStep
                    onClose={handleModalClose}
                    onFileSelect={handleFileSelect}
                    onContinue={handleContinueToConfigure}
                    isLoading={isLoading}
                    error={error}
                    selectedFile={file}
                    isMobile={isMobile}
                    isPortrait={isPortrait}
                />
            );
        }
        if (stage === "configure" && parsedSheets) {
            return (
                <ImportExcelConfigurationStep
                    onClose={handleModalClose}
                    onBack={handleBackToSelect}
                    fileName={fileName}
                    parsedSheets={parsedSheets}
                />
            );
        }
        return <div className="p-6 flex-grow flex items-center justify-center" data-testid="import-excel-loading">Loading configuration...</div>;
    };

    return (
        <div className="flex-grow overflow-y-auto flex flex-col h-full" data-testid="import-excel-modal">
            {renderContent()}
        </div>
    );
};

// Export the component with both names for backward compatibility
export default ImportExcelModal;