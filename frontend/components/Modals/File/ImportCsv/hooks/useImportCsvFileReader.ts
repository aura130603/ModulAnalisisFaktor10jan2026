import { useState } from "react";

interface UseFileReaderReturn {
    fileContent: string | null;
    fileName: string;
    error: string | null;
    isLoading: boolean;
    readFile: (file: File) => void;
    resetFileState: () => void;
}

export const useImportCsvFileReader = (): UseFileReaderReturn => {
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const readFile = (file: File) => {
        if (!file) {
            setError("Please select a CSV file.");
            return;
        }
        
        setError(null);
        setIsLoading(true);
        setFileName(file.name);
        
        const reader = new FileReader();

        reader.onload = () => {
            try {
                const result = reader.result as string;
                if (result === null || result.trim() === "") {
                    setError("The selected file is empty or could not be read.");
                    setIsLoading(false);
                    setFileName("");
                    return;
                }
                setFileContent(result);
            } catch (err) {
                console.error("File reading error:", err);
                setError("Failed to read file content. Please ensure it is a valid text file.");
                setFileName("");
            } finally {
                setIsLoading(false);
            }
        };

        reader.onerror = (err) => {
            console.error("FileReader error:", err);
            setError("An error occurred while trying to read the file. Please try again.");
            setIsLoading(false);
            setFileName("");
        };

        reader.readAsText(file);
    };

    const resetFileState = () => {
        setFileContent(null);
        setFileName("");
        setError(null);
        setIsLoading(false);
    };

    return {
        fileContent,
        fileName,
        error,
        isLoading,
        readFile,
        resetFileState
    };
}; 