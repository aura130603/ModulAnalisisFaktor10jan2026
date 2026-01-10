// Props for the main component
export interface OpenSavFileProps {
    onClose: () => void;
    containerType?: string;
}

// Props for the content step (internal to OpenSavFile.tsx, but good to have here for clarity)
export interface OpenSavFileStepProps {
    onClose: () => void;
    onFileSelect: (file: File | null) => void;
    onSubmit: () => Promise<void>;
    isLoading: boolean;
    error: string | null;
    selectedFile: File | null;
    isMobile: boolean;
    isPortrait: boolean;
    clearError: () => void;
}

export interface UseOpenSavFileLogicProps {
    onClose: () => void;
}

export interface UseOpenSavFileLogicOutput {
    file: File | null;
    isLoading: boolean;
    error: string | null;
    isMobile: boolean;
    isPortrait: boolean;
    handleFileChange: (selectedFile: File | null) => void;
    clearError: () => void;
    handleSubmit: () => Promise<void>;
    handleModalClose: () => void;
}

// Potentially other types if they are specific to this modal's operation
// For example, if the structure of data from `uploadSavFile` was complex and specific
// it could be defined here. 