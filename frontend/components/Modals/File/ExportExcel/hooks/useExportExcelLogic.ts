import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { useMetaStore } from "@/stores/useMetaStore";
import * as XLSX from 'xlsx';
import { generateExcelWorkbook } from "../utils/excelExporter";
import type { ExcelUtilOptions, ExportExcelLogicState, UseExportExcelLogicProps } from "../types";
import { DEFAULT_FILENAME } from "../utils/constants";

export const useExportExcelLogic = ({ onClose }: UseExportExcelLogicProps) => {

    const initialMetaName = useMetaStore.getState().meta?.name;
    const [isExporting, startExportTransition] = useTransition();

    const [exportOptions, setExportOptions] = useState<ExportExcelLogicState>(() => ({
        filename: initialMetaName || DEFAULT_FILENAME,
        format: "xlsx",
        includeHeaders: true,
        includeVariableProperties: true,
        includeMetadataSheet: true,
        includeDataLabels: false,
        applyHeaderStyling: true
    }));

    const handleChange = (field: keyof ExportExcelLogicState, value: string | boolean) => {
        setExportOptions(prev => ({ ...prev, [field]: value }));
    };

    const handleFilenameChange = (value: string) => {
        const sanitized = value.replace(/[/\\:*?"<>|]/g, '');
        handleChange("filename", sanitized);
    };

    const handleExport = async (): Promise<void> => {
        startExportTransition(async () => {
            try {
                await useVariableStore.getState().loadVariables();
                await useDataStore.getState().loadData();
                await useMetaStore.getState().loadMeta();

                const freshData = useDataStore.getState().data;
                const freshVariables = useVariableStore.getState().variables;
                const freshMeta = useMetaStore.getState().meta;

                if (!freshData.length || !freshVariables.length) {
                    toast.error("No data to export: There is no data available to export to Excel.");
                    return;
                }

                const utilOptions: ExcelUtilOptions = {
                    includeHeaders: exportOptions.includeHeaders,
                    includeVariablePropertiesSheet: exportOptions.includeVariableProperties,
                    includeMetadataSheet: exportOptions.includeMetadataSheet,
                    includeDataLabels: exportOptions.includeDataLabels,
                    applyHeaderStyling: exportOptions.applyHeaderStyling
                };

                const workbook = generateExcelWorkbook(freshData, freshVariables, freshMeta, utilOptions);
                const filename = `${exportOptions.filename || DEFAULT_FILENAME}.${exportOptions.format}`;
                XLSX.writeFile(workbook, filename);

                toast.success(`Export Successful: Data successfully exported to ${filename}`);

                onClose();
            } catch (error) {
                console.error("Export error:", error);
                toast.error(error instanceof Error ? error.message : "Export Failed: An unexpected error occurred during export.");
            }
        });
    };

    return {
        exportOptions,
        isExporting,
        handleChange,
        handleFilenameChange,
        handleExport
    };
};