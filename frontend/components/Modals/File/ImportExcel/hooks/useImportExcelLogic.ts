import { useState, useCallback } from "react";
import { useMobile } from "@/hooks/useMobile";
import type { ImportExcelStage, UseImportExcelLogicProps, UseImportExcelLogicOutput, SheetData } from "../types";
import { useExcelWorker } from "./useExcelWorker";

export const useImportExcelLogic = ({
    onClose,
}: UseImportExcelLogicProps): UseImportExcelLogicOutput => {
    const [file, setFile] = useState<File | null>(null);
    const [parsedSheets, setParsedSheets] = useState<SheetData[] | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stage, setStage] = useState<ImportExcelStage>("select");

    const { isMobile, isPortrait } = useMobile();
    const { parse } = useExcelWorker();

    const handleFileSelect = useCallback((selectedFile: File | null) => {
        if (selectedFile) {
            setFile(selectedFile);
            setFileName(selectedFile.name);
            setError(null);
        } else {
            setFile(null);
            setFileName("");
        }
    }, []);

    const handleContinueToConfigure = useCallback(async () => {
        if (!file) {
            setError("Please select an Excel file (.xls, .xlsx).");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const sheets = await parse(file);
            setParsedSheets(sheets);
            setStage("configure");
        } catch (err: unknown) {
            console.error("File processing error:", err);
            const message = err instanceof Error ? err.message : String(err);
            setError(message ?? "Failed to read or process file.");
        } finally {
            setIsLoading(false);
        }
    }, [file, parse]);

    const handleBackToSelect = useCallback(() => {
        setStage("select");
        setParsedSheets(null);
        setError(null);
    }, []);

    const handleModalClose = useCallback(() => {
        onClose();
        setFile(null);
        setParsedSheets(null);
        setFileName("");
        setError(null);
        setStage("select");
    }, [onClose]);

    return {
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
        // Exposing setters might not be needed if all logic is handled within the hook
        setFile, // Consider if these are truly needed by the UI directly
        setFileName,
        setIsLoading,
        setError,
        setStage,
        setParsedSheets,
    };
}; 