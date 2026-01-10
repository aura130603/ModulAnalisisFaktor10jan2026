import { useState, useCallback } from "react";
import { useMobile } from "@/hooks/useMobile";
import { useVariableStore } from "@/stores/useVariableStore";
import { useMetaStore } from "@/stores/useMetaStore";
import { processSavFile } from "../services/services";
import type { UseOpenSavFileLogicProps, UseOpenSavFileLogicOutput } from "../types";
import { processSavApiResponse } from "@/utils/savFileUtils";

export const useOpenSavFileLogic = ({
    onClose,
}: UseOpenSavFileLogicProps): UseOpenSavFileLogicOutput => {
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { isMobile, isPortrait } = useMobile();
    const { overwriteAll } = useVariableStore();
    const { setMeta: setProjectMeta } = useMetaStore();

    const handleFileChange = useCallback((selectedFile: File | null) => {
        setFile(selectedFile);
        if (selectedFile && !selectedFile.name.endsWith('.sav')) {
            setError("Invalid file type. Only .sav files are supported.");
            setFile(null); 
        } else if (selectedFile) {
            setError(null); 
        } else {
            setError(null);
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const handleSubmit = async () => {
        if (!file) {
            setError("Please select a .sav file.");
            return;
        }
        if (!file.name.endsWith('.sav')) {
            setError("Invalid file type. Only .sav files are supported.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);
            
            const result = await processSavFile(formData);
            const { variables, dataMatrix, metaHeader } = processSavApiResponse(result);

            await overwriteAll(variables, dataMatrix);

            await setProjectMeta({
                name: file.name,
                location: "local",
                created: metaHeader.created ? new Date(metaHeader.created) : new Date(),
            });
            
            onClose();

        } catch (err: unknown) {
            const message = err instanceof Error
                ? (err.message ?? "An unexpected error occurred while opening the file.")
                : "An unexpected error occurred while opening the file.";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleModalClose = useCallback(() => {
        onClose();
    }, [onClose]);

    return {
        file,
        isLoading,
        error,
        isMobile,
        isPortrait,
        handleFileChange,
        clearError,
        handleSubmit,
        handleModalClose
    };
}; 