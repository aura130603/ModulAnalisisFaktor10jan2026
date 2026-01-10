"use client";

import React from "react";
import type { ImportClipboardProps } from "./types";
import { useImportClipboardLogic } from "./hooks/useImportClipboardLogic";
import { ImportClipboardPasteStep } from "./components/ImportClipboardPasteStep";
import { ImportClipboardConfigurationStep } from "./components/ImportClipboardConfigurationStep";

export const ImportClipboardModal: React.FC<ImportClipboardProps> = ({
    onClose,
    containerType,
}) => {
    const {
        pastedText,
        parsedData,
        isLoading,
        error,
        stage,
        isMobile,
        isPortrait,
        handleTextPaste,
        handleContinueToConfigure,
        handleBackToPaste,
        handleModalClose,
    } = useImportClipboardLogic({ onClose });

    const renderContent = () => {
        if (stage === "paste") {
            return (
                <ImportClipboardPasteStep
                    onClose={handleModalClose}
                    onTextPaste={handleTextPaste}
                    onContinue={handleContinueToConfigure}
                    isLoading={isLoading}
                    error={error}
                    pastedText={pastedText}
                    isMobile={isMobile}
                    isPortrait={isPortrait}
                />
            );
        }
        if (stage === "configure" && pastedText) {
            return (
                <ImportClipboardConfigurationStep
                    onClose={handleModalClose}
                    onBack={handleBackToPaste}
                    pastedText={pastedText}
                    parsedData={parsedData}
                />
            );
        }
        // Fallback or loading state if stage is configure but pastedText is null (should ideally not happen)
        return <div className="p-6 flex-grow flex items-center justify-center" data-testid="import-clipboard-loading">Loading configuration...</div>;
    };

    return (
        <div className="flex-grow overflow-y-auto flex flex-col h-full" data-testid="import-clipboard-modal">
            {renderContent()}
        </div>
    );
};

// Export the component with both names for backward compatibility if needed by other parts of the app
// However, the primary export should now be just ImportClipboardModal if we are moving towards index.tsx pattern cleanly.
// For now, keeping the default export as per original file structure might be safer if `ImportClipboard` (default) was used elsewhere.
export default ImportClipboardModal;