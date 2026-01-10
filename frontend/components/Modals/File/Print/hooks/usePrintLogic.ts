import { useState, useCallback } from "react";
import { useMobile } from "@/hooks/useMobile";
import { useDataStore } from "@/stores/useDataStore";
import type { DataRow } from "@/types/Data";
import { useVariableStore } from "@/stores/useVariableStore";
import { useResultStore } from "@/stores/useResultStore";
import { jsPDF } from "jspdf";
// autoTable is not directly used here anymore, but jsPDF instance is extended by it.
// import { autoTable } from "jspdf-autotable"; 
import type { Variable } from "@/types/Variable";
import type {
    UsePrintLogicProps,
    UsePrintLogicOutput,
    PaperSize,
    SelectedOptions
} from "../types"; // sebelumnya "../types/types"
import { generateAutoTableDataFromString } from "../print.utils"; // Only this is needed from main utils
import {
    addDataGridView,
    addVariableView,
    addResultsView
} from "../services/pdfPrintService"; // Updated import path to services

export const usePrintLogic = ({
    onClose,
}: UsePrintLogicProps): UsePrintLogicOutput => {
    const [fileName, setFileName] = useState<string>("");
    const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({
        data: true,
        variable: true,
        result: true,
    });
    const [paperSize, setPaperSize] = useState<PaperSize>("a4");
    const [isGenerating, setIsGenerating] = useState(false);

    const { isMobile, isPortrait } = useMobile();

    const resetOptions = useCallback(() => {
        setFileName("");
        setSelectedOptions({
            data: true,
            variable: true,
            result: true,
        });
        setPaperSize("a4");
    }, []);

    const handlePrint = useCallback(async (): Promise<void> => {
        if (isGenerating) return;
        setIsGenerating(true);

        try {
            // Fetch latest data from stores before printing
            await useDataStore.getState().loadData();
            await useVariableStore.getState().loadVariables();
            await useResultStore.getState().loadResults();

            const availableData = useDataStore.getState().data;
            const availableVariables = useVariableStore.getState().variables;
            const logs = useResultStore.getState().logs;
            
            const doc = new jsPDF({ format: paperSize }); 

            let currentY = 10;

            // Determine active columns and filtered data once
            const namedVariables = availableVariables.filter(
                (v: Variable) => String(v.name ?? "").trim() !== ""
            );
            const activeColumns = namedVariables
                .filter((v: Variable) =>
                    availableData.some((row: DataRow) =>
                        String(row[v.columnIndex] ?? "").trim() !== ""
                    )
                )
                .map((v: Variable) => v.columnIndex)
                .sort((a: number, b: number) => a - b);

            const filteredData = availableData.filter((row: DataRow) =>
                activeColumns.some((col) =>
                    String(row[col] ?? "").trim() !== ""
                )
            );

            if (selectedOptions.data) {
                currentY = addDataGridView(doc, currentY, filteredData, availableVariables, activeColumns);
            }

            if (selectedOptions.variable) {
                currentY = addVariableView(doc, currentY, availableVariables, activeColumns);
            }

            if (selectedOptions.result) {
                void addResultsView(doc, currentY, logs, generateAutoTableDataFromString);
            }

            // Ensure at least one section was added before saving, or save a blank PDF if that's desired.
            // For now, it saves even if empty.
            const trimmed = fileName.trim();
            doc.save(`${trimmed === "" ? "statify_print_output" : trimmed}.pdf`);
            onClose(); 
        } catch (error) {
            console.error("Error generating PDF:", error);
            // Optionally, display a user-facing error message here
        } finally {
            setIsGenerating(false);
        }
    }, [
        fileName, 
        selectedOptions, 
        paperSize, 
        isGenerating, 
        onClose
        // generateAutoTableDataFromString is stable, no need to list as dependency if imported correctly
    ]);
    
    const handleModalClose = useCallback(() => {
        onClose();
    }, [onClose]);

    return {
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
        resetOptions
    };
};