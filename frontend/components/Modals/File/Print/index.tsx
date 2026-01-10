"use client";

import React from "react";
// Dialog komponen tidak lagi diimpor di sini
// import { Printer } from "lucide-react"; // Tidak digunakan secara langsung di sini lagi
import type { PrintProps, SelectedOptions } from "./types"; // sebelumnya "./types/types"
import { usePrintLogic } from "./hooks/usePrintLogic"; // Mengimpor hook
import { PrintOptions } from "./components/PrintOptions"; // Path should be correct now

// Renamed to PrintModal for consistency with other modals
export const PrintModal: React.FC<PrintProps> = ({
    onClose,
    containerType: _containerType,
}) => {
    // Using hook to get state and handlers
    const {
        fileName,
        setFileName,
        selectedOptions,
        setSelectedOptions,
        paperSize,
        setPaperSize,
        isGenerating,
        isMobile,
        isPortrait,
        handlePrint,
        handleModalClose,
        resetOptions,
    } = usePrintLogic({ onClose });

    return (
        <div data-testid="print-modal-container" className="flex-grow overflow-y-auto flex flex-col h-full">
            <PrintOptions
                fileName={fileName}
                onFileNameChange={setFileName}
                selectedOptions={selectedOptions}
                onOptionChange={(option: keyof SelectedOptions) => setSelectedOptions(prev => ({...prev, [option]: !prev[option]}))}
                paperSize={paperSize}
                onPaperSizeChange={setPaperSize}
                onPrint={handlePrint}
                onCancel={handleModalClose} 
                isGenerating={isGenerating}
                isMobile={isMobile}
                isPortrait={isPortrait}
                onReset={resetOptions}
            />
        </div>
    );
};

// Export the component with both names for backward compatibility
export default PrintModal;