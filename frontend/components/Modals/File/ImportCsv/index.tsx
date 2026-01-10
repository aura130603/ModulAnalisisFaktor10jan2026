"use client";

import type { FC} from "react";
import React, { useState, useEffect } from "react";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ImportCsvSelection } from "./components/ImportCsvSelection"; 
import { ImportCsvConfiguration } from "./components/ImportCsvConfiguration";
import type { ContainerType } from "@/types/ui";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useImportCsvFileReader } from "./hooks/useImportCsvFileReader";

interface ImportCsvProps { 
    onClose: () => void;
    containerType: ContainerType; // Made non-optional as container should always decide
}

export const ImportCsv: FC<ImportCsvProps> = ({ 
    onClose,
    containerType, // No default here, should be explicitly passed
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [stage, setStage] = useState<"select" | "configure">("select");
    const [pendingConfigure, setPendingConfigure] = useState<boolean>(false);

    const {
        fileName,
        fileContent,
        error: fileReaderError,
        isLoading: isFileReaderLoading,
        readFile,
        resetFileState
    } = useImportCsvFileReader();

    // Effect to move to configure stage when file content is ready
    useEffect(() => {
        if (pendingConfigure && fileContent && !isFileReaderLoading) {
            setStage("configure");
            setPendingConfigure(false);
        }
    }, [fileContent, isFileReaderLoading, pendingConfigure]);

    const handleFileSelect = (selectedFile: File | null) => {
        setFile(selectedFile);
    };

    const handleContinueToConfigure = async () => {
        if (!file) return;
        
        setPendingConfigure(true);
        readFile(file);
    };

    const handleBackToSelect = () => {
        setStage("select");
        setFile(null);
        resetFileState();
    };

    const renderContent = () => {
        if (stage === "select") {
            return (
                <ImportCsvSelection
                    onClose={onClose}
                    onFileSelect={handleFileSelect}
                    onContinue={handleContinueToConfigure}
                    isLoading={isFileReaderLoading}
                    error={fileReaderError}
                    selectedFile={file}
                />
            );
        } else if (stage === "configure" && fileContent) {
            return (
                <ImportCsvConfiguration
                    onClose={onClose}
                    onBack={handleBackToSelect}
                    fileName={fileName}
                    fileContent={fileContent}
                />
            );
        }
        return null; 
    };

    // This structure is for the presentation component. 
    // The Dialog/Sidebar wrappers will be in the Container or handled by ModalRenderer.
    // The custom DialogHeader has been removed. ModalRenderer will provide the main header.
    // Title will be set by ModalRenderer via getModalTitle. 
    // Stage-specific titles/back buttons should be part of the stage components (ImportCsvConfiguration).
    return (
        // The outer <DialogHeader> specific to containerType === "dialog" is removed.
        // The padding for the content area is removed to match other file modals.
        <div className="flex-grow flex flex-col overflow-hidden h-full" data-testid="import-csv-modal">
            {/* 
                The h-full class is added to ensure this div tries to take available vertical space, 
                especially important if child components like ImportCsvSelection or ImportCsvConfiguration 
                are also using flex-grow or height utilities. 
            */}
            {renderContent()}
        </div>
    );
};

export default ImportCsv;